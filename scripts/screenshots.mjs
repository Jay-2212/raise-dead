// Headless verification screenshots. Usage: node scripts/screenshots.mjs [url] [outDir]
// Needs `npx vite preview --port 4173` running. Uses ?debug=1 to expose window.__RD.
import { chromium } from 'playwright-core';
import fs from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = process.argv[3] || '/workspace/raise-dead/research/screens';
fs.mkdirSync(OUT, { recursive: true });
const logs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
const url = q => BASE + (BASE.includes('?') ? '&' : '?') + q;

async function boot(pg) {
  // Abort any third-party font CDN (hangs in the sandbox; fonts are self-hosted after review round 1)
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  pg.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  pg.on('pageerror', e => logs.push(`[pageerror] ${e}`));
  pg.on('requestfailed', r => logs.push(`[reqfailed] ${r.url()}`));
}
const ev = (pg, s) => pg.evaluate(s);
const active = (pg, k) => ev(pg, `window.__RD.game.scene.isActive("${k}")`);
const ui = pg => ev(pg, `(() => { const u = window.__RD.game.scene.getScene('UIScene');
  const vis = o => !!(o && o.visible && (o.alpha === undefined || o.alpha > 0.05));
  const out = {}; for (const [k, v] of Object.entries(u)) { if (v && typeof v === 'object' && 'visible' in v && 'alpha' in v) out[k] = vis(v); }
  out.paused = window.__RD.game.scene.isPaused('UIScene'); return JSON.stringify(out); })()`);

// ── Desktop flow ─────────────────────────────────────────────────────────
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
await boot(pg);
const w = ms => pg.waitForTimeout(ms);
const shot = n => pg.screenshot({ path: `${OUT}/${n}.png` });
try {
  await pg.goto(url('debug=1'), { waitUntil: 'commit', timeout: 60000 });
  for (let i = 0; i < 120; i++) { await w(500); if (await ev(pg, () => !!window.__RD && window.__RD.game.scene.isActive('TitleScene'))) break; }
  await w(2500); await shot('01_title');
  await pg.mouse.click(640, 500); await w(1200); await shot('01b_title_unlocked');
  await pg.keyboard.press('Enter'); await w(3000);
  if (!(await active(pg, 'GraveyardWorld'))) { await pg.mouse.click(640, 500); await w(3000); }
  if (!(await active(pg, 'GraveyardWorld'))) { logs.push('[note] title input did not enter graveyard; using __RD.goto'); await ev(pg, "window.__RD.goto('GraveyardWorld')"); }
  else logs.push('[ok] title two-step entered graveyard');
  await w(4000); await shot('02_graveyard');
  await pg.keyboard.down('d'); await w(900); await pg.keyboard.up('d');
  await pg.keyboard.down('s'); await w(700); await pg.keyboard.up('s');
  await w(500); await shot('03_walking');
  logs.push('fps ' + await ev(pg, 'window.__RD.game.loop.actualFps'));
  await ev(pg, "window.__RD.teleportToGrave('clippy')"); await w(1500); await shot('04_prompt_plaque');
  logs.push('UI before ritual: ' + await ui(pg));
  // Walk while pressing F to check no sliding
  await pg.keyboard.down('d'); await w(150);
  await pg.keyboard.press('f'); await w(100); await pg.keyboard.up('d'); await w(600);
  if (!(await active(pg, 'ResurrectionRitual'))) { logs.push('[note] F did not start ritual; using __RD.raise'); await ev(pg, "window.__RD.raise('clippy')"); }
  const wx0 = await ev(pg, "window.__RD.game.scene.getScene('GraveyardWorld').wizard.x");
  await w(2000); await shot('05_ritual_runes');
  const wx1 = await ev(pg, "window.__RD.game.scene.getScene('GraveyardWorld').wizard.x");
  logs.push(`[test] wizard x during ritual ${wx0} -> ${wx1} (${wx0 === wx1 ? 'PASS no slide' : 'FAIL slid'})`);
  // F mid-ritual must not restart it: tag a child, press F twice, check tag survives
  await ev(pg, "(() => { const r = window.__RD.game.scene.getScene('ResurrectionRitual'); r.children.list[0].__tag = 1; window.__ritualCreates = 0; })()");
  await pg.keyboard.press('f'); await w(120); await pg.keyboard.press('f'); await w(800);
  const survived = await ev(pg, "window.__RD.game.scene.getScene('ResurrectionRitual').children.list.some(c => c.__tag === 1)");
  logs.push(`[test] F mid-ritual: ${survived ? 'PASS ritual not restarted' : 'FAIL ritual restarted'}`);
  logs.push('UI during ritual: ' + await ui(pg));
  let fi = 0; const t0 = Date.now(); let lastShot = 0;
  while (Date.now() - t0 < 80000) {
    await w(100);
    if (Date.now() - lastShot > 700) { fi++; lastShot = Date.now(); await shot(`06_ritual_${String(fi).padStart(2, '0')}`); }
    if (await ev(pg, () => /has risen/i.test(document.body.innerText))) { logs.push('overlay at ' + (Date.now() - t0) + 'ms'); break; }
  }
  await w(2000); await shot('07_overlay');
  await pg.keyboard.press('f'); await w(500);
  logs.push('[test] F during overlay -> ritual scenes active: ' + await ev(pg, "window.__RD.game.scene.getScenes(true).map(s=>s.scene.key).join(',')"));
  await pg.keyboard.press('Escape'); await w(5000); await shot('08_after_exit');
  logs.push('UI after exit: ' + await ui(pg));
  logs.push('overlay DOM left: ' + await ev(pg, "document.querySelectorAll('#grave-overlay, .grave-overlay').length"));
  // Credits from the HUD link (top-left)
  await pg.mouse.click(40, 22); await w(2500); await shot('09_credits');
  logs.push('[test] credits open, world paused: ' + await ev(pg, "window.__RD.game.scene.isPaused('GraveyardWorld')"));
  const wxc0 = await ev(pg, "window.__RD.game.scene.getScene('GraveyardWorld').wizard.x");
  await pg.keyboard.down('d'); await w(600); await pg.keyboard.up('d'); await pg.keyboard.press('f'); await w(500);
  const wxc1 = await ev(pg, "window.__RD.game.scene.getScene('GraveyardWorld').wizard.x");
  logs.push(`[test] WASD/F under credits: wizard ${wxc0}->${wxc1}, ritual active ${await active(pg, 'ResurrectionRitual')}`);
} catch (e) { logs.push('[script error] ' + e); }
await pg.close();

