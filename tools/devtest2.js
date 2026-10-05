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
    run(25);
    G.dev.doubt = 70; devSpawnProphet('sword'); G.dev.cult.strength = .8; for (let d = 0; d < 40 && G.dev.atrocities < 2; d++) { G.dev.doubt = 70; run(1); G.food = Math.max(G.food, 80); }
    out.push(['atrocities', G.dev.atrocities, 'sin', Math.round(G.dev.sin), 'cult', G.dev.cult && G.dev.cult.strength.toFixed(2), 'pop', popN()]);
    out.push(['log', G.dev.log.map(l => l.t)]);
    // save/load round trip
    const s = serializeGod(); const parsed = JSON.parse(s); out.push(['saved dev', !!parsed.G.dev, !!(parsed.G.dev.cult)]);
    loadGod(s); out.push(['loaded', G.dev.sin === parsed.G.dev.sin, G.dev.cult && G.dev.cult.name, G.vill.filter(v => v.cult).length, devGrp.children.length]);
    if(!(G.dev.sin>0||G.dev.cult)){out.push(['NOTE no sin/cult after famine; forcing sin']);G.dev.sin=45;} updateUI(true); out.push(['panel has judge', !!document.getElementById('devJudgeB')]);
    document.getElementById('devJudgeB').click(); out.push(['judge menu', document.querySelectorAll('#prayers [data-judge]').length]);
    document.querySelector('#prayers [data-judge="pestilence"]').click(); let g = 0; while (!G.dev.done && g++ < 600) run(0.5);
    out.push(['reckoning shown', !document.getElementById('reckon').classList.contains('hidden'), JSON.parse(localStorage.getItem('hearthmere_ledger')).length]);
    document.getElementById('rkNext').click(); out.push(['setup shown', !document.getElementById('setup').classList.contains('hidden')]);
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2500);
  console.log('new age', JSON.stringify(await page.evaluate(() => ({ phase: G.phase, dev: G.dev && G.dev.sin, vill: G.vill.length, blds: buildings.length }))));
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); }); await page.waitForTimeout(500);
  console.log('legacy faith', JSON.stringify(await page.evaluate(() => ({ legacy: G.dev.legacy, faith: G.faith }))));
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
