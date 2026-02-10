/** Pure generator functions for random value types. */

import { randomBytes, randomInt } from 'node:crypto';
import { ADJECTIVES, NOUNS, PASSPHRASE_WORDS } from './words.ts';

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Picks a random element from a non-empty readonly array. */
function pickRandom(list: readonly string[]): string {
  const item = list[randomInt(list.length)];
  if (item === undefined) {
    throw new Error('Unexpected empty list in pickRandom');
  }
  return item;
}

/** Generates random bytes as a hex string. Output length is `byteCount * 2`. */
export function generateBytes(byteCount: number): string {
  return randomBytes(byteCount).toString('hex');
}

/** Generates a passphrase of random words joined by dashes. */
export function generateWords(count: number): string {
  return Array.from({ length: count }, () => pickRandom(PASSPHRASE_WORDS)).join('-');
}

/** Generates a random alphanumeric string of exact length. */
export function generateString(length: number): string {
  return Array.from({ length }, () => ALPHANUMERIC[randomInt(ALPHANUMERIC.length)]).join('');
}

/** Generates adjective-noun combos joined by dashes. */
export function generatePlayful(count: number): string {
  return Array.from({ length: count }, () => `${pickRandom(ADJECTIVES)}-${pickRandom(NOUNS)}`)
    .join('-');
}

/** Generates a UUID v4. */
export function generateUuid(): string {
  return crypto.randomUUID();
}

/** Generates a random integer in [min, max] (inclusive). */
export function generateInt(min: number, max: number): string {
  return String(randomInt(min, max + 1));
}

/** Generates a random hex string of exact character length. */
export function generateHex(length: number): string {
  const byteCount = Math.ceil(length / 2);
  return randomBytes(byteCount).toString('hex').slice(0, length);
}

/** Generates a random hex color code. */
export function generateColor(): string {
  const hex = randomBytes(3).toString('hex');
  return `#${hex}`;
}
