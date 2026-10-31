# Raise Dead — open-source code & assets we can legally borrow

Researched 2026-10-31 (IST). Licence column = the actual LICENSE file fetched from the repo's default branch (raw.githubusercontent.com), not just GitHub's badge. Stars / last push from the GitHub API on the same day.
Rules applied (from PLAN.md): MIT / Apache-2.0 / BSD / ISC / CC0 / CC-BY only. GPL/AGPL only as an isolated, separately-embedded app (flagged). No licence = rejected. No NC/ND. No original logos, ROMs, ripped sprites, or Microsoft/EA art.

> Big gotcha found: **many repos have MIT code but non-free assets bundled** (javascript-racer music & sprites, clippy.js / ms-agent-js Clippy sprites, skifree.js sprites, floppybird sprites, winXP icons). Take the code; never copy their `images/`, `music/`, `agents/` folders.

> Phaser version gotcha: npm `phaser@latest` is now **4.2.1** and `phaserjs/template-vite-ts` HEAD moved to Phaser 4.0.0 (commit 36a4c406, 2026-04-10). We are on Phaser 3, so pin **`phaser@3.90.0`** (last 3.x, 2025-05-23) and start from template commit **919be730b4** (phaser ^3.90.0, vite ^6.3.1, TS ~5.7).

---

## 1. Road Rash–style pseudo-3D motorbike combat racer

| Repo | URL | Licence (verified) | Stars / last push | Verdict | Integration plan | Attribution |
|---|---|---|---|---|---|---|
| jakesgordon/javascript-racer | https://github.com/jakesgordon/javascript-racer | **MIT** (code) — README: music is Lucky Lion Studios, "licensed ONLY for use in this project, should not be reproduced"; sprites are "placeholder graphics borrowed from the old Genesis version of OutRun" | 1,176 / 2025-06-02 | ✅ **USE CODE ONLY** (best-documented engine, v4 "final" has hills, curves, sprites, traffic cars) | Vendor `common.js` + `v4.final.html` logic into `src/graves/roadrash/` as a standalone canvas module (or iframe page `public/apps/roadrash/`). Delete all `images/` and `music/`. Replace with our own sprites + CC0 music. Combat: reuse its `cars[]` (segment/offset/z/speed) as **rival bikers**; add `state` (riding/punching/kicking/hit/crashed), check `abs(rival.z - player.z) < k && abs(offset diff) < 0.3` on J (punch) / K (kick), knock rival offset outward + speed drop, crash past road edge; rivals swing back on a timer → player loses speed / wobbles. One track, ~3 laps, 5–6 rivals. Est. 1–1.5 days. | `Pseudo-3D road engine based on javascript-racer by Jake Gordon (MIT) — https://github.com/jakesgordon/javascript-racer` + keep MIT notice in the vendored file header. |
| Coestar/sadRacer | https://github.com/Coestar/sadRacer | **CC0-1.0** | 8 / 2022-12-30 | ✅ Alternative if we want it *inside Phaser* (uses Phaser 3.55.2, scenes/ structure) | Could port its scene into our Phaser 3.90 game as a Scene. Prototype quality ("guide-following prototype"); art provenance of `car.png`, `hills.png` etc. not stated → regenerate art anyway. | None required (CC0); courtesy credit "Coestar". |
| ssusnic/Pseudo-3d-Racer | https://github.com/ssusnic/Pseudo-3d-Racer | **MIT** | 65 / 2021-05-29 | ⚠️ Reference only — Phaser **2**, tutorial code | Read for the projection math / YouTube walkthrough. | MIT notice if code copied. |
| fishfolk/drifty | https://github.com/fishfolk/drifty | Apache-2.0 (badge) | 19 / 2024-07 | ❌ Rust/Bevy, not web-JS | — | — |
| MahadevanSrinivasan/road-rash, the-entertrainer/road-rash, aikopoko/Road-Rash-2D…, kevinmel2000/RoadRash-Game | github | **No licence** | 0–1 ★ | ❌ Reject (no licence; also use EA name) | — | — |
| RoadRash64Recompiled / 3do-decomp-road-rash | github | GPL-3.0 / GPL-2.0 + need EA game data | — | ❌ Reject (needs ROMs/EA assets) | — | — |
| nicolasbize/roadkill | github | NOASSERTION, Godot | 10 | ❌ | — | — |

