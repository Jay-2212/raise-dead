# Kiro task K7 (execute exactly)
Tester pass 3: mouse-only players could not move at all (and testers asked for a visible controls hint). Adds click-to-move (click a tombstone or secret to walk there and use it; slides around obstacles; keyboard cancels it; click casts spells during a zombie wave) and a first-visit controls toast.
1. `git apply research/n3/k7.patch`
2. `npm run build` (must print "built in")
3. `git add -A src research/n3 && git commit -m "Night 3 K7 (Kiro applies council fix): click-to-move + controls toast for mouse players"`
4. Reply with the commit hash and OK, or the exact error.
