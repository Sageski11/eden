// Builds a large two-people game (bot-assisted) and saves serializeGod() to a file for profiling.
// usage: node tools/mkstate.js out.json [days]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2], days = +(process.argv[3] || 120);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 5);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { PAUSED = true; window.__d = () => { eachSettlement(() => { G.food = Math.max(G.food, popN() * 6 + 40); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58); G.wood = Math.max(G.wood, 120); G.stone = Math.max(G.stone, 120); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.sad = Math.min(G.sad, 3); G.dev.doubt = Math.min(G.dev.doubt, 12); for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
      for (const k in G.sk) G.sk[k] = Math.max(G.sk[k], 700); checkUnlocks(); if (popN() < 260 && G.center && !G.center.build && dayN() % 2 === 0) arriveFamily(3); });
      if (dayN() >= 30) eachSettlement(() => { if (G.era < 5) { G.era = 5; G.unl.steam = true; } }); G.faith = 400; for (let i = 0; i < 240; i++) gameStep(0.1); }; });
  for (let d = 0; d < days; d += 10) { const r = await page.evaluate(() => { for (let i = 0; i < 10; i++) __d(); return TOWNS.list.map((s, i) => [sName(i), ERAS[sGet(i, 'era')].name, (i === TOWNS.cur ? G.vill : s.st.vill).length, (i === TOWNS.cur ? buildings : s.bld).length]); }); console.log(d + 10, JSON.stringify(r)); if (errs.length) break; }
  const str = await page.evaluate(() => serializeGod()); fs.writeFileSync(out, str); console.log('saved', out, str.length, errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
