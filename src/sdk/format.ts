/**
 * Display helpers for time formatting.
 */

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
