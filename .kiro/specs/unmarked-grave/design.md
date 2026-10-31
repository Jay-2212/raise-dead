# Unmarked Grave — Design

## Module entry point
`src/graves/unmarked/index.ts` — implements `GraveApp`.

## Overlay structure
```html
<div id="unmarked-overlay" class="grave-overlay">
  <header>
    <h2>Unmarked Grave</h2>
    <em>Name the lost one, and it shall rise.</em>
    <button id="rip-btn">Requiescat in pace</button>
  </header>
  <div id="portrait-area">
    <!-- Muse Image tombstone portrait injected here as <img> -->
  </div>
  <main id="summon-area">
    <form id="summon-form">
      <input id="app-name-input" placeholder="Name the lost one…"
             minlength="2" maxlength="60" required />
      <button id="summon-btn" type="submit">Summon</button>
    </form>
    <div id="status-msg" hidden></div>
  </main>
  <div id="app-area" hidden>
    <iframe id="generated-iframe"
            title="Summoned app"
            sandbox="allow-scripts"
            style="width:100%;height:100%;border:none;"></iframe>
    <button id="re-summon-btn">Summon another</button>
  </div>
</div>
```

## Generation flow
```typescript
async function handleSummon(appName: string): Promise<void> {
  showStatus('Communing with the beyond…');
  startRuneSpinner();

  const [appRes, imgRes] = await Promise.allSettled([
    generateApp(appName),    // Muse Spark
    generatePortrait(appName) // Muse Image
  ]);

  stopRuneSpinner();

  if (appRes.status === 'fulfilled' && appRes.value) {
    mountApp(appRes.value);
  } else {
    showStatus('The spirits are silent tonight. Try another name.');
    return;
  }

  if (imgRes.status === 'fulfilled' && imgRes.value) {
    mountPortrait(imgRes.value);
    updateGraveyardTombstone(appName, imgRes.value); // notify Phaser scene
  }
}
```

## Muse Spark prompt (app generation)
```
System: You are a creative web developer. Generate a single self-contained HTML document
(inline CSS and JS only — no external imports, no fetch, no localStorage, no document.cookie)
that is a simple playable mini-tribute of the named app. Keep it under 4 KB.
Include a visible "Close" button that posts a message to the parent:
window.parent.postMessage({ type: 'close' }, '*').

User: Generate a mini-tribute for: {appName}
```

## iframe srcdoc mounting
```typescript
function mountApp(html: string): void {
  const iframe = document.getElementById('generated-iframe') as HTMLIFrameElement;
  iframe.srcdoc = html;  // sandbox="allow-scripts", no allow-same-origin
  document.getElementById('app-area')!.hidden = false;
  document.getElementById('summon-area')!.hidden = true;

  // Listen for close message from generated app
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'close') resetToInput();
  }, { once: true });
}
```

## Muse Image prompt (tombstone portrait)
```
A single moonlit stone gravestone with the name "{appName}" carved in gothic lettering,
dark graveyard atmosphere, no UI chrome, no text other than the name.
Square 512×512 image.
```

## Worker AI proxy (`worker/ai.ts`)
```typescript
export async function handleAI(request: Request, env: Env): Promise<Response> {
  const body = await request.json();
  const provider = new URL(request.url).searchParams.get('provider') ?? 'meta';
  const apiKey = provider === 'oxion' ? env.OXION_API_KEY : env.META_API_KEY;
  const baseUrl = provider === 'oxion' ? env.OXION_BASE_URL : 'https://api.meta.ai/v1';
  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  // If Meta quota exceeded, auto-retry with Oxion
  if (!upstream.ok && upstream.status === 429 && provider !== 'oxion') {
    return handleAI(new Request(request.url + '?provider=oxion', request), env);
  }
  return new Response(upstream.body, { status: upstream.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': env.PAGES_ORIGIN } });
}
```

## Timeout handling
- `generateApp` and `generatePortrait` each use `AbortController` with a 15 s timeout.
- On abort, `showStatus('The spirits are silent tonight. Try another name.')`.
