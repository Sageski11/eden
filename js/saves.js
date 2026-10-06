'use strict';
// ================================================================ local saves (IndexedDB, gzip, thumbnails, autosave per realm)
const SAVE={db:null,cur:null,busy:false,lastAuto:0,ok:true};
function idb(){return new Promise((res,rej)=>{if(SAVE.db)return res(SAVE.db);let r;try{r=indexedDB.open('hearthmere',1);}catch(e){return rej(e);}
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('saves'))r.result.createObjectStore('saves',{keyPath:'id'});};
  r.onsuccess=()=>{SAVE.db=r.result;res(SAVE.db);};r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'));});}
function _tx(mode,fn){return idb().then(db=>new Promise((res,rej)=>{const tx=db.transaction('saves',mode);const st=tx.objectStore('saves');let out;const q=fn(st);if(q)q.onsuccess=()=>{out=q.result;};tx.oncomplete=()=>res(out);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);}));}
const dbPut=rec=>_tx('readwrite',st=>st.put(rec));
const dbGet=id=>_tx('readonly',st=>st.get(id));
const dbDel=id=>_tx('readwrite',st=>st.delete(id));
const dbAll=()=>_tx('readonly',st=>st.getAll()).then(a=>(a||[]).sort((x,y)=>y.time-x.time));
async function gzip(str){if(!window.CompressionStream)return str;try{return await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).blob();}catch(e){return str;}}
async function gunzip(d){if(typeof d==='string')return d;return await new Response(d.stream().pipeThrough(new DecompressionStream('gzip'))).text();}
function saveThumb(){try{const hid=[...document.querySelectorAll('#gtop,#tools,#prayers,#insp,#brushbar')];renderer.render(scene,camera);const s=renderer.domElement;
  const c=document.createElement('canvas');c.width=256;c.height=144;const g=c.getContext('2d');const ar=s.width/s.height,tr=256/144;let sw=s.width,sh=s.height,sx=0,sy=0;
  if(ar>tr){sw=sh*tr;sx=(s.width-sw)/2;}else{sh=sw/tr;sy=(s.height-sh)/2;}g.drawImage(s,sx,sy,sw,sh,0,0,256,144);return c.toDataURL('image/jpeg',.74);}catch(e){return '';}}
function realmId(){if(!G.realm)G.realm=Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);return G.realm;}
function townNames(){try{return TOWNS.list.map((t,i)=>t.dead?null:sName(i)).filter(Boolean);}catch(e){return [G.town];}}
function saveMeta(){return {town:G.town,towns:townNames(),world:G.world||'river',era:ERAS[G.era].name,pop:popN(),year:yearN(),season:SEASONS[seasonN()],day:dayN(),phase:G.phase,realm:realmId()};}
// Browsers cap storage. When a write fails we make room by dropping the oldest autosaves (never the newest of a realm, never a named save), then try once more.
async function freeSpace(keepId){let n=0;try{const all=await dbAll();const seen=new Set(),victims=[];
    for(const r of all){if(!r.auto||r.id===keepId)continue;const k=String(r.id).replace(/:\d$/,'');if(!seen.has(k)){seen.add(k);continue;}victims.push(r);}
    victims.reverse();for(const r of victims.slice(0,2)){await dbDel(r.id);n++;}}catch(e){}return n;}
async function saveGame(id,opt={}){if(MODE!=='god'||G.phase==='pick'||SAVE.busy)return false;SAVE.busy=true;
  try{const data=serializeGod();const rec=Object.assign({id,name:opt.name||G.town,auto:!!opt.auto,time:Date.now(),thumb:saveThumb(),v:2},saveMeta(),{data:await gzip(data)});
    try{await dbPut(rec);}catch(e){await freeSpace(id);await dbPut(rec);}
    if(!opt.auto)SAVE.cur=id;try{localStorage.setItem('hearthmere_last',id);}catch(e){}SAVE.ok=true;SAVE.full=false;return true;}
  catch(e){console.warn('save failed',e);SAVE.ok=false;SAVE.full=true;if(!opt.auto||!SAVE.warned){SAVE.warned=true;toast('This browser has no room left to save. Open Save and delete old realms, or export a file.');}return false;}
  finally{SAVE.busy=false;}}
// three rolling autosaves per realm: the oldest slot is overwritten, so a bad moment can be rewound
async function autoSave(){if(MODE!=='god'||G.menu||(G.phase!=='play'&&G.phase!=='shape'))return false;SAVE.lastAuto=performance.now();
  const base='auto:'+realmId();let mine=[];try{mine=(await dbAll()).filter(r=>r.id===base||String(r.id).startsWith(base+':'));}catch(e){}
  const free=[0,1,2].map(i=>base+':'+i).find(x=>!mine.some(r=>r.id===x));let id=free;
  if(!free||mine.length>=3){const slots=mine.filter(r=>/:\d$/.test(r.id)).sort((x,y)=>x.time-y.time);id=(slots[0]||{id:base+':0'}).id;}
  const ok=await saveGame(id,{auto:true,name:G.town+' (autosave)'});
  if(ok){try{const legacy=mine.find(r=>r.id===base);if(legacy&&mine.length>=3)await dbDel(base);}catch(e){}}return ok;}
