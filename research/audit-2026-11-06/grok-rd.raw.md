I'll audit the repo from the files only: judging criteria, security, and real bugs, without editing or running anything. Starting with the write-up, license, and `.kiro` layout.## Scores (1-10 per judging criterion, one line each, plus average)

- **Potential value/impact: 7.** A public, quota-capped memorial you can walk, with live Muse chat and on-demand tributes. Most of the 40 stones are epitaphs only, so the lasting use is the night of the demo.
- **Implementation of Kiro: 6.** Specs, steering, hooks, and `research/kiro-logs/` show a real spec-driven loop. `agents/` is empty, there is no MCP config, two launch specs were never started, and steering still describes a Worker that was not built.
- **Quality of idea: 8.** A moonlit graveyard that raises dead software is specific, seasonal, and easy to understand in one screen.
- **Design/polish: 8.** Ritual, audio unlock, map, joystick, credits, and lore eggs are in the client. File review only; the live site was not played.
- **Presentation: 5.** README has the live URL, stack, Muse paths, credits, and trademark line. No screenshot, no YouTube link, no Devpost text.
- **Average: 6.8.**

## Findings

Numbered, highest severity first. Clicky and Unmarked do check `Origin`, use HMAC session tokens, hash the IP, and cap spend in D1. Model keys stay in the Worker env. Clicky’s DOM writes go through `textContent`. Generated pages use a no-network CSP.

1. **[P1]** `src/graves/clippy/api.ts:44` — `getSession()`’s catch returns `remaining: 0`. `ClickyChat.ts:46` stores that, and `ClickyChat.ts:543` then blocks typed chat as if the quota were spent. A 500 or a network blip looks like “out of words.” The preset tree still works. **SAFE-FIX:** return a distinct error and show “could not reach Clicky” without zeroing the counter.
2. **[P1]** `functions/api/eliza/reply.ts:75` — the `catch` returns 502 and does not refund the IP or daily rows reserved at lines 43–47. A Muse timeout burns one of the 12 lines. The body also sends `why` with the exception text (line 76). **SAFE-FIX:** refund both keys, and return `{ error: 'upstream' }` only.
3. **[P1]** `functions/api/unmarked/raise.ts:119` — a page is cached when one lint failure remains (`p2.length <= 1`), including missing touch controls or a missing R restart (`functions/api/unmarked/_shared.ts:59`). `INSERT OR IGNORE` keeps that page for everyone. **RISKY:** require zero lint problems before insert. Strict lint will reject more names on stage.
4. **[P1]** `functions/api/unmarked/raise.ts:88` and `src/graves/unmarked-grave/UnmarkedGrave.ts:136` — the function may wait 110s. If the platform kills the isolate, the `catch` refund never runs, and the client still says “Nothing was spent.” **SAFE-FIX:** change that sentence so a dropped connection does not promise a refund. **RISKY:** cutting the abort under ~30s will fail real generations (the UI says half a minute, line 103).
5. **[P2]** `src/ui/GraveOverlay.ts:410` — the default sandbox is `allow-scripts allow-same-origin`. `data/graves.json` sets that for DOOM (676), Pac-Man (694), SkiFree (712), ELIZA (730), and Winamp (117). Those frames share the page origin, so their scripts can read `rd_clicky_token` and call `/api/clicky/chat`. Unmarked is the strict case: `allow-scripts` only (`UnmarkedGrave.ts:152`) plus the CSP sandbox (`_shared.ts:110`). **RISKY** before the demo. DOOM fetches its wad with a relative `fetch` (`public/games/doom/index.html:23`); an opaque origin cannot.
6. **[P2]** `public/_headers:1` — the site CSP has no `frame-ancestors 'self'`, so another site can embed the graveyard. **SAFE-FIX:** add that directive on `/*`.
7. **[P2]** `src/ui/Joystick.ts:42` — the stick and the F button are placed once. There is no resize handler, so a phone rotation leaves them in the old place. The F control is Phaser text with no accessible name. **SAFE-FIX:** reposition on `scale` resize.
8. **[P2]** `.kiro/hooks/typecheck-lint.json:6` and `package.json:12` — the hook watches `worker/**/*.ts` and runs `eslint`, which is not a dependency. `functions/` is outside the hook and outside `npm run build`. **SAFE-FIX:** watch `functions/**/*.ts` and run `npm run typecheck:functions`.
9. **[P2]** `src/scenes/ResurrectionRitual.ts` always shakes the camera. Clicky honors `prefers-reduced-motion` (`ClickyChat.ts:164`). The ritual does not. **SAFE-FIX:** skip shake and the light flash when that query matches.
10. **[P2]** Google Reader and Paint exist only as specs. `data/graves.json:81` sets `google-reader` to `resurrectable: false`. Every task in `.kiro/specs/google-reader-grave/tasks.md` and `paint-grave/tasks.md` is open. `.kiro/steering/product.md` and `tech.md` still describe `/api/feed`, `/api/ai`, webamp, and Oxion. No feed route exists under `functions/`. The README does not promise Reader.

## Top 5 cheap score improvements (README/docs/.kiro/presentation)

1. Add one graveyard shot, one open grave, and a five-step judge path to the README: walk, press F, Clicky tap then one typed line, Unmarked with a name already cached, one Easter egg. Link the YouTube URL when it exists.
2. Publish a public YouTube video under 3:00 and a Devpost text that matches the graves that ship. Update the drafts in `research/meta-submission-checklist.md`: keep Clicky and Unmarked, drop Muse Image, Oxion, and Google Reader.
3. Replace the launch table in `.kiro/steering/product.md` and the Worker table in `tech.md` with the Pages routes that exist (`/api/clicky/*`, `/api/unmarked/*`, `/api/eliza/reply`). Add one file under `.kiro/agents/`. State in the write-up that this entry uses no MCP server.
4. Point the typecheck hook at `functions/` (finding 8). In `deploy-and-submission`, mark REQ-DS-02 through REQ-DS-04 as replaced by Pages Functions.
5. Add a GPL notice to `LICENSE`: `public/games/doom/websockets-doom.js` and `.wasm` are GPL-2.0, as `CREDITS.md` already says. The rest stays MIT. Freedoom is BSD-3-Clause.

## Rule-compliance risks

- **License.** `LICENSE` is MIT, which is OSI-approved. The DOOM port is GPL-2.0 and is credited. Add the exception in item 5 so the MIT grant does not look like it covers that engine. Piper is documented as an offline tool and is not in the tree.
- **`.kiro`.** Specs, steering, and two hooks are in the tree. `agents/` is empty. There is no MCP config.
- **Video and Devpost.** The README and the submission spec contain no YouTube URL. A public video under 3 minutes is still required. Steering dates the Kiroween target at 5 Dec 2026. The Meta checklist deadline of 4 Nov 2026 is already past. This pass did not confirm either submission.
- **Second entry.** Ghost from the Past, as described (a reading-memory extension plus a Worker MCP server, Frankenstein), is a different product from this walkable graveyard. This repo has no extension or MCP code. Use a different video and different lead screenshots.
- **Secrets.** `.dev.vars` is listed in `.gitignore`. This pass did not read git history and did not print any secret. Run the history scan named in `research/meta-submission-checklist.md` before the next public push.
EXIT 0
