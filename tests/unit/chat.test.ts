import { afterEach, describe, expect, mock, test } from 'bun:test';
import { chatPlugin } from '../../src/plugins/chat/index.ts';
import { truncateTitle } from '../../src/plugins/chat/types.ts';

afterEach(() => {
  process.exitCode = undefined;
});

describe('chatPlugin', () => {
  test('has correct plugin structure', () => {
    expect(chatPlugin.name).toBe('chat');
    expect(chatPlugin.description).toBe('Interactive multi-turn chat');
    expect(chatPlugin.commands).toHaveLength(2);
    expect(chatPlugin.summary).toBeDefined();
  });

  test('chat command has correct metadata', () => {
    const cmd = chatPlugin.commands.find((c) => c.name === 'chat');
    expect(cmd).toBeDefined();
    expect(cmd?.usage).toBe('chat [#]');
  });

  test('chats command has correct metadata', () => {
    const cmd = chatPlugin.commands.find((c) => c.name === 'chats');
    expect(cmd).toBeDefined();
    expect(cmd?.usage).toBe('chats [remove <#>]');
  });
});

describe('truncateTitle', () => {
  test('returns short text unchanged', () => {
    expect(truncateTitle('Hello world')).toBe('Hello world');
  });

  test('trims whitespace', () => {
    expect(truncateTitle('  Hello  ')).toBe('Hello');
  });

  test('truncates text longer than 60 chars with ellipsis', () => {
    const long = 'A'.repeat(80);
    const result = truncateTitle(long);
    expect(result.length).toBe(60);
    expect(result.endsWith('…')).toBe(true);
  });

  test('keeps text at exactly 60 chars unchanged', () => {
    const exact = 'B'.repeat(60);
    expect(truncateTitle(exact)).toBe(exact);
  });

  test('truncates at 59 chars plus ellipsis', () => {
    const long = 'C'.repeat(100);
    const result = truncateTitle(long);
    expect(result.slice(0, -1)).toBe('C'.repeat(59));
  });
});

describe('chats command', () => {
  test('remove errors with no index', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = mock((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      const cmd = chatPlugin.commands.find((c) => c.name === 'chats');
      if (!cmd) throw new Error('Missing chats command');

      await cmd.execute(['remove']);

      expect(process.exitCode).toBe(1);
      expect(errors.some((line) => line.includes('Please provide an index'))).toBe(true);
    } finally {
      console.error = originalError;
    }
  });

  test('remove errors with invalid index', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = mock((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      const cmd = chatPlugin.commands.find((c) => c.name === 'chats');
      if (!cmd) throw new Error('Missing chats command');

      await cmd.execute(['remove', 'abc']);

      expect(process.exitCode).toBe(1);
      expect(errors.some((line) => line.includes('not a valid index'))).toBe(true);
    } finally {
      console.error = originalError;
    }
  });
});

describe('chat command', () => {
  test('errors with invalid resume index', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = mock((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      const cmd = chatPlugin.commands.find((c) => c.name === 'chat');
      if (!cmd) throw new Error('Missing chat command');

      await cmd.execute(['abc']);

      expect(process.exitCode).toBe(1);
      expect(errors.some((line) => line.includes('not a valid index'))).toBe(true);
    } finally {
      console.error = originalError;
    }
  });

  test('errors with out-of-range resume index', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = mock((...args: unknown[]) => {
      errors.push(args.join(' '));
    });

    try {
      const cmd = chatPlugin.commands.find((c) => c.name === 'chat');
      if (!cmd) throw new Error('Missing chat command');

      process.env.AVA_DATA_DIR = `/tmp/ava-test-${crypto.randomUUID()}`;
      await cmd.execute(['99']);

      expect(process.exitCode).toBe(1);
      expect(errors.some((line) => line.includes('No chat at index'))).toBe(true);
    } finally {
      console.error = originalError;
      delete process.env.AVA_DATA_DIR;
    }
  });
});
