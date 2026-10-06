// Screenshot the god-game UI with a prophet, petitions and the judgment menu showing.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.addInitScript(() => { let a = 5; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    PAUSED = true; for (let d = 0; d < 45; d++) { G.food = Math.max(G.food, 200); G.hap = Math.max(G.hap, 60); G.raid = null; G.raidCool = 1e9; for (let i = 0; i < 240; i++) gameStep(0.1); }
    G.era = Math.max(G.era, 2); G.dev.doubt = 70; devSpawnProphet('abundance'); G.dev.cult.strength = .45; G.dev.sin = 30; devDaily();
    tfFile('clearcut', { x: 20, z: 20, n: 140 }); tfFile('drain', { x: -20, z: 30, n: 50 });
    document.getElementById('ghelp').classList.add('hidden'); updateUI(true);
    cam.dist = 120; cam.pitch = .6;
  });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: out, timeout: 120000 });
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
