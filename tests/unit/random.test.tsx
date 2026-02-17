import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { randomPlugin } from '../../src/plugins/random/index.tsx';
import { OneShotRenderer } from '../../src/components/OneShotRenderer.tsx';
import {
  generateBytes,
  generateColor,
  generateHex,
  generateInt,
  generatePlayful,
  generateString,
  generateUuid,
  generateWords,
} from '../../src/plugins/random/generators.ts';

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

function renderResult(result: unknown): string {
  if (!result) return '';
  const instance = render(<OneShotRenderer>{result as React.ReactNode}</OneShotRenderer>);
  const frame = stripAnsi(instance.lastFrame() ?? '');
  instance.cleanup();
  return frame;
}

beforeEach(() => {
  process.exitCode = 0;
});

afterEach(() => {
  process.exitCode = 0;
});

describe('randomPlugin structure', () => {
  test('has correct plugin metadata', () => {
    expect(randomPlugin.name).toBe('random');
    expect(randomPlugin.description).toBe('Generate random values');
    expect(randomPlugin.commands).toHaveLength(1);
    expect(randomPlugin.commands[0]?.name).toBe('random');
    expect(randomPlugin.Widget).toBeUndefined();
  });
});

describe('generators', () => {
  test('generateBytes returns hex of correct length', () => {
    const result = generateBytes(16);
    expect(result).toHaveLength(32);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  test('generateBytes with custom length', () => {
    const result = generateBytes(8);
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  test('generateWords returns dashed words', () => {
    const result = generateWords(4);
    const parts = result.split('-');
    expect(parts).toHaveLength(4);
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });

  test('generateWords with custom count', () => {
    const result = generateWords(2);
    const parts = result.split('-');
    expect(parts).toHaveLength(2);
  });

  test('generateString returns alphanumeric of correct length', () => {
    const result = generateString(32);
    expect(result).toHaveLength(32);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });

  test('generateString with custom length', () => {
    const result = generateString(10);
    expect(result).toHaveLength(10);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });

  test('generatePlayful returns adjective-noun combos', () => {
    const result = generatePlayful(2);
    const parts = result.split('-');
    expect(parts).toHaveLength(4);
  });

  test('generatePlayful with single combo', () => {
    const result = generatePlayful(1);
    const parts = result.split('-');
    expect(parts).toHaveLength(2);
  });

  test('generateUuid returns valid UUID v4 format', () => {
    const result = generateUuid();
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('generateInt returns integer in range', () => {
    for (let i = 0; i < 50; i++) {
      const result = Number(generateInt(5, 10));
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  test('generateHex returns hex of exact length', () => {
    const result = generateHex(32);
    expect(result).toHaveLength(32);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  test('generateHex with odd length', () => {
    const result = generateHex(7);
    expect(result).toHaveLength(7);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  test('generateColor returns hex color code', () => {
    const result = generateColor();
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('random command dispatch', () => {
  test('returns help with no subcommand', async () => {
    const exitCodeBefore = process.exitCode;
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    const result = await cmd.execute([]);
    expect(process.exitCode).toBe(exitCodeBefore);
    const frame = renderResult(result);
    expect(frame).toContain('random');
    expect(frame).toContain('bytes');
    expect(frame).toContain('uuid');
  });

  test('sets exitCode 1 for unknown subcommand', async () => {
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    await cmd.execute(['nonexistent']);
    expect(process.exitCode).toBe(1);
  });

  test('returns error for unknown subcommand', async () => {
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    const result = await cmd.execute(['nonexistent']);
    const frame = renderResult(result);
    expect(frame).toContain('Unknown random type');
  });

  test('sets exitCode 1 for invalid numeric arg', async () => {
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    await cmd.execute(['bytes', 'abc']);
    expect(process.exitCode).toBe(1);
  });

  test('sets exitCode 1 for negative length', async () => {
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    await cmd.execute(['string', '-5']);
    expect(process.exitCode).toBe(1);
  });

  test('sets exitCode 1 when int min >= max', async () => {
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    await cmd.execute(['int', '10', '5']);
    expect(process.exitCode).toBe(1);
  });

  test('sets exitCode 1 when int min equals max', async () => {
    const cmd = randomPlugin.commands[0];
    if (!cmd) throw new Error('Missing random command');
    await cmd.execute(['int', '5', '5']);
    expect(process.exitCode).toBe(1);
  });
});
