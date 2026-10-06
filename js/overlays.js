'use strict';
// ================================================================ OVERLAYS: reading the city
// Sight overlays (services, mood, smog, footfall, land value, districts, plan) drawn as a translucent tint on the terrain, the 'Why?'
// diagnostics panel, per-building lines in the inspector, district name signs, the visible economy (market stalls, carts, caravans,
// dockside work) and a few settlement edicts. Everything here is cosmetic or advisory except the edicts (which use existing multipliers).
// Nothing is computed per frame over every villager or building: overlays are recomputed in slices every few seconds while visible,
// the economy visuals only exist near the camera, and the diagnostics only run while their panel is open.
// Exports: ovTool(id), ovHaul(from,to,kind,opt), ovWhy(), ovInspLines(b), ovSetOverlay(mode); hooks wrapped (not edited): goTo, wear,
// godToolDefs, buildToolbox, setTool, godInspector, hourTick, flam, eraHapF.
{
const OVN=GN,OV={mode:null,sub:'all',a:0,job:null,lastDone:-99,every:3.2,force:true,names:true,key:'',day:-1,tipT:0,wd:null,wdT:-99,whyOpen:false,lawOpen:false};
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cellI=x=>clamp(Math.floor((x+HALF)/GC),0,GN-1);
const cellX=i=>i*GC+1-HALF;
const now=()=>performance.now()/1000;
// ---------------------------------------------------------------- the fields
const COV={};const S7=['water','food','safety','worship','learning','health','leisure'];for(const k of S7)COV[k]=new Float32Array(NN);
const SVN={water:'Water',food:'Food',safety:'Safety',worship:'Worship',learning:'Learning',health:'Health',leisure:'Leisure'};
const SVFROM={water:0,food:0,safety:1,worship:1,leisure:2,health:2,learning:3};
const SVMISS={water:['no well or water within reach','Dig a well near the homes, or pour water / open a spring close by.'],
  food:['no farm, market or fish stall within reach','Plant a Farm banner on flat ground near here, or settle a market.'],
  safety:['no tower, barracks or castle within reach','The folk raise towers once raids come; a castle or barracks guards a wide area.'],
  worship:['no shrine or church within reach','Plant a Worship banner near here so the folk raise a shrine or church.'],
  learning:['no school, library or college within reach','Learning buildings appear as the age and the town grow.'],
  health:['no apothecary or infirmary within reach','An apothecary or infirmary needs healers and a bigger town.'],
  leisure:['no tavern, theatre or green within reach','Taverns, playhouses and stadiums come with the age; a plaza helps too.']};
// building type -> [category, reach in world units, strength]
const SVT={well:[['water',22,1]],
  farm:[['food',26,1]],market:[['food',34,1],['leisure',22,.6]],fishmkt:[['food',28,1]],granary:[['food',30,1]],bakery:[['food',26,1]],dock:[['food',22,.8]],vertical_farm:[['food',44,1]],storage_pit:[['food',18,.7]],drying_rack:[['food',16,.6]],lodge:[['food',24,.8]],
  tower:[['safety',30,1]],castle:[['safety',56,1]],barracks:[['safety',38,1]],gatehouse:[['safety',28,.8]],wall_tower:[['safety',26,.8]],fire_station:[['safety',42,1]],
  church:[['worship',38,1]],shrine:[['worship',26,.9]],cathedral:[['worship',60,1]],monastery:[['worship',44,.9],['learning',22,.5],['health',22,.5]],totem:[['worship',20,.7]],burial_mound:[['worship',14,.5]],
  school:[['learning',38,1]],college:[['learning',46,1]],library:[['learning',36,1]],scriptorium:[['learning',28,.8]],data_spire:[['learning',62,1]],
  apothecary:[['health',30,1]],infirmary:[['health',40,1]],bathhouse:[['health',22,.6],['leisure',18,.5]],almshouse:[['health',26,.7]],
  tavern:[['leisure',28,1]],playhouse:[['leisure',36,1]],stadium:[['leisure',52,1]],cinema:[['leisure',40,1]],holo_theatre:[['leisure',46,1]],sky_garden:[['leisure',34,1]]};
const POLS={factory:1,powerplant:1.5,gasworks:.8,bronze_foundry:.3,kiln:.25,smith:.2,tannery:.3,brewery:.15,bakery:.1,tram_depot:.25,station:.2,warehouse:.08,sawmill:.15};
const nameOf=b=>b.info&&b.info.name?b.info.name:(BT[b.type]||b.type);
const relCats=()=>S7.filter(k=>SVFROM[k]<=(G.era||0));
// ---------------------------------------------------------------- colour ramps
function bake(stops){const L=new Uint8Array(64*3);for(let i=0;i<64;i++){const t=i/63;let a=stops[0],b=stops[stops.length-1];for(let s=0;s<stops.length-1;s++)if(t>=stops[s][0]&&t<=stops[s+1][0]){a=stops[s];b=stops[s+1];break;}
    const f=b[0]>a[0]?clamp((t-a[0])/(b[0]-a[0]),0,1):0;for(let c=0;c<3;c++)L[i*3+c]=a[1][c]+(b[1][c]-a[1][c])*f;}return L;}
const RAMP={rg:[[0,[205,62,52]],[.45,[236,170,62]],[.75,[190,202,84]],[1,[66,184,112]]],teal:[[0,[96,196,200]],[1,[58,176,118]]],smog:[[0,[232,218,150]],[.5,[166,126,92]],[1,[98,58,86]]],
  heat:[[0,[70,112,222]],[.35,[70,202,212]],[.65,[242,216,82]],[1,[226,70,50]]],land:[[0,[62,62,152]],[.4,[50,152,172]],[.7,[226,192,82]],[1,[252,246,204]]]};
const LUT={};for(const k in RAMP)LUT[k]=bake(RAMP[k]);
const rampCss=k=>'linear-gradient(90deg,'+RAMP[k].map(s=>`rgb(${s[1].join(',')}) ${Math.round(s[0]*100)}%`).join(',')+')';
const ZC={civic:[232,188,78],mix:[232,132,62],res:[112,190,112],ind:[118,132,156],farm:[172,182,84],harbour:[82,152,222]};
const ZN=['','civic','mix','res','ind','farm','harbour'];const ZI={civic:1,mix:2,res:3,ind:4,farm:5,harbour:6};
const buf=new Uint8Array(NN*4);
function put(k,rgb,a){a=clamp(a,0,1);const o=k*4;buf[o]=rgb[0]*a;buf[o+1]=rgb[1]*a;buf[o+2]=rgb[2]*a;buf[o+3]=a*255;}
function putL(k,lut,t,a){t=clamp(t,0,1);const i=Math.round(t*63)*3;a=clamp(a,0,1);const o=k*4;buf[o]=lut[i]*a;buf[o+1]=lut[i+1]*a;buf[o+2]=lut[i+2]*a;buf[o+3]=a*255;}
// ---------------------------------------------------------------- fresh facts about this settlement (computed per recompute, not per frame)
const D={sv:[],homes:[],res:new Map(),wk:new Map(),foot:new Uint8Array(NN),poll:new Float32Array(NN),tree:new Float32Array(NN),dens:new Float32Array(NN),hap:new Float32Array(NN),hapW:new Float32Array(NN),land:new Float32Array(NN),zone:new Uint8Array(NN),roi:[0,0,GN-1,GN-1],polS:[],zoneT:-99,zoneKey:''};
const TR=new Float32Array(NN),TRs=new Float32Array(NN);
function stamp(A,x,z,r,val){const i0=Math.max(0,Math.floor((x-r+HALF)/GC)),i1=Math.min(GN-1,Math.floor((x+r+HALF)/GC)),j0=Math.max(0,Math.floor((z-r+HALF)/GC)),j1=Math.min(GN-1,Math.floor((z+r+HALF)/GC));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i*GC+1-HALF-x,j*GC+1-HALF-z);if(d>=r)continue;const f=d<=r*.35?1:1-(d-r*.35)/(r*.65),v=f*val,k=j*GN+i;if(v>A[k])A[k]=v;}}
function gather(){
  D.sv.length=0;D.homes.length=0;D.res.clear();D.wk.clear();D.polS.length=0;
  for(const v of G.vill){if(v.work)D.wk.set(v.work,(D.wk.get(v.work)||0)+1);if(v.home&&!v.arriving&&!v.leaving){let l=D.res.get(v.home);if(!l)D.res.set(v.home,l=[]);l.push(v);}}
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(const b of buildings){if(b.x<x0)x0=b.x;if(b.x>x1)x1=b.x;if(b.z<z0)z0=b.z;if(b.z>z1)z1=b.z;
    if(b.type==='house'||(b.type==='hall'&&!b.build))D.homes.push(b);
    if(b.build)continue;
    const t=b.type==='camp'&&b.variant==='fish'?'lodge':b.type,def=SVT[t];
    if(def){const sj=SLOTJ[slotKey(b)],eff=sj&&!(D.wk.get(b.id)>0)?.5:1;for(const [cat,r,w] of def)D.sv.push({b,cat,r,w:w*eff,eff});}
    const ps=POLS[b.type];if(ps)D.polS.push({b,s:ps});}
  if(G.plan&&G.plan.plaza){const p=G.plan.plaza;D.sv.push({b:{x:p.x,z:p.z,type:'plaza',info:{name:'Town square'},r:p.r},cat:'leisure',r:20,w:.7,eff:1});}
  if(!buildings.length){x0=z0=-10;x1=z1=10;}
  const m=40;D.roi=[cellI(x0-m),cellI(z0-m),cellI(x1+m),cellI(z1+m)];
}
function* calcWd(){// distance (world units) to the nearest water, by two chamfer passes; refreshed every few seconds at most
  if(OV.wd&&now()-OV.wdT<9)return;OV.wdT=now();const A=OV.wd||(OV.wd=new Float32Array(NN)),BIG=999;
  for(let j=0;j<GN;j++)for(let i=0;i<GN;i++){const k=j*GN+i;A[k]=W[(j*GC+1)*S+i*GC+1]>.2?0:BIG;}
  yield;
  for(let j=0;j<GN;j++)for(let i=0;i<GN;i++){const k=j*GN+i;let v=A[k];if(i>0)v=Math.min(v,A[k-1]+GC);if(j>0)v=Math.min(v,A[k-GN]+GC);if(i>0&&j>0)v=Math.min(v,A[k-GN-1]+GC*1.41);if(i<GN-1&&j>0)v=Math.min(v,A[k-GN+1]+GC*1.41);A[k]=v;}
  yield;
  for(let j=GN-1;j>=0;j--)for(let i=GN-1;i>=0;i--){const k=j*GN+i;let v=A[k];if(i<GN-1)v=Math.min(v,A[k+1]+GC);if(j<GN-1)v=Math.min(v,A[k+GN]+GC);if(i<GN-1&&j<GN-1)v=Math.min(v,A[k+GN+1]+GC*1.41);if(i>0&&j<GN-1)v=Math.min(v,A[k+GN-1]+GC*1.41);A[k]=v;}
}
function* calcCov(){
  for(const k of S7)COV[k].fill(0);yield;
  let n=0;for(const s of D.sv){stamp(COV[s.cat],s.b.x,s.b.z,s.r*(1+(G.era>=5?.1:0)),s.w);if(++n%7===0)yield;}
  yield* calcWd();yield;const wd=OV.wd;for(let k=0;k<NN;k++)if(wd[k]<10)COV.water[k]=Math.max(COV.water[k],1-wd[k]/16);
  yield;D.foot.fill(0);n=0;for(const h of D.homes){const r=h.type==='hall'?7:8.5,i0=cellI(h.x-r),i1=cellI(h.x+r),j0=cellI(h.z-r),j1=cellI(h.z+r);
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(Math.hypot(cellX(i)-h.x,cellX(j)-h.z)<r)D.foot[j*GN+i]=1;if(++n%12===0)yield;}
}
function* calcPoll(){
  const A=D.poll;A.fill(0);const e=G.era||0,k0=e>=5?.35+clamp((G.poll||0)/50,0,1)*.9:.45;
  const wa=G.plan&&G.plan.wind!=null?G.plan.wind:.6,wx=Math.cos(wa),wz=Math.sin(wa);let n=0;
  for(const s of D.polS){const st=s.s*k0;const R=46,x=s.b.x,z=s.b.z,i0=cellI(x-R),i1=cellI(x+R),j0=cellI(z-R),j1=cellI(z+R);
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=cellX(i)-x,dz=cellX(j)-z,al=dx*wx+dz*wz,cr=-dx*wz+dz*wx;const q=(al-9)*(al-9)/(2*(al>9?26*26:15*15))+cr*cr/(2*12*12);if(q>6)continue;A[j*GN+i]+=st*Math.exp(-q);}
    if(++n%3===0)yield;}
  // forests clean the air: tree density near each cell (counted once, blurred)
  const T=D.tree;T.fill(0);n=0;for(const t of trees){if(t.t===4||t.t===5)continue;T[cellI(t.z)*GN+cellI(t.x)]+=1;if(++n%2500===0)yield;}
  for(let pass=0;pass<2;pass++){yield;const o=D.dens;for(let j=1;j<GN-1;j++)for(let i=1;i<GN-1;i++){const k=j*GN+i;o[k]=(T[k]*2+T[k-1]+T[k+1]+T[k-GN]+T[k+GN])/6;}T.set(o);}
  yield;for(let k=0;k<NN;k++){if(A[k]>0)A[k]=A[k]*(1-Math.min(.4,T[k]*.18));}
}
// ---------------------------------------------------------------- zones: the plan's districts on the grid (a generator: it yields while running)
function zoneOfPoint(x,z){const P=G.plan;
  if(P&&P.v>=3&&typeof lyZone==='function'){const zz=lyZone(P,x,z);let id=ZI[zz]||5;
    for(const b of D.dockB||[])if(Math.hypot(b.x-x,b.z-z)<17){id=6;break;}return id;}
  const c=G.center;if(!c)return 0;const d=Math.hypot(x-c.x,z-c.z);return d<14?1:d<30?2:d<56?3:5;}
function* calcZones(){D.dockB=buildings.filter(b=>!b.build&&(b.type==='dock'||b.type==='shipyard'||b.type==='fishmkt'));
  const [i0,j0,i1,j1]=D.roi;D.zone.fill(0);let n=0;
  for(let j=j0;j<=j1;j++){for(let i=i0;i<=i1;i++){D.zone[j*GN+i]=zoneOfPoint(cellX(i),cellX(j));if(++n>=2200){n=0;yield;}}}
  D.zoneT=now();D.zoneKey=G.plan?(G.plan.tpl||'')+':'+(G.plan.streets?G.plan.streets.length:0):'';}
// ---------------------------------------------------------------- per-cell facts for the hover readout (scans the short service list)
function svcAt(x,z){const out={};for(const k of S7)out[k]={v:0,src:null,d:0,eff:1};
  for(const s of D.sv){const d=Math.hypot(s.b.x-x,s.b.z-z),r=s.r*(1+(G.era>=5?.1:0));if(d>=r)continue;const f=d<=r*.35?1:1-(d-r*.35)/(r*.65),v=f*s.w,o=out[s.cat];if(v>o.v){o.v=v;o.src=s.b;o.d=d;o.eff=s.eff;}}
  if(OV.wd){const wd=OV.wd[cellI(z)*GN+cellI(x)];if(wd<10){const v=1-wd/16;if(v>out.water.v){out.water.v=v;out.water.src={type:'water',info:{name:'Open water'}};out.water.d=wd;out.water.eff=1;}}}
  return out;}
function homeValue(h,sv){// mood of the quarter around one home and what is behind it
  const rs=D.res.get(h.id)||[];let base=G.hap;if(rs.length){let s=0;for(const v of rs)s+=vMood(v);base=s/rs.length;}
  const rel=relCats();let cov=0;for(const k of rel)if(sv[k].v>=.2)cov++;
  const svc=rel.length?Math.round((cov/rel.length-.6)*10):0;const pl=D.poll[cellI(h.z)*GN+cellI(h.x)]||0,smog=-Math.round(Math.min(1,pl)*14);
  let nb=0;for(const o of D.homes)if(o!==h&&Math.abs(o.x-h.x)<9&&Math.abs(o.z-h.z)<9)nb++;const crowd=-Math.max(0,Math.round((nb-5)*.9));
  const home=h.type==='house'?Math.round(((h.level||0)-1)*2):-3;
  return {v:clamp(base+svc+smog+crowd+home,0,100),base:Math.round(base),svc,smog,crowd,home,cov,rel:rel.length,rs:rs.length};}
