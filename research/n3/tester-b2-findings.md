# Raise Dead — Third test pass findings
URL: https://3b99dd84.raise-dead.pages.dev/

## What worked
- **Title screen renders** (pixel-art graveyard, wizard on magic circle, full moon).
- **Entry flow works** on the second attempt: click once → prompt changes to "Click again · or press Enter/Space" → second click (or Enter) enters the graveyard. The wizard appears on the central cobblestone crossroads.
- **Credits (top-left) is visible and clickable**: opening the Credits overlay shows the large "CREDITS" heading, the "Credits" sub-heading, and full attribution text including the Clicky preset dialogue (CC0 1.0), Phaser 3.90.0, phaser3-rex-plugins 1.80.20, Cinzel/Pixelify Sans variable fonts, wizard sprite and footstep sounds. "← Back" link at bottom-left returns to the graveyard.
- **Graveyard scene**: three tombstones with circular icon badges (lower-left, lower-mid-right, lower-right), plus two plain tombstones at the top edge. Witch on broom visible. Ambient scene renders.

## Numbered issues

### 1. CRITICAL — Keyboard movement does not control the wizard
- **Severity:** Critical (blocks the entire game)
- **Steps:** Enter the graveyard (second click). Attempt to walk the wizard with any of: ArrowDown, 'w'/'s' (lowercase WASD), 'W' (uppercase), Space (key press), press-and-hold on the canvas. Result: the wizard remains motionless at the central crossroads (~x=950, y=660). Across ~8 separate attempts spanning multiple turns, the character never moved even one pixel.
- **Note:** The Credits link at top-left is the only canvas click that surfaced a `<canvas>` DOM element ([30-1]); every other canvas click returned an empty interactive list. This strongly suggests the canvas never receives keyboard focus and/or Phaser's keyboard input is not being registered. Without movement, every gameplay step is blocked.

### 2. CRITICAL — No "Press F" hint ever appears; graves cannot be raised
- **Severity:** Critical (depends on #1)
- **Steps:** Task asks to walk up to a tombstone until a "Press F" hint shows, press F, wait for the ritual overlay, then Esc. Because the wizard cannot be moved (#1), no tombstone can be approached and no F-hint is ever shown. Direct clicks on the circular badge icons above the three badged tombstones (~690,955; ~1440,940; ~1800,967) also produced no interaction.
- **Blocked sub-items:** Raising 2–3 graves, raising Clicky the paperclip / picking a preset question, verifying keys still work after Esc.

### 3. HIGH — Zombie hand / lore-card sequence cannot be reached
- **Severity:** High (depends on #1)
- **Steps:** The task asks for a "zombie hand in the south-middle of the map" — press F, keep pressing F/Space until "The graveyard rests" + lore card. No zombie hand is visible from the spawn point, and movement is broken, so the south-middle of the map cannot be reached and the interaction cannot be tested.

### 4. HIGH — Unmarked Grave / Snake chip cannot be tested
- **Severity:** High (depends on #1)
- **Steps:** Task asks to locate an "Unmarked Grave" and click a pre-made chip like "Snake". No unmarked-grave chip UI or Snake chip is visible from spawn, and cannot be reached due to broken movement.

### 5. MINOR — Loading progress indicator stalled at 77% on first run
- **Severity:** Minor / first-run only
- **Steps:** First load showed "Summoning… 18%" progressing to "Summoning… 77%", then the counter froze at 77% while the "Click to enter" / "Click again" prompt remained. Clicks and Enter/Space did not enter while stuck. A hard reload (ignore cache) recovered: the second load showed the title screen without a summoning counter and entry succeeded on the second click.
- **Note:** Task said a self-reload is expected on slow-render GPUs; this was a frozen progress text that only recovered via a manual reload.

## One-line overall impression
The graveyard renders and entry/Credits work, but keyboard movement is completely broken on this browser (no GPU), which blocks the entire gameplay loop — graves, the zombie-hand lore, and the Unmarked Grave/Snake chip can't be reached or triggered.