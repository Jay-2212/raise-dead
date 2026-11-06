[tool] Reading listing raise-dead
[tool] status: Completed
[tool] Reading .gitignore:1, LICENSE:1, wrangler.toml:1, _headers:1, _routes.json:1, listing api, listing .kiro, package.json:1
[tool] status: Completed
[tool] Reading _lib.ts:1, chat.ts:1
[tool] status: Completed
[tool] Reading raise.ts:1, _shared.ts:1, [slug].ts:1, session.ts:1, usage.ts:1, reply.ts:1
[tool] status: Completed
[tool] Searching for 'innerHTML|insertAdjacentHTML|outerHTML|srcdoc|postMessage...' in src
[tool] Searching for 'google-reader|googlereader|api/feed|resurrectable": true' in raise-dead
[tool] status: Completed
[tool] status: Completed
[tool] Reading GraveOverlay.ts:1, UnmarkedGrave.ts:101-220
[tool] status: Completed
[tool] Searching for '"id"|"resurrectable": true|"game":' in graves.json
[tool] status: Completed
[tool] Searching for '"id"|"resurrectable": true|"game":' in graves.json
[tool] status: Completed
[tool] Searching for '"game(_sandbox|_credit)?":' in graves.json
[tool] Finding */*.{html,js,md,txt} in games
[tool] status: Completed
[tool] status: Completed
[tool] Searching for 'GPL|doom|skifree|pacman|eliza' in raise-dead
[tool] status: Completed
[tool] Reading requirements.md:1, tasks.md:1, typecheck-lint.json:1, assets-credits.json:1, VIDEO-SCRIPT.md:1, team-log.md:1
[tool] status: Completed
[tool] Finding **/* in .kiro
[tool] Reading session-n5-k12.log:1, tasks.md:1, index.html:1
[tool] status: Completed
[tool] status: Completed
[tool] Searching for '\.dev\.vars|\.wrangler/' in .git
[tool] Searching for '(sk-[A-Za-z0-9]{20,}|Bearer [A-Za-z0-9_\-]{20,}|MODEL_API...' in raise-dead
[tool] status: Completed
[tool] status: Completed
[tool] Searching for '(sk-[A-Za-z0-9]{20,}|Bearer [A-Za-z0-9_\-]{20,}|MODEL_API...' in meta-submission-checklist.md
[tool] status: Completed
[tool] Searching for 'LLM\|[0-9]+\||TOKEN_SECRET=\S|IP_SALT=\S|ADMIN_KEY=\S' in research
[tool] Reading ClickyChat.ts:421-500
[tool] status: Completed
[tool] status: Completed
[tool] Searching for 'aria-|role=|prefers-reduced-motion|setAttribute\('role'' in src
[tool] Reading 0001_clicky.sql:1, 0002_unmarked.sql:1
[tool] status: Completed
[tool] status: Completed
[tool] Searching for 'youtu|devpost' in raise-dead
[tool] Reading assets-credits.mjs:1, main.ts:1-60
[tool] status: Completed
[tool] status: Completed
## Scores
- Potential Value/Impact: **6**. It's a fun nostalgia piece with a reusable "AI writes a sandboxed mini-game" pattern, but it has limited use beyond entertainment.
- Implementation of Kiro: **5**. There are 10 specs, 4 steering docs, 2 hooks and 30+ session logs. But `.kiro/agents/` is empty, there's no MCP, the hooks are broken (see finding 2), several specs describe features that were never built, and the logs show Kiro mostly applying patches written by other agents (`git apply research/n5/K12.patch`).
- Quality of Idea: **8**. A walkable graveyard of dead software with resurrection rituals is a strong fit for the Resurrection category.
- Design/Polish: **7**. The polish spec is fully done except the K12 deploy item, and there's a single-press start, an audio mixer and a Canvas fallback. I couldn't check the live site, so this score comes from code and specs only.
- Presentation: **4**. No video link, no Devpost link, no screenshots in the README, and the README misses half of what ships.
- **Average: 6.0**

