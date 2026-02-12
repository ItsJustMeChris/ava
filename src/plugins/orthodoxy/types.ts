/** Types for Orthodox liturgical calendar data. */

/** A single scripture reading with its reference and full text. */
export interface OrthodoxReading {
  readonly type: string;
  readonly reference: string;
  readonly text: string;
}

/** Parsed liturgical data for a single day. */
export interface OrthodoxDay {
  readonly date: string;
  readonly summary: string;
  readonly saints: string[];
  readonly fasting: string | null;
  readonly readings: OrthodoxReading[];
}
