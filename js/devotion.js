'use strict';
// ================================================================ devotion: piety, doubt, false prophets, atrocities, judgment
// The folk are sympathetic: every sin has a cause the player can see and ease (hunger, fear, sickness, pride).
// Faith (the player's power) comes from belief; a prophet who feeds on doubt drains it, and a civilisation
// that commits too many atrocities can be judged and cleansed, after which a new age begins.
const DOCTRINES={
  abundance:{name:'The Gospel of Plenty',cause:'hunger',blurb:'Hunger made them listen to a man who promised full granaries.',
    deeds:[
      {lvl:1,sin:4,f:(c,v)=>{const t=Math.min(G.food,G.food*.25+6);if(t<2)return `Followers of ${c.name} broke into the common store and found it bare. They blamed the Spirit, and the neighbours who still had bread.`;G.food-=t;return `Followers of ${c.name} broke into the common store and took ${Math.round(t)} measures of grain. Hungry hands, but others went without.`;}},
      {lvl:2,sin:8,f:(c,v)=>{if(v){devKill(v);return `${fullName(v)} was dragged from home as a "hoarder" and beaten to death by those who followed ${c.name}. Hunger had curdled into fury.`;}return null;}},
      {lvl:3,sin:16,f:(c,v)=>{if(v){devKill(v);return `At ${c.name}'s false altar, ${fullName(v)} was given to the fire so the harvest would come. Desperate people did a monstrous thing.`;}return null;}}]},
  sword:{name:'The Creed of the Sword',cause:'fear',blurb:'Fear of raiders made them trust a man who preached that only strength is holy.',
    deeds:[
      {lvl:1,sin:4,f:(c,v)=>{G.joy=Math.max(0,G.joy-3);return `${c.name}'s followers drilled in the square and shouted down the elders. The streets felt less safe.`;}},
      {lvl:2,sin:9,f:(c,v)=>{if(v){devKill(v);return `${fullName(v)} spoke against ${c.name} and was cut down in the road. Fear had become the thing it hated.`;}return null;}},
      {lvl:3,sin:18,f:(c,v)=>{const g=devDriveOut(2);if(g)return `${c.name}'s followers drove the ${g} families out of ${G.town} with spears, and burned what they left. Frightened people, made cruel.`;if(v){devKill(v);return `${fullName(v)} was slain by ${c.name}'s zealots.`;}return null;}}]},
  purity:{name:'The Doctrine of Purity',cause:'sickness',blurb:'Sickness made them believe the ill were unclean, and that casting them out would save the rest.',
    deeds:[
      {lvl:1,sin:4,f:(c,v)=>{const s=G.vill.filter(o=>o.sick);if(s.length){const o=s[0];o.home=0;o.job=null;o.work=0;return `${fullName(o)}, still fevered, was barred from the village by ${c.name}'s followers and told to die outside the walls.`;}return `${c.name}'s followers painted marks on the doors of the sick.`;}},
      {lvl:2,sin:9,f:(c,v)=>{const s=G.vill.filter(o=>o.sick&&!o.cult);const o=s[0]||v;if(o){devKill(o);return `${fullName(o)} was burned in their bed as "unclean" by those who followed ${c.name}. They only wanted the sickness to stop.`;}return null;}},
      {lvl:3,sin:17,f:(c,v)=>{const g=devDriveOut(2);if(g)return `${c.name} declared the ${g} family impure. They were hunted from ${G.town}. Fear of death had hollowed out mercy.`;if(v){devKill(v);return `${fullName(v)} was drowned as "impure".`;}return null;}}]},
  mammon:{name:'The Creed of Gold',cause:'greed',blurb:'Smoke, long shifts and crowded rooms taught them that only wealth is holy, and that the poor deserve their lot.',
    deeds:[
      {lvl:1,sin:4,f:(c,v)=>{G.joy=Math.max(0,G.joy-4);return `${c.name}'s followers cut the workers' wages and lengthened the shifts. The works ran night and day, and the folk grew grey.`;}},
      {lvl:2,sin:9,f:(c,v)=>{if(v){devKill(v);return `${fullName(v)} was crushed in the machinery while the overseers, who followed ${c.name}, looked on. Profit had become holier than a life.`;}return null;}},
      {lvl:3,sin:18,f:(c,v)=>{G.poll=Math.min(100,(G.poll||0)+20);G.fish=Math.max(.05,(G.fish||1)-.3);if(v){devKill(v);return `${c.name}'s followers let the works pour poison into the river, and ${fullName(v)}, who protested, was dismissed to starve. The water ran black.`;}return `${c.name}'s followers let the works pour poison into the river. The fish died.`;}}]},
  machine:{name:'The Cult of the Engine',cause:'machine',blurb:'Comfort made them forget the Spirit. They were taught that the machines hear them better, and that the soul is only a pattern to be kept.',
    deeds:[
      {lvl:1,sin:3,f:(c,v)=>{G.faith=Math.max(0,G.faith-6);return `${c.name}'s followers bowed to the humming engines instead of the Spirit, and the chapel stood empty.`;}},
      {lvl:2,sin:8,f:(c,v)=>{const ch=buildings.find(b=>(b.type==='church')&&!b.build&&!b.fire);if(ch){ignite(ch,`Followers of ${c.name} burned the old chapel, saying the engines had no need of ghosts.`);return null;}if(v){devKill(v);return `${fullName(v)} would not bow to the Engine and was taken away.`;}return null;}},
      {lvl:3,sin:16,f:(c,v)=>{if(v){devKill(v);return `${fullName(v)} was "uploaded" into the Engine at ${c.name}'s command and never returned. Gentle people, convinced they were saving souls.`;}return null;}}]},
  self:{name:'The Cult of Self',cause:'pride',blurb:'Prosperity made them proud. They were taught that the harvest was their own work, and no Spirit had a hand in it.',
    deeds:[
      {lvl:1,sin:3,f:(c,v)=>{G.faith=Math.max(0,G.faith-4);return `${c.name}'s followers stopped giving thanks at the shrine. "We did this ourselves," they said. The chapel bell rang to an empty hall.`;}},
      {lvl:2,sin:8,f:(c,v)=>{const ch=buildings.find(b=>b.type==='church'&&!b.build&&!b.fire);if(ch){ignite(ch,`Followers of ${c.name} set fire to the chapel, shouting that no god was needed.`);return null;}if(v){devKill(v);return `${fullName(v)} defended the old ways and was beaten by ${c.name}'s followers.`;}return null;}},
      {lvl:3,sin:15,f:(c,v)=>{if(v){devKill(v);return `${c.name} crowned himself above the Spirit, and ${fullName(v)}, who would not kneel, was put to death.`;}return null;}}]}
};
function devNew(){return {piety:62,doubt:10,sin:0,atrocities:0,cult:null,seer:0,cool:0,cultCool:30,peak:0,answered:0,ignored:0,judging:null,menu:false,log:[],remnant:0,distress:0,causes:{}};}
function devEnsure(){if(!G.dev)G.dev=devNew();const d=G.dev,n=devNew();for(const k in n)if(d[k]===undefined)d[k]=n[k];return d;}
const _devPct=x=>Math.round(clamp(x,0,100));
function devKill(v){chron(`${fullName(v)} died.`);removeVillager(v,'died');G.grief=Math.min(18,G.grief+3);G.dev.atrocities++;}
function devDriveOut(n){const vs=G.vill.filter(v=>!v.arriving&&!v.leaving&&!v.cult&&!v.prophet);if(vs.length<5)return null;const fam=pickA(vs).fam;const gone=vs.filter(v=>v.fam===fam);if(gone.length>=vs.length-2)return null;
  const [ex,ez]=edgePoint(rnd()*TAU);for(const v of gone){v.leaving=true;v.lx=ex;v.lz=ez;v.home=0;v.job=null;v.work=0;}G.grief=Math.min(18,G.grief+2*gone.length);G.dev.atrocities++;return fam;}
