// Production chains, aggregate demand and events: populate a sandbox city with workshops and watch the town stores.
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); page.on('console', m => { if (m.type() === 'error' && !/CERT|Failed to load/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 300)); });
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('tSand').click()); await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const put = (type, x, z, level, variant) => { const b = newRecord(type, x, z, 0, 77 + buildings.length); b.level = level == null ? null : level; b.variant = variant || null; b.manual = true; addBuilding(b); realize(b); return b; };
    put('hall', 0, 0, 3); for (let i = 0; i < 14; i++) put('house', -50 + (i % 7) * 14, 20 + Math.floor(i / 7) * 14, 3);
    const w = ['bakery', 'brewery', 'weaver', 'tannery', 'kiln', 'bronze_foundry', 'apothecary', 'scriptorium', 'gasworks']; w.forEach((t, i) => put(t, -60 + i * 14, -30, null, BDEF[t].variants[0]));
    for (let i = 0; i < 4; i++) put('farm', 60 + i * 12, 50, null);
    sbPopulate(.9); return { pop: popN(), blds: buildings.length };
  });
  console.log('start', JSON.stringify(r));
  const out = await page.evaluate(() => { PAUSED = false; const log = []; for (let day = 1; day <= 40; day++) { G.food = Math.max(G.food, 400); G.wood = Math.max(G.wood, 300); G.stone = Math.max(G.stone, 200); G.raidCool = 1e9; for (let i = 0; i < 240; i++) gameStep(0.1); if (day % 8 === 0) log.push({ day, goods: Object.fromEntries(Object.entries(G.goods || {}).map(([k, v]) => [k, +v.toFixed(1)])), joy: G.goodsJoy, hapF: Object.keys(G.hapF || {}).join(), workers: Object.fromEntries(Object.entries(CHAINS).map(([k, c]) => [k, buildings.filter(b => b.type === k).map(b => G.vill.filter(v => v.work === b.id).length).join('/')]).filter(a => a[1])) }); }
    return { log, chron: G.chron.slice(0, 8).map(c => c.t), pop: popN(), era: ERAS[G.era].name }; });
  for (const l of out.log) console.log(JSON.stringify(l)); console.log(JSON.stringify(out.chron)); console.log(out.pop, out.era);
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS'); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
