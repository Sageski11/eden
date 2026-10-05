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
    run(8); G.era = Math.max(G.era, 1);
    const c = G.center; const px = c.x + 22, pz = c.z + 18; let n0 = 0;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { if (Math.hypot(i - HALF - px, j - HALF - pz) < 6) { W[j * S + i] = .5; n0++; } }
    const bl = tfWetBlob(px, pz); out.push(['blob', bl && { n: bl.n, max: +bl.max.toFixed(2) }]);
    const hOut = hAt(px, pz); tfFile('drain', { x: bl.cx, z: bl.cz, n: bl.n }); updateUI(true);
    out.push(['drain petition', G.tf.pet.map(p => p.txt)]); tfDecide(G.tf.pet[0].id, true);
    out.push(['wet after', Array.from(W).filter(x => x > .03).length, 'drained', G.tf.drained]);
    const h1 = G.chron[0].t; out.push(['chron', h1]); run(5); out.push(['stable', popN(), buildings.length]);
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
