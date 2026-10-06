'use strict';
// ================================================================ POLISH: settings, graphics detail, performance guard, tooltips, notifications,
// minimap, speed/pause UX, touch, the guided tutorial with its tips, and the Help screens. (Audio lives in audio.js, saves in saves.js.)
{
const q1=(s,r)=>(r||document).querySelector(s),qa=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}},lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
const mk=(tag,id,cls,html,parent)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(html!=null)e.innerHTML=html;(parent||document.body).appendChild(e);return e;};
const inPlay=()=>MODE==='god'||MODE==='sandbox';
// ---------------------------------------------------------------- styles
mk('style','plCSS',null,`
#plspeed{position:fixed;top:72px;left:50%;transform:translateX(-50%) scale(var(--ui));transform-origin:50% 0;padding:3px 16px;font-family:Cinzel,serif;font-size:13px;letter-spacing:.22em;color:#fff3d0;background:rgba(30,20,12,.82);border:1px solid rgba(201,154,59,.6);border-radius:3px;z-index:5;pointer-events:none;animation:plpulse 2s ease-in-out infinite}
@keyframes plpulse{50%{opacity:.62}}
#plfps{position:fixed;right:12px;bottom:204px;padding:1px 9px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#d8f0c0;background:rgba(10,14,8,.72);border-radius:3px;z-index:60;pointer-events:none;white-space:nowrap}
#pltip{position:fixed;z-index:70;max-width:300px;padding:8px 11px;font-size:14.5px;line-height:1.3;color:#f0e2c2;background:rgba(26,17,10,.96);border:1px solid rgba(201,154,59,.6);border-radius:4px;box-shadow:0 6px 20px rgba(0,0,0,.5);pointer-events:none;opacity:0;transition:opacity .12s;transform-origin:0 0}
#pltip.show{opacity:1}#pltip b{font-family:Cinzel,serif;color:#f2c873;letter-spacing:.04em}#pltip kbd{font-family:Cinzel,serif;font-size:11px;border:1px solid #c99a3b;border-radius:2px;padding:0 4px;margin-left:6px;color:#f2c873}
#pltip .c{display:block;margin-top:4px;color:#e8c87a;font-style:italic;font-size:13.5px}#pltip .l{display:block;margin-top:4px;color:#e8a08a;font-size:13.5px}
body.nohints .tg kbd,body.nohints #hint{display:none!important}
#plnote{position:fixed;top:112px;left:50%;transform:translateX(-50%) scale(var(--ui));transform-origin:50% 0;display:flex;flex-direction:column;gap:6px;z-index:6;width:380px;max-width:92vw;pointer-events:none}
#plnote .n{pointer-events:auto;cursor:pointer;padding:7px 12px 7px 38px;position:relative;font-size:15px;line-height:1.25;animation:plin .35s ease-out;transition:opacity .5s,transform .5s}
#plnote .n i{position:absolute;left:10px;top:8px;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3c4,#d4a73c 60%,#7a4a12);box-shadow:0 0 8px rgba(212,167,60,.7)}
#plnote .n.pet i{background:radial-gradient(circle at 35% 30%,#d6ecff,#4a83c4 60%,#1c3a63);box-shadow:0 0 8px rgba(74,131,196,.7)}
#plnote .n.urg i{background:radial-gradient(circle at 35% 30%,#ffd0c4,#c4452e 60%,#5a150c);box-shadow:0 0 8px rgba(196,69,46,.8)}
#plnote .n b{font-family:Cinzel,serif;font-size:12px;letter-spacing:.12em;color:var(--wood2);display:block}
#plnote .n.out{opacity:0;transform:translateX(24px)}
@keyframes plin{from{opacity:0;transform:translateY(-8px)}}
#plmap{position:fixed;right:12px;bottom:12px;width:184px;height:184px;padding:5px;z-index:4;transform:scale(var(--ui));transform-origin:100% 100%}
#plmap canvas{width:174px;height:174px;display:block;border-radius:2px;cursor:crosshair;background:#2a3a2a}
#plmap .mt{position:absolute;right:7px;top:7px;width:18px;height:18px;padding:0;font-size:13px;line-height:15px;opacity:.75;border-radius:2px}
#plmap.min{width:34px;height:34px;padding:3px}#plmap.min canvas{display:none}#plmap.min .mt{right:3px;top:3px}
body.inmenu #plmap,body.photo #plmap,body.inmenu #plspeed,body.photo #plspeed,body.inmenu #plnote,body.inmenu #pltut,body.photo #pltut,body.inmenu #plhl,body.photo #plhl{display:none!important}
#plhl{position:fixed;z-index:35;pointer-events:none;border:2px solid #ffe08a;border-radius:6px;box-shadow:0 0 0 3px rgba(255,224,138,.25),0 0 22px 4px rgba(255,214,102,.75);animation:plring 1.4s ease-in-out infinite;transition:left .25s,top .25s,width .25s,height .25s}
@keyframes plring{50%{box-shadow:0 0 0 7px rgba(255,224,138,.12),0 0 30px 8px rgba(255,214,102,.5)}}
body.reduce #plhl,body.reduce #plspeed,body.reduce #plnote .n{animation:none!important}
body.reduce *{scroll-behavior:auto!important}
body.reduce #title canvas#mart{display:none}
#pltut{position:fixed;left:50%;bottom:92px;transform:translateX(-50%) scale(var(--ui));transform-origin:50% 100%;width:440px;max-width:92vw;padding:14px 18px 12px;z-index:36;animation:plin .4s ease-out}
#pltut .k{font-family:Cinzel,serif;font-size:11px;letter-spacing:.2em;color:var(--wood2);display:flex;justify-content:space-between;align-items:center}
#pltut h3{font-family:Cinzel,serif;font-size:19px;margin:3px 0 4px;color:var(--wood)}
#pltut kbd,#pltut p kbd{font-family:Cinzel,serif;font-size:11.5px;border:1px solid #8a6a44;border-radius:2px;padding:0 4px;background:rgba(255,250,235,.5)}
#pltut p{margin:0 0 6px;font-size:16px;line-height:1.3;color:var(--ink)}
#pltut .task{margin:8px 0 2px;padding:5px 9px;border-left:3px solid var(--gold);background:rgba(201,154,59,.16);font-size:15px;color:var(--ink)}
#pltut .task.ok{border-color:#4f7a30;background:rgba(80,130,50,.18)}
#pltut .task:before{content:'\\25CB  ';color:var(--gold)}#pltut .task.ok:before{content:'\\2713  ';color:#3f6a24;font-weight:700}
#pltut .row{display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:10px}
#pltut .dots{display:flex;gap:4px;flex-wrap:wrap}#pltut .dots i{width:7px;height:7px;border-radius:50%;background:#bfa070;opacity:.55}#pltut .dots i.d{background:#6e4a2a;opacity:1}#pltut .dots i.c{background:var(--gold);opacity:1;box-shadow:0 0 5px var(--gold)}
#pltut .lnk{background:none;border:none;box-shadow:none;color:var(--ink2);text-decoration:underline;padding:2px 4px;font-size:14px}
#pltut.tip{border-color:#4a6fa0}
#plsub{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);padding:3px 14px;font-size:15px;font-style:italic;color:#fff3d0;background:rgba(20,14,8,.78);border-radius:12px;z-index:6;pointer-events:none;opacity:0;transition:opacity .3s}#plsub.show{opacity:1}
#settings .scard{max-height:calc(94vh/var(--ui));overflow-y:auto;width:560px}
#settings .scard::-webkit-scrollbar{width:8px}#settings .scard::-webkit-scrollbar-thumb{background:rgba(201,154,59,.5);border-radius:4px}
.qbtns.wrap{flex-wrap:wrap}.qbtns.wrap button{flex:1 1 22%;padding:5px 6px;font-size:15px}.qbtns.five button{flex:1 1 17%}
.srow .lab small{display:block;font-size:12.5px;color:#a8936c;font-style:italic;margin-top:1px}
#settings .schk small{color:#a8936c;font-style:italic}
.sbtns{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.sbtns button{flex:1}
body.cb .pr.urgent:before{content:'\\26A0  ';font-weight:700}
body.cb #gHap{background:linear-gradient(90deg,#d98a1c,#e8e0a0 50%,#2a6fb0)!important}
body.cb .pr{border-left:4px solid #2a6fb0}body.cb .pr.urgent{border-left:4px solid #d98a1c;font-weight:600}
#hlpTabs{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 10px;border-bottom:1px solid #b89a6a;padding-bottom:6px}
#hlpTabs button{padding:3px 10px;font-size:14.5px}#hlpTabs button.on{background:linear-gradient(#6e4a2a,#4a2f19);color:#f6e9c8}
.hlpBody{min-height:300px;font-size:16px;line-height:1.33;color:var(--ink)}.hlpBody h4{font-family:Cinzel,serif;color:var(--wood2);margin:12px 0 3px;font-size:15px;letter-spacing:.06em}
.hlpBody p{margin:4px 0 6px;color:var(--ink)}.hlpBody ul{margin:4px 0 6px;padding-left:20px}.hlpBody li{margin:2px 0}
.hlpBody table{width:100%;border-collapse:collapse;font-size:15px}.hlpBody td{padding:3px 4px;border-bottom:1px dotted #b89a6a;vertical-align:top}.hlpBody td:first-child{font-weight:600;white-space:nowrap;width:38%}
.hlpBody kbd{font-family:Cinzel,serif;font-size:11.5px;border:1px solid #8a6a44;border-radius:2px;padding:0 4px;background:rgba(255,250,235,.5)}
canvas{touch-action:none}
`);
// ---------------------------------------------------------------- graphics detail (on top of the three presets in saves.js)
const GFX_DEF={shadow:'auto',trees:1,parts:1,res:1,lod:1};
const gfx=()=>Object.assign({},GFX_DEF,SETS.gfx||{});
const AUTO_STEPS=[ // extra savings applied, in order, when the game cannot keep up (not saved: your own choices come back on a reload)
  {name:'fewer particles and trees',f:g=>{g.parts=Math.min(g.parts,.5);g.trees=Math.min(g.trees,.8);}},
  {name:'softer shadows and a lighter image',f:g=>{if(g.shadow!=='off')g.shadow='low';g.res=Math.min(g.res,.85);g.lod=Math.min(g.lod,.8);}},
  {name:'no shadows, a smaller image, closer folk detail',f:g=>{g.shadow='off';g.res=Math.min(g.res,.7);g.lod=Math.min(g.lod,.6);g.parts=Math.min(g.parts,.3);g.trees=Math.min(g.trees,.6);}}];
