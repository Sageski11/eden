'use strict';
// ================================================================ the working buildings change with the age
// Camps, lodges, quarries, farms, towers, docks, shipyards, sawmills, masons and fish markets keep a style tier in b.level
// (0 as before / 1 Industrial / 2 Modern / 3 Futuristic), exactly like the civic buildings in era_civic.js (TIERED, eraTierFor).
// The Church gains two more tiers (3 Meditation Hall, 4 Temple of Light). Nothing here changes what a building does.
const ET_PAL=[null,{roof:0x4f5866,trim:0xb8aa94,pad:0x5f5a52,glow:0xffc060},{roof:0x77797a,trim:0x8f9190,pad:0x4a4a4e,glow:0xe03a2a},{wall:0xe8edf2,roof:0xcfe4f0,trim:0x9aa6b2,pad:0x9aa6b2,glow:0x7ff0ff}];
function etStack(K,t,x,z,base,hh){const {B,F}=K;
  if(t===1){B.box(x,base,z,.9,hh,.9,0x7d3a2e);B.box(x,base+hh,z,1.1,.2,1.1,0x2f2a26);K.smoke(x,base+hh+.5,z,2.6,1);}
  else if(t===2){B.cyl(x,base,z,.45,hh,0x9a9d9e,10);B.cyl(x,base+hh-.3,z,.5,.3,0xe03a2a,10);K.smoke(x,base+hh+.4,z,1.4,0);}
  else{B.cyl(x,base,z,.3,hh*.7,0xf2f5f8,8);F.sph(x,base+hh*.7+.2,z,.3,.3,.3,0x7ff0ff);}}
function etSilo(K,t,x,z,base,hh,r){const {B,F}=K;B.cyl(x,base,z,r,hh,t===1?0xb8aa94:t===2?0xcfcfca:0xf2f5f8,14);B.cone(x,base+hh,z,r,.8,t===1?0x4f5866:t===2?0x8c8f90:0xcfe4f0,14);if(t===3)F.cyl(x,base+hh-.3,z,r+.04,.08,0x7ff0ff,16);else B.cyl(x,base+hh*.5,z,r+.04,.08,0x6a6e74,14);}
function etCrane(K,t,x,z,base,hh,len,ang){const {B,F}=K,col=t===1?0x2f3236:t===2?0xe0b03a:0xf2f5f8,dx=Math.sin(ang||0),dz=Math.cos(ang||0);
  for(const s of [-1,1]){B.beam(x+dz*s*1.2,base,z-dx*s*1.2,x+dz*s*1.2,base+hh,z-dx*s*1.2,.13,col);}
  B.beam(x+dz*1.2,base+hh,z-dx*1.2,x-dz*1.2,base+hh,z+dx*1.2,.13,col);B.beam(x,base+hh,z,x+dx*len,base+hh-.2,z+dz*len,.12,col);B.box(x+dx*len*.7,base+hh-1.6,z+dz*len*.7,.05,1.4,.05,0x3a3d42);
  B.box(x+dx*len*.7,base+hh-2.2,z+dz*len*.7,.5,.5,.5,t===3?0x7ff0ff:0x8a4a2a);if(t===3)F.sph(x,base+hh+.15,z,.2,.2,.2,0x7ff0ff);}
function etMast(K,t,x,z,base,hh){const {B,F}=K,col=t===1?0x3a3d42:t===2?0xd8dadc:0xf2f5f8;
  for(const [a,b2] of [[1,1],[1,-1],[-1,1],[-1,-1]])B.beam(x+a*.7,base,z+b2*.7,x+a*.08,base+hh,z+b2*.08,.07,col);
  for(let i=1;i<6;i++){const f=i/6,w=.7*(1-f);B.beam(x-w,base+hh*f,z-w,x+w,base+hh*f,z-w,.04,col);B.beam(x-w,base+hh*f,z+w,x+w,base+hh*f,z+w,.04,col);}
  B.cyl(x,base+hh,z,.06,1.4,col,5);F.sph(x,base+hh+1.5,z,.18,.18,.18,t===3?0x7ff0ff:0xff3a2a);}
