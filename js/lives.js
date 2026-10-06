'use strict';
// ================================================================ lives: the person layer
// Every villager is a person: 2-3 lasting TRAITS (partly inherited), a sparse map of RELATIONSHIPS (friends, rivals, kin), a short
// list of MEMORIES, a mood, a life that moves through stages (child -> apprentice -> courting -> wed -> parent -> elder), and an end
// that the village notices (funeral, grave, grief, inheritance). The work is done on cheap daily / hourly batches (one 24th of the
// folk each hour) plus event hooks; nothing here runs per frame.
//
// Fields added to a villager (all saved):  born (game day), traits[], rel{id:score}, mem[{k,day,txt,w}], grf (grief 0..100),
//   lost (name of the last person they mourn), court (id of the one they are courting), appr (apprenticed), watch (trade a child
//   has been watching), hero.  Per settlement state lives in G.life = {gath,dead,graves,gy,gn,gid,custom,raid,fl}.
// Hooks defined here: lifeThink, lifeOnRemove, lifeOnNew, lifeDaily, lifeHourly (+ lifeFlavour called from setThought, lifeMatchOK /
//   lifeSortSingles called from the marriage section of newDay, lifeDoubt called by devotion for who follows a false prophet).
// Public API for other systems: lifeSummary(v), lifeMood(v), lifeAddMemory(v,k,txt,w), lifeRel(a,b,d), lifeConflict(a,b,why),
//   lifeKindness(a,b,txt), lifeComfort(v), lifeMiracle(kind,vs,txt), lifeKin(v), lifeHas(v,trait), LIFE_TRAITS.
// Flag for the animators: v.mourning is true while a villager stands at a funeral; a wedding sets v.anim='dance' for its guests.
{
const LT=['gentle','bold','cautious','devout','doubtful','sociable','solitary','curious','stubborn','generous','thrifty','dreamer','wise'];
const LT_TXT={gentle:'gentle',bold:'bold',cautious:'cautious',devout:'devout',doubtful:'doubting',sociable:'sociable',solitary:'solitary',curious:'curious',stubborn:'stubborn',generous:'generous',thrifty:'thrifty',dreamer:'a dreamer',wise:'wise'};
const CONFL=[['bold','cautious'],['devout','doubtful'],['sociable','solitary'],['generous','thrifty']];
const conflicts=(list,t)=>CONFL.some(([a,b])=>(t===a&&list.includes(b))||(t===b&&list.includes(a)));
const hasT=(v,t)=>!!(v.traits&&v.traits.includes(t));
const setT=(v,t)=>{v.thought=t;};
const clampN=(x,a,b)=>x<a?a:x>b?b:x;
// ---------------------------------------------------------------- per-settlement state
function L(){let l=G.life;if(!l)l=G.life={};if(!l.gath)l.gath=[];if(!l.dead)l.dead={};if(!l.graves)l.graves=[];if(l.gn==null)l.gn=0;if(l.gid==null)l.gid=1;if(l.fl==null)l.fl=0;if(l.raid==null)l.raid=0;return l;}
// id -> villager of the settlement in play, rebuilt at most once per game hour or when the folk change
let _idm=new Map(),_idv=null,_idh=-1,_idn=-1;
function idm(){const h=Math.floor(G.t);if(_idv!==G.vill||_idh!==h||_idn!==G.vill.length){_idm=new Map();for(const v of G.vill)_idm.set(v.id,v);_idv=G.vill;_idh=h;_idn=G.vill.length;}return _idm;}
const vid=id=>{if(!id)return null;const o=idm().get(id);return o&&!o._gone?o:null;};
const alive=v=>v&&!v._gone&&!v.leaving;
const nameOf=v=>v?v.name:'someone';
function lifeHas(v,t){return hasT(v,t);}
// ---------------------------------------------------------------- traits, memory
function rollTraits(parents){const out=[],pool=LT.filter(t=>t!=='wise');
  for(const p of parents)for(const t of (p&&p.traits)||[])if(t!=='wise'&&rnd()<.4&&!out.includes(t)&&!conflicts(out,t)&&out.length<3)out.push(t);
  const target=2+(rnd()<.4?1:0);let g=0;while(out.length<target&&g++<40){const t=pickA(pool);if(!out.includes(t)&&!conflicts(out,t))out.push(t);}return out;}
function addTrait(v,t){if(!v.traits)v.traits=[];if(v.traits.includes(t))return false;
  for(const [a,b] of CONFL){const o=t===a?b:t===b?a:null;if(o){const i=v.traits.indexOf(o);if(i>=0)v.traits.splice(i,1);}}
  v.traits.push(t);if(v.traits.length>(v.traits.includes('wise')?4:3)){const i=v.traits.findIndex(x=>x!==t&&x!=='wise');if(i>=0)v.traits.splice(i,1);}return true;}
function lifeAddMemory(v,k,txt,w){if(!v||v.kind==='bandit')return;if(!v.mem)v.mem=[];const day=dayN();
  const old=v.mem.find(m=>m.k===k&&day-m.day<12);if(old){old.day=day;old.txt=txt;old.w=w;return;}
  v.mem.unshift({k,day,txt,w:w||0});
  if(v.mem.length>8){let bi=-1,bs=1e9;for(let i=1;i<v.mem.length;i++){const m=v.mem[i],s=Math.abs(m.w)*Math.pow(.5,(day-m.day)/60)+i*.01*-1;if(s<bs){bs=s;bi=i;}}v.mem.splice(bi<0?v.mem.length-1:bi,1);}}
function memSum(v){let s=0;const day=dayN();for(const m of (v.mem||[])){const age=day-m.day;if(age>240)continue;s+=m.w*Math.pow(.5,age/40);}return clampN(s,-22,22);}
// ---------------------------------------------------------------- relationships
function setRel(a,id,d){const r=a.rel||(a.rel={});const n=clampN(Math.round((r[id]||0)+d),-100,100);if(Math.abs(n)<1&&!(id in r)){return n;}
  if(n===0)delete r[id];else r[id]=n;
  const ks=Object.keys(r);if(ks.length>16){let wk=null,ws=1e9;for(const k of ks){if(+k===id)continue;const s=Math.abs(r[k]);if(s<ws){ws=s;wk=k;}}if(wk)delete r[wk];}return n;}
function lifeRel(a,b,d,quiet){if(!a||!b||a===b)return;const pa=(a.rel&&a.rel[b.id])||0,pb=(b.rel&&b.rel[a.id])||0;
  const na=setRel(a,b.id,d),nb=setRel(b,a.id,d);
  if(quiet)return;
  if(d>0&&Math.min(pa,pb)<40&&Math.min(na,nb)>=40)friendEvent(a,b);
  else if(d<0&&Math.max(pa,pb)>-35&&Math.max(na,nb)<=-35)rivalEvent(a,b,null);}
function friendEvent(a,b){lifeAddMemory(a,'friend'+b.id,`Grew close to ${b.name}.`,3);lifeAddMemory(b,'friend'+a.id,`Grew close to ${a.name}.`,3);
  const l=L();if(l.fl>=4)return;l.fl++;
  const w=a.job&&a.job===b.job&&a.work&&a.work===b.work;
  storyEvent('friendship',{who:[a.id,b.id],txt:w?`${a.name} and ${b.name} work side by side and have become fast friends.`:`${a.name} and ${b.name} have become fast friends.`});}
function rivalEvent(a,b,why){lifeAddMemory(a,'rival'+b.id,`Fell out with ${b.name}.`,-3);lifeAddMemory(b,'rival'+a.id,`Fell out with ${a.name}.`,-3);
  const l=L();if(l.fl>=6)return;l.fl++;storyEvent('rivalry',{who:[a.id,b.id],txt:why||`${a.name} and ${b.name} cannot stand the sight of one another any more.`});}
// a quarrel, a theft, a favoured house, a lost fight: other systems may call this
function lifeConflict(a,b,why){if(!a||!b)return;setRel(a,b.id,-26);setRel(b,a.id,-26);
  lifeAddMemory(a,'grudge'+b.id,why?`${why} (${b.name}).`:`Wronged by ${b.name}.`,-4);lifeAddMemory(b,'grudge'+a.id,`Quarrelled with ${a.name}.`,-2);
  storyEvent('grudge',{who:[a.id,b.id],txt:why?`${a.name} bears a grudge against ${b.name}: ${why}`:`${a.name} bears a grudge against ${b.name}.`});}
function lifeKindness(a,b,txt){if(!a||!b)return;lifeRel(a,b,9,true);lifeAddMemory(b,'kind'+a.id,`${a.name} was good to me.`,4);lifeAddMemory(a,'gave'+b.id,`Looked after ${b.name}.`,1);
  G.joy=Math.min(25,(G.joy||0)+.3);storyEvent('kindness',{who:[a.id,b.id],txt:txt||`${a.name} was kind to ${b.name}.`});}
// ---------------------------------------------------------------- kin
function sharesParent(a,b){return !!(a.parents&&b.parents&&a.parents.some(p=>b.parents.includes(p)));}
function isKin(a,b){return a.parents&&a.parents.includes(b.id)||b.parents&&b.parents.includes(a.id)||sharesParent(a,b);}
function kinOf(v){const out={spouse:null,parents:[],children:[],siblings:[]};
  if(v.spouse)out.spouse=vid(v.spouse);
  for(const p of v.parents||[]){const x=vid(p);if(x)out.parents.push(x);}
  for(const o of G.vill){if(o===v)continue;if(o.parents&&o.parents.includes(v.id))out.children.push(o);else if(v.parents&&sharesParent(v,o))out.siblings.push(o);}
  return out;}
function lifeKin(v){return kinOf(v);}
// ---------------------------------------------------------------- mood
function lifeMood(v){let m=G.hap;if(!v.home)m-=15;if(v.sick)m-=20;
  const h=v.home&&bById(v.home);if(h&&h.type==='house')m+=(h.level||0)*2;
  m-=(v.grf||0)*.4;m+=memSum(v);
  let fr=0,ri=0;const r=v.rel;if(r)for(const k in r){if(r[k]>=40)fr++;else if(r[k]<=-35)ri++;}
  m+=Math.min(8,fr*2.5)-Math.min(6,ri*2);
  if(hasT(v,'sociable'))m+=fr?2:-3;if(hasT(v,'solitary'))m+=1;if(hasT(v,'dreamer'))m-=1;if(hasT(v,'devout')&&G.dev&&G.dev.piety>60)m+=2;if(hasT(v,'doubtful')&&G.dev&&G.dev.doubt>40)m-=3;if(hasT(v,'wise'))m+=2;
  return clampN(Math.round(m),0,100);}
function moodLabel(m,v){if((v.grf||0)>25)return 'grieving';return m>=78?'happy':m>=62?'content':m>=46?'weary':m>=30?'low':'despairing';}
// ---------------------------------------------------------------- birth, naming
function nameRel(id){const p=vid(id);if(p)return {n:p.name,f:p.female};const d=L().dead[id];return d?{n:d.n,f:d.f}:null;}
function nameFor(v,mother,father){const l=L();if(!l.custom)l.custom=pickA(['grandparent','grandparent','parent','free']);
  const used=new Set();for(const o of G.vill)if(o!==v&&o.fam===v.fam)used.add(o.name);
  const gps=[];for(const par of [father,mother])if(par)for(const g of par.parents||[]){const r=nameRel(g);if(r&&r.f===v.female&&!used.has(r.n))gps.push({n:r.n,rel:v.female?'grandmother':'grandfather'});}
  const sp=(v.female?mother:father),own=sp&&!used.has(sp.name)?{n:sp.name,rel:v.female?'mother':'father'}:null;
  let pick=null;
  if(l.custom==='grandparent'&&gps.length&&rnd()<.65)pick=pickA(gps);
  else if(l.custom==='parent'&&own&&rnd()<.55)pick=own;
  else if(rnd()<.2)pick=gps.length?pickA(gps):own;
  return pick;}
function lifeBirth(v){const o=v.parents||[],mother=vid(o[0]),father=vid(o[1]);
  const pk=nameFor(v,mother,father);let named=false;if(pk){v.name=pk.n;named=true;}
  const who=[v.id];for(const p of [mother,father])if(p){who.push(p.id);const first=!G.vill.some(c=>c!==v&&c.parents&&c.parents.includes(p.id));
    lifeAddMemory(p,'child',first?`The birth of our first child, ${v.name}.`:`${v.name} was born.`,first?9:5);lifeRel(p,v,55,true);if(p.mood!=null)p.mood=Math.min(100,p.mood+6);}
  for(const o2 of G.vill)if(o2!==v&&o2.parents&&sharesParent(o2,v))lifeRel(o2,v,30,true);
  storyEvent('birth',{who,txt:`${v.name} ${v.fam} was born${mother?` to ${mother.name}${father?' and '+father.name:''}`:''}.`});
  if(named)storyEvent('naming',{who:[v.id,...who.slice(1)],txt:`The ${v.fam}s named their new ${v.female?'daughter':'son'} ${v.name}, after the baby's ${pk.rel}: the old way of ${G.town}.`});}
// ---------------------------------------------------------------- hooks: new villager
function lifeOnNew(v,o){if(v.kind==='bandit')return;
  if(v.born==null)v.born=dayN()-Math.round((v.age||0)*5);
  if(_idv===G.vill)_idm.set(v.id,v);
  if(v.female===undefined)v.female=NF.includes(v.name);
  if(!v.rel)v.rel={};if(!v.mem)v.mem=[];if(v.grf==null)v.grf=0;
  if(!v.traits||!v.traits.length){const ps=(v.parents||[]).map(vid).filter(Boolean);v.traits=rollTraits(ps);
    if(o&&o.parents&&o.age===0&&!o.traits){try{lifeBirth(v);}catch(e){console.error('lives birth',e);}}}}
// ---------------------------------------------------------------- the lifecycle (daily)
const TRADE_LIKE={bold:['guard','hunter'],devout:['priest'],curious:['scholar','engineer','machinist','mason'],sociable:['merchant','keeper','fishmonger','clerk'],solitary:['quarry','wood','fisher','hunter'],thrifty:['merchant','clerk','miller'],generous:['priest','keeper'],gentle:['priest','farmer'],cautious:['farmer','clerk'],dreamer:['scholar','shipwright'],stubborn:['smith','mason','quarry'],doubtful:['scholar']};
function chooseTrade(v){const jobs=new Map();for(const o of G.vill)if(o.job&&o.age>=14&&o.age<=64&&!o.leaving&&!o.arriving&&o.job!=='builder'&&o.job!=='forager')jobs.set(o.job,(jobs.get(o.job)||0)+1);
  if(!jobs.size)return null;const w=new Map();for(const j of jobs.keys())w.set(j,1);
  const par=(v.parents||[]).map(vid).filter(Boolean);const sameSex=par.find(p=>p.female===v.female);
  for(const p of par)if(p.job&&w.has(p.job))w.set(p.job,w.get(p.job)+(p===sameSex?5:3));
  if(v.watch&&w.has(v.watch))w.set(v.watch,w.get(v.watch)+3);
  for(const t of v.traits||[])for(const j of TRADE_LIKE[t]||[])if(w.has(j))w.set(j,w.get(j)+2);
  let tot=0;for(const x of w.values())tot+=x;let r=rnd()*tot;for(const [j,x] of w){r-=x;if(r<=0)return j;}return [...w.keys()][0];}
function startApprentice(v){v.appr=1;const job=chooseTrade(v);if(!job)return;
  const masters=G.vill.filter(o=>o.job===job&&o.age>=18&&!o.leaving&&!o.arriving),par=(v.parents||[]).map(vid).filter(Boolean);
  let m=par.find(p=>p.job===job)||null;if(!m&&masters.length){let bd=1e9;for(const o of masters){const d=Math.hypot(o.x-v.x,o.z-v.z);if(d<bd){bd=d;m=o;}}}
  v.job=job;v.work=m?m.work:0;
  const role=(typeof JOBN!=='undefined'&&JOBN[job]||job).toLowerCase(),fam=m&&par.includes(m);
  if(m)lifeRel(v,m,10,true);lifeAddMemory(v,'apprenticed',m?`Began learning the ${role}'s trade from ${m.name}.`:`Chose the ${role}'s trade.`,3);
  storyEvent('apprentice',{who:m?[v.id,m.id]:[v.id],txt:!m?`${v.name} ${v.fam}, fourteen, has chosen the ${role}'s trade.`:fam?`${v.name} ${v.fam}, fourteen, is learning the ${role}'s trade from ${v.female?'her':'his'} ${m.female?'mother':'father'}, ${m.name}.`:`${v.name} ${v.fam}, fourteen, has become ${m.name}'s apprentice, to learn the ${role}'s trade.`});}
function wedding(a,b){a.court=0;b.court=0;setRel(a,b.id,60);setRel(b,a.id,60);
  lifeAddMemory(a,'wed',`Married ${b.name}.`,8);lifeAddMemory(b,'wed',`Married ${a.name}.`,8);
  for(const p of [a,b]){for(const k of (p.parents||[])){const q=vid(k);if(q)lifeRel(p,q,6,true);}}
  const who=[a.id,b.id];const guests=new Set(who);
  for(const p of [a,b]){for(const k of p.parents||[])guests.add(k);for(const o of G.vill)if(o.parents&&sharesParent(o,p))guests.add(o.id);
    if(p.rel){const fr=Object.keys(p.rel).filter(k=>p.rel[k]>=40).sort((x,y)=>p.rel[y]-p.rel[x]).slice(0,3);for(const k of fr)guests.add(+k);}}
  const gl=[...guests].filter(id=>vid(id)&&!vid(id).sick).slice(0,14);
  const at=(hod()<10?Math.floor(G.t/24)*24+13:Math.floor(G.t/24)*24+24+12)+rnd()*.5;
  const [x,z]=gathSpot('wedding');L().gath.push({id:L().gid++,k:'wedding',at,dur:1.6,x,z,who:gl,vid:a.id,n:`${a.name} and ${b.name}`,fired:false});
  storyEvent('wedding',{who,txt:`${a.name} and ${b.name} were wed${hasBuilt('church')?' at the '+((built('church')[0].info&&built('church')[0].info.name)||'church').toLowerCase():''}, with family and friends around them.`});}
function lifeDaily(){if(G.phase!=='play'||G.menu)return;const l=L(),day=dayN();idm();l.fl=0;
  const p=popN(),pop=G.vill;
  const singlesF=[],singlesM=[];
  for(const v of pop){if(v.arriving||v.leaving||v._gone)continue;
    if(!v.traits||!v.rel){lifeOnNew(v,null);}
    if(v.born==null)v.born=day-Math.round(v.age*5);
    // kin ties are seeded once (immigrants arrive with their parents/spouse set after they are made)
    if(!v._kr){v._kr=1;for(const k of v.parents||[]){const q=vid(k);if(q&&!(v.rel[k]>=30)){setRel(v,k,50);setRel(q,v.id,50);}}if(v.spouse&&!(v.rel[v.spouse]>=40)){setRel(v,v.spouse,60);}}
    // a wedding is the marriage section of newDay having joined two people since yesterday
    if(v._sp===undefined)v._sp=v.spouse;
    else if(v.spouse&&v.spouse!==v._sp){const q=vid(v.spouse);v._sp=v.spouse;if(q&&q.spouse===v.id&&v.id<q.id){q._sp=q.spouse;try{wedding(v,q);}catch(e){console.error('lives wedding',e);}}}
    else v._sp=v.spouse;
    if(v.grf>0)v.grf=v.grf<1?0:Math.max(0,v.grf*.93-.4);
    if(v._sk&&!v.sick){lifeAddMemory(v,'cured','Recovered from a fever that frightened everyone.',3);}
    v._sk=v.sick?1:0;
    if(v.age>=14&&!v.appr&&v.age<20){try{startApprentice(v);}catch(e){console.error('lives appr',e);}}
    else if(!v.appr&&v.age>=20)v.appr=1;
    if(v.age>=58&&!hasT(v,'wise')&&rnd()<.03)addTrait(v,'wise');
    if(G.starve>=1&&v.age>=2)lifeAddMemory(v,'hungry','The hungry days: I will not forget them.',-4);
    // relationships fade a little unless they are kept up
    const r=v.rel;for(const k in r){const q=idm().get(+k);if(!q){delete r[k];continue;}let s=Math.trunc(r[k]*.985);if(Math.abs(s)<2)delete r[k];else r[k]=s;}
    // memories grow faint
    if(v.mem.length){const keep=v.mem.filter(m=>day-m.day<200||Math.abs(m.w)>=6);if(keep.length!==v.mem.length)v.mem=keep;}
    if(v.court){const q=vid(v.court);if(!q||q.spouse||v.spouse||((v.rel[v.court]||0)<8)){v.court=0;}}
    if(!v.spouse&&!v.court&&v.age>=18&&v.age<46&&!v.sick)(v.female?singlesF:singlesM).push(v);
    else if(v.court&&!v.spouse&&v.age>=18&&v.age<46)(v.female?singlesF:singlesM).push(v);
  }
  try{courtships(singlesF,singlesM);}catch(e){console.error('lives court',e);}
  try{dailyKindness(p);}catch(e){console.error('lives kind',e);}
}
function courtships(sf,sm){
  for(const w of sf){if(w.spouse)continue;
    // two admirers: a coolness between them
    const adm=[];if(w.rel)for(const k in w.rel){if(w.rel[k]>=20){const m=idm().get(+k);if(m&&!m.female&&!m.spouse&&m.age>=18&&m.age<46)adm.push(m);}}
    if(adm.length>=2&&rnd()<.2){adm.sort((a,b)=>w.rel[b.id]-w.rel[a.id]);const a=adm[0],b=adm[1];if(((a.rel[b.id]||0)>-30)&&L().fl<6){setRel(a,b.id,-30);setRel(b,a.id,-30);
      rivalEvent(a,b,`${a.name} and ${b.name} both hope to win ${w.name}, and have not spoken a kind word since.`);}}
    if(w.court)continue;
    let best=null,bs=20;for(const k in w.rel){const m=idm().get(+k);if(!m||m.female||m.spouse||m.court||m.age<18||m.age>=46||isKin(w,m)||m.sick)continue;if(Math.abs(m.age-w.age)>14)continue;const s=Math.min(w.rel[k],(m.rel&&m.rel[w.id])||0);if(s>=bs){bs=s;best=m;}}
    if(best){w.court=best.id;best.court=w.id;lifeAddMemory(w,'court',`Walking out with ${best.name}.`,4);lifeAddMemory(best,'court',`Walking out with ${w.name}.`,4);
      storyEvent('courtship',{who:[w.id,best.id],txt:`${best.name} and ${w.name} have been seen walking together at day's end. The neighbours are smiling.`});}
  }
}
function dailyKindness(p){const l=L();let made=0;
  const sick=G.vill.filter(v=>v.sick&&!v.arriving);
  if(sick.length&&rnd()<.45){const s=pickA(sick);let h=null;
    if(s.rel){let bs=20;for(const k in s.rel){const o=idm().get(+k);if(o&&!o.sick&&o.age>=14&&s.rel[k]>=bs){bs=s.rel[k];h=o;}}}
    if(!h){for(let i=0;i<14&&!h;i++){const o=pickA(G.vill);if(o!==s&&o.age>=16&&!o.sick&&!o.leaving&&!o.arriving&&(hasT(o,'generous')||hasT(o,'gentle'))&&Math.hypot(o.x-s.x,o.z-s.z)<60)h=o;}}
    if(h){lifeKindness(h,s,`${h.name} sat up with sick ${s.name} and kept the fire going until the fever broke.`);made++;}}
  if(made<2&&(G.food<p*3||G.starve>0)&&rnd()<.5){let h=null;for(let i=0;i<20&&!h;i++){const o=pickA(G.vill);if(o.age>=16&&hasT(o,'generous')&&!o.leaving&&!o.arriving&&!o.sick)h=o;}
    if(h){const needy=[];for(let i=0;i<20;i++){const o=pickA(G.vill);if(o!==h&&o.home!==h.home&&!o.leaving&&!o.arriving&&(o.mood||60)<55)needy.push(o);if(needy.length>=3)break;}
      if(needy.length){const n=pickA(needy);lifeKindness(h,n,`With the stores running thin, ${h.name} shared their own supper with ${n.name}'s household.`);made++;}}}
  // the grieving are sat with
  if(made<2){const g=[];for(const v of G.vill)if((v.grf||0)>30&&!v.leaving)g.push(v);
    if(g.length&&rnd()<.5){const v=pickA(g);let c=null,bs=15;if(v.rel){for(const k in v.rel){const o=idm().get(+k);if(o&&!o.sick&&v.rel[k]>=bs&&o.age>=12){bs=v.rel[k];c=o;}}}
      if(!c){for(let i=0;i<14&&!c;i++){const o=pickA(G.vill);if(o!==v&&o.age>=16&&!o.sick&&!o.leaving&&hasT(o,'gentle')&&Math.hypot(o.x-v.x,o.z-v.z)<50)c=o;}}
      if(c){lifeRel(c,v,6,true);v.grf=Math.max(0,v.grf-7);lifeAddMemory(v,'comforted',`${c.name} sat with me when I was grieving.`,3);
        storyEvent('kindness',{who:[c.id,v.id],txt:`${c.name} sat with ${v.name}${v.lost?', still grieving '+v.lost:''}, and said little, which was exactly right.`});}}}
}
// ---------------------------------------------------------------- hourly: friendships through shared time; mood; gatherings; the end of a raid
function lifeHourly(){if(G.phase!=='play'||G.menu)return;const l=L(),H=Math.floor(G.t);idm();
  try{gatherings(l);}catch(e){console.error('lives gath',e);}
  try{raidWatch(l);}catch(e){console.error('lives raid',e);}
  const pop=G.vill,n=pop.length;if(!n)return;
  const byWork=new Map();for(const v of pop)if(v.work&&v.age>=14&&!v.arriving&&!v.leaving){let a=byWork.get(v.work);if(!a)byWork.set(v.work,a=[]);a.push(v);}
  for(const v of pop){if((v.id+H)%24!==0)continue;if(v.arriving||v.leaving||v.age<3)continue;
    const cands=[];
    if(v.work&&v.age>=14){const a=byWork.get(v.work);if(a&&a.length>1)for(let i=0;i<3;i++){const o=pickA(a);if(o!==v)cands.push(o);}}
    for(let i=0;i<10;i++){const o=pop[(rnd()*n)|0];if(o===v||o.arriving||o.leaving)continue;if(o.home&&o.home===v.home||Math.hypot(o.x-v.x,o.z-v.z)<18)cands.push(o);}
    for(const c of cands){if(Math.abs(c.age-v.age)>(v.age<14?4:20)&&(v.age<14||c.age<14))continue;if(v.age<14!==c.age<14&&!(c.age>=14&&isKin(v,c)))continue;
      let d=1+(rnd()<.5?1:0);
      if(hasT(v,'sociable'))d+=1.5;if(hasT(c,'sociable'))d+=1;if(hasT(v,'solitary'))d-=1.2;if(hasT(c,'solitary'))d-=.8;
      if(v.work&&v.work===c.work)d+=1;
      let like=0;for(const t of v.traits||[]){if(c.traits&&c.traits.includes(t)&&t!=='wise')like++;}
      for(const [a,b] of CONFL){if((hasT(v,a)&&hasT(c,b))||(hasT(v,b)&&hasT(c,a)))like--;}
      if(hasT(v,'stubborn')&&hasT(c,'stubborn'))like-=2;if(hasT(v,'bold')&&hasT(c,'bold'))like-=1;
      d+=like*1.2;
      if(hasT(v,'gentle')||hasT(c,'gentle'))d+=.8;
      if(v.age>=18&&c.age>=18&&v.age<46&&c.age<46&&v.female!==c.female&&!v.spouse&&!c.spouse&&!isKin(v,c))d+=2+(rnd()<.3?2:0);
      d+=rnd()*2-1.2;
      if(d>=-.8&&d<=.8)continue;
      if(d>0)d*=1-Math.max(0,(v.rel[c.id]||0))/105;if(d>0&&d<.5)d=.5;
      lifeRel(v,c,Math.round(d));
    }
    v.mood=lifeMood(v);
  }
}
// ---------------------------------------------------------------- the end of a raid: who stood, who is remembered
function raidWatch(l){const on=G.raid&&G.raid.active;
  if(on){l.raid=1;for(const v of G.vill)if(v.job==='guard'&&!v.leaving)v._fought=true;return;}
  if(!l.raid)return;l.raid=0;
  const fought=[];for(const v of G.vill)if(v._fought){fought.push(v);v._fought=false;}
  let heroes=0;for(const v of fought){const bold=hasT(v,'bold');lifeAddMemory(v,'raid',bold?'Stood against the raiders and lived.':'Faced the raiders and came home.',bold?3:-2);
    if((bold||v.job==='guard')&&!v.hero&&heroes<1&&rnd()<.3){heroes++;v.hero=true;storyEvent('hero',{who:[v.id],big:true,txt:`${fullName(v)} stood in the road when the raiders came, and the others found their courage behind ${v.female?'her':'him'}.`});G.joy=Math.min(25,G.joy+1);}}
  for(const v of G.vill)if(!v.leaving&&!v.arriving&&v.age>=6&&!fought.includes(v)&&rnd()<.25)lifeAddMemory(v,'raid','Hid while the raiders ravaged the town.',-2);
}
// ---------------------------------------------------------------- gatherings: funerals and weddings
function gathSpot(k){const l=L();
  if(k==='funeral'){const gy=plot();if(gy)return [gy.x,gy.z];}
  const ch=built('church')[0];if(ch){const d=doorOf(ch);return [d[0],d[1]+(k==='wedding'?1.5:0)];}
  const w=built('well')[0]||built('market')[0]||G.center;if(w){const d=doorOf(w);return [d[0],d[1]];}return [0,0];}
function gathering(v){const l=G.life;if(!l||!l.gath.length)return null;
  for(const g of l.gath)if(!g.done&&G.t>=g.at-.9&&G.t<g.at+g.dur&&g.who.includes(v.id))return g;return null;}
function gatherings(l){if(!l.gath.length)return;
  for(const g of l.gath){
    if(!g.fired&&G.t>=g.at){g.fired=true;
      if(g.k==='funeral'){const who=g.who.slice(0,6);const rite=['stones were piled over the grave by those who loved '+g.n,'those who loved '+g.n+' laid '+(g.f?'her':'him')+' to rest by the old stones','those who loved '+g.n+' laid '+(g.f?'her':'him')+' to rest beside the church','those who loved '+g.n+' laid '+(g.f?'her':'him')+' to rest in the churchyard','those who loved '+g.n+' laid '+(g.f?'her':'him')+' to rest in the churchyard','those who loved '+g.n+' laid '+(g.f?'her':'him')+' to rest in the cemetery','those who loved '+g.n+' laid '+(g.f?'her':'him')+' to rest in the memorial garden','those who loved '+g.n+' gathered under the pale light of the memorial'][clampN(G.era||0,0,7)];
        storyEvent('funeral',{who:[g.vid||0,...who].filter(Boolean),txt:`${g.who.length} gathered quietly: ${rite}.`});}
    }
    if(!g.done&&G.t>=g.at+g.dur){g.done=true;
      if(g.k==='funeral'){for(const id of g.who){const m=vid(id);if(m){m.mourning=false;m.grf=Math.max(0,(m.grf||0)-8);lifeAddMemory(m,'funeral',`Said goodbye to ${g.n} together with the others.`,-1);}}
        placeGrave(g.gv);}
      else{for(const id of g.who){const m=vid(id);if(m){m.mourning=false;lifeAddMemory(m,'wedfest',`Danced at the wedding of ${g.n}.`,2);}}G.joy=Math.min(25,G.joy+1.2);}
    }}
  if(l.gath.length>12||l.gath.some(g=>g.done&&G.t>g.at+g.dur+24))l.gath=l.gath.filter(g=>!(g.done&&G.t>g.at+g.dur+24));
}
// ---------------------------------------------------------------- death
function causeOf(v){const a=v.age;
  if(G.raid&&G.raid.active&&G.bandits&&G.bandits.length)return 'raid';
  if(G.dev&&G.dev.cult&&G.dev.cult.strength>.2&&a<64&&!v.sick)return 'strife';
  if(a>66)return 'age';if(G.starve>=2)return 'hunger';if(v.sick)return 'sickness';return 'accident';}
function deathText(v,cause){const n=v.name,a=Math.floor(v.age),child=v.age<14,it=v.female?'her':'his';
  if(child)return pickA([`Little ${n} ${v.fam}, ${a}, was taken. The whole street grieved.`,`${n} ${v.fam}, a child of ${a}, did not wake. ${G.town} held its breath.`]);
  switch(cause){
    case 'age':return pickA([`${fullName(v)} died peacefully, aged ${a}, with the family close by.`,`${fullName(v)}, aged ${a}, laid down ${it} tools for the last time.`,`${fullName(v)} slipped away in ${it} sleep, aged ${a}, full of years.`]);
    case 'sickness':return `${fullName(v)}, aged ${a}, was taken by the fever.`;
    case 'hunger':return `${fullName(v)}, aged ${a}, did not live through the hungry days.`;
    case 'raid':return `${fullName(v)}, aged ${a}, fell when the raiders came.`;
    case 'strife':return `${fullName(v)}, aged ${a}, was lost to the bitterness that had grown in ${G.town}.`;
    default:return `${fullName(v)}, aged ${a}, was lost too soon.`;}}
function lifeOnRemove(v,why){if(v.kind==='bandit')return;try{
  if(v.court){const q=vid(v.court);if(q&&q.court===v.id)q.court=0;}
  if(why!=='died'||v.age==null||v.leaving)return;
  const l=L();idm();
  const k=kinOf(v);
  const cause=causeOf(v),child=v.age<14;
  l.dead[v.id]={n:v.name,f:!!v.female,p:v.parents||[],fam:v.fam,d:dayN(),j:v.job,a:Math.floor(v.age)};
  const ids=Object.keys(l.dead);if(ids.length>420){for(const id of ids.slice(0,ids.length-380))delete l.dead[id];}
  const heroic=!!v.hero||(cause==='raid'&&v.job==='guard');
  storyEvent('death',{who:[v.id],txt:deathText(v,cause),cause,age:Math.floor(v.age)});
  // who mourns: close kin first, then friends
  const mourn=new Map();const add=(o,w)=>{if(o&&o!==v&&!o._gone&&(!mourn.has(o)||mourn.get(o)<w))mourn.set(o,w);};
  if(k.spouse)add(k.spouse,62);for(const c of k.children)add(c,child?0:(c.age<14?55:42));for(const p of k.parents)add(p,child?78:38);for(const s of k.siblings)add(s,28);
  if(v.rel)for(const id in v.rel){const s=v.rel[id];if(s>=35)add(idm().get(+id),Math.min(30,s*.35));}
  if(child)for(const c of k.children)mourn.delete(c);
  for(const [m,w] of mourn){if(!w)continue;const dear=w>=38;m.grf=Math.min(100,(m.grf||0)+w*(hasT(m,'gentle')?1.2:1)*(hasT(m,'stubborn')?.8:1));m.lost=v.name;
    lifeAddMemory(m,'lost'+v.id,m===k.spouse?`Lost my ${v.female?'wife':'husband'}, ${v.name}.`:child&&k.parents.includes(m)?`Lost our little ${v.name}.`:dear?`Lost ${v.name}, who meant the world to me.`:`Lost ${v.name}.`,-Math.round(w/6));
    if(dear&&rnd()<.3){const t=hasT(m,'devout')?null:pickA(['solitary','devout','doubtful']);if(t)addTrait(m,t);}
    if(m.rel&&m.rel[v.id]!=null)delete m.rel[v.id];}
  // a murdered neighbour is not forgotten
  if(cause==='strife'&&G.dev&&G.dev.cult){const pr=vid(G.dev.cult.pid);if(pr&&pr!==v)for(const [m,w] of mourn)if(w>=38&&m!==pr)setRel(m,pr.id,-30);}
  // the household passes on: a home, a trade
  if(!child){const heirs=k.children.filter(c=>c.age>=14&&!c._gone).sort((a,b)=>b.age-a.age);
    if(heirs.length){const heir=heirs.find(c=>c.job&&c.job===v.job)||heirs[0],hm=bById(v.home),spStays=k.spouse&&k.spouse.home===v.home;
      if(hm&&hm.type==='house'&&!spStays&&heir.age>=16&&(heir.home===v.home||!heir.home)){heir.home=v.home;
        lifeAddMemory(heir,'inherit',`The family home is mine now, after ${v.name}.`,2);
        storyEvent('inherit',{who:[heir.id,v.id],txt:`${heir.name} inherited the family home from ${v.name}, and with it the chair by the hearth.`});}
      else if(v.job&&heir.job===v.job){lifeAddMemory(heir,'inherit',`I carry on ${v.name}'s work with ${v.female?'her':'his'} tools.`,2);
        storyEvent('inherit',{who:[heir.id,v.id],txt:`${heir.name} took up ${v.name}'s tools and the work that went with them.`});}}}
  // orphans are taken in
  {for(const c of k.children){if(c.age<14&&!(c.parents||[]).some(pid=>pid!==v.id&&vid(pid))){
      let g=k.children.find(o=>o.age>=18&&o!==c&&!o._gone)||null;if(!g){for(let i=0;i<16&&!g;i++){const o=pickA(G.vill);if(o.age>=24&&o.age<=60&&!o.leaving&&!o.arriving&&o!==v&&hasT(o,'generous')&&o.home)g=o;}}
      if(g&&g.home){c.home=g.home;lifeKindness(g,c,`${g.name} took in orphaned ${c.name}, who had no one left; the household made room.`);}}}}
  // the funeral, and the grave that follows it
  const gv={x:0,z:0,n:v.name,f:!!v.female,a:Math.floor(v.age),d:dayN(),e:G.era||0,h:heroic?1:0,i:v.id,fam:v.fam};
  const who=[];for(const [m,w] of mourn)if(w>=25||m===k.spouse)who.push(m);
  const pr=G.vill.find(o=>o.job==='priest'&&!o._gone&&o!==v);if(pr&&!who.includes(pr))who.push(pr);
  who.sort((a,b)=>(mourn.get(b)||0)-(mourn.get(a)||0));
  if(who.length<3){for(let i=0;i<16&&who.length<3;i++){const o=pickA(G.vill);if(o!==v&&!o._gone&&o.age>=12&&!o.sick&&!who.includes(o)&&Math.hypot(o.x-v.x,o.z-v.z)<60)who.push(o);}}
  const at=(hod()<10?Math.floor(G.t/24)*24+15:Math.floor(G.t/24)*24+24+10)+rnd()*.6;
  if(who.length&&G.phase==='play'){const [x,z]=gathSpot('funeral');l.gath.push({id:l.gid++,k:'funeral',at,dur:2.1,x,z,who:who.slice(0,14).map(o=>o.id),vid:0,n:v.name,f:!!v.female,fired:false,gv});}
  else placeGrave(gv);
  }catch(e){console.error('lives remove',e);}}
// ---------------------------------------------------------------- graves
function plot(){const l=L();if(l.gy&&l.gy.ok)return l.gy;
  const ch=built('church')[0],cx=ch?ch.x:(G.center?G.center.x:0),cz=ch?ch.z:(G.center?G.center.z:0),R0=ch?ch.r+7:16;
  const away=G.center&&ch?Math.atan2(ch.z-G.center.z,ch.x-G.center.x):rnd()*TAU;
  let best=null,bs=1e9;
  for(let pass=0;pass<2&&!best;pass++)for(let i=0;i<48;i++){const a=away+(rnd()-.5)*(i<24?2.4:6.28),r=R0+rnd()*(i<24?8:14),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(Math.abs(x)>HALF-14||Math.abs(z)>HALF-14||wAt(x,z)>.04||slopeAt(x,z)>(pass?.8:.5))continue;
    let ok=true;for(const b of buildings){if(Math.hypot(b.x-x,b.z-z)<b.r+(pass?3.5:8)){ok=false;break;}}if(!ok)continue;
    const sc=slopeAt(x,z)*6+Math.abs(r-R0)*.2+(i>=24?3:0);if(sc<bs){bs=sc;best=[x,z,a];}}
  if(!best)return null;
  l.gy={x:best[0],z:best[1],ang:Math.atan2(cx-best[0],cz-best[1]),ok:1};return l.gy;}
const GCOLS=12,GCAP=150;
function placeGrave(g){if(!g)return;const l=L();
  const gy=plot();if(!gy){const c=G.center;g.x=(c?c.x:0)+(rnd()-.5)*30;g.z=(c?c.z:0)+30+rnd()*8;}
  else{const k=l.gn%GCAP;l.gn++;const col=k%GCOLS,row=(k/GCOLS)|0,lx=(col-(GCOLS-1)/2)*1.35,lz=row*1.85,ca=Math.cos(gy.ang),sa=Math.sin(gy.ang);
    g.x=gy.x+lx*ca+lz*sa;g.z=gy.z-lx*sa+lz*ca;g.r=gy.ang;g.k=k;
    const i=l.graves.findIndex(o=>o.k===k);if(i>=0)l.graves.splice(i,1);}
  g.r=g.r||0;l.graves.push(g);GR.dirty=1;
  if(g.h)storyEvent('memorial',{who:[g.i],big:true,txt:`The folk of ${G.town} raised a memorial for ${g.n} ${g.fam}, who is remembered for ${g.f?'her':'his'} courage.`});
}
const GR={grp:null,sig:-1,dirty:0,age:0};
function graveSig(){let s=TOWNS.list.length*7;TOWNS.list.forEach((t,i)=>{const lf=sGet(i,'life');if(lf&&lf.graves)s+=lf.graves.length*31+(lf.gn||0);});return s;}
function drawGrave(B,g){if(wAt(g.x,g.z)>.1)return;const j1=((g.i*131)%97)/97-.5,j2=((g.i*57)%89)/89-.5,x=g.x+j1*.35,z=g.z+j2*.3,y=hAt(x,z),r=(g.r||0)+j2*.16,e=g.e||0,sr=Math.sin(r),cr=Math.cos(r),hx=x+sr*.62,hz=z+cr*.62,h=(g.i*7919)%100/100;
  const turf=e>=6?0x5f7f48:h<.5?0x5d6a3a:0x66713f;B.box(x,y-.09,z,.5,.16,1.1,turf,r);B.box(x,y-.03,z,.34,.1,.8,turf,r);
  if(g.h){const st=0xb9b2a2;B.box(hx,y-.05,hz,.8,.2,.8,st,r);B.box(hx,y+.15,hz,.5,1.5,.5,st,r);B.box(hx,y+1.6,hz,.64,.16,.64,0x9e978a,r);B.box(hx+.3,y+1.25,hz,.55,.32,.05,0xa8382a,r);if(e>=7)B.mt=0,B.box(hx,y+.3,hz,.06,1.1,.52,0x9fe8ff,r),B.mt=null;return;}
  if(e<=1){B.box(hx,y-.05,hz,.7,.22,.55,0x8d867a,r+h);B.box(hx+.04,y+.15,hz,.5,.2,.4,0x9a9386,r+h*2);B.box(hx,y+.33,hz,.26,.18,.24,0xa8a191,r+h*3);}
  else if(e<=2){B.box(hx,y-.05,hz,.1,.95,.1,0x6b4a2e,r);B.box(hx,y+.55,hz,.5,.09,.09,0x6b4a2e,r);}
  else if(e===3){B.box(hx,y-.05,hz,.5,.62+h*.15,.12,0xa8a191,r);B.box(hx,y+.55,hz,.1,.3,.1,0xa8a191,r);B.box(hx,y+.62,hz,.3,.08,.1,0xa8a191,r);}
  else if(e<=5){const c=e===4?0xb3ac9c:0x777a7e;B.box(hx,y-.05,hz,.56,.16,.3,0x8f887c,r);B.box(hx,y+.1,hz,.46,.58+h*.18,.11,c,r);}
  else if(e===6){B.box(hx,y-.05,hz,.58,.16,.3,0x5a5d62,r);B.box(hx,y+.1,hz,.44,.7+h*.15,.1,0x4b4e53,r);const fc=[0xd9a0a8,0xe3c85a,0xb9a0d9][(g.i%3)];B.box(x-sr*.1,y+.1,z-cr*.1,.3,.12,.3,fc,r);}
  else{B.box(hx,y-.05,hz,.28,.14,.28,0x2a3138,r);B.box(hx,y+.1,hz,.16,.95+h*.2,.16,0x2a3138,r);B.mt=0;B.box(hx,y+.95+h*.2,hz,.12,.16,.12,0x7fe8ff,r);B.mt=null;}
}
function rebuildGraves(){if(!GR.grp){GR.grp=new THREE.Group();scene.add(GR.grp);}
  while(GR.grp.children.length){const m=GR.grp.children.pop();m.traverse(o=>o.geometry&&o.geometry.dispose());}
  const B=new Builder(rnd,.05);let n=0;
  TOWNS.list.forEach((t,i)=>{const lf=sGet(i,'life');if(!lf||!lf.graves)return;for(const g of lf.graves){drawGrave(B,g);n++;}});
  if(n){const m=B.mesh(matB);GR.grp.add(m);}
  GR.sig=graveSig();GR.dirty=0;GR.age=0;}
function graveCheck(){if(typeof THREE==='undefined'||typeof Builder==='undefined')return;const s=graveSig();GR.age++;if(GR.dirty||s!==GR.sig||GR.age>=240)rebuildGraves();}
// ---------------------------------------------------------------- behaviour through the think hook
function placeNear(b,spread){const d=doorOf(b);return [d[0]+(rnd()-.5)*spread,d[1]+(rnd()-.5)*spread];}
function lifeThink(v,h,home){if(v.kind==='bandit'||v.leaving||v.arriving)return false;
  const l=G.life;
  if(l&&l.gath.length){const g=gathering(v);
    if(g&&!(G.raid&&G.raid.active)&&!v.sick){const rem=Math.max(.3,g.at+g.dur-G.t);
      if(Math.hypot(v.x-g.x,v.z-g.z)<7){v.mourning=g.k==='funeral';wait(v,Math.min(rem,1),g.k==='wedding'&&G.t>=g.at?'dance':'idle',false);
        setT(v,g.k==='funeral'?pickA([`Goodbye, ${g.n}.`,`${g.n} was so loved.`,'We are all here for each other.']):pickA(['A good day for it.','They look so happy.','Long life to them both!']));return true;}
      goTo(v,g.x+(rnd()-.5)*5,g.z+(rnd()-.5)*5,vv=>wait(vv,Math.min(rem,1),'idle',false));
      setT(v,g.k==='funeral'?`On my way to say goodbye to ${g.n}.`:`Off to see ${g.n} wed.`);return true;}}
  if(v.mourning)v.mourning=false;
  const raid=G.raid;
  if(raid&&raid.active){
    if(G.bandits.length&&v.job!=='guard'&&v.age>=16&&v.age<=56&&!v.sick&&hasT(v,'bold')&&(v.hp||3)>1&&rnd()<.55){v._fought=true;guardFight(v);return true;}
    return false;}
  if(raid&&!raid.over&&!raid.active&&raid.at-G.t<7&&raid.at-G.t>0&&hasT(v,'cautious')&&v.job!=='guard'&&h>=5.5&&h<21&&rnd()<.5&&home){goInside(v,home,Math.min(3,Math.max(.6,raid.at-G.t+1)),'hide','I do not like the sound of that. Best to be indoors.');return true;}
  if(v.sick||h<5.5||h>=21)return false;
  const age=v.age;
  // children watch their parents and imitate them
  if(age>=5&&age<14&&h>=8.5&&h<16.5&&rnd()<.22){let p=null;for(const pid of v.parents||[]){const q=vid(pid);if(q&&q.job&&q.age>=14){p=q;break;}}
    if(!p&&hasT(v,'curious')&&rnd()<.5){const o=pickA(G.vill);if(o.age>=18&&o.job&&!o.leaving)p=o;}
    if(p){const b=bById(p.work);let x,z;if(b&&!b.build){[x,z]=placeNear(b,4);}else if(Math.hypot(p.x-v.x,p.z-v.z)<70){x=p.x+(rnd()-.5)*2.5;z=p.z+(rnd()-.5)*2.5;}
      if(x!=null){const role=(typeof JOBN!=='undefined'&&JOBN[p.job]||p.job).toLowerCase();goTo(v,x,z,vv=>wait(vv,.7+rnd()*.7,'idle',false));v.watch=p.job;
        setT(v,pickA([`Watching ${p.name} at the ${role}'s work.`,`I want to do what ${p.name} does.`,`${p.name} lets me help sometimes.`]));return true;}}}
  if(age<14)return false;
  // grief: a quiet hour at the grave
  if((v.grf||0)>35&&h>=6.5&&h<17.5&&rnd()<.10*(v.grf/60)&&!(G.festival>0)){const gy=plot(),ch=built('church')[0];let x,z;
    if(gy){x=gy.x+(rnd()-.5)*6;z=gy.z+(rnd()-.5)*5;}else if(ch)[x,z]=placeNear(ch,4);
    if(x!=null){goTo(v,x,z,vv=>{vv.mourning=true;wait(vv,.7+rnd()*.7,'idle',false,w=>{w.mourning=false;});});setT(v,pickA([`Still thinking of ${v.lost||'them'}.`,`The house is so quiet without ${v.lost||'them'}.`,`I miss ${v.lost||'them'}.`]));return true;}}
  if(G.festival>0&&h>=9)return false;
  if(h<17.5)return false;
  // evenings: courting, visiting friends, a prayer, an elder's stories
  const r=rnd();
  if(v.court&&r<.3){const q=vid(v.court);if(q&&!q.sick&&Math.hypot(q.x-v.x,q.z-v.z)<70){goTo(v,q.x+(rnd()-.5)*2.5,q.z+(rnd()-.5)*2.5,vv=>wait(vv,.8+rnd()*.7,'idle',false));lifeRel(v,q,3,true);
      setT(v,pickA([`A walk with ${q.name}.`,`${q.name} makes me laugh.`,`Is ${q.name} thinking of me too?`]));return true;}}
  const pv=hasT(v,'sociable')?.17:hasT(v,'solitary')?.04:.09;
  if(r>=.3&&r<.3+pv&&v.rel){let f=null,bs=39;for(const k in v.rel){const o=idm().get(+k);if(o&&o.age>=12&&!o.sick&&o.home&&o.home!==v.home&&v.rel[k]>bs){bs=v.rel[k];f=o;}}
    if(f){const b=bById(f.home);if(b&&!b.build){const [x,z]=placeNear(b,3);goTo(v,x,z,vv=>{wait(vv,.8+rnd()*.8,'idle',false);lifeRel(vv,f,2,true);});setT(v,pickA([`Calling in on ${f.name}.`,`I should see how ${f.name} is getting on.`]));return true;}}}
  if(hasT(v,'devout')&&r>=.55&&r<.66){const ch=built('church')[0];if(ch){const [x,z]=placeNear(ch,5);goTo(v,x,z,vv=>{wait(vv,.7+rnd()*.5,'idle',false);G.faith+=.2;});
      const nm=((ch.info&&ch.info.name)||'shrine').toLowerCase();setT(v,pickA([`A quiet word at the ${nm}.`,'Giving thanks for the day.',`I will light a candle at the ${nm}.`].map(s=>(G.era||0)>=6?s.replace(/light a candle/,'sit a while'):s)));return true;}}
  if(age>=58&&hasT(v,'wise')&&r>=.7&&r<.85){const m=built('well')[0]||built('market')[0]||G.center;if(m){const [x,z]=placeNear(m,5);goTo(v,x,z,vv=>wait(vv,1+rnd()*.6,'idle',false));setT(v,pickA(['Telling the little ones how it used to be.','Every old story was young once.','Sit, child, and I will tell you something true.']));return true;}}
  return false;}
// ---------------------------------------------------------------- thoughts with a personality (called from setThought)
const TR_LINES={gentle:['I hope no one is hurting tonight.','A kind word costs so little.','Everyone has hard days now and then.'],
  bold:['Let anything come; I am ready.','Someone has to go first.','I would rather act than wait.'],
  cautious:['Best to check everything twice.','I do not like the look of the sky.','Better safe than sorry.'],
  devout:['The Spirit watches over this valley.','I will give thanks this evening.','We are never truly alone.'],
  doubtful:['Does anyone up there hear us?','I prayed, and nothing answered.','Show me, and I will believe.'],
  sociable:['I wonder who is about today.','A day is better with company.','I must catch up with the neighbours.'],
  solitary:['Quiet. Good.','I think better on my own.','If only it were less crowded.'],
  curious:['How does that really work, I wonder?','There must be a better way to do this.','What lies beyond the hills?'],
  stubborn:['I have done it this way all my life.','They will not change my mind.','I know what I know.'],
  generous:['Perhaps I can spare something for the neighbours.','No one should go without.','Sharing makes it taste better.'],
  thrifty:['Waste not, want not.','A little set by is never wasted.','Count it twice, spend it once.'],
  dreamer:['I dreamed of a city of light last night.','The clouds look like great ships today.','What if the stars are other hearths?'],
  wise:['I have seen many seasons. This too will pass.','The young will find their way.','Patience.']};
const MEM_LINES={miracle:'I still remember what the Spirit did for us.',cured:'It is good to be well again.',raid:'I still hear the raiders in my dreams.',hungry:'I will not forget the hungry days.',child:'The little one grows so fast.',wed:'Married life suits me.',apprenticed:'There is so much to learn.',comforted:'I am lucky in my neighbours.',kind:'Some people are better than they know.',comfort:'The Spirit comforted me when I needed it.',fire:'I will never forget that fire.'};
const NOFLAV=/!|fever|find a way|Raiders|prophet|Spirit|Hauling|Fetching|Fell|fell|Stalking|Brought|boar|Watching|Calling in|walk with|goodbye|wed\b/i;
function lifeFlavour(v,t){if(v.kind==='bandit'||!v.traits||v.age<5||rnd()>.18||NOFLAV.test(t)||v.prophet||v.cult)return null;
  if((v.grf||0)>30&&v.lost&&rnd()<.7)return pickA([`Still thinking of ${v.lost}.`,`I miss ${v.lost} every day.`,`The days are long without ${v.lost}.`]);
  const m=v.mood==null?60:v.mood;
  if(m<34&&rnd()<.5)return pickA(['I cannot find any joy today.','Everything feels so heavy.','Another long day.']);
  if(v.mem&&v.mem.length&&rnd()<.35){const e=v.mem[0];for(const k in MEM_LINES)if(e.k.startsWith(k)&&e.w!==0&&dayN()-e.day<80)return MEM_LINES[k];}
  if(m>=80&&rnd()<.3)return pickA(['It is good to be alive.','Things are looking up.','What a fine day.']);
  if(v.rel&&rnd()<.25){let f=null,bs=44;for(const k in v.rel){if(v.rel[k]>bs){const o=idm().get(+k);if(o){f=o;bs=v.rel[k];}}}if(f)return pickA([`I should look in on ${f.name}.`,`${f.name} would laugh at this.`]);}
  const tr=v.traits[(rnd()*v.traits.length)|0],ls=TR_LINES[tr];if(ls&&!(tr==='devout'&&(G.era||0)>=7&&rnd()<.5))return pickA(ls);return null;}
// ---------------------------------------------------------------- the marriage section of newDay (the single source of v.spouse) asks us
function lifeMatchOK(m,w){if(!m||!w)return true;if(isKin(m,w))return false;if(((m.rel&&m.rel[w.id])||0)<-12)return false;
  if(m.court&&m.court!==w.id)return false;if(w.court&&w.court!==m.id)return false;return true;}
function lifeSortSingles(men,wom){const pm=[],pw=[],rm=men.slice(),rw=wom.slice();
  for(const m of men){if(!m.court)continue;const i=rw.findIndex(w=>w.id===m.court&&w.court===m.id);if(i>=0){pm.push(m);pw.push(rw[i]);rm.splice(rm.indexOf(m),1);rw.splice(i,1);}}
  const rest=[];for(const m of rm){for(const w of rw){if(!lifeMatchOK(m,w))continue;rest.push([m,w,Math.min((m.rel&&m.rel[w.id])||0,(w.rel&&w.rel[m.id])||0)+rnd()*3]);}}
  rest.sort((a,b)=>b[2]-a[2]);const um=new Set(),uw=new Set();
  for(const [m,w] of rest){if(um.has(m)||uw.has(w))continue;um.add(m);uw.add(w);pm.push(m);pw.push(w);}
  men.length=0;wom.length=0;men.push(...pm);wom.push(...pw);}
// doubt makes a person likelier to follow a false prophet; faith, less so (devotion.js sorts followers by this)
function lifeDoubt(v){return (hasT(v,'doubtful')?2:0)-(hasT(v,'devout')?2:0)+((v.grf||0)>40?1:0)+((v.mood!=null&&v.mood<40)?1:0)+(hasT(v,'cautious')?.5:0)-(hasT(v,'stubborn')?.4:0);}
// ---------------------------------------------------------------- the Spirit's touch is remembered
function lifeMiracle(kind,vs,txt){if(!vs||!vs.length)return;const day=dayN(),w=kind==='rain'?5:7;
  for(const v of vs){if(v.kind==='bandit')continue;lifeAddMemory(v,'miracle',txt||'The Spirit answered when I needed it.',w+(hasT(v,'doubtful')?2:0));
    if(hasT(v,'doubtful')&&rnd()<.2)addTrait(v,'devout');v.mood=Math.min(100,(v.mood==null?60:v.mood)+4);}
  const d=G.dev;if(d){d.piety=Math.min(100,d.piety+Math.min(6,1+vs.length*.4));d.doubt=Math.max(0,d.doubt-Math.min(6,1+vs.length*.3));}
  storyEvent('miracle',{who:vs.slice(0,6).map(v=>v.id),big:true,txt:txt||'The Spirit answered the folk.',kind});}
function lifeComfort(v){if(!v)return '';v.grf=Math.max(0,(v.grf||0)-25);lifeAddMemory(v,'comfort','The Spirit comforted me when I was low.',6);
  if(hasT(v,'doubtful')&&rnd()<.4){addTrait(v,'devout');}if(G.dev)G.dev.doubt=Math.max(0,G.dev.doubt-1);v.mood=lifeMood(v);setT(v,'Someone is listening after all.');return `${v.name} felt the Spirit near.`;}
// wrap the two places where the player's miracles land, to see who they touched
function wrapMiracles(){
  if(typeof castPower==='function'&&!castPower._life){const orig=castPower;
    const w=function(id){let pre=null;try{pre={sick:new Set(G.vill.filter(v=>v.sick).map(v=>v.id)),sun:G.sun,rain:G.rain,harvest:G.harvest,drought:G.drought,fires:buildings.filter(b=>b.fire).length,rainbow:G.rainbow};}catch(e){}
      const r=orig.apply(this,arguments);
      try{if(pre&&G.phase==='play'){
        if(pre.sick.size){const h=G.vill.filter(v=>pre.sick.has(v.id)&&!v.sick);if(h.length&&id==='p:heal'){for(const v of h)v._sk=0;lifeMiracle('heal',h,'The Spirit lifted the fever from me.');}}
        if(id==='p:rain'&&G.rain>pre.rain&&pre.drought){lifeMiracle('rain',G.vill.filter(v=>v.job==='farmer'||rnd()<.25),'Rain fell when the fields were dying.');}
        else if(id==='p:harvest'&&G.harvest>(pre.harvest||0)){lifeMiracle('harvest',G.vill.filter(v=>v.job==='farmer'||rnd()<.15),'The fields gave twice over, by the Spirit’s grace.');}
        else if(id==='p:sun'&&G.sun>(pre.sun||0)&&(seasonN()===3||pre.rain>0)){lifeMiracle('sun',G.vill.filter(()=>rnd()<.3),'The sun broke through at the Spirit’s word.');}}}catch(e){console.error('lives miracle',e);}
      return r;};w._life=1;globalThis.castPower=w;}
  if(typeof godClick==='function'&&!godClick._life){const orig=godClick;
    const w=function(e){let fires=null;try{if(MODE==='god'&&tool==='bless'&&hoverB&&hoverB.fire)fires=hoverB;}catch(x){}
      const r=orig.apply(this,arguments);
      try{if(fires&&!fires.fire){const b=fires,res=G.vill.filter(v=>v.home===b.id||v.work===b.id);
        const near=G.vill.filter(v=>Math.hypot(v.x-b.x,v.z-b.z)<20&&!res.includes(v)&&rnd()<.4).slice(0,4);
        lifeMiracle('fire',res.concat(near),`The Spirit put out the fire at the ${(b.info&&b.info.name||'house').toLowerCase()}, and the people there will not forget it.`);for(const v of res.concat(near))lifeAddMemory(v,'fire','Saw the fire put out at the last moment.',6);}}catch(x){console.error('lives fire',x);}
      return r;};w._life=1;globalThis.godClick=w;}
}
// ---------------------------------------------------------------- a person's page
function lifeSummary(v){if(!v)return null;idm();const l=L(),kin=kinOf(v);
  const ref=(o,dead)=>o?{id:o.id,name:fullName(o),first:o.name,age:Math.floor(o.age),dead:!!dead}:null;
  const deadRef=(id)=>{const d=l.dead[id];return d?{id:+id,name:`${d.n} ${d.fam||v.fam}`,first:d.n,age:d.a,dead:true}:null;};
  const parents=(v.parents||[]).map(id=>{const o=vid(id);return o?ref(o):deadRef(id);}).filter(Boolean);
  const children=kin.children.map(o=>ref(o));for(const id in l.dead){const d=l.dead[id];if(d.p&&d.p.includes(v.id)){const r=deadRef(id);if(r)children.push(r);}}
  const sib=kin.siblings.map(o=>ref(o));for(const id in l.dead){const d=l.dead[id];if(d.p&&v.parents&&d.p.some(p=>v.parents.includes(p))&&+id!==v.id){const r=deadRef(id);if(r)sib.push(r);}}
  const spouse=kin.spouse?ref(kin.spouse):null;
  const friends=[],rivals=[];if(v.rel)for(const k in v.rel){const o=idm().get(+k);if(!o)continue;const s=v.rel[k];if(s>=30)friends.push({id:o.id,name:fullName(o),first:o.name,score:s});else if(s<=-30)rivals.push({id:o.id,name:fullName(o),first:o.name,score:s});}
  friends.sort((a,b)=>b.score-a.score);rivals.sort((a,b)=>a.score-b.score);
  const m=lifeMood(v),why=[];
  if((v.grf||0)>15)why.push(v.lost?`Grieving ${v.lost}`:'Grieving');if(v.sick)why.push('Unwell');if(!v.home)why.push('No home of their own');
  if(friends.length>=3)why.push('Surrounded by friends');else if(!friends.length&&!spouse&&v.age>=14)why.push('Few close friends');
  if(rivals.length)why.push(`At odds with ${rivals[0].first}`);if(hasT(v,'doubtful')&&G.dev&&G.dev.doubt>40)why.push('Doubting the Spirit');
  const ms=memSum(v);if(ms>=5)why.push('Warm memories');else if(ms<=-5)why.push('Heavy memories');if(G.hap>=70)why.push('The town is thriving');else if(G.hap<40)why.push('The town is struggling');
  const mem=(v.mem||[]).slice().sort((a,b)=>b.day-a.day).map(x=>({k:x.k.replace(/\d+$/,''),day:x.day,txt:x.txt,w:x.w}));
  return {id:v.id,name:fullName(v),first:v.name,fam:v.fam,female:!!v.female,age:Math.floor(v.age),born:v.born,job:v.job,
    traits:(v.traits||[]).slice(),traitText:(v.traits||[]).map(t=>LT_TXT[t]||t),
    family:{spouse,parents,children,siblings:sib,courting:v.court?ref(vid(v.court)):null},
    friends:friends.slice(0,8),rivals:rivals.slice(0,5),memories:mem,mood:{value:m,label:moodLabel(m,v),why},grief:Math.round(v.grf||0),
    hero:!!v.hero,story:storyOf(v.id).slice(0,30)};}
// ---------------------------------------------------------------- exports (a block keeps locals private; globals are life*)
SAVE_PER.push('life');if(typeof PERKEYS!=='undefined')PERKEYS.push('life');
wrapMiracles();
if(typeof STORY!=='undefined')STORY.on(e=>{});// (the bus is ours to read: nothing to do per event)
const _hourly=lifeHourly;
Object.assign(globalThis,{LIFE_TRAITS:LT,lifeOnNew,lifeOnRemove,lifeThink,lifeDaily,lifeHourly:function(){_hourly();graveCheck();},lifeRebuildGraves:rebuildGraves,lifeFlavour,lifeMatchOK,lifeSortSingles,lifeDoubt,lifeSummary,lifeMood,lifeAddMemory,lifeRel,lifeConflict,lifeKindness,lifeComfort,lifeMiracle,lifeKin,lifeHas});
}
