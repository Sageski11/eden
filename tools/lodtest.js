// Compare the simulation with distance LOD off and on, on a saved big game: same economy, less work.
// usage: node tools/lodtest.js state.json [gameHours=96]
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path'), fs = require('fs');
(async () => {
  const [stateFile, hrsArg] = process.argv.slice(2), H = +(hrsArg || 96), str = fs.readFileSync(stateFile, 'utf8');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const errs = [];
  for (const mode of ['off', 'on', 'off', 'on']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 700 } }); page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('|')));
    await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2000);
    await page.evaluate(([s, m]) => { loadGod(s); PAUSED = true; LOD.off = m === 'off'; document.getElementById('ghelp').classList.add('hidden'); const c = G.center; cam.tx = c.x; cam.tz = c.z; cam.dist = 60; }, [str, mode]);
    await page.waitForTimeout(800);
    const r = await page.evaluate(([H]) => { const snap = () => ({ food: Math.round(G.food), wood: Math.round(G.wood), stone: Math.round(G.stone), pop: popN(), blds: buildings.length, hap: Math.round(G.hap) }); const a = snap(); const t = performance.now();
      const dt = 1 / 60 / 4; let steps = Math.round(H * 4 * 60); for (let i = 0; i < steps; i++) gameStep(dt * 1); const ms = performance.now() - t; return { before: a, after: snap(), ms: Math.round(ms), lod: LOD.n.join('/'), pc: PCST.hit + '/' + PCST.miss }; }, [H]);
    console.log(mode, JSON.stringify(r)); await page.close();
  }
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'NO ERRORS'); await browser.close();
})();
