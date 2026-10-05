'use strict';
// ================================================================ skills, environment, boats, weather, shaping phase
const SKN={wood:'Woodcutting',work:'Woodworking',stone:'Stonecutting',farm:'Farming',fish:'Fishing',hunt:'Hunting'};
const SK_T=[0,30,90,200,380,650];
function skLvl(k){if(MODE!=='god'||!G.sk)return 5;const x=G.sk[k]||0;let l=1;for(let i=1;i<SK_T.length;i++)if(x>=SK_T[i])l=i+1;return l;}
const UNL=[
  {k:'axes',t:'Felling axes',req:{wood:2},d:'Woodcutters bring 20% more timber.'},
  {k:'bows',t:'Bows',req:{wood:3},d:'Hunters and guards take up bows — game falls from range.'},
  {k:'sawmill',t:'Sawmill',req:{work:2},d:'Sawyers turn logs into planks (+25% wood).'},
  {k:'carving',t:'Carved timber',req:{work:3},d:'Carved bargeboards, mullioned windows, jettied townhouses.'},
  {k:'nets',t:'Fishing nets',req:{fish:2},d:'Fishers catch 30% more.'},
  {k:'boats',t:'Boatbuilding',req:{work:3,fish:2},d:'A shipyard and docks: boats fish the deep water (double catch).'},
  {k:'sails',t:'Sailcloth',req:{work:4,fish:3},d:'Fishing boats raise sails and range further.'},
  {k:'mason',t:'Stonemasonry',req:{stone:2},d:'Masons dress stone (+25% stone).'},
  {k:'dressed',t:'Dressed stone',req:{stone:3},d:'Stone lodges, chimney pots, ashlar foundations.'},
  {k:'castle',t:'Fortification',req:{stone:4},d:'The folk can raise a castle.'},
  {k:'gothic',t:'Gothic arches',req:{stone:5,work:4},d:'Great churches with soaring towers.'},
  {k:'rotation',t:'Crop rotation',req:{farm:3},d:'Fields yield 20% more.'},
  {k:'smoking',t:'Smokehouses',req:{hunt:3},d:'Smoked meat keeps: hunts feed 30% more.'}];
function gainXP(k,x){if(MODE!=='god'||!G.sk)return;const b=skLvl(k);G.sk[k]=(G.sk[k]||0)+x;const a=skLvl(k);if(a>b){chron(`The folk grew skilled in ${SKN[k].toLowerCase()} (level ${a}).`,true);checkUnlocks();}}
function checkUnlocks(){for(const u of UNL){if(G.unl[u.k])continue;if(Object.entries(u.req).every(([k,l])=>skLvl(k)>=l)){G.unl[u.k]=true;showBanner(u.t,u.d);chron(`New craft learned: ${u.t}. ${u.d}`,true);sfx('chime');if(u.k==='bows'||u.k==='boats')buildToolbox(MODE==='god'&&G.phase==='shape'?shapeToolDefs():godToolDefs());}}}
// ---------------- environment
function envScan(cx,cz,R){let n=0,water=0,deep=0,flat=0;for(let dz=-R;dz<=R;dz+=3)for(let dx=-R;dx<=R;dx+=3){if(dx*dx+dz*dz>R*R)continue;n++;const x=cx+dx,z=cz+dz;if(Math.abs(x)>HALF||Math.abs(z)>HALF)continue;
    const w=wAt(x,z);if(w>.25)water++;if(w>.8)deep++;else if(w<.05&&slopeAt(x,z)<.35)flat++;}
  let forest=0,rocks=0;for(const t of trees){if(Math.abs(t.x-cx)>R||Math.abs(t.z-cz)>R)continue;if(t.t===4)rocks++;else if(t.t!==5)forest++;}
  let game=0;for(const a of animals)if(Math.hypot(a.x-cx,a.z-cz)<R*1.3)game+=a.sp==='hare'?.3:a.sp==='fox'?.4:a.sp==='horse'?0:a.sp==='boar'?1.4:1;
  const area=Math.PI*R*R/9;
  return {water:water/n,deep:deep/n,flat:flat/n,forest,rocks,game,deepCells:deep*9,
    fishPot:clamp(deep/n/.045,0,1),gamePot:clamp(game/(R>100?60:22),0,1),farmPot:clamp(flat/n/.32,0,1),woodPot:clamp(forest/(R>100?3000:600),0,1),stonePot:clamp(rocks/(R>100?600:60)+deep*0,0,1)};}
