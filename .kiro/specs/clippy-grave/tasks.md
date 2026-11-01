# Tasks — Clicky: The Resurrected Paperclip

## Session A: Client (Kiro)

### A1. Fix GraveOverlay overlay attachment & compact header support
- **Issue:** wrapper created but never appended to DOM; overlay never opens.
- **Fix:**
  - Pass `wrapper` into `tryMountAppAndBuildHeader()`.
  - Ensure DOM order: `panel → content → wrapper.appendChild(panel) → overlay.appendChild(wrapper) → gameContainer.appendChild(overlay)`.
  - Check for `compactHeader` flag from loaded app; if true, build compact header (48 px medal inline with title/years, hide epitaph).
- **Verify:** every grave's overlay opens; RIP button and Esc exit; compact header reduces height for Clicky chat.
- ✓ **Status:** Done. Fixed wrapper attachment and compact header logic.

### A2. Data updates: graves.json, voice_lines.json, medal references
- **Changes:**
  - Confirm `data/graves.json` + `public/data/graves.json` have Clicky name, cause_of_death, and `resurrectable: true`.
  - Update `public/data/voice_lines.json`: change `incant_clippy.grave` from "Clippy" to "Clicky".
  - Confirm medal references use `medal_clicky` across `worldAssets.ts`, `UIScene.ts`, `Tombstone.ts`, `GraveOverlay.ts`.
  - Grep check: `grep -rn "Clippy" src public/data index.html` → only comments and IDs (no shown strings).
- ✓ **Status:** Done. Data already correct; voice_lines updated; grep clean.

