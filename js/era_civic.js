'use strict';
// ================================================================ civic buildings change with the age
// Each of these keeps a style tier in b.level: church 0 stone circle / 1 timber temple / 2 stone church;
// the rest 0 medieval / 1 industrial / 2 modern / 3 futuristic. When the age moves on, the folk rebuild them in place.
const TIERED=['church','market','tavern','smith','mill','well','camp','lodge','quarry','farm','tower','dock','shipyard','fishmkt','sawmill','mason','factory','station'];
const tierOf=b=>b.level==null?(b.type==='church'?2:0):b.level;
function eraTierFor(type,e){e=e==null?(G.era||0):e;if(type==='church')return e<=1?0:e===2?1:e<=5?2:e===6?3:4;return e>=7?3:e>=6?2:e>=5?1:0;}
const ERA_BUILD={well:1,smith:1,church:1,fishmkt:1,mill:2,market:2,tower:2,shipyard:2,sawmill:2,mason:2,tavern:2,castle:3};
function modernizeTick(){if(G.phase!=='play'||G.menu||(G.era||0)<1)return;if(buildings.filter(b=>b.upg).length>=1+Math.floor(popN()/60)||G.hap<40)return;
  const c=buildings.filter(b=>TIERED.includes(b.type)&&!b.build&&!b.upg&&!b.fire&&tierOf(b)<eraTierFor(b.type));if(!c.length)return;
  const b=pickA(c),[w,s]=costOf(b.type,b.variant,0);if(G.wood<w*.6||G.stone<s*.6)return;startUpgrade(b,tierOf(b)+1);}
function eraPad(K,hw,hd,col){const [gMin,gMax]=K.rect(hw+.3,hd+.3);const base=gMax+.15;K.B.box(0,gMin-.6,0,hw*2+.4,base-gMin+.6,hd*2+.4,col||0x6f6a62);return base;}
function overGen(type,tiers){const orig=GEN[type];GEN[type]=(b,c,K)=>{const t=tierOf(b);return tiers[t]?tiers[t](b,c,K):orig(b,c,K);};}
const pane=(K,x,y,z,w,h,ax)=>{if(ax==='z')K.G.box(x,y,z,w,h,.05,GLASS);else K.G.box(x,y,z,.05,h,w,GLASS);};
// ---------------- church
overGen('church',{
 0:(b,c,K)=>{const {B}=K,T=K.traits;const g=K.gh(0,0);B.cyl(0,g-.45,0,5.4,.55,0x6e7a4a,20);
  for(let i=0;i<11;i++){const a=i/11*TAU,x=Math.sin(a)*4,z=Math.cos(a)*4,h=1.9+((i*37)%7)/7*1.1;B.box(x,K.gh(x,z)-.3,z,.7,h,.55,[0x8a867c,0x79756c,0x9a958a][i%3],a);}
  for(const s of [-1,1])B.box(s*1.1,g,0,.6,2.6,.6,0x8a867c);B.box(0,g+2.6,0,2.9,.5,.7,0x9a958a);B.cyl(0,g,0,.9,.3,0x4a3a2a,10);K.flame(0,g+.2,0,1.3);K.smoke(0,g+1.6,0,1.2);
  T.push('A ring of standing stones','A sacred fire in the middle');b._cap=0;return {name:'Stone Circle',r:5.8};},
 1:(b,c,K)=>{const {B}=K,T=K.traits;const w=4.6,d=9,base=eraPad(K,w/2,d/2,0x7d766a);B.box(0,base,0,w,3.2,d,0x6d4a2d);
  for(let z=-d/2+.8;z<d/2;z+=1.6)for(const f of [-1,1])B.box(f*(w/2+.02),base,z,.12,3.2,.12,0x3a2516);
  gable(B,{x:0,z:0,top:base+3.2,len:d,span:w,k:1.15,t:.3,col:0xb39558,axis:'z',ov:.5});
  for(const f of [-1,1]){B.cyl(f*1.3,base,d/2+.5,.22,4.4,0x7a5632,6);B.sph(f*1.3,base+4.5,d/2+.5,.3,.3,.3,0xd4a73c);}
  B.box(0,base,d/2+.03,1.3,2.2,.1,0x3a2516);K.smoke(0,base+4.6,-1,1.2);T.push('Carved gate posts tipped with gold','A long hall of oak timbers');return {name:'Timber Temple',r:6.2};}});
