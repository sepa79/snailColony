#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return
  fi

  echo "[runGame] pnpm not found. Installing pnpm to ~/.local ..."
  mkdir -p "$HOME/.local/bin"
  npm install --global pnpm --prefix "$HOME/.local"
  export PATH="$HOME/.local/bin:$PATH"

  if [ -f "$HOME/.bashrc" ] && ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.bashrc"; then
    echo '' >> "$HOME/.bashrc"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  fi
}

ensure_pnpm

echo "[runGame] using pnpm $(pnpm -v)"
echo "[runGame] installing dependencies..."
pnpm install

if [ "${1:-}" = "--approve-builds" ]; then
  echo "[runGame] running pnpm approve-builds (interactive)..."
  pnpm approve-builds
  echo "[runGame] rebuilding after approve-builds..."
  pnpm rebuild
fi

echo "[runGame] starting game (pnpm dev)..."
pnpm dev
