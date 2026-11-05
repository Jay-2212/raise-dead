/**
 * WorldMap — N4/M1–M3, redrawn in the polish pass. Lives in UIScene (camera zoom 1).
 *  - Minimap (top-right, under the secrets counter): a painted miniature of the graveyard
 *    (grass, gravel paths, trees, old stones, moonlight, vignette) in a bone frame, with
 *    tombstone markers for the graves you can raise (teal = raised, bone = waiting), the camera
 *    view, found secrets and a heading arrow for the wizard. The caption names the grave nearest
 *    to you, or the one under the pointer; clicking a grave marker walks there, clicking elsewhere
 *    opens the full map. N toggles.
 *  - Full map (Map button / J / Tab, Esc or click outside to close): same painted ground, every
 *    area named, every grave labelled and clickable for fast travel, secrets as before.
 * Raised graves persist in localStorage `rd_raised`.
 */
import Phaser from 'phaser';
import { MAP_LAYOUT } from '../scenes/mapLayout';
import { paintMapGround, WORLD_W, WORLD_H, PaintInput } from './mapPainter';

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
  trees?: Array<{ x: number; y: number }>;
  marks?: Array<{ kind: 'lantern' | 'crypt' | 'well'; x: number; y: number }>;
  view?: { x: number; y: number; width: number; height: number } | null;
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

const BONE = 0xe8dcc0;
const BONE_DIM = 0xc9b98a;
const MOON = 0x7fd1d8;
const NIGHT = 0x0b1020;
const AMBER = 0xe8b04a;
const FONT = "'Pixelify Sans', sans-serif";
const DPR = 2;

type G = Phaser.GameObjects.Graphics;

/** Map labels use short names so the tight arcs of graves stay readable. */
export function shortName(name: string): string {
  return name
    .replace(/\s*\(.*\)\s*$/, '')
    .replace(/^3D Pinball:\s*/i, '')
    .replace(/^The\s+/i, '')
    .replace(/\s+the Paperclip$/i, '');
}

/** Tombstone marker: rounded top, flat base. */
function tomb(g: G, x: number, y: number, w: number, h: number, fill: number, alpha = 1, outline?: number): void {
  const r = w / 2;
  g.fillStyle(0x000000, 0.45).fillRoundedRect(x - w / 2 + 0.8, y - h + 1.2, w, h, { tl: r, tr: r, bl: 1, br: 1 });
  g.fillStyle(fill, alpha).fillRoundedRect(x - w / 2, y - h, w, h, { tl: r, tr: r, bl: 1, br: 1 });
  if (outline !== undefined) g.lineStyle(1, outline, 0.9).strokeRoundedRect(x - w / 2 - 0.5, y - h - 0.5, w + 1, h + 1, { tl: r + 0.5, tr: r + 0.5, bl: 1, br: 1 });
}

/** Wizard: soft halo + an arrow pointing where he last walked. */
function player(g: G, x: number, y: number, heading: number, size: number, pulse: number): void {
  g.fillStyle(0xfff2c4, 0.16 + 0.12 * pulse).fillCircle(x, y, size * (1.9 + 0.5 * pulse));
  const p = (a: number, r: number) => ({ x: x + Math.cos(heading + a) * r, y: y + Math.sin(heading + a) * r });
  const tip = p(0, size * 1.25), l = p(2.45, size), rr = p(-2.45, size), back = p(Math.PI, size * 0.35);
  g.fillStyle(0x000000, 0.6);
  g.fillTriangle(tip.x + 0.6, tip.y + 0.8, l.x + 0.6, l.y + 0.8, back.x + 0.6, back.y + 0.8);
  g.fillTriangle(tip.x + 0.6, tip.y + 0.8, rr.x + 0.6, rr.y + 0.8, back.x + 0.6, back.y + 0.8);
  g.fillStyle(0xfff2c4, 1);
  g.fillTriangle(tip.x, tip.y, l.x, l.y, back.x, back.y);
  g.fillTriangle(tip.x, tip.y, rr.x, rr.y, back.x, back.y);
  g.lineStyle(1, 0x2a2010, 0.8);
  g.strokeTriangle(tip.x, tip.y, l.x, l.y, back.x, back.y);
  g.strokeTriangle(tip.x, tip.y, rr.x, rr.y, back.x, back.y);
}

