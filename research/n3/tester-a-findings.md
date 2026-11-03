## Raise Dead QA Findings
URL: https://048b716f.raise-dead.pages.dev/
Tested: 2026-11-03

### 1. Title Screen
- Loads the title screen (RAISE DEAD "Graveyard of Lost Apps") with moon, tombstones, wizard at cracked tombstone.
- "Summoning... 0%" indicator visible above cracked tombstone on initial load — appears to be a loading indicator stuck at 0%. Disappeared after reload.
- Prompt alternates: "Click to enter the graveyard · or Press Enter/Space" AND "Press Enter to enter the graveyard". Inconsistent wording across reloads.
- **Enter/Space keys do NOT advance the screen** — pressed Enter and Space multiple times (with and without prior canvas click), nothing happened.
- Clicking the prompt text coordinates (960, 1082) did not advance.
- **Worked around by clicking in upper-left game area (500, 600)** — this unexpectedly transitioned into the graveyard proper. So "click anywhere to enter" is partially true but click targets matter.
- Credits link visible but not tested yet.

### ISSUES FOUND SO FAR
**Issue 1 [blocker]: Title screen keyboard input non-functional**
- Steps: On title screen, press Enter, then Space.
- Observed: No reaction. Prompt stays visible. Wizard doesn't advance.
- Expected: "Press Enter to enter the graveyard" should work.

**Issue 2 [major]: Prompt text is inconsistent**
- Steps: Reload title screen.
- Observed: Sometimes reads "Click to enter... or Press Enter/Space"; after reload reads "Press Enter to enter the graveyard" (no Click/Space).
- Expected: Consistent single prompt.

**Issue 3 [minor]: "Summoning... 0%" indicator**
- Observed on initial load above the cracked tombstone. Appears stuck at 0%. After reload, disappeared.
- If this is a loading indicator, it's broken. If it's flavor text, it's misleading.

**Issue 4 [major]: Click-to-enter is unreliable**
- Steps: Click the visible prompt text at (960, 1082).
- Observed: No reaction.
- Worked around by clicking (500, 600), which transitioned into the graveyard.
- Expected: Click anywhere in the scene to enter, as prompt suggests.
---

## CRITICAL FINDING: Game is effectively unplayable from this browser

### Root problem: Keyboard input + tombstone interactions do not register
After successfully clicking into the graveyard (one non-reproducible click at 500,600 past the title screen), the following ALL FAILED:

**Keyboard (all non-functional inside the graveyard):**
- WASD: w, a, s, d — wizard never moved from center crossroads (~955, 650)
- Arrow keys: ArrowUp, ArrowDown — no movement
- F — no interaction prompt or effect
- Enter, Space — no reaction (and didn't enter from title screen either)
- Escape — no reaction
- Tried pressing keys both with and without a prior canvas click to give focus

**Mouse (very limited response inside the graveyard):**
- Click at wizard position (960, 720): no focus effect
- Click at upper game area (500, 600): entered graveyard ONCE only; did not reproduce on reload
- Click directly on bottom tombstone badges (690, 960; 690, 1000; etc): no reaction
- Click on tombstones themselves (690, 1080): no reaction
- Double-click on canvas: no reaction
- Click on blank letterbox: no reaction
- Click on Credits (57, 208) top-left: **worked** — opened a Credits screen
- Click on Sound toggle (1880, 213) top-right: **worked** — muted audio (speaker got red slash)
- Credits "← Back" button (91, 1207): **worked** — returned to graveyard

### Credits screen secondary issue
- The Credits page shows a heading "CREDITS" and a "← Back" link, but the central content area is a **large blank white rectangle** (x≈30–1890, y≈255–1125) with **no text content** — credits text never rendered/loaded. This is itself a bug.

### What this means for the checklist
- **Step 1 (Title screen)**: Partially testable. Found issues (listed).
- **Steps 2–9 (everything else)**: **BLOCKED** — cannot walk, cannot raise graves, cannot reach Space Cadet / 3D Pipes / Bouncing Logo / zombie hand / Unmarked Grave / secrets, and cannot perform any stress test (no ritual to interrupt because no ritual can be triggered).

### Likely cause (for the developer)
The canvas likely has a `mousedown`/`click` handler that handles only a small set of UI zones (Credits rect, sound icon rect) and the title-screen entry click, plus a `keydown` handler for WASD/arrows/F/Enter/Escape — but the `keydown` handler is not firing in this environment. Common culprits:
- The game calls `e.preventDefault()` on a `keydown` only if `e.target === canvas`, but focus is never on the canvas. Clicks in most of the game area don't focus the canvas (only the Credits rect's hit-test succeeds).
- The game is listening for `keyboard` events on `document` but the handler is gated by a state flag that the title-screen entry was supposed to set; in my one successful entry the flag may not have been set either.
- The click-at-(500,600)-to-enter worked once then stopped — possibly the entry click is tied to an offscreen element whose position shifts with each load, or it's a one-shot "first click anywhere" handler that isn't re-armed after reload.
- The "Summoning... 0%" stuck on initial load suggests an asset-load that never completed, which could also be why input handlers never attach.

### Tested inputs and outcomes (summary table)
| Input | Where pressed | Result |
|---|---|---|
| Enter (title screen) | keyboard, no prior click | Nothing |
| Enter (title screen) | keyboard, after click 960,700 | Nothing |
| Space (title screen) | keyboard | Nothing |
| Click 960,1082 (prompt text) | mouse | Nothing |
| Click 500,600 (upper game) | mouse | Entered graveyard **one time** |
| Click 500,600 (reload) | mouse | Nothing |
| WASD + arrows (graveyard) | keyboard | Wizard stayed at ~955,650 |
| F (graveyard) | keyboard | Nothing |
| Escape (graveyard) | keyboard | Nothing |
| Click wizard 960,720 | mouse | Nothing |
| Click badge 690,960 | mouse | Nothing |
| Click tombstone 690,1080 | mouse | Nothing |
| Double-click 960,720 | mouse | Nothing |
| Click Credits 57,208 | mouse | Opened Credits screen |
| Click Sound 1880,213 | mouse | Muted (red slash appeared) |
| Click Back 91,1207 | mouse | Returned to graveyard |

### Confidence
**High.** Keyboard and interaction-zone input are broken across multiple reloads and multiple attempted focus methods. Only the Credits and Sound UI zones respond. The one successful entry-click did not reproduce.