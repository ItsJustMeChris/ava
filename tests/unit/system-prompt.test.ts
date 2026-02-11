import { describe, expect, test } from 'bun:test';
import { buildSystemPrompt } from '../../src/sdk/system-prompt.ts';

describe('buildSystemPrompt', () => {
  test('returns a non-empty string', () => {
    const result = buildSystemPrompt();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('includes Ava identity', () => {
    const result = buildSystemPrompt();
    expect(result).toContain('Ava');
  });

  test('includes platform info', () => {
    const result = buildSystemPrompt();
    expect(result).toContain(process.platform);
    expect(result).toContain(process.arch);
  });

  test('includes working directory', () => {
    const result = buildSystemPrompt();
    expect(result).toContain(process.cwd());
  });
});
