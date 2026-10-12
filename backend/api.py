"""API exposed to the frontend through `window.pywebview.api`.

Every public method of `Api` is callable from JavaScript. Methods return
plain JSON-serializable data. Errors are returned as `{"error": message}`
so the frontend can show them instead of failing silently. A user who
closes a file dialog gets `{"cancelled": true}`.

Domain logic lives in other backend modules; this class only validates
arguments and delegates.
"""

import functools
import traceback

from . import APP_NAME, APP_VERSION, events, importer, messages, participants
from .paths import data_dir

EVENT_FILE_TYPES = ("Événement CrossLy (*.db)",)
IMPORT_FILE_TYPES = ("Fichiers de participants (*.csv;*.xlsx)", "Tous les fichiers (*.*)")
TEMPLATE_FILE_TYPES = ("Classeur Excel (*.xlsx)",)


def _safe(method):
    """Turn exceptions into a JSON error payload for the frontend."""

    @functools.wraps(method)
    def wrapper(*args, **kwargs):
        try:
            return method(*args, **kwargs)
        except ValueError as exc:  # expected, user-facing rejection
            return {"error": str(exc)}
        except Exception as exc:  # noqa: BLE001 - boundary with the UI
            traceback.print_exc()
            return {"error": str(exc)}

    return wrapper


def _file_dialog(kind: str, **options) -> str | None:
    """Open a native file dialog and return one chosen path, or None if cancelled.

    `kind` is "open" or "save". Imported lazily so the rest of the API can be
    used (and checked) without a GUI toolkit.
    """
    import webview

    dialog_type = getattr(webview, "FileDialog", None)
    if dialog_type is not None:
        mode = dialog_type.OPEN if kind == "open" else dialog_type.SAVE
    else:  # older pywebview releases
        mode = webview.OPEN_DIALOG if kind == "open" else webview.SAVE_DIALOG

    result = webview.windows[0].create_file_dialog(mode, **options)
    if isinstance(result, (list, tuple)):
        result = result[0] if result else None
    return result or None


class Api:
    def __init__(self) -> None:
        # File being imported (headers + rows). Kept here, not sent back and forth,
        # so the frontend never handles file paths. The underscore keeps it private.
        self._import_table: dict | None = None

    @_safe
    def app_info(self) -> dict:
        return {
            "name": APP_NAME,
            "version": APP_VERSION,
            "data_dir": str(data_dir()),
        }

    # --- events ---------------------------------------------------------

    @_safe
    def list_events(self) -> list[dict]:
        return events.list_events()

    @_safe
    def get_event(self, event_file: str) -> dict:
        return events.get_event(event_file)

    @_safe
    def create_event(self, name: str, date: str = "", location: str = "") -> dict:
        return events.create_event(name, date, location)

    @_safe
    def update_event(self, event_file: str, name: str, date: str = "", location: str = "") -> dict:
        return events.update_event(event_file, name, date, location)

    @_safe
    def delete_event(self, event_file: str) -> dict:
        events.delete_event(event_file)
        return {"deleted": True}

    @_safe
    def export_event(self, event_file: str) -> dict:
        suggested = events.suggested_export_name(event_file)
        destination = _file_dialog(
            "save", save_filename=suggested, file_types=EVENT_FILE_TYPES
        )
        if not destination:
            return {"cancelled": True}
        return {"path": events.export_event(event_file, destination)}

    @_safe
    def import_event(self) -> dict:
        source = _file_dialog("open", file_types=EVENT_FILE_TYPES)
        if not source:
            return {"cancelled": True}
        return events.import_event(source)

    # --- participants ---------------------------------------------------

    @_safe
    def list_participants(self, event_file: str) -> list[dict]:
        return participants.list_participants(event_file)

    @_safe
    def add_participant(self, event_file: str, data: dict) -> dict:
        return participants.add_participant(event_file, data)

    @_safe
    def update_participant(self, event_file: str, participant_id: int, data: dict) -> dict:
        return participants.update_participant(event_file, participant_id, data)

    @_safe
    def delete_participant(self, event_file: str, participant_id: int) -> dict:
        participants.delete_participant(event_file, participant_id)
        return {"deleted": True}

    @_safe
    def assign_bibs(self, event_file: str, start: int = 1, renumber_all: bool = False) -> dict:
        return participants.assign_bibs(event_file, start, renumber_all)

    @_safe
    def clear_bibs(self, event_file: str) -> dict:
        return participants.clear_bibs(event_file)

    # --- participant import ---------------------------------------------

    def _require_import_table(self) -> dict:
        if self._import_table is None:
            raise ValueError(messages.IMPORT_NO_FILE)
        return self._import_table

    @_safe
    def import_open_file(self, event_file: str) -> dict:
        """Ask for a .csv / .xlsx file, read it, and return columns + a first preview."""
        events.get_event(event_file)  # fail early on an unknown event
        source = _file_dialog("open", file_types=IMPORT_FILE_TYPES)
        if not source:
            return {"cancelled": True}
        table = importer.read_table(source)
        self._import_table = table
        mapping = importer.detect_mapping(table["headers"])
        options = importer.default_options(table["headers"])
        return {
            "file_name": table["file_name"],
            "sheet": table["sheet"],
            "headers": table["headers"],
            "row_count": len(table["rows"]),
            "mapping": mapping,
            "options": options,
            "preview": importer.preview(event_file, table, mapping, options, {}),
        }

    @_safe
    def import_preview(self, event_file: str, mapping: dict, options: dict | None = None,
                       overrides: dict | None = None) -> dict:
        return importer.preview(event_file, self._require_import_table(), mapping, options, overrides)

    @_safe
    def import_commit(self, event_file: str, mapping: dict, options: dict | None = None,
                      overrides: dict | None = None) -> dict:
        result = importer.commit(event_file, self._require_import_table(), mapping, options, overrides)
        self._import_table = None
        return result

    @_safe
    def import_discard(self) -> dict:
        self._import_table = None
        return {"discarded": True}

    @_safe
    def import_template(self) -> dict:
        destination = _file_dialog("save", save_filename=importer.TEMPLATE_NAME,
                                   file_types=TEMPLATE_FILE_TYPES)
        if not destination:
            return {"cancelled": True}
        return {"path": importer.write_template(destination)}