// ── Mobile flow ──────────────────────────────────────────────────────────
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const mp = await ctx.newPage(); await boot(mp);
  await mp.goto(url('debug=1&touch=1'), { waitUntil: 'commit', timeout: 60000 });
  for (let i = 0; i < 120; i++) { await mp.waitForTimeout(500); if (await mp.evaluate(() => !!window.__RD && window.__RD.game.scene.isActive('TitleScene'))) break; }
  await mp.waitForTimeout(2000); await mp.screenshot({ path: `${OUT}/10_mobile_title.png` });
  await mp.evaluate("window.__RD.goto('GraveyardWorld')"); await mp.waitForTimeout(4000);
  await mp.evaluate("window.__RD.teleportToGrave('clippy')"); await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${OUT}/11_mobile_graveyard.png` });
  logs.push('mobile canvas rect: ' + await mp.evaluate("JSON.stringify(document.querySelector('canvas').getBoundingClientRect())"));
  logs.push('mobile joystick: ' + await mp.evaluate(`(() => { const u = window.__RD.game.scene.getScene('UIScene'); const j = u.joystick; if (!j) return 'none';
    const f = j.fButton; return JSON.stringify({active: j.active, fBtn: f && {x: f.x, y: f.y, vis: f.visible}, base: j.joyStick && j.joyStick.base && {x: j.joyStick.base.x, y: j.joyStick.base.y, vis: j.joyStick.base.visible}}); })()`));
} catch (e) { logs.push('[mobile script error] ' + e); }

fs.writeFileSync(`${OUT}/console.log`, logs.join('\n'));
console.log(logs.filter(l => !l.startsWith('[log]') && !l.startsWith('[debug]')).slice(-60).join('\n'));
await b.close();
