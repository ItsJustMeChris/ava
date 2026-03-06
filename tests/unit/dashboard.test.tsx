import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { render } from 'ink-testing-library';
import type { ReactNode } from 'react';
import { createDashboardPlugin } from '../../src/sdk/dashboard.tsx';
import { OneShotRenderer } from '../../src/components/OneShotRenderer.tsx';

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

const SCRATCHPAD = '/private/tmp/claude-501/ava-journal-tests';
let dataDir: string;

beforeEach(() => {
  dataDir = join(SCRATCHPAD, crypto.randomUUID());
});

afterEach(async () => {
  process.exitCode = 0;
  try {
    await rm(SCRATCHPAD, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
});


function renderCommandOutput(result: unknown): string {
  if (result === undefined || result === null) return '';
  const instance = render(<OneShotRenderer>{result as ReactNode}</OneShotRenderer>);
  const frame = stripAnsi(instance.lastFrame() ?? '');
  instance.cleanup();
  return frame;
}


describe('createDashboardPlugin', () => {
  test('creates plugin with correct name and two commands', () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    expect(plugin.name).toBe('note');
    expect(plugin.commands).toHaveLength(2);
    expect(plugin.commands[0]?.name).toBe('note');
    expect(plugin.commands[1]?.name).toBe('notes');
  });

  test('add command persists an entry and returns confirmation', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    if (!addCmd) throw new Error('Missing add command');
    const result = await addCmd.execute(['hello', 'world']);
    expect(renderCommandOutput(result)).toContain('hello world');
  });

  test('add command sets exitCode 1 when no text provided', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    if (!addCmd) throw new Error('Missing add command');
    const result = await addCmd.execute([]);
    expect(process.exitCode).toBe(1);
    expect(renderCommandOutput(result)).toContain('Error');
  });

  test('list command shows empty message when no entries', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const listCmd = plugin.commands[1];
    if (!listCmd) throw new Error('Missing list command');
    const result = await listCmd.execute([]);
    expect(renderCommandOutput(result)).toContain('No notes yet');
  });

  test('list command displays entries after adding', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    const listCmd = plugin.commands[1];
    if (!addCmd || !listCmd) throw new Error('Missing commands');

    await addCmd.execute(['first entry']);
    await addCmd.execute(['second entry']);

    const result = await listCmd.execute([]);
    const frame = renderCommandOutput(result);
    expect(frame).toContain('first entry');
    expect(frame).toContain('second entry');
  });

  test('remove subcommand removes entry by 1-based index', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    const listCmd = plugin.commands[1];
    if (!addCmd || !listCmd) throw new Error('Missing commands');

    await addCmd.execute(['first']);
    await addCmd.execute(['second']);
    await addCmd.execute(['third']);

    const result = await listCmd.execute(['remove', '2']);
    const frame = renderCommandOutput(result);
    expect(frame).toContain('removed');
    expect(frame).toContain('second');
  });

  test('remove subcommand sets exitCode 1 for missing index', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const listCmd = plugin.commands[1];
    if (!listCmd) throw new Error('Missing list command');
    const result = await listCmd.execute(['remove']);
    expect(process.exitCode).toBe(1);
    expect(renderCommandOutput(result)).toContain('Error');
  });

  test('remove subcommand sets exitCode 1 for invalid index', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const listCmd = plugin.commands[1];
    if (!listCmd) throw new Error('Missing list command');
    const result = await listCmd.execute(['remove', 'abc']);
    expect(process.exitCode).toBe(1);
    expect(renderCommandOutput(result)).toContain('Error');
  });

  test('remove subcommand sets exitCode 1 for out-of-range index', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const listCmd = plugin.commands[1];
    if (!listCmd) throw new Error('Missing list command');
    const result = await listCmd.execute(['remove', '99']);
    expect(process.exitCode).toBe(1);
    expect(renderCommandOutput(result)).toContain('Error');
  });

  test('Widget is defined', () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    expect(plugin.Widget).toBeDefined();
  });

  test('Widget returns null with no entries', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const widget = plugin.Widget;
    if (!widget) throw new Error('Missing Widget');

    const result = await widget();
    expect(result).toBeNull();
  });

  test('Widget renders entries after adding', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    if (!addCmd) throw new Error('Missing add command');

    await addCmd.execute(['first']);
    await addCmd.execute(['second']);
    await addCmd.execute(['third']);
    await addCmd.execute(['fourth']);

    const widget = plugin.Widget;
    if (!widget) throw new Error('Missing Widget');

    const result = await widget();
    const frame = renderCommandOutput(result);
    expect(frame).toContain('Notes (4)');
    expect(frame).toContain('fourth');
    expect(frame).toContain('third');
    expect(frame).toContain('second');
    expect(frame).not.toContain('first');
  });

  test('Widget shows global indices for recent entries', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    if (!addCmd) throw new Error('Missing add command');

    await addCmd.execute(['first']);
    await addCmd.execute(['second']);
    await addCmd.execute(['third']);
    await addCmd.execute(['fourth']);

    const widget = plugin.Widget;
    if (!widget) throw new Error('Missing Widget');

    const result = await widget();
    const frame = renderCommandOutput(result);
    expect(frame).toContain('4. fourth');
    expect(frame).toContain('3. third');
    expect(frame).toContain('2. second');
    expect(frame).not.toContain('1. fourth');
  });

  test('Widget renders entries with timestamps', async () => {
    const plugin = createDashboardPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    if (!addCmd) throw new Error('Missing add command');

    await addCmd.execute(['test entry']);

    const widget = plugin.Widget;
    if (!widget) throw new Error('Missing Widget');

    const result = await widget();
    const frame = renderCommandOutput(result);
    expect(frame).toContain('test entry');
    expect(frame).toContain('just now');
  });
});
