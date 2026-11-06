## Scores (1-10 per judging criterion, one line each, plus average)
- **Potential Value/Impact:** 8/10 — High cultural/nostalgic value and educational engagement; great preservation museum for discontinued software.
- **Implementation of Kiro:** 8/10 — Thorough spec-driven specs (`.kiro/specs/`), clear steering docs, and an automated asset attribution hook (`assets-credits.mjs`), though missing committed MCP configs or dedicated agent definitions.
- **Quality of Idea:** 9/10 — Fitting "Resurrection" theme: summoning dead software via ritual magic with live AI generation (Muse Spark) and retro game tributes.
- **Design/Polish:** 9/10 — Pixel art, dynamic contact/cast shadows, walk bob, rich spatial audio, witch fly-by, minimap/fast-travel, and low-end GPU fallback.
- **Presentation:** 7/10 — Well-structured README and detailed specs, but demo video and visual media (screenshots/GIFs) are not yet linked.
- **Average Score:** 8.2 / 10

---

## Findings

1. **[P0] [ClickyChat.ts:280](file:///workspace/raise-dead/src/graves/clippy/ClickyChat.ts#L280)** — **Typing in Clicky chat does not stop key propagation.** Unlike [UnmarkedGrave.ts:76](file:///workspace/raise-dead/src/graves/unmarked-grave/UnmarkedGrave.ts#L76), typing 'J' or 'Tab' in the chat input triggers Phaser's [UIScene](file:///workspace/raise-dead/src/scenes/UIScene.ts#L170-L174) map toggle.
   - *Fix:* In [ClickyChat.ts](file:///workspace/raise-dead/src/graves/clippy/ClickyChat.ts#L280), add `this.inputEl.addEventListener('keydown', (e) => e.stopPropagation());`. `[SAFE-FIX]`

2. **[P0] [package.json:12](file:///workspace/raise-dead/package.json#L12)** — **`npm run lint` fails immediately.** `eslint` is missing from `devDependencies`, no eslint configuration exists, and `worker/` directory does not exist (`eslint src/ worker/`). Violates submission check REQ-DS-11.
   - *Fix:* Change line 12 to `"lint": "tsc --noEmit && tsc -p functions --noEmit"`. `[SAFE-FIX]`

3. **[P1] [raise.ts:53](file:///workspace/raise-dead/functions/api/unmarked/raise.ts#L53)** — **Unhandled error before try/catch in API endpoint.** If `IP_SALT` is missing or IP hashing fails, `getIpKey` throws outside the `try/catch` block, returning an unhandled 500 error without JSON structure or quota refund.
   - *Fix:* Wrap lines 50–55 in a `try/catch` returning `reply({ error: 'internal' }, 500)`. `[SAFE-FIX]`

4. **[P1] [UnmarkedGrave.ts:164](file:///workspace/raise-dead/src/graves/unmarked-grave/UnmarkedGrave.ts#L164)** — **Window message event listener leak.** The `rd-error` message listener attached via `window.addEventListener('message', onMsg)` is never removed on `dispose()`, leaking memory and targeting detached DOM elements on subsequent raises.
   - *Fix:* Save `onMsg` as a private property and call `window.removeEventListener('message', this.onMsg)` inside `dispose()`. `[SAFE-FIX]`

5. **[P1] [graves.json:81](file:///workspace/raise-dead/public/data/graves.json#L81)** — **Google Reader resurrection discrepancy.** The pitch and `.kiro/specs/deploy-and-submission/requirements.md` describe Google Reader RSS resurrection via `/api/feed`, but `graves.json` marks it `"resurrectable": false` (decorative only) with no backend RSS feed implemented.
   - *Fix:* Update [README.md](file:///workspace/raise-dead/README.md) and submission materials to clearly identify Google Reader as an epitaph-only memorial while emphasizing the 9 active playable tributes. `[SAFE-FIX]`

6. **[P2] [reply.ts:76](file:///workspace/raise-dead/functions/api/eliza/reply.ts#L76)** — **Upstream error message leakage.** In `/api/eliza/reply`, the catch block returns `reply({ error: 'upstream', why: String((e as Error)?.message || e).slice(0, 60) }, 502)`, leaking upstream endpoint details.
   - *Fix:* Return `reply({ error: 'upstream' }, 502)`. `[SAFE-FIX]`

7. **[P2] [GraveOverlay.ts:218](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L218) & [ResurrectionRitual.ts:145](file:///workspace/raise-dead/src/scenes/ResurrectionRitual.ts#L145)** — **Redundant global Esc listeners.** Both classes register independent global keydown listeners for `Escape` during the overlay phase.
   - *Fix:* Delegate Escape exclusively to `GraveOverlay` or guard with a single event source. `[SAFE-FIX]`

8. **[P2] [CREDITS.md:111](file:///workspace/raise-dead/CREDITS.md#L111)** — **GPL-2.0 engine in MIT repository.** DOOM (`websockets-doom.wasm`) is GPL-2.0. While isolated inside an iframe in `public/games/doom/`, distributing GPL binaries requires ensuring downstream source code links remain intact.
   - *Fix:* Maintain clear separation notice and source links in in-game credits and README. `[SAFE-FIX]`

---

## Top 5 cheap score improvements (README/docs/.kiro/presentation)

1. **Add Demo Video URL at the top of README:** Devpost judges review video first. Link the public <3 min YouTube video right under the title badge.
2. **Add a "Built with Kiro" narrative section:** Add 2–3 paragraphs in [README.md](file:///workspace/raise-dead/README.md) showing the spec-driven development loop: prompt → `.kiro/specs/` → `.kiro/steering/` → Kiro CLI generation → automated hook (`.kiro/hooks/assets-credits.mjs`).
3. **Showcase all 9 playable resurrections in README:** README currently lists only 4–5 tributes. Highlighting **Star Cadet (Space Cadet Pinball)**, **3D Pipes**, **DOOM (1993)**, **Pac-Man**, **SkiFree**, and **ELIZA (1966)** demonstrates vast breadth.
4. **Embed Visual Assets in README:** Add a 10-second gameplay GIF or side-by-side screenshots of the graveyard at night, the holy light ritual, and Clicky's dialogue tree.
5. **Add a Devpost Write-up file:** Create `DEVPOST.md` summarizing Inspiration, What it does, How we built it with Kiro & Meta Muse, Challenges, and Accomplishments to simplify entry submission.

---

## Rule-compliance risks

- **Demo Video Missing in Repo:** Kiroween requires a public YouTube video under 3 minutes. The shot list is defined in `.kiro/specs/deploy-and-submission/design.md#L110`, but no link is yet present in `README.md`.
- **Substantial Difference Check:** **Zero overlap risk.** "Ghost from the Past" is a browser extension + worker exposing personal reading history via an MCP server in the *Frankenstein* category. "Raise Dead" is an exploration game with Phaser 3, WebGL lighting, procedural audio, and Meta Muse Spark generation in the *Resurrection* category. They share no UI, no runtime, and solve unrelated problems.
- **Licensing & Assets:** The project uses an OSI-approved MIT license. All assets have documented provenance in [CREDITS.md](file:///workspace/raise-dead/CREDITS.md). Vendored GPL-2.0 code (DOOM engine) is sandboxed in a standalone iframe.
EXIT 0