// ---------------------------------------------------------------- the jobs (one per overlay): fill `buf` and finish
function* jobFor(mode){
  buf.fill(0);const [i0,j0,i1,j1]=D.roi;gather();
  if(mode==='svc'){yield* calcCov();yield;const rel=relCats(),sub=OV.sub;
    for(let j=j0;j<=j1;j++){for(let i=i0;i<=i1;i++){const k=j*GN+i,foot=D.foot[k];
      if(sub==='all'){let c=0;for(const q of rel)if(COV[q][k]>=.2)c++;const t=rel.length?c/rel.length:1;
        if(foot)putL(k,LUT.rg,t,.74);else if(c)putL(k,LUT.rg,t,.18+.14*t);}
      else{const v=COV[sub][k];if(foot){if(v>=.04)putL(k,LUT.teal,v,.32+.32*v);else putL(k,LUT.rg,0,.58);}else if(v>.02)putL(k,LUT.teal,v,.14+.24*v);}}
      if((j&7)===0)yield;}}
  else if(mode==='hap'){yield* calcCov();yield* calcPoll();yield;D.hap.fill(0);D.hapW.fill(0);let hn=0;
    for(const h of D.homes){if(++hn%6===0)yield;const sv=svcAt(h.x,h.z),hv=homeValue(h,sv);h._ovH=hv;const R=11,x=h.x,z=h.z;
      for(let j=cellI(z-R);j<=cellI(z+R);j++)for(let i=cellI(x-R);i<=cellI(x+R);i++){const d2=((cellX(i)-x)**2+(cellX(j)-z)**2)/(R*R);if(d2>1)continue;const w=Math.exp(-d2*2.6),k=j*GN+i;D.hap[k]+=w*hv.v;D.hapW[k]+=w;}}
    yield;for(let k=0;k<NN;k++){const w=D.hapW[k];if(w>.05)putL(k,LUT.rg,((D.hap[k]/w)-25)/60,clamp(w*.62,0,.76));}}
  else if(mode==='poll'){yield* calcPoll();yield;for(let k=0;k<NN;k++){const t=D.poll[k];if(t>.04)putL(k,LUT.smog,t/1.1,clamp(.16+t*.6,0,.78));}}
  else if(mode==='traf'){
    for(let j=1;j<GN-1;j++)for(let i=1;i<GN-1;i++){const k=j*GN+i;TRs[k]=(TR[k]*4+TR[k-1]+TR[k+1]+TR[k-GN]+TR[k+GN])/8;}
    yield;for(let k=0;k<NN;k++){const t=TRs[k];if(t>.15){const u=1-Math.exp(-t/14);putL(k,LUT.heat,u,clamp(.28+u*.46,0,.7));}}}
  else if(mode==='land'||mode==='dist'||mode==='plan'){
    yield* calcWd();if(now()-D.zoneT>8||D.zoneKey!==(G.plan?(G.plan.tpl||'')+':'+(G.plan.streets?G.plan.streets.length:0):'')||mode==='dist'){yield* calcZones();}
    if(mode==='land'){yield* calcCov();yield* calcPoll();yield;const rel=relCats(),Zb=[0,.92,.72,.52,.28,.14,.62],dn=D.dens;
      // neighbours: how many buildings stand around each cell
      dn.fill(0);for(const b of buildings){const i=cellI(b.x),j=cellI(b.z);dn[j*GN+i]+=b.type==='house'?1:1.6;}
      for(let pass=0;pass<3;pass++){const o=D.tree;for(let j=1;j<GN-1;j++)for(let i=1;i<GN-1;i++){const k=j*GN+i;o[k]=(dn[k]*2+dn[k-1]+dn[k+1]+dn[k-GN]+dn[k+GN])/6;}dn.set(o);}
      let n=0;for(let j=j0;j<=j1;j++){for(let i=i0;i<=i1;i++){const k=j*GN+i,z=D.zone[k];if(!z)continue;
        let cv=0;for(const q of rel)cv+=Math.min(1,COV[q][k]);cv=rel.length?cv/rel.length:0;
        let v=Zb[z]+cv*.3+Math.min(.14,dn[k]*.05)-Math.min(1,D.poll[k])*.34;const wd=OV.wd[k];if(wd<12)v+=.12*(1-wd/12);
        const fm=G.floodMap&&G.floodMap[k];if(fm)v-=.18;D.land[k]=v;putL(k,LUT.land,v,.7);if(++n>=3000){n=0;yield;}}}}
    else if(mode==='dist'){for(let j=j0;j<=j1;j++){for(let i=i0;i<=i1;i++){const k=j*GN+i,z=D.zone[k];if(z)put(k,ZC[ZN[z]],.56);}}}
    else{for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*GN+i,z=D.zone[k];if(z)put(k,ZC[ZN[z]],.22);}paintPlan();}
  }
}
// ---------------------------------------------------------------- the plan, drawn in the world: streets, plots, plaza (a canvas laid over the terrain)
const PLN=1024,planCv=document.createElement('canvas');planCv.width=planCv.height=PLN;const pg=planCv.getContext('2d');
function paintPlan(){const P=G.plan,sc=PLN/N,X=x=>(x+HALF)*sc;
  const sig=P&&P.streets?G.town+':'+P.streets.length+':'+P.streets.reduce((a,s)=>a+(s.painted||0),0)+':'+P.plots.length+':'+buildings.reduce((a,b)=>a+(b.type==='house'?1:0),0):'none';if(OV.planSig===sig)return;OV.planSig=sig;
  pg.clearRect(0,0,PLN,PLN);if(!P||!P.streets){OV.planTex.needsUpdate=true;return;}pg.lineCap='round';pg.lineJoin='round';
  const stroke=(pts,w,col)=>{pg.strokeStyle=col;pg.lineWidth=w;pg.beginPath();pts.forEach((p,i)=>i?pg.lineTo(X(p[0]),X(p[1])):pg.moveTo(X(p[0]),X(p[1])));pg.stroke();};
  for(const s of P.streets)stroke(s.pts,(s.hw*2+.9)*sc,'rgba(40,28,16,.55)');
  for(const s of P.streets)stroke(s.pts,s.hw*2*sc,s.kind==='main'?'#f6e6b4':s.kind==='ring'?'#ecdca8':'#e2d4a8');
  for(const s of P.streets)if(s.painted){stroke(s.pts.slice(0,s.painted+1),s.hw*1.1*sc,'#b78a50');}
  pg.strokeStyle='rgba(255,255,255,.7)';pg.lineWidth=1.1;
  for(const p of P.plots){const cs=Math.cos(p.rot),sn=Math.sin(p.rot),f=[-p.w/2,p.w/2,-4.8,2.6],occ=buildings.some(b=>b.type==='house'&&Math.hypot(b.x-p.x,b.z-p.z)<3.2);
    pg.fillStyle=occ?'rgba(255,255,255,.16)':'rgba(255,240,170,.1)';pg.beginPath();[[f[0],f[2]],[f[1],f[2]],[f[1],f[3]],[f[0],f[3]]].forEach(([lx,lz],i)=>{const wx=p.x+lx*cs+lz*sn,wz=p.z-lx*sn+lz*cs;i?pg.lineTo(X(wx),X(wz)):pg.moveTo(X(wx),X(wz));});pg.closePath();pg.fill();pg.stroke();}
  if(P.plaza){pg.fillStyle='rgba(250,236,190,.9)';pg.strokeStyle='rgba(40,28,16,.6)';pg.lineWidth=2;pg.beginPath();pg.arc(X(P.plaza.x),X(P.plaza.z),P.plaza.r*sc,0,TAU);pg.fill();pg.stroke();}
  OV.planTex.needsUpdate=true;}
// ---------------------------------------------------------------- the tint on the terrain
const dataTex=new THREE.DataTexture(new Uint8Array(NN*4),GN,GN,THREE.RGBAFormat);dataTex.magFilter=dataTex.minFilter=THREE.LinearFilter;dataTex.generateMipmaps=false;dataTex.needsUpdate=true;
const planTex=new THREE.CanvasTexture(planCv);planTex.flipY=false;planTex.minFilter=THREE.LinearFilter;planTex.generateMipmaps=false;OV.planTex=planTex;
const ovU={tD:{value:dataTex},tP:{value:planTex},uA:{value:0},uLines:{value:0},uT:{value:0},uScrim:{value:.3},uRing:{value:new THREE.Vector4(0,0,0,0)}};
const ovGeo=new THREE.BufferGeometry();ovGeo.setAttribute('position',tGeo.attributes.position);ovGeo.setIndex(tGeo.index);
const ovMat=new THREE.ShaderMaterial({uniforms:ovU,transparent:true,depthWrite:false,premultipliedAlpha:true,extensions:{derivatives:true},polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
  vertexShader:`varying vec2 vUv;varying vec2 vXZ;void main(){vUv=(position.xz+160.)/320.;vXZ=position.xz;vec3 p=position;p.y+=.1;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform sampler2D tD,tP;uniform float uA,uLines,uT,uScrim;uniform vec4 uRing;varying vec2 vUv;varying vec2 vXZ;
   void main(){vec4 d=texture2D(tD,vUv);float e=clamp(length(vec2(dFdx(d.a),dFdy(d.a)))*34.,0.,1.);vec4 c=d;c.rgb+=vec3(e*.16)*step(.02,d.a);c.a=min(1.,c.a+e*.1);
    if(uLines>.5){vec4 l=texture2D(tP,vUv);c=vec4(l.rgb*l.a,l.a)+c*(1.-l.a);}
    if(uRing.w>0.){float r=length(vXZ-uRing.xy),w=.35+uRing.z*.004;float ring=smoothstep(w,0.,abs(r-uRing.z));float fill=smoothstep(uRing.z,uRing.z-3.,r)*.07;vec3 rc=vec3(1.,.94,.7);c=c+vec4(rc*(ring*.8+fill),ring*.8+fill)*(1.-c.a)*uRing.w;}
    c=c+vec4(vec3(.42,.42,.40)*uScrim,uScrim)*(1.-c.a);gl_FragColor=c*uA;}`});
const ovMesh=new THREE.Mesh(ovGeo,ovMat);ovMesh.frustumCulled=false;ovMesh.renderOrder=3;ovMesh.visible=false;scene.add(ovMesh);
function upload(){dataTex.image.data.set(buf);dataTex.needsUpdate=true;}
function clearTex(){buf.fill(0);upload();}
// ---------------------------------------------------------------- the panels: legend, hover readout (CSS injected here)
{const st=document.createElement('style');st.id='ovCss';st.textContent=`
#ovLegend{position:fixed;left:50%;bottom:14px;transform:translateX(-50%) scale(var(--ui,1));transform-origin:50% 100%;width:430px;max-width:94vw;padding:8px 12px 9px;z-index:4;font-size:14px}
#ovLegend .ovh{display:flex;align-items:center;gap:8px;margin-bottom:5px}
#ovLegend .ovh b{font-family:Cinzel,serif;font-size:13px;letter-spacing:1.6px;text-transform:uppercase;color:var(--wood2);flex:1}
#ovLegend .ovh small{font-style:italic;color:var(--ink2);font-size:12px}
.ovmodes,.ovchips{display:flex;flex-wrap:wrap;gap:4px;margin:3px 0 6px}
.ovmodes button,.ovchips button{font-size:12.5px;padding:1px 7px;line-height:1.35}
#ovBar{height:9px;border-radius:5px;border:1px solid #8a6a44;margin:2px 0 1px}
.ovlab{display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink2);font-style:italic}
#ovNote{font-size:13.5px;color:var(--ink);margin-top:5px;line-height:1.25}
.ovsw{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:13px;margin-top:2px}.ovsw i{display:inline-block;width:11px;height:11px;border-radius:2px;border:1px solid rgba(0,0,0,.35);margin-right:4px;vertical-align:-1px}
#ovTip{position:fixed;left:0;top:0;z-index:6;will-change:transform;pointer-events:none;width:252px;padding:7px 10px 8px;font-size:13.5px;line-height:1.28}
#ovTip h4{margin:0 0 3px;font-family:Cinzel,serif;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:var(--wood2)}
#ovTip .r{display:flex;gap:6px;align-items:baseline}#ovTip .r b{min-width:14px;text-align:center}
#ovTip .ok b{color:#3f7a3a}#ovTip .no b{color:var(--red)}#ovTip .dim{color:#8c7a5c}
#ovTip .miss{margin-top:4px;padding-top:4px;border-top:1px dotted #b89a6a;color:var(--red)}
#ovTip em{color:var(--ink2)}
`;document.head.appendChild(st);}
const legend=document.createElement('div');legend.id='ovLegend';legend.className='panel hidden';document.body.appendChild(legend);
const tip=document.createElement('div');tip.id='ovTip';tip.className='panel hidden';document.body.appendChild(tip);
const MODES={svc:{n:'Services',lo:'no cover',hi:'well served',ramp:'rg',note:'How well each quarter is looked after. Red patches are homes with nothing within reach.'},
  hap:{n:'Mood by quarter',lo:'miserable',hi:'content',ramp:'rg',note:'Each home is rated by its folk, the services near it, smoke and crowding.'},
  poll:{n:'Smoke & smog',lo:'clear air',hi:'choking',ramp:'smog',note:'Drifts downwind of chimneys, kilns and works; forests thin it.'},
  traf:{n:'Footfall',lo:'quiet',hi:'thronged',ramp:'heat',note:'Where the folk actually walk. Daily counts fade; roads wear in where they gather.'},
  land:{n:'Land value',lo:'cheap',hi:'prized',ramp:'land',note:'Shaped by district, services, the waterfront, neighbours and smoke.'},
  dist:{n:'Districts',note:'The districts of the town plan.'},plan:{n:'Plan',note:'The elders\' plan: streets, house plots and districts. Streets worn brown are already laid.'}};
const MORDER=['svc','hap','poll','traf','land','dist','plan'];
const MSHORT={svc:'Services',hap:'Mood',poll:'Smog',traf:'Footfall',land:'Land',dist:'Districts',plan:'Plan'};
function drawLegend(){
  const m=OV.mode;if(!m){legend.classList.add('hidden');return;}const M=MODES[m];legend.classList.remove('hidden');const sg=m+OV.sub+(G.era||0);if(legend._sg===sg&&legend._h)return;legend._sg=sg;
  let h=`<div class="ovh"><b>${M.n}</b><small>O · next</small><button class="mini" data-o="off" title="Hide overlay">×</button></div><div class="ovmodes">${MORDER.map(k=>`<button data-o="${k}" class="${k===m?'on':''}">${MSHORT[k]}</button>`).join('')}</div>`;
  if(m==='svc')h+=`<div class="ovchips">${['all',...S7].map(k=>`<button data-s="${k}" class="${k===OV.sub?'on':''}${k!=='all'&&SVFROM[k]>(G.era||0)?' dimb':''}">${k==='all'?'All':SVN[k]}</button>`).join('')}</div>`;
  if(M.ramp)h+=`<div id="ovBar" style="background:${rampCss(M.ramp)}"></div><div class="ovlab"><span>${M.lo}</span><span>${M.hi}</span></div>`;
  else if(m==='dist'||m==='plan')h+=`<div class="ovsw">${['civic','mix','res','ind','farm','harbour'].map(z=>`<span><i style="background:rgb(${ZC[z].join(',')})"></i>${ovZoneLabel(z)}</span>`).join('')}</div>`;
  h+=`<div id="ovNote">${m==='svc'&&OV.sub!=='all'?esc2(SVMISS[OV.sub][0].replace(/^no /,'Reach of ').replace(/ within reach$/,'')+' — teal is covered; red marks settled ground with none.'):esc2(M.note)}</div>`;
  if(legend._h!==h){legend._h=h;legend.innerHTML=h;
    for(const b of legend.querySelectorAll('button[data-o]'))b.onclick=()=>{const k=b.dataset.o;setOverlay(k==='off'?null:k);syncBtns();};
    for(const b of legend.querySelectorAll('button[data-s]'))b.onclick=()=>{OV.sub=b.dataset.s;OV.force=true;OV.job=null;drawLegend();};}
}
const ovZoneLabel=z=>({civic:'Civic core',mix:'Trade & mixed',res:'Homes',ind:'Works',farm:'Fields',harbour:'Harbour'}[z]);
function setOverlay(m){if(m===OV.mode)return;OV.mode=m;OV.job=null;OV.force=true;OV.a=Math.min(OV.a,.2);clearTex();ovU.uLines.value=m==='plan'?1:0;legend._h='';legend._sg='';drawLegend();tipHide();
  if(m&&!G.plan&&(m==='plan'))toast('The folk have not drawn up a plan yet');}
