import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "REQUEST_FAILED") {
    super(message);
  }
}

export function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

export function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item));
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json({ error: "提交内容格式不正确", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "请求内容不是有效的 JSON", code: "INVALID_JSON" }, { status: 400 });
  }
  console.error("Unhandled API error:", error instanceof Error ? error.message : "unknown");
  return NextResponse.json({ error: "服务器暂时无法处理请求", code: "INTERNAL_ERROR" }, { status: 500 });
}
