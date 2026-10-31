/**
 * config.ts — Phaser.Game configuration.
 * Scenes are imported and listed here; the game boots through BootScene.
 */
import Phaser from 'phaser';
import { BootScene }           from './scenes/BootScene';
import { PreloadScene }        from './scenes/PreloadScene';
import { TitleScene }          from './scenes/TitleScene';
import { GraveyardWorld }      from './scenes/GraveyardWorld';
import { UIScene }             from './scenes/UIScene';
import { ResurrectionRitual }  from './scenes/ResurrectionRitual';
import { CreditsScene }        from './scenes/CreditsScene';

// Import the rex plugin for VirtualJoystick
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#0b1020',
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    GraveyardWorld,
    UIScene,
    ResurrectionRitual,
    CreditsScene,
  ],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  plugins: {
    global: [
      {
        key: 'rexVirtualJoystick',
        plugin: VirtualJoystickPlugin,
        start: true,
      },
    ],
  },
};