window.ovSetOverlay=setOverlay;OV.testFill=(r,g,b,a)=>{for(let k=0;k<NN;k++)put(k,[r,g,b],a);upload();OV.lastDone=now()+1e6;OV.job=null;OV.force=false;};OV.sample=(x,z)=>{const k=cellI(z)*GN+cellI(x);return {rgba:[buf[k*4],buf[k*4+1],buf[k*4+2],buf[k*4+3]],foot:D.foot[k],cov:S7.map(c=>+COV[c][k].toFixed(2)),zone:D.zone[k]};};OV.runSync=m=>{const g=jobFor(m);let r,n=0;do{r=g.next();n++;}while(!r.done);return {yields:n,...OV.dbg()};};OV.dbg=()=>{let n=0,mx=0;for(let k=3;k<buf.length;k+=4)if(buf[k]){n++;mx=Math.max(mx,buf[k]);}return {n,mx,roi:D.roi,homes:D.homes.length,mode:OV.mode,job:!!OV.job,last:OV.lastDone,a:OV.a,now:now()};};
function cycleOverlay(dir){const i=OV.mode?MORDER.indexOf(OV.mode):-1;let n=i+dir;if(n>=MORDER.length)n=-1;if(n<-1)n=MORDER.length-1;setOverlay(n<0?null:MORDER[n]);syncBtns();if(OV.mode)toast('Sight: '+MODES[OV.mode].n);}
// ---------------------------------------------------------------- Sight buttons in the god toolbox
const SIGHT=['Sight',[['o:svc','Services','O'],['o:hap','Mood',''],['o:poll','Smog',''],['o:traf','Footfall',''],['o:land','Land value',''],['o:dist','Districts',''],['o:plan','Plan',''],['o:why','Why?','Z'],['o:law','Edicts','L'],['o:names','Names','U']]];
{const _g=godToolDefs;godToolDefs=function(){const d=_g();const i=d.findIndex(g=>g[0]==='Miracles');d.splice(i<0?d.length:i,0,[SIGHT[0],SIGHT[1].map(t=>t.slice())]);return d;};}
{const _b=buildToolbox;buildToolbox=function(d){const r=_b(d);syncBtns();return r;};}
{const _s=setTool;setTool=function(id){if(MODE==='god'&&typeof id==='string'&&id.startsWith('o:')){ovTool(id);return;}const r=_s.apply(this,arguments);syncBtns();return r;};}
Object.assign(HINTS,{'o:svc':'Tint the land by how well it is served: water, food, safety, worship, learning, health, leisure. Red marks homes with nothing in reach. Hover for what is missing. (O cycles the sights)',
  'o:hap':'Mood by quarter: each home rated from its folk, the services near it, smoke and crowding.','o:poll':'Smoke and smog from chimneys, kilns and works, drifting downwind; forests thin it.',
  'o:traf':'Footfall: where the folk really walk. Daily counts fade; roads wear in where they gather.','o:land':'Land value: district, services, waterfront, neighbours and smoke.',
  'o:dist':'The districts of the town plan: civic core, trade, homes, works, fields, harbour.','o:plan':'The elders\' plan in the world: streets, house plots, plaza.',
  'o:why':'Why is nothing happening? A ranked list of what holds the town back, in plain words, with something to try. Also shown as lines in the inspector.','o:law':'Edicts: ration the stores, call for volunteers, set a night watch, open the granaries, favour farmers and fishers. They cost Faith and last a few days.',
  'o:names':'Show or hide the floating district names (visible at medium zoom).'});
function syncBtns(){if(!toolsEl)return;for(const b of toolsEl.querySelectorAll('button[data-tool^="o:"]')){const k=b.dataset.tool.slice(2);
    const on=k==='why'?OV.whyOpen:k==='law'?OV.lawOpen:k==='names'?OV.names:OV.mode===k;b.classList.toggle('on',on);
    if(k==='why'){let bd=b.querySelector('.ovbadge');const n=OV.whyN||0;if(n&&!bd){bd=document.createElement('i');bd.className='cost ovbadge';b.appendChild(bd);}if(bd){bd.textContent=n;bd.style.display=n?'':'none';}}}}
function ovTool(id){const k=id.slice(2);
  if(k==='why')toggleWhy();else if(k==='law')toggleLaw();
  else if(k==='names'){OV.names=!OV.names;toast(OV.names?'District names shown':'District names hidden');}
  else setOverlay(OV.mode===k?null:k);
  syncBtns();}
window.ovTool=ovTool;
addEventListener('keydown',e=>{if(MODE!=='god'||UIBLOCK||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;if(G.phase!=='play')return;
  if(e.code==='KeyO'){if(document.body.classList.contains('photo'))return;cycleOverlay(e.shiftKey?-1:1);}else if(e.code==='KeyZ')ovTool('o:why');else if(e.code==='KeyL')ovTool('o:law');else if(e.code==='KeyU')ovTool('o:names');});
// ---------------------------------------------------------------- hover readout
function dirW(dx,dz){const a=Math.atan2(dz,dx);return ['east','south-east','south','south-west','west','north-west','north','north-east'][Math.round(((a/TAU*8)%8+8)%8)%8];}
function tipHTML(m,x,z){
  const k=cellI(z)*GN+cellI(x);let h='';
  if(m==='svc'){const sv=svcAt(x,z),rel=relCats();h=`<h4>Services here</h4>`;const miss=[];
    for(const c of S7){const o=sv[c],needed=SVFROM[c]<=(G.era||0);
      if(o.v>=.2)h+=`<div class="r ok"><b>✓</b><span><b style="min-width:0">${SVN[c]}</b> — ${esc2(nameOf(o.src))}, ${Math.round(o.d)}u${o.eff<1?' <em>(no one works there)</em>':''}</span></div>`;
      else if(!needed)h+=`<div class="r dim"><b>·</b><span>${SVN[c]} — <em>not needed yet</em></span></div>`;
      else{h+=`<div class="r no"><b>✗</b><span><b style="min-width:0">${SVN[c]}</b> — none within reach</span></div>`;miss.push(c);}}
    if(miss.length)h+=`<div class="miss">Missing: ${esc2(SVN[miss[0]])} — ${esc2(SVMISS[miss[0]][1])}</div>`;else h+=`<div class="miss" style="color:#3f7a3a">Everything the age needs is within reach.</div>`;}
  else if(m==='hap'){let bh=null,bd=14;for(const h2 of D.homes){const d=Math.hypot(h2.x-x,h2.z-z);if(d<bd&&h2._ovH){bd=d;bh=h2;}}
    if(!bh)h=`<h4>Mood</h4><em>No homes here.</em>`;else{const v=bh._ovH;h=`<h4>Quarter mood ${Math.round(v.v)}%</h4><div class="r"><span>${esc2(nameOf(bh))}${v.rs?`, ${v.rs} folk`:' (empty)'}: their own mood ${v.base}%</span></div>`;
      const parts=[['Services',v.svc,`${v.cov}/${v.rel} kinds within reach`],['Smoke',v.smog,'smog from the works'],['Crowding',v.crowd,'homes packed close'],['The house',v.home,'quality of the home']].filter(p=>p[1]);
      for(const p of parts)h+=`<div class="r ${p[1]>0?'ok':'no'}"><b>${p[1]>0?'+':''}${p[1]}</b><span>${p[0]} <em>— ${p[2]}</em></span></div>`;
      const w=parts.filter(p=>p[1]<0).sort((a,b)=>a[1]-b[1])[0];if(w){h+=`<div class="miss">Drags it down: ${w[0].toLowerCase()}.`;if(w[0]==='Services'){const sv2=svcAt(bh.x,bh.z),mc=S7.find(c=>sv2[c].v<.2&&SVFROM[c]<=(G.era||0));if(mc)h+=' '+esc2(SVMISS[mc][1]);}h+='</div>';}}}
  else if(m==='poll'){const t=D.poll[k];let bs=null,bd=1e9;for(const s of D.polS){const d=Math.hypot(s.b.x-x,s.b.z-z);if(d<bd){bd=d;bs=s;}}
    h=`<h4>Air here</h4><div class="r"><span>${t<.06?'Clean air.':t<.3?'A light haze.':t<.65?'Smoky.':'Choking smog.'}</span></div>`;
    if(bs&&bd<70)h+=`<div class="r"><span>Nearest source: <b style="min-width:0">${esc2(nameOf(bs.b))}</b>, ${Math.round(bd)}u ${dirW(bs.b.x-x,bs.b.z-z)}.</span></div>`;
    if((G.era||0)>=5)h+=`<div class="r"><span><em>Town smog index ${Math.round(G.poll||0)}/100. Rain and forests clear it.</em></span></div>`;}
  else if(m==='traf'){const t=TRs[k]||0;h=`<h4>Footfall</h4><div class="r"><span>${t<1?'Hardly anyone comes this way.':t<8?'Quiet.':t<25?'A steady stream of walkers.':'A busy thoroughfare.'}</span></div>${ROAD[Math.round(clamp(z+HALF,0,N))*S+Math.round(clamp(x+HALF,0,N))]>.3?'<div class="r"><span><em>A worn road runs here.</em></span></div>':''}`;}
  else if(m==='land'){const v=D.land[k],z0=D.zone[k];h=`<h4>Land value</h4>`;if(!z0)h+='<em>Wild land, outside the town.</em>';else{const sv=svcAt(x,z),rel=relCats();let c=0;for(const q of rel)if(sv[q].v>=.2)c++;
      h+=`<div class="r"><span><b style="min-width:0">${v>.8?'Prized':v>.6?'Good':v>.4?'Fair':v>.25?'Modest':'Cheap'}</b> — ${esc2(ovDistrictAt(x,z))}</span></div><div class="r"><span>Services: ${c}/${rel.length} kinds${OV.wd[k]<12?' · waterfront':''}${D.poll[k]>.3?' · smoky':''}</span></div>`;}}
  else if(m==='dist'||m==='plan'){const z0=D.zone[k];h=`<h4>${m==='dist'?'District':'The plan'}</h4>`;if(!z0)h+='<em>Open country.</em>';else h+=`<div class="r"><span><b style="min-width:0">${esc2(ovDistrictAt(x,z))}</b> — ${ovZoneLabel(ZN[z0]).toLowerCase()}</span></div>`;
    if(m==='plan'&&G.plan&&G.plan.streets){let bs=null,bd=3;for(const s of G.plan.streets)for(let i=0;i<s.pts.length;i+=2){const d=Math.hypot(s.pts[i][0]-x,s.pts[i][1]-z)-s.hw;if(d<bd){bd=d;bs=s;}}if(bs)h+=`<div class="r"><span>${bs.kind==='main'?'A main street':bs.kind==='ring'?'A ring road':'A lane'}${bs.painted?' — laid':' — planned'}</span></div>`;}}
  return h;}
function tipHide(){if(tip._on){tip._on=false;tip.classList.add('hidden');}}
function updateTip(){
  const m=OV.mode;if(!m||OV.a<.4||!hover||OV.lastDone<0||UIBLOCK){tipHide();return;}
  const t=now();if(t-OV.tipT>.12||!tip._on){OV.tipT=t;const h=tipHTML(m,hover.x,hover.z);if(!h){tipHide();return;}
    if(tip._h!==h){tip._h=h;tip.innerHTML=h;tip._w=0;}if(!tip._on){tip._on=true;tip.classList.remove('hidden');tip._w=0;}
    if(!tip._w){const r=tip.getBoundingClientRect();tip._w=r.width||252;tip._ht=r.height||80;}}
  if(!tip._on||!tip._w)return;
  const px=(mouse.nx+1)/2*innerWidth,py=(1-mouse.ny)/2*innerHeight;
  tip.style.transform=`translate(${Math.max(8,px-tip._w-22)|0}px,${Math.max(8,Math.min(innerHeight-tip._ht-10,py-8))|0}px)`;}
// ---------------------------------------------------------------- recompute scheduling
// what the slower-changing pictures depend on (a cheap signature: the picture is only recomputed when it changes, and at least every 20 s)
function jobSig(m){let w=0;for(const v of G.vill)if(v.work)w++;let s=TOWNS.cur+'|'+BVER+'|'+buildings.length+'|'+(G.era|0)+'|'+w+'|'+(m==='svc'?OV.sub:'');
  if(m==='poll'||m==='land')s+='|'+Math.round(G.poll||0)+'|'+(trees.length>>4);if(m==='plan'||m==='dist'||m==='land')s+='|'+(G.plan&&G.plan.streets?G.plan.streets.length+':'+G.plan.plots.length+':'+G.plan.streets.reduce((a,q)=>a+(q.painted||0),0):0);return s;}
function schedule(t){
  if(!OV.mode)return;
  if(!OV.job&&(OV.force||t-OV.lastDone>OV.every)){const m=OV.mode,st=m==='svc'||m==='poll'||m==='land'||m==='dist'||m==='plan',sg=st?jobSig(m):null;
    if(st&&!OV.force&&sg===OV.sig&&t-OV.lastFull<20)OV.lastDone=t;// nothing that this picture depends on has changed: keep it
    else{OV.job=jobFor(m);OV.force=false;OV.jobMode=m;OV.sig=sg;OV.lastFull=t;}}
  if(OV.job){const t0=performance.now();let r;try{do{r=OV.job.next();}while(!r.done&&performance.now()-t0<2);}catch(err){console.error('overlay',err);OV.job=null;OV.lastDone=t;return;}
    if(r.done){OV.job=null;OV.lastDone=t;OV.done=(OV.done||0)+1;upload();}}}
// ---------------------------------------------------------------- 'Why is nothing happening?' diagnostics
const HAPTXT={Food:['The stores are running low.','Farms, fishers and hunters feed the town; bless the harvest or plant a Farm banner on flat ground near water.'],
  Housing:['Some folk have no proper home.','Let the folk build: keep timber and stone flowing, and level dry ground near the town.'],
  Water:['Many homes are far from a well or water.','The folk build wells once stone is available; or open a spring / pour water near the homes.'],
  Worship:['The church has no priest, or there is no church.','Plant a Worship banner and keep a free adult for the priest.'],
  Ale:['The tavern is missing or has no keeper.','Taverns need an innkeeper; grow the town and keep stone coming.'],
  Trade:['No market is trading.','A market needs a merchant; the folk raise one once the town is big enough.'],
  Safety:['Raiders threaten the town.','Smite the raiders, or build towers and a castle.'],
  Sickness:['Sickness is spreading.','Cast Heal; an apothecary and clean water help.'],Crowding:['The town is crowded.','Let new quarters be planned: flat land and more homes ease it.'],
  Smog:['Smoke from the works hangs over the town.','Cast Rain, grow forest near town, or wait for cleaner power.'],Strife:['A false prophet is dividing the folk.','Send a sign, or silence the prophet.'],Rain:['The rain has dampened spirits.','It will pass.'],
  Events:['Recent grief and fear weigh on the folk.','Festivals and good harvests restore cheer.'],Season:['The season is hard.','Winter passes; keep the stores full.'],Rations:['The folk resent the rations.','Lift the edict when the stores recover.'],
  Overwork:['The folk are tired of working the building sites.','Let the volunteer edict lapse.'],Curfew:['The curfew chafes.','Let the curfew lapse when the nights are quiet.']};
function whyStats(){const p=popN(),bs=G.vill.filter(v=>v.job==='builder').length,sites=buildings.filter(siteProj).length;
  return {p,cap:ERAS[G.era].cap,food:G.food,wood:G.wood,stone:G.stone,mk:(G.prodY.food||0)-(G.cons||0),bs,sites,beds:bedsFree(),open:openJobs()};}
function openJobs(){let want=0,got=0;const per={};for(const b of buildings){if(b.build)continue;const k=slotKey(b),sj=SLOTJ[k];if(!sj)continue;if(k==='hall'&&!b.level)continue;
    let n=sj[1];if(k==='farm'&&seasonN()===3)n=0;if(k==='tower'&&!(G.raids||popN()>=40))n=1;if(k==='lodge'&&G.era>=5)n=0;if(k==='lumber'&&G.wood>140)n=Math.min(n,1);
    const w=G.vill.filter(v=>v.work===b.id).length;want+=n;got+=Math.min(n,w);if(w<n)per[sj[0]]=(per[sj[0]]||0)+n-w;}
  return {want,got,per,adults:G.vill.filter(v=>v.age>=14&&v.age<=64&&!v.leaving&&!v.arriving).length};}
function ovWhy(){
  if(G.phase!=='play'||!G.center)return [];
  const L=[],add=(sev,key,title,why,act,loc)=>L.push({sev:Math.round(sev),key,title,why,act:act||'',loc:loc||null});
  const p=popN(),e=G.era||0,sites=buildings.filter(siteProj),ctr=G.center,cap=ERAS[e].cap,vs=G.vill.filter(v=>!v.arriving&&!v.leaving);
  const homeless=vs.filter(v=>!v.home).length,beds=bedsFree(),hs=sites.filter(s=>s.type==='house'&&s.build);
  // --- food
  const eatEst=vs.reduce((a,v)=>a+(v.age<14?.6:1),0)*(seasonN()===3?1.1:1),cons=G.cons||eatEst,made=G.prodY.food||0,known=!!G.cons||!!G.prodY.food;
  if(G.food<p*1.5&&p>=4)add(95,'famine','The stores are nearly empty',`${Math.floor(G.food)} food for ${p} folk, who eat about ${Math.round(cons)} a day${known?` (the fields, nets and hunters made ${Math.round(made)} yesterday)`:''}.`,'Bless the harvest or a field, grow forest or release game near the lodge, and consider the Ration edict.',{x:ctr.x,z:ctr.z});
  else if(known&&made<cons*.85&&dayN()>4&&seasonN()!==3&&p>=6)add(48,'foodtrend','Food is being eaten faster than it is grown',`Yesterday the folk made ${Math.round(made)} food and ate ${Math.round(cons)}. The stores hold ${Math.floor(G.food)}.`,cnt('farm')<2?'Plant a Farm banner on flat, dry ground near water.':'Bless a field, or level more flat land near water for farms.');
  if((G.fish||1)<.35&&cnt('camp','fish')+cnt('dock')>0)add(40,'fish','The waters are fished out',`Fish stocks are at ${Math.round((G.fish||1)*100)}%; fishers come home with little.`,'Widen the lake with water, or wait; the fish return slowly.');
  if(G.noGame&&cnt('lodge')>0)add(34,'game','The hunters find no game','The woods near the lodge are empty.','Release a herd near the lodge, or grow forest there.');
  // --- homes
  if(homeless>0){const sf=G.siteFail&&G.siteFail.type==='house';
    add(40+Math.min(50,homeless/Math.max(1,p)*140),'homes',`${homeless} folk have no home`,sf?'The folk cannot find good ground for a new home.':hs.length?`${hs.length} new home${hs.length>1?'s are':' is'} going up (about ${Math.round(hs.reduce((a,s)=>a+siteProj(s).done/siteProj(s).work,0)/hs.length*100)}% built); they sleep by the fire meanwhile.`
      :G.wood<8?'No homes are being built: there is no timber.':'No new home has been started yet; the planners wait for materials and free builders.',
      sf?'Flatten dry ground near the town, or plant a Settle banner where homes should go.':hs.length?'Bless a home site to speed the builders.':'Make sure there is timber (grow forest near a lumber camp) and ground.',hs[0]?{x:hs[0].x,z:hs[0].z}:{x:ctr.x,z:ctr.z});}
  else if(beds<2&&p>=6)add(30,'beds','No spare beds for newcomers','Families only move in when two or more beds are free.','Let the folk build more homes: keep timber and stone flowing.');
  if(p>=cap*.92)add(62,'cap',`${ERAS[e].name} cannot hold more than ${cap} folk`,`The town has ${p} souls.`,ERA_REQ[e+1]?`Advance to the ${ERAS[e+1].name}: ${ERA_REQ[e+1].txt}.`:'This is the last age.');
  const nx=ERA_REQ[e+1];if(nx&&!nx.ok()){const need=+((/^(\d+) folk/.exec(nx.txt)||[])[1]||0),REQB={1:['house'],2:['well','church'],3:['market','tavern'],4:['castle','tower'],5:['castle'],6:['factory','station'],7:['powerplant']},REQU={5:['steam','Steam power'],6:['electric','Electricity'],7:['computing','Thinking machines'],4:['castle','the craft of Fortification']},miss=[];
    if(need&&p<need)miss.push(`${need-p} more folk`);for(const t of (REQB[e+1]||[]))if(!hasBuilt(t))miss.push('a '+(BT[t]||t).toLowerCase()+(cnt(t)?' (being built)':''));const u=REQU[e+1];if(u&&!G.unl[u[0]])miss.push(u[1]);
    add(miss.length?(need&&p>=need?24:16):12,'era',`The ${ERAS[e+1].name} waits`,`It needs ${nx.txt}.${miss.length?` Still missing: ${miss.join(', ')}.`:''}`,'Keep the town fed and housed; the folk build what the age asks for.');}
  // --- building materials
  const nS=sites.reduce((a,s)=>{const P=siteProj(s);return a+Math.max(0,P.need.stone-P.have.stone-P.inb.stone);},0),nW=sites.reduce((a,s)=>{const P=siteProj(s);return a+Math.max(0,P.need.wood-P.have.wood-P.inb.wood);},0);
  const qs=built('quarry'),qSite=buildings.find(b=>b.type==='quarry'&&b.build);
  if(nS>0&&G.stone<Math.min(nS,20)){
    if(!qs.length)add(qSite?55:78,'stone',qSite?'No stone yet — the quarry is not finished':'No stone and no quarry',`Sites are waiting on ${Math.ceil(nS)} stone and the stores hold ${Math.floor(G.stone)}.`,qSite?'Bless the quarry site so it is finished sooner.':'Quarries are cut where boulders and rocky ground lie near the town: raise rocky hills or scatter rocks close to the hall, or plant a Settle banner nearby.',qSite?{x:qSite.x,z:qSite.z}:{x:ctr.x,z:ctr.z});
    else{const q=qs.reduce((b,o)=>Math.hypot(o.x-ctr.x,o.z-ctr.z)<Math.hypot(b.x-ctr.x,b.z-ctr.z)?o:b),dq=Math.hypot(q.x-ctr.x,q.z-ctr.z),w=G.vill.filter(v=>qs.some(o=>o.id===v.work)).length;
      add(w?44:64,'stone2',w?'Stone is short':'The quarry has no workers',w?`The quarry is ${Math.round(dq)}u from the hall${dq>40?' — a long carry':''}; ${w} cut${w>1?'':'s'} stone while ${Math.ceil(nS)} is needed.`:`No quarryman has been assigned; jobs go to food and builders first.`,w?'Be patient, or bless the quarry; a nearer quarry would help.':'Grow the town so there are free adults; bless homes to draw families.',{x:q.x,z:q.z});}}
  if(nW>0&&G.wood<Math.min(nW,12)){const lc=built('camp').filter(b=>b.variant==='lumber');
    add(G.noTrees||!lc.length?70:46,'wood',!lc.length?'No timber and no lumber camp':G.noTrees?'The woodcutters cannot find trees':'Timber is short',`Sites need ${Math.ceil(nW)} wood; the stores hold ${Math.floor(G.wood)}.`,!lc.length?'The folk raise a lumber camp where the forest stands; plant trees near the town.':'Grow forest near the lumber camp (Grow forest, T).',lc[0]?{x:lc[0].x,z:lc[0].z}:null);}
  // --- sites that are stuck
  const tc=typeof compOfPt==='function'?compOfPt(ctr.x,ctr.z):0;let ns=0;
  for(const s of sites.slice().sort((a,b)=>(siteProj(b)._idle||0)-(siteProj(a)._idle||0))){if(ns>=3)break;const P=siteProj(s),pr=Math.round(P.done/P.work*100),idle=P._idle||0,bl=G.vill.filter(v=>v.job==='builder'&&v.site===s.id).length;
    const nw=Math.max(0,Math.ceil(P.need.wood-P.have.wood)),nst=Math.max(0,Math.ceil(P.need.stone-P.have.stone)),dd=Math.round(Math.hypot(s.x-ctr.x,s.z-ctr.z));
    const cut=tc&&compOfPt(s.x,s.z)!==tc;let why=null,act='';
    if(cut){why='it cannot be reached on foot from the hall (water or cliffs cut it off).';act='Level a causeway with Flatten/Raise, or drain the water between.';}
    else if(idle>=3){why=nw&&G.wood<nw?`it needs ${nw} more wood and the stores have ${Math.floor(G.wood)}.`:nst&&G.stone<nst?`it needs ${nst} more stone and the stores have ${Math.floor(G.stone)}.`:bl?`${bl} builder${bl>1?'s':''} assigned but nothing is moving.`:'no builder has taken it up.';
      act=bl?'Bless the site; builders work faster and it needs fewer materials.':'Bless the site; free builders choose blessed sites first.';}
    if(!why)continue;ns++;add(36+Math.min(30,idle*2.5)+(cut?25:0),'site'+s.id,`The ${siteName(s)} is stalled (${pr}% built)`,`${idle>=3?`Nothing has moved for about ${Math.max(1,Math.round(idle*3/24))} day${idle*3/24>=1.5?'s':''}: `:''}${why}${dd>34?` It stands ${dd}u from the hall.`:''}`,act,{x:s.x,z:s.z});}
  {const bs2=G.vill.filter(v=>v.job==='builder'),st2=sites.filter(s=>(siteProj(s)._idle||0)>=3);
    if(bs2.length&&st2.length&&sites.length>st2.length&&bs2.every(v=>st2.some(s=>s.id===v.site))&&sites.some(s=>!st2.includes(s)&&!G.vill.some(v=>v.site===s.id)))
      add(58,'starved','Every builder is stuck on a starved site',`${bs2.length} builder${bs2.length>1?'s are':' is'} waiting for materials while other sites stand untouched.`,'Bless a site that has its materials, or bring stone and timber (see the entries above).');}
  // --- people who are lost
  const lost=vs.filter(v=>/find a way/.test(v.thought||'')).length;if(lost>=2)add(52,'lost',`${lost} folk cannot find a way to where they are going`,'Water, cliffs or a new building have cut the walking routes.','Look for a river or cliff between the homes and the work: level a ford with Flatten, or drain the water.');
  // --- jobs
  const oj=openJobs();if(oj.want>oj.got&&oj.want-oj.got>=2){const lst=Object.entries(oj.per).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([j,n])=>`${JOBN[j]||j} ×${n}`).join(', ');
    add(oj.adults<oj.want?36:28,'jobs',`${oj.want-oj.got} jobs stand empty`,`${lst}. The town has ${oj.adults} working-age adults for ${oj.want} places${sites.length?' and the building sites':''}.`,oj.adults<oj.want?'More families must arrive: keep homes and food plentiful and the folk happy.':'Jobs are filled at dawn and noon; they will settle.');}
  // --- prayers
  for(const pr of G.prayers){const D2=PRAYERS[pr.k];if(!D2)continue;const hl=Math.max(0,pr.until-G.t);add(50+(pr.urgent?22:0)+(hl<24?10:0),'pray'+pr.k,`A prayer waits: “${pr.txt.replace(/\s+/g,' ')}”`,`${hl>=24?Math.ceil(hl/24)+' days':Math.ceil(hl)+' hours'} left; an unanswered prayer saddens the folk and feeds doubt.`,D2.how);}
  // --- happiness
  const hf=Object.entries(G.hapF||{}).filter(([k,v])=>v<=-3).sort((a,b)=>a[1]-b[1]).slice(0,3);
  for(const [k,v] of hf){if(k==='Food'||k==='Housing')continue;let t=HAPTXT[k]||[`${k} weighs on the folk.`,''];
    if(k==='Worship'){const ch=built('church')[0];t=[ch?'The church has no priest.':'There is no church.',ch?'Priests come from free adults; keep the town growing.':'Plant a Worship banner and keep stone flowing.'];}
    if(k==='Ale'){const tv=built('tavern')[0];t=[tv?'The tavern has no keeper.':'There is no tavern.',HAPTXT.Ale[1]];}
    if(k==='Trade'){const mk=built('market')[0];t=[mk?'The market has no merchant.':'There is no market.',HAPTXT.Trade[1]];}
    add(24+Math.min(30,-v*2.4),'hap'+k,`${k} costs ${-v} points of happiness`,t[0],t[1]);}
  if(G.hap<45&&p>=6)add(44,'unhappy',`The folk are unhappy (${Math.round(G.hap)}%)`,G.hap<28?'Families are beginning to leave.':'Newcomers will not come while happiness is below 45.',hf[0]?(HAPTXT[hf[0][0]]||[0,'Ease the biggest cause above.'])[1]:'Ease the causes listed here.');
  // --- disasters
  const fire=buildings.find(b=>b.fire);if(fire)add(86,'fire',`Fire at the ${nameOf(fire)}`,'It will burn down unless the rain or a well’s bucket chain reaches it.','Cast Rain, or Bless the building to put it out.',{x:fire.x,z:fire.z});
  if(G.flooded>0)add(72,'flood',`Floodwater is in ${G.flooded} building${G.flooded>1?'s':''}`,'They collapse if the water stays.','Drain the water or raise the ground.');
  if(G.raid&&G.raid.active)add(90,'raid','Raiders are in the town','The folk are barred in their homes.','Smite them, or let the guards fight.');
  const sick=vs.filter(v=>v.sick).length;if(sick>=Math.max(3,p*.1))add(58,'sick',`${sick} folk are sick`,'The sickness spreads within households.','Cast Heal; an apothecary helps.');
  if((G.poll||0)>45)add(46,'smog','Smog hangs over the town',`Smog index ${Math.round(G.poll)}/100; the river runs grey and the old and young cough.`,'Cast Rain, grow forest near the town, or let cleaner power replace the old plants.');
  if(G.faith<15)add(30,'faith','Your Faith is nearly spent','Miracles and blessings cost Faith, which grows with the folk’s happiness and worship.','Answer prayers and keep the folk content.');
  // --- planners
  const fc=Object.entries(G.failCool||{}).filter(([k,t])=>t>G.t&&!/^(house)$/.test(k));
  if(fc.length){const [k,t]=fc[0];add(34,'fail','The planners found no room for a '+(k==='camplumber'?'lumber camp':k==='campfish'?'fishing camp':(BT[k]||k).toLowerCase()),`They will look again in ${Math.ceil(t-G.t)} hours.`,'Flatten dry ground near town, clear a hillside, or plant a banner; keep forbidden zones small.');}
  const kv=buildings.filter(b=>!b.build&&b.type==='market'&&!G.vill.some(v=>v.work===b.id));if(kv.length&&p>=8)add(20,'mkt','The market has no merchant','Without a merchant the stalls stand empty.','It will fill when a free adult is assigned.',{x:kv[0].x,z:kv[0].z});
  L.sort((a,b)=>b.sev-a.sev);return L;}
