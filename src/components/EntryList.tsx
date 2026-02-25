/** @jsxImportSource react */
import { Box, Text } from 'ink';
import { EntryLine } from './EntryLine.tsx';

interface EntryItem {
  readonly text: string;
  readonly time: string;
}

interface EntryListProps {
  readonly title: string;
  readonly count: number;
  readonly entries: readonly EntryItem[];
  readonly emptyMessage: string;
}

/** A titled list of entries with an empty-state fallback. */
export function EntryList({ title, count, entries, emptyMessage }: EntryListProps) {
  if (entries.length === 0) {
    return <Text dimColor>{emptyMessage}</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold>{'\n'}  {title} ({count}):{'\n'}</Text>
      {entries.map((entry, i) => (
        <EntryLine key={i} index={i} text={entry.text} time={entry.time} />
      ))}
    </Box>
  );
}
