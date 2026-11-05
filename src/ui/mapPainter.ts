/**
 * mapPainter — paints the static ground of the graveyard map (grass, paths, trees, the old
 * stones, moonlight and vignette) into a canvas. Used by the minimap and the full map so both
 * read as the same place. Dynamic markers (graves, player, secrets) are drawn on top in Phaser.
 */
import { PATH_RECTS, PathRect } from '../scenes/mapLayout';

export const WORLD_W = 2400;
export const WORLD_H = 1800;

export interface PaintInput {
  grass?: CanvasImageSource | null;
  trees: Array<{ x: number; y: number }>;
  stones: Array<{ x: number; y: number }>;
  /** Landmarks read from the live world: lit pumpkins, the crypt, the well. */
  marks?: Array<{ kind: 'lantern' | 'crypt' | 'well'; x: number; y: number }>;
}

type Ctx = CanvasRenderingContext2D;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const anyCtx = ctx as Ctx & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void };
  ctx.beginPath();
  if (anyCtx.roundRect) anyCtx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** Paint at w×h logical px; the canvas is expected to be w*dpr × h*dpr. */
export function paintMapGround(canvas: HTMLCanvasElement, w: number, h: number, dpr: number, input: PaintInput, corner = 6): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sx = w / WORLD_W;
  const sy = h / WORLD_H;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  rr(ctx, 0, 0, w, h, corner);
  ctx.clip();

  // ── Ground: deep moonlit grass ───────────────────────────────────────────
  ctx.fillStyle = '#12302f';
  ctx.fillRect(0, 0, w, h);
  if (input.grass) {
    try {
      const pat = ctx.createPattern(input.grass, 'repeat');
      if (pat) {
        // world tile is 256 px; keep a little texture so the ground reads as grass, not felt
        const k = Math.max(sx * 1.6, 0.12);
        pat.setTransform?.(new DOMMatrix([k, 0, 0, k, 0, 0]));
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    } catch { /* pattern unsupported: flat grass is fine */ }
  }
  // soft tonal patches so the field is not uniform
  const seed = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 26; i++) {
    const px = seed(i + 1) * w, py = seed(i + 50) * h, r = (0.06 + seed(i + 99) * 0.1) * w;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    const light = i % 3 === 0;
    g.addColorStop(0, light ? 'rgba(76,130,112,0.16)' : 'rgba(6,20,22,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }

  // ── Paths: one connected gravel network (edge pass, then fill, then highlight) ──
  const rects: PathRect[] = PATH_RECTS;
  const pr = (r: PathRect, grow: number) => {
    const x = r.x * sx - grow, y = r.y * sy - grow;
    const ww = Math.max(1.2, r.width * sx) + grow * 2, hh = Math.max(1.2, r.height * sy) + grow * 2;
    rr(ctx, x, y, ww, hh, Math.min(2.2, Math.min(ww, hh) / 2));
  };
  const edge = Math.max(0.8, w / 260);
  ctx.fillStyle = 'rgba(6,8,12,0.6)';
  for (const r of rects) { pr(r, edge + 0.6); ctx.fill(); }
  ctx.fillStyle = '#3d363b';
  for (const r of rects) { pr(r, 0); ctx.fill(); }
  // main roads (48 px and wider in the world) get a pale crown; footpaths stay plain
  ctx.fillStyle = 'rgba(214,200,178,0.09)';
  for (const r of rects) { if (Math.min(r.width, r.height) >= 48) { pr(r, -Math.max(0.6, edge * 0.7)); ctx.fill(); } }
  // gravel speckle
  ctx.fillStyle = 'rgba(200,190,175,0.13)';
  for (const r of rects) {
    const n = Math.round((r.width * r.height) / 9000);
    for (let i = 0; i < n; i++) {
      const px = (r.x + seed(r.x + i * 7.3) * r.width) * sx;
      const py = (r.y + seed(r.y + i * 3.1) * r.height) * sy;
      ctx.fillRect(px, py, Math.max(0.5, w / 600), Math.max(0.5, w / 600));
    }
  }

  // central plaza: a pale ring where the wizard wakes
  const cx = 1200 * sx, cy = 900 * sy;
  ctx.strokeStyle = 'rgba(232,220,192,0.28)';
  ctx.lineWidth = Math.max(0.8, w / 300);
  ctx.beginPath(); ctx.ellipse(cx, cy, 70 * sx, 52 * sy, 0, 0, Math.PI * 2); ctx.stroke();

  // ── Old stones (decorative graves) ───────────────────────────────────────
  const sw = Math.max(1.6, 18 * sx), sh = Math.max(2.2, 24 * sy);
  for (const s of input.stones) {
    const x = s.x * sx, y = s.y * sy;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x - sw / 2 + 0.4, y - sh + 0.8, sw, sh);
    ctx.fillStyle = '#8c95a0';
    rr(ctx, x - sw / 2, y - sh, sw, sh, sw / 2.2);
    ctx.fill();
  }

  // ── Trees: twisted dark crowns (three lobes) with a faint moonlit rim ──────
  const tr = Math.max(1.6, 26 * sx);
  for (const t of input.trees) {
    const x = t.x * sx, y = (t.y - 30) * sy;
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.ellipse(x + tr * 0.4, y + tr * 0.55, tr * 1.25, tr * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    const lobes = [[-0.55, 0.1, 0.8], [0.5, 0.15, 0.8], [0, -0.35, 0.9]];
    ctx.fillStyle = '#0d1a22';
    for (const [lx, ly, lr] of lobes) { ctx.beginPath(); ctx.arc(x + lx * tr, y + ly * tr, lr * tr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(127,190,205,0.16)';
    ctx.beginPath(); ctx.arc(x - tr * 0.2, y - tr * 0.6, tr * 0.42, 0, Math.PI * 2); ctx.fill();
  }

  // ── Landmarks ─────────────────────────────────────────────────────────────
  // moonlit clearing on Moon Hill (south)
  const mx = 1088 * sx, my = 1640 * sy, mr = 120 * sx;
  const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
  mg.addColorStop(0, 'rgba(200,235,240,0.20)');
  mg.addColorStop(1, 'rgba(200,235,240,0)');
  ctx.fillStyle = mg; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
  const u = Math.max(1, 14 * sx);
  for (const m of input.marks ?? []) {
    const x = m.x * sx, y = m.y * sy;
    if (m.kind === 'lantern') {
      const r = Math.max(3, 60 * sx);
      const lg = ctx.createRadialGradient(x, y - u * 0.5, 0, x, y - u * 0.5, r);
      lg.addColorStop(0, 'rgba(255,170,70,0.55)');
      lg.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = lg; ctx.fillRect(x - r, y - r - u, r * 2, r * 2);
      ctx.fillStyle = '#f0a040';
      ctx.beginPath(); ctx.arc(x, y - u * 0.5, Math.max(0.9, u * 0.55), 0, Math.PI * 2); ctx.fill();
    } else if (m.kind === 'crypt') {
      const cw = u * 3.2, ch = u * 2.2;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - cw / 2 + 0.6, y - ch + 0.8, cw, ch);
      ctx.fillStyle = '#6c7380'; ctx.fillRect(x - cw / 2, y - ch, cw, ch);
      ctx.beginPath(); ctx.moveTo(x - cw / 2 - u * 0.3, y - ch); ctx.lineTo(x, y - ch - u * 1.3); ctx.lineTo(x + cw / 2 + u * 0.3, y - ch); ctx.closePath();
      ctx.fillStyle = '#8a92a0'; ctx.fill();
      ctx.fillStyle = '#141820'; ctx.fillRect(x - u * 0.45, y - ch * 0.62, u * 0.9, ch * 0.62);
    } else if (m.kind === 'well') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.arc(x + 0.6, y - u + 0.8, u * 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7d8592';
      ctx.beginPath(); ctx.arc(x, y - u, u * 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a1420';
      ctx.beginPath(); ctx.arc(x, y - u, u * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Moonlight wash from the north-east + vignette ────────────────────────
  const moon = ctx.createRadialGradient(w * 0.72, h * 0.18, 0, w * 0.72, h * 0.18, w * 0.75);
  moon.addColorStop(0, 'rgba(160,220,230,0.12)');
  moon.addColorStop(1, 'rgba(160,220,230,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.hypot(w, h) * 0.52);
  vig.addColorStop(0, 'rgba(4,7,14,0)');
  vig.addColorStop(0.6, 'rgba(4,7,14,0.35)');
  vig.addColorStop(1, 'rgba(4,7,14,0.85)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
