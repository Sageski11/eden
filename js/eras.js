'use strict';
// ================================================================ eras: stone age -> futuristic
// ERAS (sim_agents.js) names the ages; here are the requirements, the new crafts and buildings of each, and their effects.
// Numeric era gating elsewhere is unchanged (0 = Stone Age ... 4 = High Medieval); eras 5-7 are new.
SKN.machine='Engineering';SKN.science='Science';
UNL.push(
  {k:'steam',t:'Steam power',req:{stone:5,work:5},d:'Factories, railways and brick tenements. The Industrial Age begins.'},
  {k:'electric',t:'Electricity',req:{machine:3,science:2},d:'Power stations, concrete and glass towers. The Modern Age begins.'},
  {k:'computing',t:'Thinking machines',req:{machine:5,science:4},d:'Fusion, spires of light. The folk begin to build minds of their own.'});
ERA_REQ[5]={txt:'170 folk, a castle, and the craft of Steam power',ok:()=>popN()>=170&&hasBuilt('castle')&&!!G.unl.steam};
ERA_REQ[6]={txt:'320 folk, a factory, a railway station and Electricity',ok:()=>popN()>=320&&hasBuilt('factory')&&hasBuilt('station')&&!!G.unl.electric};
ERA_REQ[7]={txt:'520 folk, a power station and Thinking machines',ok:()=>popN()>=520&&hasBuilt('powerplant')&&!!G.unl.computing};
// ---------------- new buildings: [wood, stone, work]
Object.assign(COST,{factory:[30,40,26],school:[22,36,20],station:[28,30,22],powerplant:[40,60,40],fusion:[60,90,50]});
COST.house.push([12,22,14],[16,40,20],[16,60,26]);
Object.assign(TYPE_R,{factory:6.2,school:4.8,station:7,powerplant:7.5,fusion:6});
Object.assign(FPR,{factory:[-5.2,5.2,-4.2,4.2],school:[-4.6,4.6,-3.4,3.4],station:[-6.5,6.5,-4.5,4.5],powerplant:[-7,7,-6,6],fusion:[-5.5,5.5,-5.5,5.5]});
Object.assign(SLOTJ,{factory:['machinist',4],school:['scholar',2],station:['stationmaster',1],powerplant:['engineer',3],fusion:['engineer',2]});
Object.assign(BT,{factory:'Factory',school:'Academy',station:'Railway Station',powerplant:'Power Station',fusion:'Fusion Reactor'});
for(const g of TOOLDEFS)if(g[0]==='Build')for(const k of ['factory','school','station','powerplant','fusion'])g[1].push(['b:'+k,BT[k],'']);
// the planner asks for the buildings of the age
const _pickNeed0=pickNeed;
pickNeed=function(sites){
  const L=_pickNeed0(sites),p=popN(),e=G.era||0,building=t=>sites.some(s=>s.type===t&&s.build),stoneOk=n=>cnt('quarry')>0||G.stone>=n;
  const want=(t,ok)=>{if(ok&&!building(t)&&!L.some(n=>n.type===t))L.unshift({type:t});};// the age's own works come first
  if(e>=5){
    want('factory',p>=140&&cnt('factory')<Math.min(3,1+Math.floor(p/200))&&stoneOk(40));
    want('school',p>=150&&!cnt('school')&&stoneOk(36));
    want('station',p>=190&&cnt('factory')>0&&!cnt('station')&&stoneOk(30)&&!(typeof railHoldStation==='function'&&railHoldStation()));}
  if(e>=6)want('powerplant',p>=300&&!cnt('powerplant')&&stoneOk(60));
  if(e>=7)want('fusion',p>=480&&!cnt('fusion')&&stoneOk(90));
  if(e>=6&&cnt('school')<2)want('school',p>=300&&stoneOk(36));
  return L.filter(n=>(G.failCool[n.type+(n.variant||'')]||0)<=G.t&&(ERA_BUILD[n.type]||0)<=e);
};
// ---------------- effects of the machine age
function eraBuilt(t){const l=built(t);if(!l.length)return 0;let n=0;for(const b of l)if(G.vill.some(v=>v.work===b.id))n++;return n;}
const EMC=new Map();// era multiplier per settlement, refreshed each game hour
function eraMul(){const key=G.center?G.center.id:0,h=Math.floor(G.t),c=EMC.get(key);if(c&&c.h===h)return c.v;const v=eraMul0();EMC.set(key,{h,v});return v;}
function eraMul0(){let m=1;m+=Math.min(3,eraBuilt('factory'))*.08;if(eraBuilt('powerplant'))m+=.1;if(eraBuilt('fusion'))m+=.15;if(eraBuilt('school'))m+=.04;if(G.net)m+=Math.min(2,G.net.lines.length)*.05;return m;}
function eraPollution(){return G.poll||0;}
function eraHapF(f){const e=G.era||0;if(e<5)return;const pl=G.poll||0;if(pl>10)f.Smog=-Math.min(14,Math.round(pl/6));
  if(eraBuilt('powerplant')||eraBuilt('fusion'))f.Power=3;if(eraBuilt('school'))f.Learning=2;if(hasBuilt('station'))f.Travel=2+(typeof railTravel==='function'?railTravel():0);if(G.net&&G.net.lines.some(l=>l.kind==='highway'))f.Highway=2;}
function eraDaily(){if(G.phase!=='play'||G.menu)return;const e=G.era||0;if(e<5){G.poll=0;return;}
  const fac=eraBuilt('factory'),coal=eraBuilt('powerplant'),clean=eraBuilt('fusion');
  const relief=clamp((G.env?G.env.forest:0)/9000,0,.07); // forests near the town clean the air
  G.poll=clamp((G.poll||0)*(.88-relief)+fac*2.5+coal*4-clean*3+(G.net&&G.net.lines.some(l=>l.kind==='highway')?1.5:0),0,100);
  if(G.poll>25){G.fish=Math.max(.1,(G.fish||1)-(G.poll-25)*.0009);if(G.poll>55&&rnd()<.15){const v=G.vill.find(o=>!o.sick&&!o.arriving&&!o.leaving&&o.age<12||o.age>55);if(v)v.sick=1;}}
  // the railway brings newcomers
  const beds=bedsFree();if(hasBuilt('station')&&G.center&&!G.center.build&&G.hap>=50&&beds>=3&&G.food>popN()*2&&rnd()<.3)arriveFamily(Math.min(beds,3+Math.floor(rnd()*3)));
  if(G.poll>45&&!G.pollWarn){G.pollWarn=true;chron(`Smoke from the works hangs over ${G.town}. The river runs grey.`,true);}if(G.poll<20)G.pollWarn=false;
}
