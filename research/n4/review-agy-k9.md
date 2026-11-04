### Council Code Review: Raise Dead Night 4 (Batch K9)

1. **Horde Defeat Soft-Lock & Trapped Global Input**
   - **File/Line**: [`ZombieWave.ts:220-226, 248-251`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L220-L251) & [`GraveyardWorld.ts:832, 918-921`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L832-L921)
   - **Symptom**: When all souls are lost, [`ZombieWave.fail()`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L220) sets `failed = true` but leaves `active = true`. The player can walk away, but is permanently trapped in the horde state: pressing `F` anywhere in the graveyard (even at other graves) executes `castCone()` -> `retry()`; clicking anywhere in the world executes `castAt()` -> `retry()`; pressing `Space` restarts the horde; ambient events remain suppressed; and chant audio continues indefinitely. Additionally, `retry()` does not reset `kills`, corrupting HUD tally (e.g., `29/24`).
   - **Exact Fix**: In [`ZombieWave.ts`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L220), deactivate on failure (`this.active = false`) or cancel if the player walks >300px from the arena. In [`ZombieWave.retry()`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L229-L239), reset `this.kills = 0` and call `this.updateHud()`. In [`GraveyardWorld.ts:919`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L919), check `if (this.zombieWave?.active && !this.zombieWave.isFailed())`.

2. **Click-to-Move Hijacked by Horde Blaster**
   - **File/Line**: [`GraveyardWorld.ts:831-833`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L831-L833)
   - **Symptom**: During the horde, any pointerdown event unconditionally calls `this.zombieWave.castAt()` and returns early. Mouse players cannot path or dodge because click-to-move is disabled. If [`this.moveTarget`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L847) was set prior to the horde, it is never cleared, forcing the wizard to walk on autopilot while shooting.
   - **Exact Fix**: In [`GraveyardWorld.ts:832`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L832), check if a zombie is within click tolerance (`this.zombieWave.hasTargetAt(p.worldX, p.worldY)` or right-click `p.rightButtonDown()`). If not, let mouse click-to-move pathing proceed. When firing, clear `this.moveTarget = null`.

3. **Victory Sequence `F` Key Lockout**
   - **File/Line**: [`ZombieWave.ts:407-436`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L407-L436) & [`GraveyardWorld.ts:918-921`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L918-L921)
   - **Symptom**: When the horde is cleared, [`ZombieWave.end()`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L407) sets `ending = true`, but `this.active` remains `true` for 3.6 seconds. Pressing `F` during this banner sequence fires fizzle wisps and blocks interacting with adjacent graves or eggs.
   - **Exact Fix**: In [`ZombieWave.ts`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L407), set `this.active = false` immediately in `end()`, or check `if (this.zombieWave?.active && !this.zombieWave.isEnding)` in [`GraveyardWorld.ts:919`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L919).

4. **DOOM Overlay Fullscreen Layout & Escape Key Termination**
   - **File/Line**: [`GraveOverlay.ts:66-74, 394, 406-408`](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L66-L408)
   - **Symptom**: 
     1. When `fullBleed` is true, `panel` still retains `border-width: 60px 64px`, `border-image`, header, and exit button, while [`mountGameFrame()`](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L394) constrains `appContainer.style.height = 'min(68vh, 62vw)'`, letterboxing DOOM instead of rendering edge-to-edge.
     2. In DOOM, `Escape` is the native in-game menu key. Line 406 binds `keydown` on `iframe.contentWindow` to call `this.triggerExit()`, so pressing `Escape` to adjust sound or pause instantly kills the game and exits the overlay.
   - **Exact Fix**: When `fullBleed` is true, set `panel.style.borderWidth = '0'`, hide headers/footers, and set `appContainer.style.height = '100%'`. In `mountGameFrame()`, bypass the iframe `Escape` listener for `grave.id === 'doom'`.

