# 三国冰河时代 973 区管理系统

973 区公开名册、迁盟编成、账户认领和三级权限管理系统。公开站保留 Three.js 指挥台；管理后台使用独立界面，所有写操作均经过服务端权限检查并写入审计日志。

## 技术栈

- Next.js 16 App Router、React 19、Three.js
- Prisma 6.19、PostgreSQL 16
- Redis 7（短信验证码、会话、限流、公开页缓存）
- 阿里云短信、ExcelJS、Zod

## 本地启动

1. 将 `.env.example` 复制为 `.env` 并填写随机密钥。
2. 启动 PostgreSQL 16 和 Redis 7。
3. 执行 `npm run db:setup`，幂等导入 391 名成员。
4. 执行 `npm run dev`。
5. 首次访问 `/setup`，使用 `BOOTSTRAP_TOKEN` 和短信验证码创建首位区管理。

常用检查：`npm test`、`npm run lint`、`npm run build`。

## 权限

- 区管理：全区盟、成员、账户、跨盟调整和全部审计。
- 盟管理：仅本盟成员、认领、副管理和本盟审计。
- 盟成员：个人绑定资料与所属盟信息。
- 游客：公开名册、迁盟、统计和实时 Excel。

详细部署流程见 [DEPLOYMENT.md](./DEPLOYMENT.md)。生产密钥只放在服务器 `.env.production`，不得提交 Git。
