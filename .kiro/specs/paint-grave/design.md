# Paint Grave — Design

## Module entry point
`src/graves/paint/index.ts` — implements `GraveApp`.

## Mount logic
```typescript
export class PaintGrave implements GraveApp {
  private iframe: HTMLIFrameElement | null = null;

  async mount(container: HTMLElement): Promise<void> {
    const wrapper = document.createElement('div');
    wrapper.className = 'paint-wrapper';
    wrapper.innerHTML = `
      <header class="grave-header">
        <h2>MS Paint (1985–2017)</h2>
        <span class="epitaph">Fade to black. Star wipe.</span>
        <button id="rip-btn" class="rip-btn">Requiescat in pace</button>
      </header>
      <div class="paint-iframe-container">
        <iframe
          id="jspaint-iframe"
          src="/apps/jspaint/"
          sandbox="allow-scripts allow-same-origin allow-downloads"
          title="JS Paint — MS Paint tribute"
          loading="eager"
        ></iframe>
      </div>
      <p class="mobile-hint">Use two fingers to scroll the canvas</p>
    `;
    container.appendChild(wrapper);
    this.iframe = wrapper.querySelector('#jspaint-iframe');

    document.getElementById('rip-btn')!
      .addEventListener('click', () => dispatchRIPEvent());
  }

  dispose(): void {
    this.iframe = null;
    // DOM removed by GraveOverlay.unmount()
  }
}
```

## CSS layout
```css
.paint-wrapper { display: flex; flex-direction: column; height: 100%; }
.grave-header  { flex: 0 0 auto; padding: 8px 16px; background: #2c2c3e; }
.paint-iframe-container { flex: 1; overflow: hidden; }
#jspaint-iframe { width: 100%; height: 100%; border: none; display: block; }
.mobile-hint { display: none; font-size: 0.75rem; text-align: center; padding: 4px; }
@media (pointer: coarse) { .mobile-hint { display: block; } }
```

## Vendoring steps (one-time setup task)
1. `git clone --depth 1 https://github.com/1j01/jspaint.git /tmp/jspaint`.
2. Copy the built static files to `public/apps/jspaint/`.
3. Verify no external CDN `<script src>` remain (replace with vendored copies).
4. Check `lib/` subdirectory licences; add each to CREDITS.md.
5. Keep jspaint's `LICENSE` file at `public/apps/jspaint/LICENSE`.

## Iframe sandbox attributes
| Attribute | Reason |
|---|---|
| `allow-scripts` | jspaint JS must run |
| `allow-same-origin` | jspaint uses `localStorage` for settings |
| `allow-downloads` | "Save" → file download |
| ❌ `allow-popups` | Not needed; blocks window.open |
| ❌ `allow-top-navigation` | Prevents frame from navigating the parent |

## No network calls from iframe
After vendoring, verify with DevTools → Network → filter by "Other" domain — should be empty (all resources served from `/apps/jspaint/` on the same origin).
