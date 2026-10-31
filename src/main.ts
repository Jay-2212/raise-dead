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
  interface ImportMeta {
    env: { DEV: boolean };
  }
}

// Wait for fonts before starting the game
async function main(): Promise<void> {
  await document.fonts.ready;

  const game = new Phaser.Game(GAME_CONFIG);

  // ── window.__RD debug helpers ─────────────────────────────────────────────
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

  if (import.meta.env.DEV) {
    console.info('[Raise Dead] window.__RD debug hooks available:', Object.keys(window.__RD));
  }
}

main().catch(console.error);
