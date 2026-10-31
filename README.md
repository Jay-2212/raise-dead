# Raise Dead — Graveyard of Lost Apps

A moonlit pixel-art graveyard of dead software. Walk the wizard among 40 tombstones, read their epitaphs, and press **F** at a glowing grave to perform a resurrection ritual — incantation, runes, quaking earth, cracking stone and a flood of holy light — that brings the app back to life in an overlay.

Built for **Kiroween** and the **Meta Global AI Dev Hackathon**. The code is written with the [Kiro CLI](https://kiro.dev); specs, steering and hooks live in [`.kiro/`](.kiro).

> Status: **Phase 1** — graveyard world, ritual and placeholder app overlay. Tribute apps (Road Rash, Google Reader, Clippy, Winamp, Unmarked Grave) arrive in Phase 2.

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
Wizard sprite by Movicx (opengameart.org/users/movicx), CC-BY 3.0. Footstep sounds (dirt) by congusbongus, from 'footstep-grass.wav' by swuing (freesound.org), CC-BY 3.0. Everything else is CC0 or original — see [CREDITS.md](CREDITS.md) (also shown in-game).

## License
Code: [MIT](LICENSE). Third-party assets keep their own licences as listed in CREDITS.md.
