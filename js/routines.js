'use strict';
// ================================================================ routines: the shape of the day
// The folk do not only work and sleep. Dawn has its chores (water from the well, a stretch, breakfast), noon its meal break in the shade,
// the evening its tavern, market stalls, doorstep chat, strolls, firesides and gardens; Sunday its church bell and picnics; rain sends
// them under the eaves, a rainbow to the shore, a fire brings the bucket chain, a miracle makes them stare. When two folk meet at a
// gathering place they stop and talk (face to face, gestures, speech bubbles, era- and relationship-aware lines).
// Productive jobs are left alone in working hours (routineThink returns false) except for a short, occasional meal break, so the economy
// is unchanged. Everything here is event-driven and cheap: no per-frame scans of folk or buildings; chat partners come from a small
// hash of the near (LOD 0) folk that is rebuilt a few times a second only when someone asks.
// Exports (window): routineThink (hook in think()), rtDrawPeople (hook in drawPeople), RT (debug/state), rtStage (test helper).
{
const RT={stat:{},sc:new Map(),nh:new Map(),idm:new Map(),kids:new Map(),fires:{t:-9,list:[],s:-1},chats:0,gawk:null,rec:[],mourn:0};
window.RT=RT;
const R=Math.random,rn=(a,b)=>a+R()*(b-a),pick=a=>a[Math.floor(R()*a.length)];
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
const stat=k=>{RT.stat[k]=(RT.stat[k]||0)+1;};
const lod0=v=>(v._lod||0)===0;
const first=v=>v.name;
// dialogue era groups: 0 stone/bronze, 1 iron/medieval, 2 high medieval, 3 industrial, 4 modern, 5 futuristic
const EG=e=>e<=1?0:e<=3?1:e===4?2:e===5?3:e===6?4:5;
const raining=()=>(G.rain>0&&seasonN()!==3)||G.storm>0;
const snowing=()=>G.snow>0||(G.rain>0&&seasonN()===3);
const heavyRain=()=>G.storm>0||(G.rain>0&&G.rainI>1.25&&seasonN()!==3);
const winter=()=>seasonN()===3;
const hotDay=h=>seasonN()===1&&h>=11&&h<16.5&&(G.sun>0||G.rain<=0);

// ---------------------------------------------------------------- the lines folk say (topic|era groups|opening|reply)
const LINES={};
`fair|0-1|The sun is warm on the stones today.|It is. The hunting will be good.
fair|0-2|Look how straight the smoke climbs.|Fair weather holds. That is a blessing.
fair|1-2|A fine day for the fields.|Aye, and a fine one for resting too.
fair|3|Clear sky for once. No soot in the air.|The wind must have turned.
fair|4|Lovely day, isn't it?|Finally. I could do with some sun.
fair|5|The sky is clear, even over the towers.|Rare. I might walk home the long way.
dawn|0-1|The light comes early now.|Then the day is ours.
dawn|1-3|The cocks are loud this morning.|Do not remind me. I am still half asleep.
dawn|4-5|Coffee first, then talk.|Make it two.
rain|0-1|The sky is weeping again.|It feeds the barley, at least.
rain|1-2|Mud to the ankles, and it is only morning.|Better mud than drought.
rain|3|The rain turns the street to black soup.|Mind your boots, the gutters are overflowing.
rain|3|Will you share your umbrella?|Gladly. There is room for two.
rain|4|Typical. I left my coat at home.|Take mine. I am not going far.
rain|5|The canopy hums when it rains.|At least the gutters drink it all up.
snow|0-2|Snow on the hills already.|Then the deer will come down to us.
snow|1-2|The snow lies deep this year.|Pile the logs high and keep the fire in.
snow|3|Soot snow, grey by noon.|Pretty for an hour.
snow|4-5|Snow day. Hot chocolate?|Always.
cold|0-1|My fingers ache with cold.|Come closer to the fire.
cold|1-3|Winter bites hard this year.|Keep your cloak tight.
cold|4-5|I cannot feel my hands.|Get inside. I will bring tea.
hot|0-2|The sun is heavy today.|Find some shade and rest.
hot|3-5|Too hot to think.|Water. Lots of water.
storm|0-3|That thunder shook the ground.|The Spirit is angry. Or at play.
storm|4-5|Did you see that lightning?|Come away from the windows.
work|0-1|The hunters came back empty-handed.|We still have dried meat. We will manage.
work|0-2|The harvest looks good this year.|The Spirit has been kind to us.
work|1-3|My back aches from all the hauling.|Then rest. The work will keep.
work|3|The foreman is pushing us hard.|He pushes everyone, even himself.
work|4|Another deadline, another weekend gone.|You should take a real break.
work|5|The machines do half my work now.|Then you get half a day to dream.
gossip|0-2|Did you hear about the new family?|I did. They looked tired from the road.
gossip|1-3|They say the miller's boy is courting.|Everyone knows, except the miller.
gossip|3-4|Have you seen what they are building by the river?|Do not get me started.
gossip|4-5|Did you see what everyone is talking about?|I try not to look.
food|0-2|Smell that? Someone is roasting meat.|Do not point me at it, I will follow my nose.
food|1-3|The bread was good today.|Baked at dawn, still warm.
food|3-5|What is for dinner?|Whatever is left. I am too tired to cook.
faith|0-5|Did the Spirit answer your prayer?|Not yet. But I keep asking.
faith|1-3|I felt such peace at the service.|And I felt hungry.
faith|4-5|Do you still go on Sundays?|When I need quiet, yes.
eve|0-2|The fire is the best part of the day.|And the stories that come with it.
eve|3-5|Long day. I am glad it is evening.|Come, sit a while.
kids|0-5|Race you to the well!|You will lose!
kids|0-5|I found a frog by the water.|Show me! Show me!
kids|0-5|Let us play at being knights.|I will be the dragon.
kids|3-5|My ball is stuck on the roof.|Throw a stick at it.
kidelder|0-5|Grandfather, tell me a story?|Once, the valley was all trees...
kidelder|0-5|Why is the sky blue?|Ask the Spirit. It painted it.
kidelder|0-5|Mind the river, little one.|I always do.
spouse|0-5|You look tired, love.|A little. But I am glad to see you.
spouse|0-5|Save me a place at supper.|Always.
spouse|0-2|Come here, you are freezing.|Your hands are warm.
spouse|3-5|Shall we walk the long way home?|I would like that.
family|0-5|Your mother asked after you.|Tell her I will visit on Sunday.
family|0-5|Do you remember the old house?|Every creaky board of it.
friend|0-5|There you are! I was looking for you.|And here I am. Sit, sit.
friend|0-5|You will never believe what happened.|Tell me everything.
friend|0-5|I saved you a seat.|You always do.
rival|0-5|Still here, are you?|Still better than you.
rival|0-5|Everyone knows whose fault it was.|Say it to my face, then.
stranger|0-5|I do not think we have met.|I am new here. Pleased to meet you.
stranger|0-5|Fine company you keep.|The best, if I may say so.`.split('\n').forEach(s=>{const [t,g,o,r]=s.split('|');const [a,b]=g.includes('-')?g.split('-').map(Number):[+g,+g];(LINES[t]||(LINES[t]=[])).push({a,b,o,r});});
const ARGUE=[['That was my field!','Your field? Your family stole it from mine.'],['You promised, and then you did nothing.','I was busy, as you well know.'],['I will not hear another word.','Then do not. Go.'],['Keep your hands off my things.','Keep your nose out of my business.']];
const PARTING=['Take care.','Until later.','Mind how you go.','Good evening to you.','Spirit keep you.','See you soon!'];
const PARTING_E=g=>g>=4?['See you later.','Catch you later.','Take care.','Message me.']:PARTING;
const poolFor=(topic,g)=>(LINES[topic]||[]).filter(l=>g>=l.a&&g<=l.b);
function weatherTopic(h){if(G.storm>0)return 'storm';if(snowing())return 'snow';if(raining())return 'rain';if(winter()&&(h>=18||h<8))return 'cold';if(hotDay(h))return 'hot';return h<8?'dawn':'fair';}

// ---------------------------------------------------------------- relationships
function rel(a,b){// spouse | family | friend | rival | stranger (from the villagers' own fields; scores come from lives.js: v.rel[id])
  if(a.spouse===b.id||b.spouse===a.id)return 'spouse';
  const pa=a.parents,pb=b.parents;
  if(pa&&pa.length||pb&&pb.length){if(pa&&pa.indexOf(b.id)>=0||pb&&pb.indexOf(a.id)>=0)return 'family';if(pa&&pb)for(let i=0;i<pa.length;i++)if(pb.indexOf(pa[i])>=0)return 'family';}
  const s1=a.rel?a.rel[b.id]||0:0,s2=b.rel?b.rel[a.id]||0:0;
  if(s1<=-30&&s2<=-30||Math.max(s1,s2)<=-30)return 'rival';
  if(s1>=28&&s2>=28)return 'friend';
  if(a.fam===b.fam||(a.home&&a.home===b.home))return 'family';
  return 'stranger';
}
const trait=(v,t)=>!!(v.traits&&v.traits.indexOf(t)>=0);
const relGroup=r=>r==='lover'||r==='partner'||r==='wife'||r==='husband'?'spouse':r==='parent'||r==='child'||r==='sibling'||r==='kin'?'family':r==='enemy'||r==='grudge'?'rival':r==='acquaintance'?'stranger':r;
function makeLines(a,b,r,h,n){
  const g=EG(G.era|0),out=[],used=new Set(),push=(t,fl)=>{const p=poolFor(t,g);if(!p.length)return false;const l=pick(p);if(used.has(l))return false;used.add(l);
    const x=fl?l.r:l.o,y=fl?l.o:l.r;out.push([a,x],[b,y]);return true;};
  const kidA=a.age<14,kidB=b.age<14,eld=a.age>64&&kidB||b.age>64&&kidA;
  if(kidA&&kidB)push('kids');else if(eld)push('kidelder',kidA&&b.age>64?false:false);
  else if(r==='spouse'){push('spouse');}else if(r==='rival'){push('rival');}else if(r==='friend'){push('friend');}else if(r==='stranger'){push('stranger');}else push('family');
  const wt=weatherTopic(h);
  const rest=[wt,wt==='fair'||wt==='dawn'?'gossip':'work','gossip','food','faith','eve','work'];
  if(h>=17.5||h<5)rest.unshift('eve');
  while(out.length<n*2&&rest.length){const t=rest.shift();if(!(kidA||kidB)||t==='fair'||t==='rain'||t==='snow'||t==='food')push(t);}
  return out.slice(0,n*2);
}

// ---------------------------------------------------------------- places (cached per settlement; rebuilt only when buildings change)
function spots(){
  const gen=G.plan?G.plan.gen:0,cid=G.center?G.center.id:0;let c=RT.sc.get(TOWNS.cur);
  if(c&&c.bv===BVER&&c.bl===buildings.length&&c.gen===gen&&c.cid===cid&&c.town===G.town)return c;
  c={bv:BVER,bl:buildings.length,gen,cid,town:G.town,ver:(c?c.ver:0)+1,ben:[],hh:new Map(),pl:null,anchors:[]};
  const hall=G.center;
  if(G.plan&&G.plan.plaza)c.pl={x:G.plan.plaza.x,z:G.plan.plaza.z,r:G.plan.plaza.r||5};
  else if(hall){const d=doorOf(hall);c.pl={x:d[0],z:d[1],r:4};}
  for(const b of built('house')){const k=Math.floor(b.x/14)*4096+Math.floor(b.z/14);let l=c.hh.get(k);if(!l)c.hh.set(k,l=[]);l.push(b);}
  // benches: a few around the civic places (not inside buildings, not in water)
  const anch=[];if(c.pl)anch.push([c.pl.x,c.pl.z,c.pl.r+1.2,4]);
  for(const t of ['market','church','tavern','well','hall','library','playhouse','school','sky_garden','stadium','cinema','holo_theatre']){const l=built(t);for(let i=0;i<Math.min(2,l.length);i++){const b=l[i],d=doorOf(b);anch.push([d[0],d[1],2.4,t==='well'||t==='tavern'?1:2]);}}
  const bl=buildings;
  for(const [ax,az,rad,n] of anch){let placed=0;const a0=hash(ax.toFixed(0)+':'+az.toFixed(0))*TAU;
    for(let k=0;k<12&&placed<n&&c.ben.length<22;k++){const a=a0+k*(TAU/(n+1.5))+(k>=n+1?.3:0),x=ax+Math.cos(a)*rad,z=az+Math.sin(a)*rad;
      if(wAt(x,z)>.08||Math.abs(hAt(x+1,z)-hAt(x-1,z))>.5||Math.abs(hAt(x,z+1)-hAt(x,z-1))>.5)continue;
      let ok=true;for(const b of bl){if(Math.hypot(b.x-x,b.z-z)<b.r+1.1){ok=false;break;}}if(!ok)continue;
      for(const o of c.ben)if(Math.hypot(o.x-x,o.z-z)<2.2){ok=false;break;}if(!ok)continue;
      c.ben.push({x,z,rot:Math.atan2(ax-x,az-z),occ:[0,0],y:hAt(x,z)});placed++;}}
  if(G.era<=2&&hall){const d=doorOf(hall),dx=d[0]-hall.x,dz=d[1]-hall.z,dl=Math.hypot(dx,dz)||1;c.fire={x:d[0]+dx/dl*3.2,z:d[1]+dz/dl*3.2};}else if(c.pl)c.fire={x:c.pl.x,z:c.pl.z};else if(hall){const d=doorOf(hall);c.fire={x:d[0],z:d[1]+3};}
  RT.sc.set(TOWNS.cur,c);RT.benchV=(RT.benchV||0)+1;return c;
}
function bestSpotNear(list,x,z,maxD){let best=null,bd=maxD||1e9;for(const b of list){const d=Math.hypot(b.x-x,b.z-z);if(d<bd){bd=d;best=b;}}return best;}
function housesNear(x,z,R){const c=spots(),out=[],ci=Math.floor(x/14),cj=Math.floor(z/14),r=Math.ceil(R/14);
  for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){const l=c.hh.get((ci+i)*4096+(cj+j));if(l)for(const b of l)if(Math.hypot(b.x-x,b.z-z)<=R)out.push(b);}return out;}
function okPt(x,z){return wAt(x,z)<.1&&Math.abs(hAt(x+1,z)-hAt(x-1,z))<.6;}
function scatter(x,z,r0,r1){for(let k=0;k<5;k++){const a=R()*TAU,d=rn(r0,r1),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(okPt(px,pz))return [px,pz];}return [x,z];}
function plazaPt(r){const c=spots();if(!c.pl)return null;return scatter(c.pl.x,c.pl.z,.8,r||c.pl.r+1);}
function treeNear(x,z,Rr){const cells=treeCells(),ci=Math.floor(x/16),cj=Math.floor(z/16),rr=Math.ceil(Rr/16);let best=null,bd=Rr;
  for(let i=-rr;i<=rr;i++)for(let j=-rr;j<=rr;j++){const l=cells.get(_tk(ci+i,cj+j));if(!l)continue;for(const t of l){if(t.s<.8)continue;const d=Math.hypot(t.x-x,t.z-z);if(d<bd){bd=d;best=t;}}}return best;}
