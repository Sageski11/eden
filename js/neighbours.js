'use strict';
// ================================================================ a second people
// In the Bronze Age another people come into the valley. They settle somewhere that makes them different from the first
// (by water, forest or open land), so they become fishers, hunters or farmers, and they have their own faith and doubts.
// You are the Spirit of both. Switch between them with the tabs in the top bar (or Tab).
const POTS=['fish','game','farm','stone'];
const potsOf=e=>({fish:e.fishPot,game:Math.max(e.gamePot,e.woodPot*.9),farm:e.farmPot,stone:e.stonePot*.8});
function domWay(e){const p=potsOf(e);let k='farm',b=-1;for(const q of POTS)if(p[q]>b){b=p[q];k=q;}return k;}
const WAYNAME={fish:'fishers and boatwrights',game:'hunters and woodsmen',farm:'farmers and millers',stone:'quarrymen and masons'};
function sPickSite(){const cs=[];TOWNS.list.forEach((s,i)=>{const c=sGet(i,'center');if(c&&!s.dead)cs.push(c);});if(!cs.length)return null;
  const dom0=domWay(envScan(cs[0].x,cs[0].z,70));let best=null,bs=-1e9;
  for(let t=0;t<700;t++){const x=(rnd()-.5)*(N-70),z=(rnd()-.5)*(N-70);if(wAt(x,z)>.05)continue;let far=1e9;for(const c of cs)far=Math.min(far,Math.hypot(c.x-x,c.z-z));if(far<95)continue;
    let mn=1e9,mx=-1e9,wet=false;for(let k=0;k<9;k++){const a=k/8*TAU,rr=k===8?0:6,px=x+Math.cos(a)*rr,pz=z+Math.sin(a)*rr;const h=hAt(px,pz);mn=Math.min(mn,h);mx=Math.max(mx,h);if(wAt(px,pz)>.1)wet=true;}
    if(wet||mx-mn>2.4)continue;const wd=nearWater(x,z,40);if(wd>=40)continue;
    const e=envScan(x,z,60),p=potsOf(e);if(p.farm<.12&&p.fish<.2&&p.game<.25)continue;
    let other=0;for(const q of POTS)if(q!==dom0)other=Math.max(other,p[q]);
    const s=(other-p[dom0]*.6)*12-(mx-mn)*2-Math.abs(far-130)*.03-Math.max(0,wd-14)*.15;if(s>bs){bs=s;best={x,z,env:e,way:domWay(e)};}}
  return best;}
// found the settlement in whatever context is active (no UI): the hall, the street plan and five settlers from the edge
function foundHere(x,z){const b=startSite('hall',x,z,Math.round(rnd()*4)*(PI/2),{level:0});G.center=b;makePlan(b);onPlannedBuild(b);paintPlaza();b.stock={wood:G.wood,stone:G.stone,food:G.food};
  let [ex,ez]=edgePoint(Math.atan2(z,x)+(rnd()-.5)*.6);{const dx=ex-x,dz=ez-z,d=Math.hypot(dx,dz);if(d>45){for(let r2=45;r2<d;r2+=5){const tx=x+dx/d*r2,tz=z+dz/d*r2;if(wAt(tx,tz)<.05){ex=tx;ez=tz;break;}}}}[ex,ez]=reachableSpawn(ex,ez,x,z);
  const fam=pickA(FAM),fam2=pickA(FAM.filter(f=>f!==fam));
  const spec=[{female:false,fam},{female:true,fam},{female:false,fam:fam2},{female:true,fam:fam2},{female:rnd()<.5,fam:pickA(FAM),age:19}];
  spec.forEach((s,i)=>{const v=newVillager(Object.assign({x:ex+(rnd()-.5)*3,z:ez+(rnd()-.5)*3,arriving:true},s));v.timer=i*.12;});
  G.vill[0].spouse=G.vill[1].id;G.vill[1].spouse=G.vill[0].id;G.vill[2].spouse=G.vill[3].id;G.vill[3].spouse=G.vill[2].id;
  chron(`Five settlers came over the hills and pitched camp: the ${fam}s, the ${fam2}s and young ${G.vill[4].name}.`,true);}
function sFound(){const site=sPickSite();if(!site)return false;let name=townName();for(let i=0;i<20&&TOWNS.list.some((s,k)=>sName(k)===name);i++)name=townName();
  const idx=TOWNS.list.length;const st=sDefaults(name);st.era=Math.max(1,(G.era||1)-1);TOWNS.list.push({st,bld:[],dead:false});
  withSettlement(idx,()=>{G.dev.cultCool=45;foundHere(site.x,site.z);G.env=site.env;});
  chron(`Smoke rose beyond the hills: another people, ${sName(idx)}, had settled in the valley — ${WAYNAME[site.way]}.`,true);showBanner('Another people',`${sName(idx)} — ${WAYNAME[site.way]}`);sfx('bell');refreshMarkers();updateTowns();return true;}
// the second people come when the first has grown into the Bronze Age
function nbDaily(){if(G.phase!=='play'||G.menu||G.nbDone||!SHARED)return;if(TOWNS.list.filter(s=>!s.dead).length>1)return;if(G.nbAt&&dayN()<G.nbAt)return;if((G.era||0)<1||popN()<18)return;if(dayN()<20)return;if(rnd()<.2){G.nbDone=true;sFound();}}
// ---------------- viewing and switching
function viewSettlement(i,fly){const s=TOWNS.list[i];if(!s||s.dead||i===TOWNS.cur)return;swapOut();swapIn(i);TOWNS.act=i;selected=null;G.follow=null;
  if(fly&&G.center){cam.tx=G.center.x;cam.tz=G.center.z;cam.dist=Math.max(cam.dist,70);}
  if(typeof buildToolbox==='function'&&MODE==='god')buildToolbox(godToolDefs());refreshMarkers();updateTowns();updateUI(true);}
function cycleSettlement(){if(TOWNS.list.length<2)return;let i=TOWNS.cur;do{i=(i+1)%TOWNS.list.length;}while(TOWNS.list[i].dead);viewSettlement(i,true);}
function updateTowns(){const el=document.getElementById('gTowns');if(!el)return;if(TOWNS.list.length<2){el.classList.add('hidden');el.innerHTML='';return;}el.classList.remove('hidden');
  let h='';TOWNS.list.forEach((s,i)=>{if(s.dead)return;const pop=i===TOWNS.cur?popN():(((s.st&&s.st.vill)||[]).filter(v=>!v.leaving&&!v.arriving).length);h+=`<button data-town="${i}" class="${i===TOWNS.cur?'on':''}" title="${esc(sName(i))} — ${(sGet(i,'env')?WAYNAME[domWay(sGet(i,'env'))]:'a young people')}">${esc(sName(i))} <small>${ERAS[sGet(i,'era')||0].name} · ${pop}</small></button>`;});
  if(el._h!==h){el.innerHTML=h;el._h=h;for(const b of el.querySelectorAll('[data-town]'))b.onclick=()=>viewSettlement(+b.dataset.town,true);}}
