import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { randomPlugin } from '../../src/plugins/random/index.ts';
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

beforeEach(() => {
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = undefined;
});

describe('randomPlugin structure', () => {
  test('has correct plugin metadata', () => {
    expect(randomPlugin.name).toBe('random');
    expect(randomPlugin.description).toBe('Generate random values');
    expect(randomPlugin.commands).toHaveLength(1);
    expect(randomPlugin.commands[0]?.name).toBe('random');
    expect(randomPlugin.summary).toBeUndefined();
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
  test('prints help with no subcommand', async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = mock((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    try {
      const exitCodeBefore = process.exitCode;
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute([]);
      expect(process.exitCode).toBe(exitCodeBefore);
      expect(logs.some((line) => line.includes('random'))).toBe(true);
      expect(logs.some((line) => line.includes('bytes'))).toBe(true);
      expect(logs.some((line) => line.includes('uuid'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('sets exitCode 1 for unknown subcommand', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute(['nonexistent']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('prints error message for unknown subcommand', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = mock((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute(['nonexistent']);
      expect(errors.some((line) => line.includes('Unknown random type'))).toBe(true);
    } finally {
      console.error = originalError;
    }
  });

  test('sets exitCode 1 for invalid numeric arg', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute(['bytes', 'abc']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('sets exitCode 1 for negative length', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute(['string', '-5']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('sets exitCode 1 when int min >= max', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute(['int', '10', '5']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('sets exitCode 1 when int min equals max', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = randomPlugin.commands[0];
      if (!cmd) throw new Error('Missing random command');
      await cmd.execute(['int', '5', '5']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });
});
