import * as vscode from 'vscode';
import { ChatViewProvider } from './chatPanel';

export function activate(context: vscode.ExtensionContext): void {
    const provider = new ChatViewProvider(context.extensionUri, context);

    // Register the sidebar webview
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            provider,
            {
                // Keep chat alive when switching tabs
                webviewOptions: { retainContextWhenHidden: true },
            }
        )
    );

    // Command: open the Mammouth sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('mammouth.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.mammouth');
        })
    );

    // Command: new conversation
    context.subscriptions.push(
        vscode.commands.registerCommand('mammouth.newChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.mammouth');
        })
    );

    // Command: explain selected code
    context.subscriptions.push(
        vscode.commands.registerCommand('mammouth.explainSelection', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Aucun fichier ouvert.');
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (!selection.trim()) {
                vscode.window.showWarningMessage('Sélectionnez du code à expliquer.');
                return;
            }

            const lang = editor.document.languageId;
            const relPath = vscode.workspace.asRelativePath(editor.document.fileName);

            const message = `Explique ce code (fichier: ${relPath}):\n\`\`\`${lang}\n${selection}\n\`\`\``;

            await vscode.commands.executeCommand('workbench.view.extension.mammouth');
            provider.sendPrefill(message);
        })
    );

    // Command: fix selected code
    context.subscriptions.push(
        vscode.commands.registerCommand('mammouth.fixSelection', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Aucun fichier ouvert.');
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (!selection.trim()) {
                vscode.window.showWarningMessage('Sélectionnez du code à corriger.');
                return;
            }

            const lang = editor.document.languageId;
            const relPath = vscode.workspace.asRelativePath(editor.document.fileName);

            const message = `Corrige ce code (fichier: ${relPath}):\n\`\`\`${lang}\n${selection}\n\`\`\``;

            await vscode.commands.executeCommand('workbench.view.extension.mammouth');
            provider.sendPrefill(message);
        })
    );
}

export function deactivate(): void {
    // Nothing to clean up
}
