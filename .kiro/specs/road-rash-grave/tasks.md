# Road Rash Grave — Tasks

## GraveApp scaffold
- [ ] 1. Create `src/graves/roadrash/index.ts` exporting a `RoadRashGrave` implementing `GraveApp`.
- [ ] 2. `mount()`: create overlay HTML (header + canvas + HUD div + "Requiescat in pace" button); append to container.
- [ ] 3. `dispose()`: stop engine loop, stop all audio, remove canvas, dispatch `rip-exit` event.

## Engine: vendor javascript-racer
- [ ] 4. Download `jakesgordon/javascript-racer` source at a pinned commit; copy only `src/v4.final/` JS logic to `src/graves/roadrash/engine/`.
- [ ] 5. Delete `images/` and `music/` from the vendored copy entirely; verify with `git status`.
- [ ] 6. Prepend MIT licence notice to each vendored file header: `// Based on javascript-racer by Jake Gordon (MIT) — https://github.com/jakesgordon/javascript-racer`.
- [ ] 7. Convert vendored JS to TypeScript (add `export`, fix implicit `any`, add types for segments/cars/sprites); ensure `tsc --noEmit` passes.

## Original sprites (art)
- [ ] 8. Create `public/assets/images/roadrash/player-bike.png` — original sprite sheet (straight, lean L/R, punch, kick, hit, crash), 7 rows × 64 × 64 px; update CREDITS.md.
- [ ] 9. Create `public/assets/images/roadrash/rival-bike-red.png` and `rival-bike-blue.png` — same layout; update CREDITS.md.
- [ ] 10. Create roadside prop sprites (tree, shrub, sign) as `road-props.png`; update CREDITS.md.
- [ ] 11. Create sky/horizon background image `road-bg.png`; update CREDITS.md.

## Rival bikers
- [ ] 12. Create `src/graves/roadrash/RivalBiker.ts` — `RivalBiker` class with fields `z, offset, speed, baseSpeed, state, stateTimer, respawnTimer`.
- [ ] 13. In game loop, update each rival: advance z at baseSpeed; if `state === 'hit'`, count down stateTimer; restore speed/state on expiry.
- [ ] 14. Implement rival AI: every 3–8 s a rival may enter `punching` or `kicking` state toward the player if in range.

## Combat input
- [ ] 15. Add J/K key listeners in `controls.ts`; on J, call `tryPunch(player, rivals)`; on K, call `tryKick(player, rivals)`.
- [ ] 16. Implement `tryPunch`: check `|rival.z - player.z| < 300 && |rival.offset - player.offset| < 0.3`; if true, set rival `state='hit'`, apply offset knock, speed ×0.7; play `punch.wav`.
- [ ] 17. Implement rival attack handler: when rival `state === 'punching'` in range, reduce player speed ×0.8; trigger player wobble tween; play `hit.wav`.

## HUD
- [ ] 18. Create `src/graves/roadrash/Hud.ts`; render lap counter, timer, and position (1st–6th) as DOM elements over canvas.
- [ ] 19. Flash "ROUND START" on race begin (1.5 s); flash "FINISH!" on lap 3 completion.

## Audio
- [ ] 20. Add `komiku-battle-theme.mp3` to `public/assets/audio/winamp/` (shared with Winamp); update CREDITS.md.
- [ ] 21. Add `engine-loop.mp3` (CC0 or original) to `public/assets/audio/sfx/`; update CREDITS.md.
- [ ] 22. In game loop, update `engineAudio.playbackRate` proportional to player speed ratio.
- [ ] 23. Add `punch.wav`, `kick.wav`, `crash.wav`, `hit.wav` to `public/assets/audio/sfx/`; update CREDITS.md.

## Win/lose
- [ ] 24. On lap 3 completion, stop engine loop; show victory screen with elapsed time and "Requiescat in pace" button.

## Mobile controls
- [ ] 25. Detect touch device; show on-screen control strip (steer left/right, accelerate/brake, punch/kick buttons) positioned below canvas.

## QA
- [ ] 26. Run `npm run typecheck` — zero errors in `src/graves/roadrash/`.
- [ ] 27. Confirm no files from `images/` or `music/` of javascript-racer are present (`find src/graves/roadrash/ -name "*.png" -o -name "*.mp3"` shows only files we added).
- [ ] 28. Add javascript-racer credit line to CREDITS.md.
