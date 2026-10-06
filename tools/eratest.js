const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    PAUSED = true; const out = []; const run = (days) => { for (let i = 0; i < days * 24 * 10; i++) gameStep(0.1); };
    const types = () => { const o = {}; for (const b of buildings) o[b.type + (b.type === 'house' ? (b.level != null ? '' + b.level : '') : '')] = (o[b.type + (b.type === 'house' ? (b.level != null ? '' + b.level : '') : '')] || 0) + 1; return o; };
    const boost = () => { G.food = Math.max(G.food, 600); G.wood = Math.max(G.wood, 400); G.stone = Math.max(G.stone, 400); G.faith = Math.max(G.faith, 300); G.dev.doubt = 0; G.dev.cult = null; };
    for (let d = 0; d < 120 && G.era < 5; d++) { boost(); G.sk.stone = Math.max(G.sk.stone, 700); G.sk.work = Math.max(G.sk.work, 700); G.sk.fish = 700; G.sk.farm = 700; G.sk.hunt = 700; G.sk.wood = 700; checkUnlocks(); if (popN() < 190 && d % 2 === 0 && G.center && !G.center.build) arriveFamily(5); run(1); }
    out.push(['era after boost', ERAS[G.era].name, 'pop', popN(), 'bld', buildings.length, 'req5', ERA_REQ[5].ok(), 'steam', !!G.unl.steam, JSON.stringify(types())]);
    for (let d = 0; d < 150 && G.era < 7; d++) { boost(); if (popN() < 600 && d % 2 === 0 && G.center && !G.center.build) arriveFamily(5); G.sk.machine = Math.max(G.sk.machine || 0, G.era >= 6 ? 700 : 0); G.sk.science = Math.max(G.sk.science || 0, G.era >= 6 ? 700 : 0); checkUnlocks(); run(1); if (d % 25 === 0) out.push(['d' + d, ERAS[G.era].name, 'pop', popN(), 'bld', buildings.length, 'poll', Math.round(G.poll || 0), JSON.stringify(types())]); }
    out.push(['final', ERAS[G.era].name, 'pop', popN(), JSON.stringify(types()), 'skills', JSON.stringify(G.sk), 'unl', Object.keys(G.unl).join()]);
    out.push(['hapF', JSON.stringify(G.hapF)]);
    const s = serializeGod(); loadGod(s); out.push(['reload', ERAS[G.era].name, buildings.length, popN()]);
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
