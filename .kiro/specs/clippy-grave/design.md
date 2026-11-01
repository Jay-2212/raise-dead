# Design — Clicky: The Resurrected Paperclip

## Architecture
```
GraveOverlay (mounts)
  ├─ wrapper (fixed inset, flex center)
  │  └─ panel (styled with frame border)
  │     └─ content (navy background)
  │        ├─ headerRow (compact: medal 48px + title/years inline)
  │        ├─ #grave-app-container (flex: 1; min-height: 0)
  │        │  └─ ClickyChat (DOM)
  │        │     ├─ spriteEl (background-size: 376px 184px; positions by frame)
  │        │     ├─ bubbleEl (speech bubble, click to skip typewriter)
  │        │     ├─ echoEl (shows last user message)
  │        │     ├─ optionsEl (3 buttons, fade in after typewriter)
  │        │     ├─ inputEl + counterEl + askBtn (full-width row)
  │        │     └─ questionsLeftEl (quota counter)
  │        └─ Requiescat in pace button
  └─ overlay (fade in/out with panel)

Client flow:
1. mount() → loadPresets() → getSession() → buildDOM()
2. showNode(currentNodeId) → typeOutReply() → showOptions()
3. (tap option) → handleOptionSelect() → showNode(nextNodeId)
4. (type question) → handleTypedSubmit() → sendChat() → stream words → showOptions(currentNode)
5. unmount() → dispose()
```

## State Machine (ClickyChat)
- **currentNodeId:** the active conversation node (e.g., "wake", "dead_like", "rip").
- **history:** array of {role, content}, max 4 items. Both taps and typed questions go here.
- **busy:** true while typing or waiting for Muse; prevents concurrent input.
- **remaining:** lifetime quota (from session, decremented by server on each typed message).
- **dailyClosed:** true if server returned `daily` error; disables input for the visit.
- **lastVariant[nodeId]:** tracks the last shown variant per node (prevents immediate repeats).

## UI Components

### Sprite (Media Queries Handled)
- Desktop: `width: 94px; height: 184px; background-size: 376px 184px; filter: drop-shadow(0 0 8px #7fd1d8aa); animation: clicky-float 2.4s ease-in-out infinite;`
- Mobile: scale 1.5× (70.5×138), same animation.
- Frame position: `-frameIdx * 94px 0` (0, -94px, -188px, -282px for frames 0–3 on desktop; -70.5px, -141px, -211.5px, -282px on mobile).
- Opening: show frame 1, shake ±3 px for 400 ms.
- Typing: alternate frame 2 and mood frame every 180 ms.
- Idle: stay on mood frame with float animation.

### Speech Bubble
- Background `#16213a`, border `2px solid #c9b98a`, radius 6 px, padding 14×18 px.
- Min-height 4.5 em (ensures 3 lines at 1.05 rem font size).
- Line-height 1.45, font-size 1.05 rem, colour `#d9f2ee`.
- Click to skip typewriter (event listener on bubble itself).
- `textContent` only (no `innerHTML`).

### Echo Line (User Message)
- Font-size 0.85 rem, colour `#5d6b80`, one line, ellipsis.
- Shows `You: <last user message>` (tap option or typed question).
- Updated before the assistant reply is shown.

### Options (3 Buttons)
- Transparent background, `2px solid #c9b98a` border, `#c9b98a` text.
- On hover/focus: `#d9f2ee` text, border, and `0 0 8px #7fd1d8` glow.
- Fade in (opacity 0→1, 200 ms) only after typewriter finishes.
- Min-height 40 px, padding 8×14 px, `touch-action: manipulation`.
- Gap 8 px between buttons.

### Input Row
- Input: `background: #0b1120; border: 2px solid #3a4a66; focus border: #7fd1d8; padding: 8×12 px; font-size: 0.95 rem; outline: none; touch-action: manipulation.`
- Placeholder: `Ask Clicky anything...`
- Maxlength 200, live character counter (0/200).
- Ask button: same styling as options, min-height 40 px.
- `scrollIntoView({block:'nearest'})` on focus (mobile keyboard support).
- Hint text above (0.8 rem, `#5d6b80`): `greeting_typed_hint` from presets.

### Questions Left
- Below the input row: `Questions left: N` (0.8 rem, `#5d6b80`).
- Updated from `remaining` field on each session response.
- When input is disabled: placeholder text and/or visual signal.

## Colours & Typography
- Navy: `#0e1526` (background).
- Mint: `#d9f2ee` (primary text).
- Gold: `#c9b98a` (borders, buttons, inactive text).
- Teal glow: `#7fd1d8` (shadow, focus state).
- Muted: `#5d6b80` (secondary text).
- Phaser overrides: `scene.input.keyboard.disableGlobalCapture()` / `enableGlobalCapture()`.

## Responsive Breakpoint
- **Desktop (≥ 640 px):** two-column layout (sprite left, chat right).
- **Mobile (< 640 px):** stacked layout (sprite top, chat below full-width).

## Error Messages (from system_lines)
- `greeting_typed_hint`: instruction text.
- `thinking`: shown while Muse is responding (random choice).
- `limit_reached`: shown when quota is exhausted.
- `daily_tired`: shown when daily cap is hit (input disabled for the visit).
- `too_long`: input validation error (> 200 chars, no charge).
- `off_topic`: jailbreak attempt detected (no charge).
- `empty`: Muse returned no content (refunded).
- `error`: generic error (refunded).

## Accessibility
- Speech bubble is clickable to skip typewriter (keyboard: Enter while focused).
- Aria-live region (invisible) announces the full line once typed.
- Min button heights 40 px for touch devices.
- `prefers-reduced-motion: reduce` disables float animation and typewriter, shows text at once.
- Input has labels via placeholder and hint text.
