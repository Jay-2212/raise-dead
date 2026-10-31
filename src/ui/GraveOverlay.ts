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

  /** Mount the overlay for the given grave entry */
  mount(grave: GraveEntry, onExit: () => void): void {
    this.unmount();
    this.onExitCallback = onExit;

    const container = document.getElementById('game-container');
    if (!container) return;

    const overlay = document.createElement('div');
    overlay.id = 'grave-overlay';
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    `;

    // Panel styled with frame_panel.png as border-image
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: relative;
      width: min(92vw, 860px);
      min-height: min(86vh, 520px);
      max-height: min(86vh, 620px);
      background-color: #0e1526;
      border-image: url('/assets/images/ui/frame_panel.png') 60 64 60 64 fill;
      border-style: solid;
      border-width: 60px 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      padding: 16px 32px 24px;
      pointer-events: all;
    `;

    // Medallion
    const medalMap: Record<string, string> = {
      'road-rash':      '/assets/images/portraits/medal_roadrash.png',
      'google-reader':  '/assets/images/portraits/medal_reader.png',
      'clippy':         '/assets/images/portraits/medal_clippy.png',
      'winamp':         '/assets/images/portraits/medal_winamp.png',
      'unmarked-grave': '/assets/images/portraits/medal_unmarked.png',
    };
    if (medalMap[grave.id]) {
      const med = document.createElement('img');
      med.src = medalMap[grave.id];
      med.style.cssText = 'width: 96px; height: 96px; margin-bottom: 12px; image-rendering: pixelated;';
      panel.appendChild(med);
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
    panel.appendChild(title);

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
    panel.appendChild(years);

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
    panel.appendChild(epitaph);

    // Phase 2 placeholder
    const placeholder = document.createElement('p');
    placeholder.textContent = 'The full tribute app arrives in Phase 2.';
    placeholder.style.cssText = `
      font-family: 'Pixelify Sans', sans-serif;
      font-size: 0.9rem;
      color: #5d6b80;
      margin-bottom: 24px;
    `;
    panel.appendChild(placeholder);

    // App content area (Phase 2 mount point)
    const appContainer = document.createElement('div');
    appContainer.id = 'grave-app-container';
    appContainer.style.cssText = `
      width: 100%;
      flex: 1;
      overflow: auto;
    `;
    panel.appendChild(appContainer);

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
    panel.appendChild(exitBtn);

    overlay.appendChild(panel);
    container.appendChild(overlay);
    this.overlayEl = overlay;

    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
    });

    // Try loading Phase 2 app module (will fail gracefully in Phase 1)
    this.tryMountApp(grave.id, appContainer);

    // Keyboard Esc
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', escHandler);
        this.triggerExit();
      }
    };
    window.addEventListener('keydown', escHandler);
  }

  /** Attempt dynamic import of a Phase 2 grave app */
  private async tryMountApp(graveId: string, container: HTMLElement): Promise<void> {
    try {
      const mod = await import(/* @vite-ignore */ `../graves/${graveId}/index.ts`);
      const app = mod.default as GraveApp;
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
      this.overlayEl.style.opacity = '0';
      const el = this.overlayEl;
      setTimeout(() => el.remove(), 420);
      this.overlayEl = null;
    }
    this.onExitCallback = null;
  }
}
