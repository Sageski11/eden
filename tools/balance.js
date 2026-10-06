// Balance probe: plays a settlement for N days with NO cheating (no free food, no raid suppression) and a modest player:
// answers the prayers it can with a power, approves petitions, answers a false prophet with a Divine sign. Reports pacing and hazards.
// usage: SEED=1 POLICY=attentive|passive node tools/balance.js [days=200]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const days = +(process.argv[2] || 200), SEED = +(process.env.SEED || 1), POLICY = process.env.POLICY || 'attentive';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; try { localStorage.clear(); } catch (e) {} }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(1800);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); }); await page.waitForTimeout(800);
  await page.evaluate((policy) => {
    PAUSED = true;
    const B = window.__B = { spent: 0, earned0: 0, start: G.faith, fd: [], pray: {}, plague: 0, raids: 0, starveDays: 0, minHap: 100, eraDay: {}, cults: 0, lastCult: false, deathsAt: 0, lowFoodDays: 0, prayerKinds: {}, signs: 0 };
    const _sp = spend; spend = function (c) { const ok = _sp(c); if (ok) B.spent += c; return ok; };
    const _pl = startPlague; startPlague = function () { B.plague++; return _pl.apply(this, arguments); };
    const _sr = scheduleRaid; scheduleRaid = function () { B.raids++; return _sr.apply(this, arguments); };
    B.pushSeen = new WeakSet();
    window.__day = () => {
      const f0 = G.faith;
      // the player
      if (policy === 'attentive') {
        for (const p of G.prayers.slice()) { if (!B.pushSeen.has(p)) { B.pushSeen.add(p); B.prayerKinds[p.k] = (B.prayerKinds[p.k] || 0) + 1; }
          const k = p.k, c = id => { try { castPower(id); } catch (e) {} };
          if (k === 'sunrise' || k === 'wet' || k === 'cold' || k === 'power') c('p:sun'); else if (k === 'rain' || k === 'smog') c('p:rain'); else if (k === 'heal') c('p:heal'); else if (k === 'festival' || k === 'grief') c('p:festival'); else if (k === 'harvest') c('p:harvest'); }
        if (G.dev && G.dev.cult && G.faith > 70 && G.t % 72 < 24) { try { castPower('p:sign'); B.signs++; } catch (e) {} }
      }
      for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
      if (G.openRain && G.rain > 0 && policy === 'passive') { try { castPower('p:sun'); } catch (e) {} }
      for (let i = 0; i < 240; i++) gameStep(0.1);
      B.earned0 += Math.max(0, G.faith - f0);
      if (G.starve > 0) B.starveDays++; if (G.food < popN() * 1.5) B.lowFoodDays++;
      B.minHap = Math.min(B.minHap, G.hap); const cu = !!(G.dev && G.dev.cult); if (cu && !B.lastCult) B.cults++; B.lastCult = cu;
      if (B.eraDay[G.era] == null) B.eraDay[G.era] = dayN();
    };
  }, POLICY);
  let tot = 0;
  for (let d = 0; d < days; d += 10) {
    const r = await page.evaluate(() => { for (let i = 0; i < 10; i++) __day(); const B = __B; return { day: dayN(), era: G.era, pop: popN(), faith: Math.round(G.faith), hap: Math.round(G.hap), food: Math.round(G.food), deaths: G.deaths, births: G.births, raids: B.raids, plague: B.plague, starveDays: B.starveDays, lowFoodDays: B.lowFoodDays, cults: B.cults, ans: G.dev.answered, ign: G.dev.ignored, spent: B.spent, gained: Math.round(B.earned0), doubt: Math.round(G.dev.doubt), atro: G.dev.atrocities, done: !!G.dev.done }; });
    if (d % (+process.env.EVERY || 30) === 0) console.log(JSON.stringify(r)); tot = r;
    if (errs.length || r.done) break;
  }
  const fin = await page.evaluate(() => ({ eraDay: __B.eraDay, kinds: __B.prayerKinds, minHap: Math.round(__B.minHap), signs: __B.signs, fin: { day: dayN(), era: ERAS[G.era].name, pop: popN() } }));
  console.log('FINAL ' + SEED + ' ' + POLICY, JSON.stringify(tot), JSON.stringify(fin));
  console.log(errs.length ? errs.slice(0, 4).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
