/**
 * Joystick — wraps phaser3-rex-plugins VirtualJoystickPlugin.
 * Now lives in UIScene at zoom 1 (not affected by camera scaling).
 * Shown only on touch devices (navigator.maxTouchPoints > 0) or ?touch=1.
 * Normalises force to [-1,1] range and exposes state via registry and events.
 */
import Phaser from 'phaser';

export interface JoystickForce {
  forceX: number;
  forceY: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RexJoystick extends JoystickForce {
  destroy(): void;
  radius?: number;
  base?: any;
  thumb?: any;
}

export class Joystick {
  private joyStick: RexJoystick | null = null;
  private fButton: Phaser.GameObjects.Text | null = null;
  private fButtonCallback: (() => void) | null = null;
  private scene: Phaser.Scene;
  readonly active: boolean;
  private normalizedForce: JoystickForce = { forceX: 0, forceY: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const params = new URLSearchParams(window.location.search);
    this.active = navigator.maxTouchPoints > 0 || params.has('touch');

    if (!this.active) return;

    // Create joystick via plugin (registered in config)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin = (scene.plugins as any).get('rexVirtualJoystick');
    if (plugin) {
      const STICK_RADIUS = 60;
      this.joyStick = plugin.add(scene, {
        x: 140,
        y: scene.scale.height - 140,
        radius: STICK_RADIUS,
        base: scene.add.circle(0, 0, STICK_RADIUS, 0x888888, 0.5),
        thumb: scene.add.circle(0, 0, 25, 0xcccccc, 0.7),
        dir: '8dir',
        forceMin: 16,
        fixed: true,
      }) as RexJoystick;
      
      // Set scroll factor to 0 on base and thumb if they exist
      if (this.joyStick.base && typeof this.joyStick.base.setScrollFactor === 'function') {
        this.joyStick.base.setScrollFactor(0);
      }
      if (this.joyStick.thumb && typeof this.joyStick.thumb.setScrollFactor === 'function') {
        this.joyStick.thumb.setScrollFactor(0);
      }
    }

    // F button - positioned bottom-right
    this.fButton = scene.add.text(
      scene.scale.width - 140,
      scene.scale.height - 140,
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
    this.fButton.setDepth(100);
    this.fButton.on('pointerdown', () => {
      this.fButtonCallback?.();
    });
  }

  /** Get normalised force from joystick ([-1, 1] range) */
  getForce(): JoystickForce {
    if (!this.joyStick) return { forceX: 0, forceY: 0 };
    
    // P0-5: Normalize raw pixel force to [-1, 1]
    const radius = this.joyStick.radius ?? 60;
    const rawX = this.joyStick.forceX ?? 0;
    const rawY = this.joyStick.forceY ?? 0;
    
    this.normalizedForce.forceX = Math.max(-1, Math.min(1, rawX / radius));
    this.normalizedForce.forceY = Math.max(-1, Math.min(1, rawY / radius));
    
    return this.normalizedForce;
  }

  onFPress(cb: () => void): void {
    this.fButtonCallback = cb;
  }

  show(): void {
    if (this.fButton) this.fButton.setVisible(true);
    if (this.joyStick) {
      if (this.joyStick.base && typeof this.joyStick.base.setVisible === 'function') {
        this.joyStick.base.setVisible(true);
      }
      if (this.joyStick.thumb && typeof this.joyStick.thumb.setVisible === 'function') {
        this.joyStick.thumb.setVisible(true);
      }
    }
  }

  hide(): void {
    if (this.fButton) this.fButton.setVisible(false);
    if (this.joyStick) {
      if (this.joyStick.base && typeof this.joyStick.base.setVisible === 'function') {
        this.joyStick.base.setVisible(false);
      }
      if (this.joyStick.thumb && typeof this.joyStick.thumb.setVisible === 'function') {
        this.joyStick.thumb.setVisible(false);
      }
    }
  }

  destroy(): void {
    this.joyStick?.destroy();
    this.fButton?.destroy();
  }
}
