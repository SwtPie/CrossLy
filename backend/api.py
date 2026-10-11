"""API exposed to the frontend through `window.pywebview.api`.

Every public method of `Api` is callable from JavaScript. Methods return
plain JSON-serializable data. Errors are returned as `{"error": message}`
so the frontend can show them instead of failing silently.

Domain logic lives in other backend modules; this class only validates
arguments and delegates.
"""

import functools
import traceback

from . import APP_NAME, APP_VERSION, db
from .paths import data_dir


def _safe(method):
    """Turn exceptions into a JSON error payload for the frontend."""

    @functools.wraps(method)
    def wrapper(*args, **kwargs):
        try:
            return method(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001 - boundary with the UI
            traceback.print_exc()
            return {"error": str(exc)}

    return wrapper


class Api:
    @_safe
    def app_info(self) -> dict:
        return {
            "name": APP_NAME,
            "version": APP_VERSION,
            "data_dir": str(data_dir()),
        }

    @_safe
    def list_events(self) -> list[dict]:
        return db.list_event_files()