function wayOfLife(e){const s=[];if(e.fishPot>.45)s.push('fishers & boatwrights');if(e.gamePot>.45||e.woodPot>.6)s.push('hunters & woodsmen');if(e.farmPot>.5||(e.fishPot<.3&&e.gamePot<.4))s.push('farmers & millers');if(e.stonePot>.5)s.push('quarrymen & masons');
  return s.length?s.slice(0,3).join(', '):'hardy foragers';}
// ---------------- boats
const boats=[];
function updateBoats(dtH){
  const docks=buildings.filter(b=>b.type==='dock'&&!b.build);
  for(const d of docks){if(!d._berth){const wl=d._wl||analyze(d).wLocal;d._wl=wl;let len=6;for(let s=2;s<16;s+=.5){if(wAt(d.x+(wl.x*Math.cos(d.rot)+wl.z*Math.sin(d.rot))*s,d.z+(-wl.x*Math.sin(d.rot)+wl.z*Math.cos(d.rot))*s)>1.1){len=s+2.5;break;}}
      const wx=wl.x*Math.cos(d.rot)+wl.z*Math.sin(d.rot),wz=-wl.x*Math.sin(d.rot)+wl.z*Math.cos(d.rot);d._berth=[d.x+wx*(len+1.5),d.z+wz*(len+1.5)];}
    const want=Math.min(2,G.boatsBuilt||0);let mine=boats.filter(b=>b.dock===d.id);
    while(mine.length<want&&boats.filter(q=>docks.some(o=>o.id===q.dock)).length<(G.boatsBuilt||0)){const m=makeBoatMesh(G.unl.sails,pickA([0x6b4a2e,0x5a3d26,0x7a5634]));scene.add(m);const bo={dock:d.id,m,x:d._berth[0],z:d._berth[1],rot:0,state:'moor',t:0};boats.push(bo);mine=boats.filter(b=>b.dock===d.id);}
    const crew=G.vill.filter(v=>v.work===d.id&&v.inside===d.id).length;d._crew=crew;
    mine.forEach((bo,i)=>{if(bo.sail!==!!G.unl.sails){scene.remove(bo.m);bo.m.geometry.dispose();bo.m=makeBoatMesh(G.unl.sails,0x6b4a2e);scene.add(bo.m);bo.sail=!!G.unl.sails;}
      const sp=(G.unl.sails?14:9)*dtH;
      if(bo.state==='moor'){bo.x+=(d._berth[0]+i*2.5-bo.x)*.1;bo.z+=(d._berth[1]-bo.z)*.1;if(crew>i&&waterU.uIce.value<.5){const t=findFishingWater(d._berth[0],d._berth[1],G.unl.sails?60:38);if(t){bo.tx=t[0];bo.tz=t[1];bo.state='out';}}}
      else if(bo.state==='out'||bo.state==='back'){const dx=bo.tx-bo.x,dz=bo.tz-bo.z,dd=Math.hypot(dx,dz);if(dd<.6){if(bo.state==='out'){bo.state='fish';bo.t=1.2+Math.random()*1.5;}else bo.state='moor';}
        else{bo.x+=dx/dd*Math.min(sp,dd);bo.z+=dz/dd*Math.min(sp,dd);bo.rot+=angDiff(Math.atan2(dx,dz),bo.rot)*.1;}}
      else if(bo.state==='fish'){bo.t-=dtH;if(bo.t<=0||crew<=i||hod()>18.5){bo.state='back';bo.tx=d._berth[0]+i*2.5;bo.tz=d._berth[1];}}
      const y=hAt(bo.x,bo.z)+wAt(bo.x,bo.z);bo.m.position.set(bo.x,y-.12+Math.sin(TT*1.7+i)*.04,bo.z);bo.m.rotation.set(Math.sin(TT*1.3+i)*.04,bo.rot,Math.sin(TT*1.1+i)*.05);});}
  const ABd=allB().filter(b=>b.type==='dock'&&!b.build);for(let i=boats.length-1;i>=0;i--){if(!ABd.some(d=>d.id===boats[i].dock)){scene.remove(boats[i].m);boats.splice(i,1);}}
}
function findFishingWater(x,z,R){for(let t=0;t<30;t++){const a=Math.random()*TAU,r=8+Math.random()*R,tx=x+Math.cos(a)*r,tz=z+Math.sin(a)*r;if(wAt(tx,tz)<1)continue;
    let ok=true;for(let s=0;s<=1;s+=.05){if(wAt(lerp(x,tx,s),lerp(z,tz,s))<.45){ok=false;break;}}if(ok)return [tx,tz];}return null;}
