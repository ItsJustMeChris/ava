/** @jsxImportSource react */
import { render, Text, Box } from 'ink';
import { useApp, useInput } from 'ink';
import { Spinner } from '@inkjs/ui';
import { useEffect, useState } from 'react';
import type { AvaPlugin } from '../sdk/types.ts';
import type { JSONSchema } from '@providerprotocol/ai';
import { buildSystemPrompt } from '../sdk/system-prompt.ts';
import { llm } from '@providerprotocol/ai';
import { openai } from '@providerprotocol/ai/openai';

const CMD_SYSTEM = [
  buildSystemPrompt(),
  '',
  'You are a shell command generator.',
  'Given a natural language description, produce the shell command that accomplishes the task.',
  'If multiple commands are needed, join them with && or use appropriate shell constructs.',
].join('\n');

const COMMAND_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    command: {
      type: 'string',
      description: 'The complete shell command to execute',
    },
  },
  required: ['command'],
  additionalProperties: false,
};

interface CommandOutput {
  readonly command: string;
}

function isCommandOutput(data: unknown): data is CommandOutput {
  return (
    typeof data === 'object' &&
    data !== null &&
    'command' in data &&
    typeof (data as CommandOutput).command === 'string'
  );
}

async function generateCommand(prompt: string): Promise<string> {
  const model = llm({
    model: openai('gpt-5.2'),
    system: CMD_SYSTEM,
    structure: COMMAND_SCHEMA,
  });
  const turn = await model.generate(prompt);

  if (!isCommandOutput(turn.data)) {
    throw new Error('Unexpected response format from LLM');
  }

  return turn.data.command;
}

interface CmdResult {
  confirmed: boolean;
  command: string;
}

interface CmdInteractiveProps {
  readonly prompt: string;
  readonly result: CmdResult;
}

function CmdInteractive({ prompt, result }: CmdInteractiveProps) {
  const { exit } = useApp();
  const [command, setCommand] = useState('');
  const [phase, setPhase] = useState<'generating' | 'confirm'>('generating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const cmd = await generateCommand(prompt);
        setCommand(cmd);
        result.command = cmd;
        setPhase('confirm');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.exitCode = 1;
        setError(message);
        exit();
      }
    })();
  }, [prompt, result, exit]);

  useInput((input, key) => {
    if (phase !== 'confirm') return;
    if (input === 'y' || key.return) {
      result.confirmed = true;
      exit();
    } else if (input === 'n' || input === 'q') {
      exit();
    }
  });

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  if (phase === 'generating') {
    return <Spinner label="Generating command" />;
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor>$ </Text>
        <Text color="cyan" bold>{command}</Text>
      </Box>
      <Text dimColor>Run command? [y/n]</Text>
    </Box>
  );
}

export const cmdPlugin: AvaPlugin = {
  name: 'cmd',
  description: 'Generate shell commands from natural language',
  commands: [
    {
      name: 'cmd',
      description: 'Generate a shell command from a natural language description',
      usage: 'cmd <description>  or  <context> | ava cmd <description>',
      async execute(args) {
        const argsPrompt = args.join(' ').trim();
        const hasPipedInput = !process.stdin.isTTY;

        let stdinContent = '';
        if (hasPipedInput) {
          stdinContent = (await Bun.stdin.text()).trim();
        }

        let prompt: string;
        if (argsPrompt !== '' && stdinContent !== '') {
          prompt = `${argsPrompt}\n\n---\n\n${stdinContent}`;
        } else if (stdinContent !== '') {
          prompt = stdinContent;
        } else {
          prompt = argsPrompt;
        }

        if (prompt === '') {
          process.exitCode = 1;
          return <Text color="red">Error: Please describe the command you need.</Text>;
        }

        if (!process.stdout.isTTY || !process.stdin.isTTY) {
          try {
            const command = await generateCommand(prompt);

            if (process.stdout.isTTY) {
              return (
                <Box>
                  <Text dimColor>$ </Text>
                  <Text color="cyan" bold>{command}</Text>
                </Box>
              );
            }

            process.stdout.write(`${command}\n`);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            process.exitCode = 1;
            return <Text color="red">Error: {message}</Text>;
          }
          return;
        }

        const result: CmdResult = { confirmed: false, command: '' };
        const instance = render(<CmdInteractive prompt={prompt} result={result} />);
        await instance.waitUntilExit();
        instance.unmount();

        if (result.confirmed && result.command !== '') {
          const shell = process.env.SHELL ?? '/bin/sh';
          const proc = Bun.spawn([shell, '-c', result.command], {
            stdin: 'inherit',
            stdout: 'inherit',
            stderr: 'inherit',
          });
          const exitCode = await proc.exited;
          if (exitCode !== 0) {
            process.exitCode = exitCode;
          }
        }
      },
    },
  ],
};
