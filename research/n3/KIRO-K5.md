# Kiro task K5 (execute exactly; do not redesign)
Council triage of tester + Gemini findings. Root cause of "nothing responds": on software WebGL (no GPU) the game ran at 0 fps; now auto-falls back to the Canvas renderer (20-30 fps). Plus: Credits mask fix, iframe key reset/focus, overlay fade click-through, plaque/lore-card stacking, no raise prompt during zombie wave, title prompt wording.
1. `git apply research/n3/k5.patch`
2. `npm run build` (must print "built in"; fix only a named tsc line, max 2 attempts)
3. `git add -A src research/n3 && git commit -m "Night 3 K5 (Kiro applies council triage): software-WebGL Canvas fallback + fps watchdog, credits mask, iframe focus/key reset, overlay/lore fixes"`
4. Reply with the commit hash and OK, or the exact error.