function fishMul(){return (.35+.65*(G.fish==null?1:G.fish))*(G.unl.nets?1.3:1)*(hasBuilt('fishmkt')?1.2:1)*(seasonN()===3?.45:1)*(1+(skLvl('fish')-1)*.05);}
// ---------------- weather & meteors
const rainbow=(()=>{const g=new THREE.Group();const cols=[0xff4040,0xff9a30,0xfff050,0x50e060,0x40a0ff,0x5050d0,0xa050e0];
  cols.forEach((c,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(150-i*3.2,1.7,6,90,PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0,depthWrite:false,fog:false}));g.add(m);});g.visible=false;scene.add(g);return g;})();
const fireballMat=new THREE.MeshBasicMaterial({color:0xffc070});const meteors=[];let shake=0;
function launchMeteor(x,z){const a=Math.random()*TAU;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(2.4,1),fireballMat);scene.add(m);
  meteors.push({x,z,sx:x+Math.cos(a)*150,sz:z+Math.sin(a)*150,sy:hAt(x,z)+170,t:0,m});sfx('thunder');}
function updateMeteors(dt){for(let i=meteors.length-1;i>=0;i--){const M=meteors[i];M.t+=dt/2.4;const f=Math.min(1,M.t),ey=hAt(M.x,M.z);
    const px=lerp(M.sx,M.x,f),py=lerp(M.sy,ey,f*f*.3+f*.7),pz=lerp(M.sz,M.z,f);M.m.position.set(px,py,pz);M.m.rotation.x+=dt*5;
    for(let q=0;q<6;q++)spawn(px+(Math.random()-.5)*2,py+(Math.random()-.5)*2,pz+(Math.random()-.5)*2,(Math.random()-.5)*2,(Math.random())*2,(Math.random()-.5)*2,1+Math.random(),3.5,1,.5+Math.random()*.4,.15,3);
    for(let q=0;q<3;q++)spawn(px,py,pz,(Math.random()-.5),1,(Math.random()-.5),3,4,.35,.32,.3,0);
    if(M.t>=1){scene.remove(M.m);meteors.splice(i,1);impact(M.x,M.z);}}
  if(rainbow.visible){const day=rainbow.userData.t||0;rainbow.children.forEach(m=>m.material.opacity=clamp(day,0,.38));}}
