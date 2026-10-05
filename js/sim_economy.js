'use strict';
// ================================================================ GOD GAME — construction, planner, economy, events
const COST={house:[[8,0,5],[10,0,6],[12,6,8],[10,16,10]],farm:[6,0,4],lumber:[5,0,3],fish:[6,0,4],quarry:[10,0,5],well:[4,10,5],smith:[14,10,10],mill:[18,12,14],
  tavern:[20,14,14],church:[18,34,22],market:[16,10,10],tower:[10,16,10],castle:[40,100,55],hall:[[0,0,3],[24,12,14],[20,40,20]],dock:[14,4,8],fishmkt:[16,8,10],lodge:[10,0,5],shipyard:[24,6,14],sawmill:[18,8,10],mason:[12,14,10]};
function costOf(type,variant,level){if(type==='house'||type==='hall')return COST[type][level||0];if(type==='camp')return COST[variant]||COST.lumber;return COST[type];}
const TYPE_R={house:2.4,farm:5.5,camp:4.4,quarry:3.9,well:1.7,smith:3.3,mill:3.2,tavern:4.7,church:6.6,market:4.9,tower:2.1,castle:12.5,hall:5.4,dock:3.2,fishmkt:4.4,lodge:3.6,shipyard:4.6,sawmill:3.8,mason:3.4};
function startSite(type,x,z,rot,o={}){
  const b=newRecord(type,x,z,rot,o.seed||((rnd()*1e9)|0));b.manual=true;b.cw=skLvl('work');b.cs=skLvl('stone');b.level=o.level!=null?o.level:(type==='house'||type==='hall'?0:(typeof TIERED!=='undefined'&&TIERED.includes(type)?eraTierFor(type):null));b.variant=o.variant||null;
  if(o.w){b.w=o.w;b.d=o.d;}
  const [w,s,wk]=costOf(type,b.variant,b.level);
  b.build={need:{wood:w,stone:s},have:{wood:0,stone:0},inb:{wood:0,stone:0},work:wk,done:0,blessed:false};
  if(o.forFam)b.forFam=o.forFam;
  addBuilding(b);if(MODE==='god'&&G.plan)onPlannedBuild(b);
  tfGradeSite(b);const nt=trees.length;clearTreesAround(b.x,b.z,(TYPE_R[type]||2.5)+(type==='camp'||type==='castle'?1.2:.3));const cut=nt-trees.length;if(cut>0){G.wood+=cut;}
  realize(b);rebuildNear(b.x,b.z,34,b);gridDirty=true;
  if(['church','castle','smith','mill','tavern','market','quarry','well'].includes(type))chron(`The folk began raising a ${siteName(b)}.`);
  return b;
}
function startUpgrade(b,to){b.cw=skLvl('work');b.cs=skLvl('stone');const [w,s,wk]=costOf(b.type,b.variant,to);b.upg={to,need:{wood:w,stone:s},have:{wood:0,stone:0},inb:{wood:0,stone:0},work:wk,done:0,blessed:false};realize(b);}
function completeSite(b){
  const wasUp=!!b.upg,wasHall=b.type==='hall';
  if(b.build){b.build=null;}else if(b.upg){b.level=b.upg.to;b.upg=null;}
  realize(b);rebuildNear(b.x,b.z,34,b);gridDirty=true;refreshCivic();
  for(let i=0;i<26;i++){const a=rnd()*TAU;spawn(b.x+Math.cos(a)*b.r*.6,hAt(b.x,b.z)+.5,b.z+Math.sin(a)*b.r*.6,Math.cos(a)*.8,.5+rnd()*.5,Math.sin(a)*.8,1.6,1.4,.62,.55,.45,0);}
  for(const v of G.vill)if(v.site===b.id)v.site=0;
  const nm=b.info?b.info.name:siteName(b);
  if(b.type==='house'){if(!G.firstHut){G.firstHut=true;chron(`The first home was finished: a ${nm.toLowerCase()}. Smoke rose from its roof that night.`,true);}
    else if(wasUp)chron(`The ${famOfHouse(b)} family improved their home into a ${nm.toLowerCase()}.`);else chron(`A new ${nm.toLowerCase()} was finished${b.forFam?` for the ${b.forFam} family`:''}.`);}
  else if(wasHall&&wasUp)chron(`The settlers raised a ${nm}. ${G.town} has a heart.`,true);
  else if(b.type==='hall')chron(`The settlers pitched their camp and named the place ${G.town}.`,true);
  else chron(`The ${nm} was completed.`,['church','castle','market','tavern','smith','mill','well','quarry','tower'].includes(b.type));
  if(b.type==='church')sfx('bell');
  assignHomes();assignJobs();checkEra();
}
function famOfHouse(b){const v=G.vill.find(o=>o.home===b.id);return v?v.fam:'local';}
function destroyBuilding(b,why){
  chron(why,true);griefAdd(3);
  for(let i=0;i<40;i++){const a=rnd()*TAU;spawn(b.x+Math.cos(a)*b.r*.7,hAt(b.x,b.z)+rnd()*2,b.z+Math.sin(a)*b.r*.7,Math.cos(a)*.5,.6+rnd(),Math.sin(a)*.5,3,1.8,.3,.28,.26,0);}
  for(const v of G.vill){if(v.home===b.id)v.home=0;if(v.work===b.id){v.work=0;v.job=null;}if(v.site===b.id)v.site=0;if(v.inside===b.id)v.inside=0;}
  const wasC=b===G.center;
  removeBuilding(b);rebuildNear(b.x,b.z,34);gridDirty=true;
  if(wasC){G.center=startSite('hall',b.x,b.z,b.rot,{level:b.level||0});G.center.stock={wood:G.wood,stone:G.stone,food:G.food};chron('The folk began rebuilding the heart of '+G.town+'.',true);}
  assignHomes();assignJobs();
}
// ---------------- construction visuals
const scafMat=matB;
function onRealize(b){
  if(MODE!=='god')return;
  const main=b.obj.children[0];
  if(b.build){main.geometry.computeBoundingBox();const bb=main.geometry.boundingBox;b._y0=bb.min.y;b._y1=bb.max.y;
    const p=b.build,target=b._y0+(b._y1-b._y0)*(.03+.97*(p.done/p.work));
    const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),target);b._plane=plane;
    b.obj.traverse(m=>{if(m.isMesh){m.material=cloneB(m.material);m.material.clippingPlanes=[plane];m.material.clipShadows=true;}});
    addScaffold(b,bb,true);}
  else if(b.upg){main.geometry.computeBoundingBox();addScaffold(b,main.geometry.boundingBox,false);}
  if(b.fire)addFireFx(b);
}
function addScaffold(b,bb,stakes){const B=new Builder(rnd,.08);const x0=bb.min.x-.35,x1=bb.max.x+.35,z0=bb.min.z-.35,z1=bb.max.z+.35,top=bb.max.y+.2;
  const cs=Math.cos(b.rot),sn=Math.sin(b.rot),gl=(lx,lz)=>hAt(b.x+lx*cs+lz*sn,b.z-lx*sn+lz*cs);
  const xs=[],zs=[];for(let i=0;i<=Math.max(1,Math.round((x1-x0)/1.8));i++)xs.push(lerp(x0,x1,i/Math.max(1,Math.round((x1-x0)/1.8))));for(let i=0;i<=Math.max(1,Math.round((z1-z0)/1.8));i++)zs.push(lerp(z0,z1,i/Math.max(1,Math.round((z1-z0)/1.8))));
  const posts=[];for(const x of xs){posts.push([x,z0],[x,z1]);}for(const z of zs.slice(1,-1)){posts.push([x0,z],[x1,z]);}
  for(const [x,z] of posts){const g=gl(x,z);B.box(x,g-.2,z,.1,top-g+.2,.1,0xa08060);}
  const ymin=Math.min(...posts.map(([x,z])=>gl(x,z)));
  for(let y=ymin+1.5;y<top;y+=1.6){B.box((x0+x1)/2,y,z0,x1-x0,.08,.28,0x9a7a52);B.box((x0+x1)/2,y,z1,x1-x0,.08,.28,0x9a7a52);B.box(x0,y,(z0+z1)/2,.28,.08,z1-z0,0x9a7a52);B.box(x1,y,(z0+z1)/2,.28,.08,z1-z0,0x9a7a52);}
  if(stakes){for(let i=0;i<posts.length;i+=2){const [x,z]=posts[i];B.beam(x,gl(x,z)+.1,z,x+(i%4<2?1:-1)*.9,gl(x,z)+1.4,z,.06,0x8a6a40);}
    B.box((x0+x1)/2,gl(0,0)+.05,(z0+z1)/2,(x1-x0)*.7,.06,(z1-z0)*.7,0x8a7a5a);}
  const m=B.mesh(scafMat);m.name='scaf';b.obj.add(m);}
