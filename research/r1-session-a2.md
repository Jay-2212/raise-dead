# Review round 1 — Kiro Session A2 (fixes found while verifying Session A)

Session A changes are in the working tree and build passes. Headless screenshots (research/screens/r1/) show these remaining problems. Fix only these, then run `npm run build` until it passes.

1. **Plaque text still spills out of the frame (P1-6 not done).** `UIScene.createPlaque()`: the "Cause of death" line renders below the dark inner panel, over the bottom stone border, and the epitaph line starts under the medallion (overlapping it). Fix:
   - Lay out vertically: row 1 = medallion (56px) on the left with name + years to its right; epitaph starts BELOW the medallion row (contentY + 66), full content width; cause text goes directly below the epitaph using `epitaphText.y + epitaphText.height + 8`.
   - In `updatePlaque()`, after setting texts, recompute positions and resize the NineSlice height to fit the content: `panel.setSize(PANEL_W, causeText.y + causeText.height + 64)` (64 = bottom border + padding); minimum 200. When the medallion is hidden, name/years move to contentX and the epitaph moves up to contentY + 52.
   - Widen PANEL_W to 500 so text wraps less. All text must sit fully inside the dark inner area of the frame (inner area starts ~60px from the top edge, ~64px from the sides, ~60px from the bottom).

2. **Plaque, "Press F" hint and mobile controls show through the Credits screen.** When Credits is opened from the HUD link, UIScene is paused but its objects stay drawn under the semi-transparent Credits background. Before pausing, hide the plaque, hint and joystick (`setVisible(false)`, immediate, no tween). On Credits `goBack()`, show them again (the plaque/hint should come back via the normal proximity re-emit: set GraveyardWorld `lastProxGraveId = null` on resume, like the ritual exit path).

3. **Ritual spark effect hides the wizard.** In `ResurrectionRitual` the `sparkEmitter` (`kenney_spark_01`, teal tints, ~line 237) renders as a huge green lightning blob over the wizard during the shake/crack. Scale it down (`scale: {start: 0.12, end: 0}`), `alpha: {start: 0.7, end: 0}`, limit `quantity`/`frequency` so only a few sparks are alive at once, emit from the stone's centre (graveScreenY - stone half height) with a small radius, and `blendMode: 'ADD'`. The wizard must stay clearly readable in every frame of the ritual.

4. **Wizard stands on top of the stone during the ritual, hiding the crack/crumble.** When F is pressed, the wizard's sprite overlaps the tombstone (stone behind his body). In `GraveyardWorld.tryRaiseGrave()`, after stopping velocity, move the wizard so his feet are 40 art px below the stone's base (`ts.y + 40`, same x as the stone) with a 200 ms tween before launching the ritual (or set position directly if simpler), so the stone is fully visible above his head during crack and crumble. Make sure the ritual's rune circle stays centred on the stone, not the wizard.

Do not touch assets/, public/assets/, research/ or scripts/. Finish with a short summary of what changed.