window.ovWhy=ovWhy;
// ---------------------------------------------------------------- the panel
const why=document.createElement('div');why.id='ovWhy';why.className='panel hidden';document.body.appendChild(why);
{const st=document.createElement('style');st.textContent=`
#ovWhy,#ovLaw{position:fixed;top:84px;right:298px;width:366px;max-height:calc((100vh - 112px) / var(--ui,1));overflow-y:auto;padding:12px 14px 12px;z-index:5;font-size:15px;transform-origin:100% 0;transform:scale(var(--ui,1))}
#ovWhy h2,#ovLaw h2{font-family:Cinzel,serif;font-size:16px;margin:0 22px 2px 0;color:var(--wood)}
#ovWhy .sub,#ovLaw .sub{font-style:italic;color:var(--ink2);font-size:13.5px;margin-bottom:8px}
#ovWhy .x,#ovLaw .x{position:absolute;right:8px;top:8px}
.wy{display:flex;gap:9px;padding:7px 0;border-top:1px dotted #b89a6a}.wy:first-of-type{border-top:0}
.wy i{flex:none;width:10px;height:10px;border-radius:50%;margin-top:6px;border:1px solid rgba(0,0,0,.35)}
.wy .t{font-weight:600;color:var(--ink);line-height:1.2}.wy .w{color:var(--ink2);font-size:14px;line-height:1.28;margin-top:1px}.wy .a{font-size:14px;margin-top:2px;color:#3f5f2a;line-height:1.28}.wy .a:before{content:"Try: ";font-style:italic;color:var(--ink2)}
.wy button{font-size:12.5px;padding:0 7px;margin-top:3px}
#ovWhy .st{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:13px;color:var(--ink2);border-top:1px solid #b89a6a;padding-top:6px;margin-top:6px}
#ovWhy .good{padding:10px 2px;color:#3f5f2a;font-size:15px}
`;document.head.appendChild(st);}
function whyHTML(){const L=ovWhy(),S=whyStats();OV.whyN=L.filter(x=>x.sev>=60).length;
  let h=`<button class="mini x" data-w="close">×</button><h2>What holds ${esc2(G.town)} back?</h2><div class="sub">${L.length?'Ranked by how much it matters right now.':'A quiet moment.'}</div>`;
  if(!L.length)h+=`<div class="good">Nothing is holding the town back. Homes, food, materials and hands are in balance; the folk are getting on with their lives.</div>`;
  for(const it of L.slice(0,9)){const c=it.sev>=70?'#c0392b':it.sev>=45?'#d99a2b':it.sev>=30?'#c8bd5a':'#9aa58a';
    h+=`<div class="wy"><i style="background:${c}"></i><div><div class="t">${esc2(it.title)}</div><div class="w">${esc2(it.why)}</div>${it.act?`<div class="a">${esc2(it.act)}</div>`:''}${it.loc?`<button data-x="${Math.round(it.loc.x)}" data-z="${Math.round(it.loc.z)}">Show me</button>`:''}</div></div>`;}
  if(L.length>9)h+=`<div class="sub" style="margin-top:6px">…and ${L.length-9} smaller matters.</div>`;
  h+=`<div class="st"><span>Folk ${S.p}/${S.cap}</span><span>Food ${Math.floor(S.food)} (${S.mk>=0?'+':''}${Math.round(S.mk)}/day)</span><span>Wood ${Math.floor(S.wood)} (+${Math.round(G.prodY.wood||0)}/day)</span><span>Stone ${Math.floor(S.stone)} (+${Math.round(G.prodY.stone||0)}/day)</span><span>Builders ${S.bs}, sites ${S.sites}</span><span>Free beds ${S.beds}</span><span>Jobs ${S.open.got}/${S.open.want}</span></div>`;return h;}
function drawWhy(){if(!OV.whyOpen){why.classList.add('hidden');return;}const h=whyHTML();why.classList.remove('hidden');if(why._h!==h){const sc=why.scrollTop;why._h=h;why.innerHTML=h;why.scrollTop=sc;
    for(const b of why.querySelectorAll('button[data-w]'))b.onclick=()=>toggleWhy();
    for(const b of why.querySelectorAll('button[data-x]'))b.onclick=()=>{G.follow=null;cam.tx=+b.dataset.x;cam.tz=+b.dataset.z;cam.dist=Math.min(cam.dist,90);};}}
