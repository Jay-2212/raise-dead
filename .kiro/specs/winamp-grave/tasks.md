# Winamp Grave — Tasks

## GraveApp scaffold
- [ ] 1. Create `src/graves/winamp/index.ts` exporting `WinampGrave` implementing `GraveApp`.
- [ ] 2. `mount()`: create overlay HTML (header with title + RIP button, `#webamp-container` div, footer disclaimer).
- [ ] 3. `dispose()`: call `wamp.dispose()`; clear reference.

## Webamp setup
- [ ] 4. Add `webamp@2.3.1` to `package.json` (exact version).
- [ ] 5. In `mount()`, `import Webamp from 'webamp'`; construct `new Webamp({ initialTracks: KOMIKU_TRACKS })`.
- [ ] 6. Set `#webamp-container` to `position: relative` before calling `wamp.renderInto()`.
- [ ] 7. Await `wamp.renderInto(document.getElementById('webamp-container'))`.
- [ ] 8. Add Webamp credit to CREDITS.md.

## Komiku tracks
- [ ] 9. Download 4–6 CC0 Komiku tracks from Free Music Archive; place in `public/assets/audio/winamp/` as MP3.
- [ ] 10. Define `KOMIKU_TRACKS` array in `src/graves/winamp/tracks.ts` with correct `metaData.artist` and `metaData.title` per track.
- [ ] 11. Add one CREDITS.md entry per track: `<filename> | Komiku | CC0 1.0 | <FMA URL>`.

## Exit safety
- [ ] 12. Wire "Requiescat in pace" button to call `wamp.dispose()` then dispatch `rip-exit` custom event.
- [ ] 13. Verify no audio plays after dispose (manual test: open overlay, play track, click RIP, confirm silence).

## Stretch: Graveyard Amp skin
- [ ] 14. (Stretch) Create 14 required BMP files for a `.wsz` skin at correct Winamp dimensions (reference https://webamp.org/skin-format.html).
- [ ] 15. (Stretch) ZIP the BMPs, rename to `graveyard-amp.wsz`, place in `public/assets/skins/`.
- [ ] 16. (Stretch) Enable `initialSkin: { url: '/assets/skins/graveyard-amp.wsz' }` in `WinampGrave.mount()`.

## QA
- [ ] 17. Verify `public/assets/audio/winamp/` contains only Komiku files (no `llama-2.91.mp3` or other non-CC0 audio).
- [ ] 18. Open overlay → Webamp renders → play a track → music plays without CORS errors in console.
- [ ] 19. Verify footer disclaimer reads "Winamp is a trademark of its owners; Webamp is an unaffiliated recreation."
- [ ] 20. Verify all Komiku track entries are in CREDITS.md.
