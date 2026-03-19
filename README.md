# Custom Screen VS Code Extension

This repository contains a basic VS Code extension that opens a focused webview labeled **Custom Screen** as soon as the extension activates.

## Start the extension with the `code` CLI

```bash
bash scripts/start-extension.sh
```

The startup script launches VS Code with the repository as an extension development path, waits for the extension to log that the webview is visible, and then exits successfully.

## Dev Container

The dev container defined in `.devcontainer/devcontainer.json` builds an image with the VS Code CLI and Xvfb installed. Its `postCreateCommand` runs the same startup script so the extension is exercised automatically after the container is created.