function updateSites(dt){for(const b of buildings){if(b.build&&b._plane){const p=b.build,t=b._y0+(b._y1-b._y0)*(.03+.97*(p.done/p.work));b._plane.constant+=(t-b._plane.constant)*Math.min(1,dt*3);}}}
// ---------------- fire visuals
const fireMat2=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.92});
function addFireFx(b){const main=b.obj.children[0];main.geometry.computeBoundingBox();const bb=main.geometry.boundingBox;
  b._flames=[];for(let i=0;i<5;i++){const f=new Builder(rnd,0);const s=.9+rnd()*.9;f.cone(0,0,0,.5*s,1.6*s,0xff6a1a,6);f.cone(0,0,0,.3*s,1.2*s,0xffc040,5);const m=f.mesh(fireMat2,false);
    m.position.set(lerp(bb.min.x,bb.max.x,.2+rnd()*.6),bb.max.y*.82+bb.min.y*.18-.4+rnd()*.6,lerp(bb.min.z,bb.max.z,.2+rnd()*.6));m.userData.ph=rnd()*9;b.obj.add(m);b._flames.push(m);}
  b.emit=b.emit.filter(e=>!e.fire);b.emit.push({wx:b.x,wy:bb.max.y,wz:b.z,rate:5,dark:1,acc:0,fire:1});}
