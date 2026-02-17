import { Box, Static, Text, useApp, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { useState, useCallback } from 'react';
import { Thread } from '@providerprotocol/ai';
import type { LLMInstance } from '@providerprotocol/ai';
import type { Storage } from '../../sdk/storage.ts';
import type { ChatThread } from './types.ts';
import { truncateTitle } from './types.ts';
import { formatRelativeTime } from '../../sdk/format.ts';

const MAX_HISTORY_MESSAGES = 10;

interface ChatMessage {
  readonly role: 'user' | 'assistant' | 'system';
  readonly text: string;
}

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

interface ChatReplProps {
  readonly model: LLMInstance;
  readonly storage: Storage<ChatThread>;
  readonly existing?: ChatThread;
}

/** Fully interactive chat REPL rendered with Ink. */
export function ChatRepl({ model, storage, existing }: ChatReplProps) {
  const { exit } = useApp();
  const [thread] = useState(() =>
    existing ? Thread.fromJSON(existing.thread) : new Thread(),
  );
  const [chatThread, setChatThread] = useState<ChatThread>(() =>
    existing ?? {
      id: thread.id,
      title: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thread: thread.toJSON(),
    },
  );
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    if (!existing) {
      return [{ role: 'system', text: 'New chat started. Type /exit or press Ctrl+C to end.' }];
    }
    const total = existing.thread.messages.length;
    const header: ChatMessage[] = [
      { role: 'system', text: `Resuming: ${existing.title} (${String(total)} messages, ${formatRelativeTime(existing.updatedAt)})` },
    ];
    if (total > MAX_HISTORY_MESSAGES) {
      header.push({ role: 'system', text: `… ${String(total - MAX_HISTORY_MESSAGES)} earlier messages hidden` });
    }
    const messages = thread.tail(MAX_HISTORY_MESSAGES);
    return [
      ...header,
      ...messages.map((msg) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        text: msg.text.trim(),
      })),
    ];
  });
  const [streaming, setStreaming] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const handleSubmit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '/exit') {
      exit();
      return;
    }

    setHistory((prev) => [...prev, { role: 'user', text: trimmed }]);
    setIsStreaming(true);
    setStreaming('');
    setStreamError(null);

    let updatedThread = chatThread;
    if (updatedThread.title === '') {
      updatedThread = { ...updatedThread, title: truncateTitle(trimmed) };
      setChatThread(updatedThread);
    }

    void (async () => {
      try {
        const stream = model.stream(thread, trimmed);
        let fullText = '';

        for await (const event of stream) {
          if (event.type === 'text_delta') {
            const delta = event.delta.text ?? '';
            fullText += delta;
            setStreaming(fullText);
          }
        }

        const turn = await stream.turn;
        thread.append(turn);

        setHistory((prev) => [...prev, { role: 'assistant', text: fullText }]);

        const updated: ChatThread = {
          ...updatedThread,
          updatedAt: new Date().toISOString(),
          thread: thread.toJSON(),
        };
        setChatThread(updated);
        await saveThread(storage, updated);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setStreamError(message);
      } finally {
        setIsStreaming(false);
        setStreaming('');
      }
    })();
  }, [model, thread, chatThread, storage, exit]);

  return (
    <Box flexDirection="column">
      <Static items={history}>
        {(msg, i) => (
          <Text key={i}>
            {msg.role === 'system'
              ? <Text dimColor>{msg.text}</Text>
              : msg.role === 'user'
                ? <Text><Text color="cyan">You:</Text> {msg.text}</Text>
                : <Text><Text color="green">Ava:</Text> {msg.text}</Text>}
          </Text>
        )}
      </Static>

      {isStreaming && streaming !== '' && (
        <Text><Text color="green">Ava:</Text> {streaming}</Text>
      )}

      {streamError !== null && (
        <Text color="red">Error: {streamError}</Text>
      )}

      {!isStreaming && (
        <Box>
          <Text color="cyan">You: </Text>
          <TextInput onSubmit={handleSubmit} />
        </Box>
      )}
    </Box>
  );
}
