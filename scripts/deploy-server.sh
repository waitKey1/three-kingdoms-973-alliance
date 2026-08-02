#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="three-kingdoms-973-alliance"
APP_DIR="/home/donxu/apps/${APP_NAME}"
REPO_URL="https://github.com/waitKey1/three-kingdoms-973-alliance.git"
COMPOSE=(docker compose --env-file .env.production)

if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" pull --ff-only origin main
else
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"

if [[ ! -f .env.production ]]; then
  echo "Missing ${APP_DIR}/.env.production; copy .env.example and fill production secrets first." >&2
  exit 1
fi

"${COMPOSE[@]}" up -d postgres redis
"${COMPOSE[@]}" build app
"${COMPOSE[@]}" run --rm app npx prisma migrate deploy
"${COMPOSE[@]}" run --rm app node prisma/seed.mjs
"${COMPOSE[@]}" up -d app

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:18121/api/health >/dev/null; then
    echo "Blue environment is healthy on 127.0.0.1:18121."
    echo "The legacy 18120 container has not been changed and remains available for rollback."
    exit 0
  fi
  sleep 2
done

echo "Health check timed out; keep Nginx on the legacy 18120 service." >&2
exit 1
