import { render, Text } from 'ink';
import type { ReactNode } from 'react';
import type { AvaPlugin } from '../../sdk/types.ts';
import { Storage } from '../../sdk/storage.ts';
import { formatRelativeTime } from '../../sdk/format.ts';
import { buildSystemPrompt } from '../../sdk/system-prompt.ts';
import { llm } from '@providerprotocol/ai';
import { openai } from '@providerprotocol/ai/openai';
import type { ChatThread } from './types.ts';
import { ChatWidget } from './ChatWidget.tsx';
import { ChatRepl } from './ChatRepl.tsx';
import { EntryList } from '../../components/EntryList.tsx';

const storage = new Storage<ChatThread>('chats');

async function handleRemove(args: readonly string[]): Promise<ReactNode> {
  const raw = args[0];
  if (!raw) {
    process.exitCode = 1;
    return <Text color="red">Error: Please provide an index. Usage: ava chats remove &lt;#&gt;</Text>;
  }

  const index = Number(raw);
  if (!Number.isInteger(index) || index < 1) {
    process.exitCode = 1;
    return <Text color="red">Error: &quot;{raw}&quot; is not a valid index. Use a positive integer.</Text>;
  }

  const removed = await storage.removeAt(index - 1);
  if (!removed) {
    const entries = await storage.loadAll();
    const count = entries.length;
    const range = count === 0
      ? 'You have no chats.'
      : `Valid range: 1–${String(count)}.`;
    process.exitCode = 1;
    return <Text color="red">Error: No chat at index {index}. {range}</Text>;
  }

  return <Text><Text color="green">✓</Text> Chat removed: <Text color="cyan">{removed.title}</Text></Text>;
}

export const chatPlugin: AvaPlugin = {
  name: 'chat',
  description: 'Interactive multi-turn chat',
  Widget: ChatWidget,
  commands: [
    {
      name: 'chat',
      description: 'Start or resume an interactive conversation',
      usage: 'chat [#]',
      async execute(args): Promise<ReactNode> {
        const model = llm({
          model: openai('gpt-5.2'),
          system: buildSystemPrompt(),
        });

        const indexArg = args[0];

        if (indexArg !== undefined) {
          const index = Number(indexArg);
          if (!Number.isInteger(index) || index < 1) {
            process.exitCode = 1;
            return <Text color="red">Error: &quot;{indexArg}&quot; is not a valid index. Use a positive integer.</Text>;
          }

          const threads = await storage.loadAll();
          const thread = threads[index - 1];
          if (!thread) {
            const count = threads.length;
            const range = count === 0
              ? 'You have no chats.'
              : `Valid range: 1–${String(count)}.`;
            process.exitCode = 1;
            return <Text color="red">Error: No chat at index {index}. {range}</Text>;
          }

          const instance = render(<ChatRepl model={model} storage={storage} existing={thread} />);
          await instance.waitUntilExit();
          instance.unmount();
          return;
        }

        const instance = render(<ChatRepl model={model} storage={storage} />);
        await instance.waitUntilExit();
        instance.unmount();
      },
    },
    {
      name: 'chats',
      description: 'List or manage chat threads',
      usage: 'chats [remove <#>]',
      async execute(args): Promise<ReactNode> {
        if (args.length > 0 && args[0] === 'remove') {
          return handleRemove(args.slice(1));
        }

        const threads = await storage.loadAll();
        const items = threads.map((t) => ({
          text: t.title,
          time: formatRelativeTime(t.updatedAt),
        }));

        return (
          <EntryList
            title="Chats"
            count={threads.length}
            entries={items}
            emptyMessage="No chats yet. Start one with: ava chat"
          />
        );
      },
    },
  ],
};
