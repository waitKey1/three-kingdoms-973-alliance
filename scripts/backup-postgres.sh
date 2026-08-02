#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/donxu/apps/three-kingdoms-973-alliance"
BACKUP_DIR="/home/donxu/backups/alliance973"
STAMP="$(date +%Y%m%d-%H%M%S)"
DAY="$(date +%u)"
mkdir -p "${BACKUP_DIR}/daily" "${BACKUP_DIR}/weekly"
cd "${APP_DIR}"

docker compose --env-file .env.production exec -T postgres pg_dump -U postgres -d alliance973 -Fc > "${BACKUP_DIR}/daily/alliance973-${STAMP}.dump"
find "${BACKUP_DIR}/daily" -type f -name '*.dump' -mtime +7 -delete

if [[ "${DAY}" == "7" ]]; then
  cp "${BACKUP_DIR}/daily/alliance973-${STAMP}.dump" "${BACKUP_DIR}/weekly/alliance973-${STAMP}.dump"
  find "${BACKUP_DIR}/weekly" -type f -name '*.dump' -mtime +28 -delete
fi
