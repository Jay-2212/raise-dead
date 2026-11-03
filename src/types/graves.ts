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
  /** N3: path (relative to BASE_URL) of a vendored static game to open in an iframe */
  game?: string;
  /** N3: one-line licence credit shown under the game */
  game_credit?: string;
  /** N3: iframe sandbox override (AI-written pages use 'allow-scripts' only) */
  game_sandbox?: string;
}

/** The 5 resurrectable grave IDs */
export type ResurrectableId =
  | 'road-rash'
  | 'google-reader'
  | 'clippy'
  | 'winamp'
  | 'unmarked-grave'
  | 'space-cadet'
  | '3d-pipes'
  | 'bouncing-logo';

/** Extract 4-digit year from a number or ISO date string */
export function extractYear(value: number | string | null): string {
  if (value === null) return '??';
  if (typeof value === 'number') return String(value);
  // ISO date string: "2013-07-01" → "2013"
  const match = String(value).match(/^(\d{4})/);
  return match ? match[1] : String(value);
}
