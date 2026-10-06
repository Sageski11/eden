// Culture test: a long game with two peoples, a staged miracle, fire and raid; screenshots of the story feed, person page,
// Chronicle with a legend, place labels in photo mode and a festival. Reports story/legend/place/custom/hero counts and errors.
// usage: node tools/culturetest.js [days=200] [outDir=/tmp/culture] ; env SEED
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const days = +(process.argv[2] || 200), out = process.argv[3] || '/tmp/culture', SEED = +(process.env.SEED || 7);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    PAUSED = true; window.__stage = {};
    window.__day = (opts) => {
      opts = opts || {};
      eachSettlement(() => { G.food = Math.max(G.food, popN() * 6 + 40); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58); G.wood = Math.max(G.wood, 120); G.stone = Math.max(G.stone, 120);
        if (!opts.raid) { G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; } G.sad = Math.min(G.sad, 3); G.faith = Math.max(G.faith, 300);
        if (G.dev) G.dev.doubt = Math.min(G.dev.doubt, 14);
        for (const v of G.vill) if (v.sick && Math.random() < .5) v.sick = 0; for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
        for (const k in G.sk) G.sk[k] = Math.max(G.sk[k], 500); checkUnlocks();
        if (popN() < 150 && G.center && !G.center.build && dayN() % 2 === 0) arriveFamily(3); });
      for (let i = 0; i < 240; i++) gameStep(0.1);
    };
  });
  const log = [];
  if (process.env.LOAD) {
    await page.evaluate((str) => { loadGod(str); PAUSED = true; }, fs.readFileSync(process.env.LOAD, 'utf8'));
    console.log('loaded', process.env.LOAD, JSON.stringify(await page.evaluate(() => TOWNS.list.map((t, i) => { const c = sGet(i, 'cu') || {}; return { legends: (c.legends || []).length, places: (c.places || []).length, heroes: (c.heroes || []).length, customs: Object.keys(c.customs || {}).length, ages: (c.ages || []).length, story: (sGet(i, 'story') || []).length }; }))));
    await page.evaluate(() => { for (let i = 0; i < 5; i++) gameStep(0.1); });
  }
  const run = async (n) => { await page.evaluate((n) => { for (let i = 0; i < n; i++) __day(); }, n); };
  // 1. early game
  if (!process.env.LOAD) {
  await run(25);
  // staged miracles: a drought broken by rain, a house fire quenched by blessing, a healing, sunshine
  const st1 = await page.evaluate(() => {
    G.drought = true; G.faith = 500; castPower('p:rain'); for (let i = 0; i < 120; i++) gameStep(0.1);
    const h = buildings.find(b => b.type === 'house' && !b.build); if (h) { ignite(h, 'A fire broke out at the ' + h.info.name + '.'); hoverB = h; const pt = tool; tool = 'bless'; godClick({}); tool = pt; }
    for (const v of G.vill.slice(0, 4)) v.sick = 1; castPower('p:heal'); G.faith = 500; castPower('p:harvest');
    for (let i = 0; i < 24 * 4 * 10; i++) gameStep(0.1);
    return { legends: G.cu && G.cu.legends.map(l => l.title) };
  });
  console.log('MIRACLES', JSON.stringify(st1));
  await run(60);
  // 2. a raid (needs the Iron Age) -- let the guards fight
  const eras = await page.evaluate(() => ({ era: G.era, day: dayN(), pop: popN(), guards: G.vill.filter(v => v.job === 'guard').length }));
  console.log('BEFORE RAID', JSON.stringify(eras));
  const raid = await page.evaluate(() => { if ((G.era || 0) < 2) G.era = 2; G.raidCool = 0; scheduleRaid(); G.raid.at = G.t + 1; G.raid.size = 5; return { size: G.raid.size, guards: G.vill.filter(v => v.job === 'guard').length }; });
  console.log('RAID', JSON.stringify(raid));
  for (let d = 0; d < 3; d++) await page.evaluate(() => { __day({ raid: true }); });
  await page.evaluate(() => { for (let i = 0; i < 240 * 2; i++) gameStep(0.1); });
  const rr = await page.evaluate(() => ({ raid: G.raid && { over: G.raid.over, losses: G.raid.losses }, heroes: (G.cu.heroes || []).map(h => h.kind + ':' + h.name) }));
  console.log('RAID RESULT', JSON.stringify(rr));
  }
  // 3. the long game, with a second people
  for (let d = 0; d < days - 90 && !process.env.LOAD; d += 10) {
    const r = await page.evaluate(() => { for (let i = 0; i < 10; i++) __day(); return { day: dayN(), n: TOWNS.list.length, era: TOWNS.list.map((s, i) => ERAS[sGet(i, 'era')].name) }; });
    if (d % 40 === 0) console.log(JSON.stringify(r));
    if (errs.length) break;
  }
  const sum = await page.evaluate(() => TOWNS.list.map((s, i) => { const c = sGet(i, 'cu') || {}; const story = sGet(i, 'story') || []; const kinds = {}; story.forEach(e => kinds[e.k] = (kinds[e.k] || 0) + 1);
    return { town: sName(i), era: ERAS[sGet(i, 'era')].name, pop: (i === TOWNS.cur ? G.vill : sGet(i, 'vill')).length, ident: c.ident && c.ident.nm, legends: (c.legends || []).map(l => `${l.title} [stage ${l.stage}${l.sk ? ', skeptic' : ''}]`), places: (c.places || []).map(p => p.name),
      customs: Object.keys(c.customs || {}).map(k => k + ' x' + c.customs[k].n), heroes: (c.heroes || []).map(h => `${h.kind}:${h.name}${h.x != null ? ' (monument)' : ''}`), ages: (c.ages || []).map(a => a.name), story: story.length, kinds }; }));
  for (const s of sum) console.log('TOWN', JSON.stringify(s, null, 1));
  fs.writeFileSync(path.join(out, 'state.json'), await page.evaluate(() => serializeGod()));
  if (process.env.NOSHOTS) { console.log(errs.length ? errs.slice(0, 8).join('\n') : 'NO ERRORS'); await browser.close(); process.exit(errs.length ? 1 : 0); }
  // 4. screenshots
  const shot = async (name, ms) => { await page.waitForTimeout(ms || 1500); await page.screenshot({ path: path.join(out, name), timeout: 180000 }); console.log('shot', name); };
  await page.evaluate(() => { PAUSED = false; G.paused = true; document.getElementById('ghelp').classList.add('hidden'); setTool && setTool('inspect'); updateUI(true); });
  // feed
  await page.evaluate(() => { cuToggleFeed(true); cam.dist = 90; cam.pitch = .7; });
  await shot('feed.png', 4000);
  // person page: follow someone with a family
  const who = await page.evaluate(() => { const v = G.vill.filter(o => o.age > 20 && o.spouse).sort((a, b) => storyOf(b.id).length - storyOf(a.id).length)[0] || G.vill[3]; cuFollow(v.id); cam.dist = 26; return v.name + ' ' + v.fam; });
  console.log('following', who);
  await shot('person.png', 4000);
  // street-level walk mode
  await page.evaluate(() => { cuToggleFeed(false); HM.fixDt = .3; cuToggleWalk(true); });
  await shot('walk.png', 5000);
  await page.evaluate(() => { HM.fixDt = 0; });
  await page.evaluate(() => { cuToggleWalk(false); G.follow = null; godInspector(); });
  // chronicle with a legend
  await page.evaluate(() => { toggleChron(); document.querySelector('#cuTabs button[data-t="legends"]').click(); });
  await shot('chronicle_legends.png', 2500);
  await page.evaluate(() => { document.querySelector('#cuTabs button[data-t="ages"]').click(); });
  await shot('chronicle_ages.png', 1500);
  await page.evaluate(() => { document.querySelector('#cuTabs button[data-t="names"]').click(); });
  await shot('chronicle_names.png', 1500);
  await page.evaluate(() => { toggleChron(); });
  // photo mode with place labels, looking at the hearth
  await page.evaluate(() => { const c = G.cu.places.find(p => p.k === 'hearth') || { x: G.center.x, z: G.center.z }; cam.tx = c.x; cam.tz = c.z; cam.dist = 95; cam.pitch = .55; togglePhoto(); });
  await shot('photo_labels.png', 4000);
  await page.evaluate(() => { togglePhoto(); });
  // hover tooltip over a named place
  const tp = await page.evaluate(() => { const p = G.cu.places.find(q => q.k === 'hearth') || G.cu.places[0]; if (!p) return null; cam.tx = p.x; cam.tz = p.z; cam.dist = 60; cam.pitch = .6; return { name: p.name, x: p.x, z: p.z }; });
  if (tp) { await page.waitForTimeout(1500); const sc = await page.evaluate((p) => { const v = new THREE.Vector3(p.x, hAt(p.x, p.z), p.z).project(camera); return { x: (v.x * .5 + .5) * innerWidth, y: (-v.y * .5 + .5) * innerHeight }; }, tp);
    await page.mouse.move(sc.x, sc.y); await page.waitForTimeout(800); await page.mouse.move(sc.x + 2, sc.y + 1); console.log('tooltip for', tp.name, await page.evaluate(() => document.getElementById('cuTip').style.display + ' ' + document.getElementById('cuTip').textContent.slice(0, 60))); await shot('tooltip.png', 1200); }
  // a monument close up, if any
  const mon = await page.evaluate(() => { const h = G.cu.heroes.find(x => x.x != null); if (!h) return null; cam.tx = h.x; cam.tz = h.z; cam.dist = 22; cam.pitch = .5; return h.name + ' (' + h.kind + ')'; });
  console.log('monument', mon); if (mon) await shot('monument.png', 4000);
  // a festival
  const fest = await page.evaluate(() => { G.paused = false; G.festival = 0; const c = G.cu; const key = 'boats'; G.t = Math.floor(G.t / 24) * 24 + 12; startFestival(10, 'harvest'); G.paused = true; const [fx, fz] = festSpot(); cam.tx = fx; cam.tz = fz; cam.dist = 55; cam.pitch = .55; return G.cu.fest && G.cu.fest.name; });
  console.log('festival', fest); await shot('festival.png', 5000);
  const fin = await page.evaluate(() => ({ day: dayN(), notes: document.querySelectorAll('.cuNote').length }));
  console.log('FINAL', JSON.stringify(fin));
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
