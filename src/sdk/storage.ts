import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** Resolves the data directory, preferring AVA_DATA_DIR env, then explicit, then default. */
function resolveDataDir(explicit?: string): string {
  const envDir = process.env.AVA_DATA_DIR;
  if (envDir) return envDir;
  if (explicit) return explicit;
  return join(homedir(), '.ava', 'data');
}

/**
 * Generic JSON persistence for a named collection.
 * Each collection is stored as a JSON array in `<dataDir>/<collection>.json`.
 */
export class Storage<T extends { id: string }> {
  private readonly filePath: string;
  private readonly dataDir: string;

  constructor(collection: string, dataDir?: string) {
    this.dataDir = resolveDataDir(dataDir);
    this.filePath = join(this.dataDir, `${collection}.json`);
  }

  /** Loads all items from the collection file. Returns empty array if file doesn't exist. */
  async loadAll(): Promise<T[]> {
    const file = Bun.file(this.filePath);
    const exists = await file.exists();
    if (!exists) return [];

    const text = await file.text();
    if (text.trim() === '') return [];

    return JSON.parse(text) as T[];
  }

  /** Appends a single item to the collection. */
  async append(item: T): Promise<void> {
    const items = await this.loadAll();
    items.push(item);
    await this.save(items);
  }

  /** Removes an item by 0-based index. Returns the removed item, or undefined if out of range. */
  async removeAt(index: number): Promise<T | undefined> {
    const items = await this.loadAll();
    if (index < 0 || index >= items.length) return undefined;

    const [removed] = items.splice(index, 1);
    await this.save(items);
    return removed;
  }

  /** Overwrites the collection with the given items. */
  async save(items: readonly T[]): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await Bun.write(this.filePath, JSON.stringify(items, null, 2));
  }
}
