/**
 * EasterEggManager.ts — Halloween lore Easter eggs (Session B, Nov 3 rewrite).
 * Plain helper owned by GraveyardWorld (NOT a Phaser.Scene).
 * All timing uses world.time (pauses with the scene); no setTimeout.
 * Found eggs persist in localStorage (rd_eggs_found).
 *
 * Events emitted on the UIScene event bus:
 *   'eggFound'      (eggId: string, found: number, total: number)  first find only
 *   'showLoreCard'  (title: string, text: string, iconKey?: string) first find only
 *   'eggHint'       (hint: string | null)                            when the nearby prompt changes
 */
import Phaser from 'phaser';
import { EGG_DEFINITIONS, EggDefinition, getEggById } from './eggDefinitions';

const STORAGE_KEY = 'rd_eggs_found';
const AREA_COOLDOWN_MS = 45000;   // black cat can cross again after 45 s
const STILL_MS = 2500;            // moon howl: stand still this long
const WELL_WINDOW_MS = 4000;      // three F presses inside this window

type World = Phaser.Scene & {
  wizard: Phaser.Physics.Arcade.Sprite;
  summonWitch?: () => void;
};

export class EasterEggManager {
  private world: World;
  /** exposed for debug/screenshot scripts */
  readonly defs = EGG_DEFINITIONS;
  private foundIds = new Set<string>();
  private eggSprites = new Map<string, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>();
  private busy = new Set<string>();           // egg animations currently playing
  private areaCooldownUntil = new Map<string, number>();
  private lastHint: string | null = null;
  private loreAt: { x: number; y: number } | null = null;

  private stillMs = 0;
  private lastX = 0;
  private lastY = 0;
  private wellPresses = 0;
  private wellFirstPressAt = 0;
  private grave13Glow: Phaser.GameObjects.Image | null = null;
  private moonPool: Phaser.GameObjects.Image | null = null;

  constructor(world: World, colliderGroup?: Phaser.Physics.Arcade.StaticGroup) {
    this.world = world;
    this.loadFound();
    this.placeProps(colliderGroup);
  }

