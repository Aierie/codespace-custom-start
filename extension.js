const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const FLAG_RELATIVE_PATH = ['.vscode', 'open-custom-screen'];
const FLAG_GLOB = `**/${FLAG_RELATIVE_PATH.join('/')}`;

let panel;

function getLogFile(context) {
  const logDir = path.join(context.extensionPath, '.tmp', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, 'extension.log');
}

function log(context, message) {
  const logFile = getLogFile(context);
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);
}

function renderHtml() {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Custom Screen</title>
      <style>
        :root {
          color-scheme: light dark;
        }

        body {
          font-family: var(--vscode-font-family);
          display: grid;
          place-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 24px;
          box-sizing: border-box;
          background: radial-gradient(circle at top, var(--vscode-textBlockQuote-background, rgba(127, 127, 127, 0.12)), transparent 60%), var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }

        main {
          max-width: 720px;
          border: 1px solid var(--vscode-panel-border, transparent);
          border-radius: 16px;
          padding: 32px;
          background: var(--vscode-sideBar-background, var(--vscode-editor-background));
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
        }

        h1 {
          margin: 0 0 16px;
          font-size: 2.5rem;
          font-weight: 700;
        }

        p {
          margin: 0;
          line-height: 1.6;
          font-size: 1rem;
        }
      </style>
    </head>
    <body>
      <main>
        <h1>Custom Screen</h1>
        <p>Your start screen extension detected the devcontainer marker file and opened this webview in the VS Code UI extension host.</p>
      </main>
    </body>
  </html>`;
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

function showCustomScreen(context) {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Active, false);
    log(context, 'custom-screen-revealed');
    return panel;
  }

  panel = vscode.window.createWebviewPanel(
    'customScreen',
    'Custom Screen',
    {
      viewColumn: vscode.ViewColumn.Active,
      preserveFocus: false
    },
    {
      enableScripts: false,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = renderHtml();
  panel.reveal(vscode.ViewColumn.Active, false);
  log(context, 'custom-screen-visible');

  panel.onDidDispose(() => {
    panel = undefined;
    log(context, 'custom-screen-disposed');
  });

  return panel;
}

async function maybeOpenFromStartupFlag(context) {
  const consumed = await consumeStartupFlag(context);
  if (!consumed) {
    return;
  }

  showCustomScreen(context);
}

function activate(context) {
  log(context, 'extension-activated');

  const watcher = vscode.workspace.createFileSystemWatcher(FLAG_GLOB);

  context.subscriptions.push(
    vscode.commands.registerCommand('customScreen.show', () => showCustomScreen(context)),
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
  panel = undefined;
}

module.exports = {
  activate,
  deactivate
};