function toggleWhy(){OV.whyOpen=!OV.whyOpen;if(OV.whyOpen&&OV.lawOpen)toggleLaw();OV.whyT=0;drawWhy();syncBtns();}
// per-building lines in the inspector (what is it doing, and why not more?)
function ovInspLines(b){
  if(!b||!buildings.includes(b))return '';const rows=[],ctr=G.center,P=siteProj(b);
  const row=(t,c)=>rows.push(`<div class="small"${c?` style="color:${c}"`:''}>${t}</div>`);
  if(P){const bl=G.vill.filter(v=>v.job==='builder'&&v.site===b.id).length,idle=P._idle||0,dd=ctr?Math.round(Math.hypot(b.x-ctr.x,b.z-ctr.z)):0;
    const nw=Math.max(0,Math.ceil(P.need.wood-P.have.wood-P.inb.wood)),ns=Math.max(0,Math.ceil(P.need.stone-P.have.stone-P.inb.stone));
    row(`Builders here: <b>${bl}</b> · ${dd}u from the hall · materials ${Math.floor(P.have.wood)}/${P.need.wood} wood, ${Math.floor(P.have.stone)}/${P.need.stone} stone`);
    if(P.inb.wood+P.inb.stone>0)row(`On the way: ${Math.round(P.inb.wood)} wood, ${Math.round(P.inb.stone)} stone`);
    if(idle>=3){const needW=nw&&G.wood<nw,needS=ns&&G.stone<ns,why2=needW&&needS?`waiting for timber (${Math.floor(G.wood)} in store) and stone (${Math.floor(G.stone)})${cnt('quarry')?'':', and there is no quarry'}`:needW?`waiting for timber (${Math.floor(G.wood)} in store)`:needS?(cnt('quarry')?'waiting for stone from the quarry':'waiting for stone and there is no quarry'):bl?'builders are slow to reach it':'no builder has come yet';row(`<b>Stalled:</b> ${why2}. Blessing helps.`,'#9a4a1a');}
    if(ctr&&typeof compOfPt==='function'&&compOfPt(b.x,b.z)!==compOfPt(ctr.x,ctr.z))row('<b>Cut off:</b> there is no walking route from the hall.','#9a4a1a');}
  else if(b.type==='house'){const rs=G.vill.filter(v=>v.home===b.id);row(rs.length?`Lived in by ${rs.length} (${rs.filter(v=>v.age>=14).length} adult${rs.filter(v=>v.age>=14).length===1?'':'s'}); room for ${capOf(b)}.`:`Empty — ${bedsFree()>0&&!G.vill.some(v=>!v.home&&!v.arriving)?'no one needs a home right now.':'newcomers will fill it.'}`);
    const lv=b.level||0;if(!b.upg&&lv<(G.era>=7?6:G.era>=6?5:G.era>=5?4:G.era>=2?3:1))row('Will be improved when timber and stone allow (bless it to go first).');}
  else{const sj=SLOTJ[slotKey(b)];
    if(sj&&!(b.type==='hall'&&!b.level)){const w=G.vill.filter(v=>v.work===b.id).length,slots=sj[1];row(`${JOBN[sj[0]]||sj[0]}s: <b>${w}/${slots}</b>${w<slots?` — ${openJobs().adults<=G.vill.filter(v=>v.work).length?'too few free adults':'jobs are filled at dawn and noon'}`:''}`,w<slots?'#9a4a1a':null);}
    if(b.type==='quarry'&&ctr){const d=Math.round(Math.hypot(b.x-ctr.x,b.z-ctr.z));row(`${d}u from the hall${d>40?' — a long carry for stone':''}. Yesterday’s stone: ${Math.round(G.prodY.stone||0)}.`);}
    if(b.type==='camp'&&b.variant==='lumber')row(G.noTrees?'<b>No trees left within reach.</b> Grow forest nearby.':`Yesterday’s timber: ${Math.round(G.prodY.wood||0)}.`,G.noTrees?'#9a4a1a':null);
    if(b.type==='farm'&&!b.build){const f=farmRate(b);row(f<=0?(wAt(b.x,b.z)>.15?'<b>Flooded:</b> nothing grows.':seasonN()===3?'Winter: nothing grows.':'The field is lying fallow.'):`Fertility ${Math.round(f/ (.64*workMul())*100)}% of a good field.`);}
    if(b.type==='market'&&!b.build){const gs=G.goods||{},ks=Object.keys(gs).filter(k=>gs[k]>1);row(ks.length?`Goods in store: ${ks.slice(0,5).map(k=>`${GOODS[k]?GOODS[k].n:k} ${Math.floor(gs[k])}`).join(', ')}.`:'The stalls are bare: no workshop is supplying goods.');}
    if(b.type==='factory'||b.type==='powerplant'||b.type==='gasworks')row(`Adds to the smog — see the Smog sight.`);
    const def=SVT[b.type];if(def&&!b.build)row(`Serves: ${def.map(d=>SVN[d[0]].toLowerCase()).join(', ')} within ~${Math.round(def[0][1])}u.`,'#4a6a3a');}
  return rows.join('');}
window.ovInspLines=ovInspLines;
{const _gi=godInspector;godInspector=function(){_gi();try{
    const b=selected||((tool==='inspect'||tool==='bless')&&!G.follow?hoverB:null);let el=insp.querySelector('#ovInsp');
    if(!b||G.follow||!b.info||!buildings.includes(b)){if(el)el.remove();return;}
    const h=ovInspLines(b);if(!h){if(el)el.remove();return;}
    if(!el){el=document.createElement('div');el.id='ovInsp';el.style.cssText='margin-top:6px;border-top:1px dotted #b89a6a;padding-top:5px';const acts=insp.querySelector('.acts');if(acts)insp.insertBefore(el,acts);else insp.appendChild(el);}
    if(el._h!==h){el._h=h;el.innerHTML=h;}}catch(err){console.error('ovInsp',err);}};}
// ---------------------------------------------------------------- district identity: names, floating signs
const SG={info:null,t:-99,key:'',spr:new Map(),tex:new Map()};
function distName(z,has,e){const h=t=>has.has(t);
  switch(ZN[z]){
    case 'civic':return e<=0?'The Camp':e<=2?'The Green':'Old Town';
    case 'mix':return h('market')?(e<=5?'Market Quarter':e===6?'High Street':'The Concourse'):(e<=2?'Crossways':e<=5?'Trade Row':e===6?'Business District':'Commerce Spire');
    case 'res':return e<=1?'The Hearths':e<=4?'Hearthside':e===5?'Terrace Row':e===6?'Parkside':'Garden Terraces';
    case 'ind':return e<=1?'Craft Corner':e<=4?'Mill Row':e<=6?'The Works':'Fabrication Row';
    case 'farm':return e<=5?'The Fields':h('vertical_farm')?'Vertical Farms':'Greenbelt';
    case 'harbour':return e<=0?'The Landing':'Dockside';}
  return '';}
function computeDistricts(){
  const e=G.era||0;D.dockB=buildings.filter(b=>!b.build&&(b.type==='dock'||b.type==='shipyard'||b.type==='fishmkt'));const acc={};
  for(const b of buildings){let z=(b.type==='dock'||b.type==='shipyard'||b.type==='fishmkt')?6:zoneOfPoint(b.x,b.z);if(!z)continue;
    if(b.type==='hall')z=1;const a=acc[z]||(acc[z]={x:0,z:0,n:0,has:new Set()});a.x+=b.x;a.z+=b.z;a.n++;a.has.add(b.type);}
  const out={};for(const k in acc){const a=acc[k],z=+k;if(a.n<(z===1?1:2))continue;let name=distName(z,a.has,e);
    {const pk={mix:'market',harbour:'landing',farm:'fields',ind:'mill'}[ZN[z]],pl=G.cu&&G.cu.places?G.cu.places.find(p=>p.k===(ZN[z]==='civic'&&e<=2?'hearth':pk)&&(ZN[z]!=='civic'||e<=2)):null;
      if(pl&&pl.name){name=pl.name.charAt(0).toUpperCase()+pl.name.slice(1);if(ZN[z]==='mix'&&!/Cross|Square|Market/.test(name))name+=' Market';}}
    if(typeof cuDistrictName==='function'){try{const n=cuDistrictName(ZN[z],{x:a.x/a.n,z:a.z/a.n,era:e,name,town:G.town});if(n)name=String(n);}catch(err){}}
    out[z]={name,x:a.x/a.n,z:a.z/a.n,n:a.n};}
  SG.info=out;SG.t=now();SG.key=TOWNS.cur+':'+e+':'+buildings.length;}
function ovDistrictAt(x,z){const zi=zoneOfPoint(x,z);if(!SG.info)computeDistricts();return (SG.info[zi]&&SG.info[zi].name)||distName(zi,new Set(),G.era||0)||'Open country';}
function signTex(name){let t=SG.tex.get(name);if(t)return t;const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');
  let fs=44;g.textAlign='center';g.textBaseline='middle';do{g.font=`600 ${fs}px Cinzel, "EB Garamond", Georgia, serif`;fs-=2;}while(g.measureText(name.toUpperCase()).width>440&&fs>18);
  const w=Math.min(496,g.measureText(name.toUpperCase()).width+44);g.fillStyle='rgba(38,26,14,.5)';const r=18,x0=256-w/2,y0=18,h=60;g.beginPath();g.moveTo(x0+r,y0);g.arcTo(x0+w,y0,x0+w,y0+h,r);g.arcTo(x0+w,y0+h,x0,y0+h,r);g.arcTo(x0,y0+h,x0,y0,r);g.arcTo(x0,y0,x0+w,y0,r);g.closePath();g.fill();
  g.strokeStyle='rgba(232,200,130,.55)';g.lineWidth=2;g.stroke();g.fillStyle='#f6e8c4';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5;g.fillText(name.toUpperCase(),256,50);
  t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;SG.tex.set(name,t);return t;}
function updateSigns(dt){
  const show=MODE==='god'&&G.phase==='play'&&!G.menu&&(OV.names||OV.mode==='dist');
  if(!show){for(const s of SG.spr.values())s.visible=false;return;}
  if(!SG.info||now()-SG.t>6||SG.key.split(':')[0]!==String(TOWNS.cur)||SG.key.split(':')[1]!==String(G.era||0))computeDistricts();
  const d=cam.dist,vis=OV.mode==='dist'?1:clamp((d-38)/22,0,1)*clamp((250-d)/60,0,1);
  const used=new Set();
  for(const k in SG.info){const I=SG.info[k],id=I.name;used.add(id);let s=SG.spr.get(id);
    if(!s){s=new THREE.Sprite(new THREE.SpriteMaterial({map:signTex(id),transparent:true,depthTest:false,depthWrite:false,fog:false}));s.renderOrder=22;scene.add(s);SG.spr.set(id,s);}
    const w=d*.21;s.scale.set(w,w*96/512,1);s.position.set(I.x,hAt(I.x,I.z)+8+d*.09,I.z);s.material.opacity=vis*.9;s.visible=vis>.02;}
  for(const [id,s] of SG.spr)if(!used.has(id))s.visible=false;
  // signs that would overlap on screen are stacked
  const me=camera.matrixWorld.elements,rx=me[0],rz=me[2],fw=Math.hypot(me[8],me[10])||1,fx=-me[8]/fw,fz=-me[10]/fw,sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch),list=[...SG.spr.values()].filter(s=>s.visible).sort((a,b)=>a.position.x*rx+a.position.z*rz-(b.position.x*rx+b.position.z*rz));
  for(let i=1;i<list.length;i++){const b=list[i];for(let pass=0;pass<3;pass++){let hit=false;for(let j=0;j<i;j++){const a=list[j],dx=b.position.x-a.position.x,dz=b.position.z-a.position.z,lat=Math.abs(dx*rx+dz*rz),vert=Math.abs((dx*fx+dz*fz)*sp+(b.position.y-a.position.y)*cp);
        if(lat<(a.scale.x+b.scale.x)*.5*.96&&vert<b.scale.y*1.15){b.position.y+=b.scale.y*1.25/Math.max(.3,cp);hit=true;}}if(!hit)break;}}}
// ---------------------------------------------------------------- edicts: a few counsels the Spirit can give a settlement (they use the same levers the game already has)
const EDICTS=[
  {k:'ration',n:'Ration the stores',cost:25,days:6,fx:'The folk eat a quarter less. They resent it a little, unless they are starving, when they understand.',hint:()=>G.food<popN()*4?'Famine is near.':''},
  {k:'volunteers',n:'Call for volunteers',cost:20,days:5,fx:'Neighbours lend a hand: building sites rise faster. Fields go untended (a little less food) and tired folk grumble.',hint:()=>buildings.filter(siteProj).length>=3?'Many sites are waiting.':''},
  {k:'curfew',n:'Set a night watch',cost:15,days:8,fx:'Watchmen walk the lanes: fires start and spread less. The folk grumble at the early lamps.',hint:()=>(G.raids>0&&G.raidCool<dayN()+6)||seasonN()===1&&G.drought?'Raiders or a dry summer threaten.':''},
  {k:'granary',n:'Open the granaries',cost:20,days:3,fx:'A feast for all: spirits soar, but the stores empty faster. It ends on its own if food runs low.',hint:()=>G.food>popN()*14?'The stores are overflowing.':''},
  {k:'farmers',n:'Favour farmers and fishers',cost:30,days:8,fx:'The tithe of tools and timber goes to fields and nets: about 15% more food, a little less timber.',hint:()=>(G.prodY.food||0)<(G.cons||0)?'Food is being eaten faster than it grows.':''}];
const edOn=k=>!!(G.edicts&&G.edicts[k]>G.t);
window.ovEdict=edOn;
PERKEYS.push('edicts');SAVE_PER.push('edicts');
function proclaim(k){const D2=EDICTS.find(e=>e.k===k);if(!D2||G.phase!=='play')return;if(!G.edicts)G.edicts={};
  if(edOn(k)){delete G.edicts[k];chron(`The Spirit lifted the edict: ${D2.n}.`);}
  else{if(k==='granary'&&G.food<popN()*3){toast('The stores are too low to open the granaries');return;}if(!spend(D2.cost))return;G.edicts[k]=G.t+D2.days*24;chron(`By the Spirit’s counsel: ${D2.n}. It will last ${D2.days} days.`,true);sfx('chime');}
  drawLaw(true);}
window.ovProclaim=proclaim;
{const _h=hourTick;hourTick=function(){_h.apply(this,arguments);const E=G.edicts;if(!E||G.menu)return;
    for(const k in E)if(E[k]<=G.t){delete E[k];const D2=EDICTS.find(e=>e.k===k);if(D2)chron(`The edict “${D2.n}” lapsed.`);}
    const p=popN(),cons=(G.cons||0)/24;
    if(E.ration)G.food+=cons*.25;
    if(E.granary){if(G.food<p*2){delete E.granary;chron('The granaries were closed: the stores ran too low.');}else G.food=Math.max(0,G.food-cons*.2);}
    if(E.volunteers){for(const b of buildings){const P=siteProj(b);if(!P)continue;if(!G.vill.some(v=>v.job==='builder'&&v.site===b.id))continue;P.done=Math.min(P.work*matFrac(P),P.done+.6);}G.food=Math.max(0,G.food-p*.012);}
    if(E.farmers){const f=(G.prodY.food||0)/24*.15;G.food+=f;G.prod.food+=f;G.wood=Math.max(0,G.wood-(G.prodY.wood||0)/24*.1);}};}
{const _e=eraHapF;eraHapF=function(f){_e(f);const E=G.edicts;if(!E)return;const t=G.t;
    if(E.ration>t&&G.food>=popN()*2)f.Rations=-3;if(E.volunteers>t)f.Overwork=-2;if(E.curfew>t)f.Curfew=-3;if(E.granary>t)f.Feast=6;};}
{const _f=flam;flam=function(b){const v=_f(b);return G.edicts&&G.edicts.curfew>G.t?v*.5:v;};}
const law=document.createElement('div');law.id='ovLaw';law.className='panel hidden';document.body.appendChild(law);
function drawLaw(force){if(!OV.lawOpen){law.classList.add('hidden');return;}
  let h=`<button class="mini x" data-w="close">×</button><h2>Counsel for ${esc2(G.town)}</h2><div class="sub">The folk heed the Spirit’s counsel for a time. Each costs Faith (you have ${Math.floor(G.faith)}), and each has a price of its own.</div>`;
  for(const D2 of EDICTS){const on=edOn(D2.k),left=on?Math.ceil((G.edicts[D2.k]-G.t)/24):0,hint=D2.hint();
    h+=`<div class="wy"><i style="background:${on?'#3f8a4a':hint?'#d99a2b':'#b8aa86'}"></i><div style="flex:1"><div class="t">${D2.n}${on?` <span style="font-weight:400;color:#3f5f2a">· in force, ${left} day${left===1?'':'s'} left</span>`:''}</div><div class="w">${esc2(D2.fx)}</div>${hint&&!on?`<div class="a" style="font-style:italic">${esc2(hint)}</div>`:''}
      <button data-e="${D2.k}">${on?'Lift the edict':`Proclaim — ${D2.cost} Faith, ${D2.days} days`}</button></div></div>`;}
  if(force||law._h!==h){law._h=h;law.innerHTML=h;for(const b of law.querySelectorAll('button[data-w]'))b.onclick=()=>toggleLaw();for(const b of law.querySelectorAll('button[data-e]'))b.onclick=()=>proclaim(b.dataset.e);}}