function shorePt(x,z,Rr){const s=findShore(x,z,Rr);return s;}
function idMap(){let m=RT.idm.get(TOWNS.cur);const k=G.vill.length+':'+Math.floor(G.t*.5);if(m&&m.k===k)return m.m;m={k,m:new Map()};for(const v of G.vill)m.m.set(v.id,v);RT.idm.set(TOWNS.cur,m);return m.m;}
function toddlersOf(home){if(!home)return [];const k=G.vill.length+':'+Math.floor(G.t);let e=RT.kids.get(TOWNS.cur);if(!e||e.k!==k){e={k,m:new Map()};for(const v of G.vill)if(v.age<3.5&&v.home){let l=e.m.get(v.home);if(!l)e.m.set(v.home,l=[]);l.push(v);}RT.kids.set(TOWNS.cur,e);}return e.m.get(home)||[];}

// ---------------------------------------------------------------- near-folk hash (LOD 0 only, rebuilt on demand at most ~5 times a second)
function nearHash(){let e=RT.nh.get(TOWNS.cur);const now=performance.now();if(e&&now-e.t<200&&e.n===G.vill.length)return e;
  e={t:now,n:G.vill.length,m:new Map()};for(const v of G.vill){if(v.hidden||!lod0(v))continue;const k=Math.floor(v.x/6)*4096+Math.floor(v.z/6);let l=e.m.get(k);if(!l)e.m.set(k,l=[]);l.push(v);}RT.nh.set(TOWNS.cur,e);return e;}
function folkNear(v,Rr,f){const e=nearHash(),ci=Math.floor(v.x/6),cj=Math.floor(v.z/6),rr=Math.ceil(Rr/6),out=[];
  for(let i=-rr;i<=rr;i++)for(let j=-rr;j<=rr;j++){const l=e.m.get((ci+i)*4096+(cj+j));if(!l)continue;for(const o of l){if(o===v||o._gone)continue;const d=Math.hypot(o.x-v.x,o.z-v.z);if(d<=Rr&&(!f||f(o,d)))out.push(o);}}return out;}

// ---------------------------------------------------------------- settling at a place; meeting folk; chatting
function stepTo(v,x,z,cb){// a short walk to a spot beside someone: straight, no path search
  if(Math.hypot(x-v.x,z-v.z)>9)return goTo(v,x,z,cb);v.path=[[x,z]];v.pi=0;v.onArrive=cb||null;v.hidden=false;v.anim='walk';return true;}
function settle(v,act,hrs,anim,o){
  o=o||{};if(o.face)v.rot=Math.atan2(o.face[0]-v.x,o.face[1]-v.z);
  v._sit=0;
  if(o.bench){v.rot=o.bench.rot;v._sit=1;}
  else if(o.ground)v._sit=2;
  v.prop=o.prop||null;v.propT=G.t+hrs+.05;
  wait(v,hrs,anim,false,o.done||null,o.tick||(hrs>.5&&lod0(v)&&!o.noChat?loiter:null));
  v._rtU=G.t+hrs;v._rtA=act;stat(act);
  if(!o.noChat&&lod0(v)&&hrs>.4)tryChat(v);
}
function loiter(v,dt){v._tc=(v._tc||0)+dt;if(v._tc>.28){v._tc=0;if(!(v._chatU>G.t)&&v.timer>.5&&!v.path)tryChat(v);}}
function go(v,x,z,act,hrs,anim,o){o=o||{};if(o.th)setThought(v,o.th);v.prop=o.prop||null;v.propT=G.t+hrs+1.5;v._lei=G.t+hrs+6;
  if(o.hold)maybeHold(v,hrs+.5);
  goTo(v,x,z,vv=>settle(vv,act,hrs,anim,o),o.tb);return true;}
function inside(v,b,hrs,act,th){stat(act);v._rtA=act;v._rtU=G.t+hrs;v._lei=G.t+hrs+6;v.prop=null;goInside(v,b,hrs,act,th);return true;}
function maybeHold(v,hrs){if(v._held||v.age<15||R()>.7)return;const t=toddlersOf(v.home);if(!t.length)return;const c=t[0];
  if(c._heldBy||c._gone||c.hidden||Math.hypot(c.x-v.x,c.z-v.z)>14)return;v._held=c;v._heldU=G.t+hrs;c._heldBy=v;c.path=null;c.timer=hrs+.2;c.anim='idle';c.tick=null;c.onDone=null;}
function dropHeld(v){const c=v._held;v._held=null;if(c){c._heldBy=null;c.x=v.x+.6;c.z=v.z+.4;c.timer=0;c.path=null;}}

// who is free to talk: standing in one of our own waits, not walking, not already talking
const canTalk=(w)=>!w._gone&&!w.hidden&&!w.path&&(w._rtU||0)>G.t&&(w._chatU||0)<=G.t&&!w._held&&!w._heldBy&&(w.anim==='idle'||w.anim==='sit'||w.anim==='eat'||w.anim==='drink'||w.anim==='craft'||w.anim==='gaze'||w.anim==='drawwater');
const compat=(v,w)=>(w.age<14)===(v.age<14)||relGroup(rel(v,w))==='family'||v.age>64||w.age>64;
function tryChat(v){
  if(v._chatU>G.t||v.age<4)return;
  const ws=folkNear(v,7,(w,d)=>canTalk(w)&&compat(v,w));
  if(!ws.length)return;
  // a favoured partner: family, spouse, friends first
  let best=null,bs=-1;for(const w of ws){const r=relGroup(rel(v,w));const s=(r==='spouse'?3:r==='friend'?2.5:r==='family'?2:r==='rival'?1.2:1)+R();if(s>bs){bs=s;best=w;}}
  if(R()<(trait(v,'sociable')?.04:trait(v,'solitary')?.45:.12)&&!(relGroup(rel(v,best))==='spouse'))return;
  startChat(v,best);
}
function startChat(a,b,force){
  if(a._chatU>G.t||b._chatU>G.t)return;
  const r=relGroup(rel(a,b)),hh=hod();let arg=r==='rival'?R()<.55:r==='stranger'||r==='friend'?R()<(.05+(trait(a,'stubborn')||trait(b,'stubborn')?.08:0)):R()<.03;
  if(a.age<14&&b.age<14)arg=false;
  const hug=!arg&&(r==='spouse'||(r==='family'&&R()<.5)||(r==='friend'&&R()<.4))&&(a.age>=14||b.age>=14||true);
  const n=arg?2:(2+(R()<.45?1:0));let lines=arg?(()=>{const p=pick(ARGUE);return [[a,p[0]],[b,p[1]],[a,'Hmph.'],[b,'Hmph.']];})():makeLines(a,b,r,hh,n);
  if(!lines.length)return;
  const seg=.42,greet=hug||R()<.5?.3:.12,total=greet+lines.length*seg+.15;
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1;
  const keep=hug?.9:1.5;
  const tx=b.x-dx/d*keep,tz=b.z-dz/d*keep;
  const run=()=>{if(b._gone||a._gone||b.hidden)return;
    if(b._chatU>G.t||a._chatU>G.t)return;
    a.rot=Math.atan2(b.x-a.x,b.z-a.z);b.rot=Math.atan2(a.x-b.x,a.z-b.z);
    const t0=G.t;
    a._chatU=b._chatU=G.t+total;a._chat=b._chat={a,b,t0,lines,seg,greet,hug,arg,total};a._rtU=b._rtU=Math.max(a._rtU||0,G.t+total);
    a.anim=b.anim=hug?'hug':'talk';b.timer=total;b.tick=null;b.onDone=null;b._sit=0;
    wait(a,total,hug?'hug':'talk',false,null,chatTick);a._sit=0;
    a._with=b;b._with=a;
    stat(arg?'argue':'chat');RT.chats++;
    if(typeof lifeRel==='function')try{lifeRel(a,b,arg?-5:(r==='stranger'?1:2)+(trait(a,'sociable')||trait(b,'sociable')?1:0),false);}catch(e){}
  };
  b.timer=Math.max(b.timer,1.1);// hold the partner while we step up
  if(d<=keep+.3){run();return;}
  stepTo(a,tx,tz,run);a.prop=null;
}
function chatTick(v,dt){
  const c=v._chat;if(!c){return;}const el=G.t-c.t0;if(el>=c.total){v._chat=null;if(v._with)v._with._chat=null;return;}
  const hug=c.hug&&el<c.greet;let spk=null,txt=null;
  const idx=Math.floor((el-c.greet)/c.seg);
  const a=c.a,b=c.b;
  a.anim=b.anim=hug?'hug':(!c.arg&&el<c.greet*.55)?'wave':(c.arg?'argue':'talk');
  if(el>=c.greet&&idx>=0&&idx<c.lines.length){const L=c.lines[idx];spk=L[0];txt=L[1];}
  else if(el>c.total-.3){a.anim=b.anim=c.hug?'hug':'wave';}
  for(const p of [a,b]){const my=spk===p;p._spk=my;if(my&&p._say&&p._say.txt===txt){}else if(my){p._say={txt,t0:G.t,t1:G.t+c.seg*.98};p.thought=txt;}else if(p._say&&G.t>p._say.t1)p._say=null;}
  if(idx>=c.lines.length||el>c.total-.3){a._spk=b._spk=false;}
}

// Folk on a leisure walk who pass close to one another stop for a word (family and friends nearly always, strangers now and then).
// Checked from moveAlong for near (LOD 0) walkers only, about every tenth of a game hour; workers on their way to work are never stopped.
function encounter(v){
  if(v._chatU>G.t||v.age<4||v._heldBy||v.mission||v.leaving||v.arriving)return;
  const e=nearHash(),ci=Math.floor(v.x/6),cj=Math.floor(v.z/6);let w=null,best=-1;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const l=e.m.get((ci+i)*4096+(cj+j));if(!l)continue;
    for(let k=0;k<l.length;k++){const o=l[k];if(o===v)continue;const dx=o.x-v.x,dz=o.z-v.z;if(dx*dx+dz*dz>7.3)continue;
      if(o._gone||o.hidden||o._chatU>G.t||o._heldBy||o.age<4||!(o._lei>G.t)||!(o.path||canTalk(o))||!compat(v,o))continue;
      const r=relGroup(rel(v,o)),sc=(r==='spouse'?3:r==='friend'?2.5:r==='family'?2:1)+R();if(sc>best){best=sc;w=o;}}}
  if(!w)return;
  const r=relGroup(rel(v,w));let p=r==='spouse'?.85:r==='friend'?.7:r==='family'?.55:r==='rival'?.4:.24;
  if(trait(v,'sociable')||trait(w,'sociable'))p+=.15;if(trait(v,'solitary')||trait(w,'solitary'))p-=.1;
  if(R()>p)return;
  v.path=null;v.onArrive=null;v.timer=0;w.path=null;w.onArrive=null;w.timer=0;w.tick=null;
  stat('meet');startChat(v,w);
}
if(typeof moveAlong==='function'){const _mv=moveAlong;moveAlong=function(v,dtH){const arrived=_mv(v,dtH);
  if(!arrived&&v._lei>G.t&&v._lod===0&&G.t>=(v._encT||0)&&v.kind!=='bandit'){v._encT=G.t+.09+R()*.06;try{encounter(v);}catch(e){if(!RT.err){RT.err=e;console.error('routines encounter',e);}}}
  return arrived;};}

// ---------------------------------------------------------------- mourning, miracles (observed through the story bus)
STORY.on(e=>{
  if(e.k==='funeral'||e.k==='death'){const ids=e.who||[],len=e.k==='funeral'?48:72,map=idMap();
    if(e.k==='funeral')for(const id of ids){const v=map.get(id);if(v)v._mourn=G.t+len;}
    for(const v of G.vill)for(const d of ids)if(v.spouse===d||(v.parents&&v.parents.indexOf(d)>=0))v._mourn=Math.max(v._mourn||0,G.t+len);
    RT.mourn++;}
  if(e.k==='miracle'){const c=G.center;RT.gawk={x:e.x!=null?e.x:c?c.x:0,z:e.z!=null?e.z:c?c.z:0,t0:null,until:null,town:TOWNS.cur,big:!!e.big};}
});

// ---------------------------------------------------------------- the day
// Weighted choice
function wpick(items){let s=0;for(const it of items)s+=it[1];if(s<=0)return null;let r=R()*s;for(const it of items){r-=it[1];if(r<=0)return it[0];}return items[items.length-1][0];}
const dn0=()=>dayN();
const E8=(...a)=>a;
const W={home:E8(3,3,3,3,3,4,4,4),fire:E8(6,5,4,2,1,0,0,0),tavern:E8(0,1,3,5,5,5,4,3),market:E8(1,2,3,4,5,4,5,4),stroll:E8(2,2,2,3,3,4,5,5),stoop:E8(2,2,3,4,4,3,2,1),garden:E8(1,2,3,3,3,3,2,1),
  pray:E8(2,2,2,3,3,2,1,1),shore:E8(2,2,2,2,2,2,2,2),show:E8(0,0,0,0,3,4,5,6),plaza:E8(0,0,1,2,3,4,4,4),craft:E8(3,3,3,3,2,0,0,0),glean:E8(3,3,3,3,2,0,0,0)};
const TRAITW={tavern:{sociable:1.6,solitary:.5,thrifty:.6,generous:1.2},stoop:{sociable:1.5,solitary:.6},plaza:{sociable:1.4,solitary:.5,dreamer:1.2},market:{sociable:1.3,curious:1.4,thrifty:1.2},fire:{sociable:1.3},home:{sociable:.7,solitary:1.2},shore:{solitary:1.8,dreamer:1.6},garden:{solitary:1.5},craft:{solitary:1.4},pray:{devout:2.2,doubtful:.4},stroll:{dreamer:1.4,curious:1.2},show:{curious:1.6}};
const tavWord=e=>e<=2?'the tavern':e<=4?'the inn':e===5?'the pub':e===6?'the cafe':'the lounge';

function fireSpot(){return spots().fire||null;}
function nearestOf(type,x,z,maxD){return bestSpotNear(built(type),x,z,maxD);}
function entertainment(x,z,R){const out=[];for(const t of ['playhouse','cinema','stadium','holo_theatre','library','bathhouse','sky_garden','cathedral']){for(const b of built(t)){const d=Math.hypot(b.x-x,b.z-z);if(d<R)out.push(b);}}return out;}

