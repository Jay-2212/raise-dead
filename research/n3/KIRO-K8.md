# Kiro task K8 (execute exactly)
Tester pass 4 (mouse-only): ritual loop, Clicky, Unmarked Grave all pass. Fixes: corner ✕ close button on overlays; click-to-move target ring + no overshoot at low frame rates.
1. `git apply research/n3/k8.patch`
2. `npm run build` (must print "built in")
3. `git add -A src research/n3 && git commit -m "Night 3 K8 (Kiro applies council fix): overlay close X, click-to-move target ring"`
4. Reply with the commit hash and OK, or the exact error.