// a tiered shed: brick under a sawtooth gable (1), concrete under a flat roof (2), a white pod with a glowing rim (3)
function etShell(K,t,w,d,h,o){o=o||{};const {B,F}=K,P=ET_PAL[t],base=eraPad(K,w/2+.3,d/2+.3,P.pad),wall=t===1?K.pick(BRICK):t===2?K.pick(CONC):P.wall;
  if(t===3){const r=Math.max(w,d)/2;B.cyl(0,base,0,r,h*.75,wall,22);B.sph(0,base+h*.75,0,r,h*.4,r,P.roof,1);F.cyl(0,base+h*.75-.1,0,r+.05,.1,P.glow,26);
    for(let i=0;i<4;i++){const a=i/4*TAU+.4;K.G.box(Math.sin(a)*(r+.02),base+h*.25,Math.cos(a)*(r+.02),.9,h*.35,.9,0xffffff,a);}B.box(0,base,r+.03,1.3,2.1,.1,0x6a7a88);}
  else{B.box(0,base,0,w,h,d,wall);
    if(t===1){B.box(0,base+h-.1,0,w+.2,.14,d+.2,P.trim);gable(B,{x:0,z:0,top:base+h,len:w,span:d,k:.34,t:.16,col:P.roof,wall,axis:'x',ov:.25});windowRows(K,w,d,base+.3,h,1,1.1,0x3a2e26,.5);}
    else{B.box(0,base+h,0,w+.3,.24,d+.3,P.roof);for(let i=0;i<2;i++)B.box(-w*.25+i*w*.5,base+h+.24,-d*.15,1.1,.7,1.1,0x8c8f90);glazeFace(K,'z',1,w*.8,base+.5,h-1.1,d/2+.01,wall,0x7aa6c0,0x7aa6c0);}
    B.box(0,base,d/2+.03,1.3,2.1,.1,0x3a2f26);}
  return base;}
const ET_LUMBER=(K,t,b)=>{const {B}=K,base=etShell(K,t,6.4,4.4,3.2);for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.hcyl(-2.2+(i-(3-r)/2)*.4,K.gh(-3.6,2.6)+.2+r*.34,3.2,.18,2.4,K.pick([0x8a6440,0x9a7448,0x7a5632]),'x');
  etStack(K,t,2.4,-1.4,base+3.2*(t===3?.9:1),t===1?5.4:3);if(t===2)etCrane(K,t,-3.4,-2.2,K.gh(-3.4,-2.2),5.2,3.2,PI/2);else if(t===3)etCrane(K,t,-3.4,-2.2,K.gh(-3.4,-2.2),4.2,3,PI/2);};
const ET_FISH=(K,t,b)=>{const {B,F}=K,base=etShell(K,t,6,4.2,3);for(let i=0;i<3;i++){const x=-2.6+i*2.6,z=3.2;B.cyl(x,K.gh(x,z),z,.9,1.1,t===3?0xcfe4f0:0xb8c4c8,14);if(t===3)F.cyl(x,K.gh(x,z)+1.1,z,.9,.06,0x7ff0ff,14);else B.cyl(x,K.gh(x,z)+1.1,z,.92,.1,0x6fb8d8,14);}
  if(t<3)etStack(K,t,2.4,-1.2,base+3,3.6);else F.sph(0,base+3.6,0,.3,.3,.3,0x7ff0ff);};
const ET_LODGE=(K,t,b)=>{const {B,F}=K,base=etShell(K,t,5.4,3.8,2.8);B.box(3.3,K.gh(3.3,0),0,.1,3.2,.1,0x3a3d42);if(t>=2)etMast(K,t,3.6,-1.4,K.gh(3.6,-1.4),5.5);
  for(let i=0;i<2;i++){const x=-3.4,z=-1+i*1.6,g=K.gh(x,z);B.box(x,g,z,1.2,.8,1.2,t===1?0x6d4a2d:0xcfcfca);}if(t===1)etStack(K,t,-1.6,-1,base+2.8,3);if(t===3)F.sph(0,base+3.4,0,.28,.28,.28,0x7ff0ff);};
