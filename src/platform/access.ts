import "server-only";

/**
 * The current platform is an in-process demo. Keep it available for local
 * development, but fail closed when this site is deployed in production.
 * Re-enabling it requires an explicit, separately reviewed production change.
 */
export function isPlatformDemoEnabled() {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ENABLE_PLATFORM_DEMO === "true";
}
