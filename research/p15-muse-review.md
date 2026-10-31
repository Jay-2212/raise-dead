# Muse (muse-spark-1.3-contributor, low) review of p15-brief

- A2 margin contradicts bounds: `setBounds(0,0,W,H)` lets edge touch visible edge; 16px inset needs `setBounds(16,16,W-32,H-32)` or invisible walls — state which.
- A2/A5 unactionable without map: no grave/tree/collider coords given; "≥36px gaps", "keep clear of mounds", "move any tree that does" will be guessed by cheap model; provide `PATH_RECTS` + layout file paths.
- A3 depth system mixed: `y-1/y-2` y-sort vs `-8/-10/-9` fixed layers incompatible; specify numeric ranges or sort function.
- A3 shadow spec under-defined: footprint→scale math for 64×24 / 96×40 textures missing; alpha baked-in + `alpha 0.6/0.3` will double-darken; give final alpha/scale formula.
- A3 decal count perf risk: ~300+ Images + 2 shadows/object ≈ 500 draw calls; will drop 60fps on mobile; mandate bake to RenderTexture / tile, not "if >300".
- A3 seeded RNG + placement rules incomplete: no mulberry32 impl location, no grave/plaza/tree position source, "24px from grave", "navy tint jitter" vague; cheap model will scatter onto paths/colliders.
- A4 origin hack fragile: `origin(0.5,61/64)` + `body.setOffset` adjustment with no frame/body size numbers; bob "synced to walk cycle" with no fps/event; specify exact offset + tween on `walk` event.
- A5 trunk detection asks runtime PNG alpha scan: don't; hardcode 18×10 per tree type; tree_3/4 trunk offset must be listed.
- A7 crow exclusion impossible: no crow manager API/event named; `pan` property requires WebAudio + `Phaser.Sound.WebAudioSound`; specify fallback.
- B triggers ambiguous: cat "60px left→right (or reverse)" relative to what; well "F 3× in 4s" window reset, counter UI text; howl "stands still" threshold (velocity < px/s, joystick drift) undefined.
- B persistence/interact underspecified: `interact()` priority, `tryInteract:boolean` re-read vs consume, "stays lit/open on reload" restore path, `triggerEgg/resetEggs` double-count/idempotency missing.
- B lore card: no file/component path for "plaque look", no HUD mute-button anchor coords, auto-hide 9s + >90px race with movement; state scene/layer and non-blocking input handling.
- Credits duplication risk: `public/CREDITS.md` + `CREDITS.md` + README — cheap model will drift; designate one source + build copy step.
- Folklore mostly OK; fix: Bloody Mary as "Vict

usage: {'completion_tokens': 1400, 'prompt_tokens': 4951, 'total_tokens': 6351, 'completion_tokens_details': {'reasoning_tokens': 781}, 'prompt_tokens_details': {'cached_tokens': 0}}
