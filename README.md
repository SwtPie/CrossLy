<div align="center">

# CrossLy

### Le cross scolaire, organisé simplement.

**CrossLy** est une application de bureau destinée aux enseignants d’EPS pour organiser un cross scolaire : inscriptions, gestion des courses, chronométrage, classements et documents prêts à imprimer.

[![Windows](https://img.shields.io/badge/plateforme-Windows-0078D6?logo=windows&logoColor=white)](https://www.microsoft.com/windows)
![Interface française](https://img.shields.io/badge/interface-fran%C3%A7aise-blue)
![Hors ligne](https://img.shields.io/badge/mode-hors--ligne-success)
![Python et JavaScript](https://img.shields.io/badge/stack-Python%20%7C%20JavaScript-yellow)
![En développement](https://img.shields.io/badge/statut-en%20d%C3%A9veloppement-orange)

**Une application locale, sans compte à créer ni connexion Internet nécessaire.**

</div>

---

## ✨ Pourquoi CrossLy ?

Organiser un cross scolaire implique de gérer des listes de participants, plusieurs courses, les arrivées, les classements et les impressions. CrossLy vise à réunir ces opérations dans une seule application simple, utilisable depuis le PC de l’établissement.

- **Hors ligne par conception** : pas de compte utilisateur ni de connexion Internet requise.
- **Données locales** : les informations sont stockées dans des fichiers SQLite.
- **Pensé pour le terrain** : chronométrage intégré et enregistrement rapide des arrivées.
- **Documents prêts à imprimer** : export PDF des dossards et des résultats.
- **Import pratique** : récupération de listes depuis des fichiers CSV ou Excel.

> 🚧 **Statut du projet :** CrossLy est en développement. Les fonctionnalités décrites dans ce README correspondent à la cible fonctionnelle du projet et ne sont pas nécessairement toutes disponibles dans la version actuelle.

## 🧩 Fonctionnalités prévues

### Événements
- Créer, modifier et supprimer des événements indépendants.
- Conserver les participants, courses et résultats propres à chaque événement.
- Exporter et importer un événement pour le sauvegarder ou le transférer.

### Participants
- Ajouter et modifier les participants individuellement.
- Importer des listes au format CSV ou Excel (`.xlsx`).
- Prévisualiser les données avant de confirmer l’import.
- Détecter les doublons et normaliser les noms.
- Attribuer automatiquement ou manuellement les numéros de dossard.
- Rechercher et filtrer les participants.

### Courses et inscriptions
- Créer plusieurs courses pour un même événement.
- Inscrire un participant à une ou plusieurs courses.
- Ajouter rapidement des participants selon plusieurs critères : sexe, VMA, classe et établissement.
- Utiliser la plage de VMA comme indication, sans en faire une restriction d’inscription.

### Chronométrage
- Démarrer, mettre en pause, reprendre et terminer un chronomètre.
- Enregistrer les arrivées en un clic et annuler une saisie erronée.
- Saisir les numéros de dossard après l’enregistrement des temps.
- Enregistrer immédiatement les données de chronométrage pour faciliter la reprise après une fermeture inattendue.

### Classements et résultats
- Générer les classements à partir de l’ordre d’arrivée.
- Afficher le temps, la vitesse réelle (km/h) et le pourcentage de VMA lorsque les données nécessaires sont disponibles.
- Mettre en avant le podium des trois premiers.
- Filtrer les résultats par sexe, établissement, classe et catégorie d’âge lorsque celle-ci sera définie.
- Gérer les statuts **DNS** (non-partant), **DNF** (abandon) et **DSQ** (disqualifié).
- Corriger les arrivées après la course et recalculer les classements.

### Statistiques et exports
- Visualiser la répartition des participants par sexe et établissement.
- Regrouper les VMA par tranches de 0,5 km/h.
- Exporter les dossards en PDF, avec personnalisation des champs, de la taille, du logo et du nombre de dossards par page.
- Préparer les dossards et les résultats par établissement ou par classe.
- Exporter les classements en PDF, en version générale ou filtrée.

## 🛠️ Technologies

| Composant | Technologie | Rôle |
|---|---|---|
| Fenêtre de bureau | [pywebview](https://pywebview.flowrl.com/) | Afficher l’interface web dans une fenêtre native |
| Backend | [Python](https://www.python.org/) | Logique métier et accès aux données |
| Interface | HTML, CSS, JavaScript natif | Interface utilisateur sans framework obligatoire |
| Base de données | [SQLite](https://www.sqlite.org/) | Stockage local des événements |
| Fichiers Excel | [openpyxl](https://openpyxl.readthedocs.io/) | Import et traitement des classeurs `.xlsx` |
| PDF | [ReportLab](https://www.reportlab.com/) | Génération des dossards et résultats |
| Packaging | [PyInstaller](https://pyinstaller.org/) | Création d’un exécutable Windows |

### Principes techniques
- Fonctionnement hors ligne : les ressources nécessaires à l’interface sont embarquées localement, sans CDN.
- Les accès à SQLite passent par le backend Python ; le frontend n’accède jamais directement à la base.
- Une base SQLite est prévue par événement.
- L’interface et les documents exportés sont en français.
- Le code, les commentaires, les identifiants et les messages de commit sont en anglais.
- Le projet privilégie une architecture simple et des fonctions métier faciles à vérifier manuellement.

## 🗂️ Structure du projet

La structure cible proposée est la suivante ; elle pourra évoluer au fil du développement.

```text
crossly/
├── main.py                 # Point d’entrée pywebview et API JavaScript
├── backend/                # Logique métier et accès aux données
│   ├── db.py
│   ├── schema.sql
│   ├── events.py
│   ├── participants.py
│   ├── importer.py
│   ├── races.py
│   ├── timing.py
│   ├── rankings.py
│   ├── stats.py
│   └── exports.py
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── templates/              # Modèles d’import
├── build/                  # Configuration PyInstaller
├── data/                   # Bases SQLite locales, une par événement
├── CLAUDE.md
└── README.md
```

## 🚀 Démarrage pour le développement

### Prérequis
- Windows pour la cible de déploiement.
- Python 3 installé.
- Git.

### Installation

Clone le dépôt puis crée un environnement virtuel :

```bash
git clone <URL_DU_DEPOT>
cd crossly

python -m venv .venv
```

Active l’environnement virtuel sous Windows :

```powershell
.venv\Scripts\Activate.ps1
```

Installe les dépendances utilisées par le projet :

```bash
python -m pip install pywebview openpyxl reportlab pyinstaller
```

Lance ensuite l’application lorsque le point d’entrée `main.py` et le squelette de l’interface sont disponibles :

```bash
python main.py
```

> ℹ️ Les commandes ci-dessus donnent une base de démarrage. Un fichier `requirements.txt` et les instructions exactes d’installation seront à ajouter ou à ajuster selon l’état réel du dépôt.

## 🗺️ Feuille de route

Le développement est organisé en phases, chacune devant aboutir à une version utilisable et vérifiée manuellement.

- [ ] **Phase 0 — Fondations** : fenêtre pywebview, pont Python/JavaScript, schéma SQLite et navigation.
- [ ] **Phase 1 — Événements** : création, modification, suppression, import et export.
- [ ] **Phase 2 — Participants** : gestion manuelle, recherche, filtres et dossards.
- [ ] **Phase 3 — Import** : CSV/Excel, modèle, prévisualisation et détection des doublons.
- [ ] **Phase 4 — Courses** : création des courses et inscriptions.
- [ ] **Phase 5 — Chronométrage** : chronomètre persistant, arrivées et reprise après incident.
- [ ] **Phase 6 — Classements** : saisie des dossards, statuts, podium et corrections.
- [ ] **Phase 7 — PDF** : dossards personnalisables et résultats imprimables.
- [ ] **Phase 8 — Statistiques** : graphiques par sexe, établissement et tranches de VMA.
- [ ] **Phase 9 — Packaging** : exécutable Windows autonome et vérification sur un PC propre.
- [ ] **Phase 10 — Optionnel** : saisie des dossards depuis un second appareil sur le réseau local.

**Idées ultérieures :** export Excel/CSV des résultats, listes de départ, diplômes et classement par équipe ou établissement.

## 💾 Données et sauvegardes

Chaque événement doit être conservé dans son propre fichier SQLite, placé dans le dossier `data/` à côté de l’exécutable.

Cette organisation permet de sauvegarder ou transférer un événement en copiant son fichier. CrossLy prévoit également des commandes d’export et d’import pour simplifier cette opération.

**Conseil :** conserve une copie de sauvegarde avant toute manipulation importante des fichiers de données.

## 🤝 Contribution et conventions

Les contributions et retours sont les bienvenus.

Pour garder le projet maintenable :
- Suivre les conventions Python **PEP 8** et utiliser les annotations de types lorsqu’elles sont utiles.
- Organiser le backend par domaine fonctionnel.
- Garder le frontend en HTML/CSS/JavaScript natif, sans dépendance superflue.
- Centraliser les textes de l’interface en français.
- Demander une confirmation avant toute action destructive.
- Vérifier manuellement les fonctionnalités après chaque phase.

Avant de proposer une modification importante, décris le problème ou le besoin dans une issue. Les changements peuvent ensuite être soumis par pull request.

## 🔐 Confidentialité

CrossLy est conçu pour fonctionner localement et hors ligne. Les données d’événement sont prévues pour être conservées sur l’ordinateur qui exécute l’application.

La sécurité concrète dépendra toutefois de la configuration du poste, de l’accès aux fichiers et des pratiques de sauvegarde. Évite de partager des bases contenant des données personnelles sans vérifier au préalable ce qu’elles contiennent.

## 📄 Licence

Aucune licence n’est encore spécifiée. Le projet ne doit pas être considéré comme librement réutilisable tant qu’un fichier `LICENSE` n’a pas été ajouté au dépôt.

---

<div align="center">

**CrossLy** · Moins de paperasse, plus de course. 🏃‍♀️🏃‍♂️

</div>
