import { afterEach, describe, expect, mock, test } from 'bun:test';
import { askPlugin } from '../../src/plugins/ask.ts';

afterEach(() => {
  process.exitCode = undefined;
});

describe('askPlugin', () => {
  test('has correct plugin structure', () => {
    expect(askPlugin.name).toBe('ask');
    expect(askPlugin.description).toBe('Ask an LLM a question');
    expect(askPlugin.commands).toHaveLength(1);
    expect(askPlugin.commands[0]?.name).toBe('ask');
    expect(askPlugin.commands[0]?.usage).toBe('ask <prompt>');
    expect(askPlugin.summary).toBeUndefined();
  });

  test('sets exitCode 1 on empty prompt', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = askPlugin.commands[0];
      if (!cmd) throw new Error('Missing ask command');
      await cmd.execute([]);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('sets exitCode 1 on whitespace-only prompt', async () => {
    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const cmd = askPlugin.commands[0];
      if (!cmd) throw new Error('Missing ask command');
      await cmd.execute(['  ', '  ']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('prints error message on empty prompt', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = mock((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      const cmd = askPlugin.commands[0];
      if (!cmd) throw new Error('Missing ask command');
      await cmd.execute([]);
      expect(errors.some((line) => line.includes('Please provide a question'))).toBe(true);
    } finally {
      console.error = originalError;
    }
  });
});
