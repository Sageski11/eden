'use strict';
// ================================================================ sandbox: build a whole city, then populate it
// The Buildings page (TAB) lists every building of every age with a small picture of each, grouped by age. Pick one and
// place it. Roads, paved streets, railways and highways are laid here too. "Populate" turns the finished city into a living
// settlement of the Spirit's realm and lets the folk carry on from there.
const SB={cat:null,paved:new Uint8Array(ROAD.length),icons:{},q:[],spot:null,open:false,line:null,shown:'',pop:false,iconBusy:false};
// [age, type, level, variant, placeholder name]. The real name and first trait are read from the generator when the picture is drawn.
const SBA=['Stone Age','Bronze Age','Iron Age','Medieval','High Medieval','Industrial','Modern','Futuristic'];
const SBTAG=['Flint, hide and fire','Copper, timber and the first wells','Iron tools and market towns','Castles, guilds and stone','Gothic spires and great halls','Steam, brick and rail','Concrete, glass and power','Spires of light and fusion'];
const SBC=[
  [0,'hall',0],[0,'house',0],[0,'church',0],[0,'camp',0,'lumber'],[0,'camp',0,'fish'],[0,'lodge'],[0,'farm'],[0,'quarry'],[0,'#road'],
  [1,'hall',1],[1,'house',1],[1,'well',0],[1,'smith',0],[1,'dock'],[1,'fishmkt'],
  [2,'house',2],[2,'mill',0],[2,'market',0],[2,'tavern',0],[2,'tower'],[2,'shipyard'],[2,'sawmill'],[2,'mason'],[2,'church',1],
  [3,'castle'],[3,'house',3],
  [4,'hall',2],[4,'church',2],
  [5,'house',4],[5,'hall',3],[5,'factory'],[5,'school',0],[5,'station'],[5,'market',1],[5,'tavern',1],[5,'smith',1],[5,'mill',1],[5,'well',1],[5,'#street'],[5,'#rail'],
  [6,'house',5],[6,'hall',4],[6,'powerplant'],[6,'school',1],[6,'market',2],[6,'tavern',2],[6,'smith',2],[6,'mill',2],[6,'well',2],[6,'#highway'],
  [7,'house',6],[7,'hall',5],[7,'fusion'],[7,'market',3],[7,'tavern',3],[7,'smith',3],[7,'mill',3],[7,'well',3]].map((a,i)=>({id:'c'+i,age:a[0],type:a[1],level:a[2]==null?null:a[2],variant:a[3]||null,n:BT[a[1]]||a[1],d:''}));
const SBTOOL={'#road':['road','Dirt road','Beaten earth between buildings. Drag to paint; Shift rubs it out.'],'#street':['street','Paved street','Tar and stone over the old lanes. Drag to paint; Shift lifts it.'],
  '#rail':['rail','Railway','Click two points: the land is cut and filled, and a train runs the line.'],'#highway':['highway','Highway','Click two points for a wide road of asphalt, with cars.']};
for(const c of SBC)if(c.type[0]==='#'){const t=SBTOOL[c.type];c.tool=t[0];c.n=t[1];c.d=t[2];}
Object.assign(HINTS,{street:'Drag to lay paved street. Shift lifts the paving.',rail:'Click where the railway starts, then where it ends. Esc to stop.',highway:'Click where the highway starts, then where it ends. Esc to stop.'});
BRUSH_DEF.street=1.6;
const sbCatFor=b=>SBC.find(c=>!c.tool&&c.type===b.type&&(c.level==null||c.level===(b.level==null?(b.type==='church'?2:b.type==='house'?3:0):b.level))&&(!c.variant||c.variant===b.variant))||SBC.find(c=>c.type===b.type);
function sbAgeOf(b){const c=sbCatFor(b);return c?c.age:(ERA_BUILD[b.type]||0);}

// ---------------- tools
function sbToolDefs(){return [['Shape the land',[['raise','Raise','1'],['lower','Lower','2'],['smooth','Smooth','3'],['flatten','Flatten','4'],['cliff','Cliff','5'],['terrace','Terrace','6'],['canyon','Canyon','7']]],
  ['Water',[['pour','Pour','8'],['spring','Spring','9'],['drain','Drain','0']]],['Nature',[['plant','Plant trees','T'],['fell','Fell trees','Y']]],
  ['Roads',[['road','Dirt road','G'],['street','Paved street',''],['rail','Railway',''],['highway','Highway','']]],
  ['Plan',[['inspect','Inspect','I'],['demolish','Demolish','X']]],
  ['Build',[['sb:book','Buildings','Tab'],SB.cat&&!SB.cat.tool?['b:'+SB.cat.type,SB.cat.n,'']:null,['sb:pop','Populate city','']].filter(Boolean)]];}