// --- things that happen before the ordinary day: fire, weather, church bell
function fireHelp(v,h){
  const f=RT.fires;if(RT.fires.s!==TOWNS.cur||G.t-f.t>.25){f.t=G.t;f.s=TOWNS.cur;f.list=[];for(const b of buildings)if(b.fire)f.list.push(b);}
  if(!f.list.length||v.age<10||v.carry||v._res)return false;
  const b=bestSpotNear(f.list,v.x,v.z,60);if(!b||R()>.55)return false;
  const w=nearestOf('well',b.x,b.z,50),ax=w?w.x:b.x+8,az=w?w.z:b.z;let dx=ax-b.x,dz=az-b.z;const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
  const k=hash(v.id)*4,px=b.x+dx*(b.r+2.4+k)+(-dz)*(hash(v.id+7)-.5)*3,pz=b.z+dz*(b.r+2.4+k)+dx*(hash(v.id+7)-.5)*3;
  return go(v,px,pz,'fire',rn(.9,1.5),'bucket',{prop:'bucket',face:[b.x,b.z],th:v.age>50?'Pass the buckets along!':pick(['Fire! Pass the buckets!','Water, quickly, water!','Save the roof!'])});
}
function shelter(v,home,h){
  const heavy=heavyRain();if(R()>(heavy?.9:.5))return false;
  const hrs=rn(.8,1.6);
  if(R()<.55||v.age<14){const b=(R()<.5?nearestOf('tavern',v.x,v.z,30):null)||nearestOf('church',v.x,v.z,16)||home||G.center;return inside(v,b,hrs,'shelter',pick(['Out of the wet, at last.','Wait until it eases.','Hear the rain on the roof.']));}
  const hs=housesNear(v.x,v.z,18),b=hs.length?pick(hs):home||G.center;if(!b)return false;const d=doorOf(b);
  return go(v,d[0]+rn(-1,1),d[1]+rn(-.5,.8),'shelter',hrs*.7,'shelter',{face:[b.x,b.z],th:pick(['Under the eaves, waiting it out.','Not a day for walking.','Drip, drip, drip...']),prop:eraUmbrella()?'umbrella':null,noChat:false});
}
const eraUmbrella=()=>(G.era|0)>=5;
function rainbowLook(v,h){if(!(G.rainbow>0)||h<6.5||h>20.5||R()>.6)return false;const c=spots();let p=null;
  const s=shorePt(c.pl?c.pl.x:v.x,c.pl?c.pl.z:v.z,26);if(s&&R()<.6)p=[s[0]+rn(-3,3),s[1]+rn(-3,3)];else if(c.pl)p=plazaPt(c.pl.r+3);
  if(!p)return false;let fx=v.x,fz=v.z;if(typeof rainbow!=='undefined'&&rainbow.position){fx=rainbow.position.x;fz=rainbow.position.z;}
  return go(v,p[0],p[1],'rainbow',rn(1,1.8),'gaze',{face:[fx,fz],th:pick(['A rainbow! Look!','The Spirit smiles on us.','Have you ever seen colours like that?'])});
}

// --- dawn
function dawn(v,home,h){
  v._rd=dayN();const e=G.era|0,w=wellFor(v);
  const choice=wpick([['water',(e<=5&&w&&v.age>=10)?5:0],['stretch',4],['breakfast',5]]);
  if(choice==='water'){const d=doorOf(w);return go(v,d[0]+rn(-1.2,1.2),d[1]+rn(-.8,1.4),'water',rn(.4,.7),'drawwater',{prop:'jug',face:[w.x,w.z],th:pick(['Fresh water for the morning.','The bucket is cold at this hour.','Another day begins.']),tb:w.id,hold:true});}
  if(choice==='stretch'&&home){const d=doorOf(home);return go(v,d[0]+rn(-1,1),d[1]+rn(0,1.2),'stretch',rn(.3,.5),'stretch',{th:pick(['Stretching the sleep from my bones.','Smell the morning air.','Another good day, I hope.'])});}
  if(home)return inside(v,home,rn(.3,.55),'breakfast',pick(['Porridge and a crust, then to work.','Breakfast first, always.','A warm bowl to start the day.']));
  return false;
}
function wellFor(v){const w=bestSpotNear(built('well'),v.x,v.z,18);return w;}

// --- the midday break of outdoor workers (short and occasional, so the economy is unchanged)
function lunch(v,home,h){
  const e=G.era|0;
  if(hotDay(h)||R()<.35){const t=treeNear(v.x,v.z,12);if(t&&(hotDay(h)||R()<.6)){return go(v,t.x+rn(-1,1),t.z+rn(-.4,1.2),'lunch',hotDay(h)?rn(.9,1.2):rn(.5,.8),'eat',{ground:true,prop:'bread',th:hotDay(h)?'Out of the heat, into the shade.':pick(['Cold meat and bread under the tree.','A bite and a rest.']),face:[t.x,t.z]});}}
  const mk=nearestOf('market',v.x,v.z,14);
  if(mk&&R()<.45){const d=doorOf(mk);return go(v,d[0]+rn(-3,3),d[1]+rn(-2,3),'lunch',rn(.5,.8),'eat',{ground:e<=2,prop:'bread',th:pick(['Something from the stalls.','Bread, cheese, and a rest.'])});}
  if(e>=5){const bn=nearestBench(v,14);if(bn)return goBench(v,bn,'lunch',rn(.5,.8),'eat',{prop:e>=6?'phone':'bread',th:pick(['Lunch on the bench.','Twenty minutes of peace.'])});}
  stat('lunch');v._rtA='lunch';v._rtU=G.t+.55;v.prop='bread';v.propT=G.t+.6;v._sit=e<=3?2:0;
  setThought(v,pick(['Dinner-time at last.','Out of the sun for a moment.','My feet need a rest.','A bite from the bundle.']));
  wait(v,rn(.45,.65),e<=3?'eat':'eat',false);if(lod0(v)&&R()<.5)tryChat(v);return true;
}
function nearestBench(v,maxD){const c=spots();let best=null,bd=maxD||40;for(const b of c.ben){if(b.occ[0]>G.t&&b.occ[1]>G.t)continue;const d=Math.hypot(b.x-v.x,b.z-v.z);if(d<bd){bd=d;best=b;}}return best;}
function goBench(v,bn,act,hrs,anim,o){o=o||{};const side=bn.occ[0]<=G.t?-1:1;const s=Math.sin(bn.rot),cs=Math.cos(bn.rot);// seat along the bench
  const sx=bn.x+cs*.42*side,sz=bn.z-s*.42*side;o.bench=bn;o.noChat=!!o.noChat;bn.occ[side<0?0:1]=G.t+hrs+1;
  return go(v,sx,sz,act,hrs,anim,o);}

// --- evenings, Sunday afternoons, elders' days
function evening(v,home,h,opt){
  const e=G.era|0,rain=raining()||snowing()&&heavyRain(),dusk=h<19.4,win=winter(),sea=seasonN(),age=v.age,mourn=((v._mourn||0)>G.t||v.mourning||(v.grf||0)>45);
  // a walk of 20 units takes about three hours of game time, so the evening stays within reach of where the folk are
  const tav=nearestOf('tavern',v.x,v.z,26),mk=nearestOf('market',v.x,v.z,20),ch=nearestOf('church',v.x,v.z,24)||nearestOf('shrine',v.x,v.z,24),shw=entertainment(v.x,v.z,30);
  const farm=sea===2?nearestOf('farm',v.x,v.z,24):null,fs0=fireSpot(),fs=fs0&&Math.hypot(fs0.x-v.x,fs0.z-v.z)<28?fs0:null,sh=(age>=9)?shoreNear(v,22):null,pl0=spots().pl,pl=pl0&&Math.hypot(pl0.x-v.x,pl0.z-v.z)<30?pl0:null;
  const adult=age>=16;
  const o=[['home',W.home[e]*(rain?3:1)*(h>20.2?2.5:h<19.6?.45:1)],
    ['fire',fs&&!rain||fs&&winter()?W.fire[e]*(win?2:1)*(h>=18?1.3:.7):0],
    ['tavern',tav&&adult?W.tavern[e]*(rain?2:1)*(mourn?.3:1)*(h>=19?1.2:1):0],
    ['market',mk&&dusk&&!rain?W.market[e]:0],
    ['stroll',!rain&&dusk&&G.plan?W.stroll[e]*(sea===3?.5:1):0],
    ['stoop',!rain?W.stoop[e]*(win?.4:1)*2.4:0],
    ['garden',home&&!rain&&dusk&&sea<3&&e<=6?W.garden[e]:0],
    ['pray',ch?W.pray[e]*(mourn?3:1)*(isSunday()?2:1):0],
    ['shore',sh&&!rain&&dusk&&sea!==3?W.shore[e]:0],
    ['show',shw.length&&adult?W.show[e]*(rain?2:1):0],
    ['plaza',pl&&!rain&&sea!==3?W.plaza[e]:0],
    ['craft',home&&W.craft[e]&&!rain?W.craft[e]*(win?.5:1):0],
    ['glean',farm&&dusk&&!rain?W.glean[e]:0]];
  if(v.traits&&v.traits.length)for(const it of o){const m=TRAITW[it[0]];if(m)for(const t of v.traits)if(m[t])it[1]*=m[t];}
  const act=wpick(o)||'home';
  const hrs=()=>rn(.9,1.8);
  switch(act){
    case 'home':return inside(v,home||G.center,rn(1,1.8),'home',pick(['Supper at home.','A quiet evening indoors.','Home, at last.']));
    case 'fire':{const d=scatter(fs.x,fs.z,1.6,3.4);return go(v,d[0],d[1],'fire',rn(1.1,2),'sit',{ground:e<=3,face:[fs.x,fs.z],prop:R()<.3?'mug':null,th:pick(winter()?['Warm hands by the fire at last.','Close to the flames, close to each other.','The cold stays out here.']:['The fire is the heart of the evening.','Stories by the fire.','Sparks rising like little stars.']),hold:true});}
    case 'tavern':{if(R()<.5||rain)return inside(v,tav,rn(1.2,2.4),'tavern',pick(['An ale after a long day.','To '+tavWord(e)+'!','Did you hear the news?']));
      const d=doorOf(tav),bn=nearestBench(v,22);const cp=scatter(d[0],d[1],1.2,3);
      if(bn&&R()<.5)return goBench(v,bn,'tavern',rn(.9,1.6),'drink',{prop:'mug',th:'A quiet mug on the bench.'});return go(v,cp[0],cp[1],'tavern',rn(.9,1.6),'drink',{prop:'mug',ground:e<=2,face:[tav.x,tav.z],th:pick(['One more round, and then home.','Warm light spilling from the window.'])});}
    case 'market':{const d=doorOf(mk),p=scatter(d[0],d[1],1.5,5.5);return go(v,p[0],p[1],'market',rn(.7,1.4),'idle',{prop:e<=4?'basket':e>=5?'bag':null,face:[mk.x,mk.z],th:pick(['A few last things from the stalls.','Haggling over a fair price.','What is fresh today?']),hold:true});}
    case 'stroll':return stroll(v,home,h);
    case 'stoop':return doorstep(v,home,h);
    case 'garden':{const d=doorOf(home),p=scatter(d[0],d[1],1.6,4);return go(v,p[0],p[1],'garden',rn(.8,1.5),'tend',{prop:'basket',th:pick(['Weeding the beans.','A little patch of green.','These herbs need water.']),face:[home.x,home.z]});}
    case 'pray':{const d=doorOf(ch),p=scatter(d[0],d[1],1.2,3);return go(v,p[0],p[1],'pray',rn(.6,1.1),'pray',{face:[ch.x,ch.z],th:pick(['A quiet word with the Spirit.','Lighting a small candle.','Thanks for today.']),noChat:true});}
    case 'shore':return go(v,sh[0]+rn(-1.5,1.5),sh[1]+rn(-1.5,1.5),'shore',rn(.8,1.5),R()<.3&&e<=5?'work':'sit',{ground:true,prop:e<=5&&R()<.4?'rod':null,th:pick(['The water is calm tonight.','Ripples catching the last light.','I could watch the river forever.'])});
    case 'show':{const b=pick(shw);return inside(v,b,rn(1.2,2.2),'show',pick(['An evening out.','Something to see tonight.','Worth the ticket.']));}
    case 'plaza':{const bn=nearestBench(v,30);if(bn&&R()<.6)return goBench(v,bn,'plaza',hrs(),'sit',{th:pick(['Watching the world go by.','A seat in the evening air.']),prop:e>=6&&R()<.4?'phone':null});
      const p=plazaPt(pl.r+3);return go(v,p[0],p[1],'plaza',hrs(),'idle',{th:pick(['Meeting friends in the square.','The square is lively tonight.'])});}
    case 'craft':{const d=doorOf(home),p=scatter(d[0],d[1],.8,2.4);return go(v,p[0],p[1],'craft',hrs(),'craft',{ground:true,prop:'tool',th:pick(['Mending by the doorway while the light lasts.','Whittling a little something.','My hands like to be busy.']),face:[d[0]+rn(-5,5),d[1]+rn(2,6)]});}
    case 'glean':{const p=scatter(farm.x,farm.z,0,4);return go(v,p[0],p[1],'glean',rn(.9,1.5),'glean',{prop:'basket',th:pick(['Gleaning what the reapers left.','Every ear counts before winter.','Harvest-home is near.'])});}
  }
  return false;
}
function shoreNear(v,maxD){let c=v._shore;if(!c||G.t-c.t>24){const s=findShore(v.x,v.z,14);c=v._shore={x:s?s[0]:0,z:s?s[1]:0,t:G.t,ok:!!s};}if(!c.ok)return null;return Math.hypot(c.x-v.x,c.z-v.z)<=(maxD||22)?[c.x,c.z]:null;}
function stroll(v,home,h){
  const P=G.plan;if(!P||!P.streets||!P.streets.length)return false;
  let best=null,bd=1e9,bi=0;const sx=v.x,sz=v.z;
  for(const s of P.streets){if(s.stair||!s.pts||s.pts.length<3)continue;for(let i=0;i<s.pts.length;i+=2){const d=Math.hypot(s.pts[i][0]-sx,s.pts[i][1]-sz);if(d<bd){bd=d;best=s;bi=i;}}}
  if(!best||bd>14)return false;
  const n=best.pts.length,dir=R()<.5?1:-1;let j=bi,p=best.pts[bi];for(let k=1;k<n;k++){const q=best.pts[clamp(bi+dir*k,0,n-1)];if(Math.hypot(q[0]-sx,q[1]-sz)>rn(8,16))break;j=clamp(bi+dir*k,0,n-1);p=best.pts[j];}
  if(j===bi)return false;
  const comp=strollMate(v);const off=comp?(R()<.5?.9:-.9):0;
  const tx=p[0]+off*.7,tz=p[1]+off*.7;
  stat('stroll');
  if(comp){const q=best.pts[j];comp._rtU=0;comp.timer=0;comp.tick=null;comp.onDone=null;comp.path=null;comp._rtA='stroll';comp.prop=null;setThought(comp,pick(['A walk together, just us.','Arm in arm down the lane.','The evening is kind.']));
    goTo(comp,q[0]-off*.7,q[1]-off*.7,vv=>wait(vv,rn(.5,.8),'idle',false));comp._rtU=G.t+1.6;comp._walkWith=v;}
  return go(v,tx,tz,'stroll',rn(.5,.8),'idle',{th:comp?pick(['A walk together, just us.','Arm in arm down the lane.','The evening is kind.']):pick(['A slow turn about the street.','Stretching my legs before dark.','Evening lamps coming on.']),hold:!comp});
}
function strollMate(v){if(R()<.35)return null;const sp=idMap().get(v.spouse);const ok=w=>w&&!w._gone&&!w.hidden&&!w.path&&(w._rtU||0)>G.t&&!(w._chatU>G.t)&&Math.hypot(w.x-v.x,w.z-v.z)<16&&w.age>=14&&(w._lod||0)===0;
  if(ok(sp))return sp;const fs=folkNear(v,14,(w)=>ok(w)&&relGroup(rel(v,w))==='friend');return fs.length?fs[0]:null;}
function doorstep(v,home,h){
  // neighbours settle on the same doorstep for the evening (the house with the lowest hash today), so there is someone to talk to
  const hs=housesNear(v.x,v.z,15),hq=Math.floor(h);let b=home,bk=home?hash(home.id+':'+dn0()+':'+hq)+.25:9;for(const o of hs){const k=hash(o.id+':'+dn0()+':'+hq);if(k<bk){bk=k;b=o;}}if(!b)return false;
  const d=doorOf(b),p=scatter(d[0],d[1],.6,2),bn=R()<.25?nearestBench(v,10):null;
  if(bn)return goBench(v,bn,'stoop',rn(.9,1.6),'sit',{th:'A seat in the evening air.'});
  return go(v,p[0],p[1],'stoop',rn(.8,1.6),R()<.5?'sit':'idle',{ground:G.era<=3,face:[d[0]+rn(-6,6),d[1]+rn(1,8)],th:pick(['Sitting out on the step.','Chatting over the garden wall.','A little gossip before bed.','The street is quiet and golden.'])});
}

