# Raise Dead: open-source "resurrection" candidates (scan of 2026-11-03)

How I checked: I read each LICENSE file through the GitHub license API (`download_url`) and fetched it raw. Stars, last-commit date and size come from `api.github.com/repos/OWNER/REPO` and `/commits?per_page=1`. Most repos were shallow-cloned to measure the working tree (`du`, without .git), list files and read the README credits. I did **not** test any of them in a browser. The "embed difficulty" ratings are my judgement from looking at the files.

Hard filter: permissive licence, runs as static files, under 15 MB, no ripped commercial art.

---

## Ranked top 5

| # | Grave | Repo | Licence (verified) | Stars | Last commit | Size | Build | Embed |
|---|---|---|---|---|---|---|---|---|
| 1 | 3D Pinball Space Cadet (Windows, removed after XP) | https://github.com/richdubbs/star-cadet | MIT ("Copyright (c) 2026 the Star Cadet authors") | 0 | 2026-10-12 | 2.6 MB | none (ES modules + import map) | Easy |
| 2 | Windows 3D Pipes screensaver | https://github.com/1j01/pipes | MIT (c) 2018 Isaiah Odhner | 414 | 2021-08-06 | 1.7 MB | none (three.js is in `lib/`) | Trivial |
| 3 | Contra-style run-and-gun | https://github.com/IroncladDev/salvadoran-reclamation | MIT (c) 2024 IroncladDev | 1 | 2026-06-23 | about 17 KB built (live single index.html) | none if you take the live build; the source needs Vite | Trivial (theme caveat) |
| 4 | Chrome "No Internet" T-Rex (Google) | https://github.com/wayou/t-rex-runner | BSD-3-Clause (c) 2022 牛さん; code and sprites are extracted from Chromium, which is also BSD | 2,199 | 2022-06-08 | 2.5 MB, about 0.3 MB after deleting the demo GIFs | none | Trivial |
| 5 | Google WebGL Globe (archived Chrome Experiment, Google Data Arts Team) | https://github.com/dataarts/webgl-globe (use the `globe/` folder only) | Apache-2.0 ("Copyright 2015 Google Data Arts Team") | 3,764 | 2020-09-04, repo archived | 0.87 MB (`globe/`) | none | Easy |

### 1. Star Cadet: Space Cadet Pinball
- **What it brings back:** the full 3D Pinball for Windows: Space Cadet table layout, all 17 missions, ranks, hyperspace, tilt, demo mode and Windows-style menus.
- **Assets:** the README says it has "an original 3D look: our own geometry and procedurally painted textures, lettering and logo — no bitmaps or code of the game are used or shipped." Original sounds are optional, loaded at run time and never bundled. It carries a "not affiliated with Microsoft/Cinematronics/Maxis" disclaimer and avoids the trademarked name.
- **Build:** none. It loads Three.js 0.160.0 from jsDelivr through an import map. It must be served over http(s), not file://. Put a copy of three.module.js in the repo and repoint the import map so it works offline and keeps working if the CDN breaks.
- **Risk:** it has 0 stars and the repo is brand new, so it is unproven. Test it in the iframe tonight.
- **Verdict:** the best find. A famous killed Microsoft game with clean original assets that drops straight into an iframe.

### 2. 1j01/pipes: 3D Pipes screensaver
- **What it brings back:** the Windows 95/98/XP OpenGL "3D Pipes" screensaver, including the teapot easter egg. Live at https://1j01.github.io/pipes/.
- **Assets:** procedural three.js geometry. The `images/` folder holds only the site's own icons and screenshots.
- **Build:** none. `index.html`, `screensaver.js` and `lib/three.min.js` + OrbitControls. It is MIT.
- **Verdict:** zero-effort 3D grave. Best "3D thing" if the Google 3D target is loose.

### 3. Salvadoran Reclamation: the Contra slot
- **What it brings back:** a side-scrolling 2D shooter/platformer (js13k 2024). WASD/arrows, mouse aim, dash and weapon pickups. Not a Contra clone, but the closest clean run-and-gun I found.
- **Assets:** all graphics are drawn in code (13 KB entry). Sound comes from ZzFX (MIT, Frank Force).
- **Build:** the source is TypeScript with Vite and roadroller, but the live build at https://ironcladdev.github.io/salvadoran-reclamation/ is one self-contained `index.html` of 17,575 bytes. Save it and serve it: zero build.
- **Caveats:**
  - The theme is a soldier fighting the real MS-13 gang in El Salvador (subtitle "MS-13"), which may not suit the tone.
  - The title is inside the packed file. Renaming means a rebuild (`bun`/`npm i && npm run build`).
  - It needs mouse aim, so the iframe needs pointer focus.
- **Verdict:** the drop-in run-and-gun to use tonight. Rebuild later if the theme or name bothers us.

### 4. wayou/t-rex-runner: Chrome Dino
- **What it brings back:** the Chrome offline T-Rex game, taken from Chromium's `components/neterror/resources/offline.js`.
- **Assets:** the sprites (`assets/default_100_percent|200_percent/*-offline-sprite.png`) are Chromium's own art under the Chromium BSD licence. Keep the LICENSE notice with it. Delete the other GIFs in `assets/` (kumamon, kugou and similar), which are fan screenshots and are not needed.
- **Build:** none (index.html, index.js, index.css). Sound is inlined as base64 Ogg.
- **Caveat:** the dino isn't dead. Frame it as "the offline page" grave, or as a Google tribute next to the Globe.
- **Verdict:** a trivial, recognisable Google grave.

