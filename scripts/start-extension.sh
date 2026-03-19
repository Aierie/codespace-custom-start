#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp"
LOG_DIR="$TMP_DIR/logs"
CODE_LOG="$LOG_DIR/code.log"
EXT_LOG="$LOG_DIR/extension.log"
DISPLAY_NUM="${DISPLAY_NUM:-:99}"
CODE_BIN="${CODE_BIN:-$(command -v code || true)}"
EXTENSION_ID="$(node -p "const pkg = require('$ROOT_DIR/package.json'); pkg.publisher + '.' + pkg.name")"
EXTENSION_VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"

if [[ -z "$CODE_BIN" ]]; then
  cat >&2 <<'MSG'
Unable to find the VS Code CLI (`code`) in PATH.
Install VS Code or set CODE_BIN to the full path of the CLI, then rerun this script.
MSG
  exit 1
fi

mkdir -p "$TMP_DIR/code-user-data" "$TMP_DIR/code-extensions" "$LOG_DIR"
rm -f "$CODE_LOG" "$EXT_LOG"

bash "$ROOT_DIR/scripts/install-extension.sh" "$TMP_DIR/code-extensions" >"$LOG_DIR/install.log"

if ! "$CODE_BIN" \
  --extensions-dir "$TMP_DIR/code-extensions" \
  --list-extensions \
  --show-versions >"$LOG_DIR/extensions.txt" 2>&1; then
  echo 'Failed to list installed extensions via the VS Code CLI.' >&2
  cat "$LOG_DIR/extensions.txt" >&2 || true
  exit 1
fi

if ! grep -q "^$EXTENSION_ID@$EXTENSION_VERSION$" "$LOG_DIR/extensions.txt"; then
  echo "Expected installed extension $EXTENSION_ID@$EXTENSION_VERSION was not found." >&2
  echo '--- extension listing ---' >&2
  cat "$LOG_DIR/extensions.txt" >&2 || true
  exit 1
fi

cleanup() {
  if [[ -n "${XVFB_PID:-}" ]] && kill -0 "$XVFB_PID" 2>/dev/null; then
    kill "$XVFB_PID" 2>/dev/null || true
    wait "$XVFB_PID" 2>/dev/null || true
  fi

  if [[ -n "${CODE_PID:-}" ]] && kill -0 "$CODE_PID" 2>/dev/null; then
    kill "$CODE_PID" 2>/dev/null || true
    wait "$CODE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

Xvfb "$DISPLAY_NUM" -screen 0 1280x720x24 >"$LOG_DIR/xvfb.log" 2>&1 &
XVFB_PID=$!
export DISPLAY="$DISPLAY_NUM"
sleep 2

"$CODE_BIN" \
  --no-sandbox \
  --disable-gpu \
  --new-window \
  --verbose \
  --skip-welcome \
  --disable-workspace-trust \
  --user-data-dir "$TMP_DIR/code-user-data" \
  --extensions-dir "$TMP_DIR/code-extensions" \
  "$ROOT_DIR" >"$CODE_LOG" 2>&1 &
CODE_PID=$!

SUCCESS=0
for _ in $(seq 1 60); do
  if [[ -f "$EXT_LOG" ]] && grep -q 'custom-screen-visible' "$EXT_LOG"; then
    SUCCESS=1
    break
  fi

  if ! kill -0 "$CODE_PID" 2>/dev/null; then
    break
  fi

  sleep 1
done

if [[ "$SUCCESS" -ne 1 ]]; then
  echo 'VS Code extension did not report a visible Custom Screen webview.' >&2
  echo '--- install log ---' >&2
  cat "$LOG_DIR/install.log" >&2 || true
  echo '--- extension listing ---' >&2
  cat "$LOG_DIR/extensions.txt" >&2 || true
  echo '--- code log ---' >&2
  cat "$CODE_LOG" >&2 || true
  echo '--- extension log ---' >&2
  cat "$EXT_LOG" >&2 || true
  exit 1
fi

echo "Custom Screen webview opened successfully from $EXTENSION_ID@$EXTENSION_VERSION."
