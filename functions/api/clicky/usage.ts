import { Env, constantTimeEqual, getEnv, checkOriginForGet } from './_lib';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const isDev = env.DEV === '1';

  if (request.method !== 'GET') {
    return new Response(null, { status: 405 });
  }

  // Origin check for GET: allow missing Origin, but reject if Sec-Fetch-Site is cross-site
  const origin = request.headers.get('Origin');
  const secFetchSite = request.headers.get('Sec-Fetch-Site');
  if (!checkOriginForGet(env, origin, secFetchSite, isDev)) {
    return new Response(null, { status: 403 });
  }

  const adminKey = request.headers.get('X-Admin-Key');
  if (!adminKey || !constantTimeEqual(adminKey, getEnv(env, 'ADMIN_KEY', ''))) {
    return new Response(null, { status: 404 });
  }

  try {
    const daysBack = 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { results } = await env.DB.prepare(
      `SELECT day, requests, ok, errors, denied_user, denied_daily, blocked_input, prompt_tokens, completion_tokens, reasoning_tokens
       FROM usage_daily WHERE day >= ? ORDER BY day DESC LIMIT 14`
    ).bind(startDateStr).all();

    const rows = results || [];
    const data = rows.map((row: unknown) => {
      const r = row as Record<string, number | string>;
      return {
        day: r['day'],
        requests: r['requests'] || 0,
        ok: r['ok'] || 0,
        errors: r['errors'] || 0,
        denied: ((r['denied_user'] as number) || 0) + ((r['denied_daily'] as number) || 0),
        blocked: r['blocked_input'] || 0,
        prompt_tokens: r['prompt_tokens'] || 0,
        completion_tokens: r['completion_tokens'] || 0,
        reasoning_tokens: r['reasoning_tokens'] || 0,
        estimated_usd:
          (((r['prompt_tokens'] as number) || 0) * 0.10 +
            ((r['completion_tokens'] as number) || 0) * 0.20) /
          1e6,
      };
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_e) {
    return new Response(null, { status: 500 });
  }
};
