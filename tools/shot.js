// Frozen-scene screenshot of a saved game: node tools/shot.js state.json out.png [yaw pitch dist tx tz]; FILE=path/to/Eden.html
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [state, out, yaw, pitch, dist, tx, tz] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.addInitScript(() => { let a = 99; window.__seed = (n) => { a = n; }; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  await page.goto('file://' + path.resolve(process.env.FILE || 'Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(([s, yaw, pitch, dist, tx, tz]) => { __seed(7); loadGod(s); __seed(8); document.getElementById('ghelp').classList.add('hidden'); document.body.classList.add('photo'); G.paused = true; if (yaw) cam.yaw = +yaw; if (pitch) cam.pitch = +pitch; if (dist) cam.dist = +dist; if (tx) { cam.tx = +tx; cam.tz = +tz; } setTime(15); rebuildTrees(); HM.fixDt = 0.016; HM.fixT = 100; gameStep = function () {}; updateAnimals = function () {}; updateBoats = function () {}; for (const v of allVill().concat(allBandits())) if (!v.look) v.look = makeLook(v); }, [fs.readFileSync(state, 'utf8'), yaw, pitch, dist, tx, tz]);
  await page.waitForTimeout(6000);
  await page.evaluate(() => { PAUSED = true; }); await page.waitForTimeout(9000);
  await page.screenshot({ path: out, timeout: 120000 });
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
