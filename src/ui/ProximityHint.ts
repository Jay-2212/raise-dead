/**
 * ProximityHint — shows/hides the "Press F to raise the dead" prompt.
 * Lives in UIScene at scrollFactor 0.
 */
import Phaser from 'phaser';

export class ProximityHint extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    // Centred horizontally at bottom of HUD
    super(scene, 640, 650);

    this.bg = scene.add.rectangle(0, 0, 340, 44, 0x0e1526, 0.85);
    this.bg.setStrokeStyle(1, 0xc9b98a, 0.7);

    this.label = scene.add.text(0, 0, 'Press  F  to raise the dead', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '18px',
      color: '#d9f2ee',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0.5);

    this.add([this.bg, this.label]);
    this.setVisible(false);
    this.setScrollFactor(0);

    scene.add.existing(this);
  }

  show(): void {
    if (this.visible) return;
    this.setVisible(true);
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeOut',
    });
    this.pulseTween = this.scene.tweens.add({
      targets: this.label,
      alpha: { from: 1, to: 0.55 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hide(): void {
    if (!this.visible) return;
    this.pulseTween?.stop();
    this.pulseTween = null;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => this.setVisible(false),
    });
  }
}