const PL={auto:0,fpsAvg:60,msAvg:16,frames:0};
window.plApplyGfx=function(preset){// called by applyQuality (saves.js) and when a setting changes
  if(preset)PL.auto=0;// choosing a preset yourself takes the controls back from the performance guard
  const g=gfx();for(let i=0;i<PL.auto;i++)AUTO_STEPS[i].f(g);
  const q=preset||(typeof QUAL!=='undefined'?QUAL[qualKey]:null);if(!q)return;
  const lowq=location.search.includes('lowq');
  renderer.setPixelRatio(Math.max(.5,Math.min(devicePixelRatio,q.pr)*g.res));renderer.setSize(innerWidth,innerHeight);
  sun.castShadow=g.shadow!=='off';const sz=lowq||g.shadow==='low'?1024:g.shadow==='high'?4096:q.sh;
  if(sun.shadow.mapSize.x!==sz){sun.shadow.mapSize.set(sz,sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  TREE2.R=Math.round(q.t2*g.trees);treesDirty=true;PL.parts=g.parts;
  LOD.A=Math.round(30*g.lod);LOD.B=Math.round(100*g.lod);};
// fewer particles on demand: drop a share of what is spawned (the pool is a ring buffer, so nothing else changes)
{const _spawn=spawn;spawn=function(){if(PL.parts<1&&Math.random()>PL.parts)return;return _spawn.apply(null,arguments);};PL.parts=1;}
// ---------------------------------------------------------------- performance guard and the FPS meter
{let acc=0,n=0,bad=0,last=0,hist=[],fpsEl=null;
  const tick=now=>{requestAnimationFrame(tick);
    if(last){const d=now-last;if(inPlay()&&!document.hidden&&d<400&&!PAUSED&&!(typeof SB!=='undefined'&&SB.open)){acc+=d;n++;
      if(n>=60){PL.msAvg=acc/n;PL.fpsAvg=1000/PL.msAvg;hist.push(PL.msAvg);if(hist.length>3)hist.shift();acc=0;n=0;
        if(SETS.autoQ!==false&&(!navigator.webdriver||location.search.includes('forceguard'))&&!location.search.includes('lowq')){
          bad=PL.msAvg>36?bad+1:0;
          if(bad>=3&&PL.auto<AUTO_STEPS.length){bad=0;PL.auto++;plApplyGfx();toast('The game was struggling, so detail was eased: '+AUTO_STEPS[PL.auto-1].name+' (Settings to change)');}}}}}
    last=now;PL.frames++;
    if(SETS.fps){if(!fpsEl)fpsEl=mk('div','plfps');if((PL.frames&15)===0){fpsEl.style.display=inPlay()?'':'none';
      fpsEl.textContent=Math.round(PL.fpsAvg)+' fps · '+PL.msAvg.toFixed(1)+' ms'+(MODE==='god'?` · near ${LOD.n[0]} mid ${LOD.n[1]} far ${LOD.n[2]}`:'')+(PL.auto?` · eased ${PL.auto}`:'');}}else if(fpsEl){fpsEl.remove();fpsEl=null;}
    // sandbox has no god loop: keep the ambience going there too
    if(MODE==='sandbox'&&typeof audioUpdate==='function'){const dt=Math.min(.1,(now-(tick.s||now))/1000);audioUpdate(dt);}tick.s=now;
    if(SETS.reduce){if(typeof shake!=='undefined'&&shake>0)shake=0;if(typeof flash!=='undefined'&&flash>.2)flash=.2;}};
  requestAnimationFrame(tick);}
// ---------------------------------------------------------------- settings: extra sections injected into the existing panel
{const card=q1('#settings .scard');
  const sec=(title,html)=>`<h3>${title}</h3>${html}`;
  const seg=(id,opts)=>`<div class="qbtns wrap${opts.length>4?' five':''}" id="${id}">${opts.map(([v,l])=>`<button data-v="${v}">${l}</button>`).join('')}</div>`;
  const sl=(id,oid,lab,sub,min,max)=>`<div class="srow"><label for="${id}" class="lab">${lab}${sub?`<small>${sub}</small>`:''}</label><input type="range" id="${id}" min="${min}" max="${max}"><output id="${oid}"></output></div>`;
  const chk=(id,lab,sub)=>`<label class="schk"><input type="checkbox" id="${id}"> <span>${lab}${sub?` <small>${sub}</small>`:''}</span></label>`;
  const box=mk('div','plSetX',null,
    sec('GRAPHICS DETAIL','<p class="sdesc">Fine control on top of the quality preset.</p>'+
      '<div class="srow"><label class="lab">Shadows</label><span></span><span></span></div>'+seg('sShadow',[['auto','Preset'],['high','High'],['low','Low'],['off','Off']])+
      '<div class="srow"><label class="lab">Trees</label><span></span><span></span></div>'+seg('sTrees',[['0.6','Fewer'],['1','Normal'],['1.3','Many']])+
      sl('sParts','oParts','Particles','smoke, sparks, rain splashes',20,100)+sl('sRes','oRes','Image sharpness','render resolution',50,100)+sl('sLod','oLod','Folk detail range','how far from the camera folk are fully animated',50,150))+
    sec('CAMERA','<div class="srow" style="margin-top:2px"><span></span><span></span><span></span></div>'+sl('sSens','oSens','Mouse sensitivity','orbit and pan',40,220)+chk('sInvX','Invert horizontal orbit')+chk('sInvY','Invert vertical orbit'))+
    sec('INTERFACE','<div class="srow"><label class="lab">Autosave</label><span></span><span></span></div>'+seg('sAuto',[['0','Off'],['60','1 min'],['180','3 min'],['300','5 min'],['600','10 min']])+
      chk('sHints','Show key hints and tool descriptions')+chk('sTipsOn','Show a tip the first time things happen','petitions, raiders, sickness...')+chk('sCapt','Caption notable sounds','bells, thunder, trains, cheers')+chk('sReduce','Reduce motion','no screen shake or lightning flash, still highlights')+chk('sCB','Colour-blind friendly cues','shapes and a blue-orange palette beside red and green')+chk('sFps','Show frame-rate meter')+
      '<div class="sbtns"><button id="sTut">Replay the tutorial</button><button id="sTips">Show all tips again</button></div>'));
  box.style.display='contents';
  const foot=q1('.sfoot',card);if(foot)card.insertBefore(box,foot);else card.appendChild(box);
  const segSet=(id,val)=>{for(const b of qa('#'+id+' button'))b.classList.toggle('on',b.dataset.v===String(val));};
  const near=(id,val,list)=>{let best=list[0];for(const v of list)if(Math.abs(v-val)<Math.abs(best-val))best=v;segSet(id,best);};
  const G2=()=>(SETS.gfx=SETS.gfx||{});
  const sync=()=>{const g=gfx();segSet('sShadow',g.shadow);near('sTrees',g.trees,[.6,1,1.3]);
    const slv=(id,oid,v,fmt)=>{const el=$(id);el.value=v;$(oid).textContent=fmt?fmt(v):v+'%';};
    slv('sParts','oParts',Math.round(g.parts*100));slv('sRes','oRes',Math.round(g.res*100));slv('sLod','oLod',Math.round(g.lod*100));slv('sSens','oSens',Math.round(SETS.camSens*100));
    $('sInvX').checked=!!SETS.invX;$('sInvY').checked=!!SETS.invY;near('sAuto',SETS.autosave==null?90:SETS.autosave,[0,60,180,300,600]);
    $('sHints').checked=SETS.hints!==false;$('sTipsOn').checked=SETS.tips!==false;$('sCapt').checked=!!SETS.capt;$('sReduce').checked=!!SETS.reduce;$('sCB').checked=!!SETS.cb;$('sFps').checked=!!SETS.fps;};
  window.plSettingsSync=sync;
  const reapply=()=>{saveSets();plApplyGfx();};
  for(const b of qa('#sShadow button'))b.onclick=()=>{G2().shadow=b.dataset.v;sync();reapply();};
  for(const b of qa('#sTrees button'))b.onclick=()=>{G2().trees=+b.dataset.v;sync();reapply();};
  const bindS=(id,oid,fn)=>{$(id).oninput=()=>{fn(+$(id).value);$(oid).textContent=$(id).value+'%';};};
  bindS('sParts','oParts',v=>{G2().parts=v/100;reapply();});bindS('sRes','oRes',v=>{G2().res=v/100;reapply();});bindS('sLod','oLod',v=>{G2().lod=v/100;reapply();});bindS('sSens','oSens',v=>{SETS.camSens=v/100;saveSets();});
  $('sInvX').onchange=()=>{SETS.invX=$('sInvX').checked;saveSets();};$('sInvY').onchange=()=>{SETS.invY=$('sInvY').checked;saveSets();};
  for(const b of qa('#sAuto button'))b.onclick=()=>{SETS.autosave=+b.dataset.v;saveSets();sync();};
  $('sTipsOn').onchange=()=>{SETS.tips=$('sTipsOn').checked;saveSets();};$('sHints').onchange=()=>{SETS.hints=$('sHints').checked;saveSets();plBodyFlags();};$('sCapt').onchange=()=>{SETS.capt=$('sCapt').checked;saveSets();};
  $('sReduce').onchange=()=>{SETS.reduce=$('sReduce').checked;saveSets();plBodyFlags();};$('sCB').onchange=()=>{SETS.cb=$('sCB').checked;saveSets();plBodyFlags();};$('sFps').onchange=()=>{SETS.fps=$('sFps').checked;saveSets();};
  $('sTut').onclick=()=>{$('sDone').click();if(MODE==='god')plTutRestart();else toast('Start a realm to take the tutorial');};
  $('sTips').onclick=()=>{lsSet('hearthmere_tips','{}');toast('Tips will appear again as things happen');};
  // sync every time the panel is opened (openSettings in menu.js is a plain function: wrap it)
  window.plBodyFlags=()=>{document.body.classList.toggle('nohints',SETS.hints===false);document.body.classList.toggle('reduce',!!SETS.reduce);document.body.classList.toggle('cb',!!SETS.cb);};
  plBodyFlags();
  new MutationObserver(()=>{if(!$('settings').classList.contains('hidden'))sync();}).observe($('settings'),{attributes:true,attributeFilter:['class']});
  sync();}
// ---------------------------------------------------------------- tooltips for every tool and top-bar button
{const tip=mk('div','pltip');let timer=0,cur=null;
  const toolDef=id=>{for(const [,l] of (typeof TOOLDEFS!=='undefined'?TOOLDEFS:[]))for(const t of l)if(t[0]===id)return t;return null;};
  const show=(el,html)=>{tip.innerHTML=html;const r=el.getBoundingClientRect(),ui=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui'))||1;tip.style.transform='scale('+ui+')';tip.classList.add('show');
    const w=tip.offsetWidth*ui,h=tip.offsetHeight*ui;let x=r.right+10,y=r.top;if(x+w>innerWidth-8)x=Math.max(8,r.left-w-10);if(y+h>innerHeight-8)y=innerHeight-h-8;if(r.top<90&&r.left>innerWidth*.35){x=Math.min(r.left,innerWidth-w-8);y=r.bottom+8;}tip.style.left=x+'px';tip.style.top=Math.max(4,y)+'px';};
  const hide=()=>{clearTimeout(timer);cur=null;tip.classList.remove('show');};
  const htmlFor=el=>{if(el.dataset.tool){const id=el.dataset.tool,d=toolDef(id);if(!d)return null;let h=`<b>${esc(d[1])}</b>${d[2]?`<kbd>${esc(d[2])}</kbd>`:''}`;
      const hint=(typeof HINTS!=='undefined')&&(HINTS[id.startsWith('b:')?'build':id]);if(hint)h+='<br>'+esc(hint);else if(id.startsWith('p:'))h+='<br>'+esc(POWER_TIPS[id]||'Cast a miracle on the valley.');
      if(typeof d[3]==='number')h+=`<span class="c">Costs ${d[3]} Faith${MODE==='god'&&G.faith<d[3]?' (not enough yet)':''}</span>`;else if(d[3]!=null&&typeof d[3]==='string')h+=`<span class="c">${esc(d[3])}</span>`;
      if(d[4])h+=`<span class="l">${esc(d[4])}</span>`;return h;}
    const t=el.dataset.tip;return t?t:null;};
  const POWER_TIPS={'p:rain':'Rain: puts out fires, fills the wells and the river, soaks the fields. The folk like a shower, not a flood.','p:sun':'Sunshine: dries the land and warms the folk. The first one is free.','p:snow':'Snowfall: a hush over the valley. Winter folk may be glad of it, or afraid.','p:rainbow':'A rainbow: pure joy for everyone who sees it.','p:storm':'A thunderstorm: lightning, wind and rain. Frightening, and sometimes just what a drought needs.','p:harvest':'Harvest: ripens every field at once.','p:heal':'Heal: lifts sickness from the folk.','p:festival':'Festival: the folk gather, feast and dance. Lifts spirits, mends grief.'};
  // titles of top-bar buttons become tooltips of the same style
  const tipify=root=>{for(const b of qa('#gtop button[title],#top button[title],#gtop .speed button',root)){if(b.title){b.dataset.tip='<b>'+esc(b.textContent.trim()||b.title)+'</b><br>'+esc(b.title);b.removeAttribute('title');}}};
  const SPEEDTIP={0:'Pause or resume the world. <kbd>Space</kbd>',1:'Normal speed. <kbd>Shift+1</kbd>',3:'Three times faster. <kbd>Shift+2</kbd>',10:'Ten times faster. <kbd>Shift+3</kbd>'};
  const prep=()=>{tipify();for(const b of qa('#tools button[title]'))b.removeAttribute('title');for(const b of qa('#gtop .speed button')){const s=b.dataset.sp;if(!b.dataset.tip&&SPEEDTIP[s]!=null)b.dataset.tip='<b>Speed</b> '+SPEEDTIP[s];}
    const m={gChron:'The Chronicle: everything notable that has happened to your people. <kbd>C</kbd>',gCrafts:'Crafts: what the folk have learned, and what it will unlock. <kbd>J</kbd>',gSound:'Switch the world’s sound on or off.',gPhoto:'Photo mode hides the interface. <kbd>K</kbd>',gSave:'Save your realm to a slot. <kbd>Ctrl+S</kbd> saves quickly.',gQual:'Cycle the graphics preset. Fine control is in Settings.',gHelpB:'Help and controls. <kbd>H</kbd>',gMenu:'Pause menu. <kbd>Esc</kbd>'};
    for(const id in m){const el=$(id);if(el&&!el.dataset.tip){el.dataset.tip=m[id];el.removeAttribute('title');}}};
  prep();{let pt=0;const mo=new MutationObserver(()=>{if(pt)return;pt=setTimeout(()=>{pt=0;if(!document.hidden)prep();},500);});mo.observe($('gtop'),{childList:true,subtree:true});mo.observe(toolsEl,{childList:true});}
  document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest('[data-tool],[data-tip]');if(!el||el===cur||SETS.hints===false)return;if(!el.closest('#tools,#gtop,#top,#plmap,#pltut,[data-tip]'))return;hide();cur=el;timer=setTimeout(()=>{const h=htmlFor(el);if(h&&cur===el)show(el,h);},260);},true);
  document.addEventListener('mouseout',e=>{if(cur&&(!e.relatedTarget||!cur.contains(e.relatedTarget)))hide();},true);
  document.addEventListener('pointerdown',hide,true);window.plHideTip=hide;}
