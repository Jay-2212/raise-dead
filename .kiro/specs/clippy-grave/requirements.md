# Clippy Grave — Requirements

## Overview
"Clip the Ghost" — an original ghost-paperclip character driven by the ms-agent-js MIT runtime, wired to Meta Muse Spark for AI responses. All art is original; no Microsoft agent sprites are used.

## Source restrictions (hard rules)
- **Never** use `agents/Clippy/`, `agents/Bonzi/`, or any other character folder from `clippyjs/clippy.js` or `azayrahmad/ms-agent-js`'s `public/` directory.
- Create an original `Paperclip/` agent bundle: `agent.json` (animation manifest), `map.webp` (WebP sprite atlas), `sounds.webm` (WebM audio sprite).
- Tombstone may read "Clippy (Office Assistant), 1997–2007" as a nominative reference; no Microsoft Office logo.

## User stories (EARS format)

### Character display
- **REQ-CL-01** When the Clippy overlay opens, the system shall load the Paperclip agent from `/agents/Paperclip/` using `ms-agent-js` and render it in the lower-right corner of the overlay.
- **REQ-CL-02** The agent shall play its `Greeting` animation on load, then transition to `Idle`.
- **REQ-CL-03** The agent shall support at minimum these animations: `Idle`, `Greeting`, `Wave`, `Thinking`, `Writing`, `LookLeft`, `LookRight`, `GetAttention`, `Explain`, `Goodbye`.

### AI chat
- **REQ-CL-04** A text input labelled "It looks like you need help…" shall appear above the agent; pressing Enter shall submit the user message.
- **REQ-CL-05** On submit, the system shall `POST /api/ai` with `{ model: "muse-spark", messages: [...] }` (system prompt: "You are Clip the Ghost, a helpful and slightly dramatic AI assistant channelling the spirit of Clippy. Respond in character, briefly.").
- **REQ-CL-06** While waiting for the response, the agent shall play its `Thinking` animation.
- **REQ-CL-07** When the response arrives, the agent shall play `Explain` and display the response text in a speech balloon via `ms-agent-js` `speak()`.
- **REQ-CL-08** If the API call fails, the agent shall play `GetAttention` and display "I seem to be having a ghostly connection issue."
- **REQ-CL-09** The conversation history (last 6 turns) shall be included in each API call for context.

### Oxion fallback
- **REQ-CL-10** When the Worker receives the request with no available Meta API quota, it shall re-issue the request to the Oxion endpoint and return the result transparently.

### UX
- **REQ-CL-11** The overlay background shall be a dark semi-transparent panel evoking the old Office Assistant balloon aesthetic (cream/yellow tint) without copying Microsoft's visual design.
- **REQ-CL-12** The agent can be dragged to any position within the overlay by the player.

## Acceptance criteria
- AC1: No Microsoft sprite files exist anywhere in the repo (`git grep` for `agents/Clippy` returns empty).
- AC2: The Paperclip agent animates through `Greeting → Idle` on open.
- AC3: Submitting a message triggers an API call and the agent speaks the response.
- AC4: Speech balloon text is legible at default overlay size.
- AC5: Oxion fallback activates when `X-Meta-Quota-Exceeded` header is present in the Worker's upstream response.
- AC6: CREDITS.md includes ms-agent-js attribution.
