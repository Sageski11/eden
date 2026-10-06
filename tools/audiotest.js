// Offline render of the generative score and ambience per age (no sound card needed): reports level, peak, clipping, NaNs.
// usage: node tools/audiotest.js [seconds=40]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const secs = +(process.argv[2] || 40);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|net::ERR|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve('Eden.html')); await page.waitForTimeout(2500);
  const cases = [['stone', 0, 0, 0], ['bronze', 1, 0, 0], ['iron', 2, 0, 0], ['medieval', 3, 0, 0], ['highmed', 4, 0, 0], ['industrial', 5, 0, 0], ['modern', 6, 0, 0], ['futuristic', 7, 0, 0], ['medieval-tense', 3, 1, 0], ['futuristic-tense', 7, 1, 0], ['stone-festival', 0, 0, 1]];
  for (const [name, era, tense, fest] of cases) {
    const r = await page.evaluate(async ([era, tense, fest, secs]) => {
      const SR = 22050; const OAC = window.OfflineAudioContext;
      SND.ctx = null; SND.pl = null;
      window.AudioContext = function () { const c = new OAC(2, SR * secs, SR); c.resume = () => Promise.resolve(); c.suspend = () => Promise.resolve(); return c; };
      audioInit(); const c = SND.ctx; SND.on = true; c.resume = () => Promise.resolve();
      G.era = era; G.phase = 'play'; G.menu = false; G.paused = false; SND.tz = tense; AUD.fest = fest ? 1 : 0; AUD.folk = .6; AUD.forest = .4; AUD.water = .3; AUD.close = .8;
      SND.prof = -1; setDrones(MP[era], era, tense);
      const p = MP[era]; SND.m.step = 0; let t = .1; const tz = tense;
      while (t < secs - 2) { scoreStep(t, p, tz); t += beat(p, tz) / 2; }
      // some ambient bed levels, as audioUpdate would set them
      for (const [k, v] of [['water', .04], ['wind', .06], ['forest', .03], ['crowd', .04]]) SND.lvl[k].g.gain.value = v;
      const buf = await c.startRendering();
      const d = buf.getChannelData(0); let pk = 0, ss = 0, nan = 0, clip = 0; const win = []; let ws = 0, wn = 0;
      for (let i = 0; i < d.length; i++) { const x = d[i]; if (x !== x) { nan++; continue; } const a = Math.abs(x); if (a > pk) pk = a; if (a >= .999) clip++; ss += x * x; ws += x * x; wn++; if (wn === SR * 5) { win.push(+(20 * Math.log10(Math.sqrt(ws / wn) + 1e-9)).toFixed(1)); ws = 0; wn = 0; } }
      return { peak: +pk.toFixed(3), rmsDb: +(20 * Math.log10(Math.sqrt(ss / d.length) + 1e-9)).toFixed(1), win, nan, clip };
    }, [era, tense, fest, secs]);
    console.log(name.padEnd(18), JSON.stringify(r));
    if (r.nan || r.clip > 10) errs.push('bad render ' + name);
  }
  console.log(errs.length ? errs.slice(0, 5).join('\n') : 'NO ERRORS');
  await browser.close(); process.exit(errs.length ? 1 : 0);
})();
