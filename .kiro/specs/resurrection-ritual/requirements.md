# Resurrection Ritual — Requirements

## Overview
The cinematic transition played when the player activates a resurrectable grave. It runs as an additive Phaser scene layered over `GraveyardWorld`, then gives way to the grave-specific DOM overlay. The exit plays in reverse.

## User stories (EARS format)

### Entry ritual (raise)
- **REQ-RR-01** When the player presses F on a resurrectable grave, the system shall start the `ResurrectionRitual` scene with `{ graveId, graveName }` as scene data.
- **REQ-RR-02** The system shall immediately begin playing the `incantation` voice clip (original recording, full sentence).
- **REQ-RR-03** Simultaneously with the voice clip, the system shall render animated rune glyphs (5–7 symbols) orbiting the tombstone in a circle, fading in over 1 s.
- **REQ-RR-04** At the 1.5 s mark, the system shall ramp the `wind-swell` SFX from 0 to full volume over 1.5 s.
- **REQ-RR-05** At the 2 s mark, the system shall trigger `this.cameras.main.shake(800, 0.012)` to simulate ground rumble; a crack sprite shall animate across the tombstone face.
- **REQ-RR-06** At the 3 s mark, the system shall trigger `this.cameras.main.flash(600, 255, 255, 255)` and play the `holy-light-burst` SFX with optional choir stinger.
- **REQ-RR-07** After the flash, the system shall fade the camera to white over 0.4 s, then mount the grave-specific DOM overlay and fade back in over 0.4 s.
- **REQ-RR-08** The `ResurrectionRitual` scene shall stop (not destroy) `GraveyardWorld` for performance while the overlay is open.

### Exit ritual (requiescat)
- **REQ-RR-09** When the player clicks "Requiescat in pace" or presses Esc inside an overlay, the system shall start the exit ritual.
- **REQ-RR-10** The exit shall fade to white, unmount the DOM overlay, fade back in to the graveyard, play a reverse `wind-swell` fade-out, disperse the rune particles, and play a low `tomb-seal` SFX.
- **REQ-RR-11** On exit completion, `GraveyardWorld` shall resume and the `ResurrectionRitual` scene shall be stopped.

### General
- **REQ-RR-12** The entire entry ritual (voice start → overlay visible) shall complete within 5 s.
- **REQ-RR-13** All audio in the ritual shall respect the global mute toggle.
- **REQ-RR-14** If the player presses Esc during the entry ritual (before the overlay opens), the ritual shall be cancelled and the graveyard restored with a short reverse animation.

## Acceptance criteria
- AC1: Entry ritual plays fully without audio gaps or visual glitches at 60 fps.
- AC2: The DOM overlay is not visible until after the white-flash fade-out completes.
- AC3: Pressing Esc during ritual entry cancels cleanly; no orphaned DOM nodes or audio loops.
- AC4: Exit ritual returns to the same graveyard camera position the player was at.
- AC5: Ritual can be triggered for each of the 5 resurrectable graves without errors.
- AC6: On mobile, the ritual is triggered by the on-screen F button (same code path).
