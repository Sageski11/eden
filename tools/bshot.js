// Contact sheet of the new buildings (every variant) so the drawings can be checked by eye.
// usage: node tools/bshot.js <ages e.g. 0,1> [outDir=/tmp] [types comma list to restrict]
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const ages = (process.argv[2] || '0,1,2,3,4,5,6,7').split(',').map(Number), out = process.argv[3] || '/tmp', only = process.argv[4] ? process.argv[4].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); page.on('console', m => { if (m.type() === 'error' && !/CERT|Failed to load/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 400)); });
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('tSand').click()); await page.waitForTimeout(800);
  for (const age of ages) {
    const info = await page.evaluate(async ([age, only]) => {
      const list = SBC.filter(c => c.age === age && c.variants && (!only || only.includes(c.type))); const items = []; for (const c of list) for (const v of c.variants) items.push([c, v]);
      SB.open = true; sbEnqueue(items); while (SB.iconBusy || SB.q.length) await new Promise(r => setTimeout(r, 100)); SB.open = false;
      const cell = 160, cols = 6, rows = Math.ceil(items.length / cols), cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = rows * (cell + 34); const g = cv.getContext('2d'); g.fillStyle = '#0b1a2b'; g.fillRect(0, 0, cv.width, cv.height); g.font = '12px sans-serif';
      const bad = []; await Promise.all(items.map(([c, v], i) => new Promise(res => { const ic = SB.icons[c.id + '|' + v]; const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 34); g.fillStyle = '#fff'; g.fillText(c.type + ' / ' + v, x + 4, y + cell + 14); g.fillStyle = '#8fb2cc'; g.fillText((ic && ic.name) || '?', x + 4, y + cell + 28);
        if (!ic || !ic.url) { bad.push(c.type + '/' + v); return res(); } const im = new Image(); im.onload = () => { g.drawImage(im, x, y, cell, cell); res(); }; im.src = ic.url; })));
      return { url: cv.toDataURL('image/png'), n: items.length, bad }; }, [age, only]);
    fs.writeFileSync(`${out}/age${age}.png`, Buffer.from(info.url.split(',')[1], 'base64')); console.log(`age ${age}: ${info.n} drawings`, info.bad.length ? 'FAILED: ' + info.bad.join(' ') : 'ok');
  }
  console.log(errs.length ? errs.slice(0, 12).join('\n') : 'NO ERRORS'); await browser.close();
})();
