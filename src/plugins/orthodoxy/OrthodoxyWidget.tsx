import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import { parseIcsFile, findToday } from './parser.ts';

const CROSS = '\u2626';

function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Compact dashboard widget for today's liturgical data. */
export async function OrthodoxyWidget(): Promise<ReactNode> {
  const days = await parseIcsFile();
  const day = findToday(days);
  if (!day) return null;

  const displayDate = formatDisplayDate(day.date);
  const fastLabel = day.fasting ?? 'No Fast';

  return (
    <Box flexDirection="column">
      <Text>  <Text bold>{CROSS} Orthodoxy</Text> <Text dimColor>— {displayDate}</Text></Text>
      <Text>    {day.summary}</Text>
      <Text>    <Text bold>Fasting:</Text> {fastLabel}</Text>
    </Box>
  );
}
