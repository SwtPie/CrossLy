"""Schema migrations for an event database.

Each entry is applied once, in order, and the database version is tracked
with `PRAGMA user_version`. Never edit an existing migration after release:
append a new one instead. Migrations are Python strings (not .sql files) so
they are bundled automatically when the app is packaged.
"""

MIGRATIONS: list[str] = [
    # --- 1: initial schema -------------------------------------------------
    """
    CREATE TABLE meta (
        key   TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE participant (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        last_name       TEXT NOT NULL,
        first_name      TEXT NOT NULL,
        -- normalized (casefolded, accent-free) copies used for duplicate detection
        last_name_key   TEXT NOT NULL,
        first_name_key  TEXT NOT NULL,
        sex             TEXT CHECK (sex IN ('M', 'F') OR sex IS NULL),
        class           TEXT,
        establishment   TEXT,
        birth_date      TEXT,            -- ISO 8601 (YYYY-MM-DD) when known
        age             INTEGER,         -- plain age when only an age is provided
        vma             REAL,            -- km/h, NULL when unknown
        bib             INTEGER UNIQUE,  -- NULL until assigned
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX ux_participant_identity
        ON participant (last_name_key, first_name_key);
    CREATE INDEX ix_participant_class ON participant (class);
    CREATE INDEX ix_participant_establishment ON participant (establishment);

    CREATE TABLE race (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        name             TEXT NOT NULL,
        distance_m       INTEGER NOT NULL CHECK (distance_m > 0),
        vma_min          REAL,           -- informative only
        vma_max          REAL,           -- informative only
        hidden           INTEGER NOT NULL DEFAULT 0,
        -- stopwatch state, persisted so a crash loses nothing
        timer_status     TEXT NOT NULL DEFAULT 'idle'
                         CHECK (timer_status IN ('idle', 'running', 'paused', 'finished')),
        started_at_ms    INTEGER,        -- wall-clock epoch ms of the start
        paused_at_ms     INTEGER,        -- wall-clock epoch ms of the current pause
        paused_total_ms  INTEGER NOT NULL DEFAULT 0,
        created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE race_entry (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        race_id         INTEGER NOT NULL REFERENCES race(id) ON DELETE CASCADE,
        participant_id  INTEGER NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
        status          TEXT NOT NULL DEFAULT 'registered'
                        CHECK (status IN ('registered', 'finished', 'DNS', 'DNF', 'DSQ')),
        UNIQUE (race_id, participant_id)
    );

    CREATE TABLE arrival (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        race_id         INTEGER NOT NULL REFERENCES race(id) ON DELETE CASCADE,
        position        INTEGER NOT NULL CHECK (position > 0),
        elapsed_ms      INTEGER NOT NULL CHECK (elapsed_ms >= 0),
        -- NULL until the bib is entered after the race
        participant_id  INTEGER REFERENCES participant(id) ON DELETE SET NULL,
        UNIQUE (race_id, position)
    );
    -- a participant can only finish once per race
    CREATE UNIQUE INDEX ux_arrival_participant
        ON arrival (race_id, participant_id) WHERE participant_id IS NOT NULL;
    """,
]