const ET_QUARRY=(K,t,b)=>{const {B,F}=K,[gMin,gMax]=K.rect(2.6,2),g=gMin;B.box(0,g-1.1,0,5,1.05,4,0x5e5850);B.box(0,g-1.12,0,4.2,.04,3.2,0x4f4a44);
  for(let i=0;i<10;i++){const a=i/10*TAU;B.box(Math.sin(a)*2.9,K.gh(Math.sin(a)*2.9,Math.cos(a)*2.4)-.3,Math.cos(a)*2.4,.7,.5,.6,0x8f897d,a);}
  const cx=2.7,cz=1.4,cg=K.gh(cx,cz),P=ET_PAL[t];B.box(cx,cg,cz,2.4,2.2,2,t===1?K.pick(BRICK):t===2?0x9aa0a6:0xe8edf2);if(t===3)F.box(cx,cg+2.2,cz,2.5,.08,2.1,0x7ff0ff);else B.box(cx,cg+2.2,cz,2.6,.2,2.2,P.roof);
  B.beam(cx-1.2,cg+1.6,cz,-1.6,g-.4,-.2,.16,t===3?0xf2f5f8:0x5d6068);for(let i=0;i<3;i++)B.cone(-3+i*.5,K.gh(-3,2.6),2.6+i*.3,.7,.7+i*.2,0xa39c8e,8);
  if(t<3)etStack(K,t,3.4,.4,cg+2.2,3);else etCrane(K,t,-2.6,-2.4,K.gh(-2.6,-2.4),4,3,0);};
const ET_TOWER=(K,t,b)=>{const {B,F}=K,[gMin,gMax]=K.rect(1.3,1.3),g=gMax+.1;
  if(t===1){B.cyl(0,gMin-.4,0,1.5,g-gMin+.4,0x6f6a62,12);B.cyl(0,g,0,1.1,6.2,0xe4dfd2,14,.8);B.cyl(0,g+3.1,0,1.14,.5,0xa85a42,14);B.cyl(0,g+6.2,0,1.3,.3,0x2f3236,14);F.sph(0,g+7,0,.55,.55,.55,0xffd870);B.cone(0,g+7.6,0,1,.9,0x4f5866,14);}
  else if(t===2){etMast(K,2,0,0,g,11);B.box(0,g,0,2.2,.5,2.2,0x8a8d90);}
  else{B.cyl(0,g,0,1.1,.5,0xcfd6dc,14);B.cyl(0,g+.5,0,.3,12,0xf2f5f8,8,.5);for(let i=0;i<3;i++)F.cyl(0,g+3+i*2.8,0,.55-i*.1,.1,i%2?0xff7ad8:0x7ff0ff,14);F.sph(0,g+12.7,0,.35,.35,.35,0x7ff0ff);}};
const ET_SAWMILL=(K,t,b)=>{const {B}=K,base=etShell(K,t,6.8,4.6,3.4);for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.hcyl(-3.4-.2+(i-(3-r)/2)*.4+1,K.gh(-4.4,2.6)+.2+r*.34,3,.17,2.2,K.pick([0x8a6440,0x9a7448]),'z');
  B.box(4.4,K.gh(4.4,0)+.1,0,.9,.14,3.4,0x8a6a40);if(t<3)etStack(K,t,2.5,-1.5,base+3.4,t===1?5.2:3.6);else etCrane(K,t,3.6,-2,K.gh(3.6,-2),4,2.8,PI/2);};
const ET_MASON=(K,t,b)=>{const {B}=K,base=etShell(K,t,5.6,4,3);for(let i=0;i<8;i++){const x=-3.6+(i%2)*.7,z=-1.2+Math.floor(i/2)*.7;B.box(x,K.gh(x,z),z,.6,.5,.6,K.pick([0xb3ab9a,0xa39c8e,0xc2b9a6]));}
  etCrane(K,t,3.4,-1.4,K.gh(3.4,-1.4),t===1?4:4.6,2.6,0);if(t===1)etStack(K,t,-1.6,-1.2,base+3,3.6);};
const ET_FISHMKT=(K,t,b)=>{const {B,F}=K,base=etShell(K,t,7.4,5,3.2);for(let i=0;i<3;i++){const x=-2.3+i*2.3;B.box(x,K.gh(x,3.6),3.6,1.6,.7,1,t===3?0xdfe6ee:0xcfd6dc);B.box(x,K.gh(x,3.6)+.7,3.6,1.5,.06,.9,0xd8e4e8);}
  B.box(0,base+3.3,0,7.6,.2,5.2,ET_PAL[t].trim);if(t===3)F.box(0,base+3.5,2.65,6,.1,.06,0x7ff0ff);else B.box(0,base+2.3,2.6,5,.7,.06,t===1?0x8a3a2a:0x3d5a80);};
