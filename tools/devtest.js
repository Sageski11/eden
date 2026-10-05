// Drives the devotion loop headlessly: starve the town so doubt rises, watch prophet/cult/atrocities, then judge.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('Eden.html'));
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    PAUSED = true; const out = [];
    const run = (days) => { for (let i = 0; i < days * 24 * 10; i++) { gameStep(0.1); } };
    run(25); // let the town grow
    out.push(['grown', popN(), buildings.length, JSON.stringify(G.dev.causes)]);
    // induce famine: strip the food each day
    for (let d = 0; d < 80 && !(G.dev.cult && G.dev.cult.strength > .5); d++) { G.food = 0; run(1); G.sad = Math.max(G.sad, 8); }
    out.push(['after famine', popN(), +G.dev.doubt.toFixed(1), +G.dev.piety.toFixed(1), G.dev.cult && { name: G.dev.cult.name, key: G.dev.cult.key, s: +G.dev.cult.strength.toFixed(2), shrine: !!G.dev.cult.shrine }, 'sin', G.dev.sin, 'atro', G.dev.atrocities]);
    updateUI(true);
    out.push(['panel', document.getElementById('prayers').innerText.slice(0, 400)]);
    const before = G.faith; G.faith = 200; castPower('p:sign'); out.push(['sign', Math.round(before), Math.round(G.faith), G.dev.cult && +G.dev.cult.strength.toFixed(2)]);
    G.faith = 200; castPower('p:anoint'); castPower('p:hush'); out.push(['hush', G.dev.cult ? 'cult remains s=' + G.dev.cult.strength.toFixed(2) : 'cult ended']);
    out.push(['chron', G.chron.slice(0, 8).map(c => c.t)]);
    G.dev.sin = Math.max(G.dev.sin, 45); devJudge('firestorm');
    let g = 0; while (!G.dev.done && g++ < 400) run(0.5);
    out.push(['judged', G.dev.done, popN(), buildings.length, document.getElementById('reckon').innerText.replace(/\n+/g, ' | ').slice(0, 300)]);
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await page.screenshot({ path: process.argv[2] || '/tmp/dev.png', timeout: 120000 }).catch(() => {});
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