// ---------------- jobs & homes
const SLOTJ={dock:['fisher',3],lodge:['hunter',3],fishmkt:['fishmonger',1],sawmill:['sawyer',2],mason:['mason',2],shipyard:['shipwright',2],farm:['farmer',2],lumber:['wood',2],fish:['fisher',2],quarry:['quarry',2],smith:['smith',1],mill:['miller',1],church:['priest',1],tavern:['keeper',1],market:['merchant',1],tower:['guard',2],castle:['guard',4],hall:['clerk',1]};
function slotKey(b){return b.type==='camp'?b.variant:b.type;}
function assignJobs(){
  const ad=G.vill.filter(v=>v.age>=14&&v.age<=64&&!v.leaving&&!v.arriving&&!v.sick&&!v.mission);const p=popN();
  const sites=buildings.filter(siteProj).length,winter=seasonN()===3,foodLow=G.food<p*5;
  const slots=[],food=[],other=[];
  for(const b of buildings){if(b.build)continue;const k=slotKey(b),sj=SLOTJ[k];if(!sj)continue;if(k==='hall'&&!b.level)continue;
    let n=sj[1];if(k==='farm'&&winter)n=0;if(k==='lumber')n=G.wood>260?0:G.wood>140?1:G.wood<60?3:n;if(k==='quarry'&&G.stone>220)n=1;if(k==='tower'&&!(G.raids||p>=40))n=1;
    if(k==='dock'&&!G.unl.boats)n=1;for(let i=0;i<n;i++)(k==='farm'||k==='fish'||k==='dock'||k==='lodge'?food:other).push({b,job:sj[0]});}
  const nb=sites?(G.wood<6&&G.stone<6?1:clamp(Math.ceil(ad.length*.3),1,2+sites*2)):0;const bs=[];for(let i=0;i<nb;i++)bs.push({b:null,job:'builder'});
  const foodNeed=Math.ceil((Math.ceil(p/2.3)+1)*(G.food<p*3?1.35:G.food>p*12?.6:G.food>p*7?.85:1));
  const eff=s=>s.job==='fisher'?(s.b.type==='dock'&&G.boatsBuilt?2.2:1.1):s.job==='hunter'?1:1;food.sort((a,b)=>eff(b)-eff(a));const food1=food.slice(0,foodNeed),food2=food.slice(foodNeed);
  const wood=other.filter(s=>s.job==='wood'),stoneS=other.filter(s=>s.job==='quarry'),rest=other.filter(s=>s.job!=='wood'&&s.job!=='quarry');
  const needStone=buildings.some(b=>siteProj(b)&&siteProj(b).need.stone>siteProj(b).have.stone+siteProj(b).inb.stone)&&G.stone<20;
  const s1=needStone?stoneS.slice(0,1):[],s2=needStone?stoneS.slice(1):[];
  const wn=G.wood<10?2:G.wood<35?1:0;const woodMin=wood.slice(0,wn),wood2=wood.slice(wn);
  const urgentB=buildings.some(b=>b.build&&(b.type==='farm'||b.type==='camp'||b.type==='dock'||b.type==='lodge'))?bs.slice(0,1):[],bs2=urgentB.length?bs.slice(1):bs;
  if(foodLow)slots.push(...woodMin,...urgentB,...food1,...s1,...bs2,...s2,...wood2,...(needStone?[]:stoneS),...rest,...food2);
  else slots.push(...woodMin,...bs.slice(0,2),...s1,...bs.slice(2),...food1,...s2,...wood2,...(needStone?[]:stoneS),...rest,...food2);
  const pool=ad.slice();slots.length=Math.min(slots.length,pool.length);const fill=new Array(slots.length).fill(null);
  slots.forEach((s,i)=>{const j=pool.findIndex(v=>v.job===s.job&&(v.work||0)===(s.b?s.b.id:0));if(j>=0){fill[i]=pool[j];pool.splice(j,1);}});
  slots.forEach((s,i)=>{if(fill[i]||!pool.length)return;let j=pool.findIndex(v=>v.job===s.job);if(j<0)j=pool.findIndex(v=>!v.job||v.job==='forager');if(j<0)j=0;fill[i]=pool[j];pool.splice(j,1);});
  slots.forEach((s,i)=>{const v=fill[i];if(!v)return;if(v.job!==s.job){v.site=0;}v.job=s.job;v.work=s.b?s.b.id:0;});
  for(const v of pool){v.work=0;v.job=(sites&&G.food>p*4)?'builder':'forager';}
  for(const v of G.vill)if(v.age<14||v.age>64){v.job=null;v.work=0;}
}
function capOf(b){if(b.build)return 0;if(b.type==='house')return b._cap||3;if(b.type==='hall')return b.level?2:6;return 0;}
function assignHomes(){
  const homes=buildings.filter(b=>b.type==='house'||b.type==='hall');const occ=new Map(homes.map(b=>[b.id,0]));
  for(const v of G.vill){if(v.arriving||v.leaving){continue;}if(!occ.has(v.home))v.home=0;else if(occ.get(v.home)<capOf(bById(v.home))+(v.age<14?2:0))occ.set(v.home,occ.get(v.home)+1);else v.home=0;}
  const free=b=>capOf(b)-occ.get(b.id);
  const homeless=G.vill.filter(v=>!v.home&&!v.arriving&&!v.leaving).sort((a,b)=>a.age-b.age);
  for(const v of homeless){const sp=v.spouse&&G.vill.find(o=>o.id===v.spouse),par=v.parents&&G.vill.find(o=>v.parents.includes(o.id));
    let cand=null;
    for(const h of [sp&&bById(sp.home),par&&v.age<18&&bById(par.home)])if(h&&free(h)>0){cand=h;break;}
    if(!cand){let bs=-1e9;for(const h of homes){if(free(h)<=0)continue;const sc=(h.forFam===v.fam?50:0)+(h.type==='house'?10:0)+free(h)+(h.level||0);if(sc>bs){bs=sc;cand=h;}}}
    if(cand){v.home=cand.id;occ.set(cand.id,occ.get(cand.id)+1);}}
}
function bedsFree(){let f=0;for(const b of buildings){if(b.type!=='house'&&!(b.type==='hall'&&G.era===0))continue;f+=capOf(b)-G.vill.filter(v=>v.home===b.id&&v.age>=14).length;}return f;}
// ---------------- planner
function nearWaterDist(x,z,R){return nearWater(x,z,R);}
function cnt(t,v){return buildings.filter(b=>b.type===t&&(v==null||b.variant===v)).length;}
function pickNeed(sites){
  const p=popN(),houses=cnt('house'),farms=cnt('farm'),fish=cnt('camp','fish'),q=cnt('quarry'),beds=bedsFree();
  const homeless=G.vill.filter(v=>!v.home&&!v.arriving).length,building=t=>sites.some(s=>s.type===t&&s.build);
  const stoneOk=need=>q>0||G.stone>=need;
  const L=[];
  const lc=cnt('camp','lumber');if(!lc||((G.noTrees||G.wood<p*.7)&&lc<2+Math.floor(p/25)&&!building('camp')))L.push({type:'camp',variant:'lumber'});
  const lowProd=seasonN()!==3&&(G.prodY.food||0)<(G.cons||0)*1.3&&dayN()>3;
  const env=G.env||{fishPot:0,gamePot:0,farmPot:1};const foodW=Math.ceil(p/2.3)+1+(lowProd?2:0);
  const fishW=Math.round(foodW*.55*env.fishPot),huntW=Math.round(foodW*.32*env.gamePot*(1-.5*env.fishPot));
  const docks=cnt('dock'),lodges=cnt('lodge');const fishCap=fish*2+docks*(G.unl.boats?3:1),huntCap=lodges*3;
  const wantFish=fishCap<fishW&&G.center&&nearWater(G.center.x,G.center.z,40)<40,wantHunt=huntCap<huntW&&!G.noGame;
  const farmT=Math.max(1,Math.ceil(Math.max(foodW-Math.min(fishW,fishCap)-Math.min(huntW,huntCap),foodW*.2)/2))+(seasonN()===2&&G.food<p*9?1:0);const farmSites=sites.filter(s=>s.build&&s.type==='farm').length;
  if(wantFish&&!building('camp')&&!building('dock')){if(G.unl.boats&&hasBuilt('shipyard')&&docks<1+Math.floor(fish/2))L.push({type:'dock'});else L.push({type:'camp',variant:'fish'});}
  if(wantHunt&&!building('lodge')&&p>=6)L.push({type:'lodge'});
  if(farms<farmT&&G.food<p*6&&farmSites<1+Math.floor(p/45))L.push({type:'farm'});
  if((homeless>0||beds<2+Math.floor(p/8)||G.wantHouse.length)&&sites.filter(s=>s.type==='house'&&s.build).length<Math.max(1,Math.floor(p/14)))L.push({type:'house',fam:G.wantHouse[0]});
  if(farms<farmT&&farmSites<1+Math.floor(p/45))L.push({type:'farm'});
  if(p>=7&&!q)L.push({type:'quarry'});
  if((cnt('house')>=3||p>=9)&&!cnt('well')&&stoneOk(10))L.push({type:'well'});
  if(p>=14&&!cnt('smith')&&stoneOk(10))L.push({type:'smith'});
  if(p>=16&&!cnt('church')&&stoneOk(34))L.push({type:'church'});
  if(G.vill.filter(v=>v.job==='fisher').length>=4&&!cnt('fishmkt')&&G.era>=1)L.push({type:'fishmkt'});
  if(G.unl.boats&&!cnt('shipyard')&&env.fishPot>.25)L.push({type:'shipyard'});
  if(G.unl.boats&&hasBuilt('shipyard')&&!docks&&fish>0)L.push({type:'dock'});
  if(G.unl.sawmill&&p>=16&&!cnt('sawmill'))L.push({type:'sawmill'});
  if(G.unl.mason&&p>=20&&!cnt('mason'))L.push({type:'mason'});
  if(farms>=2&&p>=20&&!cnt('mill')&&stoneOk(12))L.push({type:'mill'});
  if(p>=24&&!cnt('tavern')&&stoneOk(14))L.push({type:'tavern'});
  if(p>=38&&!cnt('market')&&stoneOk(10))L.push({type:'market'});
  if(p>=45&&q<2&&!building('quarry'))L.push({type:'quarry'});
  if((G.raids>0||p>=45)&&cnt('tower')<1+Math.floor(p/45)&&!building('tower')&&stoneOk(16))L.push({type:'tower'});
  if(p>=75&&!cnt('castle')&&q>0&&G.unl.castle)L.push({type:'castle'});
  if(houses>=12&&cnt('well')<1+Math.floor(houses/12)&&!building('well')&&stoneOk(10))L.push({type:'well'});
  if(p>=60&&cnt('tavern')<2&&!building('tavern'))L.push({type:'tavern'});
  const out=[];for(const n of L){if(n.type!=='house'&&n.type!=='farm'&&sites.some(s=>s.build&&s.type===n.type&&(n.variant==null||s.variant===n.variant)))continue;if((G.failCool[n.type+(n.variant||'')]||0)>G.t)continue;out.push(n);}
  return out;
}
function markersOf(k){return G.markers.filter(m=>m.k===k);}
function evalSite(need,x,z,snap){
  const type=need.type,r=TYPE_R[type]||3;
  if(Math.abs(x)>HALF-r-1.5||Math.abs(z)>HALF-r-1.5)return null;
  for(const m of G.markers)if(m.k==='forbid'&&Math.hypot(m.x-x,m.z-z)<10+r)return null;
  if(wAt(x,z)>.06)return null;
  let mn=1e9,mx=-1e9;for(let i=0;i<17;i++){const a=i/8*TAU,rr=i===16?0:i<8?r*1.05:r*.55;const h=hAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr);if(h<mn)mn=h;if(h>mx)mx=h;
    if(i<16&&wAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr)>.15&&!['camp','dock','shipyard','fishmkt'].includes(type))return null;}
  const range=mx-mn;if(range>({house:2.6,farm:3.2,castle:9,camp:3.6,quarry:8,church:3.4,market:3.6}[type]||3.2)+((type==='quarry'||type==='castle'||type==='dock'||type==='shipyard')?0:tfExtra()))return null;
  const rec={id:-1,type,x,z,rot:snap?snap.rot:0,w:snap?snap.w:3.4,d:snap?snap.d:3.4};
  if(G.plan){if(blockedAt(type,x,z,snap?snap.rot:0,snap&&snap.w,null))return null;}
  else for(const o of buildings){const d=Math.hypot(o.x-x,o.z-z);if(snap&&o===snap.o)continue;const k=(type==='house'&&o.type==='house')?.78:.98;if(d<(r+o.r)*k)return null;}
  const c=G.center,dC=c?Math.hypot(x-c.x,z-c.z):0,p=popN(),R0=12+Math.sqrt(p)*4.2;
  const wd=nearWater(x,z,9);
  let s=-range*2.5;
  const fm=G.floodMap[cellOf(x,z)[1]*GN+cellOf(x,z)[0]];if(fm)s-=14;
  if(wd<9){const lvl=hAt(x,z);let wl=-99;for(let i=0;i<8;i++){const a=i/8*TAU;for(const rr of [wd+.5,wd+1.5]){const w=wAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr);if(w>.2)wl=Math.max(wl,hAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr)+w);}}if(wl>-99&&lvl-wl<.9)s-=8;}
  switch(type){
    case 'house':s-=dC*.55;if(snap)s+=snap.size>=5?-6:6;if(wd<8)s+=2;if(need.fam){const ph=buildings.find(b=>b.type==='house'&&G.vill.some(v=>v.home===b.id&&v.fam===need.fam));if(ph)s-=Math.hypot(ph.x-x,ph.z-z)*.9;}
      {let nh=0;for(const o of buildings)if(o.type==='house'&&Math.hypot(o.x-x,o.z-z)<9)nh++;s+=Math.min(nh,3)*1.5;}break;
    case 'farm':s-=Math.abs(dC-(R0*.75+9))*.35;if(wd<10)s+=4;s-=range*2;break;
    case 'camp':if(need.variant==='lumber'){let n=0;for(const t of trees)if(t.t!==4&&Math.abs(t.x-x)<14&&Math.abs(t.z-z)<14)n++;if(n<18)return null;s+=Math.min(n,70)*.4-dC*.2;}
      else{if(wd>5.5||wd<2)return null;s-=dC*.3;}break;
    case 'quarry':{let n=0;for(const t of trees)if(t.t===4&&Math.abs(t.x-x)<11&&Math.abs(t.z-z)<11)n++;s+=n*2.5+range*1.5-dC*.2;break;}
    case 'well':{let cx=0,cz=0,n=0;for(const o of buildings)if(o.type==='house'){cx+=o.x;cz+=o.z;n++;}if(n){s-=Math.hypot(x-cx/n,z-cz/n)*.8;}for(const o of buildings)if(o.type==='well'&&Math.hypot(o.x-x,o.z-z)<16)s-=20;break;}
    case 'church':s-=dC*.45;{const ht=analyzeLite(x,z);if(ht.hill)s+=6;}break;
    case 'castle':{const ht=analyzeLite(x,z);s+=ht.hill?22:0;s+=hAt(x,z)*.6-dC*.12;break;}
    case 'tower':s-=Math.abs(dC-(R0*.9+6))*.4+(-hAt(x,z)*.3);break;
    case 'mill':if(wd<6)s+=6;s+=hAt(x,z)*.2-dC*.3;break;
    case 'dock':case 'shipyard':{if(wd>4.5||wd<1.2)return null;let deep=0;for(let i=0;i<12;i++){const a=i/12*TAU;if(wAt(x+Math.cos(a)*10,z+Math.sin(a)*10)>1)deep++;}if(!deep)return null;s+=deep*1.5-dC*.3;break;}
    case 'fishmkt':s-=dC*.45;if(wd>12)return null;s+=(12-wd)*.6;break;
    case 'lodge':{let n=0;for(const t of trees)if(t.t!==4&&Math.abs(t.x-x)<14&&Math.abs(t.z-z)<14)n++;if(n<10)return null;let g=0;for(const a of animals)if(Math.hypot(a.x-x,a.z-z)<45)g++;s+=Math.min(n,40)*.2+g*1.2-dC*.15;break;}
    case 'sawmill':{let n=0;for(const t of trees)if(t.t!==4&&Math.abs(t.x-x)<16&&Math.abs(t.z-z)<16)n++;s+=Math.min(n,40)*.15+(wd<6?5:0)-dC*.3;break;}
    case 'factory':s-=Math.abs(dC-(R0*.8+4))*.3;if(wd<12)s+=3;break;
    case 'station':s-=Math.abs(dC-(R0*.6+6))*.3;break;
    case 'powerplant':case 'fusion':if(wd<9)s+=5;s-=Math.abs(dC-(R0+8))*.25;break;
    case 'mason':{const qq=buildings.find(b=>b.type==='quarry');if(qq)s-=Math.hypot(qq.x-x,qq.z-z)*.3;s-=dC*.25;break;}
    default:s-=dC*.5;
  }
  if(snap&&snap.front)s+=7;if(snap&&snap.plot)s+=4;
  if(sampleArr(ROAD,x,z)>.2||sampleArr(ROAD,x+3,z)>.3||sampleArr(ROAD,x-3,z)>.3||sampleArr(ROAD,x,z+3)>.3||sampleArr(ROAD,x,z-3)>.3)s+=3;
  const mk={house:'settle',farm:'farm',church:'worship'}[type];
  if(mk)for(const m of markersOf(mk)){const d=Math.hypot(m.x-x,m.z-z);if(d<16)s+=30-d;}
  if(type!=='house'&&type!=='church')for(const m of markersOf('settle')){const d=Math.hypot(m.x-x,m.z-z);if(d<6)s-=6;}
  return s;
}
function analyzeLite(x,z){const h=hAt(x,z);let mx=-1e9;for(let i=0;i<12;i++){const a=i/12*TAU;mx=Math.max(mx,hAt(x+Math.sin(a)*10,z+Math.cos(a)*10));}return {hill:h>mx-.3&&h>6};}
function findSite(need){
  const c=G.center;if(!c)return null;const p=popN(),R0=12+Math.sqrt(p)*4.2,type=need.type;
  const cands=[];
  for(let i=0;i<120;i++){let x,z;
    const mk={house:'settle',farm:'farm',church:'worship'}[type],ms=mk?markersOf(mk):[];
    if(ms.length&&rnd()<.45){const m=pickA(ms);x=m.x+(rnd()-.5)*16;z=m.z+(rnd()-.5)*16;}
    else if(type==='camp'&&need.variant==='lumber'){const t=pickA(trees);if(!t)continue;x=t.x+(rnd()-.5)*6;z=t.z+(rnd()-.5)*6;if(Math.hypot(x-c.x,z-c.z)>R0+34)continue;}
    else if((type==='dock'||type==='shipyard'||type==='fishmkt')&&rnd()<.8){let tx=0,tz=0,ok=false;for(let t=0;t<20&&!ok;t++){const a=rnd()*TAU,d=rnd()*(R0+30);tx=c.x+Math.cos(a)*d;tz=c.z+Math.sin(a)*d;const w=nearWater(tx,tz,6);ok=w>=1.5&&w<=4.5;}x=tx;z=tz;}
    else if(type==='quarry'&&rnd()<.7){const rocks=trees.filter(t=>t.t===4&&Math.hypot(t.x-c.x,t.z-c.z)<50);if(!rocks.length)continue;const t=pickA(rocks);x=t.x+(rnd()-.5)*8;z=t.z+(rnd()-.5)*8;}
    else{const a=rnd()*TAU;const d=type==='farm'?R0*.5+rnd()*(R0+16):type==='castle'?rnd()*(R0+34):type==='tower'?R0*.7+rnd()*16:type==='camp'?rnd()*(R0+28):type==='quarry'?rnd()*48:(type==='factory'||type==='station'||type==='powerplant'||type==='fusion')?R0*.5+rnd()*(R0+26):Math.sqrt(rnd())*(R0+4);x=c.x+Math.cos(a)*d;z=c.z+Math.sin(a)*d;}
    cands.push([x,z,null]);}
  if(G.plan){const P=G.plan;
    if(type==='house'){const ps=P.plots.map(p=>{let nb=0;for(const o of buildings)if(o.type==='house'&&Math.abs(o.x-p.x)<6&&Math.abs(o.z-p.z)<6)nb++;return [p,p.d-nb*4+rnd()*6];}).sort((a,b)=>a[1]-b[1]);
      const orig=cands.slice();let n=0;cands.length=0;for(const [p] of ps){if(n>=36)break;if(blockedAt('house',p.x,p.z,p.rot,p.w,null))continue;cands.push([p.x,p.z,{rot:p.rot,w:p.w,d:+(3.2+rnd()*.5).toFixed(1),plot:p}]);n++;}
      if(n<5)for(const c of orig)cands.push([c[0],c[1],{rot:faceStreetRot(c[0],c[1],rnd()*TAU),w:+(3.3+rnd()*.8).toFixed(1),d:3.4}]);}
    else if(['church','market','tavern','smith','well','mason','sawmill','mill','fishmkt','farm','school'].includes(type)){
      const fr=type==='farm'?[]:frontageCands(type,R0+30);
      if(type==='farm'){for(const s of P.streets)for(let i=2;i<s.pts.length-1;i+=3){const [x0,z0]=s.pts[i],[x1,z1]=s.pts[i+1];const tl=Math.hypot(x1-x0,z1-z0)||1;const ux=(x1-x0)/tl,uz=(z1-z0)/tl;
          for(const sd of [1,-1]){const nx=-uz*sd,nz=ux*sd;for(const off of [s.hw+.7+4.1,s.hw+15.5])fr.push([x0+nx*off,z0+nz*off,Math.atan2(-nx,-nz)]);}}}
      if(type==='well'||type==='market'){const pl=P.plaza;for(let k=0;k<8;k++){const a=k/8*TAU,rr=type==='market'?0:2.6;fr.push([pl.x+Math.sin(a)*rr,pl.z+Math.cos(a)*rr,Math.atan2(G.center.x-pl.x,G.center.z-pl.z)+PI]);}}
      for(let i=fr.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[fr[i],fr[j]]=[fr[j],fr[i]];}
      const keep=cands.slice(0,60);cands.length=0;
      for(const [x,z,rot] of fr.slice(0,160))cands.push([x,z,{rot,front:1}]);for(const c of keep)cands.push([c[0],c[1],c[2]||{rot:faceStreetRot(c[0],c[1],rnd()*TAU)}]);}
    else{for(const c of cands)if(!c[2])c[2]={rot:faceStreetRot(c[0],c[1],rnd()*TAU)};}}
  if(type==='house'&&G.era>=1&&!G.plan){for(const o of buildings){if(o.type!=='house')continue;const w=Math.round((3.1+rnd()*.9)*10)/10;
    for(const side of [-1,1]){const off=(o.w+w)/2*side,cs=Math.cos(o.rot),sn=Math.sin(o.rot);cands.push([o.x+off*cs,o.z-off*sn,{o,rot:o.rot,w,d:o.d,size:rowSize(o)}]);}}}
  const ok=[];for(const [x,z,snap] of cands){const s=evalSite(need,x,z,snap);if(s==null)continue;ok.push({x,z,snap,s});}
  if(!ok.length&&G.plan&&['market','tavern','church','mill','smith','mason','sawmill','school','well'].includes(type)){// frontage is full: build on the edge of town instead
    for(let i=0;i<160;i++){const a=rnd()*TAU,d=R0*.3+rnd()*(R0+28),x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,snap={rot:faceStreetRot(x,z,rnd()*TAU)};const s=evalSite(need,x,z,snap);if(s!=null)ok.push({x,z,snap,s});}}
  ok.sort((a,b)=>b.s-a.s);const [cx,cz]=doorOf(c);
  for(const o of ok.slice(0,6)){const p=findPath(cx,cz,o.x,o.z,0,c.id);if(p){const last=p[p.length-2]||p[0];if(!last||Math.hypot(last[0]-o.x,last[1]-o.z)<TYPE_R[type]+4)return o;}}
  return null;
}
function planTick(){
  if(!G.center||(G.center.build&&G.center.level===0&&!G.firstHut))return;
  if(G.plan)for(const m of markersOf('settle'))if(!m.ext){m.ext=1;extendPlanToward(m.x,m.z);}
  const sites=buildings.filter(siteProj),p=popN();
  const maxS=p<10?1:p<25?2:p<60?3:p<100?4:5;const nonHouse=sites.filter(s=>s.type!=='house').length;
  let needs=pickNeed(sites);if(nonHouse>=maxS)needs=needs.filter(n=>n.type==='house');if(!needs.length)return;let need=null,spot=null;
  for(const n of needs.slice(0,4)){const s=findSite(n);if(s){need=n;spot=s;break;}
    G.failCool[n.type+(n.variant||'')]=G.t+20;if(['house','farm','church','quarry','well'].includes(n.type)&&(!G.siteFail||G.siteFail.type!==n.type))G.siteFail={type:n.type,since:G.t};}
  if(!spot)return;
  if(G.siteFail&&G.siteFail.type===need.type)G.siteFail=null;
  const rec={id:-1,type:need.type,x:spot.x,z:spot.z,rot:0};let rot=spot.snap?spot.snap.rot:autoRot(Object.assign(newRecord(need.type,spot.x,spot.z,0,1),{id:-1}));
  const o={variant:need.variant};if(spot.snap){o.w=spot.snap.w;o.d=spot.snap.d;}
  if(need.type==='house'){if(need.fam){o.forFam=need.fam;G.wantHouse.shift();}o.level=G.era>=7?6:G.era>=6?5:G.era>=5?4:G.era>=2?1:0;}
  startSite(need.type,spot.x,spot.z,rot,o);
}
function stuckCheck(){for(const b of buildings.slice()){const P=b.build||b.upg;if(!P||b===G.center)continue;if(!b.build){if(P.inb.wood<0)P.inb.wood=0;if(P.inb.stone<0)P.inb.stone=0;const pr=P.done+P.have.wood+P.have.stone;if(P._last===pr)P._idle=(P._idle||0)+1;else{P._idle=0;P._last=pr;}if(P._idle===10){P.inb.wood=0;P.inb.stone=0;}continue;}
  const prog=P.done+P.have.wood+P.have.stone;if(P._last===prog){P._idle=(P._idle||0)+1;}else{P._idle=0;P._last=prog;}
  // materials 'in transit' leak when a hauler is reassigned or dies: forget stale reservations so the site gets restocked
  if(P.inb.wood<0)P.inb.wood=0;if(P.inb.stone<0)P.inb.stone=0;if(P._idle===10){P.inb.wood=0;P.inb.stone=0;}
  if(P._idle>=(b.type==='castle'||b.type==='powerplant'||b.type==='fusion'?96:48)&&G.wood>=P.need.wood-P.have.wood-P.inb.wood&&G.stone>=P.need.stone-P.have.stone-P.inb.stone){G.wood+=P.have.wood+P.inb.wood;G.stone+=P.have.stone+P.inb.stone;
    G.failCool[b.type+(b.variant||'')]=G.t+48;chron(`The folk gave up on the ${siteName(b)} — they could not work there.`);for(const v of G.vill)if(v.site===b.id)v.site=0;removeBuilding(b);gridDirty=true;}}}
