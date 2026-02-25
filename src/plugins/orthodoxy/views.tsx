/** @jsxImportSource react */
import { Box, Text } from 'ink';
import type { OrthodoxDay } from './types.ts';

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

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const FASTING_DESCRIPTIONS: Readonly<Record<string, string>> = {
  'Strict Fast': '(No meat, fish, dairy, eggs, wine, or oil)',
  'Fast Day (Fish Allowed)': '(No meat, dairy, or eggs — fish permitted)',
  'Fast Day (Wine and Oil Allowed)': '(No meat, fish, dairy, or eggs — wine and oil permitted)',
  'Fast Day (Dairy, Eggs, and Fish Allowed)': '(No meat — dairy, eggs, and fish permitted)',
  'Fast Free': '(No fasting restrictions)',
};

export function SnapshotView({ day }: { readonly day: OrthodoxDay }) {
  const displayDate = formatDisplayDate(day.date);
  const fastLabel = day.fasting ?? 'No Fast';

  return (
    <Box flexDirection="column">
      <Text>{'\n'}  <Text bold>{CROSS} Orthodox Day</Text> <Text dimColor>— {displayDate}</Text>{'\n'}</Text>
      <Text>  <Text color="yellow">{day.summary}</Text>{'\n'}</Text>

      {day.saints.length > 0 && (
        <Box flexDirection="column">
          <Text>  <Text bold>Saints &amp; Feasts:</Text></Text>
          {day.saints.map((saint, i) => (
            <Text key={i}>    <Text color="cyan">{'\u2022'}</Text> {saint}</Text>
          ))}
          <Text>{''}</Text>
        </Box>
      )}

      <Text>  <Text bold>Fasting:</Text> {fastLabel}{'\n'}</Text>

      {day.readings.length > 0 && (
        <Box flexDirection="column">
          <Text>  <Text bold>Readings:</Text></Text>
          {day.readings.map((reading, i) => (
            <Text key={i}>    <Text color="cyan">{reading.type.replace(' Reading', '')}</Text> <Text dimColor>—</Text> {reading.reference}</Text>
          ))}
          <Text>{''}</Text>
        </Box>
      )}
    </Box>
  );
}

export function FastingView({ day }: { readonly day: OrthodoxDay }) {
  const shortDate = formatShortDate(day.date);
  const fastLabel = day.fasting ?? 'No Fast';
  const desc = FASTING_DESCRIPTIONS[day.fasting ?? ''];

  return (
    <Box flexDirection="column">
      <Text>{'\n'}  <Text bold>{CROSS} Today&apos;s Fast</Text> <Text dimColor>— {shortDate}</Text>{'\n'}</Text>
      <Text>  {fastLabel}</Text>
      {desc !== undefined && <Text>  <Text dimColor>{desc}</Text></Text>}
      <Text>{''}</Text>
    </Box>
  );
}

export function SaintsView({ day }: { readonly day: OrthodoxDay }) {
  const shortDate = formatShortDate(day.date);

  return (
    <Box flexDirection="column">
      <Text>{'\n'}  <Text bold>{CROSS} Saints &amp; Feasts</Text> <Text dimColor>— {shortDate}</Text>{'\n'}</Text>
      {day.saints.length === 0
        ? <Text>  <Text dimColor>No saints listed for today.</Text></Text>
        : day.saints.map((saint, i) => (
          <Text key={i}>    <Text color="cyan">{i + 1}.</Text> {saint}</Text>
        ))}
      <Text>{''}</Text>
    </Box>
  );
}

export function ReadingsView({ day }: { readonly day: OrthodoxDay }) {
  const shortDate = formatShortDate(day.date);

  return (
    <Box flexDirection="column">
      <Text>{'\n'}  <Text bold>{CROSS} Scripture Readings</Text> <Text dimColor>— {shortDate}</Text>{'\n'}</Text>
      {day.readings.length === 0
        ? <><Text>  <Text dimColor>No readings listed for today.</Text></Text><Text>{''}</Text></>
        : day.readings.map((reading, i) => (
          <Box key={i} flexDirection="column">
            <Text>  <Text bold>{reading.type}:</Text> {reading.reference}</Text>
            <Text>  <Text dimColor>{'─'.repeat(37)}</Text></Text>
            <Text>  {reading.text}{'\n'}</Text>
          </Box>
        ))}
    </Box>
  );
}

export function FeastsView({ day }: { readonly day: OrthodoxDay }) {
  const shortDate = formatShortDate(day.date);

  return (
    <Box flexDirection="column">
      <Text>{'\n'}  <Text bold>{CROSS} Feasts &amp; Celebrations</Text> <Text dimColor>— {shortDate}</Text>{'\n'}</Text>
      <Text>  {day.summary}{'\n'}</Text>
    </Box>
  );
}
