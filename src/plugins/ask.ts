import type { AvaPlugin } from '../sdk/types.ts';
import { ANSI, colorize } from '../sdk/format.ts';
import { llm } from '@providerprotocol/ai';
import { openai } from '@providerprotocol/ai/openai';
import { hostname, userInfo } from 'node:os';

/** Builds a system prompt with local context. */
function buildSystemPrompt(): string {
  const now = new Date();
  const datetime = now.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  const cwd = process.cwd();
  const user = userInfo().username;
  const host = hostname();
  const shell = process.env.SHELL ?? 'unknown';

  return [
    'You are Ava, a concise and helpful personal CLI assistant.',
    'Always refer to yourself as Ava. Never use any other name or identity.',
    `Current date/time: ${datetime}`,
    `User: ${user} on ${host}`,
    `Working directory: ${cwd}`,
    `Shell: ${shell}`,
    `Platform: ${process.platform} (${process.arch})`,
  ].join('\n');
}

export const askPlugin: AvaPlugin = {
  name: 'ask',
  description: 'Ask an LLM a question',
  commands: [
    {
      name: 'ask',
      description: 'Ask a question and get a streamed response',
      usage: 'ask <prompt>',
      async execute(args) {
        const prompt = args.join(' ').trim();

        if (prompt === '') {
          console.error(colorize('Error: Please provide a question.', ANSI.red));
          process.exitCode = 1;
          return;
        }

        const model = llm({
          model: openai('gpt-5.2'),
          system: buildSystemPrompt(),
        });

        try {
          const stream = model.stream(prompt);

          for await (const event of stream) {
            if (event.type === 'text_delta') {
              process.stdout.write(event.delta.text ?? '');
            }
          }

          process.stdout.write('\n');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(colorize(`Error: ${message}`, ANSI.red));
          process.exitCode = 1;
        }
      },
    },
  ],
};
