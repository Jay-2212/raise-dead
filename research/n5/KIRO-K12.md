# Kiro task K12 — Map from the real world art (execute exactly; do not redesign)
Spec: `.kiro/specs/polish-pass/` (design "Map from the real world art (K12)", tasks 10–11) · steering: `.kiro/steering/polish.md`.
The patch is pre-written and was verified headless by Hark (one Enter enters, WASD, sliders, minimap hover + click travel,
full-map fast travel, no page errors; screenshots reviewed). It adds the baked map image
`public/assets/images/map/world_map.png` (~230 KB, binary in the patch), the bake/compose scripts, and the
mapPainter/WorldMap changes.
1. `git apply research/n5/K12.patch`
2. `npm run build` (must print "built in"; fix only a named tsc line, max 2 attempts)
3. Check `ls -l public/assets/images/map/world_map.png` is under 300000 bytes.
4. `git add -A src public/assets/images/map scripts .kiro CREDITS.md research/n5 && git commit -m "Night 5 K12 (Kiro applies map pass): minimap + full map built from the real world art (baked world_map.png), moonlit grade + vignette, plated labels, outlined markers"`
5. Reply with the commit hash and OK, or the exact error.
