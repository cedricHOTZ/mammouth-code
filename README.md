# Mammouth Code — Extension VSCode

> Agent IA de développement intégré dans VSCode, propulsé par [Mammouth IA](https://mammouth.ai).

Mammouth Code vous permet de dialoguer avec une IA directement dans votre éditeur, d'expliquer ou corriger du code en un clic, et de laisser l'agent manipuler vos fichiers et exécuter des commandes à votre place.

---

## Installation

1. Ouvrez VSCode
2. Allez dans l'onglet Extensions (`Ctrl+Shift+X`)
3. Cherchez **Mammouth Code**
4. Cliquez **Installer**

---

## Configuration

Avant de commencer, vous devez entrer votre clé API :

1. Ouvrez les paramètres VSCode (`Ctrl+,`)
2. Cherchez **mammouth**
3. Renseignez votre clé dans le champ `mammouth.apiKey`

Obtenez votre clé API sur [mammouth.ai](https://mammouth.ai).

| Paramètre | Description | Valeur par défaut |
|---|---|---|
| `mammouth.apiKey` | **Obligatoire** — Votre clé API Mammouth | _(vide)_ |
| `mammouth.model` | Modèle IA à utiliser | `claude-sonnet-4-6` |
| `mammouth.apiEndpoint` | URL de l'API | `https://api.mammouth.ai/v1/chat/completions` |
| `mammouth.maxTokens` | Nombre maximum de tokens par réponse | `8192` |

---

## Utilisation

### Ouvrir le chat

- Cliquez sur l'icône **Mammouth** dans la barre latérale
- Ou utilisez le raccourci `Ctrl+Shift+M` (`Cmd+Shift+M` sur Mac)
- Pour recommencer une nouvelle conversation : `Ctrl+Shift+P` → **Mammouth: Nouvelle conversation**

### Expliquer ou corriger du code

1. Sélectionnez du code dans l'éditeur
2. Faites un clic droit
3. Choisissez :
   - **Mammouth: Expliquer la sélection** — l'agent explique ce que fait le code
   - **Mammouth: Corriger la sélection** — l'agent propose une correction

### Ce que l'agent peut faire

| Outil | Description |
|---|---|
| `read_file` | Lire le contenu d'un fichier |
| `write_file` | Créer ou écraser un fichier |
| `replace_in_file` | Modifier une portion d'un fichier |
| `list_files` | Lister le contenu d'un dossier |
| `search_in_files` | Chercher du texte dans les fichiers du projet |
| `get_open_file` | Obtenir le fichier actuellement ouvert |
| `run_terminal_command` | Exécuter une commande terminal |

> Les opérations d'écriture et les commandes terminal demandent toujours une confirmation avant d'être exécutées.

---

## Éditeur

Développé par **[Cédric]**.

## Licence

MIT
