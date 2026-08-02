import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { jsonSafe } from "./http";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  allianceId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string | null;
}) {
  return prisma.auditLog.create({ data: {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    allianceId: input.allianceId,
    beforeData: input.beforeData === undefined ? undefined : jsonSafe(input.beforeData) as Prisma.InputJsonValue,
    afterData: input.afterData === undefined ? undefined : jsonSafe(input.afterData) as Prisma.InputJsonValue,
    ipAddress: input.ipAddress,
  } });
}
