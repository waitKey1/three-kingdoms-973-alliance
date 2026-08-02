#!/usr/bin/env bash
set -Eeuo pipefail
JOB="17 3 * * * /home/donxu/apps/three-kingdoms-973-alliance/scripts/backup-postgres.sh >> /home/donxu/backups/alliance973/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v 'backup-postgres.sh' || true; echo "${JOB}") | crontab -
echo "Daily PostgreSQL backup scheduled for 03:17."
