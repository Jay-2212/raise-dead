# Unmarked Grave — Tasks

## GraveApp scaffold
- [ ] 1. Create `src/graves/unmarked/index.ts` exporting `UnmarkedGrave` implementing `GraveApp`.
- [ ] 2. `mount()`: inject overlay HTML (header, portrait area, summon form, status div, app area with iframe, re-summon button).
- [ ] 3. `dispose()`: abort any in-flight requests; clear `iframe.srcdoc`; remove event listeners.

## Summon form
- [ ] 4. Wire form `submit` event to `handleSummon(appName)`.
- [ ] 5. Validate input: trim whitespace; require 2–60 characters; disable submit button while empty or in-flight.
- [ ] 6. On submit: disable form; show status "Communing with the beyond…"; start rune spinner.

## Rune spinner
- [ ] 7. Create a CSS-only rune spinner (6 glyphs orbiting a circle using `@keyframes rotate`); show/hide via `hidden` attribute.

## AI calls
- [ ] 8. Create `src/graves/unmarked/api.ts` — `generateApp(appName): Promise<string>` and `generatePortrait(appName): Promise<string>`.
- [ ] 9. `generateApp`: POST to `/api/ai` with Muse Spark prompt (system + user); 15 s `AbortController` timeout; return HTML string from `choices[0].message.content`.
- [ ] 10. `generatePortrait`: POST to `/api/ai` with Muse Image prompt; 15 s timeout; return image URL or base64 from response.
- [ ] 11. In `handleSummon()`, call both via `Promise.allSettled([ generateApp(), generatePortrait() ])`.

## App mounting (iframe srcdoc)
- [ ] 12. Set `iframe.srcdoc = html` on the `sandbox="allow-scripts"` iframe (no `allow-same-origin`).
- [ ] 13. Listen for `window.message` events with `{ type: 'close' }` from the iframe; on receive, call `resetToInput()`.
- [ ] 14. Show `#app-area`, hide `#summon-area` after successful generation.

## Portrait mounting
- [ ] 15. On successful portrait generation, create `<img>` with the returned URL; append to `#portrait-area`.
- [ ] 16. Emit `update-tombstone` custom event with `{ appName, portraitUrl }` to allow `GraveyardWorld` to update the unmarked tombstone sprite during the session.

## Error states
- [ ] 17. On `generateApp` failure/timeout: show "The spirits are silent tonight. Try another name."; re-enable form.
- [ ] 18. On `generatePortrait` failure: silently continue (portrait area stays empty); do not block app mounting.

## Worker AI proxy
- [ ] 19. Create `worker/ai.ts` — implement `handleAI()` routing to Meta Muse Spark (`POST /chat/completions`) or Muse Image (`POST /images/generations`); detect model type from request body.
- [ ] 20. Inject `Authorization: Bearer ${env.META_API_KEY}` header server-side; never in client code.
- [ ] 21. Implement Oxion fallback: on 429 from Meta, retry once with `OXION_API_KEY` + `OXION_BASE_URL`.
- [ ] 22. Handle `OPTIONS` pre-flight for CORS.
- [ ] 23. Add `Access-Control-Allow-Origin: ${env.PAGES_ORIGIN}` to all responses.

## Security verification
- [ ] 24. Confirm iframe has `sandbox="allow-scripts"` only (no `allow-same-origin`).
- [ ] 25. Test XSS: generate an app; verify `window.parent.document` access throws in the iframe console.
- [ ] 26. Test 15 s timeout: mock a slow response; verify timeout error message appears.

## QA
- [ ] 27. Type "Netscape Navigator" → Summon → verify two `/api/ai` calls in Network tab.
- [ ] 28. Generated app renders in iframe without host console errors.
- [ ] 29. Portrait image appears in `#portrait-area` when generation succeeds.
- [ ] 30. "Requiescat in pace" closes overlay cleanly.
- [ ] 31. Add CREDITS.md note: "Unmarked-grave apps generated at runtime by Meta Muse Spark; portraits by Meta Muse Image."