const _setTool0=setTool;
setTool=function(id){
  if(MODE==='sandbox'){if(id==='sb:book'){sbToggle(true);return;}if(id==='sb:pop'){sbPopDialog();return;}}
  if(!(id.startsWith('b:')&&SB.cat&&id==='b:'+SB.cat.type))SB.cat=null;
  SB.line=null;sbLineUpdate();
  _setTool0(id);
  if(MODE==='sandbox'){if(ghostB&&SB.cat){ghostB.level=SB.cat.level;ghostB.variant=SB.cat.variant;ghostKey='';}
    const key=SB.cat?SB.cat.id:'';if(key!==SB.shown){SB.shown=key;buildToolbox(sbToolDefs());}}
};
function sbPick(c,v){SB.cat=Object.assign({},c);if(c.variants)SB.cat.variant=v||c.variants[0];if(c.tool){SB.cat=null;SB.shown='';setTool(c.tool);}else{SB.shown='';setTool('b:'+c.type);}
  toast(c.tool?c.n:`${c.n}${c.variants?' ('+SB.cat.variant+')':''} ready — click the land (R rotate, V vary${c.variants?', C variant':''})`);}
// the sandbox's own hand-laid paving survives the network repaint
const _netPaint0=netPaint;
netPaint=function(){_netPaint0();const p=SB.paved;for(let k=0;k<p.length;k++)if(p[k])ROADT[k]=2;};
const _applyBrush0=applyBrush;
applyBrush=function(dt){
  if(tool!=='street')return _applyBrush0(dt);
  if(!hover)return;const R=brush.r,cx=hover.x+HALF,cz=hover.z+HALF,erase=shift;
  for(let j=Math.max(0,Math.floor(cz-R));j<=Math.min(N,Math.ceil(cz+R));j++)for(let i=Math.max(0,Math.floor(cx-R));i<=Math.min(N,Math.ceil(cx+R));i++){
    if(Math.hypot(i-cx,j-cz)>R*.8)continue;const k=j*S+i;if(erase){SB.paved[k]=0;if(ROADT[k]===2)ROADT[k]=0;}else if(W[k]<.1){SB.paved[k]=1;ROADT[k]=2;ROAD[k]=Math.max(ROAD[k],.9);}}
  tool='road';try{_applyBrush0(dt);}finally{tool='street';}
};
const _endStroke0=endStroke;
endStroke=function(){const t=tool;_endStroke0();if(t==='street'){recolorAll();}};
const _newWorld0=newWorld;
newWorld=function(seed){SB.paved.fill(0);if(G.net)G.net.lines=[];_newWorld0(seed);if(typeof netReload==='function')netReload();};

// ---------------- railway / highway: two clicks
const sbLineObj=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(48*3),3)),new THREE.LineBasicMaterial({color:0xffe9a0,depthTest:false,transparent:true,opacity:.95}));
sbLineObj.renderOrder=9;sbLineObj.frustumCulled=false;sbLineObj.visible=false;scene.add(sbLineObj);
function sbLineUpdate(){const L=SB.line;if(!L||!hover||!mouse.in){sbLineObj.visible=false;return;}const p=sbLineObj.geometry.attributes.position.array;
  for(let i=0;i<48;i++){const t=i/47,x=lerp(L.a[0],hover.x,t),z=lerp(L.a[1],hover.z,t);p[i*3]=x;p[i*3+1]=hAt(x,z)+Math.max(0,wAt(x,z))+.5;p[i*3+2]=z;}
  sbLineObj.geometry.attributes.position.needsUpdate=true;sbLineObj.visible=true;}
canvas.addEventListener('pointerdown',e=>{if(MODE!=='sandbox'||UIBLOCK||e.button!==0||(tool!=='rail'&&tool!=='highway'))return;e.stopImmediatePropagation();
  if(!hover)return;const p=[hover.x,hover.z];
  if(wAt(p[0],p[1])>.2){toast('The line cannot start in water');return;}
  if(!SB.line){SB.line={kind:tool,a:p};toast('Now click where it should end');return;}
  if(Math.hypot(p[0]-SB.line.a[0],p[1]-SB.line.a[1])<14){toast('Too short — pick a point further away');return;}
  pushUndo();const r=netBuild(SB.line.kind,SB.line.a,p);
  if(!r){undoStack.pop();toast('No way through there — try another route');return;}
  toast(`${SB.line.kind==='rail'?'Railway':'Highway'} laid: ${r.len} paces`);SB.line.a=p;recolorAll();},true);
function sbTick(){if(SB.line)sbLineUpdate();requestAnimationFrame(sbTick);}requestAnimationFrame(sbTick);

