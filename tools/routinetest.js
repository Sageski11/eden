// Routines / appearance test: grows a town with the bot, then stages the day (dawn, noon, evening, night), weather, ages, a festival and a funeral,
// takes screenshots under /tmp/routines/ and counts how the folk spend their free time.
// usage: node tools/routinetest.js   (env: SEED=3, DAYS=60, ERAS="3,7", OUT=/tmp/routines, SHOTS=0 to skip pictures, TALLY=days,
//        ONLY=dawn,noon,... picks pictures (chat bench dawn noon evening night rain snow sunday church festival funeral rainbow miracle),
//        STATE=file.json to reuse a grown town (written after growth; GROW=1 grows it further, GDAYS=days of growth))
// Run heavy under the lock:  flock -w 1500 /tmp/hm.lock nice -n 10 timeout 580 node tools/routinetest.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const SEED = +(process.env.SEED || 3), DAYS = +(process.env.DAYS || 60), OUT = process.env.OUT || '/tmp/routines';
  const ERAS = (process.env.ERAS || '3,7').split(',').map(Number), SHOTS = process.env.SHOTS !== '0';
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  const STATE = process.env.STATE || '';   // STATE=/tmp/routines/state.json: reuse a grown town (written after the first growth)
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  const haveState = STATE && fs.existsSync(STATE);
  if (haveState) await page.evaluate((st) => { loadGod(st); PAUSED = true; }, fs.readFileSync(STATE, 'utf8'));
  else {
    await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
    await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
    await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
    await page.waitForTimeout(800);
  }
  await page.evaluate(() => {
    PAUSED = true;
    window.__day = (jump, pop) => {
      G.food = Math.max(G.food, popN() * 6 + 40); G.faith = Math.max(G.faith, 200); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58);
      G.wood = Math.max(G.wood, 120); G.stone = Math.max(G.stone, 120); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.sad = Math.min(G.sad, 3); G.dev.doubt = Math.min(G.dev.doubt, 12);
      for (const v of G.vill) if (v.sick && Math.random() < .5) v.sick = 0;
      for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
      if (jump && dayN() >= 20 && G.era < jump) { G.era = jump; G.unl.steam = true; if (jump >= 6) G.unl.electric = true; if (jump >= 7) G.unl.computing = true; G.sk.machine = 800; G.sk.science = 800; }
      for (const k in G.sk) G.sk[k] = Math.max(G.sk[k], 700); checkUnlocks(); if (popN() < pop && G.center && !G.center.build && dayN() % 2 === 0) arriveFamily(3);
      for (let i = 0; i < 240; i++) gameStep(0.1);
    };
    window.__focus = (dist, pitch, yaw, ox, oz, what) => {
      let c = (G.plan && G.plan.plaza) || G.center, x = c.x, z = c.z, n = 0, sx = 0, sz = 0;
      if (what) { const t = G.vill.find(v => !v.hidden && v.anim === what && (v._lod || 0) === 0); if (t) { cam.tx = t.x; cam.tz = t.z; cam.ty = hAt(t.x, t.z); cam.dist = dist || 11; cam.pitch = pitch || .35; if (yaw != null) cam.yaw = yaw; cam.vx = cam.vz = 0; return; } }
      for (const v of G.vill) if (!v.hidden && Math.hypot(v.x - c.x, v.z - c.z) < 34) { sx += v.x; sz += v.z; n++; }
      if (n > 4) { x = sx / n; z = sz / n; let bd = 1e9, bv = null; for (const v of G.vill) if (!v.hidden && !v.path && (v._lod || 0) === 0) { const d = Math.hypot(v.x - x, v.z - z); if (d < bd) { bd = d; bv = v; } } if (bv) { x = bv.x; z = bv.z; } }
      cam.tx = x + (ox || 0); cam.tz = z + (oz || 0); cam.ty = hAt(cam.tx, cam.tz); cam.dist = dist || 30; cam.pitch = pitch || .55; if (yaw != null) cam.yaw = yaw; cam.vx = cam.vz = 0;
    };
    // run the game to hour h of the current (or next) day with the camera fixed so folk near it are fully simulated
    window.__to = (h, extra) => { const d = dayN(); let t = d * 24 + h; if (t < G.t) t += 24; G.t = Math.max(G.t, t - (extra || 3)); let n = 0; while (G.t < t && n++ < 400) gameStep(0.05); };
    window.__quiet = () => { document.getElementById('ghelp') && document.getElementById('ghelp').classList.add('hidden'); document.body.classList.add('photo'); if (!window.__qs) { window.__qs = 1; const st = document.createElement('style'); st.textContent = '#banner,#hint,#toast,#gtop,#tools,#insp,#prayers,#help{display:none!important}'; document.head.appendChild(st); } };
  });
  let report = {};
  for (const era of ERAS) {
    const pop = era >= 6 ? 330 : era >= 4 ? 130 : 70;
    const jump = era;
    // grow
    const days = +(process.env.GDAYS || (era >= 6 ? DAYS * 2 : DAYS));
    if (!haveState || process.env.GROW) for (let d = 0; d < days; d += 10) { await page.evaluate(([j, p]) => { for (let i = 0; i < 10; i++) __day(j, p); }, [jump, pop]); if (errs.length) break; }
    if (STATE && (!haveState || process.env.GROW)) fs.writeFileSync(STATE, await page.evaluate(() => serializeGod()));
    const st = await page.evaluate(() => ({ day: dayN(), era: ERAS[G.era].name, pop: popN(), b: buildings.length, season: SEASONS[seasonN()] }));
    console.log('ERA', era, JSON.stringify(st));
    // leisure tally over several days
    await page.evaluate(() => { RT.stat = {}; RT.chats = 0; __focus(40, .6); });
    const tallyDays = +(process.env.TALLY || 3);
    for (let d = 0; d < tallyDays; d++) await page.evaluate(() => { __day(0, 0); });
    const stat = await page.evaluate(() => ({ stat: RT.stat, chats: RT.chats, benches: [...RT.sc.values()].map(c => c.ben.length), lod: LOD.n }));
    console.log('TALLY era', era, JSON.stringify(stat));
    report[era] = stat;
    if (!SHOTS) continue;
    const shot = async (name, o = {}) => {
      await page.evaluate(([o]) => { __focus(o.dist || 13, o.pitch || .4, o.yaw, o.ox, o.oz, o.what); __quiet(); HM.fixT = 3.3; G.paused = true; PAUSED = false; }, [o]);
      await page.waitForTimeout(+(process.env.SETTLE || 3500)); await page.screenshot({ path: `${OUT}/e${era}_${name}.png`, timeout: 180000 });
      const v = await page.evaluate(() => { const o = {}; for (const x of G.vill) { if (x._lod === 0 && !x.hidden) o[x.anim] = (o[x.anim] || 0) + 1; } return o; }); console.log('SHOT', name, JSON.stringify(v));
      await page.evaluate(() => { PAUSED = true; });
    };
    const at = async (name, h, pre, o) => {
      if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return; await page.evaluate(([h, pre]) => { eval(pre || ''); __focus(30, .5); __to(h, 3); G.paused = true; }, [h, pre || '']); await shot(name, o); };
    await page.evaluate(() => { G.rain = 0; G.snow = 0; G.storm = 0; });
    await at('chat', 18.0, '', { what: 'talk', dist: 11 }); await at('bench', 15.0, '', { what: 'sit', dist: 11 });
    await at('dawn', 6.5); await at('noon', 12.4); await at('evening', 17.2); await at('night', 20.8);
    await at('rain', 15.5, 'G.rain=12;G.rainI=1.5;'); 
    await at('snow', 15.5, 'G.rain=0;G.snow=24;G.t=(dayN()-dayN()%20+15)*24+G.t%24;');
    await page.evaluate(() => { G.snow = 0; G.rain = 0; });
    await at('sunday', 13.5, 'G.t=(dayN()-dayN()%7+6)*24+10;');
    await at('church', 7.75, 'G.t=(dayN()-dayN()%7+13)*24+5;');
    // festival and funeral staged through the hooks
    await at('festival', 15.0, 'startFestival(14,"cast");');
    await page.evaluate(() => { G.festival = 0; });
    await at('funeral', 15.5, `{const v=G.vill.filter(x=>x.age>20).slice(0,8);const ids=v.map(x=>x.id);storyEvent('funeral',{who:ids,txt:'A funeral.',big:true});}`);
    await at('rainbow', 17.0, 'G.rain=0;G.rainbow=10;');
    await at('miracle', 16.0, 'G.rainbow=0;storyEvent("miracle",{who:[],txt:"A sign in the sky.",big:true});');
    console.log('ERRS so far', errs.length);
  }
  fs.writeFileSync(OUT + '/report.json', JSON.stringify(report, null, 1));
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
