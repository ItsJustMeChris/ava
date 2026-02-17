import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { parseIcsFile, findToday } from '../../src/plugins/orthodoxy/parser.ts';
import { SnapshotView, FastingView, SaintsView, ReadingsView, FeastsView } from '../../src/plugins/orthodoxy/views.tsx';
import { OrthodoxyWidget } from '../../src/plugins/orthodoxy/OrthodoxyWidget.tsx';
import type { OrthodoxDay } from '../../src/plugins/orthodoxy/types.ts';

const ICS_PATH = `${import.meta.dirname}/../../planner2025-en.ics`;
const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

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
    if (!sept1) return;
    expect(sept1.saints).toContain('Ecclesiastical New Year');
    expect(sept1.saints).toContain('Symeon the Stylite');
  });

  test('parses escaped commas in saint names', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();
    if (!sept1) return;
    const hasMiasenae = sept1.saints.some((s) => s.includes('Miasenae'));
    expect(hasMiasenae).toBe(true);
  });

  test('parses Strict Fast fasting rule', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept3 = days.find((d) => d.date === '2025-09-03');
    expect(sept3).toBeDefined();
    if (!sept3) return;
    expect(sept3.fasting).toBe('Strict Fast');
  });

  test('parses Fast Day (Wine and Oil Allowed)', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept14 = days.find((d) => d.date === '2025-09-14');
    expect(sept14).toBeDefined();
    if (!sept14) return;
    expect(sept14.fasting).toBe('Fast Day (Wine and Oil Allowed)');
  });

  test('parses Fast Day (Fish Allowed)', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const nov14 = days.find((d) => d.date === '2025-11-14');
    expect(nov14).toBeDefined();
    if (!nov14) return;
    expect(nov14.fasting).toBe('Fast Day (Fish Allowed)');
  });

  test('parses Fast Free', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const dec25 = days.find((d) => d.date === '2025-12-25');
    expect(dec25).toBeDefined();
    if (!dec25) return;
    expect(dec25.fasting).toBe('Fast Free');
  });

  test('returns null fasting when none specified', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept2 = days.find((d) => d.date === '2025-09-02');
    expect(sept2).toBeDefined();
    if (!sept2) return;
    expect(sept2.fasting).toBeNull();
  });

  test('parses epistle and gospel readings', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();
    if (!sept1) return;
    expect(sept1.readings.length).toBeGreaterThanOrEqual(2);

    const epistle = sept1.readings.find((r) => r.type === 'Epistle Reading');
    expect(epistle).toBeDefined();
    if (!epistle) return;
    expect(epistle.reference).toContain('Timothy');
    expect(epistle.text.length).toBeGreaterThan(0);

    const gospel = sept1.readings.find((r) => r.type === 'Gospel Reading');
    expect(gospel).toBeDefined();
    if (!gospel) return;
    expect(gospel.reference).toContain('Luke');
    expect(gospel.text.length).toBeGreaterThan(0);
  });

  test('parses matins gospel reading', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept7 = days.find((d) => d.date === '2025-09-07');
    expect(sept7).toBeDefined();
    if (!sept7) return;

    const matins = sept7.readings.find((r) => r.type === 'Matins Gospel Reading');
    expect(matins).toBeDefined();
    if (!matins) return;
    expect(matins.reference).toContain('Mark');
  });

  test('unescapes quotes in reading text', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const sept1 = days.find((d) => d.date === '2025-09-01');
    expect(sept1).toBeDefined();
    if (!sept1) return;

    const gospel = sept1.readings.find((r) => r.type === 'Gospel Reading');
    expect(gospel).toBeDefined();
    if (!gospel) return;
    expect(gospel.text).toContain('"The Spirit of the Lord');
  });

  test('unescapes commas in summary', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const dec25 = days.find((d) => d.date === '2025-12-25');
    expect(dec25).toBeDefined();
    if (!dec25) return;
    expect(dec25.summary).toContain('Jesus Christ');
    expect(dec25.summary).not.toContain('\\,');
  });
});

describe('findToday', () => {
  test('finds a matching day', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const result = findToday(days, new Date('2025-09-01T12:00:00'));
    expect(result).toBeDefined();
    if (!result) return;
    expect(result.date).toBe('2025-09-01');
  });

  test('returns undefined for a date not in the file', async () => {
    const days = await parseIcsFile(ICS_PATH);
    const result = findToday(days, new Date('2020-01-01T12:00:00'));
    expect(result).toBeUndefined();
  });
});

describe('view components', () => {
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

  test('SnapshotView renders without error', () => {
    const instance = render(<SnapshotView day={mockDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('Orthodox Day');
    expect(frame).toContain('Meletius');
    instance.cleanup();
  });

  test('FastingView renders without error', () => {
    const instance = render(<FastingView day={mockDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain("Today's Fast");
    instance.cleanup();
  });

  test('FastingView renders fasting description for fast days', () => {
    const instance = render(<FastingView day={mockFastDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('Strict Fast');
    instance.cleanup();
  });

  test('SaintsView renders without error', () => {
    const instance = render(<SaintsView day={mockDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('Saints');
    instance.cleanup();
  });

  test('SaintsView handles empty saints list', () => {
    const emptyDay: OrthodoxDay = { ...mockDay, saints: [] };
    const instance = render(<SaintsView day={emptyDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('No saints listed');
    instance.cleanup();
  });

  test('ReadingsView renders without error', () => {
    const instance = render(<ReadingsView day={mockDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('Scripture Readings');
    instance.cleanup();
  });

  test('ReadingsView handles empty readings', () => {
    const emptyDay: OrthodoxDay = { ...mockDay, readings: [] };
    const instance = render(<ReadingsView day={emptyDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('No readings listed');
    instance.cleanup();
  });

  test('FeastsView renders without error', () => {
    const instance = render(<FeastsView day={mockDay} />);
    const frame = stripAnsi(instance.lastFrame() ?? '');
    expect(frame).toContain('Feasts');
    instance.cleanup();
  });
});

describe('OrthodoxyWidget', () => {
  test('renders widget with liturgical data', async () => {
    const result = await OrthodoxyWidget();
    if (result !== null) {
      const instance = render(<>{result}</>);
      const frame = stripAnsi(instance.lastFrame() ?? '');
      expect(frame).toContain('\u2626');
      expect(frame).toContain('Orthodoxy');
      instance.cleanup();
    }
  });
});

describe('plugin structure', () => {
  test('orthodoxyPlugin exports correct structure', async () => {
    const { orthodoxyPlugin } = await import('../../src/plugins/orthodoxy/index.tsx');
    expect(orthodoxyPlugin.name).toBe('orthodoxy');
    expect(orthodoxyPlugin.commands).toHaveLength(1);
    const firstCmd = orthodoxyPlugin.commands[0];
    expect(firstCmd).toBeDefined();
    if (!firstCmd) return;
    expect(firstCmd.name).toBe('orthodoxy');
  });

  test('orthodoxyPlugin has a Widget component', async () => {
    const { orthodoxyPlugin } = await import('../../src/plugins/orthodoxy/index.tsx');
    expect(orthodoxyPlugin.Widget).toBeFunction();
  });
});
