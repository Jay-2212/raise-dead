# Google Reader Grave — Tasks

## GraveApp scaffold
- [ ] 1. Create `src/graves/googlereader/index.ts` exporting `GoogleReaderGrave` implementing `GraveApp`.
- [ ] 2. `mount()`: inject three-pane HTML layout into container; initialise `ReaderStore`; render sidebar.
- [ ] 3. `dispose()`: remove event listeners; clear DOM.

## Store
- [ ] 4. Create `src/graves/googlereader/ReaderStore.ts` — class managing subscriptions, items, read/starred state in `localStorage`.
- [ ] 5. Methods: `getSubscriptions()`, `addSubscription(url, title)`, `removeSubscription(url)`, `getItems(feedUrl)`, `markRead(id)`, `toggleStar(id)`, `markAllRead(feedUrl)`.
- [ ] 6. On `mount()`, load `SEED_FEEDS` if `localStorage` has no existing subscriptions.

## Worker: feed endpoint
- [ ] 7. Create `worker/feed.ts` — `handleFeed()` function.
- [ ] 8. Implement URL validation: allow only `http://` / `https://`; resolve hostname; block RFC-1918 + loopback ranges.
- [ ] 9. Implement `fetchWithTimeout(url, 8000, 2MB)` using `AbortController`.
- [ ] 10. Parse response with `feedsmith`; normalise to `{ title, items[] }` shape.
- [ ] 11. Cache result in Workers KV (`env.FEED_CACHE`) with `expirationTtl: 600`.
- [ ] 12. Return JSON with `Access-Control-Allow-Origin: ${env.PAGES_ORIGIN}` and `Cache-Control: max-age=600`.

## Feed fetching (client)
- [ ] 13. Create `src/graves/googlereader/api.ts` — `fetchFeed(url): Promise<FeedResponse>` calling `GET /api/feed?url=<encoded>`.
- [ ] 14. Handle errors (non-2xx, timeout) and return `{ error: string }` shape.

## Three-pane UI
- [ ] 15. Implement sidebar: render subscription list with unread counts; "Starred items" virtual feed at top; "All items" virtual feed; "+ Add subscription" input at bottom.
- [ ] 16. On subscription click, call `fetchFeed(url)`, merge items into store, render article list in centre pane.
- [ ] 17. Implement article list: show title, date, bold=unread/normal=read; "Mark all read" button.
- [ ] 18. On article click, mark as read, render sanitised body in right pane via DOMPurify.
- [ ] 19. Add star icon to each article row; toggle `starred` in store on click; update "Starred items" virtual feed.
- [ ] 20. Implement "+ Add subscription" form: validate non-empty input, call `fetchFeed`, on success add to store; show inline error on failure.
- [ ] 21. Implement subscription removal (× icon in sidebar).

## DOMPurify
- [ ] 22. Add `dompurify@3.x` (Apache-2.0) to `package.json`.
- [ ] 23. Wrap all `innerHTML` assignments from feed item bodies with `DOMPurify.sanitize(..., { USE_PROFILES: { html: true } })`.
- [ ] 24. Add DOMPurify credit to CREDITS.md.

## Responsive layout
- [ ] 25. Apply CSS: three columns on desktop; stacked single column on mobile (width < 640 px) with back navigation between panes.

## QA
- [ ] 26. Test XSS: feed item containing `<script>alert(1)</script>` renders sanitised (no alert).
- [ ] 27. Test private-IP URL (e.g. `http://192.168.1.1/feed`) returns error response without crashing.
- [ ] 28. Test add → remove → reload subscription cycle persists correctly.
- [ ] 29. Add feedsmith credit to CREDITS.md.