function toggleLaw(){OV.lawOpen=!OV.lawOpen;if(OV.lawOpen&&OV.whyOpen)toggleWhy();drawLaw(true);syncBtns();}
// ---------------------------------------------------------------- the visible economy (cosmetic, driven by the real data, only near the camera)
// Attached hand-carts follow builders on their real fetch-and-haul walks; wagons shuttle between camps, quarries, farms, docks and the
// store along real paths; caravans trail the merchants of trade missions; markets get stalls, merchants and goods that follow G.goods;
// docks show crates and porters while a boat is in. ovHaul(from,to,kind) lets other systems (the railway) put a wagon on the road.
const ecoGrp=new THREE.Group();scene.add(ecoGrp);
const ECO={on:true,dkList:[],dkClean:false,drn:null,near:[],lastG:0,spawnT:-9,mkT:-9,wkT:-9,wk:new Map(),runs:[],hauls:new Map(),cars:new Map(),geo:new Map(),pool:new Map(),pathBudget:0,mk:new Map(),dk:new Map(),ids:0};
window.ovState=OV;window.ovEco=ECO;
const K={wood:0x8a6a44,woodD:0x5e4429,woodL:0xa88658,iron:0x4b4c52,rope:0xb8a070,canvas:0xe8dfc4,canvasD:0xcdbf98,ox:0x6e4c36,oxL:0xa38468,horse:0x7a5232,horseD:0x4a3020,stone:0xa39c8e,stoneD:0x8a8478,sack:0xc9b48a,fishB:0x9a7a48,fish:0xaebcc4,red:0xa8402f,blue:0x3a5f8a,green:0x5a7e3a,white:0xeef0ee,cyan:0x6fe3ff,glass:0xbfe9ff};
const fr=(v,a,b)=>Math.min(b,Math.max(a,v));
// -- load shapes, centred on (0,y,zc) over a bed w wide and l long
function loadOn(B,kind,y,zc,w,l){
  if(kind==='wood'){for(let r=0;r<3;r++)for(let i=0;i<(r===2?2:3);i++){const x=(i-(r===2?.5:1))*.29;B.hcyl(0,y+.12+r*.23,zc+x*(l/w>1.8?1.5:1),.13,w*.98,r%2?K.woodL:K.wood,'x',7);}}
  else if(kind==='stone'){for(let i=0;i<6;i++){const x=((i%3)-1)*w*.3,z=zc+(i<3?-1:1)*l*.22;B.box(x,y,z,w*.28,.3,l*.36,i%2?K.stone:K.stoneD,(i*.37)%.5);}for(let i=0;i<2;i++)B.box((i-.5)*w*.34,y+.3,zc,w*.3,.26,l*.36,K.stone,.2);}
  else if(kind==='food'||kind==='grain'){for(let i=0;i<6;i++){const x=((i%3)-1)*w*.3,z=zc+(i<3?-1:1)*l*.22;B.sph(x,y+.14,z,.24,.17,.22,K.sack);}B.sph(0,y+.38,zc,.22,.15,.2,K.sack);}
  else if(kind==='fish'){for(let i=0;i<4;i++){const x=((i%2)-.5)*w*.5,z=zc+((i>>1)-.5)*l*.4;B.cyl(x,y,z,.22,.22,K.fishB,8);B.sph(x,y+.24,z,.19,.07,.17,K.fish);}}
  else if(kind==='goods'){for(let i=0;i<4;i++){const x=((i%2)-.5)*w*.5,z=zc+((i>>1)-.5)*l*.4;B.box(x,y,z,.46,.4,.46,K.wood);B.box(x,y+.4,z,.4,.02,.4,K.woodD);}B.cyl(0,y,zc,.2,.4,K.woodD,8);}
}
function wheel(B,x,y,z,r,col,t=.09){B.hcyl(x,y,z,r,t,col,'x',10);B.hcyl(x,y,z,r*.25,t+.05,K.iron,'x',6);}
function ox(B,z,col,horns){B.box(0,.55,z,.62,.62,1.3,col);B.box(0,.95,z+.75,.3,.34,.34,col);B.box(0,.85,z+1.0,.22,.2,.2,K.oxL);if(horns){B.box(-.2,1.18,z+.78,.06,.2,.06,K.canvas);B.box(.2,1.18,z+.78,.06,.2,.06,K.canvas);}
  for(const sx of [-.2,.2])for(const sz of [-.5,.5])B.box(sx,0,z+sz,.14,.55,.14,K.woodD);B.box(0,1.0,z-.2,.9,.1,.1,K.woodD);}
function horse(B,z,col){B.box(0,.8,z,.42,.5,1.2,col);B.box(0,1.25,z+.75,.22,.5,.26,col);B.box(0,1.45,z+1.0,.18,.2,.34,col);B.box(0,1.05,z+.42,.1,.3,.1,K.horseD);
  for(const sx of [-.12,.12])for(const sz of [-.45,.45])B.box(sx,0,z+sz,.1,.62,.1,K.horseD);B.box(0,.95,z-.7,.07,.5,.07,K.horseD,0);}
// -- the vehicles. Local frame: +z is the way it travels; the origin is where it is hitched / the front of the shafts.
const VEH={
  travois(B,kind){B.beam(-.4,.1,-1.8,-.1,.62,.2,.06,K.woodD);B.beam(.4,.1,-1.8,.1,.62,.2,.06,K.woodD);B.box(0,.2,-1.1,.7,.05,1.1,K.rope);if(kind)loadOn(B,kind,.26,-1.0,.7,1.0);},
  handcart(B,kind){B.box(0,.62,-1.0,.95,.12,1.5,K.wood);for(const s of [-.5,.5])B.box(s,.7,-1.0,.06,.3,1.5,K.woodD);B.box(0,.7,-1.74,1.0,.3,.06,K.woodD);wheel(B,-.58,.36,-1.0,.36,K.woodD);wheel(B,.58,.36,-1.0,.36,K.woodD);
    B.beam(-.32,.68,-.3,-.28,.85,.4,.05,K.woodD);B.beam(.32,.68,-.3,.28,.85,.4,.05,K.woodD);B.box(0,.85,.4,.7,.05,.05,K.woodD);if(kind)loadOn(B,kind,.74,-1.0,.85,1.3);},
  trolley(B,kind){B.box(0,.5,-.9,1.0,.1,1.5,0x8a909a);B.box(0,.4,-.9,.9,.1,1.3,K.iron);wheel(B,-.55,.22,-1.5,.22,K.iron,.12);wheel(B,.55,.22,-1.5,.22,K.iron,.12);wheel(B,-.55,.22,-.3,.22,K.iron,.12);wheel(B,.55,.22,-.3,.22,K.iron,.12);
    B.beam(-.4,.55,-.1,-.3,1.0,.5,.05,K.blue);B.beam(.4,.55,-.1,.3,1.0,.5,.05,K.blue);B.box(0,1.0,.5,.7,.06,.06,K.blue);if(kind)loadOn(B,kind,.6,-.9,.9,1.3);},
  sled(B,kind){B.box(0,.5,-.9,1.0,.08,1.6,K.white);B.box(0,.4,-.9,.9,.1,1.4,0x9aa3ad);B.box(0,.54,-.9,.96,.015,1.5,K.cyan);B.box(0,.34,-.9,.7,.04,1.2,K.cyan);if(kind)loadOn(B,kind,.58,-.9,.9,1.4);},
  oxcart(B,kind){ox(B,.2,K.ox,true);B.box(0,.82,-1.7,1.5,.14,2.5,K.wood);for(const s of [-.76,.76]){for(let i=0;i<4;i++)B.box(s,.95,-2.6+i*.55,.06,.38,.1,K.woodD);B.box(s,1.0,-1.7,.05,.06,2.5,K.woodD);}B.box(0,1.0,-2.95,1.5,.36,.06,K.woodD);
    wheel(B,-.86,.5,-1.3,.5,K.woodD,.12);wheel(B,.86,.5,-1.3,.5,K.woodD,.12);wheel(B,-.86,.5,-2.3,.5,K.woodD,.12);wheel(B,.86,.5,-2.3,.5,K.woodD,.12);B.beam(0,.85,-.6,0,.95,.2,.08,K.woodD);if(kind)loadOn(B,kind,.9,-1.7,1.3,2.3);},
  wagon(B,kind){horse(B,.3,K.horse);B.box(0,.92,-1.8,1.7,.14,3.0,K.wood);for(const s of [-.86,.86]){B.box(s,1.15,-1.8,.06,.5,3.0,K.woodD);}B.box(0,1.15,-3.3,1.7,.5,.06,K.woodD);
    wheel(B,-.95,.55,-.9,.55,K.woodD,.12);wheel(B,.95,.55,-.9,.55,K.woodD,.12);wheel(B,-.95,.62,-2.7,.62,K.woodD,.12);wheel(B,.95,.62,-2.7,.62,K.woodD,.12);B.beam(-.3,.9,-.3,-.25,1.0,.1,.05,K.woodD);B.beam(.3,.9,-.3,.25,1.0,.1,.05,K.woodD);
    if(kind==='goods'||kind==='food'){for(let i=0;i<4;i++){const a=-.8+i*.55;B.box(-.86,1.7,-1.8+(a)*1.0,.05,.06,.05,K.woodD);}B.box(0,2.2,-1.8,1.9,.06,3.0,K.canvas);B.box(-.9,1.8,-1.8,.06,.8,3.0,K.canvas);B.box(.9,1.8,-1.8,.06,.8,3.0,K.canvas);}
    else if(kind)loadOn(B,kind,1.06,-1.8,1.5,2.7);},
  steam(B,kind){B.box(0,.75,-.5,1.5,.25,2.4,K.iron);B.hcyl(0,1.35,-.1,.5,1.7,0x3b3f46,'z',10);B.cyl(0,1.65,.6,.16,.9,K.iron,8);B.box(0,1.95,-.9,1.35,.1,1.0,K.red);B.box(0,1.4,-1.4,1.3,1.0,.9,K.red);
    for(const sz of [.5,-.9]){wheel(B,-.82,.46,sz,.46,K.woodD,.16);wheel(B,.82,.46,sz,.46,K.woodD,.16);}B.box(0,.8,-2.7,1.55,.14,2.2,K.woodD);for(const s of [-.78,.78])B.box(s,1.0,-2.7,.06,.34,2.2,K.wood);if(kind)loadOn(B,kind,.9,-2.7,1.3,2.0);},
  truck(B,kind){B.box(0,.5,-.1,1.7,.5,2.2,K.iron);B.box(0,1.0,.65,1.7,1.0,.9,K.blue);B.box(0,1.35,1.12,1.5,.4,.06,K.glass);B.box(0,.85,1.1,1.5,.2,.06,0x2a2e36);B.box(0,1.0,-.5,1.75,1.7,2.6,kind==='wood'?K.wood:kind==='stone'?K.stoneD:kind==='fish'?0x7aa0b8:K.white);B.box(0,1.0,-.5,1.78,.14,2.6,K.blue);
    for(const sz of [.7,-1.0]){wheel(B,-.9,.4,sz,.4,0x2a2a2e,.22);wheel(B,.9,.4,sz,.4,0x2a2a2e,.22);}B.box(0,.28,1.2,1.2,.2,.06,0x2a2a2e);B.box(-.55,.6,1.22,.2,.12,.06,0xfff2c0);B.box(.55,.6,1.22,.2,.12,.06,0xfff2c0);},
  pod(B,kind){B.sph(0,1.0,0,.95,.62,1.9,K.white,1);B.cyl(0,.5,0,.8,.1,0x8b97a4,12);B.box(0,1.05,0,1.96,.08,3.0,K.cyan);B.sph(0,1.4,.9,.5,.28,.5,K.glass,1);B.box(0,.4,0,1.2,.05,2.6,K.cyan);if(kind)B.box(0,1.65,-.4,.9,.28,1.4,kind==='wood'?K.wood:kind==='stone'?K.stoneD:kind==='fish'?0x7aa0b8:0xd8c068);},
  mulepack(B,kind){horse(B,0,0x8a7a68);B.box(-.3,1.0,0,.22,.4,.7,K.sack);B.box(.3,1.0,0,.22,.4,.7,K.sack);B.box(0,1.28,0,.6,.15,.7,K.canvasD);},
  van(B,kind){B.box(0,.45,0,1.5,.4,2.4,0x9aa3ad);B.box(0,1.0,.4,1.5,1.1,1.5,K.white);B.box(0,1.18,1.14,1.3,.45,.06,K.glass);B.box(0,1.0,-.9,1.52,.1,1.4,K.green);B.box(0,.82,-.9,1.52,.8,1.4,K.white);for(const sz of [.8,-.7]){wheel(B,-.78,.34,sz,.34,0x2a2a2e,.18);wheel(B,.78,.34,sz,.34,0x2a2a2e,.18);}}
};
function vehGeo(veh,kind){const key=veh+':'+(kind||'');let g=ECO.geo.get(key);if(g)return g;const B=new Builder(Math.random,.03);VEH[veh](B,kind);const m=B.mesh(matB,true);g=m.geometry;g.computeBoundingSphere();ECO.geo.set(key,g);return g;}
function getMesh(veh,kind){const key=veh+':'+(kind||'');const st=ECO.pool.get(key);let m=st&&st.pop();if(!m){m=new THREE.Mesh(vehGeo(veh,kind),matB);m.castShadow=true;m.receiveShadow=true;m.userData.key=key;ecoGrp.add(m);}m.visible=true;return m;}
function putMesh(m){if(!m)return;m.visible=false;const key=m.userData.key;let st=ECO.pool.get(key);if(!st)ECO.pool.set(key,st=[]);st.push(m);}
const vehAttached=e=>e<=0?'travois':e<=4?'handcart':e<=6?'trolley':'sled';
const vehAmbient=e=>e<=0?null:e<=2?'oxcart':e<=4?'wagon':e===5?'steam':e===6?'truck':'pod';
const nearCam=(x,z,R)=>cam.dist<240&&Math.hypot(x-cam.tx,z-cam.tz)<(R||120);
// -- trails: where a walker has been, so a cart can follow the same road
function trailSeed(h,v){h.tr=[];for(let i=0;i<10;i++)h.tr.push([v.x-Math.sin(v.rot||0)*i*.5,v.z-Math.cos(v.rot||0)*i*.5]);h.lx=v.x;h.lz=v.z;}
function trailPush(h,x,z){const dx=x-h.lx,dz=z-h.lz,d=Math.hypot(dx,dz);if(d<.45)return;const n=Math.min(40,Math.floor(d/.45));for(let i=1;i<=n;i++)h.tr.unshift([h.lx+dx*i/n,h.lz+dz*i/n]);h.lx=x;h.lz=z;if(h.tr.length>70)h.tr.length=70;}
function trailAt(h,x0,z0,dist,out){let px=x0,pz=z0,acc=0;const T=h.tr;for(let i=0;i<T.length;i++){const q=T[i],d=Math.hypot(q[0]-px,q[1]-pz);if(d<1e-4)continue;if(acc+d>=dist){const f=(dist-acc)/d;out[0]=px+(q[0]-px)*f;out[1]=pz+(q[1]-pz)*f;return out;}acc+=d;px=q[0];pz=q[1];}out[0]=px;out[1]=pz;return out;}
const _p1=[0,0],_p2=[0,0];
function placeCart(m,h,x0,z0,dA,dB,lift){trailAt(h,x0,z0,dA,_p1);trailAt(h,x0,z0,dB,_p2);const y=hAt(_p1[0],_p1[1])+(lift||0);let rot=Math.atan2(_p1[0]-_p2[0],_p1[1]-_p2[1]);if(!isFinite(rot)||(Math.abs(_p1[0]-_p2[0])+Math.abs(_p1[1]-_p2[1]))<.05)rot=h.rot||0;h.rot=rot;
  m.position.set(_p1[0],y,_p1[1]);const y2=hAt(_p2[0],_p2[1])+(lift||0);m.rotation.set(Math.atan2(y2-y,Math.max(.5,dB-dA))*.8,rot,0,'YXZ');}
// ---------------------------------------------------------------- builders' hand-carts (they follow the real walks)
const _gt=goTo;
goTo=function(v,x,z,cb,tb){const r=_gt(v,x,z,cb,tb);
  if(r&&v.kind==='v'&&ECO.on){
    if(v.job==='builder'&&v._res&&!v._ovH&&G.era>=0&&Math.hypot(v.x-x,v.z-z)>7&&nearCam(v.x,v.z,130))noteHaul(v);
    else if(v.mission&&!v._ovC&&nearCam(v.x,v.z,170))noteCaravan(v);}
  return r;};
function noteHaul(v){const h={v,era:G.era||0,kind:v._res.m,tr:null,mesh:null,park:0,loaded:false,rot:v.rot||0};trailSeed(h,v);v._ovH=h;ECO.hauls.set(v,h);}
function noteCaravan(v){const m=v.mission,era=G.era||0,n=clamp(Math.ceil((m.ax||20)/28),1,3),h={v,era,n,tr:null,meshes:[],kind:m.cx==='food'?'food':m.cx,rot:v.rot||0};trailSeed(h,v);v._ovC=h;ECO.cars.set(v,h);}
window.ovCaravan=function(v){if(v&&v.mission&&!v._ovC&&nearCam(v.x,v.z,170))noteCaravan(v);};
function updHauls(dt){
  for(const [v,h] of ECO.hauls){
    const gone=v._gone;
    const active=!gone&&(v._res||v.carry);
    if(!active&&!h.park&&!gone){h.park=now();if(h.mesh){putMesh(h.mesh);h.mesh=getMesh(vehAttached(h.era),null);h.mesh.position.set(v.x,hAt(v.x,v.z),v.z);h.mesh.rotation.set(0,h.rot,0);h.parked=true;}}
    if(gone||(!active&&h.park&&now()-h.park>5)||!ECO.on||!nearCam(v.x,v.z,150)){if(h.mesh)putMesh(h.mesh);h.mesh=null;ECO.hauls.delete(v);v._ovH=null;continue;}
    if(!active){continue;}
    if(h.park){h.park=0;h.parked=false;trailSeed(h,v);}
    trailPush(h,v.x,v.z);const want=v.carry?h.kind:null,era=h.era;
    if(!h.mesh||h.mk!==(want||'')){if(h.mesh)putMesh(h.mesh);h.mesh=getMesh(vehAttached(era),want);h.mk=want||'';}
    const dA=era<=0?.5:1.15;placeCart(h.mesh,h,v.x,v.z,dA,dA+1.9,era>=7?.35+Math.sin(TT*3+v.id)*.05:0);
    h.mesh.visible=!v.hidden&&!v.inside;}}
