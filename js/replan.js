'use strict';
// ================================================================ era renewal: no building outlives its age
// When the age advances the folk renew their town a few buildings at a time:
//   - houses climb straight to the age's level (wattle huts and timber houses are gone by the Industrial Age),
//   - civic and working buildings are rebuilt in the style of the age (TIERED, era_civic.js / era_tiers.js),
//   - what has no modern form is pulled down and its land re-planned: hunters' lodges and lumber/fishing camps are rebuilt as
//     yards and plants in the new district, the medieval castle makes way for the modern quarter, the coal power station for fusion.
// A new street plan is drawn for the age (ring road, wider town) and the freed land is re-plotted.
//
// OBSOLETE TABLE. bAge(b) is the age a building belongs to; minAgeFor(b,e) the oldest age allowed to stand in age e.
//   age:        0 Stone 1 Bronze 2 Iron 3 Medieval 4 High Medieval 5 Industrial 6 Modern 7 Futuristic
//   house       level 0,1,2,3,4,5,6 -> age 0,1,2,3,5,6,7        hall level 0..5 -> 0,1,4,5,6,7
//   church      tier 0 Stone Circle,1 Timber Temple,2 Stone Church,3 Meditation Hall,4 Temple of Light -> 0,2,4,6,7
//   tiered      market tavern smith mill well camp lodge quarry farm tower dock shipyard fishmkt sawmill mason factory station:
//               tier 0 = its natural age (RN_NAT), tier 1,2,3 -> 5,6,7 (factory/station: tier 0,1 -> 5)
//   castle      age 3, no modern form: demolished from the Modern Age (6)      powerplant age 6: demolished in the Futuristic Age once a fusion reactor stands
//   minimum age allowed in era e (RN_MIN):  e0-2: 0   e3: 1   e4: 2   e5: 3   e6: 5   e7: 6
// Houses, hall and church are held to it from the Medieval Age on; the working buildings from the Industrial Age on
// (stone-age camps and fields are right for a medieval town).
const RN_MIN=[0,0,0,1,2,3,5,6];
const RN_NAT={market:2,tavern:2,smith:1,mill:2,well:1,camp:0,lodge:0,quarry:0,farm:0,tower:2,dock:1,shipyard:2,fishmkt:1,sawmill:2,mason:2,factory:5,station:5};
function bAge(b){const t=b.type,L=b.level||0;
  if(t==='house')return [0,1,2,3,5,6,7][Math.min(6,L)];
  if(t==='hall')return [0,1,4,5,6,7][Math.min(5,L)];
  if(t==='church')return [0,2,4,6,7][Math.min(4,tierOf(b))];
  if(t==='castle')return 3;if(t==='school')return 5;if(t==='powerplant')return 6;if(t==='fusion')return 7;
  if(t in RN_NAT){const tr=tierOf(b);if(t==='factory'||t==='station')return [5,5,6,7][Math.min(3,tr)];return tr<=0?RN_NAT[t]:[5,6,7][Math.min(3,tr)-1];}
  return 9;}
function minAgeFor(b,e){e=Math.min(7,e==null?(G.era||0):e);const t=b.type;
  if(t==='castle')return e>=6?99:0;
  if(t==='powerplant')return e>=7&&buildings.some(o=>o.type==='fusion'&&!o.build)?99:0;
  if(t==='house'||t==='hall'||t==='church')return RN_MIN[e];
  if(t in RN_NAT)return e>=5?RN_MIN[e]:0;
  return 0;}
const isObsolete=(b,e)=>bAge(b)<minAgeFor(b,e);
const maxHouseLevel=e=>[0,1,2,3,3,4,5,6][Math.min(7,e)];
// ---------------------------------------------------------------- pulling a building down
function rnDemolish(b,why){const occ=G.vill.filter(v=>v.home===b.id&&!v.leaving).length;
  for(const v of G.vill){if(v.home===b.id)v.home=0;if(v.work===b.id){v.work=0;v.job=null;}if(v.site===b.id)v.site=0;if(v.inside===b.id)v.inside=0;}
  const cost=costOf(b.type,b.variant,b.level||0)||[0,0];G.wood+=Math.floor((cost[0]||0)*.35);G.stone+=Math.floor((cost[1]||0)*.2);// salvage
  if(typeof tfDust==='function')tfDust(b.x,b.z,22,[.6,.55,.5]);
  removeBuilding(b);rebuildNear(b.x,b.z,34);gridDirty=true;refreshCivic();
  if(occ&&b.type==='house'&&occ>=2)G.sad=Math.min(20,G.sad+.2);
  chron(why);assignHomes();assignJobs();}
// ---------------------------------------------------------------- renewal
const RNW={nm:{camp:'camp',lodge:"hunters' lodge",quarry:'quarry',farm:'farm',tower:'tower',dock:'dock',shipyard:'shipyard',fishmkt:'fish market',sawmill:'sawmill',mason:"mason's yard",factory:'factory',station:'station',market:'market',tavern:'tavern',smith:'smithy',mill:'mill',well:'well',church:'church',house:'house'}};
const rnName=b=>b.type==='camp'?(b.variant==='fish'?'fishing camp':'lumber camp'):(RNW.nm[b.type]||b.type);
function rnTarget(b,e){// the level / tier a renewed building is raised to
  if(b.type==='house')return maxHouseLevel(e);return eraTierFor(b.type,e);}
