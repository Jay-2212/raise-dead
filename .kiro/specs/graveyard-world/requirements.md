# Graveyard World — Requirements

## Overview
The top-down Phaser 3 scene that the player inhabits. It is the shell of the entire experience: atmosphere, navigation, and the trigger point for all grave interactions.

## User stories (EARS format)

### Movement
- **REQ-GW-01** While on desktop, the system shall move the wizard sprite when the player holds W/A/S/D, normalising diagonal speed so it never exceeds `walkSpeed`.
- **REQ-GW-02** While on a touch device, the system shall display a virtual joystick (phaser3-rex-plugins) in the lower-left quadrant and an action button labelled "F" in the lower-right quadrant.
- **REQ-GW-03** The wizard shall not walk through tombstone colliders or boundary walls.
- **REQ-GW-04** When the player is moving, the system shall play the `footsteps-gravel` audio loop; when stopped, the loop shall fade out within 0.3 s.

### Tombstones
- **REQ-GW-05** When the scene loads, the system shall read all 40 entries from `data/graves.json` and place one `Tombstone` game object per entry at its assigned map position.
- **REQ-GW-06** Each tombstone shall display the app name and birth–death years; hovering or standing near shall show the epitaph in a speech-bubble tooltip.
- **REQ-GW-07** Resurrectable tombstones (`resurrectable: true`) shall pulse with a faint green-rune glow to visually distinguish them.
- **REQ-GW-08** When the player enters the proximity radius (96 px) of a resurrectable tombstone, the system shall show a "Press F to raise the dead" hint overlay.
- **REQ-GW-09** When the player presses F (or taps the mobile F button) while the hint is visible, the system shall launch the `ResurrectionRitual` scene for that grave's ID.

### Atmosphere
- **REQ-GW-10** The scene shall run at a fixed dark-blue ambient light (`0x1a2340`) with the wizard casting a small warm-white light radius using Phaser Light2D.
- **REQ-GW-11** Each jack-o'-lantern sprite shall have a persistent point light (orange `0xff6a00`, radius 160 px, intensity 1.2) via Phaser Light2D.
- **REQ-GW-12** A particle emitter shall continuously spawn falling-leaf particles across the map using Kenney Particle Pack textures; leaves shall rotate and drift with slight gravity.
- **REQ-GW-13** A layered fog effect shall scroll two `TileSprite` fog layers at different speeds (parallax) creating depth.
- **REQ-GW-14** When the scene starts, the ambient `wind-howl` loop shall begin at volume 0.4; random `owl-hoot` and `ghost-whisper` one-shots shall fire every 20–60 s.
- **REQ-GW-15** A full moon sprite shall be rendered in the background layer; a faint vignette post-FX shall be applied to the camera.

### Camera
- **REQ-GW-16** The camera shall follow the wizard with a lerp factor of 0.1 and be bounded to the world extents.
- **REQ-GW-17** The camera shall not show areas outside the map tileset.

## Acceptance criteria
- AC1: On load, exactly 40 tombstones exist in the scene matching graves.json IDs.
- AC2: WASD movement works; diagonal speed ≤ `walkSpeed` (150 px/s default).
- AC3: On a simulated touch device (viewport width < 768 px) the joystick and F button are visible.
- AC4: Standing within 96 px of a resurrectable grave for 0.1 s shows the "Press F" hint.
- AC5: Pressing F triggers scene transition with the correct grave ID passed as scene data.
- AC6: Tombstone colliders prevent the wizard from walking through any stone.
- AC7: Ambient audio starts on first user interaction (AudioContext unlock).
- AC8: Frame rate stays ≥ 30 fps on a mid-range mobile device (tested in Chrome DevTools CPU 4× throttle).
