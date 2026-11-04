# Night 4 plan (draft v1 by Hark) — from Jay's play-test notes, 2026-11-04 07:26 IST

Deadline: submit by Nov 4 22:00 IST (hard close Nov 5 07:30 IST). Kiro budget ~14 credits: Kiro only applies council-written patches.
Rules: no copyrighted game files/ROMs (EA/Microsoft) — hackathon waiver IP clause. No Harry Potter spell names, no PvZ audio. All new assets CC0 / CC-BY (credited) / original.

## P0 — Bugs (must)
B1. **Zombie hand re-raises Road Rash.** Root cause (Hark): `GraveyardWorld.ts:~152` resets `lastProxGraveId = null` after a ritual but leaves `activeGrave` set, so when the wizard walks away `checkProximity()` sees null→null and never clears `activeGrave`; F at the hand hits `interact()` Priority 1 and re-raises the last grave (ritual moves camera/wizard back to it). Fix: clear `activeGrave` there too AND make `interact()` call `checkProximity()` first, and only raise if the wizard is really within PROX_DIST of that grave; eggs within their radius win when closer than the grave.
B2. **Black cat omen and witch fly-by overlap** (witch vanishes mid-flight when the cat starts, then a new witch appears). Add a single `AmbientEventDirector` (or flags in GraveyardWorld): one ambient event at a time (witch, cat omen, zombie wave, ritual block all), min 40 s gap, randomized 45–120 s timers, omen waits until any witch has left the screen; the omen's own witch reuses the director.

## P1 — Zombie wave rework (Jay: "they auto-target; make it a real raid")
Z1. Start: screen darkens + red vignette pulse, horde scream SFX (L4D-style roar/screams, CC0), music swaps to a tense loop (existing chant drone or new CC0), banner "THE HORDE RISES".
Z2. Spawns from **3 spawn points** around the hand area (e.g. two graves + the treeline), staggered, 3 waves: 6 / 8 / 10 zombies, speed ramps.
Z3. **Aim to kill:** left-click OR right-click on a zombie fires a bolt from the staff at that point (canvas `contextmenu` preventDefault while the wave is active / in the world scene). F/Space fire at the nearest zombie in a short cone only (≤140 px) — no map-wide auto-target. Each zombie 2 hits (1 if bolt crits). Hit flash, knockback, death puff.
Z4. Threat: zombie touching wizard = lose 1 of 3 souls (hearts HUD top-centre), knockback + i-frames 1 s. 0 souls → "The dead overwhelm you…" + retry button; wave resets.
Z5. Reward: clear all → "The graveyard rests", lore card, medal **Zombie Slayer** (+ secret counted), wizard staff glow turns green permanently (localStorage), time shown.
Z6. Touch: tap a zombie to fire; F button fires nearest.

## P1 — Lightning on black cat omen
L1. 1–2 strikes land **60–110 px beside the player** (never on them): 300 ms pre-flash white screen, jagged bolt (procedural Graphics, 3 branches), spark particles, camera shake, scorch-mark decal (fades over 25 s), thunder crack + rumble (2 variants, CC0), wizard flinch (tiny hop + "!" pop).

## P1 — Map + discovery + sprint
M1. **Minimap** bottom-right (180×120, toggle with N), shows wizard dot, paths silhouette, raised graves as teal dots, unraised resurrectable graves as dim dots.
M2. **Full map** (Map button next to Credits, key `Tab` or `J`): all areas named (Crypt, Well, Moon Hill, Pumpkin Patch, Zombie Field…), graves discovered (raised) vs not, Easter eggs found shown with icon, unfound shown as "?" only in their region (no exact spot), counters "Graves raised 4/9 · Secrets 3/7". Esc/close.
M3. Persistence: raised-grave ids in localStorage `rd_raised`.
M4. **Shift = sprint** 1.65× speed, faster footstep cadence + dust puffs; joystick full tilt on touch = sprint.

## P2 — Bouncing Logo → **cube**
C1. Replace the RIP ellipse with a square **Spooky Cube** (equal width/height bounding box so corners line up exactly): pseudo-3D crate face with jack-o'-lantern carving, colour changes per wall hit, corner hit = bat burst + "CORNER!" + counter + chime. Keep Space fast-forward, C cheat.

## P2 — Unmarked Grave quality + safety
U1. **Input moderation** (server): normalise name; reject slurs/sexual/violent/hate terms via blocklist; reject >40 chars / URLs / prompts ("ignore previous"); Muse is asked to answer `REFUSE` for anything not a real product/app/game/service name. Friendly refusal text, no raise spent.
U2. **Output QA** (server, before caching): static lint — must contain a canvas or game root, a game loop, a restart path, `resize` handling, size < 60 KB, no network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, external `src=`); if lint fails → one repair call to Muse with the lint errors; still failing → not cached, user not charged.
U3. **Playability spec in the prompt**: fills the iframe (uses `innerWidth/innerHeight`, re-layout on resize), 2-second grace period before any hazard/gravity, first 15 s easy, physics tuned per genre (e.g. flappy: gentle gravity, capped fall speed, flap impulse small, gap ≥ 32% of height), visible instructions, score + best, R/tap restarts, must be beatable for ≥ 2 rounds.
U4. Client smoke test: injected tiny shim posts `rd-error` on `window.onerror` in the first 5 s → overlay offers "Re-raise (free)" which regenerates with the error text.
U5. Bump cache version → regenerate the pre-seeded chips (Flappy Bird, Snake, Contra, Club Penguin, Vine, Google Lively, Road Rash, Winamp) with the new prompt + lint.

## P2 — ELIZA grave (hybrid)
E1. New resurrectable grave **ELIZA (1966–)** with portrait. Terminal-style green-on-black chat overlay.
E2. Classic ELIZA engine in TS (original-style keyword/decomposition/reassembly rules, our own spooky DOCTOR script: ~40 keywords, memory stack, pronoun reflection). Free, unlimited.
E3. Muse (contributor model) only when ELIZA falls back to a generic reply twice in a row OR the input is long/novel: Muse gets ELIZA persona + last 6 turns, must answer ≤ 2 sentences in ELIZA style ending with a question. Caps: 6 Muse turns per session, shares Clicky's per-IP/day limits; moderation as U1. UI marks nothing (seamless), README explains the hybrid.

## P3 — Winamp → rhythm game
W1. Replace the Winamp tribute with a hand-built **"Winamp: Danse Macabre"** rhythm game (`public/games/rhythm/`): 4 lanes (D F J K / arrows / tap), notes fall to a hit line, combo + accuracy, skeleton notes you must NOT hit (hit = lose a life), Winamp-skin styling + visualiser bars.
W2. Music: Kevin MacLeod "Danse Macabre" (Saint-Saëns; incompetech, CC BY 4.0, credited) or another PD/CC Halloween classic (Grieg "Hall of the Mountain King", Bach "Toccata & Fugue", Gounod "Funeral March of a Marionette"). Beatmap generated offline (onset detection → quantised lanes JSON), 90–120 s cut.

## P3 — Space Cadet polish
P1. Bundle local CC0/original sounds (flipper, bumper, launch, drain); fixed default camera that shows both flippers, disable free zoom/orbit (or reset key), on-screen controls card (Z / M flippers, Space plunger, tap left/right half on touch).

## Verification
After Kiro applies: headless screenshots of each feature (Hark), then two browser tester agents with checklists, council triage, Kiro fix, prod deploy.
