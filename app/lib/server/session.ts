import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { getRedis } from "./redis";
import { ApiError } from "./http";

export const SESSION_COOKIE = "973_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

type StoredSession = { userId: string; createdAt: string };

export async function createSession(userId: string) {
  const redis = await getRedis();
  const sessionId = randomBytes(32).toString("base64url");
  const value: StoredSession = { userId, createdAt: new Date().toISOString() };
  await redis.multi()
    .set(`session:${sessionId}`, JSON.stringify(value), { EX: SESSION_TTL_SECONDS })
    .sAdd(`user-sessions:${userId}`, sessionId)
    .expire(`user-sessions:${userId}`, SESSION_TTL_SECONDS)
    .exec();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return sessionId;
}

export async function revokeSession(sessionId?: string | null) {
  if (!sessionId) return;
  const redis = await getRedis();
  const raw = await redis.get(`session:${sessionId}`);
  if (raw) {
    const session = JSON.parse(raw) as StoredSession;
    await redis.sRem(`user-sessions:${session.userId}`, sessionId);
  }
  await redis.del(`session:${sessionId}`);
}

export async function revokeAllUserSessions(userId: string) {
  const redis = await getRedis();
  const setKey = `user-sessions:${userId}`;
  const ids = await redis.sMembers(setKey);
  if (ids.length) await redis.del(ids.map((id) => `session:${id}`));
  await redis.del(setKey);
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  try {
    const redis = await getRedis();
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    const user = await prisma.user.findFirst({
      where: { id: session.userId, deletedAt: null },
      include: { alliance: true, member: { include: { currentAlliance: true, targetAlliance: true } } },
    });
    if (!user || user.status === "DISABLED") {
      await revokeSession(sessionId);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "请先登录", "UNAUTHENTICATED");
  return user;
}

export async function requireActiveUser() {
  const user = await requireUser();
  if (user.status !== "ACTIVE") throw new ApiError(403, "账户尚未通过角色认领审核", "ACCOUNT_PENDING");
  return user;
}

export async function requireAdmin() {
  const user = await requireActiveUser();
  if (user.role === "ALLIANCE_MEMBER") throw new ApiError(403, "无管理权限", "FORBIDDEN");
  return user;
}

export function canManageAlliance(user: { role: UserRole; status: UserStatus; allianceId: string | null }, allianceId: string) {
  return user.status === "ACTIVE" && (user.role === "REGION_ADMIN" || (user.role === "ALLIANCE_ADMIN" && user.allianceId === allianceId));
}

export function assertAllianceScope(user: { role: UserRole; status: UserStatus; allianceId: string | null }, allianceId: string) {
  if (!canManageAlliance(user, allianceId)) throw new ApiError(403, "不能管理其他盟的数据", "ALLIANCE_SCOPE_FORBIDDEN");
}
