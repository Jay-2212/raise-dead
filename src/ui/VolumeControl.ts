/**
 * VolumeControl — the speaker icon (top-right) plus a small bone-and-moonlight panel with two
 * sliders, Music and Effects, that slides out to the left of it.
 *  - Desktop: hover the icon to open; the panel stays while the pointer is on it. Click = mute.
 *  - Touch: first tap opens the panel, a tap on the icon while open mutes, a tap elsewhere closes.
 *  - Levels live in the Mixer (default 70%, saved in localStorage).
 */
import Phaser from 'phaser';
import { Bus, getLevel, setLevel } from '../audio/Mixer';

const BONE = 0xe8dcc0;
const BONE_DIM = 0xc9b98a;
const MOON = 0x7fd1d8;
const NIGHT = 0x0b1020;
const TRACK = 0x1c2a4a;

const PANEL_W = 204;
const PANEL_H = 44;
const TRACK_X = 66;
const TRACK_W = 100;

interface Row { bus: Bus; y: number; fill: Phaser.GameObjects.Rectangle; knob: Phaser.GameObjects.Arc; glow: Phaser.GameObjects.Arc; value: Phaser.GameObjects.Text }

export class VolumeControl {
  private scene: Phaser.Scene;
  private icon: Phaser.GameObjects.Graphics;
  private hit: Phaser.GameObjects.Zone;
  private panel: Phaser.GameObjects.Container;
  private panelBg: Phaser.GameObjects.Rectangle;
  private rows: Row[] = [];
  private open = false;
  private hoverIcon = false;
  private hoverPanel = false;
  private dragging: Row | null = null;
  private closeTimer: Phaser.Time.TimerEvent | null = null;
  private muted: boolean;
  private readonly ix: number;
  private readonly iy: number;
  private readonly panelX: number;

  constructor(scene: Phaser.Scene, rightX: number, topY: number, muted: boolean, private onToggleMute: () => void) {
    this.scene = scene;
    this.muted = muted;
    this.ix = rightX - 14;
    this.iy = topY + 14;

    this.icon = scene.add.graphics().setScrollFactor(0).setDepth(112);
    this.hit = scene.add.zone(this.ix, this.iy, 34, 34).setScrollFactor(0).setDepth(113).setInteractive({ useHandCursor: true });

    this.panelX = this.ix - 22 - PANEL_W;
    this.panel = scene.add.container(this.panelX, topY - 2).setScrollFactor(0).setDepth(111).setAlpha(0).setVisible(false);
    this.panelBg = scene.add.rectangle(0, 0, PANEL_W, PANEL_H, NIGHT, 0.86).setOrigin(0).setStrokeStyle(1, BONE_DIM, 0.75);
    const inner = scene.add.rectangle(3, 3, PANEL_W - 6, PANEL_H - 6).setOrigin(0).setStrokeStyle(1, MOON, 0.16);
    this.panelBg.setInteractive();
    this.panel.add([this.panelBg, inner]);
    this.addRow('music', 'MUSIC', 14);
    this.addRow('fx', 'EFFECTS', 31);

    this.drawIcon();
    this.wire();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.drawIcon();
  }

  setVisible(v: boolean): void {
    this.icon.setVisible(v);
    this.hit.setVisible(v);
    if (!v) this.close(true);
  }

  // ─── build ────────────────────────────────────────────────────────────────

