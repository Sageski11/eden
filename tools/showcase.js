// Stages buildings on a flat pad and screenshots them. usage: node tools/showcase.js out.png "spec" [yaw] [dist] [pitch]
// spec: comma list of type[:level], e.g. "house:4,house:5,house:6,factory,school"
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const [out, spec, yaw, dist, pitch, era] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2000);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); });
  await page.waitForTimeout(800);
  const msg = await page.evaluate(([spec, yaw, dist, pitch, era]) => {
    PAUSED = true; G.paused = true; if (era) G.era = +era;
    for (const b of buildings.slice()) removeBuilding(b);
    const items = spec.split(','); const cx = 0, cz = 0, gap = 14; const x0 = -(items.length - 1) * gap / 2;
    // flat pad
    const [i0, j0, i1, j1] = [HALF - 120, HALF - 40, HALF + 120, HALF + 40];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * S + i; H[k] = 6; W[k] = 0; }
    refreshTerrain(i0, j0, i1, j1); trees.length = 0; treesDirty = true;
    const made = [];
    items.forEach((s, n) => { const [t, l] = s.split(':'); const r = newRecord(t, x0 + n * gap, cz, 0, 1234 + n * 7); r.level = l != null ? +l : (t === 'house' ? 3 : null); r.w = 3.8; r.d = 3.6; addBuilding(r); realize(r); made.push([t, r.level, r.info && r.info.name]); });
    document.getElementById('ghelp').classList.add('hidden'); document.body.classList.add('photo'); rebuildTrees(); cam.tx = 0; cam.tz = 0; cam.dist = +dist || 60; cam.pitch = +pitch || .5; cam.yaw = +yaw || .6; setTime(14);
    return made;
  }, [spec, yaw, dist, pitch, era]);
  console.log(JSON.stringify(msg));
  await page.waitForTimeout(9000);
  await page.screenshot({ path: out, timeout: 120000 });
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