function rnAfford(b,to){const [w,s]=costOf(b.type,b.variant,to);return G.wood>=w*.5&&(s<=0||G.stone>=s*.4||(cnt('quarry')>0&&G.stone>=s*.15));}
function rnStats(){const e=G.era||0,o={};let n=0;for(const b of buildings){if(b.build)continue;if(isObsolete(b,e)){const k=b.type+(b.level!=null?'L'+b.level:'');o[k]=(o[k]||0)+1;n++;}}return {n,o};}
function renewTick(){
  if(MODE!=='god'||G.phase!=='play'||G.menu||!G.center||G.center.build)return;const e=G.era||0,P=G.plan;
  if(P&&P.v>=3&&(P.eraSeen||0)<e){P.eraSeen=e;try{rnNewPlan(P,e);}catch(err){console.error('new plan',err);}}
  if(e<3)return;
  const p=popN(),ups=buildings.filter(b=>b.upg).length,sites=buildings.filter(b=>b.build).length,cap=2+Math.floor(p/24);
  const stale=buildings.filter(b=>!b.build&&!b.upg&&!b.fire&&b!==G.center&&isObsolete(b,e));
  if(!stale.length)return;
  // 1. what has no modern form is pulled down (one at a time; never while the town is under raid or starving)
  if(!(G.raid&&G.raid.active)&&G.food>p*2&&sites<4+Math.floor(p/30)){
    const dem=stale.filter(b=>b.type==='castle'||b.type==='powerplant'||((b.type==='camp'||b.type==='lodge')&&(b.level||0)===0&&e>=5));
    for(const b of dem){
      if(b.type==='camp'||b.type==='lodge'){// keep the supply going: wood and food must have another source or a stock
        const same=buildings.filter(o=>o!==b&&o.type===b.type&&(o.variant||'')===(b.variant||'')&&!o.build&&(o.level||0)>0).length;
        const stock=b.type==='lodge'?G.food>p*5:b.variant==='fish'?G.food>p*5:G.wood>90;if(!same&&!stock)continue;}
      if(b.type==='castle'&&(G.raids>0&&G.raid&&!G.raid.over))continue;
      const why=b.type==='castle'?`The old castle of ${G.town} was pulled down; its stones will raise the new quarter.`:b.type==='powerplant'?`The old power station was shut down and pulled down: fusion has replaced it.`:
        `The folk pulled down the old ${rnName(b)}; a yard of the new age will rise in the works district.`;
      rnDemolish(b,why);G.failCool={};if(P&&P.v>=3){P.reT=Math.min(P.reT||0,G.t);try{lyRegen(P,null);}catch(err){console.error(err);}}return;}}
  // 2. rebuild in the style of the age: oldest first, nearest the square first
  if(G.hap<30||ups>=cap)return;
  const c=G.center;stale.sort((a,b)=>bAge(a)-bAge(b)||Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z));
  let started=0;
  for(const b of stale){if(ups+started>=cap||started>=3)break;if(b.type==='castle'||b.type==='powerplant'||b.type==='hall')continue;
    if((b.type==='camp'||b.type==='lodge')&&(b.level||0)===0&&e>=5)continue;// replaced rather than altered
    const to=rnTarget(b,e);if((b.type==='house'?(b.level||0):tierOf(b))>=to)continue;
    if(!rnAfford(b,to))continue;
    startUpgrade(b,to);started++;
    if(b.type!=='house'&&(RNW._ln=(RNW._ln||0)+1)%3===1)chron(`The folk began to rebuild the ${rnName(b)} in the style of the new age.`);}
}
// a new age draws a new plan: a ring road, a wider town, and the land freed by demolition is re-plotted
function rnNewPlan(P,e){if(e<3)return;P.gen=(P.gen||0)+1;
  const n0=P.streets.length;
  if(e>=5&&!P.ringed&&P.tpl!=='ribbon'&&P.tpl!=='terrace'){P.ringed=1;const rad=Math.max(36,P.z.mix*P.sc*.95+8),C=P.C,defs=[{pts:lyArc(C[0],C[1],rad,0,TAU,2.4,P.seed+77),hw:2.6,kind:'ring',smax:.5}];
    const added=lyLay(P,defs,{avoidB:true});for(const s of added){s.gen=P.gen;paintStreetTo(s,s.pts.length-1);}}
  if(e>=5&&!P.ringed2&&(P.tpl==='ribbon'||P.tpl==='terrace')){P.ringed2=1;}
  if(e>=6){// boulevards: the main streets are widened and re-laid
    const w=e>=7?3.5:3.0;let n=0;for(const s of P.streets)if(s.kind==='main'&&s.hw<w){const was=s.painted;s.hw=w;n++;if(was>0){s.painted=0;paintStreetTo(s,was);}}
    if(n){P.plots=P.plots.filter(p=>!streetHit(fpRect(p.x,p.z,p.rot,fpOf('house',p.w))));if(typeof netPaint==='function'&&G.net&&G.net.paved)netPaint();}}
  P.sc=Math.min(1.95,+(P.sc+.12).toFixed(2));lyLay(P,lyDefs(P,lyRlen(P)),{avoidB:true});
  const added=P.streets.slice(n0);let np=0;for(const s of added)np+=lyPlots(P,s,null,true);
  for(let i=0;i<n0;i++)np+=lyPlots(P,P.streets[i],null,true);
  G.failCool={};G.siteFail=null;
  chron(`${G.town} drew up a new plan for the new age: ${added.length} new street${added.length===1?'':'s'}${P.ringed&&e>=5&&added.some(s=>s.kind==='ring'&&s.hw>=2.6)?', a ring road':''} and ${np} new plots.`,true);}
// the old modernizer is superseded
modernizeTick=function(){};
{const _pt=planTick;planTick=function(){_pt.apply(this,arguments);try{renewTick();}catch(err){console.error('renew tick',err);}};}
// the planner does not rebuild what the age has outgrown
{const _pn=pickNeed;pickNeed=function(sites){const L=_pn(sites),e=G.era||0;return e>=6?L.filter(n=>n.type!=='castle'):L;};}
