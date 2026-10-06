// LIVES test: ~200 game days with two peoples; counts story events by kind, samples lifeSummary, checks for errors.
// usage: node tools/livestest.js [days=200] ; SEED=n ; SHOT=dir (screenshot of a graveyard)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const days = +(process.argv[2] || 200), SEED = +(process.env.SEED || 5);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|ERR_NAME|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    PAUSED = true; window.__ev = {}; window.__evs = [];
    STORY.on(e => { const t = e.town || '?'; (window.__ev[t] = window.__ev[t] || {}); window.__ev[t][e.k] = (window.__ev[t][e.k] || 0) + 1; if (window.__evs.length < 400 && ['wedding', 'death', 'funeral', 'apprentice', 'courtship', 'naming', 'inherit', 'kindness', 'rivalry', 'hero', 'memorial', 'miracle'].includes(e.k)) window.__evs.push(e.k + ': ' + e.txt); });
    window.__day = () => { eachSettlement(() => { G.food = Math.max(G.food, popN() * 6 + 40); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58); G.wood = Math.max(G.wood, 100); G.stone = Math.max(G.stone, 100); G.raidCool = Math.min(G.raidCool, G.t / 24 + 3) ; G.sad = Math.min(G.sad, 3); G.dev.doubt = Math.min(G.dev.doubt, 12); for (const p of G.tf.pet.slice()) tfDecide(p.id, true); });
      G.faith = Math.max(G.faith, 200); for (let i = 0; i < 240; i++) gameStep(0.1); };
    window.__st = () => TOWNS.list.map((s, i) => { const st = i === TOWNS.cur ? G : s.st; return { i, name: st.town, era: ERAS[st.era].name, pop: st.vill.filter(v => !v.leaving && !v.arriving).length, births: st.births, deaths: st.deaths, graves: (st.life && st.life.graves.length) || 0, gath: (st.life && st.life.gath.length) || 0 }; });
  });
  for (let d = 0; d < days; d += 10) {
    const r = await page.evaluate(() => { for (let i = 0; i < 10; i++) __day(); return { day: dayN(), towns: __st() }; });
    console.log(JSON.stringify(r));
    if (errs.length) break;
  }
  const out = await page.evaluate(() => {
    const o = { events: window.__ev, samples: [], mem: {}, traits: {}, mood: [], dev: [] };
    eachSettlement(i => {
      let nm = 0, nt = 0, nr = 0, n = 0, relsum = 0;
      for (const v of G.vill) { n++; nm += (v.mem || []).length; nt += (v.traits || []).length; nr += Object.keys(v.rel || {}).length; for (const t of v.traits || []) o.traits[t] = (o.traits[t] || 0) + 1; for (const m of v.mem || []) { const k = m.k.replace(/\d+$/, ''); o.mem[k] = (o.mem[k] || 0) + 1; } }
      o.dev.push({ town: G.town, n, memPer: +(nm / n).toFixed(2), traitsPer: +(nt / n).toFixed(2), relPer: +(nr / n).toFixed(2), moodAvg: Math.round(G.vill.reduce((a, v) => a + (v.mood || 0), 0) / n) });
      const pick = G.vill.filter(v => v.age >= 14).sort((a, b) => (b.mem || []).length - (a.mem || []).length).slice(0, 3);
      for (const v of pick) { const s = lifeSummary(v); s.story = s.story.slice(0, 3).map(e => e.k + ': ' + e.txt); o.samples.push(s); }
    });
    o.evs = window.__evs.slice(0, 40);
    return o;
  });
  console.log('EVENTS', JSON.stringify(out.events));
  console.log('PER-TOWN', JSON.stringify(out.dev));
  console.log('TRAITS', JSON.stringify(out.traits));
  console.log('MEMORY KINDS', JSON.stringify(out.mem));
  for (const s of out.samples.slice(0, 5)) console.log('SAMPLE', JSON.stringify(s));
  console.log('EVENT LINES\n' + out.evs.join('\n'));
  {
    const sl = await page.evaluate(() => {
      const sig = () => TOWNS.list.map((t, i) => { const st = i === TOWNS.cur ? G : t.st; const vs = st.vill; return [vs.length, vs.reduce((a, v) => a + (v.traits || []).length, 0), vs.reduce((a, v) => a + (v.mem || []).length, 0), vs.reduce((a, v) => a + Object.keys(v.rel || {}).length, 0), st.life ? st.life.graves.length : -1, st.life ? st.life.gath.length : -1].join('/'); }).join(' | ');
      const s = serializeGod(); window.__saved = s; const before = sig(); loadGod(s); const after = sig(); return { before, after, ok: before === after, kb: Math.round(s.length / 1024), graves: G.life && G.life.graves.slice(-1)[0] };
    });
    console.log('SAVELOAD', JSON.stringify(sl));
    if (process.env.SAVE) require('fs').writeFileSync(process.env.SAVE, await page.evaluate(() => window.__saved));
  }
  if (process.env.SHOT) {
    const fs = require('fs'); fs.mkdirSync(process.env.SHOT, { recursive: true });
    await page.evaluate(() => { const lf = G.life; const g = lf && lf.graves[lf.graves.length - 1]; if (g) { cam.tx = g.x; cam.tz = g.z; cam.dist = 22; cam.pitch = .6; } });
    for (let i = 0; i < 3; i++) await page.evaluate(() => { for (let k = 0; k < 3; k++) gameStep(0.01); });
    await page.waitForTimeout(1500); await page.screenshot({ path: process.env.SHOT + '/graves.png' });
  }
  console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 15).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