// existing generators, extended: farm gets a barn / greenhouse / vertical farm, dock and shipyard get cranes and a concrete quay
function etFarm(K,t,b){const {B,F}=K,P=ET_PAL[t];
  if(t===1){B.box(-3.2,K.gh(-3.2,-2),-2,2.8,2.2,2.2,K.pick(BRICK));gable(B,{x:-3.2,z:-2,top:K.gh(-3.2,-2)+2.2,len:2.8,span:2.2,k:.45,t:.14,col:P.roof,axis:'x',ov:.2});etSilo(K,1,-4.8,-.6,K.gh(-4.8,-.6),3.6,.7);}
  else if(t===2){for(let i=0;i<2;i++){const z=-1.4+i*2.4,g=K.gh(0,z);B.box(0,g,z,6.6,.18,1.8,0x6f6a62);B.cyl(0,g,z,.9,6.6,0xeaf4f8,10);}etSilo(K,2,-4.8,-2,K.gh(-4.8,-2),4.5,.8);etSilo(K,2,-4.8,-.5,K.gh(-4.8,-.5),4.5,.8);}
  else{for(let k=0;k<2;k++){const x=-3.6,z=-2+k*3.2,g=K.gh(x,z);B.cyl(x,g,z,1.1,.4,0xcfd6dc,16);for(let s=0;s<5;s++){B.cyl(x,g+.4+s*1.15,z,.95,1.0,s%2?0xdfe6ee:0xc9d3dd,16);F.cyl(x,g+1.3+s*1.15,z,.97,.06,0xff7ad8,16);}F.sph(x,g+6.3,z,.25,.25,.25,0x7ff0ff);}}}
const ET_FARM_NAME=['','Mechanised Farm','Agri-Plant','Vertical Farm'];
function etDock(K,t,b,c){const {B,F}=K,wl=c.wLocal,ang=Math.atan2(wl.x,wl.z),g=K.gh(wl.x*1.6,wl.z*1.6);
  B.boxC(wl.x*3,Math.max(c.waterLevel,g)+.5,wl.z*3,5.6,.3,5.6,t===3?0xcfd6dc:0x6f6a62,0,ang,0);
  etCrane(K,t,wl.x*3.6-wl.z*1.4,wl.z*3.6+wl.x*1.4,Math.max(c.waterLevel,g)+.6,5,2.6,ang);
  for(let i=0;i<4;i++)B.box(-wl.z*1.2+wl.x*(.4+i*.8)-wl.x*.4,K.gh(0,0)+.02,wl.x*1.2+wl.z*(.4+i*.8)-wl.z*.4,1.5,1.1,.9,[0xc0392b,0x2e86c1,0xe0b03a,0x58a05a][i%4],ang);}
function etYard(K,t,b,c){const {B,F}=K,wl=c.wLocal,ang=Math.atan2(wl.x,wl.z),g0=K.gh(0,0);
  for(const s of [-1,1]){const px=wl.z*s*2.6,pz=-wl.x*s*2.6;for(const f of [-1,1])B.beam(px+wl.x*f*1.4,K.gh(px,pz),pz+wl.z*f*1.4,px,g0+5.4,pz,.16,t===1?0x2f3236:t===2?0xe0b03a:0xf2f5f8);}
  B.beam(wl.z*2.6,g0+5.4,-wl.x*2.6,-wl.z*2.6,g0+5.4,wl.x*2.6,.18,t===2?0xe0b03a:t===3?0xf2f5f8:0x2f3236);if(t===3)F.sph(0,g0+5.6,0,.25,.25,.25,0x7ff0ff);
  B.box(-wl.x*5+wl.z*2,K.gh(-wl.x*5,-wl.z*5),-wl.z*5-wl.x*2,3.4,2.2,2.6,t===1?K.pick(BRICK):t===2?0x9aa0a6:0xe8edf2,ang);}
// (re)define a type: tier 0 keeps its old generator, tiers 1-3 use the new one
function etTier(type,names,fn,r){const orig=GEN[type];GEN[type]=(b,c,K)=>{const t=typeof tierOf==='function'?tierOf(b):0;if(t<1||t>3)return orig(b,c,K);fn(K,t,b,c);K.traits.push(typeof names.tr==='function'?names.tr(t,b):names.tr[t]);return {name:typeof names.n==='function'?names.n(t,b):names.n[t],r};};}
etTier('camp',{n:(t,b)=>b.variant==='fish'?['','Cannery','Fish Plant','Aquaculture Dome'][t]:['','Timber Yard','Timber Plant','Bio-Timber Pod'][t],tr:(t,b)=>b.variant==='fish'?['','Brick cannery with a smoking stack','Chilled fish plant','Glass tanks of farmed fish'][t]:['','Steam saws and stacked logs','Concrete timber plant with a crane','A white pod that grows its own planks'][t]},
  (K,t,b,c)=>b.variant==='fish'?ET_FISH(K,t,b):ET_LUMBER(K,t,b),5.4);
