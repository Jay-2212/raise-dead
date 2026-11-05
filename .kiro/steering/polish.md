---
inclusion: always
---
# Steering — polish conventions (Night 5)

- Entry is always ONE press (Enter, Space, click or tap). Never add a "press again" step.
- All game audio goes through `src/audio/Mixer.ts`. New music keys must be added to `MUSIC_KEYS`.
  Don't hard-code loud volumes: per-sound volumes are relative, the buses set the level.
- A sound that is not needed on the first graveyard screen goes in `queueDeferredAssets`, not the
  first-screen queue. Heavy grave payloads stay inside their grave's iframe.
- New PNG/audio assets: run the same settings as `scripts/compress-assets.sh` before committing.
- HUD text: no `setResolution()` (it doubles text size on the Canvas fallback renderer); no emoji
  glyphs as icons (they render as tofu on some systems) — draw them.
- Map ground = the real world art baked into `public/assets/images/map/world_map.png`
  (`scripts/bake-world-map.mjs` + `scripts/compose-world-map.py`; re-bake after changing the world layout).
  `src/ui/mapPainter.ts` grades it; overlays keep the bone (#e8dcc0 / #c9b98a) and moonlight (#7fd1d8)
  palette on night (#0b1020), and labels over the art always sit on a dark plate.
- Never ship original Microsoft, EA or Nullsoft art or logos. The paperclip is "Clicky", never the
  other name.
