#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/.tmp/vscode-app"
ARCHIVE_PATH="$ROOT_DIR/.tmp/vscode-linux-x64.tar.gz"
CODE_BIN="$APP_DIR/VSCode-linux-x64/bin/code"
DOWNLOAD_URL="https://update.code.visualstudio.com/latest/linux-x64/stable"

if [[ -x "$CODE_BIN" ]]; then
  printf '%s\n' "$CODE_BIN"
  exit 0
fi

mkdir -p "$ROOT_DIR/.tmp"
rm -rf "$APP_DIR"

echo "Downloading VS Code from $DOWNLOAD_URL" >&2
curl -L "$DOWNLOAD_URL" -o "$ARCHIVE_PATH" >&2
mkdir -p "$APP_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$APP_DIR" >&2

printf '%s\n' "$CODE_BIN"
