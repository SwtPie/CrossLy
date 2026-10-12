"""French messages shown to the user when the backend rejects an action.

Kept in one place (like the frontend strings) so wording can be changed
without touching the logic.
"""

EVENT_NAME_REQUIRED = "Le nom de l'événement est obligatoire."
EVENT_NAME_TOO_LONG = "Le nom de l'événement est trop long (120 caractères maximum)."
EVENT_DATE_INVALID = "La date de l'événement est invalide."
EVENT_NOT_FOUND = "Cet événement est introuvable."
EVENT_FILE_INVALID = "Ce fichier n'est pas un événement CrossLy valide."
EVENT_FILE_TOO_NEW = (
    "Ce fichier a été créé par une version plus récente de CrossLy. "
    "Mettez le logiciel à jour pour l'ouvrir."
)
EXPORT_SAME_FILE = "Choisissez un emplacement en dehors du dossier de données de CrossLy."

LAST_NAME_REQUIRED = "Le nom est obligatoire."
FIRST_NAME_REQUIRED = "Le prénom est obligatoire."
PERSON_NAME_TOO_LONG = "Le nom, le prénom, la classe et l'établissement sont limités à 80 caractères."
SEX_INVALID = "Le sexe doit être « Garçon » ou « Fille »."
BIRTH_DATE_INVALID = "La date de naissance est invalide."
AGE_INVALID = "L'âge doit être un nombre entier entre 3 et 99."
VMA_INVALID = "La VMA doit être un nombre entre 5 et 30 km/h."
BIB_INVALID = "Le dossard doit être un nombre entier entre 1 et 99999."
BIB_START_INVALID = "Le numéro de départ doit être un nombre entier entre 1 et 99999."
PARTICIPANT_NOT_FOUND = "Ce participant est introuvable."


# --- participant import ---------------------------------------------------------

IMPORT_NO_FILE = "Aucun fichier sélectionné : choisissez d'abord un fichier à importer."
IMPORT_FILE_TYPE = (
    "Format non pris en charge. Choisissez un fichier .csv ou .xlsx "
    "(pour un ancien fichier .xls, enregistrez-le d'abord au format .xlsx)."
)
IMPORT_FILE_UNREADABLE = (
    "Impossible de lire ce fichier. Vérifiez qu'il n'est pas protégé par un mot de passe "
    "et qu'il s'agit bien d'un fichier .csv ou .xlsx."
)
IMPORT_FILE_TOO_BIG = "Ce fichier est trop volumineux (10 Mo maximum)."
IMPORT_FILE_EMPTY = "Ce fichier ne contient aucune donnée."
IMPORT_TOO_MANY_ROWS = "Ce fichier contient plus de 5 000 lignes : découpez-le en plusieurs fichiers."
IMPORT_NO_NAME_COLUMNS = (
    "Aucune colonne de nom détectée : indiquez la colonne du nom et celle du prénom "
    "(ou une colonne unique « Nom Prénom »)."
)
IMPORT_NOTHING = "Aucun participant à importer."
IMPORT_ROW_MISSING_NAME = "Nom ou prénom manquant : ligne ignorée."
IMPORT_ROW_DUPLICATE_EXISTING = "Déjà inscrit(e) dans cet événement : ignoré(e)."


def import_row_duplicate_file(line: int) -> str:
    return f"Déjà présent(e) à la ligne {line} du fichier : ignoré(e)."


def import_row_vma_ignored(raw: str) -> str:
    return f"VMA non reconnue (« {raw} ») : laissée vide."


def import_row_sex_ignored(raw: str) -> str:
    return f"Sexe non reconnu (« {raw} ») : laissé vide."


def import_row_birth_ignored(raw: str) -> str:
    return f"Date de naissance non reconnue (« {raw} ») : laissée vide."


def import_row_age_ignored(raw: str) -> str:
    return f"Âge non reconnu (« {raw} ») : laissé vide."


def participant_duplicate(last_name: str, first_name: str) -> str:
    return f"{last_name} {first_name} est déjà inscrit(e) dans cet événement."


def bib_taken(bib: int, owner: str) -> str:
    return f"Le dossard {bib} est déjà attribué à {owner}."
