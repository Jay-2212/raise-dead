export interface Env {
  DB: D1Database;
  MODEL_API_KEY: string;
  TOKEN_SECRET: string;
  IP_SALT: string;
  ADMIN_KEY: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITEKEY?: string;
  ALLOWED_ORIGINS?: string;
  USER_LIFETIME?: string;
  DAILY_CAP?: string;
  MUSE_MODEL?: string;
  MUSE_EFFORT?: string;
  MUSE_MAX_TOKENS?: string;
  DEV?: string;
}

export function getEnv(env: Env, key: keyof Env, defaultValue: string): string {
  return (env[key] as string) || defaultValue;
}

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getIpKey(env: Env, cfConnectingIp: string | null): Promise<string> {
  const ipSalt = getEnv(env, 'IP_SALT', '');
  if (!ipSalt) {
    throw new Error('IP_SALT not configured');
  }

  let ip = cfConnectingIp || '';

  // Item 5 fix: handle IPv4-mapped addresses BEFORE the includes(':') branch.
  // ::ffff:a.b.c.d must be treated as the underlying IPv4 address so that
  // users cannot evade the quota by rotating between IPv4 and its mapped form.
  if (/^::ffff:[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/i.test(ip)) {
    // Strip the ::ffff: prefix and use the bare IPv4
    ip = ip.slice(7);
  } else if (ip.includes(':')) {
    // Pure IPv6 — expand :: and hash the first /64 (4 hextets)
    let expanded = ip;
    if (ip.includes('::')) {
      const parts = ip.split('::');
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const missing = 8 - left.length - right.length;
      const zeros = Array(Math.max(0, missing)).fill('0');
      expanded = [...left, ...zeros, ...right].join(':');
    }
    // Lowercase and take first 4 hextets (/64 prefix)
    ip = expanded.toLowerCase().split(':').slice(0, 4).join(':');
  }

  if (!ip) {
    throw new Error('CF-Connecting-IP not provided');
  }

  const data = new TextEncoder().encode(ipSalt + '|' + ip);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return 'ip:' + hashHex.slice(0, 32);
}

export async function mintToken(env: Env): Promise<{ id: string; token: string }> {
  const secret = getEnv(env, 'TOKEN_SECRET', '');
  if (!secret) {
    throw new Error('TOKEN_SECRET not configured');
  }

  const id = crypto.randomUUID();
  const data = 'v1.' + id;

  const secretBuf = new TextEncoder().encode(secret);
  const dataBuf = new TextEncoder().encode(data);

  const key = await crypto.subtle.importKey('raw', secretBuf, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, dataBuf);
  const sigB64 = base64urlEncode(sig);

  const token = data + '.' + sigB64;
  return { id, token };
}

export async function verifyToken(env: Env, token: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  if (parts[0] !== 'v1') return null;

  // Validate UUID
  if (!isValidUUID(parts[1])) return null;

  const secret = getEnv(env, 'TOKEN_SECRET', '');
  if (!secret) return null;

  const data = parts[0] + '.' + parts[1];
  const expectedSig = parts[2];

  const secretBuf = new TextEncoder().encode(secret);
  const dataBuf = new TextEncoder().encode(data);

  const key = await crypto.subtle.importKey('raw', secretBuf, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'verify',
  ]);

  const expectedSigBuf = base64urlDecode(expectedSig);
  const valid = await crypto.subtle.verify('HMAC', key, expectedSigBuf, dataBuf);

  return valid ? parts[1] : null;
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function constantTimeEqual(a: string, b: string): boolean {
  return constantTimeCompare(a, b);
}

export function checkOrigin(env: Env, origin: string | null, isDev: boolean): boolean {
  if (!origin) return false;

  // Check localhost:5173 in dev mode
  if (isDev && origin === 'http://localhost:5173') return true;

  // Check exact list match from ALLOWED_ORIGINS
  const allowed = getEnv(env, 'ALLOWED_ORIGINS', 'https://raise-dead.pages.dev');
  const allowedList = allowed.split(',').map(s => s.trim());

  for (const allow of allowedList) {
    if (origin === allow) return true;
  }

  // Check preview pattern: ^https://[a-z0-9-]+\.raise-dead\.pages\.dev$
  const previewPattern = /^https:\/\/[a-z0-9-]+\.raise-dead\.pages\.dev$/;
  if (previewPattern.test(origin)) return true;

  return false;
}

export function checkOriginForGet(env: Env, origin: string | null, secFetchSite: string | null, isDev: boolean): boolean {
  // Reject if Sec-Fetch-Site is present and is 'cross-site'
  if (secFetchSite === 'cross-site') {
    return false;
  }

  // If Origin is missing (as on same-origin GET), allow
  if (!origin) {
    return true;
  }

  // If Origin is present, validate it
  return checkOrigin(env, origin, isDev);
}

export async function json<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkAndReserveQuota(
  env: Env,
  db: D1Database,
  ipKey: string,
  tokKey: string
): Promise<QuotaCheckResult> {
  const userLifetime = parseInt(getEnv(env, 'USER_LIFETIME', '5'));
  const dailyCap = parseInt(getEnv(env, 'DAILY_CAP', '300'));

  // Check current usage (cheap SELECT first, no writes)
  const today = new Date().toISOString().split('T')[0];

  const checks = await db.batch([
    db.prepare('SELECT used FROM quota WHERE k = ?').bind(ipKey),
    db.prepare('SELECT used FROM quota WHERE k = ?').bind(tokKey),
    db.prepare('SELECT requests FROM usage_daily WHERE day = ?').bind(today),
  ]);

  let ipUsed = 0,
    tokUsed = 0,
    dayRequests = 0;

  if (checks[0].results && checks[0].results.length > 0) {
    ipUsed = (checks[0].results[0] as any).used;
  }
  if (checks[1].results && checks[1].results.length > 0) {
    tokUsed = (checks[1].results[0] as any).used;
  }
  if (checks[2].results && checks[2].results.length > 0) {
    dayRequests = (checks[2].results[0] as any).requests;
  }

  // Deny before any writes
  if (ipUsed >= userLifetime) return { allowed: false, reason: 'limit' };
  if (tokUsed >= userLifetime) return { allowed: false, reason: 'limit' };
  if (dayRequests >= dailyCap) return { allowed: false, reason: 'daily' };

  // Reserve with guarded upserts
  const now = Math.floor(Date.now() / 1000);
  const batch = [
    db.prepare(
      'INSERT INTO usage_daily(day, requests) VALUES(?, 1) ON CONFLICT(day) DO UPDATE SET requests=requests+1 WHERE requests < ? RETURNING requests'
    ).bind(today, dailyCap),
    db.prepare(
      'INSERT INTO quota(k, used, updated) VALUES(?, 1, ?) ON CONFLICT(k) DO UPDATE SET used=used+1, updated=? WHERE used < ? RETURNING used'
    ).bind(ipKey, now, now, userLifetime),
    db.prepare(
      'INSERT INTO quota(k, used, updated) VALUES(?, 1, ?) ON CONFLICT(k) DO UPDATE SET used=used+1, updated=? WHERE used < ? RETURNING used'
    ).bind(tokKey, now, now, userLifetime),
  ];

  const results = await db.batch(batch);

  // Check if all inserts succeeded (non-empty RETURNING)
  const dailyOk = results[0].results && results[0].results.length > 0;
  const ipOk = results[1].results && results[1].results.length > 0;
  const tokOk = results[2].results && results[2].results.length > 0;

  if (!dailyOk || !ipOk || !tokOk) {
    // Rollback: decrement only what succeeded
    const rollbackBatch = [];
    if (dailyOk) {
      rollbackBatch.push(db.prepare('UPDATE usage_daily SET requests=requests-1 WHERE day=? AND requests > 0').bind(today));
    }
    if (ipOk) {
      rollbackBatch.push(db.prepare('UPDATE quota SET used=used-1 WHERE k=? AND used > 0').bind(ipKey));
    }
    if (tokOk) {
      rollbackBatch.push(db.prepare('UPDATE quota SET used=used-1 WHERE k=? AND used > 0').bind(tokKey));
    }
    if (rollbackBatch.length > 0) {
      await db.batch(rollbackBatch);
    }
    return { allowed: false, reason: !dailyOk ? 'daily' : 'limit' };
  }

  return { allowed: true };
}

export async function refundQuota(db: D1Database, ipKey: string, tokKey: string, today: string): Promise<void> {
  await db.batch([
    db.prepare('UPDATE quota SET used=used-1 WHERE k=? AND used > 0').bind(ipKey),
    db.prepare('UPDATE quota SET used=used-1 WHERE k=? AND used > 0').bind(tokKey),
  ]);
}

export async function recordUsage(
  db: D1Database,
  today: string,
  ok: boolean,
  error: boolean,
  deniedUser: boolean,
  deniedDaily: boolean,
  blockedInput: boolean,
  promptTokens: number,
  completionTokens: number,
  reasoningTokens: number
): Promise<void> {
  // Item 7 fix: build parallel lists of (column, insertValue, updateExpr) so that
  // the INSERT supplies the initial value and the ON CONFLICT update increments it.
  // This ensures the VERY FIRST event of the day is recorded correctly (when the
  // INSERT path runs instead of the UPDATE path).
  const columns: string[] = ['day'];
  const insertValues: unknown[] = [today];
  const updateExprs: string[] = [];
  const bindValues: unknown[] = [];

  const addFlag = (col: string) => {
    columns.push(col);
    insertValues.push(1);
    updateExprs.push(`${col}=${col}+1`);
  };

  const addCount = (col: string, val: number) => {
    if (val > 0) {
      columns.push(col);
      insertValues.push(val);
      updateExprs.push(`${col}=${col}+?`);
      bindValues.push(val);
    }
  };

  if (ok) addFlag('ok');
  if (error) addFlag('errors');
  if (deniedUser) addFlag('denied_user');
  if (deniedDaily) addFlag('denied_daily');
  if (blockedInput) addFlag('blocked_input');
  addCount('prompt_tokens', promptTokens);
  addCount('completion_tokens', completionTokens);
  addCount('reasoning_tokens', reasoningTokens);

  if (updateExprs.length === 0) return;

  const colList = columns.join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const sql =
    `INSERT INTO usage_daily(${colList}) VALUES(${placeholders}) ` +
    `ON CONFLICT(day) DO UPDATE SET ${updateExprs.join(', ')}`;

  await db.prepare(sql).bind(...insertValues, ...bindValues).run();
}
