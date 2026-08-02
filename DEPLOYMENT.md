# 973.sligenai.cn 部署说明

## 服务端口

- Next.js：容器 3000，回环端口 `127.0.0.1:18121`
- PostgreSQL 16：回环端口 `127.0.0.1:54330`
- Redis 7：回环端口 `127.0.0.1:63800`
- 旧版 18120 在切换后保留 24 小时，作为回滚环境。

## 首次部署

1. 在服务器仓库根目录创建 `.env.production`，至少填写 `POSTGRES_PASSWORD`、`SESSION_SECRET`、`SMS_CODE_SECRET`、`BOOTSTRAP_TOKEN` 和阿里云短信五项配置。
2. 执行 `bash scripts/deploy-server.sh`。脚本启动数据库和缓存、应用 Prisma 迁移、幂等导入数据，并在 18121 完成健康检查。
3. 确认 `curl http://127.0.0.1:18121/api/health` 返回 `ok`。
4. 执行 `bash scripts/cutover-nginx.sh`，申请证书并将 `973.sligenai.cn` 切换到 18121。
5. 执行 `bash scripts/install-backup-cron.sh` 安装每日 PostgreSQL 备份。
6. 访问 `https://973.sligenai.cn/setup` 完成一次性区管理初始化。

## 回滚

Nginx 配置中的 `proxy_pass` 临时改回 `http://127.0.0.1:18120` 并 reload，即可回到旧只读版本。数据库变更采用 Prisma 迁移；执行破坏性回滚前先恢复 PostgreSQL 备份。

## 备份

备份位于 `/home/donxu/backups/alliance973`。每日备份保留 7 天，每周备份保留 28 天（4 周）。数据库和 Redis 均只监听服务器回环地址，不开放公网。
