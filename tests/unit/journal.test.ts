import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createJournalPlugin } from '../../src/sdk/journal.ts';

const SCRATCHPAD = '/private/tmp/claude-501/ava-journal-tests';
let dataDir: string;

beforeEach(() => {
  dataDir = join(SCRATCHPAD, crypto.randomUUID());
});

afterEach(async () => {
  process.exitCode = undefined;
  try {
    await rm(SCRATCHPAD, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
});

describe('createJournalPlugin', () => {
  test('creates plugin with correct name and two commands', () => {
    const plugin = createJournalPlugin({
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

  test('add command persists an entry and prints confirmation', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const logged: string[] = [];
    const originalLog = console.log;
    console.log = mock((...args: unknown[]) => {
      logged.push(args.join(' '));
    });

    try {
      const addCmd = plugin.commands[0];
      if (!addCmd) throw new Error('Missing add command');
      await addCmd.execute(['hello', 'world']);
      expect(logged.some((line) => line.includes('hello world'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('add command sets exitCode 1 when no text provided', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const addCmd = plugin.commands[0];
      if (!addCmd) throw new Error('Missing add command');
      await addCmd.execute([]);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('list command shows empty message when no entries', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const logged: string[] = [];
    const originalLog = console.log;
    console.log = mock((...args: unknown[]) => {
      logged.push(args.join(' '));
    });

    try {
      const listCmd = plugin.commands[1];
      if (!listCmd) throw new Error('Missing list command');
      await listCmd.execute([]);
      expect(logged.some((line) => line.includes('No notes yet'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('list command displays entries after adding', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    const listCmd = plugin.commands[1];
    if (!addCmd || !listCmd) throw new Error('Missing commands');

    const originalLog = console.log;
    console.log = mock(() => { /* suppress add output */ });

    try {
      await addCmd.execute(['first entry']);
      await addCmd.execute(['second entry']);

      const logged: string[] = [];
      console.log = mock((...args: unknown[]) => {
        logged.push(args.join(' '));
      });

      await listCmd.execute([]);
      expect(logged.some((line) => line.includes('first entry'))).toBe(true);
      expect(logged.some((line) => line.includes('second entry'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('remove subcommand removes entry by 1-based index', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const addCmd = plugin.commands[0];
    const listCmd = plugin.commands[1];
    if (!addCmd || !listCmd) throw new Error('Missing commands');

    const originalLog = console.log;
    console.log = mock(() => { /* suppress */ });

    try {
      await addCmd.execute(['first']);
      await addCmd.execute(['second']);
      await addCmd.execute(['third']);

      const logged: string[] = [];
      console.log = mock((...args: unknown[]) => {
        logged.push(args.join(' '));
      });

      await listCmd.execute(['remove', '2']);
      expect(logged.some((line) => line.includes('removed') && line.includes('second'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('remove subcommand sets exitCode 1 for missing index', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const listCmd = plugin.commands[1];
      if (!listCmd) throw new Error('Missing list command');
      await listCmd.execute(['remove']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('remove subcommand sets exitCode 1 for invalid index', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const listCmd = plugin.commands[1];
      if (!listCmd) throw new Error('Missing list command');
      await listCmd.execute(['remove', 'abc']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });

  test('remove subcommand sets exitCode 1 for out-of-range index', async () => {
    const plugin = createJournalPlugin({
      name: 'note',
      plural: 'notes',
      description: 'Take notes',
      addVerb: 'Add',
      dataDir,
    });

    const originalError = console.error;
    console.error = mock(() => { /* suppress */ });

    try {
      const listCmd = plugin.commands[1];
      if (!listCmd) throw new Error('Missing list command');
      await listCmd.execute(['remove', '99']);
      expect(process.exitCode).toBe(1);
    } finally {
      console.error = originalError;
    }
  });
});