// ---------------------------------------------------------------- toasts: queued, so a quick second message does not erase the first; long ones stay longer
{const el=$('toast');let q=[],busy=false,last='',lastT=0;
  const pump=()=>{if(busy||!q.length)return;const s=q.shift();busy=true;last=s;lastT=performance.now();el.textContent=s;el.classList.add('show');
    const dur=Math.min(5200,1500+s.length*38)*(q.length>1?.55:1);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>{busy=false;pump();},q.length?160:0);},dur);};
  toast=function(s){s=String(s);if(s===last&&performance.now()-lastT<2000)return;if(q.includes(s))return;q.push(s);if(q.length>4)q.shift();pump();};}
// ---------------------------------------------------------------- speed, pause and keys
{const badge=mk('div','plspeed',null,'PAUSED · Space to resume');badge.style.display='none';
  const setSp=s=>{if(MODE==='god'&&G.phase!=='pick')setSpeed(s);};
  addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||UIBLOCK||MODE!=='god'||!e.shiftKey||e.ctrlKey||e.metaKey)return;
    const m={Digit1:1,Digit2:3,Digit3:10};if(m[e.code]){e.preventDefault();e.stopImmediatePropagation();setSp(m[e.code]);toast(m[e.code]+'× speed');}},true);
  setInterval(()=>{const on=MODE==='god'&&G.paused&&!PAUSED&&G.phase==='play'&&!G.menu;badge.style.display=on?'':'none';},250);}