// --- the church bell: before the Sunday service the folk gather on the church square
function bellCrowd(v,h){
  const ch=nearestOf('church',v.x,v.z,22);if(!ch||v.job==='guard'||R()>.8)return false;
  if(RT.bellD!==dayN()+':'+TOWNS.cur){RT.bellD=dayN()+':'+TOWNS.cur;if(typeof sfx==='function'&&lod0(v))try{sfx('bell');}catch(e){}}const d=doorOf(ch),p=scatter(d[0],d[1],1.5,5);
  return go(v,p[0],p[1],'bell',Math.max(.3,Math.min(.6,8-h+.05)),'idle',{face:[ch.x,ch.z],th:pick(['The bell is ringing.','Time for the service.','Good morning, neighbours.','Sunday at last.']),hold:true});
}
// Sunday afternoon: church, then a picnic with the family (a family chooses its place together, so they meet there) or rest
function sundayAfternoon(v,home,h){
  const e=G.era|0;if(R()<.1)return false;
  if(raining())return shelter(v,home,h);
  const c=spots(),k=hash(v.fam+':'+dayN());const hd=home?doorOf(home):null,base=hd?{x:hd[0],z:hd[1]}:(c.pl||(G.center?{x:G.center.x,z:G.center.z}:null));if(!base)return false;
  let p=null;
  for(let t=0;t<5&&!p;t++){const a=hash(v.fam+':'+dayN()+':'+t)*TAU,d=hash(v.fam+t)*9+5,x=base.x+Math.cos(a)*d,z=base.z+Math.sin(a)*d;if(okPt(x,z)){let clear=true;for(const b of buildings)if(Math.hypot(b.x-x,b.z-z)<b.r+1.5){clear=false;break;}if(clear)p=[x,z];}}
  if(k<.3){const s=shoreNear(v,20);if(s)p=[s[0],s[1]];}
  if(!p||k>.88){const pl=c.pl&&Math.hypot(c.pl.x-v.x,c.pl.z-v.z)<26?plazaPt(c.pl.r+3):null;if(pl)p=pl;}if(!p)return false;
  return go(v,p[0]+rn(-1.4,1.4),p[1]+rn(-1.4,1.4),'picnic',rn(1.4,2.6),'eat',{ground:true,prop:'bread',th:pick(['A picnic with the family.','Nothing to do and all afternoon.','Sunday is for resting.','Bread, cheese, and sunshine.']),hold:true});
}

// --- elders: slow mornings on a bench, a nap after noon, the square in the afternoon
function elderDay(v,home,h){
  const e=G.era|0;
  if(hotDay(h)&&R()<.5){const t=treeNear(v.x,v.z,20);if(t)return go(v,t.x+rn(-1,1),t.z+rn(-.4,1.2),'shade',rn(1,1.6),'sit',{ground:true,face:[t.x,t.z],th:pick(['Too warm to stir. The shade is kind.','Under the old tree, out of the glare.'])});}
  if(raining())return shelter(v,home,h)||inside(v,home||G.center,rn(.8,1.4),'home','Out of the rain.');
  if(h>=12.4&&h<14.2&&home&&R()<.55)return inside(v,home,rn(.9,1.3),'nap',pick(['A short nap after dinner.','Just resting my eyes.']));
  const bn=nearestBench(v,18),pl0=spots().pl,fs0=fireSpot();
  const o=[['bench',bn?5:0],['stoop',4],['garden',home&&seasonN()<3&&e<=6?3:0],['plaza',pl0&&Math.hypot(pl0.x-v.x,pl0.z-v.z)<24?2:0],['market',nearestOf('market',v.x,v.z,16)&&h<18?2:0],['pray',nearestOf('church',v.x,v.z,20)?1.5:0],['fire',winter()&&fs0&&Math.hypot(fs0.x-v.x,fs0.z-v.z)<24?3:0],['kids',2]];
  const a=wpick(o);
  if(a==='bench')return goBench(v,bn,'bench',rn(1.2,2.4),'sit',{prop:e>=6&&R()<.3?'book':R()<.2?'tool':null,th:pick(['A bench in the sun. What more is there?','I have seen many summers from this seat.','Feed the sparrows, watch the young ones.','My knees tell me it will change weather.'])});
  if(a==='garden'){const d=doorOf(home),p=scatter(d[0],d[1],1.5,4);return go(v,p[0],p[1],'garden',rn(.8,1.4),'tend',{prop:'basket',face:[home.x,home.z],th:'Pottering about the garden.'});}
  if(a==='plaza'){const p=plazaPt(pl0.r+2.5);return go(v,p[0],p[1],'plaza',rn(1,1.8),'idle',{th:'Time to see who is about.'});}
  if(a==='market'){const mk=nearestOf('market',v.x,v.z,16),d=doorOf(mk),p=scatter(d[0],d[1],1.5,5);return go(v,p[0],p[1],'market',rn(.7,1.3),'idle',{prop:'basket',face:[mk.x,mk.z],th:'A few things from the stalls.'});}
  if(a==='pray'){const ch=nearestOf('church',v.x,v.z,20),d=doorOf(ch),p=scatter(d[0],d[1],1.2,3);return go(v,p[0],p[1],'pray',rn(.7,1.2),'pray',{face:[ch.x,ch.z],noChat:true,th:'I pray for them all, every day.'});}
  if(a==='fire'){const fs=fs0;if(fs){const d=scatter(fs.x,fs.z,1.6,3);return go(v,d[0],d[1],'fire',rn(1,2),'sit',{ground:e<=3,face:[fs.x,fs.z],th:'The fire warms old bones.'});}}
  if(a==='kids'){const ks=folkNear(v,40,w=>w.age<12&&w.age>=4&&w._lod===0);if(ks.length){const k=pick(ks);const p=scatter(k.x,k.z,1.5,3);return go(v,p[0],p[1],'story',rn(.9,1.6),'sit',{ground:true,th:'Gather round, little ones, and I will tell you...'});}}
  return doorstep(v,home,h);
}

// --- children: school on weekdays, then games (alone, in pairs, in the snow) and errands for the family
function kidDay(v,home,h){
  const e=G.era|0,age=v.age,dn=dayN();
  if(v._heldBy){if(v._heldBy._gone||v._heldBy._held!==v){v._heldBy=null;}else{wait(v,.25,'idle',false);return true;}}
  if(age<3.5){const d=home?doorOf(home):null;if(raining()&&home)return inside(v,home,rn(.8,1.4),'home','Mama says stay in.');
    if(home&&R()<.6)return inside(v,home,rn(1.2,2.2),'home','Naptime. Maybe.');
    if(d){const p=scatter(d[0],d[1],.6,2.2);return go(v,p[0],p[1],'toddle',rn(1.4,2.4),'sit',{ground:true,prop:R()<.5?'ball':null,th:pick(['Da! Da!','Ball.','Up!'])});}return false;}
  const sch=e>=3?nearestOf('school',v.x,v.z,24):null;const dow=dn%7;
  if(sch&&dow<5&&h>=8&&h<14.8&&age>=5){
    if(h<11.1)return inside(v,sch,11.1-h,'school','Copying letters on a slate.');
    if(h<11.8){const d=doorOf(sch),p=scatter(d[0],d[1],2,6);return go(v,p[0],p[1],'recess',.6,R()<.5?'play':'idle',{prop:R()<.5?'ball':null,th:'Recess! Run!'});}
    if(h<14.6)return inside(v,sch,14.6-h,'school','Sums and stories at school.');
  }
  if(raining()&&!snowing()&&heavyRain()||raining()&&R()<.6)return inside(v,home||G.center,rn(.8,1.4),'shelter','Splashing is not allowed indoors.');
  if(h>=19&&home)return inside(v,home,rn(.8,1.4),'home','Time for supper.');
  if(hotDay(h)&&R()<.35){const t=treeNear(v.x,v.z,20);if(t)return go(v,t.x+rn(-1,1),t.z+rn(-.4,1.2),'shade',rn(.7,1.1),'sit',{ground:true,face:[t.x,t.z],th:'Resting in the shade.'});}
  const snow=snowing()||winter()&&G.snow>0;
  let _m=null;const getMates=()=>_m||(_m=folkNear(v,10,w=>w.age<14&&w.age>=4&&!w.path&&!w._heldBy&&(w._rtU||0)<=G.t+.5));
  const sh=age>=6?shoreNear(v,20):null,water=!!sh;
  const o=[['chase',age>=5?4:2],['ball',e>=1?3:1],['hoop',e<=6&&age>=6?2:0],['skip',water?2.5:0],['snow',snow?8:0],['errand',e<=5&&age>=8&&wellFor(v)&&h<16?3:0],['hide',age>=6?1.5:0],['elders',2],['fort',age>=7&&e<=5?1:0],['mother',1.2]];
  const a=wpick(o);
  const home0=home||G.center;
  if(a==='chase'){const mates=getMates(),ctr=mates.length?pick(mates):null;const bx=ctr?ctr.x:v.x,bz=ctr?ctr.z:v.z,p=scatter(bx,bz,3,9);
    if(ctr&&!ctr._chaseU&&R()<.8){ctr._rtU=0;ctr.timer=0;ctr.tick=null;ctr.onDone=null;const q=scatter(bx,bz,5,12);goTo(ctr,q[0],q[1],vv=>wait(vv,rn(.2,.5),'play',false));ctr._rtA='chase';ctr._run=G.t+1.2;ctr.prop=null;}
    v._run=G.t+1.2;return go(v,p[0],p[1],'chase',rn(.3,.7),'play',{th:pick(['Tag, you are it!','Catch me if you can!','Not fair, you cheated!','Over here, slowpoke!']),noChat:true});}
  if(a==='ball'){const d=home0?doorOf(home0):null,p=d?scatter(d[0],d[1],2,7):[v.x,v.z];const mates=getMates(),mate=mates.length?mates[0]:null;
    if(mate){v._pal=mate;mate._pal=v;mate._rtU=0;mate.timer=0;mate.tick=null;mate.onDone=null;mate.path=null;const q=[p[0]+3.2,p[1]+rn(-1,1)];goTo(mate,q[0],q[1],vv=>{vv.prop='ball';vv.propT=G.t+2;wait(vv,rn(.8,1.3),'play',false);vv.rot=Math.atan2(p[0]-vv.x,p[1]-vv.z);vv._rtU=G.t+1.3;});mate._rtA='ball';}
    return go(v,p[0],p[1],'ball',rn(.8,1.4),'play',{prop:'ball',th:pick(['Here it comes!','Over here, over here!','Pass it, pass it!']),noChat:true,face:[p[0]+3.2,p[1]]});}
  if(a==='hoop'){const d=home0?doorOf(home0):[v.x,v.z],p=scatter(d[0],d[1],5,12);v._run=G.t+1.2;return go(v,p[0],p[1],'hoop',rn(.5,.9),'play',{prop:'hoop',th:'Roll, roll, roll!',noChat:true});}
  if(a==='skip'){return go(v,sh[0]+rn(-1,1),sh[1]+rn(-1,1),'skip',rn(.7,1.2),'throw',{prop:'pebble',th:pick(['Three skips! Did you see?','Flat stones are best.','One... two... three!']),face:[sh[0]+rn(-4,4),sh[1]+rn(-4,4)],noChat:true});}
  if(a==='snow'){const p=scatter(v.x,v.z,2,7);v._run=G.t+1;return go(v,p[0],p[1],'snow',rn(.6,1),'throw',{prop:'snowball',th:pick(['Snowball fight!','Right in the back!','Build a snowman!']),noChat:true,face:[p[0]+rn(-5,5),p[1]+rn(-5,5)]});}
  if(a==='errand'){const w=wellFor(v),d=doorOf(w);return go(v,d[0]+rn(-1,1),d[1]+rn(0,1.4),'errand',rn(.4,.7),'drawwater',{prop:'jug',face:[w.x,w.z],th:pick(['Mother needs water.','I can carry it myself.','Careful, careful, do not spill.']),tb:w.id});}
  if(a==='hide'){const hs=housesNear(v.x,v.z,24),b=hs.length?pick(hs):null;if(b){const dx=v.x-b.x,dz=v.z-b.z,dl=Math.hypot(dx,dz)||1;return go(v,b.x-dx/dl*(b.r+.9),b.z-dz/dl*(b.r+.9),'hide',rn(.5,1),'crouch',{th:pick(['Shh, do not laugh.','They will never find me here.','Counting... eight... nine...']),noChat:true});}}
  if(a==='elders'){const es=folkNear(v,40,w=>w.age>58&&(w.anim==='sit'||w.anim==='idle')&&!w.path&&w._lod===0);if(es.length){const k=pick(es);const p=scatter(k.x,k.z,1.2,2.4);return go(v,p[0],p[1],'story',rn(.8,1.4),'sit',{ground:true,th:pick(['Tell me about when you were little.','And then what happened?','Is that really true?'])});}}
  if(a==='fort'){const t=treeNear(v.x,v.z,24);if(t)return go(v,t.x+rn(-1,1),t.z+rn(-1,1),'fort',rn(.8,1.4),'play',{prop:'stick',th:pick(['This tree is our castle.','The dragon will not get past me!','I am the king of the stump.'])});}
  if(a==='mother'){const mom=folkNear(v,40,w=>w.age>=18&&w.age<60&&(w.home===v.home||rel(v,w)==='family'));if(mom.length){const k=mom[0],p=scatter(k.x,k.z,1,2);return go(v,p[0],p[1],'family',rn(.6,1),'idle',{th:'Staying close to Mama.'});}}
  {const d=home0?doorOf(home0):null,p=d?scatter(d[0],d[1],2,8):[v.x,v.z];return go(v,p[0],p[1],'play',rn(.5,1),'play',{th:pick(['Look, a frog!','When I grow up I will be a hero.','Catch me!','Round and round we go!']),noChat:true});}
}

