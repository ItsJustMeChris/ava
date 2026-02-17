import { describe, expect, test } from 'bun:test';
import type { AvaPlugin } from '../../src/sdk/types.ts';
import { PluginRegistry } from '../../src/sdk/registry.ts';

function makePlugin(name: string, commands: string[]): AvaPlugin {
  return {
    name,
    description: `${name} plugin`,
    commands: commands.map((cmd) => ({
      name: cmd,
      description: `${cmd} command`,
      usage: cmd,
      execute: () => Promise.resolve(),
    })),
  };
}

describe('PluginRegistry', () => {
  test('registers a plugin and resolves its commands', () => {
    const registry = new PluginRegistry();
    const plugin = makePlugin('test', ['foo', 'bar']);

    registry.register(plugin);

    expect(registry.resolve('foo')).toBeDefined();
    expect(registry.resolve('bar')).toBeDefined();
    expect(registry.resolve('baz')).toBeUndefined();
  });

  test('lists all registered plugins', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('a', ['a1']));
    registry.register(makePlugin('b', ['b1']));

    const plugins = registry.list();
    expect(plugins).toHaveLength(2);
    expect(plugins[0]?.name).toBe('a');
    expect(plugins[1]?.name).toBe('b');
  });

  test('throws on duplicate command names', () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin('first', ['dup']));

    expect(() => { registry.register(makePlugin('second', ['dup'])); }).toThrow(
      'Duplicate command name "dup"',
    );
  });
});