// ---------------------------------------------------------------- notifications: prayers and petitions arrive as small cards, with a sound
{const host=mk('div','plnote');let seenP=new WeakSet(),seenT=new Set(),arrP=null,arrT=null;
  const push=(cls,title,txt,onclick)=>{const n=document.createElement('div');n.className='panel n '+cls;n.innerHTML=`<i></i><b>${esc(title)}</b>${esc(txt)}`;
    const kill=()=>{n.classList.add('out');setTimeout(()=>n.remove(),500);};n.onclick=()=>{kill();onclick&&onclick();};host.appendChild(n);while(host.children.length>3)host.firstChild.remove();setTimeout(kill,9000);};
  const jump=()=>{const p=$('prayers');p.classList.remove('collapsed');p.scrollTop=0;p.animate&&!SETS.reduce&&p.animate([{boxShadow:'0 0 0 4px #ffe08a'},{boxShadow:'0 0 0 0 #ffe08a'}],{duration:900});if(typeof applyUI==='function')applyUI();};
  setInterval(()=>{if(MODE!=='god'||G.phase!=='play'||G.menu){arrP=null;return;}
    if(arrP!==G.prayers||arrT!==(G.tf&&G.tf.pet)){arrP=G.prayers;arrT=G.tf&&G.tf.pet;seenP=new WeakSet(G.prayers);seenT=new Set((G.tf&&G.tf.pet||[]).map(p=>p.id));return;}
    for(const p of G.prayers){if(seenP.has(p))continue;seenP.add(p);const sh=(p.txt||'').length>118?(p.txt.slice(0,115)+'…'):p.txt;push(p.urgent?'urg':'',p.urgent?'An urgent prayer':'A prayer',sh,jump);if(!p.urgent)sfx('prayer');}
    if(G.tf)for(const p of G.tf.pet){if(seenT.has(p.id))continue;seenT.add(p.id);push('pet','A petition',p.short||p.txt||'The folk ask your leave.',jump);}},500);
  window.plNotify=push;}
