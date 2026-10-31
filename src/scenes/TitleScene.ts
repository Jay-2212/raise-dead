/**
 * TitleScene — full-screen keyart, title text, "Click to enter" prompt,
 * and a Credits button. First click unlocks audio and starts the waltz.
 */
import Phaser from 'phaser';
import { queueWorldAssets, createWizardAnimations } from './worldAssets';

export class TitleScene extends Phaser.Scene {
  private waltz: Phaser.Sound.BaseSound | null = null;
  private audioUnlocked = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;

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

    // "Click to enter" prompt
    const clickPrompt = this.add.text(width / 2, height - 120, 'Click to enter the graveyard · or Press Enter/Space', {
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
    creditsBtn.on('pointerdown', (event: Phaser.Input.Pointer) => {
      // P1-4: Don't process if pointer is over another element
      // Simple fix: just launch Credits without triggering the input listener
      this.scene.launch('CreditsScene', { from: 'TitleScene' });
    });

    // Start background loading of world assets
    queueWorldAssets(this.load);
    
    // Create progress text for loading feedback
    const progressText = this.add.text(width / 2, height / 2 + 80, 'Summoning… 0%', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '16px',
      color: '#5d6b80',
    }).setOrigin(0.5, 0.5);

    // Listen to loader progress and completion
    this.load.on('progress', (v: number) => {
      progressText.setText(`Summoning… ${Math.round(v * 100)}%`);
    });

    this.load.once('complete', () => {
      progressText.destroy();
      createWizardAnimations(this);
      this.registry.set('worldLoaded', true);
    });

    this.load.start();

    // Input — first click unlocks audio and starts waltz
    let firstInteraction = true;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // P1-4: Check if Credits scene is active
      if (!this.scene.isActive('CreditsScene')) {
        if (firstInteraction) {
          firstInteraction = false;
          this.handleFirstInteraction(clickPrompt);
        } else if (this.audioUnlocked) {
          // P1-5: Second click to enter graveyard
          this.enterGraveyard();
        }
      }
    });

    // Keyboard listeners for Enter/Space
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    enterKey.on('down', () => {
      if (firstInteraction) {
        firstInteraction = false;
        this.handleFirstInteraction(clickPrompt);
      } else if (this.audioUnlocked) {
        // P1-5: Enter key to proceed to graveyard on second press
        this.enterGraveyard();
      }
    });
    spaceKey.on('down', () => {
      if (firstInteraction) {
        firstInteraction = false;
        this.handleFirstInteraction(clickPrompt);
      } else if (this.audioUnlocked) {
        // P1-5: Space key to proceed to graveyard on second press
        this.enterGraveyard();
      }
    });
  }

  private handleFirstInteraction(clickPrompt: Phaser.GameObjects.Text): void {
    if (!this.audioUnlocked) {
      // P1-5: First interaction unlocks audio and starts waltz, but doesn't enter yet
      this.audioUnlocked = true;
      // Start waltz
      this.waltz = this.sound.add('title_waltz', { loop: true, volume: 0 });
      this.waltz.play();
      
      // Fade in the waltz so user hears it
      this.tweens.add({
        targets: this.waltz,
        volume: 0.45,
        duration: 1000,
      });
      
      // Change prompt text
      clickPrompt.setText('Press Enter to enter the graveyard');
      return; // Don't proceed to graveyard yet
    }

    // P1-5: Second interaction enters the graveyard
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
    // Check if world assets are already loaded
    const worldLoaded = this.registry.get('worldLoaded');
    
    if (worldLoaded) {
      // Assets are loaded, proceed immediately
      this.performTransition();
    } else {
      // Still loading — wait for completion
      this.load.once('complete', () => {
        this.performTransition();
      });
    }
  }

  private performTransition(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.waltz?.destroy();
      this.scene.start('GraveyardWorld');
    });
  }
}
