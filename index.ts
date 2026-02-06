#!/usr/bin/env bun

import { PluginRegistry } from './src/sdk/index.ts';
import { runCli } from './src/cli.ts';
import { todoPlugin } from './src/plugins/todo.ts';
import { thoughtPlugin } from './src/plugins/thought.ts';
import { ideaPlugin } from './src/plugins/idea.ts';

const registry = new PluginRegistry();
registry.register(todoPlugin);
registry.register(thoughtPlugin);
registry.register(ideaPlugin);

await runCli(registry, process.argv.slice(2));
