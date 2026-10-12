"""Participants of an event: validation, CRUD and bib assignment.

Every function takes the event file name and opens a short-lived connection
(see `db.connect`). User-facing rejections raise `ValueError` with a French
message from `messages.py`.
"""

import sqlite3
from datetime import date as _date
from typing import Any

from . import db, messages
from .events import existing_event_path
from .normalize import class_sort_key, collapse_spaces, normalize_class

MAX_TEXT_LENGTH = 80
SELECT_FIELDS = (
    "id, last_name, first_name, sex, class AS class_name, "
    "establishment, birth_date, age, vma, bib"
)


# --- validation (pure) ---------------------------------------------------------

def _parse_int(value: Any, low: int, high: int, message: str) -> int | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        number = float(str(value).strip().replace(",", "."))
    except ValueError:
        raise ValueError(message) from None
    if number != int(number) or not low <= number <= high:
        raise ValueError(message)
    return int(number)


def _parse_vma(value: Any) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        number = float(str(value).strip().replace(",", "."))
    except ValueError:
        raise ValueError(messages.VMA_INVALID) from None
    if not 5 <= number <= 30:
        raise ValueError(messages.VMA_INVALID)
    return round(number, 2)


def clean_participant(data: dict) -> dict:
    """Validate and normalize user input; returns database-ready values."""
    last_name = collapse_spaces(data.get("last_name"))
    first_name = collapse_spaces(data.get("first_name"))
    if not last_name:
        raise ValueError(messages.LAST_NAME_REQUIRED)
    if not first_name:
        raise ValueError(messages.FIRST_NAME_REQUIRED)

    class_name = normalize_class(data.get("class_name"))
    establishment = collapse_spaces(data.get("establishment"))
    if any(len(t) > MAX_TEXT_LENGTH for t in (last_name, first_name, class_name, establishment)):
        raise ValueError(messages.PERSON_NAME_TOO_LONG)

    sex = str(data.get("sex") or "").strip().upper()
    if sex not in ("", "M", "F"):
        raise ValueError(messages.SEX_INVALID)

    birth_date = str(data.get("birth_date") or "").strip()
    if birth_date:
        try:
            parsed = _date.fromisoformat(birth_date)
        except ValueError:
            raise ValueError(messages.BIRTH_DATE_INVALID) from None
        if parsed.year < 1900 or parsed > _date.today():
            raise ValueError(messages.BIRTH_DATE_INVALID)

    return {
        "last_name": last_name,
        "first_name": first_name,
        "last_name_key": db.normalize_key(last_name),
        "first_name_key": db.normalize_key(first_name),
        "sex": sex or None,
        "class": class_name or None,
        "establishment": establishment or None,
        "birth_date": birth_date or None,
        "age": _parse_int(data.get("age"), 3, 99, messages.AGE_INVALID),
        "vma": _parse_vma(data.get("vma")),
        "bib": _parse_int(data.get("bib"), 1, 99999, messages.BIB_INVALID),
    }


def bib_assignment_order(rows: list[dict]) -> list[dict]:
    """Order used for automatic bibs: establishment, class, then name.

    Participants without an establishment come last.
    """
    return sorted(
        rows,
        key=lambda r: (
            not r["establishment"],
            db.normalize_key(r["establishment"]),
            class_sort_key(r["class"]),
            r["last_name_key"],
            r["first_name_key"],
        ),
    )


# --- database helpers ----------------------------------------------------------

def _check_unique(conn: sqlite3.Connection, values: dict, exclude_id: int | None) -> None:
    same_person = conn.execute(
        "SELECT id FROM participant WHERE last_name_key = ? AND first_name_key = ? AND id IS NOT ?",
        (values["last_name_key"], values["first_name_key"], exclude_id),
    ).fetchone()
    if same_person:
        raise ValueError(messages.participant_duplicate(values["last_name"], values["first_name"]))
    if values["bib"] is not None:
        owner = conn.execute(
            "SELECT last_name, first_name FROM participant WHERE bib = ? AND id IS NOT ?",
            (values["bib"], exclude_id),
        ).fetchone()
        if owner:
            raise ValueError(
                messages.bib_taken(values["bib"], f"{owner['last_name']} {owner['first_name']}")
            )


