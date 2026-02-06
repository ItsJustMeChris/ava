import type { PluginRegistry } from './sdk/index.ts';
import { ANSI, colorize } from './sdk/index.ts';

/** Displays grouped help for all registered plugins. */
function showHelp(registry: PluginRegistry): void {
  console.log(colorize('\n  Ava', ANSI.bold) + colorize(' - Your personal CLI assistant\n', ANSI.dim));

  for (const plugin of registry.list()) {
    console.log(colorize(`  ${plugin.description}:`, ANSI.yellow));
    for (const cmd of plugin.commands) {
      const name = colorize(cmd.usage, ANSI.cyan);
      console.log(`    ${name}  ${colorize(cmd.description, ANSI.dim)}`);
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

  if (!commandName || commandName === 'help' || commandName === '--help') {
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
