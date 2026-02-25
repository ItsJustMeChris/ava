/** @jsxImportSource react */
import { Text } from 'ink';
import type { ReactNode } from 'react';
import type { AvaPlugin } from '../../sdk/types.ts';
import { parseIcsFile, findToday } from './parser.ts';
import type { OrthodoxDay } from './types.ts';
import { OrthodoxyWidget } from './OrthodoxyWidget.tsx';
import { SnapshotView, FastingView, SaintsView, ReadingsView, FeastsView } from './views.tsx';

interface Subcommand {
  readonly name: string;
  readonly description: string;
  readonly render: (day: OrthodoxDay) => ReactNode;
}

const SUBCOMMANDS: readonly Subcommand[] = [
  { name: 'fast', description: "Today's fasting rule", render: (day) => <FastingView day={day} /> },
  { name: 'saints', description: 'Saints and feasts for today', render: (day) => <SaintsView day={day} /> },
  { name: 'readings', description: "Today's scripture readings", render: (day) => <ReadingsView day={day} /> },
  { name: 'feasts', description: "Today's feasts and celebrations", render: (day) => <FeastsView day={day} /> },
];

export const orthodoxyPlugin: AvaPlugin = {
  name: 'orthodoxy',
  description: 'Orthodox liturgical calendar',
  Widget: OrthodoxyWidget,
  commands: [
    {
      name: 'orthodoxy',
      description: 'Orthodox liturgical info for today (fast, saints, readings, feasts)',
      usage: 'orthodoxy [subcommand]',
      async execute(args): Promise<ReactNode> {
        const days = await parseIcsFile();
        const today = findToday(days);

        if (!today) {
          process.exitCode = 1;
          return <Text color="red">No liturgical data found for today.</Text>;
        }

        const subName = args[0];

        if (subName === undefined) {
          return <SnapshotView day={today} />;
        }

        const sub = SUBCOMMANDS.find((s) => s.name === subName);

        if (!sub) {
          process.exitCode = 1;
          return <Text color="red">Unknown orthodoxy subcommand: &quot;{subName}&quot;. Options: {SUBCOMMANDS.map((s) => s.name).join(', ')}</Text>;
        }

        return sub.render(today);
      },
    },
  ],
};
