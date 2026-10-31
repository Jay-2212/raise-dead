# Paint Grave — Tasks

## GraveApp scaffold
- [ ] 1. Create `src/graves/paint/index.ts` exporting `PaintGrave` implementing `GraveApp`.
- [ ] 2. `mount()`: create overlay wrapper with header (title, epitaph, RIP button), iframe container, mobile hint text; append to container.
- [ ] 3. `dispose()`: set `this.iframe = null` (DOM removed by `GraveOverlay.unmount()`).

## Vendor jspaint
- [ ] 4. Clone jspaint at a pinned commit: `git clone --depth 1 --branch master https://github.com/1j01/jspaint.git /tmp/jspaint`.
- [ ] 5. Copy the built static files into `public/apps/jspaint/`; keep `LICENSE` file.
- [ ] 6. Audit `lib/` subdirectory for any non-MIT third-party licences; add each to CREDITS.md.
- [ ] 7. Check for external CDN `<script>` or `<link>` tags in `index.html`; vendor those files locally so no runtime external network calls are made.
- [ ] 8. Add jspaint credit to CREDITS.md: `JS Paint | Isaiah Odhner | MIT | https://github.com/1j01/jspaint`.

## iframe element
- [ ] 9. Set `sandbox="allow-scripts allow-same-origin allow-downloads"` on the iframe.
- [ ] 10. Set `title="JS Paint — MS Paint tribute"` for accessibility.
- [ ] 11. Set `loading="eager"` so jspaint starts loading when the overlay opens.

## CSS
- [ ] 12. Apply flex-column layout: header fixed height; iframe container `flex: 1; overflow: hidden`; iframe `width: 100%; height: 100%; border: none; display: block`.
- [ ] 13. Mobile hint `display: none` by default; `display: block` when `@media (pointer: coarse)`.

## Exit wiring
- [ ] 14. Wire "Requiescat in pace" button to dispatch `rip-exit` custom event.

## QA
- [ ] 15. Open Paint grave overlay — jspaint loads within 3 s on fast connection.
- [ ] 16. Draw a line with the pencil tool — works without errors.
- [ ] 17. Inspect Network tab — no requests to external domains from iframe.
- [ ] 18. Click "Requiescat in pace" — overlay closes; no iframe elements remain in DOM.
- [ ] 19. Verify `public/apps/jspaint/LICENSE` exists (MIT).
- [ ] 20. `npm run typecheck` — no errors in `src/graves/paint/`.
