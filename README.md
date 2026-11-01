# Raise Dead — Graveyard of Lost Apps

A moonlit pixel-art graveyard of dead software. Walk the wizard among 40 tombstones, read their epitaphs, and press **F** at a glowing grave to perform a resurrection ritual — incantation, runes, quaking earth, cracking stone and a flood of holy light — that brings the app back to life in an overlay.

Built for **Kiroween** and the **Meta Global AI Dev Hackathon**. The code is written with the [Kiro CLI](https://kiro.dev); specs, steering and hooks live in [`.kiro/`](.kiro).

> Status: **Phase 1** — graveyard world, ritual and placeholder app overlay. Tribute apps (Road Rash, Google Reader, Winamp, Unmarked Grave) arrive in Phase 2. **Clicky** is live.

### Clicky: The Paperclip Returns
Raise the Clicky grave to meet a cheerful ghost paperclip, resurrected from Office 97. Chat with Clicky via a branching preset dialogue tree or type your own questions. Preset replies show instantly; typed questions stream live from **Meta Muse Spark** (reasoning model, contributor tier) with a typewriter effect and context from your conversation. Clicky is amazed to be alive, warm and a bit nosy—and knows nothing after 2007 except the graveyard. Built with Phaser, a conversation tree in `public/data/clicky-presets.json`, and a Cloudflare Pages Function with D1 for lifetime and daily quota caps.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## Controls
WASD / arrow keys to walk · **F** to raise the dead · **Esc** or *Requiescat in pace* to lay it back to rest · **M** to mute · on-screen joystick on touch devices.

## Stack
Phaser 3.90.0 · TypeScript · Vite · phaser3-rex-plugins (virtual joystick).

## Credits
Wizard sprite by Movicx (opengameart.org/users/movicx), CC-BY 3.0, modified (red glow removed, trim recoloured to teal) — https://creativecommons.org/licenses/by/3.0/. Footstep sounds (dirt) by congusbongus, from 'footstep-grass.wav' by swuing (freesound.org), CC-BY 3.0, modified (trimmed, normalised) — https://creativecommons.org/licenses/by/3.0/. Fonts: Cinzel and Pixelify Sans (SIL OFL 1.1, self-hosted). Everything else is CC0 or original — see [CREDITS.md](CREDITS.md) (also shown in-game).

## Trademark Disclaimer
Road Rash, Google Reader, Clippy, Winamp and other product names referenced in Raise Dead are trademarks of their respective owners. Raise Dead is an unofficial fan tribute, not affiliated with or endorsed by them. No original logos, art or code from the trademarked products are used in this project.

## License
Code: [MIT](LICENSE). Third-party assets keep their own licences as listed in CREDITS.md.
