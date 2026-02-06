import type { AvaCommand, AvaPlugin } from './types.ts';

/**
 * Central registry for plugins and their commands.
 * Provides registration, command resolution, and listing.
 */
export class PluginRegistry {
  private readonly plugins: AvaPlugin[] = [];
  private readonly commandMap = new Map<string, AvaCommand>();

  /** Registers a plugin and indexes its commands. Throws on duplicate command names. */
  register(plugin: AvaPlugin): void {
    for (const command of plugin.commands) {
      if (this.commandMap.has(command.name)) {
        throw new Error(
          `Duplicate command name "${command.name}" from plugin "${plugin.name}"`,
        );
      }
      this.commandMap.set(command.name, command);
    }
    this.plugins.push(plugin);
  }

  /** Resolves a command by name, or undefined if not found. */
  resolve(name: string): AvaCommand | undefined {
    return this.commandMap.get(name);
  }

  /** Returns all registered plugins. */
  list(): readonly AvaPlugin[] {
    return this.plugins;
  }
}
