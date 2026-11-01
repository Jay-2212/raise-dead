# Requirements — Clicky: The Resurrected Paperclip

## Feature Overview
When the wizard raises the Clicky grave (`id: "clippy"`, at map position 1280, 710), the overlay opens a chat UI where the player can interact with a cheerful ghost paperclip resurrected from Office 97. The experience combines a preset branching dialogue tree (33 nodes) with optional typed questions answered by Meta Muse Spark in real time, subject to generous but enforced lifetime and daily quotas.

## User Experience
- **Preset path (free):** player taps one of 3 dialogue options at each node; Clicky responds instantly with a typed-out animation.
- **Typed path (quota-limited):** player types a custom question; it is sent to a Cloudflare Pages Function, which calls Meta Muse Spark (muse-spark-1.3-contributor, reasoning model) and streams the reply back with a typewriter animation.
- **Quota system:** 5 typed messages per IP (lifetime), 5 per browser token (lifetime), plus a global daily cap. Presets never consume quota and always work.
- **Personality:** Clicky is amazed to be alive, warm and nosy, with paper and office puns. He knows nothing after 2007 except the graveyard. He never claims Microsoft affiliation and always stays in character.

## Hard Constraints (Policy & Branding)
- **Name:** Only "Clicky" may appear in any UI text (plaque, overlay title, alt text, aria-labels, button labels, chat). Internal IDs and asset keys may keep `clippy` (e.g., `incant_clippy`).
- **Art:** No Microsoft art, logos, sounds or animations. Use only original art (`clicky_sheet.png`, `medal_clicky.png`) generated from our own prompt for this project, and no `ms-agent-js` or `clippy.js` code.
- **Safety:** Model output shown with `textContent` only (never `innerHTML`). User text never logged. API key lives only in Pages secret (`MODEL_API_KEY`).
- **Favicon & Credits:** Mark the work: add Clicky credits to `CREDITS.md` (assets and preset tree), copy it to `public/CREDITS.md`, and add a short feature paragraph to `README.md`.

## Functional Requirements

### 1. UI Layout (Compact Header in Overlay)
- Extend `GraveApp` with optional `compactHeader?: boolean` flag. When set by Clicky, `GraveOverlay` shrinks the medal to 48 px, inlines it with title and years, hides epitaph and placeholder, and lets the chat container take the remaining height.
- Desktop (≥ 640 px): two columns — sprite (2× scale, 94×184 px) on left, chat on right.
- Mobile (< 640 px): stack vertically — sprite (1.5× scale, 70.5×138 px) at top, chat below.
- Speech bubble, echo line, options, and typed input row. All with navy `#0e1526` background, mint `#d9f2ee` text, gold `#c9b98a` borders.
- Buttons styled with 2 px borders, min-height 40 px, touch-optimised.

### 2. Chat Sprite Animation
- **Sheet:** 188×92 px, 4 frames (47×92 each): 0 idle, 1 surprised, 2 talk, 3 sad. Rendered at 2× on desktop (94×184), 1.5× on mobile (70.5×138). Pixel-art rendering.
- **Mood-to-frame mapping:** surprised→1, happy→2, thinking→0, sad→3, wink→2.
- **Floating animation:** idle bob ±3 px, 2.4 s ease-in-out.
- **Opening sequence:** show surprised frame (1) and shake ±3 px for 400 ms, then type the greeting.
- **Typing animation:** alternate frame 2 (talk) with the mood frame every 180 ms while typing; hold the mood frame once typing finishes.
- **Waiting for Muse:** slow 2 px bob with frame 0.

### 3. Preset Dialogue Tree
- Load from `public/data/clicky-presets.json`.
- 33 nodes, start node `"wake"`. Each node has mood, 3 reply variants, 3 options (or 1 on end nodes), and an `end` flag.
- On each node visit, pick a random variant (not the same as the last time this node was shown) if `pick_variant` starts with `"random"`, else use first.
- For each tap, add `{role:'user', content: label}` to history, go to the next node, show its reply, add `{role:'assistant', content: reply}` to history. Keep only the last 4 messages.
- On the end node (`rip`), show one option ("Wake him again") that loops back to `wake`.

### 4. Typed Questions & Muse Spark Integration
- Player types a question (1–200 characters). On Enter or Ask button tap:
  - Trim and validate (length > 200 shows error locally, no quota charge).
  - Show a random `thinking` line while waiting.
  - Disable input and options.
  - Call `POST /api/clicky/chat` with message and last 4 history items.
  - Stream response word by word into the speech bubble via typewriter.
  - Re-enable input; if the current node has `end: true`, show `wake`'s options; otherwise show current node options.
  - Keep typed reply + Muse response in history (capped at 4 total messages).
- **Session flow:** call `GET /api/clicky/session` on mount to get remaining quota. If 401, refresh once and retry on next chat.
- **Quota UX:**
  - Display `Questions left: N` (from session).
  - When `remaining === 0`, disable input with placeholder text "Clicky is out of words for you. Tap a question above!" and show a `limit_reached` line once.
  - When server returns `daily`, disable input for the rest of the visit and show `daily_tired` line.
  - Presets always work.

### 5. Keyboard & Input Handling
- While overlay is open, typing in the chat input does not move the wizard, trigger F, or be swallowed by Phaser.
  - Call `scene.input.keyboard.disableGlobalCapture()` on mount, re-enable on exit.
  - Ignore game key handlers when `document.activeElement` is an input.
- **Esc** still exits the overlay from any focus state.
- **Enter** in the input submits; **Space** in the input inserts a space (not swallowed).

### 6. Typewriter & Accessibility
- **Animation:** split reply on whitespace, append one word every `typewriter_ms_per_word` (55 ms from preset).
- **Skip:** click/tap on the speech bubble or press Enter while typing skips to full text.
- **Reduced motion:** show full text at once.
- **Aria-live:** once the line finishes (or is skipped), set an invisible `aria-live="polite"` region to the full text (not word by word).
- **Mobile:** use `scrollIntoView({block:'nearest'})` on input focus to keep it visible when the on-screen keyboard opens.

### 7. Error Handling & Fallback
- If preset JSON fetch fails, show a hard-coded error line and keep the typed path working (presets gracefully degrade).
- If a typed question fails (network, timeout, Muse error, upstream 429), show an `error` or `upstream` system line and do not charge quota (refund on the server).
- Model output is cut at 400 characters on a sentence boundary by the server.

## Out of Scope (Session A)
- Turnstile CAPTCHA (implemented on the server if `TURNSTILE_SECRET` is set; client support is minimal UI adjustments).
- Server-side D1, quota logic, Muse call, and Pages Functions (handled in Session B by Hark).
- End-to-end testing on production (verified by Hark during deploy).
