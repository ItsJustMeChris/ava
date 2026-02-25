/** @jsxImportSource react */
import { Box, Text } from 'ink';

interface EntryLineProps {
  readonly index: number;
  readonly text: string;
  readonly time: string;
}

/** A single numbered entry with text and relative timestamp. */
export function EntryLine({ index, text, time }: EntryLineProps) {
  return (
    <Box gap={1} paddingLeft={2}>
      <Text color="cyan">{index + 1}.</Text>
      <Text>{text}</Text>
      <Text dimColor>{time}</Text>
    </Box>
  );
}
