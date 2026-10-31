# Tech — Raise Dead

## Runtime stack
| Layer | Choice | Version / notes |
|---|---|---|
| Game engine | **Phaser 3** | Pin `phaser@3.90.0` exactly. `npm install phaser@3.90.0`. Do NOT use `latest` (resolves to 4.x). |
| Language | TypeScript | `~5.7` (from Phaser Vite TS template commit `919be730b4`) |
| Bundler | Vite | `^6.3.1` |
| Hosting | Cloudflare Pages | Static build output (`dist/`) pushed via `wrangler pages deploy` |
| Backend | Cloudflare Worker | Handles `/api/feed` and `/api/ai` — secrets live here only |
| Mobile input | phaser3-rex-plugins `VirtualJoystickPlugin` | `1.80.20`, MIT |

## Key dependencies (pinned)
```
phaser@3.90.0
phaser3-rex-plugins@1.80.20
webamp@2.3.1
ms-agent-js@0.5.1
feedsmith@3.0.1
dompurify@3.x          # Apache-2.0 (dual Apache/MPL-2.0; choose Apache)
```

## Cloudflare Worker routes
| Route | Purpose |
|---|---|
| `GET /api/feed?url=<encoded>` | Fetch + parse RSS/Atom via feedsmith; return normalised JSON; block private IPs; cache 10 min |
| `POST /api/ai` | Proxy to Meta Muse Spark or Muse Image; inject `Authorization: Bearer ${META_API_KEY}` from Worker env; support `?provider=oxion` fallback |

### Worker security rules
- `META_API_KEY` and `OXION_API_KEY` stored as Cloudflare Worker **secrets** (`wrangler secret put`), never in source.
- `/api/feed`: only `http(s)` URLs; block RFC-1918 / loopback (`10.x`, `172.16–31.x`, `192.168.x`, `127.x`, `::1`); cap response body at 2 MB; timeout 8 s.
- `/api/ai`: validate request body is JSON; strip any extra headers before forwarding; rate-limit by IP via Workers KV (stretch).
- CORS: `Access-Control-Allow-Origin` = Pages domain only (set in `wrangler.toml` env var `PAGES_ORIGIN`).

## Phaser scene architecture
```
Boot → Preload → GraveyardWorld (main loop)
                    ↓ (press F near grave)
              ResurrectionRitual (overlay scene, additive)
                    ↓ (ritual complete)
              GraveOverlay (DOM overlay — mounts app component)
                    ↑ (Esc / "Requiescat in pace")
              ExitRitual → back to GraveyardWorld
```

## Asset pipeline rules
- **Sprites / textures**: original art or Kenney CC0 packs. Never copy `images/` from javascript-racer, ms-agent-js, clippy.js.
- **Audio**: Komiku CC0 tracks for music; Kenney CC0 UI sounds / Pixabay-free or self-recorded for SFX (verify licence per file). No ripped game audio.
- **Fonts**: Google Fonts (OFL) or self-hosted OFL — no proprietary fonts. Preferred: `Cinzel` for tombstone text, `VT323` for retro overlay UIs.
- **Particles / lighting**: Kenney Particle Pack, Smoke Particles, Light Masks (all CC0).

## Build & deploy commands
```bash
npm run dev          # vite dev server
npm run build        # vite build → dist/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/ worker/
npm run deploy       # wrangler pages deploy dist/
```

## Cloudflare configuration files
- `wrangler.toml` — Worker config (name, compatibility_date, routes).
- `public/_headers` — security headers (CSP, X-Frame-Options SAMEORIGIN except for iframe routes).
- `public/_redirects` — SPA fallback if needed.

## TypeScript config notes
- `"strict": true` throughout.
- `"moduleResolution": "bundler"` (Vite convention).
- Worker code in `worker/` compiled separately or via `wrangler deploy`.

## Iframe sandboxing
- jspaint: `<iframe src="/apps/jspaint/" sandbox="allow-scripts allow-same-origin">` (vendored build).
- Unmarked-grave generated app: `<iframe srcdoc="..." sandbox="allow-scripts">` — no `allow-same-origin` (untrusted Muse Spark output).
