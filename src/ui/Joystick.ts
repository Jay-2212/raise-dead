/**
 * Joystick — wraps phaser3-rex-plugins VirtualJoystickPlugin.
 * Shown only on touch devices (navigator.maxTouchPoints > 0) or ?touch=1.
 */
import Phaser from 'phaser';

// The plugin attaches to scene.plugins; import the class for typing
// We access it via scene.plugins.get() to avoid bundling issues.

export interface JoystickForce {
  forceX: number;
  forceY: number;
}

export class Joystick {
  private joyStick: JoystickForce & { destroy(): void } | null = null;
  private fButton: Phaser.GameObjects.Text | null = null;
  private fButtonCallback: (() => void) | null = null;
  private scene: Phaser.Scene;
  readonly active: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const params = new URLSearchParams(window.location.search);
    this.active = navigator.maxTouchPoints > 0 || params.has('touch');

    if (!this.active) return;

    // Create joystick via plugin (registered in config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin = (scene.plugins as any).get('rexVirtualJoystick');
    if (plugin) {
      this.joyStick = plugin.add(scene, {
        x: 120,
        y: scene.scale.height - 120,
        radius: 60,
        base: scene.add.circle(0, 0, 60, 0x888888, 0.5),
        thumb: scene.add.circle(0, 0, 25, 0xcccccc, 0.7),
        dir: '8dir',
        forceMin: 16,
        fixed: true,
      }) as JoystickForce & { destroy(): void };
    }

    // F button
    this.fButton = scene.add.text(
      scene.scale.width - 80,
      scene.scale.height - 100,
      'F',
      {
        fontFamily: "'Cinzel', serif",
        fontSize: '28px',
        color: '#d9f2ee',
        backgroundColor: '#1c2a4a',
        padding: { x: 16, y: 10 },
        align: 'center',
      }
    );
    this.fButton.setOrigin(0.5, 0.5);
    this.fButton.setScrollFactor(0);
    this.fButton.setInteractive({ useHandCursor: true });
    this.fButton.on('pointerdown', () => {
      this.fButtonCallback?.();
    });
  }

  /** Get normalised force from joystick (0..1 range) */
  getForce(): JoystickForce {
    if (!this.joyStick) return { forceX: 0, forceY: 0 };
    return { forceX: this.joyStick.forceX, forceY: this.joyStick.forceY };
  }

  onFPress(cb: () => void): void {
    this.fButtonCallback = cb;
  }

  destroy(): void {
    this.joyStick?.destroy();
    this.fButton?.destroy();
  }
}
