// Starts a god-mode world, fast-forwards, reports errors and a state snapshot.
// usage: node tools/play.js [--secs N] [--speed 10] [--shot file.png] [--eval "js"]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf(k); return i < 0 ? d : a[i + 1]; };
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve(opt('--file', 'Eden.html')));
  await page.waitForTimeout(3000);
  await page.evaluate(() => document.getElementById('tNew').click());
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('setupGo').click());
  await page.waitForTimeout(2500);
  await page.evaluate(() => { const b=[...document.querySelectorAll('#prayers button')].find(x=>/settlers/i.test(x.textContent)); b&&b.click(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { try{ autoChooseStart(); }catch(e){ throw e; } });
  await page.waitForTimeout(1500);
  const days = +opt('--days', 60);
  await page.evaluate((days) => { PAUSED = true; for (let i = 0; i < days * 24 * 10; i++) { gameStep(0.1); if (i % 20 === 0) { try { if (typeof planTick === 'function') planTick(); } catch (e) { throw e; } } } }, days);
  const st = await page.evaluate(() => ({ era: ERAS[G.era].name, pop: popN(), faith: Math.round(G.faith), buildings: buildings.length, date: dateStr() }));
  console.log(JSON.stringify(st));
  const ev = opt('--eval', null); if (ev) console.log('EVAL', JSON.stringify(await page.evaluate(ev)));
  const shot = opt('--shot', null); if (shot) { await page.evaluate(()=>{try{SIM.paused=true;G.speed=0;}catch(e){}}); await page.waitForTimeout(1500); await page.screenshot({ path: shot, timeout: 120000 }); }
  console.log(errs.length ? errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
