"""Pure text-normalization helpers (no database, no I/O).

Kept small and side-effect free so they are easy to check by hand and can be
reused by the import in phase 3.
"""

import re
import unicodedata

from .db import normalize_key

# "6A", "63", "6 a", "6-B", "6.2"
_CLASS_SIMPLE = re.compile(r"^([3-6])[-_. ]*([A-Z1-9])$")
# "6e A", "6eme3", "6ème B", "6°A"
_CLASS_SUFFIXED = re.compile(r"^([3-6])\s*(?:EME|E|°)\s*[-_. ]*\s*([A-Z1-9])$")
_CLASS_CANONICAL = re.compile(r"^([3-6])([A-Z1-9])$")


def collapse_spaces(text: str | None) -> str:
    """Trim and collapse any run of whitespace to a single space."""
    return re.sub(r"\s+", " ", text or "").strip()


def normalize_class(raw: str | None) -> str:
    """Return a class in canonical `6X` form (level 3-6 + letter or digit).

    Values that do not match a known pattern are returned trimmed but
    otherwise unchanged (they are never rejected).
    """
    text = collapse_spaces(raw)
    if not text:
        return ""
    folded = "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    ).upper()
    for pattern in (_CLASS_SIMPLE, _CLASS_SUFFIXED):
        match = pattern.match(folded)
        if match:
            return match.group(1) + match.group(2)
    return text


def class_sort_key(class_name: str | None) -> tuple:
    """Sort key: canonical classes by level then section, others after, empty last."""
    if not class_name:
        return (2, "")
    match = _CLASS_CANONICAL.match(class_name)
    if match:
        return (0, int(match.group(1)), match.group(2))
    return (1, normalize_key(class_name))
