import { render, Text } from 'ink';
import type { ReactNode } from 'react';
import type { PluginRegistry } from './sdk/index.ts';
import { buildDashboard } from './components/Dashboard.tsx';
import { HelpScreen } from './components/HelpScreen.tsx';

function renderOnce(node: ReactNode): void {
  const instance = render(node);
  instance.unmount();
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
    const dashboard = await buildDashboard(registry.list());
    renderOnce(dashboard);
    return;
  }

  if (commandName === 'help' || commandName === '--help') {
    renderOnce(<HelpScreen plugins={registry.list()} />);
    return;
  }

  const command = registry.resolve(commandName);

  if (!command) {
    process.exitCode = 1;
    renderOnce(<Text color="red">Unknown command: &quot;{commandName}&quot;. Run &quot;ava help&quot; for usage.</Text>);
    return;
  }

  try {
    const result = await command.execute(args.slice(1));

    if (result !== undefined && result !== null) {
      renderOnce(result);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
    renderOnce(<Text color="red">Error: {message}</Text>);
  }
}