function upgradeTick(){
  const p=popN();const ups=buildings.filter(b=>b.upg).length;
  if(G.center&&!G.center.build&&!G.center.upg){const want=G.era>=7?5:G.era>=6?4:G.era>=5?3:G.era>=3?2:G.era>=1?1:0;if((G.center.level||0)<want){startUpgrade(G.center,(G.center.level||0)+1);return;}}
  if(ups>=1+Math.floor(p/30)||G.hap<42)return;
  const maxL=[0,1,2,3,3,4,5,6][G.era];
  const cand=buildings.filter(b=>b.type==='house'&&!b.build&&!b.upg&&(b.level||0)<maxL&&G.vill.some(v=>v.home===b.id));
  if(!cand.length)return;cand.sort((a,b)=>(a.level||0)-(b.level||0)||(b.blessedUp?1:0)-(a.blessedUp?1:0));
  const b=cand[0];const [w,s]=costOf('house',null,(b.level||0)+1);if(G.wood<w*.5||(s>0&&G.stone<s*.4&&!cnt('quarry')))return;startUpgrade(b,(b.level||0)+1);
}
// ---------------- era
const ERA_REQ=[null,
  {txt:'10 folk, 3 homes',ok:()=>popN()>=10&&cnt('house')>=3},
  {txt:'24 folk, a well and a chapel',ok:()=>popN()>=24&&hasBuilt('well')&&hasBuilt('church')},
  {txt:'60 folk, a market and a tavern',ok:()=>popN()>=60&&hasBuilt('market')&&hasBuilt('tavern')},
  {txt:'120 folk, a castle and a tower (needs Fortification)',ok:()=>popN()>=120&&hasBuilt('castle')&&hasBuilt('tower')}];