// ---------------- start
function startSandbox(){exitMenu();resetG();G.phase='sandbox';MODE='sandbox';$('title').classList.add('hidden');$('gtop').classList.add('hidden');$('prayers').classList.add('hidden');$('top').classList.remove('hidden');
  renderer.localClippingEnabled=false;SB.cat=null;SB.shown='';SB.line=null;SB.paved.fill(0);
  buildToolbox(sbToolDefs());
  SNOWF=0;AUTUMN=0;WINTER=0;waterU.uIce.value=0;treesDirty=true;
  newWorld(1337);setTool('inspect');setTime(+tod.value);layout();
  hintEl.textContent='Press TAB to open the Buildings page.';
  try{if(!localStorage.getItem('hearthmere_seen')){$('help').classList.remove('hidden');localStorage.setItem('hearthmere_seen','1');}}catch(e){}}

// ---------------- the Buildings page
const sbCss=document.createElement('style');sbCss.textContent=`
#sbPage{position:fixed;inset:0;z-index:60;display:flex;background:rgba(6,14,26,.74);backdrop-filter:blur(3px);font-family:'EB Garamond',Georgia,serif;color:#cfe3f2}
#sbPage.hidden{display:none}
#sbPage .fr{position:relative;margin:2.2vh 2.2vw;flex:1;display:flex;min-width:0;border:1px solid #3d6a8c;border-radius:4px;background:
 linear-gradient(rgba(120,180,230,.06) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,rgba(120,180,230,.06) 1px,transparent 1px) 0 0/28px 28px,
 radial-gradient(120% 90% at 20% 0%,#16324d 0%,#0b1a2b 70%);box-shadow:0 0 0 4px rgba(11,26,43,.9),0 0 0 5px #3d6a8c,0 24px 80px rgba(0,0,0,.6);overflow:hidden}
#sbPage .rail{width:236px;flex:none;padding:22px 16px 14px 20px;border-right:1px dashed #3d6a8c;display:flex;flex-direction:column;gap:10px;background:rgba(5,14,26,.35)}
#sbPage .rail h1{font-family:Cinzel,serif;font-size:19px;letter-spacing:2.4px;margin:0;color:#f3e3b0;line-height:1.2}
#sbPage .rail .sub{font-style:italic;font-size:14px;color:#8fb2cc;margin:0 0 6px}
#sbPage .rail input{background:rgba(255,255,255,.06);border:1px solid #3d6a8c;border-radius:2px;color:#e8f3fb;font:15px 'EB Garamond',serif;padding:6px 9px;outline:none;user-select:text;-webkit-user-select:text}
#sbPage .rail input:focus{border-color:#f3e3b0}
#sbPage .tl{position:relative;margin:8px 0 0 6px;padding-left:20px;display:flex;flex-direction:column;gap:3px;flex:1;overflow:auto}
#sbPage .tl:before{content:'';position:absolute;left:5px;top:10px;bottom:10px;width:2px;background:linear-gradient(#3d6a8c,#3d6a8c 70%,transparent)}
#sbPage .tl button{all:unset;cursor:pointer;position:relative;padding:6px 8px;border-radius:2px;font-size:15.5px;color:#a9c7dc;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
#sbPage .tl button:before{content:'';position:absolute;left:-19px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:50%;background:#0b1a2b;border:2px solid var(--ac);box-sizing:border-box}
#sbPage .tl button:hover{background:rgba(255,255,255,.06);color:#fff}
#sbPage .tl button.on{background:rgba(255,255,255,.1);color:#fff}
#sbPage .tl button.on:before{background:var(--ac);box-shadow:0 0 10px var(--ac)}
#sbPage .tl button i{font:normal 12px ui-monospace,Menlo,Consolas,monospace;color:#6f93ad}
#sbPage .keys{font:12px ui-monospace,Menlo,Consolas,monospace;color:#6f93ad;line-height:1.7}
#sbPage .keys b{color:#f3e3b0;font-weight:600}
#sbPage .main{position:relative;flex:1;overflow:auto;padding:8px 30px 40px;scroll-behavior:smooth;min-width:0}
#sbPage .sec{padding-top:22px}
#sbPage .sec header{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid var(--ac);padding-bottom:7px;margin-bottom:14px;position:relative}
#sbPage .sec header:after{content:'';position:absolute;left:0;bottom:-4px;width:46px;height:3px;background:var(--ac)}
#sbPage .sec .num{font:600 13px ui-monospace,Menlo,Consolas,monospace;color:var(--ac);letter-spacing:1px}
#sbPage .sec h2{font-family:Cinzel,serif;font-size:25px;letter-spacing:2px;margin:0;color:#fff;font-weight:700}
#sbPage .sec header span{font-style:italic;color:#8fb2cc;font-size:16px}
#sbPage .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:14px}
#sbPage .card{all:unset;cursor:pointer;position:relative;display:flex;flex-direction:column;background:rgba(7,19,33,.72);border:1px solid #2d526f;border-radius:2px;padding:9px 9px 10px;transition:transform .12s,border-color .12s,box-shadow .12s,background .12s}
#sbPage .card:before,#sbPage .card:after{content:'';position:absolute;width:11px;height:11px;border:2px solid var(--ac);opacity:.75}
#sbPage .card:before{left:-1px;top:-1px;border-right:0;border-bottom:0}#sbPage .card:after{right:-1px;bottom:-1px;border-left:0;border-top:0}
#sbPage .card:hover{transform:translateY(-3px);border-color:var(--ac);background:rgba(18,42,66,.9);box-shadow:0 8px 22px rgba(0,0,0,.45),0 0 0 1px var(--ac) inset}
#sbPage .card.sel{border-color:#f3e3b0;box-shadow:0 0 0 1px #f3e3b0 inset}
#sbPage .pic{height:132px;border-radius:1px;background:linear-gradient(180deg,var(--sky) 0%,#0e2236 100%);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
#sbPage .pic img{width:100%;height:100%;object-fit:cover;display:block}
#sbPage .pic .wait{position:absolute;width:34px;height:34px;border:2px solid #3d6a8c;border-top-color:var(--ac);border-radius:50%;animation:sbspin 1s linear infinite}
@keyframes sbspin{to{transform:rotate(360deg)}}
#sbPage .pic svg{width:70%;height:70%}
#sbPage .plate{font:11px ui-monospace,Menlo,Consolas,monospace;color:var(--ac);letter-spacing:1px;margin:8px 0 1px;display:flex;justify-content:space-between}
#sbPage .nm{font-family:Cinzel,serif;font-size:14.5px;font-weight:600;color:#fff;line-height:1.2;letter-spacing:.4px}
#sbPage .ds{font-size:13.5px;color:#8fb2cc;line-height:1.25;margin-top:3px;min-height:34px}
#sbPage .vs{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
#sbPage .vc{font:11px ui-monospace,Menlo,Consolas,monospace;color:#a9c7dc;border:1px solid #2d526f;border-radius:10px;padding:1px 8px;cursor:pointer;background:rgba(255,255,255,.03)}
#sbPage .vc:hover,#sbPage .vc.on{color:#10243a;background:var(--ac);border-color:var(--ac)}
#sbPage .card:focus-visible{outline:2px solid #f3e3b0}
#sbPage .empty{color:#8fb2cc;font-style:italic;padding:30px 0}
#sbPage .x{all:unset;position:absolute;right:16px;top:12px;z-index:2;cursor:pointer;font:13px ui-monospace,Menlo,Consolas,monospace;color:#8fb2cc;border:1px solid #3d6a8c;padding:4px 10px;border-radius:2px;background:rgba(5,14,26,.6)}
#sbPage .x:hover{color:#fff;border-color:#f3e3b0}
#sbPop{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(6,14,26,.6)}
#sbPop.hidden{display:none}
#sbPop .bx{width:min(440px,92vw);background:linear-gradient(#16324d,#0b1a2b);border:1px solid #3d6a8c;box-shadow:0 0 0 4px #0b1a2b,0 0 0 5px #3d6a8c,0 20px 60px rgba(0,0,0,.6);padding:22px 24px;color:#cfe3f2;font:17px 'EB Garamond',serif;border-radius:3px}
#sbPop h2{font-family:Cinzel,serif;color:#f3e3b0;letter-spacing:2px;font-size:20px;margin:0 0 6px}
#sbPop p{margin:6px 0;color:#a9c7dc}
#sbPop .st{font:13px ui-monospace,Menlo,Consolas,monospace;color:#8fb2cc;line-height:1.7;margin:10px 0;padding:8px 10px;border:1px dashed #3d6a8c}
#sbPop .st b{color:#fff;font-weight:600}#sbPop .err{color:#ff9d8a;font-weight:600}
#sbPop .ch{display:flex;gap:8px;margin:10px 0}
#sbPop .ch button{flex:1;background:rgba(255,255,255,.06);color:#cfe3f2;border:1px solid #3d6a8c;border-radius:2px;padding:7px 4px;font-size:15px}
#sbPop .ch button.on{background:#f3e3b0;color:#10243a;border-color:#f3e3b0}
#sbPop .go{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
#sbPop .go button{padding:7px 16px;border-radius:2px;font-size:16px}
#sbPop .go .pri{background:#f3e3b0;color:#10243a;border-color:#f3e3b0;font-weight:600}
`;document.head.appendChild(sbCss);
const sbAC=['#d9b27a','#d98f4e','#9db3c4','#d46a6a','#a98be0','#c9966b','#5fb4d6','#58e3c5'],sbSKY=['#6f8a5e','#7a7f4e','#5f7f95','#7f5f66','#6b5f8f','#78695a','#4f84a6','#3a6f7a'];
const sbPage=document.createElement('div');sbPage.id='sbPage';sbPage.className='hidden';document.body.appendChild(sbPage);
const ROMAN=['I','II','III','IV','V','VI','VII','VIII'];
const sbGlyph={road:'<path d="M10 54 C26 40 34 36 54 14" stroke="#c9a36a" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M10 54 C26 40 34 36 54 14" stroke="#e8cf9c" stroke-width="2" fill="none" stroke-dasharray="4 5"/>',
  street:'<path d="M8 50 L56 20" stroke="#4a4f57" stroke-width="12" stroke-linecap="round"/><path d="M8 50 L56 20" stroke="#e4c64a" stroke-width="2" stroke-dasharray="5 4"/>',
  rail:'<path d="M10 56 L54 8" stroke="#7a6a58" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 3"/><path d="M4 50 L48 2 M16 58 L60 10" stroke="#aab3bb" stroke-width="2.4"/>',
  highway:'<path d="M6 54 L58 14" stroke="#33363c" stroke-width="18" stroke-linecap="round"/><path d="M6 54 L58 14" stroke="#e4c64a" stroke-width="1.6"/><path d="M2 49 L54 9 M10 59 L62 19" stroke="#e8e4d0" stroke-width="1.6" stroke-dasharray="6 5"/>'};
