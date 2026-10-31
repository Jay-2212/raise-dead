# Winamp Grave — Design

## Module entry point
`src/graves/winamp/index.ts` — implements `GraveApp`, mounts Webamp into a container div.

## Mount logic
```typescript
import Webamp from 'webamp';

let wamp: InstanceType<typeof Webamp> | null = null;

async function mount(container: HTMLElement): Promise<void> {
  container.style.position = 'relative';  // required by Webamp docs

  wamp = new Webamp({
    initialTracks: KOMIKU_TRACKS,
    // initialSkin: { url: '/assets/skins/graveyard-amp.wsz' },  // stretch
  });

  await wamp.renderInto(container);
}

function dispose(): void {
  wamp?.dispose();
  wamp = null;
}
```

## Track list (`KOMIKU_TRACKS`)
```typescript
const KOMIKU_TRACKS = [
  { metaData: { artist: 'Komiku', title: 'Battle Theme' },
    url: '/assets/audio/winamp/komiku-battle-theme.mp3' },
  { metaData: { artist: 'Komiku', title: 'Sad walk with sad piano' },
    url: '/assets/audio/winamp/komiku-sad-walk.mp3' },
  { metaData: { artist: 'Komiku', title: 'Into Adventure' },
    url: '/assets/audio/winamp/komiku-into-adventure.mp3' },
  { metaData: { artist: 'Komiku', title: 'Epic Song' },
    url: '/assets/audio/winamp/komiku-epic-song.mp3' },
];
```
Files sourced from Free Music Archive (CC0). Download URLs noted in CREDITS.md per track.

## Overlay HTML structure
```html
<div id="winamp-overlay" class="grave-overlay">
  <header>
    <h2>Winamp (1997–2013)</h2>
    <button id="rip-btn">Requiescat in pace</button>
  </header>
  <div id="webamp-container"></div>
  <footer>
    <small>Winamp is a trademark of its owners. Webamp is an unaffiliated recreation.</small>
  </footer>
</div>
```

## Webamp container requirements
- `#webamp-container`: `position: relative; min-height: 400px`.
- The Webamp window will position itself absolutely within this container.

## Graveyard Amp skin (stretch goal)
A `.wsz` file is a ZIP of BMP files with fixed names (`MAIN.BMP`, `CBUTTONS.BMP`, etc.).
Steps:
1. Create 14 required BMP files at correct dimensions (documented at https://webamp.org/skin-format.html).
2. Apply bone/moonlight palette (grey stone texture, moon-glow green accents).
3. ZIP → rename `.wsz` → place at `/assets/skins/graveyard-amp.wsz`.
4. Enable `initialSkin` in mount logic.

## Dispose safety
- `dispose()` is called in `GraveOverlay.unmount()` before the exit ritual starts, ensuring no audio bleeds back into the graveyard ambient mix.
