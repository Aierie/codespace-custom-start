const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const FLAG_RELATIVE_PATH = ['.vscode', 'open-custom-screen'];
const FLAG_GLOB = `**/${FLAG_RELATIVE_PATH.join('/')}`;
const VIEW_TYPE = 'customScreen';

let currentPanel;

function getLogFile(context) {
  const logDir = path.join(context.extensionPath, '.tmp', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, 'extension.log');
}

function log(context, message) {
  const logFile = getLogFile(context);
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);
}

function getNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';

  for (let index = 0; index < 32; index += 1) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return nonce;
}

function getWorkspaceFolder() {
  return vscode.workspace.workspaceFolders?.[0];
}

function getFlagUri() {
  const folder = getWorkspaceFolder();
  if (!folder) {
    return undefined;
  }

  return vscode.Uri.joinPath(folder.uri, ...FLAG_RELATIVE_PATH);
}

function getWebviewOptions(extensionUri) {
  return {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
  };
}

function renderHtml(webview, extensionUri) {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
  const nonce = getNonce();

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Custom Screen</title>
      <style>
        :root {
          color-scheme: light dark;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: var(--vscode-font-family);
          display: grid;
          place-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 24px;
          background:
            radial-gradient(circle at top, var(--vscode-textBlockQuote-background, rgba(127, 127, 127, 0.12)), transparent 60%),
            var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }

        main {
          width: min(720px, 100%);
          border: 1px solid var(--vscode-panel-border, transparent);
          border-radius: 16px;
          padding: 32px;
          background: var(--vscode-sideBar-background, var(--vscode-editor-background));
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
        }

        .eyebrow {
          display: inline-flex;
          margin-bottom: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0 0 16px;
          font-size: clamp(2rem, 5vw, 2.75rem);
          font-weight: 700;
        }

        p {
          margin: 0 0 16px;
          line-height: 1.6;
          font-size: 1rem;
        }

        .status {
          margin-top: 24px;
          padding: 16px;
          border-radius: 12px;
          background: var(--vscode-editor-inactiveSelectionBackground, rgba(127, 127, 127, 0.16));
          color: var(--vscode-descriptionForeground);
        }

        code {
          font-family: var(--vscode-editor-font-family);
        }
      </style>
    </head>
    <body>
      <main>
        <div class="eyebrow">Custom Screen</div>
        <h1>Your webview is running.</h1>
        <p>This panel was created by the UI extension host after detecting the devcontainer startup marker file or the <code>customScreen.show</code> command.</p>
        <p>The implementation follows the VS Code webview sample pattern: a single reusable panel, explicit webview options, a CSP, and a script that can talk back to the extension host.</p>
        <div class="status" id="status">Waiting for webview script bootstrap…</div>
      </main>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
  </html>`;
}

async function consumeStartupFlag(context) {
  const flagUri = getFlagUri();
  if (!flagUri) {
    log(context, 'startup-flag-skipped-no-workspace');
    return false;
  }

  try {
    await vscode.workspace.fs.stat(flagUri);
  } catch {
    return false;
  }

  try {
    await vscode.workspace.fs.delete(flagUri, { useTrash: false });
    log(context, `startup-flag-consumed ${flagUri.fsPath}`);
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    log(context, `startup-flag-delete-failed ${message}`);
  }

  return true;
}

class CustomScreenPanel {
  static createOrShow(context) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (currentPanel) {
      currentPanel._panel.reveal(column);
      log(context, 'custom-screen-revealed');
      return currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      'Custom Screen',
      column,
      getWebviewOptions(context.extensionUri)
    );

    currentPanel = new CustomScreenPanel(panel, context);
    log(context, 'custom-screen-created');
    return currentPanel;
  }

  constructor(panel, context) {
    this._panel = panel;
    this._context = context;
    this._disposables = [];

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.onDidChangeViewState(() => {
      if (this._panel.visible) {
        log(this._context, 'custom-screen-visible');
      }
    }, null, this._disposables);

    this._panel.webview.onDidReceiveMessage(message => {
      if (message?.command === 'ready') {
        log(this._context, 'webview-ready');
      }
    }, null, this._disposables);
  }

  _update() {
    this._panel.webview.html = renderHtml(this._panel.webview, this._context.extensionUri);
    this._panel.reveal(this._panel.viewColumn ?? vscode.ViewColumn.One, false);
    log(this._context, 'custom-screen-visible');
  }

  dispose() {
    currentPanel = undefined;

    while (this._disposables.length > 0) {
      const disposable = this._disposables.pop();
      disposable?.dispose();
    }

    log(this._context, 'custom-screen-disposed');
  }
}

async function maybeOpenFromStartupFlag(context) {
  const consumed = await consumeStartupFlag(context);
  if (!consumed) {
    return;
  }

  CustomScreenPanel.createOrShow(context);
}

function activate(context) {
  log(context, 'extension-activated');

  const watcher = vscode.workspace.createFileSystemWatcher(FLAG_GLOB);

  context.subscriptions.push(
    vscode.commands.registerCommand('customScreen.show', () => CustomScreenPanel.createOrShow(context)),
    watcher,
    watcher.onDidCreate(() => {
      log(context, 'startup-flag-created');
      void maybeOpenFromStartupFlag(context);
    }),
    watcher.onDidChange(() => {
      log(context, 'startup-flag-changed');
      void maybeOpenFromStartupFlag(context);
    })
  );

  void maybeOpenFromStartupFlag(context).catch(error => {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    log(context, `startup-flag-check-error ${message}`);
  });
}

function deactivate() {
  currentPanel = undefined;
}

module.exports = {
  activate,
  deactivate
};
