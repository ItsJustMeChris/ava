import type { ThreadJSON } from '@providerprotocol/ai';

/** A persisted chat thread with metadata. */
export interface ChatThread {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly thread: ThreadJSON;
}

const MAX_TITLE_LENGTH = 60;

/** Truncates text to a maximum length, appending ellipsis if needed. */
export function truncateTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1)}…`;
}
