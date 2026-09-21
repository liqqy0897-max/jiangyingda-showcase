import { NextResponse } from "next/server";
import { DomainError, platformEngine } from "@/src/platform/domain.mjs";
import { readPlatformActor } from "@/src/platform/auth";
import { isPlatformDemoEnabled } from "@/src/platform/access";

function unavailable() {
  return NextResponse.json({ error: { code: "NOT_AVAILABLE", message: "平台演示入口当前未对外开放。" } }, { status: 404 });
}

function failure(error: unknown) {
  const domain = error instanceof DomainError ? error : new DomainError("INTERNAL_ERROR", "模拟服务暂时无法处理请求。", 500);
  return NextResponse.json({ error: { code: domain.code, message: domain.message, details: domain.details } }, { status: domain.status });
}

export async function GET() {
  if (!isPlatformDemoEnabled()) return unavailable();
  try {
    const actor = await readPlatformActor();
    if (!actor) throw new DomainError("UNAUTHENTICATED", "请先选择演示角色。", 401);
    return NextResponse.json({ actor, state: platformEngine.snapshot(actor), mode: "demo" });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (!isPlatformDemoEnabled()) return unavailable();
  try {
    const actor = await readPlatformActor();
    if (!actor) throw new DomainError("UNAUTHENTICATED", "请先选择演示角色。", 401);
    const body = await request.json();
    const response = platformEngine.execute(actor, body);
    return NextResponse.json({ ...response, state: platformEngine.snapshot(actor), mode: "demo" });
  } catch (error) {
    return failure(error);
  }
}
