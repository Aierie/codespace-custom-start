#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp"
LOG_DIR="$TMP_DIR/logs"
CODE_LOG="$LOG_DIR/code.log"
EXT_LOG="$LOG_DIR/extension.log"
DISPLAY_NUM="${DISPLAY_NUM:-:99}"

mkdir -p "$TMP_DIR/code-user-data" "$TMP_DIR/code-extensions" "$LOG_DIR"
rm -f "$CODE_LOG" "$EXT_LOG"

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

code \
  --no-sandbox \
  --disable-gpu \
  --new-window \
  --verbose \
  --user-data-dir "$TMP_DIR/code-user-data" \
  --extensions-dir "$TMP_DIR/code-extensions" \
  --extensionDevelopmentPath "$ROOT_DIR" \
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
  echo '--- code log ---' >&2
  cat "$CODE_LOG" >&2 || true
  echo '--- extension log ---' >&2
  cat "$EXT_LOG" >&2 || true
  exit 1
fi

echo 'Custom Screen webview opened successfully.'
