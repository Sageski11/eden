// Does a freshly founded second settlement get its camp finished and grow? usage: node tools/stall2.js [days=40] [lod=on|off]
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const days = +(process.argv[2] || 40), lod = process.argv[3] || 'on', SEED = +(process.env.SEED || 7);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2000);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(1500);
  await page.evaluate((lod) => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); LOD.off = lod === 'off'; PAUSED = true; }, lod);
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__help = () => { G.food = Math.max(G.food, popN() * 6 + 40); G.faith = Math.max(G.faith, 200); G.hap = Math.max(G.hap, 58); G.hapT = Math.max(G.hapT, 58); G.wood = Math.max(G.wood, 80); G.stone = Math.max(G.stone, 60); G.raid = null; G.raidCool = 1e9; G.bandits.length = 0; for (const p of G.tf.pet.slice()) tfDecide(p.id, true); }; });
  const rep = () => page.evaluate(() => { const o = []; TOWNS.list.forEach((s, i) => { withSettlement(i, () => { const sites = buildings.filter(b => siteProj(b)).map(b => { const P = siteProj(b); return `${b.type}${b.level != null ? b.level : ''}${b.upg ? '^' : ''}:${(100 * P.done / Math.max(.01, P.work)).toFixed(0)}%mf${matFrac(P).toFixed(2)} need${P.need.wood}/${P.need.stone} have${P.have.wood}/${P.have.stone} inb${P.inb.wood}/${P.inb.stone} b${G.vill.filter(v => v.site === b.id).length}`; });
    o.push({ i, name: G.town, pop: G.vill.length, era: G.era, blds: buildings.length, food: Math.round(G.food), wood: Math.round(G.wood), stone: Math.round(G.stone), jobs: G.vill.reduce((a, v) => (a[v.job || '-'] = (a[v.job || '-'] || 0) + 1, a), {}), sites: sites.slice(0, 6) }); }); }); return o; });
  for (let d = 0; d < days; d++) {
    if (d === 6 && process.env.DBG) { console.log(JSON.stringify(await page.evaluate(() => withSettlement(1, () => { const v = G.vill.find(o => /find a way/.test(o.thought || '')) || G.vill.find(o => o.arriving) || G.vill[0]; const [dx, dz] = doorOf(G.center); if (gridDirty) rebuildGrid(); const cs = compOfPt(v.x, v.z), ct = compOfPt(dx, dz); const [si, sj] = cellOf(v.x, v.z), [ti, tj] = cellOf(dx, dz);
      const sizes = {}; for (let k = 0; k < NN; k++) if (gComp[k]) sizes[gComp[k]] = (sizes[gComp[k]] || 0) + 1; const big = Object.entries(sizes).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const q = nearestInComp(v.x, v.z, ct); const p = findPath(v.x, v.z, dx, dz, G.center.id, 0);
      return { v: [Math.round(v.x), Math.round(v.z)], door: [Math.round(dx), Math.round(dz)], cs, ct, csc: gComp[sj * GN + si], gcost: gCost[sj * GN + si], big, q, found: !!p, pf: v._pf, arr: v.arriving, center: [Math.round(G.center.x), Math.round(G.center.z)], thought: v.thought }; })))); break; }
    await page.evaluate(() => { PAUSED = false; for (let k = 0; k < 24; k++) { if (TOWNS.cur === 0 || true) { eachSettlement(() => {}); } } });
    await page.evaluate((d) => { for (let i = 0; i < 240; i++) { if (i % 24 === 0) { const c = TOWNS.cur; withSettlement(0, () => window.__help()); } gameStep(0.1); } if (d === 2 && TOWNS.list.length < 2) { withSettlement(0, () => { G.era = Math.max(G.era, 1); }); sFound(); } }, d);
    if (d % 4 === 3 || d === days - 1) console.log('day', d + 1, JSON.stringify(await rep()));
    if (errs.length) break;
  }
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
