/**
 * BootScene — first scene, sets up scale and loads minimal assets,
 * then moves immediately to PreloadScene.
 */
import Phaser from 'phaser';
import { installMixer } from '../audio/Mixer';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load only what's needed for the PreloadScene progress bar
    // (nothing required here — Phaser itself handles the scale)
  }

  create(): void {
    // Music / Effects buses + silent fallback for not-yet-loaded sounds
    installMixer(this.game);

    // Remove loading screen placeholder
    const el = document.getElementById('loading-screen');
    if (el) el.remove();

    this.scene.start('PreloadScene');
  }
}
