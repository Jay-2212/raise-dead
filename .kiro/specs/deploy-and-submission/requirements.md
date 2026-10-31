# Deploy and Submission — Requirements

## Overview
Production deployment to Cloudflare Pages + Worker, final README, CREDITS.md completeness, and demo video checklist for both hackathon submissions.

## User stories (EARS format)

### Build
- **REQ-DS-01** Running `npm run build` shall produce a complete `dist/` directory with no TypeScript errors and no ESLint warnings treated as errors.
- **REQ-DS-02** The Worker code in `worker/` shall compile without errors via `wrangler deploy --dry-run`.

### Deploy
- **REQ-DS-03** Running `npm run deploy` shall push `dist/` to Cloudflare Pages via `wrangler pages deploy dist/`.
- **REQ-DS-04** The Worker shall be deployed to `raise-dead.<account>.workers.dev` and bound to the Pages project via a `_worker.js` or via `wrangler.toml` routes.
- **REQ-DS-05** `META_API_KEY` and `OXION_API_KEY` shall be set as Cloudflare Worker secrets (`wrangler secret put`) — never committed to git.
- **REQ-DS-06** `public/_headers` shall include: `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`.

### README
- **REQ-DS-07** `README.md` shall include: project description, live demo URL, local dev instructions (`npm install`, `npm run dev`), deploy instructions, tech stack, screenshot or GIF of the graveyard and at least one open grave.
- **REQ-DS-08** README shall link to `CREDITS.md` and include a "Licensing" section stating: "All code MIT/Apache-2.0. All assets CC0 or original. Trademarks belong to their owners; this is an unaffiliated fan tribute."

### CREDITS.md
- **REQ-DS-09** CREDITS.md shall contain an entry for every third-party library and asset, in the format: `<name> | <author> | <licence> | <URL>`.
- **REQ-DS-10** The `assets-credits` hook shall pass (exit 0) — i.e. every file under `public/assets/` shall have a corresponding CREDITS entry.

### Demo video (Meta hackathon)
- **REQ-DS-11** Demo video shall show: the graveyard loading, walking to ≥ 2 graves, the full resurrection ritual for at least one grave, the Clippy AI interaction (Muse Spark call visible in Network tab), the Unmarked Grave generation (Muse Spark + Muse Image calls visible).
- **REQ-DS-12** Video shall be ≤ 3 minutes (Meta hackathon limit) and uploaded to YouTube/Vimeo unlisted before the submission deadline.

### Demo video (Kiroween)
- **REQ-DS-13** Kiroween submission shall include a screen recording showing Kiro CLI generating at least one spec file and one source file during development.

## Acceptance criteria
- AC1: `npm run build && npm run typecheck && npm run lint` exits 0.
- AC2: Live URL responds with HTTP 200 and loads the Phaser canvas.
- AC3: `/api/feed?url=https://hnrss.org/frontpage` returns valid JSON feed items.
- AC4: `/api/ai` returns a response (Muse Spark or Oxion) for a test prompt.
- AC5: CREDITS.md `assets-credits` hook exits 0 on the final commit.
- AC6: No secrets appear in `git log` or any tracked file.
- AC7: README has a working live demo URL and local dev instructions that produce a running dev server.
