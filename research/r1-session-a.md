# Review round 1 — Kiro Session A (code-only fixes)

Read `research/review-round-1.md` in full first. It is the authoritative brief, with exact file/line references and fixes. Ignore the "Reviewer claims checked and rejected" section.

In THIS session implement only:
- P0-1 … P0-6 (all six)
- P1-1 … P1-8
- P1-16, P1-17, P1-18
- P2-1 (only the `window.__RD` part: expose `window.__RD` only when `import.meta.env.DEV` is true OR the URL has `?debug=1`; the demo hotkeys part is optional, `?demo=1` only)
- P2-17 (touch copy "Tap F to raise the dead" when the joystick is active)
- P2-7 and P2-8 if quick.

Do NOT do Session B items yet (fonts self-host, CSP, BASE_URL paths, preload split, audio re-encode, sprite glow, repo cleanup, CREDITS). Do not touch `assets/`, `public/assets/`, `research/`, or `scripts/`.

Notes:
- Mobile (P0-5): the joystick + F button must live in UIScene (camera zoom 1), be visible and inside the 1280x720 canvas (e.g. stick bottom-left ~ (140,580), F button bottom-right ~ (1140,600)), shown when `?touch=1` or on a touch device, hidden during the ritual, overlay and credits, shown again after exit. Normalise stick force to [-1,1].
- P0-1: pressing F (or the mobile F button) at any time while a ritual or overlay is running must do nothing.
- Keep TypeScript strict: `npm run build` must pass with zero errors. Run it at the end and fix until it passes.
- Finish with a short summary listing each item ID and what you changed (or why skipped).
