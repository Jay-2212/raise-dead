/**
 * TypeScript interfaces matching the graves.json schema.
 */

export type GraveCategory = 'game' | 'service' | 'app' | 'hardware';

export interface GraveEntry {
  id: string;
  name: string;
  maker: string;
  /** Birth year (number) or ISO date string, or null for unknown */
  born: number | string | null;
  /** Death year (number) or ISO date string, or null for unknown */
  died: number | string | null;
  category: GraveCategory;
  epitaph: string;
  cause_of_death: string;
  resurrectable: boolean;
  source_url: string | null;
  /** 1–5 = resurrectable (placed prominently), 6–40 = decorative */
  sort_priority: number;
  verified: boolean;
  note: string | null;
}

/** The 5 resurrectable grave IDs */
export type ResurrectableId =
  | 'road-rash'
  | 'google-reader'
  | 'clippy'
  | 'winamp'
  | 'unmarked-grave';

/** Extract 4-digit year from a number or ISO date string */
export function extractYear(value: number | string | null): string {
  if (value === null) return '??';
  if (typeof value === 'number') return String(value);
  // ISO date string: "2013-07-01" → "2013"
  const match = String(value).match(/^(\d{4})/);
  return match ? match[1] : String(value);
}
