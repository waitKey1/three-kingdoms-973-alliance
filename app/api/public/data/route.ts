import { NextResponse } from "next/server";
import { getPublicMigrationData } from "@/app/lib/server/public-data";

export async function GET() {
  return NextResponse.json(await getPublicMigrationData(), { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}
