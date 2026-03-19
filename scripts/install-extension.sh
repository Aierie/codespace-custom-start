#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-$ROOT_DIR/.tmp/code-extensions}"
TMP_DIR="$ROOT_DIR/.tmp"
LOG_DIR="$TMP_DIR/logs"
PACKAGE_NAME="$(node -p "require('$ROOT_DIR/package.json').name")"
PACKAGE_VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
VSIX_PATH="${2:-$ROOT_DIR/$PACKAGE_NAME-$PACKAGE_VERSION.vsix}"
CLI_BIN="${CODE_BIN:-$($ROOT_DIR/scripts/ensure-vscode.sh)}"

mkdir -p "$TARGET_DIR" "$LOG_DIR"

npm run package:vsix >"$LOG_DIR/package.log" 2>&1

if [[ ! -f "$VSIX_PATH" ]]; then
  echo "Expected VSIX was not created at $VSIX_PATH" >&2
  cat "$LOG_DIR/package.log" >&2 || true
  exit 1
fi

env -u VSCODE_IPC_HOOK_CLI -u VSCODE_GIT_IPC_HANDLE \
  "$CLI_BIN" \
  --user-data-dir "$TMP_DIR/code-user-data" \
  --extensions-dir "$TARGET_DIR" \
  --install-extension "$VSIX_PATH" \
  --force >"$LOG_DIR/install.log" 2>&1

printf 'Built VSIX: %s\n' "$VSIX_PATH"
printf 'Installed VSIX into: %s\n' "$TARGET_DIR"
