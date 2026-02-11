import type { Thread } from '@providerprotocol/ai';
import { ANSI, colorize, formatRelativeTime } from '../../sdk/format.ts';
import type { ChatThread } from './types.ts';

const MAX_HISTORY_MESSAGES = 10;

/** Prints the chat header with thread title and message count. */
export function printChatHeader(chatThread: ChatThread): void {
  const msgCount = chatThread.thread.messages.length;
  const time = formatRelativeTime(chatThread.updatedAt);
  console.log(
    `\n${colorize('  Resuming:', ANSI.dim)} ${colorize(chatThread.title, ANSI.bold)} `
    + `${colorize(`(${String(msgCount)} messages, ${time})`, ANSI.gray)}\n`,
  );
}

/** Replays the last N messages from a thread with role labels. */
export function printHistory(thread: Thread): void {
  const messages = thread.tail(MAX_HISTORY_MESSAGES);

  if (messages.length === 0) return;

  const totalMessages = thread.length;
  if (totalMessages > MAX_HISTORY_MESSAGES) {
    console.log(colorize(`… ${String(totalMessages - MAX_HISTORY_MESSAGES)} earlier messages hidden\n`, ANSI.gray));
  }

  for (const msg of messages) {
    const role = msg.type === 'user' ? 'You' : 'Ava';
    const roleColor = msg.type === 'user' ? ANSI.cyan : ANSI.green;
    const label = colorize(`${role}:`, roleColor);
    const text = msg.text.trim();
    const lines = text.split('\n');

    const firstLine = lines[0] ?? '';
    const padding = ' '.repeat(role.length + 2);
    console.log(`${label} ${firstLine}`);
    for (const line of lines.slice(1)) {
      console.log(`${padding}${line}`);
    }
  }
}