// ---------------- market
overGen('market',{
 1:(b,c,K)=>{const {B}=K,T=K.traits;const w=10,d=7.4,base=eraPad(K,w/2,d/2,0x7d766a),brick=K.pick(BRICK);B.box(0,base,0,w,3.4,d,brick);
  for(let i=0;i<5;i++){const x=-w/2+1.1+i*(w-2.2)/4;for(const f of [1,-1]){B.box(x,base+.4,f*(d/2+.01),1,2.4,.05,0x3a2e26);pane(K,x,base+.5,f*(d/2+.04),.8,2.2,'z');}}
  gable(B,{x:0,z:0,top:base+3.4,len:w,span:d,k:.42,t:.14,col:0x8fc0d4,wall:brick,axis:'x',ov:.25});
  for(let i=0;i<6;i++)B.beam(-w/2+i*w/5,base+3.4,-d/2,-w/2+i*w/5,base+3.4+d*.21,0,.07,0x2f3236,.07),B.beam(-w/2+i*w/5,base+3.4,d/2,-w/2+i*w/5,base+3.4+d*.21,0,.07,0x2f3236,.07);
  B.box(0,base,d/2+.05,2.4,2.6,.1,0x3a2f26);B.box(0,base+3.4,d/2,1.2,1.6,.5,brick);pane(K,0,base+4.2,d/2+.27,.7,.7,'z');
  T.push('Cast-iron and glass market hall','Gas lamps burn at the door');return {name:'Market Hall',r:6};},
 2:(b,c,K)=>{const {B,F,rng}=K,T=K.traits;const w=10.4,d=7,base=eraPad(K,w/2,d/2+1.6,0x4a4a4e);B.box(0,base,-1,w,3.6,d,0xf0f0ec);B.box(0,base+3.6,-1,w+.3,.3,d+.3,0x3d5a80);
  F.box(0,base+2.4,d/2-.46,w*.8,.7,.06,0xe03a2a);for(let i=0;i<6;i++)B.box(-w*.4+i*w*.16,base,d/2-.3,.1,.1,.1,0xf0f0ec);
  B.box(0,base+.05,d/2-.5,3.6,2.6,.08,0x3d5a80);pane(K,0,base+.2,d/2-.44,3.2,2.2,'z');
  for(let i=0;i<3;i++)B.box(-3.2+i*3.2,base+3.9,-1,1.6,.7,1.6,0x9a9d9e);
  for(let i=0;i<8;i++)B.box(-w/2+1+i*1.3,base+.02,d/2+.6,.07,.02,2.3,0xf0f0ec);
  for(let i=0;i<4;i++)B.box(-3.6+i*2.5,base+.02,d/2+1.6,1.2,.7,2.2,K.pick([0xc0392b,0x2e86c1,0xe8e4d8,0x2f3a3a,0xe0b03a]));
  T.push('A supermarket under a flat roof','Car park with painted bays');return {name:'Supermarket',r:6.4};},
 3:(b,c,K)=>{const {B,F}=K,T=K.traits;const base=eraPad(K,5,5,0x9aa6b2);B.cyl(0,base,0,4.8,.4,0xdfe6ee,18);B.sph(0,base+.4,0,4.5,3.2,4.5,0xcfe4f0,1);
  for(let i=0;i<8;i++){const a=i/8*TAU;B.cyl(Math.sin(a)*4.2,base,Math.cos(a)*4.2,.2,3.8,0xf2f5f8,6);F.box(Math.sin(a)*4.2,base+3.8,Math.cos(a)*4.2,.4,.12,.4,0xff7ad8);}
  F.cyl(0,base+3.4,0,4.4,.1,0x7ff0ff,24);B.cyl(0,base+3.5,0,.5,1.4,0xdfe6ee,8);F.sph(0,base+5,0,.4,.4,.4,0xff7ad8);T.push('A glass dome of stalls and light');return {name:'Sky Bazaar',r:6.2};}});
