import { afterEach, describe, expect, test } from 'bun:test';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
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
  test('shows welcome dashboard with no arguments and no entries', async () => {
    const { stdout, exitCode } = await runCli([], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Welcome to Ava');
    expect(stdout).toContain('todo');
    expect(stdout).toContain('thought');
    expect(stdout).toContain('idea');
  });

  test('shows dashboard with entries when no arguments', async () => {
    const dataDir = makeDataDir();

    await runCli(['todo', 'Buy milk'], dataDir);
    await runCli(['idea', 'Build a rocket'], dataDir);

    const { stdout, exitCode } = await runCli([], dataDir);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Dashboard');
    expect(stdout).toContain('Buy milk');
    expect(stdout).toContain('Build a rocket');
  });

  test('shows help with help command', async () => {
    const { stdout, exitCode } = await runCli(['help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Ava');
    expect(stdout).toContain('todo');
  });

  test('shows help with --help flag', async () => {
    const { stdout, exitCode } = await runCli(['--help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Ava');
    expect(stdout).toContain('todo');
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

describe('ask command integration', () => {
  test('exits with error when no prompt provided', async () => {
    const { stderr, exitCode } = await runCli(['ask'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Please provide a question');
  });

  test('shows ask command in help output', async () => {
    const { stdout, exitCode } = await runCli(['help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('ask');
  });

  const hasOpenAIKey = process.env.OPENAI_API_KEY !== undefined && process.env.OPENAI_API_KEY !== '';

  test.skipIf(!hasOpenAIKey)('streams a response for a simple question', async () => {
    const { stdout, exitCode } = await runCli(['ask', 'What is 2+2? Reply with just the number.'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('4');
  }, 30_000);
});

describe('random command integration', () => {
  test('shows help with no subcommand', async () => {
    const { stdout, exitCode } = await runCli(['random'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('random');
    expect(stdout).toContain('bytes');
    expect(stdout).toContain('uuid');
    expect(stdout).toContain('color');
  });

  test('generates random bytes', async () => {
    const { stdout, exitCode } = await runCli(['random', 'bytes'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/[0-9a-f]{32}/);
  });

  test('generates random bytes with custom length', async () => {
    const { stdout, exitCode } = await runCli(['random', 'bytes', '8'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/[0-9a-f]{16}/);
  });

  test('generates random words', async () => {
    const { stdout, exitCode } = await runCli(['random', 'words'], makeDataDir());
    expect(exitCode).toBe(0);
    const clean = stdout.trim().replace(ANSI_PATTERN, '');
    const parts = clean.split('-');
    expect(parts).toHaveLength(4);
  });

  test('generates random string', async () => {
    const { stdout, exitCode } = await runCli(['random', 'string'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/[A-Za-z0-9]/);
  });

  test('generates random playful name', async () => {
    const { stdout, exitCode } = await runCli(['random', 'playful'], makeDataDir());
    expect(exitCode).toBe(0);
    const clean = stdout.trim().replace(ANSI_PATTERN, '');
    const parts = clean.split('-');
    expect(parts).toHaveLength(4);
  });

  test('generates uuid', async () => {
    const { stdout, exitCode } = await runCli(['random', 'uuid'], makeDataDir());
    expect(exitCode).toBe(0);
    const clean = stdout.trim().replace(ANSI_PATTERN, '');
    expect(clean).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('generates random int', async () => {
    const { stdout, exitCode } = await runCli(['random', 'int'], makeDataDir());
    expect(exitCode).toBe(0);
    const clean = stdout.trim().replace(ANSI_PATTERN, '');
    const num = Number(clean);
    expect(Number.isInteger(num)).toBe(true);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThanOrEqual(100);
  });

  test('generates random int with custom range', async () => {
    const { stdout, exitCode } = await runCli(['random', 'int', '1', '5'], makeDataDir());
    expect(exitCode).toBe(0);
    const clean = stdout.trim().replace(ANSI_PATTERN, '');
    const num = Number(clean);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(5);
  });

  test('generates random hex', async () => {
    const { stdout, exitCode } = await runCli(['random', 'hex'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/[0-9a-f]{32}/);
  });

  test('generates random color', async () => {
    const { stdout, exitCode } = await runCli(['random', 'color'], makeDataDir());
    expect(exitCode).toBe(0);
    const clean = stdout.trim().replace(ANSI_PATTERN, '');
    expect(clean).toMatch(/^█{5} #[0-9a-f]{6}$/);
  });

  test('generates multiple random colors with count', async () => {
    const { stdout, exitCode } = await runCli(['random', 'color', '3'], makeDataDir());
    expect(exitCode).toBe(0);
    const lines = stdout.trim().replace(ANSI_PATTERN, '').split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line).toMatch(/^█{5} #[0-9a-f]{6}$/);
    }
  });

  test('errors on unknown subcommand', async () => {
    const { stderr, exitCode } = await runCli(['random', 'bogus'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown random type');
  });

  test('errors on invalid numeric argument', async () => {
    const { stderr, exitCode } = await runCli(['random', 'bytes', 'abc'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  test('errors when int min >= max', async () => {
    const { stderr, exitCode } = await runCli(['random', 'int', '10', '5'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('min must be less than max');
  });

  test('shows random command in help output', async () => {
    const { stdout, exitCode } = await runCli(['help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('random');
  });
});

describe('chat command integration', () => {
  test('shows chat and chats commands in help output', async () => {
    const { stdout, exitCode } = await runCli(['help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('chat');
    expect(stdout).toContain('chats');
  });

  test('shows empty message when listing with no chats', async () => {
    const { stdout, exitCode } = await runCli(['chats'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('No chats yet');
  });

  test('errors with invalid resume index', async () => {
    const { stderr, exitCode } = await runCli(['chat', 'abc'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('not a valid index');
  });

  test('errors with out-of-range resume index', async () => {
    const { stderr, exitCode } = await runCli(['chat', '99'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('No chat at index');
  });

  test('chats remove errors with no index', async () => {
    const { stderr, exitCode } = await runCli(['chats', 'remove'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  test('chats remove errors with invalid index', async () => {
    const { stderr, exitCode } = await runCli(['chats', 'remove', 'xyz'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  test('chats remove errors with out-of-range index', async () => {
    const { stderr, exitCode } = await runCli(['chats', 'remove', '5'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });
});

describe('orthodoxy command integration', () => {
  test('shows snapshot with no subcommand', async () => {
    const { stdout, exitCode } = await runCli(['orthodoxy'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Orthodox Day');
    expect(stdout).toContain('2026');
  });

  test('shows fasting info', async () => {
    const { stdout, exitCode } = await runCli(['orthodoxy', 'fast'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Today's Fast");
  });

  test('shows saints list', async () => {
    const { stdout, exitCode } = await runCli(['orthodoxy', 'saints'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Saints & Feasts');
  });

  test('shows scripture readings', async () => {
    const { stdout, exitCode } = await runCli(['orthodoxy', 'readings'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Scripture Readings');
  });

  test('shows feasts and celebrations', async () => {
    const { stdout, exitCode } = await runCli(['orthodoxy', 'feasts'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Feasts & Celebrations');
  });

  test('errors on unknown subcommand', async () => {
    const { stderr, exitCode } = await runCli(['orthodoxy', 'bogus'], makeDataDir());
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Unknown orthodoxy subcommand');
  });

  test('shows orthodoxy in help output', async () => {
    const { stdout, exitCode } = await runCli(['help'], makeDataDir());
    expect(exitCode).toBe(0);
    expect(stdout).toContain('orthodoxy');
  });
});
