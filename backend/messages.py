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


def participant_duplicate(last_name: str, first_name: str) -> str:
    return f"{last_name} {first_name} est déjà inscrit(e) dans cet événement."


def bib_taken(bib: int, owner: str) -> str:
    return f"Le dossard {bib} est déjà attribué à {owner}."