function impact(x,z){const R=11;flash=2;shake=1.6;sfx('thunder');setTimeout(()=>sfx('thunder'),300);
  const i0=Math.max(0,Math.floor(x-R*1.5+HALF)),i1=Math.min(N,Math.ceil(x+R*1.5+HALF)),j0=Math.max(0,Math.floor(z-R*1.5+HALF)),j1=Math.min(N,Math.ceil(z+R*1.5+HALF));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i-HALF-x,j-HALF-z),k=j*S+i;if(d<R)H[k]-=6.5*(1-(d/R)**2);else if(d<R*1.5)H[k]+=1.6*Math.sin((d-R)/(R*.5)*PI);}
  refreshTerrain(i0,j0,i1,j1);
  for(let q=0;q<160;q++){const a=Math.random()*TAU,s=6+Math.random()*16,e=.4+Math.random()*1;spawn(x,hAt(x,z)+1,z,Math.cos(a)*s*Math.cos(e),Math.sin(e)*s*1.4,Math.sin(a)*s*Math.cos(e),1.5+Math.random(),.9+Math.random()*1.5,...(q%3?[.45,.36,.26]:[1,.6,.2]),3);}
  for(let q=0;q<40;q++)spawn(x+(Math.random()-.5)*8,hAt(x,z)+2,z+(Math.random()-.5)*8,(Math.random()-.5)*2,2+Math.random()*2,(Math.random()-.5)*2,6,4,.3,.28,.26,0);
  for(let n=0;n<14;n++){const a=Math.random()*TAU,r=R*.6+Math.random()*R;trees.push({x:x+Math.cos(a)*r,z:z+Math.sin(a)*r,t:4,s:.6+Math.random()*1.2,r:Math.random()*TAU,c:.1});}
  for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.t!==4&&Math.hypot(t.x-x,t.z-z)<R*1.4)trees.splice(i,1);}treesDirty=true;
  for(let i=animals.length-1;i>=0;i--)if(Math.hypot(animals[i].x-x,animals[i].z-z)<R*1.2)animals.splice(i,1);
  if(MODE==='god'){let lost=0;for(const v of G.vill.slice())if(!v.hidden&&Math.hypot(v.x-x,v.z-z)<R*.9){lost++;removeVillager(v,'died');}
    for(const b of G.bandits.slice())if(Math.hypot(b.x-x,b.z-z)<R*1.2)hitBandit(b,99);
    for(const b of buildings.slice()){const d=Math.hypot(b.x-x,b.z-z);if(d<R*.8+b.r*.5){for(const v of G.vill)if(v.inside===b.id&&v.hidden){lost++;removeVillager(v,'died');}destroyBuilding(b,`A falling star shattered the ${b.info?b.info.name:'building'}.`);}else if(d<R*1.8&&Math.random()<.6)ignite(b,null);}
    if(G.phase==='play'){G.stone+=45;chron(`A star fell from the sky ${dirWord(x,z)} of ${G.town}${lost?`, killing ${lost} of the folk`:''}. Star-stone was gathered from the crater (+45 stone).`,true);if(lost)G.grief+=lost*2;else G.joy+=2;}
    gridDirty=true;}
  for(const b of buildings)if(Math.hypot(b.x-x,b.z-z)<R*2)realize(b);
}
function castWeather(id){
  if(id==='p:sun'){if(G.sun>12){toast('The sun already shines');return true;}if(G.openRain){G.openRain=false;chron('The Spirit parted the clouds. The first fire caught at last, and the settlers wept with relief.',true);}else if(!spend(25))return true;else chron('The Spirit parted the clouds. A golden day.');G.sun=24;G.rain=0;G.snow=0;G.storm=0;G.joy=Math.min(25,G.joy+2);sfx('chime');return true;}
  if(id==='p:storm'){if(!spend(70))return true;G.rain=20;G.rainI=1.6;G.storm=20;G.sun=0;chron('The Spirit called a thunderstorm over the valley.',true);sfx('thunder');return true;}
  if(id==='p:snow'){if(!spend(30))return true;G.snow=24;G.rain=0;G.sun=0;chron(seasonN()===3?'Deep snow fell at the Spirit’s word.':'Snow fell out of season. The folk shivered and wondered.');sfx('chime');return true;}
  if(id==='p:rainbow'){if(G.rain<=0&&G.t-(G.lastRain||-99)>14){toast('A rainbow needs rain first');return true;}if(G.rainbow>0){toast('The rainbow already shines');return true;}if(!spend(40))return true;G.rainbow=10;G.joy=Math.min(25,G.joy+6);chron('A great rainbow arched over '+G.town+'. The folk took it as a blessing.',true);sfx('chime');return true;}
  if(id==='p:herd'){toast('Pick a herd and click the land');return true;}
  return false;}