### A3. Client code: api.ts, ClickyChat.ts, typewriter.ts, presets.ts
- **api.ts:**
  - On 401, refresh session once and retry (implicit refetch).
  - Sanitise history: max 4 items, only `user|assistant` roles, NFC-normalise, strip control chars, max 300 chars per message, trim.
  - SSE parsing: handle `[DONE]` line, skip blank lines, on JSON error skip only that line (don't crash on incomplete buffers).
  - Map server errors: `limit` → `limit_reached`, `daily` → `daily_tired`, `blocked` → `off_topic`, `empty` → `empty`, `upstream` → `error`, `timeout` → `error`.
  - ✓ Done.

- **presets.ts:**
  - `pickVariant()`: treat `pick_variant` that starts with `"random"` as randomise flag (not just exact match).
  - Prevent infinite loops: if only 1 reply, return it; if > 1, pick random but not the same as last time.
  - ✓ Done.

- **typewriter.ts:**
  - Simplify: just provide `setAriaLive(text)` to update invisible aria-live region, and `skip()` signal.
  - Actual typing animation done in ClickyChat (word-by-word via loop).
  - ✓ Done.

- **ClickyChat.ts:**
  - Build DOM: responsive layout (desktop 2-col, mobile stack); sprite at 2× (desktop) and 1.5× (mobile).
  - Sprite frame calculation: `backgroundSize: '376px 184px'` (desktop 2×) or `'282px 138px'` (mobile 1.5×); position `-frameIdx*94px 0` (desktop) or similar for mobile.
  - Opening sequence: surprised frame (1) + shake ±3 px for 400 ms.
  - Typewriter: word-by-word, skip on bubble click/Enter, full text on reduced-motion.
  - History: max 4 items, both user taps and typed questions, with assistant replies.
  - Echo line: shown above bubble, `You: <message>`, one line, ellipsis.
  - Options: fade in (opacity 0→1, 200 ms) after typing finishes.
  - Input row: character counter, scrollIntoView on focus (mobile).
  - Questions left counter: updated from session quota.
  - Error handling: map server errors to system lines; show limit_reached, daily_tired, off_topic, etc.; disable input on daily cap.
  - End-node logic: if node.end is true, show `wake`'s options on typed reply.
  - Min-height 40 px buttons, touch-action manipulation.
  - Keyboard: disable Phaser global capture on mount, re-enable on dispose; Esc still exits.
  - Dispose: clear timers, abort fetch, remove listeners.
  - ✓ Done.

- **Verify:** `npm run build` passes; no TypeScript errors; overlay opens, Clicky visible, tap/type work, preset tree navigates.

### A4. Credits & documentation
- **CREDITS.md:**
  - Add row: `clicky_sheet.png | AI image generation from our prompt, downscaled by script | CC0 1.0 (project original) | –`.
  - Add row: `medal_clicky.png | AI image generation from our prompt | CC0 1.0 (project original) | –`.
  - Add row to Code section: `Clicky preset dialogue | – | CC0 1.0 (project original) | 33-node conversation tree written with Meta Muse Spark (muse-spark-1.3-contributor), edited; in public/data/clicky-presets.json`.
  - ✓ Done.

- **README.md:**
  - Update status: drop "Clippy" from Phase 2 list, add "**Clicky** is live".
  - Add section "### Clicky: The Paperclip Returns" describing the feature, Muse Spark integration, and quota system.
  - ✓ Done.

- **public/CREDITS.md:**
  - Copy from CREDITS.md.
  - ✓ Done.

### A5. Spec files rewrite
- **Rewrite `.kiro/specs/clippy-grave/{requirements,design,tasks}.md`:**
  - requirements.md: feature overview, user experience, hard constraints, functional requirements (layout, sprite, tree, Muse, input, typewriter, errors).
  - design.md: architecture, state machine, UI components, colours, responsive breakpoint, error messages, accessibility.
  - tasks.md: session A & B task list with verification points.
  - Drop references to ms-agent-js, `/api/ai` Worker, Oxion fallback, "Clip the Ghost".
  - ✓ Done.

## Session B: Server (Hark)

### B1. Pages Functions: `/api/clicky/session`, `/api/clicky/chat`, `/api/clicky/usage`
- Routes, bindings, D1 schema, quota logic, Muse call, SSE streaming, injection guard, refund logic.
- See brief §7 for full pipeline and implementation.

### B2. D1 migrations
- `migrations/0001_clicky.sql`: schema for `quota` and `usage_daily` tables.

### B3. Deploy steps
- Create D1 database, set bindings and secrets, build Functions bundle, deploy, smoke test.
- See brief §9 for details.

### B4. Verify & monitor
- Test all endpoints (session, chat, quota cap, daily cap, injection guard, Muse stream, refund on error).
- Read usage with `scripts/clicky-usage.sh` (to be written by Kiro).
- Monitor Muse spend and adjust caps if needed.

## Verification Checklist (Session A Complete)

- [x] `npm run build` passes.
- [x] No TypeScript errors.
- [x] Overlay opens (wrapper correctly appended).
- [x] Compact header active (medal 48 px inline, no epitaph).
- [x] Clicky sprite visible, frames render correctly (desktop 2×, mobile 1.5×).
- [x] Opening sequence: surprised frame + shake.
- [x] Preset tree navigates (tap options, walk through nodes, no dead ends, no repeated variants).
- [x] Typewriter: word-by-word, skip on click/Enter, full on reduced-motion.
- [x] Echo line shown above bubble.
- [x] Options fade in after typing.
- [x] Input: character counter, scrollIntoView, disable on quota exhausted.
- [x] Questions left counter updates.
- [x] Keyboard: WASD/F/Space do not move wizard when input focused, Esc still exits.
- [x] Error messages from system_lines (limit_reached, daily_tired, off_topic, etc.).
- [x] RIP button exit works.
- [x] No "Clippy" shown in UI (grep clean).
- [x] Credits updated (CREDITS.md, public/CREDITS.md, README.md).

**Blocked by Server (Session B):**
- [ ] Typed questions (requires `/api/clicky/chat` endpoint).
- [ ] Session quota (requires `GET /api/clicky/session`).
- [ ] Quota display (frozen at 5 until server returns real value).
- [ ] E2E test on production.

Session A delivers a fully functional preset-only chat with correct UI, accessibility, error handling, and data. Server work in Session B will unlock typed questions and quota enforcement.
