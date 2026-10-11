"""Event lifecycle: create, edit, delete, export and import.

An event is one SQLite file in the data folder. Functions here work with
event *file names* (never full paths) except for export/import, which take
an external path chosen by the user through a native file dialog.
"""

import sqlite3
import uuid
from datetime import date as _date
from pathlib import Path

from . import db, messages
from .migrations import MIGRATIONS
from .paths import data_dir

MAX_NAME_LENGTH = 120


def _clean_fields(name: str, date: str, location: str) -> tuple[str, str, str]:
    name = (name or "").strip()
    date = (date or "").strip()
    location = (location or "").strip()
    if not name:
        raise ValueError(messages.EVENT_NAME_REQUIRED)
    if len(name) > MAX_NAME_LENGTH:
        raise ValueError(messages.EVENT_NAME_TOO_LONG)
    if date:
        try:
            _date.fromisoformat(date)
        except ValueError:
            raise ValueError(messages.EVENT_DATE_INVALID) from None
    return name, date, location


def _existing_path(event_file: str) -> Path:
    path = db.event_path(event_file)
    if not path.is_file():
        raise ValueError(messages.EVENT_NOT_FOUND)
    return path


def list_events() -> list[dict]:
    return db.list_event_files()


def get_event(event_file: str) -> dict:
    return db.read_event_meta(_existing_path(event_file))


def create_event(name: str, date: str = "", location: str = "") -> dict:
    name, date, location = _clean_fields(name, date, location)
    event_file = db.create_event_file(name, date, location)
    return db.read_event_meta(db.event_path(event_file))


def update_event(event_file: str, name: str, date: str = "", location: str = "") -> dict:
    name, date, location = _clean_fields(name, date, location)
    path = _existing_path(event_file)
    with db.connect(path) as conn:
        conn.executemany(
            "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
            [("name", name), ("date", date), ("location", location)],
        )
    return db.read_event_meta(path)


def delete_event(event_file: str) -> None:
    path = _existing_path(event_file)
    # WAL mode may leave sidecar files next to the database.
    for candidate in (path, Path(f"{path}-wal"), Path(f"{path}-shm")):
        candidate.unlink(missing_ok=True)


def suggested_export_name(event_file: str) -> str:
    meta = get_event(event_file)
    stem = db.slugify(meta["name"])
    return f"{stem}-{meta['date']}.db" if meta["date"] else f"{stem}.db"


def export_event(event_file: str, destination: str) -> str:
    """Write a consistent, single-file copy of an event to `destination`."""
    source = _existing_path(event_file)
    dest = Path(destination)
    if dest.suffix.lower() != ".db":
        dest = dest.with_name(dest.name + ".db")
    if dest.resolve().parent == data_dir().resolve():
        raise ValueError(messages.EXPORT_SAME_FILE)

    # The SQLite backup API gives a coherent copy even while the file is in WAL mode.
    with db.connect(source) as src:
        out = sqlite3.connect(dest)
        try:
            src.backup(out)
            out.execute("PRAGMA journal_mode = DELETE")  # keep the export a single file
        finally:
            out.close()
    return str(dest)


def import_event(source: str) -> dict:
    """Copy an exported event file into the data folder under a fresh file name.

    The file is validated and migrated in a temporary location first, so a
    bad file never ends up in the data folder.
    """
    src_path = Path(source)
    if not src_path.is_file():
        raise ValueError(messages.EVENT_FILE_INVALID)

    tmp = data_dir() / f".import-{uuid.uuid4().hex}.tmp"  # not *.db: never listed as an event
    try:
        try:
            reader = sqlite3.connect(f"{src_path.resolve().as_uri()}?mode=ro", uri=True)
        except sqlite3.DatabaseError:
            raise ValueError(messages.EVENT_FILE_INVALID) from None
        try:
            _check_importable(reader)
            writer = sqlite3.connect(tmp)
            try:
                reader.backup(writer)
            finally:
                writer.close()
        except sqlite3.DatabaseError:
            raise ValueError(messages.EVENT_FILE_INVALID) from None
        finally:
            reader.close()

        meta = db.read_event_meta(tmp)  # also migrates an older schema up to date
        final = data_dir() / f"{db.slugify(meta['name'])}-{uuid.uuid4().hex[:6]}.db"
        tmp.replace(final)
        return db.read_event_meta(final)
    finally:
        for leftover in (tmp, Path(f"{tmp}-wal"), Path(f"{tmp}-shm")):
            leftover.unlink(missing_ok=True)


def _check_importable(conn: sqlite3.Connection) -> None:
    """Raise ValueError unless `conn` looks like a CrossLy event of a supported version."""
    try:
        version = conn.execute("PRAGMA user_version").fetchone()[0]
        has_meta = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'meta'"
        ).fetchone()
        has_name = has_meta and conn.execute(
            "SELECT 1 FROM meta WHERE key = 'name'"
        ).fetchone()
    except sqlite3.DatabaseError:
        raise ValueError(messages.EVENT_FILE_INVALID) from None
    if version < 1 or not has_name:
        raise ValueError(messages.EVENT_FILE_INVALID)
    if version > len(MIGRATIONS):
        raise ValueError(messages.EVENT_FILE_TOO_NEW)
