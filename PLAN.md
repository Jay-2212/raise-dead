# Raise Dead — Graveyard of Lost Apps (Kiroween + Meta Global AI Dev Hackathon)
Owner: Jay Bharti (GitHub Jay-2212). Deadlines: Meta Nov 5 07:30 IST (Nov 4 9PM ET); Kiroween Dec 5 03:30 IST but aim Nov 6.
## Concept
Moonlit 2D top-down graveyard (Plants vs Zombies night-lawn feel). Player = wizard, WASD walk. Stand at tombstone (name, born–died years, epitaph, portrait) -> press F -> exorcism ritual (incantation spoken + on-screen runes, wind rises, ground shakes) -> stone cracks -> holy white light floods screen (light-burst SFX + choir) -> fades into a WORKING rebuilt app in an overlay. Exit: "Rest in peace" button / Esc -> app sinks back into grave, light fades, back in graveyard.
Atmosphere: dark blue moonlight, full moon, bare twisted trees, falling leaves (particles), fog, glowing carved jack-o'-lanterns, fireflies/wisps, crows. Ambient: wind howl loop, distant owl/crow, faint ghost whispers, footsteps on cold soil/gravel, low drone music.
## Launch graves (rebuilt tributes, original code or permissively licensed OSS with attribution; no original logos/ROMs/screenshots)
1. Road Rash tribute (one playable level) 2. Google Reader (real RSS) 3. Clippy (AI helper, Meta Muse Spark) 4. Winamp (webamp, MIT) 5. Unmarked Grave: type any dead app -> Muse Spark generates a playable mini-version (sandboxed iframe), Muse Image carves tombstone.
Plus decorative graves (non-interactive) from Killed-by-Google style data.
## Stack
Phaser 3 + TypeScript + Vite; Cloudflare Pages + Worker proxy (Meta Model API key hidden; Oxion fallback). Kiro CLI is the coding harness; repo root has /.kiro (specs, hooks, steering). Public GitHub repo.
## Folders
assets/images, assets/audio, assets/voice, research/, data/. Every third-party asset/code goes in CREDITS.md with source URL + license. Only CC0 / CC-BY / MIT / Apache / BSD style; no YouTube rips, no NC/ND, no GPL code copied into the repo unless whole-app isolated and noted.

## Meta Model API usage (Oct 31 2026)
- Base URL https://api.meta.ai/v1, env MODEL_API_KEY (Hark service `meta-model-api`). Key works with no card on file.
- Default model: muse-spark-1.3-contributor (cheaper Contributor mode) to stretch the $150 free credits; Jay is fine with Meta using the data. Keep max_tokens tight; avoid Muse Wonder unless needed.

## Review & polish loop (Jay, Oct 31 2026)
- After each Kiro build phase: run multiple rounds of code review, security review and polish suggestions using outside models (Gemini, Muse, Grok, etc.). Feed their findings back to Kiro, which makes the code changes (Kiro stays the code-writing harness). Repeat until reviewers stop finding meaningful issues.
- Muse: always use muse-spark-1.3-contributor (cheapest) to stretch the $150 free credits; budget is tight.

## Reviewer tools (set up Oct 31 2026; review only, Kiro is still the only tool that writes code)
All CLIs live in /workspace/kirohome/.local/bin and keep their sign-in under HOME=/workspace/kirohome. Free tiers only.
- **Google Antigravity CLI (`agy` 1.4.12)**: signed in with Jay's Google account (jaybharti3000@gmail.com). Default model Gemini 3.8 Flash (High). `agy models` also lists gemini-3.8-flash-medium/low, claude-sonnet-4-6, claude-opus-4-6-thinking and gpt-oss-120b-medium.
  - Wrapper: `/workspace/kirohome/.local/bin/review-agy "Security-review src/ for XSS and secret leaks" [--model claude-sonnet-4-6] [--output-format json]`
  - Raw command: `HOME=/workspace/kirohome NO_PROXY=googleapis.com,.googleapis.com,google.com,.google.com,antigravity.google,.antigravity.google no_proxy=$NO_PROXY agy -p "<prompt>" --print-timeout 600s` (run it from /workspace/raise-dead).
  - The NO_PROXY bypass is required: the sandbox proxy replaces Google auth headers, which makes the call fail with "insufficient authentication scopes".
  - In headless mode the default permission mode can read files but quietly refuses shell commands and edits, so it works as a read-only reviewer. Don't use `--mode plan`, which tries shell commands that then get refused, and never use `--dangerously-skip-permissions`.
  - To sign in again, run `agy` from a pty under SSH env vars, pick Google OAuth, open the URL with the browser tool (start_url on antigravity.google) and paste the code back. The token is saved in ~/.gemini/antigravity-cli/antigravity-oauth-token.
- **Grok CLI (`grok` 1.0.70, official xAI "Grok Build")**: signed in through grok.com with Jay's Google account via `grok login --device-auth`. Default model grok-4.7; also grok-4.7-build-fast, grok-4.6 and grok-4.5. Free usage is capped by a weekly limit shown on grok.com.
  - Wrapper: `/workspace/kirohome/.local/bin/review-grok "Code-review src/scenes for bugs" [-m grok-4.7-build-fast]`
  - Raw command: `HOME=/workspace/kirohome grok -p "<prompt>" --permission-mode plan --output-format plain` (run it from /workspace/raise-dead). `--sandbox read-only` doesn't work here because bubblewrap is missing.
  - The token lasts about 7 to 30 days. To renew it, run `grok login --device-auth` and approve the code in the browser session `grok`.
- **Grok web**: browser session `grok` is signed in to grok.com and can be used for paste-in reviews.
- **Muse**: through the Meta Model API, muse-spark-1.3-contributor (see above).
- **Gemini CLI**: dropped. Google stopped accepting it for personal accounts ("migrate to Antigravity"), and `agy` replaces it.