const sbKey=(c,v)=>c.id+(v?'|'+v:'');
const sbDefV=c=>c.variants?c.variants[0]:null;
function sbCard(c,a,i){const v=sbDefV(c),k=sbKey(c,v),ic=SB.icons[k];
  const chips=c.variants?`<div class="vs">${c.variants.map(x=>`<span class="vc${x===v?' on':''}" data-v="${esc(x)}">${esc(x)}</span>`).join('')}</div>`:'';
  return `<div class="card${SB.cat&&SB.cat.id===c.id?' sel':''}" data-c="${c.id}" tabindex="0"><div class="pic" data-pic="${c.id}">${c.tool?`<svg viewBox="0 0 64 64">${sbGlyph[c.tool]}</svg>`:(ic?`<img src="${ic.url}" alt="">`:'<div class="wait"></div>')}</div>
    <div class="plate"><span>PLATE ${ROMAN[a]}-${String(i+1).padStart(2,'0')}</span><span>${c.tool?'ROAD':'BUILD'}</span></div><div class="nm" data-nm="${c.id}">${esc(ic?ic.name:c.n)}</div><div class="ds" data-ds="${c.id}">${esc(ic?ic.tr:c.d)}</div>${chips}</div>`;}
function sbBuildPage(){
  const q=(sbPage._q||'').toLowerCase();let rail='',main='';
  for(let a=0;a<8;a++){const all=SBC.filter(c=>c.age===a),items=all.filter(c=>!q||(c.n+' '+c.d+' '+c.type+' '+(c.variants||[]).join(' ')).toLowerCase().includes(q));
    rail+=`<button data-a="${a}" style="--ac:${sbAC[a]}">${SBA[a]}<i>${items.length}</i></button>`;
    main+=`<section class="sec" id="sbs${a}" style="--ac:${sbAC[a]};--sky:${sbSKY[a]}"><header><span class="num">AGE ${ROMAN[a]}</span><h2>${SBA[a]}</h2><span>${SBTAG[a]}</span></header><div class="grid">`+
      (items.length?items.map(c=>sbCard(c,a,all.indexOf(c))).join(''):'<div class="empty">Nothing of that name in this age.</div>')+`</div></section>`;}
  sbPage.innerHTML=`<div class="fr"><aside class="rail"><h1>The Builders’ Almanac</h1><p class="sub">Every work of every age</p><input id="sbQ" placeholder="Search the plates…" value="${esc(sbPage._q||'')}"><nav class="tl">${rail}</nav>
    <div class="keys"><b>Click</b> a plate to choose it, or one of its<br>variant tabs to choose that form<br><b>R</b> rotate · <b>V</b> vary · <b>C</b> next variant<br><b>Tab</b> close</div></aside><div class="main" id="sbMain">${main}</div><button class="x" id="sbX">Esc ✕</button></div>`;
  sbPage.querySelectorAll('.card').forEach(b=>{const c=SBC.find(x=>x.id===b.dataset.c);b.onclick=()=>{sbToggle(false);sbPick(c);};
    b.onkeydown=e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();b.click();}};
    b.querySelectorAll('.vc').forEach(ch=>{ch.onclick=e=>{e.stopPropagation();sbToggle(false);sbPick(c,ch.dataset.v);};
      ch.onmouseenter=()=>{b.querySelectorAll('.vc').forEach(x=>x.classList.toggle('on',x===ch));const k=sbKey(c,ch.dataset.v);if(SB.icons[k])sbShow(c,ch.dataset.v);else sbEnqueue([[c,ch.dataset.v,true]]);};});});
  sbPage.querySelectorAll('.tl button').forEach(b=>b.onclick=()=>{const s=document.getElementById('sbs'+b.dataset.a);if(s)s.scrollIntoView({block:'start'});});
  $('sbX').onclick=()=>sbToggle(false);
  const qi=$('sbQ');qi.oninput=()=>{sbPage._q=qi.value;const pos=qi.selectionStart;sbBuildPage();const n=$('sbQ');n.focus();n.setSelectionRange(pos,pos);};
  const main2=$('sbMain');main2.onscroll=sbSpy;sbSpy();}
