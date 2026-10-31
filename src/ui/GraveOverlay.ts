/**
 * GraveOverlay — DOM overlay that mounts a grave app when a resurrection ritual completes.
 * Phase 1: shows placeholder content with grave info.
 * Phase 2: dynamically imports src/graves/<id>/index.ts for full tribute apps.
 */
import { GraveEntry, extractYear } from '../types/graves';

export interface GraveApp {
  mount(container: HTMLElement): Promise<void>;
  dispose(): void;
}

export class GraveOverlay {
  private overlayEl: HTMLElement | null = null;
  private appInstance: GraveApp | null = null;
  private onExitCallback: (() => void) | null = null;
  private static appModules = import.meta.glob('../graves/*/index.ts');

  /** Mount the overlay for the given grave entry */
  mount(grave: GraveEntry, onExit: () => void): void {
    this.unmount();
    this.onExitCallback = onExit;

    const container = document.getElementById('game-container');
    if (!container) return;

    const overlay = document.createElement('div');
    overlay.id = 'grave-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease;
    `;

    // Panel wrapper with fixed positioning, centered
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
    `;

    // Panel styled with frame_panel.png as border-image
    const panel = document.createElement('div');
    const baseUrl = import.meta.env.BASE_URL;
    panel.style.cssText = `
      position: relative;
      width: min(92vw, 960px);
      height: min(86vh, 600px);
      background: none;
      border-image: url('${baseUrl}assets/images/ui/frame_panel.png') 60 64 60 64 fill;
      border-style: solid;
      border-width: 60px 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      pointer-events: all;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.4s ease, transform 0.4s ease;
    `;

    // Inner content box with opaque navy background
    const content = document.createElement('div');
    content.style.cssText = `
      position: absolute;
      inset: 60px 64px;
      background-color: #0e1526;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 32px;
      overflow: hidden;
    `;

    // Medallion
    const medalMap: Record<string, string> = {
      'road-rash':      `${baseUrl}assets/images/portraits/medal_roadrash.png`,
      'google-reader':  `${baseUrl}assets/images/portraits/medal_reader.png`,
      'clippy':         `${baseUrl}assets/images/portraits/medal_clippy.png`,
      'winamp':         `${baseUrl}assets/images/portraits/medal_winamp.png`,
      'unmarked-grave': `${baseUrl}assets/images/portraits/medal_unmarked.png`,
    };
    if (medalMap[grave.id]) {
      const med = document.createElement('img');
      med.src = medalMap[grave.id];
      med.style.cssText = 'width: 96px; height: 96px; margin-bottom: 12px; image-rendering: pixelated;';
      content.appendChild(med);
    }

    // Title
    const title = document.createElement('h2');
    title.textContent = `${grave.name} has risen`;
    title.style.cssText = `
      font-family: 'Cinzel', serif;
      font-size: 1.8rem;
      color: #d9f2ee;
      text-align: center;
      margin-bottom: 8px;
      text-shadow: 0 0 12px #7fd1d8;
    `;
    content.appendChild(title);

    // Years
    const born = extractYear(grave.born);
    const died = extractYear(grave.died);
    const years = document.createElement('p');
    years.textContent = `${born} – ${died}`;
    years.style.cssText = `
      font-family: 'Pixelify Sans', sans-serif;
      font-size: 1rem;
      color: #c9b98a;
      margin-bottom: 12px;
    `;
    content.appendChild(years);

    // Epitaph
    const epitaph = document.createElement('p');
    epitaph.textContent = `"${grave.epitaph}"`;
    epitaph.style.cssText = `
      font-family: 'Cinzel', serif;
      font-size: 1rem;
      font-style: italic;
      color: #d9f2ee;
      text-align: center;
      margin-bottom: 18px;
      max-width: 540px;
    `;
    content.appendChild(epitaph);

    // Phase 2 placeholder
    const placeholder = document.createElement('p');
    placeholder.textContent = 'The full tribute app arrives in Phase 2.';
    placeholder.style.cssText = `
      font-family: 'Pixelify Sans', sans-serif;
      font-size: 0.9rem;
      color: #5d6b80;
      margin-bottom: 24px;
    `;
    content.appendChild(placeholder);

    // App content area (Phase 2 mount point)
    const appContainer = document.createElement('div');
    appContainer.id = 'grave-app-container';
    appContainer.style.cssText = `
      width: 100%;
      flex: 1;
      overflow: auto;
    `;
    content.appendChild(appContainer);

    // Exit button
    const exitBtn = document.createElement('button');
    exitBtn.textContent = 'Requiescat in pace';
    exitBtn.style.cssText = `
      font-family: 'Cinzel', serif;
      font-size: 1rem;
      color: #c9b98a;
      background: transparent;
      border: 2px solid #c9b98a;
      padding: 10px 28px;
      cursor: pointer;
      margin-top: 8px;
      transition: color 0.2s, border-color 0.2s;
    `;
    exitBtn.addEventListener('mouseenter', () => {
      exitBtn.style.color = '#d9f2ee';
      exitBtn.style.borderColor = '#d9f2ee';
    });
    exitBtn.addEventListener('mouseleave', () => {
      exitBtn.style.color = '#c9b98a';
      exitBtn.style.borderColor = '#c9b98a';
    });
    exitBtn.addEventListener('click', () => this.triggerExit());
    content.appendChild(exitBtn);

    panel.appendChild(content);
    wrapper.appendChild(panel);
    overlay.appendChild(wrapper);
    container.appendChild(overlay);
    this.overlayEl = overlay;

    // Fade in with translateY
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    });

    // Try loading Phase 2 app module (will fail gracefully in Phase 1)
    this.tryMountApp(grave.id, appContainer);
  }

  /** Attempt dynamic import of a Phase 2 grave app */
  private async tryMountApp(graveId: string, container: HTMLElement): Promise<void> {
    try {
      const modulePath = `../graves/${graveId}/index.ts`;
      const loader = GraveOverlay.appModules[modulePath];
      if (!loader) {
        // Phase 1: app module not found yet — silently ignore
        return;
      }
      const mod = await loader() as { default: GraveApp };
      const app = mod.default;
      this.appInstance = app;
      await app.mount(container);
    } catch {
      // Phase 1: no app modules exist yet — silently ignore
    }
  }

  private triggerExit(): void {
    // Dispatch a custom DOM event that ResurrectionRitual listens to
    window.dispatchEvent(new CustomEvent('rip-exit'));
  }

  unmount(): void {
    if (this.appInstance) {
      try {
        this.appInstance.dispose();
      } catch {
        // ignore
      }
      this.appInstance = null;
    }
    if (this.overlayEl) {
      const panel = this.overlayEl.querySelector('div > div') as HTMLElement;
      if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(20px)';
      }
      this.overlayEl.style.opacity = '0';
      const el = this.overlayEl;
      setTimeout(() => el.remove(), 420);
      this.overlayEl = null;
    }
    this.onExitCallback = null;
  }
}
