import { afterEach, describe, expect, test } from 'bun:test';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Storage } from '../../src/sdk/storage.ts';

interface TestItem {
  id: string;
  value: string;
}

const SCRATCHPAD = '/private/tmp/claude-501/ava-tests';

function makeStorage(name: string): Storage<TestItem> {
  return new Storage<TestItem>(name, join(SCRATCHPAD, crypto.randomUUID()));
}

afterEach(async () => {
  try {
    await rm(SCRATCHPAD, { recursive: true });
  } catch {
    // ignore cleanup errors
  }
});

describe('Storage', () => {
  test('loadAll returns empty array when file does not exist', async () => {
    const storage = makeStorage('nonexistent');
    const items = await storage.loadAll();
    expect(items).toEqual([]);
  });

  test('append persists an item and loadAll retrieves it', async () => {
    const storage = makeStorage('items');
    const item: TestItem = { id: '1', value: 'hello' };

    await storage.append(item);
    const items = await storage.loadAll();

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(item);
  });

  test('append preserves existing items', async () => {
    const storage = makeStorage('items');
    const item1: TestItem = { id: '1', value: 'first' };
    const item2: TestItem = { id: '2', value: 'second' };

    await storage.append(item1);
    await storage.append(item2);
    const items = await storage.loadAll();

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(item1);
    expect(items[1]).toEqual(item2);
  });

  test('save overwrites all items', async () => {
    const storage = makeStorage('items');
    await storage.append({ id: '1', value: 'old' });

    const newItems: TestItem[] = [{ id: '2', value: 'new' }];
    await storage.save(newItems);
    const items = await storage.loadAll();

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(newItems[0]);
  });

  test('removeAt removes item at valid index and returns it', async () => {
    const storage = makeStorage('items');
    await storage.append({ id: '1', value: 'first' });
    await storage.append({ id: '2', value: 'second' });
    await storage.append({ id: '3', value: 'third' });

    const removed = await storage.removeAt(1);

    expect(removed).toEqual({ id: '2', value: 'second' });
    const remaining = await storage.loadAll();
    expect(remaining).toHaveLength(2);
    expect(remaining[0]).toEqual({ id: '1', value: 'first' });
    expect(remaining[1]).toEqual({ id: '3', value: 'third' });
  });

  test('removeAt returns undefined for negative index', async () => {
    const storage = makeStorage('items');
    await storage.append({ id: '1', value: 'first' });

    const removed = await storage.removeAt(-1);
    expect(removed).toBeUndefined();

    const items = await storage.loadAll();
    expect(items).toHaveLength(1);
  });

  test('removeAt returns undefined for out-of-range index', async () => {
    const storage = makeStorage('items');
    await storage.append({ id: '1', value: 'first' });

    const removed = await storage.removeAt(5);
    expect(removed).toBeUndefined();

    const items = await storage.loadAll();
    expect(items).toHaveLength(1);
  });

  test('removeAt returns undefined for empty collection', async () => {
    const storage = makeStorage('items');

    const removed = await storage.removeAt(0);
    expect(removed).toBeUndefined();
  });
});
