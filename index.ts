#!/usr/bin/env bun

import { PluginRegistry } from './src/sdk/index.ts';
import { runCli } from './src/cli.tsx';
import { todoPlugin } from './src/plugins/todo.ts';
import { thoughtPlugin } from './src/plugins/thought.ts';
import { ideaPlugin } from './src/plugins/idea.ts';
import { askPlugin } from './src/plugins/ask.tsx';
import { chatPlugin } from './src/plugins/chat/index.tsx';
import { randomPlugin } from './src/plugins/random/index.tsx';
import { orthodoxyPlugin } from './src/plugins/orthodoxy/index.tsx';
import { cmdPlugin } from './src/plugins/cmd.tsx';

const registry = new PluginRegistry();
registry.register(todoPlugin);
registry.register(thoughtPlugin);
registry.register(ideaPlugin);
registry.register(askPlugin);
registry.register(chatPlugin);
registry.register(randomPlugin);
registry.register(orthodoxyPlugin);
registry.register(cmdPlugin);

await runCli(registry, process.argv.slice(2));
