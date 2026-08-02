#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="three-kingdoms-973-alliance"
APP_DIR="/home/donxu/apps/${APP_NAME}"
IMAGE="${APP_NAME}:20260802"
PUBLIC_PORT="18120"
STATUS_FILE="/tmp/${APP_NAME}.status"

trap 'echo FAILED > "${STATUS_FILE}"' ERR

if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" pull --ff-only origin main
else
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone https://github.com/waitKey1/three-kingdoms-973-alliance.git "${APP_DIR}"
fi

docker build --pull -t "${IMAGE}" "${APP_DIR}"
if docker container inspect "${APP_NAME}" >/dev/null 2>&1; then
  docker rm -f "${APP_NAME}"
fi
docker run -d --name "${APP_NAME}" --restart=always -p "${PUBLIC_PORT}:3000" "${IMAGE}"

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PUBLIC_PORT}/" >/dev/null; then
    echo SUCCESS > "${STATUS_FILE}"
    exit 0
  fi
  sleep 2
done

echo "Health check timed out" >&2
exit 1