function checkEra(){const nx=ERA_REQ[G.era+1];if(!nx||!nx.ok())return;G.era++;
  const e=ERAS[G.era];chron(`${G.town} entered ${e.intro}. The Spirit's power deepened.`,true);
  showBanner(e.name,`${G.town} has entered ${e.intro}`);startFestival(10,'era');G.faith=Math.min(faithCap(),G.faith+50);
  if(MODE==='god')buildToolbox(godToolDefs());sfx('bell');}
const faithCap=()=>TOWNS.list.length<2?ERAS[G.era].cap:Math.max(...TOWNS.list.map((s,i)=>ERAS[sGet(i,'era')||0].cap));
// ---------------- happiness / faith
function computeHap(){
  const p=Math.max(1,popN()),f={};const vs=G.vill.filter(v=>!v.arriving&&!v.leaving);
  f.Food=G.food<=.5?-30:G.food<p*1.5?-8:G.food>p*8?7:3;
  const homeless=vs.filter(v=>!v.home).length,tents=vs.filter(v=>{const h=bById(v.home);return h&&h.type==='hall'&&!h.level;}).length;
  f.Housing=Math.round(-(homeless/p)*30-(tents/p)*(G.era>=1?12:2));
  if(p>=10){const homes=buildings.filter(b=>b.type==='house'&&!b.build);if(homes.length){let ok=0;for(const h of homes){if(buildings.some(o=>o.type==='well'&&!o.build&&Math.hypot(o.x-h.x,o.z-h.z)<22)||nearWater(h.x,h.z,10)<10)ok++;}f.Water=Math.round(clamp((ok/homes.length-.6)*25,-12,8));}}
  const staffed=t=>buildings.some(b=>b.type===t&&!b.build&&G.vill.some(v=>v.work===b.id));
  if(p>=16)f.Worship=staffed('church')?10:-8;if(p>=26)f.Ale=staffed('tavern')?6:-6;if(p>=40)f.Trade=staffed('market')?6:-6;
  f.Safety=G.raid&&G.raid.active?-15:(hasBuilt('tower')||hasBuilt('castle'))?3:0;
  const hs=buildings.filter(b=>b.type==='house'&&!b.build);if(hs.length)f.Homes=Math.round(hs.reduce((a,b)=>a+(b.level||0),0)/hs.length*3);
  f.Season=[3,2,0,-5][seasonN()];
  f.Events=Math.round(G.joy-G.grief*2-G.sad);
  const sick=vs.filter(v=>v.sick).length;if(sick)f.Sickness=-Math.min(15,sick*2);
  if(p>40)f.Crowding=-Math.min(14,Math.round((p-40)/11));
  if(typeof devHapF==='function')devHapF(f);if(typeof eraHapF==='function')eraHapF(f);if(typeof openingHapF==='function')openingHapF(f);
  G.hapF=f;let s=50;for(const k in f)s+=f[k];G.hapT=clamp(s,0,100);
}
// ---------------- prayers
const PRAYERS={
  settle:{t:'Where shall we build our homes? Plant a Settle banner to show us.',how:'Use “Settle here”.',when:()=>G.firstHut===false&&dayN()>=0&&G.center&&!G.center.build&&!markersOf('settle').length,ok:()=>markersOf('settle').length>0,r:15,d:3},
  water:{t:'We thirst! Grant us fresh water near our homes.',how:'Pour water or open a Spring near the town.',when:()=>popN()>=4&&G.center&&nearWater(G.center.x,G.center.z,14)>=14&&!hasBuilt('well'),ok:()=>(G.center&&nearWater(G.center.x,G.center.z,14)<14)||hasBuilt('well'),r:40,d:4},
  food:{t:'Our stores are almost empty. Help us feed the children!',how:'Bless the harvest, or shape flat fields near water.',when:()=>popN()>=5&&G.food<popN()*1.5,ok:()=>G.food>=popN()*4,r:30,d:4},
  rain:{t:'The fields wither in the drought. Send us rain!',how:'Cast Rain.',when:()=>G.drought,ok:()=>G.rain>0||!G.drought,r:35,d:3,urgent:1},
  harvest:{t:'Bless our harvest, Spirit of the valley.',how:'Cast Bountiful Harvest.',when:()=>seasonN()===1&&dayInSeason()>=2&&G.harvest<=0&&cnt('farm')>=1,ok:()=>G.harvest>0,r:25,d:4},
  trees:{t:'The woods are bare. Let the forest grow again!',how:'Grow forest near the town.',when:()=>G.noTrees||(G.center&&!G.center.build&&trees.filter(t=>t.t!==4&&t.t!==5&&Math.hypot(t.x-G.center.x,t.z-G.center.z)<60).length<15),ok:()=>{const l=built('camp').find(b=>b.variant==='lumber')||G.center;return l&&trees.filter(t=>t.t!==4&&t.t!==5&&Math.hypot(t.x-l.x,t.z-l.z)<40).length>=25;},r:35,d:5},
  land:{t:'We can find no good land for a new {X}.',how:'Flatten dry ground near town, or plant a banner.',when:()=>G.siteFail&&G.t-G.siteFail.since>10,ok:()=>!G.siteFail,r:30,d:5},
  worship:{t:'Show us where to raise a house of worship.',how:'Plant a “Worship here” banner.',when:()=>popN()>=15&&!cnt('church')&&G.era>=1&&!markersOf('worship').length,ok:()=>markersOf('worship').length>0||cnt('church')>0,r:20,d:6},
  fire:{t:'Fire! The {X} is burning!',how:'Cast Rain or pour water on it.',when:()=>buildings.some(b=>b.fire),ok:()=>!buildings.some(b=>b.fire),r:20,d:1,urgent:1},
  flood:{t:'The waters rise into our homes!',how:'Drain the water or raise the ground.',when:()=>G.flooded>0,ok:()=>G.flooded===0,r:30,d:3,urgent:1},
  protect:{t:'Raiders are coming! Protect us, Spirit!',how:'Smite them, wall them off with cliffs or water.',when:()=>G.raid&&!G.raid.over,ok:()=>G.raid&&G.raid.over&&G.raid.losses<=1,r:60,d:4,urgent:1},
  game:{t:'The game has fled the woods. Our hunters return empty-handed.',how:'Release a herd, or grow forest near the lodge.',when:()=>G.noGame&&cnt('lodge')>0,ok:()=>!G.noGame,r:30,d:5},
  fished:{t:'The waters are fished out. Our nets come up empty.',how:'Widen the lake with water, or wait for the fish to return.',when:()=>(G.fish||1)<.3,ok:()=>(G.fish||1)>.55,r:30,d:6},
  heal:{t:'A sickness spreads among us. Heal us!',how:'Cast Heal.',when:()=>G.vill.some(v=>v.sick),ok:()=>!G.vill.some(v=>v.sick),r:40,d:3,urgent:1},
};
function prayerTick(){
  for(const pr of G.prayers.slice()){const D=PRAYERS[pr.k];
    if(D.ok()){G.prayers.splice(G.prayers.indexOf(pr),1);devPrayer(true);G.faith=Math.min(faithCap(),G.faith+D.r);G.joy=Math.min(20,G.joy+4);chron(`The Spirit answered the prayer: “${pr.txt}” (+${D.r} faith)`);toast(`Prayer answered! +${D.r} faith`);sfx('chime');continue;}
    if(G.t>pr.until){G.prayers.splice(G.prayers.indexOf(pr),1);devPrayer(false);G.sad=Math.min(20,G.sad+5);chron(`A prayer went unanswered: “${pr.txt}”`);G.prayerCool[pr.k]=G.t+36;}}
  if(G.prayers.length>=3)return;
  for(const k in PRAYERS){if(G.prayers.some(p=>p.k===k))continue;if((G.prayerCool[k]||0)>G.t)continue;const D=PRAYERS[k];
    if(D.when()){let x='';if(k==='fire'){const b=buildings.find(o=>o.fire);x=b&&b.info?b.info.name:'house';}if(k==='land')x=G.siteFail?siteName({type:G.siteFail.type,variant:null,r:3}):'building';if(D.x)x=D.x();
      const txt=D.t.replace('{X}',x);G.prayers.push({k,txt,until:G.t+D.d*24,urgent:!!D.urgent});G.prayerCool[k]=G.t+12;if(D.urgent)sfx('alarm');if(G.prayers.length>=3)break;}}
}
// ---------------- daily & hourly
function newDay(){if(G.menu)return;
  const d=dayN(),s=seasonN(),dis=dayInSeason(),p=popN();
  // season start
  if(dis===1){
    if(SHARED&&s===0){G.snowmelt=2;chron('Spring came; snowmelt swelled the springs.');if(yearN()>=2&&rnd()<.3){G.rain=30;G.rainI=2.2;chron('Heavy spring rains lashed the valley.',true);}}
    if(SHARED&&s===1&&rnd()<(yearN()>=2?.32:.18)){G.drought=true;chron('A hot, dry summer began. The ponds are shrinking.',true);}
    if(SHARED&&s===2){G.drought=false;}
    if(SHARED&&s===3){G.drought=false;chron('Winter settled over '+G.town+'. The water froze at the edges.');}
    if(G.era>=2&&d>=G.raidCool&&!G.raid&&rnd()<(G.raids?.4:.55)){scheduleRaid();}
    if(G.era>=3&&d>=G.plagueCool&&rnd()<.12){startPlague();}
  }
  if(SHARED&&G.snowmelt>0)G.snowmelt--;
  G.noTrees=false;if(SHARED){growForest();breedAnimals();}if(G.center)G.env=envScan(G.center.x,G.center.z,70);G.fish=Math.min(1,(G.fish||1)+.07);if(G.noGame&&animals.filter(a=>G.center&&Math.hypot(a.x-G.center.x,a.z-G.center.z)<80).length>6)G.noGame=false;
  const mills=built('mill');for(const f of buildings)if(f.type==='farm')f._mill=mills.some(m=>Math.hypot(m.x-f.x,m.z-f.z)<26);
  // aging, deaths
  for(const v of G.vill.slice()){if(v.arriving||v.leaving)continue;v.age+=.2;
    if(v.age>=14&&v.age<14.2){chron(`${fullName(v)} came of age.`);}
    if(v.age>66&&rnd()<(v.age-66)*.012){chron(`${fullName(v)} died peacefully, aged ${Math.floor(v.age)}.`);removeVillager(v,'died');continue;}
    if(G.starve>=2&&rnd()<.03){chron(`${fullName(v)} starved.`,true);removeVillager(v,'died');continue;}
    if(v.sick){if(rnd()<.18){v.sick=0;}else if(rnd()<(v.age<10||v.age>55?.09:.04)){chron(`${fullName(v)} died of the sickness.`,true);removeVillager(v,'died');continue;}}}
  // marriages
  const single=G.vill.filter(v=>v.age>=18&&v.age<46&&!v.spouse&&!v.arriving&&!v.leaving&&!v.sick);
  const men=single.filter(v=>!v.female),wom=single.filter(v=>v.female);
  for(let i=0;i<Math.min(men.length,wom.length,1+Math.floor(p/25));i++){if(rnd()>.22)continue;const m=men[i],w=wom[i];if(m.fam===w.fam&&rnd()<.8)continue;
    m.spouse=w.id;w.spouse=m.id;w.fam=m.fam;chron(`${m.name} and ${w.name} were wed. Now the ${m.fam}s.`);G.joy=Math.min(20,G.joy+2);
    const mh=bById(m.home),wh=bById(w.home);
    if(mh&&mh.type==='house'&&capOf(mh)-G.vill.filter(v=>v.home===mh.id&&v.age>=14).length>0){w.home=mh.id;}
    else if(G.wantHouse.length<4)G.wantHouse.push(m.fam);}
  // births
  for(const w of G.vill.filter(v=>v.female&&v.spouse&&v.age>=18&&v.age<42&&v.home&&!v.sick)){
    if(G.food<p*2||G.hap<40||rnd()>.04)continue;const h=bById(w.home);const occ=G.vill.filter(v=>v.home===w.home).length;if(h&&occ>capOf(h)+1)continue;
    const c=newVillager({age:0,fam:w.fam,home:w.home,parents:[w.id,w.spouse],x:w.x,z:w.z,hidden:true});c.timer=.1;G.births++;
    chron(`A child, ${c.name}, was born to the ${w.fam} family.`,G.births===1);G.joy=Math.min(20,G.joy+1.5);}
  // immigration
  const beds=bedsFree();
  if(G.center&&!G.center.build&&G.hap>=45&&beds>=2&&G.food>p*2&&rnd()<.25+(G.hap-45)/80){const n=Math.min(beds,2+Math.floor(rnd()*(1.5+G.era*.6)),5);arriveFamily(n);}
  else if(G.center&&!G.center.build&&p<6&&beds>=2&&rnd()<.5)arriveFamily(2);
  // leaving
  if(G.hap<28){G.lowDays=(G.lowDays||0)+1;if(G.lowDays>=2&&p>4&&rnd()<.45){const fam=pickA(G.vill.filter(v=>!v.leaving&&!v.arriving)).fam;const leav=G.vill.filter(v=>v.fam===fam&&!v.arriving);
      const [ex,ez]=edgePoint(rnd()*TAU);for(const v of leav){v.leaving=true;v.lx=ex;v.lz=ez;v.home=0;v.job=null;v.work=0;}chron(`The ${fam} family lost faith and left ${G.town}.`,true);}}
  else G.lowDays=0;
  // food spoilage & lake houses
  if(G.food>p*18)G.food*=hasBuilt('market')?.99:.975;
  {let burn=0;for(const b of buildings)if((b.type==='house'||b.type==='hall'||b.type==='tavern')&&!b.build)burn+=(s===3?.8:.2)*(b.type==='house'?1:2);G.wood=Math.max(0,G.wood-burn);}
  if(G.wood>320)G.wood*=.97;if(G.stone>400)G.stone*=.98;
  for(const b of buildings)if(b.type==='house'&&!b.build&&b.info&&/Lake|Stilt|Waterfront/.test(b.info.name)){const n=G.vill.filter(v=>v.home===b.id&&v.age>=14).length;G.food+=n*.5;G.prod.food+=n*.5;}
  // roads fade
  for(let k=0;k<V;k++){const r=ROAD[k];if(r>0&&r<.4)ROAD[k]=r<.01?0:r*.9;}
  // fire risk
  if(seasonN()!==3)for(const b of buildings){if(b.build||b.fire)continue;const fl=flam(b);if(fl<=0)continue;if(rnd()<.0028*fl*(seasonN()===1?1.6:1)*(G.drought?2.4:1))ignite(b,'A cooking fire got out of hand at the '+(b.info?b.info.name:'house')+'.');}
  // harvest festival
  if(s===2&&dis===DPS){if(G.food>=p*5&&G.t-G.lastFest>40){startFestival(12,'harvest');chron(`The harvest was gathered. ${G.town} held a Harvest Festival!`,true);}else chron('A lean harvest. There was no festival this year.');}
  G.prodY={...G.prod};G.prod={food:0,wood:0,stone:0};
  G.joy*=.75;G.grief*=.7;G.sad*=.8;
  assignHomes();assignJobs();checkEra();devDaily();tfDaily();eraDaily();netDaily();waterDaily();nbDaily();tradeDaily();if(seasonN()===3||dis===1)buildToolbox(godToolDefs());
}
function edgePoint(a){const x=Math.cos(a),z=Math.sin(a),m=Math.max(Math.abs(x),Math.abs(z));let px=x/m*(HALF-1.5),pz=z/m*(HALF-1.5);
  for(let i=0;i<24&&wAt(px,pz)>.3;i++){a+=.15;const x2=Math.cos(a),z2=Math.sin(a),m2=Math.max(Math.abs(x2),Math.abs(z2));px=x2/m2*(HALF-1.5);pz=z2/m2*(HALF-1.5);}return [px,pz];}
