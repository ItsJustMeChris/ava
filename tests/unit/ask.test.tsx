import { afterEach, describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { askPlugin, buildPrompt } from '../../src/plugins/ask.tsx';
import { OneShotRenderer } from '../../src/components/OneShotRenderer.tsx';

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

afterEach(() => {
  process.exitCode = 0;
});

describe('askPlugin', () => {
  test('has correct plugin structure', () => {
    expect(askPlugin.name).toBe('ask');
    expect(askPlugin.commands).toHaveLength(1);
    expect(askPlugin.commands[0]?.name).toBe('ask');
    expect(askPlugin.Widget).toBeUndefined();
  });

  test('sets exitCode 1 on empty prompt', async () => {
    const cmd = askPlugin.commands[0];
    if (!cmd) throw new Error('Missing ask command');
    const result = await cmd.execute([]);
    expect(process.exitCode).toBe(1);

    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('Please provide a question');
      instance.cleanup();
    }
  });

  test('sets exitCode 1 on whitespace-only prompt', async () => {
    const cmd = askPlugin.commands[0];
    if (!cmd) throw new Error('Missing ask command');
    const result = await cmd.execute(['  ', '  ']);
    expect(process.exitCode).toBe(1);

    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('Please provide a question');
      instance.cleanup();
    }
  });

  test('returns error JSX on empty prompt', async () => {
    const cmd = askPlugin.commands[0];
    if (!cmd) throw new Error('Missing ask command');
    const result = await cmd.execute([]);

    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('Please provide a question');
      instance.cleanup();
    }
  });
});

describe('buildPrompt', () => {
  test('returns args prompt when no stdin', () => {
    expect(buildPrompt('What is 2+2?', '')).toBe('What is 2+2?');
  });

  test('returns stdin when no args prompt', () => {
    expect(buildPrompt('', 'some piped content')).toBe('some piped content');
  });

  test('combines args and stdin with separator', () => {
    const result = buildPrompt('explain this', 'error: something broke');
    expect(result).toBe('explain this\n\n---\n\nerror: something broke');
  });

  test('returns empty string when both are empty', () => {
    expect(buildPrompt('', '')).toBe('');
  });
});
