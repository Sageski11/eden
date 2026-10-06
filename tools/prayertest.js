// Which prayers appear in which age, how many are open at once, and does blessing a field answer the harvest prayer?
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const days = +(process.argv[2] || 40);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2000);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(1500);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); PAUSED = true; });
  await page.waitForTimeout(500);
  const res = {};
  for (const era of [0, 2, 5, 7]) {
    const r = await page.evaluate((era) => {
      G.era = era; G.sk.machine = 800; G.sk.science = 800; for (const k in G.sk) G.sk[k] = 700; checkUnlocks(); if (era >= 5) { G.unl.steam = true; } if (era >= 6) G.unl.electric = true; if (era >= 7) G.unl.computing = true;
      const seen = {}, counts = []; for (let d = 0; d < 40; d++) { for (let i = 0; i < 240; i++) { if (i % 24 === 0) { G.food = Math.max(G.food, 40 + popN() * 4); G.raidCool = 1e9; if (d % 7 === 3) G.hap = 40; } gameStep(0.1); } counts.push(G.prayers.length); for (const p of G.prayers) seen[p.k] = (seen[p.k] || 0) + 1; }
      return { era: ERAS[G.era].name, seen, avg: +(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2), max: Math.max(...counts), txt: G.prayers.map(p => p.txt.slice(0, 70)) }; }, era).catch(e => ({ err: String(e) }));
    console.log(JSON.stringify(r));
  }
  // blessing a farm answers the harvest prayer and expires
  const b = await page.evaluate(() => { const f = buildings.find(b => b.type === 'farm' && !b.build) || null; if (!f) return 'no farm'; G.faith = 300; hoverB = f; tool = 'bless'; godClick({}); const a = f.blessUntil > G.t; godClick({}); const toastTxt = document.getElementById('toast').textContent; G.t += 80; return { blessed: a, again: toastTxt, expired: !(f.blessUntil > G.t) }; });
  console.log('bless', JSON.stringify(b)); console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