function arriveFamily(n){const c=G.center;const a=Math.atan2(c.z,c.x)+(rnd()-.5)*1.6;let [ex,ez]=edgePoint(a+(Math.abs(c.x)+Math.abs(c.z)<20?rnd()*TAU:0));{const dx=ex-c.x,dz=ez-c.z,d=Math.hypot(dx,dz);if(d>55){const tx=c.x+dx/d*55,tz=c.z+dz/d*55;if(wAt(tx,tz)<.1){ex=tx;ez=tz;}}}const fam=pickA(FAM);
  for(let i=0;i<n;i++){const v=newVillager({fam,x:ex+(rnd()-.5)*2,z:ez+(rnd()-.5)*2,arriving:true,age:i>=2?3+Math.floor(rnd()*10):18+Math.floor(rnd()*20),female:i===1?true:i===0?false:undefined});
    if(i===1)v.spouse=G.vill[G.vill.length-2].id,G.vill[G.vill.length-2].spouse=v.id;
    if(i>=2)v.parents=[G.vill[G.vill.length-1-i+0].id];
    const [dx,dz]=doorOf(c);v.timer=0;v.path=null;goTo(v,dx+(rnd()-.5)*3,dz+(rnd()-.5)*3,vv=>{vv.arriving=false;assignHomes();assignJobs();});setThought(v,'A new life awaits!');}
  G.arrivals+=n;chron(`The ${fam} family (${n}) arrived, seeking a new life in ${G.town}.`);}
