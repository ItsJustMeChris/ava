import type { PluginRegistry } from './sdk/index.ts';
import { ANSI, colorize } from './sdk/index.ts';

/** Prints all plugin commands grouped by plugin. */
function printCommands(registry: PluginRegistry): void {
  for (const plugin of registry.list()) {
    console.log(colorize(`  ${plugin.description}:`, ANSI.yellow));
    for (const cmd of plugin.commands) {
      const name = colorize(cmd.usage, ANSI.cyan);
      console.log(`    ${name}  ${colorize(cmd.description, ANSI.dim)}`);
    }
    console.log();
  }
}

/** Displays grouped help for all registered plugins. */
function showHelp(registry: PluginRegistry): void {
  console.log(colorize('\n  Ava', ANSI.bold) + colorize(' - Your personal CLI assistant\n', ANSI.dim));
  printCommands(registry);
}

/** Displays a dashboard overview of all plugin widgets. */
async function showDashboard(registry: PluginRegistry): Promise<void> {
  const hooks = registry.list()
    .map((p) => p.widget)
    .filter((w): w is NonNullable<typeof w> => w !== undefined);

  const results = await Promise.all(hooks.map((w) => w()));
  const widgets = results.filter((w): w is NonNullable<typeof w> => w !== null);

  if (widgets.length === 0) {
    console.log(colorize('\n  Welcome to Ava!', ANSI.bold));
    console.log(colorize('  Get started by adding your first entry:\n', ANSI.dim));
    printCommands(registry);
    return;
  }

  console.log(colorize('\n  Ava Dashboard\n', ANSI.bold));

  for (const widget of widgets) {
    for (const line of widget.lines) {
      console.log(line);
    }
    console.log();
  }
}

/**
 * Parses CLI arguments and dispatches to the appropriate command.
 * @param registry - The plugin registry containing all available commands.
 * @param args - CLI arguments (typically `process.argv.slice(2)`).
 */
export async function runCli(
  registry: PluginRegistry,
  args: readonly string[],
): Promise<void> {
  const commandName = args[0];

  if (!commandName) {
    await showDashboard(registry);
    return;
  }

  if (commandName === 'help' || commandName === '--help') {
    showHelp(registry);
    return;
  }

  const command = registry.resolve(commandName);

  if (!command) {
    console.error(
      colorize(`Unknown command: "${commandName}". Run "ava help" for usage.`, ANSI.red),
    );
    process.exitCode = 1;
    return;
  }

  await command.execute(args.slice(1));
}
