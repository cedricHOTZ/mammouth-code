import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Agent } from './agent';

function getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'mammouth.chatView';

    private _view?: vscode.WebviewView;
    private agent: Agent;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly context: vscode.ExtensionContext
    ) {
        this.agent = new Agent();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = this.buildHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data: { type: string; message?: string }) => {
            switch (data.type) {
                case 'send_message':
                    if (data.message) {
                        await this.handleUserMessage(data.message);
                    }
                    break;
                case 'reset':
                    this.agent.reset();
                    break;
            }
        });
    }

    /**
     * Called from extension commands to pre-fill the chat input with a message
     * and focus the chat panel.
     */
    public sendPrefill(message: string): void {
        this._view?.webview.postMessage({ type: 'prefill', message });
    }

    private async handleUserMessage(message: string): Promise<void> {
        if (!this._view) return;
        const webview = this._view.webview;

        await this.agent.run(message, (event) => {
            webview.postMessage(event);
        });
    }

    private buildHtml(webview: vscode.Webview): string {
        const htmlPath = path.join(this.extensionUri.fsPath, 'media', 'chat.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        const nonce = getNonce();
        html = html.replace(/\{\{NONCE\}\}/g, nonce);

        // Replace any resource URIs if needed in the future
        // const baseUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media'));
        // html = html.replace(/\{\{MEDIA_URI\}\}/g, baseUri.toString());

        return html;
    }
}
