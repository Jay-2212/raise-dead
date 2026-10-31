/**
 * Tombstone — Phaser.GameObjects.Container representing one grave.
 * Renders the stone sprite, optional medallion, and glow for resurrectable graves.
 * The plaque (name/epitaph popup) is managed by GraveyardWorld/UIScene separately.
 */
import Phaser from 'phaser';
import { GraveEntry } from '../types/graves';

export type TombstoneState = 'plain' | 'cracked' | 'rubble';

/** Medallion texture key per grave ID */
const MEDALLION_KEYS: Record<string, string> = {
  'road-rash':      'medal_roadrash',
  'google-reader':  'medal_reader',
  'clippy':         'medal_clippy',
  'winamp':         'medal_winamp',
  'unmarked-grave': 'medal_unmarked',
};

/** Sprite keys per deco type (cycled by sort_priority) */
const DECO_KEYS = ['tomb_deco_cross', 'tomb_deco_square', 'tomb_deco_obelisk'] as const;

export class Tombstone extends Phaser.GameObjects.Container {
  readonly grave: GraveEntry;
  private stoneSprite: Phaser.GameObjects.Image;
  private glowSprite: Phaser.GameObjects.Image | null = null;
  private medallionSprite: Phaser.GameObjects.Image | null = null;
  private shadowEllipse: Phaser.GameObjects.Ellipse;

  /** Physics static body for collision (added by GraveyardWorld) */
  physicsBody?: Phaser.Physics.Arcade.StaticBody;

  constructor(scene: Phaser.Scene, x: number, y: number, grave: GraveEntry) {
    super(scene, x, y);
    this.grave = grave;

    // Shadow ellipse
    this.shadowEllipse = scene.add.ellipse(0, 4, 60, 16, 0x0b1020, 0.35);
    this.add(this.shadowEllipse);

    // Stone sprite
    const spriteKey = grave.resurrectable
      ? 'tomb_plain'
      : DECO_KEYS[(grave.sort_priority - 6) % 3];

    this.stoneSprite = scene.add.image(0, 0, spriteKey);
    this.stoneSprite.setOrigin(0.5, 1);
    this.add(this.stoneSprite);

    if (grave.resurrectable) {
      // Teal glow (ADD blend)
      this.glowSprite = scene.add.image(0, -12, 'glow_moon');
      this.glowSprite.setBlendMode(Phaser.BlendModes.ADD);
      this.glowSprite.setTint(0x7fd1d8);
      this.glowSprite.setAlpha(0.3);
      this.glowSprite.setScale(0.35);
      this.add(this.glowSprite);

      // Pulse tween
      scene.tweens.add({
        targets: this.glowSprite,
        alpha: { from: 0.25, to: 0.5 },
        scale: { from: 0.33, to: 0.38 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Medallion floated above the stone
      const medKey = MEDALLION_KEYS[grave.id];
      if (medKey) {
        this.medallionSprite = scene.add.image(0, -52, medKey);
        this.medallionSprite.setScale(20 / 256); // ~20 art px from 256px source
        this.medallionSprite.setOrigin(0.5, 1);
        this.add(this.medallionSprite);

        // Gentle float
        scene.tweens.add({
          targets: this.medallionSprite,
          y: -56,
          duration: 2200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // Register with scene display list
    scene.sys.displayList.add(this as unknown as Phaser.GameObjects.GameObject);

    // Y-sort depth
    this.setDepth(y);
  }

  /** Swap the stone sprite texture for a given state */
  setTombstoneState(state: TombstoneState): void {
    const keyMap: Record<TombstoneState, string> = {
      plain:   'tomb_plain',
      cracked: 'tomb_cracked',
      rubble:  'tomb_rubble',
    };
    if (this.grave.resurrectable) {
      this.stoneSprite.setTexture(keyMap[state]);
    }
  }

  /** Apply Light2D pipeline to stone and glow */
  applyLightPipeline(): void {
    this.stoneSprite.setPipeline('Light2D');
    if (this.medallionSprite) {
      this.medallionSprite.setPipeline('Light2D');
    }
    // Glow uses ADD blend — don't apply Light2D to it
  }
}
