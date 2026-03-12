import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  REPORT_UNLOCK_COOKIE_NAME,
  createReportUnlockCookieValue,
  getReportUnlockCookieOptions,
  isReportUnlockEnabled,
  verifyReportPin,
} from "@/lib/report-unlock";

function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  if (!isReportUnlockEnabled()) {
    return NextResponse.json(
      { message: "当前环境尚未配置访问 PIN。" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "请求格式无效。" }, { status: 400 });
  }

  const pin = typeof body === "object" && body && "pin" in body ? body.pin : undefined;
  if (typeof pin !== "string" || pin.trim().length === 0) {
    return NextResponse.json({ message: "请输入 6 位数字 PIN。" }, { status: 400 });
  }

  if (!verifyReportPin(pin)) {
    return NextResponse.json({ message: "PIN 不正确，请重试。" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    REPORT_UNLOCK_COOKIE_NAME,
    createReportUnlockCookieValue(),
    {
      ...getReportUnlockCookieOptions(),
      secure: shouldUseSecureCookie(request),
    },
  );

  return NextResponse.json({ ok: true });
}