// --- the main hook
window.routineThink=function(v,h,home){
  if(v._held){if(G.t>v._heldU||v._held._gone)dropHeld(v);}
  v.prop=null;v._sit=0;v._lei=0;
  v._era=G.era|0;
  const dn=dayN(),kid=v.age<14,elder=v.age>64;
  if(G.festival>0&&h>=9&&h<21.3&&v.age>=4)return false;
  // fire first: everybody helps
  if((G.t-RT.fires.t>.25||RT.fires.list.length)&&v.age>=10&&fireHelp(v,h))return true;
  // the church bell
  if(isSunday()&&nearestChurch()){if(h>=7.35&&h<7.95&&!v.mission&&v.job!=='guard'&&v.age>=4&&v._bellD!==dn){v._bellD=dn;if(bellCrowd(v,h))return true;}
    if(h>=8&&h<11.5&&v.job!=='guard')return false;}
  const working=!kid&&!elder&&h>=7.2&&h<17.5;
  if(working){
    // builders carry the town's growth: they keep their hours; other trades take only a short, occasional break
    const bld=v.job==='builder';
    if(isSunday()&&h>=11.6&&v._sunD!==dn){v._sunD=dn;if(!bld&&R()<.3&&!v.carry&&!v._res&&sundayAfternoon(v,home,h))return true;}
    if(h>=11.7&&h<13.7&&v._lunch!==dn&&!v.carry&&!v._res){v._lunch=dn;if(!bld&&R()<.3&&lunch(v,home,h))return true;}
    return false;
  }
  if(v.job==='guard'&&h<17.5&&!kid&&!elder)return false;
  if(kid)return kidDay(v,home,h);
  if(elder){if(v._mourn>G.t&&h<16&&R()<.3&&nearestChurch())return evening(v,home,h);return elderDay(v,home,h);}
  // adults outside working hours
  if(h<7.2){if(v._rd!==dn){v._rd=dn;if(R()<(v.job==='builder'?.1:.35))return dawn(v,home,h);}return false;}
  if(h>=17.5){
    if(raining()&&shelter(v,home,h))return true;
    if(G.rainbow>0&&rainbowLook(v,h))return true;
    if(isSunday()&&h<19&&R()<.3)return sundayAfternoon(v,home,h);
    return evening(v,home,h);
  }
  return false;
};
const nearestChurch=()=>built('church')[0];
Object.assign(RT,{startChat,spots,go,settle,maybeHold,evening,kidDay,elderDay,dawn,lunch,fitOf,pose});// (test hooks)


// ================================================================ the look of the day: clothes, tools, poses, speech bubbles, benches, firesides
// The villager rig (people.js) is kept: instanced body parts. rtDrawPeople replaces drawPeople's body with the same rig plus era clothes,
// seasonal and weather layers, carried things, many more poses, and a level of detail by distance from the camera.
const PI_=Math.PI;
const Bx=(w,h,d,ty=0,tz=0,tx=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(tx,ty,tz);return g;};
const Cy=(rt,rb,h,seg,ty=0,tz=0)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg);g.translate(0,ty,tz);return g;};
const Mg=(...gs)=>{const p=[];for(let g of gs){g=g.index?g.toNonIndexed():g;p.push(...g.attributes.position.array);}const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(p,3));o.computeVertexNormals();return o;};
const glowMat=new THREE.MeshBasicMaterial({color:0xffffff,fog:true});
function part(name,geo,o){o=o||{};PG[name]=geo;const m=new THREE.InstancedMesh(geo,o.mat||peopleMat,PCAP);m.setColorAt(0,new THREE.Color());m.count=0;m.castShadow=o.shadow!==false&&!o.mat;m.frustumCulled=false;PM[name]=m;scene.add(m);return m;}
const sph=(r,w,h,a0,a1,b0,b1)=>new THREE.SphereGeometry(r,w,h,a0,a1,b0,b1);
part('thigh',Cy(.06,.055,.26,6,-.13));part('shin',Cy(.052,.046,.25,6,-.125));
part('coat',Cy(.172,.228,.66,9,.09));
part('cloak',Mg(Cy(.2,.29,.46,9,.12),Cy(.15,.25,.14,9,.37)));
part('scarf',Mg(Cy(.088,.098,.07,8,.45),Bx(.05,.22,.03,.34,.1,.04)));
part('apron',Mg(Bx(.25,.36,.022,.17,.168),Bx(.12,.12,.022,.38,.168)));
part('hatTop',Mg(Cy(.108,.115,.2,10,.19),Cy(.19,.19,.02,12,.08)));
part('hatHard',Mg(sph(.135,10,6,0,TAU,0,PI_*.5),Cy(.15,.15,.02,10,.03),Bx(.12,.015,.09,.035,.15)));
part('visor',Bx(.25,.055,.07,.03,.1),{mat:glowMat});
part('umbrella',Mg(Cy(.012,.012,.8,5,.25),sph(.48,10,4,0,TAU,0,PI_*.42).translate(0,.64,0),Cy(.012,.012,.1,5,.7)));
part('lantern',Mg(Bx(.1,.02,.1,-.07),Bx(.1,.02,.1,-.2),Bx(.012,.13,.012,-.135,.045,.045),Bx(.012,.13,.012,-.135,-.045,-.045),Bx(.012,.13,.012,-.135,.045,-.045),Bx(.012,.13,.012,-.135,-.045,.045)));
part('lanternGlow',Bx(.07,.11,.07,-.135),{mat:glowMat});
part('torchP',Mg(Cy(.022,.026,.55,5,.15),Cy(.045,.03,.08,6,.45)));
part('flameP',Mg(new THREE.ConeGeometry(.06,.2,6).translate(0,.57,0)),{mat:glowMat});
part('bucket',Mg(Cy(.1,.075,.15,8,-.1),Bx(.012,.012,.2,-.02)));
part('jug',Mg(Cy(.065,.09,.2,7,-.13),Cy(.035,.05,.07,6,-.01)));
part('basketH',Mg(Cy(.13,.1,.13,8,-.09),Bx(.012,.1,.012,-.0,.0)));
part('bagH',Mg(Bx(.18,.2,.07,-.13),Bx(.14,.05,.075,-.05)));
part('briefcase',Mg(Bx(.3,.21,.055,-.17),Bx(.1,.03,.03,-.04)));
part('bagHip',Bx(.2,.17,.075,.14));
part('book',Bx(.12,.035,.17,0));
part('tablet',Bx(.13,.012,.19,0));part('tabletG',Bx(.115,.014,.17,.003),{mat:glowMat});
part('phoneG',Bx(.045,.075,.012,0),{mat:glowMat});
part('mug',Mg(Cy(.035,.03,.07,6,.035),Bx(.02,.04,.012,.04,0,.045)));
part('ball',new THREE.IcosahedronGeometry(.1,1));
part('hoop',(()=>{const g=new THREE.TorusGeometry(.27,.014,4,12);g.translate(0,.27,0);return g;})());
part('pebble',new THREE.IcosahedronGeometry(.035,0));
part('snowball',new THREE.IcosahedronGeometry(.055,0));
part('bread',Mg(Bx(.1,.045,.055,0)));
part('stickP',Cy(.012,.014,.62,4,.2));
part('cane',Mg(Cy(.016,.016,.82,5,-.4),Bx(.02,.02,.09,.0,.04)));
part('sickle',Mg(Bx(.02,.34,.02,-.14),Bx(.13,.022,.02,-.3,0,.06),Bx(.05,.022,.02,-.28,0,.14)));
part('rifle',Mg(Bx(.034,.7,.034,-.25),Bx(.05,.2,.05,-.5)));
part('baton',Cy(.02,.02,.4,5,-.15));
part('flute',(()=>{const g=Cy(.013,.013,.4,5,0);g.rotateZ(PI_/2);return g;})());
part('bench',Mg(Bx(1.5,.07,.4,.27),Bx(1.5,.34,.05,.5,-.19),Bx(.07,.26,.34,.13,0,.66),Bx(.07,.26,.34,.13,0,-.66)));
part('logSeat',(()=>{const g=new THREE.CylinderGeometry(.17,.17,1.5,7);g.rotateZ(PI_/2);g.translate(0,.17,0);return g;})());

// ---------------------------------------------------------------- clothes
const JG={builder:'lab',wood:'lab',farmer:'lab',quarry:'lab',forager:'lab',sawyer:'lab',mason:'lab',shipwright:'lab',fisher:'lab',hunter:'lab',smith:'craft',miller:'craft',machinist:'craft',stoker:'craft',founder:'craft',baker:'craft',brewer:'craft',weaver:'craft',tanner:'craft',potter:'craft',keeper:'srv',fishmonger:'srv',merchant:'srv',clerk:'off',scholar:'off',scribe:'off',engineer:'off',stationmaster:'off',healer:'off',priest:'priest',guard:'guard'};
const PAL={
  hide:[0x7a5a3a,0x8a6a44,0x6a4a30,0x9a7a52,0x5a4a38],linen:[0xd8cdb0,0xc9bb98,0xb0a07a,0xa8503a,0x4a5f7a,0x6a7a4a,0xd0b878],wool:[0x6a7a4a,0x8a6a3a,0x5a6a7a,0x7a4a3a,0x7a7a5a,0x8a7a5a],
  dub:[0x8a2f2f,0x2f4f7a,0x3f6a3f,0x7a5a2a,0x6a3f6a,0x9a7a3a],home:[0x8a6a42,0x7a6a4a,0x6a6a4a,0x8a7a5a],rich:[0x7a2f3a,0x2f3a7a,0x3a6a4a,0x6a3a6a,0x8a6a2a,0x2f6a6a],
  ind:[0x4a4038,0x3a3a40,0x5a5048,0x45403a,0x34383e],indW:[0x5a3a3a,0x3a4a5a,0x4a4a3a,0x6a5a4a,0x4a3a4a],mod:[0xc0392b,0x2e86c1,0x27ae60,0xe0b020,0xe8ecf0,0x8e44ad,0xe67e22,0x16a085,0x34495e],
  jeans:[0x2c4a7a,0x3a3a3a,0x4a5a7a,0x6a5a42,0x2a3a5a],fut:[0xdfe6ee,0x2a3340,0x4a6a8a,0x6a8a9a,0xc8d0d8,0x1f6a6a,0x7a5a9a],futP:[0x2a3340,0x3a4a5a,0x1f2a36,0x4a5a6a],pants:[0x4a3a2a,0x5a4a3a,0x3a3a3a,0x6a5a42,0x4a4a5a,0x5a3a2a]};
function fitOf(v,L,era){
  const s=seasonN(),kd=v.age<14;if(v._fit&&v._fe===era&&v._fs===s&&v._fj===v.job&&v._fk===kd)return v._fit;
  const t=L.tint,h1=hash(v.id),h2=hash(v.id+31),pc=(a,x)=>a[Math.floor((x==null?t:x)*a.length)%a.length];
  const kid=kd,g=kid?'kid':(JG[v.job]||'lab'),fm=v.female;
  const F={tun:0,sl:0,pants:L.pants,boots:L.boots,dress:L.dress,skirt:false,coat:0,cloak:0,scarf:0,apron:0,belt:0x4a3020,hat:null,hatC:0,vis:false,robe:false,hoodUp:false};
  const dark=c=>c;
  switch(era){
    case 0:F.tun=pc(PAL.hide);F.sl=-1;F.pants=L.skin;F.boots=0x5a4030;F.dress=pc(PAL.hide,t*.9);F.belt=0xa08858;F.skirt=fm||kid&&fm;break;
    case 1:F.tun=pc(PAL.linen);F.sl=F.tun;F.pants=fm?pc(PAL.linen,t):pc([0xc9bb98,0x8a7a58,0x6a5a42],t);F.boots=0x5a4030;F.dress=pc(PAL.linen,(t*7)%1);F.belt=0xa8843a;F.skirt=fm;break;
    case 2:F.tun=pc(PAL.wool);F.sl=F.tun;F.pants=pc([0x5a4a3a,0x4a4a3a,0x6a5a42],t);F.dress=pc(PAL.wool,(t*5)%1);F.belt=0x3a2818;F.skirt=fm;break;
    case 3:F.tun=g==='lab'||g==='craft'?pc(PAL.home):pc(PAL.dub);F.sl=F.tun;F.pants=pc([0x3a3a4a,0x5a3a2a,0x2f4a3a,0x4a3a2a],(t*3)%1);F.dress=g==='lab'?pc(PAL.home,(t*5)%1):pc(PAL.dub,(t*5)%1);F.belt=0x2a1c10;F.skirt=fm;if(g==='srv'||g==='craft')F.apron=0xe8e0d0;break;
    case 4:F.tun=g==='lab'?pc(PAL.home):pc(PAL.rich);F.sl=F.tun;F.pants=pc([0x2f2f3f,0x4a2a2a,0x2a3a2f,0x3a3a3a],(t*3)%1);F.dress=pc(PAL.rich,(t*5)%1);F.belt=0x2a1c10;F.skirt=fm;if(g==='srv'||g==='craft')F.apron=0xe8e0d0;if(g==='off'||g==='srv'&&h1<.5)F.coat=pc([0x6a2f3a,0x2f3a6a,0x2f4a3a],(t*9)%1);break;
    case 5:F.tun=g==='off'||g==='srv'?pc(PAL.ind):pc(PAL.ind,(t*3)%1);F.sl=F.tun;F.pants=pc([0x34383e,0x3a342e,0x2a2a30],(t*3)%1);F.dress=pc(PAL.indW);F.skirt=fm;F.belt=0x1c1410;F.boots=0x201814;
      if(g==='craft'||g==='lab'&&v.job!=='farmer'){F.apron=g==='craft'?0x4a4038:0;}if(g==='off'||g==='srv'||g==='guard')F.coat=g==='guard'?0x2a3350:pc([0x3a3a40,0x4a4038,0x2a2f3a],(t*9)%1);break;
    case 6:F.tun=pc(PAL.mod);F.sl=fm&&h2<.4?-1:F.tun;F.pants=pc(PAL.jeans,(t*3)%1);F.dress=pc(PAL.mod,(t*5)%1);F.skirt=fm&&h1<.45;F.belt=0x2a2018;F.boots=h2<.5?0xe0e0e0:0x2a2420;
      if(g==='off'){F.tun=pc([0xe8ecf0,0x9ab4d0,0xe8d0d8],t);F.sl=F.tun;F.coat=pc([0x2a2f3a,0x3a3f4a,0x4a4f5a],(t*9)%1);F.pants=F.coat;}
      if(v.job==='builder'||v.job==='quarry'||v.job==='mason'||v.job==='shipwright'||v.job==='stoker'){F.tun=h2<.5?0xd8e040:0xe87820;F.sl=0x34393e;}
      if(g==='guard'){F.tun=0x2a3a5a;F.sl=F.tun;F.pants=0x1f2a40;}break;
    case 7:F.tun=pc(PAL.fut);F.sl=F.tun;F.pants=pc(PAL.futP,(t*3)%1);F.dress=pc(PAL.fut,(t*5)%1);F.skirt=fm&&h1<.5;F.belt=0x38e8d8;F.boots=0x2a3340;F.vis=h2<.5||g==='off'||g==='lab'&&h2<.7;
      if(g==='guard'){F.tun=0x1f2a36;F.sl=F.tun;F.pants=0x161e28;}if(g==='off')F.coat=pc([0xdfe6ee,0x8a9aaa],(t*9)%1);break;
  }
  if(kid){F.apron=0;F.coat=0;if(era>=6){F.tun=pc(PAL.mod);F.sl=F.tun;}F.skirt=fm&&(era<=5||h1<.6);}
  if(g==='priest'){F.robe=true;F.skirt=true;F.dress=F.tun=era<=4?0xe8e2d2:era<=6?0x303038:0xe8f0f4;F.sl=F.tun;F.coat=0;F.apron=0;}
  if(g==='guard'&&era<=4){F.tun=era<=2?0x7a3a2a:0x8e2f1f;F.sl=F.tun;F.belt=0x2a2018;if(era>=3)F.coat=0;}
  // seasons
  if(s===3){const w=pc(era<=1?PAL.hide:PAL.wool,(t*13)%1);
    if(era<=2)F.cloak=era===0?0x6a5038:w;else if(era<=4)F.cloak=pc([0x4a3a2a,0x3a4a5a,0x5a2f2f,0x4a5a3a],(t*11)%1);else{F.coat=era===5?pc([0x3a3a40,0x4a4038],t):era===6?pc([0xc0392b,0x2e86c1,0xe0b020,0x34495e,0x27ae60],(t*11)%1):0xaab4c0;}
    if(era>=2&&era<=7&&h1<.8)F.scarf=pc([0xa03030,0x305a8a,0xc8c0a0,0x4a4a4a,0xd0a030],(t*17)%1);}
  else if(s>=0&&h1<.18&&era<=4&&era>=1&&(s===2||s===0))F.cloak=pc(PAL.wool,(t*13)%1);
  // hats
  const jh=v.job;let hat=null,hc=0;
  if(!kid){
    if(era<=4){if(jh==='farmer'){hat='hatStraw';hc=0xd8c070;}else if(jh==='guard'){hat=era>=2?'hatHelm':null;hc=0x9aa0a8;}else if(jh==='priest'){hat='hatCoif';hc=0xeee8dc;}else if(jh==='hunter'){hat='hatHood';hc=0x4a5a2a;}else if(jh==='fisher'){hat=era>=1?'hatFeltCone':null;hc=0x6a4a2a;}else if(jh==='miller'){hat='hatCoif';hc=0xeee8dc;}else if(jh==='quarry'){hat=era>=2?'hatCap':null;hc=0x6a4a2a;}
      else if(era>=2&&L.hatPref){hat=L.hatPref;hc=L.hatC;}if(fm&&era>=3&&!hat&&h1<.7){hat='hatCoif';hc=era===3?0xeee8dc:0xd8d0c0;}}
    else if(era===5){if(g==='off'||g==='srv'){hat=fm?'hatCoif':'hatTop';hc=fm?0xd8d0c0:0x24242a;}else if(g==='guard'){hat='hatCap';hc=0x24305a;}else if(jh==='farmer'){hat='hatStraw';hc=0xd8c070;}else{hat='hatCap';hc=pc([0x4a4038,0x3a3a3a,0x5a4a38],(t*7)%1);}}
    else if(era===6){if(jh==='builder'||jh==='quarry'||jh==='mason'||jh==='shipwright'||jh==='stoker'){hat='hatHard';hc=jh==='builder'?0xf0c020:0xf0f0f0;}else if(g==='guard'){hat='hatCap';hc=0x2a3a5a;}else if(jh==='farmer'){hat='hatStraw';hc=0xd8c070;}else if(h1<.3){hat='hatCap';hc=pc(PAL.mod,(t*5)%1);}}
    else{if(g==='guard'||F.vis){F.vis=true;}if(jh==='builder'||jh==='stoker'){hat='hatHard';hc=0xf0f0f0;}}
    if(s===3&&!hat&&era<=6){hat=era<=2?'hatHood':era>=5?'hatCap':'hatHood';hc=era<=2?0x6a5038:era>=5?0x3a3a40:pc([0x4a3a2a,0x3a4a5a,0x5a2f2f],(t*11)%1);}
  }
  F.hat=hat;F.hatC=hc;v._fe=era;v._fs=s;v._fj=v.job;v._fk=kd;v._fit=F;return F;
}
const eraTool=(v,era)=>{const j=v.job;if(era>=5&&(j==='hunter'))return 'rifle';if(era>=6&&j==='guard')return 'baton';if(era>=5&&j==='guard')return 'rifle';
  if(j==='farmer'){const s=seasonN();return s===0?null:s===2&&era<=5?'sickle':s===3?null:'tHoe';}return JOBTOOL[j]||null;};
