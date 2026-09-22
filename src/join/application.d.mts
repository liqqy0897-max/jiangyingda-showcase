export const DEFAULT_JOIN_NOTIFICATION_TO: string;

export type JoinApplication = {
  name: string;
  specialty: string;
  contact: string;
};

export class JoinApplicationError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status?: number);
}

export function isHoneypotFilled(input: unknown): boolean;
export function parseJoinApplication(input: unknown): JoinApplication;
export function formatJoinApplicationEmail(
  application: JoinApplication,
  metadata: { applicationId: string; submittedAt: string },
): string;
