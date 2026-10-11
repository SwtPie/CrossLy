// All French UI strings live here so wording can be changed in one place.
window.CrossLy = window.CrossLy || {};

CrossLy.strings = {
  common: {
    cancel: "Annuler",
    save: "Enregistrer",
    create: "Créer",
    delete: "Supprimer",
    fieldRequired: "Ce champ est obligatoire.",
  },
  nav: {
    events: "Événements",
    participants: "Participants",
    races: "Courses",
    timing: "Chronométrage",
    results: "Classements",
    stats: "Statistiques",
  },
  events: {
    title: "Événements",
    empty: "Aucun événement pour le moment.",
    emptyHint: "Créez votre premier événement ou importez un fichier de sauvegarde.",
    noDate: "Date non renseignée",
    noLocation: "Lieu non renseigné",
    dataFolder: "Dossier des données :",
    new: "Nouvel événement",
    import: "Importer un événement",
    open: "Ouvrir",
    opened: "Ouvert",
    edit: "Modifier",
    export: "Exporter",
    delete: "Supprimer",
    fieldName: "Nom de l'événement",
    fieldNamePlaceholder: "Ex. Cross du collège 2026",
    fieldDate: "Date",
    fieldLocation: "Lieu",
    fieldLocationPlaceholder: "Ex. Parc de la mairie",
    createTitle: "Nouvel événement",
    editTitle: "Modifier l'événement",
    created: "Événement créé et ouvert.",
    updated: "Événement mis à jour.",
    deleted: "Événement supprimé.",
    imported: "Événement importé.",
    exported: "Sauvegarde enregistrée :",
    deleteTitle: "Supprimer l'événement ?",
    deleteMessage: (name) =>
      `« ${name} » et toutes ses données (participants, courses, résultats) seront supprimés définitivement. ` +
      "Pensez à exporter une sauvegarde avant de continuer.",
    participantsCount: (n) => `${n} participant${n > 1 ? "s" : ""}`,
    racesCount: (n) => `${n} course${n > 1 ? "s" : ""}`,
  },
  placeholder: {
    comingSoon: "Cet écran sera disponible dans une prochaine phase.",
    needEvent: "Sélectionnez d'abord un événement.",
  },
  errors: {
    generic: "Une erreur est survenue.",
    backendUnavailable:
      "Le moteur de l'application n'est pas joignable (mode aperçu navigateur).",
  },
};
