/**
 * ZombieWave.ts (N3) — touch the zombie hand and the dead rise: 12 zombies shamble in at mixed
 * speeds and the wizard blasts them with spells (F / Space / tap F). Cozy: zombies only knock the
 * wizard back, nobody dies but the dead. Owned by GraveyardWorld; timers use world.time.
 */
import Phaser from 'phaser';

type World = Phaser.Scene & { wizard: Phaser.Physics.Arcade.Sprite };

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

const TOTAL = 12;
const RANGE = 340;          // spells reach this far
const CAST_COOLDOWN = 230;  // ms between casts
const SPELL_WORDS = ['Lux Ignis!', 'Requiesce!', 'Fulgur!', 'Abite, mortui!', 'Somnus aeternus!', 'Redite ad terram!'];

export class ZombieWave {
  private world: World;
  private zombies: Zombie[] = [];
  private spawned = 0;
  private castReadyAt = 0;
  private casts = 0;
  private groanAt = 0;
  private music: Phaser.Sound.BaseSound | null = null;
  private onDone: (() => void) | null = null;
  private ending = false;
  active = false;

  constructor(world: World) {
    this.world = world;
  }

  /** Start a wave (no-op if one is running). onDone fires after the last zombie falls. */
  start(onDone?: () => void): void {
    if (this.active) return;
    const w = this.world;
    this.active = true;
    this.ending = false;
    this.spawned = 0;
    this.casts = 0;
    this.onDone = onDone ?? null;

    w.cameras.main.shake(600, 0.006);
    w.sound.play('ground_rumble', { volume: 0.6 });
    w.sound.play('zombie_rise', { volume: 0.7, delay: 0.3 });
    if (w.cache.audio.exists('chant_drone_loop')) {
      this.music = w.sound.add('chant_drone_loop', { loop: true, volume: 0, rate: 1.2 });
      this.music.play();
      w.tweens.add({ targets: this.music, volume: 0.35, duration: 1200 });
    }

    const touch = w.sys.game.device.input.touch;
    this.banner('THE DEAD RISE!', touch ? 'Tap F to cast spells' : 'Press F or Space to cast spells', 2600);

    // Space also casts while the wave runs
    w.input.keyboard?.on('keydown-SPACE', this.onSpace, this);

    for (let i = 0; i < TOTAL; i++) {
      w.time.delayedCall(900 + i * 520 + Phaser.Math.Between(0, 250), () => this.spawnOne(i));
    }
  }

  private onSpace(ev: KeyboardEvent): void {
    if (ev.repeat) return;
    this.cast();
  }

