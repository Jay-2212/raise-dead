/** Unmarked Grave shared helpers (N3). Muse Spark writes a tiny playable HTML tribute for any dead app. */
export const MAX_NAME = 40;
export const MAX_HTML = 40000;

export const SYSTEM_PROMPT = [
  'You resurrect dead software for a moonlit Halloween graveyard game.',
  'If the name is not a real discontinued (or retro) app, game, website, service or gadget, or it is hateful, sexual, violent toward real people, or political, reply with exactly one word: REFUSE',
  'Otherwise reply with ONLY one complete standalone HTML document: start with <!DOCTYPE html> and end with </html>. No markdown fences, no commentary.',
  'Make a small, genuinely playable browser tribute (at least 60 seconds of fun) that captures the named product\'s recognisable core mechanic.',
  'HARD RULES:',
  '1. All CSS in <style>, all JS in one <script>. No external URLs, fetch, XMLHttpRequest, WebSocket, imports, fonts, image files, localStorage, cookies, alert/prompt. Draw with Canvas 2D shapes. Original art only, no logos or trademarks.',
  '2. Fill the frame: html,body{margin:0;height:100%;overflow:hidden}; the canvas is sized to window.innerWidth x window.innerHeight (times devicePixelRatio) and re-laid-out in a window "resize" listener. Derive every size and speed from the canvas size so it plays the same at 400px and 1400px wide.',
  '3. Fairness: a "Ready... Go!" grace period of 2 seconds before any gravity, enemy or hazard starts. The first 15 seconds are easy, then difficulty ramps slowly. A new player must be able to survive at least two rounds.',
  '4. Tuning by genre (per frame at 60 fps, scaled to canvas height H): flappy/gravity games: gravity <= 0.0006*H, flap impulse about -0.012*H, cap fall speed at 0.02*H, gap between obstacles >= 0.32*H, obstacle speed starts at 0.004*W. Snake/grid games: first tick >= 120 ms. Shooters: enemies start slow, player gets 3 lives. Racing/fighting: opponents start slow and miss often.',
  '5. Use a fixed-timestep update with delta time capped at 50 ms so a slow frame never kills the player.',
  '6. Controls: arrow keys, WASD and Space, AND large on-screen touch buttons (or tap) for phones. Call preventDefault for arrow keys and Space. Clicking or tapping the canvas starts the game.',
  '7. HUD: top bar "<Name> \u2014 risen (tribute)", one short how-to-play line, score and best. Game over screen with the score and "Press R or tap to rise again"; R and tap restart cleanly without reloading.',
  '8. Palette: night graveyard (background #0b1020, accents #7fe0cf and #c9b98a, text #d9f2ee). Keep it under 12000 characters.',
].join('\n');

export const REPAIR_PROMPT =
  'You fix a broken HTML5 tribute mini-game for a Halloween graveyard. Keep the same game, fix ALL of the listed problems, and keep every rule from before ' +
  '(self-contained, no network, fills the window with a resize listener, 2 s grace period, fair difficulty, keyboard + touch, R/tap restart). ' +
  'Reply with ONLY the corrected HTML from <!DOCTYPE html> to </html>.';

/** N4/U1: names we never send to Muse (slurs, sexual, hate, real-world conflict and politics, injection). */
export const MODERATION_REGEX = new RegExp([
  '\\b(?:nazi|hitler|holocaust|kkk|isis|jihad|terroris[tm]|genocide|school ?shoot)',
  '\\b(?:rape|pedo|paedo|incest|porn|hentai|nsfw|onlyfans|xxx|sex|nude|naked|boob|tits|penis|vagina|dick|cock|pussy|cum)\\b',
  '\\b(?:fuck|shit|bitch|cunt|whore|slut|bastard)',
  '\\b(?:nigg|fag+ot|retard|tranny|chink|spic|kike|paki)',
  '\\b(?:trump|biden|putin|modi|zelensk|netanyahu|hamas|hezbollah|taliban|kamala|obama)\\b',
  '\\b(?:kill|murder|bomb|suicide|behead)\\b',
].join('|'), 'i');

/** Leetspeak-folded copy for moderation only. */
export function moderationForm(name: string): string {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[@4]/g, 'a').replace(/[$5]/g, 's').replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/7/g, 't').replace(/\+/g, 't')
    .replace(/([a-z])\1{2,}/g, '$1$1');
}

export function isBlocked(name: string): boolean {
  return MODERATION_REGEX.test(name) || MODERATION_REGEX.test(moderationForm(name)) || MODERATION_REGEX.test(moderationForm(name).replace(/[^a-z]/g, ''));
}

/** N4/U2: static checks on a generated page before we cache it. Returns human-readable problems. */
export function lintTribute(html: string): string[] {
  const e: string[] = [];
  if (html.length < 1500) e.push('The page is too small to be a real game.');
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(|\bimport\s*\(/i.test(html)) e.push('Remove every network call or dynamic import.');
  if (/<(?:script|iframe|img|audio|video|source)\b[^>]*\bsrc\s*=\s*["']?(?!data:|blob:)[^"'\s>]/i.test(html) || /<link\b[^>]*\bhref\s*=/i.test(html) || /@import|url\(\s*["']?https?:/i.test(html)) e.push('Remove every external resource (script src, link, img src, @import, url()).');
  if (/\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/.test(html)) e.push('Do not use localStorage, sessionStorage, indexedDB or cookies; keep the best score in a variable.');
  if (/\b(?:alert|prompt|confirm)\s*\(/.test(html)) e.push('Do not use alert, prompt or confirm.');
  if (!/<canvas\b/i.test(html)) e.push('Draw the game on a <canvas>.');
  if (!/requestAnimationFrame/.test(html)) e.push('Run the game loop with requestAnimationFrame and a capped delta time.');
  if (!/addEventListener\(\s*['"]resize['"]|onresize\s*=/.test(html)) e.push('Add a window resize listener that re-sizes the canvas to window.innerWidth/innerHeight.');
  if (!/innerWidth/.test(html) || !/innerHeight/.test(html)) e.push('Size the canvas from window.innerWidth and window.innerHeight.');
  if (!/touchstart|pointerdown|onclick|addEventListener\(\s*['"]click['"]/.test(html)) e.push('Add touch / tap controls for phones.');
  if (!/['"](?:r|R|KeyR)['"]|keyCode\s*===?\s*82/.test(html)) e.push('Pressing R must restart after game over.');
  if (!/(?:ready|go!|get ready|3\.\.\.|countdown|grace)/i.test(html)) e.push('Add a 2-second "Ready... Go!" grace period before hazards start.');
  return e;
}

/** N4/U4: injected at serve time — tells the parent page if the tribute throws in its first seconds. */
export const SMOKE_SHIM = '<script>(function(){var t=Date.now(),sent=0;function f(m){if(sent||Date.now()-t>6000)return;sent=1;try{parent.postMessage({type:"rd-error",message:String(m).slice(0,200)},"*")}catch(_){}}window.addEventListener("error",function(e){f(e.message||"Script error")});window.addEventListener("unhandledrejection",function(e){f(e.reason)});setTimeout(function(){if(!document.querySelector("canvas"))f("no canvas")},2500)})();</script>';

export function withShim(html: string): string {
  const m = html.match(/<head[^>]*>/i);
  return m ? html.replace(m[0], m[0] + SMOKE_SHIM) : SMOKE_SHIM + html;
}

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