// ---------------------------------------------------------------- the minimap
{const wrap=mk('div','plmap','panel',null);const cv=document.createElement('canvas');cv.width=cv.height=174;wrap.appendChild(cv);const tg=mk('button',null,'mt','–',wrap);tg.title='Hide map (M)';tg.removeAttribute('title');
  const base=document.createElement('canvas');base.width=base.height=174;const bx=base.getContext('2d'),cx=cv.getContext('2d');let dirtyAt=-1e9,minimized=lsGet('hearthmere_map')==='0';
  wrap.classList.toggle('min',minimized);tg.textContent=minimized?'+':'–';
  const SC=174/N;// canvas pixels per world cell
  const MMC=[[-2,66,104,52],[4,92,130,58],[10,128,134,76],[17,146,124,98],[23,226,226,230],[40,246,246,250]];
  function paintBase(){const id=bx.createImageData(174,174),d=id.data;
    for(let py=0;py<174;py++)for(let px=0;px<174;px++){const gi=Math.min(N,Math.floor(px/SC)),gj=Math.min(N,Math.floor(py/SC)),k=gj*S+gi;const h=H[k],w=W[k],o=(py*174+px)*4;let r,g,b;
      if(w>.18){const dp=Math.min(1,w/6);r=50-30*dp;g=100-40*dp;b=150-30*dp;}
      else{const st=MMC;let i=0;while(i<st.length-2&&h>st[i+1][0])i++;const A=st[i],B=st[i+1],f=clamp((h-A[0])/(B[0]-A[0]),0,1);r=A[1]+(B[1]-A[1])*f;g=A[2]+(B[2]-A[2])*f;b=A[3]+(B[3]-A[3])*f;
        const kl=Math.max(0,k-1),kr=Math.min(V-1,k+1),ku=Math.max(0,k-S),kd=Math.min(V-1,k+S);const sh=clamp(1+((H[kl]-H[kr])+(H[ku]-H[kd]))*.09,.65,1.35);r*=sh;g*=sh;b*=sh;}
      const rt=ROADT[k],rd=ROAD[k];if(rt===3){r=60;g=50;b=44;}else if(rt===4){r=235;g=205;b=95;}else if(rt===2){r=205;g=198;b=185;}else if(rd>.35&&w<=.18){r=170;g=146;b=102;}
      d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=255;}
    bx.putImageData(id,0,0);}
  const TOWNC=['#f2c873','#6fd3c4','#e89a7a'];
  function draw(){cx.drawImage(base,0,0);
    if(typeof allB==='function'){const L=TOWNS.list&&TOWNS.list.length>1;
      if(!L){cx.fillStyle=MODE==='god'?TOWNC[0]:'#f2c873';for(const b of buildings){if(b.type==='farm')continue;const px=(b.x+HALF)*SC,py=(b.z+HALF)*SC;cx.fillRect(px-1,py-1,2.2,2.2);}}
      else TOWNS.list.forEach((s,i)=>{if(s.dead)return;const l=i===TOWNS.cur?buildings:s.bld;cx.fillStyle=TOWNC[i%3];for(const b of l){if(b.type==='farm')continue;const px=(b.x+HALF)*SC,py=(b.z+HALF)*SC;cx.fillRect(px-1,py-1,2.2,2.2);}});}
    if(MODE==='god'&&G.markers)for(const m of allMarkers()){cx.fillStyle=m.k==='forbid'?'#c4452e':'#fff';cx.fillRect((m.x+HALF)*SC-1.5,(m.z+HALF)*SC-1.5,3,3);}
    // where the camera looks: a rotated rectangle of about the visible ground
    const px=(cam.tx+HALF)*SC,py=(cam.tz+HALF)*SC,w=Math.min(110,cam.dist*.75)*SC,hh=Math.min(90,cam.dist*.6)*SC;cx.save();cx.translate(px,py);cx.rotate(-cam.yaw);cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.3;cx.strokeRect(-w/2,-hh/2,w,hh);
    cx.fillStyle='#fff';cx.beginPath();cx.moveTo(0,hh/2+5);cx.lineTo(-3.5,hh/2);cx.lineTo(3.5,hh/2);cx.closePath();cx.fill();cx.restore();
    cx.strokeStyle='rgba(0,0,0,.5)';cx.lineWidth=1;cx.strokeRect(.5,.5,173,173);}
  let drag=false;const go=e=>{const r=cv.getBoundingClientRect(),ui=r.width/174;const x=(e.clientX-r.left)/ui/SC-HALF,z=(e.clientY-r.top)/ui/SC-HALF;cam.tx=clamp(x,-HALF,HALF);cam.tz=clamp(z,-HALF,HALF);if(MODE==='god')G.follow=null;draw();};
  cv.addEventListener('pointerdown',e=>{drag=true;cv.setPointerCapture(e.pointerId);go(e);e.stopPropagation();});cv.addEventListener('pointermove',e=>{if(drag)go(e);});cv.addEventListener('pointerup',()=>{drag=false;});
  cv.addEventListener('contextmenu',e=>e.preventDefault());cv.addEventListener('wheel',e=>{e.preventDefault();cam.dist*=Math.pow(1.0012,e.deltaY);},{passive:false});
  const toggle=()=>{minimized=!minimized;wrap.classList.toggle('min',minimized);tg.textContent=minimized?'+':'–';lsSet('hearthmere_map',minimized?'0':'1');if(!minimized){dirtyAt=-1e9;}};
  tg.onclick=toggle;addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.target.tagName!=='INPUT'&&!UIBLOCK&&inPlay()){toggle();}},true);
  setInterval(()=>{{const f=$('cuFeed');wrap.style.right=(f&&!f.classList.contains('hidden')&&f.offsetParent!==null?Math.round(innerWidth-f.getBoundingClientRect().left+10):12)+'px';}const on=inPlay()&&!(MODE==='god'&&G.phase==='pick'&&0);wrap.style.display=on?'':'none';if(!on||minimized||document.hidden)return;const now=performance.now();
    if(now-dirtyAt>(MODE==='god'&&G.phase==='shape'?700:3500)||(window.HM&&HM.mapDirty)){dirtyAt=now;if(window.HM)HM.mapDirty=false;paintBase();}
    draw();},200);
  window.plMapRedraw=()=>{dirtyAt=-1e9;};}
// ---------------------------------------------------------------- touch and trackpad: two fingers pan, pinch and twist; pinch on a trackpad zooms
{const tp=new Map();let g0=null;
  const stats=()=>{const a=[...tp.values()];const mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2,dx=a[1].x-a[0].x,dy=a[1].y-a[0].y;return {mx,my,d:Math.hypot(dx,dy)||1,an:Math.atan2(dy,dx)};};
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;tp.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(tp.size>=2){if(typeof painting!=='undefined'&&painting){painting=false;try{endStroke();}catch(_){}}g0=stats();e.stopImmediatePropagation();}},true);
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||!tp.has(e.pointerId))return;const p=tp.get(e.pointerId);p.x=e.clientX;p.y=e.clientY;
    if(tp.size>=2&&g0){const g=stats(),cs=Math.cos(cam.yaw),sn=Math.sin(cam.yaw),s=cam.dist*.0016*(SETS.camSens||1),dx=g.mx-g0.mx,dy=g.my-g0.my;
      cam.tx+=(-dx*cs-dy*sn)*s;cam.tz+=(dx*sn-dy*cs)*s;cam.dist=clamp(cam.dist*g0.d/g.d,10,300);let da=g.an-g0.an;if(da>PI)da-=TAU;if(da<-PI)da+=TAU;cam.yaw-=da;g0=g;e.stopImmediatePropagation();}},true);
  const up=e=>{if(e.pointerType!=='touch')return;tp.delete(e.pointerId);if(tp.size<2)g0=null;};canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',up,true);
  canvas.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();e.stopImmediatePropagation();if(!UIBLOCK)cam.dist*=Math.pow(1.0012,e.deltaY*5);},{capture:true,passive:false});}
// ---------------------------------------------------------------- window robustness, tab visibility
{let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(typeof plApplyGfx==='function')plApplyGfx();if(window.plMapRedraw)plMapRedraw();},150);});
  document.addEventListener('visibilitychange',()=>{if(!SND.ctx)return;if(document.hidden)SND.ctx.suspend();else if(SND.on)SND.ctx.resume();});}
// ---------------------------------------------------------------- sound captions (notable sounds only, optional)
{const el=mk('div','plsub');let t=0;const CAP={bell:'[church bells ring]',toll:'[a bell tolls slowly]',peal:'[wedding bells peal]',thunder:'[thunder rolls]',alarm:'[alarm raised]',train:'[a train whistles]',cheer:'[the crowd cheers]',era:'[a new age begins]'};
  window.plCaption=name=>{if(!SETS.capt||!CAP[name])return;el.textContent=CAP[name];el.classList.add('show');clearTimeout(t);t=setTimeout(()=>el.classList.remove('show'),2600);};
  const _sfx=sfx;sfx=function(name,vol){plCaption(name);return _sfx.apply(this,arguments);};}