function updCaravans(dt){
  for(const [v,h] of ECO.cars){
    const gone=v._gone||!v.mission;if(gone||!ECO.on||!nearCam(v.x,v.z,190)){for(const m of h.meshes)putMesh(m);h.meshes.length=0;ECO.cars.delete(v);v._ovC=null;continue;}
    trailPush(h,v.x,v.z);const era=h.era,veh=era<=2?'oxcart':era<=4?'wagon':era===5?'wagon':era===6?'van':'pod';const kind=v.carry?(v.carry==='loot'?'food':v.carry):null;
    if(h.mk!==(kind||'')||!h.meshes.length){for(const m of h.meshes)putMesh(m);h.meshes.length=0;h.mk=kind||'';for(let i=0;i<h.n;i++)h.meshes.push(getMesh(i===0||era<=2&&i%2===0?veh:(era<=4?'mulepack':veh),i===0?kind:(veh==='van'||veh==='pod'?kind:null)));}
    h.meshes.forEach((m,i)=>{const d0=2.6+i*5.2;placeCart(m,h,v.x,v.z,d0,d0+2.6,era>=7?.5+Math.sin(TT*2.4+i)*.08:0);m.visible=!v.hidden&&!v.inside;});}}
// ---------------------------------------------------------------- wagons on the road (data-driven; ovHaul puts one on a real path)
function endpoint(o){return o&&o.x!=null?[o.x,o.z]:null;}
function startRun(src,dst,kind,veh,opt){
  if(!ECO.on||ECO.runs.length>=10)return false;const a=endpoint(src),b=endpoint(dst);if(!a||!b)return false;if(!nearCam((a[0]+b[0])/2,(a[1]+b[1])/2,130))return false;
  let pts=null;const air=veh==='pod'||(opt&&opt.air);
  if(air)pts=[[a[0],a[1]],[b[0],b[1]]];
  else{if(ECO.pathBudget<=0)return false;ECO.pathBudget--;const sa=src.type?doorOf(src):a,sb=dst.type?doorOf(dst):b;const p=findPath(sa[0],sa[1],sb[0],sb[1],dst.id||0,src.id||0);if(!p||p.length<2&&Math.hypot(sa[0]-sb[0],sa[1]-sb[1])<6)return false;pts=[[sa[0],sa[1]],...p];}
  let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(len<8)return false;
  const run={id:++ECO.ids,pts,i:1,x:pts[0][0],z:pts[0][1],rot:0,kind,veh,air,phase:'load',t:.25,dir:1,mesh:null,speed:opt&&opt.speed||({oxcart:5,wagon:8,steam:9,truck:15,pod:17}[veh]||7),src:src.id||0,smoke:0};
  const dx=pts[1][0]-pts[0][0],dz=pts[1][1]-pts[0][1];run.rot=Math.atan2(dx,dz);ECO.runs.push(run);return true;}
window.ovHaul=function(from,to,kind,opt){const veh=(opt&&opt.veh)||vehAmbient(G.era||0);if(!veh)return false;ECO.pathBudget=Math.max(ECO.pathBudget,1);return startRun(from,to,kind||'goods',veh,opt);};
function updRuns(dtG,dt){
  for(let q=ECO.runs.length-1;q>=0;q--){const r=ECO.runs[q];
    if(!ECO.on||!nearCam(r.x,r.z,170)){if(r.mesh)putMesh(r.mesh);ECO.runs.splice(q,1);continue;}
    if(!r.mesh){r.mesh=getMesh(r.veh,r.phase==='go'||r.phase==='load'?r.kind:null);r.meshK=r.phase==='go'||r.phase==='load'?r.kind:null;}
    if(r.phase==='load'||r.phase==='unload'){r.t-=dtG;if(r.t<=0){if(r.phase==='load'){r.phase='go';}else{r.phase='back';r.dir=-1;putMesh(r.mesh);r.mesh=getMesh(r.veh,null);r.i=r.pts.length-2;}}}
    else{let step=r.speed*dtG,guard=0;const dy=r.air?1:0;
      while(step>0&&guard++<8){const tgt=r.pts[r.i];if(!tgt){break;}const dx=tgt[0]-r.x,dz=tgt[1]-r.z,d=Math.hypot(dx,dz);if(d<=step){r.x=tgt[0];r.z=tgt[1];step-=d;r.i+=r.dir;if(r.i>=r.pts.length||r.i<0){if(r.phase==='go'){r.phase='unload';r.t=.25;}else{r.phase='done';}break;}}
        else{r.x+=dx/d*step;r.z+=dz/d*step;const tr=Math.atan2(dx,dz);r.rot+=angDiff(tr,r.rot)*Math.min(1,dt*7);step=0;}}
      if(r.phase==='done'){putMesh(r.mesh);ECO.runs.splice(q,1);continue;}
      if(r.veh==='steam'&&(r.smoke-=dt)<=0){r.smoke=.28;spawn(r.x-Math.sin(r.rot)*-.6,hAt(r.x,r.z)+2.8,r.z-Math.cos(r.rot)*-.6,0,1.1,0,2,1.1,.62,.62,.62,0);}}
    const y=hAt(r.x,r.z)+(r.veh==='pod'?1.4+Math.sin(TT*2+r.id)*.12:0);r.mesh.position.set(r.x,y,r.z);r.mesh.rotation.set(0,r.rot,0);
    if(r.veh!=='pod'&&r.phase==='go'||r.phase==='back')r.mesh.position.y+=Math.abs(Math.sin(TT*7+r.id))*.025;}}
// -- which sources send wagons: only places with workers, in the working day, near the camera
function sources(){const out=[];for(const b of buildings){if(b.build||b.upg)continue;let kind=null;
    if(b.type==='camp'&&b.variant==='lumber')kind='wood';else if(b.type==='quarry')kind='stone';else if(b.type==='farm')kind='food';else if(b.type==='dock'||b.type==='fishmkt')kind='fish';else if(b.type==='mill'||b.type==='granary'||b.type==='bakery')kind='food';
    else if(typeof CHAINS!=='undefined'&&CHAINS[b.type]&&!['gasworks','scriptorium'].includes(b.type))kind='goods';
    if(kind)out.push([b,kind]);}return out;}
function spawnRuns(){
  const h=hod();if(h<6.3||h>17.8||G.paused)return;const veh=vehAmbient(G.era||0);if(!veh)return;const ctr=G.center;if(!ctr)return;
  if(now()-ECO.wkT>2){ECO.wkT=now();ECO.wk.clear();for(const v of G.vill)if(v.work)ECO.wk.set(v.work,(ECO.wk.get(v.work)||0)+1);}
  const mk=built('market')[0];
  for(const [b,kind] of sources()){if(ECO.runs.length>=6)break;if(!nearCam(b.x,b.z,115))continue;if((b._ovNext||0)>G.t)continue;if(!(ECO.wk.get(b.id)>0)){b._ovNext=G.t+2;continue;}
    const dst=(kind==='wood'||kind==='stone')?ctr:(mk&&Math.hypot(mk.x-b.x,mk.z-b.z)>8?mk:ctr);if(!dst||dst===b||Math.hypot(dst.x-b.x,dst.z-b.z)<10){b._ovNext=G.t+4;continue;}
    if(ECO.pathBudget<=0&&veh!=='pod')break;
    const w=ECO.wk.get(b.id)||1;b._ovNext=G.t+1.6+rnd()*2.4+(3-Math.min(3,w))*.6;
    if(startRun(b,dst,kind,veh,null))break;}}
// ---------------------------------------------------------------- merchants, stalls, goods
const WARES=[null,null,['pottery','leather','cloth','grain','fish'],['bread','cloth','ale','pottery','grain','leather'],['bread','cloth','ale','books','pottery','grain'],['bread','grain','tools','cloth','books'],['kiosk','vend','kiosk','vend'],['pod','vend','pod','vend']];
const STRIPE=[[0xb0412f,0xe8dfc4],[0x3a5f8a,0xe8dfc4],[0xc9a24a,0xe8dfc4],[0x5a7e3a,0xe8dfc4],[0x7a3a5a,0xe8dfc4]];
function wareGoods(B,kind,n,x0,y,z0,w){// n items 0..3 of a ware along the counter
  for(let i=0;i<n;i++){const x=x0+(i-(n-1)/2)*(w/(Math.max(3,n)))*.9,z=z0;
    switch(kind){case 'bread':B.sph(x,y+.07,z,.17,.08,.1,0xc8924a);B.sph(x,y+.07,z+.18,.15,.07,.09,0xb67f3a);break;
      case 'pottery':B.cyl(x,y,z,.13,.28,0xb86a3a,7);B.cyl(x,y+.28,z,.07,.08,0xa05a2e,7);break;
      case 'cloth':B.hcyl(x,y+.1,z,.1,.5,[0xa8402f,0x3a5f8a,0xc9a24a][i%3],'x',7);break;
      case 'leather':B.box(x,y,z,.44,.07+i*.04,.34,[0x6e4a30,0x8a6240,0xd8cfb8][i%3],i*.3);break;
      case 'ale':B.cyl(x,y,z,.18,.42,0x7a5030,8);B.box(x,y+.15,z,.38,.03,.38,K.iron);break;
      case 'grain':B.sph(x,y+.14,z,.2,.15,.16,K.sack);break;
      case 'fish':B.box(x,y,z,.42,.07,.3,0x8a98a0);B.sph(x,y+.08,z,.16,.05,.09,K.fish);break;
      case 'books':B.box(x,y+.02*i,z,.3,.07+.03*i,.22,[0x7a3a2a,0x3a4a6a,0x3a5a3a][i%3]);break;
      case 'tools':B.box(x,y,z,.36,.05,.14,K.iron);B.box(x,y,z+.1,.05,.08,.3,K.woodD);break;
      default:B.box(x,y,z,.3,.2,.3,K.wood);}}}
function stallGeo(era,kind,lvl,seed){const B=new Builder(Math.random,.04);const n=Math.max(0,Math.min(3,lvl)),st=STRIPE[seed%STRIPE.length];
  if(era<=4){// trestle stall with a striped cloth awning (era 2 stalls are plain skins and baskets)
    for(const sx of [-.95,.95]){B.cyl(sx,0,.62,.05,2.2,K.woodD,6);B.cyl(sx,0,-.62,.05,2.55,K.woodD,6);}
    B.box(0,.76,.2,2.0,.12,.9,K.wood);B.box(0,0,.2,1.8,.76,.8,K.woodD);B.box(0,.2,.2,1.8,.5,.82,K.wood);B.box(0,.82,-.62,2.0,1.5,.06,st[0]);
    for(let i=0;i<4;i++)B.boxC(-.75+i*.5,2.5,.0,.5,.05,1.7,i%2?st[1]:st[0],-.3,0,0);B.box(0,2.07,.9,2.0,.14,.04,st[0]);
    wareGoods(B,kind,Math.max(1,n),0,.88,.15,1.8);if(n>1)wareGoods(B,kind,n-1,0,.88,.45,1.6);
    if(era<=2){B.box(-.5,1.3,-.55,.5,.7,.05,0xd8cfb8);B.box(.5,1.3,-.55,.4,.6,.05,0x6e4a30);}}
  else if(era===5){// grocer: brick counter, scalloped awning, chalk sign, lamp
    B.box(0,0,.2,2.2,.9,.9,0x8a4a3a);B.box(0,.9,.2,2.3,.1,1.0,K.woodL);for(const sx of [-1.05,1.05])B.cyl(sx,0,.7,.05,2.4,0x2e3338,6);B.box(0,.95,-.62,2.3,1.6,.08,0x6a6258);
    for(let i=0;i<5;i++)B.boxC(-.9+i*.45,2.55,.0,.45,.05,1.8,i%2?K.white:st[0],-.34,0,0);for(let i=0;i<5;i++)B.box(-.9+i*.45,2.2,1.0,.45,.1,.04,i%2?K.white:st[0]);
    B.box(0,1.4,-.5,1.2,.55,.04,0x2a3a30);B.box(1.0,.1,.9,.5,.5,.5,K.wood);B.box(-1.0,.1,.9,.5,.4,.5,K.woodD);B.cyl(1.05,2.3,.7,.1,.2,0xffe6a0,6);
    wareGoods(B,kind,Math.max(1,n),0,1.0,.2,2.0);}
  else if(era===6){// kiosk with a canopy, and a vending machine beside it
    B.box(0,0,0,2.0,2.1,1.6,K.white);B.box(0,.1,.82,2.0,.3,.06,0x9aa3ad);B.box(0,1.0,.82,1.5,.8,.06,K.glass);B.box(0,.9,.96,1.7,.1,.4,st[0]);B.box(0,2.1,.1,2.3,.14,2.2,st[0]);B.box(0,2.1,1.2,2.3,.14,.04,K.white);B.box(0,1.6,.83,1.1,.18,.04,0x2e3338);
    wareGoods(B,kind==='kiosk'?'bread':'pottery',Math.max(1,n),0,1.0,.95,1.3);
    B.box(1.75,0,.1,.9,2.0,.8,K.red);B.box(1.75,1.0,.52,.6,.8,.04,K.glass);B.box(1.75,.3,.52,.5,.2,.04,0x2e3338);B.box(1.75,1.9,.0,.9,.12,.8,0x2e3338);}
  else{// pods: a pale pod with a lit band, a vending column, a hologram sign
    B.sph(0,1.05,0,1.15,.95,1.15,K.white,1);B.cyl(0,.75,0,1.2,.1,K.cyan,16);B.sph(0,1.05,1.0,.7,.55,.2,K.glass,1);B.cyl(0,0,0,.9,.18,0x8b97a4,14);B.box(0,.2,.8,1.2,.35,.2,K.cyan);
    B.box(1.9,0,0,.6,2.1,.5,0xd8e0e6);B.box(1.9,.6,.27,.4,.9,.04,K.cyan);B.box(1.9,2.1,0,.6,.06,.5,K.cyan);B.box(-1.9,1.9,0,.9,.4,.04,K.cyan);B.box(-1.9,0,0,.12,1.9,.12,0x8b97a4);
    wareGoods(B,'cloth',0,0,0,0,1);}
  const m=B.mesh(matB,true);m.geometry.computeBoundingSphere();return m.geometry;}
function figGeo(era,job,seed){const B=new Builder(Math.random,.03),skin=[0xe8c8a8,0xd8b090,0xc89878,0xb88a68][seed%4],tun=era>=6?[0x2f6b6a,0x2f4a8e,0xe8e2d2][seed%3]:[0x2f6b6a,0x6b2f6b,0x2f4a8e,0x8a4a2a][seed%4];
  B.cyl(-.09,0,0,.07,.55,era>=6?0x3a3d48:0x4a3a2a,6);B.cyl(.09,0,0,.07,.55,era>=6?0x3a3d48:0x4a3a2a,6);B.cyl(0,.5,0,.2,.6,tun,8);B.sph(0,1.25,0,.12,.13,.12,skin,1);
  B.box(-.24,.8,.1,.07,.07,.4,skin,0);B.box(.24,.8,.1,.07,.07,.4,skin,0);
  if(era<=4)B.cyl(0,1.34,0,.2,.05,[0xd8c070,0x6a4a2a,0xeee8dc][seed%3],8);else if(era===5)B.cyl(0,1.34,0,.14,.1,0x2a2a2e,8);else B.box(0,1.36,.04,.2,.06,.22,K.blue);
  if(era>=6||seed%2===0)B.box(0,.5,.14,.36,.5,.04,K.white);// apron / smock
  const m=B.mesh(matB,true);m.geometry.computeBoundingSphere();return m.geometry;}
const figCache=new Map();
function getFig(era,seed){const key=(era>=7?7:era>=6?6:era>=5?5:era>=3?3:2)+':'+(seed%12);let g=figCache.get(key);if(!g){g=figGeo(era,'m',seed);figCache.set(key,g);}const m=new THREE.Mesh(g,matB);m.castShadow=true;return m;}
function marketSig(b){const gs=G.goods||{},era=G.era||0,pop=popN();let s=era+'|'+(G.vill.some(v=>v.work===b.id)?1:0)+'|'+Math.floor(pop/25);const u=Math.max(3,pop*.12);for(const k of Object.keys(gs).sort())s+=k+Math.min(3,Math.floor(gs[k]/u));return s;}
function freeSpot(b,x,z,rad,others){if(wAt(x,z)>.1)return false;for(const o of buildings){if(o===b||o.build&&false)continue;if(Math.hypot(o.x-x,o.z-z)<(o.r||2)+rad)return false;}for(const q of others)if(Math.hypot(q[0]-x,q[1]-z)<3.1)return false;
  const h=hAt(x,z);for(const [dx,dz] of [[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]])if(Math.abs(hAt(x+dx,z+dz)-h)>.7)return false;return true;}
