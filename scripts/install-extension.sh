#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-$ROOT_DIR/.tmp/code-extensions}"
EXTENSION_NAME="$(node -p "require('$ROOT_DIR/package.json').name")"
EXTENSION_VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
EXTENSION_PUBLISHER="$(node -p "require('$ROOT_DIR/package.json').publisher")"
EXTENSION_ID="$EXTENSION_PUBLISHER.$EXTENSION_NAME"
INSTALL_DIR="$TARGET_DIR/$EXTENSION_ID-$EXTENSION_VERSION"

mkdir -p "$TARGET_DIR"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

tar \
  --exclude='.git' \
  --exclude='.tmp' \
  --exclude='node_modules' \
  -cf - . | tar -xf - -C "$INSTALL_DIR"

printf 'Installed unpacked extension to %s\n' "$INSTALL_DIR"
