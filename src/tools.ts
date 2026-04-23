import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition } from './mammouthClient';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    {
        type: 'function',
        function: {
            name: 'read_file',
            description: 'Lire le contenu d\'un fichier dans le workspace',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Chemin du fichier (relatif au workspace ou absolu)'
                    }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'write_file',
            description: 'Créer ou écraser complètement un fichier. Utiliser replace_in_file pour des modifications partielles.',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Chemin du fichier (relatif au workspace)'
                    },
                    content: {
                        type: 'string',
                        description: 'Contenu complet à écrire dans le fichier'
                    }
                },
                required: ['path', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'replace_in_file',
            description: 'Remplacer un texte spécifique dans un fichier sans réécrire tout le fichier. Idéal pour les modifications précises.',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Chemin du fichier'
                    },
                    old_text: {
                        type: 'string',
                        description: 'Texte exact à remplacer (doit être unique dans le fichier)'
                    },
                    new_text: {
                        type: 'string',
                        description: 'Nouveau texte qui remplace l\'ancien'
                    }
                },
                required: ['path', 'old_text', 'new_text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_files',
            description: 'Lister les fichiers dans un dossier du workspace',
            parameters: {
                type: 'object',
                properties: {
                    dir: {
                        type: 'string',
                        description: 'Dossier à lister (relatif au workspace, utilise "." pour la racine)'
                    },
                    recursive: {
                        type: 'boolean',
                        description: 'Lister récursivement les sous-dossiers (défaut: false)'
                    }
                },
                required: ['dir']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_in_files',
            description: 'Chercher du texte dans les fichiers du workspace',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Texte à chercher (insensible à la casse)'
                    },
                    file_pattern: {
                        type: 'string',
                        description: 'Pattern de fichiers glob (ex: **/*.ts, **/*.php). Défaut: **/*'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_open_file',
            description: 'Obtenir le contenu et le chemin du fichier actuellement ouvert dans l\'éditeur',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'run_terminal_command',
            description: 'Exécuter une commande dans le terminal intégré VSCode. L\'utilisateur doit approuver avant l\'exécution.',
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'Commande à exécuter dans le terminal'
                    }
                },
                required: ['command']
            }
        }
    }
];

function getWorkspaceRoot(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
}

function resolvePath(filePath: string): string {
    const root = getWorkspaceRoot();
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    return root ? path.join(root, filePath) : filePath;
}

