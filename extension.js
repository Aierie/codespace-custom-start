const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

let panel;
let startupScreenOpened = false;

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
        <p>Your start screen extension is installed, activated on startup, and running in the VS Code UI extension host.</p>
      </main>
    </body>
  </html>`;
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

async function waitForWindowFocus(context) {
  if (vscode.window.state.focused) {
    return;
  }

  log(context, 'waiting-for-window-focus');

  await new Promise(resolve => {
    const timeout = setTimeout(() => {
      disposable.dispose();
      log(context, 'window-focus-timeout');
      resolve();
    }, 2000);

    const disposable = vscode.window.onDidChangeWindowState(state => {
      if (state.focused) {
        clearTimeout(timeout);
        disposable.dispose();
        resolve();
      }
    });
  });
}

async function openStartupScreen(context) {
  if (startupScreenOpened) {
    log(context, 'startup-screen-already-opened');
    return;
  }

  startupScreenOpened = true;
  await waitForWindowFocus(context);
  showCustomScreen(context);
}

function activate(context) {
  log(context, 'extension-activated');

  context.subscriptions.push(
    vscode.commands.registerCommand('customScreen.show', () => showCustomScreen(context))
  );

  void openStartupScreen(context).catch(error => {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    log(context, `startup-screen-error ${message}`);
  });
}

function deactivate() {
  panel = undefined;
}

module.exports = {
  activate,
  deactivate
};
