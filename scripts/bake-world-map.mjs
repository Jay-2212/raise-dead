// Bake the real graveyard art into public/assets/images/map/world_map.png (K12).
// Needs a built dist served by `npx vite preview --port 4173` and playwright-core + /usr/bin/chromium.
// Writes three half-scale (1200x900) passes: <out>_all.png, <out>_grass.png (grass only),
// <out>_nograss.png (everything else over the grass mean colour) + <out>_mean.json.
// Then: python3 scripts/compose-world-map.py <out-prefix> 3.5 0.30 0
//       pngquant --quality=50-78 --speed 1 --output public/assets/images/map/world_map.png <out-prefix>_composed.png
// Hidden while baking: HUD/UI, fog, particles, wisps, fireflies, the wizard, the crow/witch, eggs, and the
// raisable tombstones (the map draws its own markers for those).
import { chromium } from 'playwright-core';
import fs from 'fs';
const OUT = process.argv[2] || '/tmp/rd_world.png';
const LIGHTS = process.argv[3] || 'on';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
pg.on('pageerror', (e) => console.log('pageerror', e));
await pg.goto('http://127.0.0.1:4173/?debug=1');
for (let i = 0; i < 60; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => !!window.__RD && window.__RD.game.scene.isActive('TitleScene'))) break; }
await pg.waitForTimeout(800); await pg.keyboard.press('Enter');
await pg.waitForTimeout(4000);
await pg.evaluate((LIGHTS) => {
  const z = window.__RD.world(); window.__z = z;
  const game = window.__RD.game;
  game.scene.getScene('UIScene').scene.setVisible(false);
  const hideKeys = new Set(['wisp', 'firefly_dot', 'zombie_hand', 'glow_moon', '__MISSING']);
  const resTomb = new Set(z.tombstones.filter((t) => t.grave.resurrectable).map((t) => t));
  const wiz = z.wizard;
  for (const o of z.children.list) {
    if (o.scrollFactorX === 0 || o.type === 'ParticleEmitter' || o.type === 'Text') o.setVisible(false);
    if (o.texture && hideKeys.has(o.texture.key)) o.setVisible(false);
    if (resTomb.has(o)) o.setVisible(false);
  }
  wiz.setVisible(false);
  for (const k of ['shadow', 'shadowCast']) z[k]?.setVisible(false);
  // drop contact/cast shadows that sit right under the wizard
  for (const o of z.children.list) if (o.texture && /shadow_/.test(o.texture.key) && Math.abs(o.x - wiz.x) < 40 && Math.abs(o.y - wiz.y) < 20) o.setVisible(false);
  if (LIGHTS === 'off') z.lights.disable();
  z.witch?.destroy?.();
  const cam = z.cameras.main;
  cam.stopFollow(); cam.removeBounds(); cam.setZoom(0.5);
  cam.resetFX?.();
  z.scene.pause();
}, LIGHTS);

// grass mean colour (used as the key behind the no-grass pass)
const mean = await pg.evaluate(() => {
  const img = window.__RD.game.textures.get('ground_grass').getSourceImage();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data; let r = 0, gg = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
  return [Math.round(r / n), Math.round(gg / n), Math.round(b / n)];
});
console.log('grass mean', mean);
async function grab(cx, cy) {
  await pg.evaluate(([cx, cy]) => { window.__z.cameras.main.centerOn(cx, cy); }, [cx, cy]);
  await pg.waitForTimeout(600);
  return pg.evaluate(() => new Promise((res) => window.__RD.game.renderer.snapshot((img) => res(img.src))));
}
async function pass(name) {
  const a = await grab(1200, 720);
  const c = await grab(1200, 1080);
  const url = await pg.evaluate(async ([a, c]) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const ia = await load(a), ic = await load(c);
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900;
    const g = cv.getContext('2d');
    g.drawImage(ia, 40, 0, 1200, 450, 0, 0, 1200, 450);
    g.drawImage(ic, 40, 270, 1200, 450, 0, 450, 1200, 450);
    return cv.toDataURL('image/png');
  }, [a, c]);
  fs.writeFileSync(OUT.replace('.png', `_${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
await pass('all');
// grass only
await pg.evaluate(() => { const z = window.__z; window.__vis = z.children.list.filter((o) => o.visible); for (const o of window.__vis) o.setVisible(o.type === 'TileSprite' && o.depth === -10); });
await pass('grass');
// everything but the grass, over the grass mean colour
await pg.evaluate((m) => { const z = window.__z; for (const o of window.__vis) o.setVisible(!(o.type === 'TileSprite' && o.depth === -10)); z.cameras.main.setBackgroundColor(`rgb(${m[0]},${m[1]},${m[2]})`); }, mean);
await pass('nograss');
fs.writeFileSync(OUT.replace('.png', '_mean.json'), JSON.stringify(mean));
console.log('done');
await b.close();