// what is hurting the folk right now (each 0..1), so the player can see why they stray
function devCauses(){const p=Math.max(1,popN()),vs=G.vill.filter(v=>!v.arriving&&!v.leaving);
  const hunger=G.starve>0?1:G.food<p*1.5?.6:G.food<p*3?.2:0;
  const fear=clamp((G.raid&&!G.raid.over?1:0)+G.grief/14,0,1);
  const sick=clamp(vs.filter(v=>v.sick).length/p*3,0,1);
  const prayers=clamp(G.sad/10,0,1);
  const homeless=clamp(vs.filter(v=>!v.home).length/p*2,0,1);
  const pride=(G.hap>74&&p>=24&&G.food>p*6)?clamp((G.hap-70)/25,0,1):0;
  const e=G.era||0,greed=e>=5?clamp((G.poll||0)/60+(typeof eraBuilt==='function'&&eraBuilt('factory')>0&&p>150?.15:0),0,1):0;
  const machine=e>=7&&(typeof eraBuilt==='function'&&(eraBuilt('powerplant')||eraBuilt('fusion')))?clamp((G.hap-58)/30,0,1)*.9:0;
  return {hunger,fear,sick,prayers,homeless,pride,greed,machine};}
function devDistress(c){return clamp(c.hunger*.35+c.fear*.2+c.sick*.2+c.prayers*.15+c.homeless*.1,0,1);}
function devDoctrineFor(c){const o=[['abundance',c.hunger],['sword',c.fear],['purity',c.sick],['self',c.pride],['mammon',c.greed||0],['machine',c.machine||0]].sort((a,b)=>b[1]-a[1]);return o[0][1]>.15?o[0][0]:null;}
function devSpawnProphet(key){const cand=G.vill.filter(v=>v.age>=22&&!v.arriving&&!v.leaving&&!v.sick&&!v.seer);if(!cand.length)return;
  const v=pickA(cand);v.prophet=true;v.cult=true;const D=DOCTRINES[key];
  G.dev.cult={key,name:fullName(v),pid:v.id,strength:.08,shrine:null,since:G.t,stage:0};
  setThought(v,'The Spirit has abandoned us. I will lead you.');
  chron(`${fullName(v)} began to preach "${D.name}". ${D.blurb}`,true);showBanner('A false prophet',`${fullName(v)} gathers followers`);sfx('alarm');devRefreshShrine();}
