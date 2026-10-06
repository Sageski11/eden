// Headless smoke test: loads the game, reports console/page errors, optionally starts a world.
// usage: node tools/smoke.js [file] [--shot out.png] [--start] [--wait ms]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const file = path.resolve(args.find(a => !a.startsWith('--')) || 'Eden.html');
  const flag = k => { const i = args.indexOf(k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] }).catch(async () => chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] }));
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' / ')));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + file);
  await page.waitForTimeout(+flag('--wait') || 4000);
  if (flag('--start')) {
    await page.evaluate(() => { const b = document.getElementById('tSand') || document.getElementById('tNew'); b && b.click(); });
    await page.waitForTimeout(3000);
  }
  const shot = flag('--shot'); if (shot && shot !== true) await page.screenshot({ path: shot });
  const info = await page.evaluate(() => ({ title: document.title, hm: typeof window.HM, loading: !!document.getElementById('loading') && getComputedStyle(document.getElementById('loading')).display }));
  console.log(JSON.stringify(info));
  console.log(errs.length ? errs.slice(0, 15).join('\n') : 'NO ERRORS');
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
