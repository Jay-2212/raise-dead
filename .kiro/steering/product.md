# Product — Raise Dead: Graveyard of Lost Apps

## One-liner
A moonlit Halloween graveyard where you walk up to tombstones of dead software, press F to perform a resurrection ritual, and play fully working tribute apps built from permissively-licensed OSS code and original art.

## Target audience
Developers and tech-nostalgics who remember Road Rash, Google Reader, Clippy, Winamp, MS Paint — and anyone curious about the AI-generated mystery grave.

## Hackathons
- **Meta Global AI Dev Hackathon** — deadline Nov 4 2026 9 PM ET (Nov 5 07:30 IST). Primary judge: use of Meta Model API (Muse Spark / Muse Image).
- **Kiroween** — deadline Dec 5 2026 03:30 IST (aim for Nov 6). Judge: built with Kiro CLI.

## Core user journey
1. Land on the page → full-screen Phaser graveyard loads, ambient music/SFX begin.
2. Walk (WASD / mobile joystick) among 40 tombstones reading epitaphs.
3. Approach a **resurrectable grave** → proximity prompt "Press F to raise the dead" appears.
4. Press F → **resurrection ritual** plays (incantation, runes, shake, crack, holy light).
5. Grave-specific tribute app opens in an overlay.
6. Click "Requiescat in pace" or press Esc → reverse ritual → back in graveyard.

## Resurrectable graves (launch)
| ID | Name | Tribute tech |
|---|---|---|
| road-rash | Road Rash | javascript-racer engine + punch/kick rivals + original sprites |
| google-reader | Google Reader | 3-pane RSS UI + Cloudflare Worker /api/feed + feedsmith |
| clippy | Clippy | ms-agent-js + original ghost paperclip + Muse Spark brain |
| winamp | Winamp | webamp + Komiku CC0 tracks |
| unmarked-grave | Unmarked Grave | User names a dead app → Muse Spark generates sandboxed mini-app + Muse Image tombstone |

## Decorative graves (35)
Non-interactive tombstones loaded from `data/graves.json` (sort_priority 6–40).

## AI feature requirements (Meta hackathon)
- **Muse Spark (text)**: Clippy's responses, unmarked-grave app generation, epitaph generation for new tombstones.
- **Muse Image**: Tombstone portrait for unmarked-grave; optionally Road Rash sprite generation.
- Both called through the Cloudflare Worker `/api/ai` proxy (secrets never in client JS).
- Fallback: Oxion OpenAI-compatible endpoint (same proxy, `provider: "oxion"` param).

## Non-goals
- No user accounts, no database (localStorage only for Reader subscriptions/read state).
- No copyrighted art: no Microsoft agent sprites, no EA Road Rash assets, no Nullsoft audio beyond what ships in the MIT `webamp` package.
- No GPL code vendored into the repo unless isolated as a separately-embedded app and clearly noted.

## Licensing constraints (hard rules)
- All code and assets must be CC0 / MIT / Apache-2.0 / BSD / ISC.
- Every third-party item must appear in `CREDITS.md` with URL + licence.
- Never copy `images/`, `music/`, or `agents/` folders from repos that contain non-free bundled assets (javascript-racer, ms-agent-js, clippy.js).
- No NC, ND, or GPL in the main bundle.