function devEndCult(why){const c=G.dev.cult;if(!c)return;const v=G.vill.find(o=>o.id===c.pid);if(v){v.prophet=false;v.cult=false;}for(const o of G.vill)o.cult=false;
  chron(why,true);G.dev.log.push({d:dateStr(),t:`${c.name} and ${DOCTRINES[c.key].name} ended`});G.dev.cult=null;G.dev.cultCool=18;devRefreshShrine();}
function devFollowers(){const c=G.dev.cult;if(!c)return 0;return G.vill.filter(v=>v.cult).length;}
function devSyncFollowers(){const c=G.dev.cult;if(!c)return;const ad=G.vill.filter(v=>v.age>=14&&!v.arriving&&!v.leaving&&!v.prophet).sort((a,b)=>a.id-b.id);const n=Math.round(c.strength*ad.length);
  const pv=G.vill.find(o=>o.id===c.pid);if(!pv){G.dev.cult.pid=0;devEndCult(`${c.name} was lost, and with them the cult's voice.`);return;}
  ad.forEach((v,i)=>{v.cult=i<n;if(v.cult&&rnd()<.15)setThought(v,pickA(['“The prophet speaks the truth.”','“They ignored us. He did not.”','“We must do what is needed.”','“The Spirit has forgotten us.”']));});pv.cult=true;}
