# Deploy and Submission — Design

## Cloudflare Pages + Worker setup

### wrangler.toml
```toml
name = "raise-dead"
compatibility_date = "2025-09-01"
pages_build_output_dir = "dist"

[vars]
PAGES_ORIGIN = "https://raise-dead.pages.dev"

[[routes]]
pattern = "/api/*"
zone_name = "pages.dev"
```

### Worker entry (`worker/index.ts`)
```typescript
import { handleFeed } from './feed';
import { handleAI } from './ai';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/feed')) return handleFeed(request, env);
    if (pathname.startsWith('/api/ai'))   return handleAI(request, env);
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
```

### Secrets deployment (never in source)
```bash
wrangler secret put META_API_KEY
wrangler secret put OXION_API_KEY
wrangler secret put OXION_BASE_URL
```

## public/_headers
```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/api/*
  Access-Control-Allow-Origin: https://raise-dead.pages.dev
  Access-Control-Allow-Methods: GET, POST, OPTIONS

/*.wasm
  Content-Type: application/wasm
```

## Build pipeline
```json
// package.json scripts
{
  "dev":       "vite",
  "build":     "tsc --noEmit && vite build",
  "typecheck": "tsc --noEmit",
  "lint":      "eslint src/ worker/ --max-warnings 0",
  "deploy":    "npm run build && wrangler pages deploy dist/"
}
```

## README.md outline
1. Title + one-liner + live demo badge
2. Screenshot / animated GIF (graveyard + one open grave)
3. Features list (5 graves + atmosphere)
4. Local dev: `npm install && npm run dev`
5. Deploy: secrets setup + `npm run deploy`
6. Tech stack table
7. Credits link
8. Licensing statement

## CREDITS.md format
```markdown
# Credits

## Code libraries
| Name | Author | Licence | URL |
|---|---|---|---|
| Phaser 3 | Phaser Studio Inc. | MIT | https://github.com/phaserjs/phaser |
...

## Music
| Track | Artist | Licence | URL |
|---|---|---|---|
| Battle Theme | Komiku | CC0 1.0 | https://freemusicarchive.org/… |
...

## Visual assets
| Asset | Author | Licence | URL |
|---|---|---|---|
| Particle Pack | Kenney | CC0 1.0 | https://kenney.nl/assets/particle-pack |
...

## Data
Google product dates partly from Killed by Google (codyogden/killedbygoogle), MIT License.
Other dates checked on Wikipedia. All epitaphs and descriptions are original.

## Trademarks
Road Rash, Google Reader, Clippy/Office Assistant, Winamp, MS Paint, Minesweeper,
Flappy Bird, Adobe Flash are trademarks or registered trademarks of their respective owners.
This project is an unaffiliated fan tribute.
```

## Demo video shot list (Meta hackathon ≤ 3 min)
1. (0:00–0:15) Graveyard loads, ambient audio on, camera pan over tombstones.
2. (0:15–0:30) Walk to Road Rash grave, read epitaph, trigger ritual — full ceremony.
3. (0:30–1:00) Road Rash gameplay: racing, punch a rival, lap counter.
4. (1:00–1:10) "Requiescat in pace" → exit ritual.
5. (1:10–1:40) Walk to Clippy grave, trigger ritual, type a message → Network tab shows `/api/ai` call to Muse Spark, Clip the Ghost speaks.
6. (1:40–2:10) Walk to Unmarked Grave, type "Napster", Summon → Network tab shows two `/api/ai` calls (text + image), mini-app renders.
7. (2:10–2:30) Walk to Winamp grave, music plays.
8. (2:30–2:45) Walk to Paint grave, draw something.
9. (2:45–3:00) Walk to Google Reader grave, click a feed, articles load.

## Demo video shot list (Kiroween)
1. Show Kiro CLI running in terminal.
2. Show a spec file open in the editor.
3. Show Kiro generating a source file from the spec.
4. Show the running game.
