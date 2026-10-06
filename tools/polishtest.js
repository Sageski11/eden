// Polish checks: settings/tutorial/save UI screenshots, save-slot round trip, audio starts, no console errors.
// usage: node tools/polishtest.js [outdir]   (default /tmp/hm6)   env SEED
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || '/tmp/hm6'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 660 } });
  const errs = [], fails = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' / ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|net::ERR|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' ' + extra : '')); if (!cond) fails.push(name); };
  const shot = n => page.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }).catch(e => console.log('  (screenshot ' + n + ' skipped: ' + e.message.split('\n')[0] + ')'));
  const SEED = +(process.env.SEED || 5);
  await page.addInitScript((seed) => { let a = seed; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; try { localStorage.clear(); } catch (e) {} }, SEED);
  await page.goto('file://' + path.resolve('Eden.html') + '?lowq'); await page.waitForTimeout(3000);
  // audio: user gesture then check
  await page.mouse.click(700, 400); await page.waitForTimeout(600);
  const au = await page.evaluate(() => ({ ctx: !!SND.ctx, on: SND.on, state: SND.ctx && SND.ctx.state }));
  ok('audio context starts', au.ctx && au.on, JSON.stringify(au));
  // settings from the title
  await page.evaluate(() => document.getElementById('tSet').click()); await page.waitForTimeout(400);
  const sx = await page.evaluate(() => ({ sections: !!document.getElementById('plSetX'), n: document.querySelectorAll('#plSetX input,#plSetX button').length }));
  ok('settings extended', sx.sections && sx.n > 20, JSON.stringify(sx));
  await shot('settings_top');
  await page.evaluate(() => { document.getElementById('sShadow').querySelector('[data-v=low]').click(); document.getElementById('sSens').value = 150; document.getElementById('sSens').dispatchEvent(new Event('input')); document.getElementById('sReduce').click(); document.getElementById('sFps').click(); });
  const st = await page.evaluate(() => ({ sets: JSON.parse(localStorage.getItem('hearthmere_settings')), shadow: sun.shadow.mapSize.x }));
  ok('settings persist + apply', st.sets.gfx.shadow === 'low' && st.sets.camSens === 1.5 && st.sets.reduce && st.shadow === 1024, JSON.stringify(st.sets));
  await page.evaluate(() => { document.getElementById('sDone').click(); });
  // new realm -> tutorial
  await page.evaluate(() => document.getElementById('tNew').click()); await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('setupGo').click()); await page.waitForTimeout(2500);
  let t = await page.evaluate(() => ({ phase: G.phase, tut: !!document.getElementById('pltut') && !document.getElementById('pltut').classList.contains('hidden'), title: (document.querySelector('#pltut h3') || {}).textContent }));
  ok('tutorial opens in shaping', t.phase === 'shape' && t.tut, JSON.stringify(t)); await shot('tut_shape');
  // minimap
  const mm = await page.evaluate(() => { const m = document.getElementById('plmap'); return m && getComputedStyle(m).display !== 'none'; });
  ok('minimap visible', mm);
  // sculpt to complete step
  await page.mouse.move(700, 350); await page.mouse.down(); await page.mouse.move(740, 380, { steps: 3 }); await page.mouse.up();
  await page.waitForFunction(() => /Call the settlers/.test((document.querySelector('#pltut h3') || {}).textContent || ''), null, { timeout: 30000 }).catch(() => {});
  t = await page.evaluate(() => (document.querySelector('#pltut h3') || {}).textContent); ok('tutorial advanced to call settlers', /Call the settlers/.test(t), t); 
  await page.evaluate(() => { document.getElementById('callS').click(); }); await page.waitForTimeout(900);
  await page.evaluate(() => { document.getElementById('autoPick').click(); autoChooseStart(); }); await page.waitForTimeout(1500);
  await page.evaluate(() => { HM.ff && HM.ff(6); }); await page.waitForTimeout(1500);
  t = await page.evaluate(() => ({ phase: G.phase, title: (document.querySelector('#pltut h3') || {}).textContent })); console.log(JSON.stringify(t));
  // walk the remaining steps with the skip API and screenshot a few
  for (let i = 0; i < 14; i++) {
    const h = await page.evaluate(() => (document.querySelector('#pltut h3') || {}).textContent); if (!h) break;
    if (i === 2) await shot('tut_step' + i);
    await page.evaluate(() => plTut.skip()); await page.waitForTimeout(500);
  }
  const done = await page.evaluate(() => JSON.parse(localStorage.getItem('hearthmere_tut')));
  ok('tutorial can be completed', done && done.done, JSON.stringify(done));
  // notifications + prayer sound do not throw
  await page.evaluate(() => { plNotify('', 'A prayer', 'The wells run dry. Send us rain, Spirit!'); plNotify('pet', 'A petition', 'May we level the hill behind the mill?'); plNotify('urg', 'An urgent prayer', 'Raiders are at the gate!'); });
  await page.waitForTimeout(500); await shot('notify');
  // help
  await page.evaluate(() => { document.getElementById('ghelp').classList.remove('hidden'); }); await page.waitForTimeout(300); await page.evaluate(() => { document.querySelectorAll('#hlpTabsghelpClose button')[4].click(); }); await shot('help_ages');
  await page.evaluate(() => { document.getElementById('ghelp').classList.add('hidden'); });
  // tooltip
  await page.waitForFunction(() => { const l = document.getElementById('loading'); return !l || getComputedStyle(l).display === 'none'; }, null, { timeout: 90000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('#tools [data-tool="bless"]').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))); await page.waitForTimeout(900); await shot('tooltip');
  const tp = await page.evaluate(() => document.getElementById('pltip').classList.contains('show')); ok('tool tooltip shows', tp);
  await page.mouse.move(700, 300);
  // save slots: round trip
  const rt = await page.evaluate(async () => {
    const pop0 = popN(), day0 = dayN(), town = G.town;
    const ok1 = await saveGame('m:test1', { name: 'Test realm' });
    const ok2 = await autoSave(); const ok3 = await autoSave(); const ok4 = await autoSave(); const ok5 = await autoSave();
    const all = await dbAll();
    const autos = all.filter(r => r.auto && r.id.startsWith('auto:' + G.realm));
    const rec = await dbGet('m:test1');
    G.faith = 12345; await loadSaveRec(rec);
    return { ok: [ok1, ok2, ok3, ok4, ok5], autos: autos.length, ids: autos.map(a => a.id), faithRestored: G.faith !== 12345, pop0, pop1: popN(), town, town1: G.town, thumb: !!rec.thumb, towns: rec.towns };
  });
  ok('save slot round trip', rt.ok.every(Boolean) && rt.faithRestored && rt.pop0 === rt.pop1, JSON.stringify(rt));
  ok('three rolling autosaves', rt.autos === 3, JSON.stringify(rt.ids));
  await page.evaluate(() => openSaves()); await page.waitForTimeout(600); await shot('saves');
  await page.evaluate(() => document.getElementById('svClose').click());
  // pause menu
  await page.evaluate(() => openPause()); await page.waitForTimeout(400); 
  const pb = await page.evaluate(() => [...document.querySelectorAll('#pause button')].map(b => b.textContent)); ok('pause menu has help + tutorial', pb.includes('Help & controls') && pb.includes('Replay the tutorial'), pb.join('|'));
  await page.evaluate(() => closePause());
  // speed keys
  await page.keyboard.press('Shift+Digit2'); const sp = await page.evaluate(() => G.speed); ok('Shift+2 sets 3x', sp === 3, '' + sp);
  await page.keyboard.press('Shift+Digit1');
  await page.keyboard.press('Space'); await page.waitForTimeout(500); const pz = await page.evaluate(() => ({ p: G.paused, badge: getComputedStyle(document.getElementById('plspeed')).display })); ok('pause badge', pz.p && pz.badge !== 'none', JSON.stringify(pz)); await page.keyboard.press('Space');
  // audio exercise: run many sfx and the sampler + score without exceptions
  const ae = await page.evaluate(() => { const names = ['bell', 'toll', 'peal', 'chime', 'prayer', 'petition', 'tick', 'click', 'era', 'thunder', 'alarm', 'deny', 'pop', 'cheer', 'hammer', 'chop', 'saw', 'clang', 'pick', 'train', 'horn', 'steam', 'owl', 'gull', 'frog', 'dog', 'rooster', 'moo', 'chirp', 'splash']; let n = 0; for (const e of [0, 3, 5, 7]) { G.era = e; for (const nm of names) { sfx(nm, .5); n++; } } audSample(); for (let i = 0; i < 40; i++) audioUpdate(.1); stinger(3); stinger(7); G.era = 2; return { n, state: SND.ctx.state, tz: SND.tz, prof: SND.prof }; });
  ok('audio sfx + score run', ae.n > 100, JSON.stringify(ae));
  // minimap click moves camera
  const before = await page.evaluate(() => [cam.tx, cam.tz]); await page.mouse.click(1100 - 12 - 40, 660 - 12 - 40); await page.waitForTimeout(200); const after = await page.evaluate(() => [cam.tx, cam.tz]); ok('minimap click moves camera', Math.hypot(after[0] - before[0], after[1] - before[1]) > 5, JSON.stringify([before, after])); await shot('minimap');
  // perf guard steps
  const pg = await page.evaluate(() => { const n0 = HM.pl.PL.auto; return n0; }); ok('guard idle at start', pg === 0);
  ok('no console errors', errs.length === 0, errs.slice(0, 5).join('\n'));
  console.log(fails.length ? 'FAILED: ' + fails.join(', ') : 'ALL PASSED');
  await browser.close(); process.exit(fails.length ? 1 : 0);
})();
