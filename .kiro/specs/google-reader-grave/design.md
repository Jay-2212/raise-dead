# Google Reader Grave — Design

## Module entry point
`src/graves/googlereader/index.ts` — implements `GraveApp`, mounts a self-contained vanilla TS/HTML UI into the container div.

## Three-pane layout
```
┌──────────────────────────────────────────────────────────────┐
│ header: "Google Reader (2005–2013)"    [Requiescat in pace]  │
├──────────────┬───────────────────────┬────────────────────────┤
│ sidebar      │ article list          │ article body           │
│ (200 px)     │ (280 px)              │ (flex-fill)            │
│              │                       │                        │
│ [Starred]    │ ● Headline 1   Jan 1  │ <sanitised content>    │
│ [All items]  │ ○ Headline 2   Jan 2  │                        │
│ ─────────    │ ● Headline 3   Jan 3  │                        │
│ HN Feed      │                       │                        │
│ BBC Feed     │ [Mark all read]       │                        │
│ + Add feed   │                       │                        │
└──────────────┴───────────────────────┴────────────────────────┘
```
Responsive: on mobile width < 640 px, stack panels vertically with back navigation.

## Data model
```typescript
interface Subscription { url: string; title: string; unread: number; }
interface FeedItem { id: string; feedUrl: string; title: string; date: string; body: string; read: boolean; starred: boolean; }
```
All state in a `ReaderStore` class backed by `localStorage`.

## Worker endpoint contract
`GET /api/feed?url=<encoded_url>`
```json
{
  "title": "Hacker News",
  "items": [
    { "id": "…", "title": "…", "date": "2026-10-31T10:00:00Z", "body": "<p>…</p>", "link": "…" }
  ]
}
```
Error: `{ "error": "…" }` with HTTP 4xx/5xx.

## Worker feed handler (`worker/feed.ts`)
```typescript
export async function handleFeed(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url).searchParams.get('url');
  validateUrl(url);   // throws if private IP or non-http
  const cached = await env.FEED_CACHE.get(url);
  if (cached) return jsonResponse(cached);
  const raw = await fetchWithTimeout(url, 8000, 2 * 1024 * 1024);
  const feed = parseFeed(raw);  // feedsmith
  await env.FEED_CACHE.put(url, JSON.stringify(feed), { expirationTtl: 600 });
  return jsonResponse(feed, { 'Cache-Control': 'max-age=600' });
}
```
IP block: resolve hostname, check against RFC-1918 ranges before fetch.

## DOMPurify usage (client-side)
```typescript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(item.body, { USE_PROFILES: { html: true } });
articleBodyDiv.innerHTML = clean;
```

## Curated seed feeds (hard-coded)
```typescript
const SEED_FEEDS = [
  { url: 'https://hnrss.org/frontpage',       title: 'Hacker News' },
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News' },
  { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', title: 'NASA' },
  { url: 'https://xkcd.com/rss.xml',          title: 'xkcd' },
  { url: 'https://killedbygoogle.com/rss',    title: 'Killed by Google' },
];
```

## Styling tokens
```css
--gr-header-bg: #1a73e8;   /* Google-blue evoking the era; no Google logo */
--gr-sidebar-bg: #f1f3f4;
--gr-content-bg: #ffffff;
--gr-unread-weight: 700;
--gr-read-weight: 400;
```