function flam(b){if(['castle','well','quarry','market','powerplant','fusion','school','station'].includes(b.type))return b.type==='school'||b.type==='station'?.05:0;if(b.type==='factory')return .12;if(b.type==='house')return [1,.75,.4,.18,.06,.02,.01][b.level||0];if(b.type==='hall')return b.level?.1:.35;if(b.type==='camp')return .6;if(b.type==='farm')return seasonN()===1?.22:.05;if(b.type==='church'||b.type==='tower')return .1;return .35;}
function ignite(b,why){if(b.fire||flam(b)<=0)return;b.fire={t:0};realize(b);if(why)chron(why,true);griefAdd(1);sfx('alarm');}
function hourTick(){
  if(G.menu){G.food=Math.max(G.food,500);G.wood=Math.max(G.wood,200);G.stone=Math.max(G.stone,150);G.hap=72;const hh=Math.floor(hod());if(hh===5||hh===12)assignJobs();if(hh%3===0)upgradeTick&&0;return;}
  const p=popN(),wint=seasonN()===3;
  const eat=G.vill.reduce((a,v)=>a+(v.arriving||v.leaving?0:v.age<14?.6:1),0)/24*(wint?1.1:1);G.food-=eat;G.cons=eat*24;
  if(G.food<0){G.food=0;G.starveH=(G.starveH||0)+1;G.starve=Math.floor(G.starveH/24);}else{G.starveH=0;G.starve=0;}
  computeHap();G.hap+=(G.hapT-G.hap)*.08;
  const ch=buildings.some(b=>b.type==='church'&&!b.build&&G.vill.some(v=>v.work===b.id));
  G.faith=Math.min(faithCap(),G.faith+p*(.012+.05*G.hap/100)+.7+(ch?p*.015:0));
  if(isSunday()&&Math.floor(hod())===11&&ch){const att=G.vill.filter(v=>v.inside&&bById(v.inside)&&bById(v.inside).type==='church').length;G.faith=Math.min(faithCap(),G.faith+att*.6+3);if(att>3)sfx('bell');}
  if(SHARED){weatherHour();
  // weather
  const sm=(G.snowmelt>0?2.2:1)*(G.rain>0?1.6:1)*(G.drought?.4:1)*(wint?.5:1);for(const s of springs){if(s.base==null)s.base=s.rate;s.rate=s.base*sm;}
  if(G.rain>0){G.rain--;const add=.0045*G.rainI;for(let k=0;k<V;k++)if(W[k]>.05)W[k]+=add;if(G.drought){G.drought=false;chron('Rain broke the drought.');}if(G.rain<=0)G.rainI=1;}
  if(G.drought){for(let k=0;k<V;k++)if(W[k]>0)W[k]=Math.max(0,W[k]-.0035);}}
  if(G.harvest>0)G.harvest--;if(G.festival>0){G.festival--;if(G.festival<=0)endFestival();}
  // fires
  for(const b of buildings.slice()){if(!b.fire)continue;b.fire.t+=1;
    const water=buildings.some(o=>o.type==='well'&&!o.build&&Math.hypot(o.x-b.x,o.z-b.z)<24)||nearWater(b.x,b.z,12)<12;
    if((G.rain>0&&rnd()<.6)||(water&&p>=3&&rnd()<.24)||wAt(b.x,b.z)>.15){b.fire=null;chron(`The fire at the ${b.info?b.info.name:'building'} was put out${G.rain>0?' by the rain':water?' by a bucket chain':''}.`);realize(b);continue;}
    for(const o of buildings){if(o===b||o.fire||o.build)continue;if(Math.hypot(o.x-b.x,o.z-b.z)<b.r+o.r+2.5&&rnd()<.14*flam(o))ignite(o,`The flames spread to the ${o.info?o.info.name:'house'}!`);}
    if(b.fire&&b.fire.t>=5){destroyBuilding(b,`The ${b.info?b.info.name:'building'} burned to the ground.`);}}
  // floods
  let fl=0;for(const b of buildings.slice()){if(b.build||!b.info)continue;const immune=/Lake|Stilt|Waterfront|Watermill|Lighthouse|Fishing|Water-Forge/.test(b.info.name)||b.type==='farm'&&false;
    if(!immune&&wAt(b.x,b.z)>.3){b.flooded=(b.flooded||0)+1;fl++;const [ci,cj]=cellOf(b.x,b.z);G.floodMap[cj*GN+ci]=1;
      if(b.flooded===1)chron(`Floodwater poured into the ${b.info.name}.`,true);if(b.flooded>=30)destroyBuilding(b,`The flooded ${b.info.name} collapsed.`);}else b.flooded=0;}
  G.flooded=fl;if(fl)G.grief=Math.min(15,G.grief+.15);
  // raid timing
  if(G.raid&&!G.raid.active&&!G.raid.over&&G.t>=G.raid.at)beginRaid();
  if(G.raid&&G.raid.active){G.raid.h++;if(G.raid.h>30)for(const b of G.bandits)b.flee=true;if(!G.bandits.length)endRaid();}
  if(G.raid&&G.raid.over&&G.t>G.raid.at+60)G.raid=null;
  // plague spread
  for(const v of G.vill)if(v.sick)for(const o of G.vill)if(!o.sick&&o.home===v.home&&rnd()<.012)o.sick=1;
  prayerTick();devHourly();
  const h=Math.floor(hod());
  if(h>=6&&h<=18&&h%2===0)planTick();
  if(h%6===1){upgradeTick();modernizeTick();}if(h%3===0)stuckCheck();
  if(h===5||h===12)assignJobs();
  if(G.center&&!G.center.build){const st=G.center.stock||{},sig=[Math.ceil(G.wood/8),Math.ceil(G.stone/8),Math.ceil(G.food/14)].map(x=>Math.min(x,14)).join();if(sig!==G.center._stockSig){G.center._stockSig=sig;G.center.stock={wood:G.wood,stone:G.stone,food:G.food};if(!G.center.upg&&!G.center.fire)realize(G.center);}}
}
// ---------------- raids
function scheduleRaid(){const a=rnd()*TAU;const p=popN();G.raid={at:G.t+14+rnd()*30,a,size:Math.min(14,3+Math.floor(p/12)+G.raids),active:false,over:false,h:0,losses:0,stolen:0};
  const dir=['east','south-east','south','south-west','west','north-west','north','north-east'][Math.round(((a/TAU*8)%8+8)%8)%8];G.raid.dir=dir;
  chron(`Scouts saw raiders gathering beyond the ${dir}ern hills.`,true);}