  private banner(title: string, sub: string, ms: number): void {
    const w = this.world;
    const cam = w.cameras.main;
    const t = w.add.text(cam.width / 2, cam.height * 0.3, title, {
      fontFamily: "'Cinzel', serif", fontSize: '40px', color: '#b8ffcf', stroke: '#06140d', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10000).setAlpha(0).setScale(1.3);
    const s = w.add.text(cam.width / 2, cam.height * 0.3 + 40, sub, {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '18px', color: '#d9f2ee', stroke: '#06140d', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10000).setAlpha(0);
    w.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
    w.tweens.add({ targets: s, alpha: 1, duration: 400, delay: 200 });
    w.time.delayedCall(ms, () => {
      w.tweens.add({ targets: [t, s], alpha: 0, duration: 500, onComplete: () => { t.destroy(); s.destroy(); } });
    });
  }

  private spawnOne(i: number): void {
    if (!this.active) return;
    const w = this.world;
    const wiz = w.wizard;
    const fast = i % 3 === 2;
    const angle = Math.random() * Math.PI * 2;
    const r = Phaser.Math.Between(300, 420);
    const bounds = w.physics.world.bounds;
    const x = Phaser.Math.Clamp(wiz.x + Math.cos(angle) * r, bounds.x + 30, bounds.right - 30);
    const y = Phaser.Math.Clamp(wiz.y + Math.sin(angle) * r * 0.75, bounds.y + 50, bounds.bottom - 20);

    const sprite = w.add.image(x, y + 12, fast ? 'zombie_b' : 'zombie_a').setOrigin(0.5, 1).setDepth(y).setAlpha(0);
    sprite.setScale(1, 0.2);
    const shadow = w.add.image(x, y - 1, 'shadow_contact').setScale(0.5, 0.4).setAlpha(0).setDepth(y - 1);
    if (w.textures.exists('kenney_smoke_04')) {
      const puff = w.add.image(x, y - 4, 'kenney_smoke_04').setScale(0.12).setAlpha(0.6).setTint(0x4a3a2a).setDepth(y + 1);
      w.tweens.add({ targets: puff, scale: 0.22, alpha: 0, y: y - 16, duration: 700, onComplete: () => puff.destroy() });
    }
    const z: Zombie = { sprite, shadow, hp: fast ? 1 : 2, speed: fast ? Phaser.Math.Between(68, 84) : Phaser.Math.Between(30, 44), alive: true, rising: true, hitCooldown: 0, phase: Math.random() * 6 };
    this.zombies.push(z);
    this.spawned++;
    w.tweens.add({ targets: sprite, alpha: 1, scaleY: 1, y, duration: 650, ease: 'Back.easeOut', onComplete: () => { z.rising = false; } });
    w.tweens.add({ targets: shadow, alpha: 0.5, duration: 650 });
  }

  update(delta: number): void {
    if (!this.active) return;
    const w = this.world;
    const wiz = w.wizard;
    const dt = delta / 1000;
    const now = w.time.now;

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

    if (now > this.groanAt) {
      this.groanAt = now + Phaser.Math.Between(1800, 3500);
      const alive = this.zombies.filter((z) => z.alive).length;
      if (alive > 0) w.sound.play(Phaser.Utils.Array.GetRandom(['zombie_groan_1', 'zombie_groan_2', 'zombie_groan_3']), { volume: 0.35, detune: Phaser.Math.Between(-200, 200) });
    }

    if (!this.ending && this.spawned >= TOTAL && this.zombies.every((z) => !z.alive)) this.end();
  }

  /** A zombie reached the wizard: knock the wizard back with a red flash (no damage). */
  private bump(nx: number, ny: number): void {
    const w = this.world;
    const wiz = w.wizard;
    w.sound.play('zombie_hit', { volume: 0.6 });
    w.cameras.main.flash(160, 120, 20, 20);
    w.cameras.main.shake(140, 0.004);
    const bounds = w.physics.world.bounds;
    const tx = Phaser.Math.Clamp(wiz.x + nx * 34, bounds.x + 20, bounds.right - 20);
    const ty = Phaser.Math.Clamp(wiz.y + ny * 34, bounds.y + 40, bounds.bottom - 10);
    w.tweens.add({ targets: wiz, x: tx, y: ty, duration: 140, ease: 'Quad.easeOut' });
  }

  /** F / Space / tap F while the wave runs. */
  cast(): void {
    if (!this.active) return;
    const w = this.world;
    const now = w.time.now;
    if (now < this.castReadyAt) return;
    this.castReadyAt = now + CAST_COOLDOWN;
    const wiz = w.wizard;
    const sx = wiz.x;
    const sy = wiz.y - 30;

    let target: Zombie | null = null;
    let best = RANGE;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const d = Phaser.Math.Distance.Between(wiz.x, wiz.y, z.sprite.x, z.sprite.y);
      if (d < best) { best = d; target = z; }
    }

    this.casts++;
    w.sound.play('rune_sparkle_short', { volume: 0.5, detune: Phaser.Math.Between(-150, 150) });
    if (this.casts % 3 === 1) this.say(Phaser.Utils.Array.GetRandom(SPELL_WORDS));

    const bolt = w.add.image(sx, sy, 'wisp').setBlendMode(Phaser.BlendModes.ADD).setTint(0x9ff7ff).setScale(0.6).setDepth(99999);
    if (!target) {
      // fizzle: a short spark in front of the wizard
      w.tweens.add({ targets: bolt, y: sy - 24, alpha: 0, scale: 0.2, duration: 300, onComplete: () => bolt.destroy() });
      return;
    }
    const t = target;
    const dur = Math.max(90, (best / 760) * 1000);
    w.tweens.add({
      targets: bolt, x: t.sprite.x, y: t.sprite.y - 18, duration: dur, ease: 'Linear',
      onComplete: () => {
        bolt.destroy();
        this.burst(t.sprite.x, t.sprite.y - 18);
        if (!t.alive) return;
        t.hp -= 1;
        t.sprite.setTintFill(0xffffff);
        w.time.delayedCall(70, () => t.sprite.clearTint());
        const dx = t.sprite.x - wiz.x;
        const dy = t.sprite.y - wiz.y;
        const d = Math.hypot(dx, dy) || 1;
        t.sprite.x += (dx / d) * 14;
        t.sprite.y += (dy / d) * 14;
        if (t.hp <= 0) this.kill(t);
      },
    });
  }

  private burst(x: number, y: number): void {
    const w = this.world;
    for (let i = 0; i < 6; i++) {
      const p = w.add.image(x, y, 'firefly_dot').setBlendMode(Phaser.BlendModes.ADD).setTint(0xbffcff).setDepth(99999).setScale(1.2);
      const a = Math.random() * Math.PI * 2;
      w.tweens.add({ targets: p, x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 18, alpha: 0, duration: 320, onComplete: () => p.destroy() });
    }
  }

  private kill(z: Zombie): void {
    const w = this.world;
    z.alive = false;
    w.sound.play('zombie_die', { volume: 0.55, detune: Phaser.Math.Between(-150, 150) });
    w.tweens.add({ targets: z.sprite, alpha: 0, scaleY: 0.1, y: z.sprite.y + 8, angle: z.sprite.flipX ? -30 : 30, duration: 450, onComplete: () => z.sprite.destroy() });
    w.tweens.add({ targets: z.shadow, alpha: 0, duration: 450, onComplete: () => z.shadow.destroy() });
    const soul = w.add.image(z.sprite.x, z.sprite.y - 20, 'wisp').setBlendMode(Phaser.BlendModes.ADD).setTint(0xd9fff0).setAlpha(0.8).setScale(0.5).setDepth(99999);
    w.tweens.add({ targets: soul, y: soul.y - 50, alpha: 0, duration: 1100, ease: 'Sine.easeOut', onComplete: () => soul.destroy() });
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
    w.sound.play('choir_aah', { volume: 0.35 });
    this.banner('The graveyard rests.', 'All twelve souls laid to rest', 2600);
    w.time.delayedCall(3200, () => {
      this.zombies = [];
      this.active = false;
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
    });
  }
}
