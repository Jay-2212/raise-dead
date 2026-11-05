/**
 * TitleScene — full-screen keyart, title text, "Click to enter" prompt,
 * and a Credits button. One click / tap / Enter / Space unlocks audio and enters the graveyard.
 */
import Phaser from 'phaser';
import { queueWorldAssets, createWizardAnimations } from './worldAssets';
import { unlockAudio } from '../audio/Mixer';

export class TitleScene extends Phaser.Scene {
  private waltz: Phaser.Sound.BaseSound | null = null;
  private entering = false;
  private progressText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.entering = false;

    // P1-18: Read saved mute state and apply
    const isMuted = localStorage.getItem('rd_muted') === '1';
    this.sound.mute = isMuted;

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

    // One press enters: a single click, tap, Enter or Space.
    const touch = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
    const clickPrompt = this.add.text(width / 2, height - 120, touch ? 'Tap to enter the graveyard' : 'Click or press Enter to enter the graveyard', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '26px',
      color: '#f3ecc8',
      stroke: '#0b1020',
      strokeThickness: 2,
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

    // Start background loading of world assets
    queueWorldAssets(this.load);

    // Loading feedback (only shown while the graveyard is still being summoned)
    this.progressText = this.add.text(width / 2, height / 2 + 80, 'Summoning… 0%', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '16px',
      color: '#5d6b80',
    }).setOrigin(0.5, 0.5);

    this.load.on('progress', (v: number) => {
      this.progressText?.setText(`Summoning… ${Math.round(v * 100)}%`);
    });

    this.load.once('complete', () => {
      this.progressText?.destroy();
      this.progressText = null;
      createWizardAnimations(this);
      this.registry.set('worldLoaded', true);
    });

    this.load.start();

    // The waltz starts right away where the browser allows autoplay; otherwise it is simply silent.
    this.waltz = this.sound.add('title_waltz', { loop: true, volume: 0 });
    this.waltz.play();
    this.tweens.add({ targets: this.waltz, volume: 0.45, duration: 1200 });

    // Input: the first press (pointer or key) unlocks audio AND enters. No second confirmation.
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.includes(creditsBtn)) return;
      this.enter(clickPrompt);
    });
    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => this.enter(clickPrompt));
    kb.on('keydown-SPACE', () => this.enter(clickPrompt));
  }

  private enter(clickPrompt: Phaser.GameObjects.Text): void {
    if (this.entering || this.scene.isActive('CreditsScene')) return;
    this.entering = true;
    // Same gesture resumes the AudioContext; if the browser refuses, entry carries on silently.
    unlockAudio();
    this.tweens.killTweensOf(clickPrompt);
    clickPrompt.setAlpha(1).setText('Entering…');
    if (this.waltz) {
      this.tweens.killTweensOf(this.waltz);
      this.tweens.add({ targets: this.waltz, volume: 0, duration: 380 });
    }
    if (this.registry.get('worldLoaded')) {
      this.performTransition();
    } else {
      this.load.once('complete', () => this.performTransition());
    }
  }

  private performTransition(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // kill the fade tween first: a tween writing volume to a destroyed sound throws and stalls the loop
      if (this.waltz) { this.tweens.killTweensOf(this.waltz); this.waltz.destroy(); this.waltz = null; }
      this.scene.start('GraveyardWorld');
    });
  }
}
