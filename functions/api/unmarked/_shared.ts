/** Unmarked Grave shared helpers (N3). Muse Spark writes a tiny playable HTML tribute for any dead app. */
export const MAX_NAME = 40;
export const MAX_HTML = 24000;

export const SYSTEM_PROMPT =
  "You resurrect dead software for a Halloween graveyard. Reply with ONLY one complete HTML document, nothing before <!DOCTYPE html> or after </html>. " +
  "Make a tiny, genuinely playable 60-second browser tribute to the named dead app or game, capturing its core mechanic. Rules: inline CSS and JS only; no external URLs, fetch, imports, fonts, image files, localStorage, cookies, alert/prompt. Draw everything with canvas shapes or DOM; original art, no logos or trademarks. " +
  "Controls: arrow keys/WASD/space AND on-screen touch buttons. Fit any size: use 100vw/100vh, canvas resized to window. Spooky moonlit palette (deep navy, teal glow, pale bone text). Top line: '<Name> — risen (tribute)' and one short how-to-play line. Show score, a game-over screen and 'Press R / tap to rise again'. Keep it under 9000 characters. " +
  "If the name is not a real discontinued app, game, website or gadget, or is hateful, sexual, violent toward real people or political, make a gentle ghost-catching game called 'Unknown Soul — risen (tribute)' instead.";

export const INJECTION_REGEX =
  /(ignore|disregard|forget).{0,20}(previous|above|all|your).{0,20}(instruction|rule|prompt)|system prompt|developer mode|jailbreak|you are now|act as|reveal.{0,15}(prompt|instruction)|\bDAN\b|<|>|https?:/i;

/** Letters, digits, spaces and a little punctuation only; 2–40 chars. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > MAX_NAME) return null;
  if (!/^[\p{L}\p{N} .,'&!:+\-]+$/u.test(s) || !/[\p{L}\p{N}]/u.test(s)) return null;
  return s;
}

export function slugify(name: string): string {
  const ascii = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  if (ascii) return ascii;
  // non-Latin names get a stable hash slug instead of colliding on one key
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0;
  return 'u-' + h.toString(16);
}

/** Keep only <!DOCTYPE html> … </html>; reject anything that is not a full HTML page with a script. */
export function extractHtml(text: string): string | null {
  const start = text.search(/<!DOCTYPE html|<html/i);
  const end = text.toLowerCase().lastIndexOf('</html>');
  if (start < 0 || end < start) return null;
  const html = text.slice(start, end + 7);
  if (html.length < 400 || html.length > MAX_HTML) return null;
  if (!/<script/i.test(html)) return null;
  return html;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** CSP for generated pages: inline only, no network, no navigation, framed by us only. */
export const PLAY_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox allow-scripts";
