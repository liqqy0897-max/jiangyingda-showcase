import { NextResponse } from "next/server";
import { actorForRole, DomainError } from "@/src/platform/domain.mjs";
import { normalizeRole, PLATFORM_SESSION_COOKIE, readPlatformActor } from "@/src/platform/auth";
import { isPlatformDemoEnabled } from "@/src/platform/access";

function unavailable() {
  return NextResponse.json({ error: { code: "NOT_AVAILABLE", message: "平台演示入口当前未对外开放。" } }, { status: 404 });
}

export async function GET() {
  if (!isPlatformDemoEnabled()) return unavailable();
  const actor = await readPlatformActor();
  return NextResponse.json({ actor });
}

export async function POST(request: Request) {
  if (!isPlatformDemoEnabled()) return unavailable();
  try {
    const body = await request.json();
    const role = normalizeRole(body?.role);
    if (!role) throw new DomainError("VALIDATION", "请选择有效的演示角色。", 400);
    const actor = actorForRole(role);
    const response = NextResponse.json({ actor });
    response.cookies.set(PLATFORM_SESSION_COOKIE, role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    const domain = error instanceof DomainError ? error : new DomainError("INVALID_REQUEST", "登录请求格式无效。", 400);
    return NextResponse.json({ error: { code: domain.code, message: domain.message } }, { status: domain.status });
  }
}

export async function DELETE() {
  if (!isPlatformDemoEnabled()) return unavailable();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PLATFORM_SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