## Findings
1. **[P0] Presentation rules.** No YouTube or Devpost link exists anywhere. A grep for `youtu|devpost` only finds planning docs. `research/n3/VIDEO-SCRIPT.md` was written for the Meta hackathon judging weights, and Kiro only gets about 10 s at 2:30. **Fix:** record and publish a public video under 3 min with at least 30 s showing `.kiro/` specs, steering and a hook running, then link it in the README. SAFE-FIX.
2. **[P1] `.kiro/hooks/assets-credits.mjs:15`.** `new URL('../../..', import.meta.url)` resolves to the folder *above* the repo, so the hook can never find `CREDITS.md` and always exits 1. Also, `isCredited` accepts a match on the parent folder name (`images`, `sfx`), so the check would pass almost anything. **Fix:** use `'../..'` and drop the `parentDir` match. SAFE-FIX.
3. **[P1] `.kiro/hooks/typecheck-lint.json`.** It runs `npm run lint`, which calls `eslint src/ worker/`. ESLint isn't installed and `worker/` doesn't exist, so this step always fails. The hooks also use a custom JSON format, and with `.kiro/agents/` empty nothing seems to wire them into Kiro CLI. **Fix:** remove the lint step or point it at `typecheck:functions`, and add `.kiro/agents/raise-dead.json` that declares the hooks. SAFE-FIX.
4. **[P1] `.kiro/specs/deploy-and-submission/*` is stale.** All 30 tasks are unchecked, and it describes `worker/`, `/api/feed`, `/api/ai`, Oxion, jspaint and ESLint, none of which exist. `steering/tech.md` and `steering/structure.md` describe the same old architecture (webamp, ms-agent-js, feedsmith). Judges will read this as specs drifting away from the real code. **Fix:** tick what's done and add a short "Superseded by Pages Functions + D1 (see functions/)" note to each file. SAFE-FIX.
5. **[P1] GPL compliance for the DOOM grave (`public/games/doom/`).** The Chocolate Doom engine (GPL-2) ships as a prebuilt wasm, but only `FREEDOOM-COPYING.txt` is included. There's no GPL text and no pointer to the source. The README also claims "No original … code from the trademarked products", but this engine is derived from id Software's code. **Fix:** add `COPYING-GPL2.txt` and a NOTICE linking the cloudflare/doom-wasm source, and reword that README line. SAFE-FIX.
6. **[P1] `public/CREDITS.md` (12 KB) is behind the root `CREDITS.md` (16 KB).** The public copy has no DOOM or Pac-Man rows, and the in-game credits read from it. Both copies still contain "TODO: re-check en_US-norman-medium licence". **Fix:** copy root over public and resolve the TODO. SAFE-FIX.
7. **[P2] `functions/api/eliza/reply.ts`.** The moderation check covers `text` but not `history[].text`, which is sent to Muse unchecked, so the injection filter is easy to bypass. The 502 response also returns `why` with upstream error details. **Fix:** run `isBlocked`/`INJECTION_REGEX` on each history item and drop `why`. SAFE-FIX.
8. **[P2] `functions/api/unmarked/raise.ts`.** Two first-time requests for the same name both pay for a Muse generation, and the first cached result is served to everyone forever. There's also no admin way to purge a bad generated tribute. **Fix:** document a manual `DELETE FROM unmarked_cache WHERE slug=?` runbook. SAFE-FIX.
9. **[P2] `functions/api/clicky/chat.ts`.** When the 20 s abort fires mid-stream, the client gets a cut-off stream with no `done` event. Also, `refundQuota` never refunds the daily counter. That's conservative, but it skews the usage numbers. **Fix:** have the client treat end-of-stream without `done` as an error. SAFE-FIX.
10. **[P2] `public/_headers` `/*`.** There's no `frame-ancestors` or `X-Frame-Options` on the main page, even though REQ-DS-06 requires one. **Fix:** add `frame-ancestors 'self'` to the CSP. SAFE-FIX.
11. **[P2] `src/ui/GraveOverlay.ts` `mount()`.** It awaits the module import before it assigns `overlayEl`. If `unmount()` runs during that await, the overlay gets attached afterwards and is orphaned on screen. **Fix:** add a mount token and check it after the await. RISKY (touches the core flow).
12. **[P2] Accessibility.** Only 10 `aria-`/`role` uses exist in `src/`, there's no `prefers-reduced-motion` handling for the shake and flash ritual, and the ✕ close glyph breaks the steering's "no glyph icons" rule. **Fix:** skip the shake when reduced motion is set. SAFE-FIX.

Checked and fine: the token is HMAC-signed, the IP is salted and hashed (IPv6 by /64), the reserve-then-refund quota upserts are guarded, generated games are served with `sandbox allow-scripts` and `connect-src 'none'`, the main app sets no `innerHTML` from user data, `.dev.vars` and `.wrangler` are gitignored, and no secret-like values turned up in tracked text.

## Top 5 cheap score improvements
1. Add a "How Kiro built this" README section: a spec → tasks → session-log path for one feature (Clicky), plus the steering rules that changed the output, such as the "Clicky, never the other name" rule and the single-press-entry rule.
2. Fix both hooks, add `.kiro/agents/raise-dead.json` that wires them in, and show one hook firing in the video.
3. Add 3–4 screenshots or a GIF to the README: the graveyard, the ritual, Clicky, and an Unmarked Grave tribute.
4. Update the README's "What rises" table. It's missing DOOM, Pac-Man, SkiFree, ELIZA and Bouncing Logo. It also says Winamp is a Muse-written tribute, but `graves.json` points Winamp at `games/rhythm/`. The brief mentions Google Reader, but in `graves.json` that grave is not resurrectable.
5. Shrink the Meta-hackathon framing in the Kiroween write-up and say plainly who authored code: Kiro vs. "Hark" vs. reviewer models.

## Rule-compliance risks
- **OSI license:** MIT `LICENSE` is present. The GPL-2 DOOM engine needs its notice (finding 5) so the repo isn't non-compliant.
- **`/.kiro` committed:** It's present (no `.gitignore` entry). It could be judged weak because `agents/` is empty, there's no MCP and the hooks don't work.
- **Video:** It's missing, which disqualifies the entry if it isn't public on YouTube and under 3:00 by the deadline.
- **Kiro authorship:** The logs show Kiro applying patches written by other tools. Explain the workflow honestly in the write-up so judges don't read it as "Kiro only ran `git apply`".
- **Multiple entries:** "Ghost from the Past" is a browser extension plus a self-hosted Worker that remembers your reading and exposes it over MCP, entered in Frankenstein. Raise Dead is a browser game entered in Resurrection. The purpose, users, interface and code are all different; only the Cloudflare hosting is shared. They're substantially different, as long as no code or write-up text is reused.
- **Trademarks:** The disclaimer is good and "Clicky" is used consistently. The README still says "Clippy" once, in the trademark list, which is fine there.
EXIT 0
