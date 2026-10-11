"""SQLite access: one database file per event, stored in the data folder.

Connections are short-lived (one per operation) because pywebview calls the
API from worker threads. WAL mode keeps the file consistent after a crash or
power cut, which matters for live timing.
"""

import re
import sqlite3
import unicodedata
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .migrations import MIGRATIONS
from .paths import data_dir


# --- normalization helpers ---------------------------------------------------

def normalize_key(text: str | None) -> str:
    """Casefolded, accent-free, whitespace-collapsed key (duplicate detection)."""
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", stripped).strip().casefold()


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", normalize_key(text)).strip("-")
    return slug or "event"


# --- connection and migrations -----------------------------------------------

def _configure(conn: sqlite3.Connection) -> None:
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")


def migrate(conn: sqlite3.Connection) -> int:
    """Apply pending migrations. Returns the resulting schema version."""
    current = conn.execute("PRAGMA user_version").fetchone()[0]
    if current > len(MIGRATIONS):
        raise RuntimeError(
            f"Event file uses schema v{current}, newer than this app (v{len(MIGRATIONS)}). "
            "Update CrossLy to open it."
        )
    for version in range(current, len(MIGRATIONS)):
        # executescript commits implicitly, so each migration is applied then stamped
        conn.executescript(MIGRATIONS[version])
        conn.execute(f"PRAGMA user_version = {version + 1}")
    return len(MIGRATIONS)


@contextmanager
def connect(path: Path) -> Iterator[sqlite3.Connection]:
    """Open an event database, migrate it if needed, commit on success."""
    conn = sqlite3.connect(path, timeout=10)
    try:
        _configure(conn)
        migrate(conn)
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# --- event files -------------------------------------------------------------

def event_path(event_file: str) -> Path:
    """Resolve an event file name to a path inside the data folder.

    Only a bare file name is accepted: anything with a directory part is
    rejected so the frontend can never point the backend outside `data/`.
    """
    if Path(event_file).name != event_file or not event_file.endswith(".db"):
        raise ValueError("Invalid event file name")
    return data_dir() / event_file


def create_event_file(name: str, date: str = "", location: str = "") -> str:
    """Create a new event database and return its file name."""
    name = name.strip()
    if not name:
        raise ValueError("Event name is required")
    file_name = f"{slugify(name)}-{uuid.uuid4().hex[:6]}.db"
    with connect(event_path(file_name)) as conn:
        conn.executemany(
            "INSERT INTO meta (key, value) VALUES (?, ?)",
            [("name", name), ("date", date), ("location", location)],
        )
    return file_name


def read_event_meta(path: Path) -> dict:
    """Read name, date, location and content counts from an event file."""
    with connect(path) as conn:
        rows = conn.execute("SELECT key, value FROM meta").fetchall()
        participants = conn.execute("SELECT COUNT(*) FROM participant").fetchone()[0]
        races = conn.execute("SELECT COUNT(*) FROM race").fetchone()[0]
    meta = {row["key"]: row["value"] for row in rows}
    return {
        "file": path.name,
        "name": meta.get("name", path.stem),
        "date": meta.get("date", ""),
        "location": meta.get("location", ""),
        "participants": participants,
        "races": races,
    }


def list_event_files() -> list[dict]:
    """Scan the data folder and return metadata for every readable event."""
    events = []
    for path in sorted(data_dir().glob("*.db")):
        try:
            events.append(read_event_meta(path))
        except (sqlite3.DatabaseError, RuntimeError):
            # Not a CrossLy file, or from a newer version: skip it quietly.
            continue
    events.sort(key=lambda e: (e["date"], e["name"]), reverse=True)
    return events
