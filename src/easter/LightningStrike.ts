/**
 * LightningStrike — N4/L1: one or two bolts land 60–110 px beside the wizard (never on him).
 * Pre-flash, jagged bolt with branches, sparks, camera shake, scorch mark that fades over 25 s,
 * thunder crack + rumble (CC0), wizard flinch.
 */
import Phaser from 'phaser';

type World = Phaser.Scene & { wizard: Phaser.Physics.Arcade.Sprite; flinch?: () => void };

const BOUNDS = { minX: 24, maxX: 2376, minY: 24, maxY: 1776 };

export class LightningStrike {
  private cancelled = false;
  constructor(private w: World) {}

  cancel(): void { this.cancelled = true; }

  play(onDone: () => void): void {
    const count = Math.random() < 0.5 ? 1 : 2;
    let i = 0;
    const next = () => {
      if (this.cancelled) { onDone(); return; }
      if (i >= count) { onDone(); return; }
      i++;
      this.strikeOnce(() => this.w.time.delayedCall(i < count ? 760 : 200, next));
    };
    next();
  }

  private pickImpact(): { x: number; y: number } | null {
    const wiz = this.w.wizard;
    for (let tries = 0; tries < 8; tries++) {
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.Between(60, 110);
      const x = Phaser.Math.Clamp(wiz.x + Math.cos(a) * d, BOUNDS.minX, BOUNDS.maxX);
      const y = Phaser.Math.Clamp(wiz.y + Math.sin(a) * d * 0.7, BOUNDS.minY, BOUNDS.maxY);
      if (Phaser.Math.Distance.Between(x, y, wiz.x, wiz.y) >= 56) return { x, y };
    }
    return null;
  }

  private strikeOnce(after: () => void): void {
    const w = this.w;
    if ((w as unknown as { ritualActive?: boolean }).ritualActive || !w.scene.isActive()) { this.cancelled = true; after(); return; }
    const hit = this.pickImpact();
    if (!hit) { after(); return; }
    const cam = w.cameras.main;

    // 1) pre-flash: the whole sky goes white for a beat
    const flash = w.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xffffff)
      .setScrollFactor(0).setDepth(12000).setAlpha(0);
    w.tweens.add({ targets: flash, alpha: 0.85, duration: 60, yoyo: true, hold: 40,
      onComplete: () => { w.tweens.add({ targets: flash, alpha: { from: 0.4, to: 0 }, duration: 160, onComplete: () => flash.destroy() }); } });

    w.time.delayedCall(140, () => {
      if (this.cancelled) { after(); return; }
      // 2) bolt
      const g = w.add.graphics().setDepth(hit.y + 2000).setBlendMode(Phaser.BlendModes.ADD);
      const topX = hit.x + Phaser.Math.Between(-20, 20);
      const topY = hit.y - Phaser.Math.Between(180, 260);
      const pts: Phaser.Math.Vector2[] = [];
      const SEG = 7;
      for (let k = 0; k <= SEG; k++) {
        const t = k / SEG;
        const jitter = k === 0 || k === SEG ? 0 : Phaser.Math.Between(-16, 16);
        pts.push(new Phaser.Math.Vector2(Phaser.Math.Linear(topX, hit.x, t) + jitter, Phaser.Math.Linear(topY, hit.y, t)));
      }
      const drawBolt = (width: number, color: number, alpha: number) => {
        g.lineStyle(width, color, alpha);
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) g.lineTo(pts[k].x, pts[k].y);
        g.strokePath();
        // 3 short branches
        for (let b = 0; b < 3; b++) {
          const from = pts[Phaser.Math.Between(1, SEG - 2)];
          const len = Phaser.Math.Between(30, 50);
          const ang = Phaser.Math.DegToRad(Phaser.Math.Between(20, 70) * (Math.random() < 0.5 ? -1 : 1) + 90);
          g.beginPath(); g.moveTo(from.x, from.y);
          g.lineTo(from.x + Math.cos(ang) * len * 0.5 + Phaser.Math.Between(-6, 6), from.y + Math.sin(ang) * len * 0.5);
          g.lineTo(from.x + Math.cos(ang) * len, from.y + Math.sin(ang) * len);
          g.strokePath();
        }
      };
      drawBolt(9, 0x7fa8ff, 0.4);
      drawBolt(3, 0xf2f6ff, 1);
      w.tweens.add({ targets: g, alpha: 0, duration: 120, delay: 160, onComplete: () => g.destroy() });

      // 3) impact glow + sparks
      if (w.textures.exists('glow_moon')) {
        const glow = w.add.image(hit.x, hit.y, 'glow_moon').setTint(0xbcd4ff).setBlendMode(Phaser.BlendModes.ADD)
          .setScale(0.9).setAlpha(0.9).setDepth(hit.y + 1);
        w.tweens.add({ targets: glow, alpha: 0, scale: 1.4, duration: 500, onComplete: () => glow.destroy() });
      }
      const sparkKey = w.textures.exists('firefly_dot') ? 'firefly_dot' : null;
      for (let s = 0; s < 10; s++) {
        const sp = sparkKey
          ? w.add.image(hit.x, hit.y - 2, sparkKey).setTint(s % 2 ? 0xfff2a8 : 0xbfe0ff).setBlendMode(Phaser.BlendModes.ADD)
          : w.add.circle(hit.x, hit.y - 2, 1.5, 0xfff2a8);
        sp.setDepth(hit.y + 3);
        const ang = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(14, 40);
        w.tweens.add({ targets: sp, x: hit.x + Math.cos(ang) * dist, y: hit.y - 2 + Math.sin(ang) * dist * 0.6 - 8,
          alpha: 0, duration: Phaser.Math.Between(300, 600), ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
      }

      // 4) scorch mark that slowly fades
      const scorch = w.add.ellipse(hit.x, hit.y, 26, 9, 0x140e0a, 0.7).setDepth(hit.y - 3);
      const ring = w.add.ellipse(hit.x, hit.y, 34, 12).setStrokeStyle(1, 0x3a2a1c, 0.6).setDepth(hit.y - 3);
      w.tweens.add({ targets: [scorch, ring], alpha: 0, duration: 25000, delay: 2000, onComplete: () => { scorch.destroy(); ring.destroy(); } });

      // 5) shake, sound, flinch
      cam.shake(240, 0.006);
      const vol = (w.sound as unknown as { mute?: boolean }).mute ? 0 : 1;
      if (w.cache.audio.exists('thunder_crack')) w.sound.play('thunder_crack', { volume: 0.75 * vol, detune: Phaser.Math.Between(-150, 100) });
      else w.sound.play('stone_crack_crumble', { volume: 0.4 * vol });
      if (w.cache.audio.exists('thunder_rumble')) w.sound.play('thunder_rumble', { volume: 0.55 * vol, delay: 0.25 });
      else w.sound.play('ground_rumble', { volume: 0.6 * vol, delay: 0.08 });
      w.flinch?.();
      after();
    });
  }
}
