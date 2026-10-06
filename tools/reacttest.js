// The plan reacts to the player's terrain work: flatten / fill land beside a young town and the elders re-plot it (new streets and plots),
// the siteFail prayer clears, and the folk build there. usage: WORLD=lake SEED=3 node tools/reacttest.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const WORLD = process.env.WORLD || 'lake', SEED = +(process.env.SEED || 3);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, SEED);
  await page.goto('file://' + path.resolve(__dirname, '../Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(([w, sd]) => { document.getElementById('tNew').click(); setupWorld = w; setupSeed = sd; document.getElementById('setupGo').click(); }, [WORLD, SEED]); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); }); await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    PAUSED = true; LY.settle = 0; const out = [];
    const day = () => { G.food = Math.max(G.food, 300); G.wood = Math.max(G.wood, 200); G.stone = Math.max(G.stone, 150); G.hap = 70; G.raid = null; G.raidCool = 1e9; G.faith = 300; for (let i = 0; i < 240; i++) gameStep(.1); };
    for (let d = 0; d < 6; d++) day();
    const P = G.plan, c = G.center; out.push(['town', P.tpl, 'plots', P.plots.length, 'streets', P.streets.length, 'pop', popN()]);
    // the player flattens a wide area 55-75 units from the hall in the direction of the poorest land, raising it out of any water
    let best = null, bs = 1e9; for (let a = 0; a < 16; a++) { const x = c.x + Math.cos(a / 16 * TAU) * 62, z = c.z + Math.sin(a / 16 * TAU) * 62; if (Math.abs(x) > HALF - 30 || Math.abs(z) > HALF - 30) continue; let n = 0; for (const p of P.plots) if (Math.hypot(p.x - x, p.z - z) < 22) n++; let wet = 0; for (let i = 0; i < 12; i++) if (wAt(x + (i % 4 - 1.5) * 8, z + ((i / 4 | 0) - 1) * 8) > .05) wet++; const s = n - wet * 2; if (s < bs) { bs = s; best = [x, z]; } }
    const [bx, bz] = best, R = 24, ci = Math.round(bx + HALF), cj = Math.round(bz + HALF); let lvl = 0, n = 0; for (let j = -R; j <= R; j++)for (let i = -R; i <= R; i++) { const k = (cj + j) * S + ci + i; if (k >= 0 && k < V && Math.hypot(i, j) < R) { lvl += H[k]; n++; } } lvl /= n;
    const before = { plots: P.plots.filter(p => Math.hypot(p.x - bx, p.z - bz) < R + 12).length, streets: P.streets.length };
    for (let j = -R - 4; j <= R + 4; j++)for (let i = -R - 4; i <= R + 4; i++) { const k = (cj + j) * S + ci + i, d = Math.hypot(i, j); if (k < 0 || k >= V || d > R + 4) continue; const w = d < R ? 1 : 1 - (d - R) / 4; H[k] += (lvl + .3 - H[k]) * w; if (w > .5) W[k] = 0; }
    refreshTerrain(ci - R - 6, cj - R - 6, ci + R + 6, cj + R + 6); updateWaterMesh(true);
    G.siteFail = { type: 'house', since: G.t - 30 };
    out.push(['flattened around', Math.round(bx), Math.round(bz), 'before', JSON.stringify(before), 'lvl', +lvl.toFixed(1)]);
    for (let d = 0; d < 3; d++) day();
    const after = { plots: P.plots.filter(p => Math.hypot(p.x - bx, p.z - bz) < R + 12).length, streets: P.streets.length, total: P.plots.length };
    out.push(['after 3 days', JSON.stringify(after), 'siteFail', JSON.stringify(G.siteFail), 'chron', G.chron.slice(0, 4).map(c => c.t.slice(0, 90)).join(' | ')]);
    return out;
  });
  for (const x of r) console.log(x.join(' '));
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
