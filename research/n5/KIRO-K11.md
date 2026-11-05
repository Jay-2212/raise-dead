# Kiro task K11 — Night 5 polish pass (execute exactly; do not redesign)
Spec: `.kiro/specs/polish-pass/` · steering: `.kiro/steering/polish.md`. Code is pre-written and was verified
headless by Hark (one Enter / click / tap enters, WASD, sliders, minimap, full-map fast travel, no page errors).
Compressed audio/images are already in the working tree (made with `scripts/compress-assets.sh`; do NOT re-run it).
1. `git apply research/n5/K11.patch`
2. `npm run build` (must print "built in"; fix only a named tsc line, max 2 attempts)
3. Check `grep -rn "Clippy" src/ui src/audio src/scenes/TitleScene.ts` prints nothing user-facing (identifiers like `clippy` ids are fine).
4. `git add -A src public scripts .kiro research/n5 && git commit -m "Night 5 K11 (Kiro applies polish pass): one-press entry + audio unlock, Music/Effects sliders, painted minimap + full map, deferred ritual audio, re-encoded loops, compressed PNG/GIF, cache headers, DOOM Esc, pinball WebGL text"`
5. Reply with the commit hash and OK, or the exact error.