const COMMUTE={clerk:1,scholar:1,scribe:1,engineer:1,stationmaster:1,healer:1,merchant:1,priest:1};

// ---------------------------------------------------------------- poses
const P={legA:0,armL:0,armR:0,armLz:.08,armRz:.08,lean:0,twist:0,headY:0,headX:0,bob:0,spin:0,sit:0,drop:0,kneel:0,shake:0,hold:0};
const clamp01=x=>x<0?0:x>1?1:x;
const env=(c,a,b)=>{if(c<a||c>b)return 0;return Math.sin((c-a)/(b-a)*PI_);};
function pose(v,T,moving,era,sc,tier,mourn){
  P.legA=0;P.armL=0;P.armR=0;P.armLz=.08;P.armRz=.08;P.lean=v.age>58?.16:0;P.twist=0;P.headY=0;P.headX=0;P.bob=0;P.spin=0;P.sit=0;P.drop=0;P.kneel=0;P.shake=0;P.hold=0;
  const kid=v.age<14,elder=v.age>58,id=v.id,ph=v.wph||0,cold=winter()||snowing(),an=v.anim,pr=(v.propT>G.t)?v.prop:null;
  const run=v._run>G.t;
  if(moving){
    const amp=run?1.0:kid?.74:elder?.4:.62;P.legA=Math.sin(ph)*amp;
    P.armL=-P.legA*(elder?.5:.8);P.armR=P.legA*(elder?.5:.8);P.bob=Math.abs(Math.cos(ph))*(kid?.07:run?.07:.045);
    if(run){P.lean+=.18;}
    if(v.kind==='bandit'||v.flee){P.legA*=1.2;P.lean+=.12;}
    if(elder){P.lean+=.1;P.armR=-.3;P.armRz=.06;}
    if(cold&&!run&&era<=7){P.armL=-1.05;P.armR=-1.05;P.armLz=-.75;P.armRz=-.75;P.lean+=.05;if(elder)P.armR=-.3;}
    if(mourn){P.headX=.3;P.lean+=.05;P.bob*=.5;}
    if(v.carry){if(v.carry==='wood'||v.carry==='meat'){P.armR=-2.7;P.armRz=-.15;}else{P.armL=-1.0;P.armR=-1.0;P.armLz=-.3;P.armRz=-.3;}P.lean-=.04;}
    else if(pr==='jug'||pr==='bucket'||pr==='basket'||pr==='bag'||pr==='tool'){P.armR=-.35;P.armRz=.12;if(pr==='bucket'||pr==='jug')P.lean+=.04;}
    else if(pr==='umbrella'){P.armR=-1.25;P.armRz=.15;}
    else if(pr==='phone'){P.armR=-1.7+Math.sin(T*.7+id)*.1;P.armRz=-.1;P.headX=.35;}
    else if(pr==='tablet'||pr==='book'){P.armL=-1.15;P.armR=-1.15;P.armLz=-.2;P.armRz=-.2;P.headX=.3;}
    else if(pr==='stick'||pr==='hoop'){P.armR=-.9;}
    else if(pr==='ball'){P.armR=-.8;P.armRz=-.1;}
    if(v._lantern)P.armL=-.5;
    return;
  }
  // standing, sitting and doing
  const c=((T*.11+id*.37)%1);
  switch(an){
    case 'work':{const j=v.act||v.job,t=T*5.5+id;
      if(j==='builder'||j==='mason'||j==='shipwright'){P.armR=-2.3+Math.max(0,Math.sin(t*1.3))*1.6;P.armL=-.6;P.lean+=.12;}
      else if(j==='wood'||j==='sawyer'||j==='quarry'){const s=Math.sin(t);P.armR=-2.0+s*1.3;P.armL=-2.0+s*1.3;P.lean+=.1+s*.12;P.twist=s*.25;}
      else if(j==='farmer'){const se=seasonN();
        if(se===0){const s=Math.sin(T*1.5+id);P.lean+=.3;P.armR=-.5+s*.55;P.armL=-.7;P.twist=s*.4;}
        else if(se===2&&era<=5){const s=Math.sin(t*.9);P.lean+=.5;P.armR=-1.5+s*.7;P.armL=-1.3-s*.4;P.twist=s*.25;}
        else{const s=Math.sin(t*.8);P.armR=-.9+s*.5;P.armL=-.7+s*.5;P.lean+=.32+s*.08;}}
      else if(j==='fisher'){const cy=(T*.22+id*.37)%1;if(cy<.28){const k=cy/.28;P.armR=-.4-Math.sin(k*PI_)*2.2;P.armL=-.4-Math.sin(k*PI_)*1.8;P.lean-=Math.sin(k*PI_)*.18;}else{P.armR=-1.1+Math.sin(T*1.3+id)*.08;P.armL=-.4;}}
      else if(j==='forager'||j==='gather'){P.lean+=.55;P.armR=-.7+Math.sin(t)*.3;P.armL=-.6-Math.sin(t)*.3;}
      else if(j==='hunter'){P.armR=-1.4+Math.sin(t*1.6)*.5;P.armL=-1.1;P.lean+=.1;}
      else{P.armR=-.5+Math.sin(t)*.3;P.armL=-.3;}break;}
    case 'fight':{const s=Math.sin(T*12+id);P.armR=-1.5+s*.8;P.armL=-.8;P.lean+=.15;P.legA=.25;break;}
    case 'dance':{const m=id%3;
      if(id%7===0){P.armR=-2.05;P.armL=-2.05;P.armRz=-.35;P.armLz=-.35;P.headX=-.12;P.bob=Math.abs(Math.sin(T*3+id))*.03;P.twist=Math.sin(T*2+id)*.15;P.legA=Math.sin(T*3+id)*.12;break;}
      if(m===0){P.spin=T*2.5+id;P.armR=-2.6+Math.sin(T*8+id)*.4;P.armL=-2.6-Math.sin(T*8+id)*.4;P.bob=Math.abs(Math.sin(T*7+id))*.16;P.legA=Math.sin(T*7+id)*.4;}
      else if(m===1){const b=Math.sin(T*6+id);P.armR=-2.8;P.armL=-2.8;P.armRz=.5+b*.2;P.armLz=.5-b*.2;P.bob=Math.abs(b)*.14;P.legA=b*.5;P.twist=b*.25;}
      else{const b=Math.sin(T*5+id);P.armR=-1.2+b*.5;P.armL=-1.2-b*.5;P.armRz=.4;P.armLz=.4;P.bob=Math.abs(Math.sin(T*5+id))*.1;P.legA=b*.55;P.spin=Math.sin(T*1.2+id)*.7;}break;}
    case 'aim':{P.armL=-1.57;P.armR=-1.45;P.armLz=0;P.twist=.35;break;}
    case 'talk':{const spk=v._spk&&v._say&&G.t<v._say.t1;
      if(spk){P.armR=-1.1+Math.sin(T*5.2+id)*.45;P.armL=-.5+Math.sin(T*3.7+id)*.35;P.armRz=.25;P.headY=Math.sin(T*2.3+id)*.18;P.headX=-.05+Math.sin(T*4.1)*.05;P.lean+=.04;}
      else{P.armL=Math.sin(T*1.1+id)*.05;P.armR=-.3;P.headX=Math.sin(T*2.4+id*2)*.1;P.headY=Math.sin(T*.7+id)*.12;}
      if(v.prop==='mug'&&pr==='mug'){P.armR=-1.5;}break;}
    case 'argue':{const s=Math.sin(T*9+id);if(v._spk){P.armR=-1.6+s*.25;P.armL=-.2;P.lean+=.1;P.headY=s*.18;}else{P.armL=-.5;P.armR=-.5;P.headY=Math.sin(T*3+id)*.15;P.lean-=.05;P.armLz=.5;P.armRz=.5;}break;}
    case 'hug':{P.armL=-1.3;P.armR=-1.3;P.armLz=-.1;P.armRz=-.1;P.lean+=.1;P.bob=Math.sin(T*2.5+id)*.01;break;}
    case 'wave':{P.armR=-2.75+Math.sin(T*9+id)*.3;P.armRz=.5;P.armL=.0;P.headY=.2;break;}
    case 'gaze':{P.headX=-.55;P.armL=-.3;P.armR=-.3;P.lean-=.04;if(v._gzBig)P.armL=P.armR=-2.9;break;}
    case 'pray':{P.kneel=1;P.drop=.17;P.armL=-1.55;P.armR=-1.55;P.armLz=-.35;P.armRz=-.35;P.lean+=.22;P.headX=.35;break;}
    case 'play':{const s=Math.sin(T*6+id);P.bob=Math.abs(s)*.2;P.legA=s*.5;P.armL=-Math.sin(T*6+id+1)*.9-.4;P.armR=Math.sin(T*6+id+1)*.9-.4;if(pr==='ball'){P.armR=-1.0+Math.sin(T*3+id)*.3;}P.twist=Math.sin(T*3+id)*.25;break;}
    case 'throw':{const cy=(T*.55+id*.3)%1;if(cy<.35){const k=cy/.35;P.armR=-2.9+k*3.0;P.lean+=k*.22;P.twist=-.4+k*.8;}else{P.armR=-.4;P.twist=0;P.armL=-.3;}break;}
    case 'tend':case 'glean':{const s=Math.sin(T*2.2+id);P.lean+=.7+s*.08;P.armR=-1.45+s*.25;P.armL=-1.25-s*.25;P.headX=-.2;break;}
    case 'stretch':{const k=Math.sin(((T*.5+id*.1)%1)*PI_);P.armL=-2.9*k;P.armR=-2.9*k;P.armLz=.35*k+.08;P.armRz=.35*k+.08;P.lean-=.14*k;P.headX=-.25*k;break;}
    case 'drawwater':{const s=Math.sin(T*2.4+id);P.lean+=.3+Math.max(0,s)*.18;P.armL=-1.2+s*.45;P.armR=-1.2+s*.45;break;}
    case 'bucket':{const s=Math.sin(T*3.4+id*1.3);P.armL=-1.35+s*.3;P.armR=-1.35-s*.3;P.armLz=-.12;P.armRz=-.12;P.twist=s*.45;P.lean+=.08;break;}
    case 'shelter':{P.armL=-1.05;P.armR=-1.05;P.armLz=-.8;P.armRz=-.8;P.lean+=.15;P.headX=.25;P.shake=.012;break;}
    case 'crouch':{P.drop=.3;P.kneel=1;P.lean+=.5;P.armL=-1.2;P.armR=-1.2;P.headX=-.3;break;}
    case 'drink':case 'eat':case 'sit':case 'craft':case 'read':{P.sit=1;P.drop=v._sit===2?.4:.2;P.lean+=.05;P.armL=-.9;P.armR=-.9;P.armLz=.05;P.armRz=.05;
      if(an==='eat'||pr==='bread'){const k=env((T*.45+id*.31)%1,0,.35);P.armR=-.9-k*1.15;P.headX=-k*.12;}
      else if(an==='drink'||pr==='mug'){const k=env((T*.3+id*.27)%1,0,.3);P.armR=-.9-k*1.0;P.headX=-k*.2;P.armL=-.7;}
      else if(an==='craft'){const s=Math.sin(T*3.1+id);P.armR=-1.1+s*.2;P.armL=-.9;P.lean+=.25;P.headX=.35;}
      else if(an==='read'||pr==='book'||pr==='tablet'){P.armR=-1.15;P.armL=-1.15;P.headX=.35;}
      else if(pr==='phone'){P.armR=-1.6;P.headX=.4;}
      else{P.headY=Math.sin(T*.5+id*1.7)*.45;P.armR=-.85+Math.sin(T*.7+id)*.06;P.armL=-.85;}
      if(elder&&!an.startsWith('e')){P.lean+=.04;}
      break;}
    default:{
      P.armL=Math.sin(T*1.1+id)*.05;P.armR=-P.armL;P.headY=Math.sin(T*.4+id*1.7)*.5;
      if(pr==='phone'){P.armR=-1.65;P.armLz=.1;P.headX=.4;P.headY=0;}
      else if(pr==='tablet'||pr==='book'){P.armL=-1.15;P.armR=-1.15;P.headX=.3;P.headY=0;}
      else if(pr==='bread'){const k=env((T*.45+id*.31)%1,0,.35);P.armR=-.9-k*1.15;}
      else if(pr==='mug'){const k=env((T*.3+id*.27)%1,0,.3);P.armR=-.8-k*1.1;}
      else if(pr==='umbrella'){P.armR=-1.25;P.armRz=.15;}
      else if(pr==='jug'||pr==='bucket'||pr==='basket'||pr==='bag'||pr==='tool'){P.armR=-.35;P.armRz=.12;}
      else if(pr==='ball'){P.armR=-.8;}
      else if(cold&&!v.hidden){P.armL=-1.05;P.armR=-1.05;P.armLz=-.75;P.armRz=-.75;P.shake=.01;P.lean+=.04;P.headY*=.4;}
      else if(c<.08){const k=env(c,0,.08);P.headY=Math.sin(c*60)*.8*k;}
      else if(c>.12&&c<.19){const k=env(c,.12,.19);P.armR=-2.5*k;P.armRz=.1;P.headX=.1*k;}
      else if(c>.2&&c<.38&&seasonN()===1&&hotDay(hod())){const k=env(c,.2,.38);P.armR=-2.35*k;P.armRz=-.1;P.headX=-.14*k;}// a hand over the eyes against the glare
      else if(c>.55&&c<.63){const k=env(c,.55,.63);P.armL=-2.9*k;P.armR=-2.9*k;P.armLz=.3*k+.08;P.armRz=.3*k+.08;P.lean-=.1*k;P.headX=-.2*k;}
      else if(c>.8&&c<.9){P.lean+=Math.sin((c-.8)*10*PI_)*.04;P.legA=0;P.twist=Math.sin((c-.8)*10*PI_)*.08;}
    }
  }
  if(mourn&&!P.sit&&an!=='talk'&&an!=='work'){P.headX=Math.max(P.headX,.35);P.armL=-.5;P.armR=-.5;P.armLz=-.15;P.armRz=-.15;P.lean+=.06;}
  if(v._gz&&T<v._gz.until&&!moving&&an!=='work'&&an!=='talk'){if(v._gz.k==='train'){P.armR=-2.8+Math.sin(T*9+id)*.3;P.armRz=.5;}else if(v._gz.k==='gawk'){P.headX=-.5;if(v._gz.big){P.armL=P.armR=-2.8;P.armLz=P.armRz=.45;}}}
}

