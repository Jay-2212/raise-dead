# Review round 1 — Kiro Session B2 (load size + performance)

Read P1-12 and P2-3/4/5/8/12/19 in `research/review-round-1.md`. Session A and B1 are done; don't redo them. Do:

1. **Audio re-encode (P1-12).** Write `scripts/reencode-audio.sh` (ffmpeg is at /usr/bin/ffmpeg) that re-encodes every `.ogg`/`.mp3` under `public/assets/audio/` and `public/assets/voice/` IN PLACE (same file names and keys, so no code changes needed):
   - music + ambient loops: mono, Ogg Vorbis `-q:a 1` (~64 kbps) and MP3 `-b:a 64k -ac 1`;
   - SFX, footsteps and voice: mono, Ogg `-q:a 0` (~48 kbps) and MP3 `-b:a 48k -ac 1`;
   - Encode from the best available source: the matching master in `assets/audio/` or `assets/voice/` if present, otherwise the current `.ogg`. Never write into `assets/`.
   - Keep sample-accurate length (no added padding on Ogg; for MP3 that's unavoidable, fine).
   - Print total size before/after. Target: under 4 MB of audio per format in `public/`.
   Run it.
2. **Remove unused preloads (P1-12).** Delete load calls (and files in `public/` only if nothing in `src/` uses them) for keys never used in `src/`: kenney_spark_04, kenney_magic_01, kenney_magic_03, kenney_star_01, kenney_light_01, kenney_twirl_01, sky_moon, crow_perched, fog_puff, rune_circle, leaves_strip, ui_hover, ui_select, ui_back, open_panel, close_panel, rune_sparkle_short. Grep each key first; keep any that is used.
3. **Split the preload (P1-12).** PreloadScene loads only what TitleScene needs (title keyart, title waltz, UI frame, data JSON). TitleScene starts a background `this.load` of all world/ritual assets after it renders; entering the graveyard waits for that load to complete, showing a small progress text/ring ("Summoning… 63%") on the title if the user presses Enter before it's done. Keep the two-step title (first input unlocks audio, second enters).
4. **Downscale particle PNGs (P1-12).** With a Pillow script `scripts/downscale-particles.py`, resize in `public/assets/images/` only: Kenney 512px sparks/smoke → 128px, `rune_circle_add` → 256px, `holy_light_burst` 1024 → 512px. Then multiply the matching Phaser `scale`/`setDisplaySize` values in code so on-screen sizes stay the same.
5. **Fog overdraw (P1-12).** Size the three fog TileSprites to the camera view (`setScrollFactor(0)`, view-sized) and scroll `tilePositionX/Y` by camera scroll × parallax plus drift. Store `{sprite, sx, sy}` objects instead of the per-frame `Object.getOwnPropertyDescriptor` lookup (P2-5).
6. P2-3 (fireflies follow wisps), P2-4 (random leaf textures leaf_1..8, emit zone limited to camera view ±100px), P2-8 (default medallion texture `medal_unmarked`, never `medal_generic`), P2-12 (footstep detune ±80 cents), P2-19 (iOS: on `visibilitychange` visible, re-play stopped loops).

Do not touch `research/` or `assets/`. Run `npm run build` until it passes. Summarise each item and report audio size before/after.

7. **Fix `public/_headers` caching.** `/assets/*` is currently `immutable` for a year, but `public/assets/audio|images|fonts|voice` are NOT hashed, so updates would never reach players. Change to: `/assets/index-*` (Vite hashed JS/CSS) → `public, max-age=31536000, immutable`; `/assets/audio/*`, `/assets/images/*`, `/assets/voice/*`, `/assets/fonts/*` → `public, max-age=86400`; `/index.html` and `/` → `no-cache`. Keep the security headers under `/*`. (Check `vite.config` output names so the hashed-JS rule matches.)
8. P2s left over from B1 if room: P2-6 (mute icon as text "♪ ON"/"♪ OFF" in Pixelify Sans, no emoji), P2-9 (GraveOverlay.unmount stores the panel ref; clearTimeout pending removal on re-mount), P2-15 (credits mask via `this.make.graphics().fillRect(...).createGeometryMask()`), P2-18 (kill crow tweens on destroy).
