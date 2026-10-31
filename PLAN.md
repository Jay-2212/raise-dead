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
