# Raise Dead — Second Test Pass (preview 7124766c)
Date: 2026-11-03 ~22:30 IST
URL: https://7124766c.raise-dead.pages.dev/

## Entry
- Splash/title screen renders correctly: "RAISE DEAD – Graveyard of Lost Apps", moon, wizard at cracked tombstone on cyan circle.
- First click registered: prompt changed to "Click again · or press Enter/Space".
- Second entry via Enter succeeded: transitioned to graveyard overworld with wizard at center crossroads, Credits (top-left) and speaker icon (top-right) visible.
- Entry step (1) WORKS.

## Movement / Walking — BLOCKED
- After entering, held ArrowDown once (short), then press_and_hold ArrowDown on canvas center for 1.5s and 2.0s, and held 's' for 2.0s: wizard never moved.
- Canvas is a full-bleed single <canvas> (960,720 center). Clicking the canvas and pressing keys with focus on it produced no movement.
- Clicking a grave icon at ~(690, 983) produced no reaction.
- Multiple consecutive screenshots show identical landmark coordinates across all frames (leaves, wisps, icons, pumpkins). The game loop appears frozen/stuck at 0 fps once in the overworld — no animation progression visible.
- Note: on the TITLE screen, the first click DID produce a visible prompt change, so mouse input on the canvas works pre-entry. Post-entry input (click or keyboard) does not.

## Credits Panel (checklist item 3) — WORKS
- Credits opens (top-left click at ~(57,208) opened it reliably).
- Text IS visible and readable: "CREDITS" title, sections for Fonts / Code & Libraries / Images, ← Back link bottom-left.
- Fix (credits blank panel) appears applied: content renders, no longer blank.
- Observed cosmetic issues (polish):
  - Tables render as run-on plain text (no column separators/formatting).
  - Two attribution lines (Wizard sprite by Movicx; Footstep sounds by congusbongus) appear above the first section heading instead of under a section.
  - Content is clipped at bottom around y≈1120; more content exists below (scrollable).## Zombies / Unmarked Grave / Raising graves — ALL BLOCKED
- Cannot reach any of these because walking and grave-clicking are both unresponsive.
- Zombie hand (south-middle), Unmarked Grave chip (Snake), raising 3 distinct graves (Clicky / Space Cadet / 3D Pipes), the "Press F" hint, and the ritual overlay were never observable.
- Same movement step failed twice across two fresh page loads (plus an in-session reload); stopped retrying per instructions.

## Root-cause hypothesis
- The symptom is identical to the pre-fix bug K5 was written to address: software-WebGL renderer freezes the game at 0 fps.
- Evidence:
  1. Mouse events DO reach the game post-entry (speaker toggle and Credits both respond).
  2. Keyboard (keydown) never moves the player.
  3. Game-loop particles (leaves, wisps, floating badges) are frozen at identical coordinates across every consecutive capture.
  4. The TITLE screen IS responsive to mouse (first click changed the prompt), so input works pre-entry.
  5. The freeze only manifests after entering the overworld.
- Conclusion: the auto-Canvas-fallback / fps-watchdog that was supposed to handle no-GPU browsers is not kicking in after entry on this agent's browser (no GPU). The overworld scene is rendering but the input/game-update loop is stuck at 0 fps. This is NOT an input focus problem — it's a renderer/frame-rate freeze that only the title screen avoids.

## Issue list (numbered, by severity)

### Issue 1 — Overworld freezes at 0 fps after entry; movement and interaction dead (BLOCKER)
- **Severity:** Blocker
- **What:** Once past the title screen into the graveyard overworld, the player cannot move and no object can be interacted with. The game loop appears stuck at 0 fps: particle leaves, wisps and floating badges stay at identical coordinates across frames.
- **Steps to reproduce:**
  1. Open https://7124766c.raise-dead.pages.dev/ in a no-GPU browser (or any browser where it falls back to the software path).
  2. Click once, then click again or press Enter to enter the graveyard.
  3. Hold W/A/S/D or ArrowDown (~1–2 s) without moving anything else.
  4. Observe: wizard never moves. Capture the scene twice 1 s apart — leaf particles, wisps and orb badges are at identical coordinates (no animation).
  5. Try clicking a grave icon/badge (e.g. ~(690, 965)) — no reaction.
