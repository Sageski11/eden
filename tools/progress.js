// A "competent player" bot: keeps the town fed, calm and un-raided, auto-approves petitions, and lets everything else
// (immigration, planner, upgrades, crafts, eras) run naturally. Reports how fast the ages come.
// usage: node tools/progress.js [maxDays] ; SEED=n for a deterministic start.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const maxDays = +(process.argv[2] || 500), SEED = +(process.env.SEED || 0);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  if (SEED) await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    PAUSED = true;
    window.__castleLog = []; { const _r = removeBuilding; removeBuilding = function (b) { if (b.type === 'castle') window.__castleLog.push({ day: dayN(), build: !!b.build, done: b.build && +b.build.done.toFixed(1), stack: new Error().stack.split('\n').slice(2, 5).map(x => x.trim().slice(0, 70)).join(' | ') }); return _r(b); }; }
    window.__day = () => {
      // the bot: feed, calm, protect, approve
      G.food = Math.max(G.food, popN() * 6 + 40); G.faith = Math.max(G.faith, 200); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58);
      G.wood = Math.max(G.wood, 120); G.stone = Math.max(G.stone, 120); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.sad = Math.min(G.sad, 3);
      if (G.dev) { G.dev.doubt = Math.min(G.dev.doubt, 12); }
      for (const v of G.vill) if (v.sick && Math.random() < .5) v.sick = 0;
      for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
      if (window.__cheat) { for (const k in G.sk) G.sk[k] = Math.max(G.sk[k], 700); checkUnlocks(); if (popN() < 130 && G.center && !G.center.build && dayN() % 2 === 0) arriveFamily(3); }
      for (let i = 0; i < 240; i++) gameStep(0.1);
    };
    window.__stat = () => { const cnt = {}; for (const b of buildings) cnt[b.type + (b.type === 'house' ? 'L' + (b.level == null ? '?' : b.level) : '')] = (cnt[b.type + (b.type === 'house' ? 'L' + (b.level == null ? '?' : b.level) : '')] || 0) + 1; return { day: dayN(), year: yearN(), era: ERAS[G.era].name, castle: (() => { const c = buildings.find(b => b.type === 'castle'); if (!c) return 'none'; const P = c.build; return P ? { build: true, done: +P.done.toFixed(1), work: P.work, have: P.have, need: P.need, inb: P.inb, idle: P._idle, builders: G.vill.filter(v => v.site === c.id).length } : 'built'; })(), towers: buildings.filter(b => b.type === 'tower').map(b => b.build ? 'b' : 'ok').join(''), failCool: Object.keys(G.failCool).filter(k => G.failCool[k] > G.t).join(), siteFail: G.siteFail && G.siteFail.type, pop: popN(), hap: Math.round(G.hap), blds: buildings.length, poll: Math.round(G.poll || 0), lines: G.net ? G.net.lines.map(l => l.kind).join() : '', sk: Object.fromEntries(Object.entries(G.sk).map(([k, v]) => [k, skLvl(k)])), next: ERA_REQ[G.era + 1] && ERA_REQ[G.era + 1].txt, ok: ERA_REQ[G.era + 1] && ERA_REQ[G.era + 1].ok(), cnt }; };
  });
  if (process.env.CHEAT) await page.evaluate(() => { window.__cheat = true; });
  let lastEra = -1;
  for (let d = 0; d < maxDays; d += 10) {
    const r = await page.evaluate(() => { for (let i = 0; i < 10; i++) __day(); const s = __stat(); s.era_i = G.era; return s; });
    if (d % (+process.env.EVERY || 30) === 0 || r.era_i !== lastEra) console.log(JSON.stringify(r)); lastEra = r.era_i;
    if (r.era_i >= 7 && d > 0 && d % 60 === 0) break;
    if (errs.length) break;
  }
  console.log('CASTLELOG', JSON.stringify(await page.evaluate(() => __castleLog)), JSON.stringify(await page.evaluate(() => G.chron.filter(c => /castle|gave up/i.test(c.t)).slice(0, 12).map(c => c.d + ' ' + c.t))));
  const last = await page.evaluate(() => __stat()); console.log('FINAL', JSON.stringify(last));
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
