# Mammouth Code — Extension VSCode

> Agent IA de développement intégré dans VSCode, propulsé par [Mammouth IA](https://mammouth.ai).

Mammouth Code vous permet de dialoguer avec une IA directement dans votre éditeur, d'expliquer ou corriger du code en un clic, et de laisser l'agent manipuler vos fichiers et exécuter des commandes à votre place.

---

## Fonctionnalités

### Chat intégré
- Panneau de conversation dans la barre latérale
- Raccourci clavier : `Ctrl+Shift+M` (ou `Cmd+Shift+M` sur Mac)
- Nouvelle conversation via `Mammouth: Nouvelle conversation`

### Commandes sur la sélection (clic droit)
- **Expliquer la sélection** — L'agent explique le code sélectionné
- **Corriger la sélection** — L'agent propose une correction du code sélectionné

### Outils de l'agent

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

## Installation depuis le Marketplace

1. Ouvrez VSCode
2. Allez dans l'onglet Extensions (`Ctrl+Shift+X`)
3. Cherchez **Mammouth Code**
4. Cliquez **Installer**

---

## Configuration

Ouvrez les paramètres VSCode (`Ctrl+,`) et cherchez **mammouth** :

| Paramètre | Description | Valeur par défaut |
|---|---|---|
| `mammouth.apiKey` | **Obligatoire** — Votre clé API Mammouth | _(vide)_ |
| `mammouth.model` | Modèle IA à utiliser | `claude-sonnet-4-6` |
| `mammouth.apiEndpoint` | URL de l'API | `https://api.mammouth.ai/v1/chat/completions` |
| `mammouth.maxTokens` | Nombre maximum de tokens par réponse | `8192` |

Obtenez votre clé API sur [mammouth.ai](https://mammouth.ai).

---

## Installation en développement

```bash
# 1. Cloner le dépôt
git clone https://github.com/domoweb/mammouth-code.git
cd mammouth-code

# 2. Installer les dépendances
npm install

# 3. Compiler
npm run compile

# 4. Lancer l'extension en mode développement
# Appuyez sur F5 dans VSCode (ouvre une fenêtre de débogage)
# ou : Ctrl+Shift+P → "Debug: Start Debugging"
```

## Packaging

```bash
npm install -g @vscode/vsce
vsce package
# → génère mammouth-code-0.1.0.vsix
```

---

## Éditeur

Développé par **[domoweb](https://github.com/domoweb)**.

## Licence

MIT