function devDaily(){const d=devEnsure();if(G.phase!=='play'||G.menu)return;const p=popN();d.peak=Math.max(d.peak,p);
  if(d.judging)return;
  const cs=devCauses();d.causes=cs;const dist=devDistress(cs);d.distress=dist;const st=d.cult?d.cult.strength:0;
  const church=buildings.some(b=>b.type==='church'&&!b.build&&G.vill.some(v=>v.work===b.id));
  const pT=clamp(38+(church?18:0)+(G.hap-50)*.45+G.joy*.8-G.sad*2-st*45+Math.min(12,d.answered*1.5),0,100);
  const dT=clamp(dist*85+G.sad*3-G.joy*1.5+st*18,0,100);
  d.piety+=(pT-d.piety)*.1;d.doubt+=(dT-d.doubt)*.12;d.answered*=.85;
  if(d.seer>0)d.seer--;if(d.cool>0)d.cool--;if(d.cultCool>0)d.cultCool--;
  // a prophet rises from doubt, not from nowhere
  if(!d.cult&&p>=14&&(G.era||0)>=1&&d.cultCool<=0&&d.doubt>((cs.pride>0||cs.greed>.2||cs.machine>.2)&&dist<.2?28:40)){const k=devDoctrineFor(cs);if(k&&rnd()<.35)devSpawnProphet(k);}
  const c=d.cult;
  if(c){const D=DOCTRINES[c.key];
    c.strength=clamp(c.strength+((d.doubt-34)/100)*.1-((d.piety-50)/100)*.05-(d.seer>0?.018:0)-(G.hap>72?.012:0)+(G.joy>8?-.01:0),0,1);
    if(c.strength<.04&&dayN()-Math.floor(c.since/24)>6)devEndCult(`${c.name}'s following faded as the folk grew less afraid. The false teaching was forgotten.`);
    else{devSyncFollowers();
      const stage=c.strength>=.72?3:c.strength>=.5?2:c.strength>=.25?1:0;
      if(stage>=1&&!c.shrine)devPlaceShrine();
      if(stage>c.stage){c.stage=stage;chron(`${c.name}'s following has grown. ${devFollowers()} now follow ${D.name}.`,stage>=2);}
      if(stage>=1&&d.cool<=0&&rnd()<.3+stage*.1){const lvl=Math.min(stage,1+Math.floor(rnd()*stage));const dd=D.deeds.filter(x=>x.lvl<=stage).slice(-1)[0]||D.deeds[0];
        const victims=G.vill.filter(v=>!v.cult&&!v.prophet&&!v.arriving&&!v.leaving&&v.age>=10);const vic=victims.length?pickA(victims):null;
        const txt=dd.f(c,vic);if(txt){chron(txt,true);d.sin=Math.min(100,d.sin+dd.sin);d.cool=5-stage;showBanner('An atrocity',`${c.name}'s followers have sinned`);sfx('alarm');G.sad=Math.min(20,G.sad+3);d.log.push({d:dateStr(),t:txt});}
        else d.cool=2;}}}
  d.sin=Math.max(0,d.sin-(c?0:.8)); // sin fades slowly once the cause is gone
  devPulseShrine();
}
function devHourly(){const d=G.dev;if(!d||G.phase!=='play'||G.menu)return;const st=d.cult?d.cult.strength:0;
  if(st>0&&G.faith>0)G.faith=Math.max(0,G.faith-popN()*.025*st); // belief siphoned away from the Spirit
  if(d.judging)devJudgeHour();}
