#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/webapp"

if [ ! -d "node_modules" ]; then
  echo "Eerste keer opstarten: dependencies installeren..."
  npm install
fi

echo "Webapp starten op http://localhost:5173 ..."
open "http://localhost:5173"
npm run dev
