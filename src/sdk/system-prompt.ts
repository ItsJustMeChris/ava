import { hostname, userInfo } from 'node:os';

/** Builds a system prompt with local context for LLM interactions. */
export function buildSystemPrompt(): string {
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
    `Current date/time: ${datetime}`,
    `User: ${user} on ${host}`,
    `Working directory: ${cwd}`,
    `Shell: ${shell}`,
    `Platform: ${process.platform} (${process.arch})`,
  ].join('\n');
}