function devHapF(f){const d=G.dev;if(d&&d.cult&&d.cult.strength>.2)f.Strife=-Math.round(d.cult.strength*12);if(d&&d.piety>70)f.Faith=3;}
function devPrayer(ok){const d=devEnsure();if(ok){d.answered++;d.doubt=Math.max(0,d.doubt-3);}else{d.ignored++;d.doubt=Math.min(100,d.doubt+4);}}
Object.assign(PRAYERS,{
  cultfear:{t:'Neighbours follow {X}\'s false teaching and we are afraid. Silence the prophet or show us a sign!',how:'Cast Divine Sign, Silence the prophet, or ease what troubles them.',x:()=>G.dev&&G.dev.cult?G.dev.cult.name:'a stranger',when:()=>G.dev&&G.dev.cult&&G.dev.cult.strength>.28,ok:()=>!G.dev.cult||G.dev.cult.strength<.12,r:50,d:6,urgent:1}});
// ---------------- false shrine (visible sign of a spreading cult)
const devGrp=new THREE.Group();scene.add(devGrp);let devFlag=null;
function devRefreshShrine(){while(devGrp.children.length){const m=devGrp.children.pop();m.traverse(o=>o.geometry&&o.geometry.dispose());}devFlag=null;
  const c=G.dev&&G.dev.cult;if(!c||!c.shrine)return;const {x,z}=c.shrine,g=hAt(x,z);const B=new Builder(rnd,.04),F=new Builder(rnd,0);
  B.cyl(0,g-.3,0,1.4,.7,0x2a2420,8);B.box(0,g+.3,0,.9,3.2,.9,0x1c1815);B.box(0,g+3.5,0,1.3,.35,1.3,0x3a1410);B.box(-1.9,g,0,.35,1.5,.35,0x2a2420);B.box(1.9,g,0,.35,1.5,.35,0x2a2420);B.box(0,g,-1.9,.35,1.5,.35,0x2a2420);B.box(0,g,1.9,.35,1.5,.35,0x2a2420);
  F.box(0,-1.6,.8,.05,2.2,1.4,0x7a1810);F.box(0,-.9,.8,.06,.3,1.42,0x16100c);
  const grp=new THREE.Group();grp.position.set(x,0,z);grp.add(B.mesh(matB));const f=F.mesh(matB);f.position.set(0,g+4.9,0);grp.add(f);devFlag=f;devGrp.add(grp);}
function devPlaceShrine(){const c=G.dev.cult;if(!c||c.shrine||!G.center)return;
  for(let i=0;i<40;i++){const a=rnd()*TAU,r=22+rnd()*18,x=G.center.x+Math.cos(a)*r,z=G.center.z+Math.sin(a)*r;
    if(Math.abs(x)>HALF-12||Math.abs(z)>HALF-12||wAt(x,z)>.05||slopeAt(x,z)>.7)continue;if(buildings.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+4))continue;
    c.shrine={x,z};devRefreshShrine();chron(`A dark shrine was raised on the edge of ${G.town}, hung with red cloth. It was ${c.name}'s.`,true);return;}}
function devPulseShrine(){if(!devFlag)return;devFlag.rotation.y=Math.sin(performance.now()/900)*.06;}
// ---------------- the player's answers to doubt
function devSign(){const d=G.dev;if(!spend(60))return false;d.doubt=Math.max(0,d.doubt-28);d.piety=Math.min(100,d.piety+10);d.answered+=3;G.joy=Math.min(25,G.joy+5);
  if(d.cult)d.cult.strength=Math.max(0,d.cult.strength-.2);const c=G.center;if(c)sparkle(c.x,c.z,[1,.9,.5]);for(const b of built('church'))sparkle(b.x,b.z,[1,.9,.5]);
  chron(d.cult?`The Spirit sent a sign over ${G.town}: light on the hills, and a warm wind. Many who had listened to ${d.cult.name} wept.`:`The Spirit sent a sign of peace over ${G.town}.`,true);sfx('chime');return true;}
