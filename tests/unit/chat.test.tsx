import { afterEach, describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { chatPlugin } from '../../src/plugins/chat/index.tsx';
import { truncateTitle } from '../../src/plugins/chat/types.ts';
import { OneShotRenderer } from '../../src/components/OneShotRenderer.tsx';

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

afterEach(() => {
  process.exitCode = 0;
});

describe('chatPlugin', () => {
  test('has correct plugin structure', () => {
    expect(chatPlugin.name).toBe('chat');
    expect(chatPlugin.description).toBe('Interactive multi-turn chat');
    expect(chatPlugin.commands).toHaveLength(2);
    expect(chatPlugin.Widget).toBeDefined();
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
    const cmd = chatPlugin.commands.find((c) => c.name === 'chats');
    if (!cmd) throw new Error('Missing chats command');

    const result = await cmd.execute(['remove']);

    expect(process.exitCode).toBe(1);
    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('Please provide an index');
      instance.cleanup();
    }
  });

  test('remove errors with invalid index', async () => {
    const cmd = chatPlugin.commands.find((c) => c.name === 'chats');
    if (!cmd) throw new Error('Missing chats command');

    const result = await cmd.execute(['remove', 'abc']);

    expect(process.exitCode).toBe(1);
    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('not a valid index');
      instance.cleanup();
    }
  });
});

describe('chat command', () => {
  test('errors with invalid resume index', async () => {
    const cmd = chatPlugin.commands.find((c) => c.name === 'chat');
    if (!cmd) throw new Error('Missing chat command');

    const result = await cmd.execute(['abc']);

    expect(process.exitCode).toBe(1);
    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('not a valid index');
      instance.cleanup();
    }
  });

  test('errors with out-of-range resume index', async () => {
    const cmd = chatPlugin.commands.find((c) => c.name === 'chat');
    if (!cmd) throw new Error('Missing chat command');

    process.env.AVA_DATA_DIR = `/tmp/ava-test-${crypto.randomUUID()}`;

    try {
      const result = await cmd.execute(['99']);

      expect(process.exitCode).toBe(1);
      if (result) {
        const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
        const frame = stripAnsi(instance.lastFrame() ?? '');
        expect(frame).toContain('No chat at index');
        instance.cleanup();
      }
    } finally {
      delete process.env.AVA_DATA_DIR;
    }
  });
});
