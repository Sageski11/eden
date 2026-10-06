// Draws the street plan of a fresh settlement as a flat map (no 3D): node tools/plantest.js outdir [world seed tpl] ...
// env WORLDS=river,lake SEEDS=1,2,3 TPL=grid (force a template). Prints template, street and plot counts.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || '.'; const worlds = (process.env.WORLDS || 'river').split(','), seeds = (process.env.SEEDS || '1,2,3').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('file://' + path.resolve(__dirname, '../Eden.html')); await page.waitForTimeout(2000);
  for (const w of worlds) for (const sd of seeds) {
    const r = await page.evaluate(([w, sd, tpl]) => {
      let a = sd; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      window.LY_FORCE = tpl || ''; document.getElementById('tNew').click(); setupWorld = w; setupSeed = sd; document.getElementById('setupGo').click();
      [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); PAUSED = true;
      const P = G.plan; return { tpl: P.tpl, streets: P.streets.length, plots: P.plots.length, slope: P.slope, hall: [G.center.x, G.center.z] };
    }, [w, sd, process.env.TPL || '']);
    await page.waitForTimeout(300);
    const url = await page.evaluate(() => window.__planmap(G.center.x, G.center.z, 110));
    fs.writeFileSync(path.join(out, `plan-${w}-${sd}-${r.tpl}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(w, sd, JSON.stringify(r));
  }
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS'); await browser.close();
})();
