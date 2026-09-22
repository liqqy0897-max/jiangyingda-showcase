import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_JOIN_NOTIFICATION_TO,
  formatJoinApplicationEmail,
  isHoneypotFilled,
  JoinApplicationError,
  parseJoinApplication,
} from "@/src/join/application.mjs";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

type RateLimitEntry = { count: number; resetAt: number };
const runtimeState = globalThis as typeof globalThis & {
  joinSubmissionLimits?: Map<string, RateLimitEntry>;
};
const submissionLimits = runtimeState.joinSubmissionLimits ?? new Map<string, RateLimitEntry>();
runtimeState.joinSubmissionLimits = submissionLimits;

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function consumeRateLimit(key: string) {
  const now = Date.now();
  const current = submissionLimits.get(key);

  if (!current || current.resetAt <= now) {
    submissionLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function readMailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || "465");

  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new JoinApplicationError(
      "MAIL_NOT_CONFIGURED",
      "邮件通道暂未配置，请稍后再试或通过页面公布的邮箱联系我们。",
      503,
    );
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    user,
    pass,
    from: process.env.SMTP_FROM?.trim() || user,
    to: process.env.JOIN_NOTIFICATION_TO?.trim() || DEFAULT_JOIN_NOTIFICATION_TO,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isHoneypotFilled(body)) {
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!consumeRateLimit(clientKey(request))) {
      return jsonError("RATE_LIMITED", "提交次数较多，请十分钟后再试。", 429);
    }

    const application = parseJoinApplication(body);
    const config = readMailConfig();
    const applicationId = `JOIN-${randomUUID().slice(0, 8).toUpperCase()}`;
    const submittedAt = new Date().toISOString();
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });

    await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: "新的专家库加入意向",
      text: formatJoinApplicationEmail(application, { applicationId, submittedAt }),
    });

    return NextResponse.json(
      { ok: true, applicationId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof JoinApplicationError) {
      return jsonError(error.code, error.message, error.status);
    }

    if (error instanceof SyntaxError) {
      return jsonError("INVALID_REQUEST", "提交内容格式无效，请刷新页面后重试。", 400);
    }

    console.error("Join notification delivery failed", error instanceof Error ? error.message : "Unknown error");
    return jsonError(
      "MAIL_DELIVERY_FAILED",
      "加入意向未能发送，请稍后重试或通过页面公布的邮箱联系我们。",
      502,
    );
  }
}