function beginRaid(){const R=G.raid;R.active=true;const [ex,ez]=edgePoint(R.a);
  for(let i=0;i<R.size;i++){G.bandits.push({id:G.nextV++,kind:'bandit',name:'Raider',x:ex+(rnd()-.5)*4,z:ez+(rnd()-.5)*4,rot:0,hp:3,path:null,pi:0,timer:rnd()*.5,anim:'idle',hits:0,age:30,skin:pickA(SKIN),loot:0});}
  chron(`${R.size} raiders stormed into ${G.town} from the ${R.dir}!`,true);showBanner('Raiders!',`They come from the ${R.dir}`);sfx('alarm');sfx('bell');
  for(const v of G.vill){if(v.job!=='guard'&&!v.hidden){v.path=null;v.timer=0;}}}
function thinkBandit(v){
  if(v.flee){const [ex,ez]=edgePoint(G.raid?G.raid.a:0);goTo(v,ex,ez,vv=>{G.bandits.splice(G.bandits.indexOf(vv),1);});return;}
  const alive=G.bandits.filter(b=>!b.flee).length;if(G.raid&&alive<=Math.ceil(G.raid.size/2)){for(const b of G.bandits)b.flee=true;chron('The raiders lost heart and fled!',true);return thinkBandit(v);}
  if(v.hits>=2){v.flee=true;return thinkBandit(v);}
  let tb=null,bd=1e9;for(const b of buildings){if(b.fire||b.type==='castle'||b.type==='well')continue;const d=Math.hypot(b.x-v.x,b.z-v.z)+(b.build?20:0);if(d<bd){bd=d;tb=b;}}
  if(!tb){v.flee=true;return;}
  const [x,z]=doorOf(tb);goTo(v,x,z,vv=>{wait(vv,.6,'fight',false,ww=>{if(!buildings.includes(tb))return;ww.hits++;
    const st=Math.min(G.food,6+rnd()*6),sw=Math.min(G.wood,4);G.food-=st;G.wood-=sw;ww.loot+=st+sw;G.raid&&(G.raid.stolen+=st+sw);ww.carry='loot';
    if(rnd()<.55)ignite(tb,`Raiders set the ${tb.info?tb.info.name:'building'} ablaze!`);
    const vic=G.vill.find(o=>!o.hidden&&Math.hypot(o.x-ww.x,o.z-ww.z)<3&&o.job!=='guard');if(vic&&rnd()<.35){chron(`${fullName(vic)} was slain by raiders.`,true);if(G.raid)G.raid.losses++;removeVillager(vic,'died');}});},tb.id);
}
function hitBandit(b,d){b.hp-=d;for(let i=0;i<4;i++)spawn(b.x,hAt(b.x,b.z)+.6,b.z,(rnd()-.5)*2,1+rnd(),(rnd()-.5)*2,.5,.3,.7,.1,.08,1);
  if(b.hp<=0){const i=G.bandits.indexOf(b);if(i>=0)G.bandits.splice(i,1);if(b.loot){G.food+=b.loot*.6;G.wood+=b.loot*.4;}}}
function endRaid(){const R=G.raid;R.active=false;R.over=true;G.raids++;G.raidCool=dayN()+10;
  chron(R.losses?`The raid was over. ${R.losses} of our folk were lost.`:`The raid was over, and no one was lost.`,true);if(!R.losses){G.joy+=6;}
  for(const v of G.vill){if(v.inside){v.timer=Math.min(v.timer,.1);}}}
let towerAcc=0;
function towersShoot(dtH){towerAcc+=dtH;if(towerAcc<.3)return;towerAcc=0;if(!G.bandits.length)return;
  for(const t of buildings){if(t.build||!(t.type==='tower'||t.type==='castle'))continue;let bt=null,bd=t.type==='castle'?26:22;
    for(const b of G.bandits){const d=Math.hypot(b.x-t.x,b.z-t.z);if(d<bd){bd=d;bt=b;}}
    if(!bt)continue;const shots=t.type==='castle'?3:1;for(let s=0;s<shots;s++){const y0=hAt(t.x,t.z)+7,dx=bt.x-t.x,dz=bt.z-t.z,y1=hAt(bt.x,bt.z)+.6;
      for(let q=0;q<5;q++){const f=q/5;spawn(lerp(t.x,bt.x,f),lerp(y0,y1,f)+Math.sin(f*PI)*1.5,lerp(t.z,bt.z,f),dx*.2,0,dz*.2,.25,.25,.9,.75,.4,2);}
      if(rnd()<.7)hitBandit(bt,.8);if(!G.bandits.includes(bt))break;}}}
// ---------------- plague, festival
function startPlague(){const vs=G.vill.filter(v=>!v.arriving&&!v.leaving);for(let i=0;i<Math.min(4,vs.length);i++)pickA(vs).sick=1;G.plagueCool=dayN()+15;chron('A fever broke out in '+G.town+'.',true);}
let festObj=null;
function startFestival(h,why){G.festival=Math.max(G.festival,h);G.lastFest=G.t;G.joy=Math.min(25,G.joy+(why==='era'?10:8));if(why!=='cast')G.faith=Math.min(faithCap(),G.faith+popN()*.4);
  for(const v of G.vill)if(!v.hidden&&!v.path){v.timer=0;}sfx('bell');buildBunting();}
function endFestival(){if(festObj){scene.remove(festObj);disposeObj(festObj);festObj=null;}}
function buildBunting(){endFestival();const [cx,cz]=festSpot();const B=new Builder(rnd,0);const near=buildings.filter(b=>!b.build&&Math.hypot(b.x-cx,b.z-cz)<22).slice(0,7);
  const cols=[0xc0392b,0xd4a73c,0x2f6b9a,0x3f8a3a,0xe8e2d2,0x8e3a8e];
  const pole=(x,z)=>{const g=hAt(x,z);B.box(x,g,z,.12,4.2,.12,COL.wood);return [x,g+4.1,z];};
  const top=pole(cx,cz);
  for(const b of near){const a=Math.atan2(b.z-cz,b.x-cx);const p2=pole(b.x-Math.cos(a)*(b.r+.4),b.z-Math.sin(a)*(b.r+.4));
    const n=10;for(let i=0;i<n;i++){const f=(i+.5)/n,x=lerp(top[0],p2[0],f),z=lerp(top[2],p2[2],f),y=lerp(top[1],p2[1],f)-Math.sin(f*PI)*.9;
      B.put('cone:3',x,y-.38,z,.18,.36,.04,cols[i%cols.length],PI,Math.atan2(p2[0]-top[0],p2[2]-top[2])+PI/2,0);}
}
  for(let i=0;i<8;i++){const a=i/8*TAU,x=cx+Math.cos(a)*5,z=cz+Math.sin(a)*5;const g=hAt(x,z);B.box(x,g,z,.08,2,.08,COL.woodD);}
  festObj=B.mesh(matB);const L=new Builder(rnd,0);for(let i=0;i<8;i++){const a=i/8*TAU,x=cx+Math.cos(a)*5,z=cz+Math.sin(a)*5;L.sph(x,hAt(x,z)+2.1,z,.22,.28,.22,0xffc860);}
  festObj.add(L.mesh(matFire,false));scene.add(festObj);}

function growForest(){if(seasonN()===3)return;let added=0;const nT=trees.length;
  for(const t of trees){if(t.ms&&t.s<t.ms)t.s=Math.min(t.ms,t.s+.1);}
  if(nT>4200)return;
  for(let i=0;i<nT*.04;i++){const p=trees[Math.floor(rnd()*nT)];if(!p||p.t===4||(p.ms&&p.s<p.ms))continue;const a=rnd()*TAU,d=2.2+rnd()*4,x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;
    if(Math.abs(x)>HALF-2||Math.abs(z)>HALF-2||wAt(x,z)>.05||slopeAt(x,z)>1.1||sampleArr(ROAD,x,z)>.15)continue;
    if(buildings.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+1.2))continue;if(G.markers.some(m=>m.k==='forbid'&&Math.hypot(m.x-x,m.z-z)<10))continue;
    let ok=true;for(const t of trees){if((t.x-x)**2+(t.z-z)**2<2.2){ok=false;break;}}if(!ok)continue;
    trees.push({x,z,t:p.t===5?1:p.t,s:.32,ms:.75+rnd()*.5,r:rnd()*TAU,c:rnd()});added++;}
  if(added)treesDirty=true;}
