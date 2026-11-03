# Raise Dead — QA Findings
URL: https://048b716f.raise-dead.pages.dev/
Tester: Jay (acting as picky judge, no audio)

## First 60 seconds
- Title screen renders on a canvas; no DOM interactive elements detected.
- Title: "RAISE DEAD" with subtitle "Graveyard of Lost Apps" over a full moon.
- Scene: graveyard, rows of tombstones, jack-o'-lanterns, bare trees with crows, green ghost wisps.
- A wizard stands before a cracked glowing tombstone on a cyan magic circle (center).
- Faint "Summoning… 0%" text above the central tombstone — appears to be a loading/progress indicator. Did NOT advance from 0% during first observation.
- Main prompt: "Click to enter the graveyard · or Press Enter/Space"
- "Credits" link faint below the prompt.
- No typos visible on title screen.
- Loading indicator stuck at 0% is the only concern so far.
## Issue: Title screen "Summoning" progress stuck at 0% on first load
- First load: "Summoning… 0%" never advanced over ~20 seconds.
- Pressing Enter / Space / clicking the prompt / clicking scene center did NOT advance into the game while loading was at 0%.
- After a hard reload (ignore cache), the "Summoning…" indicator jumped to 89% and shortly after the screen advanced to the graveyard. The first-load click prompt alternated between "Click to enter · or Press Enter/Space" and "Press Enter to enter the graveyard."
- Severity: **Major** — a judge arriving for the first time will see a frozen 0% and try the prompt; if assets haven't loaded, nothing happens. Either hide the prompt until loading finishes or make it work immediately.
## Issue: Credits opens but body is a blank white panel
- Opening Credits (canvas text at top-left, ~55,210) switches to a screen headed "CREDITS".
- The body area (~30,255 to ~1890,1125) is a large solid white panel with NO text/content rendered.
- Heading "CREDITS" (centered, top) is readable in light serif all-caps.
- A "← Back" link at the bottom-left (~92,1207) is the only close control — dim gray on navy, low contrast but legible. No Close (X) button, no keyboard Esc observed.
- No scrollbar or scroll affordance.
- Severity: **Blocker** for the Credits checklist item — the Credits cannot be read. Either content failed to load or the panel is sized/wrong-colored so white-on-white text is invisible.
## Issue: No keyboard or mouse controls work in the graveyard (Blocker)
- After entering the graveyard, the wizard stays frozen at the central crossroads (~960,620) behind the central tree.
- Attempted inputs, NONE of which moved the wizard or triggered any interaction:
  - Pressing "d" / ArrowRight via key_press (multiple times)
  - type_text with repeated "d" characters (once to bare focused canvas, once to the canvas element — both rejected or had no effect)
  - Clicking the three floating icon badges above the tombstones at ~(87,965), ~(836,950), ~(1196,980)
  - Clicking the tombstones themselves (~836,1060)
  - Clicking the scene at multiple locations to establish canvas focus, then keypressing
  - press_and_hold on Right arrow for 2000 ms
  - triple_click to focus
