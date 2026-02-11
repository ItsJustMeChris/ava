import type { AvaPlugin } from '../sdk/types.ts';
import { ANSI, colorize } from '../sdk/format.ts';
import { buildSystemPrompt } from '../sdk/system-prompt.ts';
import { llm } from '@providerprotocol/ai';
import { openai } from '@providerprotocol/ai/openai';

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
