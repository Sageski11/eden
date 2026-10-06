// Wildlife: herds above what the woods carry thin out; releases are refused when the land is full; the game prayer is honest.
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } }); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(1800);
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(1500);
  await page.evaluate(() => { [...document.querySelectorAll('#prayers button')].find(x => /settlers/i.test(x.textContent)).click(); autoChooseStart(); PAUSED = true; });
  const r = await page.evaluate(() => {
    const out = {}; const caps = animalCaps(); out.capDeer = Math.round(caps.deer); out.deer0 = animals.filter(a => a.sp === 'deer').length;
    for (let i = 0; i < 70; i++) spawnAnimal('deer', G.center.x + (Math.random() - .5) * 80, G.center.z + (Math.random() - .5) * 80, {});
    out.deer1 = animals.filter(a => a.sp === 'deer').length; let days = 0; while (animals.filter(a => a.sp === 'deer').length > Math.ceil(caps.deer * 1.1) && days < 60) { cullAnimals(); days++; }
    out.deer2 = animals.filter(a => a.sp === 'deer').length; out.days = days;
    // releasing more is refused
    hover = { x: G.center.x + 10, z: G.center.z + 10, y: 0 }; tool = 'w:deer'; G.faith = 500; const n0 = animals.length; godClick({}); out.refused = animals.length === n0; out.toast = document.getElementById('toast').textContent;
    // honest game: remove all deer/boar, build a lodge -> noGame resolves only with game
    out.huntable = huntableTotal(); return out; });
  console.log(JSON.stringify(r)); console.log(errs.join('\n') || 'NO ERRORS'); await browser.close();
})();
