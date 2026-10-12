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

from . import APP_NAME, APP_VERSION, events, participants
from .paths import data_dir

EVENT_FILE_TYPES = ("Événement CrossLy (*.db)",)


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