async function quickSave(){const id=SAVE.cur||('m:'+Date.now());const ok=await saveGame(id);toast(ok?`Saved “${G.town}”`:'Could not save in this browser');if(!$('saves').classList.contains('hidden'))renderSaves();}
async function loadSaveRec(rec){const str=await gunzip(rec.data);closePause();loadGod(str);if(!rec.auto)SAVE.cur=rec.id;try{localStorage.setItem('hearthmere_last',rec.id);}catch(e){}
  $('saves').classList.add('hidden');toast('Welcome back to '+G.town);}
function fmtAgo(t){const s=(Date.now()-t)/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';const d=new Date(t);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});}
const WNAME={river:'Riverlands',lake:'Lakeland',high:'Highlands',dry:'Dry Steppe',blank:'Blank Canvas'};
let delArm=null;
async function storageLine(){try{const e=await navigator.storage.estimate();if(e&&e.quota)return `<p class="none" style="font-size:13px">This browser is holding ${(e.usage/1048576).toFixed(1)} MB of ${(e.quota/1048576).toFixed(0)} MB. Autosaves keep the last three of each realm.</p>`;}catch(e){}return '';}
async function renderSaves(){const box=$('saveList');let list=[];try{list=await dbAll();}catch(e){box.innerHTML='<p class="none">Saving is not available in this browser (private mode?). Use Export instead.</p>';return;}
  const inGame=MODE==='god'&&!G.menu&&(G.phase==='play'||G.phase==='shape');$('svNew').style.display=inGame?'':'none';$('svExport').style.display=inGame?'':'none';
  if(!list.length){box.innerHTML='<p class="none">No saved realms yet. Your realm is also saved automatically while you play.</p>';return;}
  const usage=await storageLine();
  box.innerHTML=list.map(r=>`<div class="sv${r.id===SAVE.cur?' cur':''}" data-id="${r.id}"><div class="th" style="background-image:url(${r.thumb||''})">${r.auto?'<span class="tag">auto</span>':''}</div>
    <div class="inf"><b>${esc(r.name||r.town)}</b><span>${WNAME[r.world]||''} · ${r.phase==='shape'?'shaping the land':`${r.era} · ${r.pop} folk`}${r.towns&&r.towns.length>1?' · '+esc(r.towns.join(' & ')):''}</span><span>Year ${r.year}, ${r.season} · saved ${fmtAgo(r.time)}</span>
    <div class="act"><button data-a="load">Load</button>${inGame&&!r.auto?'<button data-a="over">Overwrite</button>':''}<button data-a="ren">Rename</button><button data-a="exp" title="Download as a file">⇩</button><button data-a="del" class="del">${delArm===r.id?'Really delete?':'Delete'}</button></div></div></div>`).join('')+usage;
  for(const el of box.querySelectorAll('.sv'))el.onclick=async e=>{const a=e.target.dataset.a;if(!a)return;const id=el.dataset.id;const rec=await dbGet(id);if(!rec)return renderSaves();
    if(a==='load'){if(MODE==='god'&&G.phase==='play')await autoSave();audioInit();try{await loadSaveRec(rec);}catch(err){console.warn(err);toast('That save could not be read');}}
    else if(a==='over'){await saveGame(id,{name:rec.name});toast('Saved over “'+(rec.name||rec.town)+'”');renderSaves();}
    else if(a==='ren'){showNameRow(true,id,rec.name||rec.town);}
    else if(a==='exp'){const s=await gunzip(rec.data);dlText(s,(rec.name||rec.town||'realm').replace(/[^\w\- ]+/g,'')+'.hearthmere.json');}
    else if(a==='del'){if(delArm!==id){delArm=id;renderSaves();setTimeout(()=>{if(delArm===id){delArm=null;renderSaves();}},3000);return;}delArm=null;await dbDel(id);if(SAVE.cur===id)SAVE.cur=null;renderSaves();refreshContinue();}};}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function dlText(s,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
function openSaves(){$('saves').classList.remove('hidden');$('svTitle').textContent=MODE==='god'&&!G.menu?'Save & load':'Your realms';renderSaves();}
$('svClose').onclick=()=>{$('saves').classList.add('hidden');showNameRow(false);};
let nameTarget=null;
function showNameRow(on,target,cur){const r=$('svNameRow');r.classList.toggle('hidden',!on);nameTarget=target||null;if(on){const i=$('svNameIn');i.value=cur||(`${G.town} — ${MODE==='god'&&G.phase==='shape'?'shaping':'year '+yearN()+', '+SEASONS[seasonN()]}`);$('svNameOk').textContent=target?'Rename':'Save';setTimeout(()=>{i.focus();i.select();},30);}}
$('svNew').onclick=()=>showNameRow(true);
$('svNameX').onclick=()=>showNameRow(false);
$('svNameIn').addEventListener('keydown',e=>{if(e.code==='Enter')$('svNameOk').click();if(e.code==='Escape'){showNameRow(false);e.stopPropagation();}});
$('svNameOk').onclick=async()=>{const nm=($('svNameIn').value||'').trim().slice(0,40)||G.town;
  if(nameTarget){const rec=await dbGet(nameTarget);if(rec){rec.name=nm;await dbPut(rec);}toast('Renamed to “'+nm+'”');}
  else{const id='m:'+Date.now();const ok=await saveGame(id,{name:nm});toast(ok?`Saved “${nm}”`:'Could not save in this browser');}
  document.activeElement&&document.activeElement.blur();showNameRow(false);renderSaves();refreshContinue();};
$('svExport').onclick=()=>{dlText(serializeGod(),(G.town||'realm')+'.hearthmere.json');};
$('svImport').onclick=()=>$('svFile').click();
$('svFile').onchange=()=>{const f=$('svFile').files[0];if(!f)return;f.text().then(async t=>{try{const o=JSON.parse(t);if(o.mode!=='god')throw 0;audioInit();closePause();loadGod(t);$('saves').classList.add('hidden');toast('Realm imported');const id='m:'+Date.now();await saveGame(id);}catch(e){toast('That file is not a Hearthmere realm');}});$('svFile').value='';};
$('gSave').onclick=openSaves;$('tLoad').onclick=()=>{audioInit();openSaves();};
async function refreshContinue(){let list=[];try{list=await dbAll();}catch(e){}
  // migrate the old single-slot save
  try{const old=localStorage.getItem('hearthmere_god');if(old&&SAVE.ok){const o=JSON.parse(old);const rec={id:'auto:legacy',name:o.G.town+' (older save)',auto:true,time:Date.now()-1000,thumb:'',v:2,town:o.G.town,world:o.G.world||'river',era:ERAS[o.G.era].name,pop:o.vill.length,year:Math.floor(o.G.t/24/(DPS*4))+1,season:SEASONS[Math.floor(o.G.t/24/DPS)%4],phase:o.G.phase,data:await gzip(old)};await dbPut(rec);localStorage.removeItem('hearthmere_god');list=await dbAll();}}catch(e){}
  const c=$('tCont');if(!list.length){c.classList.add('hidden');$('tLoad').classList.add('hidden');return;}
  const r=list[0];c.classList.remove('hidden');$('tLoad').classList.remove('hidden');c.dataset.id=r.id;$("tContSub").textContent=`${r.name||r.town} — ${r.phase==='shape'?'shaping the land':r.era+', '+r.pop+' folk'}, year ${r.year} · ${fmtAgo(r.time)}`;}
$('tCont').onclick=async()=>{audioInit();try{const rec=await dbGet($('tCont').dataset.id);await loadSaveRec(rec);}catch(e){console.warn(e);toast('The save could not be read');}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&MODE==='god'&&!G.menu)autoSave();});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.code==='KeyS'&&MODE==='god'){e.preventDefault();quickSave();}},true);
refreshContinue();
Object.assign(window.HM,{saveGame,autoSave,dbAll,dbGet,loadSaveRec,quickSave});
// ================================================================ graphics quality presets
const QUAL={high:{pr:2,sh:4096,grass:1,t2:95,label:'High'},bal:{pr:1.25,sh:2048,grass:.75,t2:70,label:'Balanced'},low:{pr:1,sh:1024,grass:0,t2:40,label:'Low'}};
let qualKey='high';
function applyQuality(k){qualKey=k;const q=QUAL[k];const lowq=location.search.includes('lowq');
  renderer.setPixelRatio(Math.min(devicePixelRatio,q.pr));renderer.setSize(innerWidth,innerHeight);
  const sz=lowq?1024:q.sh;if(sun.shadow.mapSize.x!==sz){sun.shadow.mapSize.set(sz,sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
  GRASS.q=q.grass;GRASS.force=true;TREE2.R=q.t2;treesDirty=true;
  if(typeof plApplyGfx==='function')plApplyGfx(q);
  $('gQual').textContent=q.label;try{localStorage.setItem('hearthmere_q',k);}catch(e){}}
$('gQual').onclick=()=>{applyQuality(qualKey==='high'?'bal':qualKey==='bal'?'low':'high');toast('Graphics: '+QUAL[qualKey].label);};
{let k=null;try{k=localStorage.getItem('hearthmere_q');}catch(e){}if(!QUAL[k])k=devicePixelRatio>1.4||(navigator.hardwareConcurrency||8)<=4?'bal':'high';applyQuality(k);}
// (the adaptive frame-time guard now lives in polish.js: it eases detail step by step and says so)