/** Drop shadow + night backing under the map. */
function backing(g: G, w: number, h: number, r: number): void {
  g.fillStyle(0x000000, 0.45).fillRoundedRect(-3, -1, w + 8, h + 8, r + 3);
  g.fillStyle(NIGHT, 0.94).fillRoundedRect(0, 0, w, h, r);
}

/** Bone frame with corner studs, drawn around (0,0,w,h). */
function frame(g: G, w: number, h: number, r: number): void {
  g.lineStyle(3, NIGHT, 0.95).strokeRoundedRect(-1.5, -1.5, w + 3, h + 3, r + 1.5);
  g.lineStyle(1.5, BONE_DIM, 0.9).strokeRoundedRect(-2.5, -2.5, w + 5, h + 5, r + 2.5);
  g.lineStyle(1, MOON, 0.18).strokeRoundedRect(1, 1, w - 2, h - 2, Math.max(1, r - 1));
  for (const [cx, cy] of [[-2.5, -2.5], [w + 2.5, -2.5], [-2.5, h + 2.5], [w + 2.5, h + 2.5]]) {
    g.fillStyle(NIGHT, 1).fillCircle(cx, cy, 3.6);
    g.fillStyle(BONE, 1).fillPoints([
      new Phaser.Math.Vector2(cx, cy - 2.6), new Phaser.Math.Vector2(cx + 2.6, cy),
      new Phaser.Math.Vector2(cx, cy + 2.6), new Phaser.Math.Vector2(cx - 2.6, cy),
    ], true);
  }
}

export class WorldMap {
  private scene: Phaser.Scene;
  private getData: () => MapData;
  private onTravel?: (x: number, y: number) => void;
  private mini: Phaser.GameObjects.Container;
  private miniDyn!: G;
  private miniGround: Phaser.GameObjects.Image | null = null;
  private caption!: Phaser.GameObjects.Text;
  private captionRight!: Phaser.GameObjects.Text;
  private full: Phaser.GameObjects.Container | null = null;
  private miniShown = true;
  private miniTimer = 0;
  private hoverId: string | null = null;
  private heading = -Math.PI / 2;
  private lastWiz: { x: number; y: number } | null = null;
  private cache: MapData | null = null;
  private fullSeq = 0;
  static readonly MW = 216;
  static readonly MH = 162;
  static readonly CAP = 20;

  constructor(scene: Phaser.Scene, getData: () => MapData, onTravel?: (x: number, y: number) => void) {
    this.scene = scene;
    this.getData = getData;
    this.onTravel = onTravel;
    const { width } = scene.scale;
    const x = width - WorldMap.MW - 14;
    const y = 68;
    this.mini = scene.add.container(x, y).setDepth(105).setScrollFactor(0);
    this.buildMini();
    try { this.miniShown = localStorage.getItem('rd_minimap') !== '0'; } catch { /* ignore */ }
    this.mini.setVisible(this.miniShown);
  }

  get fullOpen(): boolean { return !!this.full; }

  // ─── minimap ─────────────────────────────────────────────────────────────

