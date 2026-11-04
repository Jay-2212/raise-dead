/**
 * ZombieWave.ts (N3 → N4 "Horde") — touch the zombie hand and the horde rises.
 * N4 (Jay's notes + council plan): no map-wide auto-aim. Click (left or right) on a zombie to blast it;
 * F / Space fire a short cone the way the wizard faces. Horde scream, red pulse, music ducks.
 * Three spawn points, three waves (6 / 8 / 10). Three souls (hearts): a zombie touching you costs one,
 * with 1 s of invulnerability. Lose all three → "The dead overwhelm you" → F / click to try again.
 * Clear it → time shown, "Zombie Slayer" reward: the wizard's light turns green for good.
 * Owned by GraveyardWorld; timers use world.time.
 */
import Phaser from 'phaser';

type Facing = 'down' | 'up' | 'left' | 'right';
type World = Phaser.Scene & {
  wizard: Phaser.Physics.Arcade.Sprite;
  getFacing?: () => Facing;
  duckWorldMusic?: (v: number, ms: number) => void;
  restoreWorldMusic?: (ms: number) => void;
  applySlayerGlow?: () => void;
};

interface Zombie {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  hp: number;
  speed: number;
  alive: boolean;
  rising: boolean;
  hitCooldown: number;
  phase: number;
}

const WAVE_COUNTS = [6, 8, 10];
const WAVE_SPEEDS: Array<[number, number]> = [[28, 42], [40, 58], [56, 78]];
const SPAWN_POINTS = [{ x: 1180, y: 1560 }, { x: 1280, y: 1460 }, { x: 1620, y: 1540 }];
const STAGGER_MS = 380;
const CONE_RANGE = 140;
const CONE_DEG = 28;
const CAST_COOLDOWN = 230;
const CLICK_RADIUS = 28;
const CRIT_RADIUS = 10;
const SOULS = 3;
const IFRAMES_MS = 1000;
const SPELL_WORDS = ['Lux Ignis!', 'Requiesce!', 'Fulgur!', 'Abite, mortui!', 'Somnus aeternus!', 'Redite ad terram!'];

export class ZombieWave {
  private world: World;
  private zombies: Zombie[] = [];
  private waveIndex = 0;
  private spawnedThisWave = 0;
  private castReadyAt = 0;
  private casts = 0;
  private groanAt = 0;
  private music: Phaser.Sound.BaseSound | null = null;
  private onDone: (() => void) | null = null;
  private ending = false;
  private startedAt = 0;
  private souls = SOULS;
  private iframesUntil = 0;
  private failed = false;
  private hud: Phaser.GameObjects.Text | null = null;
  private vignette: Phaser.GameObjects.Rectangle | null = null;
  private vignetteTween: Phaser.Tweens.Tween | null = null;
  private timers: Phaser.Time.TimerEvent[] = [];
  private kills = 0;
  active = false;

  constructor(world: World) {
    this.world = world;
  }

  /** Start the horde (no-op if one is running). onDone fires only after a full clear. */
  start(onDone?: () => void): void {
    if (this.active) return;
    const w = this.world;
    this.active = true;
    this.ending = false;
    this.failed = false;
    this.casts = 0;
    this.kills = 0;
    this.onDone = onDone ?? null;
    this.startedAt = w.time.now;

    w.cameras.main.shake(600, 0.006);
    if (w.cache.audio.exists('horde_scream')) w.sound.play('horde_scream', { volume: 0.85 });
    else { w.sound.play('zombie_rise', { volume: 0.85 }); w.sound.play('wolf_howl', { volume: 0.3 }); }
    w.sound.play('ground_rumble', { volume: 0.6, delay: 0.2 });
    w.duckWorldMusic?.(0.04, 400);
    if (w.cache.audio.exists('chant_drone_loop')) {
      this.music = w.sound.add('chant_drone_loop', { loop: true, volume: 0, rate: 1.25 });
      this.music.play();
      w.tweens.add({ targets: this.music, volume: 0.4, duration: 1200 });
    }

    // red pulse over the whole view
    const cam = w.cameras.main;
    this.vignette = w.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x8a0f1e)
      .setScrollFactor(0).setDepth(9000).setAlpha(0);
    this.vignetteTween = w.tweens.add({ targets: this.vignette, alpha: { from: 0.04, to: 0.26 }, duration: 280, yoyo: true, repeat: 2,
      onComplete: () => { if (this.vignette) this.vignetteTween = w.tweens.add({ targets: this.vignette, alpha: { from: 0.08, to: 0.15 }, duration: 1400, yoyo: true, repeat: -1 }); } });

