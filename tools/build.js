// Builds dist/Hearthmere.html: every script from Eden.html concatenated, minified (terser) and inlined into a single file.
// usage: node tools/build.js      (needs terser: `npm i terser`, or TERSER=/path/to/terser)
const fs = require('fs'), path = require('path');
let terser; try { terser = require(process.env.TERSER || 'terser'); } catch (e) { console.error('terser not found: run `npm i terser` (or set TERSER=/path/to/terser)'); process.exit(1); }
(async () => {
  const html = fs.readFileSync('Eden.html', 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const lib = srcs.find(s => /three\.min\.js$/.test(s)), own = srcs.filter(s => s !== lib);
  const code = own.map(s => fs.readFileSync(s, 'utf8')).join('\n;\n');
  const t0 = Date.now();
  const res = await terser.minify(code, { compress: { passes: 2 }, mangle: true, format: { comments: false } });
  if (res.error) throw res.error;
  const esc = s => s.replace(/<\/script/gi, '<\\/script');
  const first = html.indexOf('<script src='), last = html.lastIndexOf('</script>') + '</script>'.length;
  const out = html.slice(0, first) + '<script>' + esc(fs.readFileSync(lib, 'utf8')) + '</script>\n<script>' + esc(res.code) + '</script>' + html.slice(last);
  fs.mkdirSync('dist', { recursive: true }); fs.writeFileSync('dist/Hearthmere.html', out);
  const k = n => (n / 1024).toFixed(0) + ' KB';
  console.log(`scripts: ${own.length}  source ${k(Buffer.byteLength(code))} -> minified ${k(Buffer.byteLength(res.code))}  | dist/Hearthmere.html ${k(Buffer.byteLength(out))}  (${Date.now() - t0} ms)`);
})();
