/**
 * PreloadScene — loads title assets quickly, then starts TitleScene.
 * World assets are loaded in the background by TitleScene.
 */
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createProgressBar();
    // Set base path for all assets
    this.load.setPath(import.meta.env.BASE_URL);
    this.loadTitleAssets();
  }

  private createProgressBar(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, 400, 4, 0x1c2a4a);
    const bar = this.add.rectangle(cx - 200, cy, 0, 4, 0x7fd1d8).setOrigin(0, 0.5);

    const pct = this.add.text(cx, cy + 20, '0%', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '14px',
      color: '#5d6b80',
    }).setOrigin(0.5, 0);

    const label = this.add.text(cx, cy - 24, 'RAISE DEAD', {
      fontFamily: "'Cinzel', serif",
      fontSize: '22px',
      color: '#d9f2ee',
    }).setOrigin(0.5, 0.5);
    label.setAlpha(0.7);

    this.load.on('progress', (v: number) => {
      bar.width = 400 * v;
      pct.setText(Math.round(v * 100) + '%');
    });
  }

  private loadTitleAssets(): void {
    // Only load title-screen assets for fast initial load
    this.load.image('title_keyart',  'assets/images/backgrounds/title_keyart.jpg');
    this.load.audio('title_waltz',   ['assets/audio/music/title_musicbox_spooky_waltz.ogg', 'assets/audio/music/title_musicbox_spooky_waltz.mp3']);
    this.load.image('frame_panel',   'assets/images/ui/frame_panel.png');
    this.load.image('vignette_moonlit', 'assets/images/ui/vignette_moonlit.png');
    this.load.json('graves',         'data/graves.json');
    this.load.json('voice_lines',    'data/voice_lines.json');
  }

  create(): void {
    // Animations will be created in TitleScene when world assets load
    this.scene.start('TitleScene');
  }
}
