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
- **Grok CLI (`grok` 1.0.70, official xAI "Grok Build")**: signed in through grok.com with Jay's Google account via `grok login --device-auth`. Default model grok-4.7; also grok-4.7-build-fast, grok-4.6 and grok-4.5. Jay has paid SuperGrok: weekly limit shown in Grok app Usage (Oct 31 20:38: only 3% used after round-1 review; resets Mon 2 Nov 12:03 IST). Plenty of headroom; use Grok freely as main reviewer/planner.
  - Wrapper: `/workspace/kirohome/.local/bin/review-grok "Code-review src/scenes for bugs" [-m grok-4.7-build-fast]`
  - Raw command: `HOME=/workspace/kirohome grok -p "<prompt>" --permission-mode plan --output-format plain` (run it from /workspace/raise-dead). `--sandbox read-only` doesn't work here because bubblewrap is missing.
  - The token lasts about 7 to 30 days. To renew it, run `grok login --device-auth` and approve the code in the browser session `grok`.
- **Grok web**: browser session `grok` is signed in to grok.com and can be used for paste-in reviews.
- **Muse**: through the Meta Model API, muse-spark-1.3-contributor (see above).
- **Gemini CLI**: dropped. Google stopped accepting it for personal accounts ("migrate to Antigravity"), and `agy` replaces it.

### Reviewer tips (from round 1)
- agy: instruct "use file reads only, no shell"; pass --output-format json for token counts.
- Muse: send reasoning_effort:"low" from the first call (reasoning ate max_tokens otherwise).
- Grok CLI: strongest reviewer, ~15 min/prompt; paid SuperGrok, a deep review costs ~2% of the weekly limit, so use it regularly.

## Team operating model (Jay, Oct 31 2026)
- Plan with top models (consultant tier): Hark + claude-opus-4-6-thinking via Antigravity write thorough specs/briefs.
- Review with Grok 4.7 (sparingly, weekly cap), Gemini 3.8 Flash + Sonnet via agy, Muse muse-spark-1.3-contributor (no Wonder contributor exists).
- Execute with workhorses: Kiro on claude-haiku-4.5 / auto (cheap credits), Kiro must write app code.
- Asset generation can use Antigravity / Grok image tools (original art only, credit tool in CREDITS).
- Track usage: Kiro credits (dashboard), SuperGrok weekly limit (~2% per deep review), Muse $150, agy free tier.
- Future idea (after core demo): graves that open real, rich original-art arcade games in the spirit of Pac-Man / Contra (no ROMs, names or trademarked art). Nothing may look cheap.
- Model availability check (Oct 31 18:02): agy lists gemini-3.8-flash h/m/l, claude-sonnet-4-6, claude-opus-4-6-thinking (free caps tight, rolling 5h), gpt-oss-120b. No Argon / Gemini Pro. Grok: 4.7, 4.7-build-fast, 4.6, 4.5. Use Opus sparingly for planning only.
- Jay's next asks (after prototype is presented): polish walking animations; maybe bats flying. Don't overdo; present the working prototype first.

## Deploy (Oct 31 2026)
- Live: https://raise-dead.pages.dev (Cloudflare Pages project raise-dead, account 897b24f4afbfc209a91e52eae9007b0d), direct upload.
- Wrangler fails here (sandbox proxy overwrites the upload JWT). Working method: get upload-token with bearer service; reconnect cloudflare service with a dummy header; upload via /pages/assets/check-missing, /upload (blake3(base64+ext)[:32] keys), /upsert-hashes using the JWT; reconnect bearer; POST deployments with manifest + _headers.
- Extra capacity (Jay, Oct 31): Oxion AI account (oxionai.com, signed in) has ~200M tokens incl. Haiku-class models; can be wired into a harness for reviews/bulk work if useful. Kiro still writes app code.
- Jay's Phase 1.5 feedback (19:02): sounds perfect; fix RIP click, explore whole map, grounded shadows/ground texture, wizard feet/float, tree collision, witch fly-by + cackle, tone shimmer down, Halloween Easter eggs that teach lore.
- Phase 1.5 status (Oct 31 19:45): brief + assets ready (research/p15-brief.md); Kiro hit its monthly limit mid Session A, partial work stashed. Resume after the Nov 1 Kiro reset.
- Pixel animation skills found (Oct 31): Gamezxz/pixel-art-studio (MIT; Pillow, LLM places pixels, self-critique loop — good for wizard walk cycle w/ feet, bats, Clicky), aldegad/sprite-gen (Apache-2.0; base image → state rows/atlas, grid-locked), 0x0funky/agent-sprite-forge (Claude/Codex/Grok skills; image→video→frames). Plan: vendor pixel-art-studio as a .kiro steering/skill for the walk-cycle rework; credit in CREDITS.
- Clicky chat (Jay 20:48): limits 5 typed msgs per hashed IP AND 5 per cookie token, lifetime; storage Cloudflare D1/KV preferred (Supabase alt); monitor usage. Full branching preset tree (3 options per turn) pre-generated, typewriter-streamed replies.

## Clicky / Muse feature (prepped Oct 31 20:45–21:30 IST)
- Spec: research/muse-clicky-brief.md (Kiro-ready). Presets: public/data/clicky-presets.json (33-node branching tree, 3 variants/node, system lines). Art: public/assets/images/clicky/clicky_sheet.png (4×47×92), portraits/medal_clicky.png (replaces eyebrowed medal_clippy in UI). Submission: research/meta-submission-checklist.md.
- Decisions: character "Clicky" (never "Clippy" in UI; grave name "Clicky the Paperclip"); Pages Functions + D1 on the existing Pages project (lifetime 5/IP-hash + 5/signed token, DAILY_CAP 300, usage_daily token counters, admin /api/clicky/usage); Muse streamed via SSE.
- Muse finding: reasoning tokens count against max_tokens; at 160–400 tokens low/minimal return content=null. Use reasoning_effort minimal + max_tokens 700 (low needs ~1000). ~$0.00008/typed msg.
- MODEL_API_KEY in sandbox env is a proxy placeholder: set the Cloudflare secret via dashboard/browser, never from $MODEL_API_KEY.

### Muse usage log
| when (IST) | purpose | calls | prompt tok | completion tok (reasoning) | est. $ |
|---|---|---|---|---|---|
| Oct 31 ~19:30 | p15 brief review (earlier) | 1 | 4,951 | 1,400 (781) | 0.0008 |
| Oct 31 21:00 | Clicky runtime param tests (effort/max_tokens/stream) | 12 | ~2,550 | ~3,600 (~3,300) | 0.0010 |
| Oct 31 21:05 | Clicky preset tree generation (2 calls, minimal) | 2 | 2,913 | 2,799 (183) | 0.0009 |