// ---------------------------------------------------------------- the draw
const PCOL={jug:0xa0683a,bucket:0x8a6a42,basketH:0xb09058,bagH:0x8a7a5a,briefcase:0x3a3028,book:0x7a3a2a,tablet:0x30363e,mug:0xc8c0a8,ball:0xc8503a,hoop:0x8a6a3a,pebble:0x8a8a84,snowball:0xf4f8fc,bread:0xc8a060,stickP:0x6a4a2a,torchP:0x6a4a2a,umbrella:0x2a3a5a,sickle:0x8a8a8a,rifle:0x3a3a3a,baton:0x2a2a2a,cane:0x6a4a2a,lantern:0x2a2a2a};
const UMB=[0x2a3a5a,0x7a2a2a,0x2f5a3a,0x3a3a3a,0xc8a030,0x5a3a6a];
const _Hh=new THREE.Matrix4();
RT.bq=[];RT.dt=0;RT.lastT=0;
function drawOne(v,T,tier,era,O){
  const held=!!O;
  const y=O?O.y:hAt(v.x,v.z)+Math.max(0,wAt(v.x,v.z)-.3)*.7;
  if(!v.look)v.look=makeLook(v);const L=v.look;
  const kid=v.age<14,sc=(O&&O.sc?O.sc:(kid?.55+v.age*.03:1)*L.h);
  const moving=!!v.path&&!held;
  const F=fitOf(v,L,era),mourn=((v._mourn||0)>G.t||v.mourning||(v.grf||0)>45);
  const near=tier===0,mid=tier<=1;
  pose(v,T,moving,era,sc,tier,mourn);
  if(held){P.legA=.25+Math.sin(T*2+v.id)*.1;P.armL=-2.7;P.armR=-2.7;P.armLz=.25;P.armRz=.25;P.lean=0;P.sit=0;P.drop=0;P.headY=0;P.headX=.15;P.bob=0;}
  const pr=(v.propT>G.t)?v.prop:null;
  const rainy=raining()&&!snowing(),sn=snowing();
  const x=O?O.x:v.x,z=O?O.z:v.z,rot=(O?O.rot:(v.rot||0))+P.spin;
  const sit=P.sit,dropY=P.drop*sc;
  const jig=P.shake?Math.sin(T*38+v.id)*P.shake:0;
  _B.compose(_P.set(x+jig,y+(P.bob-(sit||P.kneel?P.drop:0))*sc,z),_Q.setFromEuler(_E.set(0,rot,0,'YXZ')),_Sv.set(sc*L.w,sc,sc*L.w));
  const bandit=v.kind==='bandit';
  const pants=bandit?0x2a2420:mourn?0x24242a:F.pants,boots=mourn?0x1a1a1e:F.boots;
  // legs
  if(sit){const th=P.drop>.3?-1.4:-1.52,sh=P.drop>.3?.35:1.52;
    for(const s of [-1,1]){_O.multiplyMatrices(_B,local(s*.075,.5,0,th,0,0));pput('thigh',_O,pants);_A.multiplyMatrices(_O,local(0,-.26,0,sh,0,0));pput('shin',_A,pants);
      if(mid){_A.multiplyMatrices(_A,local(0,-.25,0,-(th+sh)*.0,0,0));pput('foot',_A,boots);}}}
  else if(P.kneel){for(const s of [-1,1]){_O.multiplyMatrices(_B,local(s*.075,.5,0,-.15,0,0));pput('thigh',_O,pants);_A.multiplyMatrices(_O,local(0,-.26,0,1.7,0,0));pput('shin',_A,pants);}}
  else for(const s of [-1,1]){_O.multiplyMatrices(_B,local(s*.075,.5,0,s*P.legA,0,0));pput('leg',_O,pants);if(mid){_A.multiplyMatrices(_O,local(0,-.47,0,0,0,0));pput('foot',_A,boots);}}
  // body
  _U.multiplyMatrices(_B,local(0,.5,0,P.lean,P.twist,0));
  const skirt=(F.skirt||F.robe)&&!bandit,tun=bandit?0x3a2a24:mourn&&!F.robe?0x26262c:F.tun,bodyC=skirt?(mourn&&!F.robe?0x26262c:F.dress):tun;
  _O.multiplyMatrices(_U,local(0,0,0,0,0,0));pput('torso',_O,skirt?bodyC:tun);
  if(mid){pput('chest',_O,skirt?bodyC:tun);pput('belt',_A.multiplyMatrices(_U,local(0,.05,0,0,0,0)),F.belt);}
  if(skirt){_O.multiplyMatrices(_U,local(0,.06,0,-P.lean*.6-(sit?.9:0)-(P.kneel?.5:0),0,0));pput('skirt',_O,bodyC);}
  if(!bandit){
    if(F.coat&&mid){_O.multiplyMatrices(_U,local(0,0,0,sit?-.02:0,0,0));pput('coat',_O,mourn?0x1c1c22:F.coat);}
    else if(F.cloak&&mid){_O.multiplyMatrices(_U,local(0,0,0,0,0,0));pput('cloak',_O,F.cloak);}
    if(F.apron&&near&&!mourn){_O.multiplyMatrices(_U,local(0,0,0,0,0,0));pput('apron',_O,F.apron);}
    if(F.scarf&&near){_O.multiplyMatrices(_U,local(0,0,0,0,0,0));pput('scarf',_O,F.scarf);}
    if(!kid&&near&&pr==='bag'){_O.multiplyMatrices(_U,local(-.19,.12,0,0,0,0));pput('bagHip',_O,0x6a5a42);}
  }
  // head
  _O.multiplyMatrices(_U,local(0,.555,0,-P.lean*.4+P.headX,P.headY,0));pput('head',_O,v.sick?0xa8c098:L.skin);
  let hat=bandit?'hatHood':F.hat,hatC=bandit?0x2a1a14:F.hatC;
  if(!bandit&&!kid){if(rainy&&era<=4&&hat!=='hatHelm'&&hat!=='hatStraw'&&hat!=='hatHood'){hat='hatHood';hatC=0x4a5a3a;}
    if(mourn&&hat&&hat!=='hatHelm')hatC=0x1e1e24;}
  if(kid&&(rainy||sn)&&era<=4){hat='hatHood';hatC=0x5a4a3a;}
  if(L.hair&&hat!=='hatHelm'&&hat!=='hatHood'&&hat!=='hatCoif'&&hat!=='hatHard'&&tier<2){_A.multiplyMatrices(_O,local(0,0,0,0,0,0));pput(L.hair,_A,L.hairC);}
  else if(L.hair&&tier===2&&!hat){_A.multiplyMatrices(_O,local(0,0,0,0,0,0));pput(L.hair,_A,L.hairC);}
  if(L.beard&&!kid&&!bandit&&mid)pput('beard',_O,L.hairC);
  if(v.anim==='dance'&&v.id%7===0&&near&&!moving){_A.multiplyMatrices(_O,local(0,-.075,.115,0,0,0));pput('flute',_A,0xc8a868);}
  if(hat){_A.multiplyMatrices(_O,local(0,hat==='hatStraw'?0:.02,0,0,0,0));pput(hat,_A,hatC);}
  if(F.vis&&!bandit&&mid){_A.multiplyMatrices(_O,local(0,0,0,0,0,0));pput('visor',_A,0x38e8d8);}
  // arms, hands, tools and things carried
  const tool=bandit?(v.id%2?'tSword':'tSpear'):v.carry?null:v.weapon==='tBow'?null:(v.weapon||eraTool(v,era)||null);
  const sleeveC=bandit?0x3a2a24:F.sl===-1?L.skin:mourn&&!F.robe?0x26262c:F.coat&&mid?F.coat:F.sl||tun;
  const lei=(v._lei||0)>G.t&&v.anim!=='work',showTool=tool&&!P.sit&&!held&&!pr&&!lei;
  const umb=!held&&!bandit&&era>=5&&(rainy||sn&&heavyRain())&&v.anim!=='work'&&!pr&&!sit&&v._lod!==2;
  v._lantern=false;
  const lantOn=!held&&!bandit&&nightF>.42&&near&&(v.id%3)!==0&&!sit&&era<=5&&!umb;
  if(lantOn)v._lantern=true;
  for(const s of [-1,1]){
    let ax=s<0?P.armL:P.armR,az=s<0?P.armLz:P.armRz;
    if(s>0&&umb){ax=-1.25;az=.15;}if(s<0&&lantOn)ax=moving?-.5:-.4;
    if(s>0&&showTool&&(tool==='tRifle'||tool==='rifle')){ax=-.5;}
    _O.multiplyMatrices(_U,local(s*.19,.4,0,ax,0,s*az));
    if(mid&&F.sl!==-1)pput('sleeve',_O,sleeveC);
    pput('arm',_O,L.skin);
    if(mid){_A.multiplyMatrices(_O,local(0,-.42,0,0,0,0));pput('hand',_A,L.skin);
      if(s>0){
        if(showTool&&!umb){const upr=(tool==='tRod'||tool==='tSpear'||tool==='tHoe'||tool==='tStaff'||tool==='tTorch');
          if(tool==='sickle'||tool==='baton'||tool==='rifle'){const tl=local(0,0,0,tool==='rifle'?.25:tool==='sickle'?1.5:.2,0,0);_H(_A,tl);pput(tool,_Hh,PCOL[tool]);}
          else{const tl=local(0,0,0,upr?.3:tool==='tBasket'?0:1.8,0,0);_H(_A,tl);pput(tool,_Hh,tool==='tSword'||tool==='tKnife'?0x9aa0a8:tool==='tBasket'?0xa08050:0x6a4a2a);}}
        else if(umb){_H(_A,local(0,0,0,-ax+.1,0,0));pput('umbrella',_Hh,UMB[v.id%UMB.length]);}
        else if(pr&&!bandit)propDraw(v,pr,_A,ax,T,era,near);
        if(!pr&&!showTool&&!umb&&v.age>58&&near&&!bandit&&!sit&&v.anim!=='work'&&!v.carry){_H(_A,local(0,0,0,0,0,0));pput('cane',_Hh,PCOL.cane);}
      }else{
        if(v.weapon==='tBow'&&!held){_H(_O,local(0,-.42,0,0,0,0));pput('tBow',_Hh,0x6a4a2a);}
        else if(lantOn){_H(_A,local(0,0,0,-ax,0,0));if(era<=1){pput('torchP',_Hh,PCOL.torchP);pput('flameP',_Hh,0xffa030);}else{pput('lantern',_Hh,PCOL.lantern);pput('lanternGlow',_Hh,0xffc060);}}
      }}
  }
  // commuters carry their trade
  if(near&&moving&&!pr&&!tool&&!v.carry&&!held&&!bandit&&COMMUTE[v.job]&&!umb){
    const q=_A.multiplyMatrices(_U,local(.19,.4,0,P.armR,0,P.armRz));const hnd=_Hh.multiplyMatrices(q,local(0,-.42,0,0,0,0));
    if(era>=5&&era<=6&&v.job!=='priest'){pput('briefcase',hnd,PCOL.briefcase);}
    else if(era>=7&&v.job!=='priest'&&v.job!=='healer'){pput('tablet',hnd,0x30363e);pput('tabletG',_A.multiplyMatrices(hnd,local(0,.01,0,0,0,0)),0x60e8ff);}
    else{pput('book',_A.multiplyMatrices(hnd,local(0,-.03,.02,-.6,0,0)),0x7a3a2a);}
  }
  // carried goods
  if(v.carry&&!held&&mid){const ck={wood:'cLog',stone:'cStone',food:'cSack',loot:'cSack',fish:'cFish',meat:'cMeat'}[v.carry]||'cSack';
    const pos=v.carry==='wood'?local(.12,.66,0,0,.3,0):v.carry==='meat'?local(0,.62,-.05,0,PI_/2,0):v.carry==='fish'?local(-.24,.12,.08,0,0,0):local(0,.28,.24,0,0,0);
    _O.multiplyMatrices(_U,pos);pput(ck,_O,{cLog:0x8a6440,cStone:0xa39c8e,cSack:0xc8b48a,cFish:0x9ab0b8,cMeat:0x8a4a3a}[ck]);}
  // a hoop rolls ahead of a child; a ball goes back and forth
  if(!held&&near&&pr==='hoop'){const hz=.7+Math.sin(T*3+v.id)*.05;_O.multiplyMatrices(_B,local(0,0,hz,0,0,0));_A.multiplyMatrices(_O,local(0,0,0,0,PI_/2,(v.wph||0)*.2));pput('hoop',_A,PCOL.hoop);}
  if(!held&&near&&pr==='ball'&&v._pal&&v._pal.look&&v.id<v._pal.id&&!v._pal.path&&!moving){const o=v._pal,k=(T*.9+v.id*.1)%1,a=k<.5?k*2:2-k*2;const px=v.x+(o.x-v.x)*a,pz=v.z+(o.z-v.z)*a,py=hAt(px,pz)+.12+Math.sin(a*PI_)*.7*(.5+.5*Math.abs(Math.sin(T*.9*PI_)))+.1;
    _O.multiplyMatrices(_I.identity(),local(px,py,pz,0,0,0));pput('ball',_O,PCOL.ball);}
  // a small child carried on a parent's arm
  if(v._held&&!held&&!v._held._gone){const c=v._held;if(!c.look)c.look=makeLook(c);c.x=v.x;c.z=v.z;const cx=v.x+Math.sin(rot)*.22+Math.cos(rot)*.2,cz=v.z+Math.cos(rot)*.22-Math.sin(rot)*.2;
    drawOne(c,T,tier,era,{x:cx,y:y+(.58+P.bob)*sc,z:cz,rot:rot+.3,sc:.5});}
  // collect speech bubbles
  if(near&&v._say&&G.t<v._say.t1&&!held)RT.bq.push(v,y+1.62*sc);
}
const _I=new THREE.Matrix4();
function _H(a,b){return _Hh.multiplyMatrices(a,b);}
// things in the right hand
function propDraw(v,pr,A,ax,T,era,near){
  const up=(rx,py)=>{_H(A,local(0,py||0,0,-ax+rx,0,0));};
  switch(pr){
    case 'jug':_H(A,local(.0,0,0,-ax*.0,0,0));pput('jug',_Hh,PCOL.jug);break;
    case 'bucket':_H(A,local(0,0,0,0,0,0));pput('bucket',_Hh,PCOL.bucket);break;
    case 'basket':_H(A,local(0,0,0,0,0,0));pput('basketH',_Hh,PCOL.basketH);break;
    case 'bag':if(era>=5){_H(A,local(0,0,0,0,0,0));pput('briefcase',_Hh,PCOL.briefcase);}else{_H(A,local(0,0,0,0,0,0));pput('bagH',_Hh,PCOL.bagH);}break;
    case 'umbrella':_H(A,local(0,0,0,-ax+.1,0,0));pput('umbrella',_Hh,UMB[v.id%UMB.length]);break;
    case 'mug':up(0,.0);pput('mug',_Hh,PCOL.mug);break;
    case 'bread':up(.2,0);pput('bread',_Hh,PCOL.bread);break;
    case 'book':up(-.9,0);pput('book',_Hh,PCOL.book);break;
    case 'tablet':up(-.7,0);pput('tablet',_Hh,PCOL.tablet);pput('tabletG',_A.multiplyMatrices(_Hh,local(0,.006,0,0,0,0)),0x60e8ff);break;
    case 'phone':up(-.3,-.02);pput('phoneG',_Hh,0xa0e8ff);break;
    case 'ball':_H(A,local(0,-.05,.06,0,0,0));pput('ball',_Hh,PCOL.ball);break;
    case 'pebble':_H(A,local(0,-.02,0,0,0,0));pput('pebble',_Hh,PCOL.pebble);break;
    case 'snowball':_H(A,local(0,-.02,0,0,0,0));pput('snowball',_Hh,PCOL.snowball);break;
    case 'stick':up(.5,0);pput('stickP',_Hh,PCOL.stickP);break;
    case 'tool':_H(A,local(0,0,0,1.8,0,0));pput('tKnife',_Hh,0x9aa0a8);break;
    case 'rod':_H(A,local(0,0,0,.3,0,0));pput('tRod',_Hh,0x6a4a2a);break;
    case 'hoop':_H(A,local(0,0,0,.5,0,0));pput('stickP',_Hh,PCOL.stickP);break;
  }
}

