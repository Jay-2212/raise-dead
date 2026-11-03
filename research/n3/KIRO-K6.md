# Kiro task K6 (execute exactly)
Tester pass 2: on a GPU-less browser the title ran but the graveyard froze; the fps watchdog only checked at the title. Now it watches for 2 minutes across scenes.
1. `git apply research/n3/k6.patch`
2. `npm run build` (must print "built in")
3. `git add -A src research/n3 && git commit -m "Night 3 K6 (Kiro applies council fix): fps watchdog covers the graveyard scene"`
4. Reply with the commit hash and OK, or the exact error.