function devHush(){const d=G.dev,c=d.cult;if(!c){toast('There is no false prophet');return false;}if(!spend(40))return false;
  const v=G.vill.find(o=>o.id===c.pid);const martyr=c.strength>=.5;
  if(v){sparkle(v.x,v.z,[.9,.3,.2]);v.prophet=false;v.cult=false;removeVillager(v,'died');}
  if(martyr){c.strength=Math.min(1,c.strength+.08);d.doubt=Math.min(100,d.doubt+12);G.grief=Math.min(18,G.grief+2);c.pid=0;
    chron(`The Spirit struck down ${c.name}. But the faithful of the false creed called it martyrdom, and wept, and clung to the cult tighter.`,true);d.log.push({d:dateStr(),t:`${c.name} was silenced, and made a martyr`});
    // a new voice rises from the followers
    const f=G.vill.find(o=>o.cult&&!o.prophet);if(f){f.prophet=true;c.pid=f.id;c.name=fullName(f);chron(`${fullName(f)} took up the dead prophet's words.`);}else devEndCult('The cult had no one left to speak for it.');}
  else{devEndCult(`The Spirit silenced ${c.name} before the cult could grow strong. Without their voice, the followers drifted back.`);d.doubt=Math.max(0,d.doubt-6);}
  sfx('thunder');return true;}
function devAnoint(){const d=G.dev;if(d.seer>0){toast('A true prophet already walks among the folk');return false;}
  const cand=G.vill.filter(v=>v.age>=22&&!v.cult&&!v.prophet&&!v.arriving&&!v.leaving&&!v.sick);if(!cand.length){toast('There is no one to anoint');return false;}if(!spend(50))return false;
  const v=pickA(cand);v.seer=true;d.seer=30;d.piety=Math.min(100,d.piety+8);sparkle(v.x,v.z,[1,.95,.6]);setThought(v,'The Spirit has not forgotten us.');
  chron(`${fullName(v)} was anointed with the Spirit's light, and began to speak to the folk of hope and mercy.`,true);sfx('chime');return true;}
function devCast(id){if(!G.dev)devEnsure();
  if(id==='p:sign')return devSign()||true;if(id==='p:hush')return devHush()||true;if(id==='p:anoint')return devAnoint()||true;return false;}
// ---------------- judgment: the god may cleanse a civilisation that has strayed
const JUDG={deluge:{n:'Deluge',d:'Rain without end, and a flood across the valley.',t:'The sky opened, and the water did not stop.'},
  firestorm:{n:'Firestorm',d:'Fire from the sky over every roof.',t:'Fire fell on '},pestilence:{n:'Pestilence',d:'A fever that spares none.',t:'A grey fever spread through '},
  starfall:{n:'Starfall',d:'The heavens hurl stones.',t:'Stars fell upon '}};
function devJustified(){const d=G.dev;return d.sin>=40||(d.cult&&d.cult.strength>=.6);}
function devJudge(kind){const d=devEnsure();if(d.judging||G.phase!=='play')return;const J=JUDG[kind];
  d.judging={kind,since:G.t,justified:devJustified(),start:popN()};d.menu=false;G.faith=0;
  // the faithful are given a way out: they walk to the edge of the valley and carry the memory on
  const rem=G.vill.filter(v=>!v.cult&&!v.prophet&&!v.arriving&&!v.leaving&&v.age>=14&&(v.seer||(v.mood||60)>=55)).sort((a,b)=>(b.seer?1:0)-(a.seer?1:0)).slice(0,6);
  const [ex,ez]=edgePoint(rnd()*TAU);for(const v of rem){v.leaving=true;v.lx=ex;v.lz=ez;v.home=0;v.job=null;v.work=0;setThought(v,'Run! The Spirit has judged us.');}
  d.remnant=rem.length;chron(`${J.t}${kind==='deluge'?'':G.town+'.'} The Spirit passed judgment on ${G.town}.`,true);showBanner('Judgment',`${G.town} is cleansed — ${J.n}`);
  chron(rem.length?`${rem.length} of the faithful fled over the hills before the end.`:'No one escaped.',true);
  if(kind==='deluge'){G.rain=72;G.rainI=6;}if(kind==='pestilence'){for(const v of G.vill)v.sick=1;}
  G.speed=Math.max(G.speed,3);G.paused=false;sfx('thunder');setTimeout(()=>sfx('thunder'),500);updateUI(true);}
