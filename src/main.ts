/**
 * main.ts — game entry point.
 * Bootstraps Phaser and exposes window.__RD debug hooks.
 */
import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { GraveyardWorld } from './scenes/GraveyardWorld';

// Augment Window with __RD at module scope
declare global {
  interface Window {
    __RD: {
      game: Phaser.Game;
      goto(sceneKey: string): void;
      teleportToGrave(id: string): void;
      raise(id: string): void;
      /** A8: Teleport wizard to raw world coordinates and centre camera. */
      teleport(x: number, y: number): void;
      /** A8: Trigger a witch fly-by immediately (delegates to GraveyardWorld). */
      spawnWitch(): void;
      /** A8: Return the live GraveyardWorld scene (or null if not active). */
      world(): GraveyardWorld | null;
      /** B: found egg ids; pass true to reset. */
      eggs(reset?: boolean): string[];
    };
  }
}

// P1-8: Wait for fonts to load with a timeout to ensure they're used
async function main(): Promise<void> {
  await Promise.race([
    Promise.all([
      document.fonts.load('20px "Pixelify Sans"'),
      document.fonts.load('20px Cinzel'),
      document.fonts.load('italic 15px Cinzel'),
    ]),
    new Promise(r => setTimeout(r, 2500)), // 2.5s timeout
  ]).catch(() => {
    // If font loading fails, continue anyway
  });

  // N5: software WebGL (SwiftShader/llvmpipe, GPU-less VMs, blocklisted drivers) runs at ~0 fps
  // with our lighting; Phaser's Canvas renderer runs the same game at 20-30 fps there.
  const rendererParam = new URLSearchParams(window.location.search).get('renderer');
  const useCanvas = rendererParam === 'canvas' || (rendererParam !== 'webgl' && isSoftwareWebGL());
  const game = new Phaser.Game({ ...GAME_CONFIG, type: useCanvas ? Phaser.CANVAS : GAME_CONFIG.type });
  if (!useCanvas && rendererParam !== 'webgl') startFpsWatchdog(game);

  // P2-1: Expose window.__RD only in DEV mode or with ?debug=1 query param
  const params = new URLSearchParams(window.location.search);
  const isDebugEnabled = import.meta.env.DEV || params.has('debug');
  
  if (isDebugEnabled) {
    window.__RD = {
      /** The live Phaser.Game instance */
      game,

      /** B: found egg ids (?debug=1). Pass true to reset. */
      eggs(reset?: boolean): string[] {
        const world = game.scene.getScene('GraveyardWorld') as unknown as { eggManager?: { defs: { id: string }[]; isFound(id: string): boolean; reset(): void } } | null;
        const m = world?.eggManager;
        if (!m) return [];
        if (reset) m.reset();
        return m.defs.filter((d) => m.isFound(d.id)).map((d) => d.id);
      },

      /** Switch to any scene by key */
      goto(sceneKey: string): void {
        const current = game.scene.getScenes(true)[0];
        if (current) {
          current.scene.start(sceneKey);
        } else {
          game.scene.start(sceneKey);
        }
      },

      /** Teleport wizard to a grave by ID (GraveyardWorld must be running) */
      teleportToGrave(id: string): void {
        const world = game.scene.getScene('GraveyardWorld') as GraveyardWorld | null;
        if (world && game.scene.isActive('GraveyardWorld')) {
          world.teleportToGrave(id);
        } else {
          console.warn('[__RD] GraveyardWorld is not active');
        }
      },

      /** Start the resurrection ritual for a grave by ID */
      raise(id: string): void {
        const world = game.scene.getScene('GraveyardWorld') as GraveyardWorld | null;
        if (world && game.scene.isActive('GraveyardWorld')) {
          world.raiseGrave(id);
        } else {
          console.warn('[__RD] GraveyardWorld is not active — call __RD.goto("GraveyardWorld") first');
        }
      },

      /** A8: Teleport wizard to raw world coordinates and centre camera. */
      teleport(x: number, y: number): void {
        const world = game.scene.getScene('GraveyardWorld') as GraveyardWorld | null;
        if (world && game.scene.isActive('GraveyardWorld')) {
          world.teleport(x, y);
        } else {
          console.warn('[__RD] GraveyardWorld is not active');
        }
      },

      /** A8: Trigger a witch fly-by immediately. */
      spawnWitch(): void {
        const world = game.scene.getScene('GraveyardWorld') as GraveyardWorld | null;
        if (world && game.scene.isActive('GraveyardWorld')) {
          world.spawnWitch();
        } else {
          console.warn('[__RD] GraveyardWorld is not active');
        }
      },

      /** A8: Return the live GraveyardWorld scene (or null if not active). */
      world(): GraveyardWorld | null {
        const scene = game.scene.getScene('GraveyardWorld') as GraveyardWorld | null;
        if (!scene || !game.scene.isActive('GraveyardWorld')) {
          console.warn('[__RD] GraveyardWorld is not active');
          return null;
        }
        return scene;
      },
    };

    console.info('[Raise Dead] window.__RD debug hooks available:', Object.keys(window.__RD));
  }
}

main().catch(console.error);

/** N5: true when the browser would give us a software / major-performance-caveat WebGL context. */
function isSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const strict = c.getContext('webgl', { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null;
    if (!strict) return true;
    const ext = strict.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(strict.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    strict.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

/** N5: if WebGL still crawls (< 6 fps over 5 s once the title is up), reload once on the Canvas renderer. */
function startFpsWatchdog(game: Phaser.Game): void {
  if (sessionStorage.getItem('rd_canvas_fallback')) return;
  window.setTimeout(() => {
    const f0 = game.loop.frame;
    window.setTimeout(() => {
      if (document.hidden) return;
      if (game.loop.frame - f0 < 30) {
        sessionStorage.setItem('rd_canvas_fallback', '1');
        const u = new URL(window.location.href);
        u.searchParams.set('renderer', 'canvas');
        window.location.replace(u.toString());
      }
    }, 5000);
  }, 4000);
}
