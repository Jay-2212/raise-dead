# Raise Dead — Night 3 plan (Nov 3 2026, 21:00 IST → Meta submit by Nov 5 05:30 IST, hard close 07:30 IST)

Team: Hark (architect, writes the plan AND the exact code), Grok 4.7 + Gemini (agy) review plan and code, Hark does the final pass, Kiro (claude-haiku-4.5, ~15.8 credits ≈ 8–10 short sessions) only APPLIES the pre-verified changes step by step and runs the build. Kiro must not redesign anything.

Goal for the ten minutes a visitor spends: walk the moonlit graveyard, hit lore surprises everywhere (black cat omen → lightning → witch swoop), and raise 4–5 graves that open something genuinely playable. Meta judging: Impact 30, Meta tooling 25, Tech 20, Demo 25.

## Constraints
- Only permissive OSS (MIT/BSD/Apache/CC0) with its LICENSE kept in the game folder + CREDITS.md row. No ROMs, no ripped sprites, no Nullsoft/Microsoft/Konami art. Product names on graves are factual references (README trademark disclaimer already exists).
- Games run inside the existing GraveOverlay as a sandboxed same-site iframe: `sandbox="allow-scripts allow-same-origin allow-pointer-lock"` (same-origin is needed for module imports/localStorage of static games we host ourselves; nothing secret lives on the origin's storage besides the Clicky token which is httpOnly? → CHECK, see Risks).
- Phaser keyboard must not steal keys while an iframe game has focus: overlay already pauses GraveyardWorld; iframe gets focus on open; Esc must still exit (postMessage bridge or parent keydown when iframe blurred + visible "Rest in peace" button).
- Kiro budget: each Kiro session = one Kxx step below, prompt says "apply exactly, do not refactor, run npm run build, stop".

## Steps
### K1 — Easter eggs finished (code written + compiled by Hark in a worktree)
- Replace src/easter/EasterEggManager.ts with research/n3/EasterEggManager.ts (plain class, world.time timers, UIScene events, hints, colliders for crypt/well, black-cat omen = lightning double-flash + shake + rumble + crow caw + witch summoned).
- GraveyardWorld: `public wizard`, construct with treeColliders, `eggManager.update(delta)` when no ritual, `tryInteract()` no-arg, `summonWitch()` public.
- UIScene: egg hint text, lore-card timers via this.time, onEggFound(id, found, total), counter restored on load, hide card/hint on ritualStarted.
- main.ts: `__RD.eggs(reset?)` debug hook.
- CREDITS rows for egg art/sfx (listed in research/p15-brief.md).
### K2 — Game graves (iframe host + 3 games)
- `public/games/<slug>/` vendored at a pinned commit, LICENSE kept:
  - `space-cadet` ← richdubbs/star-cadet (MIT, three.js vendored locally instead of jsDelivr).
  - `pipes` ← 1j01/pipes (MIT, Windows 3D Pipes screensaver).
  - `run-and-gun` ← IroncladDev/salvadoran-reclamation single-file build (MIT) for the Contra slot.
- graves.json: new resurrectable entries `space-cadet-pinball` (1995–2007, removed from Windows Vista), `3d-pipes` (1995–2009 screensaver retired with Windows 7? → verify), `contra` (tribute slot, label "an open-source run-and-gun stands in"). Field `game: "games/<slug>/index.html"`.
- mapLayout: place the three new stones on the plaza ring (coordinates checked for tree/egg/path overlap).
- GraveOverlay: if `grave.game` → render full-size iframe (16:9, fit viewport), "Rest in peace" button, Esc handler on parent + postMessage from iframe not possible for 3rd-party code → keep button + parent window keydown after iframe blur; credits line under the frame.
- Medals: reuse medal_unmarked tint until art exists; incant_generic voice.
### K3 — (if time ≥ 3 h left) Unmarked Grave: Muse Spark writes a tiny playable HTML toy for any dead app the player names; served via existing Pages Function quota layer (separate counter, 2 per IP lifetime, 100/day), rendered in `sandbox="allow-scripts"` iframe via srcdoc (NO same-origin). Biggest Meta-tooling win.
### K4 — Polish (only after K1–K2 deployed)
- Verify walking all over the map, contact shadows on every prop, nothing floating; fix only what screenshots show.
### Ship (Hark, no Kiro)
- Build, deploy (documented direct-upload method), headless smoke test, README/CREDITS, secret scan, 3-min video from headless capture + Jay's recording if he wakes at 4 AM, Cerebral Valley form (session `cerebralvalley`), submit by 05:30 IST.

## Risks to review
1. iframe allow-same-origin for vendored games: can a hosted game read Clicky's signed token (localStorage?) or call /api/clicky with it? If the token is in localStorage, a malicious vendored game could burn quota → acceptable? Prefer games on a separate path with their own CSP; Unmarked Grave (AI HTML) must NEVER get allow-same-origin.
2. CSP in public/_headers may block iframe (frame-src 'self'), three.js modules, WebGL, inline scripts in vendored games → per-path _headers rule for /games/*.
3. Keyboard focus between Phaser and iframe; mobile touch for games (pinball needs keys → show on-screen notice "best on keyboard").
4. Egg positions vs. new stones/trees/paths; area trigger for cat fires only if wizard walks there — is (420,900) on a path people walk?
5. Kiro credit burn: keep each prompt tiny, reference files rather than paste.
