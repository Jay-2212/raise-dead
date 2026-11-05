# Polish Pass (Night 5) — Requirements

Jay's asks after playtesting the live build (Nov 5 2026). The current minimap "feels hasty".

1. **One-press entry.** A single Enter, Space, click or tap on the title starts the game and lands in the
   graveyard with keyboard focus already on the canvas (keep commit 297cafd). No second confirmation.
   The same gesture unlocks the AudioContext; if audio cannot start, entry still happens.
2. **Volume sliders.** Music and Effects (SFX + ambience) sliders slide out when the pointer hovers the
   speaker icon (tap on touch screens). Default 70 %, saved in localStorage, bone/moonlight styling, small.
   Lower the base gain so 70 % is comfortable (the game was too loud).
3. **Minimap redesign.** A proper game minimap of this graveyard: grass ground, paths, tombstone markers,
   player marker, soft vignette and frame, readable grave labels/highlighting. Keep click-to-fast-travel
   and grave names working.
4. **Performance.** Initial load fetches only what the title and first graveyard screen need. Heavy grave
   payloads (DOOM WAD + wasm, rhythm music, three.js) load only inside their grave. Re-encode big loops,
   compress large PNG/GIF, cache headers in `public/_headers`. Report initial-load bytes before/after.
5. **Cheap fixes.** DOOM Esc inconsistency; friendlier pinball "WebGL not available" text.

Constraints: no original Microsoft/EA/Nullsoft art or logos; the paperclip is always "Clicky".
