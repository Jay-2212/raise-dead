/**
 * WitchFlyBy — manages the witch-on-broomstick fly-by mechanic (A7).
 *
 * Schedule:
 *   - First fly-by: 12–20 s after scene enters.
 *   - Subsequent: 35–75 s intervals.
 *   - Suppressed while a ritual/overlay/credits scene is active or a crow is in flight.
 *
 * Flight path:
 *   - Crosses the camera view horizontally in the top band (y = worldView.top + 30…90).
 *   - Duration: 5–6.5 s.
 *   - Sine-wave bob: amplitude 8 px, 2 full cycles across the flight.
 *   - Slight rotation tilt: ±4°.
 *   - Sprite: `witch_broom`, flipped X when flying left → right.
 *   - Depth 60 (above trees at ~depth y, below fog at depth 5-7).
 *   - Sound: `witch_cackle` or `witch_cackle_2`, volume 0.35.
 */
import Phaser from 'phaser';

export interface WitchFlyByOptions {
  /** Returns true when a ritual / overlay / credits is active (suppress fly-by). */
  isSuppressed: () => boolean;
  /** Returns true when the crow is currently in flight (avoid overlap). */
  isCrowActive: () => boolean;
}

export class WitchFlyBy {
  private scene: Phaser.Scene;
  private opts: WitchFlyByOptions;

  private timer = 0;
  private interval: number;
  private active = false;

  /** The flying witch sprite (null when not in flight). */
  private sprite: Phaser.GameObjects.Image | null = null;
  /** The main movement tween (null when not in flight). */
  private moveTween: Phaser.Tweens.Tween | null = null;
  /** Counter tween that drives the bob + tilt. */
  private bobCounter: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, opts: WitchFlyByOptions) {
    this.scene = scene;
    this.opts = opts;
    // N4/B2: first fly-by 45–120 s, so it never collides with the opening minutes
    this.interval = Phaser.Math.Between(45000, 120000);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /** Call from GraveyardWorld.update() with delta in ms. */
  update(delta: number): void {
    if (this.active) return; // already flying

    this.timer += delta;
    if (this.timer >= this.interval) {
      this.timer = 0;
      this.interval = Phaser.Math.Between(45000, 120000);

      if (this.opts.isSuppressed() || this.opts.isCrowActive()) {
        // Defer: try again after a short random window
        this.timer = this.interval - Phaser.Math.Between(5000, 10000);
        return;
      }

      this.spawnWitch();
    }
  }

  /**
   * Force-spawn a witch fly-by immediately (for debug hook __RD.spawnWitch).
   * Ignored if one is already in flight.
   */
  spawnNow(): void {
    if (this.active) return;
    this.timer = 0;
    this.interval = Phaser.Math.Between(35000, 75000);
    this.spawnWitch();
  }

  /** N3/N4: black-cat omen summons the witch. If one is already flying, she IS the omen (never kill her mid-flight). */
  forceSpawn(): void {
    this.timer = 0;
    this.interval = Phaser.Math.Between(45000, 120000);
    if (this.active || this.opts.isCrowActive()) return;
    this.spawnWitch();
  }

  /** N4: make a flying witch leave at once (zombie wave / ritual starting). */
  dismiss(): void {
    if (this.active) this.cleanup();
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private spawnWitch(): void {
    const cam = this.scene.cameras.main;
    const view = cam.worldView;

    // Pick direction (50/50 left-to-right or right-to-left)
    const goRight = Math.random() < 0.5;
    const startX = goRight ? view.left - 80 : view.right + 80;
    const endX   = goRight ? view.right + 80 : view.left - 80;

    // y in top band
    const baseY = Phaser.Math.Between(
      Math.round(view.top + 30),
      Math.round(view.top + 90),
    );

    // Duration 5–6.5 s
    const duration = Phaser.Math.Between(5000, 6500);

    // Build sprite
    const witch = this.scene.add.image(startX, baseY, 'witch_broom');
    witch.setDepth(3000);  // Above world sort (y~250-2200), below HUD
    witch.setOrigin(0.5, 0.5);
    // Flip: sprite faces RIGHT; flip when going LEFT (!goRight)
    witch.setFlipX(!goRight);

    this.sprite = witch;
    this.active = true;

    // ── Sound ────────────────────────────────────────────────────────────────
    const cackleKey = Math.random() < 0.5 ? 'witch_cackle' : 'witch_cackle_2';
    this.scene.sound.play(cackleKey, { volume: 0.35 });

    // ── Bob + tilt counter ───────────────────────────────────────────────────
    // We animate a plain number 0 → 1 representing flight progress.
    // From that we derive:
    //   bobOffset = sin(progress * 2π * 2) * 8       (2 cycles, 8 px amplitude)
    //   tilt      = sin(progress * 2π * 2) * 4°
    let progress = 0;
    const bobAmp  = 8;   // px
    const tiltAmp = 4;   // degrees
    const cycles  = 2;

    this.bobCounter = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        progress = tween.getValue() as number;
        const angle = Math.sin(progress * Math.PI * 2 * cycles);
        if (this.sprite) {
          this.sprite.y = baseY + angle * bobAmp;
          this.sprite.angle = angle * tiltAmp;
        }
      },
    });

    // ── Horizontal movement tween ────────────────────────────────────────────
    this.moveTween = this.scene.tweens.add({
      targets: witch,
      x: endX,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.cleanup();
      },
    });
  }

  private cleanup(): void {
    this.sprite?.destroy();
    this.sprite = null;

    this.moveTween?.stop();
    this.moveTween = null;

    this.bobCounter?.stop();
    this.bobCounter = null;

    this.active = false;
  }

  /** True while a witch is currently in flight. */
  get isActive(): boolean {
    return this.active;
  }
}