    const touch = w.sys.game.device.input.touch;
    this.banner('THE HORDE RISES', touch ? 'Tap a zombie to blast it · F fires ahead' : 'Click a zombie to blast it · F / Space fire ahead', 2800);

    this.souls = SOULS;
    this.makeHud();
    w.input.keyboard?.off('keydown-SPACE', this.onSpace, this);
    w.input.keyboard?.on('keydown-SPACE', this.onSpace, this);
    this.beginWave(0);
  }

  // ─── waves ────────────────────────────────────────────────────────────────
  private beginWave(i: number): void {
    this.waveIndex = i;
    this.spawnedThisWave = 0;
    const count = WAVE_COUNTS[i];
    if (i > 0) this.banner(`Wave ${i + 1} of ${WAVE_COUNTS.length}`, i === WAVE_COUNTS.length - 1 ? 'The last of them. Hold on!' : 'More of them...', 1600);
    for (let k = 0; k < count; k++) {
      this.timers.push(this.world.time.delayedCall(700 + k * STAGGER_MS + Phaser.Math.Between(0, 200), () => this.spawnOne(k)));
    }
    this.updateHud();
  }

  private spawnOne(k: number): void {
    if (!this.active || this.failed) return;
    const w = this.world;
    const p = SPAWN_POINTS[k % SPAWN_POINTS.length];
    const x = p.x + Phaser.Math.Between(-36, 36);
    const y = p.y + Phaser.Math.Between(-24, 24);
    const [lo, hi] = WAVE_SPEEDS[this.waveIndex];
    const fast = Math.random() < 0.3;

    const sprite = w.add.image(x, y + 12, fast ? 'zombie_b' : 'zombie_a').setOrigin(0.5, 1).setDepth(y).setAlpha(0);
    sprite.setScale(1, 0.2);
    const shadow = w.add.image(x, y - 1, 'shadow_contact').setScale(0.5, 0.4).setAlpha(0).setDepth(y - 1);
    if (w.textures.exists('kenney_smoke_04')) {
      const puff = w.add.image(x, y - 4, 'kenney_smoke_04').setScale(0.12).setAlpha(0.6).setTint(0x4a3a2a).setDepth(y + 1);
      w.tweens.add({ targets: puff, scale: 0.22, alpha: 0, y: y - 16, duration: 700, onComplete: () => puff.destroy() });
    }
    const z: Zombie = { sprite, shadow, hp: 2, speed: Phaser.Math.Between(lo, hi) * (fast ? 1.25 : 1), alive: true, rising: true, hitCooldown: 0, phase: Math.random() * 6 };
    this.zombies.push(z);
    this.spawnedThisWave++;
    if (k % 3 === 0) w.sound.play('zombie_rise', { volume: 0.4, detune: Phaser.Math.Between(-200, 100) });
    w.tweens.add({ targets: sprite, alpha: 1, scaleY: 1, y, duration: 650, ease: 'Back.easeOut', onComplete: () => { z.rising = false; } });
    w.tweens.add({ targets: shadow, alpha: 0.5, duration: 650 });
  }

  update(delta: number): void {
    if (!this.active) return;
    const w = this.world;
    const wiz = w.wizard;
    const dt = delta / 1000;
    const now = w.time.now;

    // i-frame blink
    if (now < this.iframesUntil) wiz.setAlpha(Math.floor(now / 80) % 2 ? 0.45 : 1);
    else if (wiz.alpha !== 1) wiz.setAlpha(1);

    if (!this.failed) {
      for (const z of this.zombies) {
        if (!z.alive || z.rising) continue;
        const dx = wiz.x - z.sprite.x;
        const dy = wiz.y - z.sprite.y;
        const d = Math.hypot(dx, dy) || 1;
        z.phase += dt * (z.speed / 9);
        if (d > 16) {
          z.sprite.x += (dx / d) * z.speed * dt;
          z.sprite.y += (dy / d) * z.speed * dt;
        }
        z.sprite.setFlipX(dx < 0);
        z.sprite.setAngle(Math.sin(z.phase) * 6);
        z.sprite.setDepth(z.sprite.y);
        z.shadow.setPosition(z.sprite.x, z.sprite.y - 1).setDepth(z.sprite.y - 1);

        z.hitCooldown -= delta;
        if (d < 18 && z.hitCooldown <= 0) {
          z.hitCooldown = 900;
          this.bump(dx / d, dy / d);
          z.sprite.x -= (dx / d) * 26;
          z.sprite.y -= (dy / d) * 26;
        }
      }
    }

    if (now > this.groanAt) {
      this.groanAt = now + Phaser.Math.Between(1400, 3000);
      const alive = this.zombies.filter((z) => z.alive).length;
      if (alive > 0) w.sound.play(Phaser.Utils.Array.GetRandom(['zombie_groan_1', 'zombie_groan_2', 'zombie_groan_3']), { volume: 0.35, detune: Phaser.Math.Between(-200, 200) });
    }

    if (!this.ending && !this.failed && this.spawnedThisWave >= WAVE_COUNTS[this.waveIndex] && this.zombies.every((z) => !z.alive)) {
      if (this.waveIndex < WAVE_COUNTS.length - 1) {
        this.zombies = [];
        this.beginWave(this.waveIndex + 1);
      } else {
        this.end();
      }
    }
  }

  /** A zombie reached the wizard: knockback, and a soul is lost unless invulnerable. */
  private bump(nx: number, ny: number): void {
    const w = this.world;
    const wiz = w.wizard;
    const now = w.time.now;
    const bounds = w.physics.world.bounds;
    const tx = Phaser.Math.Clamp(wiz.x + nx * 34, bounds.x + 20, bounds.right - 20);
    const ty = Phaser.Math.Clamp(wiz.y + ny * 34, bounds.y + 40, bounds.bottom - 10);
    w.tweens.add({ targets: wiz, x: tx, y: ty, duration: 140, ease: 'Quad.easeOut' });
    if (now < this.iframesUntil) return;
    this.iframesUntil = now + IFRAMES_MS;
    this.souls--;
    w.sound.play('zombie_hit', { volume: 0.7 });
    w.cameras.main.flash(180, 140, 20, 20);
    w.cameras.main.shake(160, 0.005);
    this.updateHud();
    if (this.souls <= 0) this.fail();
  }

  private fail(): void {
    const w = this.world;
    this.failed = true;
    for (const t of this.timers) t.remove(false);
    this.timers = [];
    w.sound.play('rip_bell_toll', { volume: 0.5 });
    this.banner('The dead overwhelm you...', w.sys.game.device.input.touch ? 'Tap F to rise and try again' : 'Press F or click to try again', 600000);
  }

  /** After a defeat: clear the field and start again from wave 1 (same horde, same timer). */
  retry(): void {
    const w = this.world;
    for (const z of this.zombies) { z.sprite.destroy(); z.shadow.destroy(); }
    this.zombies = [];
    this.clearBanners();
    this.failed = false;
    this.souls = SOULS;
    this.iframesUntil = w.time.now + 1500;
    if (w.cache.audio.exists('choir_aah')) w.sound.play('choir_aah', { volume: 0.3 });
    this.beginWave(0);
  }

  private onSpace(ev: KeyboardEvent): void {
    if (ev.repeat) return;
    this.castCone();
  }

  // ─── casting ──────────────────────────────────────────────────────────────
  /** F / Space / F button: fire a short cone the way the wizard faces (no map-wide auto-aim). */
  castCone(): void {
    if (!this.active) return;
    if (this.failed) { this.retry(); return; }
    if (!this.ready()) return;
    const wiz = this.world.wizard;
    const f = this.world.getFacing?.() ?? 'down';
    const dir = f === 'up' ? { x: 0, y: -1 } : f === 'left' ? { x: -1, y: 0 } : f === 'right' ? { x: 1, y: 0 } : { x: 0, y: 1 };
    let target: Zombie | null = null;
    let best = CONE_RANGE;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const dx = z.sprite.x - wiz.x;
      const dy = (z.sprite.y - 18) - (wiz.y - 20);
      const d = Math.hypot(dx, dy);
      if (d > best || d < 1) continue;
      const ang = Phaser.Math.RadToDeg(Math.acos((dx * dir.x + dy * dir.y) / d));
      if (ang <= CONE_DEG) { best = d; target = z; }
    }
    if (target) this.fireAt(target, target.sprite.x, target.sprite.y - 22, 1);
    else this.fizzle(wiz.x + dir.x * 40, wiz.y - 30 + dir.y * 40);
  }

  /** Click / right-click / tap in the world during the horde: blast the zombie under the pointer. */
  castAt(wx: number, wy: number): void {
    if (!this.active) return;
    if (this.failed) { this.retry(); return; }
    if (!this.ready()) return;
    let target: Zombie | null = null;
    let best = CLICK_RADIUS;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const d = Phaser.Math.Distance.Between(wx, wy, z.sprite.x, z.sprite.y - 22);
      if (d < best) { best = d; target = z; }
    }
    if (!target) { this.fizzle(wx, wy); return; }
    const crit = Phaser.Math.Distance.Between(wx, wy, target.sprite.x, target.sprite.y - 36) < CRIT_RADIUS;
    this.fireAt(target, wx, wy, crit ? 2 : 1);
  }

  private ready(): boolean {
    const now = this.world.time.now;
    if (now < this.castReadyAt) return false;
    this.castReadyAt = now + CAST_COOLDOWN;
    this.casts++;
    this.world.sound.play('rune_sparkle_short', { volume: 0.5, detune: Phaser.Math.Between(-150, 150) });
    if (this.casts % 3 === 1) this.say(Phaser.Utils.Array.GetRandom(SPELL_WORDS));
    return true;
  }

  private fizzle(tx: number, ty: number): void {
    const w = this.world;
    const wiz = w.wizard;
    const bolt = w.add.image(wiz.x, wiz.y - 30, 'wisp').setBlendMode(Phaser.BlendModes.ADD).setTint(0x9ff7ff).setScale(0.5).setDepth(99999);
    w.tweens.add({ targets: bolt, x: tx, y: ty, alpha: 0.2, scale: 0.2, duration: 220, onComplete: () => { this.burst(tx, ty, 3); bolt.destroy(); } });
  }

  private fireAt(t: Zombie, tx: number, ty: number, dmg: number): void {
    const w = this.world;
    const wiz = w.wizard;
    const sx = wiz.x;
    const sy = wiz.y - 30;
    const bolt = w.add.image(sx, sy, 'wisp').setBlendMode(Phaser.BlendModes.ADD).setTint(dmg > 1 ? 0xfff2a8 : 0x9ff7ff).setScale(dmg > 1 ? 0.8 : 0.6).setDepth(99999);
    const dist = Phaser.Math.Distance.Between(sx, sy, tx, ty);
    w.tweens.add({
      targets: bolt, x: tx, y: ty, duration: Math.max(80, (dist / 820) * 1000), ease: 'Linear',
      onComplete: () => {
        bolt.destroy();
        this.burst(t.sprite.x, t.sprite.y - 18, dmg > 1 ? 10 : 6);
        if (!t.alive) return;
        t.hp -= dmg;
        t.sprite.setTintFill(0xffffff);
        w.time.delayedCall(70, () => t.sprite.active && t.sprite.clearTint());
        const dx = t.sprite.x - wiz.x;
        const dy = t.sprite.y - wiz.y;
        const d = Math.hypot(dx, dy) || 1;
        t.sprite.x += (dx / d) * 14;
        t.sprite.y += (dy / d) * 14;
        if (dmg > 1) this.say('Critical!');
        if (t.hp <= 0) this.kill(t);
      },
    });
  }

  private burst(x: number, y: number, n = 6): void {
    const w = this.world;
    for (let i = 0; i < n; i++) {
      const p = w.add.image(x, y, 'firefly_dot').setBlendMode(Phaser.BlendModes.ADD).setTint(0xbffcff).setDepth(99999).setScale(1.2);
      const a = Math.random() * Math.PI * 2;
      w.tweens.add({ targets: p, x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 18, alpha: 0, duration: 320, onComplete: () => p.destroy() });
    }
  }

  private kill(z: Zombie): void {
    const w = this.world;
    z.alive = false;
    this.kills++;
    this.updateHud();
    w.sound.play('zombie_die', { volume: 0.55, detune: Phaser.Math.Between(-150, 150) });
    w.tweens.add({ targets: z.sprite, alpha: 0, scaleY: 0.1, y: z.sprite.y + 8, angle: z.sprite.flipX ? -30 : 30, duration: 450, onComplete: () => z.sprite.destroy() });
    w.tweens.add({ targets: z.shadow, alpha: 0, duration: 450, onComplete: () => z.shadow.destroy() });
    const soul = w.add.image(z.sprite.x, z.sprite.y - 20, 'wisp').setBlendMode(Phaser.BlendModes.ADD).setTint(0xd9fff0).setAlpha(0.8).setScale(0.5).setDepth(99999);
    w.tweens.add({ targets: soul, y: soul.y - 50, alpha: 0, duration: 1100, ease: 'Sine.easeOut', onComplete: () => soul.destroy() });
  }

  // ─── HUD / text ───────────────────────────────────────────────────────────
  private makeHud(): void {
    const w = this.world;
    const cam = w.cameras.main;
    this.hud?.destroy();
    // scrollFactor-0 text is still scaled by the world camera's zoom around the view centre
    const z = cam.zoom || 1;
    const screenY = 30;
    this.hud = w.add.text(cam.width / 2, cam.height / 2 - (cam.height / 2 - screenY) / z, '', {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: `${Math.round(18 / z)}px`, color: '#ffd9de', stroke: '#1a0608', strokeThickness: Math.max(2, Math.round(4 / z)),
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10001);
    this.updateHud();
  }

  private updateHud(): void {
    if (!this.hud) return;
    const hearts = '♥'.repeat(Math.max(0, this.souls)) + '♡'.repeat(Math.max(0, SOULS - this.souls));
    const total = WAVE_COUNTS.reduce((a, b) => a + b, 0);
    this.hud.setText(`${hearts}   Wave ${this.waveIndex + 1}/${WAVE_COUNTS.length}   Laid to rest ${this.kills}/${total}`);
  }

  private banners: Phaser.GameObjects.Text[] = [];
  private clearBanners(): void {
    for (const b of this.banners) b.destroy();
    this.banners = [];
  }

  private banner(title: string, sub: string, ms: number): void {
    const w = this.world;
    const cam = w.cameras.main;
    this.clearBanners();
    const t = w.add.text(cam.width / 2, cam.height * 0.3, title, {
      fontFamily: "'Cinzel', serif", fontSize: '40px', color: '#ffd0d6', stroke: '#14060a', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10000).setAlpha(0).setScale(1.3);
    const s = w.add.text(cam.width / 2, cam.height * 0.3 + 40, sub, {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '18px', color: '#d9f2ee', stroke: '#06140d', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10000).setAlpha(0);
    this.banners.push(t, s);
    w.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
    w.tweens.add({ targets: s, alpha: 1, duration: 400, delay: 200 });
    w.time.delayedCall(ms, () => {
      if (!t.active) return;
      w.tweens.add({ targets: [t, s], alpha: 0, duration: 500, onComplete: () => { t.destroy(); s.destroy(); } });
    });
  }

  private say(text: string): void {
    const w = this.world;
    const wiz = w.wizard;
    const t = w.add.text(wiz.x, wiz.y - 70, text, {
      fontFamily: "'Cinzel', serif", fontSize: '13px', fontStyle: 'italic', color: '#bffcff', stroke: '#061018', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(99999);
    w.tweens.add({ targets: t, y: t.y - 22, alpha: 0, duration: 1300, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }

  private end(): void {
    const w = this.world;
    this.ending = true;
    w.input.keyboard?.off('keydown-SPACE', this.onSpace, this);
    if (this.music) {
      const m = this.music;
      w.tweens.add({ targets: m, volume: 0, duration: 1500, onComplete: () => { m.stop(); m.destroy(); } });
      this.music = null;
    }
    w.restoreWorldMusic?.(1500);
    this.vignetteTween?.stop();
    if (this.vignette) { const v = this.vignette; w.tweens.add({ targets: v, alpha: 0, duration: 900, onComplete: () => v.destroy() }); this.vignette = null; }
    this.hud?.destroy();
    this.hud = null;
    w.sound.play('choir_aah', { volume: 0.4 });
    const secs = Math.round((w.time.now - this.startedAt) / 1000);
    const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const first = !localStorage.getItem('rd_slayer');
    try { localStorage.setItem('rd_slayer', '1'); } catch { /* private mode */ }
    w.applySlayerGlow?.();
    this.banner('The graveyard rests.', `24 souls laid to rest in ${mmss}${first ? ' · Zombie Slayer: your light burns green' : ''}`, 3400);
    w.time.delayedCall(3600, () => {
      this.zombies = [];
      this.active = false;
      w.wizard.setAlpha(1);
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
    });
  }
}
