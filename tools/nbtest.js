// Two peoples: the second arrives in the Bronze Age; both are simulated; tabs switch the view.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const days = +(process.argv[2] || 80), shot = process.argv[3], SEED = +(process.env.SEED || 5);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    PAUSED = true;
    window.__day = () => { eachSettlement(() => { G.food = Math.max(G.food, popN() * 6 + 40); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58); G.wood = Math.max(G.wood, 100); G.stone = Math.max(G.stone, 100); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.sad = Math.min(G.sad, 3); G.dev.doubt = Math.min(G.dev.doubt, 12); for (const p of G.tf.pet.slice()) tfDecide(p.id, true); });
      G.faith = Math.max(G.faith, 200); for (let i = 0; i < 240; i++) gameStep(0.1); };
    window.__st = () => TOWNS.list.map((s, i) => { const cnt = {}; const bl = i === TOWNS.cur ? buildings : s.bld; for (const b of bl) cnt[b.type] = (cnt[b.type] || 0) + 1; const st = i === TOWNS.cur ? G : s.st; return { i, name: st.town, era: ERAS[st.era].name, pop: st.vill.filter(v => !v.leaving && !v.arriving).length, hap: Math.round(st.hap), food: Math.round(st.food), blds: bl.length, way: st.env ? domWay(st.env) : '?', center: st.center && [Math.round(st.center.x), Math.round(st.center.z)], houses: cnt.house || 0, farms: cnt.farm || 0, camps: cnt.camp || 0, lodge: cnt.lodge || 0, dock: cnt.dock || 0 }; });
  });
  for (let d = 0; d < days; d += 10) {
    const r = await page.evaluate(() => { for (let i = 0; i < 10; i++) __day(); return { day: dayN(), cur: TOWNS.cur, n: TOWNS.list.length, towns: __st() }; });
    console.log(JSON.stringify(r));
    if (errs.length) break;
  }
  const sw = await page.evaluate(() => { const o = {}; if (TOWNS.list.length > 1) { viewSettlement(1, true); o.after1 = [G.town, buildings.length, popN(), document.getElementById('gTowns').innerText.replace(/\n/g, ' | ')]; updateUI(true); o.prayers = document.getElementById('prayers').innerText.slice(0, 160).replace(/\n/g, ' | '); for (let i = 0; i < 24; i++) gameStep(0.1); o.stillRuns = popN(); cycleSettlement(); o.after2 = [G.town, buildings.length]; } return o; });
  console.log('SWITCH', JSON.stringify(sw));
  if (process.env.TRADE) {
    const r = await page.evaluate(() => { const log = []; const run = (d) => { for (let i = 0; i < d * 240; i++) gameStep(0.1); };
      for (let day = 0; day < 14; day++) { eachSettlement((i) => { G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.hap = Math.max(G.hap, 55); if (i === 0) { G.wood = 500; G.stone = 200; G.food = Math.min(G.food, 25); } else { G.food = 500; G.wood = Math.min(G.wood, 15); G.stone = 60; } }); run(1);
        if (day % 3 === 2) log.push({ day, caravans: allVill().filter(v => v.mission).map(v => [v.mission.from, v.mission.to, v.mission.phase, Math.round(v.x), Math.round(v.z)]), trades: G.tradeN || 0, stock: TOWNS.list.map((t, i) => [Math.round(sGet(i, 'food')), Math.round(sGet(i, 'wood'))]) }); }
      return { log, tradeLog: G.tradeLog, chron: G.chron.filter(c => /caravan/i.test(c.t)).slice(0, 6).map(c => c.t) }; });
    console.log('TRADE', JSON.stringify(r));
  }
  if (process.env.SAVELOAD) {
    const r = await page.evaluate(() => { const before = __st().map(t => [t.name, t.pop, t.blds, t.era]); const str = serializeGod(); loadGod(str);
      const after = __st().map(t => [t.name, t.pop, t.blds, t.era]); let ok = true; try { for (let i = 0; i < 120; i++) gameStep(0.1); } catch (e) { ok = String(e); }
      const old = JSON.parse(str); delete old.towns; return { bytes: str.length, before, after, same: JSON.stringify(before) === JSON.stringify(after), runsAfter: ok, cur: TOWNS.cur, n: TOWNS.list.length, tabs: document.getElementById('gTowns').innerText.replace(/\n/g, ' | '), pop2: __st().map(t => t.pop), shrineGroups: devGrp.children.length }; });
    console.log('SAVELOAD', JSON.stringify(r));
    const lg = await page.evaluate(() => { const o = JSON.parse(serializeGod()); const t0 = o.towns[0]; const v2 = Object.assign({}, o, { v: 2, bl: t0.bl, vill: t0.vill, G: Object.assign({}, o.G, t0.G), center: t0.center }); delete v2.towns; delete v2.act;
      loadGod(JSON.stringify(v2)); for (let i = 0; i < 120; i++) gameStep(0.1); return { n: TOWNS.list.length, name: G.town, pop: popN(), blds: buildings.length, era: ERAS[G.era].name }; });
    console.log('LEGACY_V2', JSON.stringify(lg));
  }
  if (process.env.JUDGE) {
    const j = await page.evaluate(() => { const o = {}; const before = TOWNS.list.map(s => s.dead); const judged = TOWNS.cur; G.dev.sin = 50; devJudge('firestorm'); let n = 0; while (!G.dev.done && n++ < 400) { for (let i = 0; i < 24; i++) gameStep(0.1); }
      o.judgedDone = G.dev.done; o.dead = TOWNS.list.map(s => s.dead); o.paused = G.paused; o.reckon = document.getElementById('reckon').innerText.replace(/\n+/g, ' | ').slice(-120);
      o.otherPopBefore = TOWNS.list.map((s, i) => i === TOWNS.cur ? popN() : s.st.vill.length); for (let i = 0; i < 24 * 10; i++) gameStep(0.1); o.otherPopAfter = TOWNS.list.map((s, i) => i === TOWNS.cur ? popN() : s.st.vill.length);
      document.getElementById('rkNext').click(); o.viewAfter = [TOWNS.cur, G.town]; o.tabs = document.getElementById('gTowns').innerText.replace(/\n/g, ' | ');
      const run = (d) => { for (let i = 0; i < d * 240; i++) gameStep(0.1); }; for (let d = 0; d < 45; d++) { eachSettlement(() => { G.food = Math.max(G.food, popN() * 6 + 40); G.hap = Math.max(G.hap, 58); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; }); run(1); }
      o.afterRefound = [TOWNS.list.length, TOWNS.list.map(s => s.dead), TOWNS.list.map((s, i) => sName(i))]; return o; });
    console.log('JUDGE', JSON.stringify(j));
  }
  if (shot) { await page.evaluate(() => { document.getElementById('ghelp').classList.add('hidden'); PAUSED = false; G.paused = true; if (TOWNS.list.length > 1) viewSettlement(1, true); cam.dist = 90; cam.pitch = .55; }); await page.waitForTimeout(9000); await page.screenshot({ path: shot, timeout: 120000 }); }
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS'); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