function sbShow(c,v){const ic=SB.icons[sbKey(c,v)];if(!ic)return;const pic=sbPage.querySelector(`[data-pic="${c.id}"]`);if(pic)pic.innerHTML=`<img src="${ic.url}" alt="">`;
  const nm=sbPage.querySelector(`[data-nm="${c.id}"]`);if(nm)nm.textContent=ic.name;const ds=sbPage.querySelector(`[data-ds="${c.id}"]`);if(ds)ds.textContent=ic.tr;}
function sbSpy(){const m=$('sbMain');if(!m)return;let cur=0;for(let a=0;a<8;a++){const s=document.getElementById('sbs'+a);if(s&&s.offsetTop<=m.scrollTop+90)cur=a;}
  sbPage.querySelectorAll('.tl button').forEach(b=>b.classList.toggle('on',+b.dataset.a===cur));}
function sbToggle(on){if(MODE!=='sandbox')return;if(on==null)on=!SB.open;if(on===SB.open)return;
  if(on){if(UIBLOCK)return;SB.open=true;UIBLOCK=true;sbPage._q='';sbBuildPage();sbPage.classList.remove('hidden');sbEnqueue(SBC.filter(c=>!c.tool).map(c=>[c,sbDefV(c)]));}
  else{SB.open=false;UIBLOCK=false;sbPage.classList.add('hidden');for(const k in keys)keys[k]=false;}}
