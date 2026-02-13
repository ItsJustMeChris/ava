/** Rendering functions for Orthodox liturgical display. */

import { ANSI, colorize } from '../../sdk/format.ts';
import type { DashboardWidget } from '../../sdk/types.ts';
import type { OrthodoxDay } from './types.ts';

const CROSS = '\u2626';

/** Formats a date string (YYYY-MM-DD) as a human-readable date with day name. */
function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Formats a date string (YYYY-MM-DD) as month and day only. */
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

/** Renders the full daily snapshot view. */
export function renderSnapshot(day: OrthodoxDay): void {
  const displayDate = formatDisplayDate(day.date);
  console.log(`\n  ${colorize(`${CROSS} Orthodox Day`, ANSI.bold)} ${colorize(`\u2014 ${displayDate}`, ANSI.dim)}\n`);
  console.log(`  ${colorize(day.summary, ANSI.yellow)}\n`);

  if (day.saints.length > 0) {
    console.log(`  ${colorize('Saints & Feasts:', ANSI.bold)}`);
    for (const saint of day.saints) {
      console.log(`    ${colorize('\u2022', ANSI.cyan)} ${saint}`);
    }
    console.log();
  }

  const fastLabel = day.fasting ?? 'No Fast';
  console.log(`  ${colorize('Fasting:', ANSI.bold)} ${fastLabel}`);
  console.log();

  if (day.readings.length > 0) {
    console.log(`  ${colorize('Readings:', ANSI.bold)}`);
    for (const reading of day.readings) {
      const typeLabel = reading.type.replace(' Reading', '');
      console.log(`    ${colorize(typeLabel, ANSI.cyan)} ${colorize('\u2014', ANSI.dim)} ${reading.reference}`);
    }
    console.log();
  }
}

/** Renders fasting information for the day. */
export function renderFasting(day: OrthodoxDay): void {
  const shortDate = formatShortDate(day.date);
  console.log(`\n  ${colorize(`${CROSS} Today's Fast`, ANSI.bold)} ${colorize(`\u2014 ${shortDate}`, ANSI.dim)}\n`);

  const fastLabel = day.fasting ?? 'No Fast';
  console.log(`  ${fastLabel}`);

  const desc = FASTING_DESCRIPTIONS[day.fasting ?? ''];
  if (desc) {
    console.log(`  ${colorize(desc, ANSI.dim)}`);
  }
  console.log();
}

/** Renders the saints and feasts list. */
export function renderSaints(day: OrthodoxDay): void {
  const shortDate = formatShortDate(day.date);
  console.log(`\n  ${colorize(`${CROSS} Saints & Feasts`, ANSI.bold)} ${colorize(`\u2014 ${shortDate}`, ANSI.dim)}\n`);

  if (day.saints.length === 0) {
    console.log(`  ${colorize('No saints listed for today.', ANSI.dim)}`);
  } else {
    for (const [i, saint] of day.saints.entries()) {
      console.log(`    ${colorize(`${String(i + 1)}.`, ANSI.cyan)} ${saint}`);
    }
  }
  console.log();
}

/** Renders the full scripture readings. */
export function renderReadings(day: OrthodoxDay): void {
  const shortDate = formatShortDate(day.date);
  console.log(`\n  ${colorize(`${CROSS} Scripture Readings`, ANSI.bold)} ${colorize(`\u2014 ${shortDate}`, ANSI.dim)}\n`);

  if (day.readings.length === 0) {
    console.log(`  ${colorize('No readings listed for today.', ANSI.dim)}`);
    console.log();
    return;
  }

  for (const reading of day.readings) {
    console.log(`  ${colorize(`${reading.type}:`, ANSI.bold)} ${reading.reference}`);
    console.log(`  ${colorize('\u2500'.repeat(37), ANSI.dim)}`);
    console.log(`  ${reading.text}`);
    console.log();
  }
}

/** Renders feasts and celebrations. */
export function renderFeasts(day: OrthodoxDay): void {
  const shortDate = formatShortDate(day.date);
  console.log(`\n  ${colorize(`${CROSS} Feasts & Celebrations`, ANSI.bold)} ${colorize(`\u2014 ${shortDate}`, ANSI.dim)}\n`);
  console.log(`  ${day.summary}`);
  console.log();
}

/** Builds a compact dashboard widget for today's liturgical data. */
export function renderDashboardWidget(day: OrthodoxDay): DashboardWidget {
  const displayDate = formatDisplayDate(day.date);
  const header = `  ${colorize(`${CROSS} Orthodoxy`, ANSI.bold)} ${colorize(`\u2014 ${displayDate}`, ANSI.dim)}`;
  const summary = `    ${day.summary}`;
  const fasting = day.fasting
    ? `    ${colorize('Fasting:', ANSI.bold)} ${day.fasting}`
    : `    ${colorize('Fasting:', ANSI.bold)} No Fast`;

  return { lines: [header, summary, fasting] };
}