  private buildMini(): void {
    const s = this.scene;
    const MW = WorldMap.MW, MH = WorldMap.MH, CAP = WorldMap.CAP;
    const back = s.add.graphics();
    backing(back, MW, MH + CAP, 7);
    const fr = s.add.graphics();
    frame(fr, MW, MH + CAP, 7);
    const capBg = s.add.graphics();
    capBg.lineStyle(1, BONE_DIM, 0.35).lineBetween(6, MH + 0.5, MW - 6, MH + 0.5);
    this.miniDyn = s.add.graphics();
    this.caption = s.add.text(8, MH + CAP / 2, '', { fontFamily: FONT, fontSize: '11px', color: '#e8dcc0' }).setOrigin(0, 0.5);
    this.captionRight = s.add.text(MW - 7, MH + CAP / 2, 'J map', { fontFamily: FONT, fontSize: '10px', color: '#6f7d93' }).setOrigin(1, 0.5);
    // compass tab
    const tab = s.add.graphics();
    tab.fillStyle(NIGHT, 0.95).fillRoundedRect(MW / 2 - 9, -10, 18, 12, 3);
    tab.lineStyle(1, BONE_DIM, 0.8).strokeRoundedRect(MW / 2 - 9, -10, 18, 12, 3);
    const north = s.add.text(MW / 2, -4, 'N', { fontFamily: "'Cinzel', serif", fontSize: '9px', color: '#e8dcc0' }).setOrigin(0.5);
    const hit = s.add.zone(0, 0, MW, MH + CAP).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on('pointermove', (p: Phaser.Input.Pointer) => this.onMiniHover(p));
    hit.on('pointerout', () => { this.hoverId = null; this.miniTimer = 0; });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => this.onMiniClick(p));
    this.mini.add([back, capBg, this.miniDyn, fr, this.caption, this.captionRight, tab, north, hit]);
  }

  private paintInput(d: MapData): PaintInput {
    const grassTex = this.scene.textures.exists('ground_grass') ? this.scene.textures.get('ground_grass').getSourceImage() as CanvasImageSource : null;
    return {
      grass: grassTex,
      trees: d.trees ?? [],
      marks: d.marks ?? [],
      stones: d.graves.filter((g) => !g.resurrectable).map((g) => ({ x: g.x, y: g.y })),
    };
  }

  private makeGroundTexture(key: string, w: number, h: number, d: MapData, corner: number): string {
    const tm = this.scene.textures;
    if (tm.exists(key)) tm.remove(key);
    const tex = tm.createCanvas(key, Math.round(w * DPR), Math.round(h * DPR));
    if (!tex) return key;
    paintMapGround(tex.getSourceImage() as HTMLCanvasElement, w, h, DPR, this.paintInput(d), corner);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  private ensureMiniGround(d: MapData): void {
    if (this.miniGround) return;
    const key = this.makeGroundTexture('rd_minimap_ground', WorldMap.MW, WorldMap.MH, d, 7);
    this.miniGround = this.scene.add.image(0, 0, key).setOrigin(0).setDisplaySize(WorldMap.MW, WorldMap.MH);
    this.mini.addAt(this.miniGround, 1); // above the backing, under markers and frame
  }

  private nearestGrave(d: MapData, x: number, y: number, maxD: number) {
    let best: MapData['graves'][number] | null = null;
    let bd = maxD;
    for (const g of d.graves) {
      if (!g.resurrectable) continue;
      const dd = Math.hypot(g.x - x, g.y - y);
      if (dd < bd) { bd = dd; best = g; }
    }
    return best;
  }

  private miniToWorld(p: Phaser.Input.Pointer): { x: number; y: number } {
    return { x: ((p.x - this.mini.x) / WorldMap.MW) * WORLD_W, y: ((p.y - this.mini.y) / WorldMap.MH) * WORLD_H };
  }

  private onMiniHover(p: Phaser.Input.Pointer): void {
    const d = this.cache ?? this.getData();
    const w = this.miniToWorld(p);
    const g = p.y - this.mini.y <= WorldMap.MH ? this.nearestGrave(d, w.x, w.y, 130) : null;
    const id = g?.id ?? null;
    if (id !== this.hoverId) { this.hoverId = id; this.miniTimer = 0; }
  }

  private onMiniClick(p: Phaser.Input.Pointer): void {
    const d = this.cache ?? this.getData();
    const w = this.miniToWorld(p);
    const g = p.y - this.mini.y <= WorldMap.MH ? this.nearestGrave(d, w.x, w.y, 130) : null;
    if (g && this.onTravel) this.onTravel(g.x, g.y + 44);
    else this.toggleFull();
  }

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
    this.miniTimer = 50;
    const d = this.getData();
    this.cache = d;
    this.ensureMiniGround(d);
    const MW = WorldMap.MW, MH = WorldMap.MH;
    const sx = MW / WORLD_W, sy = MH / WORLD_H;
    const t = this.scene.time.now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const g = this.miniDyn;
    g.clear();

    // camera view
    if (d.view) {
      const vx = Phaser.Math.Clamp(d.view.x * sx, 0, MW), vy = Phaser.Math.Clamp(d.view.y * sy, 0, MH);
      const vw = Math.min(MW - vx, d.view.width * sx), vh = Math.min(MH - vy, d.view.height * sy);
      g.fillStyle(BONE, 0.05).fillRect(vx, vy, vw, vh);
      g.lineStyle(1, BONE, 0.32).strokeRect(vx, vy, vw, vh);
    }

    // heading from movement
    if (d.wizard) {
      if (this.lastWiz) {
        const dx = d.wizard.x - this.lastWiz.x, dy = d.wizard.y - this.lastWiz.y;
        if (dx * dx + dy * dy > 4) this.heading = Math.atan2(dy, dx);
      }
      this.lastWiz = { ...d.wizard };
    }
    const near = d.wizard ? this.nearestGrave(d, d.wizard.x, d.wizard.y, 420) : null;
    const focusId = this.hoverId ?? near?.id ?? null;

    for (const gr of d.graves) {
      if (!gr.resurrectable) continue;
      const x = gr.x * sx, y = gr.y * sy + 2;
      const raised = d.raised.has(gr.id);
      const focus = gr.id === focusId;
      if (raised) g.fillStyle(MOON, 0.22).fillCircle(x, y - 3, 5.5);
      else g.fillStyle(AMBER, 0.10 + 0.14 * pulse).fillCircle(x, y - 3, 5 + pulse);
      if (focus) g.lineStyle(1.2, 0xffffff, 0.9).strokeCircle(x, y - 3, 7);
      tomb(g, x, y, 5, 7, raised ? MOON : BONE, 1, raised ? undefined : AMBER);
    }
    for (const e of d.eggs) {
      if (!e.found) continue;
      g.fillStyle(0x000000, 0.5).fillCircle(e.x * sx + 0.5, e.y * sy + 0.6, 2);
      g.fillStyle(AMBER, 1).fillCircle(e.x * sx, e.y * sy, 1.7);
    }
    if (d.wizard) player(g, d.wizard.x * sx, d.wizard.y * sy, this.heading, 4.2, pulse);

    // caption
    const focus = focusId ? d.graves.find((x) => x.id === focusId) : null;
    if (focus) {
      const raised = d.raised.has(focus.id);
      this.caption.setText(`${raised ? '✦' : '◆'} ${shortName(focus.name)}`).setColor(raised ? '#bfeef2' : '#f3e2b0');
    } else {
      const total = d.graves.filter((x) => x.resurrectable).length;
      const raisedN = d.graves.filter((x) => x.resurrectable && d.raised.has(x.id)).length;
      this.caption.setText(`Raised ${raisedN}/${total}`).setColor('#c9b98a');
    }
    // keep the caption inside the strip
    const room = WorldMap.MW - 16 - this.captionRight.width - 6;
    if (this.caption.width > room) {
      let txt = this.caption.text;
      while (txt.length > 4 && this.caption.width > room) { txt = txt.slice(0, -2); this.caption.setText(txt + '…'); }
    }
  }

  // ─── full map ────────────────────────────────────────────────────────────

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
    const PW = Math.round(Math.min(width - 80, 880, (height - 150) * (WORLD_W / WORLD_H)));
    const PH = Math.round(PW * (WORLD_H / WORLD_W));
    const ox = Math.round((width - PW) / 2);
    const oy = Math.round(Math.max(64, (height - PH) / 2));
    const sx = PW / WORLD_W, sy = PH / WORLD_H;
    const c = s.add.container(0, 0).setDepth(250).setScrollFactor(0).setAlpha(0);
    const dim = s.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => this.closeFull());
    const key = this.makeGroundTexture(`rd_fullmap_ground_${++this.fullSeq % 2}`, PW, PH, d, 10);
    const back = s.add.graphics().setPosition(ox, oy);
    backing(back, PW, PH, 10);
    const fr = s.add.graphics().setPosition(ox, oy);
    frame(fr, PW, PH, 10);
    const ground = s.add.image(ox, oy, key).setOrigin(0).setDisplaySize(PW, PH).setInteractive();
    ground.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => ev.stopPropagation());
    const g = s.add.graphics();
    c.add([dim, back, ground, fr, g]);

    const label = (x: number, y: number, txt: string, size: number, color: string, font = FONT) =>
      s.add.text(x, y, txt, { fontFamily: font, fontSize: `${size}px`, color, stroke: '#05080f', strokeThickness: 3 });

    // regions first (so grave labels sit above them)
    const foundIds = new Set(d.eggs.filter((e) => e.found).map((e) => e.id));
    for (const r of MAP_REGIONS) {
      const px = ox + r.x * sx, py = oy + r.y * sy;
      c.add(label(px, py - 26, r.name.toUpperCase(), 11, '#9fb0c4', "'Cinzel', serif").setOrigin(0.5).setAlpha(0.85));
      if (r.egg && !foundIds.has(r.egg)) {
        const q = label(px, py - 9, '?', 18, '#e8b04a', "'Cinzel', serif").setOrigin(0.5);
        c.add(q);
        s.tweens.add({ targets: q, alpha: { from: 1, to: 0.35 }, duration: 900, yoyo: true, repeat: -1 });
      }
    }

    // graves: the north arc is labelled above, the south arc below, alternating two tiers
    let raisedCount = 0, total = 0;
    const res = d.graves.filter((gr) => gr.resurrectable);
    const north = res.filter((gr) => gr.y < 900).sort((a, b) => a.x - b.x);
    const south = res.filter((gr) => gr.y >= 900).sort((a, b) => a.x - b.x);
    const tierOf = new Map<string, { up: boolean; tier: number }>();
    north.forEach((gr, i) => tierOf.set(gr.id, { up: true, tier: i % 2 }));
    south.forEach((gr, i) => tierOf.set(gr.id, { up: false, tier: i % 2 }));
    const northBase = oy + Math.min(...north.map((gr) => gr.y), 900) * sy;
    const southBase = oy + Math.max(...south.map((gr) => gr.y), 900) * sy;
    for (const gr of res) {
      const px = ox + gr.x * sx, py = oy + gr.y * sy;
      total++;
      const raised = d.raised.has(gr.id);
      if (raised) raisedCount++;
      g.fillStyle(raised ? MOON : AMBER, raised ? 0.25 : 0.16).fillCircle(px, py - 5, 10);
      tomb(g, px, py + 1, 9, 12, raised ? MOON : BONE, 1, raised ? undefined : AMBER);
      const color = raised ? '#bfeef2' : '#f3e2b0';
      const pos = tierOf.get(gr.id) ?? { up: false, tier: 0 };
      const off = 6 + pos.tier * 15;
      const ly = pos.up ? northBase - 14 - off : southBase + 5 + off;
      const from = pos.up ? py - 13 : py + 3;
      const to = pos.up ? ly - 1 : ly + 1;
      if (Math.abs(to - from) > 4) {
        g.lineStyle(1, raised ? MOON : BONE_DIM, 0.5);
        g.lineBetween(px, from, px, to);
      }
      const t = label(px, ly, shortName(gr.name), 11, color).setOrigin(0.5, pos.up ? 1 : 0);
      c.add(t);
      if (this.onTravel) {
        // click a grave (or its name) on the map to walk the wizard straight to it
        const top = pos.up ? ly - 15 : py - 14;
        const bottom = pos.up ? py + 4 : ly + 15;
        const hit = s.add.zone(px, (top + bottom) / 2, Math.max(34, t.width + 8), bottom - top).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => t.setColor('#ffffff'));
        hit.on('pointerout', () => t.setColor(color));
        hit.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
          ev.stopPropagation();
          this.onTravel?.(gr.x, gr.y + 44);
          this.closeFull();
        });
        c.add(hit);
      }
    }

    for (const e of d.eggs) {
      if (!e.found) continue;
      const px = ox + e.x * sx, py = oy + e.y * sy;
      g.fillStyle(AMBER, 1).fillCircle(px, py, 4);
      g.lineStyle(1, 0x000000, 0.7).strokeCircle(px, py, 4.5);
      c.add(label(px + 7, py, e.title, 10, '#f3d58c').setOrigin(0, 0.5));
    }
    if (d.wizard) {
      const px = ox + d.wizard.x * sx, py = oy + d.wizard.y * sy;
      const you = s.add.graphics();
      player(you, px, py, this.heading, 7, 0.6);
      const lbl = label(px, py + 13, 'you', 10, '#fff2c4').setOrigin(0.5);
      c.add([you, lbl]);
      s.tweens.add({ targets: lbl, alpha: { from: 1, to: 0.55 }, duration: 700, yoyo: true, repeat: -1 });
    }

    const found = foundIds.size;
    const eggTotal = d.eggs.length;
    const title = s.add.text(width / 2, oy - 34, 'Map of the Graveyard', { fontFamily: "'Cinzel', serif", fontSize: '22px', color: '#e8dcc0', stroke: '#05080f', strokeThickness: 4 }).setOrigin(0.5);
    const cap = s.add.text(width / 2, oy + PH + 14, `Graves raised ${raisedCount}/${total} (teal)  ·  Secrets ${found}/${eggTotal}  ·  ? = secret still hidden  ·  click a grave to go there  ·  Esc / J to close`, {
      fontFamily: FONT, fontSize: '13px', color: '#c9b98a',
    }).setOrigin(0.5, 0);
    c.add([title, cap]);
    this.full = c;
    this.mini.setVisible(false);
    s.tweens.add({ targets: c, alpha: 1, duration: 180 });
  }
}

export { MAP_LAYOUT };
