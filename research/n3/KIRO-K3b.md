# Kiro task K3b (execute exactly)
Council review fixes for the Unmarked Grave (Gemini + Grok): cookie path /api, non-Latin slug hashing, name must contain a letter/digit, failed Muse calls keep the daily slot spent, client fetches a session before the first raise, Road Rash tribute HTML attribute typo.
1. `git apply research/n3/k3b.patch`
2. `npm run build` (must print "built in"; fix only a named tsc line, max 2 attempts)
3. `git add -A src public functions research/n3 && git commit -m "Night 3 K3b (Kiro applies council review fixes): session cookie path, slug hashing, spend-safe refunds, tribute markup"`
4. Reply with the commit hash and OK, or the exact error.
