/** Random value generator plugin for Ava CLI. */

import type { AvaPlugin } from '../../sdk/types.ts';
import { ANSI, colorize } from '../../sdk/format.ts';
import {
  generateBytes,
  generateColor,
  generateHex,
  generateInt,
  generatePlayful,
  generateString,
  generateUuid,
  generateWords,
} from './generators.ts';

interface Subcommand {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  readonly run: (args: readonly string[]) => void;
}

/** Parses a string as a positive integer, returning `undefined` on failure. */
function parsePositiveInt(value: string): number | undefined {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return undefined;
  }
  return num;
}

/** Parses a string as an integer (including zero and negatives), returning `undefined` on failure. */
function parseIntArg(value: string): number | undefined {
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return undefined;
  }
  return num;
}

const SUBCOMMANDS: readonly Subcommand[] = [
  {
    name: 'bytes',
    usage: 'random bytes [len=16]',
    description: 'Random bytes as hex (16 bytes → 32 hex chars)',
    run(args) {
      const len = args[0] !== undefined ? parsePositiveInt(args[0]) : 16;
      if (len === undefined) {
        console.error(colorize('Error: Length must be a positive integer.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      console.log(colorize(generateBytes(len), ANSI.cyan));
    },
  },
  {
    name: 'words',
    usage: 'random words [count=4]',
    description: 'Random passphrase words joined by dashes',
    run(args) {
      const count = args[0] !== undefined ? parsePositiveInt(args[0]) : 4;
      if (count === undefined) {
        console.error(colorize('Error: Count must be a positive integer.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      console.log(colorize(generateWords(count), ANSI.cyan));
    },
  },
  {
    name: 'string',
    usage: 'random string [len=32]',
    description: 'Random alphanumeric string',
    run(args) {
      const len = args[0] !== undefined ? parsePositiveInt(args[0]) : 32;
      if (len === undefined) {
        console.error(colorize('Error: Length must be a positive integer.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      console.log(colorize(generateString(len), ANSI.cyan));
    },
  },
  {
    name: 'playful',
    usage: 'random playful [count=2]',
    description: 'Adjective-noun combos (fuzzy-penguin-brave-castle)',
    run(args) {
      const count = args[0] !== undefined ? parsePositiveInt(args[0]) : 2;
      if (count === undefined) {
        console.error(colorize('Error: Count must be a positive integer.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      console.log(colorize(generatePlayful(count), ANSI.cyan));
    },
  },
  {
    name: 'uuid',
    usage: 'random uuid',
    description: 'UUID v4',
    run() {
      console.log(colorize(generateUuid(), ANSI.cyan));
    },
  },
  {
    name: 'int',
    usage: 'random int [min=0] [max=100]',
    description: 'Random integer (inclusive range)',
    run(args) {
      const min = args[0] !== undefined ? parseIntArg(args[0]) : 0;
      const max = args[1] !== undefined ? parseIntArg(args[1]) : 100;
      if (min === undefined || max === undefined) {
        console.error(colorize('Error: min and max must be integers.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      if (min >= max) {
        console.error(colorize('Error: min must be less than max.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      console.log(colorize(generateInt(min, max), ANSI.cyan));
    },
  },
  {
    name: 'hex',
    usage: 'random hex [len=32]',
    description: 'Random hex string (exact char count)',
    run(args) {
      const len = args[0] !== undefined ? parsePositiveInt(args[0]) : 32;
      if (len === undefined) {
        console.error(colorize('Error: Length must be a positive integer.', ANSI.red));
        process.exitCode = 1;
        return;
      }
      console.log(colorize(generateHex(len), ANSI.cyan));
    },
  },
  {
    name: 'color',
    usage: 'random color',
    description: 'Random hex color code (#a3f2b1)',
    run() {
      console.log(colorize(generateColor(), ANSI.cyan));
    },
  },
];

/** Prints help listing all random subcommands. */
function printRandomHelp(): void {
  console.log(colorize('\n  ava random', ANSI.bold) + colorize(' - Generate random values\n', ANSI.dim));
  for (const sub of SUBCOMMANDS) {
    const name = colorize(sub.usage, ANSI.cyan);
    console.log(`    ${name}  ${colorize(sub.description, ANSI.dim)}`);
  }
  console.log();
}

export const randomPlugin: AvaPlugin = {
  name: 'random',
  description: 'Generate random values',
  commands: [
    {
      name: 'random',
      description: 'Generate random values (bytes, words, uuid, etc.)',
      usage: 'random <type> [options]',
      execute(args) {
        const subName = args[0];

        if (subName === undefined) {
          printRandomHelp();
          return Promise.resolve();
        }

        const sub = SUBCOMMANDS.find((s) => s.name === subName);

        if (!sub) {
          console.error(colorize(`Unknown random type: "${subName}". Run "ava random" for usage.`, ANSI.red));
          process.exitCode = 1;
          return Promise.resolve();
        }

        sub.run(args.slice(1));
        return Promise.resolve();
      },
    },
  ],
};