function listFilesRecursive(dir: string, recursive: boolean, root: string, results: string[] = []): string[] {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'vendor') {
                continue;
            }
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (recursive) {
                    listFilesRecursive(fullPath, true, root, results);
                } else {
                    results.push(path.relative(root, fullPath) + '/');
                }
            } else {
                results.push(path.relative(root, fullPath));
            }
        }
    } catch { /* ignore permission errors */ }
    return results;
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    const workspaceRoot = getWorkspaceRoot();

    switch (name) {
        case 'read_file': {
            const filePath = resolvePath(args['path'] as string);
            try {
                const stat = fs.statSync(filePath);
                if (stat.size > 500_000) {
                    return `Fichier trop grand (${Math.round(stat.size / 1024)}KB). Utilisez search_in_files pour trouver ce dont vous avez besoin.`;
                }
                return fs.readFileSync(filePath, 'utf-8');
            } catch (e: unknown) {
                return `Erreur: ${(e as Error).message}`;
            }
        }

        case 'write_file': {
            const filePath = resolvePath(args['path'] as string);
            const content = args['content'] as string;
            const relPath = workspaceRoot ? path.relative(workspaceRoot, filePath) : filePath;
            const isNew = !fs.existsSync(filePath);

            try {
                const uri = vscode.Uri.file(filePath);
                const edit = new vscode.WorkspaceEdit();

                if (isNew) {
                    // Create directories if needed
                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    edit.createFile(uri, { overwrite: true });
                    edit.insert(uri, new vscode.Position(0, 0), content);
                } else {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    const fullRange = new vscode.Range(
                        doc.positionAt(0),
                        doc.positionAt(doc.getText().length)
                    );
                    edit.replace(uri, fullRange, content);
                }

                await vscode.workspace.applyEdit(edit);
                await vscode.window.showTextDocument(uri, { preview: false });

                return `✓ Fichier ${relPath} ${isNew ? 'créé' : 'mis à jour'} avec succès.`;
            } catch (e: unknown) {
                return `Erreur: ${(e as Error).message}`;
            }
        }

        case 'replace_in_file': {
            const filePath = resolvePath(args['path'] as string);
            const oldText = args['old_text'] as string;
            const newText = args['new_text'] as string;
            const relPath = workspaceRoot ? path.relative(workspaceRoot, filePath) : filePath;

            try {
                const uri = vscode.Uri.file(filePath);
                const doc = await vscode.workspace.openTextDocument(uri);
                const content = doc.getText();
                const occurrences = content.split(oldText).length - 1;

                if (occurrences === 0) {
                    return `Erreur: Texte introuvable dans ${relPath}. Vérifiez que le texte est exact (espaces, retours à la ligne).`;
                }

                if (occurrences > 1) {
                    return `Erreur: Le texte apparaît ${occurrences} fois dans ${relPath}. Fournissez plus de contexte pour le rendre unique.`;
                }

                const idx = content.indexOf(oldText);
                const startPos = doc.positionAt(idx);
                const endPos = doc.positionAt(idx + oldText.length);

                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, new vscode.Range(startPos, endPos), newText);
                await vscode.workspace.applyEdit(edit);
                await vscode.window.showTextDocument(uri, { preview: false });

                return `✓ Modification appliquée dans ${relPath}.`;
            } catch (e: unknown) {
                return `Erreur: ${(e as Error).message}`;
            }
        }

        case 'list_files': {
            const dirPath = resolvePath(args['dir'] as string);
            const recursive = (args['recursive'] as boolean) ?? false;

            try {
                const files = listFilesRecursive(dirPath, recursive, workspaceRoot || dirPath);
                if (files.length === 0) {
                    return 'Dossier vide ou introuvable.';
                }
                return files.join('\n');
            } catch (e: unknown) {
                return `Erreur: ${(e as Error).message}`;
            }
        }

        case 'search_in_files': {
            const query = args['query'] as string;
            const pattern = (args['file_pattern'] as string) || '**/*';

            try {
                const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 100);
                const matches: string[] = [];

                for (const file of files) {
                    try {
                        const stat = fs.statSync(file.fsPath);
                        if (stat.size > 200_000) continue;

                        const content = fs.readFileSync(file.fsPath, 'utf-8');
                        const lines = content.split('\n');
                        const relPath = path.relative(workspaceRoot, file.fsPath);

                        lines.forEach((line, i) => {
                            if (line.toLowerCase().includes(query.toLowerCase())) {
                                matches.push(`${relPath}:${i + 1}: ${line.trim()}`);
                            }
                        });
                    } catch { /* ignore unreadable files */ }
                }

                if (matches.length === 0) {
                    return `Aucun résultat pour "${query}".`;
                }

                const result = matches.slice(0, 100).join('\n');
                if (matches.length > 100) {
                    return result + `\n\n... et ${matches.length - 100} résultats supplémentaires.`;
                }
                return result;
            } catch (e: unknown) {
                return `Erreur: ${(e as Error).message}`;
            }
        }

        case 'get_open_file': {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return 'Aucun fichier ouvert dans l\'éditeur.';
            }
            const doc = editor.document;
            const content = doc.getText();
            const relPath = workspaceRoot
                ? path.relative(workspaceRoot, doc.fileName)
                : doc.fileName;
            const lang = doc.languageId;

            // Include selection if any
            const selection = editor.selection;
            let selectionInfo = '';
            if (!selection.isEmpty) {
                const selectedText = doc.getText(selection);
                selectionInfo = `\nSélection (lignes ${selection.start.line + 1}-${selection.end.line + 1}):\n\`\`\`${lang}\n${selectedText}\n\`\`\`\n`;
            }

            return `Fichier: ${relPath} (${lang})\n${selectionInfo}\nContenu complet:\n\`\`\`${lang}\n${content}\n\`\`\``;
        }

        case 'run_terminal_command': {
            const command = args['command'] as string;

            const confirm = await vscode.window.showWarningMessage(
                `Mammouth veut exécuter dans le terminal:\n${command}`,
                { modal: true },
                'Exécuter',
                'Annuler'
            );

            if (confirm !== 'Exécuter') {
                return 'Commande annulée par l\'utilisateur.';
            }

            let terminal = vscode.window.terminals.find(t => t.name === 'Mammouth');
            if (!terminal || terminal.exitStatus !== undefined) {
                terminal = vscode.window.createTerminal('Mammouth');
            }
            terminal.show(true);
            terminal.sendText(command);

            return `✓ Commande envoyée au terminal "Mammouth": ${command}`;
        }

        default:
            return `Outil inconnu: ${name}`;
    }
}