- The ONLY canvas click that produced a navigation was the Credits text at ~(57,208), which opened the (blank) Credits overlay. All other canvas clicks do nothing.
- No on-screen joystick, no tap-to-move indicator, no "F to interact" prompt appears when (supposedly) near a tombstone.
- Consequence: the reviewer cannot walk up to Clicky, cannot read plaques by walking, cannot raise any grave, and cannot use the Unmarked Grave.
- Severity: **Blocker** — the core gameplay loop is unreachable in this build.
## Additional evidence: sound toggle click DOES register
- Clicking the speaker icon at ~(1880,214) flipped the mute state (icon went from no red-slash to red-slash and back). 
- This proves the canvas click handler is alive and processes SOME coordinates, so the problem isn't "the canvas ignores all clicks."
- Credits click also registered (opened Credits overlay). 
- All other clicks (3 badge icons at ~87/965, ~836/950, ~1196/980; the tombstones themselves; empty grass/jack-o'-lanterns; scene center) do nothing.
- Keyboard (d, ArrowRight, Space, Enter, Tab, press-and-hold) produces no movement or interaction. The wizard never leaves its spawn at ~(960,620).

## Inference (for the dev, not asserted as fact)
- The graveyard scene's click hit-test only covers Credits + sound-toggle. Tombstone/badge hit areas either aren't registered or are tiny.
- Keyboard listeners for WASD/arrows/F/E are either not attached, attached to the wrong target, or shadowed (e.g., a top-level keydown is consumed and never reaches the player controller).
- Since the title screen DID accept Enter/Space after assets loaded, the input system works in one scene but not the next — likely a per-scene binding that fails in this build.
## Edge case: Browser zoom 150%
- Triggered browser zoom-in (Ctrl+=) once.
- Evidence zoom engaged: the "Credits" label x-coordinate shifted from ~57 to ~18 at the same y (~208), indicating the page CSS width shrank (~1/1.5×). The scene still renders in full.
- The canvas self-refit kept the game visible; no crash, no obvious overlap of UI elements at 150%.
- Could not verify the exact zoom factor visually (canvas rescales) or confirm 67% (zoom-out key not available via press_key; the only combo supported is single-character modifiers). The canvas-based layout inherently handles width reflow but letterbox bars may change, and any DOM overlay (e.g. Credits body) is not verifiable here because its content is blank.
## Edge case: Press Esc repeatedly
- Pressed Escape 3 times in quick succession in the graveyard.
- Result: no crash, no overlay change, no flicker, no weird state. The scene is stable and tolerant of spammed Esc.
- Caveat: because no keyboard-driven interaction is live, we cannot observe Esc closing a dialogue it should close; this is a negative pass rather than a positive verification.

## Edge case: Open two overlays in a row fast
- Could not meaningfully test double-opening because the only openable overlay is Credits, and the second attempt is identical (Credits already closed via Back). Tombstone overlays cannot be opened at all, so a fast double-open is not testable.

## Edge case: 67% zoom
- Cannot test: the only zoom combo available via press_key is Ctrl+= (zoom in) and Ctrl+0 (reset). There is no supported minus/zoom-out combo, so 67% zoom is untestable in this agent.

## Edge case: Leave tab idle 2 minutes then return
- Not tested. The wizard never moves, so there is no "resume from idle" gameplay state to validate, and the visible scene is a static idle already (animated wisps/pumpkin glows, but no pause/resume logic observable). Marked as untested.
## Edge case: Fast double-overlay
- Clicked Credits twice in rapid succession (one via canvas element 72-1, the follow-up click on next turn).
- Result: only one Credits instance rendered — single "CREDITS" heading, single white panel, single "← Back". No duplicate overlay, no stack glitch.
- Verdict: passes (but the Credits body is still blank).

## Visual polish — additional observations
- **Player spawn occlusion (polish/minor):** The wizard spawns at ~(960,620) directly behind the central twisted tree's canopy and is almost entirely obscured. A judge's first seconds in the graveyard don't clearly show "you are this little grey figure" — there's no ring, no bob indicator, no minimap, and no camera nudge. The wizard's hat/staff peek through, but it's easy to miss or mistake for decoration.
- **No in-world "F/E/Enter to interact" prompt** ever appears in view. For a game whose control is "F near a tombstone to raise," the absence of a context prompt means the control is inferred only from the task brief — not discoverable in the game itself. (Also, tombstone proximity interactions are unreachable in this build.)
- **Badge icons are small and low-contrast** against dark branches; the middle badge (~837,950) sits over dense tree foliage and is easy to overlook.
- **Font consistency:** The pixel scene is crisp, but the top-right speaker icon appears anti-aliased / smooth, inconsistent with the pixel art.
- **Blocky path–grass transitions:** hard rectangular tile edges (no transition tiles), visible along y≈545 and x≈1410.
- **Letterboxing is clean** but the game area edges clip tree tops and grave dirt without fade/fovea, which is fine at 16:9 in a 4:3 viewport but noticeable.

## Unverified / could not test
- **Idle 2 minutes then return:** not tested (no gameplay state to resume from).
- **67% zoom:** the supported key combos do not expose a zoom-out; inconclusive (scene visually self-refit; Credits x remained pinned).
- **Jittery camera / pop-in / streaming reply:** not observable because the wizard never moved and no dialogue could be opened.