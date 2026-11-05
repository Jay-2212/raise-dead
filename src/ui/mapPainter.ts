/**
 * mapPainter — paints the ground of the graveyard map into a canvas. Used by the minimap and the
 * full map so both read as the same place. Dynamic markers (graves, player, secrets) are drawn on
 * top in Phaser.
 *
 * K12: the map is now the real world art. `scripts/bake-world-map.mjs` renders the live graveyard
 * (grass, cobble paths, decals, mounds, trees, old stones, pumpkins, crypt, well) at half scale into
 * `public/assets/images/map/world_map.png` (1200x900, quantised, ~235 KB). When that texture is
 * loaded it is downscaled here with a light moonlit grade and a dark vignette. The hand-painted
 * version below stays as the fallback if the image is missing.
 */
import { PATH_RECTS, PathRect } from '../scenes/mapLayout';

export const WORLD_W = 2400;
export const WORLD_H = 1800;

export interface PaintInput {
  /** K12: baked miniature of the real world art (half scale of WORLD_W x WORLD_H). */
  base?: CanvasImageSource | null;
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

  if (input.base && paintBaked(ctx, w, h, dpr, input.base)) { ctx.restore(); return; }

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

/** Size of an image source, or 0 when it is not ready. */
function srcSize(img: CanvasImageSource): { w: number; h: number } {
  const anyImg = img as { naturalWidth?: number; naturalHeight?: number; width?: number | SVGAnimatedLength; height?: number | SVGAnimatedLength };
  const w = anyImg.naturalWidth || (typeof anyImg.width === 'number' ? anyImg.width : 0);
  const h = anyImg.naturalHeight || (typeof anyImg.height === 'number' ? anyImg.height : 0);
  return { w, h };
}

/**
 * K12: draw the baked world art, downscaled in halving steps so grass and cobbles stay crisp
 * instead of aliasing, then grade it for night and vignette the edges. Returns false if the image
 * is not usable (the caller falls back to the painted map).
 */
function paintBaked(ctx: Ctx, w: number, h: number, dpr: number, base: CanvasImageSource): boolean {
  const { w: bw, h: bh } = srcSize(base);
  if (!bw || !bh) return false;
  const tw = Math.round(w * dpr), th = Math.round(h * dpr);
  let src: CanvasImageSource = base;
  let cw = bw, ch = bh;
  try {
    while (cw / 2 >= tw) {
      const step = document.createElement('canvas');
      step.width = Math.round(cw / 2); step.height = Math.round(ch / 2);
      const sc = step.getContext('2d');
      if (!sc) break;
      sc.imageSmoothingEnabled = true;
      sc.imageSmoothingQuality = 'high';
      sc.drawImage(src, 0, 0, cw, ch, 0, 0, step.width, step.height);
      src = step; cw = step.width; ch = step.height;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // the minimap is tiny: a little extra contrast keeps paths, trees and grass apart
    // (ctx.filter is ignored where unsupported, which is fine)
    if (w < 320) ctx.filter = 'contrast(1.18) saturate(1.15) brightness(1.1)';
    ctx.drawImage(src, 0, 0, cw, ch, 0, 0, w, h);
    ctx.filter = 'none';
  } catch {
    return false;
  }

  // soft tonal patches break up the repeat of the grass tile at map scale
  const seed = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 22; i++) {
    const px = seed(i + 1) * w, py = seed(i + 50) * h, r = (0.07 + seed(i + 99) * 0.1) * w;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, i % 4 === 0 ? 'rgba(90,150,120,0.07)' : 'rgba(4,14,18,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  // light moonlit grade: a cool, slightly darker wash keeps it in the night palette
  ctx.fillStyle = 'rgba(8,18,34,0.14)';
  ctx.fillRect(0, 0, w, h);
  const moon = ctx.createRadialGradient(w * 0.72, h * 0.16, 0, w * 0.72, h * 0.16, w * 0.8);
  moon.addColorStop(0, 'rgba(170,225,235,0.07)');
  moon.addColorStop(1, 'rgba(170,225,235,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, w, h);
  // slight dark vignette: the middle (where the graves are) stays clear
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.34, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  vig.addColorStop(0, 'rgba(4,7,14,0)');
  const small = w < 320;
  vig.addColorStop(0.65, small ? 'rgba(4,7,14,0.2)' : 'rgba(4,7,14,0.28)');
  vig.addColorStop(1, small ? 'rgba(4,7,14,0.6)' : 'rgba(4,7,14,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  return true;
}
