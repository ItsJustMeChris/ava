/** @jsxImportSource react */
import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { ChatThread } from './types.ts';
import { Storage } from '../../sdk/storage.ts';
import { formatRelativeTime } from '../../sdk/format.ts';
import { EntryLine } from '../../components/EntryLine.tsx';

const MAX_SUMMARY_ENTRIES = 3;
const storage = new Storage<ChatThread>('chats');

/** Dashboard widget showing recent chat threads. */
export async function ChatWidget(): Promise<ReactNode> {
  const threads = await storage.loadAll();
  if (threads.length === 0) return null;

  const recent = threads.slice(-MAX_SUMMARY_ENTRIES).reverse();

  return (
    <Box flexDirection="column">
      <Text color="yellow">  Chats ({threads.length}):</Text>
      {recent.map((t, i) => (
        <EntryLine
          key={t.id}
          index={threads.length - 1 - i}
          text={t.title}
          time={formatRelativeTime(t.updatedAt)}
        />
      ))}
    </Box>
  );
}
