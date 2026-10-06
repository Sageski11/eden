// CPU profile of the simulation (and the non-GPU frame work) on a saved large game.
// usage: node tools/profile.js state.json [sim|frame] [N]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [stateFile, mode = 'sim', nArg] = process.argv.slice(2), N = +(nArg || (mode === 'sim' ? 120 : 6));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto('file://' + path.resolve(process.env.FILE || 'Eden.html')); await page.waitForTimeout(2500);
  const str = fs.readFileSync(stateFile, 'utf8');
  await page.evaluate((s) => { loadGod(s); PAUSED = mode_ => 0; PAUSED = true; document.getElementById('ghelp').classList.add('hidden'); }, str);
  await page.waitForTimeout(1500);
  if (process.env.EVAL) { await page.evaluate(process.env.EVAL); await page.waitForTimeout(1500); } // e.g. EVAL="ovSetOverlay('svc')" to profile with an overlay on
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 400 });
  const t0 = Date.now();
  await cdp.send('Profiler.start');
  let res;
  if (mode === 'sim') res = await page.evaluate((N) => { const t = performance.now(); for (let i = 0; i < N; i++) gameStep(0.1); return { ms: performance.now() - t, pop: TOWNS.list.map((s, i) => (i === TOWNS.cur ? G.vill : s.st.vill).length), blds: allB().length }; }, N);
  else { await page.evaluate((sp) => { PAUSED = false; G.paused = false; G.speed = +sp; HM.fixDt = 1 / 60; }, process.env.SPEED || 1); await page.waitForTimeout(N * 3000); res = await page.evaluate(() => Object.assign(HM.prof(), typeof ovState !== 'undefined' ? { overlaysTickMs: +ovState.ms.toFixed(3) } : {})); await page.evaluate(() => { PAUSED = true; }); }
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dt = profile.timeDeltas; let total = 0;
  profile.samples.forEach((id, i) => { const n = byId.get(id), d = (dt[i] || 0) / 1000; total += d; const f = n.callFrame; const key = (f.functionName || '(anon)') + ' ' + (f.url.split('/').pop() || '') + ':' + (f.lineNumber + 1); self.set(key, (self.get(key) || 0) + d); });
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 28);
  console.log('RESULT', JSON.stringify(res)); console.log('total ms', Math.round(total));
  for (const [k, v] of top) console.log(String(Math.round(v)).padStart(7), (100 * v / total).toFixed(1).padStart(5) + '%', k);
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
