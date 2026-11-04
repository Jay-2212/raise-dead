/**
 * WorldMap — N4/M1–M3. Lives in UIScene (camera zoom 1).
 *  - Minimap (top-right, under the secrets counter): paths, graves (raised = teal, not yet = grey), wizard dot. N toggles.
 *  - Full map (Map button / J / Tab, Esc or click to close): every area named, graves raised vs not,
 *    secrets found shown with an icon at their real spot, unfound ones only as "?" in their area.
 * Raised graves persist in localStorage `rd_raised`.
 */
import Phaser from 'phaser';
import { PATH_RECTS, MAP_LAYOUT } from '../scenes/mapLayout';

const WORLD_W = 2400;
const WORLD_H = 1800;

export interface MapRegion { name: string; x: number; y: number; egg?: string }
export const MAP_REGIONS: MapRegion[] = [
  { name: 'Central Plaza', x: 1200, y: 900 },
  { name: 'The Crypt', x: 500, y: 840, egg: 'crypt_knock' },
  { name: 'West Path', x: 760, y: 790, egg: 'black_cat' },
  { name: 'Pumpkin Patch', x: 880, y: 1040, egg: 'jack_pumpkin' },
  { name: 'East Stones', x: 2060, y: 720, egg: 'grave_13' },
  { name: 'The Old Well', x: 2060, y: 400, egg: 'mirror_well' },
  { name: 'Moon Hill', x: 960, y: 1560, egg: 'moon_howl' },
  { name: 'Zombie Field', x: 1300, y: 1500, egg: 'zombie_hand' },
];

export interface MapData {
  wizard: { x: number; y: number } | null;
  graves: Array<{ id: string; name: string; x: number; y: number; resurrectable: boolean }>;
  raised: Set<string>;
  eggs: Array<{ id: string; title: string; x: number; y: number; found: boolean }>;
}

export function loadRaised(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('rd_raised') || '[]')); } catch { return new Set(); }
}
export function markRaised(id: string): void {
  const s = loadRaised();
  if (s.has(id)) return;
  s.add(id);
  try { localStorage.setItem('rd_raised', JSON.stringify([...s])); } catch { /* private mode */ }
}

export class WorldMap {
  private scene: Phaser.Scene;
  private getData: () => MapData;
  private mini: Phaser.GameObjects.Container;
  private miniDyn: Phaser.GameObjects.Graphics;
  private full: Phaser.GameObjects.Container | null = null;
  private miniShown = true;
  private miniTimer = 0;
  static readonly MW = 180;
  static readonly MH = 135;