// ---------------------------------------------------------------- Help screens (rewritten for the whole game)
{const HELP_GOD=[
  ['The valley',`<h4>You are the Spirit</h4><p>Your people think, build and pray for themselves. You cannot place their houses: you shape their world, answer their prayers and keep faith with them. Their happiness and worship become <b>Faith</b>, and Faith pays for every miracle.</p>
   <h4>Time</h4><p>A day takes about a minute and a half at normal speed; five days make a season. Pause with <kbd>Space</kbd>, speed up with <kbd>+</kbd>/<kbd>−</kbd> or <kbd>Shift+1/2/3</kbd>. The world does not wait on the camera: folk far from where you look go on living in longer steps.</p>
   <h4>The first days</h4><ul><li>Shape the land for free while the valley is empty, then <b>Call the settlers</b>.</li><li>They arrive in rain. Their first prayer asks for sun, and the first Sunshine costs nothing.</li><li>Watch them: folk find work, build homes, marry, have children and grow old.</li></ul>`],
  ['Powers',`<h4>Shape the land</h4><p>Raise, lower, smooth, flatten, cliff and canyon. Folk need flat, dry ground for homes and fields; moving earth costs Faith by the volume. Water flows downhill: pour it, open springs, drain marshes. Homes near water are happier, but floods drown low houses.</p>
   <h4>Banners</h4><p>Free. <b>Settle here</b>, <b>Farm here</b>, <b>Worship here</b> steer where folk build; <b>Keep clear</b> protects land. Click a banner with the same tool to take it down.</p>
   <h4>Sky and miracles</h4><p>Rain, sunshine, snow, rainbows and storms; meteors; Harvest, Heal, Festival and Smite. <b>Bless</b> a building to speed its work or save it from fire. Hover any power in the toolbox to read what it does and what it costs.</p>
   <h4>Wildlife and forest</h4><p>Grow forest, release herds. Hunters need game; woodcutters need trees; overhunt and it vanishes.</p>`],
  ['Folk & stories',`<h4>People, not numbers</h4><p>Every villager has a name, a family, a job, memories and thoughts. Use <b>Watch</b> (<kbd>I</kbd>) and click a villager to follow them and read what they are thinking. Click a building to see who lives and works there.</p>
   <h4>Stories and the Chronicle</h4><p>Births, weddings, rivalries, deeds of kindness, funerals and legends are told in the <b>story feed</b> (<b>Tales</b>, <kbd>N</kbd>) and on each person’s page. The <b>Chronicle</b> (<kbd>C</kbd>) keeps the great events of the whole realm.</p>
   <h4>Customs</h4><p>As a people live together they develop customs, festivals and names for places. A fishing people will not keep the same ways as a farming one, and the Futuristic age has little in common with the Stone Age.</p>
   <h4>Moods</h4><p>Hunger, fear, sickness, grief, crowding, smog and unanswered prayers lower happiness. Hover the happiness bar to see why.</p>`],
  ['Faith & doubt',`<h4>Prayers</h4><p>Listed at the top right, one at a time. Answer them for Faith and joy; ignored prayers make folk sad. Each says how it can be answered.</p>
   <h4>Doubt and false prophets</h4><p>Hunger, fear, sickness and pride breed doubt. Doubt raises a <b>false prophet</b> whose cult commits worsening atrocities. Answer with a <b>Divine sign</b>, <b>Anoint a seer</b>, or <b>Silence the prophet</b> (a strong cult will make a martyr) — or ease the real cause.</p>
   <h4>Judgment</h4><p>When a people are beyond saving you may pass judgment: Deluge, Firestorm, Pestilence or Starfall. The Ledger of Ages remembers, and the next age begins with a little of the old memory.</p>`],
  ['Cities & ages',`<h4>Eight ages</h4><p>Stone → Bronze → Iron → Medieval → High Medieval → Industrial → Modern → Futuristic. Each is gated by population, key buildings and crafts, and changes how everything looks, sounds and feels (the music changes too). Hover the era name in the top bar, and read the “Next:” line under the prayers.</p>
   <h4>The planned city</h4><p>The folk lay out streets from the square in front of their hall, zone districts, level plots and rebuild in the style of the age. They terrace slopes and cut quarries themselves.</p>
   <h4>Petitions</h4><p>For the big works — draining a marsh, felling a forest, cutting a mountain, laying a railway or highway — they ask your leave. <b>Allow</b> or <b>Forbid</b> in the Prayers panel; forbidding saddens them a little.</p>
   <h4>Sight and the minimap</h4><p>The <b>Sight</b> overlays (<kbd>O</kbd> cycles them; the Sight group in the toolbox) show services, mood, smog, footfall, land value and districts, <b>Why?</b> (<kbd>Z</kbd>) explains a building’s numbers, <b>Edicts</b> (<kbd>L</kbd>) sets the town’s laws and <kbd>U</kbd> shows district names. The <b>minimap</b> (bottom right, <kbd>M</kbd> to hide) shows water, roads, rails and settlements: click or drag it to fly there.</p>
   <h4>Other peoples</h4><p>In the Bronze Age a second people arrive and live differently. Switch between them with the tabs in the top bar or <kbd>Tab</kbd>. Faith is shared; doubts, prophets and petitions are not. Merchants walk between them.</p>`],
  ['Controls',`<table><tr><td>Right-drag · Q / E</td><td>Orbit the camera</td></tr><tr><td>Middle-drag · WASD · arrows</td><td>Pan</td></tr><tr><td>Wheel · trackpad pinch</td><td>Zoom</td></tr><tr><td>Two fingers (touch)</td><td>Pan, pinch to zoom, twist to orbit</td></tr>
   <tr><td>Space</td><td>Pause / resume</td></tr><tr><td>+ / − · Shift+1 2 3</td><td>Speed 1× · 3× · 10×</td></tr><tr><td>I · B · R · X</td><td>Watch · Bless · Rain · Smite</td></tr><tr><td>C · J · K</td><td>Chronicle · Crafts · Photo mode</td></tr>
   <tr><td>Tab</td><td>Switch people (when there are two)</td></tr><tr><td>O · Z · L · U</td><td>Sight overlays · Why? · Edicts · District names</td></tr><tr><td>N</td><td>Tales (the story feed)</td></tr><tr><td>M</td><td>Show / hide the minimap</td></tr><tr><td>H · Esc</td><td>This help · Pause menu</td></tr><tr><td>Ctrl+S</td><td>Quick save (slots and export are under Save)</td></tr></table>
   <p>Settings (graphics detail, sound, camera, accessibility, autosave) are in the pause menu. The tutorial can be replayed from there too.</p>`]];
  const HELP_SB=[
  ['Building',`<h4>Sandbox</h4><p>Build a whole city with no rules. Press <kbd>Tab</kbd> for the <b>Buildings page</b>: every building of every age, with a picture, grouped by age. Click a plate to choose it, then click the land.</p>
   <ul><li><kbd>R</kbd> rotates (Shift+R the other way), <kbd>V</kbd> rerolls the look, <kbd>C</kbd> steps through the variants of a building, <kbd>F</kbd> toggles auto-facing.</li><li>Roads, paved streets, railways and highways are on the plates and in the Roads group.</li><li>Buildings read their surroundings: water, hills, forests and neighbours change how they look.</li></ul>
   <h4>Populate</h4><p>When the city is ready press <b>Populate city</b> (you need a Town Hall of any age): folk move in, the age is taken from the newest building, and the god game carries on from there.</p>`],
  ['Controls',`<table><tr><td>Left-drag</td><td>Use the current tool (sculpt, pour, plant, paint road)</td></tr><tr><td>Shift + left-drag</td><td>The inverse (lower, sink, fell, erase)</td></tr><tr><td>Right-drag · Q / E</td><td>Orbit</td></tr><tr><td>Middle-drag · WASD</td><td>Pan</td></tr><tr><td>Wheel · pinch</td><td>Zoom</td></tr>
   <tr><td>1–7 · 8 9 0</td><td>Terrain tools · Pour / Spring / Drain</td></tr><tr><td>T · Y · G · I · X</td><td>Plant · Fell · Road · Inspect · Demolish</td></tr><tr><td>Tab</td><td>Buildings page</td></tr><tr><td>M</td><td>Minimap</td></tr><tr><td>P · Ctrl+Z · H</td><td>Pause water · Undo · This help</td></tr></table>`]];
  function build(el,pages,closeId,closeText){const tabs=pages.map((p,i)=>`<button data-i="${i}">${p[0]}</button>`).join('');
    el.innerHTML=`<h2 style="font-family:Cinzel,serif;margin:0 0 8px;color:var(--wood)">${closeId==='ghelpClose'?'The Spirit of the Valley':'How to rule Hearthmere'}</h2><div id="hlpTabs${closeId}" class="hlpTabs" style="display:flex;gap:4px;flex-wrap:wrap;margin:0 0 10px;border-bottom:1px solid #b89a6a;padding-bottom:6px">${tabs}</div><div class="hlpBody" id="hlpBody${closeId}"></div>
      <p style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 0"><button id="${closeId}x" class="hlpTut" style="font-size:14px">Replay the tutorial</button><button id="${closeId}">${closeText}</button></p>`;
    const show=i=>{q1('#hlpBody'+closeId).innerHTML=pages[i][1];for(const b of qa('#hlpTabs'+closeId+' button'))b.classList.toggle('on',+b.dataset.i===i);q1('#hlpBody'+closeId).scrollTop=0;};
    for(const b of qa('#hlpTabs'+closeId+' button'))b.onclick=()=>show(+b.dataset.i);show(0);
    $(closeId).onclick=()=>el.classList.add('hidden');const rx=$(closeId+'x');if(closeId==='ghelpClose')rx.onclick=()=>{el.classList.add('hidden');plTutRestart();};else rx.style.display='none';}
  const gh=$('ghelp');gh.style.width='680px';build(gh,HELP_GOD,'ghelpClose','Watch over them');build($('help'),HELP_SB,'bHelpClose','Begin');
  q1('.hlpBody',gh);for(const e of qa('.hlpBody'))e.parentNode.style.maxHeight='86vh';
  window.plHelpRebuild=()=>{build(gh,HELP_GOD,'ghelpClose','Watch over them');};
  // the tutorial replaces the old first-visit help panel
  if(lsGet('hearthmere_tut')==null)lsSet('hearthmere_ghelp','1');}
