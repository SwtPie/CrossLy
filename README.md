<div align="center">

# CrossLy

### Le cross scolaire, organisé simplement.

**CrossLy** est une application de bureau destinée aux enseignants d’EPS pour organiser un cross scolaire : gestion des événements et des participants, inscriptions aux courses, chronométrage, classements et documents prêts à imprimer.

![Windows](https://img.shields.io/badge/plateforme-Windows-0078D6?logo=windows&logoColor=white)
![Interface française](https://img.shields.io/badge/interface-fran%C3%A7aise-blue)
![Hors ligne](https://img.shields.io/badge/mode-hors--ligne-success)
![Python et JavaScript](https://img.shields.io/badge/stack-Python%20%7C%20JavaScript-yellow)
![Licence Apache 2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)
![En développement](https://img.shields.io/badge/statut-en%20d%C3%A9veloppement-orange)

**Une application locale, conçue pour fonctionner hors ligne, sans compte ni connexion Internet.**

</div>

---

## ✨ Pourquoi CrossLy ?

Organiser un cross scolaire implique de gérer les participants, plusieurs courses, les arrivées, les classements et les impressions. CrossLy rassemble ces opérations dans une application de bureau utilisable sur un PC portable.

- **Hors ligne par conception** : toutes les ressources de l’interface sont embarquées localement, sans CDN.
- **Données locales** : chaque événement est stocké dans son propre fichier SQLite.
- **Pensé pour le terrain** : chronométrage intégré et enregistrement rapide des arrivées.
- **Documents imprimables** : génération PDF des dossards et des résultats.
- **Import pratique** : import de listes CSV ou Excel, avec prévisualisation avant validation.
- **Application Windows autonome prévue** : la création d’un exécutable unique est planifiée pour une phase ultérieure.

> 🚧 **Statut du projet :** CrossLy est en développement. Les phases 0 et 1 sont terminées et validées, la phase 2 est terminée et validée, et la phase 3 est implémentée mais reste à valider. Les autres fonctionnalités sont planifiées et ne sont pas nécessairement disponibles dans la version actuelle.

## 🧩 Fonctionnalités

### Événements

- Créer, modifier et supprimer des événements indépendants.
- Conserver les participants, courses, arrivées et résultats dans le fichier SQLite de chaque événement.
- Exporter un événement pour le sauvegarder ou le transférer, puis importer un fichier d’événement.
- Lors de l’import, le fichier est vérifié et migré dans un emplacement temporaire avant d’être copié sous un nouveau nom. Importer plusieurs fois la même sauvegarde crée donc plusieurs événements.
- Renommer un événement modifie son nom, pas le nom de son fichier.
- La suppression d’un événement demande confirmation et supprime son fichier.

### Participants

- Ajouter, modifier et supprimer des participants individuellement.
- Rechercher et filtrer les participants par texte, sexe, classe, établissement et état du dossard ; trier les colonnes.
- Attribuer les numéros de dossard automatiquement ou manuellement.
- Garantir l’unicité du dossard et détecter les doublons de participants sur le nom et le prénom, sans tenir compte des accents ni de la casse.
- Normaliser les noms entièrement en majuscules ou minuscules ainsi que les classes selon les règles prévues.

### Import CSV et Excel

La phase d’import est implémentée et attend une validation manuelle.

- Importer des fichiers CSV ou Excel (`.xlsx`).
- Générer un modèle Excel téléchargeable avec en-têtes, liste de choix pour le sexe, formats de date et de VMA, et feuille « Mode d’emploi ».
- Détecter les colonnes à partir de noms français ou anglais, sans tenir compte des accents, de la casse ou de la ponctuation. La détection peut être corrigée manuellement.
- Détecter l’en-tête même si le fichier comporte des lignes de titre et sélectionner la feuille la plus pertinente d’un classeur.
- Accepter un champ unique « Nom Prénom », avec prise en charge de l’ordre « Prénom NOM » et des noms séparés par une virgule.
- Reconnaître les CSV UTF-8 (avec ou sans BOM) et Windows-1252 ; détecter les séparateurs point-virgule, virgule ou tabulation.
- Limites actuelles : 10 Mo et 5 000 lignes. Les anciens fichiers `.xls` sont refusés avec une indication invitant à les enregistrer en `.xlsx`.
- Prévisualiser chaque ligne avant import : à importer, à vérifier, doublon ou erreur. La classe peut être corrigée dans la prévisualisation.
- Ignorer les doublons en conservant la première occurrence du fichier.
- Appliquer un établissement ou une classe à toute la liste uniquement lorsque la ligne n’en contient pas déjà.
- Importer les participants sans VMA sans en déduire une valeur.
- Les valeurs illisibles de sexe, date de naissance, âge ou VMA ne bloquent pas l’import : elles restent vides et la ligne est signalée. Un nom ou prénom manquant, ou un nom de plus de 80 caractères, entraîne le rejet de la ligne.
- Effectuer l’import dans une transaction unique : aucune donnée n’est écrite avant confirmation. Les dossards ne sont jamais importés et sont attribués ensuite.

### Courses et inscriptions

Fonctionnalités prévues pour la phase 4 :

- Créer un nombre illimité de courses par événement.
- Définir la distance et, à titre indicatif, une plage de VMA.
- Inscrire un participant à plusieurs courses.
- Ajouter des participants individuellement ou rapidement à l’aide de filtres combinables : sexe, VMA, classe et établissement.

La plage de VMA est informative et ne doit pas empêcher l’inscription.

### Chronométrage

Fonctionnalités prévues pour la phase 5 :

- Démarrer, mettre en pause, reprendre et terminer un chronomètre.
- Enregistrer les arrivées en un clic et annuler une saisie erronée.
- Enregistrer les temps dans l’ordre d’arrivée, puis saisir les numéros de dossard séparément.
- Enregistrer immédiatement l’heure de départ et chaque arrivée en base pour permettre la reprise après une fermeture inattendue ou une coupure de courant.

### Classements et résultats

Fonctionnalités prévues pour la phase 6 :

- Générer les classements à partir de l’ordre d’arrivée, sans ex æquo : chaque arrivant reçoit un rang unique.
- Afficher le temps, la vitesse réelle et le pourcentage de VMA lorsque les données sont disponibles.
- Calculer la vitesse en km/h à partir de la distance et du temps, puis le pourcentage de VMA à partir de la vitesse et de la VMA.
- Afficher le podium des trois premiers.
- Filtrer les classements par sexe, établissement, classe et catégorie d’âge lorsque celle-ci aura été définie.
- Gérer les statuts **DNS** (non-partant), **DNF** (abandon) et **DSQ** (disqualifié), affichés après les arrivants classés et sans rang.
- Corriger, ajouter ou supprimer des arrivées après la course et recalculer les classements.
- Masquer les courses terminées dans la vue principale.

### Statistiques et PDF

Fonctionnalités prévues pour les phases 7 et 8 :

- Graphiques de répartition des participants par sexe et établissement.
- Répartition des VMA en tranches de 0,5 km/h, avec arrondi arithmétique au demi-kilomètre/heure le plus proche.
- Export PDF des dossards, avec sélection par établissement ou classe et personnalisation des champs, de la taille, du logo et du nombre de dossards par page.
- Export des classements PDF en version générale ou filtrée, avec personnalisation.
- Les exports de listes de départ et de résultats en Excel/CSV, les diplômes et les classements par équipe sont des idées ultérieures, non planifiées à ce stade.

## 🛠️ Technologies

| Composant | Technologie | Rôle |
|---|---|---|
| Fenêtre de bureau | [pywebview](https://pywebview.flowrl.com/) | Afficher l’interface web dans une fenêtre native |
| Backend | [Python 3](https://www.python.org/) | Logique métier et accès aux données |
| Pont frontend/backend | API JavaScript de pywebview (`window.pywebview.api`) | Exposer les fonctions Python à l’interface |
| Interface | HTML, CSS, JavaScript natif | Interface sans framework ni étape de compilation |
| Base de données | [SQLite](https://www.sqlite.org/) | Stockage local d’un événement par fichier |
| Fichiers Excel | [openpyxl](https://openpyxl.readthedocs.io/) | Lecture et écriture des classeurs `.xlsx` |
| PDF | [ReportLab](https://www.reportlab.com/) | Génération des dossards et résultats |
| Packaging prévu | [PyInstaller](https://pyinstaller.org/) | Création d’un exécutable Windows autonome |

### Principes techniques

- Le fonctionnement hors ligne est obligatoire : JavaScript, CSS et polices nécessaires doivent être embarqués localement.
- Le frontend n’accède jamais directement à SQLite : tout accès aux données passe par le backend Python.
- Une base SQLite correspond à un événement. Il n’y a donc ni table `event` ni colonne `event_id` dans le modèle de données.
- Les versions du schéma sont suivies avec `PRAGMA user_version` et les migrations sont définies dans `backend/migrations.py`. Une migration publiée ne doit jamais être modifiée : il faut en ajouter une nouvelle.
- Les fichiers de données doivent être localisés via `backend/paths.py`, afin de préparer le packaging ; les migrations sont stockées sous forme de chaînes Python.
- L’interface, les messages destinés aux utilisateurs et les documents exportés sont en français. Le code, les commentaires, les identifiants et les messages de commit sont en anglais.
- Aucune infrastructure de tests automatisés n’est requise pour le moment : chaque phase se termine par une vérification manuelle. Les fonctions métier doivent rester simples et faciles à vérifier.
- Toute action destructive (suppression d’événement ou de course, effacement de résultats) doit demander confirmation.

## 🗂️ Structure du projet

Structure indicative, susceptible d’évoluer au fil du développement :

```text
crossly/
├── CLAUDE.md
├── README.md
├── main.py                  # Point d’entrée pywebview et API JavaScript
├── backend/
│   ├── db.py
│   ├── migrations.py        # Migrations SQLite
│   ├── paths.py             # Chemins des ressources et des données
│   ├── messages.py          # Messages utilisateur en français
│   ├── normalize.py         # Normalisation des données
│   └── ...                  # Modules métier : événements, participants, import, etc.
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/                  # Modules ES, un fichier par écran
│   └── assets/              # Ressources locales, sans CDN
├── build/                   # Configuration PyInstaller, phase 9
└── data/                    # Fichiers SQLite, un par événement
```

Le modèle Excel d’import est généré par `backend/importer.py` ; il n’est pas nécessaire de maintenir un modèle séparé dans le dépôt.

## 🚀 Démarrage pour le développement

### Prérequis

- Windows est la plateforme de déploiement cible.
- Python 3 installé.
- Git.

### Installation

Clone le dépôt et crée un environnement virtuel :

```bash
git clone <URL_DU_DEPOT>
cd crossly
python -m venv .venv
```

Active l’environnement virtuel sous Windows :

```powershell
.venv\Scripts\Activate.ps1
```

Installe les dépendances :

```bash
python -m pip install pywebview openpyxl reportlab pyinstaller
```

Lance l’application lorsque le point d’entrée `main.py` est disponible :

```bash
python main.py
```

> ℹ️ Ces commandes constituent une base de démarrage. Les dépendances et les instructions devront être ajustées à l’état réel du dépôt ; un fichier `requirements.txt` pourra être ajouté pour figer les dépendances.

## 🗺️ Feuille de route

Chaque phase doit aboutir à un résultat utilisable et vérifié manuellement.

- [x] **Phase 0 — Fondations** : fenêtre pywebview, pont Python/JavaScript, schéma SQLite et migrations, navigation et ressources locales. Le packaging PyInstaller est reporté à la phase 9.
- [x] **Phase 1 — Événements** : création, modification, suppression, sélection, import et export des événements.
- [x] **Phase 2 — Participants** : ajout, modification, suppression, recherche, filtres et attribution des dossards.
- [ ] **Phase 3 — Import** *(implémentée, validation en attente)* : import CSV/Excel, modèle, détection des colonnes, prévisualisation, doublons et normalisation.
- [ ] **Phase 4 — Courses** : création des courses, inscriptions et ajout rapide par filtres.
- [ ] **Phase 5 — Chronométrage** : chronomètre persistant, arrivées, annulation et reprise après incident.
- [ ] **Phase 6 — Dossards et classements** : saisie des dossards par position, statuts DNS/DNF/DSQ, podium, filtres et corrections.
- [ ] **Phase 7 — Export PDF** : dossards personnalisables et résultats imprimables.
- [ ] **Phase 8 — Statistiques** : graphiques par sexe, établissement et tranches de VMA.
- [ ] **Phase 9 — Packaging** : exécutable Windows autonome, icône, premier lancement propre, emplacement des données et test manuel sur un PC vierge.
- [ ] **Phase 10 — Optionnelle : saisie multi-appareil** : serveur local et saisie des dossards depuis un téléphone, une tablette ou un ordinateur secondaire. Le périmètre et la sécurité devront être définis avant le démarrage.

**Idées ultérieures, non planifiées :** export Excel/CSV des résultats, listes de départ, diplômes et classement par équipe ou établissement.

## 💾 Données et sauvegardes

Chaque événement est conservé dans son propre fichier SQLite, dans le dossier `data/` à côté de l’exécutable. Le fichier contient les participants, les courses, les inscriptions, les arrivées et les résultats de cet événement.

Pour sauvegarder ou transférer un événement, il est possible de copier son fichier ou d’utiliser les fonctions d’export et d’import de l’application. L’export utilise l’API de sauvegarde SQLite afin de produire un fichier cohérent, y compris lorsque le mode WAL est actif.

**Conseil :** conserve une copie de sauvegarde avant toute manipulation importante des fichiers de données. Vérifie le contenu d’une base avant de la partager : elle peut contenir des données personnelles de participants.

## 🤝 Contribution et conventions

Les contributions et retours sont les bienvenus. Avant une modification importante, ouvre une issue pour décrire le problème ou le besoin ; les changements peuvent ensuite être proposés par pull request.

- Suivre les conventions Python **PEP 8** et utiliser les annotations de types lorsqu’elles sont utiles.
- Organiser le backend par domaine fonctionnel.
- Utiliser des modules JavaScript ES et éviter l’état global mutable en dehors d’un petit module de stockage.
- Garder le frontend en HTML/CSS/JavaScript natif, sans dépendance superflue.
- Centraliser les textes français de l’interface.
- Faire confirmer toute action destructive.
- Vérifier manuellement les fonctionnalités après chaque phase.
- Garder les fonctions de normalisation, d’import et de calcul métier petites et faciles à contrôler.

## 🔐 Confidentialité

CrossLy est conçu pour fonctionner localement et hors ligne. Les données d’événement sont conservées sur l’ordinateur qui exécute l’application ; aucune connexion Internet n’est requise pour son fonctionnement normal.

La sécurité concrète dépend toutefois de la configuration du poste, des personnes qui peuvent accéder aux fichiers et des pratiques de sauvegarde. Évite de partager des bases contenant des données personnelles sans vérifier au préalable ce qu’elles contiennent.

## 📄 Licence

CrossLy est distribué sous licence **Apache License 2.0**. Tu peux consulter le texte complet dans le fichier [`LICENSE`](LICENSE) du dépôt ou sur le site de l’Apache Software Foundation : <https://www.apache.org/licenses/LICENSE-2.0>.

Cette licence autorise notamment l’utilisation, la modification et la redistribution du logiciel, sous réserve de ses conditions. Les notices de licence et de copyright applicables doivent être conservées. La licence n’accorde pas de droits sur les marques.

---

<div align="center">

**CrossLy** · Moins de paperasse, plus de course. 🏃‍♀️🏃‍♂️

</div>
