// Phase 1.5 verification. Usage: NODE_PATH=... node scripts/screenshots-p15.mjs [url] [outDir] [part]
// part: all | world | eggs | mobile. Needs `npx vite preview --port 4173` (or a live URL). Uses ?debug=1.
import { chromium } from 'playwright-core';
import fs from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = process.argv[3] || '/workspace/raise-dead/research/screens/p15';
const PART = process.argv[4] || 'all';
fs.mkdirSync(OUT, { recursive: true });
const logs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
const url = q => BASE + (BASE.includes('?') ? '&' : '?') + q;
async function boot(pg) {
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  pg.on('pageerror', e => logs.push(`[pageerror] ${e}`));
  pg.on('requestfailed', r => logs.push(`[reqfailed] ${r.url()}`));
}
const W = "window.__RD.game.scene.getScene('GraveyardWorld')";
async function enterWorld(pg) {
  await pg.goto(url('debug=1'), { waitUntil: 'commit', timeout: 60000 });
  for (let i = 0; i < 120; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => !!window.__RD && window.__RD.game.scene.isActive('TitleScene'))) break; }
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => localStorage.removeItem('rd_eggs_found'));
  await pg.evaluate("window.__RD.goto('GraveyardWorld')");
  for (let i = 0; i < 60; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(`!!(${W} && ${W}.wizard && window.__RD.game.scene.isActive('GraveyardWorld'))`)) break; }
  await pg.waitForTimeout(2500);
}
const pos = pg => pg.evaluate(`JSON.stringify({x: Math.round(${W}.wizard.x), y: Math.round(${W}.wizard.y)})`).then(JSON.parse);
async function walk(pg, key, ms) { await pg.keyboard.down(key); await pg.waitForTimeout(ms); await pg.keyboard.up(key); await pg.waitForTimeout(150); }

