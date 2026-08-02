import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma973?: PrismaClient };

export const prisma = globalForPrisma.prisma973 ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma973 = prisma;
