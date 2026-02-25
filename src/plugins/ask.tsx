/** @jsxImportSource react */
import { render, Text } from 'ink';
import { useApp } from 'ink';
import { useEffect, useState } from 'react';
import type { AvaPlugin } from '../sdk/types.ts';
import { buildSystemPrompt } from '../sdk/system-prompt.ts';
import { llm } from '@providerprotocol/ai';
import { openai } from '@providerprotocol/ai/openai';

/** Reads all piped stdin content. Only call when stdin is not a TTY. */
async function readPipedStdin(): Promise<string> {
  return Bun.stdin.text();
}

/** Builds the full prompt from args and optional piped stdin content. */
export function buildPrompt(argsPrompt: string, stdinContent: string): string {
  const hasArgs = argsPrompt !== '';
  const hasStdin = stdinContent !== '';

  if (hasArgs && hasStdin) {
    return `${argsPrompt}\n\n---\n\n${stdinContent}`;
  }
  if (hasStdin) {
    return stdinContent;
  }
  return argsPrompt;
}

interface StreamingResponseProps {
  readonly prompt: string;
}

function StreamingResponse({ prompt }: StreamingResponseProps) {
  const { exit } = useApp();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const model = llm({
      model: openai('gpt-5.2'),
      system: buildSystemPrompt(),
    });

    void (async () => {
      try {
        const stream = model.stream(prompt);
        for await (const event of stream) {
          if (event.type === 'text_delta') {
            setText((prev) => prev + (event.delta.text ?? ''));
          }
        }
        exit();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.exitCode = 1;
        setError(message);
        exit();
      }
    })();
  }, [prompt, exit]);

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  return <Text>{text}</Text>;
}

export const askPlugin: AvaPlugin = {
  name: 'ask',
  description: 'Ask an LLM a question (supports piped stdin)',
  commands: [
    {
      name: 'ask',
      description: 'Ask a question and get a streamed response',
      usage: 'ask <prompt>  or  <cmd> | ava ask [prompt]',
      async execute(args) {
        const argsPrompt = args.join(' ').trim();
        const hasPipedInput = !process.stdin.isTTY;

        let stdinContent = '';
        if (hasPipedInput) {
          stdinContent = (await readPipedStdin()).trim();
        }

        const prompt = buildPrompt(argsPrompt, stdinContent);

        if (prompt === '') {
          process.exitCode = 1;
          return <Text color="red">Error: Please provide a question.</Text>;
        }

        const instance = render(<StreamingResponse prompt={prompt} />);
        await instance.waitUntilExit();
        instance.unmount();
      },
    },
  ],
};
