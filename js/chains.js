'use strict';
// ================================================================ production chains and the town's market, as data
// A workshop is a row in CHAINS: what it eats, what it makes, how many hands it needs. One generic routine runs every row once a
// day, for the town as a whole: nobody buys bread one loaf at a time. The town's stores (G.goods) are consumed by the household
// demand below, and the result turns into a few felt effects (food, comfort, health) and an occasional line in the Chronicle.
//   inputs / outputs: per day at full staffing. Raw inputs are 'food','wood','stone' (the stores of the settlement); anything else is a good.
const CHAINS={
  bakery:{job:'baker',workers:2,inputs:{food:3,wood:1},outputs:{bread:4}},
  brewery:{job:'brewer',workers:2,inputs:{food:2,wood:1},outputs:{ale:3}},
  weaver:{job:'weaver',workers:2,inputs:{wood:1},outputs:{cloth:3}},
  tannery:{job:'tanner',workers:2,inputs:{food:1},outputs:{leather:2}},
  kiln:{job:'potter',workers:1,inputs:{wood:2},outputs:{pottery:3}},
  bronze_foundry:{job:'founder',workers:2,inputs:{wood:2,stone:1},outputs:{tools:2}},
  apothecary:{job:'healer',workers:1,inputs:{wood:1},outputs:{medicine:2}},
  scriptorium:{job:'scribe',workers:2,inputs:{wood:1},outputs:{books:1}},
  gasworks:{job:'stoker',workers:3,inputs:{wood:2},outputs:{gas:4}}};
// household demand: per person per day, and what a good that is in stock does for the town
const GOODS={
  bread:{n:'bread',eat:.18,food:1.4},ale:{n:'ale',eat:.04,joy:3},cloth:{n:'cloth',eat:.02,joy:2},leather:{n:'leather',eat:.015,joy:1},
  pottery:{n:'pottery',eat:.02,joy:2},books:{n:'books',eat:.008,joy:2},gas:{n:'gas light',eat:.05,joy:2},
  tools:{n:'tools',eat:.012,work:1},medicine:{n:'medicine',eat:.01,heal:1}};