5. **SkiFree Canvas Lacks Initial Keyboard Focus**
   - **File/Line**: [`GraveOverlay.ts:410`](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L410) & [`public/games/skifree/index.html:1-5`](file:///workspace/raise-dead/public/games/skifree/index.html#L1-L5)
   - **Symptom**: [`mountGameFrame()`](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L390) calls `iframe.focus()`. Focusing the `<iframe>` element does not focus `#skifree-canvas` inside SkiFree, so WASD and `F` boost do not respond until the user clicks the canvas.
   - **Exact Fix**: In [`GraveOverlay.ts:410`](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L410), add `iframe.contentDocument?.querySelector('canvas')?.focus()`. In [`skifree/index.html`](file:///workspace/raise-dead/public/games/skifree/index.html), add `<script>window.addEventListener('load', () => document.getElementById('skifree-canvas')?.focus());</script>`.

6. **Ambient Spacing Broken: `lastAmbientEndAt` Never Updated**
   - **File/Line**: [`GraveyardWorld.ts:980-983`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L980-L983) & [`WitchFlyBy.ts:160-171`](file:///workspace/raise-dead/src/scenes/WitchFlyBy.ts#L160-L171)
   - **Symptom**: [`GraveyardWorld.isAmbientBusy()`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L980) checks `this.time.now - this.lastAmbientEndAt < 8000`. However, `lastAmbientEndAt` is only set on ritual exits—never when a witch fly-by or zombie horde ends. As a result, the 8-second ambient spacing between witch, cat, and horde is non-functional.
   - **Exact Fix**: In [`WitchFlyBy.cleanup()`](file:///workspace/raise-dead/src/scenes/WitchFlyBy.ts#L160) and [`ZombieWave.end()`](file:///workspace/raise-dead/src/easter/ZombieWave.ts#L407), set `this.world.lastAmbientEndAt = this.world.time.now`.

7. **Lightning Strike Interrupts Resurrection Rituals**
   - **File/Line**: [`EasterEggManager.ts:284-290`](file:///workspace/raise-dead/src/easter/EasterEggManager.ts#L284-L290) & [`LightningStrike.ts:18-27`](file:///workspace/raise-dead/src/easter/LightningStrike.ts#L18-L27)
   - **Symptom**: Black-cat omen triggers lightning via a 1500ms delayed call. If the player initiates a resurrection ritual in that window, [`LightningStrike`](file:///workspace/raise-dead/src/easter/LightningStrike.ts#L10) still executes: flashing the screen at depth 12000 over the ritual, shaking the camera, invoking `wizard.flinch()`, and force-spawning the witch mid-incantation.
   - **Exact Fix**: In [`EasterEggManager.doBlackCat()`](file:///workspace/raise-dead/src/easter/EasterEggManager.ts#L284), check `if (w.ritualActive || w.scene.isActive('ResurrectionRitual')) { done(); return; }` before creating the strike. Store the [`LightningStrike`](file:///workspace/raise-dead/src/easter/LightningStrike.ts#L10) instance and call `cancel()` on scene transitions.

8. **Sprint Click-to-Move Arrival Overshoot**
   - **File/Line**: [`GraveyardWorld.ts:1054-1056`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L1054-L1056)
   - **Symptom**: The click-to-move arrival threshold calculates `Math.max(6, (WALK_SPEED * delta) / 1000 + 2)` using hardcoded `WALK_SPEED` (90) instead of `speed` (`WALK_SPEED * SPRINT_MULT` = 148.5). When holding `Shift` while click-moving, the wizard moves up to 4px/frame, occasionally overshooting the threshold and stuttering around the target for 1.2s before the stuck failsafe triggers.
   - **Exact Fix**: In [`GraveyardWorld.ts:1054`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L1054), replace `WALK_SPEED` with `speed`: `(speed * delta) / 1000 + 2`.

9. **Global `visibilitychange` Listener Leak on Scene Restart**
   - **File/Line**: [`GraveyardWorld.ts:168-174`](file:///workspace/raise-dead/src/scenes/GraveyardWorld.ts#L168-L174)
   - **Symptom**: `document.addEventListener('visibilitychange')` is registered in `create()` without being cleaned up on scene shutdown or restart, leaking event listeners that attempt to resume destroyed audio contexts.
   - **Exact Fix**: Bind a named method and call `document.removeEventListener('visibilitychange', this.onVisibilityChange)` inside `this.events.once('shutdown', ...)`.
