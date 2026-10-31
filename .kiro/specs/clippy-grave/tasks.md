# Clippy Grave — Tasks

## GraveApp scaffold
- [ ] 1. Create `src/graves/clippy/index.ts` exporting `ClippyGrave` implementing `GraveApp`.
- [ ] 2. `mount()`: inject overlay HTML (header, agent-container, chat-area, form) into container.
- [ ] 3. `dispose()`: call `agent.dispose()` if ms-agent-js exposes it; remove event listeners; clear DOM.

## ms-agent-js setup
- [ ] 4. Add `ms-agent-js@0.5.1` to `package.json`.
- [ ] 5. In `mount()`, `import { Agent } from 'ms-agent-js'`; instantiate `new Agent('/agents/Paperclip/')`.
- [ ] 6. Call `await agent.load()`; call `agent.renderIn(document.getElementById('agent-container'))`.
- [ ] 7. After render, call `agent.play('Greeting')`, then on animation end call `agent.play('Idle')`.
- [ ] 8. Add ms-agent-js credit to CREDITS.md.

## Paperclip character bundle (original art)
- [ ] 9. Create 10 animation frames for each animation: `Idle, Greeting, Wave, Thinking, Writing, LookLeft, LookRight, GetAttention, Explain, Goodbye` (≈ 100 frames total).
- [ ] 10. Pack all frames into a single WebP atlas `public/agents/Paperclip/map.webp`; update CREDITS.md noting "original art".
- [ ] 11. Create `public/agents/Paperclip/sounds.webm` — audio sprite with named clips for any speech-bubble sound effects.
- [ ] 12. Author `public/agents/Paperclip/agent.json` — animation manifest referencing atlas coordinates and audio sprite keys.
- [ ] 13. Verify agent loads and `Greeting` animation plays without console errors.

## Chat UI
- [ ] 14. Implement `submitMessage(text)` function — appends user message to `#chat-history`; calls `callAI(messages)`.
- [ ] 15. Implement `callAI(messages)`: POST to `/api/ai` with system prompt + last 6 turns; `agent.play('Thinking')` while awaiting; on success call `agent.play('Explain')` then `agent.speak(reply)`.
- [ ] 16. On API error, call `agent.play('GetAttention')` and `agent.speak("I seem to be having a ghostly connection issue.")`.
- [ ] 17. Append each exchange to `#chat-history` div (user: right-aligned, agent: left-aligned).
- [ ] 18. Disable submit button while request is in-flight.

## System prompt
- [ ] 19. Define `SYSTEM_PROMPT` constant in `src/graves/clippy/prompts.ts`:
  ```
  You are Clip the Ghost, the spectral spirit of Clippy. Respond in 1–3 sentences, in character, helpfully and dramatically.
  ```

## Worker AI endpoint
- [ ] 20. Create `worker/ai.ts` — `handleAI()` function (see unmarked-grave design for full implementation).
- [ ] 21. Implement Oxion fallback: if Meta returns 429, retry with `OXION_API_KEY` + `OXION_BASE_URL`.
- [ ] 22. Set `Content-Type: application/json` and CORS header on all responses.

## Drag behaviour
- [ ] 23. Add `pointerdown/pointermove/pointerup` listeners on `#agent-container` to allow drag within overlay bounds.

## CSS
- [ ] 24. Style overlay: cream/yellow speech-balloon aesthetic; no Windows XP UI chrome; dark header; agent on right, chat on left.
- [ ] 25. Style `#chat-history`: scrollable, max-height 60% of overlay; speech-bubble bubbles per turn.

## QA
- [ ] 26. Confirm `public/agents/Paperclip/` contains no Microsoft files (`agent.json`, `map.webp`, `sounds.webm` only).
- [ ] 27. Submit a message; verify Network tab shows `POST /api/ai`; verify agent speaks response.
- [ ] 28. Disconnect from internet; verify fallback error message appears rather than crash.