function weatherHour(){
  if(G.rain>0)G.lastRain=G.t;
  if(G.sun>0){G.sun--;for(let k=0;k<V;k++){const w=W[k];if(w>0&&w<.6)W[k]=Math.max(0,w-.012);}}
  if(G.snow>0){G.snow--;for(const b of buildings)if(b.fire){b.fire=null;realize(b);}}
  if(G.rainbow>0)G.rainbow--;
  if(G.storm>0){G.storm--;const c=G.center||{x:0,z:0};for(let s=0;s<2;s++){let x,z;const bt=G.bandits.length&&Math.random()<.7?pickA(G.bandits):null;
      if(bt){x=bt.x;z=bt.z;}else{x=c.x+(Math.random()-.5)*130;z=c.z+(Math.random()-.5)*130;}
      lightning(x,z);sfx('thunder');for(const b of G.bandits.slice())if(Math.hypot(b.x-x,b.z-z)<3.5)hitBandit(b,99);
      for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(Math.hypot(t.x-x,t.z-z)<1.6){trees.splice(i,1);treesDirty=true;}}
      for(const b of buildings)if(Math.hypot(b.x-x,b.z-z)<b.r&&Math.random()<.3)ignite(b,`Lightning struck the ${b.info?b.info.name:'building'}!`);}}
}
// ---------------- banners
const MKMAX={settle:3,farm:3,worship:1,forbid:4};
function markerClick(k){if(!hover)return;
  let bi=-1,bd=5;G.markers.forEach((m,i)=>{const d=Math.hypot(m.x-hover.x,m.z-hover.z);if(d<bd){bd=d;bi=i;}});
  if(bi>=0){const m=G.markers[bi];G.markers.splice(bi,1);refreshMarkers();toast(`${MK[m.k].n} banner removed`);buildToolbox(godToolDefs());return;}
  const same=G.markers.filter(m=>m.k===k);if(same.length>=MKMAX[k]){toast(`All ${MKMAX[k]} “${MK[k].n}” banners are planted — click one to remove it`);sfx('deny');return;}
  G.markers.push({k,x:hover.x,z:hover.z});refreshMarkers();toast(`${MK[k].n}: banner planted (${same.length+1}/${MKMAX[k]}) — click it again to remove`);sfx('chime');buildToolbox(godToolDefs());updateUI(true);}
const mkCount=k=>`${(G.markers||[]).filter(m=>m.k===k).length}/${MKMAX[k]}`;
// ---------------- shaping phase
function shapeToolDefs(){return [
  ['Shape the land',[['raise','Raise','1','free'],['lower','Lower','2','free'],['smooth','Smooth','3','free'],['flatten','Flatten','4','free'],['cliff','Cliff','5','free'],['terrace','Terrace','6','free'],['canyon','Canyon','7','free']]],
  ['Water',[['pour','Pour water','8','free'],['spring','Spring','9','free'],['drain','Drain','0','free']]],
  ['Nature',[['plant','Plant forest','T','free'],['fell','Clear trees','Y','free'],['rocks','Scatter rocks','','free']]],
  ['Wildlife',[['w:deer','Deer herd','','free'],['w:boar','Boar sounder','','free'],['w:hare','Hares','','free'],['w:fox','Foxes','','free'],['w:horse','Wild horses','','free']]],
  ['Sky',[['meteor','Meteor','','free']]]];}
let envT=0,envRep=null;
function envReportHTML(){const e=envRep||(envRep=envScan(0,0,155));const bar=(v)=>`<span class="bar"><i style="width:${Math.round(clamp(v,0,1)*100)}%"></i></span>`;
  return `<div id="envrep"><div class="row"><span>Water</span>${bar(e.water/.12)}</div><div class="row"><span>Fish</span>${bar(e.fishPot)}</div><div class="row"><span>Forest</span>${bar(e.woodPot)}</div>
  <div class="row"><span>Game</span>${bar(e.gamePot)}</div><div class="row"><span>Farmland</span>${bar(e.farmPot)}</div><div class="row"><span>Stone</span>${bar(e.stonePot)}</div>
  <div class="way">Your folk will become <b>${wayOfLife(e)}</b>.</div>${e.water<.015?'<div class="warn" style="font-size:14px;color:var(--red)">Water is scarce — open a spring or they must live by farming and hunting.</div>':''}</div>`;}