// ---------------- tavern
overGen('tavern',{
 1:(b,c,K)=>{const {B}=K,T=K.traits;const w=7,d=5.4,base=eraPad(K,w/2,d/2,0x6f6a62),brick=K.pick(BRICK);B.box(0,base,0,w,2*2.4,d,brick);B.box(0,base+2.3,0,w+.2,.14,d+.2,0xb8aa94);
  windowRows(K,w,d,base+.3,2.4,2,1.1,0x3a2e26,.5);gable(B,{x:0,z:0,top:base+4.8,len:w,span:d,k:.5,t:.2,col:0x4f5866,wall:brick,axis:'x',ov:.3});
  B.box(w/2-.6,base+4.8,-d/2+.6,.7,1.6,.7,0x7d3a2e);K.smoke(w/2-.6,base+6.6,-d/2+.6,1.4,1);B.box(0,base,d/2+.03,1.1,2,.1,0x3a2516);
  B.beam(-w/2+.4,base+3.6,d/2+.1,-w/2-.6,base+3.6,d/2+.1,.05,0x2f3236);B.box(-w/2-1.1,base+2.9,d/2+.02,.9,.7,.05,0xd4a73c);
  T.push('A brick public house with gaslit windows');return {name:'Public House',r:5};},
 2:(b,c,K)=>{const {B,F}=K,T=K.traits;const w=7.4,d=5.4,base=eraPad(K,w/2+1.4,d/2,0x6f6a62);B.box(0,base,0,w,3.2,d,0xe8d8c0);B.box(0,base+3.2,0,w+.3,.25,d+.3,0x3d3a36);
  F.box(0,base+2.5,d/2+.04,w*.7,.6,.06,0xff4aa0);glazeFace(K,'z',1,w*.85,base+.3,1.8,d/2+.01,0xe8d8c0,0x8fc4e0,0x8fc4e0);
  for(let i=0;i<3;i++){const x=w/2+1+(i-1)*.1,z=-1+i*1.6;B.cyl(x,base,z,.05,1.3,0x3a3d42,5);B.cyl(x,base+1.3,z,.7,.06,0xe8e4d8,10);B.cone(x,base+1.4,z,.9,.5,[0xc0392b,0x2e86c1,0xe0b03a][i],8);}
  T.push('Neon over the door','Tables out on the terrace');return {name:'Bar & Grill',r:5.8};},
 3:(b,c,K)=>{const {B,F}=K,T=K.traits;const base=eraPad(K,3.6,3.6,0x9aa6b2);B.box(0,base,0,6.4,3.8,6.4,0xcfe4f0);
  for(const f of [1,-1]){glazeFace(K,'z',f,5.8,base+.3,3.2,3.21,0xf2f5f8,0x8fc4e0,0x8fc4e0);glazeFace(K,'x',f,5.8,base+.3,3.2,3.21,0xf2f5f8,0x8fc4e0,0x8fc4e0);}
  B.box(0,base+3.8,0,7,.3,7,0xf2f5f8);F.box(0,base+3.7,0,6.6,.08,6.6,0xff7ad8);for(let i=0;i<4;i++)B.sph(-2.4+i*1.6,base+4.3,(i%2?1.8:-1.8),.5,.5,.5,0x4f9a4a);
  T.push('A glass lounge above the roofs');return {name:'Sky Lounge',r:5};}});
// ---------------- smith
overGen('smith',{
 1:(b,c,K)=>{const {B,F}=K,T=K.traits;const w=7,d=5.2,base=eraPad(K,w/2,d/2,0x5f5a52),brick=K.pick(BRICK);B.box(0,base,0,w,3.2,d,brick);gable(B,{x:0,z:0,top:base+3.2,len:w,span:d,k:.3,t:.18,col:0x5d6068,wall:brick,axis:'x',ov:.25});
  for(const x of [-2.2,2.2]){B.box(x,base+3.2,-d/2+.8,.9,6.2,.9,0x7d3a2e);B.box(x,base+9.4,-d/2+.8,1.1,.2,1.1,0x2f2a26);K.smoke(x,base+9.9,-d/2+.8,3,1);}
  B.box(0,base,d/2+.03,2.6,2.4,.1,0x2a2622);F.box(0,base+.1,d/2+.05,2.2,1.6,.05,0xff7a2a);for(let i=0;i<4;i++)B.box(-2.4+i*.4,base,d/2+.8,.5,.25,.2,0x6a6e74);
  T.push('Brick ironworks, glowing at the door');return {name:'Ironworks',r:4.8};},
 2:(b,c,K)=>{const {B}=K,T=K.traits;const w=8,d=5.6,base=eraPad(K,w/2,d/2,0x4a4a4e);B.box(0,base,0,w,3.6,d,0x9aa0a6);for(let i=0;i<=16;i++)B.box(-w/2+i*w/16,base,d/2+.01,.06,3.6,.04,0x7d8288);
  B.box(0,base+3.6,0,w+.3,.25,d+.3,0x5d6068);B.box(1.6,base,d/2+.04,3.2,2.8,.08,0x3a3d42);for(let i=0;i<3;i++)B.box(-3.2+i*1.2,base+3.85,-.6,.9,.7,.9,0x8c8f90);
  for(let i=0;i<3;i++)B.box(-3.2,base,d/2+.6+i*.5,1,.2,.8,0x8a6a40);T.push('A corrugated workshop with a roller door');return {name:'Workshop',r:5.2};},
 3:(b,c,K)=>{const {B,F}=K,T=K.traits;const base=eraPad(K,4,4,0x9aa6b2);B.cyl(0,base,0,3.6,.5,0xdfe6ee,16);B.sph(0,base+.5,0,3.3,2.6,3.3,0xe8edf2,1);F.cyl(0,base+.55,0,3.45,.12,0x7ff0ff,20);
  for(let i=0;i<4;i++){const a=i/4*TAU+.4,x=Math.sin(a)*3.9,z=Math.cos(a)*3.9;B.beam(x,base+.4,z,x*.5,base+3.2,z*.5,.14,0xdfe6ee,.1);F.sph(x*.5,base+3.3,z*.5,.18,.18,.18,0xff7ad8);}
  T.push('A white fabricator pod, arms at work');return {name:'Fabricator',r:5};}});