const JOBNAME={baker:'Baker',brewer:'Brewer',weaver:'Weaver',tanner:'Tanner',potter:'Potter',founder:'Founder',healer:'Healer',scribe:'Scribe',stoker:'Stoker'};
Object.assign(JOBN,JOBNAME);
for(const [t,c] of Object.entries(CHAINS))SLOTJ[t]=[c.job,c.workers];
SAVE_PER.push('goods');PERKEYS.push('goods');
// wooden workshops burn more easily; the new civic buildings take the burn rate of their age
{const _f=flam;flam=function(b){const d=BDEF[b.type];if(!d)return _f(b);const base=[.4,.35,.22,.1,.08,.05,.02,.01][d.age];return CHAINS[b.type]&&['bakery','kiln','bronze_foundry','brewery','gasworks'].includes(b.type)?base*1.6:base;};}
function goodsOf(){return G.goods||(G.goods={});}
function chainsDaily(){if(G.phase!=='play'||G.menu)return;const gs=goodsOf(),p=popN();if(!p)return;const made={};
  for(const b of buildings){const c=CHAINS[b.type];if(!c||b.build||b.upg||b.fire)continue;
    const staff=Math.min(c.workers,G.vill.filter(v=>v.work===b.id&&!v.sick&&!v.arriving).length),eff=staff/c.workers;if(eff<=0)continue;
    let ok=true;for(const k in c.inputs){const have=k==='food'||k==='wood'||k==='stone'?G[k]:gs[k]||0;if(have<c.inputs[k]*eff){ok=false;break;}}
    if(!ok){b._idle=(b._idle||0)+1;continue;}b._idle=0;
    for(const k in c.inputs){if(k==='food'||k==='wood'||k==='stone')G[k]-=c.inputs[k]*eff;else gs[k]-=c.inputs[k]*eff;}
    for(const k in c.outputs){gs[k]=Math.min(60+p,(gs[k]||0)+c.outputs[k]*eff);made[k]=(made[k]||0)+c.outputs[k]*eff;}}
  // the household side: the whole town eats, wears, drinks and reads at once
  let joy=0,fed=0;G.goodsCover={};
  for(const k in GOODS){const g=GOODS[k],need=p*g.eat,have=gs[k]||0,use=Math.min(have,need),cover=need>0?use/need:0;gs[k]=have-use;G.goodsCover[k]=cover;
    if(g.food)G.food+=use*g.food,fed+=use;if(g.joy)joy+=g.joy*cover;
    if(g.work&&use>0){G.wood+=use*3;G.stone+=use*1.5;}
    if(g.heal&&use>0){let n=Math.ceil(use);for(const v of G.vill){if(n<=0)break;if(v.sick){v.sick=0;n--;}}}}
  G.goodsJoy=Math.min(8,joy);
  if(fed>p*.1&&rnd()<.04)chron(`The bakers' ovens kept ${G.town} fed this season.`);
}
{const _h=eraHapF;eraHapF=function(f){_h(f);if(G.goodsJoy>=1)f.Goods=Math.round(G.goodsJoy);};}
// ================================================================ events: a short table, looked at once a day
// {id, era, p(): chance this day, fx(): what happens}. Nothing is computed per building per frame; a fire is a weighted draw.
const EVENTS=[
  {id:'fire',era:0,p(){if(seasonN()===3)return 0;let r=0;for(const b of buildings){if(b.build||b.fire)continue;r+=flam(b);}
      return 1-Math.exp(-r*.0028*(seasonN()===1?1.6:1)*(G.drought?2.4:1));},
   fx(){const c=buildings.filter(b=>!b.build&&!b.fire&&flam(b)>0);if(!c.length)return;let t=0;for(const b of c)t+=flam(b);let x=rnd()*t,b0=c[0];for(const b of c){x-=flam(b);if(x<=0){b0=b;break;}}
      ignite(b0,'A cooking fire got out of hand at the '+(b0.info?b0.info.name:'house')+'.');
      // a crowded, dry quarter can turn it into a Great Fire: a few neighbours catch at once and it is remembered
      const near=c.filter(o=>o!==b0&&Math.hypot(o.x-b0.x,o.z-b0.z)<16&&flam(o)>=.2);
      if(near.length>=4&&(G.drought||seasonN()===1)&&rnd()<.4){const n=1+Math.floor(rnd()*Math.min(3,near.length));for(let i=0;i<n;i++)ignite(near.splice(Math.floor(rnd()*near.length),1)[0],null);
        G.sad=Math.min(20,G.sad+4);chron(`The Great Fire of ${G.town}: the flames leapt from roof to roof and ${n+1} buildings were alight at once.`,true);}}},
  {id:'harvest',era:0,p(){const s=seasonN();return (s===2&&cnt('farm')>=3&&(G.fish||1)>0)?.04:0;},
   fx(){const a=Math.round(popN()*2+cnt('farm')*6);G.food+=a;G.joy=Math.min(20,(G.joy||0)+3);chron(`A bumper harvest: the barns of ${G.town} are full.`,true);}},
  {id:'fair',era:2,p(){return built('market').length&&seasonN()!==3?.03:0;},
   fx(){G.wood+=18;G.stone+=10;G.joy=Math.min(20,(G.joy||0)+2);chron(`Travelling merchants came to the market of ${G.town} and the folk traded well.`);}},
  {id:'sickyear',era:2,p(){return G.era>=2&&popN()>=40&&!(G.goodsCover&&G.goodsCover.medicine>.3)?.012:0;},
   fx(){const v=G.vill.filter(o=>!o.sick&&!o.arriving);for(let i=0;i<Math.min(4,v.length);i++)pickA(v).sick=1;chron(`A fever went round ${G.town}.`,true);}}];
function eventsDaily(){chainsDaily();for(const e of EVENTS){if((G.era||0)<e.era||G.phase!=='play')continue;const p=e.p();if(p>0&&rnd()<p)e.fx();}}