  constructor(scene: Phaser.Scene, getData: () => MapData) {
    this.scene = scene;
    this.getData = getData;
    const { width } = scene.scale;
    const x = width - WorldMap.MW - 12;
    const y = 66;
    this.mini = scene.add.container(x, y).setDepth(105).setScrollFactor(0);
    const bg = scene.add.rectangle(0, 0, WorldMap.MW, WorldMap.MH, 0x0b1020, 0.72).setOrigin(0).setStrokeStyle(1, 0x5d6b80, 0.9);
    const paths = scene.add.graphics();
    paths.fillStyle(0x3b4658, 0.9);
    const sx = WorldMap.MW / WORLD_W, sy = WorldMap.MH / WORLD_H;
    for (const r of PATH_RECTS) paths.fillRect(r.x * sx, r.y * sy, Math.max(1, r.width * sx), Math.max(1, r.height * sy));
    this.miniDyn = scene.add.graphics();
    const label = scene.add.text(WorldMap.MW - 4, WorldMap.MH - 3, 'J: map · N: hide', {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '9px', color: '#8796ad',
    }).setOrigin(1, 1);
    this.mini.add([bg, paths, this.miniDyn, label]);
    bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleFull());
    try { this.miniShown = localStorage.getItem('rd_minimap') !== '0'; } catch { /* ignore */ }
    this.mini.setVisible(this.miniShown);
  }

  get fullOpen(): boolean { return !!this.full; }

  toggleMinimap(): void {
    this.miniShown = !this.miniShown;
    this.mini.setVisible(this.miniShown && !this.full);
    try { localStorage.setItem('rd_minimap', this.miniShown ? '1' : '0'); } catch { /* ignore */ }
  }

  setHidden(hidden: boolean): void {
    this.mini.setVisible(!hidden && this.miniShown && !this.full);
  }

  update(delta: number): void {
    if (!this.mini.visible) return;
    this.miniTimer -= delta;
    if (this.miniTimer > 0) return;
    this.miniTimer = 120;
    const d = this.getData();
    const g = this.miniDyn;
    const sx = WorldMap.MW / WORLD_W, sy = WorldMap.MH / WORLD_H;
    g.clear();
    for (const gr of d.graves) {
      if (!gr.resurrectable) continue;
      g.fillStyle(d.raised.has(gr.id) ? 0x7fd1d8 : 0x55606e, 1);
      g.fillRect(gr.x * sx - 1.5, gr.y * sy - 1.5, 3, 3);
    }
    for (const e of d.eggs) {
      if (!e.found) continue;
      g.fillStyle(0xe8b04a, 1);
      g.fillCircle(e.x * sx, e.y * sy, 1.6);
    }
    if (d.wizard) {
      g.fillStyle(0xfff2c4, 1);
      g.fillCircle(d.wizard.x * sx, d.wizard.y * sy, 2.6);
      g.lineStyle(1, 0x000000, 0.6).strokeCircle(d.wizard.x * sx, d.wizard.y * sy, 3);
    }
  }

  toggleFull(): void {
    if (this.full) this.closeFull(); else this.openFull();
  }

  closeFull(): void {
    if (!this.full) return;
    const f = this.full;
    this.full = null;
    this.scene.tweens.add({ targets: f, alpha: 0, duration: 160, onComplete: () => f.destroy() });
    this.mini.setVisible(this.miniShown);
  }

  private openFull(): void {
    const s = this.scene;
    const { width, height } = s.scale;
    const d = this.getData();
    const PW = Math.min(width - 80, 880, (height - 150) * (WORLD_W / WORLD_H));
    const PH = PW * (WORLD_H / WORLD_W);
    const ox = (width - PW) / 2;
    const oy = Math.max(64, (height - PH) / 2);
    const sx = PW / WORLD_W, sy = PH / WORLD_H;
    const c = s.add.container(0, 0).setDepth(250).setScrollFactor(0).setAlpha(0);
    const dim = s.add.rectangle(0, 0, width, height, 0x000000, 0.66).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => this.closeFull());
    const panel = s.add.rectangle(ox - 10, oy - 10, PW + 20, PH + 20, 0x0e1526, 0.97).setOrigin(0).setStrokeStyle(2, 0xc9b98a, 0.8);
    const g = s.add.graphics();
    g.fillStyle(0x16202c, 1).fillRect(ox, oy, PW, PH);
    g.fillStyle(0x3b4658, 1);
    for (const r of PATH_RECTS) g.fillRect(ox + r.x * sx, oy + r.y * sy, Math.max(1, r.width * sx), Math.max(1, r.height * sy));
    c.add([dim, panel, g]);

    // graves
    let raisedCount = 0, total = 0;
    for (const gr of d.graves) {
      const px = ox + gr.x * sx, py = oy + gr.y * sy;
      if (!gr.resurrectable) { g.fillStyle(0x2a3340, 1).fillRect(px - 2, py - 3, 4, 6); continue; }
      total++;
      const raised = d.raised.has(gr.id);
      if (raised) raisedCount++;
      g.fillStyle(raised ? 0x7fd1d8 : 0x6a7686, 1).fillRoundedRect(px - 4, py - 6, 8, 11, 3);
      if (!raised) g.lineStyle(1, 0xc9b98a, 0.9).strokeRoundedRect(px - 5, py - 7, 10, 13, 3);
      const t = s.add.text(px, py + 8, raised ? gr.name : gr.name + ' ?', {
        fontFamily: "'Pixelify Sans', sans-serif", fontSize: '10px', color: raised ? '#bfeef2' : '#c9b98a',
      }).setOrigin(0.5, 0);
      c.add(t);
    }

    // regions + secrets
    const foundIds = new Set(d.eggs.filter((e) => e.found).map((e) => e.id));
    for (const r of MAP_REGIONS) {
      const px = ox + r.x * sx, py = oy + r.y * sy;
      const name = s.add.text(px, py - 22, r.name.toUpperCase(), {
        fontFamily: "'Cinzel', serif", fontSize: '11px', color: '#8796ad',
      }).setOrigin(0.5).setAlpha(0.9);
      c.add(name);
      if (r.egg && !foundIds.has(r.egg)) {
        const q = s.add.text(px, py - 6, '?', { fontFamily: "'Cinzel', serif", fontSize: '18px', color: '#e8b04a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        c.add(q);
        s.tweens.add({ targets: q, alpha: { from: 1, to: 0.35 }, duration: 900, yoyo: true, repeat: -1 });
      }
    }
    for (const e of d.eggs) {
      if (!e.found) continue;
      const px = ox + e.x * sx, py = oy + e.y * sy;
      g.fillStyle(0xe8b04a, 1).fillCircle(px, py, 4);
      g.lineStyle(1, 0x000000, 0.7).strokeCircle(px, py, 4.5);
      const t = s.add.text(px + 7, py, e.title, { fontFamily: "'Pixelify Sans', sans-serif", fontSize: '10px', color: '#f3d58c' }).setOrigin(0, 0.5);
      c.add(t);
    }
    if (d.wizard) {
      const px = ox + d.wizard.x * sx, py = oy + d.wizard.y * sy;
      const you = s.add.circle(px, py, 5, 0xfff2c4).setStrokeStyle(2, 0x000000, 0.7);
      const lbl = s.add.text(px, py - 12, 'you', { fontFamily: "'Pixelify Sans', sans-serif", fontSize: '10px', color: '#fff2c4' }).setOrigin(0.5);
      c.add([you, lbl]);
      s.tweens.add({ targets: you, scale: { from: 1, to: 1.5 }, alpha: { from: 1, to: 0.6 }, duration: 700, yoyo: true, repeat: -1 });
    }

    const found = foundIds.size;
    const eggTotal = d.eggs.length;
    const title = s.add.text(width / 2, oy - 40, 'Map of the Graveyard', { fontFamily: "'Cinzel', serif", fontSize: '22px', color: '#d9f2ee' }).setOrigin(0.5);
    const cap = s.add.text(width / 2, oy + PH + 16, `Graves raised ${raisedCount}/${total}  ·  Secrets ${found}/${eggTotal}  ·  ? = not raised yet / secret still hidden  ·  Esc / J / click to close`, {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '13px', color: '#c9b98a',
    }).setOrigin(0.5, 0);
    c.add([title, cap]);
    this.full = c;
    this.mini.setVisible(false);
    s.tweens.add({ targets: c, alpha: 1, duration: 180 });
  }
}

export { MAP_LAYOUT };
