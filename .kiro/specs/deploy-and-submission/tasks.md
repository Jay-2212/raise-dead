# Deploy and Submission — Tasks

## Worker infrastructure
- [ ] 1. Create `worker/index.ts` with router: `/api/feed` → `handleFeed`, `/api/ai` → `handleAI`, otherwise 404.
- [ ] 2. Create `wrangler.toml` — name, compatibility_date, pages_build_output_dir, `[vars]` with `PAGES_ORIGIN`.
- [ ] 3. Create `worker/env.d.ts` — `Env` interface declaring `META_API_KEY`, `OXION_API_KEY`, `OXION_BASE_URL`, `PAGES_ORIGIN`, `FEED_CACHE: KVNamespace`.
- [ ] 4. Add `@cloudflare/workers-types` dev dependency; reference in `tsconfig.worker.json`.

## Static headers
- [ ] 5. Create `public/_headers` with CSP, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `*.wasm` Content-Type header.
- [ ] 6. Adjust CSP `frame-src` to allow `/apps/jspaint/` and `'self'`; allow `srcdoc` iframes for unmarked grave.

## Build scripts
- [ ] 7. Add/verify all scripts in `package.json`: `dev`, `build`, `typecheck`, `lint`, `deploy`.
- [ ] 8. Configure ESLint (`eslint.config.ts` or `.eslintrc.cjs`); add `@typescript-eslint` rules; `--max-warnings 0` in lint script.
- [ ] 9. Verify `npm run build` outputs `dist/index.html` and all assets.
- [ ] 10. Verify `npm run typecheck` exits 0.
- [ ] 11. Verify `npm run lint` exits 0.

## Secrets
- [ ] 12. After first `wrangler login`, run `wrangler secret put META_API_KEY` and `wrangler secret put OXION_API_KEY`.
- [ ] 13. Add `wrangler secret put OXION_BASE_URL` for the Oxion base URL.
- [ ] 14. Confirm `.gitignore` includes `.dev.vars` and `*.env`; add `.dev.vars` for local secret overrides.

## First deploy
- [ ] 15. Run `npm run deploy`; confirm Pages deploy succeeds and live URL responds HTTP 200.
- [ ] 16. Test `/api/feed?url=https://hnrss.org/frontpage` on the live URL — returns JSON.
- [ ] 17. Test `/api/ai` with a test prompt on the live URL — returns a response.

## README
- [ ] 18. Create `README.md` with: project title, one-liner, live demo badge/URL, screenshot, features list, local dev instructions, deploy instructions, tech stack table.
- [ ] 19. Add "Licensing" section and link to CREDITS.md.
- [ ] 20. Add "Hackathon submissions" section noting both deadlines and submission links.

## CREDITS.md
- [ ] 21. Create `CREDITS.md` with sections: Code libraries, Music, Visual assets, Fonts, Data; use `| Name | Author | Licence | URL |` table format.
- [ ] 22. Populate with all required entries (minimum: Phaser 3, phaser3-rex-plugins, javascript-racer, feedsmith, ms-agent-js, webamp, jspaint, DOMPurify, Kenney packs, Komiku tracks, killedbygoogle data credit, rune font).
- [ ] 23. Add trademark disclaimer paragraph.

## CREDITS hook check
- [ ] 24. Run `.kiro/hooks/assets-credits` manually; verify it exits 0 (all assets credited).

## Pre-submission checklist
- [ ] 25. Run `npm run build && npm run typecheck && npm run lint` — all exit 0.
- [ ] 26. Open live URL; walk to all 5 resurrectable graves; trigger each resurrection ritual — no errors.
- [ ] 27. Verify no `META_API_KEY` or `OXION_API_KEY` value appears in `git log --all -p`.
- [ ] 28. Record demo video per shot list in design.md; upload to YouTube unlisted.
- [ ] 29. Submit to Meta hackathon (devpost or equivalent) before Nov 4 2026 9 PM ET.
- [ ] 30. Submit to Kiroween (Kiro community form) before Nov 6 2026.
