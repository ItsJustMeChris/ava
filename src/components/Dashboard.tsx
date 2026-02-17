import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { AvaPlugin } from '../sdk/types.ts';

function WelcomeScreen({ plugins }: { readonly plugins: readonly AvaPlugin[] }) {
  return (
    <Box flexDirection="column">
      <Text bold>{'\n'}  Welcome to Ava!</Text>
      <Text dimColor>  Get started by adding your first entry:{'\n'}</Text>
      <PluginCommands plugins={plugins} />
    </Box>
  );
}

function PluginCommands({ plugins }: { readonly plugins: readonly AvaPlugin[] }) {
  return (
    <Box flexDirection="column">
      {plugins.map((plugin) => (
        <Box key={plugin.name} flexDirection="column" marginBottom={1}>
          <Text color="yellow">  {plugin.description}:</Text>
          {plugin.commands.map((cmd) => (
            <Text key={cmd.name}>    <Text color="cyan">{cmd.usage}</Text>  <Text dimColor>{cmd.description}</Text></Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

/** Builds the dashboard by awaiting all plugin widgets. */
export async function buildDashboard(plugins: readonly AvaPlugin[]): Promise<ReactNode> {
  const widgetPlugins = plugins.filter((p) => p.Widget !== undefined);

  if (widgetPlugins.length === 0) {
    return <WelcomeScreen plugins={plugins} />;
  }

  const widgets = await Promise.all(
    widgetPlugins.map(async (plugin) => {
      const widget = plugin.Widget;
      if (!widget) return null;
      const content = await widget();
      if (!content) return null;
      return (
        <Box key={plugin.name} flexDirection="column" marginBottom={1}>
          {content}
        </Box>
      );
    }),
  );

  return (
    <Box flexDirection="column">
      <Text bold>{'\n'}  Ava Dashboard{'\n'}</Text>
      {widgets}
    </Box>
  );
}
