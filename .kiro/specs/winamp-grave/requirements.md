# Winamp Grave — Requirements

## Overview
A working Winamp media player tribute using the `webamp` 2.3.1 npm package (MIT) loaded with 4–6 Komiku CC0 tracks self-hosted on the same Cloudflare Pages domain.

## Source restrictions
- `webamp` npm package: MIT. Use `import Webamp from "webamp"`.
- Do **not** ship `llama-2.91.mp3` or any Nullsoft/AOL audio from the webamp repo.
- Default Winamp skin ships inside the `webamp` package; acceptable for MVP (flagged in product.md). Stretch goal: custom `.wsz` "Graveyard Amp" skin (bone/moonlight palette).
- Tombstone label: "Winamp, 1997–2013" — "Winamp" is a trademark; include disclaimer in the overlay footer.

## User stories (EARS format)

### Player setup
- **REQ-WA-01** When the Winamp overlay opens, the system shall instantiate `new Webamp({ initialTracks, initialSkin? })` and call `w.renderInto(containerDiv)`.
- **REQ-WA-02** `initialTracks` shall include 4–6 Komiku CC0 mp3 files served from `/assets/audio/winamp/` on the same origin.
- **REQ-WA-03** Each track shall have correct `metaData` (`{ artist: "Komiku", title: "…" }`) so Webamp displays them correctly in its playlist.
- **REQ-WA-04** The Webamp window shall be positioned within the overlay div; the container shall have `position: relative` as required by the Webamp API.

### Playback
- **REQ-WA-05** The player shall be fully interactive: play/pause, next/prev, seek, volume, shuffle, repeat.
- **REQ-WA-06** Audio shall not continue playing after the overlay is closed; `w.dispose()` shall be called on overlay exit.

### Stretch: custom skin
- **REQ-WA-07** (Stretch) A custom `.wsz` skin file at `/assets/skins/graveyard-amp.wsz` (bone/moonlight palette, original art) shall be loaded via `initialSkin: { url: '/assets/skins/graveyard-amp.wsz' }`.

### Exit
- **REQ-WA-08** The "Requiescat in pace" button shall call `w.dispose()` before triggering the exit ritual to prevent audio leaking back into the graveyard.

## Acceptance criteria
- AC1: Webamp renders in the overlay and tracks are visible in its playlist.
- AC2: All tracks have `artist: "Komiku"` in metadata; verified by inspecting the Webamp playlist display.
- AC3: Playback works (play, pause, skip); no CORS errors (same-origin serving confirmed).
- AC4: Closing the overlay stops all Webamp audio immediately.
- AC5: No `llama-2.91.mp3` or unlicensed audio files in `public/assets/audio/winamp/`.
- AC6: CREDITS.md includes Webamp (MIT) and Komiku (CC0) attribution lines.
- AC7: Overlay footer reads "Winamp is a trademark of its owners; Webamp is an unaffiliated recreation."
