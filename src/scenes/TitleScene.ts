/**
 * TitleScene — full-screen keyart, title text, "Click to enter" prompt,
 * and a Credits button. First click unlocks audio and starts the waltz.
 */
import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  private waltz: Phaser.Sound.BaseSound | null = null;
  private audioUnlocked = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background keyart — scale to cover 1280×720
    const bg = this.add.image(width / 2, height / 2, 'title_keyart');
    const scaleX = width  / bg.width;
    const scaleY = height / bg.height;
    bg.setScale(Math.max(scaleX, scaleY));

    // Title text
    const title = this.add.text(width / 2, 100, 'RAISE DEAD', {
      fontFamily: "'Cinzel', serif",
      fontSize: '64px',
      color: '#d9f2ee',
      stroke: '#0b1020',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);

    // Soft glow effect via shadow
    title.setShadow(0, 0, '#7fd1d8', 18, true, true);

    // Subtitle
    this.add.text(width / 2, 168, 'Graveyard of Lost Apps', {
      fontFamily: "'Cinzel', serif",
      fontSize: '22px',
      color: '#d9f2ee',
      stroke: '#0b1020',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // "Click to enter" prompt
    const clickPrompt = this.add.text(width / 2, height - 120, 'Click to enter the graveyard', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '20px',
      color: '#c9b98a',
    }).setOrigin(0.5, 0.5);

    // Pulsing tween on click prompt
    this.tweens.add({
      targets: clickPrompt,
      alpha: { from: 1, to: 0.4 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Credits button
    const creditsBtn = this.add.text(width / 2, height - 70, 'Credits', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '16px',
      color: '#5d6b80',
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    creditsBtn.on('pointerover', () => creditsBtn.setColor('#c9b98a'));
    creditsBtn.on('pointerout',  () => creditsBtn.setColor('#5d6b80'));
    creditsBtn.on('pointerdown', () => {
      this.scene.launch('CreditsScene', { from: 'TitleScene' });
    });

    // Input — first click unlocks audio, second click (or same) enters graveyard
    this.input.once('pointerdown', () => this.handleFirstClick(clickPrompt));
  }

  private handleFirstClick(clickPrompt: Phaser.GameObjects.Text): void {
    if (!this.audioUnlocked) {
      this.audioUnlocked = true;
      // Start waltz
      this.waltz = this.sound.add('title_waltz', { loop: true, volume: 0.45 });
      this.waltz.play();
    }

    // Fade out waltz then transition
    clickPrompt.setText('Entering…');
    if (this.waltz && 'setVolume' in this.waltz) {
      this.tweens.add({
        targets: this.waltz,
        volume: 0,
        duration: 800,
        onComplete: () => this.enterGraveyard(),
      });
    } else {
      this.time.delayedCall(300, () => this.enterGraveyard());
    }
  }

  private enterGraveyard(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.waltz?.destroy();
      this.scene.start('GraveyardWorld');
    });
  }
}