addEventListener('keydown',e=>{if(MODE!=='sandbox')return;
  if(e.code==='Tab'){e.preventDefault();e.stopImmediatePropagation();if(SB.pop)return;sbToggle(!SB.open);return;}
  if(e.code==='Escape'&&SB.pop){sbPopClose();e.stopImmediatePropagation();return;}
  if(e.code==='Escape'&&SB.open){sbToggle(false);e.stopImmediatePropagation();return;}
  if(e.code==='KeyC'&&!SB.open&&!SB.pop&&!UIBLOCK&&e.target.tagName!=='INPUT')sbCycleVariant();},true);
// C: next variant of the building being placed, or of the selected building
function sbCycleVariant(){const nxt=(vs,cur)=>vs[(Math.max(0,vs.indexOf(cur))+1)%vs.length];
  if(ghostB&&SB.cat&&SB.cat.variants){SB.cat.variant=ghostB.variant=nxt(SB.cat.variants,ghostB.variant);ghostKey='';toast('Variant: '+ghostB.variant);return;}
  const d=selected&&BDEF[selected.type];if(d){pushUndo();selected.variant=nxt(d.variants,selected.variant);realize(selected);rebuildNear(selected.x,selected.z,12,selected);showInspector();toast('Variant: '+selected.variant);}}

// ---------------- the little pictures: each building is built on a bare, level spot and photographed
let sbIS=null,sbICam=null;
function sbFlatSpot(){let best=[0,0],bs=1e9;for(let n=0;n<700;n++){const x=(Math.random()-.5)*(N-140),z=(Math.random()-.5)*(N-140);if(wAt(x,z)>.01)continue;let mn=hAt(x,z),mx=mn,wet=false;
    for(let k=0;k<16;k++){const a=k/16*TAU,r=k%2?9:16,h=hAt(x+Math.cos(a)*r,z+Math.sin(a)*r);mn=Math.min(mn,h);mx=Math.max(mx,h);if(wAt(x+Math.cos(a)*r,z+Math.sin(a)*r)>.01)wet=true;}
    if(wet)continue;let tr=0;for(const t of trees)if(Math.abs(t.x-x)<20&&Math.abs(t.z-z)<20)tr++;const s=(mx-mn)*6+tr;if(s<bs){bs=s;best=[x,z];}}return best;}