function buildMarket(b,rec){
  const era=G.era||0,pop=popN(),gs=G.goods||{};const sig=marketSig(b);if(rec&&rec.sig===sig)return rec;
  if(rec){for(const c of rec.g.children.slice()){rec.g.remove(c);if(c.geometry&&c.geometry.userData.own)c.geometry.dispose();}}else{rec={g:new THREE.Group(),sig:'',figs:[],stalls:[]};ecoGrp.add(rec.g);}
  rec.sig=sig;rec.figs.length=0;rec.stalls.length=0;
  const n=clamp(2+Math.floor(pop/28),2,era>=6?4:5),wares=WARES[Math.min(7,Math.max(2,era))],u=Math.max(3,pop*.12),others=[];
  const dd=[Math.sin(b.rot),Math.cos(b.rot)],base=Math.atan2(dd[0],dd[1]);// the door side first
  const offs=[0,.55,-.55,1.1,-1.1,1.65,-1.65,2.2,-2.2,2.75,-2.75,3.14],R0=(b.r||4.5)+3.2;let k=0;
  for(const a0 of offs){if(rec.stalls.length>=n)break;const a=base+a0;
    for(const R of [R0,R0+1.7,R0+3.4,R0-.8]){const x=b.x+Math.sin(a)*R,z=b.z+Math.cos(a)*R;if(!freeSpot(b,x,z,2.2,others))continue;others.push([x,z]);rec.stalls.push({x,z,a});break;}}
  rec.stalls.forEach((s,i)=>{let kind=wares[(i+b.id)%wares.length];if(b.type==='fishmkt')kind='fish';else if(era<=5){const keys=Object.keys(gs).filter(q=>gs[q]>.5&&['bread','ale','cloth','leather','pottery','books','tools'].includes(q));if(keys.length&&(i+b.id)%3!==2)kind=keys[(i+b.id)%keys.length];}
    const lvl=(era>=6)?2:Math.min(3,Math.max(kind in gs?Math.floor(gs[kind]/u):era<=3?1:2,1));
    const sg=stallGeo(era,kind,lvl,i+b.id);sg.userData.own=true;const m=new THREE.Mesh(sg,matB);m.castShadow=true;m.receiveShadow=true;m.position.set(s.x,hAt(s.x,s.z),s.z);m.rotation.y=s.a;rec.g.add(m);
    const f=getFig(era,i*5+b.id);f.position.set(s.x-Math.sin(s.a)*.5,hAt(s.x,s.z),s.z-Math.cos(s.a)*.5);f.rotation.y=s.a;rec.g.add(f);rec.figs.push({m:f,x:f.position.x,z:f.position.z,a:s.a,ph:Math.random()*6});});
  // piles of crates and barrels by the market grow with what the town holds
  const tot=Object.values(gs).reduce((a,v)=>a+(v||0),0),np=clamp(Math.round(tot/Math.max(6,pop*.35)),0,6);
  if(np>0){const B=new Builder(Math.random,.04);for(let i=0;i<np;i++){const a=base+Math.PI+(i-np/2)*.35,R=(b.r||4.5)+1.6,x=Math.sin(a)*R,z=Math.cos(a)*R,y=hAt(b.x+x,b.z+z)-hAt(b.x,b.z);
      if(era>=7){B.box(x,y,z,.7,.5,.7,K.white);B.box(x,y+.5,z,.7,.06,.7,K.cyan);}else if(era>=6){B.box(x,y,z,.8,.5,.8,0x9aa3ad);B.box(x,y+.5,z,.7,.4,.7,K.white);}else{if(i%2)B.cyl(x,y,z,.28,.55,K.woodD,8);else{B.box(x,y,z,.6,.45,.6,K.wood);B.box(x+.05,y+.45,z,.5,.4,.5,K.woodL,.3);}}}
    const pm=B.mesh(matB,true);pm.geometry.userData.own=true;pm.position.set(b.x,hAt(b.x,b.z),b.z);rec.g.add(pm);}
  return rec;}
function updMarkets(){
  const live=new Set(),era=G.era||0;let hasMk=false;for(const b of buildings)if(b.type==='market'&&!b.build)hasMk=true;
  // before a market is raised, a few stalls set up on the town square (the folk trade where they gather)
  let sq=null;if(!hasMk&&era>=2&&popN()>=20&&G.plan&&G.plan.plaza&&G.center){const p=G.plan.plaza;sq=ECO.sq||(ECO.sq={id:900001,type:'market',r:4.4,info:{name:'Town square stalls'}});
    if(Math.hypot((sq.x||0)-p.x,(sq.z||0)-p.z)>.5||ECO.sqEra!==era){ECO.sqEra=era;sq.x=p.x;sq.z=p.z;sq.rot=Math.atan2(G.center.x-p.x,G.center.z-p.z);const old=ECO.mk.get(sq);if(old)old.sig='';}}
  const list=sq?buildings.concat([sq]):buildings;
  for(const b of list){if(b.type!=='market'&&b.type!=='fishmkt')continue;if(b.build||b.upg)continue;live.add(b);
    const near=ECO.on&&nearCam(b.x,b.z,115),rec=ECO.mk.get(b);
    if(!near){if(rec)rec.g.visible=false;continue;}
    ECO.mk.set(b,buildMarket(b,rec));ECO.mk.get(b).g.visible=true;}
  for(const [b,rec] of ECO.mk)if(!live.has(b)||b._gone){ecoGrp.remove(rec.g);rec.g.traverse(o=>{if(o.geometry&&o.isMesh&&o.geometry.userData.own)o.geometry.dispose();});ECO.mk.delete(b);}}
function animMarkets(){const h=hod(),open=h>=6.5&&h<18.5,e=G.era||0;
  for(const [b,rec] of ECO.mk){if(!rec.g.visible)continue;rec.figs.forEach((f,i)=>{f.m.visible=open;if(!open)return;const t=TT*(e>=7?.6:1.1)+f.ph;f.m.rotation.y=f.a+Math.sin(t*.7)*.25;f.m.position.y=hAt(f.x,f.z)+Math.abs(Math.sin(t*1.3))*.02;});}}
// -- drones (the Futuristic age): a few hover between the market pods
const drones=[];let droneGeo=null;
function updDrones(dt){const e=G.era||0;const mk=ECO.drn||(ECO.drn=ECO.on&&e>=7?[...ECO.mk].filter(([b,r])=>r.g.visible&&r.stalls.length):[]);
  if(!droneGeo){const B=new Builder(Math.random,.02);B.box(0,0,0,.5,.12,.5,K.white);B.box(0,.1,0,.2,.1,.2,K.cyan);for(const sx of [-.3,.3])for(const sz of [-.3,.3])B.box(sx,.1,sz,.28,.02,.04,0x2e3338);B.box(0,-.12,0,.26,.12,.26,0xd8c068);droneGeo=B.mesh(matB,true).geometry;}
  while(drones.length>mk.length*2){const d=drones.pop();ecoGrp.remove(d.m);}
  while(drones.length<mk.length*2){const m=new THREE.Mesh(droneGeo,matB);ecoGrp.add(m);drones.push({m,ph:Math.random()*6,k:drones.length});}
  drones.forEach((d,i)=>{const [b,r]=mk[Math.floor(i/2)];if(!r){d.m.visible=false;return;}d.m.visible=true;const t=TT*.5+d.ph,R=(b.r||4)+2.5;const x=b.x+Math.cos(t+i)*R*(1+.2*Math.sin(t*2)),z=b.z+Math.sin(t+i)*R*(1+.2*Math.sin(t*2)),y=hAt(x,z)+4.2+Math.sin(TT*2+i)*.4;
    d.m.position.set(x,y,z);d.m.rotation.set(Math.sin(TT*3+i)*.08,-t-i,0);});}
// ---------------------------------------------------------------- docks: porters and crates while a boat is in
function dockGeo(era,fish){const B=new Builder(Math.random,.04),n=clamp(Math.round(fish*4),0,4);for(let i=0;i<n;i++){const x=(i%2)*.7-.35,z=Math.floor(i/2)*.7;if(era>=6){B.box(x,0,z,.6,.5,.6,[K.blue,K.red,K.green,0x9aa3ad][i%4]);}else{B.box(x,0,z,.55,.35,.5,K.wood);B.sph(x,.36,z,.2,.07,.17,K.fish);}}
  const m=B.mesh(matB,true);m.geometry.computeBoundingSphere();return m.geometry;}
function updDocks(dtG){
  const live=new Set(),era=G.era||0,open=hod()>=5.5&&hod()<19;
  for(const b of ECO.dkList){if(b._gone||b.build||b.upg)continue;live.add(b);if(!ECO.on||!nearCam(b.x,b.z,110)||!b._berth){const r=ECO.dk.get(b);if(r)r.g.visible=false;continue;}
    let r=ECO.dk.get(b);if(!r){r={g:new THREE.Group(),fig:null,crates:null,sig:'',u:0,load:true};ecoGrp.add(r.g);ECO.dk.set(b,r);}r.g.visible=true;
    const mine=typeof boats!=='undefined'?boats.filter(o=>o.dock===b.id):[];for(const bo of mine){if(bo._ovS==='back'&&bo.state==='moor')r.unload=G.t+1.8;bo._ovS=bo.state;}
    const moored=mine.some(o=>o.state==='moor'),work=moored&&open&&((r.unload||0)>G.t||(b._crew||0)>0);
    const fq=Math.round(clamp(G.fish||1,0,1)*4)+':'+era;if(r.sig!==fq){r.sig=fq;if(r.crates)r.g.remove(r.crates);const [dx,dz]=doorOf(b);r.crates=new THREE.Mesh(dockGeo(era,clamp(G.fish||1,0,1)),matB);r.crates.castShadow=true;r.crates.position.set(dx+Math.cos(b.rot)*1.4,hAt(dx,dz)+.1,dz-Math.sin(b.rot)*1.4);r.crates.rotation.y=b.rot;r.g.add(r.crates);}
    if(!r.fig){r.fig=getFig(era,b.id);r.g.add(r.fig);const B=new Builder(Math.random,.03);if(era>=6){B.box(0,0,0,.4,.3,.4,K.blue);}else{B.cyl(0,0,0,.2,.2,K.fishB,8);B.sph(0,.22,0,.18,.07,.15,K.fish);}r.bk=new THREE.Mesh(B.mesh(matB,true).geometry,matB);r.bk.position.set(0,.75,.32);r.fig.add(r.bk);}
    r.fig.visible=work;if(work){const [dx,dz]=doorOf(b),bx=b._berth[0],bz=b._berth[1];const ex=lerp(dx,bx,.72),ez=lerp(dz,bz,.72);r.u+=dtG*.8;
      const ph=(r.u%2),t=ph<1?ph:2-ph,x=lerp(ex,dx,t),z=lerp(ez,dz,t);r.fig.position.set(x,hAt(x,z)+.18,z);r.fig.rotation.y=Math.atan2((ph<1?dx-ex:ex-dx),(ph<1?dz-ez:ez-dz));r.bk.visible=ph<1;}}
  if(ECO.dkClean){ECO.dkClean=false;for(const [b,r] of ECO.dk)if(!live.has(b)||b._gone){ecoGrp.remove(r.g);ECO.dk.delete(b);}}}
// ---------------------------------------------------------------- the economy tick
function ecoTick(dt){
  if(MODE!=='god'||G.phase!=='play'||G.menu||!ECO.on){if(ecoGrp.visible){ecoGrp.visible=false;}if(!ECO.on||MODE!=='god')return;}
  ecoGrp.visible=true;ECO.pathBudget=Math.min(2,ECO.pathBudget+dt*3);
  const dG=ECO.lastG?Math.max(0,Math.min(.2,G.t-ECO.lastG)):0;ECO.lastG=G.t;
  updHauls(dt);updCaravans(dt);updRuns(dG,dt);
  const tw=now();if(tw-ECO.spawnT>=1.2){ECO.spawnT=tw;spawnRuns();}
  if(tw-ECO.mkT>=1.5){ECO.mkT=tw;ECO.dkList=buildings.filter(b=>b.type==='dock');ECO.dkClean=true;ECO.drn=null;updMarkets();}
  animMarkets();updDrones(dt);updDocks(dG);}
// ---------------------------------------------------------------- footfall: every ~2 units a walker covers marks the grid (the wrapper costs one add per step)
{const _w=wear;wear=function(v,d){_w(v,d);if(v.kind==='bandit')return;const q=(v._ovd||0)+d;if(q<1.8){v._ovd=q;return;}v._ovd=0;const i=((v.x+HALF)/GC)|0,j=((v.z+HALF)/GC)|0;if(i>=0&&j>=0&&i<GN&&j<GN)TR[j*GN+i]+=Math.min(5,(q/1.8)|0||1);};}
// ---------------------------------------------------------------- the frame (own animation loop: nothing in the shared main loop is touched)
const brush=()=>document.getElementById('brushbar');
function hideAll(){ovMesh.visible=false;legend.classList.add('hidden');tipHide();why.classList.add('hidden');law.classList.add('hidden');ecoGrp.visible=false;for(const s of SG.spr.values())s.visible=false;}
const ERRS={};function sf(n,f){try{f();}catch(err){if(!ERRS[n]){ERRS[n]=1;console.error('overlays: '+n,err);}}}
function ovFrame(dt){
  const god=MODE==='god'&&G.phase==='play'&&!G.menu&&G.center;
  if(!god){if(!OV.hidden){OV.hidden=true;hideAll();}return;}
  if(OV.hidden){OV.hidden=false;legend._h='';why._h='';law._h='';}
  const t=now();
  if(OV.cur!==TOWNS.cur){OV.cur=TOWNS.cur;OV.force=true;OV.job=null;SG.info=null;OV.wd=null;if(OV.mode)clearTex();ECO.runs.length=0;}
  const dn=dayN();if(dn!==OV.day){if(OV.day>=0){for(let k=0;k<NN;k++)TR[k]*=.78;}OV.day=dn;}
  sf('tint',()=>{OV.a+=((OV.mode?1:0)-OV.a)*Math.min(1,dt*7);ovU.uA.value=OV.a*.96;ovU.uT.value=TT;ovMesh.visible=OV.a>.01;
    if(OV.mode){schedule(t);drawLegend();updateTip();{const bb=brush()&&!brush().classList.contains('hidden')?76:14;if(OV.lgB!==bb){OV.lgB=bb;legend.style.bottom=bb+'px';}}
      const rb=selected||hoverB;let rr=0;if(OV.mode==='svc'&&rb&&buildings.includes(rb)&&!rb.build&&SVT[rb.type]){const d=SVT[rb.type].find(q=>q[0]===OV.sub)||SVT[rb.type][0];rr=d[1]*(1+(G.era>=5?.1:0));ovU.uRing.value.set(rb.x,rb.z,rr,1);}if(!rr)ovU.uRing.value.w=0;}
    else{tipHide();if(!legend.classList.contains('hidden'))legend.classList.add('hidden');ovU.uRing.value.w=0;}});
  sf('panels',()=>{if(OV.whyOpen&&t-(OV.whyT||0)>1.2){OV.whyT=t;drawWhy();}
    else if(!OV.whyOpen&&t-(OV.badgeT||-9)>7){OV.badgeT=t;OV.whyN=ovWhy().filter(x=>x.sev>=60).length;syncBtns();}
    if(OV.lawOpen&&t-(OV.lawT||0)>.8){OV.lawT=t;drawLaw(false);}
    if((OV.whyOpen||OV.lawOpen)&&t-(OV.posT||0)>.4){OV.posT=t;placePanels();}});
  sf('signs',()=>updateSigns(dt));sf('economy',()=>ecoTick(dt));}
// the Why? and Edicts panels sit to the left of the inspector (and of the story feed when that is open)
function placePanels(){let right=12;const ir=insp.getBoundingClientRect();if(ir.width>0&&!insp.classList.contains('hidden')||true){const pr=document.getElementById('prayers');const r2=pr&&!pr.classList.contains('hidden')?pr.getBoundingClientRect():ir;right=Math.max(12,innerWidth-Math.min(ir.width>0?ir.left:innerWidth,r2.width>0?r2.left:innerWidth)+10);}
  const feed=document.getElementById('cuFeed');if(feed&&getComputedStyle(feed).display!=='none'&&!feed.classList.contains('hidden')){const fr=feed.getBoundingClientRect();if(fr.width>0)right=Math.max(right,innerWidth-fr.left+10);}
  const top=toolsEl.getBoundingClientRect().top;for(const el of [why,law]){el.style.right=right+'px';el.style.top=Math.max(8,top)+'px';}}
OV.ms=0;OV.max=0;OV.n=0;
function tick(ms){requestAnimationFrame(tick);const tt=ms/1000,dt=Math.min(.1,tick.l?tt-tick.l:.016);tick.l=tt;const p0=performance.now();try{ovFrame(dt);}catch(err){if(!tick.e){tick.e=1;console.error('overlays',err);}}
  const c=performance.now()-p0;OV.ms+=(c-OV.ms)*.05;if(c>OV.max)OV.max=c;OV.n++;}
requestAnimationFrame(tick);
// -- clear stale economy visuals when a game is loaded or restarted
setInterval(()=>{if(MODE!=='god')return;try{const set=new Set(allVill());for(const [v,h] of ECO.hauls)if(!set.has(v)||v._gone){if(h.mesh)putMesh(h.mesh);ECO.hauls.delete(v);}
  for(const [v,h] of ECO.cars)if(!set.has(v)||v._gone){for(const m of h.meshes)putMesh(m);ECO.cars.delete(v);}}catch(err){}},2000);
}
