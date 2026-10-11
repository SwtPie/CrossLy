"""CrossLy entry point: opens the pywebview window on the local frontend.

Usage:
    python main.py            # normal launch
    python main.py --debug    # enables the webview developer tools
"""

import sys

import webview

from backend import APP_NAME
from backend.api import Api
from backend.paths import frontend_dir


def main() -> None:
    debug = "--debug" in sys.argv
    index = frontend_dir() / "index.html"
    if not index.exists():
        raise SystemExit(f"Frontend not found: {index}")

    webview.create_window(
        title=APP_NAME,
        url=str(index),
        js_api=Api(),
        width=1280,
        height=800,
        min_size=(960, 600),
    )
    webview.start(debug=debug)


if __name__ == "__main__":
    main()