  private addRow(bus: Bus, label: string, y: number): void {
    const s = this.scene;
    const txt = s.add.text(12, y, label, {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '10px', color: '#c9b98a',
    }).setOrigin(0, 0.5);
    txt.setLetterSpacing?.(1);
    const track = s.add.rectangle(TRACK_X, y, TRACK_W, 3, TRACK, 1).setOrigin(0, 0.5).setStrokeStyle(1, 0x3b4658, 1);
    const fill = s.add.rectangle(TRACK_X, y, 0, 3, BONE, 0.95).setOrigin(0, 0.5);
    const glow = s.add.circle(TRACK_X, y, 8, MOON, 0.18);
    const knob = s.add.circle(TRACK_X, y, 4.5, 0xf3ecc8, 1).setStrokeStyle(1.5, MOON, 0.9);
    const value = s.add.text(PANEL_W - 10, y, '', {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '10px', color: '#8796ad',
    }).setOrigin(1, 0.5);
    const zone = s.add.zone(TRACK_X - 8, y - 9, TRACK_W + 16, 18).setOrigin(0).setInteractive({ useHandCursor: true });
    this.panel.add([txt, track, fill, glow, knob, value, zone]);
    const row: Row = { bus, y, fill, knob, glow, value };
    this.rows.push(row);
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => { this.dragging = row; this.setFromPointer(row, p); });
    zone.on('pointerover', () => { this.hoverPanel = true; this.cancelClose(); glow.setAlpha(0.32); });
    zone.on('pointerout', () => { glow.setAlpha(0.18); });
    this.paintRow(row);
  }

  private paintRow(row: Row): void {
    const v = getLevel(row.bus);
    const x = TRACK_X + v * TRACK_W;
    row.fill.width = v * TRACK_W;
    row.knob.x = x;
    row.glow.x = x;
    row.value.setText(`${Math.round(v * 100)}`);
  }

  private setFromPointer(row: Row, p: Phaser.Input.Pointer): void {
    const local = p.x - this.panel.x - TRACK_X;
    const v = Math.round(Phaser.Math.Clamp(local / TRACK_W, 0, 1) * 20) / 20; // 5% steps
    if (v !== getLevel(row.bus)) setLevel(row.bus, v);
    this.paintRow(row);
  }

  /** Bone speaker with moonlit sound waves; muted shows a thin X. */
  private drawIcon(): void {
    const g = this.icon;
    const x = this.ix - 6, y = this.iy;
    g.clear();
    g.fillStyle(NIGHT, 0.55).fillCircle(this.ix, this.iy, 15);
    g.lineStyle(1, BONE_DIM, this.open || this.hoverIcon ? 0.9 : 0.45).strokeCircle(this.ix, this.iy, 15);
    g.fillStyle(BONE, 1);
    g.fillRect(x - 5, y - 3, 4, 6);
    g.fillTriangle(x - 1, y - 3, x + 4, y - 7.5, x + 4, y + 7.5);
    g.fillTriangle(x - 1, y - 3, x - 1, y + 3, x + 4, y + 7.5);
    if (this.muted) {
      g.lineStyle(1.8, 0xd98a8a, 1);
      g.lineBetween(x + 7, y - 4, x + 14, y + 4);
      g.lineBetween(x + 14, y - 4, x + 7, y + 4);
    } else {
      g.lineStyle(1.6, MOON, 0.95);
      g.beginPath(); g.arc(x + 4, y, 5, -0.8, 0.8); g.strokePath();
      g.lineStyle(1.4, MOON, 0.6);
      g.beginPath(); g.arc(x + 4, y, 9, -0.8, 0.8); g.strokePath();
    }
  }

  // ─── behaviour ───────────────────────────────────────────────────────────

  private wire(): void {
    const s = this.scene;
    this.hit.on('pointerover', () => { this.hoverIcon = true; this.cancelClose(); this.drawIcon(); if (!this.isTouch()) this.show(); });
    this.hit.on('pointerout', () => { this.hoverIcon = false; this.drawIcon(); this.scheduleClose(); });
    this.hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch && !this.open) { this.show(); return; }
      this.onToggleMute();
    });
    this.panelBg.on('pointerover', () => { this.hoverPanel = true; this.cancelClose(); });
    this.panelBg.on('pointerout', () => { this.hoverPanel = false; this.scheduleClose(); });
    s.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging && p.isDown) this.setFromPointer(this.dragging, p);
      if (this.open && !this.dragging) {
        const inside = this.containsPanel(p.x, p.y);
        if (inside !== this.hoverPanel) { this.hoverPanel = inside; if (!inside) this.scheduleClose(); else this.cancelClose(); }
      }
    });
    s.input.on('pointerup', () => { if (this.dragging) { this.dragging = null; this.scheduleClose(); } });
    s.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.open && !this.containsPanel(p.x, p.y) && !this.containsIcon(p.x, p.y)) this.close();
    });
  }

  private isTouch(): boolean {
    return !!this.scene.input.activePointer?.wasTouch;
  }

  private containsPanel(x: number, y: number): boolean {
    return x >= this.panel.x - 4 && x <= this.ix + 16 && y >= this.panel.y - 4 && y <= this.panel.y + PANEL_H + 4;
  }

  private containsIcon(x: number, y: number): boolean {
    return Math.abs(x - this.ix) <= 17 && Math.abs(y - this.iy) <= 17;
  }

  private show(): void {
    this.cancelClose();
    if (this.open) return;
    this.open = true;
    this.rows.forEach((r) => this.paintRow(r));
    this.scene.tweens.killTweensOf(this.panel);
    this.panel.setVisible(true).setX(this.panelX + 18);
    this.scene.tweens.add({ targets: this.panel, x: this.panelX, alpha: 1, duration: 170, ease: 'Cubic.easeOut' });
    this.drawIcon();
  }

  private scheduleClose(): void {
    if (!this.open || this.dragging || this.isTouch()) return;
    this.cancelClose();
    this.closeTimer = this.scene.time.delayedCall(450, () => {
      if (!this.hoverIcon && !this.hoverPanel && !this.dragging) this.close();
    });
  }

  private cancelClose(): void {
    this.closeTimer?.remove(false);
    this.closeTimer = null;
  }

  private close(immediate = false): void {
    if (!this.open) return;
    this.open = false;
    this.cancelClose();
    this.dragging = null;
    this.scene.tweens.killTweensOf(this.panel);
    if (immediate) { this.panel.setVisible(false).setAlpha(0); }
    else {
      this.scene.tweens.add({
        targets: this.panel, x: this.panelX + 18, alpha: 0, duration: 150, ease: 'Cubic.easeIn',
        onComplete: () => this.panel.setVisible(false),
      });
    }
    this.drawIcon();
  }
}
