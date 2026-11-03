### 1. Top-Level Stored XSS / Same-Origin Execution (`play/[slug]`)
* **Bug & Abuse Path**: Tribute HTML is AI-generated and contains inline scripts. In [`_shared.ts`](file:///workspace/raise-dead/functions/api/unmarked/_shared.ts#L87-L88), `PLAY_CSP` specifies `script-src 'unsafe-inline'` and `frame-ancestors 'self'`, but omits the `sandbox` directive. While [`UnmarkedGrave.ts`](file:///workspace/raise-dead/src/graves/unmarked-grave/UnmarkedGrave.ts#L652) frames it inside an `allow-scripts` iframe, navigating directly to `/api/unmarked/play/:slug` loads the page top-level in the origin `raise-dead.pages.dev` (satisfying `frame-ancestors`). The untrusted script gains full same-origin privileges, allowing access to `localStorage` tokens and top-level redirection via `location.href` for exfiltration or phishing.
* **Fix**:
  1. In [`functions/api/unmarked/_shared.ts`](file:///workspace/raise-dead/functions/api/unmarked/_shared.ts#L87-L88), add `sandbox allow-scripts;` to `PLAY_CSP`:
     ```typescript
     export const PLAY_CSP =
       "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox allow-scripts;";
     ```
  2. In [`functions/api/unmarked/play/[slug].ts`](file:///workspace/raise-dead/functions/api/unmarked/play/[slug].ts#L100), block direct top-level navigation:
     ```typescript
     if (request.headers.get('Sec-Fetch-Dest') && request.headers.get('Sec-Fetch-Dest') !== 'iframe') {
       return new Response(null, { status: 403 });
     }
     ```

---

### 2. Permanent 401 Session Lockout (Cookie Path Mismatch)
* **Bug**: [`raise.ts`](file:///workspace/raise-dead/functions/api/unmarked/raise.ts#L133-L136) expects `rd_ck` in `Cookie` or `X-Clicky-Token`. However, [`functions/api/clicky/session.ts`](file:///workspace/raise-dead/functions/api/clicky/session.ts#L86) mints `rd_ck` with `Path=/api/clicky`, preventing browsers from sending it to `/api/unmarked/*`. Additionally, when `rd_ck` is present, `session.ts` validates the cookie but omits `token` in the JSON response ([`session.ts#L119-L126`](file:///workspace/raise-dead/functions/api/clicky/session.ts#L119-L126)). If `localStorage` is empty, [`getSession()`](file:///workspace/raise-dead/src/graves/clippy/api.ts#L19-L47) never populates `rd_clicky_token`, leaving `/api/unmarked/raise` stuck returning 401 indefinitely.
* **Fix**:
  1. In [`functions/api/clicky/session.ts`](file:///workspace/raise-dead/functions/api/clicky/session.ts#L86), expand cookie scope:
     ```typescript
     'Set-Cookie': `rd_ck=${newToken}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`
     ```
  2. In [`functions/api/clicky/session.ts`](file:///workspace/raise-dead/functions/api/clicky/session.ts#L119-L126), return the token when valid:
     ```typescript
     return new Response(JSON.stringify({ remaining: Math.max(0, remaining), daily, turnstile: Boolean(env.TURNSTILE_SECRET), token }), ...);
     ```
  3. In [`src/graves/unmarked-grave/UnmarkedGrave.ts`](file:///workspace/raise-dead/src/graves/unmarked-grave/UnmarkedGrave.ts#L612), ensure a token is ready before requesting:
     ```typescript
     let token = localStorage.getItem('rd_clicky_token');
     if (!token) { await getSession(); token = localStorage.getItem('rd_clicky_token'); }
     ```

---

### 3. Global Cache Collision & Cache Poisoning on Non-Latin / Punctuation Names
* **Bug & Abuse Path**: [`cleanName()`](file:///workspace/raise-dead/functions/api/unmarked/_shared.ts#L59-L65) permits any character matching `^[\p{L}\p{N} .,'&!:+\-]+$` without requiring any alphanumeric characters, accepting inputs like `".."` or `"--"`. Meanwhile, [`slugify()`](file:///workspace/raise-dead/functions/api/unmarked/_shared.ts#L67-L69) strips all non-ASCII characters (`[^a-z0-9]+`) and defaults empty strings to `'unknown'`. Consequently, any punctuation-only name and all non-Latin names (Cyrillic, Japanese, Chinese, Arabic) collapse to `slug = 'unknown'`. Because `slug` is the primary key in `unmarked_cache`, the first generated tribute under `'unknown'` poisons the cache for all non-Latin game requests across all users.
* **Fix**:
  In [`functions/api/unmarked/_shared.ts`](file:///workspace/raise-dead/functions/api/unmarked/_shared.ts#L59-L69):
  ```typescript
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
    let h = 0x811c9dc5;
    for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0;
    return `u-${h.toString(16)}`;
  }
  ```

---

### 4. Broken Header DOM Parsing in `road-rash.html`
* **Bug**: In [`public/games/muse/road-rash.html#L332`](file:///workspace/raise-dead/public/games/muse/road-rash.html#L332), `<div id="top><h1 style="...` is missing the closing quote on `id="top"`. The browser consumes the `<h1>` tag inside the attribute value `id="top><h1 style="`, breaking `#top` and `#top h1` styles.
* **Fix**:
  In [`public/games/muse/road-rash.html#L332`](file:///workspace/raise-dead/public/games/muse/road-rash.html#L332):
  ```html
  <div id="top"><h1 style="font-size:15px;letter-spacing:1px;text-shadow:0 0 8px #2de2c5">Road Rash — risen (tribute)</h1><p>Dodge traffic 60s, ram &amp; SPACE-punch rival riders! Arrows/WASD ride.</p></div>
  ```
