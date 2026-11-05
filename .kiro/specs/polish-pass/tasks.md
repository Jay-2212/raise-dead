# Polish Pass — Tasks

- [x] 1. Mixer with music/effects buses, silent fallback, unlock; install in BootScene.
- [x] 2. TitleScene single-press entry (Enter / Space / click / tap), audio unlock in the same gesture.
- [x] 3. VolumeControl (drawn speaker icon + sliders), wire into UIScene in place of the emoji button.
- [x] 4. mapPainter + WorldMap redesign (minimap + full map), trees/landmarks/camera view from UIScene.
- [x] 5. Split world audio into first-screen vs deferred; start deferred load in GraveyardWorld.create.
- [x] 6. Re-encode loops, compress PNG/JPG/GIF (scripts/compress-assets.sh), cache headers.
- [x] 7. DOOM Esc consistency; pinball WebGL retry + friendlier fallback text.
- [x] 8. Headless Chromium checks: one Enter / one click / one tap enters; WASD moves; sliders open,
      drag, persist, close; minimap hover + click travel; full map fast travel; no page errors.
- [x] 9. Kiro K11: apply patch, build, commit; push; deploy; verify live.
- [x] 10. Map from real world art: bake + compose scripts, `map_world` (≤300 KB) on the first screen,
      mapPainter draws it with a light grade + vignette (painted map = fallback), plated labels,
      outlined markers. Headless check: one Enter enters; minimap + full map screenshots; fast travel.
- [ ] 11. Kiro K12: apply patch, build, commit; push; deploy; verify live.