const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
await boot(pg);
const shot = n => pg.screenshot({ path: `${OUT}/${n}.png` });
try {
  await enterWorld(pg);
  logs.push('hooks: ' + await pg.evaluate('Object.keys(window.__RD).join(",")'));
  if (PART === 'all' || PART === 'world') {
    await shot('01_spawn_grounding');
    // Walk test: hold D for 12 s from spawn; must go far beyond old ~640px limit
    const p0 = await pos(pg); await walk(pg, 'd', 9000); const p1 = await pos(pg);
    logs.push(`[test] walk right 9s: ${p0.x},${p0.y} -> ${p1.x},${p1.y} (${p1.x - p0.x > 500 ? 'PASS' : 'CHECK'})`);
    await shot('02_walked_right');
    // Corners via teleport + walk outward
    for (const [n, x, y, k] of [['nw', 120, 120, 'a'], ['ne', 2280, 140, 'd'], ['sw', 120, 1680, 's'], ['se', 2280, 1680, 's']]) {
      await pg.evaluate(`window.__RD.teleport(${x}, ${y})`); await pg.waitForTimeout(400); await walk(pg, k, 1500);
      const p = await pos(pg); logs.push(`[test] corner ${n}: ${p.x},${p.y}`); await shot(`03_corner_${n}`);
    }
    // Far graves reachable: teleport next to each far grave then check proximity distance (walk-in test from 120px away)
    const far = ['orkut', 'geocities', 'google-glass', 'pebble', 'google-wave', 'napster'];
    for (const id of far) {
      const L = await pg.evaluate(`(() => { const t = ${W}.tombstones.find(t => t.grave.id === '${id}'); return t ? JSON.stringify({x: t.x, y: t.y}) : null; })()`);
      if (!L) { logs.push(`[test] grave ${id}: not found`); continue; }
      const { x, y } = JSON.parse(L);
      await pg.evaluate(`window.__RD.teleport(${x}, ${y + 110})`); await pg.waitForTimeout(300);
      await walk(pg, 'w', 900); const p = await pos(pg);
      logs.push(`[test] approach ${id} (${x},${y}): wizard ${p.x},${p.y} dist ${Math.round(Math.hypot(p.x - x, p.y - y))}`);
    }
    await shot('04_far_grave');
    // Tree collision: find a tree with a trunk body, teleport 40px below, walk up 1.2s, must stop south of trunk
    const tr = await pg.evaluate(`(() => { const s = ${W}; const g = s.treeGroup || s.treeBodies || s.trees; let list = [];
      if (g && g.getChildren) list = g.getChildren(); else if (Array.isArray(g)) list = g;
      const it = list.find(o => (o.x||o.body?.x) > 300 && (o.y||o.body?.y) > 300) || list[0];
      if (!it) return null; const bx = it.body ? it.body.center.x : it.x; const by = it.body ? it.body.center.y : it.y; return JSON.stringify({x: bx, y: by, n: list.length}); })()`);
    if (tr) {
      const t = JSON.parse(tr); logs.push(`[info] tree bodies: ${t.n}, testing trunk at ${Math.round(t.x)},${Math.round(t.y)}`);
      await pg.evaluate(`window.__RD.teleport(${t.x}, ${t.y + 45})`); await pg.waitForTimeout(400);
      await walk(pg, 'w', 1500); const p = await pos(pg);
      logs.push(`[test] tree collision: wizard y ${p.y} vs trunk y ${Math.round(t.y)} (${p.y > t.y ? 'PASS blocked' : 'FAIL passed through'})`);
      await shot('05_tree_collision');
      await pg.evaluate(`window.__RD.teleport(${t.x}, ${t.y - 30})`); await pg.waitForTimeout(500); await shot('05b_behind_canopy');
    } else logs.push('[test] tree collision: no tree body list found on scene (check field name)');
    // Witch
    await pg.evaluate('window.__RD.teleport(1200, 1000)'); await pg.waitForTimeout(300);
    await pg.evaluate('window.__RD.spawnWitch && window.__RD.spawnWitch()'); await pg.waitForTimeout(2600); await shot('06_witch');
    // Walking bob frame
    await pg.keyboard.down('s'); await pg.waitForTimeout(350); await shot('07_wizard_walk'); await pg.keyboard.up('s');
    // RIP click test
    await pg.evaluate("window.__RD.teleportToGrave('winamp')"); await pg.waitForTimeout(800);
    await pg.evaluate("window.__RD.raise('winamp')");
    const t0 = Date.now();
    while (Date.now() - t0 < 80000) { await pg.waitForTimeout(250); if (await pg.evaluate(() => /has risen/i.test(document.body.innerText))) break; }
    await pg.waitForTimeout(1500); await shot('08_overlay');
    const btn = pg.getByRole('button', { name: /Requiescat in pace/i });
    await btn.click({ timeout: 5000 });
    await pg.waitForTimeout(4500);
    const left = await pg.evaluate("document.querySelectorAll('#grave-overlay').length");
    const ritual = await pg.evaluate("window.__RD.game.scene.isActive('ResurrectionRitual')");
    logs.push(`[test] RIP click: overlay nodes ${left}, ritual active ${ritual} (${left === 0 ? 'PASS' : 'FAIL'})`);
    await shot('09_after_rip_click');
  }
  if (PART === 'all' || PART === 'eggs') {
    const eggs = await pg.evaluate('window.__RD.eggs ? JSON.stringify(window.__RD.eggs()) : "no hook"');
    logs.push('eggs before: ' + eggs);
    // Real trigger: walk to the crypt and press F
    const def = await pg.evaluate(`(() => { const m = ${W}.eggManager || ${W}.easterEggs; if (!m) return null; const d = (m.defs || m.definitions || m.eggs || []); return JSON.stringify(Array.from(d.values ? d.values() : d).map(e => ({id: e.id, x: e.x ?? e.position?.x, y: e.y ?? e.position?.y}))); })()`);
    logs.push('egg defs: ' + def);
    let crypt = def && JSON.parse(def).find(e => /crypt/.test(e.id));
    if (crypt) {
      await pg.evaluate(`window.__RD.teleport(${crypt.x}, ${crypt.y + 30})`); await pg.waitForTimeout(800); await shot('10_crypt_hint');
      await pg.keyboard.press('f'); await pg.waitForTimeout(2500); await shot('11_crypt_open');
    }
    const pump = def && JSON.parse(def).find(e => /pumpkin/.test(e.id));
    if (pump) { await pg.evaluate(`window.__RD.teleport(${pump.x}, ${pump.y + 26})`); await pg.waitForTimeout(600); await pg.keyboard.press('f'); await pg.waitForTimeout(1800); await shot('12_jack'); }
    const well = def && JSON.parse(def).find(e => /well/.test(e.id));
    if (well) { await pg.evaluate(`window.__RD.teleport(${well.x}, ${well.y + 30})`); await pg.waitForTimeout(600);
      for (let i = 0; i < 3; i++) { await pg.keyboard.press('f'); await pg.waitForTimeout(500); } await pg.waitForTimeout(1600); await shot('13_well_ghost'); }
    const moon = def && JSON.parse(def).find(e => /moon|howl/.test(e.id));
    if (moon) { await pg.evaluate(`window.__RD.teleport(${moon.x}, ${moon.y})`); await pg.waitForTimeout(3600); await shot('14_moon_howl'); }
    const cat = def && JSON.parse(def).find(e => /cat/.test(e.id));
    if (cat) { await pg.evaluate(`window.__RD.teleport(${cat.x - 80}, ${cat.y})`); await pg.waitForTimeout(300); await walk(pg, 'd', 1100); await pg.waitForTimeout(300); await shot('15_black_cat'); }
    const g13 = def && JSON.parse(def).find(e => /13/.test(e.id));
    if (g13) { await pg.evaluate(`window.__RD.teleport(${g13.x}, ${g13.y + 30})`); await pg.waitForTimeout(600); await pg.keyboard.press('f'); await pg.waitForTimeout(1200); await shot('16_grave13'); }
    logs.push('eggs after: ' + await pg.evaluate('window.__RD.eggs ? JSON.stringify(window.__RD.eggs()) : "no hook"'));
    await pg.reload({ waitUntil: 'commit' });
    for (let i = 0; i < 120; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => !!window.__RD && window.__RD.game.scene.isActive('TitleScene'))) break; }
    await pg.evaluate("window.__RD.goto('GraveyardWorld')"); await pg.waitForTimeout(4000);
    logs.push('eggs after reload: ' + await pg.evaluate('window.__RD.eggs ? JSON.stringify(window.__RD.eggs()) : "no hook"'));
    await shot('17_hud_after_reload');
  }
} catch (e) { logs.push('[script error] ' + e); }
await pg.close();

