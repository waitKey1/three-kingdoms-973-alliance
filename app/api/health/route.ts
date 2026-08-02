import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/server/prisma";
import { getRedis } from "@/app/lib/server/redis";

export async function GET() {
  try {
    await Promise.all([prisma.$queryRaw`SELECT 1`, getRedis().then((redis) => redis.ping())]);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
