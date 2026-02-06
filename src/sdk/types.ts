/**
 * Core types for the Ava CLI plugin system.
 */

/** A single journal entry with atomic persisted values. */
export interface Entry {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
}

/** An executable CLI command exposed by a plugin. */
export interface AvaCommand {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly execute: (args: readonly string[]) => Promise<void>;
}

/** A plugin that provides one or more commands to the CLI. */
export interface AvaPlugin {
  readonly name: string;
  readonly description: string;
  readonly commands: readonly AvaCommand[];
}

/** Configuration for the journal plugin factory. */
export interface JournalConfig {
  readonly name: string;
  readonly plural: string;
  readonly description: string;
  readonly addVerb: string;
  readonly dataDir?: string;
}
