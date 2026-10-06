'use strict';
// ================================================================ trade between peoples
// Where a people live decides what they have too much of: timber for the forest folk, grain and fish for the plains and
// the shore, stone for the hill folk. When one people have a surplus the other lacks, and the other can give something back,
// a merchant sets out on foot with a cargo and returns with the answer. Roads wear in along the way.
const TRES=['food','wood','stone'],TVAL={food:1,wood:1.4,stone:2.2},TNAME={food:'grain and fish',wood:'timber',stone:'stone'};
const tBuf=(r,pop)=>r==='food'?pop*6+30:r==='wood'?40+pop*1.2:30+pop*.8;
function tState(i){const st=i===TOWNS.cur?G:TOWNS.list[i].st;const pop=st.vill.filter(v=>!v.leaving&&!v.arriving).length;const o={i,pop,sur:{},def:{}};
  for(const r of TRES){const b=tBuf(r,pop),h=st[r];o.sur[r]=Math.max(0,h-b*1.3);o.def[r]=Math.max(0,b*.9-h);}return o;}
function tryTrade(a,b){const A=tState(a),B=tState(b);if(A.pop<12||B.pop<12)return false;
  let x=null,bx=8;for(const r of TRES){const q=Math.min(A.sur[r],B.def[r])*TVAL[r];if(q>bx){bx=q;x=r;}}if(!x)return false;
  let y=null,by=0;for(const r of TRES){if(r===x)continue;const q=Math.min(B.sur[r],Math.max(A.def[r],0))*TVAL[r]+B.sur[r]*.2;if(B.sur[r]>8&&q>by){by=q;y=r;}}if(!y)return false;
  const ax=Math.floor(Math.min(A.sur[x],B.def[x],typeof railCap==='function'?railCap(a,b,70):70)),ay=Math.floor(Math.min(B.sur[y],ax*TVAL[x]/TVAL[y]));if(ax<8||ay<5)return false;
  return withSettlement(a,()=>{if(!G.center||G.center.build)return false;const m=G.vill.find(v=>!v.mission&&!v.leaving&&!v.arriving&&!v.sick&&v.age>=18&&v.age<55&&v.job!=='guard'&&v.job!=='builder');if(!m)return false;
    const dst=sGet(b,'center');if(!dst||dst.build)return false;G[x]-=ax;m.mission={to:b,from:a,cx:x,ax,cy:y,ay,phase:'out',t0:G.t,got:0};m.job=null;m.work=0;m.timer=0;m.path=null;
    chron(`A caravan set out from ${G.town} for ${sName(b)}, laden with ${ax} measures of ${TNAME[x]}.`);return true;});}
function tradeDaily(){if(!SHARED||G.phase!=='play'||G.menu)return;const alive=TOWNS.list.map((s,i)=>i).filter(i=>!TOWNS.list[i].dead);if(alive.length<2)return;
  if(!G.tradeCool)G.tradeCool={};const d=dayN();
  for(let p=0;p<alive.length;p++)for(let q=p+1;q<alive.length;q++){const a=alive[p],b=alive[q],key=a+'-'+b;if((G.tradeCool[key]||0)>d)continue;
    if(tryTrade(a,b)||tryTrade(b,a))G.tradeCool[key]=d+3;else G.tradeCool[key]=d+1;}}
function missionStep(v){const m=v.mission;if(!G.center){v.mission=null;return;}
  if(G.t-m.t0>110){// lost on the road
    chron(`The caravan to ${sName(m.to)} never came back.`);v.mission=null;v.carry=null;return;}
  if(typeof railMission==='function'&&railMission(v,m))return;// by train when the towns are joined by rail
  if(m.phase==='out'){const dst=sGet(m.to,'center');if(!dst||TOWNS.list[m.to].dead){m.phase='back';return missionStep(v);}
    const [x,z]=doorOf(dst);v.carry=m.cx==='food'?'loot':m.cx;v.amt=m.ax;setThought(v,`Off to trade with ${sName(m.to)}.`);
    goTo(v,x+(rnd()-.5)*3,z+(rnd()-.5)*3,vv=>tradeArrive(vv));return;}
  const [x,z]=doorOf(G.center);setThought(v,`Home to ${G.town} with news and goods.`);goTo(v,x+(rnd()-.5)*3,z+(rnd()-.5)*3,vv=>tradeHome(vv));}
function tradeArrive(v){const m=v.mission;if(!m)return;
  withSettlement(m.to,()=>{G[m.cx]+=m.ax;const pay=Math.min(m.ay,Math.floor(G[m.cy]));G[m.cy]-=pay;m.got=pay;G.joy=Math.min(25,G.joy+2.5);chron(`A caravan from ${sName(m.from)} brought ${m.ax} measures of ${TNAME[m.cx]} to ${G.town}, and went home with ${pay} measures of ${TNAME[m.cy]}.`);});
  v.carry=m.cy==='food'?'loot':m.cy;v.amt=m.got;m.phase='back';v.timer=.3;}
function tradeHome(v){const m=v.mission;if(!m)return;G[m.cy]+=m.got;G.joy=Math.min(25,G.joy+2.5);G.faith=Math.min(faithCap(),G.faith+1.5);
  G.tradeN=(G.tradeN||0)+1;(G.tradeLog=G.tradeLog||[]).unshift(`${sName(m.from)} ⇄ ${sName(m.to)}: ${m.ax} ${TNAME[m.cx]} for ${m.got} ${TNAME[m.cy]}`);if(G.tradeLog.length>4)G.tradeLog.pop();
  v.mission=null;v.carry=null;v.amt=0;assignJobs();}
function tradePanelHTML(){if(TOWNS.list.filter(s=>!s.dead).length<2)return '';let h='<h3 style="margin-top:12px">Trade</h3>';
  const on=allVill().filter(v=>v.mission).length;h+=`<div class="small" style="margin:2px 0 4px;color:var(--ink2)">${on?`${on} caravan${on>1?'s':''} on the road.`:'No caravans on the road.'} ${G.tradeN?`${G.tradeN} journeys so far.`:''}</div>`;
  for(const t of (G.tradeLog||[]).slice(0,3))h+=`<div class="small" style="color:var(--ink2);font-style:italic">${esc(t)}</div>`;return h;}
