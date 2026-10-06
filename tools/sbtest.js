// Sandbox: Buildings page (TAB), icons, placement of every catalog entry, roads, populate. usage: node tools/sbtest.js [shotDir]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp'; const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 } }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve(process.env.PAGE || 'Eden.html')); await page.waitForTimeout(2000);
  await page.evaluate(() => document.getElementById('tSand').click()); await page.waitForTimeout(1500);
  await page.keyboard.press('Tab'); await page.waitForTimeout(500);
  console.log('open', await page.evaluate(() => SB.open));
  await page.waitForFunction(() => !SB.iconBusy && Object.keys(SB.icons).length >= SBC.filter(c => !c.tool).length, null, { timeout: 120000 }).catch(() => console.log('icons timeout'));
  console.log('icons', await page.evaluate(() => Object.keys(SB.icons).length + '/' + SBC.filter(c => !c.tool).length));
  await page.screenshot({ path: out + '/sb_page0.png' });
  await page.evaluate(() => document.getElementById('sbMain').scrollTop = document.getElementById('sbs5').offsetTop - 60); await page.waitForTimeout(400);
  await page.screenshot({ path: out + '/sb_page5.png' });
  await page.keyboard.press('Tab'); await page.waitForTimeout(300); console.log('closed', await page.evaluate(() => !SB.open && !UIBLOCK));
  // place every building once on a grid
  const r = await page.evaluate(() => {
    const res = []; let i = 0;
    for (const c of SBC) { if (c.tool) continue; sbPick(c); const gx = (i % 8) * 26 - 100, gz = Math.floor(i / 8) * 26 - 80; i++;
      ghostB.x = gx; ghostB.z = gz; ghostB.id = -1; const pre = generate(ghostB, 'ok'); disposeObj(pre.grp);
      const b = newRecord(c.type, gx, gz, 0, 5 + i); b.level = c.level; b.variant = c.variant; b.manual = true; addBuilding(b); realize(b); res.push(c.type + (c.level == null ? '' : c.level) + ':' + b.info.name); }
    return res; });
  console.log('placed', r.length); console.log(r.join(' | '));
  await page.evaluate(() => { cam.tx = -40; cam.tz = -40; cam.dist = 190; cam.pitch = .9; }); await page.waitForTimeout(800); await page.screenshot({ path: out + '/sb_all.png' });
  // roads
  const rd = await page.evaluate(() => { setTool('street'); hover = { x: -60, z: 100, y: hAt(-60, 100) }; shift = false; painting = true; for (let k = 0; k < 20; k++) { hover = { x: -60 + k * 6, z: 100, y: hAt(-60 + k * 6, 100) }; applyBrush(.1); } endStroke(); painting = false;
    let n = 0; for (let k = 0; k < ROADT.length; k++) if (ROADT[k] === 2) n++;
    const a = netBuild('rail', [-120, 120], [100, 130]); const b = netBuild('highway', [-120, 140], [100, 150]); return { paved: n, rail: a, hw: b, lines: G.net.lines.length }; });
  console.log('roads', JSON.stringify(rd)); await page.waitForTimeout(2500);
  await page.evaluate(() => { cam.tx = 0; cam.tz = 120; cam.dist = 120; }); await page.waitForTimeout(1200); await page.screenshot({ path: out + '/sb_roads.png' });
  // undo / save-load round trip keeps level, variant, net, paving
  const rt = await page.evaluate(() => { const s = serialize(); const nb = buildings.length, nl = G.net.lines.length; let pv = 0; for (const v of SB.paved) pv += v; const lv = buildings.filter(b => b.level != null).length;
    deserialize(s); let pv2 = 0; for (const v of SB.paved) pv2 += v; return { nb, nb2: buildings.length, nl, nl2: G.net.lines.length, pv, pv2, lv, lv2: buildings.filter(b => b.level != null).length }; });
  console.log('roundtrip', JSON.stringify(rt));
  // populate
  const bad = await page.evaluate(() => { const hs = buildings.filter(b => b.type === 'hall'); return hs.length; }); console.log('halls', bad);
  await page.evaluate(() => sbPopulate(.6)); await page.waitForTimeout(1500);
  const p1 = await page.evaluate(() => ({ mode: MODE, era: G.era, pop: popN(), blds: buildings.length, lines: G.net.lines.length, center: !!G.center }));
  console.log('populated', JSON.stringify(p1)); await page.screenshot({ path: out + '/sb_pop0.png' });
  await page.evaluate(() => { PAUSED = false; for (let i = 0; i < 1200; i++) gameStep(0.1); });
  console.log('after', JSON.stringify(await page.evaluate(() => ({ day: dayN(), pop: popN(), blds: buildings.length, food: Math.round(G.food), hap: Math.round(G.hap), era: ERAS[G.era].name }))));
  await page.waitForTimeout(1500); await page.screenshot({ path: out + '/sb_pop1.png' });
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'NO ERRORS'); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
