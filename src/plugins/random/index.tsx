import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { AvaPlugin } from '../../sdk/types.ts';
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
  readonly run: (args: readonly string[]) => ReactNode;
}

function parsePositiveInt(value: string): number | undefined {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return undefined;
  }
  return num;
}

function parseIntArg(value: string): number | undefined {
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return undefined;
  }
  return num;
}

function ErrorText({ message }: { readonly message: string }) {
  return <Text color="red">{message}</Text>;
}

const SUBCOMMANDS: readonly Subcommand[] = [
  {
    name: 'bytes',
    usage: 'random bytes [len=16]',
    description: 'Random bytes as hex (16 bytes → 32 hex chars)',
    run(args) {
      const len = args[0] !== undefined ? parsePositiveInt(args[0]) : 16;
      if (len === undefined) {
        process.exitCode = 1;
        return <ErrorText message="Error: Length must be a positive integer." />;
      }
      return <Text color="cyan">{generateBytes(len)}</Text>;
    },
  },
  {
    name: 'words',
    usage: 'random words [count=4]',
    description: 'Random passphrase words joined by dashes',
    run(args) {
      const count = args[0] !== undefined ? parsePositiveInt(args[0]) : 4;
      if (count === undefined) {
        process.exitCode = 1;
        return <ErrorText message="Error: Count must be a positive integer." />;
      }
      return <Text color="cyan">{generateWords(count)}</Text>;
    },
  },
  {
    name: 'string',
    usage: 'random string [len=32]',
    description: 'Random alphanumeric string',
    run(args) {
      const len = args[0] !== undefined ? parsePositiveInt(args[0]) : 32;
      if (len === undefined) {
        process.exitCode = 1;
        return <ErrorText message="Error: Length must be a positive integer." />;
      }
      return <Text color="cyan">{generateString(len)}</Text>;
    },
  },
  {
    name: 'playful',
    usage: 'random playful [count=2]',
    description: 'Adjective-noun combos (fuzzy-penguin-brave-castle)',
    run(args) {
      const count = args[0] !== undefined ? parsePositiveInt(args[0]) : 2;
      if (count === undefined) {
        process.exitCode = 1;
        return <ErrorText message="Error: Count must be a positive integer." />;
      }
      return <Text color="cyan">{generatePlayful(count)}</Text>;
    },
  },
  {
    name: 'uuid',
    usage: 'random uuid',
    description: 'UUID v4',
    run() {
      return <Text color="cyan">{generateUuid()}</Text>;
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
        process.exitCode = 1;
        return <ErrorText message="Error: min and max must be integers." />;
      }
      if (min >= max) {
        process.exitCode = 1;
        return <ErrorText message="Error: min must be less than max." />;
      }
      return <Text color="cyan">{generateInt(min, max)}</Text>;
    },
  },
  {
    name: 'hex',
    usage: 'random hex [len=32]',
    description: 'Random hex string (exact char count)',
    run(args) {
      const len = args[0] !== undefined ? parsePositiveInt(args[0]) : 32;
      if (len === undefined) {
        process.exitCode = 1;
        return <ErrorText message="Error: Length must be a positive integer." />;
      }
      return <Text color="cyan">{generateHex(len)}</Text>;
    },
  },
  {
    name: 'color',
    usage: 'random color [count=1]',
    description: 'Random hex color code (#a3f2b1)',
    run(args) {
      const count = args[0] !== undefined ? parsePositiveInt(args[0]) : 1;
      if (count === undefined) {
        process.exitCode = 1;
        return <ErrorText message="Error: Count must be a positive integer." />;
      }
      const colors = Array.from({ length: count }, () => generateColor());
      return (
        <Box flexDirection="column">
          {colors.map((hex, i) => (
            <Text key={i}><Text color={hex}>█████</Text> <Text color={hex}>{hex}</Text></Text>
          ))}
        </Box>
      );
    },
  },
];

function RandomHelp() {
  return (
    <Box flexDirection="column">
      <Text>{'\n'}  <Text bold>ava random</Text><Text dimColor> - Generate random values</Text>{'\n'}</Text>
      {SUBCOMMANDS.map((sub) => (
        <Text key={sub.name}>    <Text color="cyan">{sub.usage}</Text>  <Text dimColor>{sub.description}</Text></Text>
      ))}
      <Text>{''}</Text>
    </Box>
  );
}

export const randomPlugin: AvaPlugin = {
  name: 'random',
  description: 'Generate random values',
  commands: [
    {
      name: 'random',
      description: 'Generate random values (bytes, words, uuid, etc.)',
      usage: 'random <type> [options]',
      execute(args): Promise<ReactNode> {
        const subName = args[0];

        if (subName === undefined) {
          return Promise.resolve(<RandomHelp />);
        }

        const sub = SUBCOMMANDS.find((s) => s.name === subName);

        if (!sub) {
          process.exitCode = 1;
          return Promise.resolve(<Text color="red">Unknown random type: &quot;{subName}&quot;. Run &quot;ava random&quot; for usage.</Text>);
        }

        return Promise.resolve(sub.run(args.slice(1)));
      },
    },
  ],
};
