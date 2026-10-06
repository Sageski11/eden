// Overlays test (js/overlays.js): grows towns, screenshots every overlay, the Why? panel (starved vs healthy town), market stalls / carts at close zoom,
// and profiles frame cost with an overlay on. Heavy: run under the team lock, e.g.
//   flock -w 1500 /tmp/hm.lock nice -n 10 timeout 580 node tools/overlaytest.js make        (grow Medieval + Modern towns -> OUT/state-3.json, state-6.json)
//   flock ... node tools/overlaytest.js shots   (STAGE=3|6)                                  (one screenshot per overlay + panels)
//   flock ... node tools/overlaytest.js why                                                  (starved vs healthy diagnostics, screenshots + JSON)
//   flock ... node tools/overlaytest.js eco                                                  (stalls, carts, caravans, docks at close zoom)
//   flock ... node tools/overlaytest.js perf                                                 (frame cost with overlay off / on)
// env: OUT (default /tmp/overlays), SEED (5), STAGE (3), DAYS (per era while growing, default 12), WORLD, STAGES (make/eco: e.g. 3,6), W/H (viewport),
//      shots: MODES (overlays to shoot, default all seven), SUBS (service sub-views, 0 = none), PANELS=0 (skip Why?/Edicts/names shots), MX/MY (pointer for the hover readout).
// The software renderer is slow: on a busy machine split `shots` over several runs (e.g. MODES=svc,hap,poll,traf SUBS=0 PANELS=0, then the rest) so each stays under 580 s.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || '/tmp/overlays', SEED = +(process.env.SEED || 5), WORLD = process.env.WORLD || 'river', DAYS = +(process.env.DAYS || 12);
const MODE = process.argv[2] || 'shots', STAGE = +(process.env.STAGE || 3);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.W || 1200), height: +(process.env.H || 760) } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript((seed) => { let a = seed; window.__seed = (n) => { a = n; }; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve(__dirname, '../Eden.html')); await page.waitForTimeout(2500);

  const frames = async (n) => { await page.evaluate((n) => new Promise(r => { let k = 0; const f = () => { if (++k >= n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n); };
  // freeze the sim but keep rendering: frames still draw, time is pinned for reproducible shots
  const freeze = async (cam) => {
    await page.evaluate((c) => {
      PAUSED = false; G.paused = true; document.getElementById('ghelp') && document.getElementById('ghelp').classList.add('hidden');
      HM.fixDt = 0.016; HM.fixT = 100; setTime(14.2); if (c) { Object.assign(cam0(), c); }
    }, cam || null);
  };
  await page.evaluate(() => { window.cam0 = () => cam; });
  const shot = async (name, clip) => { await frames(3); await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 120000 }); console.log('shot', name); };
  const camTo = (x, z, dist, pitch, yaw) => page.evaluate(([x, z, d, p, y]) => { cam.tx = x; cam.tz = z; cam.dist = d; cam.pitch = p; cam.yaw = y; }, [x, z, dist, pitch, yaw]);

  if (MODE === 'make') {
    await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
    await page.evaluate(([w, sd]) => { setupWorld = w; setupSeed = sd; document.getElementById('setupGo').click(); }, [WORLD, SEED]); await page.waitForTimeout(2000);
    await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      PAUSED = true; checkEra = function () { };
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
    });
    const stages = (process.env.STAGES || '3,6').split(',').map(Number);
    for (const stage of stages) {
      for (let guard = 0; guard < 400; guard++) {
        const r = await page.evaluate(([stage, DAYS]) => {
          if (G.era < stage) { const d0 = window.__eraDay || 0; if (dayN() - d0 >= DAYS || G.era === 0) { G.era++; window.__eraDay = dayN(); G.unl.steam = true; if (G.era >= 6) G.unl.electric = true; if (G.era >= 7) G.unl.computing = true; G.sk.machine = 800; G.sk.science = 800; if (typeof eraAdvanced === 'function') eraAdvanced(); } }
          __day(); return { era: G.era, day: dayN(), pop: popN() };
        }, [stage, DAYS]);
        if (r.era >= stage && r.day - (await page.evaluate(() => window.__eraDay || 0)) >= DAYS + 6) break;
        if (errs.length) break;
      }
      const s = await page.evaluate(() => { for (let i = 0; i < 10; i++) __day(); return serializeGod(); });
      fs.writeFileSync(path.join(OUT, `state-${stage}.json`), s);
      console.log('saved stage', stage, await page.evaluate(() => ({ era: G.era, pop: popN(), b: buildings.length, day: dayN() })));
    }
    console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close(); return;
  }

  // ---- the other modes start from a saved town
  const load = async (stage) => {
    const s = fs.readFileSync(path.join(OUT, `state-${stage}.json`), 'utf8');
    await page.evaluate((s) => { __seed(7); loadGod(s); __seed(8); document.body.classList.remove('photo'); }, s);
    await page.waitForTimeout(1200);
    await freeze();
    await page.evaluate(() => { for (const v of allVill()) { v._lod = 0; } });
  };

  if (MODE === 'shots') {
    await load(STAGE);
    const c = await page.evaluate(() => ({ x: G.center.x, z: G.center.z, era: G.era, pop: popN(), b: buildings.length, plan: G.plan && G.plan.tpl }));
    console.log('town', JSON.stringify(c));
    await camTo(c.x, c.z, 120, .95, .6);
    await shot(`s${STAGE}-00-plain`);
    for (const m of (process.env.MODES || 'svc,hap,poll,traf,land,dist,plan').split(',')) {
      const d0 = await page.evaluate(() => ovState.done || 0);
      await page.evaluate((m) => { ovSetOverlay(m); }, m);
      for (let i = 0; i < 80; i++) { if ((await page.evaluate(() => ovState.done || 0)) > d0) break; await page.waitForTimeout(400); }
      // park the pointer over the town so the hover readout shows
      await page.mouse.move(+(process.env.MX || 640), +(process.env.MY || 330)); await frames(3);
      await shot(`s${STAGE}-${m}`);
      const t = await page.evaluate(() => { const t = document.getElementById('ovTip'); return t.classList.contains('hidden') ? '' : t.innerText; });
      console.log(m, 'tip:', t.replace(/\n+/g, ' | ').slice(0, 220));
    }
    if (process.env.SUBS !== '0') {
      await page.evaluate(() => { ovSetOverlay('svc'); });
      for (const sub of (process.env.SUBS || 'water,health').split(',')) {
        const d0 = await page.evaluate(() => ovState.done || 0);
        await page.evaluate((s) => { ovState.sub = s; ovState.force = true; ovState.job = null; }, sub);
        for (let i = 0; i < 80; i++) { if ((await page.evaluate(() => ovState.done || 0)) > d0) break; await page.waitForTimeout(400); }
        await shot(`s${STAGE}-svc-${sub}`);
      }
    }
    await page.evaluate(() => { ovSetOverlay(null); });
    if (process.env.PANELS !== '0') {
      // the diagnostics panel, the edicts panel and the district names
      await page.evaluate(() => { ovTool('o:why'); }); await page.waitForTimeout(1600); await shot(`s${STAGE}-why`);
      await page.evaluate(() => { ovTool('o:law'); }); await page.waitForTimeout(900); await shot(`s${STAGE}-law`);
      await page.evaluate(() => { ovTool('o:law'); });
      await camTo(c.x, c.z, 150, .8, .5); await frames(4); await shot(`s${STAGE}-names`);
    }
    console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close(); return;
  }

  if (MODE === 'why') {
    await load(STAGE);
    const out = {};
    await page.evaluate(() => { for (let i = 0; i < 240; i++) gameStep(0.1); }); // a day of ordinary life so that old bot-made stalls clear
    out.healthy = await page.evaluate(() => ovWhy().map(x => `${x.sev} ${x.title} — ${x.why} | ${x.act}`));
    await page.evaluate(() => { ovTool('o:why'); }); await page.waitForTimeout(1500); await shot(`why-healthy`);
    await page.evaluate(() => { ovTool('o:why'); });
    // a deliberately starved town: no quarry, no stone, sites that need stone, little food, no free homes
    await page.evaluate(() => {
      for (const q of buildings.filter(b => b.type === 'quarry' || b.type === 'mason').slice()) removeBuilding(q);
      G.stone = 0; G.food = Math.floor(popN() * 1.2); G.wood = 6; G.noTrees = true; G.failCool.quarry = G.t + 30; G.siteFail = { type: 'house', since: G.t - 20 };
      gridDirty = true; assignHomes(); assignJobs();
      const h = buildings.find(b => b.type === 'church' && !b.build); if (h) { h.build = { need: { wood: 20, stone: 40 }, have: { wood: 2, stone: 0 }, inb: { wood: 0, stone: 0 }, work: 20, done: 3, blessed: false, _idle: 8 }; realize(h); }
      for (let i = 0; i < 6; i++) gameStep(0.1);
    });
    out.starved = await page.evaluate(() => ovWhy().map(x => `${x.sev} ${x.title} — ${x.why} | ${x.act}`));
    await page.evaluate(() => { ovTool('o:why'); }); await page.waitForTimeout(1600); await shot(`why-starved`);
    // the inspector line for the stalled site
    await page.evaluate(() => { ovTool('o:why'); const b = buildings.find(b => b.build); if (b) { selected = b; showInspector(); } });
    await page.waitForTimeout(500); await shot(`why-inspector`);
    console.log(JSON.stringify(out, null, 1)); console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close(); return;
  }

  if (MODE === 'eco') {
    for (const stage of (process.env.STAGES || String(STAGE)).split(',').map(Number)) {
      await load(stage);
      await page.evaluate(() => { if (!built('market')[0]) { const s = findSite({ type: 'market' }); if (s) { const b = startSite('market', s.x, s.z, 0); completeSite(b); } } }); // the planner's towns often have no market yet
      const c = await page.evaluate(() => { const m = built('market')[0] || built('fishmkt')[0] || G.center; return { x: m.x, z: m.z, mk: !!built('market')[0], era: G.era, dock: !!built('dock')[0] }; });
      console.log('eco town', JSON.stringify(c));
      // let the economy visuals appear: run the (unfrozen) sim a little at normal speed, daytime
      await page.evaluate(() => { G.t = Math.floor(G.t / 24) * 24 + 10; G.paused = false; PAUSED = false; G.speed = 3; HM.fixT = null; HM.fixDt = null; });
      await camTo(c.x, c.z, 46, .62, .7);
      for (let i = 0; i < 6; i++) { await page.waitForTimeout(1500); await frames(6); }
      await shot(`eco${stage}-market`);
      const st = await page.evaluate(() => ({ runs: ovEco.runs.length, hauls: ovEco.hauls.size, cars: ovEco.cars.size, mk: [...ovEco.mk.values()].map(r => r.stalls.length), dk: ovEco.dk.size }));
      console.log('eco state', JSON.stringify(st));
      await camTo(c.x + 14, c.z + 12, 34, .5, 2.2); await frames(6); await shot(`eco${stage}-market2`);
      // a hand-cart on a builder's walk, if any, and a wagon on the road
      const w = await page.evaluate(() => { const h = [...ovEco.hauls.values()].find(h => h.mesh && h.mesh.visible); if (h) return { x: h.v.x, z: h.v.z, k: 'haul' }; const r = ovEco.runs[0]; return r ? { x: r.x, z: r.z, k: 'run' } : null; });
      console.log('cart at', JSON.stringify(w));
      if (w) { await camTo(w.x, w.z, 26, .5, 1.0); await frames(8); await shot(`eco${stage}-cart-${w.k}`); }
      // force a wagon between the first source and the hall
      const f = await page.evaluate(() => { const src = buildings.find(b => !b.build && (b.type === 'quarry' || (b.type === 'camp' && b.variant === 'lumber') || b.type === 'farm')); if (!src || !G.center) return null; G.paused = true; const ok = ovHaul(src, G.center, 'wood'); return { ok, x: src.x, z: src.z, t: src.type }; });
      console.log('forced haul', JSON.stringify(f));
      if (f) { await camTo(f.x, f.z, 40, .6, .9); await page.evaluate(() => { G.paused = false; }); await page.waitForTimeout(2500); await frames(5); await shot(`eco${stage}-wagon`); }
      const dk = await page.evaluate(() => { const d = built('dock')[0]; return d ? { x: d.x, z: d.z } : null; });
      if (dk) { await camTo(dk.x, dk.z, 36, .55, 1.6); await page.waitForTimeout(2500); await frames(5); await shot(`eco${stage}-dock`); }
    }
    console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close(); return;
  }

  if (MODE === 'perf') {
    await load(STAGE);
    const c = await page.evaluate(() => ({ x: G.center.x, z: G.center.z }));
    await camTo(c.x, c.z, 110, .9, .6);
    await page.evaluate(() => { G.paused = false; PAUSED = false; HM.fixDt = 1 / 60; HM.fixT = null; G.speed = 1; });
    const measure = async (label, setup, arg) => {
      await page.evaluate(setup, arg); await page.waitForTimeout(3000);
      await page.evaluate(() => { HM.prof(); ovState.max = 0; }); await page.waitForTimeout(6000);
      const p = await page.evaluate(() => ({ prof: HM.prof(), ov: +ovState.ms.toFixed(3), ovMax: +ovState.max.toFixed(2) }));
      console.log(label.padEnd(26), 'main frame:', JSON.stringify(p.prof), '| overlays.js tick avg', p.ov, 'ms, worst', p.ovMax, 'ms');
    };
    await measure('economy visuals off', () => { ovSetOverlay(null); ovEco.on = false; });
    await measure('economy visuals on', () => { ovEco.on = true; });
    for (const m of ['svc', 'hap', 'poll', 'traf', 'land', 'dist', 'plan']) await measure('overlay ' + m, (m) => { ovSetOverlay(m); }, m);
    console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close(); return;
  }
})().catch(e => { console.error(e); process.exit(1); });
