/**
 * ANSI formatting constants and display helpers.
 */

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
} as const;

/** Wraps text with an ANSI color code and reset. */
export function colorize(text: string, color: string): string {
  return `${color}${text}${ANSI.reset}`;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Formats an ISO 8601 timestamp as a human-readable relative time string.
 * @param isoDate - An ISO 8601 date string.
 * @param now - Optional reference time for testing.
 */
export function formatRelativeTime(isoDate: string, now?: Date): string {
  const date = new Date(isoDate);
  const ref = now ?? new Date();
  const diff = ref.getTime() - date.getTime();

  if (diff < 0) {
    return 'just now';
  }
  if (diff < MINUTE) {
    const seconds = Math.floor(diff / SECOND);
    return seconds <= 1 ? 'just now' : `${String(seconds)}s ago`;
  }
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${String(minutes)}m ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${String(hours)}h ago`;
  }
  const days = Math.floor(diff / DAY);
  return `${String(days)}d ago`;
}

/** Formats an entry index and text for list display. */
export function formatEntryLine(
  index: number,
  text: string,
  relativeTime: string,
): string {
  const num = colorize(`${String(index + 1)}.`, ANSI.cyan);
  const time = colorize(relativeTime, ANSI.gray);
  return `  ${num} ${text} ${time}`;
}