**Answer: yes, fork javascript-racer and add punch/kick rivals.** Art we need (all original): rear-view rider bike sprite sheet (straight, lean L/R, punch L/R, kick L/R, hit, crash) ×2 colours, roadside props, sky/hills. Options: generate with Muse Image / our pipeline, or start from **Pixor "Motorbike" CC0 8-direction sprite sheet** (https://pixor.art/library/vehicles/motorbike/ — CC0 per page, verify on download). Title the grave "Road Rash (tribute)" in text only; no EA logo, no Genesis sprites (Spriters Resource rips are EA-owned — do not use). Music: Komiku "Battle Theme" (CC0, see §4).

---

## 2. Google Reader–style RSS reader + CORS-safe fetching

| Repo | URL | Licence (verified) | Stars / last push | Verdict | Integration plan | Attribution |
|---|---|---|---|---|---|---|
| macieklamberski/feedsmith | https://github.com/macieklamberski/feedsmith (npm `feedsmith` 3.0.1) | **MIT** | 635 / 2026-10-29 | ✅ **USE** — parser | Parse RSS/Atom/RDF/JSON Feed in the **Cloudflare Worker** (pure TS, no Node deps) and return normalised JSON to the client. | MIT notice in CREDITS.md (bundled in Worker). |
| rbren/rss-parser | https://github.com/rbren/rss-parser | **MIT** | 1,530 / 2026-08-25 | ⚠️ Backup — heavier (xml2js, Node http); needs `nodejs_compat` in Workers | Use only if feedsmith misses a feed shape. | MIT notice. |
| 619dev/guanlan (观澜) | https://github.com/619dev/guanlan | **MIT** | 57 / 2026-07-17 | ⚠️ **Borrow UI ideas/CSS only** — it is literally "a Google Reader-inspired RSS reader on Cloudflare Workers", but React 19 + Vinext + D1 + password auth = too heavy to embed | Study its 3-pane layout (subscriptions / list / reader), unread/star filters, "mark all read". If any CSS/TS is copied, keep notice. | `Layout inspired by Guanlan (MIT) — https://github.com/619dev/guanlan` |
| shikakun/konpeito, johnwmail/tsrss | https://github.com/shikakun/konpeito · https://github.com/johnwmail/tsrss | **MIT** (konpeito verified) | 19 / 7 | ⚠️ Reference for Worker+D1 feed fetching patterns | — | — |
| naggie/megafilter | github | Apache-2.0 | 60 / 2015 | ❌ Stale, server app | — | — |
| ituff/cfrss | github | GPL-3.0 | 6 | ❌ GPL, not needed | — | — |
| jakemadison/FeedEater | github | AGPL-3.0 | 2 | ❌ | — | — |

**Plan:** write our own small Google-Reader-look UI (vanilla TS + CSS, original blue/white 2010 palette, no Google logo) in the grave overlay. Worker route `GET /api/feed?url=` :
1. Allow only `http(s)`, block private IPs/localhost, cap body ~2 MB, timeout 8 s.
2. Optional allowlist of curated feeds (HN, BBC, NASA, Verge, xkcd, Killed by Google) for the demo + free-text "Add subscription".
3. `fetch()` server-side (no CORS issue), parse with feedsmith, return JSON with `Access-Control-Allow-Origin` = our Pages origin, `Cache-Control: max-age=600` + Workers Cache API.
4. Strip/sanitize item HTML client-side (DOMPurify, Apache-2.0 OR MPL-2.0 dual — choose Apache-2.0) before rendering.
Persist subscriptions/read/starred in `localStorage` (no D1 needed for the hackathon). Effort ~0.5–1 day.

---

## 3. Clippy

| Repo | URL | Licence (verified) | Stars / last push | Verdict | Integration plan | Attribution |
|---|---|---|---|---|---|---|
| clippyjs/clippy.js (orig. smore-inc; npm `clippyjs` 0.1.0 → pi0/clippyjs, repo now gone) | https://github.com/clippyjs/clippy.js | **MIT** (`MIT-LICENSE.txt`, © 2012 Fireplace, Inc) — **code only** | 2,877 / 2022-12-01 | ⚠️ Runtime OK; **sprites NOT OK**. `agents/Clippy/map.png`, `sounds-*.js` (and Bonzi, Merlin, Genie…) are extracted from Microsoft Agent `.acs` files — Microsoft-owned (BonziBuddy's owner for Bonzi). README credits "Microsoft, for creating clippy". Needs jQuery. | If used: load our own `agent.js` (frame/animation map) + our own `map.png`. | MIT notice for the runtime. |
| azayrahmad/ms-agent-js (npm `ms-agent-js` 0.5.1) | https://github.com/azayrahmad/ms-agent-js | **MIT** (© 2026 Aziz Rahmad) — code only | 5 / 2026-04-13 | ✅ **Best runtime** (TypeScript + Vite, canvas, WebP atlas + WebM audio sprite, speech balloons). ⚠️ its `public/agents/` contains Microsoft characters → do not ship those | `npm i ms-agent-js`; build an original character in its "optimized format" (`agent.json` + `.webp` atlas + `.webm` audio sprite, see docs/assets.md) and load from `/agents/Paperclip/`. Wire its `speak()` to our Worker → Meta Muse Spark. | `Agent runtime: MSAgentJS by Aziz Rahmad (MIT) — https://github.com/azayrahmad/ms-agent-js` |
| kbennett2000/vivify | https://github.com/kbennett2000/vivify | **MIT** (© 2026 Kris Bennett) | 1 / 2026-06-22 | ⚠️ Clean-room ACS renderer that **ships no Microsoft files** (good legal model) but expects user-supplied `.acs` → not useful for a public demo | Reference only. | — |
| luiz-chagas/react-clippy, Towmeykaw/js-clippy | github | MIT / NOASSERTION | 9 / 7 | ❌ Wrappers around the same MS sprites | — | — |
| lethargiesleeps/ClippyCore | github | GPL-3.0 | 2 | ❌ Desktop, GPL | — | — |

**Recommendation: original paperclip.** A bent-wire paperclip with eyes is a generic idea, but Clippy's specific drawing, animations and sounds are Microsoft's. Make **"Clip the Ghost"** (or similar): our own paperclip with a ghostly glow, ~10 animations (Idle, Greeting, Wave, Thinking, Writing, LookLeft/Right, GetAttention, Explain, Goodbye/Sink-into-grave). Produce frames with our image pipeline, pack into one WebP atlas, drive with ms-agent-js (or a ~150-line custom DOM/canvas player if ms-agent-js format fights us). Tombstone text can say "Clippy (Office Assistant), 1997–2007" as nominative reference; don't use Microsoft's art or the Office logo.

---

## 4. Winamp — Webamp + skins + free music

| Item | URL | Licence (verified) | Stars / last push | Verdict | Integration plan | Attribution |
|---|---|---|---|---|---|---|
| captbaritone/webamp (npm `webamp` 2.3.1) | https://github.com/captbaritone/webamp | **MIT** (`LICENSE.txt`, © 2015 Jordan Eldredge) | 11,327 / 2026-10-28 | ✅ **USE** | `npm i webamp`; in the grave overlay: `const w = new Webamp({ initialTracks, initialSkin? }); await w.renderInto(overlayDiv)` (v2.3+, container needs `position: relative`); `w.dispose()` on "Rest in peace". Use `import Webamp from "webamp"` (lighter) unless we want Milkdrop: `"webamp/butterchurn"`. **Serve skin + mp3s from our own Pages domain** (Webamp docs: CORS — skins/audio must be same-origin or CORS-enabled). Self-host, don't rely on unpkg. | `Webamp by Jordan Eldredge (MIT) — https://github.com/captbaritone/webamp` |
| Default skin (bundled "base 2.91" Winamp skin) | ships inside the `webamp` package | Original artwork is Nullsoft's (now Llama Group); shipped by the MIT package but not separately licensed | — | ⚠️ Low-risk/common practice, but flag it. Safer: make our **own .wsz skin** ("Graveyard Amp": bone/moonlight palette) — a .wsz is just a zip of BMPs. | Default for MVP; own skin as stretch. | "Winamp is a trademark of its owners; Webamp is an unaffiliated recreation." |
| Skins from Winamp Skin Museum (skins.webamp.org / archive.org) | https://skins.webamp.org | Per-skin, almost all **unlicensed** fan works | — | ❌ Don't bundle; at most link out to the museum. | — | — |
| `llama-2.91.mp3` ("it really whips the llama's ass") used in Webamp demos | in webamp repo | Nullsoft/Winamp audio, not licensed to us | — | ❌ Don't ship | — | — |
| **Komiku** albums on Free Music Archive (e.g. "It's time for adventure!", "Poupi's incredible adventures!", "Tale on the Late") | https://freemusicarchive.org/music/Komiku/ | **CC0 1.0** (stated on each album/track page) | — | ✅ **SHIP** 4–6 tracks (chiptune/adventure fits; "Battle Theme" for Road Rash, "Sad walk with sad piano" for graveyard) | Download mp3s, put in `public/audio/winamp/`, add ID3 tags so Webamp shows title/artist. | Not required; credit "Music: Komiku (CC0) — freemusicarchive.org/music/Komiku" |
| SoundSafari/CC0-1.0-Music (mirror of FreePD + CC0 FMA artists incl. Komiku, HoliznaCC0) | https://github.com/SoundSafari/CC0-1.0-Music | **CC0-1.0** (repo LICENSE) | 76 / 2023-12 | ✅ Convenient download source | Pull specific files; keep source path in CREDITS.md. | Courtesy credit to original artist. |
| Kevin MacLeod / incompetech | https://incompetech.com/music/royalty-free/licenses/ | Creative Commons, free with credit (site generates the credit line) | — | ✅ OK if we want a "famous" track; attribution mandatory | Same as above. | Copy the credit incompetech generates for each title. |
| Pixabay Music | — | Pixabay Content License (not CC; bars standalone redistribution) | — | ❌ Avoid in a public repo | — | — |

---

## 5. Phaser 3 helpers

| Need | Repo / feature | URL | Licence (verified) | Stars / last push | Verdict | Integration plan | Attribution |
|---|---|---|---|---|---|---|---|
| Engine | phaserjs/phaser **3.90.0** | https://github.com/phaserjs/phaser | **MIT** | 40,610 / 2026-08-21 | ✅ | `npm i phaser@3.90.0` (exact pin; latest is 4.x). | MIT, CREDITS.md |
| Vite + TS starter | phaserjs/template-vite-ts @ `919be730b4` | https://github.com/phaserjs/template-vite-ts/tree/919be730b40018199a202a8a1c92f6ba3687047b | **MIT** (© 2025 Phaser Studio) | 197 / 2026-04-21 | ✅ | Use `npm create`-style copy of that commit (Phaser 3.90, Vite 6, TS 5.7). Do **not** take HEAD (Phaser 4). | Keep its LICENSE notice. |
| Top-down WASD movement | Built-in Arcade Physics (`this.physics.add.sprite`, `setVelocity`, `body.velocity.normalize().scale(speed)`) | — | MIT (Phaser) | — | ✅ Write ourselves (≈30 lines) | phaserjs/examples has **no LICENSE** → read for reference, don't copy code. | — |
| Virtual joystick (mobile) | rexrainbow/phaser3-rex-notes → `virtualjoystick-plugin` (npm `phaser3-rex-plugins` 1.80.20) | https://github.com/rexrainbow/phaser3-rex-notes | **MIT** (© 2018 Rex) | 1,333 / 2026-10-30 | ✅ **USE** | `import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js'`; register in game config `plugins.global`; show only on touch devices; map `joystick.forceX/Y` to velocity; add an on-screen "F" button for the ritual. Same package also has `shakeposition`, `flash`, `fade`, `soundfade` plugins if needed. | MIT notice |
| | florianvazelle/phaser3-vjoy-plugin | https://github.com/florianvazelle/phaser3-vjoy-plugin | MIT | 8 / 2022 | ⚠️ Backup only | — | — |
| | leandrocurioso/phaser3-virtual-joystick | github | **No licence** | 19 | ❌ | — | — |
| Falling leaves / fog / fireflies | Built-in ParticleEmitter (3.60+ API: `this.add.particles(x, y, 'leaf', { speedY, rotate, lifespan, emitZone, gravityY })`) + `TileSprite` fog layers scrolled at different speeds; PostFX (`camera.postFX.addVignette/addBloom`) | — | MIT | — | ✅ | Leaf/fog/spark textures: **Kenney Particle Pack & Smoke Particles (CC0)** — https://kenney.nl/assets/particle-pack , https://kenney.nl/assets/smoke-particles . Fireflies: tiny additive-blend circles with `moveTo` tweens. | Kenney: CC0, courtesy "Kenney.nl" |
| Lighting (moonlight, lantern glow) | Built-in Light2D: `this.lights.enable().setAmbientColor(0x223355)`, `sprite.setPipeline('Light2D')`, `this.lights.addLight(x,y,r,color,intensity)` on each jack-o'-lantern + one following the wizard's staff | — | MIT | — | ✅ | Normal maps optional (`'key'` + `'key_n'`). For cheap glow, Kenney **Light Masks** (CC0) as additive sprites. | — |
| Screen shake / flash / holy light | Built-in `this.cameras.main.shake(800, 0.01)`, `.flash(600, 255,255,255)`, `.fadeOut/fadeIn` | — | MIT | — | ✅ | Ritual: shake (ground rumble) → flash white → fadeOut to white → mount DOM overlay app → fadeIn on exit. | — |

---

## 6. Extra graves with existing OSS web recreations (ranked effort vs wow)

| Rank | Dead app (died) | Repo | URL | Licence (verified) | Stars / last push | Verdict | Integration plan | Attribution | Effort / Wow |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **MS Paint** (deprecated 2017) | 1j01/jspaint | https://github.com/1j01/jspaint | **MIT** (© 2022 Isaiah Odhner) | 7,910 / 2026-07-20 | ✅ **ADD** | Easiest: `<iframe src="https://jspaint.app">` in the overlay (officially documented in README "Embed in your website"; supports `#load:URL`). Robust: vendor the static build into `public/apps/jspaint/` and iframe locally (keep its LICENSE + third-party lib notices). | `JS Paint by Isaiah Odhner (MIT) — https://github.com/1j01/jspaint` | 0.5 h / ★★★★★ |
| 2 | **Adobe Flash Player** (EOL Dec 2020) | ruffle-rs/ruffle (npm `@ruffle-rs/ruffle` 0.7.1) | https://github.com/ruffle-rs/ruffle | **MIT OR Apache-2.0** (LICENSE.md, dual, © Ruffle LLC & contributors) | 18,776 / 2026-10-31 | ✅ Runtime is fine — **the SWF is the problem** | Self-host Ruffle files from npm in `public/ruffle/` (serve `.wasm` with `application/wasm` — Pages does); `window.RufflePlayer.newest().createPlayer().load('/swf/x.swf')`. Legal SWF options: (a) **make our own** tiny SWF (e.g. Haxe → `-swf` target or Apache Flex SDK `mxmlc`; compilers are build tools, output is ours) — a 1-screen "skip intro" animation + mini game; (b) EvidentlyCube **Kulkis** has MIT code / CC-BY art / CC-BY-SA music but **levels CC BY-NC-ND** → ❌ under our no-NC/ND rule; EvidentlyCube/LegacyGames graphics are CC BY-NC-SA → ❌; Tyler Glaiel's FLAs are CC BY-NC-SA → ❌; Newgrounds/Flashpoint/archive.org SWFs → ❌ (copyrighted). | `Flash emulation by Ruffle (MIT/Apache-2.0) — https://ruffle.rs` | 0.5–1 day / ★★★★ |
| 3 | **Windows Minesweeper** (removed from Windows 8, 2012) | muan/emoji-minesweeper | https://github.com/muan/emoji-minesweeper | **MIT** (© 2019 Mu-An Chiou) | 908 / 2022-09 | ✅ ADD (logic) | Reuse board logic; restyle as Win98 window with **jdan/98.css** (MIT, 11.6k★, https://github.com/jdan/98.css). Draw our own digit/smiley sprites (don't rip XP/98 bitmaps). Or write from scratch (~200 lines). | `Minesweeper logic adapted from emoji-minesweeper by Mu-An Chiou (MIT)`; `98.css by Jordan Scales (MIT)` | 2–3 h / ★★★★ |
| | | ShizukuIchi/winXP `src/WinXP/apps/Minesweeper` | https://github.com/ShizukuIchi/winXP | **MIT** code (© 2019 Shizuku Yang); README: "Windows XP name, artwork, trademark are surely property of Microsoft" | 5,867 / 2023-11 | ⚠️ React component; uses XP-derived bitmaps → code only | — | — | — |
| | | ShizukuIchi/minesweeper | github | **No licence** | 290 | ❌ | — | — | — |
| 4 | **Flappy Bird** (pulled from stores Feb 2014) | nebez/floppybird | https://github.com/nebez/floppybird | **Apache-2.0** (code) — README: assets "extracted directly from the Flappy Bird android game… copyright Dong Nguyen / .GEARS"; no explicit permission | 599 / 2026-02 | ⚠️ **Code only, redraw all art** (e.g. a ghost bird between tombstone pipes — on-theme) | Vendor into `public/apps/flappy/`, swap sprites/sfx with ours/Kenney CC0. Apache-2.0 requires keeping LICENSE + stating changes. | `Based on Floppy Bird by Nebez Briefkani (Apache-2.0); modified` | 3–4 h / ★★★★ |
| 5 | **SkiFree** (Microsoft Entertainment Pack, 1991) | basicallydan/skifree.js | https://github.com/basicallydan/skifree.js | **MIT** code (© 2013 Daniel Hough); sprites from Spriters Resource = ripped Microsoft art | 552 / 2026-06 | ⚠️ Code only, redraw sprites (yeti → our ghost) | Vendor build into `public/apps/skifree/`. | `Based on skifree.js by Daniel Hough (MIT)` | 0.5 day / ★★★ |
| 6 | Windows XP desktop (support ended 2014) | ShizukuIchi/winXP | https://github.com/ShizukuIchi/winXP | MIT code, MS icons/Bliss wallpaper | 5,867 | ❌ As a whole (MS artwork everywhere). Note its Paint app is just a jspaint iframe and Winamp is webamp — we already have both. | — | — | — |
| 7 | Windows 98 desktop | 1j01/98 (98.js.org) | https://github.com/1j01/98 | **No licence file** (API: none) | 1,437 | ❌ Reject | — | — | — |
| 8 | Vine (2017) | FormulaMonks/thicket | https://github.com/FormulaMonks/thicket | MIT | 27 / 2023 | ❌ Not worth it (IPFS app); a "6-second loop wall" would be original work with CC0 clips — low wow | — | — | — |
| ✗ | Club Penguin (2017) | CPPS projects | — | Disney IP; private servers repeatedly taken down | — | ❌ Reject | — | — | — |
| ✗ | 3D Pinball Space Cadet | lrusso/3DPinballSpaceCadet etc. | — | No licence + needs Microsoft data files | — | ❌ Reject | — | — | — |
| ✗ | Tamagotchi | tonypan2/tamagotchi-p1-web | — | No licence + needs Bandai ROM | — | ❌ Reject | — | — | — |

---

## Recommended final list

**Core (launch graves)**
1. **Road Rash tribute** — fork `jakesgordon/javascript-racer` (MIT code only; strip its OutRun sprites + Lucky Lion music), add punch/kick rival bikers; original/AI rider sprite sheet (or Pixor CC0 motorbike base); Komiku CC0 "Battle Theme". Fallback engine: `Coestar/sadRacer` (CC0, Phaser).
2. **Google Reader** — our own 3-pane UI (layout cues from `619dev/guanlan`, MIT) + Cloudflare Worker `/api/feed` using `feedsmith` (MIT) + DOMPurify (Apache-2.0 option) + localStorage.
3. **Clippy** — `ms-agent-js` (MIT, TS/Vite) runtime + **original "ghost paperclip" atlas**; never ship Microsoft agent sprites from clippy.js/ms-agent-js.
4. **Winamp** — `webamp` 2.3.1 (MIT) via npm, `renderInto()` overlay; 4–6 **Komiku CC0** tracks self-hosted; default skin for MVP (flagged), own .wsz skin as stretch.

**Engine & helpers**
- `phaser@3.90.0` (pin!) + `phaserjs/template-vite-ts@919be730b4` (MIT).
- `phaser3-rex-plugins` virtualjoystick (MIT) for mobile.
- Built-in Phaser particles / Light2D / camera shake-flash-fade / PostFX; Kenney Particle Pack, Smoke Particles, Light Masks (CC0) for textures.

**Cheap extra graves (in order)**
1. MS Paint → jspaint iframe (½ hour, huge wow).
2. Minesweeper → emoji-minesweeper logic + 98.css (2–3 h).
3. Flappy Bird → floppybird code with our own ghost-bird art (3–4 h).
4. Adobe Flash → Ruffle + a SWF we compile ourselves (½–1 day; only if time).
5. SkiFree → skifree.js code with redrawn sprites (½ day; stretch).

**CREDITS.md lines to add (copy as-is)**
```
- javascript-racer — Jake Gordon — MIT — https://github.com/jakesgordon/javascript-racer (code only; original music/sprites not used)
- feedsmith — Maciej Lamberski — MIT — https://github.com/macieklamberski/feedsmith
- MSAgentJS (ms-agent-js) — Aziz Rahmad — MIT — https://github.com/azayrahmad/ms-agent-js (runtime only; character art is original)
- Webamp — Jordan Eldredge — MIT — https://github.com/captbaritone/webamp
- Phaser 3 — Phaser Studio Inc. — MIT — https://github.com/phaserjs/phaser
- Phaser Vite TS template — Phaser Studio Inc. — MIT — https://github.com/phaserjs/template-vite-ts
- phaser3-rex-plugins — Rex Rainbow — MIT — https://github.com/rexrainbow/phaser3-rex-notes
- JS Paint — Isaiah Odhner — MIT — https://github.com/1j01/jspaint
- 98.css — Jordan Scales — MIT — https://github.com/jdan/98.css
- emoji-minesweeper — Mu-An Chiou — MIT — https://github.com/muan/emoji-minesweeper
- Floppy Bird — Nebez Briefkani — Apache-2.0 — https://github.com/nebez/floppybird (modified; original Flappy Bird art not used)
- Ruffle — Ruffle LLC & contributors — MIT OR Apache-2.0 — https://github.com/ruffle-rs/ruffle
- Music: Komiku — CC0 1.0 — https://freemusicarchive.org/music/Komiku/
- Particles/light textures: Kenney — CC0 1.0 — https://kenney.nl
- Trademarks (Road Rash, Google Reader, Clippy, Winamp, Paint, Minesweeper, Flappy Bird, Flash) belong to their owners; these are unaffiliated tributes.
```

## Open items / not verified
- Pixor motorbike CC0 claim taken from the page summary; confirm on the asset page before using.
- Webamp's bundled default skin licence is not stated anywhere; treated as low-risk but flagged.
- jspaint self-host: if vendoring rather than iframing jspaint.app, check its `lib/` folder licences at that time.
- DOMPurify: LICENSE file fetched — Apache-2.0 text (project is dual Apache-2.0/MPL-2.0); 17.5k★, pushed 2026-10-31. Add `- DOMPurify — Cure53 — Apache-2.0 — https://github.com/cure53/DOMPurify` to CREDITS.md.
- Kevin MacLeod CC version not shown on the licence page fetched; use the credit incompetech generates.