etTier('lodge',{n:['','Warden Lodge','Ranger Station','Habitat Station'],tr:['','A brick warden lodge','A ranger station with a radio mast','A habitat dome with a sensor spire']},(K,t,b)=>ET_LODGE(K,t,b),4);
etTier('quarry',{n:['','Stoneworks','Aggregate Plant','Matter Cutter'],tr:['','Crushers and a smoking stack','Concrete crusher plant','A white cutting gantry']},(K,t,b)=>ET_QUARRY(K,t,b),3.8);
etTier('tower',{n:['','Signal Tower','Radio Mast','Beacon Pylon'],tr:['','A brick signal tower with a lamp','A steel radio mast','A pylon pulsing with light']},(K,t,b)=>ET_TOWER(K,t,b),2.4);
etTier('sawmill',{n:['','Steam Sawmill','Timber Mill','Laser Mill'],tr:['','Steam-driven saws','A concrete mill with a gantry','Robotic saws'] },(K,t,b)=>ET_SAWMILL(K,t,b),4);
etTier('mason',{n:['','Stoneworks Yard','Concrete Works','Fabrication Hall'],tr:['','A brick yard with a derrick','Prefab concrete works','Printed stone, no chisels']},(K,t,b)=>ET_MASON(K,t,b),3.6);
etTier('fishmkt',{n:['','Fish Hall','Cold Store','Aqua Bazaar'],tr:['','A covered brick fish hall','A refrigerated market','A glowing seafood bazaar']},(K,t,b)=>ET_FISHMKT(K,t,b),4.6);
{const o=GEN.farm;GEN.farm=(b,c,K)=>{const t=tierOf(b),i=o(b,c,K);if(t>=1&&t<=3){etFarm(K,t,b);i.name=ET_FARM_NAME[t];K.traits.push(['','Brick barn and grain silo','Greenhouse tunnels and silos','Towers of light-fed crops'][t]);}return i;};}
{const o=GEN.dock;GEN.dock=(b,c,K)=>{const t=tierOf(b),i=o(b,c,K);if(t>=1&&t<=3){etDock(K,t,b,c);i.name=['','Harbour Quay','Container Quay','Skyport Quay'][t];K.traits.push(['','A steel crane over the quay','Containers stacked by the water','White gantries and light-lined piers'][t]);}return i;};}
{const o=GEN.shipyard;GEN.shipyard=(b,c,K)=>{const t=tierOf(b),i=o(b,c,K);if(t>=1&&t<=3){etYard(K,t,b,c);i.name=['','Dockyard','Gantry Yard','Orbital Slip'][t];K.traits.push(['','Iron cranes over the slip','A gantry crane and prefab sheds','Hulls grown under a white gantry'][t]);}return i;};}
// ---------------- the Church beyond the stone church
overGen('church',{
 3:(b,c,K)=>{const {B,F,G}=K,T=K.traits;const base=eraPad(K,3.4,4.6,0x8f8a7e);B.box(0,base,0,5.4,5,8,0xe8e4dc);B.box(0,base+5,0,5.8,.3,8.4,0x6c7078);
  for(const f of [-1,1])glazeFace(K,'x',f,6.4,base+.8,3.4,2.71,0xe8e4dc,0x8fc4e0,0x8fc4e0);glazeFace(K,'z',1,3.6,base+.8,3.6,4.01,0xe8e4dc,0x8fc4e0,0x8fc4e0);
  B.box(0,base+5.3,-2.5,1.4,5.5,1.4,0xdfe6ee);B.box(0,base+10.8,-2.5,.14,2.2,.14,0x6a6e74);B.box(0,base+11.9,-2.5,1,.12,.12,0x6a6e74);B.box(0,base+11.9,-2.5,.12,.12,1,0x6a6e74);
  B.box(0,base,4.03,1.4,2.4,.1,0x3a4a5a);T.push('A glass meditation hall under a slender spire');return {name:'Meditation Hall',r:6.4};},
 4:(b,c,K)=>{const {B,F}=K,T=K.traits;const base=eraPad(K,3.6,3.6,0xcfd6dc);B.cyl(0,base,0,3.6,.5,0xdfe6ee,22);B.cyl(0,base+.5,0,2.8,3.4,0xf2f5f8,22);F.cyl(0,base+3.9,0,2.9,.1,0x7ff0ff,24);
  B.sph(0,base+3.9,0,2.8,2.4,2.8,0xcfe4f0,1);for(let i=0;i<6;i++){const a=i/6*TAU;B.beam(Math.sin(a)*3,base+.5,Math.cos(a)*3,Math.sin(a)*.5,base+8.8,Math.cos(a)*.5,.12,0xf2f5f8,.06);}
  F.sph(0,base+9.2,0,.45,.45,.45,0xff7ad8);T.push('A temple of white arches around a sphere of light');return {name:'Temple of Light',r:5.2};}});