function startShaping(w,seed){enterGodUI();resetG();WORLD=w;G.world=w;G.seed=seed;newWorld(seed);for(const b of buildings.slice())removeBuilding(b);springs.forEach(s=>s.base=null);
  populateAnimals(seed,WORLDS[w].game);G.phase='shape';envRep=null;undoStack.length=0;
  buildToolbox(shapeToolDefs());setTool('raise');cam.tx=0;cam.tz=0;cam.dist=330;cam.pitch=1.0;cam.yaw=.6;
  hintEl.textContent='Shape the valley freely. Nothing costs Faith yet. When ready, call the settlers.';showBanner(WORLDS[w].name,'Shape the valley before your people arrive');updateUI(true);applyUI();}
function callSettlers(){G.phase='pick';buildToolbox(godToolDefs());setTool('m:settle');hintEl.textContent='Click the land to show the settlers where to make camp.';showBanner('The settlers approach','Show them where to make camp');updateUI(true);}
let setupWorld='river',setupSeed=(Math.random()*1e6)|0;
function showSetup(){const s=$('setup');s.classList.remove('hidden');$('title').classList.add('hidden');const box=$('worlds');box.innerHTML='';
  for(const [k,w] of Object.entries(WORLDS)){const b=document.createElement('button');b.innerHTML=`${w.name}<small>${w.desc}</small>`;b.classList.toggle('on',k===setupWorld);b.onclick=()=>{setupWorld=k;showSetup();};box.appendChild(b);}
  $('seedv').textContent=setupSeed;}
document.getElementById('reroll').onclick=()=>{setupSeed=(Math.random()*1e6)|0;$('seedv').textContent=setupSeed;};
document.getElementById('setupBack').onclick=()=>{$('setup').classList.add('hidden');showTitle();};
document.getElementById('setupGo').onclick=()=>{$('setup').classList.add('hidden');$('loading')&&0;startShaping(setupWorld,setupSeed);};
// ---------------- crafts panel
function toggleCrafts(){const c=$('crafts');c.classList.toggle('hidden');if(!c.classList.contains('hidden'))renderCrafts();}
function renderCrafts(){const c=$('crafts');if(c.classList.contains('hidden'))return;
  let h=`<h2 style="font-family:Cinzel,serif;margin:0 0 4px;color:var(--wood)">Crafts of ${esc(G.town)}</h2><div class="small" style="font-style:italic;color:var(--ink2);margin-bottom:8px">Skills grow as the folk work. New crafts change what they can build and how fine it looks.</div>`;
  for(const k in SKN){const l=skLvl(k),x=G.sk[k]||0,lo=SK_T[l-1]||0,hi=SK_T[l]||SK_T[SK_T.length-1];const f=l>=6?1:(x-lo)/(hi-lo);
    h+=`<div class="sk"><span>${SKN[k]}</span><span class="bar"><i style="width:${Math.round(f*100)}%"></i></span><b>${l}</b></div>`;}
  h+='<div class="un">'+UNL.map(u=>G.unl[u.k]?`<div><b>✓ ${u.t}</b> — ${u.d}</div>`:`<div><i>${u.t}</i> — needs ${Object.entries(u.req).map(([k,l])=>`${SKN[k]} ${l}`).join(' & ')}</div>`).join('')+'</div>';
  const e=G.env;if(e)h+=`<div class="un" style="margin-top:8px">Around the town: fish ${Math.round(e.fishPot*100)}% · game ${Math.round(e.gamePot*100)}% · farmland ${Math.round(e.farmPot*100)}% · fish stocks ${Math.round((G.fish||1)*100)}%. The folk live as <b>${wayOfLife(e)}</b>.</div>`;
  h+=`<p style="text-align:right;margin:10px 0 0"><button onclick="document.getElementById('crafts').classList.add('hidden')">Close</button></p>`;c.innerHTML=h;}
document.getElementById('gCrafts').onclick=toggleCrafts;

