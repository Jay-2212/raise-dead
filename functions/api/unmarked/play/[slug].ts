/** GET /api/unmarked/play/:slug — serves a cached tribute page under a no-network CSP (framed by us only). */
import { Env } from '../../clicky/_lib';
import { PLAY_CSP } from '../_shared';

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== 'GET') return new Response(null, { status: 405 });
  const slug = String(params.slug || '');
  if (!/^[a-z0-9-]{1,48}$/.test(slug)) return new Response('Not found', { status: 404 });
  const row = await env.DB.prepare('SELECT html FROM unmarked_cache WHERE slug = ?').bind(slug).first<{ html: string }>();
  if (!row) return new Response('This soul has not risen yet.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(row.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': PLAY_CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
