#!/usr/bin/env bash
# Pull the latest code from GitHub, rebuild the React site and reload the server.
# Run on the server from the project folder:   bash deploy/update.sh
# Also run automatically by GitHub Actions on every push to main (.github/workflows/deploy.yml).
set -euo pipefail
cd "$(dirname "$0")/.."

# Only one deploy at a time (two quick pushes would otherwise overlap)
exec 9>/tmp/virag-deploy.lock
flock -w 600 9 || { echo "Another deploy is still running"; exit 1; }

echo "▶ Pulling latest code..."
git pull --ff-only
echo "  now at $(git log --oneline -1)"

echo "▶ Installing server dependencies..."
npm --prefix server ci --omit=dev --no-audit --no-fund

echo "▶ Building website..."
npm --prefix client ci --no-audit --no-fund
# Build into a separate folder and swap only when the build succeeded,
# so a failed build never leaves the live site without files.
rm -rf client/dist-new
npm --prefix client run build -- --outDir dist-new --emptyOutDir
rm -rf client/dist-old
[ -d client/dist ] && mv client/dist client/dist-old
mv client/dist-new client/dist
rm -rf client/dist-old

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
echo "▶ Health check on port $PORT..."
for i in $(seq 1 15); do
  if out=$(curl -fsS "http://127.0.0.1:$PORT/api/health" 2>/dev/null); then
    echo "  $out"
    echo "✅ Deployed successfully"
    exit 0
  fi
  sleep 2
done
echo "❌ App did not respond after reload. Recent logs:"
pm2 logs virag --lines 30 --nostream || true
exit 1
