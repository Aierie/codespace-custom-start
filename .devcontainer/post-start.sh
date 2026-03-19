#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLAG_DIR="$ROOT_DIR/.vscode"
FLAG_FILE="$FLAG_DIR/open-custom-screen"

npm run package:vsix                                                        
code --install-extension ./custom-screen-extension-0.0.1.vsix --force

mkdir -p "$FLAG_DIR"
touch "$FLAG_FILE"

echo "Created startup marker at $FLAG_FILE"
