import { describe, expect, test } from 'bun:test';
import { ANSI, colorize, formatEntryLine, formatRelativeTime } from '../../src/sdk/format.ts';

describe('colorize', () => {
  test('wraps text with color and reset codes', () => {
    const result = colorize('hello', ANSI.red);
    expect(result).toBe(`\x1b[31mhello\x1b[0m`);
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2025-01-15T12:00:00.000Z');

  test('returns "just now" for times less than 2 seconds ago', () => {
    expect(formatRelativeTime('2025-01-15T12:00:00.000Z', now)).toBe('just now');
    expect(formatRelativeTime('2025-01-15T11:59:59.500Z', now)).toBe('just now');
  });

  test('returns seconds for times under a minute', () => {
    expect(formatRelativeTime('2025-01-15T11:59:30.000Z', now)).toBe('30s ago');
    expect(formatRelativeTime('2025-01-15T11:59:50.000Z', now)).toBe('10s ago');
  });

  test('returns minutes for times under an hour', () => {
    expect(formatRelativeTime('2025-01-15T11:55:00.000Z', now)).toBe('5m ago');
    expect(formatRelativeTime('2025-01-15T11:01:00.000Z', now)).toBe('59m ago');
  });

  test('returns hours for times under a day', () => {
    expect(formatRelativeTime('2025-01-15T09:00:00.000Z', now)).toBe('3h ago');
    expect(formatRelativeTime('2025-01-14T13:00:00.000Z', now)).toBe('23h ago');
  });

  test('returns days for times over a day', () => {
    expect(formatRelativeTime('2025-01-14T12:00:00.000Z', now)).toBe('1d ago');
    expect(formatRelativeTime('2025-01-10T12:00:00.000Z', now)).toBe('5d ago');
  });

  test('returns "just now" for future timestamps', () => {
    expect(formatRelativeTime('2025-01-15T12:01:00.000Z', now)).toBe('just now');
  });
});

describe('formatEntryLine', () => {
  test('formats an entry with index, text, and time', () => {
    const result = formatEntryLine(0, 'Buy groceries', '5m ago');
    expect(result).toContain('1.');
    expect(result).toContain('Buy groceries');
    expect(result).toContain('5m ago');
  });

  test('uses 1-based indexing', () => {
    const result = formatEntryLine(2, 'test', '1h ago');
    expect(result).toContain('3.');
  });
});
