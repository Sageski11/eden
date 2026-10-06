// Natural progression with no cheating (only keeps the player-side devotion from interfering): how far does a town get?
// usage: node tools/naturaltest.js [days] [seed-free]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const days = +(process.argv[2] || 300);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  const SEED = +(process.env.SEED || 0);
  if (SEED) await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const OFF = (process.env.OFF || '').split(',');
  await page.evaluate((OFF) => {
    if (OFF.includes('tf')) tfGradeSite = function () {};
    if (OFF.includes('dev')) { devDaily = function () {}; devHourly = function () {}; }
    if (OFF.includes('mod')) modernizeTick = function () {};
    if (OFF.includes('era')) for (const k in ERA_BUILD) ERA_BUILD[k] = 0;
    if (OFF.includes('pet')) tfDaily = function () {};
  }, OFF);
  await page.evaluate(() => { PAUSED = true; window.__run = (n) => { for (let i = 0; i < n * 24 * 10; i++) gameStep(0.1); }; });
  for (let d = 0; d < days; d += 20) {
    const r = await page.evaluate(() => {
      __run(20);
      const cnt = {}; for (const b of buildings) cnt[b.type] = (cnt[b.type] || 0) + 1;
      return { day: dayN(), era: ERAS[G.era].name, pop: popN(), hap: Math.round(G.hap), faith: Math.round(G.faith), food: Math.round(G.food), wood: Math.round(G.wood), stone: Math.round(G.stone), blds: buildings.length, dev: { doubt: Math.round(G.dev.doubt), piety: Math.round(G.dev.piety), cult: G.dev.cult && G.dev.cult.name, sin: Math.round(G.dev.sin) }, prayers: G.prayers.length, pet: G.tf.pet.length, hapF: G.hapF, cnt, next: ERA_REQ[G.era + 1] && ERA_REQ[G.era + 1].txt, ok: ERA_REQ[G.era + 1] && ERA_REQ[G.era + 1].ok(), unl: Object.keys(G.unl).length };
    });
    console.log(JSON.stringify(r));
    if (errs.length) break;
  }
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
