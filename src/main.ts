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

  const game = new Phaser.Game(GAME_CONFIG);

  // P2-1: Expose window.__RD only in DEV mode or with ?debug=1 query param
  const params = new URLSearchParams(window.location.search);
  const isDebugEnabled = import.meta.env.DEV || params.has('debug');
  
  if (isDebugEnabled) {
    window.__RD = {
      /** The live Phaser.Game instance */
      game,

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
    };

    console.info('[Raise Dead] window.__RD debug hooks available:', Object.keys(window.__RD));
  }
}

main().catch(console.error);
