import { describe, expect, test } from 'bun:test';
import { parseIcsFile, findToday } from '../../src/plugins/orthodoxy/parser.ts';
import { renderSnapshot, renderFasting, renderSaints, renderReadings, renderFeasts } from '../../src/plugins/orthodoxy/display.ts';
import type { OrthodoxDay } from '../../src/plugins/orthodoxy/types.ts';

const ICS_PATH = `${import.meta.dirname}/../../planner2025-en.ics`;

describe('ICS parser', () => {
  test('parses the ICS file without errors', async () => {
    const days = await parseIcsFile(ICS_PATH);
    expect(days.length).toBeGreaterThan(0);
  });

  test('each day has a valid date format', async () => {
    const days = await parseIcsFile(ICS_PATH);
    for (const day of days) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('each day has a non-empty summary', async () => {
    const days = await parseIcsFile(ICS_PATH);
    for (const day of days) {
      expect(day.summary.length).toBeGreaterThan(0);
    }
  });

  test('parses saints from description', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();
    expect(sept1!.saints).toContain('Ecclesiastical New Year');
    expect(sept1!.saints).toContain('Symeon the Stylite');
  });

  test('parses escaped commas in saint names', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();
    const hasMiasenae = sept1!.saints.some((s) => s.includes('Miasenae'));
    expect(hasMiasenae).toBe(true);
  });

  test('parses Strict Fast fasting rule', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept3 = days.find((d) => d.date === '2025-09-03');
    expect(sept3).toBeDefined();
    expect(sept3!.fasting).toBe('Strict Fast');
  });

  test('parses Fast Day (Wine and Oil Allowed)', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept14 = days.find((d) => d.date === '2025-09-14');
    expect(sept14).toBeDefined();
    expect(sept14!.fasting).toBe('Fast Day (Wine and Oil Allowed)');
  });

  test('parses Fast Day (Fish Allowed)', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const nov14 = days.find((d) => d.date === '2025-11-14');
    expect(nov14).toBeDefined();
    expect(nov14!.fasting).toBe('Fast Day (Fish Allowed)');
  });

  test('parses Fast Free', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const dec25 = days.find((d) => d.date === '2025-12-25');
    expect(dec25).toBeDefined();
    expect(dec25!.fasting).toBe('Fast Free');
  });

  test('returns null fasting when none specified', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept2 = days.find((d) => d.date === '2025-09-02');
    expect(sept2).toBeDefined();
    expect(sept2!.fasting).toBeNull();
  });

  test('parses epistle and gospel readings', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();
    expect(sept1!.readings.length).toBeGreaterThanOrEqual(2);

    const epistle = sept1!.readings.find((r) => r.type === 'Epistle Reading');
    expect(epistle).toBeDefined();
    expect(epistle!.reference).toContain('Timothy');
    expect(epistle!.text.length).toBeGreaterThan(0);

    const gospel = sept1!.readings.find((r) => r.type === 'Gospel Reading');
    expect(gospel).toBeDefined();
    expect(gospel!.reference).toContain('Luke');
    expect(gospel!.text.length).toBeGreaterThan(0);
  });

  test('parses matins gospel reading', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept7 = days.find((d) => d.date === '2025-09-07');
    expect(sept7).toBeDefined();

    const matins = sept7!.readings.find((r) => r.type === 'Matins Gospel Reading');
    expect(matins).toBeDefined();
    expect(matins!.reference).toContain('Mark');
  });

  test('unescapes quotes in reading text', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();

    const gospel = sept1!.readings.find((r) => r.type === 'Gospel Reading');
    expect(gospel).toBeDefined();
    expect(gospel!.text).toContain('"The Spirit of the Lord');
  });

  test('unescapes commas in summary', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const dec25 = days.find((d) => d.date === '2025-12-25');
    expect(dec25).toBeDefined();
    expect(dec25!.summary).toContain('Jesus Christ');
    expect(dec25!.summary).not.toContain('\\,');
  });
});

describe('findToday', () => {
  test('finds a matching day', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const result = findToday(days, new Date('2025-09-01T12:00:00'));
    expect(result).toBeDefined();
    expect(result!.date).toBe('2025-09-01');
  });

  test('returns undefined for a date not in the file', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const result = findToday(days, new Date('2020-01-01T12:00:00'));
    expect(result).toBeUndefined();
  });
});

describe('display functions', () => {
  const mockDay: OrthodoxDay = {
    date: '2026-02-12',
    summary: 'Meletius, Archbishop of Antioch',
    saints: [
      'Meletius, Archbishop of Antioch',
      'Antonius, Archbishop of Constantinople',
      'Christos the New Martyr',
    ],
    fasting: null,
    readings: [
      {
        type: 'Epistle Reading',
        reference: "St. John's First Universal Letter 4:20-21; 5:1-21",
        text: 'Beloved, if any one says, "I love God," and hates his brother, he is a liar.',
      },
      {
        type: 'Gospel Reading',
        reference: 'Mark 15:1-15',
        text: 'At that time, the chief priests held a consultation.',
      },
    ],
  };

  const mockFastDay: OrthodoxDay = {
    ...mockDay,
    fasting: 'Strict Fast',
  };

  test('renderSnapshot outputs without throwing', () => {
    expect(() => { renderSnapshot(mockDay); }).not.toThrow();
  });

  test('renderFasting outputs without throwing', () => {
    expect(() => { renderFasting(mockDay); }).not.toThrow();
  });

  test('renderFasting outputs fasting description for fast days', () => {
    expect(() => { renderFasting(mockFastDay); }).not.toThrow();
  });

  test('renderSaints outputs without throwing', () => {
    expect(() => { renderSaints(mockDay); }).not.toThrow();
  });

  test('renderSaints handles empty saints list', () => {
    const emptyDay: OrthodoxDay = { ...mockDay, saints: [] };
    expect(() => { renderSaints(emptyDay); }).not.toThrow();
  });

  test('renderReadings outputs without throwing', () => {
    expect(() => { renderReadings(mockDay); }).not.toThrow();
  });

  test('renderReadings handles empty readings', () => {
    const emptyDay: OrthodoxDay = { ...mockDay, readings: [] };
    expect(() => { renderReadings(emptyDay); }).not.toThrow();
  });

  test('renderFeasts outputs without throwing', () => {
    expect(() => { renderFeasts(mockDay); }).not.toThrow();
  });
});

describe('plugin subcommand dispatch', () => {
  test('orthodoxyPlugin exports correct structure', async () => {
    const { orthodoxyPlugin } = await import('../../src/plugins/orthodoxy/index.ts');
    expect(orthodoxyPlugin.name).toBe('orthodoxy');
    expect(orthodoxyPlugin.commands).toHaveLength(1);
    expect(orthodoxyPlugin.commands[0]!.name).toBe('orthodoxy');
  });
});
