# Unmarked Grave — Requirements

## Overview
The most AI-forward grave. The player types the name of any dead app; Muse Spark generates a sandboxed mini-app as an HTML/JS string; Muse Image generates a tombstone portrait. The generated app runs in a `sandbox="allow-scripts"` iframe (no `allow-same-origin`).

## User stories (EARS format)

### Input
- **REQ-UG-01** When the unmarked-grave overlay opens, the system shall display a single text input with placeholder "Name the lost one…" and a "Summon" button.
- **REQ-UG-02** The input shall accept 2–60 characters; the Summon button shall be disabled while empty or while a generation is in progress.
- **REQ-UG-03** While generating, the system shall display an animated rune/spinner and the text "Communing with the beyond…".

### App generation (Muse Spark)
- **REQ-UG-04** On Summon, the system shall POST to `/api/ai` with a structured prompt instructing Muse Spark to return a single self-contained HTML document (inline CSS + JS, no external imports) that is a playable mini-tribute of the named app.
- **REQ-UG-05** The system prompt shall include safety constraints: no `fetch()`, no `localStorage`, no `document.cookie`, no `eval()` beyond what is sandboxed; the generated app must be completable/dismissable from within the iframe (no navigation required).
- **REQ-UG-06** The Worker shall validate that the Muse Spark response is a non-empty string before returning it.
- **REQ-UG-07** The system shall inject the generated HTML into a `<iframe srcdoc="..." sandbox="allow-scripts">` element — no `allow-same-origin`, no `allow-forms`, no `allow-popups`.

### Tombstone portrait (Muse Image)
- **REQ-UG-08** Simultaneously with the app generation request, the system shall POST to `/api/ai` with a Muse Image prompt: "A moonlit stone gravestone with the name '[app name]' carved in gothic font, single image, dark gothic graveyard style, no text beyond the name."
- **REQ-UG-09** The returned image shall be displayed as the tombstone portrait in the overlay header and shall replace the generic unmarked-grave tombstone sprite in the graveyard for the remainder of the session.

### Error handling
- **REQ-UG-10** If the Muse Spark generation fails or returns an empty response, the system shall display "The spirits are silent tonight. Try another name." and re-enable the input.
- **REQ-UG-11** If the Muse Image call fails, the system shall silently use the default unmarked tombstone sprite (the app generation continues normally).

### Oxion fallback
- **REQ-UG-12** The Worker shall fall back to Oxion for both text and image calls if the Meta API is unavailable, returning the result transparently.

## Acceptance criteria
- AC1: Typing "Netscape Navigator" and clicking Summon triggers exactly one `/api/ai` text call and one image call.
- AC2: The generated app renders in the iframe without JavaScript errors in the host page console.
- AC3: The iframe has `sandbox="allow-scripts"` and no `allow-same-origin` attribute.
- AC4: An XSS attempt in the generated HTML (e.g. `<script>window.parent.eval('...')</script>`) cannot access the parent page due to sandbox.
- AC5: If generation takes > 15 s, a timeout error message is shown.
- AC6: The tombstone portrait image is displayed if the image call succeeds.
- AC7: CREDITS.md notes "Unmarked-grave app generated at runtime by Meta Muse Spark; tombstone portrait by Meta Muse Image."