### 5. Google WebGL Globe
- **What it brings back:** one of Google's 2011 Chrome Experiments 3D globes (experiments.withgoogle.com/chrome/globe). The repo is archived. It is a good fit for the "Google 3D thing" if Google Lively itself can't be had.
- **Assets:**
  - `globe/ce.png` is the Chrome Experiments logo, a Google mark. Strip it.
  - The source of `world.jpg` isn't stated in the repo. I believe it is NASA Blue Marble-style imagery, but I could not confirm that. Swap in a NASA public-domain texture to be safe.
  - `population909500.json` is the sample data.
- **Build:** none. Copy `globe/` (index.html, globe.js, third-party/three.min.js, Tween.js, Detector.js), 0.87 MB.
- **Verdict:** an easy, real dead-Google 3D experience. It is a visual toy rather than a game.

---

## Other candidates checked (ranks 6 and below)

| Grave | Repo | Licence | Stars / last commit | Size and build | Asset status | Verdict |
|---|---|---|---|---|---|---|
| Winamp | https://github.com/captbaritone/webamp | MIT (c) 2015 Jordan Eldredge | 11,332 / 2026-10-28 | npm `webamp` 2.3.1 (27 MB unpacked, but one lazy bundle from unpkg is small); static, drop in a `<script>` tag | README: "the Winamp name, interface, and sample audio file are surely property of Nullsoft". The default skin is Winamp's base skin and the demo track is the llama MP3 | The most famous app here and technically trivial, but the core look is Nullsoft's. Use only with a community skin and our own CC0 audio, and don't put "Winamp" on the grave. Medium risk |
| Platform shooter (pistolslut.com, which is itself dead) | https://github.com/maryrosecook/pistolslut | MIT (c) 2010-2011 Mary Rose Cook | 108 / 2014-06-23 | 1.7 MB, static (The Render Engine by Brett Fattori is bundled) | GIF sprites in `resources/`; where they came from isn't stated | The Contra-ish backup. The 2010 engine is untested in modern browsers and the title is crude, so rename it |
| SkiFree | https://github.com/basicallydan/skifree.js | MIT (c) 2013 Daniel Hough | 552 / 2026-02-23 | 976 KB, `dist/skifree.min.js` is committed so it is static | README credits sprites from Spriters Resource, i.e. ripped originals (© Chris Pirih/Microsoft) | Easy code, but we would have to redraw the sprites. Not clean as shipped |
| SkiFree (alt) | https://github.com/cdleveille/skifreejs | MIT (c) 2021 Chris Leveille | 14 / 2022-09-24 | needs a Node server (login, leaderboard) | "Original SkiFree graphics" | No: needs a server and uses ripped art |
| MS Paint | https://github.com/1j01/jspaint | MIT (c) 2022 Isaiah Odhner | 7,910 / 2026-04-10 | about 54 MB of files, over the cap; static | Mostly hand-redrawn icons, but the classic theme imitates MS UI closely | A great tribute but too big. Possible if we strip it, otherwise use the live jspaint.app link instead of embedding |
| Flappy Bird (killed by its creator in 2014) | https://github.com/nebez/floppybird | Apache-2.0 | 600 / 2026-02-17 | 572 KB, static | `assets/bird.png`, `land.png`, medals and fonts are copies of the original Flappy Bird art (© .GEARS) | The code is fine, the art isn't. Use it only after swapping in CC0 sprites (about 10 PNGs) |
| Tamagotchi | https://github.com/jcreighton/tamagotchi | MIT (c) 2017 Jenn | 90 / 2019-02-08 | 88 KB, static (VT323 font from Google Fonts) | 4 small pixel sheets. They look like they could be traced from Bandai characters, so they are unverified | The README says it is a work in progress and the game logic is thin. A fallback only |
| Nokia Snake | https://github.com/RabiRoshan/snake_game | MIT (c) 2020 Rabi Roshan | 59 / 2023-03-29 | 32 KB, static (`docs/`) | Drawn with CSS/canvas, no images | Trivial filler grave. Call it "Snake", not "Nokia" |
| Radius Raid (js13k shooter) | https://github.com/jackrugile/radius-raid-js13k | MIT (c) 2014 Jack Rugile | 271 / 2024-04-23 | 61 KB, static | Procedural | A clean, polished shooter, but it brings back no famous dead title |

## Excluded
- ellisonleao/clumsy-bird: GPL-3.0.
- Hextris: licence shows as NOASSERTION.
- daleharvey/helicopter and ibid-11962/Windows-95-3D-Maze-Screensaver: no licence file. Shame about the Maze.
- k4zmu2a/SpaceCadetPinball: a decompilation that needs Microsoft's data files.
- vhuhwavhomokoma/GoogleLively: CC0, but the repo is about 1 GB and not a web build.
- Metal Slug and Contra clones on GitHub: none had a licence, and all used ripped sprites.
- Club Penguin and MSN Messenger clones: no licence, or they need a server.

## Integration notes for tonight
- Put each grave in `public/graves/<slug>/` and point the iframe at `index.html`. All of the top 5 need http(s) serving. Star Cadet uses ES modules, so file:// will fail.
- Keep each repo's LICENSE file inside its grave folder. MIT, BSD and Apache all require the notice. Add a credits line in the overlay.
- Star Cadet and Salvadoran need iframe focus for keyboard and pointer. Call `iframe.focus()` on open and set `allow="autoplay; fullscreen"`.
- Vendor CDN dependencies (Star Cadet's three.js, the Tamagotchi Google Font) if offline or reliability matters.