def _row(conn: sqlite3.Connection, participant_id: int) -> dict:
    row = conn.execute(
        f"SELECT {SELECT_FIELDS} FROM participant WHERE id = ?", (participant_id,)
    ).fetchone()
    if row is None:
        raise ValueError(messages.PARTICIPANT_NOT_FOUND)
    return dict(row)


# --- CRUD ----------------------------------------------------------------------

def list_participants(event_file: str) -> list[dict]:
    with db.connect(existing_event_path(event_file)) as conn:
        rows = conn.execute(
            f"SELECT {SELECT_FIELDS} FROM participant ORDER BY last_name_key, first_name_key"
        ).fetchall()
    return [dict(r) for r in rows]


def add_participant(event_file: str, data: dict) -> dict:
    values = clean_participant(data)
    with db.connect(existing_event_path(event_file)) as conn:
        _check_unique(conn, values, None)
        cursor = conn.execute(
            "INSERT INTO participant (last_name, first_name, last_name_key, first_name_key, "
            "sex, class, establishment, birth_date, age, vma, bib) "
            "VALUES (:last_name, :first_name, :last_name_key, :first_name_key, "
            ":sex, :class, :establishment, :birth_date, :age, :vma, :bib)",
            values,
        )
        return _row(conn, cursor.lastrowid)


def update_participant(event_file: str, participant_id: int, data: dict) -> dict:
    values = clean_participant(data)
    with db.connect(existing_event_path(event_file)) as conn:
        _row(conn, participant_id)  # raises if missing
        _check_unique(conn, values, participant_id)
        conn.execute(
            "UPDATE participant SET last_name = :last_name, first_name = :first_name, "
            "last_name_key = :last_name_key, first_name_key = :first_name_key, sex = :sex, "
            "class = :class, establishment = :establishment, birth_date = :birth_date, "
            "age = :age, vma = :vma, bib = :bib WHERE id = :id",
            {**values, "id": participant_id},
        )
        return _row(conn, participant_id)


def delete_participant(event_file: str, participant_id: int) -> None:
    with db.connect(existing_event_path(event_file)) as conn:
        _row(conn, participant_id)  # raises if missing
        # Registrations are removed (cascade); recorded arrivals keep their time
        # and position but lose the participant link (see migrations).
        conn.execute("DELETE FROM participant WHERE id = ?", (participant_id,))


# --- bibs ----------------------------------------------------------------------

def assign_bibs(event_file: str, start: Any = 1, renumber_all: bool = False) -> dict:
    """Give a bib to every participant without one.

    Numbers are handed out in `bib_assignment_order`, starting at `start` and
    skipping numbers already in use. With `renumber_all`, existing bibs are
    cleared first so everyone is numbered again from `start`.
    """
    first = _parse_int(start if start not in (None, "") else 1, 1, 99999, messages.BIB_START_INVALID)
    with db.connect(existing_event_path(event_file)) as conn:
        if renumber_all:
            conn.execute("UPDATE participant SET bib = NULL")
        used = {r["bib"] for r in conn.execute("SELECT bib FROM participant WHERE bib IS NOT NULL")}
        pending = [
            dict(r)
            for r in conn.execute(
                "SELECT id, class, establishment, last_name_key, first_name_key "
                "FROM participant WHERE bib IS NULL"
            )
        ]
        number = first
        for row in bib_assignment_order(pending):
            while number in used:
                number += 1
            conn.execute("UPDATE participant SET bib = ? WHERE id = ?", (number, row["id"]))
            used.add(number)
            number += 1
        return {"assigned": len(pending), "with_bib": len(used)}


def clear_bibs(event_file: str) -> dict:
    with db.connect(existing_event_path(event_file)) as conn:
        cleared = conn.execute("UPDATE participant SET bib = NULL WHERE bib IS NOT NULL").rowcount
    return {"cleared": cleared}
