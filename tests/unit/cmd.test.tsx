import { afterEach, describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { cmdPlugin } from '../../src/plugins/cmd.tsx';
import { OneShotRenderer } from '../../src/components/OneShotRenderer.tsx';

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

afterEach(() => {
  process.exitCode = 0;
});

describe('cmdPlugin', () => {
  test('has correct plugin structure', () => {
    expect(cmdPlugin.name).toBe('cmd');
    expect(cmdPlugin.commands).toHaveLength(1);
    expect(cmdPlugin.commands[0]?.name).toBe('cmd');
    expect(cmdPlugin.Widget).toBeUndefined();
  });

  test('sets exitCode 1 on empty description', async () => {
    const cmd = cmdPlugin.commands[0];
    if (!cmd) throw new Error('Missing cmd command');
    const result = await cmd.execute([]);
    expect(process.exitCode).toBe(1);

    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('Please describe the command you need');
      instance.cleanup();
    }
  });

  test('sets exitCode 1 on whitespace-only description', async () => {
    const cmd = cmdPlugin.commands[0];
    if (!cmd) throw new Error('Missing cmd command');
    const result = await cmd.execute(['  ', '  ']);
    expect(process.exitCode).toBe(1);

    if (result) {
      const instance = render(<OneShotRenderer>{result}</OneShotRenderer>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('Please describe the command you need');
      instance.cleanup();
    }
  });
});
