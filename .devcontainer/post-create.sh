#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VSIX_PATH="$ROOT_DIR/$(node -p "const pkg = require('$ROOT_DIR/package.json'); `${pkg.name}-${pkg.version}.vsix`")"

cd "$ROOT_DIR"

npm install
npm run package:vsix
code --install-extension "$VSIX_PATH" --force

echo "Built and installed extension from $VSIX_PATH"
