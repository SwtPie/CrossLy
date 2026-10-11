"""Filesystem locations.

The `data/` folder lives next to the executable once packaged, and next to
the project root during development. Everything that touches the disk
location goes through this module so packaging stays a one-line concern.
"""

import sys
from pathlib import Path


def app_dir() -> Path:
    """Folder containing the executable (frozen) or the project root (dev)."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def resource_dir() -> Path:
    """Folder containing bundled read-only resources (frontend files)."""
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS", app_dir()))
    return app_dir()


def data_dir() -> Path:
    """Folder holding one SQLite file per event. Created on demand."""
    path = app_dir() / "data"
    path.mkdir(parents=True, exist_ok=True)
    return path


def frontend_dir() -> Path:
    return resource_dir() / "frontend"
