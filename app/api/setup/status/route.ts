import { NextResponse } from "next/server";
import { bootstrapAvailable } from "@/app/lib/server/sms";

export async function GET() {
  return NextResponse.json({ available: await bootstrapAvailable() });
}
