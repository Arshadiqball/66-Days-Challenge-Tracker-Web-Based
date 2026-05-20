#!/usr/bin/env bash
set -euo pipefail

git pull
npm install
npm run build

# Reload via the ecosystem file so the frontend always runs the production
# preview server (vite preview), never the dev server.
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save