# Road Rash Grave — Requirements

## Overview
A one-level pseudo-3D motorbike combat racing tribute built on the MIT code-only fork of `jakesgordon/javascript-racer`. All original sprites and music from that repo are excluded; replaced with original art and Komiku CC0 music.

## Source restrictions (hard rules)
- Use only `src/` JS logic from javascript-racer (MIT). Delete `images/`, `music/` entirely.
- Do not use any EA/Sega Genesis Road Rash sprites (those bundled in the repo are ripped OutRun assets).
- Tombstone label may read "Road Rash (tribute)" — no EA logo, no franchise logo.

## User stories (EARS format)

### Core racing
- **REQ-RR-01** When the Road Rash grave is opened, the system shall display a full-screen canvas running the pseudo-3D road renderer (straight + curved segments, hills).
- **REQ-RR-02** The player's bike shall accelerate with Up/W, brake with Down/S, steer left with Left/A and right with Right/D (keyboard); on mobile, an on-screen touch control strip shall be displayed.
- **REQ-RR-03** The track shall loop for 3 laps; a lap counter and a timer shall be displayed in the HUD.
- **REQ-RR-04** 5–6 rival bikers shall appear on the road as sprites, each with a `state` field: `riding | punching | kicking | hit | crashed`.

### Combat
- **REQ-RR-05** When the player is within punch range of a rival (|rivalZ − playerZ| < threshold, |offsetDiff| < 0.3) and presses J, the system shall play a punch animation on the player sprite and set the rival's state to `hit`, knocking the rival's offset outward and reducing their speed by 30%.
- **REQ-RR-06** When the player presses K in the same range, the same logic applies with a kick animation.
- **REQ-RR-07** Rivals shall periodically attack back; a rival attack shall reduce the player's speed by 20% and play a wobble animation on the player sprite.
- **REQ-RR-08** When a rival is knocked past the road edge, their state shall become `crashed`; they respawn at the back of the pack after 5 s.

### Art & audio
- **REQ-RR-09** All sprites (player bike, rival bikers, roadside props, sky, hills) shall be original artwork or generated via Muse Image — no ripped sprites.
- **REQ-RR-10** Background music shall be a Komiku CC0 track; an engine-noise SFX loop shall pitch-shift with the player's current speed.
- **REQ-RR-11** A "ROUND START" / "FINISH" splash shall display at race begin and end.

### Win/lose
- **REQ-RR-12** Completing 3 laps shall show a "You've risen!" victory screen with the player's time.
- **REQ-RR-13** The overlay shall include the standard "Requiescat in pace" exit button at all times.

## Acceptance criteria
- AC1: Road renders with curves and hills; no `images/` or `music/` from javascript-racer bundled.
- AC2: Punch (J) and kick (K) visibly change rival state and speed within one frame.
- AC3: 3-lap race completes and victory screen appears.
- AC4: No console errors about missing textures or audio files.
- AC5: CREDITS.md includes the javascript-racer MIT attribution line from the research doc.
- AC6: Mobile touch controls allow steering and combat.
