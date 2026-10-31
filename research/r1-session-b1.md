# Review round 1 — Kiro Session B1 (fonts, CSP, paths, loader, wizard glow, credits)

Read `research/review-round-1.md` for detail on each item. Session A (P0s, P1-1..8, P1-16..18) is done and committed; don't redo it. In this session do:

**P1-9 Self-hosted fonts + CSP.** The OFL font files are already staged in `public/assets/fonts/`:
- `Cinzel-VariableFont_wght.woff2` (variable, weight 400–900, Latin subset; Cinzel has no italic, let the browser synthesise it)
- `PixelifySans-VariableFont_wght.woff2` (variable, weight 400–700, Latin subset)
- `OFL-Cinzel.txt`, `OFL-PixelifySans.txt` (licences — keep them)
In `index.html`: remove the Google Fonts `<link>`s and preconnects; add `@font-face` rules (`font-family: 'Cinzel'` / `'Pixelify Sans'`, `font-weight: 400 900` / `400 700`, `font-display: swap`, `src: url('./assets/fonts/....woff2') format('woff2')`). Add the CSP `<meta>` exactly as in P1-9, and create `public/_headers` (Cloudflare Pages) with the same CSP plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and long cache for `/assets/*` hashed JS (P2-20: `Cache-Control: public, max-age=31536000, immutable` for `/assets/index-*`; `max-age=86400` for audio/images). Make sure nothing in `src/` or `index.html` still references fonts.googleapis/gstatic. Keep the P1-8 `document.fonts.load` race in main.ts.

**P1-10 Asset paths.** PreloadScene `this.load.setPath(import.meta.env.BASE_URL)` and drop leading `/` on every key path; GraveOverlay and CreditsScene use `${import.meta.env.BASE_URL}...`. Replace the `ImportMeta` shim in main.ts with `/// <reference types="vite/client" />` (or a `src/vite-env.d.ts`).

**P1-11 Grave app loader.** Use `import.meta.glob('../graves/*/index.ts')` in GraveOverlay so no raw `.ts` URL is requested (currently 404s `graves/clippy/index.ts` on every overlay). If no grave apps exist yet, the glob is simply empty and the placeholder text stays — no network request.

**P1-13 Wizard red glow.** Write `scripts/strip-wizard-glow.py` (Pillow; Pillow 13 is installed) that reads the ORIGINAL sheets from `assets/images/vendor/movicx-wizard/` (find the files matching the shipped ones; if originals are not there, first copy the current `public/assets/images/wizard/*.png` to `assets/images/vendor/movicx-wizard/original/` and read from that) and writes cleaned copies to `public/assets/images/wizard/`:
- For every wizard sheet: clear pixels where `alpha < 255 and r > 150 and g < 110 and b < 110` (the semi-transparent red glow).
- Then hue-shift the remaining opaque red trim (r > 150, g < 110, b < 110) to the teal palette #7fd1d8 (keep relative brightness) on all wizard sheets so the hero matches the moonlit palette.
- Print how many pixels changed per file. Run it. Delete unused `public/assets/images/wizard/mage_idle1.png` (check `src/` first).
The result must have no red outline/halo around the wizard or staff when idle.

**P1-15 CREDITS + README.** Update `CREDITS.md` (and the copy the game fetches, plus `REQUIRED` in CreditsScene and README) with:
- **Fonts** section: Cinzel (Natanael Gama / The Cinzel Project Authors, https://github.com/NDISCOVER/Cinzel) and Pixelify Sans (Stefie Justprince / The Pixelify Sans Project Authors, https://github.com/eifetx/Pixelify-Sans), SIL OFL 1.1, self-hosted WOFF2 subsets in `public/assets/fonts/` with OFL texts.
- **Code/libraries**: Phaser 3.90.0 (MIT, Phaser Studio), phaser3-rex-plugins 1.80.20 (MIT, Rex Rainbow), Vite + TypeScript (dev only, MIT/Apache-2.0).
- A "Shipped as" column for the image table (`public/assets/images/wizard/`, `public/assets/images/kenney/`, etc.).
- CC-BY 3.0 lines with the licence URL https://creativecommons.org/licenses/by/3.0/ and "modified" notes: Movicx wizard (red glow removed, trim recoloured teal, by script `scripts/strip-wizard-glow.py`); congusbongus/swuing footsteps (trimmed, normalised).
- AI disclosure: original images were "generated with the Hark image model (AI) from our own prompts, then edited/procedural where noted" — this is the tool named in `assets/images/MANIFEST.json`. Add a `TODO(Jay): confirm exact model name before submission` comment line.
- Trademark disclaimer (exact text in P1-15) in README, CREDITS, and the in-game credits.
- Piper voice: add `TODO: re-check en_US-norman-medium licence on Hugging Face before submission`.

**P2s if room:** P2-6 (mute icon: replace emoji with text "♪ ON"/"♪ OFF" in Pixelify Sans), P2-9 (GraveOverlay.unmount panel ref + clearTimeout), P2-18 (kill crow tweens), P2-15 (credits mask via make.graphics().createGeometryMask()).

Do not touch `research/`. Run `npm run build` at the end until it passes, then `grep -rn "googleapis\|gstatic" index.html src dist` must return nothing. Finish with a short summary per item.
