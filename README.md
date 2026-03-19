# Custom Screen VS Code Extension

This repository contains a VS Code extension that opens a focused **Custom Screen** webview when a devcontainer lifecycle hook drops a workspace marker file.

## How it works

- The extension activates on `onStartupFinished` and contributes a `customScreen.show` command.
- The extension is marked as a UI extension (`"extensionKind": ["ui"]`) so the webview is created by the VS Code window that owns the UI.
- The devcontainer `postCreateCommand` runs `.devcontainer/post-create.sh`, which creates `.vscode/open-custom-screen`.
- On startup, the extension checks for that marker, deletes it, and opens the webview exactly once.
- A workspace file watcher also handles the case where the marker is created after the extension host has already activated.

## Assumptions

- This is a single-root workspace.
- The extension is already installed in the VS Code client that opens the devcontainer.
- If you publish the extension, you can also list its marketplace identifier under `customizations.vscode.extensions`.

## Open the webview manually

Run **Show Custom Screen** from the Command Palette, or invoke:

```bash
code --command customScreen.show
```

## Dev Container

The dev container uses the marker-file pattern instead of trying to open editor UI from a container lifecycle script:

1. `postCreateCommand` creates `.vscode/open-custom-screen`.
2. The VS Code extension host activates the extension.
3. The extension consumes the marker and calls `createWebviewPanel` from the UI side.

This keeps the container lifecycle responsible only for filesystem state, while the extension remains responsible for UI creation.
