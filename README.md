# Custom Screen VS Code Extension

This repository contains a VS Code extension that opens a focused **Custom Screen** webview after startup.

## How it works

- The extension activates on `onStartupFinished` and contributes a `customScreen.show` command.
- The extension is marked as a UI extension (`"extensionKind": ["ui"]`) so the start screen runs in the VS Code window that owns the webview.
- The startup script installs the extension into an isolated `--extensions-dir`, verifies the install with `code --list-extensions --show-versions`, and only then launches VS Code.

## Install the extension into an isolated extensions directory

```bash
bash scripts/install-extension.sh
```

This copies the unpacked extension into `.tmp/code-extensions/<publisher>.<name>-<version>` so the VS Code CLI can discover it as an installed extension.

## Start the extension with the `code` CLI

```bash
bash scripts/start-extension.sh
```

The startup script:

1. Verifies that the VS Code CLI is available.
2. Installs the unpacked extension into an isolated extensions directory.
3. Runs `code --list-extensions --show-versions` against that directory to confirm the extension is installed.
4. Launches VS Code with that extensions directory and waits for the extension to log that the webview is visible.

If `code` is not on `PATH`, set `CODE_BIN` to the full path of the VS Code CLI executable before running the script.

## Dev Container

The dev container installs the VS Code CLI and Xvfb. Its `postCreateCommand` runs the startup script so the extension install and startup flow are exercised automatically after the container is created.