function devJudgeHour(){const d=G.dev,j=d.judging;if(!j)return;const h=G.t-j.since;const live=G.vill.filter(v=>!v.leaving&&!v.arriving);
  if(j.kind==='deluge'){G.rain=Math.max(G.rain,40);G.rainI=6;}
  if(j.kind==='firestorm'&&h%2===0){for(const b of buildings.filter(o=>!o.fire&&!o.build).slice(0,Math.max(2,Math.ceil(buildings.length*.15))))ignite(b,null);}
  if(j.kind==='starfall'&&h%3===0&&buildings.length){const b=pickA(buildings);launchMeteor(b.x+(rnd()-.5)*6,b.z+(rnd()-.5)*6);}
  for(const b of buildings.filter(o=>!o.build&&!o.fire).slice(0,2))if(rnd()<.3&&j.kind!=='pestilence')destroyBuilding(b,{deluge:`The flood swept away the ${b.info?b.info.name:'building'}.`,firestorm:`The ${b.info?b.info.name:'building'} was consumed.`,starfall:`The ${b.info?b.info.name:'building'} was crushed.`}[j.kind]);
  const n=Math.max(1,Math.ceil(live.length*(j.kind==='pestilence'?.16:.14)));for(let i=0;i<n&&live.length;i++){const v=live.splice(Math.floor(rnd()*live.length),1)[0];
    if(rnd()<.4)chron(`${fullName(v)} was taken.`);removeVillager(v,'died');}
  if(h>=8&&!G.vill.some(v=>!v.leaving&&!v.arriving)){devReckoning();}
}
// ---------------- the ledger of ages and the reckoning screen
function devLedger(){try{return JSON.parse(localStorage.getItem('hearthmere_ledger')||'[]');}catch(e){return [];}}
function devSaveLedger(L){try{localStorage.setItem('hearthmere_ledger',JSON.stringify(L.slice(-30)));}catch(e){}}
function devReckoning(){const d=G.dev,j=d.judging;if(!j||d.done)return;d.done=true;G.paused=true;
  const e={town:G.town,era:ERAS[G.era].name,peak:d.peak,years:yearN(),atrocities:d.atrocities,sin:Math.round(d.sin),prophet:d.cult?d.cult.name:(d.log.length?'(fallen)':''),doctrine:d.cult?DOCTRINES[d.cult.key].name:'',judgment:JUDG[j.kind].n,justified:j.justified,remnant:d.remnant,when:Date.now()};
  const L=devLedger();L.push(e);devSaveLedger(L);devShowReckoning(e,L);}
function devShowReckoning(e,L){const el=$('reckon');if(!el)return;
  const verdict=e.justified?'Their sins were many. The judgment was just.':'Their sins did not yet outweigh their goodness. The Spirit may regret this.';
  el.innerHTML=`<div class="rcard glass"><h2>THE RECKONING</h2><div class="sub">${esc(e.town)} · an age of ${esc(e.era)}</div>
    <div class="rrow"><span>Lasted</span><b>${e.years} year${e.years===1?'':'s'}</b></div><div class="rrow"><span>Greatest number of souls</span><b>${e.peak}</b></div>
    <div class="rrow"><span>Atrocities committed</span><b>${e.atrocities}</b></div>${e.doctrine?`<div class="rrow"><span>False creed</span><b>${esc(e.doctrine)}</b></div>`:''}
    <div class="rrow"><span>Judgment</span><b>${esc(e.judgment)}</b></div><div class="rrow"><span>The faithful who escaped</span><b>${e.remnant}</b></div>
    <p class="verdict">${verdict}</p>
    ${L.length>1?`<div class="rages"><i>Ages before this one</i>${L.slice(0,-1).slice(-5).reverse().map(a=>`<div>${esc(a.town)} — ${esc(a.era)}, ${a.years}y · ${esc(a.judgment)}</div>`).join('')}</div>`:''}
    <div style="text-align:center;margin-top:14px"><button class="primary" id="rkNext">Begin the next age</button></div></div>`;
  el.classList.remove('hidden');$('rkNext').onclick=()=>{el.classList.add('hidden');for(const id of ['gtop','prayers'])$(id)&&$(id).classList.add('hidden');showSetup();};}