if (PART === 'all' || PART === 'mobile') {
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const mp = await ctx.newPage(); await boot(mp);
    await enterWorld(mp);
    await mp.screenshot({ path: `${OUT}/20_mobile_world.png` });
    await mp.evaluate("window.__RD.teleportToGrave('clippy')"); await mp.waitForTimeout(800);
    await mp.evaluate("window.__RD.raise('clippy')");
    const t0 = Date.now();
    while (Date.now() - t0 < 80000) { await mp.waitForTimeout(250); if (await mp.evaluate(() => /has risen/i.test(document.body.innerText))) break; }
    await mp.waitForTimeout(1500); await mp.screenshot({ path: `${OUT}/21_mobile_overlay.png` });
    await mp.getByRole('button', { name: /Requiescat in pace/i }).tap({ timeout: 5000 });
    await mp.waitForTimeout(4500);
    const left = await mp.evaluate("document.querySelectorAll('#grave-overlay').length");
    logs.push(`[test] mobile RIP tap: overlay nodes ${left} (${left === 0 ? 'PASS' : 'FAIL'})`);
    await mp.screenshot({ path: `${OUT}/22_mobile_after_tap.png` });
  } catch (e) { logs.push('[mobile script error] ' + e); }
}
fs.writeFileSync(`${OUT}/console-${PART}.log`, logs.join('\n'));
console.log(logs.slice(-80).join('\n'));
await b.close();
