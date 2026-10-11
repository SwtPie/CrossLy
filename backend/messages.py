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
