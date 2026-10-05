// Natural run of the ORIGINAL game (patched only to expose gameStep) for balance comparison.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const file = process.argv[2], days = +(process.argv[3] || 100);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const SEED = +(process.env.SEED || 0);
  if (SEED) await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + file); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); __X.autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { __X.setPaused(true); });
  for (let d = 0; d < days; d += 20) {
    const r = await page.evaluate(() => { for (let i = 0; i < 20 * 24 * 10; i++) __X.gameStep(0.1); const G = __X.G; return { day: __X.dayN(), era: __X.ERAS[G.era].name, pop: __X.popN(), hap: Math.round(G.hap), food: Math.round(G.food), wood: Math.round(G.wood), stone: Math.round(G.stone), blds: __X.buildings.length, hapF: G.hapF }; });
    console.log(JSON.stringify(r));
  }
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
