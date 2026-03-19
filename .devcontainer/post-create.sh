#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

npm install
npm run package:vsix                                                                       
code --install-extension ./custom-screen-extension-0.0.1.vsix --force

echo "Built and installed workspace extension"