// ---------------------------------------------------------------- the guided tutorial and the tips that follow
{const KEY='hearthmere_tut',TKEY='hearthmere_tips';
  let tut={i:0,off:false,done:false};try{const o=JSON.parse(lsGet(KEY)||'null');if(o)tut=Object.assign(tut,o);}catch(e){}
  const save=()=>lsSet(KEY,JSON.stringify({i:tut.i,off:tut.off,done:tut.done}));
  let tips={};try{tips=JSON.parse(lsGet(TKEY)||'{}')||{};}catch(e){}
  const card=mk('div','pltut','panel hidden');const ring=mk('div','plhl');ring.style.display='none';
  const sel=s=>{if(!s)return null;if(typeof s==='function')return s();for(const x of [].concat(s)){const el=q1(x);if(el&&el.offsetParent!==null&&el.getBoundingClientRect().width>0)return el;}return null;};
  const nextReq=()=>{const n=ERA_REQ[(G.era||0)+1];return n?`The next age, the ${ERAS[G.era+1].name}, needs ${n.txt}.`:'You have reached the last age.';};
  const STEPS=[
   {ph:['shape'],t:'Shape the valley',x:'Before anyone arrives the land is yours to shape, and it costs nothing. Choose <b>Raise</b> and drag across the land (hold <kbd>Shift</kbd> to lower). Folk like flat, dry ground near water and trees.',task:'Sculpt the land once',hl:'#tools [data-tool="raise"]',init:()=>{tut.painted=false;},done:()=>!!tut.painted},
   {ph:['shape'],t:'Call the settlers',x:'When the valley pleases you, press <b>Call the settlers</b> in the panel at the top right. Water, forest and open ground nearby decide what kind of people they become.',hl:'#callS',done:()=>G.phase!=='shape'},
   {ph:['pick'],t:'Where shall they camp?',x:'Five weary settlers wander in. Click flat land to plant a banner where they should make camp, or let them choose for themselves.',hl:['#autoPick'],done:()=>G.phase==='play'},
   {t:'Look around',x:'These are your people. <b>Right-drag</b> to orbit, <b>scroll</b> to zoom, and <b>WASD</b> or middle-drag to move. The map in the corner flies you anywhere with a click.',task:'Move the camera',hl:'#plmap',init:()=>{tut.c0={y:cam.yaw,d:cam.dist,x:cam.tx,z:cam.tz};},done:()=>Math.abs(cam.yaw-tut.c0.y)>.25||Math.abs(Math.log(cam.dist/tut.c0.d))>.12||Math.hypot(cam.tx-tut.c0.x,cam.tz-tut.c0.z)>8},
   {t:'The first prayer',x:'They are cold and wet, and the rain will not stop. Their prayer is listed top right. Cast <b>Sunshine</b> — the first one is free.',task:'Cast Sunshine',hl:['[data-tool="p:sun"]','#prayers'],skip:()=>!G.openRain,done:()=>!G.openRain||G.sun>0},
   {t:'Faith',x:'Content, worshipping folk give you <b>Faith</b>; it pays for miracles and for moving big earth. Hover the bars for what is making them happy or sad, and answer prayers: each one pays a little Faith.',hl:'#gtop .faith'},
   {t:'Meet them',x:'Pick <b>Watch</b> (<kbd>I</kbd>) and click a villager. You will follow them and see what they are doing, thinking and who they love.',task:'Follow a villager',hl:'[data-tool="inspect"]',done:()=>!!G.follow},
   {t:'Their stories',x:'Everyone has a name, a family and a past. Births, weddings, quarrels and kindnesses are told as stories, and the folk develop customs of their own. Open <b>Tales</b> (<kbd>N</kbd>) to read them as they happen; click a name for that person\u2019s page.',task:'Open Tales',show:()=>!!q1('#gTales'),hl:'#gTales',done:()=>{const f=$('cuFeed');return !!f&&!f.classList.contains('hidden');}},
   {t:'The Chronicle',x:'The great events of your realm are written in the <b>Chronicle</b>. Open it now (<kbd>C</kbd>).',task:'Open the Chronicle',hl:'#gChron',done:()=>!$('chron').classList.contains('hidden')},
   {t:'Bless a building',x:'Choose <b>Bless</b> (<kbd>B</kbd>) and click a building. Blessed work goes faster, fires die, and the folk rejoice. It costs a little Faith and wears off.',task:'Bless a building',hl:'[data-tool="bless"]',skip:()=>G.faith<20&&!allB().some(b=>b.blessUntil>G.t),done:()=>allB().some(b=>b.blessUntil>G.t)},
   {t:'Guide, do not command',x:'A <b>Settle here</b> banner shows where to build; <b>Farm here</b> and <b>Worship here</b> do the same. Banners are free and the folk may ignore a bad place.',task:'Plant a banner',hl:'[data-tool="m:settle"]',init:()=>{tut.m0=G.markers.length;},done:()=>G.markers.length>tut.m0},
   {t:'Sight and reasons',x:'The <b>Sight</b> overlays tint the land by services, mood, smog, footfall and land value (<kbd>O</kbd> cycles them), and <b>Why?</b> (<kbd>Z</kbd>) explains any building\u2019s numbers. Use them when something goes wrong.',task:'Turn on an overlay',show:()=>!!q1('#tools [data-tool="o:svc"]'),hl:'#tools [data-tool="o:svc"]',done:()=>typeof OV!=='undefined'&&!!OV.mode},
   {t:'Petitions and ages',x:()=>'As the people grow they will ask your leave for big works: <b>Allow</b> or <b>Forbid</b> in the Prayers panel. '+nextReq()+' Hover the era name in the top bar.',hl:'#gEra'},
   {t:'Keep your realm',x:'Your realm autosaves, and <kbd>Ctrl+S</kbd> saves into a slot. The <b>Menu</b> holds Settings (graphics, sound, accessibility) and this tutorial again. <kbd>H</kbd> opens Help.',hl:'#gMenu'},
   {t:'Watch over them',x:'That is the start. Doubt, false prophets, raiders, plagues and wonders will find you; tips appear the first time each happens. The title screen also has a <b>Sandbox</b> for building cities without rules. Be kind, or at least fair.'}];
  function STORY_SEL_FN(){return sel(STORY_SEL);}function OVERLAY_SEL_FN(){return sel(OVERLAY_SEL);}
  const STORY_SEL=['#feed','#storyFeed','#cuFeed','#cuStory','.cu-feed','#cufeed'],OVERLAY_SEL=['#ovBar','#ovBtn','#ovPanel','#overlays','#ov','.ov-bar','[data-ov]'];
  canvas.addEventListener('pointerdown',e=>{if(e.button===0&&tut.painted===false&&MODE==='god'&&G.phase==='shape')tut.painted=true;},true);
  window.plTutSteps=STEPS;
  let cur=-1,doneAt=0,lastKey='',tipCur=null,tipUntil=0;
  const hideAll=()=>{card.classList.add('hidden');ring.style.display='none';};
  function stepEnter(i){cur=i;tut.ok=false;doneAt=0;lastKey='';const s=STEPS[i];if(s.init)try{s.init();}catch(e){}save();const el=sel(s.hl);if(el&&el.scrollIntoView)try{el.scrollIntoView({block:'nearest'});}catch(e){}}
  function advance(){const n=tut.i+1;if(n>=STEPS.length){tut.done=true;save();cur=-1;hideAll();toast('Tutorial complete. Help is always on H.');return;}tut.i=n;stepEnter(n);}
  window.plTutRestart=function(){tut.off=false;tut.done=false;tut.i=0;tip=null;cur=-1;save();if(MODE==='god')setTimeout(()=>toast('Tutorial: step by step, skip any time'),100);};
  window.plTutWanted=()=>!tut.off&&!tut.done;
  function render(s,i){const x=typeof s.x==='function'?s.x():s.x,ok=tut.ok;
    const dots=STEPS.map((_,k)=>`<i class="${k<i?'d':k===i?'c':''}"></i>`).join('');
    card.className='panel';card.innerHTML=`<div class="k"><span>THE SPIRIT’S FIRST DAYS</span><span>${i+1} / ${STEPS.length}</span></div><h3>${s.t}</h3><p>${x}</p>${s.task?`<div class="task${ok?' ok':''}">${s.task}</div>`:''}
      <div class="row"><div class="dots">${dots}</div><span><button class="lnk" data-a="off">Skip tutorial</button> <button class="${s.task&&!ok?'':'on'}" data-a="next">${i===STEPS.length-1?'Begin':s.task&&!ok?'Skip step':'Next ▸'}</button></span></div>`;
    card.querySelector('[data-a=off]').onclick=()=>{tut.off=true;save();cur=-1;hideAll();toast('Tutorial skipped. Replay it from the pause menu or Help.');};
    card.querySelector('[data-a=next]').onclick=()=>advance();}
  function place(el){if(!el){ring.style.display='none';return;}const r=el.getBoundingClientRect();if(r.width<1||r.height<1){ring.style.display='none';return;}
    ring.style.display='';ring.style.left=(r.left-5)+'px';ring.style.top=(r.top-5)+'px';ring.style.width=(r.width+10)+'px';ring.style.height=(r.height+10)+'px';}
  // tips: one-time cards when something happens for the first time
  const TIPS=[
   ['petition','A petition',()=>MODE==='god'&&G.tf&&G.tf.pet.length>0,'The folk ask your leave for a big work (levelling land, draining a marsh, a railway). Read it in the Prayers panel and press <b>Allow</b> or <b>Forbid</b>. Forbidding saddens them a little; allowing changes the land.'],
   ['doubt','A shadow of doubt',()=>MODE==='god'&&G.dev&&G.dev.cult,'A false prophet has risen from the folk’s doubt. Hover the happiness bar to see what troubles them, and ease it. A <b>Divine sign</b> weakens the cult; silencing the prophet may make a martyr.'],
   ['raid','Raiders!',()=>MODE==='god'&&G.raid&&G.raid.active,'Raiders have come. <b>Smite</b> (<kbd>X</kbd>) strikes them down; cliffs and water can cut them off, and towers and castles shoot arrows. Keep your folk away from the lightning.'],
   ['sick','Sickness',()=>MODE==='god'&&G.vill&&G.vill.filter(v=>v.sick).length>=3,'Sickness is spreading. <b>Heal</b> (Miracles) lifts it; crowded, dirty, hungry towns suffer most. Funerals will follow if it goes unchecked.'],
   ['hunger','Hunger',()=>MODE==='god'&&G.phase==='play'&&popN()>10&&G.food<popN()*1.1&&dayN()>8,'The stores are running low. Farms, fishing and hunting feed the folk; flat ground near water makes good fields. Hunger breeds doubt.'],
   ['age','A new age',()=>MODE==='god'&&G.phase==='play'&&(G.era||0)>=1,'A new age has begun: new buildings, crafts and ways of living, and a different music. Look at the “Next:” line in the Prayers panel to see what the following age needs.'],
   ['festival','A festival',()=>MODE==='god'&&G.festival>0,'The folk are holding a festival: music, feasting and dancing. Festivals lift spirits and mend grief. You can call one yourself from Miracles.'],
   ['second','Another people',()=>MODE==='god'&&TOWNS.list.length>1,'A second people have come into the valley. Switch between them with the tabs at the top or <kbd>Tab</kbd>. Faith is shared; doubts and petitions are not.'],
   ['sandbox','Sandbox',()=>MODE==='sandbox','Press <kbd>Tab</kbd> for the Buildings page, click a plate, then click the land. <kbd>C</kbd> steps through variants, <kbd>R</kbd> rotates. Press <b>Populate city</b> to let folk move in.']];
  let tip=null,tipT=0;
  function tipTick(){if(SETS.tips===false||cur>=0)return;if(tip&&performance.now()<tipT)return;if(tip){tip=null;hideAll();}
    if(!inPlay()||G.menu||PAUSED||(MODE==='god'&&G.phase!=='play'))return;
    for(const [k,title,cond,txt] of TIPS){if(tips[k])continue;let ok=false;try{ok=cond();}catch(e){}if(!ok)continue;tips[k]=1;lsSet(TKEY,JSON.stringify(tips));tip=k;tipT=performance.now()+22000;
      card.className='panel tip';card.innerHTML=`<div class="k"><span>A WORD OF ADVICE</span><span></span></div><h3>${title}</h3><p>${txt}</p><div class="row"><span><button class="lnk" data-a="off">No more tips</button></span><button class="on" data-a="ok">Understood</button></div>`;
      card.querySelector('[data-a=ok]').onclick=()=>{tipT=0;};card.querySelector('[data-a=off]').onclick=()=>{SETS.tips=false;saveSets();tipT=0;toast('Tips are off (Settings turns them back on)');};
      sfx('chime',.5);ring.style.display='none';return;}}
  setInterval(()=>{
    if(!inPlay()||G.menu||PAUSED){hideAll();return;}
    if(MODE==='sandbox'){tipTick();if(!tip)hideAll();else card.classList.remove('hidden');return;}
    if(tut.off||tut.done){tipTick();if(tip)card.classList.remove('hidden');else hideAll();return;}
    // tutorial: find a step that fits this moment
    let i=tut.i;if(cur!==i||!STEPS[i])cur=-1;
    const ph=G.phase;let s=STEPS[i];const fits=st=>(st.ph||['play']).includes(ph);
    if(!s||!fits(s)){let j=-1;for(let k=Math.max(0,i);k<STEPS.length;k++)if(fits(STEPS[k])){j=k;break;}
      if(j<0){hideAll();return;}tut.i=i=j;s=STEPS[i];cur=-1;}
    if(cur!==i){if((s.skip&&s.skip())||(s.show&&!s.show())){tut.i=i+1;if(tut.i>=STEPS.length){tut.done=true;save();hideAll();return;}cur=-1;return;}stepEnter(i);}
    if(s.show&&!s.show()&&!s.task){/* target vanished: keep text only */}
    if(!tut.ok&&s.done){let d=false;try{d=s.done();}catch(e){}if(d){tut.ok=true;doneAt=performance.now();lastKey='';}}
    if(tut.ok&&doneAt&&performance.now()-doneAt>1500&&s.task){advance();return;}
    if(tut.ok&&!s.task&&s.done){advance();return;}// phase steps with no task advance as soon as the world does
    const key=cur+':'+tut.ok+':'+(typeof s.x==='function'?s.x():'');if(key!==lastKey){lastKey=key;render(s,i);}
    card.classList.remove('hidden');place(sel(s.hl));},350);
  window.plTut={state:()=>({tut,cur,tip,tips}),skip:advance,STEPS};
  // a brand new realm starts the tutorial; an old one that was never taught does not interrupt
  const _ss=startShaping;startShaping=function(){const r=_ss.apply(this,arguments);if(tut.done||tut.off){return r;}if(tut.i>0&&lsGet(KEY)){/* resume where they stopped */}else{tut.i=0;save();}cur=-1;return r;};
}
// ---------------------------------------------------------------- pause menu: Help and Tutorial buttons
{const pause=$('pause');const settingsBtn=q1('[data-p=settings]',pause);
  const bH=document.createElement('button');bH.dataset.p='help';bH.textContent='Help & controls';const bT=document.createElement('button');bT.dataset.p='tutorial';bT.textContent='Replay the tutorial';
  if(settingsBtn){settingsBtn.after(bH);bH.after(bT);}
  bH.addEventListener('click',()=>{closePause();$(MODE==='sandbox'?'help':'ghelp').classList.remove('hidden');});
  bT.addEventListener('click',()=>{closePause();if(MODE==='god'){plTutRestart();}else toast('The tutorial is for the god game; start a realm.');});
  new MutationObserver(()=>{bT.style.display=MODE==='god'?'':'none';}).observe(pause,{attributes:true,attributeFilter:['class']});}
// ---------------------------------------------------------------- hooks for the test tools and for other engineers
window.HM=window.HM||{};
Object.assign(window.HM,{pl:{PL,gfx,AUTO_STEPS,SETS,notify:(a,b,c)=>window.plNotify&&plNotify(a,b,c)}});
}