// ---------------- mill
overGen('mill',{
 1:(b,c,K)=>{const {B}=K,T=K.traits;const base=eraPad(K,4,3.4,0x6f6a62),brick=K.pick(BRICK);B.box(-1.6,base,0,3.4,9,3.4,brick);for(let i=1;i<4;i++)B.box(-1.6,base+i*2.4,0,3.6,.12,3.6,0xb8aa94);
  B.cone(-1.6,base+9,0,2.6,1.8,0x4f5866,4,PI/4);B.box(2,base,0,4.6,3.8,4,brick);gable(B,{x:2,z:0,top:base+3.8,len:4.6,span:4,k:.4,t:.16,col:0x5d6068,wall:brick,axis:'x',ov:.2});
  B.box(3.2,base+3.8,1.2,.8,5.4,.8,0x7d3a2e);K.smoke(3.2,base+9.4,1.2,2.4,1);for(let i=0;i<4;i++)B.cyl(-3.8,base,-2.2+i*.4,.3,.5,0xd8cdb0,6);
  T.push('A steam-driven flour mill');return {name:'Steam Mill',r:5};},
 2:(b,c,K)=>{const {B}=K,T=K.traits;const base=eraPad(K,4.4,3.4,0x6f6a62);for(let i=0;i<4;i++){const x=-2.6+(i%2)*3.2,z=-1.6+((i/2)|0)*3.2;B.cyl(x,base,z,1.4,8.2,0xcfcfca,14);B.cone(x,base+8.2,z,1.4,.9,0x8c8f90,14);B.cyl(x,base+1,z,1.46,.08,0x9a9d9e,14);B.cyl(x,base+4.5,z,1.46,.08,0x9a9d9e,14);}
  B.beam(-2.6,base+8.4,-1.6,3.4,base+8.4,-1.6,.14,0x6a6e74);B.box(0,base,3.6,1.8,1.4,1.4,0x8c8f90);B.box(4.6,base,0,1.2,3,1.2,0x5d6068);
  T.push('Concrete silos and a conveyor');return {name:'Grain Silos',r:5.6};},
 3:(b,c,K)=>{const {B}=K,T=K.traits;const base=eraPad(K,4.2,3.6,0x848c96);for(const [x,z] of [[-2.2,-1],[2.4,1.4]]){B.cyl(x,base,z,.4,13,0xf2f4f6,8,.5);B.box(x,base+13,z,.55,.5,1.5,0xe8edf2);
    const wb=K.sub();for(let i=0;i<3;i++){const a=i/3*TAU;wb.beam(0,0,0,Math.cos(a)*5.2,Math.sin(a)*5.2,0,.2,0xf2f4f6,.06);}wb.sph(0,0,0,.4,.4,.4,0xdfe6ee,0);K.anim(wb,'spin',x,base+13.3,z+.9,{axis:'z',speed:.9});}
  B.box(0,base,2.4,2.4,1.6,1.8,0xdfe6ee);T.push('Wind turbines turn above the mill');return {name:'Wind Mill',r:5.6};}});
