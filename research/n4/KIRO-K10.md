# Kiro task K10 (execute exactly; do not redesign)
Council fixes from Grok + Gemini review of K9, plus ELIZA, the map, Unmarked Grave QA and the Winamp rhythm game. All code is pre-written and verified headless by Hark.
1. `git apply research/n4/K10.patch`
2. `npm run build` (must print "built in"; fix only a named tsc line, max 2 attempts)
3. Append to CREDITS.md under "## Night 4 additions":
   - ELIZA (1966) by Joseph Weizenbaum; rules engine rewritten for Raise Dead (original code); Meta Muse Spark fills gaps via /api/eliza/reply
   - Winamp rhythm game: original code. Music "Danse Macabre" by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0, https://creativecommons.org/licenses/by/4.0/ — public/games/rhythm/danse_macabre.{ogg,mp3} (105 s excerpt)
   - Star Cadet sound effects: original WebAudio synth by Raise Dead (no Microsoft audio)
4. `git add -A src public data functions CREDITS.md research/n4 && git commit -m "Night 4 K10 (Kiro applies council fixes): horde input/knockback/abandon, lightning+witch cancel, DOOM full-bleed, map, ELIZA, Unmarked QA, Winamp rhythm, pinball sfx+camera lock"`
5. Reply with the commit hash and OK, or the exact error.
