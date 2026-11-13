#!/usr/bin/env bash
# Pull the latest code from GitHub, rebuild the React site and reload the server.
# Run on the server from the project folder:   bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Pulling latest code..."
git pull --ff-only

echo "▶ Installing server dependencies..."
npm --prefix server ci --omit=dev

echo "▶ Building website..."
npm --prefix client ci
npm --prefix client run build

mkdir -p logs
echo "▶ Reloading app..."
if pm2 describe virag >/dev/null 2>&1; then
  pm2 reload virag --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

PORT=$(grep -E '^PORT=' server/.env | cut -d= -f2 | tr -d '\r ' || true)
PORT=${PORT:-5000}
sleep 2
echo "✅ Deployed. Health check on port $PORT (expect {\"ok\":true}):"
curl -fsS "http://127.0.0.1:$PORT/api/health" && echo
