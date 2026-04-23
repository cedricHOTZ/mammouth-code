import * as https from 'https';
import * as http from 'http';
import * as vscode from 'vscode';

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: Record<string, unknown>;
            required?: string[];
        };
    };
}

export interface ChatResponse {
    choices: {
        message: {
            role: string;
            content: string | null;
            tool_calls?: ToolCall[];
        };
        finish_reason: string;
    }[];
    error?: { message: string };
}

export class MammouthClient {
    private getConfig() {
        const config = vscode.workspace.getConfiguration('mammouth');
        return {
            apiKey: config.get<string>('apiKey', ''),
            model: config.get<string>('model', 'claude-sonnet-4-6'),
            endpoint: config.get<string>('apiEndpoint', 'https://api.mammouth.ai/v1/chat/completions'),
            maxTokens: config.get<number>('maxTokens', 8192),
        };
    }

    async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ChatResponse> {
        const { apiKey, model, endpoint, maxTokens } = this.getConfig();

        if (!apiKey) {
            throw new Error(
                'Clé API Mammouth non configurée.\n' +
                'Allez dans Fichier → Préférences → Paramètres et cherchez "mammouth.apiKey".'
            );
        }

        const body: Record<string, unknown> = {
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.7,
        };

        if (tools && tools.length > 0) {
            body['tools'] = tools;
            body['tool_choice'] = 'auto';
        }

        const url = new URL(endpoint);
        const isHttps = url.protocol === 'https:';
        const port = url.port ? parseInt(url.port) : (isHttps ? 443 : 80);

        const options = {
            hostname: url.hostname,
            port,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        };

        const bodyStr = JSON.stringify(body);

        return new Promise((resolve, reject) => {
            const lib = isHttps ? https : http;
            const req = lib.request(options, (res: http.IncomingMessage) => {
                let data = '';
                res.on('data', (chunk: Buffer) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed: ChatResponse = JSON.parse(data);
                        if (res.statusCode !== 200) {
                            const errMsg = parsed.error?.message || `HTTP ${res.statusCode}: ${data}`;
                            reject(new Error(errMsg));
                        } else {
                            resolve(parsed);
                        }
                    } catch {
                        reject(new Error(`Réponse invalide de l'API: ${data.slice(0, 200)}`));
                    }
                });
            });

            req.on('error', (err: Error) => reject(new Error(`Erreur réseau: ${err.message}`)));
            req.write(bodyStr);
            req.end();
        });
    }
}