- **Expected:** Wizard walks; particles animate; approaching a tombstone shows "Press F".
- **Actual:** Wizard locked in place, scene static, no "Press F" ever appears.
- **Diagnostic notes that rule out input focus:**
  - Mouse clicks DO register post-entry: the top-right speaker icon toggles mute/unmute and top-left Credits opens.
  - Title-screen mouse works (first click changed the prompt text).
  - Focus on the canvas element directly (it's the only DOM node, `<canvas>` at 960,720) and pressing/holding ArrowDown/s still produces no movement.
- **Impact:** Blocks checklist items (2) raise 3 graves, (4) zombie hand, (5) Unmarked Grave. Effectively the entire gameplay is unreachable in a no-GPU browser — the main fix target (Canvas fallback + fps watchdog) is not surfacing.

### Issue 2 — Credits panel opens and text is visible, but tables render as unformatted run-on text (POLISH)
- **Severity:** Polish (visibility fix IS applied)
- **What:** The Credits panel is no longer blank — text, sections and "← Back" link all render. However, the tabular content (Fonts, Code & Libraries, Images) renders as continuous plain text with no column separators, so table rows are hard to read.
- **Steps to reproduce:**
  1. Enter the game, open Credits (top-left, ~(57, 208)).
  2. Scroll to Fonts / Code & Libraries / Images sections.
  3. Observe: rows render as a single line of text instead of aligned columns.
- **Expected:** Tables render with visible columns/borders or at least delimiters so Font/Library/Asset rows are scannable.
- **Actual:** Flattened run-on text; still legible but unformatted.
- **Verdict on checklist (3):** Credits text IS visible — the blank-credits fix worked.

### Issue 3 — Two attribution lines (Wizard sprite, Footstep sounds) appear above the Credits section heading (MINOR)
- **Severity:** Minor
- **What:** Two asset-attribution lines (Movicx wizard sprite and congusbongus/swuing footstep sounds) are rendered at the very top of the credits body, ABOVE the "Credits" heading / first section, instead of under a section like "Sprite" or "Audio".
- **Steps to reproduce:**
  1. Open Credits.
  2. Observe the two attribution lines sit above the first section heading ("Fonts"), before any section organizes them.
- **Expected:** Each attribution appears under its relevant section or a top "Special thanks / Assets" section.
- **Actual:** They float above the section structure.

### Issue 4 — Credits content clipped at bottom of panel (~y 1120 on 1920×1440); more content exists below (POLISH)
- **Severity:** Polish
- **What:** The Credits body is clipped around y≈1120; the Images section rows trail off. The panel appears scrollable but the bottom content is not fully visible in the default viewport.
- **Steps to reproduce:** Open Credits and observe the Images section cutting off mid-row.
- **Note:** Arrow keys may scroll this panel (when it's open), which is why the earlier ArrowDown during credits didn't walk the wizard. Not a blocker, but worth verifying scroll reachability.

### Issue 5 — All remaining gameplay checklist items untestable because of Issue 1 (BLOCKER-level impact, reported as a consequence)
- **Severity:** Blocker (consequence)
- **Untested items:**
  - (2) Raise 3 different graves incl. Clicky (with one preset question), Space Cadet or 3D Pipes — never reached a "Press F" hint, ritual or overlay.
  - (2) Verify keys still work after each Esc-close — ritual never triggered, so post-ritual key recovery cannot be assessed.
  - (4) Zombie hand south-middle: find, press F, spam F/Space until "The graveyard rests" + lore card — cannot reach or interact with anything.
  - (5) Unmarked Grave: click pre-made chip (Snake) and play a few seconds — grave clicks unresponsive.
- **Impact:** A no-GPU browser (the environment the fix was written for) cannot play any of the game.

## What worked
- Splash/title screen renders fully (title, wizard, cracked tombstone, magic circle, particles).
- Title-screen mouse input works (first click visibly changes the prompt).
- Entering the game works: second click/Enter transitions to the graveyard overworld with wizard centered at the crossroads, Credits and speaker icons present.
- Post-entry mouse overlay controls work: speaker icon toggles mute/unmute; Credits opens.
- Credits panel is no longer blank — text IS visible (the credits-blank fix applied).

## One-line overall impression
Title screen and entry work and the credits-blank fix is real, but the no-GPU Canvas-fallback / fps-watchdog fix did not land: once inside the overworld the game loop freezes at 0 fps in this browser, locking the player in place and blocking every gameplay feature (walking, raising graves, zombie hand, Unmarked Grave) — the build is not playable in a no-GPU environment.