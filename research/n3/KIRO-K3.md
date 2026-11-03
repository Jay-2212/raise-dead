# Kiro task K3 (execute exactly; do not redesign or refactor)
Council-verified change: Unmarked Grave (Muse Spark writes a playable tribute for any dead app), Road Rash + Winamp Muse tributes, README update.
The D1 migration (migrations/0002_unmarked.sql) is already applied in production by Hark.

1. Run: `git apply research/n3/k3.patch`
2. Run: `npm run build` — must print "built in". If tsc errors, fix only that line; stop after 2 attempts.
3. Append to the "## Night 3 additions" section of CREDITS.md:
   - Road Rash and Winamp tributes (public/games/muse/) and all Unmarked Grave games — written by Meta Muse Spark (muse-spark-1.3-contributor) for Raise Dead; AI-generated, original shapes-only art
4. Run: `git add -A src public data functions migrations README.md CREDITS.md research/n3 && git commit -m "Night 3 K3 (Kiro applies council plan): Unmarked Grave — Muse Spark writes playable tributes on demand (D1 cache + quotas, no-network sandboxed play endpoint); Road Rash and Winamp Muse tributes; README"`
5. Reply with one line: the commit hash and "OK", or the exact error.
