// Why does a boosted town stall before High Medieval / Industrial? Reports the blockers every few days.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    PAUSED = true; const out = []; const run = (days) => { for (let i = 0; i < days * 24 * 10; i++) gameStep(0.1); };
    const boost = () => { G.food = Math.max(G.food, 600); G.wood = Math.max(G.wood, 400); G.stone = Math.max(G.stone, 400); G.faith = Math.max(G.faith, 300); G.dev.doubt = 0; G.dev.cult = null; for (const k of ['stone', 'work', 'wood', 'fish', 'farm', 'hunt']) G.sk[k] = Math.max(G.sk[k], 700); checkUnlocks(); };
    for (let d = 0; d < 61; d++) {
      boost(); if (popN() < 150 && d % 2 === 0 && G.center && !G.center.build) arriveFamily(5); run(1);
      if (d % 10 === 0 || G.era >= 4) {
        const c = buildings.find(b => b.type === 'castle'), t = buildings.filter(b => b.type === 'tower');
        out.push(['d' + d, 'era', G.era, 'pop', popN(), 'castle', c ? (c.build ? 'building ' + Math.round(100 * c.build.done / c.build.work) + '% have ' + JSON.stringify(c.build.have) + '/' + JSON.stringify(c.build.need) : 'built') : 'none', 'towers', t.map(x => x.build ? 'b' : 'ok').join(''), 'req', ERA_REQ[G.era + 1] && ERA_REQ[G.era + 1].ok(), 'market', buildings.filter(b => b.type === 'market').map(b => b.build ? 'b' : 'ok').join(''), 'tavern', buildings.filter(b => b.type === 'tavern').map(b => b.build ? 'b' : 'ok').join(''), 'hap', Math.round(G.hap), 'needs', JSON.stringify(pickNeed(buildings.filter(siteProj)).map(n => n.type)), 'sites', buildings.filter(siteProj).map(b => b.type).join(), 'failCool', JSON.stringify(Object.fromEntries(Object.entries(G.failCool).filter(([, v]) => v > G.t).map(([k, v]) => [k, Math.round(v - G.t)])))]);
      }
      if (G.era >= 5) break;
    }
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