// ---------------- factories and stations: the Industrial design stays at tiers 0-1; Modern and Futuristic have their own
{const f0=GEN.factory;GEN.factory=(b,c,K)=>{const t=tierOf(b);if(t<2)return f0(b,c,K);const {B,F,G}=K,T=K.traits,w=10.4,d=7.4;
  if(t===2){const base=eraPad(K,w/2+.4,d/2+.4,0x4a4a4e);B.box(0,base,0,w,4.6,d,0xcfcfca);B.box(0,base+4.6,0,w+.3,.3,d+.3,0x77797a);glazeFace(K,'z',1,w*.8,base+.8,2.6,d/2+.01,0xcfcfca,0x7aa6c0,0x7aa6c0);
    for(let i=0;i<3;i++){B.cyl(-w/2+1.4+i*2.2,base+4.9,-d/2+1.1,.6,1.8,0xeaeaea,12);}etStack(K,2,w/2-1.2,-d/2+1,base+4.9,4.5);B.box(0,base,d/2+.03,2.8,3,.1,0x3a3d42);
    for(let i=0;i<3;i++)B.cyl(-w/2-1.3,base,-2+i*1.7,.7,2.4,0x9aa0a6,12);T.push('A concrete plant with glass offices','Silos and a clean steel stack');return {name:'Production Plant',r:6.2};}
  const base=eraPad(K,w/2+.4,d/2+.4,0x9aa6b2);B.cyl(0,base,0,4.6,1,0xe8edf2,22);B.sph(0,base+1,0,4.5,3.4,4.5,0xf2f5f8,1);F.cyl(0,base+1.1,0,4.65,.12,0x7ff0ff,26);
  for(let i=0;i<3;i++){const a=i/3*TAU;B.cyl(Math.sin(a)*5.6,base,Math.cos(a)*5.6,.9,3.2,0xdfe6ee,12);F.sph(Math.sin(a)*5.6,base+3.4,Math.cos(a)*5.6,.3,.3,.3,0xff7ad8);}
  B.box(0,base,4.6,2,2.2,.1,0x6a7a88);T.push('A white fabricator dome, rimmed with light');return {name:'Fabricator Complex',r:6.4};};}
{const s0=GEN.station;GEN.station=(b,c,K)=>{const t=tierOf(b);if(t<2)return s0(b,c,K);const {B,F,G}=K,T=K.traits,w=13,d=9;const base=eraPad(K,w/2+.5,d/2+.5,t===2?0x6a6a6e:0x9aa6b2);
  if(t===2){B.box(0,base,0,w,3.4,d*.5,0xe8e4dc);B.box(0,base+3.4,0,w+.4,.3,d*.5+.4,0x3d5a80);glazeFace(K,'z',1,w*.8,base+.5,2.4,d*.25+.01,0xe8e4dc,0x7aa6c0,0x7aa6c0);
    for(let i=0;i<5;i++)B.cyl(-w/2+1+i*(w-2)/4,base,d*.35,.18,3.6,0xcfcfca,6);B.box(0,base+3.6,d*.35,w,.2,2.4,0x77797a);for(let i=0;i<2;i++)B.box(-2.4+i*4.8,base,d*.35,.6,.1,2,0x2f3236);T.push('A concrete terminal with a long canopy');return {name:'Central Station',r:7};}
  B.cyl(0,base,0,5.5,.6,0xdfe6ee,24);B.sph(0,base+.6,0,5.4,3.6,5.4,0xcfe4f0,1);F.cyl(0,base+.7,0,5.5,.1,0x7ff0ff,28);for(let i=0;i<6;i++){const a=i/6*TAU;B.cyl(Math.sin(a)*5,base,Math.cos(a)*5,.18,4.6,0xf2f5f8,6);}
  B.box(0,base,5.5,w*.7,.15,1.4,0x7ff0ff);T.push('A glass vault over the maglev line');return {name:'Maglev Terminal',r:7};};}
