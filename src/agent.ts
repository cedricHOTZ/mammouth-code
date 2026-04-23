import { MammouthClient, Message } from './mammouthClient';
import { TOOL_DEFINITIONS, executeTool } from './tools';

export type AgentEvent =
    | { type: 'thinking' }
    | { type: 'tool_call'; name: string; args: Record<string, unknown> }
    | { type: 'tool_result'; name: string; result: string }
    | { type: 'message'; content: string }
    | { type: 'error'; message: string }
    | { type: 'done' };

export type AgentCallback = (event: AgentEvent) => void;

const SYSTEM_PROMPT = `Tu es Mammouth Code, un agent de développement IA intégré dans VSCode.
Tu aides les développeurs à écrire, comprendre et améliorer leur code.

Tu as accès aux outils suivants pour interagir avec le workspace:
- read_file: Lire le contenu d'un fichier
- write_file: Créer ou écraser un fichier complet
- replace_in_file: Modifier une partie précise d'un fichier (préféré pour les petites modifications)
- list_files: Lister les fichiers d'un dossier
- search_in_files: Chercher du texte dans les fichiers
- get_open_file: Obtenir le fichier actuellement ouvert dans l'éditeur
- run_terminal_command: Exécuter une commande dans le terminal

Comportement:
1. Avant de modifier un fichier, lis-le d'abord pour comprendre le contexte
2. Utilise replace_in_file pour les modifications précises (plutôt que réécrire tout le fichier)
3. Explique brièvement ce que tu fais et pourquoi
4. Si tu n'es pas sûr d'un chemin de fichier, utilise list_files pour explorer

Réponds en français sauf si l'utilisateur écrit dans une autre langue.`;

export class Agent {
    private client: MammouthClient;
    private history: Message[] = [];

    constructor() {
        this.client = new MammouthClient();
    }

    reset(): void {
        this.history = [];
    }

    getHistory(): Message[] {
        return this.history;
    }

    async run(userMessage: string, callback: AgentCallback): Promise<void> {
        this.history.push({ role: 'user', content: userMessage });

        const messages: Message[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...this.history
        ];

        const MAX_ITERATIONS = 15;
        let iterations = 0;

        while (iterations < MAX_ITERATIONS) {
            iterations++;
            callback({ type: 'thinking' });

            try {
                const response = await this.client.chat(messages, TOOL_DEFINITIONS);
                const choice = response.choices?.[0];

                if (!choice) {
                    callback({ type: 'error', message: 'Réponse vide de l\'API.' });
                    callback({ type: 'done' });
                    return;
                }

                const assistantMsg = choice.message;

                // Save to history and messages array
                const historyEntry: Message = {
                    role: 'assistant',
                    content: assistantMsg.content ?? null,
                    tool_calls: assistantMsg.tool_calls,
                };
                this.history.push(historyEntry);
                messages.push(historyEntry);

                // If there are tool calls, execute them
                if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                    // Emit any text content that came with the tool calls
                    if (assistantMsg.content) {
                        callback({ type: 'message', content: assistantMsg.content });
                    }

                    for (const toolCall of assistantMsg.tool_calls) {
                        const toolName = toolCall.function.name;
                        let toolArgs: Record<string, unknown>;

                        try {
                            toolArgs = JSON.parse(toolCall.function.arguments);
                        } catch {
                            toolArgs = {};
                        }

                        callback({ type: 'tool_call', name: toolName, args: toolArgs });

                        const result = await executeTool(toolName, toolArgs);

                        callback({ type: 'tool_result', name: toolName, result });

                        const toolResultMsg: Message = {
                            role: 'tool',
                            content: result,
                            tool_call_id: toolCall.id,
                        };
                        this.history.push(toolResultMsg);
                        messages.push(toolResultMsg);
                    }

                    // Continue the loop so the model can process tool results
                    continue;
                }

                // No tool calls = final response
                if (assistantMsg.content) {
                    callback({ type: 'message', content: assistantMsg.content });
                }

                callback({ type: 'done' });
                return;

            } catch (error: unknown) {
                callback({ type: 'error', message: (error as Error).message });
                callback({ type: 'done' });
                return;
            }
        }

        callback({ type: 'error', message: 'Nombre maximum d\'itérations atteint (15). La tâche est peut-être trop complexe.' });
        callback({ type: 'done' });
    }
}
