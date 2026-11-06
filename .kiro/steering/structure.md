> **Superseded (2026-11-06):** shipped architecture is Vite + Cloudflare Pages Functions (`functions/`) + D1; see README.

# Structure — Raise Dead

## Directory layout
```
raise-dead/
├── .kiro/
│   ├── steering/          # product.md, tech.md, structure.md
│   ├── specs/             # one folder per feature
│   └── hooks/             # automation hooks
├── data/
│   └── graves.json        # 40 grave entries (source of truth)
├── public/
│   ├── assets/
│   │   ├── images/        # sprites, tilesets, portraits — all original or CC0
│   │   ├── audio/
│   │   │   ├── ambient/   # wind, owl, whispers, drone loop
│   │   │   ├── sfx/       # footsteps, ritual SFX, UI clicks
│   │   │   └── winamp/    # Komiku CC0 mp3s (served to webamp)
│   │   ├── voice/         # incantation audio clip(s) (original recording)
│   │   └── fonts/         # OFL web fonts if self-hosting
│   ├── apps/
│   │   └── jspaint/       # vendored jspaint static build (MIT)
│   └── agents/
│       └── Paperclip/     # ms-agent-js agent bundle (original art, WebP atlas + WebM audio)
├── src/
│   ├── main.ts            # Phaser game bootstrap
│   ├── config.ts          # Phaser.Game config (scene list, physics, plugins)
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── GraveyardWorld.ts
│   │   ├── ResurrectionRitual.ts
│   │   └── ExitRitual.ts
│   ├── graves/
│   │   ├── roadrash/      # Road Rash tribute (vendored javascript-racer engine)
│   │   ├── googlereader/  # RSS reader UI component
│   │   ├── clippy/        # Clippy overlay (ms-agent-js wrapper + Muse Spark integration)
│   │   ├── winamp/        # webamp mount/dispose helpers
│   │   ├── unmarked/      # unmarked-grave UI (input + AI generation + iframe)
│   │   └── paint/         # jspaint iframe mount
│   ├── ui/
│   │   ├── GraveOverlay.ts  # shared overlay wrapper (mounts / unmounts grave apps)
│   │   ├── Tombstone.ts     # Phaser GameObject for tombstone sprite + name label
│   │   ├── ProximityHint.ts # "Press F" popup
│   │   └── Joystick.ts      # rex virtualjoystick wrapper
│   ├── worker/            # Cloudflare Worker source
│   │   ├── index.ts       # router: /api/feed, /api/ai
│   │   ├── feed.ts        # feedsmith integration, IP block, cache
│   │   └── ai.ts          # Meta Muse Spark / Muse Image proxy + Oxion fallback
│   └── types/
│       └── graves.ts      # TypeScript types for graves.json schema
├── research/              # oss-libraries.md, data-notes.md (read-only reference)
├── CREDITS.md             # every third-party asset and code entry (auto-checked by hook)
├── README.md
├── wrangler.toml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Naming conventions
- Scene files: `PascalCase` + `Scene` suffix.
- Grave overlay modules: `camelCase` directory, `index.ts` entry.
- Phaser assets: `kebab-case` texture keys (`'wizard-walk'`, `'grave-road-rash'`).
- Worker modules: `camelCase` files, exported handler functions.

## Data flow: graves.json → tombstones
1. `PreloadScene` loads `data/graves.json` via Phaser `this.load.json('graves', '/data/graves.json')`.
2. `GraveyardWorld.create()` reads `this.cache.json.get('graves')`, sorts by `sort_priority`.
3. Spawns a `Tombstone` game object for each entry at a pre-computed grid/path position.
4. Resurrectable entries (`resurrectable: true`) get a glowing rune overlay and trigger the ritual flow.

## CREDITS.md rules (enforced by hook)
- Every file added under `public/assets/` must have a corresponding entry in `CREDITS.md`.
- Format per line: `<filename or glob> | <author> | <licence> | <source URL>`.
- The `assets-credits` hook warns (exit 1) if any `public/assets/**` file has no matching CREDITS entry.

## Key constraints (repeat from tech.md for quick reference)
- `phaser@3.90.0` pinned — do not upgrade to 4.x.
- Secrets (`META_API_KEY`, `OXION_API_KEY`) only in Worker environment — never in `src/` or committed files.
- No Microsoft/EA/Nullsoft art in `public/assets/`. No GPL code in `src/` or `worker/`.
- `CREDITS.md` must be updated whenever a new OSS dep or asset is added.