// ---------------- well
overGen('well',{
 1:(b,c,K)=>{const {B}=K,T=K.traits;const base=eraPad(K,1.8,1.6,0x6f6a62);B.box(0,base,0,2.4,2.2,2.2,K.pick(BRICK));gable(B,{x:0,z:0,top:base+2.2,len:2.4,span:2.2,k:.5,t:.14,col:0x4f5866,axis:'x',ov:.2});
  B.cyl(1.9,base,.2,.14,1.1,0x2f3236,6);B.beam(1.9,base+1.05,.2,2.5,base+.9,.2,.05,0x2f3236);B.box(1.6,base,-1.2,1.2,.5,.5,0x7a5632);T.push('A pump house');return {name:'Pump House',r:2.6};},
 2:(b,c,K)=>{const {B}=K,T=K.traits;const base=eraPad(K,1.8,1.8,0x6f6a62);for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])B.beam(x,base,z,x*.8,base+5.4,z*.8,.12,0x6a6e74,.1);
  B.beam(-1,base+1.6,-1,1,base+3.2,-1,.06,0x6a6e74);B.beam(1,base+1.6,1,-1,base+3.2,1,.06,0x6a6e74);B.cyl(0,base+5.4,0,1.5,2.2,0x9aa6b2,14);B.cone(0,base+7.6,0,1.6,.9,0x5d6068,14);T.push('A water tower on steel legs');return {name:'Water Tower',r:2.6};},
 3:(b,c,K)=>{const {B,F}=K,T=K.traits;const base=eraPad(K,2.6,2.6,0xdfe6ee);B.cyl(0,base,0,2.5,.6,0xcfd6dc,18);B.cyl(0,base+.5,0,2.2,.15,0x6fb8d8,18);B.cyl(0,base,0,.3,2.2,0xf2f5f8,8);
  for(let i=0;i<6;i++){const a=i/6*TAU;F.sph(Math.sin(a)*1.1,base+1.2,Math.cos(a)*1.1,.14,.14,.14,0x7ff0ff);}F.sph(0,base+2.4,0,.3,.3,.3,0x7ff0ff);T.push('A fountain of light');return {name:'Fountain of Light',r:3};}});
// ---------------- town halls beyond the medieval
function eraHall(b,c,K,lvl){const {B,F}=K,T=K.traits;const [gMin,gMax]=K.rect(5.6,4.6);const base=gMax+.18;B.box(0,gMin-.6,0,11.6,base-gMin+.6,9.4,0x6f6a62);let name;
  if(lvl===3){name='Town Hall';const brick=0xb8a690;B.box(0,base,0,10.4,6.4,6.8,brick);B.box(0,base+3.1,0,10.6,.2,7,0x8f8a7e);windowRows(K,10.4,6.8,base+.4,3.1,2,1.4,0x3a2e26,.7);
    gable(B,{x:0,z:3.6,top:base+6.4,len:5,span:2.4,k:.5,t:.2,col:0x8f8a7e,axis:'x',ov:.1});for(let i=0;i<4;i++)B.cyl(-1.8+i*1.2,base,3.9,.2,4.6,0xe4dfd2,8);
    B.box(0,base+6.4,-1.4,3.4,4.2,3.4,brick);B.cone(0,base+10.6,-1.4,2.6,3,0x4f5866,4,PI/4);pane(K,0,base+8,.35,1.2,1.2,'z');K.flag(0,base+13.4,-1.4,K.pick(BANNER),1.2,2.4);T.push('A town hall with clock tower and portico');}
  else if(lvl===4){name='Civic Centre';B.box(0,base,0,11,6.2,7.6,0xe4e2dc);for(const f of [1,-1]){glazeFace(K,'z',f,10,base+.6,5.2,3.81,0xe4e2dc,0x8fc4e0,0x8fc4e0);glazeFace(K,'x',f,7,base+.6,5.2,5.51,0xe4e2dc,0x8fc4e0,0x8fc4e0);}
    B.box(0,base+6.2,0,11.6,.4,8.2,0x6c7078);for(const x of [-4,4])K.flag(x,base+6.6,0,K.pick(BANNER),1.2,3.4);B.box(0,base,4.6,5,.3,1.6,0x9a948a);T.push('A glass civic centre with a flagpole plaza');}
  else{name='Citadel of Light';B.cyl(0,base,0,5,.6,0xdfe6ee,20);B.cyl(0,base+.6,0,4,3,0xf2f5f8,20);F.cyl(0,base+3.4,0,4.1,.12,0x7ff0ff,24);B.cyl(0,base+3.6,0,3,3,0xdfe6ee,20,.8);F.cyl(0,base+6.5,0,3,.1,0xff7ad8,20);
    B.sph(0,base+6.6,0,2.6,2.2,2.6,0xcfe4f0,1);B.cyl(0,base+8,0,.3,6.5,0xf2f5f8,6);F.sph(0,base+14.6,0,.4,.4,.4,0x7ff0ff);for(let i=0;i<8;i++){const a=i/8*TAU;B.cyl(Math.sin(a)*4.5,base,Math.cos(a)*4.5,.22,3.2,0xf2f5f8,6);}
    T.push('A white citadel crowned with light');}
  return {name,r:6.4};}
{const _hall=GEN.hall;GEN.hall=(b,c,K)=>(b.level||0)>=3?eraHall(b,c,K,b.level):_hall(b,c,K);}
COST.hall.push([40,80,40],[60,120,60],[80,160,80]);
