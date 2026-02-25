/** @jsxImportSource react */
import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { AvaPlugin, DashboardPluginConfig, Entry } from './types.ts';
import { Storage } from './storage.ts';
import { formatRelativeTime } from './format.ts';
import { EntryLine } from '../components/EntryLine.tsx';
import { EntryList } from '../components/EntryList.tsx';

async function handleRemove(
  storage: Storage<Entry>,
  config: DashboardPluginConfig,
  args: readonly string[],
): Promise<ReactNode> {
  const raw = args[0];
  if (!raw) {
    process.exitCode = 1;
    return <Text color="red">Error: Please provide an index. Usage: ava {config.plural} remove &lt;#&gt;</Text>;
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
      ? `You have no ${config.plural}.`
      : `Valid range: 1–${String(count)}.`;
    process.exitCode = 1;
    return <Text color="red">Error: No {config.name} at index {index}. {range}</Text>;
  }

  return <Text><Text color="green">✓</Text> {config.name} removed: <Text color="cyan">{removed.text}</Text></Text>;
}

/**
 * Factory that creates a dashboard plugin with add (singular) and list (plural) commands.
 * @param config - Dashboard plugin configuration.
 */
export function createDashboardPlugin(config: DashboardPluginConfig): AvaPlugin {
  const storage = new Storage<Entry>(config.plural, config.dataDir);

  const MAX_SUMMARY_ENTRIES = 3;
  const title = config.plural.charAt(0).toUpperCase() + config.plural.slice(1);

  async function Widget(): Promise<ReactNode> {
    const entries = await storage.loadAll();
    if (entries.length === 0) return null;

    const recent = entries.slice(-MAX_SUMMARY_ENTRIES).reverse();

    return (
      <Box flexDirection="column">
        <Text color="yellow">  {title} ({entries.length}):</Text>
        {recent.map((e, i) => (
          <EntryLine key={e.id} index={i} text={e.text} time={formatRelativeTime(e.createdAt)} />
        ))}
      </Box>
    );
  }

  return {
    name: config.name,
    description: config.description,
    Widget,
    commands: [
      {
        name: config.name,
        description: `${config.addVerb} a new ${config.name}`,
        usage: `${config.name} <text>`,
        async execute(args): Promise<ReactNode> {
          const text = args.join(' ').trim();
          if (text === '') {
            process.exitCode = 1;
            return <Text color="red">Error: Please provide {config.name} text.</Text>;
          }

          const entry: Entry = {
            id: crypto.randomUUID(),
            text,
            createdAt: new Date().toISOString(),
          };

          await storage.append(entry);
          return <Text><Text color="green">✓</Text> {config.name} added: <Text color="cyan">{text}</Text></Text>;
        },
      },
      {
        name: config.plural,
        description: `List or manage ${config.plural}`,
        usage: `${config.plural} [remove <#>]`,
        async execute(args): Promise<ReactNode> {
          if (args.length > 0 && args[0] === 'remove') {
            return handleRemove(storage, config, args.slice(1));
          }

          const entries = await storage.loadAll();
          const items = entries.map((e) => ({
            text: e.text,
            time: formatRelativeTime(e.createdAt),
          }));

          return (
            <EntryList
              title={title}
              count={entries.length}
              entries={items}
              emptyMessage={`No ${config.plural} yet. Add one with: ava ${config.name} <text>`}
            />
          );
        },
      },
    ],
  };
}
