import type { AvaPlugin, DashboardPluginConfig, DashboardWidget, Entry } from './types.ts';
import { Storage } from './storage.ts';
import { ANSI, colorize, formatEntryLine, formatRelativeTime } from './format.ts';

async function handleRemove(
  storage: Storage<Entry>,
  config: DashboardPluginConfig,
  args: readonly string[],
): Promise<void> {
  const raw = args[0];
  if (!raw) {
    console.error(colorize(`Error: Please provide an index. Usage: ava ${config.plural} remove <#>`, ANSI.red));
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
      ? `You have no ${config.plural}.`
      : `Valid range: 1–${String(count)}.`;
    console.error(colorize(`Error: No ${config.name} at index ${String(index)}. ${range}`, ANSI.red));
    process.exitCode = 1;
    return;
  }

  console.log(
    `${colorize('✓', ANSI.green)} ${config.name} removed: ${colorize(removed.text, ANSI.cyan)}`,
  );
}

/**
 * Factory that creates a dashboard plugin with add (singular) and list (plural) commands.
 * @param config - Dashboard plugin configuration.
 */
export function createDashboardPlugin(config: DashboardPluginConfig): AvaPlugin {
  const storage = new Storage<Entry>(config.plural, config.dataDir);

  const MAX_SUMMARY_ENTRIES = 3;

  const title = config.plural.charAt(0).toUpperCase() + config.plural.slice(1);

  return {
    name: config.name,
    description: config.description,
    async widget(): Promise<DashboardWidget | null> {
      const entries = await storage.loadAll();
      if (entries.length === 0) return null;

      const recent = entries.slice(-MAX_SUMMARY_ENTRIES).reverse();
      const lines: string[] = [
        colorize(`  ${title} (${String(entries.length)}):`, ANSI.yellow),
        ...recent.map((e, i) => formatEntryLine(i, e.text, formatRelativeTime(e.createdAt))),
      ];
      return { lines };
    },
    commands: [
      {
        name: config.name,
        description: `${config.addVerb} a new ${config.name}`,
        usage: `${config.name} <text>`,
        async execute(args) {
          const text = args.join(' ').trim();
          if (text === '') {
            console.error(
              colorize(`Error: Please provide ${config.name} text.`, ANSI.red),
            );
            process.exitCode = 1;
            return;
          }

          const entry: Entry = {
            id: crypto.randomUUID(),
            text,
            createdAt: new Date().toISOString(),
          };

          await storage.append(entry);
          console.log(
            `${colorize('✓', ANSI.green)} ${config.name} added: ${colorize(text, ANSI.cyan)}`,
          );
        },
      },
      {
        name: config.plural,
        description: `List or manage ${config.plural}`,
        usage: `${config.plural} [remove <#>]`,
        async execute(args) {
          if (args.length > 0 && args[0] === 'remove') {
            await handleRemove(storage, config, args.slice(1));
            return;
          }

          const entries = await storage.loadAll();

          if (entries.length === 0) {
            console.log(
              colorize(`No ${config.plural} yet. Add one with: ava ${config.name} <text>`, ANSI.dim),
            );
            return;
          }

          console.log(
            colorize(`\n  ${config.plural.charAt(0).toUpperCase()}${config.plural.slice(1)} (${String(entries.length)}):\n`, ANSI.bold),
          );

          for (const [i, entry] of entries.entries()) {
            const relTime = formatRelativeTime(entry.createdAt);
            console.log(formatEntryLine(i, entry.text, relTime));
          }

          console.log();
        },
      },
    ],
  };
}
