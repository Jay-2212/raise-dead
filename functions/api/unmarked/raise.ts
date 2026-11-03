/**
 * POST /api/unmarked/raise  { name }  ->  { slug, name, cached, remaining }
 * Cached names are free and instant. New names cost one of the visitor's raises
 * (UNMARKED_LIFETIME per hashed IP and per signed token, default 3) and one of the
 * day's UNMARKED_DAILY_CAP (default 100). Muse Spark (contributor tier) writes the page.
 */
import { Env, getEnv, getIpKey, verifyToken, checkOrigin } from '../clicky/_lib';
import { SYSTEM_PROMPT, INJECTION_REGEX, cleanName, slugify, extractHtml, today } from './_shared';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

function tokenFrom(request: Request): string | null {
  const m = (request.headers.get('Cookie') || '').match(/rd_ck=([^;]+)/);
  return m ? m[1] : request.headers.get('X-Clicky-Token');
}

async function remainingFor(env: Env, db: D1Database, ipK: string, tokK: string): Promise<number> {
  const life = parseInt(getEnv(env, 'UNMARKED_LIFETIME' as keyof Env, '3'));
  const r = await db.batch([
    db.prepare('SELECT used FROM quota WHERE k = ?').bind(ipK),
    db.prepare('SELECT used FROM quota WHERE k = ?').bind(tokK),
  ]);
  const ip = (r[0].results?.[0] as { used?: number } | undefined)?.used ?? 0;
  const tk = (r[1].results?.[0] as { used?: number } | undefined)?.used ?? 0;
  return Math.max(0, life - Math.max(ip, tk));
}

export const onRequest: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const isDev = env.DEV === '1';
  if (!request.headers.get('Content-Type')?.includes('application/json')) return new Response(null, { status: 415 });
  if (!checkOrigin(env, request.headers.get('Origin'), isDev)) return new Response(null, { status: 403 });

  const text = await request.text();
  if (text.length > 512) return reply({ error: 'too_long' }, 413);
  let body: { name?: unknown };
  try { body = JSON.parse(text); } catch { return reply({ error: 'invalid' }, 400); }
  const name = cleanName(body.name);
  if (!name) return reply({ error: 'name' }, 400);
  if (INJECTION_REGEX.test(name)) return reply({ error: 'name' }, 400);
  const slug = slugify(name);
  const db = env.DB;

  // Token + hashed IP (same session token as Clicky)
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip && !isDev) return new Response(null, { status: 403 });
  const token = tokenFrom(request);
  const tokId = token ? await verifyToken(env, token).catch(() => null) : null;
  if (!tokId) return reply({ error: 'session' }, 401);
  const ipK = 'u-' + (await getIpKey(env, ip || '127.0.0.1'));
  const tokK = 'u-tok:' + tokId;

  // 1. Cache hit: free and instant
  const hit = await db.prepare('SELECT name FROM unmarked_cache WHERE slug = ?').bind(slug).first<{ name: string }>();
  if (hit) {
    waitUntil(db.prepare('UPDATE unmarked_cache SET hits = hits + 1 WHERE slug = ?').bind(slug).run());
    return reply({ slug, name: hit.name, cached: true, remaining: await remainingFor(env, db, ipK, tokK) });
  }

  // 2. Reserve: lifetime per IP and token, plus the daily cap (guarded upserts, rollback on any miss)
  const life = parseInt(getEnv(env, 'UNMARKED_LIFETIME' as keyof Env, '3'));
  const cap = parseInt(getEnv(env, 'UNMARKED_DAILY_CAP' as keyof Env, '100'));
  const now = Math.floor(Date.now() / 1000);
  const day = today();
  const res = await db.batch([
    db.prepare('INSERT INTO unmarked_daily(day, requests) VALUES(?, 1) ON CONFLICT(day) DO UPDATE SET requests = requests + 1 WHERE requests < ? RETURNING requests').bind(day, cap),
    db.prepare('INSERT INTO quota(k, used, updated) VALUES(?, 1, ?) ON CONFLICT(k) DO UPDATE SET used = used + 1, updated = ? WHERE used < ? RETURNING used').bind(ipK, now, now, life),
    db.prepare('INSERT INTO quota(k, used, updated) VALUES(?, 1, ?) ON CONFLICT(k) DO UPDATE SET used = used + 1, updated = ? WHERE used < ? RETURNING used').bind(tokK, now, now, life),
  ]);
  const ok = res.map((r) => (r.results?.length ?? 0) > 0);
  const refund = async (all: boolean) => {
    const q: D1PreparedStatement[] = [];
    if (all || ok[0]) q.push(db.prepare('UPDATE unmarked_daily SET requests = requests - 1 WHERE day = ? AND requests > 0').bind(day));
    if (all || ok[1]) q.push(db.prepare('UPDATE quota SET used = used - 1 WHERE k = ? AND used > 0').bind(ipK));
    if (all || ok[2]) q.push(db.prepare('UPDATE quota SET used = used - 1 WHERE k = ? AND used > 0').bind(tokK));
    if (q.length) await db.batch(q);
  };
  if (!ok.every(Boolean)) {
    await refund(false);
    return reply({ error: ok[0] ? 'limit' : 'daily', remaining: await remainingFor(env, db, ipK, tokK) }, 429);
  }

  // 3. Ask Muse Spark (non-streaming; ~20-30 s)
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 75000);
  try {
    const up = await fetch('https://api.meta.ai/v1/chat/completions', {
      method: 'POST',
      signal: ac.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.MODEL_API_KEY}` },
      body: JSON.stringify({
        model: env.MUSE_MODEL || 'muse-spark-1.3-contributor',
        reasoning_effort: 'minimal',
        max_tokens: 6000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'Raise: ' + name },
        ],
      }),
    });
    if (!up.ok) throw new Error('upstream ' + up.status);
    const data = (await up.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const html = extractHtml(data.choices?.[0]?.message?.content || '');
    if (!html) throw new Error('bad_html');
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO unmarked_cache(slug, name, html, created) VALUES(?, ?, ?, ?)').bind(slug, name, html, now),
      db.prepare('UPDATE unmarked_daily SET ok = ok + 1, prompt_tokens = prompt_tokens + ?, completion_tokens = completion_tokens + ? WHERE day = ?')
        .bind(data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0, day),
    ]);
    return reply({ slug, name, cached: false, remaining: await remainingFor(env, db, ipK, tokK) });
  } catch {
    await refund(true);
    waitUntil(db.prepare('UPDATE unmarked_daily SET errors = errors + 1 WHERE day = ?').bind(day).run());
    return reply({ error: 'upstream' }, 502);
  } finally {
    clearTimeout(timer);
  }
};
