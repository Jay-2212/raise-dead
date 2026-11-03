/**
 * GraveOverlay — DOM overlay that mounts a grave app when a resurrection ritual completes.
 * Phase 1: shows placeholder content with grave info.
 * Phase 2: dynamically imports src/graves/<id>/index.ts for full tribute apps.
 */
import { GraveEntry, extractYear } from '../types/graves';

export interface GraveApp {
  mount(container: HTMLElement): Promise<void>;
  dispose(): void;
  compactHeader?: boolean;
}

export class GraveOverlay {
  private overlayEl: HTMLElement | null = null;
  private appInstance: GraveApp | null = null;
  private onExitCallback: (() => void) | null = null;
  private originalTouchAction: string = '';  // A11: Store original body touch-action
  private gameScene: any = null;  // Reference to GraveyardWorld for keyboard management
  private static appModules = import.meta.glob('../graves/*/index.ts');

  /** Mount the overlay for the given grave entry */
  mount(grave: GraveEntry, onExit: () => void, gameScene?: any): void {
    this.unmount();
    this.onExitCallback = onExit;
    this.gameScene = gameScene;

    const container = document.getElementById('game-container');
    if (!container) return;

    // A11: Set touch-action on body while overlay is open so button can relax it
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = 'manipulation';
    this.originalTouchAction = originalTouchAction;

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
      pointer-events: all;
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
      inset: 0;
      background-color: #0e1526;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 32px;
      overflow: hidden;
    `;

    // App content area (Phase 2 mount point)
    const appContainer = document.createElement('div');
    appContainer.id = 'grave-app-container';
    appContainer.style.cssText = `
      width: 100%;
      flex: 1;
      overflow: auto;
      min-height: 0;
    `;

    // Try loading Phase 2 app module first to check for compactHeader
    this.tryMountAppAndBuildHeader(grave, baseUrl, content, appContainer, overlay, wrapper, panel, container);
  }

  /** Load app module first, then build header based on compactHeader flag */
  private async tryMountAppAndBuildHeader(
    grave: GraveEntry,
    baseUrl: string,
    content: HTMLElement,
    appContainer: HTMLElement,
    overlay: HTMLElement,
    wrapper: HTMLElement,
    panel: HTMLElement,
    gameContainer: HTMLElement
  ): Promise<void> {
    let compactHeader = false;

    // Try loading Phase 2 app module to check for compactHeader flag
    try {
      const modulePath = `../graves/${grave.id}/index.ts`;
      const loader = GraveOverlay.appModules[modulePath];
      if (loader) {
        const mod = await loader() as { default: GraveApp };
        const app = mod.default;
        compactHeader = app.compactHeader ?? false;
        this.appInstance = app;
      }
    } catch {
      // Phase 1: no app modules exist yet — silently ignore
    }

    // N3: static OSS game graves render in an iframe with the compact header
    const gamePath = grave.game;
    if (gamePath) compactHeader = true;

    // Now build the header based on compactHeader flag
    this.buildHeader(grave, baseUrl, content, appContainer, compactHeader);

    // Add app container to content
    content.appendChild(appContainer);

    // Exit button (always shown)
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
      touch-action: manipulation;
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
    exitBtn.addEventListener('touchend', () => this.triggerExit());
    content.appendChild(exitBtn);

    // N7: a corner close button too (testers looked for an X)
    const xBtn = document.createElement('button');
    xBtn.textContent = '✕';
    xBtn.setAttribute('aria-label', 'Close');
    xBtn.title = 'Close (Esc)';
    xBtn.style.cssText = `
      position: absolute; top: 6px; right: 8px; z-index: 5;
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(11,16,32,0.85); color: #c9b98a;
      border: 1px solid #c9b98a; font-size: 16px; line-height: 1;
      cursor: pointer;
    `;
    xBtn.addEventListener('click', () => this.triggerExit());
    content.appendChild(xBtn);

    panel.appendChild(content);
    wrapper.appendChild(panel);
    overlay.appendChild(wrapper);
    gameContainer.appendChild(overlay);
    this.overlayEl = overlay;

    // Disable Phaser keyboard global capture while overlay is open
    if (this.gameScene?.input?.keyboard) {
      this.gameScene.input.keyboard.disableGlobalCapture();
    }

    // Add Esc key handler to still exit
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.triggerExit();
      }
    };
    document.addEventListener('keydown', handleEsc);
    // Store for cleanup
    (this as any).escKeyHandler = handleEsc;

    // Fade in with translateY
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    });

    // N3: mount the game iframe
    if (gamePath) {
      this.mountGameFrame(grave, baseUrl, appContainer);
    }

    // Mount the app if it exists
    if (this.appInstance) {
      try {
        await this.appInstance.mount(appContainer);
      } catch {
        // App mount failed
      }
    }
  }

  /** Build the header: full (default) or compact */
  private buildHeader(
    grave: GraveEntry,
    baseUrl: string,
    content: HTMLElement,
    appContainer: HTMLElement,
    compactHeader: boolean
  ): void {
    if (compactHeader) {
      // Compact header: medal 48px inline with title, years on same row, hide epitaph/placeholder
      const headerRow = document.createElement('div');
      headerRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        width: 100%;
      `;

      // Medal 48px
      const medalMap: Record<string, string> = {
        'road-rash':      `${baseUrl}assets/images/portraits/medal_roadrash.png`,
        'google-reader':  `${baseUrl}assets/images/portraits/medal_reader.png`,
        'clippy':         `${baseUrl}assets/images/portraits/medal_clicky.png`,
        'winamp':         `${baseUrl}assets/images/portraits/medal_winamp.png`,
        'unmarked-grave': `${baseUrl}assets/images/portraits/medal_unmarked.png`,
        'space-cadet':    `${baseUrl}assets/images/portraits/medal_spacecadet.png`,
        '3d-pipes':       `${baseUrl}assets/images/portraits/medal_pipes.png`,
        'bouncing-logo':  `${baseUrl}assets/images/portraits/medal_bounce.png`,
      };
      if (medalMap[grave.id]) {
        const med = document.createElement('img');
        med.src = medalMap[grave.id];
        med.style.cssText = 'width: 48px; height: 48px; image-rendering: pixelated; flex-shrink: 0;';
        headerRow.appendChild(med);
      }

      // Title and years in a column
      const textCol = document.createElement('div');
      textCol.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      `;

      const title = document.createElement('h2');
      title.textContent = `${grave.name} has risen`;
      title.style.cssText = `
        font-family: 'Cinzel', serif;
        font-size: 1.4rem;
        color: #d9f2ee;
        text-align: left;
        margin: 0;
        text-shadow: 0 0 12px #7fd1d8;
      `;
      textCol.appendChild(title);

      const born = extractYear(grave.born);
      const died = extractYear(grave.died);
      const years = document.createElement('p');
      years.textContent = `${born} – ${died}`;
      years.style.cssText = `
        font-family: 'Pixelify Sans', sans-serif;
        font-size: 0.9rem;
        color: #c9b98a;
        margin: 0;
      `;
      textCol.appendChild(years);

      headerRow.appendChild(textCol);
      content.appendChild(headerRow);

      // App container gets flex: 1 for full remaining space
      appContainer.style.cssText = `
        width: 100%;
        flex: 1;
        overflow: auto;
        min-height: 0;
      `;
    } else {
      // Full header (original layout)
      const medalMap: Record<string, string> = {
        'road-rash':      `${baseUrl}assets/images/portraits/medal_roadrash.png`,
        'google-reader':  `${baseUrl}assets/images/portraits/medal_reader.png`,
        'clippy':         `${baseUrl}assets/images/portraits/medal_clicky.png`,
        'winamp':         `${baseUrl}assets/images/portraits/medal_winamp.png`,
        'unmarked-grave': `${baseUrl}assets/images/portraits/medal_unmarked.png`,
        'space-cadet':    `${baseUrl}assets/images/portraits/medal_spacecadet.png`,
        '3d-pipes':       `${baseUrl}assets/images/portraits/medal_pipes.png`,
        'bouncing-logo':  `${baseUrl}assets/images/portraits/medal_bounce.png`,
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
      placeholder.textContent = 'This one still sleeps. Its tribute is being carved by moonlight; come back soon.';
      placeholder.style.cssText = `
        font-family: 'Pixelify Sans', sans-serif;
        font-size: 0.9rem;
        color: #5d6b80;
        margin-bottom: 24px;
      `;
      content.appendChild(placeholder);
    }
  }

  /** N3: vendored static game in a same-origin, script-only sandbox (no top navigation, no popups, no forms). */
  private mountGameFrame(grave: GraveEntry, baseUrl: string, appContainer: HTMLElement): void {
    appContainer.style.overflow = 'hidden';
    appContainer.style.display = 'flex';
    appContainer.style.flexDirection = 'column';
    appContainer.style.height = 'min(68vh, 62vw)';
    appContainer.style.minHeight = '260px';

    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}${grave.game}`;
    iframe.title = grave.name;
    iframe.setAttribute('sandbox', grave.game_sandbox ?? 'allow-scripts allow-same-origin allow-pointer-lock');
    iframe.setAttribute('allow', 'fullscreen; autoplay');
    iframe.style.cssText = 'flex: 1; width: 100%; border: 1px solid #2b3a4f; border-radius: 6px; background: #000; display: block;';
    iframe.addEventListener('load', () => {
      try {
        // Esc inside the game still lays it to rest (same-origin static content we host)
        iframe.contentWindow?.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Escape') this.triggerExit();
        });
      } catch { /* cross-origin: rely on the button */ }
      iframe.focus();
    });
    appContainer.appendChild(iframe);

    if (grave.game_credit) {
      const credit = document.createElement('p');
      credit.textContent = `${grave.game_credit} · Esc or the button below to lay it to rest.`;
      credit.style.cssText = "font-family: 'Pixelify Sans', sans-serif; font-size: 0.75rem; color: #7d8ba0; margin: 6px 0 0; text-align: center;";
      appContainer.appendChild(credit);
    }
  }

  private triggerExit(): void {
    // Call the exit callback passed to mount() (idempotent: triggerExit may be called multiple times)
    if (this.onExitCallback) {
      this.onExitCallback();
      this.onExitCallback = null; // prevent double-call
    }
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
    
    // A11: Restore original body touch-action
    if (this.originalTouchAction) {
      document.body.style.touchAction = this.originalTouchAction;
    } else {
      document.body.style.touchAction = '';
    }

    // Re-enable Phaser keyboard global capture
    if (this.gameScene?.input?.keyboard) {
      this.gameScene.input.keyboard.enableGlobalCapture();
      this.gameScene.input.keyboard.resetKeys(); // N5: no stuck walking after an iframe ate the keyup
    }
    // N3/N5: take keyboard focus back from a game iframe
    try {
      window.focus();
      const cv = this.gameScene?.game?.canvas as HTMLCanvasElement | undefined;
      if (cv) { if (!cv.hasAttribute('tabindex')) cv.setAttribute('tabindex', '0'); cv.focus(); }
    } catch { /* ignore */ }

    // Remove Esc key handler
    if ((this as any).escKeyHandler) {
      document.removeEventListener('keydown', (this as any).escKeyHandler);
      delete (this as any).escKeyHandler;
    }
    
    if (this.overlayEl) {
      const panel = this.overlayEl.querySelector('div > div') as HTMLElement;
      if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(20px)';
      }
      this.overlayEl.style.pointerEvents = 'none'; // N5: don't swallow clicks during the fade
      this.overlayEl.style.opacity = '0';
      const el = this.overlayEl;
      setTimeout(() => el.remove(), 420);
      this.overlayEl = null;
    }
    this.onExitCallback = null;
  }
}
