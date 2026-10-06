// Lays a railway and highway headlessly (after cheating an industrial town) and screenshots them.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
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
  const CAMD = process.env.CAMD || 90;
  const r = await page.evaluate((CAMD) => {
    PAUSED = true; const o = []; const run = (days) => { for (let i = 0; i < days * 24 * 10; i++) gameStep(0.1); };
    run(30); G.era = 6; G.wood = 900; G.stone = 900; G.food = 900;
    for (const t of ['factory', 'station']) { const s = findSite({ type: t }); if (s) { const b = startSite(t, s.x, s.z, 0, {}); completeSite(b); o.push([t, Math.round(s.x), Math.round(s.z)]); } else o.push([t, 'no site']); }
    // staff them so they count as built+working
    for (const b of buildings) if (b.type === 'factory' || b.type === 'station') { const v = G.vill.find(q => !q.work && q.age > 18); if (v) { v.work = b.id; v.job = b.type === 'factory' ? 'machinist' : 'stationmaster'; } }
    G.tf.cool = {}; for (let i = 0; i < 12; i++) { tfDaily(); } updateUI(true);
    o.push(['petitions', G.tf.pet.map(p => p.k)]);
    for (const p of G.tf.pet.slice()) tfDecide(p.id, true);
    { const c = G.center, t = netEdgeTarget([c.x, c.z]); o.push(['edge target', t]); const r = t && netBuild('highway', doorOf(c), t); o.push(['highway', r]); netPave(); }
    o.push(['lines', G.net.lines.map(l => [l.kind, l.pts.length])]); o.push(['paved', G.net.paved, ROADT.reduce((a, v) => a + (v === 2), 0)]);
    o.push(['chron', G.chron.slice(0, 4).map(c => c.t)]);
    const s = serializeGod(); loadGod(s); o.push(['reload lines', G.net.lines.length, netVeh.length]);
    document.getElementById('ghelp').classList.add('hidden'); document.body.classList.add('photo');
    const l = G.net.lines[G.net.lines.length - 1]; if (l) { const m = l.pts[Math.floor(l.pts.length / 2)]; cam.tx = m[0]; cam.tz = m[1]; cam.dist = +(CAMD); cam.pitch = .5; cam.yaw = .7; }
    PAUSED = false; G.paused = true; return o;
  }, CAMD);
  for (const x of r) console.log(JSON.stringify(x));
  await page.waitForTimeout(12000);
  await page.screenshot({ path: out, timeout: 120000 });
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
