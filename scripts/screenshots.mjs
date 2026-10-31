import { chromium } from 'playwright-core';
import fs from 'fs';
const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = process.argv[3] || '/workspace/raise-dead/research/screens';
fs.mkdirSync(OUT, { recursive: true });
const logs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
pg.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
pg.on('pageerror', e => logs.push(`[pageerror] ${e}`));
const w = ms => pg.waitForTimeout(ms);
const shot = n => pg.screenshot({ path: `${OUT}/${n}.png` });
try {
  await pg.goto(URL, { waitUntil: 'commit', timeout: 60000 });
  for (let i=0;i<120;i++){ await w(500); if (await pg.evaluate(()=>!!window.__RD && window.__RD.game.scene.isActive('TitleScene'))) break; } await w(2500); await shot('01_title');
  await pg.mouse.click(640, 500); await w(800); await pg.mouse.click(640, 500);
  await w(3000); if (!(await pg.evaluate('window.__RD.game.scene.isActive("GraveyardWorld")'))) { logs.push('[note] click did not enter graveyard; using __RD.goto'); await pg.evaluate("window.__RD.goto('GraveyardWorld')"); } await w(4000); await shot('02_graveyard');
  await pg.keyboard.down('d'); await w(900); await pg.keyboard.up('d');
  await pg.keyboard.down('s'); await w(700); await pg.keyboard.up('s');
  await w(500); await shot('03_walking');
  const has = await pg.evaluate('!!window.__RD');
  logs.push('__RD present: ' + has + ' scenes: ' + await pg.evaluate('window.__RD && window.__RD.game.scene.getScenes(true).map(s=>s.scene.key).join(",")'));
  if (has) {
    await pg.evaluate('window.__RD.game.loop.smoothStep = false'); logs.push('fps ' + await pg.evaluate('window.__RD.game.loop.actualFps')); await pg.evaluate("window.__RD.teleportToGrave('clippy')"); await w(1500); await shot('04_prompt_plaque');
    await pg.keyboard.down('f'); await w(250); await pg.keyboard.up('f'); await w(500); if (!(await pg.evaluate('window.__RD.game.scene.isActive("ResurrectionRitual")'))) { logs.push('[note] F did not start ritual; using __RD.raise'); await pg.evaluate("window.__RD.raise('clippy')"); } await w(2500); await shot('05_ritual_runes');
    let fi = 0; const t0 = Date.now();
    while (Date.now() - t0 < 80000) { await w(100); fi++; await shot(`06_ritual_${String(fi).padStart(2,'0')}`);
      const risen = await pg.evaluate(() => /has risen/i.test(document.body.innerText)); if (risen) { logs.push('overlay at ' + (Date.now()-t0) + 'ms'); break; } }
    await w(2000); await shot('07_overlay');
    await pg.keyboard.down('Escape'); await w(250); await pg.keyboard.up('Escape'); await w(4000); await shot('08_after_exit');
    await pg.evaluate("window.__RD.goto('CreditsScene')"); await w(2500); await shot('09_credits');
  }
} catch (e) { logs.push('[script error] ' + e); }
fs.writeFileSync(`${OUT}/console.log`, logs.join('\n'));
console.log(logs.slice(-40).join('\n'));
await b.close();
