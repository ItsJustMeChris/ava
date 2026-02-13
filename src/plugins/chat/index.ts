import type { AvaPlugin, DashboardWidget } from '../../sdk/types.ts';
import { Storage } from '../../sdk/storage.ts';
import { ANSI, colorize, formatEntryLine, formatRelativeTime } from '../../sdk/format.ts';
import { buildSystemPrompt } from '../../sdk/system-prompt.ts';
import { llm } from '@providerprotocol/ai';
import { openai } from '@providerprotocol/ai/openai';
import type { ChatThread } from './types.ts';
import { runRepl } from './repl.ts';

const storage = new Storage<ChatThread>('chats');
const MAX_SUMMARY_ENTRIES = 3;

async function handleRemove(args: readonly string[]): Promise<void> {
  const raw = args[0];
  if (!raw) {
    console.error(colorize('Error: Please provide an index. Usage: ava chats remove <#>', ANSI.red));
    process.exitCode = 1;
    return;
  }

  const index = Number(raw);
  if (!Number.isInteger(index) || index < 1) {
    console.error(colorize(`Error: "${raw}" is not a valid index. Use a positive integer.`, ANSI.red));
    process.exitCode = 1;
    return;
  }

  const removed = await storage.removeAt(index - 1);
  if (!removed) {
    const entries = await storage.loadAll();
    const count = entries.length;
    const range = count === 0
      ? 'You have no chats.'
      : `Valid range: 1–${String(count)}.`;
    console.error(colorize(`Error: No chat at index ${String(index)}. ${range}`, ANSI.red));
    process.exitCode = 1;
    return;
  }

  console.log(
    `${colorize('✓', ANSI.green)} Chat removed: ${colorize(removed.title, ANSI.cyan)}`,
  );
}

export const chatPlugin: AvaPlugin = {
  name: 'chat',
  description: 'Interactive multi-turn chat',
  async widget(): Promise<DashboardWidget | null> {
    const threads = await storage.loadAll();
    if (threads.length === 0) return null;

    const recent = threads.slice(-MAX_SUMMARY_ENTRIES).reverse();
    const lines: string[] = [
      colorize(`  Chats (${String(threads.length)}):`, ANSI.yellow),
      ...recent.map((t, i) => formatEntryLine(i, t.title, formatRelativeTime(t.updatedAt))),
    ];
    return { lines };
  },
  commands: [
    {
      name: 'chat',
      description: 'Start or resume an interactive conversation',
      usage: 'chat [#]',
      async execute(args) {
        const model = llm({
          model: openai('gpt-5.2'),
          system: buildSystemPrompt(),
        });

        const indexArg = args[0];

        if (indexArg !== undefined) {
          const index = Number(indexArg);
          if (!Number.isInteger(index) || index < 1) {
            console.error(colorize(`Error: "${indexArg}" is not a valid index. Use a positive integer.`, ANSI.red));
            process.exitCode = 1;
            return;
          }

          const threads = await storage.loadAll();
          const thread = threads[index - 1];
          if (!thread) {
            const count = threads.length;
            const range = count === 0
              ? 'You have no chats.'
              : `Valid range: 1–${String(count)}.`;
            console.error(colorize(`Error: No chat at index ${String(index)}. ${range}`, ANSI.red));
            process.exitCode = 1;
            return;
          }

          await runRepl(model, storage, thread);
          return;
        }

        await runRepl(model, storage);
      },
    },
    {
      name: 'chats',
      description: 'List or manage chat threads',
      usage: 'chats [remove <#>]',
      async execute(args) {
        if (args.length > 0 && args[0] === 'remove') {
          await handleRemove(args.slice(1));
          return;
        }

        const threads = await storage.loadAll();

        if (threads.length === 0) {
          console.log(
            colorize('No chats yet. Start one with: ava chat', ANSI.dim),
          );
          return;
        }

        console.log(
          colorize(`\n  Chats (${String(threads.length)}):\n`, ANSI.bold),
        );

        for (const [i, thread] of threads.entries()) {
          const relTime = formatRelativeTime(thread.updatedAt);
          console.log(formatEntryLine(i, thread.title, relTime));
        }

        console.log();
      },
    },
  ],
};
