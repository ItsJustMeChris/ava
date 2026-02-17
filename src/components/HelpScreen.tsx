import { Box, Text } from 'ink';
import type { AvaPlugin } from '../sdk/types.ts';

interface HelpScreenProps {
  readonly plugins: readonly AvaPlugin[];
}

/** Pretty help display showing all plugin commands grouped by plugin. */
export function HelpScreen({ plugins }: HelpScreenProps) {
  return (
    <Box flexDirection="column">
      <Text>
        {'\n'}  <Text bold>Ava</Text><Text dimColor> - Your personal CLI assistant</Text>{'\n'}
      </Text>
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