  // ─── Persistence ────────────────────────────────────────────────────────
  private loadFound(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.foundIds = new Set(JSON.parse(raw) as string[]);
    } catch { this.foundIds = new Set(); }
  }
  private saveFound(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.foundIds])); } catch { /* private mode */ }
  }

  // ─── Props in the world ─────────────────────────────────────────────────
  private placeProps(colliderGroup?: Phaser.Physics.Arcade.StaticGroup): void {
    const w = this.world;
    for (const egg of EGG_DEFINITIONS) {
      let key = egg.spriteKey;
      if (egg.id === 'black_cat') continue; // spawned on trigger
      if (egg.id === 'moon_howl') {
        // faint pool of moonlight so players can find the spot
        if (!this.moonPool && w.textures.exists('glow_moon')) {
          this.moonPool = w.add.image(egg.x, egg.y, 'glow_moon').setTint(0xbfd8ff).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setAlpha(0.25).setDepth(-8);
        }
        continue;
      }
      if (egg.id === 'grave_13') key = 'tomb_deco_cross';
      if (egg.id === 'jack_pumpkin' && this.foundIds.has(egg.id)) key = 'jackolantern_lit';
      if (egg.id === 'crypt_knock' && this.foundIds.has(egg.id)) key = 'crypt_open';
      if (!key || !w.textures.exists(key)) continue;

      const img = w.add.image(egg.x, egg.y, key).setOrigin(0.5, 1).setDepth(egg.y);
      this.eggSprites.set(egg.id, img);

      // contact shadow so props sit on the ground
      if (w.textures.exists('shadow_contact')) {
        w.add.image(egg.x, egg.y - 1, 'shadow_contact')
          .setScale(Math.max(0.5, img.width / 48), 0.6).setAlpha(0.55).setDepth(egg.y - 2);
      }

      if (egg.id === 'grave_13') {
        w.add.text(egg.x, egg.y - img.height * 0.55, 'XIII', {
          fontFamily: "'Cinzel', serif", fontSize: '10px', color: '#9fb3c8',
        }).setOrigin(0.5).setDepth(egg.y + 1).setAlpha(0.85);
      }

      // solid base for big props (crypt, well) so the wizard can't walk through
      if (colliderGroup && (egg.id === 'crypt_knock' || egg.id === 'mirror_well' || egg.id === 'grave_13')) {
        const body = colliderGroup.create(egg.x, egg.y - 8, undefined) as Phaser.Physics.Arcade.Image;
        body.setVisible(false);
        const sb = body.body as Phaser.Physics.Arcade.StaticBody;
        sb.setSize(egg.id === 'grave_13' ? 28 : Math.round(img.width * 0.7), 14);
        sb.reset(egg.x, egg.y - 6);
      }
    }
  }

  // ─── Per-frame ──────────────────────────────────────────────────────────
  /** Call from GraveyardWorld.update(time, delta) while no ritual is active. */
  update(delta: number): void {
    const wiz = this.world.wizard;
    if (!wiz) return;
    const now = this.world.time.now;

    // area eggs (black cat)
    for (const egg of EGG_DEFINITIONS) {
      if (egg.triggerType !== 'area') continue;
      if (this.foundIds.has(egg.id) || this.busy.has(egg.id)) continue;
      if ((this.areaCooldownUntil.get(egg.id) ?? 0) > now) continue;
      if (Phaser.Math.Distance.Between(wiz.x, wiz.y, egg.x, egg.y) < egg.radius) {
        this.areaCooldownUntil.set(egg.id, now + AREA_COOLDOWN_MS);
        this.trigger(egg.id);
      }
    }

    // moon howl: stand still in the moon pool
    const moon = getEggById('moon_howl');
    if (moon && !this.foundIds.has('moon_howl') && !this.busy.has('moon_howl')) {
      const inPool = Phaser.Math.Distance.Between(wiz.x, wiz.y, moon.x, moon.y) < moon.radius;
      const moved = Math.abs(wiz.x - this.lastX) > 0.5 || Math.abs(wiz.y - this.lastY) > 0.5;
      this.stillMs = inPool && !moved ? this.stillMs + delta : 0;
      if (this.stillMs >= STILL_MS) { this.stillMs = 0; this.trigger('moon_howl'); }
    }
    this.lastX = wiz.x; this.lastY = wiz.y;

    // well press window expiry
    if (this.wellPresses > 0 && now - this.wellFirstPressAt > WELL_WINDOW_MS) this.wellPresses = 0;

    // walk away from a lore card to dismiss it
    if (this.loreAt && Phaser.Math.Distance.Between(wiz.x, wiz.y, this.loreAt.x, this.loreAt.y) > 90) {
      this.loreAt = null;
      this.world.scene.get('UIScene')?.events.emit('hideLoreCard');
    }

    // nearby prompt
    this.emitHint(this.computeHint(wiz));
  }

  private nearestInteractable(wiz: Phaser.Physics.Arcade.Sprite): EggDefinition | null {
    let best: EggDefinition | null = null;
    let bestD = Infinity;
    for (const egg of EGG_DEFINITIONS) {
      if (egg.triggerType !== 'f-key' && egg.triggerType !== 'triple-f') continue;
      const d = Phaser.Math.Distance.Between(wiz.x, wiz.y, egg.x, egg.y);
      if (d < egg.radius && d < bestD) { best = egg; bestD = d; }
    }
    return best;
  }

  private computeHint(wiz: Phaser.Physics.Arcade.Sprite): string | null {
    const egg = this.nearestInteractable(wiz);
    const touch = this.world.sys.game.device.input.touch;
    const P = touch ? 'Tap F' : 'Press F';
    if (egg) {
      if (egg.id === 'mirror_well') return this.wellPresses > 0 ? `${P} to peer into the well (${this.wellPresses}/3)` : `${P} three times to peer into the well`;
      if (egg.id === 'jack_pumpkin') return `${P} to carve the pumpkin`;
      if (egg.id === 'crypt_knock') return `${P} to knock on the crypt`;
      if (egg.id === 'grave_13') return `${P} to read the 13th grave`;
      return P;
    }
    const moon = getEggById('moon_howl');
    if (moon && Phaser.Math.Distance.Between(wiz.x, wiz.y, moon.x, moon.y) < moon.radius) {
      return 'Stand still in the moonlight...';
    }
    return null;
  }

  private emitHint(hint: string | null): void {
    if (hint === this.lastHint) return;
    this.lastHint = hint;
    this.world.scene.get('UIScene')?.events.emit('eggHint', hint);
  }

  /** F pressed and no resurrectable grave is active. Returns true if an egg used it. */
  tryInteract(): boolean {
    const wiz = this.world.wizard;
    if (!wiz) return false;
    const egg = this.nearestInteractable(wiz);
    if (!egg) return false;
    if (this.busy.has(egg.id)) return true;

    if (egg.triggerType === 'triple-f') {
      const now = this.world.time.now;
      if (this.wellPresses === 0 || now - this.wellFirstPressAt > WELL_WINDOW_MS) {
        this.wellPresses = 0;
        this.wellFirstPressAt = now;
      }
      this.wellPresses += 1;
      this.world.sound.play('ghost_breath', { volume: 0.15 + 0.1 * this.wellPresses });
      if (this.wellPresses >= 3) { this.wellPresses = 0; this.trigger(egg.id); }
      this.lastHint = null; // refresh counter text next frame
      return true;
    }
    this.trigger(egg.id);
    return true;
  }

  // ─── Trigger + bookkeeping ──────────────────────────────────────────────
  trigger(eggId: string): void {
    const egg = getEggById(eggId);
    if (!egg || this.busy.has(eggId)) return;
    this.busy.add(eggId);
    const done = () => this.busy.delete(eggId);

    switch (eggId) {
      case 'black_cat':    this.doBlackCat(done); break;
      case 'jack_pumpkin': this.doJackPumpkin(done); break;
      case 'grave_13':     this.doGrave13(done); break;
      case 'crypt_knock':  this.doCryptKnock(done); break;
      case 'mirror_well':  this.doMirrorWell(done); break;
      case 'moon_howl':    this.doMoonHowl(done); break;
      default: done();
    }

    if (!this.foundIds.has(eggId)) {
      this.foundIds.add(eggId);
      this.saveFound();
      const ui = this.world.scene.get('UIScene');
      ui?.events.emit('eggFound', eggId, this.foundIds.size, EGG_DEFINITIONS.length);
      // lore card after the visual beat
      this.world.time.delayedCall(eggId === 'black_cat' ? 9500 : 900, () => {
        if (this.world.scene.isActive('ResurrectionRitual')) return;
        this.loreAt = { x: this.world.wizard.x, y: this.world.wizard.y };
        ui?.events.emit('showLoreCard', egg.title, egg.text, egg.iconKey ?? egg.spriteKey);
      });
    }
  }

  // ─── Egg sequences ──────────────────────────────────────────────────────
  private doBlackCat(done: () => void): void {
    const w = this.world;
    const wiz = w.wizard;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y = wiz.y + 14;                     // crosses just in front of (below) the wizard
    const startX = wiz.x - dir * 110;
    const endX = wiz.x + dir * 110;

    const cat = w.add.sprite(startX, y, 'black_cat_walk').setOrigin(0.5, 1).setDepth(wiz.y + 8).setFlipX(dir < 0);
    if (w.anims.exists('cat_walk')) cat.play('cat_walk');
    const shadow = w.add.image(startX, y - 1, 'shadow_contact').setScale(0.45, 0.4).setAlpha(0.55).setDepth(wiz.y + 7);
    w.sound.play('cat_meow', { volume: 0.5 });

    w.tweens.add({ targets: [cat, shadow], x: endX, duration: 1500, ease: 'Linear',
      onComplete: () => {
        w.tweens.add({ targets: [cat, shadow], alpha: 0, duration: 300, onComplete: () => { cat.destroy(); shadow.destroy(); } });
      } });

    // the omen: something bad is about to happen
    w.time.delayedCall(1700, () => {
      const cam = w.cameras.main;
      const flash = w.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xdfe8ff)
        .setScrollFactor(0).setDepth(9999).setAlpha(0);
      w.tweens.add({ targets: flash, alpha: { from: 0.55, to: 0 }, duration: 120, yoyo: false,
        onComplete: () => {
          w.tweens.add({ targets: flash, alpha: { from: 0.35, to: 0 }, duration: 260, delay: 90, onComplete: () => flash.destroy() });
        } });
      cam.shake(350, 0.004);
      w.sound.play('ground_rumble', { volume: 0.5 });
      w.sound.play('crow_caw_02', { volume: 0.6, delay: 0.25 });
      w.time.delayedCall(700, () => w.summonWitch?.());
      w.time.delayedCall(1200, done);
    });
  }

  private doJackPumpkin(done: () => void): void {
    const w = this.world;
    const img = this.eggSprites.get('jack_pumpkin') as Phaser.GameObjects.Image | undefined;
    if (!img || img.texture.key === 'jackolantern_lit') { done(); return; }
    const x0 = img.x;
    w.sound.play('pumpkin_carve', { volume: 0.6 });
    w.tweens.add({ targets: img, x: x0 - 2, duration: 70, yoyo: true, repeat: 3,
      onComplete: () => {
        img.x = x0;
        img.setTexture('jackolantern_lit');
        const glow = w.add.image(img.x, img.y - img.height / 2, 'glow_warm').setDepth(img.depth - 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setTint(0xf08a24);
        w.tweens.add({ targets: glow, alpha: 0.45, duration: 400 });
        done();
      } });
  }

  private doGrave13(done: () => void): void {
    const w = this.world;
    const egg = getEggById('grave_13')!;
    w.cameras.main.shake(300, 0.003);
    w.sound.play('gate_creak_01', { detune: -300, volume: 0.6 });
    if (!this.grave13Glow) {
      this.grave13Glow = w.add.image(egg.x, egg.y - 20, 'glow_warm').setDepth(egg.y - 1).setAlpha(0).setTint(0x9fffcf);
    }
    w.tweens.add({ targets: this.grave13Glow, alpha: { from: 0.45, to: 0.2 }, duration: 900, ease: 'Sine.easeOut', onComplete: done });
  }

  private doCryptKnock(done: () => void): void {
    const w = this.world;
    const img = this.eggSprites.get('crypt_knock') as Phaser.GameObjects.Image | undefined;
    if (!img) { done(); return; }
    w.sound.play('knock_wood', { volume: 0.7 });
    if (img.texture.key === 'crypt_open') { w.time.delayedCall(400, done); return; }
    w.time.delayedCall(700, () => {
      img.setTexture('crypt_open');
      w.sound.play('candy_chime', { volume: 0.5 });
      for (let i = 0; i < 6; i++) {
        const candy = w.add.image(img.x, img.y - 24, 'candy').setDepth(img.y + 1);
        const tx = img.x + Phaser.Math.Between(-50, 50);
        const ty = img.y + Phaser.Math.Between(4, 24);
        w.tweens.add({ targets: candy, x: tx, duration: 650, ease: 'Linear' });
        w.tweens.add({ targets: candy, y: { from: img.y - 24, to: ty }, duration: 650, ease: 'Bounce.easeOut',
          onComplete: () => { candy.setDepth(ty); w.time.delayedCall(5000, () => w.tweens.add({ targets: candy, alpha: 0, duration: 500, onComplete: () => candy.destroy() })); } });
      }
      done();
    });
  }

  private doMirrorWell(done: () => void): void {
    const w = this.world;
    const img = this.eggSprites.get('mirror_well') as Phaser.GameObjects.Image | undefined;
    if (!img) { done(); return; }
    const glow = w.add.image(img.x, img.y - 20, 'glow_moon').setTint(0x7fc3ff).setDepth(img.y - 1).setAlpha(0);
    const ghost = w.add.image(img.x, img.y - 24, 'ghost_lady').setOrigin(0.5, 1).setDepth(img.y + 1).setAlpha(0);
    w.sound.play('ghost_breath', { volume: 0.6 });
    w.tweens.add({ targets: glow, alpha: 0.35, duration: 600 });
    w.tweens.add({ targets: ghost, alpha: 0.85, y: img.y - 64, duration: 1400, ease: 'Sine.easeOut' });
    w.tweens.add({ targets: ghost, x: img.x - 5, duration: 900, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', delay: 1400 });
    w.time.delayedCall(4200, () => {
      w.tweens.add({ targets: [ghost, glow], alpha: 0, duration: 1200, onComplete: () => { ghost.destroy(); glow.destroy(); done(); } });
    });
  }

  private doMoonHowl(done: () => void): void {
    const w = this.world;
    const egg = getEggById('moon_howl')!;
    const cam = w.cameras.main;
    const tint = w.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xbfd8ff)
      .setScrollFactor(0).setDepth(9998).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    w.tweens.add({ targets: tint, alpha: 0.12, duration: 1500 });
    if (!this.moonPool) {
      this.moonPool = w.add.image(egg.x, egg.y, 'glow_moon').setTint(0xbfd8ff).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setAlpha(0.25).setDepth(-8);
    }
    const wolf = w.add.image(egg.x - 60, egg.y - 40, 'wolf_spirit').setOrigin(0.5, 1).setFlipX(true)
      .setDepth(egg.y + 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    w.tweens.add({ targets: wolf, alpha: 0.75, y: egg.y - 100, duration: 1200, ease: 'Sine.easeOut' });
    w.sound.play('wolf_howl', { volume: 0.45 });
    w.time.delayedCall(4000, () => {
      w.tweens.add({ targets: [wolf, tint], alpha: 0, duration: 1500, onComplete: () => { wolf.destroy(); tint.destroy(); done(); } });
    });
  }

  /** Force the next update() to re-send the prompt (after a ritual hid it). */
  clearHint(): void { this.lastHint = '\u0000'; }

  // ─── Getters ────────────────────────────────────────────────────────────
  getFoundCount(): number { return this.foundIds.size; }
  getTotal(): number { return EGG_DEFINITIONS.length; }
  isFound(id: string): boolean { return this.foundIds.has(id); }
  /** Debug: ?debug=1 → window.__RD.eggs.reset() */
  reset(): void { this.foundIds.clear(); this.saveFound(); }
}
