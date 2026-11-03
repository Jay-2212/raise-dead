import {
  Env,
  getIpKey,
  mintToken,
  verifyToken,
  checkOriginForGet,
} from './_lib';

function getTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = cookie.match(/rd_ck=([^;]+)/);
  return match ? match[1] : null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const isDev = env.DEV === '1';

  // Origin check for GET: allow missing Origin, but reject if Sec-Fetch-Site is cross-site
  const origin = request.headers.get('Origin');
  const secFetchSite = request.headers.get('Sec-Fetch-Site');
  if (!checkOriginForGet(env, origin, secFetchSite, isDev)) {
    return new Response(null, { status: 403 });
  }

  const cfConnectingIp = request.headers.get('CF-Connecting-IP');

  // Check for missing IP outside DEV
  if (!cfConnectingIp && !isDev) {
    return new Response(null, { status: 403 });
  }

  try {
    // Get IP key (async)
    let ipKey: string;
    try {
      ipKey = await getIpKey(env, cfConnectingIp);
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'internal' }), { status: 500 });
    }

    // Read token from cookie first, then header
    let token = getTokenFromCookie(request);
    if (!token) {
      token = request.headers.get('X-Clicky-Token');
    }

    let tokId = '';
    if (token) {
      const id = await verifyToken(env, token);
      if (id) {
        tokId = id;
      }
    }

    const userLifetime = parseInt(env.USER_LIFETIME || '5');
    const dailyCap = parseInt(env.DAILY_CAP || '300');
    const today = new Date().toISOString().split('T')[0];

    // Item 6 fix: If no valid token, read IP quota before minting so remaining reflects IP cap.
    if (!tokId) {
      // Read IP usage before minting
      const ipResult = await env.DB.prepare('SELECT used FROM quota WHERE k = ?').bind(ipKey).first<{ used: number }>();
      const dayResult = await env.DB.prepare('SELECT requests FROM usage_daily WHERE day = ?').bind(today).first<{ requests: number }>();
      const ipUsed = ipResult?.used ?? 0;
      const dayRequests = dayResult?.requests ?? 0;
      const daily = dayRequests >= dailyCap ? 'closed' : 'open';
      const remainingFromIp = Math.max(0, userLifetime - ipUsed);

      try {
        const { id, token: newToken } = await mintToken(env);
        tokId = id;
        // remaining is min of ip remaining and lifetime (new tok has 0 used)
        const remaining = Math.min(remainingFromIp, userLifetime);
        return new Response(
          JSON.stringify({
            remaining,
            daily,
            turnstile: env.TURNSTILE_SECRET ? true : false,
            token: newToken,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': `rd_ck=${newToken}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`,
            },
          }
        );
      } catch (_e) {
        return new Response(JSON.stringify({ error: 'internal' }), { status: 500 });
      }
    }

    // Read quota for valid token
    const [ipResult, tokResult, dayResult] = await env.DB.batch([
      env.DB.prepare('SELECT used FROM quota WHERE k = ?').bind(ipKey),
      env.DB.prepare('SELECT used FROM quota WHERE k = ?').bind('tok:' + tokId),
      env.DB.prepare('SELECT requests FROM usage_daily WHERE day = ?').bind(today),
    ]);

    let ipUsed = 0;
    let tokUsed = 0;
    let dayRequests = 0;

    if (ipResult.results && ipResult.results.length > 0) {
      ipUsed = (ipResult.results[0] as { used: number }).used;
    }
    if (tokResult.results && tokResult.results.length > 0) {
      tokUsed = (tokResult.results[0] as { used: number }).used;
    }
    if (dayResult.results && dayResult.results.length > 0) {
      dayRequests = (dayResult.results[0] as { requests: number }).requests;
    }

    const remaining = Math.min(userLifetime - ipUsed, userLifetime - tokUsed);
    const daily = dayRequests >= dailyCap ? 'closed' : 'open';

    return new Response(
      JSON.stringify({
        remaining: Math.max(0, remaining),
        daily,
        turnstile: env.TURNSTILE_SECRET ? true : false,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500 });
  }
};
