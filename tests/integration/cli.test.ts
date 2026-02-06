import { afterEach, describe, expect, test } from 'bun:test';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const SCRATCHPAD = '/private/tmp/claude-501/ava-cli-tests';
const CLI_PATH = join(import.meta.dirname, '..', '..', 'index.ts');

function makeDataDir(): string {
  return join(SCRATCHPAD, crypto.randomUUID());
}

async function runCli(args: string[], dataDir: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(['bun', 'run', CLI_PATH, ...args], {
    env: { ...process.env, AVA_DATA_DIR: dataDir },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

afterEach(async () => {
  try {
    await rm(SCRATCHPAD, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
});

describe('CLI integration', () => {
  test('shows help with no arguments', async () => {
    const { stdout, exitCode } = await runCli([], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Ava');
    expect(stdout).toContain('todo');
    expect(stdout).toContain('thought');
    expect(stdout).toContain('idea');
  });

  test('shows help with help command', async () => {
    const { stdout, exitCode } = await runCli(['help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Ava');
  });

  test('shows help with --help flag', async () => {
    const { stdout, exitCode } = await runCli(['--help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Ava');
  });

  test('exits with error for unknown command', async () => {
    const { stderr, exitCode } = await runCli(['nonexistent'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown command');
  });

  test('adds and lists a todo', async () => {
    const dataDir = makeDataDir();

    const addResult = await runCli(['todo', 'Buy', 'milk'], dataDir);
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('Buy milk');

    const listResult = await runCli(['todos'], dataDir);
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain('Buy milk');
  });

  test('adds and lists a thought', async () => {
    const dataDir = makeDataDir();

    const addResult = await runCli(['thought', 'The sky is blue'], dataDir);
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('The sky is blue');

    const listResult = await runCli(['thoughts'], dataDir);
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain('The sky is blue');
  });

  test('adds and lists an idea', async () => {
    const dataDir = makeDataDir();

    const addResult = await runCli(['idea', 'Build a rocket'], dataDir);
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('Build a rocket');

    const listResult = await runCli(['ideas'], dataDir);
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain('Build a rocket');
  });

  test('shows error when adding without text', async () => {
    const { stderr, exitCode } = await runCli(['todo'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  test('shows empty message when listing with no entries', async () => {
    const { stdout, exitCode } = await runCli(['todos'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('No todos yet');
  });

  test('removes a todo by index', async () => {
    const dataDir = makeDataDir();

    await runCli(['todo', 'first'], dataDir);
    await runCli(['todo', 'second'], dataDir);
    await runCli(['todo', 'third'], dataDir);

    const removeResult = await runCli(['todos', 'remove', '2'], dataDir);
    expect(removeResult.exitCode).toBe(0);
    expect(removeResult.stdout).toContain('removed');
    expect(removeResult.stdout).toContain('second');

    const listResult = await runCli(['todos'], dataDir);
    expect(listResult.stdout).toContain('first');
    expect(listResult.stdout).not.toContain('second');
    expect(listResult.stdout).toContain('third');
  });

  test('remove errors with no index', async () => {
    const { stderr, exitCode } = await runCli(['todos', 'remove'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  test('remove errors with out-of-range index', async () => {
    const dataDir = makeDataDir();
    await runCli(['todo', 'only one'], dataDir);

    const { stderr, exitCode } = await runCli(['todos', 'remove', '5'], dataDir);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  test('remove errors with invalid index', async () => {
    const { stderr, exitCode } = await runCli(['todos', 'remove', 'abc'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });
});