// items are [catalog entry, variant, show-now]; pictures are drawn a few at a time
function sbEnqueue(items){for(const it of items)if(!SB.icons[sbKey(it[0],it[1])]&&!SB.q.some(q=>q[0]===it[0]&&q[1]===it[1])){if(it[2])SB.q.unshift(it);else SB.q.push(it);}if(SB.q.length&&!SB.iconBusy)sbRun();}
function sbShot(c,v,sx,sz,PX,pr,cv){
  const b=newRecord(c.type,sx,sz,0.5,1000+SBC.indexOf(c)*37);b.level=c.level;b.variant=v||c.variant;b.manual=true;
  const g=generate(b,false);sbIS.add(g.grp);sbIS.background=new THREE.Color(sbSKY[c.age]).lerp(new THREE.Color(0x10243a),.35);
  const box=new THREE.Box3().setFromObject(g.grp),ctr=box.getCenter(new THREE.Vector3()),sz2=box.getSize(new THREE.Vector3()),rad=box.getBoundingSphere(new THREE.Sphere()).radius;
  const dist=rad/Math.sin(sbICam.fov*PI/360)*.92,dir=new THREE.Vector3(.75,.62,1).normalize();sbICam.position.copy(ctr).addScaledVector(dir,dist);sbICam.lookAt(ctr.x,ctr.y-sz2.y*.08,ctr.z);
  renderer.setViewport(0,0,PX/pr,PX/pr);renderer.setScissorTest(false);renderer.render(sbIS,sbICam);
  const cn=document.createElement('canvas');cn.width=cn.height=PX;cn.getContext('2d').drawImage(cv,0,cv.height-PX,PX,PX,0,0,PX,PX);
  const o={url:cn.toDataURL('image/png'),name:g.info.name,tr:(g.info.traits&&g.info.traits[0])||''};sbIS.remove(g.grp);disposeObj(g.grp);return o;}
function sbRun(){if(SB.iconBusy||!SB.q.length)return;SB.iconBusy=true;
  if(!sbIS){sbIS=new THREE.Scene();sbIS.add(new THREE.HemisphereLight(0xe6f0ff,0x7a6a4f,.6));const d=new THREE.DirectionalLight(0xfff1d6,1.15);d.position.set(-50,80,60);sbIS.add(d);sbICam=new THREE.PerspectiveCamera(27,1,1,900);}
  if(!SB.spot)SB.spot=sbFlatSpot();const [sx,sz]=SB.spot,gy=hAt(sx,sz),saved=buildings.splice(0);BVER++;const PX=160,pr=renderer.getPixelRatio(),cv=renderer.domElement;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(15,17,.6,40),new THREE.MeshStandardMaterial({color:0x56703f,roughness:1}));disc.position.set(sx,gy-.35,sz);sbIS.add(disc);
  const part=()=>{const t0=performance.now();
    try{while(SB.q.length&&performance.now()-t0<60){const [c,v]=SB.q.shift();
      try{const o=sbShot(c,v,sx,sz,PX,pr,cv);SB.icons[sbKey(c,v)]=o;if(!v||v===sbDefV(c))c.n=o.name;
        if(sbPage.querySelector(`[data-pic="${c.id}"]`)){const on=sbPage.querySelector(`[data-c="${c.id}"] .vc.on`);if(!on||on.dataset.v===v||!c.variants)sbShow(c,v);}}
      catch(err){console.error('icon',c.type,v,err);SB.icons[sbKey(c,v)]={url:'',name:c.n,tr:'(could not be drawn)'};}}}
    catch(err){console.error(err);SB.q.length=0;}
    if(SB.q.length)return setTimeout(part,0);
    sbIS.remove(disc);disc.geometry.dispose();disc.material.dispose();buildings.push(...saved);BVER++;renderer.setViewport(0,0,innerWidth,innerHeight);
    SB.iconBusy=false;if(MODE==='sandbox'&&SB.shown!==undefined){SB.shown='';buildToolbox(sbToolDefs());}};
  setTimeout(part,0);}

// ---------------- populate: the city comes alive
function sbStats(){const homes=buildings.filter(b=>b.type==='house'||b.type==='hall');let beds=0;for(const b of homes)beds+=b.type==='house'?(b._cap||3):(b.level?2:6);
  let age=0;for(const b of buildings)age=Math.max(age,sbAgeOf(b));
  const hall=buildings.filter(b=>b.type==='hall').sort((a,b)=>(b.level||0)-(a.level||0))[0]||null;
  return {n:buildings.length,houses:buildings.filter(b=>b.type==='house').length,beds,age,hall};}
