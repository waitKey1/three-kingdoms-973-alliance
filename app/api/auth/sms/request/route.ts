import { NextResponse } from "next/server";
import { apiError, getRequestIp } from "@/app/lib/server/http";
import { smsRequestSchema } from "@/app/lib/server/schemas";
import { requestSmsCode } from "@/app/lib/server/sms";

export async function POST(request: Request) {
  try {
    const input = smsRequestSchema.parse(await request.json());
    const result = await requestSmsCode({ ...input, ip: getRequestIp(request) });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
