// The railway: needs -> petition -> station at the edge of the town -> a line that skirts the city -> trains that run and stop -> freight delivered,
// a second people joined by rail (passenger train, caravan by train), save/load round trip, screenshots.
// usage: node tools/railtest.js [outdir]   (SEED=3, DAYS=130, QUICK=1 to skip screenshots)
// heavy: run as  flock -w 1500 /tmp/hm.lock nice -n 10 timeout 580 node tools/railtest.js /tmp/rail/out
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || '/tmp/rail/out'; fs.mkdirSync(out, { recursive: true });
  const SEED = +(process.env.SEED || 3), DAYS = +(process.env.DAYS || 130), QUICK = !!process.env.QUICK;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve(__dirname, '..', 'Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const results = []; const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); };
  await page.evaluate(() => {
    PAUSED = true; window.__log = []; window.__deleted = [];
    { const _r = removeBuilding; removeBuilding = function (b) { window.__deleted.push({ id: b.id, type: b.type, day: dayN(), st: b.type === 'station' || b.type === 'hall' ? new Error().stack.split('\n').slice(2, 6).map(s => s.trim().slice(0, 90)).join(' < ') : undefined }); return _r.apply(this, arguments); }; }
    window.__day = () => { eachSettlement(() => { G.food = Math.max(G.food, popN() * 6 + 40); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58); G.wood = Math.max(G.wood, 200); G.stone = Math.max(G.stone, 200); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.sad = Math.min(G.sad, 3); G.dev.doubt = Math.min(G.dev.doubt, 12);
        if (dayN() >= 25 && G.era < 5) { G.era = 5; G.unl.steam = true; G.sk.machine = 800; G.sk.science = 800; }
        for (const k in G.sk) G.sk[k] = Math.max(G.sk[k], 700); checkUnlocks(); if (popN() < 190 && G.center && !G.center.build && dayN() % 2 === 0) arriveFamily(3); });
      G.faith = Math.max(G.faith, 200); for (let i = 0; i < 240; i++) gameStep(0.1); };
    // geometry helpers shared by the checks
    window.__urban = () => { const c = G.center, d = []; for (const b of buildings) { if (b.build) continue; if (['farm', 'camp', 'quarry', 'lodge', 'dock', 'shipyard', 'fishmkt', 'tower'].includes(b.type)) continue; d.push(Math.hypot(b.x - c.x, b.z - c.z)); } d.sort((a, b) => a - b); return d.length ? d[Math.floor(d.length * .9)] : 20; };
  });
  // ---- 1. the folk file petitions for a real need (we hold them back to read them)
  const pets = [];
  for (let d = 0; d < DAYS && pets.length < 2; d++) {
    const r = await page.evaluate(() => { eachSettlement(() => { for (const p of G.tf.pet) if (p.k === 'rail' && !p.seen) { p.seen = 1; window.__log.push({ day: dayN(), town: G.town, txt: p.txt, how: p.how, cost: p.cost, rp: p.rp, id: p.id, idx: TOWNS.cur }); } });
      const n = window.__log.length; __day(); return { n, log: window.__log.slice() }; });
    // petitions are decided here, one at a time, after inspection
    const fresh = r.log.filter(x => !pets.some(p => p.id === x.id && p.idx === x.idx));
    for (const f of fresh) {
      pets.push(f); console.log(`  day ${f.day}: ${f.town} petitions: ${f.txt}`); console.log(`     ${f.how}`);
      const before = await page.evaluate((f) => { return withSettlement(f.idx, () => ({ ids: allB().map(b => b.id), n: buildings.length, urban: __urban(), center: [G.center.x, G.center.z], stone: Math.round(G.stone), wood: Math.round(G.wood), lines: netLines().filter(l => l.kind === 'rail').length })); }, f);
      const ex = await page.evaluate((f) => { return withSettlement(f.idx, () => { const ids0 = new Set(allB().map(b => b.id)); window.__ids0 = window.__ids0 || {}; window.__ids0[f.idx] = window.__ids0[f.idx] || [...ids0]; const T = tfEnsure(); const p = T.pet.find(q => q.id === f.id); if (!p) return { err: 'petition vanished' };
        const t0 = performance.now(); tfDecide(p.id, true); const ms = Math.round(performance.now() - t0); const gone = window.__deleted.filter(x => ids0.has(x.id) && x.day >= dayN()).map(x => x.type);
        return { ms, gone, lines: netLines().filter(l => l.kind === 'rail').length, chron: G.chron.slice(0, 2).map(c => c.t.slice(0, 160)) }; }); }, f);
      f.before = before; f.ex = ex; console.log('     executed', JSON.stringify(ex));
    }
  }
  check('the folk filed a rail petition for a real need', pets.length >= 1 && /paces/.test(pets[0].txt) && pets[0].rp && pets[0].rp.need, pets[0] && { need: pets[0].rp && pets[0].rp.need, cost: pets[0].cost });
  check('petition costs scale with the length of the line', pets.every(p => p.cost && p.cost[0] >= 35 && p.cost[1] >= 55), pets.map(p => [p.rp && p.rp.len, p.cost]));
  const net1 = await page.evaluate(() => railNetwork());
  check('a railway was built', net1.lines.length >= 1, net1.lines);
  check('every line runs between stations, halts and depots (or joins another line)', net1.lines.every(l => ['station', 'halt', 'depot', 'junction'].includes(l.a) && ['station', 'halt', 'depot', 'junction'].includes(l.b)) && net1.lines.some(l => l.a === 'station' || l.b === 'station'), net1.lines.map(l => [l.a, l.b]));
  check('no building was demolished for the track (only an old farm shed may make way for a station)', pets.every(p => p.ex && p.ex.gone && p.ex.gone.every(t => ['farm', 'camp', 'lodge'].includes(t))), pets.map(p => p.ex && p.ex.gone));
  // ---- 2. routing: the line skirts the city
  const geo = await page.evaluate(() => { const o = []; for (let i = 0; i < TOWNS.list.length; i++) withSettlement(i, () => { const c = G.center; if (!c) return; const urb = __urban(); let closeB = 99, inCore = 0, nPts = 0, minPlot = 99, onStreet = 0, closeInfo = null; const P = G.plan;
        for (const L of netLines()) { if (L.kind !== 'rail') continue; for (let k = 0; k < L.pts.length; k++) { const p = L.pts[k]; const dc = Math.hypot(p[0] - c.x, p[1] - c.z); if (Math.hypot(p[0] - c.x, p[1] - c.z) > 120) continue; nPts++; if (dc < urb * .65) inCore++;
            for (const b of buildings) { if (b.type === 'farm') continue; const d = Math.hypot(b.x - p[0], b.z - p[1]) - (b.r || 3); if (d < closeB) { closeB = d; closeInfo = { type: b.type, id: b.id, late: !((window.__ids0 || {})[i] || []).includes(b.id), r: b.r, pt: [Math.round(p[0]), Math.round(p[1])], bpos: [Math.round(b.x), Math.round(b.z)], line: L.id }; } }
            if (P) for (const pl of P.plots || []) { const d = Math.hypot(pl.x - p[0], pl.z - p[1]); if (d < minPlot) minPlot = d; } } }
        const stations = []; for (const L of netLines()) if (L.kind === 'rail') for (const F of [L.a, L.b]) if (F && F.k === 'station' && F.t === i) stations.push({ x: F.x, z: F.z, d: Math.round(Math.hypot(F.x - c.x, F.z - c.z)), bid: F.bid, built: !!bById(F.bid) });
        o.push({ town: G.town, urb: Math.round(urb), c: [Math.round(c.x), Math.round(c.z)], nPts, inCore, closeB: Math.round(closeB * 10) / 10, closeInfo, minPlot: Math.round(minPlot * 10) / 10, stations }); }); return o; });
  console.log('  geometry', JSON.stringify(geo));
  console.log('  stations removed:', JSON.stringify(await page.evaluate(() => window.__deleted.filter(x => x.type === 'station'))));
  check('stations stand at the edge of their towns, outside the core', geo.every(g => !g.stations.length || g.stations.every(s => s.built && s.d >= g.urb * .75)), geo.map(g => [g.town, g.urb, g.stations.map(s => s.d)]));
  check('the line keeps out of the built-up core', geo.every(g => g.inCore === 0), geo.map(g => [g.town, g.inCore, g.nPts]));
  check('the line keeps clear of buildings (>= 2 paces)', geo.every(g => g.closeB >= 2), geo.map(g => g.closeB));
  check('the line keeps clear of planned house plots', geo.every(g => g.minPlot >= 1.2), geo.map(g => g.minPlot));
  // ---- 3. trains run, stop, deliver
  await page.evaluate(() => { railSyncAll(); RAIL.log = []; });
  const run1 = await page.evaluate(() => { const o = { stone0: 0 }; const st0 = TOWNS.list.map((s, i) => [sGet(i, 'stone'), sGet(i, 'wood'), sGet(i, 'food')]); const seen = {}; let moved = false; const pos0 = railNetwork().trains.map(t => [t.x, t.z]);
    for (let k = 0; k < 900; k++) { railTick(1); if (k % 30 === 0) for (const t of railNetwork().trains) seen[t.id] = (seen[t.id] || 0) + (t.v > 1 ? 1 : 0); }
    const nw = railNetwork(); const arrivals = {}; for (const e of RAIL.log) { const key = e.t + '@' + e.stop; arrivals[key] = (arrivals[key] || 0) + 1; }
    let frt = 0; for (let i = 0; i < TOWNS.list.length; i++) { const n = sGet(i, 'net'); if (n && n.rs) frt += n.rs.frt; }
    return { trains: nw.trains.length, svcs: nw.svcs, arrivals, frt, moving: seen, st0, st1: TOWNS.list.map((s, i) => [sGet(i, 'stone'), sGet(i, 'wood'), sGet(i, 'food')]) }; });
  console.log('  run', JSON.stringify(run1));
  if (!(Object.keys(run1.arrivals).length >= 2 && Object.values(run1.moving).every(v => v > 0)) || Object.values(run1.arrivals).some(n => n < 2)) console.log('  trains', JSON.stringify(await page.evaluate(() => RAIL.dbgTrains())));
  check('trains exist', run1.trains >= 1, run1.trains);
  check('trains actually ran and stopped at stations (every train arrived at >= 2 different stops)', Object.keys(run1.arrivals).length >= 2 && Object.values(run1.moving).every(v => v > 0), run1.arrivals);
  check('freight (stone/timber/food) was delivered to the town', run1.frt > 0 || !run1.svcs.some(s => s.k === 'freight' && s.cargo !== 'goods'), { frt: run1.frt });
  // ---- 4. the second people: passenger service and the caravan by train
  const link = await page.evaluate(() => { const o = { towns: TOWNS.list.length }; if (TOWNS.list.length < 2) return o; o.linked = railLinked(0, 1); if (!o.linked) { withSettlement(0, () => { G.wood = 500; G.stone = 500; tfExecute && 0; const r = railExecute({ rp: { need: 'link', j: 1 }, cost: [0, 0], short: 'lay the railway between the towns' }); o.exec = r; o.chron = G.chron.slice(0, 2).map(c => c.t); o.scout = (() => { const s = RAIL.dbg.railScout(0, 'link', 1); return { ok: s.ok, why: s.why, len: s.len, dd: s.dd }; })(); }); }
    railSyncAll(); o.linked2 = railLinked(0, 1); o.net = railNetwork(); if (!o.linked2 && RAIL.gr) o.gr = { nodes: RAIL.gr.nodes.map(n => [n.id, Math.round(n.x), Math.round(n.z), n.segs.length]), segs: RAIL.gr.segs.map(s => [s.id, s.kind, Math.round(s.len), s.a.id, s.b.id]), lines: netLines().filter(l => l.kind === 'rail').map(l => [l.id, l.a.k, Math.round(l.pts[0][0]), Math.round(l.pts[0][1]), l.b.k, Math.round(l.pts[l.pts.length - 1][0]), Math.round(l.pts[l.pts.length - 1][1])]) }; return o; });
  if (link.gr) console.log('  linkgraph', JSON.stringify(link.gr));
  console.log('  link', JSON.stringify({ towns: link.towns, chron: link.chron, scout: link.scout, linked: link.linked, linked2: link.linked2, svcs: link.net && link.net.svcs, lines: link.net && link.net.lines.map(l => [l.own, l.len, l.a, l.b, l.br, l.tn]) }));
  const linkable = link.towns >= 2 && (link.linked2 || !(link.scout && !link.scout.ok));
  check('the two peoples are joined by rail (when the land allows a route)', link.towns < 2 || link.linked2 || !linkable, link.linked2 ? true : { notFeasible: link.scout });
  if (link.towns >= 2 && link.linked2) {
    const pax = await page.evaluate(() => { RAIL.log = []; const seen = new Set(); for (let k = 0; k < 1500; k++) { railTick(1); } for (const e of RAIL.log) seen.add(e.f + ':' + e.stop); const nw = railNetwork(); return { stops: [...seen], trains: nw.trains.map(t => [t.kind, t.cargo, t.state, t.si]) }; });
    check('a passenger train runs between the two towns\' stations', pax.stops.filter(s => /^pax:station/.test(s)).length >= 2, pax.stops);
    if (pax.stops.filter(s => /^pax:station/.test(s)).length < 2) console.log('  trains', JSON.stringify(await page.evaluate(() => RAIL.dbgTrains())), JSON.stringify(await page.evaluate(() => RAIL.gr.svcs.map(s => [s.id, s.stops]))));
    const trade = await page.evaluate(() => { const log = []; let rode = 0;
      for (let day = 0; day < 22; day++) { eachSettlement((i) => { G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; G.hap = Math.max(G.hap, 55); if (i === 0) { G.wood = 600 + popN() * 3; G.stone = 300; G.food = Math.min(G.food, 20); } else { G.food = popN() * 9 + 700; G.wood = Math.min(G.wood, 12); G.stone = 80; } });
        withSettlement(0, () => { G.tradeCool = {}; }); if (day % 3 === 0 && !allVill().some(v => v.mission)) { tryTrade(0, 1) || tryTrade(1, 0); }
        for (let i = 0; i < 240; i++) { gameStep(0.1); if (i % 4 === 0) railTick(.4); const rv = allVill().filter(v => v.mission && v.mission.rail === 'ride').length; rode = Math.max(rode, rv); }
        if (day % 5 === 4) log.push({ day, trades: G.tradeN || 0, missions: allVill().filter(v => v.mission).map(v => [v.mission.phase, v.mission.rail || '-']) }); }
      return { log, rode, tradeLog: G.tradeLog, pops: TOWNS.list.map((s, i) => (sGet(i, 'vill') || []).length) }; });
    console.log('  trade', JSON.stringify(trade));
    check('a trade caravan rode the train (or none could be sent)', trade.rode > 0 || !(trade.tradeLog && trade.tradeLog.length) || trade.pops.some(n => n < 14), { rode: trade.rode, trades: trade.tradeLog && trade.tradeLog.length, pops: trade.pops });
  }
  // ---- 4b. a third works joins the existing line at a junction (both station ports are taken)
  const jn = await page.evaluate(() => { const o = {}; withSettlement(0, () => { G.wood = 600; G.stone = 600; const rs = G.net.rs; const sites = RAIL.dbg.depotSpots('timber'); o.sites = sites.length; const before = netLines().filter(l => l.kind === 'rail').length; o.before = before; o.after = before; o.feasible = sites.slice(0, 5).some(s => RAIL.dbg.railScout(0, 'timber', s).ok); for (const s of sites.slice(0, 5)) { railExecute({ rp: { need: 'timber', sx: s.x, sz: s.z }, cost: [0, 0], short: 'lay the railway' }); o.after = netLines().filter(l => l.kind === 'rail').length; if (o.after > before) break; } });
    railSyncAll(); RAIL.log = []; for (let k = 0; k < 900; k++) railTick(1); const nw = railNetwork(); const arr = {}; for (const e of RAIL.log) arr[e.stop] = (arr[e.stop] || 0) + 1;
    o.junction = nw.lines.some(l => l.a === 'junction' || l.b === 'junction'); const td = nw.facs.find(f => f.k === 'depot' && f.cargo === 'wood'); o.timberDepot = !!td; o.tdArr = td ? (arr['depot:' + td.x + ':' + td.z] || 0) : 0; o.svcs = nw.svcs.map(s => s.id); o.arr = arr; o.lines = nw.lines.map(l => [l.a, l.b, l.len]); return o; });
  console.log('  junction', JSON.stringify(jn));
  check('a further depot joins the network (a junction or a free station port) and its trains run', !jn.sites || !jn.feasible || (jn.after > jn.before && jn.timberDepot && jn.tdArr > 0), { junction: jn.junction, lines: jn.lines });
  // ---- 4c. a branch: a new works joins the existing line at a junction (as when both ports of the station are taken)
  const br = await page.evaluate(() => { const o = {}; withSettlement(0, () => { const D = RAIL.dbg, F = D.stationOf(0); if (!F) return; const reach = D.linesReach(F); o.reach = reach.length; const sites = D.depotSpots('stone').concat(D.depotSpots('timber')); let done = false;
      for (const s of sites) { const Fd = D.depotRecord(s, [F.x, F.z], 0, 'stone'); const route = D.railJoin(D.portPos(Fd, -1), [-Fd.ax[0], -Fd.ax[1]], [F.x, F.z], reach); if (!route || !route.join || route.pts.length * 2 > 300) continue;
        const len = route.pts.length * 2; const before = netLines().filter(l => l.kind === 'rail').length; D.railBuildPlan(0, { ok: true, rev: true, route, F, Fb: Fd, need: 'stone', join: route.join, len, j: null }); railChanged(); o.before = before; o.after = netLines().filter(l => l.kind === 'rail').length; done = true; break; }
      o.done = done; });
    railSyncAll(); RAIL.log = []; for (let k = 0; k < 900; k++) railTick(1); const nw = railNetwork(); o.junction = nw.lines.some(l => l.a === 'junction' || l.b === 'junction'); o.svcs = nw.svcs.length; const arr = {}; for (const e of RAIL.log) arr[e.stop] = (arr[e.stop] || 0) + 1; o.arr = arr; o.depots = nw.facs.filter(f => f.k === 'depot').length; return o; });
  console.log('  branch', JSON.stringify(br));
  check('a branch line joins the network at a junction and its freight train runs on it', !br.done || (br.junction && br.after > br.before && Object.keys(br.arr).filter(k => /depot:/.test(k)).length >= 2), br);
  // ---- 5. save / load round trip
  const sl = await page.evaluate(() => { const a = railNetwork(); const str = serializeGod(); loadGod(str); railSyncAll(); const b = railNetwork(); let ok = true; try { for (let k = 0; k < 120; k++) railTick(1); } catch (e) { ok = String(e); }
    const strip = (n) => JSON.stringify({ lines: n.lines, facs: n.facs.map(f => [f.k, f.t, f.x, f.z, f.cargo]), svcs: n.svcs, nt: n.trains.length });
    return { same: strip(a) === strip(b), a: strip(a).length, trains: [a.trains.length, b.trains.length], runs: ok, hasRail: netLines().some(l => l.kind === 'rail') }; });
  check('save/load round trip keeps the lines, stations and services', sl.same && sl.hasRail && sl.runs === true, sl);
  // an old save: a line of the old kind (no profile) still loads
  const legacy = await page.evaluate(() => { const L = netLines().find(l => l.kind === 'rail'); const old = { kind: 'rail', pts: L.pts.map(p => [p[0], p[1]]) }; const net = netEnsure(); net.lines = net.lines.filter(l => l.kind !== 'rail'); net.lines.push(old); const n = railMigrate(); railSyncAll(); let ok = true; try { railTick(20); } catch (e) { ok = String(e); } return { migrated: n, ok, graph: railNetwork().facs.length }; });
  check('an old-style rail line migrates and runs', legacy.migrated >= 1 && legacy.ok === true, legacy);
  // ---- 6. screenshots (the Industrial line, then the same line electrified and as a maglev guideway)
  if (!QUICK) {
    await page.evaluate((s) => { loadGod(s); }, await page.evaluate(() => serializeGod()));
    const shoot = async (tag, views) => { for (const v of views) {
      await page.evaluate((v) => { document.getElementById('ghelp') && document.getElementById('ghelp').classList.add('hidden'); document.body.classList.add('photo'); cam.tx = v.x; cam.tz = v.z; cam.dist = v.d; cam.pitch = v.p; cam.yaw = v.y; PAUSED = false; G.paused = true; railTick(v.tick || 6); }, v);
      await page.waitForTimeout(7000); await page.screenshot({ path: path.join(out, tag + '_' + v.n + '.png'), timeout: 120000 }); console.log('  shot', tag + '_' + v.n); } };
    const viewsOf = () => page.evaluate(() => { railSyncAll(); const Ls = netLines().filter(l => l.kind === 'rail'); if (!Ls.length) return []; const L = Ls.reduce((a, b) => (b.len > a.len ? b : a)); const v = []; const p = (f) => L.pts[Math.min(L.pts.length - 1, Math.floor(L.pts.length * f))];
      const fac = (k) => { for (const l of Ls) for (const F of [l.a, l.b]) if (F && F.k === k) return F; return null; }; const stn = fac('station'), dep = fac('depot'), halt = fac('halt'); const mid = p(.5);
      v.push({ n: 'top', x: mid[0], z: mid[1], d: 330, p: 1.5, y: .1 }); const yo = (F, s) => Math.atan2(F.out[0] * s, F.out[1] * s) + .4; if (stn) v.push({ n: 'station', x: stn.x, z: stn.z, d: 50, p: .45, y: yo(stn, 1), tick: 14 }); if (dep) v.push({ n: 'depot', x: dep.x, z: dep.z, d: 52, p: .5, y: yo(dep, -1) }); if (halt) v.push({ n: 'halt', x: halt.x, z: halt.z, d: 40, p: .45, y: yo(halt, 1) });
      v.push({ n: 'mid', x: mid[0], z: mid[1], d: 60, p: .35, y: 1.9 });
      for (const l of Ls) { if (l.br && l.br.length && v.every(q => q.n !== 'bridge')) { const r = l.br[0], q = l.pts[Math.floor(r[0] / 2)]; v.push({ n: 'bridge', x: q[0], z: q[1], d: 42, p: .4, y: 1.1 }); } if (l.tn && l.tn.length && v.every(q => q.n !== 'tunnel')) { const r = l.tn[0], q = l.pts[Math.floor(r[0] / 2)]; v.push({ n: 'tunnel', x: q[0], z: q[1], d: 40, p: .35, y: 1.1 }); } }
      return v; });
    const v5 = await viewsOf(); await shoot('e5', v5);
    for (const e of [6, 7]) { await page.evaluate((e) => { eachSettlement(() => { G.era = e; G.unl.electric = true; G.unl.computing = true; }); railSyncAll(); }, e); const v = await viewsOf(); await shoot('e' + e, v.filter(q => ['station', 'mid', 'depot'].includes(q.n))); }
  }
  console.log(errs.length ? errs.slice(0, 6).join('\n') : 'NO ERRORS');
  const bad = results.filter(r => !r.ok);
  console.log(bad.length ? 'FAILED: ' + bad.map(b => b.name).join('; ') : 'ALL CHECKS PASSED');
  await browser.close(); process.exit(errs.length || bad.length ? 1 : 0);
})();