const sbPopEl=document.createElement('div');sbPopEl.id='sbPop';sbPopEl.className='hidden';document.body.appendChild(sbPopEl);
let sbFill=.6;
function sbPopDialog(){if(MODE!=='sandbox')return;const st=sbStats();SB.pop=true;UIBLOCK=true;
  const bad=!st.hall?'Place a Town Hall (any age) first — it will be the heart of the city.':(st.houses<1&&st.hall.level>0?'The city needs at least one house.':'');
  sbPopEl.innerHTML=`<div class="bx"><h2>Populate the city</h2><p>The folk will move into the homes you built, then live by their own wits: they will farm, trade, pray, doubt and build on. Your powers become a god’s again, and Faith returns.</p>
    <div class="st">Buildings <b>${st.n}</b> · Homes <b>${st.houses}</b> · Beds <b>${st.beds}</b><br>The age of the city: <b>${SBA[st.age]}</b>${st.hall?'':''}</div>
    ${bad?`<p class="err">${bad}</p>`:`<p>How full should the homes be?</p><div class="ch"><button data-f=".35"${sbFill===.35?' class="on"':''}>A few families</button><button data-f=".6"${sbFill===.6?' class="on"':''}>Settled</button><button data-f=".9"${sbFill===.9?' class="on"':''}>Crowded</button></div>`}
    <div class="go"><button id="sbPopNo">Keep building</button>${bad?'':'<button class="pri" id="sbPopGo">Breathe life into it</button>'}</div></div>`;
  sbPopEl.classList.remove('hidden');$('sbPopNo').onclick=sbPopClose;
  sbPopEl.querySelectorAll('.ch button').forEach(b=>b.onclick=()=>{sbFill=+b.dataset.f;sbPopEl.querySelectorAll('.ch button').forEach(x=>x.classList.toggle('on',x===b));});
  if(!bad)$('sbPopGo').onclick=()=>{const f=sbFill;sbPopClose();sbPopulate(f);};}
function sbPopClose(){SB.pop=false;UIBLOCK=false;sbPopEl.classList.add('hidden');}
function sbPopulate(fill){const st=sbStats();if(!st.hall)return;const lines=G.net?G.net.lines:[],age=st.age,keep=buildings.slice();
  enterGodUI();resetG();G.net={lines,paved:false};G.seed=1337;G.phase='play';G.era=age;G.sandboxCity=true;
  // what the folk already know
  const xp=age>=5?380:age>=4?380:age>=3?200:age>=2?90:age>=1?30:0;for(const k of Object.keys(SKN))G.sk[k]=xp;if(age>=6){G.sk.machine=380;G.sk.science=200;}else if(age>=5){G.sk.machine=90;G.sk.science=30;}
  for(const u of UNL)if(Object.entries(u.req).every(([k,l])=>skLvl(k)>=l))G.unl[u.k]=true;
  for(const b of keep){b.manual=true;b.cw=skLvl('work');b.cs=skLvl('stone');b.build=null;b.upg=null;if(b.type==='house'&&b.level==null)b.level=3;}
  G.center=st.hall;makePlan(G.center);for(const b of keep)onPlannedBuild(b);
  const target=Math.max(5,Math.round(st.beds*fill));
  G.food=target*9+80;G.wood=90+target*2;G.stone=age>=1?80+target*2:0;G.faith=120;G.hap=G.hapT=64;G.center.stock={wood:G.wood,stone:G.stone,food:G.food};
  // families move in
  let left=target;const homes=keep.filter(b=>b.type==='house'||b.type==='hall');
  for(const h of homes.sort(()=>rnd()-.5)){if(left<=0)break;const cap=h.type==='house'?(h._cap||3):(h.level?2:6),n=Math.min(cap,left);const fam=pickA(FAM),[dx,dz]=doorOf(h);let prev=null;
    for(let i=0;i<n;i++){const kid=i>=2&&n>2;const v=newVillager({fam,x:dx+(rnd()-.5)*2,z:dz+(rnd()-.5)*2,home:h.id,age:kid?4+Math.floor(rnd()*9):20+Math.floor(rnd()*22),female:i===1?true:i===0?false:undefined});
      if(i===1&&prev){v.spouse=prev.id;prev.spouse=v.id;}if(kid&&G.vill.length>2)v.parents=[G.vill[G.vill.length-1-i+0].id];if(i===0)prev=v;}
    left-=n;}
  G.vill.forEach(v=>{v.arriving=false;});
  chron(`The valley of ${G.town} was long ago shaped by the Spirit’s hand. Today its homes filled, and its folk began to live.`,true);
  SB.open=false;SB.cat=null;SB.shown='';sbPage.classList.add('hidden');UIBLOCK=false;sbLineObj.visible=false;
  assignHomes();assignJobs();refreshCivic();gridDirty=true;netReload();for(const b of buildings)realize(b);
  buildToolbox(godToolDefs());setTool('inspect');refreshMarkers();updateUI(true);applyUI();cam.tx=G.center.x;cam.tz=G.center.z;cam.dist=Math.max(80,cam.dist*.7);
  showBanner(G.town,'Your city lives. Watch where the folk take it.');sfx('chime');hintEl.textContent='';}
