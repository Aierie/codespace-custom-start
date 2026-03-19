const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

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
        body {
          font-family: var(--vscode-font-family);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <h1>Custom Screen</h1>
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

function activate(context) {
  log(context, 'extension-activated');

  context.subscriptions.push(
    vscode.commands.registerCommand('customScreen.show', () => showCustomScreen(context))
  );

  setTimeout(() => {
    showCustomScreen(context);
  }, 0);
}

function deactivate() {
  panel = undefined;
}

module.exports = {
  activate,
  deactivate
};
