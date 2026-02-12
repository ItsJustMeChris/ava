/** Orthodox liturgical calendar plugin for Ava CLI. */

import type { AvaPlugin } from '../../sdk/types.ts';
import { ANSI, colorize } from '../../sdk/format.ts';
import { parseIcsFile, findToday } from './parser.ts';
import { renderSnapshot, renderFasting, renderSaints, renderReadings, renderFeasts } from './display.ts';
import type { OrthodoxDay } from './types.ts';

interface Subcommand {
  readonly name: string;
  readonly description: string;
  readonly render: (day: OrthodoxDay) => void;
}

const SUBCOMMANDS: readonly Subcommand[] = [
  { name: 'fast', description: "Today's fasting rule", render: renderFasting },
  { name: 'saints', description: 'Saints and feasts for today', render: renderSaints },
  { name: 'readings', description: "Today's scripture readings", render: renderReadings },
  { name: 'feasts', description: "Today's feasts and celebrations", render: renderFeasts },
];

export const orthodoxyPlugin: AvaPlugin = {
  name: 'orthodoxy',
  description: 'Orthodox liturgical calendar',
  commands: [
    {
      name: 'orthodoxy',
      description: 'Orthodox liturgical info for today (fast, saints, readings, feasts)',
      usage: 'orthodoxy [subcommand]',
      async execute(args) {
        const days = await parseIcsFile();
        const today = findToday(days);

        if (!today) {
          console.error(colorize('No liturgical data found for today.', ANSI.red));
          process.exitCode = 1;
          return;
        }

        const subName = args[0];

        if (subName === undefined) {
          renderSnapshot(today);
          return;
        }

        const sub = SUBCOMMANDS.find((s) => s.name === subName);

        if (!sub) {
          console.error(colorize(`Unknown orthodoxy subcommand: "${subName}". Options: ${SUBCOMMANDS.map((s) => s.name).join(', ')}`, ANSI.red));
          process.exitCode = 1;
          return;
        }

        sub.render(today);
      },
    },
  ],
};
