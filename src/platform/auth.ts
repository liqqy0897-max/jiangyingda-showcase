import "server-only";
import { cookies } from "next/headers";
import { actorForRole, type PlatformActor, type PlatformRole } from "./domain.mjs";

export const PLATFORM_SESSION_COOKIE = "jyd_demo_role";
const validRoles = new Set<PlatformRole>(["enterprise", "expert", "consultant", "admin"]);

export function normalizeRole(value: unknown): PlatformRole | null {
  return typeof value === "string" && validRoles.has(value as PlatformRole) ? value as PlatformRole : null;
}

export async function readPlatformActor(): Promise<PlatformActor | null> {
  const store = await cookies();
  const role = normalizeRole(store.get(PLATFORM_SESSION_COOKIE)?.value);
  return role ? actorForRole(role) : null;
}
