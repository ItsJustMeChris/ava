import { createInterface } from 'node:readline/promises';
import { Thread } from '@providerprotocol/ai';
import type { LLMInstance } from '@providerprotocol/ai';
import { ANSI, colorize } from '../../sdk/format.ts';
import type { Storage } from '../../sdk/storage.ts';
import type { ChatThread } from './types.ts';
import { truncateTitle } from './types.ts';
import { printChatHeader, printHistory } from './display.ts';

/** Saves a thread back to storage, updating in-place or appending if new. */
async function saveThread(storage: Storage<ChatThread>, chatThread: ChatThread): Promise<void> {
  const all = await storage.loadAll();
  const idx = all.findIndex((t) => t.id === chatThread.id);

  if (idx >= 0) {
    all[idx] = chatThread;
  } else {
    all.push(chatThread);
  }

  await storage.save(all);
}

/** Runs the interactive REPL loop for a chat conversation. */
export async function runRepl(
  model: LLMInstance,
  storage: Storage<ChatThread>,
  existing?: ChatThread,
): Promise<void> {
  const thread = existing
    ? Thread.fromJSON(existing.thread)
    : new Thread();

  let chatThread: ChatThread = existing ?? {
    id: thread.id,
    title: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thread: thread.toJSON(),
  };

  if (existing) {
    printChatHeader(existing);
    printHistory(thread);
  } else {
    console.log(
      `\n${colorize('  New chat started.', ANSI.bold)} `
      + colorize('Type /exit or press Ctrl+C to end.\n', ANSI.dim),
    );
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY,
  });

  try {
    let active = true;
    while (active) {
      let input: string;
      try {
        input = await rl.question(colorize('You: ', ANSI.cyan));
      } catch {
        active = false;
        continue;
      }

      const trimmed = input.trim();
      if (trimmed === '' || trimmed === '/exit') {
        active = false;
        continue;
      }

      if (chatThread.title === '') {
        chatThread = { ...chatThread, title: truncateTitle(trimmed) };
      }

      process.stdout.write(colorize('Ava: ', ANSI.green));

      try {
        const stream = model.stream(thread, trimmed);

        for await (const event of stream) {
          if (event.type === 'text_delta') {
            process.stdout.write(event.delta.text ?? '');
          }
        }

        const turn = await stream.turn;
        thread.append(turn);
        process.stdout.write('\n');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(`\n${colorize(`Error: ${message}`, ANSI.red)}\n`);
        continue;
      }

      chatThread = {
        ...chatThread,
        updatedAt: new Date().toISOString(),
        thread: thread.toJSON(),
      };

      await saveThread(storage, chatThread);
    }
  } finally {
    rl.close();
    console.log(colorize('\n  Goodbye!\n', ANSI.dim));
  }
}
