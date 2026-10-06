// Layout / era-renewal test: grows a town to several ages with a "competent player" bot and checks that
//  - no building older than the allowed age for the current era stands after a few days in the new age
//  - the town has a plan (streets, plots, template) and the buildings sit on it
// usage: SEED=5 WORLD=river STAGES=3,7 SHOT=dir node tools/layouttest.js
//   STAGES: eras to stop at (default 3,7). SHOT: directory for top-down screenshots (optional). DAYS: days spent per era (default 14).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const SEED = +(process.env.SEED || 5), WORLD = process.env.WORLD || 'river', STAGES = (process.env.STAGES || '3,7').split(',').map(Number);
  const SHOT = process.env.SHOT || '', DAYS = +(process.env.DAYS || 14), EXTRA = +(process.env.EXTRA || 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve(__dirname, '../Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(([w, sd]) => { setupWorld = w; setupSeed = sd; document.getElementById('setupGo').click(); }, [WORLD, SEED]); await page.waitForTimeout(2000);
  await page.evaluate((t) => { window.LY_FORCE = t; [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); }, process.env.TPL || '');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    PAUSED = true; checkEra = function () { }; // the test moves the ages itself
    window.__day = () => {
      G.food = Math.max(G.food, popN() * 6 + 40); G.faith = Math.max(G.faith, 200); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58);
      G.wood = Math.max(G.wood, 260); G.stone = Math.max(G.stone, G.era >= 5 ? 700 : 200); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.sad = Math.min(G.sad, 3);
      if (G.dev) G.dev.doubt = Math.min(G.dev.doubt, 12);
      for (const v of G.vill) if (v.sick && Math.random() < .5) v.sick = 0;
      for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
      for (const k in G.sk) G.sk[k] = Math.max(G.sk[k], 700); if (G.era >= 4) { G.sk.machine = Math.max(G.sk.machine || 0, 700); G.sk.science = Math.max(G.sk.science || 0, 700); } checkUnlocks();
      const want = [20, 40, 70, 110, 170, 260, 400, 560][G.era] || 560;
      if (popN() < want && G.center && !G.center.build && dayN() % 2 === 0) arriveFamily(3);
      for (let i = 0; i < 240; i++) gameStep(0.1);
    };
    window.__ageCheck = () => {
      const bad = {}, all = {}, pend = {}; let n = 0;
      for (const b of buildings) { const a = bAge(b); const k = b.type + (b.level != null ? 'L' + b.level : ''); all[k] = (all[k] || 0) + 1; n++;
        const min = minAgeFor(b, G.era); if (a < min) { if (b.upg) { pend[k] = (pend[k] || 0) + 1; } else bad[k + '@' + a] = (bad[k + '@' + a] || 0) + 1; } }
      return { era: G.era, n, bad, all, pend };
    };
  });
  if (process.env.PLANONLY) { const r = await page.evaluate(() => ({ tpl: G.plan.tpl, plots: G.plan.plots.length, streets: G.plan.streets.length, slope: G.plan.slope })); console.log('PLAN', WORLD, SEED, JSON.stringify(r)); if (SHOT) { const url = await page.evaluate(() => __planmap(G.center.x, G.center.z, 110)); require('fs').writeFileSync(path.join(SHOT, `plan-${WORLD}-${SEED}-${r.tpl}.png`), Buffer.from(url.split(',')[1], 'base64')); } await browser.close(); process.exit(0); }
  let failed = false;
  for (const stage of STAGES) {
    // advance one era at a time (forced), giving the folk DAYS days per era
    for (let guard = 0; guard < 400; guard++) {
      const r = await page.evaluate(([stage, DAYS]) => {
        if (G.era < stage) { const nxt = G.era + 1; const d0 = window.__eraDay || 0; if (dayN() - d0 >= DAYS || G.era === 0) { G.era = nxt; window.__eraDay = dayN(); G.unl.steam = true; if (G.era >= 6) G.unl.electric = true; if (G.era >= 7) G.unl.computing = true; G.sk.machine = 800; G.sk.science = 800; chron('[test] age -> ' + ERAS[G.era].name); if (typeof eraAdvanced === 'function') eraAdvanced(); } }
        __day(); return { era: G.era, day: dayN(), pop: popN() };
      }, [stage, DAYS]);
      if (r.era >= stage && r.day - (await page.evaluate(() => window.__eraDay || 0)) >= DAYS + EXTRA) break;
      if (errs.length) break;
    }
    const c = await page.evaluate(() => { const o = __ageCheck(); o.plan = G.plan ? { tpl: G.plan.tpl, streets: G.plan.streets.length, plots: G.plan.plots.length } : null; o.pop = popN(); o.day = dayN(); o.poll = Math.round(G.poll || 0); o.sites = buildings.filter(b => b.build || b.upg).length; o.works = G.chron.filter(c => /terrace|levelled|shallows|elders|new plan|pulled down|rebuild the/i.test(c.t)).slice(0, 8).map(c => c.t.slice(0, 110)); o.graded = G.plan && G.plan.nGr; o.paved = G.net && G.net.paved; o.lines = G.net ? G.net.lines.map(l => l.kind).join() : ''; return o; });
    console.log('STAGE', stage, JSON.stringify({ era: c.era, pop: c.pop, n: c.n, plan: c.plan, sites: c.sites }), '\n  types', JSON.stringify(c.all), '\n  OBSOLETE', JSON.stringify(c.bad), ' (rebuilding: ' + JSON.stringify(c.pend) + ')', '\n  works', JSON.stringify(c.works), 'graded', c.graded, 'paved', c.paved, 'lines', c.lines);
    if (Object.keys(c.bad).length) failed = true;
    if (SHOT) {
      { const url = await page.evaluate(() => __planmap(G.center.x, G.center.z, 110)); require('fs').writeFileSync(path.join(SHOT, `map-${WORLD}-${SEED}-era${stage}.png`), Buffer.from(url.split(',')[1], 'base64')); }
      await page.evaluate(() => { document.getElementById('ghelp').classList.add('hidden'); document.body.classList.add('photo'); SNOWF = 0; G.snow = 0; recolorAll(); cam.tx = G.center.x; cam.tz = G.center.z; cam.dist = +(window.__shotDist || 150); cam.pitch = 1.45; cam.yaw = 0; setTime(12); PAUSED = false; G.paused = true; });
      await page.waitForTimeout(9000);
      await page.screenshot({ path: path.join(SHOT, `${WORLD}-${SEED}-era${stage}.png`), timeout: 120000 });
      await page.evaluate(() => { PAUSED = true; G.paused = false; document.body.classList.remove('photo'); });
    }
  }
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length || failed ? 1 : 0);
})();
