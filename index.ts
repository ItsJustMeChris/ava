#!/usr/bin/env bun

import { PluginRegistry } from './src/sdk/index.ts';
import { runCli } from './src/cli.ts';
import { todoPlugin } from './src/plugins/todo.ts';
import { thoughtPlugin } from './src/plugins/thought.ts';
import { ideaPlugin } from './src/plugins/idea.ts';
import { askPlugin } from './src/plugins/ask.ts';
import { chatPlugin } from './src/plugins/chat/index.ts';
import { randomPlugin } from './src/plugins/random/index.ts';

const registry = new PluginRegistry();
registry.register(todoPlugin);
registry.register(thoughtPlugin);
registry.register(ideaPlugin);
registry.register(askPlugin);
registry.register(chatPlugin);
registry.register(randomPlugin);

await runCli(registry, process.argv.slice(2));
