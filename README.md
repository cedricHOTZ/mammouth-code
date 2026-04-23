# Mammouth Code — Extension VSCode

Agent IA de développement propulsé par [Mammouth IA](https://mammouth.ai), intégré dans VSCode.

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Compiler
npm run compile

# 3. Lancer l'extension (ouvre une fenêtre VSCode de développement)
# Appuyer sur F5 dans VSCode, ou :
# Ctrl+Shift+P → "Debug: Start Debugging"
```

## Configuration

Ouvrez les paramètres VSCode (`Ctrl+,`) et cherchez **mammouth** :

| Paramètre | Description | Défaut |
|---|---|---|
| `mammouth.apiKey` | **Obligatoire** — Clé API Mammouth | `` |
| `mammouth.model` | Modèle à utiliser | `claude-sonnet-4-6` |
| `mammouth.apiEndpoint` | URL de l'API | `https://api.mammouth.ai/v1/chat/completions` |
| `mammouth.maxTokens` | Tokens max par réponse | `8192` |

## Fonctionnalités

### Panneau de chat (barre latérale)
- Cliquez sur l'icône 🦣 dans la barre d'activité
- Raccourci : `Ctrl+Shift+M`

### Commandes (clic droit sur une sélection)
- **Expliquer la sélection** — Demande à l'agent d'expliquer le code sélectionné
- **Corriger la sélection** — Demande à l'agent de corriger le code sélectionné

### Outils de l'agent

| Outil | Description |
|---|---|
| `read_file` | Lire un fichier |
| `write_file` | Créer ou écraser un fichier |
| `replace_in_file` | Modifier une partie d'un fichier |
| `list_files` | Lister un dossier |
| `search_in_files` | Chercher du texte dans les fichiers |
| `get_open_file` | Obtenir le fichier ouvert dans l'éditeur |
| `run_terminal_command` | Exécuter une commande (confirmation requise) |

> Les opérations d'écriture et les commandes demandent toujours une confirmation avant d'être exécutées.

## Packaging (optionnel)

```bash
npm install -g @vscode/vsce
vsce package
# → génère mammouth-code-0.1.0.vsix
```
