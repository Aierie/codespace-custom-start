#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

npm install
bash "$ROOT_DIR/scripts/install-extension.sh"

echo "Built and installed workspace extension"
