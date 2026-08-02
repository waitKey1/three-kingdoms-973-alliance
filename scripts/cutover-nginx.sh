#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/donxu/apps/three-kingdoms-973-alliance"
DOMAIN="973.sligenai.cn"

curl -fsS http://127.0.0.1:18121/api/health >/dev/null

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  sudo cp "${APP_DIR}/deploy/nginx/973-http.conf" "/etc/nginx/sites-available/${DOMAIN}"
  sudo ln -sfn "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
  sudo nginx -t
  sudo systemctl reload nginx
  sudo certbot --nginx -d "${DOMAIN}"
fi

sudo cp "${APP_DIR}/deploy/nginx/973.sligenai.cn.conf" "/etc/nginx/sites-available/${DOMAIN}"
sudo ln -sfn "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
sudo nginx -t
sudo systemctl reload nginx
echo "Cutover complete: https://${DOMAIN} -> 127.0.0.1:18121"
