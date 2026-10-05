// Same-seed early-game diagnostic: why is food short?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const SEED = +(process.env.SEED || 7), DAYS = +(process.env.DAYS || 20), OFF = (process.env.OFF || '').split(',');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(([DAYS, OFF]) => {
    PAUSED = true; const out = [];
    if (OFF.includes('tf')) tfGradeSite = function () {};
    if (OFF.includes('dev')) { devDaily = function () {}; devHourly = function () {}; }
    if (OFF.includes('mod')) modernizeTick = function () {};
    if (OFF.includes('era')) for (const k in ERA_BUILD) ERA_BUILD[k] = 0;
    const snap = (d) => { const farms = buildings.filter(b => b.type === 'farm'); const jobs = {}; for (const v of G.vill) jobs[v.job || '-'] = (jobs[v.job || '-'] || 0) + 1;
      return { d, era: G.era, pop: popN(), food: Math.round(G.food), hap: Math.round(G.hap), prodY: G.prodY, cons: Math.round(G.cons || 0), farms: farms.map(f => (f.build ? 'B' : 'ok') + (wAt(f.x, f.z) > .15 ? 'W' : '') + ':' + farmRate(f).toFixed(2)).join(' '), jobs, flooded: G.flooded, graded: G.tf.graded, cult: G.dev.cult && (G.dev.cult.name + ' s=' + G.dev.cult.strength.toFixed(2)), sin: Math.round(G.dev.sin), dist: +G.dev.distress.toFixed(2), sad: +G.sad.toFixed(1), grief: +G.grief.toFixed(1), joy: +G.joy.toFixed(1), hapF: G.hapF, pet: G.tf.pet.length, doubt: Math.round(G.dev.doubt), failCool: Object.keys(G.failCool).filter(k => G.failCool[k] > G.t).join() }; };
    for (let d = 1; d <= DAYS; d++) { for (let i = 0; i < 240; i++) gameStep(0.1); if (d % 10 === 0) out.push(snap(d)); }
    out.push({ chron: G.chron.slice(0, 40).map(c => c.d + ' ' + c.t) });
    return out;
  }, [DAYS, OFF]);
  for (const x of r) console.log(JSON.stringify(x));
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