// ---------------------------------------------------------------- speech bubbles (a few, only for nearby talkers)
let bubHost=null;const bubs=[];
function ensureBubbles(){if(bubHost)return;
  const st=document.createElement('style');st.textContent=`#rtBub{position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden}
  .rtb{position:absolute;max-width:176px;padding:5px 9px 6px;border-radius:10px;background:rgba(250,240,214,.94);color:#3a2a14;font:12px/1.25 Georgia,'Times New Roman',serif;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:translate(-50%,-100%);transition:opacity .18s;white-space:normal;text-align:center}
  .rtb:after{content:'';position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:rgba(250,240,214,.94)}
  .rtb.era5{background:rgba(236,238,232,.94);font-family:Arial,Helvetica,sans-serif;color:#222}.rtb.era5:after{border-top-color:rgba(236,238,232,.94)}
  .rtb.era7{background:rgba(20,40,52,.9);color:#bff4ff;font-family:'Segoe UI',Arial,sans-serif;border:1px solid rgba(100,230,255,.5)}.rtb.era7:after{border-top-color:rgba(20,40,52,.9)}`;
  document.head.appendChild(st);bubHost=document.createElement('div');bubHost.id='rtBub';document.body.appendChild(bubHost);}
const _pv=new THREE.Vector3();
function updateBubbles(){
  const q=RT.bq;if(!q.length&&!bubs.length)return;ensureBubbles();
  const items=[];for(let i=0;i<q.length;i+=2)items.push([q[i],q[i+1]]);
  const far=(cam.dist||100)>130||MODE==='title'||(typeof UIBLOCK!=='undefined'&&UIBLOCK);
  items.sort((a,b)=>Math.hypot(a[0].x-cam.tx,a[0].z-cam.tz)-Math.hypot(b[0].x-cam.tx,b[0].z-cam.tz));
  const n=far?0:Math.min(6,items.length),W=innerWidth,H=innerHeight;
  const cls=(G.era|0)>=7?'rtb era7':(G.era|0)>=5?'rtb era5':'rtb';
  for(let i=0;i<Math.max(n,bubs.length);i++){
    let b=bubs[i];
    if(i>=n){if(b&&b.on){b.el.style.opacity=0;b.on=false;b.el.style.display='none';}continue;}
    const [v,yy]=items[i];if(!b){const el=document.createElement('div');bubHost.appendChild(el);b=bubs[i]={el,on:false,txt:''};}
    _pv.set(v.x,yy,v.z).project(camera);
    if(_pv.z>1||_pv.z<-1||Math.abs(_pv.x)>1.1||Math.abs(_pv.y)>1.1){if(b.on){b.el.style.display='none';b.on=false;}continue;}
    const t=v._say.txt;if(b.txt!==t||b.cls!==cls){b.el.textContent=t;b.txt=t;b.cls=cls;b.el.className=cls;}
    if(!b.on){b.el.style.display='block';b.on=true;}
    const fade=clamp((v._say.t1-G.t)*8,0,1);b.el.style.opacity=Math.min(1,fade+.0)*(v.hidden?0:1);
    b.el.style.left=((_pv.x*.5+.5)*W).toFixed(0)+'px';b.el.style.top=((-_pv.y*.5+.5)*H).toFixed(0)+'px';
  }
}

// ---------------------------------------------------------------- benches and firesides (dressing around the gathering places)
let benchMesh=null,benchLog=null,benchV=-1;const _bm=new THREE.Matrix4();
function ensureBench(){if(benchMesh)return;benchMesh=new THREE.InstancedMesh(PG.bench,peopleMat,64);benchMesh.setColorAt(0,new THREE.Color());benchMesh.count=0;benchMesh.castShadow=true;benchMesh.receiveShadow=true;benchMesh.frustumCulled=false;scene.add(benchMesh);
  benchLog=new THREE.InstancedMesh(PG.logSeat,peopleMat,64);benchLog.setColorAt(0,new THREE.Color());benchLog.count=0;benchLog.castShadow=true;benchLog.frustumCulled=false;scene.add(benchLog);}
function drawBenches(){
  if(benchV===RT.benchV&&!RT.benchDirty)return;ensureBench();benchV=RT.benchV;RT.benchDirty=false;let n=0,m=0;
  for(const [i,c] of RT.sc){const s=TOWNS.list[i];if(!s||s.dead||sGet(i,'town')!==c.town)continue;const era=sGet(i,'era')|0;
    for(const b of c.ben){const bm=era<=1?benchLog:benchMesh,k=era<=1?m:n;if(k>=63)continue;
      _bm.compose(_P.set(b.x,b.y,b.z),_Q.setFromEuler(_E.set(0,b.rot,0)),_Sv.set(1,1,1));
      const col=era<=1?0x7a5a3a:era<=3?0x7a5a36:era<=4?0x6a4a2c:era<=5?0x3a4a3a:era<=6?0x7a7e84:0xc8d4dc;
      bm.setMatrixAt(k,_bm);_C.setHex(col);bm.setColorAt(k,_C);if(era<=1)m++;else n++;}}
  benchMesh.count=n;benchLog.count=m;benchMesh.instanceMatrix.needsUpdate=true;benchLog.instanceMatrix.needsUpdate=true;if(benchMesh.instanceColor)benchMesh.instanceColor.needsUpdate=true;if(benchLog.instanceColor)benchLog.instanceColor.needsUpdate=true;
}
// bonfires: lit in the evenings of the early ages and in winter; a few logs, a flickering flame, a glow on the ground, rising sparks
const FIRE=[];
function mkFire(){const g=new THREE.Group();
  const logs=new THREE.Mesh(Mg(...[0,1,2,3,4].map(i=>{const a=i/5*TAU,q=Cy(.07,.07,.9,5,0);q.rotateZ(PI_/2);q.rotateY(a);q.translate(Math.cos(a)*.16,.1,-Math.sin(a)*.16);return q;})),new THREE.MeshStandardMaterial({color:0x4a3220,flatShading:true,roughness:1}));logs.castShadow=false;g.add(logs);
  const fm=new THREE.MeshBasicMaterial({color:0xff9a30,transparent:true,opacity:.92,depthWrite:false});
  const f1=new THREE.Mesh(new THREE.ConeGeometry(.34,.95,6),fm),f2=new THREE.Mesh(new THREE.ConeGeometry(.22,.7,5),new THREE.MeshBasicMaterial({color:0xffe060,transparent:true,opacity:.95,depthWrite:false}));
  f1.position.y=.55;f2.position.y=.45;g.add(f1,f2);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(3.6,24),new THREE.MeshBasicMaterial({color:0xff8a30,transparent:true,opacity:.0,depthWrite:false,blending:THREE.AdditiveBlending}));gl.rotation.x=-PI_/2;gl.position.y=.06;g.add(gl);
  g.visible=false;scene.add(g);return {g,f1,f2,gl};}
function updateFires(T,dt){
  let k=0;
  if(MODE==='god'||MODE==='sandbox'){
    for(const [i,c] of RT.sc){const s=TOWNS.list[i];if(!s||s.dead||sGet(i,'town')!==c.town||!c.fire)continue;
      const era=sGet(i,'era')|0,hh=hod();const lit=(era<=3||era===4&&winter())&&(hh>=16.6||hh<5.4);
      if(!lit)continue;if(Math.hypot(c.fire.x-cam.tx,c.fire.z-cam.tz)>(cam.dist||100)*1.1+60)continue;
      let f=FIRE[k];if(!f)f=FIRE[k]=mkFire();k++;
      const y=hAt(c.fire.x,c.fire.z);f.g.position.set(c.fire.x,y,c.fire.z);f.g.visible=true;
      const fl=.85+Math.sin(T*13+i)*.12+Math.sin(T*23.7)*.08;f.f1.scale.set(fl,.8+fl*.3,fl);f.f2.scale.set(1.1-fl*.3,.7+Math.sin(T*17)*.2,1.1-fl*.3);f.f1.rotation.y=T*2;f.f2.rotation.y=-T*3;
      f.gl.material.opacity=(.22+.1*Math.sin(T*9))*(.5+nightF*.6);
      if(dt>0&&Math.random()<dt*14){spawn(c.fire.x+(Math.random()-.5)*.3,y+.9,c.fire.z+(Math.random()-.5)*.3,(Math.random()-.5)*.3,.9+Math.random()*.6,(Math.random()-.5)*.3,1.6+Math.random(),.55,.35,.3,.3,0);}
      if(dt>0&&Math.random()<dt*9){spawn(c.fire.x+(Math.random()-.5)*.4,y+.9,c.fire.z+(Math.random()-.5)*.4,(Math.random()-.5)*.6,1.3+Math.random(),(Math.random()-.5)*.6,.9+Math.random()*.6,.16,1,.62,.2,3);}
    }
  }
  for(let j=k;j<FIRE.length;j++)FIRE[j].g.visible=false;
}

// ---------------------------------------------------------------- the main draw
const _fr=new THREE.Frustum(),_fm=new THREE.Matrix4(),_sp=new THREE.Sphere(new THREE.Vector3(),12);
let trainT=0;
window.rtDrawPeople=function(list,T){
  const dt=clamp(T-RT.lastT,0,.2);RT.lastT=T;
  for(const k in pcnt)pcnt[k]=0;RT.bq.length=0;
  camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();_fm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_fr.setFromProjectionMatrix(_fm);
  const cp=camera.position,baseEra=G.era|0,t1=60*60,t2=115*115;
  // trains pull onlookers; a miracle makes everyone look
  let tr=null;if(typeof netVeh!=='undefined'&&netVeh.length){tr=[];for(const nv of netVeh){if(nv.L&&nv.m&&(nv.L.kind==='rail'||nv.L.kind==='highway')){const p=nv.m.position;if(Math.hypot(p.x-cam.tx,p.z-cam.tz)<(cam.dist||100)*1.1+30){p._rail=nv.L.kind==='rail';tr.push(p);}}}if(!tr.length)tr=null;}
  const gw=RT.gawk;if(gw){if(gw.t0==null){gw.t0=T;gw.until=T+(gw.big?7:5);}if(T>gw.until)RT.gawk=null;}
  const gk=RT.gawk;
  for(const v of list){if(v.hidden)continue;
    if(v._heldBy&&v._heldBy._held===v&&!v._heldBy._gone)continue;
    const y=hAt(v.x,v.z)+Math.max(0,wAt(v.x,v.z)-.3)*.7;
    _sp.center.set(v.x,y+1,v.z);if(!_fr.intersectsSphere(_sp))continue;
    const dx=v.x-cp.x,dy=y-cp.y,dz=v.z-cp.z,dd=dx*dx+dy*dy+dz*dz,tier=dd<t1?0:dd<t2?1:2;
    if(tier<2&&!v.path){
      if(tr){for(const p of tr){const ddx=p.x-v.x,ddz=p.z-v.z;if(ddx*ddx+ddz*ddz<(p._rail?200:90)&&(v.anim==='idle'||v.anim==='sit')){if(!v._gz||T>v._gz.until){v._gz=p._rail?{k:'train',until:T+2.4}:{k:'gawk',until:T+1.4};}v.rot=Math.atan2(ddx,ddz);break;}}}
      if(gk&&v.anim!=='work'&&v.anim!=='talk'){const ddx=gk.x-v.x,ddz=gk.z-v.z;if(ddx*ddx+ddz*ddz<3600){v._gz={k:'gawk',until:gk.until,big:gk.big};v.rot=Math.atan2(ddx,ddz);}}
      else if(G.rainbow>0&&(v.anim==='idle')&&typeof rainbow!=='undefined'&&rainbow.visible&&!v._gz){v._gz={k:'gawk',until:T+3};v.rot=Math.atan2(rainbow.position.x-v.x,rainbow.position.z-v.z);}
    }
    drawOne(v,T,tier,v._era!=null?v._era:baseEra,null);
  }
  for(const k in PM){PM[k].count=pcnt[k]||0;PM[k].instanceMatrix.needsUpdate=true;if(PM[k].instanceColor)PM[k].instanceColor.needsUpdate=true;}
  try{updateBubbles();drawBenches();updateFires(T,dt);}catch(e){if(!RT.err){RT.err=e;console.error('routines draw',e);}}
};
}