function devApplyMeta(){const L=devLedger();if(!L.length)return;const rem=L.slice(-5).reduce((a,x)=>a+(x.remnant||0),0);const bonus=Math.min(120,L.length*10+rem*6);G.faith=Math.min(faithCap(),G.faith+bonus);G.dev.legacy=bonus;}
// ---------------- panel (shown with the prayers)
const _devBar=(v,c)=>`<span class="bar" style="width:84px"><i style="width:${_devPct(v)}%;${c?`background:${c}`:''}"></i></span>`;
function devPanelHTML(){const d=devEnsure();let h='<h3 style="margin-top:12px">Hearts of the folk</h3>';
  h+=`<div class="pr none" style="font-style:normal;margin-bottom:4px"><div style="display:flex;justify-content:space-between;align-items:center">Piety ${_devBar(d.piety,'linear-gradient(90deg,#8a6a3a,#d8a23a)')}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px">Doubt ${_devBar(d.doubt,'linear-gradient(90deg,#8a8a8a,#8e2f1f)')}</div></div>`;
  const c=d.causes||{},names={hunger:'hunger',fear:'fear',sick:'sickness',prayers:'unanswered prayers',homeless:'no homes',pride:'pride',greed:'smoke and greed',machine:'idolatry of machines'};
  const top=Object.entries(c).filter(([,v])=>v>.15).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>names[k]);
  h+=`<div class="small" style="margin:2px 0 6px;color:var(--ink2);font-style:italic">${top.length?'Troubling them: '+top.join(', ')+'.':'The folk are at peace.'}</div>`;
  if(d.legacy)h+=`<div class="small" style="color:#3f5f2a">The memory of earlier ages lends you ${d.legacy} Faith.</div>`;
  if(d.cult){const D=DOCTRINES[d.cult.key];h+=`<div class="pr urgent"><b>${esc(d.cult.name)}</b><em>${esc(D.name)} — ${devFollowers()} followers</em>${_devBar(d.cult.strength*100,'linear-gradient(90deg,#b0452a,#5a1810)')}<em>${esc(D.blurb)}</em></div>`;}
  if(d.seer>0)h+=`<div class="small" style="color:#3f5f2a">A true prophet is calming the people (${d.seer} days).</div>`;
  if(d.judging)h+='<div class="pr urgent">The Spirit\'s judgment is upon the valley.</div>';
  else if(d.sin>0||d.cult){h+=`<div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center">Wrath ${_devBar(d.sin,'linear-gradient(90deg,#d8a23a,#8e2f1f)')}</div>`;
    if(d.menu)h+=`<div class="small" style="margin:6px 0">Choose how to cleanse them. Only the faithful can flee.</div><div class="acts" style="display:flex;gap:5px;flex-wrap:wrap">${Object.entries(JUDG).map(([k,j])=>`<button data-judge="${k}" title="${esc(j.d)}">${j.n}</button>`).join('')}<button data-judge="no">Spare them</button></div>`;
    else h+=`<button id="devJudgeB" style="margin-top:6px" title="${devJustified()?'Their sins are great.':'Their sins may not yet justify it.'}">Pass judgment</button>`;}
  return h;}
function devBind(){const b=$('devJudgeB');if(b)b.onclick=()=>{G.dev.menu=true;updateUI(true);};
  for(const x of document.querySelectorAll('#prayers [data-judge]'))x.onclick=()=>{const k=x.dataset.judge;if(k==='no'){G.dev.menu=false;updateUI(true);}else devJudge(k);};}
