const vscode = acquireVsCodeApi();

const statusElement = document.getElementById('status');

if (statusElement) {
  statusElement.textContent = 'Webview bootstrap complete.';
}

vscode.postMessage({
  command: 'ready'
});
