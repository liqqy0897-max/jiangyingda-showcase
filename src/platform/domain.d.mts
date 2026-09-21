export type PlatformRole = "enterprise" | "expert" | "consultant" | "admin";

export interface PlatformActor {
  id: string;
  role: PlatformRole;
  name: string;
}

export interface CommandRequest {
  command: Record<string, unknown> & { type: string };
  expectedVersion: number;
  idempotencyKey: string;
}

export class DomainError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(code: string, message: string, status?: number, details?: unknown);
}

export const DEMO_ACTORS: Readonly<Record<PlatformRole, Readonly<PlatformActor>>>;
export function actorForRole(role: string): PlatformActor;
export function createDemoState(now?: string): Record<string, unknown>;
export function createDemoEngine(options?: {
  initialState?: Record<string, unknown>;
  clock?: () => string;
}): {
  snapshot(actor: PlatformActor): Record<string, any>;
  execute(actor: PlatformActor, request: CommandRequest): {
    version: number;
    result: Record<string, unknown>;
    replayed: boolean;
  };
};
export const platformEngine: ReturnType<typeof createDemoEngine>;
