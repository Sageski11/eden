// Pixel comparison of two PNGs in a browser canvas: node tools/imgdiff.js a.png b.png [diff.png]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const [a, b, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const r = await page.evaluate(async ([A, B]) => {
    const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(A), load(B)]); const w = ia.width, h = ia.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
    cx.drawImage(ia, 0, 0); const da = cx.getImageData(0, 0, w, h).data; cx.drawImage(ib, 0, 0); const db = cx.getImageData(0, 0, w, h).data;
    let diff = 0, big = 0, max = 0, sum = 0; const o = cx.createImageData(w, h);
    for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); sum += d; if (d > 0) diff++; if (d > 24) big++; if (d > max) max = d; const v = Math.min(255, d * 8); o.data[i] = v; o.data[i + 1] = v; o.data[i + 2] = v; o.data[i + 3] = 255; }
    cx.putImageData(o, 0, 0); return { w, h, pixels: w * h, differing: diff, over24: big, max, mean: +(sum / (w * h)).toFixed(4), diffPng: cv.toDataURL('image/png') };
  }, ['data:image/png;base64,' + fs.readFileSync(a).toString('base64'), 'data:image/png;base64,' + fs.readFileSync(b).toString('base64')]);
  if (out) fs.writeFileSync(out, Buffer.from(r.diffPng.split(',')[1], 'base64')); delete r.diffPng; console.log(JSON.stringify(r)); await browser.close();
})();
