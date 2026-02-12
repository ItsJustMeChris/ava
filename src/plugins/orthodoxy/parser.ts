/** ICS parser for the GOARCH Orthodox liturgical planner. */

import { join } from 'node:path';
import type { OrthodoxDay, OrthodoxReading } from './types.ts';

const ICS_PATH = join(import.meta.dirname, '..', '..', '..', 'planner2025-en.ics');

/** Unescapes ICS field values (escaped commas, newlines, and quotes). */
function unescapeIcs(raw: string): string {
  return raw.replaceAll('\\,', ',').replaceAll('\\n', '\n').replaceAll('\\"', '"');
}

/** Extracts a named ICS field value from an event block. */
function extractField(block: string, fieldName: string): string | null {
  const pattern = new RegExp(`^${fieldName}[^:]*:(.*)$`, 'm');
  const match = pattern.exec(block);
  if (!match) return null;
  const value = match[1];
  return value !== undefined ? value.trim() : null;
}

/** Converts YYYYMMDD to YYYY-MM-DD. */
function formatDate(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

const FASTING_PATTERNS: readonly string[] = [
  'Strict Fast',
  'Fast Day (Dairy, Eggs, and Fish Allowed)',
  'Fast Day (Fish Allowed)',
  'Fast Day (Wine and Oil Allowed)',
  'Fast Free',
];

/** Detects fasting rule from unescaped description text. */
function parseFasting(description: string): string | null {
  for (const pattern of FASTING_PATTERNS) {
    if (description.includes(pattern)) {
      return pattern;
    }
  }
  return null;
}

const READING_HEADER_PATTERN = /^(Epistle Reading|Gospel Reading|Matins Gospel Reading|Old Testament Reading):\s*(.+)$/m;

/** Parses scripture readings from unescaped description text. */
function parseReadings(description: string): OrthodoxReading[] {
  const readings: OrthodoxReading[] = [];
  const lines = description.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    const match = READING_HEADER_PATTERN.exec(line);
    if (!match) continue;

    const type = match[1] ?? '';
    const reference = (match[2] ?? '').trim();
    const textLines: string[] = [];

    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j];
      if (nextLine === undefined || READING_HEADER_PATTERN.test(nextLine)) {
        break;
      }
      textLines.push(nextLine);
    }

    readings.push({ type, reference, text: textLines.join('\n').trim() });
  }

  return readings;
}

/** Parses saints/feasts list from unescaped description text. */
function parseSaints(description: string): string[] {
  const marker = 'Saints and Feasts:';
  const idx = description.indexOf(marker);
  if (idx === -1) return [];

  const afterMarker = description.slice(idx + marker.length);
  const endIdx = afterMarker.indexOf('\n\n');
  const block = endIdx === -1 ? afterMarker : afterMarker.slice(0, endIdx);

  return block
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Parses a single VEVENT block into an OrthodoxDay. */
function parseEvent(block: string): OrthodoxDay | null {
  const dateRaw = extractField(block, 'DTSTART');
  const summary = extractField(block, 'SUMMARY');
  const descriptionRaw = extractField(block, 'DESCRIPTION');

  if (!dateRaw || !summary || !descriptionRaw) return null;

  const description = unescapeIcs(descriptionRaw);

  return {
    date: formatDate(dateRaw),
    summary: unescapeIcs(summary),
    saints: parseSaints(description),
    fasting: parseFasting(description),
    readings: parseReadings(description),
  };
}

/** Reads and parses the bundled ICS file into OrthodoxDay entries. */
export async function parseIcsFile(path?: string): Promise<OrthodoxDay[]> {
  const filePath = path ?? ICS_PATH;
  const content = await Bun.file(filePath).text();
  const blocks = content.split('BEGIN:VEVENT');
  const days: OrthodoxDay[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const segment = blocks[i];
    if (segment === undefined) continue;
    const endIdx = segment.indexOf('END:VEVENT');
    const eventBlock = endIdx === -1 ? segment : segment.slice(0, endIdx);
    const day = parseEvent(eventBlock);
    if (day) {
      days.push(day);
    }
  }

  return days;
}

/** Finds the entry matching today's date. */
export function findToday(days: readonly OrthodoxDay[], now?: Date): OrthodoxDay | undefined {
  const ref = now ?? new Date();
  const year = String(ref.getFullYear());
  const month = String(ref.getMonth() + 1).padStart(2, '0');
  const day = String(ref.getDate()).padStart(2, '0');
  const target = `${year}-${month}-${day}`;

  return days.find((d) => d.date === target);
}
