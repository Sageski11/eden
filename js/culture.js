'use strict';
// ================================================================ culture: the story of each people, and the ways they come to live
// The story feed (N), the person page, legends that drift in the retelling, the Chronicle in the folk's own voice, place names,
// customs and festivals that grow out of each people's way of life, heroes and villains with memorials, and the cameras (chase,
// street-level "walk with them" on V, photo mode polish).  Everything here is event-driven: it listens to the story bus (STORY.on),
// to chron() lines, and to the cultureDaily()/cultureHourly() hooks; nothing scans folk per frame.
// Per-settlement state lives in G.cu = {ident, legends, places, customs, heroes, ages, ...} (in PERKEYS / SAVE_PER).
{
const $q=id=>document.getElementById(id);
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const hexs=c=>'#'+(c>>>0).toString(16).padStart(6,'0');
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;const tcase=s=>String(s).replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase());
const ord=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
const vById=id=>id?(G.vill.find(v=>v.id===id)||null):null;
const vAny=id=>id?(allVill().find(v=>v.id===id)||null):null;
const tierOf=()=>(G.era||0)<2?0:G.era<5?1:G.era<6?2:3;
const she=v=>v&&v.female?'she':'he',her=v=>v&&v.female?'her':'his',herO=v=>v&&v.female?'her':'him';
const adultsNow=()=>G.vill.filter(v=>v.age>=16&&!v.leaving&&!v.arriving);
const skeptic=()=>{const d=G.dev;return !!d&&(d.piety<42||d.doubt>48||!!(d.cult&&d.cult.strength>.35));};
let IN=0;const say=(kind,o)=>{IN++;try{return storyEvent(kind,o);}finally{IN--;}};
let UNSEEN=0,FEED_OPEN=false,FILTER='all',TAB='days',NOTES=[];

// ---------------------------------------------------------------- identity: banner colours and the style of names
const PAIRS=[[0x8e2f1f,0xd4a73c,'crimson and gold'],[0x2f4a8e,0xe8e2d2,'blue and white'],[0x2f6b3a,0xd4a73c,'green and gold'],[0x6b2f6b,0xe8e2d2,'violet and white'],
  [0x1f6b7a,0xe0b050,'teal and amber'],[0x3a3a40,0xc0392b,'black and red'],[0xb86a1e,0x2f4a8e,'ochre and blue'],[0x6a7a2a,0xe8e2d2,'olive and cream']];
function cuIdent(){const c=cuEnsure();if(c.ident&&c.ident.i!=null)return c.ident;
  const used=new Set(),styles=new Set();TOWNS.list.forEach((s,i)=>{if(i===TOWNS.cur)return;const o=sGet(i,'cu');if(o&&o.ident){used.add(o.ident.i);styles.add(o.ident.st);}});
  let i=(hash(G.town||'')+TOWNS.cur*3)%PAIRS.length;for(let k=0;k<PAIRS.length&&used.has(i);k++)i=(i+1)%PAIRS.length;
  let st=(hash((G.town||'')+'s'))%2;if(styles.has(st))st=1-st;
  return c.ident={i,st,c1:PAIRS[i][0],c2:PAIRS[i][1],nm:PAIRS[i][2]};}
function cuEnsure(){let c=G.cu;if(!c)c=G.cu={};
  if(!c.legends)c.legends=[];if(!c.places)c.places=[];if(!c.customs)c.customs={};if(!c.heroes)c.heroes=[];if(!c.ages)c.ages=[];if(c.nid==null)c.nid=1;
  if(c.era==null)c.era=G.era||0;if(!c.mark)c.mark={pop:0,births:G.births||0,deaths:G.deaths||0,raids:G.raids||0,leg:0,hero:0,day:dayN(),first:true};
  return c;}
globalThis.cuEnsure=cuEnsure;globalThis.cuIdent=cuIdent;

// ---------------------------------------------------------------- legends: miracles retold over the generations, with drift
const ERA_LAMP=['firelight','torchlight','candlelight','lantern-light','gaslight','lamplight','neon','the hum of the grid'];
const ERA_CLOSE=['They tell it round the fire.','They sing it at the well and the forge.','They tell it at market and at the chapel door.','They tell it at the guild table, and the children know it by heart.',
  'They read it from the old broadsheets, and each printing is a little grander.','It is printed in the almanacs and recited at school.','It is told on the wireless and the street corner, a little louder each year.','It is passed along the net and edited each time.'];
const LEG={
fire:[['The Day the Spirit Stopped the Fire','The {subj} was burning, and the Spirit laid a hand on the flames, and they went out. {wit} was there and saw it.'],
 ['The Night the Sky Wept','They say the {subj} burned until the sky wept, and the tears put out the fire. Some add that it had not rained for a month.'],
 ['The Weeping Sky','The old ones tell it that the fire climbed higher than any roof in {town}, and the whole sky wept to quench it, and nothing burned that day that was not ash already.'],
 ['The Spirit’s Tears','In the oldest telling a fire fell on {town}, and the Spirit wept over it, and where the tears fell no hearth has burned unwatched since.']],
rain:[['The Day the Rain Came','The ponds were low and the fields cracked, and the Spirit sent rain over {town}. {wit} stood in the road with face upturned.'],
 ['The Rain That Was Asked For','They say the whole village stood in the road and asked, and the clouds came over the hill before the asking was done.'],
 ['The Thirst and the Sky','In the telling now the dry summer lasted a hundred days, and the first drop fell on a child’s tongue, and it tasted of the sea.'],
 ['When the Hills Drank','The old songs say the hills themselves drank first, and gave the water back to the valley in a thousand springs.']],
sun:[['The Day the Clouds Parted','When the sky was heaviest, the Spirit parted the clouds over {town}, and the sun came down like a hand. {wit} wept for no reason at all.'],
 ['The Golden Day','They say the clouds broke on a golden day and no one worked, and no one was asked to.'],
 ['The Day the Sun Knelt','Now it is told that the sun itself bent low over {town} that day, to see its people.'],
 ['The Gold That Fell','The old tale says gold fell from the sky that day, and was gathered as light, and is spent still as warmth.']],
heal:[['The Day the Fever Left','The sickness lay on {town} and the Spirit lifted it, and the sick rose from their beds. {wit} was carrying water that day.'],
 ['The Rising','They say the sick rose all at once, as if from one long sleep, and asked what had become of the morning.'],
 ['The Hand on the Brow','The old women say a hand rested on every brow in {town} that night, a warm and unseen hand.'],
 ['The Gentle Night','The oldest telling holds that the fever left on the night wind, and the name of the Spirit was the first word spoken.']],
meteor:[['The Night the Star Fell','A star fell from the sky near {town} and the ground shook. {wit} went to look in the morning and found the earth glassy and warm.'],
 ['The Star in the Field','They say the star fell where the field was widest, and rang for a day, and that stone from it will not rust.'],
 ['The Fallen Star','In the telling now the star was an eye, and it closed as it struck.'],
 ['The Eye of the Sky','Old songs call it the eye the sky lost, and say it weeps in the dark of the moon.']],
bless:[['The Golden Fields','The Spirit blessed the fields of {town}, and the crops grew tall and golden. {wit} said the wheat stood to the shoulder.'],
 ['The Shoulder-High Wheat','They say the wheat that year stood higher than a man, and bread from it kept three winters.'],
 ['The Bread That Did Not End','In the old tale one loaf fed the whole village from first frost to thaw.'],
 ['The Gold Under the Plough','The oldest story says the earth was gold that year, and was ploughed under, and became bread.']],
rainbow:[['The Rainbow over {town}','A great rainbow arched over {town} after the rain, and the folk took it as a blessing. {wit} counted the colours aloud.'],
 ['The Bridge','They say the rainbow was a bridge, and the Spirit crossed it to look at {town}.'],
 ['The Seven Colours','Children sing of seven colours that fell on the roofs of {town} and cannot be washed off.'],
 ['The Paint of the Sky','The oldest song says the Spirit painted the sky for a feast and left the brush in the hills.']],
storm:[['The Storm the Spirit Called','The Spirit called a storm over {town}; the sky went black and the thunder shook every cup. {wit} counted the flashes until counting failed.'],
 ['The Night of Thunder','They say the thunder spoke that night, and what it said was a name.'],
 ['The Anger of the Hills','Old people say the hills themselves growled that night, and the thunder was their voice.'],
 ['The Great Roaring','In the oldest tale the sky and the ground argued for a night, and the sky won.']],
hill:[['The Hill the Spirit Raised','The Spirit raised a great hill near {town}, and the earth groaned for a day. {wit} watched it rise.'],
 ['The Hill That Grew','They say the hill grew all one night, and in the morning there were stars on it.'],
 ['The Spirit’s Shoulder','Children are told the hill is the Spirit’s shoulder, and the valley rests against it.'],
 ['The First Mountain','In the oldest telling there was no hill here at all until the Spirit lay down.']],
spring:[['The Spring the Spirit Opened','The Spirit opened a spring near {town}, and clear water ran where there had been dust. {wit} was the first to drink.'],
 ['The Water That Was Asked For','They say the spring began under the feet of a child who had just said she was thirsty.'],
 ['The Never-Dry Spring','Now they say this spring has never run dry, in any year, in any drought, and never will.'],
 ['The Spirit’s Cup','The old song calls the spring the Spirit’s cup, left upturned for the thirsty.']],
wrath:[['The Day the Lightning Fell','The Spirit’s lightning struck down {subj}, and the folk of {town} were afraid. {wit} will not speak of it.'],
 ['The Warning','They say the lightning fell as a warning, and every child in {town} knows what it warned of.'],
 ['The Long Thunder','The old songs say the thunder that day lasted a year in the hearing.'],
 ['The Fear','In the oldest tellings the Spirit is kind, and the kindness is described with a great deal of care.']]};
const SKN={fire:['the Fire at the {subj}','a fire went out of its own accord in {town}'],rain:['the Rain After the Dry Summer','rain came after a dry summer'],sun:['the Fine Day','the clouds parted over {town}'],
  heal:['the Fever That Broke','a fever lifted from {town}'],meteor:['the Falling Star','a star fell near {town}'],bless:['the Good Harvest','the fields did well in {town}'],rainbow:['the Rainbow','a rainbow arched over {town}'],
  storm:['the Great Storm','a storm broke over {town}'],hill:['the New Hill','a hill rose near {town}'],spring:['the New Spring','a spring opened near {town}'],wrath:['the Lightning','lightning struck {subj} down']};
const MIRACLE_LINE={fire:'{wit} saw the fire at the {subj} die under an unseen hand.',rain:'{wit} turned a face up to the first rain, and the folk of {town} wept into it.',sun:'{wit} stood in the sudden sunlight and could not speak.',
  heal:'{wit} was there when the fever left, and the sick sat up and asked for bread.',meteor:'{wit} saw a star come down over {town}.',bless:'{wit} walked the blessed fields and said the wheat stood to the shoulder.',
  rainbow:'{wit} called the folk out to see the rainbow.',storm:'{wit} watched the storm come down the valley like a wall.',hill:'{wit} watched the ground rise in the dusk.',spring:'{wit} knelt at the new spring and drank.',
  wrath:'{wit} saw the lightning fall and did not sleep that night.'};
const SKLINE={fire:'A fire at the {subj} went out, and {wit} will not be told it was the wind.',rain:'The rain came at last, and {wit} says it was sent.',sun:'The sun broke through, and {wit} says it was no accident.',heal:'The fever lifted from {town}; {wit} thanks the Spirit, the healers thank the herbs.',
  meteor:'A star fell near {town}; some say a sign, some say a stone.',bless:'The fields did unusually well, and {wit} says they were blessed. The farmers say tended.',rainbow:'A rainbow arched over {town}; {wit} took it kindly.',storm:'A great storm broke over {town}.',hill:'A hill rose near {town}, whatever the cause.',spring:'A spring opened near {town}.',wrath:'Lightning struck down {subj}.'};
function fillT(s,L){return s.replace(/\{subj\}/g,L.subj||'house').replace(/\{town\}/g,G.town||'the valley').replace(/\{wit\}/g,L.witn||'an old neighbour').replace(/\{yrs\}/g,Math.max(0,yearN()-(L.yr0||0)));}
function legendCompose(L){const k=L.kind,st=Math.min(L.stage,3);
  if(L.sk){const sn=SKN[k]||['the Strange Day','something happened'],tn=fillT(sn[0],L).replace(/^the\s+/i,''),w=fillT(sn[1],L);
    const s2=Math.min(st,2);
    if(s2===0){L.title='The '+tn;L.txt=cap(w)+'. '+fillT('{wit} says the Spirit had a hand in it. The neighbours say it was coming anyway.',L);}
    else if(s2===1){L.title='The Strange '+tn;L.txt=fillT('Folk in {town} tell it carefully now: it happened, it was strange, and they will not argue about why.',L);}
    else{L.title='The '+tn+' Nobody Explains';L.txt=fillT('It has become the sort of story told for the telling, with the believing left to the listener.',L);}}
  else{const e=(LEG[k]||LEG.sun)[st];L.title=fillT(e[0],L);L.txt=fillT(e[1],L);}
  if(st>=2)L.txt+=' '+ERA_CLOSE[Math.min(G.era||0,7)];}
function legendEra(L){return ERA_LAMP[Math.min(G.era||0,7)];}
function newLegend(kind,subj,extra){const c=cuEnsure();const day=dayN();
  if(c.legends.some(L=>L.kind===kind&&day-L.day0<(kind==='fire'?2:6)))return null;
  const ad=adultsNow(),wit=ad.length?pickA(ad):null;
  const L=Object.assign({id:c.nid++,kind,subj:subj||'',day0:day,yr0:yearN(),era:G.era||0,wit:wit?wit.id:0,witn:wit?fullName(wit):'',stage:0,last:day,told:0,n:0,sk:skeptic()?1:0,title:'',txt:''},extra||{});
  legendCompose(L);c.legends.unshift(L);if(c.legends.length>14)c.legends.length=14;
  const ml=(L.sk?SKLINE[kind]:MIRACLE_LINE[kind])||'Something happened that the folk will talk about.';
  say('miracle',{who:wit?[wit.id]:[],txt:fillT(ml,L),big:kind==='sun'&&(G.era||0)===0||kind==='meteor'||kind==='fire',legend:L.id});
  return L;}
function legendDaily(){const c=cuEnsure(),day=dayN();
  for(const L of c.legends){
    if(!L.told&&day-L.day0>=3){L.told=1;L.n=1;say('legend',{who:L.wit?[L.wit]:[],txt:L.sk?`In ${G.town} they are already telling of “${L.title}”, with a shrug.`:`Already the folk of ${G.town} are telling of “${L.title}”.`,legend:L.id});}
    else if(L.told&&L.stage<3&&day-L.last>=38&&rnd()<.55){const old=L.title;L.last=day;L.n++;L.stage++;L.sk=skeptic()?1:0;legendCompose(L);
      say('legend',{who:L.wit?[L.wit]:[],txt:`The tale of “${old}” has grown in the telling. They call it “${L.title}” now. ${ERA_CLOSE[Math.min(G.era||0,7)]}`,legend:L.id});}
    else if(L.told&&day-L.last>=38&&L.stage>=3){L.last=day;L.sk=skeptic()?1:0;}}}
function legendQuote(L){const e=Math.min(G.era||0,7);return pickA([`Have I told you “${L.title}”?`,`My grandmother told “${L.title}”, and she was not a liar.`,`“${L.title}” — I heard it by ${legendEra(L)}.`,`They say “${L.title}” is true. I say it is old, which is better.`]);}

// ---------------------------------------------------------------- places: the folk name their world as they use it
const ADJ=['Clear','Quick','Slow','Cold','Brown','Silver','Hollow','Green','Willow','Reed','Still','Broad'];
const FALL=['was where the washing was done','runs clear after rain','froze first each winter','was where the children learned to swim','was where the first game was got','was where the grey herons stand'];
function famNear(x,z){const m=new Map();for(const v of G.vill){if(v.hidden||v.age<14)continue;const d=Math.hypot(v.x-x,v.z-z);if(d<40)m.set(v.fam,(m.get(v.fam)||0)+1/(1+d*.05));}
  let b=null,s=0;for(const [f,n] of m)if(n>s){s=n;b=f;}return b||pickA(G.vill.length?G.vill.map(v=>v.fam):['Ashby']);}
const placeR={hearth:9,river:14,lake:14,ford:7,hill:16,quarry:12,wood:14,fields:12,mill:8,landing:8,church:8,market:9,well:6,memorial:5,crater:10,spring:6,fire:8,stand:8};
function addPlace(k,x,z,name,why,o){const c=cuEnsure();o=o||{};if(c.places.some(p=>p.name===name||(!o.multi&&p.k===k)))return null;
  const p={id:c.nid++,k,x:+x.toFixed(1),z:+z.toFixed(1),name,why,day:dayN(),yr:yearN(),r:placeR[k]||9,tn:G.town};c.places.push(p);
  say('naming',{who:o.who||[],txt:why,place:p.id,chron:true});return p;}
function cuPlaceNear(x,z,maxd){let best=null,bd=maxd||1e9;TOWNS.list.forEach((s,i)=>{if(s.dead)return;const cu=sGet(i,'cu');if(!cu||!cu.places)return;for(const p of cu.places){const d=Math.hypot(p.x-x,p.z-z);if(d<Math.max(p.r,maxd||0)&&d<bd){bd=d;best=p;}}});return best;}
globalThis.cuPlaceNear=cuPlaceNear;
function scanLand(){const c0=G.center;if(!c0)return null;const R=54,S=4,n=Math.floor(R*2/S)+1,N2=n*n,grid=new Uint8Array(N2),lab=new Int16Array(N2);let hb=null;
  const h0=hAt(c0.x,c0.z);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=c0.x-R+i*S,z=c0.z-R+j*S;if(Math.abs(x)>HALF-3||Math.abs(z)>HALF-3)continue;const d=Math.hypot(x-c0.x,z-c0.z);if(d>R)continue;
    if(wAt(x,z)>.12)grid[j*n+i]=1;else if(d>14){const h=hAt(x,z);if(h-h0>4&&(!hb||h>hb.h)&&slopeAt(x,z)<1.4)hb={x,z,h};}}
  const comps=[];let L=0;
  for(let s=0;s<N2;s++){if(!grid[s]||lab[s])continue;L++;const st=[s];lab[s]=L;let cnt=0,mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9,nr=null,nd=1e9;
    while(st.length){const q=st.pop(),qi=q%n,qj=(q-qi)/n;const x=c0.x-R+qi*S,z=c0.z-R+qj*S;cnt++;mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);mnz=Math.min(mnz,z);mxz=Math.max(mxz,z);const dd=Math.hypot(x-c0.x,z-c0.z);if(dd<nd){nd=dd;nr={x,z};}
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=qi+di,nj=qj+dj;if(ni<0||nj<0||ni>=n||nj>=n)continue;const k=nj*n+ni;if(grid[k]&&!lab[k]){lab[k]=L;st.push(k);}}}
    const w=mxx-mnx+S,d=mxz-mnz+S;comps.push({n:cnt,x:nr.x,z:nr.z,d:nd,long:Math.max(w,d)/Math.max(1,Math.min(w,d)),span:Math.max(w,d)});}
  comps.sort((a,b)=>a.d-b.d);
  let ford=null;for(let j=0;j<n&&!ford;j++)for(let i=0;i<n;i++){if(!grid[j*n+i])continue;const x=c0.x-R+i*S,z=c0.z-R+j*S;
    for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){const rx=x+dx*.5,rz=z+dz*.5;if(sampleArr(ROAD,rx,rz)>.3&&wAt(rx,rz)<.4){ford={x:rx,z:rz};break;}}if(ford)break;}
  return {comps,hill:hb&&hb.h-h0>=5?hb:null,ford};}
function placesDaily(){const c=cuEnsure(),has=k=>c.places.some(p=>p.k===k),S=cuIdent().st,t=G.town;if(!G.center)return;const day=dayN();
  const fam=()=>famNear(G.center.x,G.center.z);
  if(!has('hearth')){const p=addPlace('hearth',G.center.x,G.center.z,S?'The Founding Hearth':'The Founding Hearth',`The first fire of ${t} burned here, and the folk came to call the place the Founding Hearth.`);if(p)p.r=10;}
  const q=built('quarry')[0];if(q&&!has('quarry')){const nm=S?pickA(['Grey Scar','Hardscar','Cutstone Scar']):pickA(['Stonebreak Hill','Greyface','Cutstone Hill']);
    addPlace('quarry',q.x,q.z,nm,`So many went up to cut stone that the place wanted a name, and the quarrymen settled on ${nm}.`);}
  const lc=built('camp').find(b=>b.variant!=='fish');if(lc&&!has('wood')){const f=famNear(lc.x,lc.z),nm=S?`${f} Holt`:pickA([`${f}’s Wood`,'Hewers’ Wood','the Hewing']);
    addPlace('wood',lc.x,lc.z,nm,`The woodcutters worked their way into the trees until the clearing needed a name. They called it ${nm}.`);}
  const fm=built('farm')[0];if(fm&&!has('fields')){const f=famNear(fm.x,fm.z),nm=S?pickA(['the Long Rigg','the Home Rigg']):pickA(['Long Acre',`${f}’s Acre`,'the Home Fields']);
    addPlace('fields',fm.x,fm.z,nm,`The first ploughed ground is spoken of as ${nm}, and children are told to run there when they are late.`);}
  const ml=built('mill')[0];if(ml&&!has('mill')){const nm=wAt(ml.x+3,ml.z)>.02||nearWater(ml.x,ml.z,12)<12?'Mill Race':'Millers’ Rise';addPlace('mill',ml.x,ml.z,nm,`The sound of the mill gave its ground a name: ${nm}.`);}
  const dk=built('dock')[0]||built('fishmkt')[0];if(dk&&!has('landing')){const f=famNear(dk.x,dk.z),nm=S?`${f}’s Staithe`:pickA([`${f}’s Landing`,'Fishers’ Landing']);addPlace('landing',dk.x,dk.z,nm,`Boats were pulled up here so often that the landing took the name ${nm}.`);}
  const ch=built('church')[0];if(ch&&!has('church')){const nm=(G.era||0)>=3?'Chapel Green':'Spirit’s Rest';addPlace('church',ch.x,ch.z,nm,`The ground about the ${ch.info?ch.info.name.toLowerCase():'chapel'} is called ${nm}.`);}
  const mk=built('market')[0];if(mk&&!has('market')){const nm=(G.era||0)>=5?'Market Square':'Market Cross';addPlace('market',mk.x,mk.z,nm,`Where the market stands, folk now say “down at ${nm}”.`);}
  const wl=built('well')[0];if(wl&&!has('well')){addPlace('well',wl.x,wl.z,'the Old Well','They call the first well the Old Well, though it is not so very old yet.');}
  if(day%3!==0)return;
  const need=!has('river')||!has('lake')||!has('hill')||!has('ford');if(!need&&day%30!==0)return;
  const sc=scanLand();if(!sc)return;
  for(const w of sc.comps){const isR=w.long>2.6&&w.span>24;const k=isR?'river':'lake';if(has(k))continue;if(w.n<(isR?6:3))continue;
    if(isR){const f=fam(),ad=pickA(ADJ),nm=S?`the ${ad} Beck`:pickA([`the ${ad} Water`,`${f} Brook`]);addPlace('river',w.x,w.z,nm,`The long water ${dirWord(w.x,w.z)} of the hearth is called ${nm}, because it ${pickA(FALL)}.`);}
    else{const ad=pickA(ADJ),nm=S?`${ad} Tarn`:`${ad} Mere`;addPlace('lake',w.x,w.z,nm,`The still water ${dirWord(w.x,w.z)} of the hearth is called ${nm}.`);}}
  if(sc.hill&&!has('hill')){const near=built('quarry').some(b=>Math.hypot(b.x-sc.hill.x,b.z-sc.hill.z)<26),f=famNear(sc.hill.x,sc.hill.z);
    const nm=near?(S?'Stonebreak Fell':'Stonebreak Hill'):(S?`${f} Fell`:pickA([`${f}’s Rise`,'Beacon Hill','Windy Knoll']));addPlace('hill',sc.hill.x,sc.hill.z,nm,`The high ground ${dirWord(sc.hill.x,sc.hill.z)} of ${t} is called ${nm}${near?', for the stone cut from it':', for it is where the folk go to see the weather coming'}.`);}
  if(sc.ford&&!has('ford')&&sc.comps.length){const f=fam(),nm=S?`${f}’s Crossing`:`${f}’s Ford`;addPlace('ford',sc.ford.x,sc.ford.z,nm,`Where the track crosses the water, folk say “${nm}”, after the ${f}s who cross it most.`);}}

// ---------------------------------------------------------------- heroes and villains, and the monuments that honour them
const MONNAME=['cairn','standing stone','stele','cross','obelisk','statue','sculpture','light-pillar'];
const hGrp=new THREE.Group();scene.add(hGrp);const monMesh=new Map();
const monKey=h=>h.tn+'#'+h.id+'@'+h.x+','+h.z;
function addHero(kind,vid,name,txt,o){const c=cuEnsure();o=o||{};if(c.heroes.length>=9)return null;if(vid&&c.heroes.some(h=>h.who===vid&&h.kind===kind))return null;
  if(!vid&&c.heroes.some(h=>h.kind===kind))return null;
  const h={id:c.nid++,kind,who:vid||0,name,txt,fallen:!!o.fallen,day:dayN(),yr:yearN(),era:G.era||0,at:dayN()+2,x:null,z:null,tn:G.town,sx:o.x==null?null:o.x,sz:o.z==null?null:o.z};
  c.heroes.push(h);say('hero',{who:vid?[vid]:[],txt,big:true,chron:true,hero:h.id});return h;}
function monSpot(ref){const C=G.center;if(!C)return null;const ch=built('church')[0],base=ref&&ref.sx!=null?{x:ref.sx,z:ref.sz}:(ch||C);const c=cuEnsure();
  for(let t=0;t<90;t++){const a=rnd()*TAU,r=(t<30?6:t<60?9:13)+rnd()*5,x=base.x+Math.cos(a)*r,z=base.z+Math.sin(a)*r;
    if(Math.abs(x)>HALF-8||Math.abs(z)>HALF-8||wAt(x,z)>.03||slopeAt(x,z)>.45||sampleArr(ROAD,x,z)>.5)continue;
    if(buildings.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+2.6))continue;if(c.heroes.some(h=>h.x!=null&&Math.hypot(h.x-x,h.z-z)<5))continue;return [x,z];}
  return null;}
function heroesDaily(){const c=cuEnsure(),day=dayN();
  for(const h of c.heroes){
    if(h.x==null&&day>=h.at){const s=monSpot(h);if(s){h.x=+s[0].toFixed(1);h.z=+s[1].toFixed(1);const mn=MONNAME[Math.min(G.era||0,7)];
      const nm=h.kind==='founder'?`Founders’ ${tcase(mn)}`:`${h.name.split(' ').slice(-1)[0]}’s ${tcase(mn)}`;
      const p=addPlace('memorial',h.x,h.z,nm,h.kind==='founder'?`By the plaza the folk raised a ${mn} to the founders, and it is called ${nm}.`:`The folk raised a ${mn} for ${h.name}${h.fallen?', who fell for '+G.town:''}, and the place is called ${nm}.`,{multi:true,who:h.who?[h.who]:[]});
      if(p)p.r=7;say('memorial',{who:h.who?[h.who]:[],txt:`A ${mn} now stands by the plaza of ${G.town} for ${h.name}. Flowers are left there.`,big:false,hero:h.id});}else h.at=day+3;}
    else if(h.x!=null&&day%7===0&&buildings.some(b=>Math.hypot(b.x-h.x,b.z-h.z)<b.r+1.3)){const s=monSpot(h);if(s){h.x=+s[0].toFixed(1);h.z=+s[1].toFixed(1);}}}
  if(!c.founders&&G.vill.length&&day<6){c.founders=G.vill.slice(0,5).map(v=>v.id);c.founderFams=[...new Set(G.vill.slice(0,5).map(v=>v.fam))];c.foundS=seasonN();c.foundD=dayInSeason();c.foundDay=day;}
  if(c.founders&&(G.era||0)>=1&&!c.heroes.some(h=>h.kind==='founder')&&G.center){const f=c.founderFams||[];
    addHero('founder',0,'the founders',`The founding families, the ${f.slice(0,2).join('s and the ')}s, who first lit the hearth of ${G.town}, are honoured now with a monument by the plaza.`);}
  const cu=G.dev&&G.dev.cult;if(cu&&cu.pid!==c.cultPid){c.cultPid=cu.pid;villainStart(cu);}else if(!cu&&c.cultPid){const nm=c.cultName||'The prophet';c.cultPid=0;villainEnd(nm,false);}}
function villainStart(cu){const c=cuEnsure(),D=DOCTRINES[cu.key],v=vById(cu.pid);c.cultName=cu.name;if(!D)return;
  const cause={abundance:'hunger',sword:'fear',purity:'sickness',mammon:'greed',machine:'comfort',self:'pride'}[cu.key]||'trouble';
  say('villain',{who:v?[v.id]:[],txt:`${cu.name} was not born a villain. ${cap(cause)} had worked on ${herO(v)||'them'} until ${she(v)||'they'} preached “${D.name}”, and many listened. The folk of ${G.town} will argue for a long time about how much of it was their own doing.`,big:true,prophet:1});}
function villainEnd(name,struck){say('villain',{who:[],txt:struck?`${name} is gone, and the folk of ${G.town} speak of the false prophet with sorrow more than hatred. Many had followed, and had reasons.`:`${name}'s following has dwindled. In ${G.town} they speak of it with sorrow, and a little shame.`});}

// monument geometry, one design for each age
function drawMon(h,id){const g=hAt(h.x,h.z),B=new Builder(rnd,.025),F=new Builder(rnd,0),e=Math.min(h.era||0,7);
  const ST=0x9d968a,SD=0x6e685e,SL=0xb9b2a4,BR=0x7a5a2c,BZ=0x6a5a34,PT=0x4f7a68,W=0xe8e2d2;const r=rnd;
  const step=(w,hh,y,col)=>B.box(0,y,0,w,hh,w,col||SD);
  if(e===0){for(let i=0;i<6;i++){const a=r()*TAU,rr=i<1?0:.5+r()*.5;B.sph(Math.cos(a)*rr*.4,g+.18+i*.28,Math.sin(a)*rr*.4,.75-i*.1,.32,.7-i*.1,pickA([ST,SD,SL]),0);}
    B.cyl(0,g+1.1,0,.09,1.9,BR,6);F.box(.18,g+2.2,0,.34,.5,.03,id.c1);}
  else if(e===1){B.box(0,g,0,.75,3.0,.5,ST,.3);B.box(0,g+1.7,.26,.8,.14,.04,id.c1);for(let i=0;i<4;i++){const a=i/4*TAU+.5;B.box(Math.cos(a)*1.7,g,Math.sin(a)*1.7,.45,.9+r()*.5,.4,SD,a);}F.box(0,g+3.0,0,.3,.3,.3,0xffc860);}
  else if(e===2){step(2.0,.3,g);step(1.5,.3,g+.3);B.box(0,g+.6,0,1.0,3.0,.32,ST);B.prism(0,g+3.6,0,1.1,.5,.4,SL,0);for(let i=0;i<4;i++)B.box(0,g+1.1+i*.5,.17,.6,.07,.02,SD);B.box(1.3,g,0,.15,2.2,.15,BR);F.box(1.3,g+1.8,.2,.5,.34,.03,id.c1);}
  else if(e===3){step(2.2,.3,g);step(1.6,.3,g+.3);step(1.1,.3,g+.6);B.box(0,g+.9,0,.36,2.5,.36,ST);B.box(0,g+2.4,0,1.5,.34,.34,ST);B.cyl(0,g+2.3,.0,.5,.12,SL,10);for(const s of [-1,1])B.box(s*1.0,g,1.4,.16,1.1,.16,BR);}
  else if(e===4){step(2.4,.3,g);step(1.9,.3,g+.3);step(1.4,.3,g+.6);B.cone(0,g+.9,0,.72,5.0,SL,4,PI/4);B.cone(0,g+5.6,0,.22,.5,0xd4a73c,4,PI/4);for(const [x,z] of [[1.6,1.6],[-1.6,1.6],[1.6,-1.6],[-1.6,-1.6]]){B.cyl(x,g,z,.07,.9,0x1c1c20,6);B.sph(x,g+.95,z,.1,.1,.1,0x1c1c20,0);}}
  else if(e===5){step(2.6,.34,g);B.box(0,g+.34,0,1.7,1.5,1.7,0x7a7468);B.box(0,g+1.84,0,2.0,.22,2.0,SL);
    const y=g+2.06;B.box(0,y,0,1.0,.12,.8,0x5a5238);B.cyl(-.2,y+.1,0,.16,.9,BZ,8);B.cyl(.2,y+.1,0,.16,.9,BZ,8);B.box(0,y+.95,0,.8,.95,.46,BZ);B.box(0,y+1.6,0,1.0,.22,.5,BZ);B.cone(0,y+1.15,-.34,.5,.2,PT,6);B.wedge(0,y+.2,-.3,.9,1.7,.3,PT,0);
    B.cyl(0,y+1.8,0,.1,.12,BZ,6);B.sph(0,y+2.12,0,.24,.27,.24,BZ,1);B.beam(.42,y+1.7,0,.66,y+2.55,.1,.12,BZ);B.beam(-.42,y+1.7,0,-.5,y+1.1,.25,.12,BZ);B.sph(.68,y+2.62,.1,.1,.1,.1,0xd4a73c,0);
    for(const [x,z] of [[1.5,1.5],[-1.5,1.5],[1.5,-1.5],[-1.5,-1.5]]){B.cyl(x,g,z,.07,1.9,0x1c1c20,6);F.sph(x,g+2.0,z,.22,.22,.22,0xffd890);}}
  else if(e===6){B.cyl(0,g,0,2.0,.3,0x8a8a88,14);B.boxC(-.5,g+.3,0,.55,3.6,1.5,0xb4b4b0,0,0,-.22);B.boxC(.7,g+.3,0,.5,4.2,1.4,0xa4a8ac,0,0,.14);
    const R=1.9,n=18;for(let i=0;i<n;i++){const a=i/n*TAU,a2=(i+1)/n*TAU;B.beam(Math.cos(a)*R*.5,g+2.6+Math.sin(a)*R,Math.sin(a)*0,Math.cos(a2)*R*.5,g+2.6+Math.sin(a2)*R,0,.09,0x6a7078);}
    F.sph(0,g+2.6,0,.2,.2,.2,id.c2>0?0xcfe8ff:0xffffff);}
  else{B.cyl(0,g,0,1.6,.3,0xcfd6dc,16);B.cyl(0,g+.3,0,.5,.5,0x8a96a2,12);F.cyl(0,g+.8,0,.14,4.6,0xbfe8ff,10,1);const n=14;
    for(const [yy,RR] of [[1.8,.9],[2.9,1.1],[3.9,.8]]){for(let i=0;i<n;i++){const a=i/n*TAU,a2=(i+1)/n*TAU;F.beam(Math.cos(a)*RR,g+yy,Math.sin(a)*RR,Math.cos(a2)*RR,g+yy,Math.sin(a2)*RR,.04,0x9fdcff);}}
    for(let i=0;i<6;i++){const a=i/6*TAU;F.box(Math.cos(a)*.6,g+1.2+i*.55,Math.sin(a)*.6,.12,.3,.12,0xffffff,a);}}
  // flowers laid at the foot, a little plaque
  if(e<=5)for(let i=0;i<9;i++){const a=i/9*TAU+.2,rr=1.45+((i%3)*.1);B.sph(Math.cos(a)*rr,g+.1,Math.sin(a)*rr,.1,.08,.1,[id.c1,id.c2,0xe8e2d2,0xd96a8a][i%4],0);}
  B.box(0,g+.02,(e===5?1.95:1.35),.7,.16,.12,0x2c2a28);
  const grp=new THREE.Group();grp.position.set(h.x,0,h.z);grp.add(B.mesh(matB));if(F.p.length)grp.add(F.mesh(matFire,false));return grp;}
// each people's standard: a pole and banner in their colours beside the hearth, so you can tell whose town you are looking at
function drawStd(c,id){const g=hAt(c.std.x,c.std.z),B=new Builder(rnd,.02),F=new Builder(rnd,0),t=tierOf();const pole=t>=2?0x8a909a:0x7a5a2c;
  B.cyl(0,g-.2,0,.16,.4,t>=2?0x6e6a64:0x5e4a30,8);B.cyl(0,g,0,.07,6.2,pole,6);B.sph(0,g+6.3,0,.13,.13,.13,0xd4a73c,0);
  const w=1.5,hh=1.0;B.box(w/2+.05,g+5.0,0,w,hh*.5,.04,id.c1);B.box(w/2+.05,g+4.5,0,w,hh*.5,.04,id.c2);B.wedge(w+.4,g+4.5,0,.5,hh,.04,id.c1,PI/2);
  if(t>=3)F.box(w/2+.05,g+4.48,.03,w,.05,.02,0xbfe8ff);
  const grp=new THREE.Group();grp.position.set(c.std.x,0,c.std.z);grp.rotation.y=c.std.r||0;grp.add(B.mesh(matB));if(F.p.length)grp.add(F.mesh(matFire,false));return grp;}
function syncStd(){const c=cuEnsure(),id=cuIdent();if(!G.center)return;
  if(!c.std){for(let t=0;t<60;t++){const a=rnd()*TAU,r=7+rnd()*5,x=G.center.x+Math.cos(a)*r,z=G.center.z+Math.sin(a)*r;if(wAt(x,z)>.03||slopeAt(x,z)>.4||sampleArr(ROAD,x,z)>.4)continue;
      if(buildings.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+2))continue;c.std={x:+x.toFixed(1),z:+z.toFixed(1),r:rnd()*TAU,t:tierOf()};break;}}
  else{const blocked=buildings.some(b=>Math.hypot(b.x-c.std.x,b.z-c.std.z)<b.r+1);
    if(c.std.t!==tierOf()||blocked){const k0=stdKey(c);if(monMesh.has(k0)){const m=monMesh.get(k0);hGrp.remove(m);m.traverse(o=>{if(o.geometry)o.geometry.dispose();});monMesh.delete(k0);}if(blocked)c.std=null;else c.std.t=tierOf();}}
  if(c.std){const k=stdKey(c);if(!monMesh.has(k)){try{const m=drawStd(c,id);hGrp.add(m);monMesh.set(k,m);}catch(e){console.error('cu std',e);monMesh.set(k,new THREE.Group());}}}}
const stdKey=c=>'std#'+G.town+'@'+c.std.x+','+c.std.z+'/'+c.std.t;
function syncMons(){const c=cuEnsure(),id=cuIdent();syncStd();
  for(const h of c.heroes){if(h.x==null)continue;const k=monKey(h);if(!monMesh.has(k)){try{const m=drawMon(h,id);hGrp.add(m);monMesh.set(k,m);}catch(e){console.error('cu mon',e);monMesh.set(k,new THREE.Group());}}}
  if(SHARED){const live=new Set();TOWNS.list.forEach((s,i)=>{const cu=sGet(i,'cu');if(cu&&cu.heroes)for(const h of cu.heroes)if(h.x!=null){h.tn=h.tn||sName(i);live.add(monKey(h));}});
    TOWNS.list.forEach((s,i)=>{const cu=sGet(i,'cu');if(cu&&cu.std)live.add('std#'+sName(i)+'@'+cu.std.x+','+cu.std.z+'/'+cu.std.t);});
    for(const [k,m] of monMesh)if(!live.has(k)){hGrp.remove(m);m.traverse(o=>{if(o.geometry)o.geometry.dispose();});monMesh.delete(k);}}}
// raid heroes
function raidOver(){const c=cuEnsure();let best=null,bn=0;for(const v of G.vill){if(v._cuHit>bn){bn=v._cuHit;best=v;}if(v._cuHit)v._cuHit=0;}
  if(best&&!best.leaving)addHero('raid',best.id,fullName(best),`${fullName(best)} stood at the front when raiders came to ${G.town}, and ${she(best)} is honoured for it. They say ${she(best)} did not stop until the last of them ran.`,{x:best.x,z:best.z});}

// ---------------------------------------------------------------- customs and festivals
const CT=(a)=>a;
const CUST=[
 {key:'boats',way:'fishers',names:['Blessing of the Rafts','Blessing of the Boats','The Fleet Blessing','Harbour Day'],blurb:['The boats were garlanded and sprinkled with ale.','Ribbons on every prow, and the first catch given to the water.','The fleet was dressed overall for the year.','Bunting along the quay, and a toast at the slip.'],
  s:0,d:4,hrs:8,cols:[0x2f6b9a,0xe8e2d2,0x1f8a9a,0xd4a73c],th:['Fair winds!','May the nets come up full.','The boats look fine in flowers.','A kind year on the water.'],
  cond:c=>c.fish>=2&&(G.boatsBuilt>0||hasBuilt('dock')||hasBuilt('fishmkt')),orig:()=>`The fishers of ${G.town} garlanded their boats and asked the water for a kind year`},
 {key:'hunt',way:'hunters',names:['First-Hunt Rite','Trophy Fires','Huntsmen’s Feast','Game Supper'],blurb:['The youngest carried the first kill home, and fires burned on the hill.','Trophies on the poles and a fire for every kill.','The huntsmen’s table, with the best joint for the youngest.','A long table of game and cider.'],
  s:2,d:1,hrs:8,cols:[0x6a4a2a,0x3f6a3a,0xc9a14a,0xe8e2d2],th:['Bring the antlers to the fire.','The young ones will be proud.','What a haunch of venison!','Tell the tale of the first kill again.'],
  cond:c=>c.hunt>=2&&hasBuilt('lodge'),orig:()=>`The hunters of ${G.town} lit trophy fires on the hill and let the youngest carry the first kill home`},
 {key:'plant',way:'farmers',names:['Planting Day','Planting Day','Sowing Day','Seed Day'],blurb:['The first seed was scattered by the eldest, and the soil asked for kindness.','Bread, ale and a blessing on the first furrow.','The ploughs were dressed in green.','Seeds exchanged in the square, and a toast to the soil.'],
  s:0,d:2,hrs:8,cols:[0x3f8a3a,0xd4a73c,0x7a5a2c,0xe8e2d2],th:['Good soil this year.','Bless the first furrow!','The seed is in the ground.','Rain soon, please.'],
  cond:c=>c.farm>=3,orig:()=>`The farmers of ${G.town} blessed the first furrow of the year, and shared bread on the headland`},
 {key:'guild',way:'masons',names:['Stone-Cutters’ Day','Guild Day','Guild Day','Craft Day'],blurb:['The quarrymen laid down their picks and told the stories of the hill.','Guild banners through the streets, and a new apprentice sworn.','The guilds marched behind their banners.','The trades paraded their tools, and the best work was shown.'],
  s:1,d:3,hrs:8,cols:[0x8a8478,0x8e2f1f,0xd4a73c,0x3a3a40],th:['Long live the guild!','My hands are sore, and glad.','Show them the best work.','An apprentice was sworn today.'],
  cond:c=>c.stone>=3&&(hasBuilt('quarry')||hasBuilt('mason')),orig:()=>`The quarrymen and masons of ${G.town} laid down their tools for a day and told the stories of the hill`},
 {key:'fair',way:'traders',names:['The Gathering','Market Fair','Trade Fair','Exchange Festival'],blurb:['Everything that could be traded was laid out in the square.','Stalls, jugglers and a caravan from afar.','Stalls in rows, and bargains cried from dawn.','Goods from many hands, and half the town in the square.'],
  s:1,d:5,hrs:9,cols:[0xc0392b,0xd4a73c,0x2f6b9a,0x3f8a3a,0x8e3a8e,0xe8e2d2],th:['What a bargain!','Look at the cloth from the far side.','Mind your purse.','The fair! I could spend a year here.'],
  cond:c=>(G.era||0)>=2&&hasBuilt('market')&&c.pop>=20,orig:()=>`The market of ${G.town} spilled over into a fair, with every stall and cart the folk could muster`},
 {key:'light',way:'all',names:['The Long Night Fire','Midwinter Fires','Midwinter Lights','Festival of Light'],blurb:['The longest night, with a great fire kept burning until dawn.','Fires on every hill, and tales told until the sun came.','Lamps in every window against the dark.','The town lit itself, street by street, against the longest night.'],
  s:3,d:3,hrs:9,cols:[0xffc860,0xd4a73c,0xe8e2d2,0xc0392b],th:['Keep the fire alive.','The longest night.','Look at all the lights!','The sun will come back, they say.'],
  cond:c=>c.pop>=10&&G.t>24*DPS*2,orig:()=>`The folk of ${G.town} lit a great fire against the longest night and kept it until the sun came back`},
 {key:'founders',way:'all',names:['Founders’ Day','Founders’ Day','Founders’ Day','Founders’ Day'],blurb:['The folk remembered the first fire and the five who lit it.','The founding families were toasted at the plaza.','The founding families were named aloud, and their children walked at the front.','Founders’ songs, and an old photograph held up.'],
  s:-1,d:-1,hrs:7,cols:[0x8e2f1f,0xd4a73c,0xe8e2d2],th:['Remember the first five.','They came over the hills, you know.','Our founders!','Here is to the first fire.'],
  cond:c=>yearN()>=2&&!!c.founders&&c.pop>=15,orig:()=>`The folk of ${G.town} gathered on the day the first fire was lit and drank to the ones who lit it`},
 {key:'remember',way:'all',names:['The Remembering','Remembrance Day','Remembrance Day','Day of Remembrance'],blurb:['The old stories of those who stood for the town were told again.','Flowers at the monument, and the names read aloud.','Flowers at the monument, and a silence kept.','A silence kept, and the names read aloud.'],
  s:2,d:3,hrs:5,cols:[0xe8e2d2,0x3a3a40,0x8e2f1f],th:['I remember them.','They stood for us.','Lay the flowers gently.','Their names are carved there.'],
  cond:c=>c.heroes.some(h=>h.x!=null),orig:()=>`The folk of ${G.town} gathered at the monument with flowers, and told again the tale of those who stood for them`}];
const ERA_FEAST=['The Feast of Fire','The Feast of the First Wells','The Feast of Iron','The Feast of Charters','The Feast of Spires','The Feast of Steam','The Feast of Light Switches','The Feast of Light'];
const nmOf=(d)=>d.names[tierOf()];
function festColors(d){const id=cuIdent();return [id.c1,id.c2].concat(d.cols||[]).slice(0,7);}
function cuBuntingCols(){const c=G.cu;if(!c)return null;const f=c.fest;if(f&&f.until>G.t&&f.cols)return f.cols;const id=cuIdent();return [id.c1,id.c2,0xe8e2d2,id.c1,0xd4a73c,id.c2];}
globalThis.cuBuntingCols=cuBuntingCols;
function cnts(){const o={fish:0,hunt:0,farm:0,stone:0,pop:0};for(const v of G.vill){if(v.leaving||v.arriving)continue;o.pop++;const j=v.job;if(j==='fisher'||j==='shipwright'||j==='fishmonger')o.fish++;else if(j==='hunter')o.hunt++;else if(j==='farmer')o.farm++;else if(j==='quarry'||j==='mason')o.stone++;}return o;}
function holdCustom(d){const c=cuEnsure(),rec=c.customs[d.key]||(c.customs[d.key]={born:dayN(),yr:yearN(),n:0,last:-1}),nm=nmOf(d),first=rec.n===0;
  c.pend={name:nm,key:d.key,cols:festColors(d),blurb:d.blurb[tierOf()],th:d.th,hrs:d.hrs,devo:1};
  startFestival(d.hrs,'custom');rec.n++;rec.last=yearN();
  const hero=c.heroes.find(h=>h.x!=null);
  if(first)say('custom',{who:[],txt:`${d.orig()}. “${nm}” is born; the folk say it will be kept every year.`,big:true,chron:true,custom:d.key});
  else say('festival',{who:[],txt:`${G.town} kept the ${nm} for the ${ord(rec.n)} time. ${d.blurb[tierOf()]}${hero&&d.key==='remember'?' Flowers were laid for '+hero.name+'.':''}`,custom:d.key});}
function customsHourly(){const c=cuEnsure();if(G.festival>0||(G.raid&&G.raid.active)||G.starve>0||(G.dev&&G.dev.judging))return;const cn=Object.assign(cnts(),{heroes:c.heroes});
  for(const d of CUST){const rec=c.customs[d.key];if(rec&&rec.last===yearN())continue;let s=d.s,dd=d.d;if(d.key==='founders'){s=c.foundS;dd=c.foundD;}if(s==null||s<0)continue;
    if(seasonN()!==s||dayInSeason()<dd)continue;if(s===2&&dd>=DPS)continue;let ok=false;try{ok=d.cond(cn);}catch(e){}if(!ok)continue;holdCustom(d);return;}}
function toppingOut(){const c=cuEnsure(),n=built('church').length;if(c.churches==null){c.churches=n;return;}
  if(n>c.churches){c.churches=n;if(n>=2||(G.era||0)>=2){const rec=c.customs.topping||(c.customs.topping={born:dayN(),yr:yearN(),n:0,last:-1}),nm=['Roof-Raising','Topping-Out','Topping-Out','Topping-Out'][tierOf()];
      c.pend={name:nm,key:'topping',cols:festColors({cols:[0x8a8478,0xe8e2d2,0xd4a73c]}),blurb:'A green bough nailed to the highest beam, and ale for the builders.',th:['A green bough on the roof!','The masons are proud today.','Ale for the builders!'],hrs:6,devo:1.5};
      const first=rec.n===0;startFestival(6,'custom');rec.n++;rec.last=yearN();
      say(first?'custom':'festival',{who:[],txt:first?`When the new ${(built('church')[n-1]||{info:{name:'chapel'}}).info.name.toLowerCase()} was roofed, the masons nailed a green bough to the highest beam and the whole of ${G.town} came to cheer. “${nm}” will be done for every great building after.`:`The masons topped out another great roof in ${G.town}, and the ${nm} was kept.`,big:first,chron:first,custom:'topping'});}}
  else if(n<c.churches)c.churches=n;}
// every festival gets a name, banner colours, and a little mood and devotion
function festivalNote(h,why){const c=cuEnsure();let f=null;
  if(why==='custom'&&c.pend){f=c.pend;c.pend=null;G.joy=Math.min(25,G.joy+3);if(G.dev){G.dev.piety=Math.min(100,(G.dev.piety||0)+1.5*(f.devo||1));G.dev.doubt=Math.max(0,(G.dev.doubt||0)-1);}}
  else if(why==='harvest'){const first=!c.customs.harvest;const rec=c.customs.harvest||(c.customs.harvest={born:dayN(),yr:yearN(),n:0,last:-1});rec.n++;rec.last=yearN();
    const nm=['Harvest-Home','Harvest-Home','Harvest-Home','Harvest Supper'][tierOf()];f={name:nm,cols:festColors({cols:[0xd4a73c,0x7a5a2c,0x3f8a3a]}),blurb:'The last sheaf was carried in, and the first loaf of it was shared.',th:['The last sheaf is in!','What a harvest.','Warm bread and cold ale.'],hrs:12};
    if(first)say('tradition',{who:[],txt:`${G.town} held its first ${nm}: the last sheaf carried in, and the first loaf shared among all. It has become a tradition.`,big:true,chron:true,custom:'harvest'});}
  else if(why==='era'){f={name:ERA_FEAST[Math.min(G.era||0,7)],cols:festColors({cols:[0xd4a73c,0xe8e2d2]}),blurb:`${G.town} celebrated the coming of the ${ERAS[G.era].name}.`,th:['A new age begins!','Look how far we have come.','What will the children see?'],hrs:h};}
  else if(why==='cast'){f={name:'The Spirit’s Festival',cols:festColors({cols:[0xfff3c0,0xd4a73c]}),blurb:'By the Spirit’s blessing, the whole of the town feasted.',th:['The Spirit is kind!','Bless this feast.','Praise the Spirit of the valley!'],hrs:h};}
  if(f){f.until=G.t+h;c.fest=f;}return f;}
// legends and heroes surface in festival talk
function festivalChatter(){const c=cuEnsure(),f=c.fest;if(!f||f.until<=G.t)return;const ad=adultsNow();if(!ad.length)return;let n=0;
  for(let i=0;i<10&&n<3;i++){const v=pickA(ad);if(v._lod>0&&v._lod!=null)continue;let t;const r=rnd();
    if(r<.3&&c.legends.length&&v.age>45)t=legendQuote(pickA(c.legends));else if(r<.5&&c.heroes.length){const h=pickA(c.heroes);t=h.kind==='founder'?'Our founders lit the first fire.':`Remember ${h.name}.`;}else t=pickA(f.th||['What a feast!']);
    setThought(v,t);n++;}}

// ---------------------------------------------------------------- the age summaries
const ERAMEM=['the age of fire and flint','the age of copper and the first wells','the age of iron and the plough','the age of castles and charters','the age of spires and guilds','the age of steam and soot','the age of concrete and wires','the age of light'];
function ageCheck(){const c=cuEnsure(),e=G.era||0;if(c.era==null)c.era=e;
  if(e>c.era){for(let k=c.era;k<e;k++)writeAge(k);c.era=e;}}
function writeAge(k){const c=cuEnsure(),m=c.mark,pop=popN();if(!ERAS[k])return;
  const born=(G.births||0)-(m.births||0),died=(G.deaths||0)-(m.deaths||0),raids=(G.raids||0)-(m.raids||0),leg=c.legends.filter(L=>L.era===k).length,hero=c.heroes.filter(h=>h.era===k);
  const yrs=Math.max(1,Math.round((dayN()-m.day)/(DPS*4)));
  let t=`The ${ERAS[k].name} ended for ${G.town} in ${dateStr()}. The folk remember it as ${ERAMEM[k]}. `;
  t+=m.first?`They came as a few families and, over ${yrs} year${yrs>1?'s':''}, became ${pop} souls`:`In ${yrs} year${yrs>1?'s':''} the town went from ${m.pop} souls to ${pop}`;
  t+=`; ${born} were born in it and ${died} were laid to rest.`;
  if(raids>0)t+=` They weathered ${raids===1?'a raid':raids+' raids'}.`;
  if(leg)t+=` ${leg===1?'One tale':leg+' tales'} of it ${leg===1?'is':'are'} still told.`;
  if(hero.length)t+=` ${hero.map(h=>h.name).slice(0,2).join(' and ')} ${hero.length===1&&hero[0].kind!=='founder'?'is':'are'} honoured for it.`;
  c.ages.push({era:k,name:ERAS[k].name,txt:t,date:dateStr(),day:dayN()});
  c.mark={pop,births:G.births||0,deaths:G.deaths||0,raids:G.raids||0,leg:c.legends.length,hero:c.heroes.length,day:dayN()};
  say('milestone',{who:[],txt:`${ERAS[k].name} ends. ${t.split('. ').slice(1,3).join('. ')}`.replace(/\.\.$/,'.'),big:true,age:k});}

// ---------------------------------------------------------------- watching the Chronicle lines for the things that happen
function seeChron(t,major){const c=cuEnsure();let m;
  if(/^The Spirit parted the clouds/.test(t))newLegend('sun');
  else if(/^The Spirit sent (rain|snow)/.test(t)){if(G.drought||(seasonN()===1&&G.t-(G.lastRain||-99)>72))newLegend('rain');}
  else if(/^The Spirit lifted the sickness/.test(t)){newLegend('heal');}
  else if((m=/^The Spirit quenched the fire at the (.+)\.$/.exec(t))){newLegend('fire',m[1]);}
  else if(/^The Spirit blessed the fields/.test(t))newLegend('bless');
  else if(/^A great rainbow arched/.test(t)){if(rnd()<.6)newLegend('rainbow');}
  else if(/^The Spirit called a thunderstorm/.test(t)){if(rnd()<.5)newLegend('storm');}
  else if(/^A star fell from the sky/.test(t))newLegend('meteor');
  else if(/^The Spirit raised a great hill/.test(t)){newLegend('hill');if(G.hill)addPlace('hill',G.hill.x,G.hill.z,'the Spirit’s Rise',`The folk call the great hill the Spirit’s Rise, and climb it on the longest day.`,{multi:true});}
  else if(/^The Spirit opened a spring/.test(t)){newLegend('spring');const sp=springs[springs.length-1];if(sp)addPlace('spring',sp.x,sp.z,'the Blessed Spring','The new spring is called the Blessed Spring, and mothers bring their children to drink.',{multi:true});}
  else if((m=/^The Spirit’s lightning struck down (.+)\. The folk are afraid/.exec(t))){newLegend('wrath',m[1]);}
  else if((m=/^(.+) fell defending the town/.exec(t))){const v=G.vill.find(o=>fullName(o)===m[1]);if(v){const h=addHero('fell',v.id,m[1],`${m[1]} fell defending ${G.town}, and ${she(v)} is honoured for it.`,{fallen:true,x:v.x,z:v.z});
      if(h&&h.sx!=null){addPlace('stand',h.sx,h.sz,`${v.fam}’s Stand`,`The place where ${m[1]} fell is called ${v.fam}’s Stand.`,{multi:true,who:[v.id]});}}}
  else if((m=/^(.+) was slain by raiders/.exec(t))){const v=G.vill.find(o=>fullName(o)===m[1]);if(v&&c.heroes.filter(h=>h.kind==='lost').length<2)addHero('lost',v.id,m[1],`${m[1]} was lost when raiders came to ${G.town}, and the folk raised a memorial where ${she(v)} fell.`,{fallen:true,x:v.x,z:v.z});}
  else if(/was put out by a bucket chain/.test(t)){const bn=/The fire at the (.+?) was put out/.exec(t);heroOfFire(bn&&bn[1]);}
  else if(/^The raid was over/.test(t))raidOver();
  else if(/^The Spirit struck down (.+?)\. But/.test(t)){villainEnd(c.cultName||/^The Spirit struck down (.+?)\./.exec(t)[1],true);c.cultPid=0;}}
function heroOfFire(bname){const c=cuEnsure();if(c.fireHero&&dayN()-c.fireHero<10)return;if(c.heroes.filter(h=>h.kind==='fire').length>=2)return;const b=bname&&buildings.find(o=>o.info&&o.info.name===bname);const x=b?b.x:G.center?G.center.x:0,z=b?b.z:G.center?G.center.z:0;
  let best=null,bd=1e9;for(const v of G.vill){if(v.age<16||v.hidden)continue;const d=Math.hypot(v.x-x,v.z-z);if(d<bd){bd=d;best=v;}}if(!best||bd>40)return;if(rnd()<.6)return;c.fireHero=dayN();
  const res=b&&b.type==='house'?G.vill.filter(o=>o.home===b.id).length:0;
  addHero('fire',best.id,fullName(best),`${fullName(best)} ran to the burning ${bname||'house'} and led the bucket-line until it was out${res?`, and ${res} folk slept under their own roof that night because of it`:''}.`,{x:x,z:z});}
{const _c=chron;chron=function(txt,major){const r=_c.apply(this,arguments);if(!IN){IN++;try{seeChron(String(txt),major);}catch(e){console.error('culture',e);}finally{IN--;}}return r;};}
{const _sf=startFestival;startFestival=function(h,why){let f=null;try{f=festivalNote(h,why);}catch(e){console.error('culture',e);}_sf.apply(this,arguments);if(f)try{showBanner(f.name,f.blurb);}catch(e){}};}
{const _fe=festive;festive=function(v){const r=_fe.apply(this,arguments);const f=G.cu&&G.cu.fest;if(f&&f.until>G.t&&f.th&&rnd()<.3)setThought(v,pickA(f.th));return r;};}

// ---------------------------------------------------------------- the hooks
globalThis.cultureDaily=function(){const c=cuEnsure();cuIdent();
  try{ageCheck();legendDaily();placesDaily();heroesDaily();}catch(e){console.error('culture daily',e);}
  if(c.mark.first&&c.mark.pop===0){c.mark.pop=Math.max(popN(),1);c.mark.day=dayN();}
  if(FEED_OPEN)feedDirty=true;};
globalThis.cultureHourly=function(){const c=cuEnsure();const hh=Math.floor(hod());
  try{if(hh===8)customsHourly();if(hh%3===0)toppingOut();if(hh===10||hh===15)festivalChatter();
    if(hh===11||hh===16){if(c.legends.length&&G.festival<=0){const el=G.vill.filter(v=>v.age>58&&!v.leaving&&!v.arriving&&(v._lod||0)===0);if(el.length&&rnd()<.5)setThought(pickA(el),legendQuote(pickA(c.legends)));}}
    syncMons();}catch(e){console.error('culture hourly',e);}};
SAVE_PER.push('cu');if(typeof PERKEYS!=='undefined')PERKEYS.push('cu');

// ================================================================ UI: story feed, person page, Chronicle, labels, cameras
const ICON={
 birth:['#6a9a3a','<path d="M8 14V7M8 8C4 8 3 5 3 3c3 0 5 1 5 5zM8 9c3 0 5-2 5-5-3 0-5 2-5 5z"/>'],
 death:['#6a5a7a','<path d="M7 7h2v7H7zM8 1c2 2 2 4 0 5-2-1-2-3 0-5z"/>'],
 wedding:['#b8527a','<circle cx="6" cy="9" r="3.4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10.2" cy="9" r="3.4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1l1.4 2.6L8 5.2 6.6 3.6z"/>'],
 heart:['#b8527a','<path d="M8 14S2 10.2 2 6.2A3 3 0 018 5a3 3 0 016 1.2C14 10.2 8 14 8 14z"/>'],
 hero:['#b8862a','<path d="M8 1l6 2v5c0 3-3 5-6 7-3-2-6-4-6-7V3z"/>'],
 villain:['#5a4a5a','<path d="M10 2a6 6 0 100 12A5 5 0 0110 2z"/>'],
 miracle:['#d4a73c','<path d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 14 6.4 8.6 2 7l4.4-1.6z"/>'],
 legend:['#8a5a2a','<path d="M3 2h9a1 1 0 011 1v9a2 2 0 01-2 2H4a1 1 0 01-1-1zM5 5h6M5 8h6M5 11h4" stroke="#f3e9cf" stroke-width="1" fill="currentColor"/>'],
 custom:['#3f8a3a','<path d="M3 1.5V15M3 2.5h9l-2.2 3L12 8.5H3z"/>'],
 naming:['#3a7a8a','<path d="M8 1a4.2 4.2 0 014.2 4.2C12.2 8.600 8 15 8 15S3.800 8.600 3.800 5.200A4.200 4.200 0 018 1z"/><circle cx="8" cy="5.200" r="1.600" fill="#f3e9cf"/>'],
 life:['#7a6a4a','<circle cx="8" cy="8" r="3.500"/>'],
 clash:['#8a4a3a','<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" fill="none"/>']};
const KIND={birth:['births','birth'],naming:['customs','naming'],death:['deaths','death'],funeral:['deaths','death'],memorial:['deaths','hero'],wedding:['weddings','wedding'],courtship:['weddings','heart'],hero:['heroes','hero'],villain:['heroes','villain'],
  miracle:['miracles','miracle'],legend:['miracles','legend'],custom:['customs','custom'],festival:['customs','custom'],tradition:['customs','custom'],friendship:['life','heart'],kindness:['life','heart'],rivalry:['life','clash'],grudge:['life','clash']};
const kindInfo=k=>KIND[k]||['life','life'];
const svgI=name=>{const i=ICON[name]||ICON.life;return `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="color:${i[0]}">${i[1]}</svg>`;};
const CHIPS=[['all','All'],['births','Births'],['deaths','Deaths'],['weddings','Weddings'],['heroes','Heroes'],['miracles','Miracles'],['customs','Customs'],['life','Life']];
const todWord=t=>{const h=((t%24)+24)%24;return h<6?'before dawn':h<11?'morning':h<14?'midday':h<18?'afternoon':h<21?'evening':'night';};
(function injectCSS(){const st=document.createElement('style');st.textContent=`
#cuFeed{position:fixed;right:300px;top:90px;width:350px;max-height:calc(100vh - 106px);display:flex;flex-direction:column;z-index:5;padding:0;overflow:hidden;transform-origin:100% 0;transform:scale(var(--ui))}
#cuFeed header{padding:11px 14px 4px;display:flex;align-items:center;gap:8px}
#cuFeed h2{font-family:Cinzel,serif;font-size:16px;margin:0;letter-spacing:1.6px;color:var(--wood);flex:1}
#cuFeed h2 small{display:block;font-family:'EB Garamond',serif;font-style:italic;font-weight:400;letter-spacing:0;font-size:13px;color:var(--ink2)}
#cuFeed .cuChips{display:flex;flex-wrap:wrap;gap:4px;padding:4px 12px 8px;border-bottom:1px solid #b89a6a}
#cuFeed .cuChips button{padding:0 9px;font-size:13px;border-radius:11px;line-height:20px}
#cuList{overflow-y:auto;padding:0 14px 12px;min-height:90px}
#cuList::-webkit-scrollbar{width:6px}#cuList::-webkit-scrollbar-thumb{background:#a88a5c;border-radius:3px}
.cuDay{font-family:Cinzel,serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#7a4a12;margin:11px 0 3px;display:flex;gap:8px;align-items:center}
.cuDay:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#9b7a4c,transparent)}
.cuE{display:flex;gap:9px;padding:5px 7px;margin:1px -7px;border-radius:4px;line-height:1.28;font-size:15.5px;border-left:3px solid transparent}
.cuE.link{cursor:pointer}.cuE.link:hover{background:rgba(110,74,42,.13)}
.cuE.big{border-left-color:var(--gold);background:rgba(201,154,59,.09)}
.cuE .ic{flex:0 0 22px;height:22px;margin-top:1px;border-radius:50%;display:grid;place-items:center;background:rgba(255,248,226,.8);border:1px solid rgba(90,60,30,.35)}
.cuE .tx{flex:1}.cuE .tm{display:block;font-size:12px;color:var(--ink2);font-style:italic;margin-top:1px}
.cuEmpty{padding:18px 4px;color:var(--ink2);font-style:italic;text-align:center}
#cuBadge{display:none;margin-left:4px;background:#8e2f1f;color:#fff3d6;border-radius:9px;padding:0 6px;font-size:12px;line-height:16px;font-variant-numeric:tabular-nums}
#cuNotes{position:fixed;top:122px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center;z-index:6;pointer-events:none}
.cuNote{pointer-events:auto;cursor:pointer;max-width:520px;display:flex;gap:9px;align-items:center;padding:6px 14px 6px 10px;font-size:15px;opacity:0;transition:opacity .5s,transform .5s;transform:translateY(-6px);line-height:1.25}
.cuNote.in{opacity:1;transform:none}
#cuPerson{position:fixed;left:240px;top:90px;width:322px;padding:12px 14px;z-index:5;transform-origin:0 0;transform:scale(var(--ui));overflow-y:auto}
#cuPerson h2{font-family:Cinzel,serif;font-size:18px;margin:0 0 2px;color:var(--wood);padding-right:26px}
#cuPerson .kind{font-style:italic;color:var(--ink2);font-size:14px;margin-bottom:8px}
#cuPerson .thought{font-style:italic;margin:6px 0;font-size:15.5px}
#cuPerson .mood{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink2);margin:4px 0}
#cuPerson .small{font-size:13.5px;color:var(--ink2)}
#cuPerson .acts{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
#cuPerson>.x{position:absolute;top:6px;right:8px}
body.photo #cuPerson{display:none!important}body.inmenu #cuPerson{display:none!important}
#cuPerson .flag{display:inline-block;width:14px;height:10px;margin-right:6px;border:1px solid rgba(0,0,0,.4);vertical-align:-1px;background:linear-gradient(90deg,var(--c1) 50%,var(--c2) 50%)}
#cuPerson .near{font-size:13px;color:var(--ink2);font-style:italic;margin-top:-4px;margin-bottom:6px}
#cuPerson .cuP h4{font-family:Cinzel,serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#7a4a12;margin:10px 0 3px;display:flex;gap:6px;align-items:center}
#cuPerson .cuP h4:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#9b7a4c,transparent)}
#cuPerson .chips{display:flex;flex-wrap:wrap;gap:4px}
#cuPerson .chips span{background:rgba(110,74,42,.14);border:1px solid rgba(110,74,42,.35);border-radius:10px;padding:0 8px;font-size:13.5px}
#cuPerson .fam{font-size:14.5px;line-height:1.45}#cuPerson .fam i{color:var(--ink2);font-size:12.5px;display:inline-block;min-width:58px}
#cuPerson a.cuL{color:#6e3a12;border-bottom:1px dotted #6e3a12;cursor:pointer}#cuPerson a.cuL:hover{color:var(--red)}
#cuPerson .tl{font-size:14px;line-height:1.3;margin:0;padding:0;list-style:none}
#cuPerson .tl li{padding:3px 0 3px 10px;border-left:2px solid #b89a6a;margin-bottom:1px}#cuPerson .tl li b{display:block;font-family:Cinzel,serif;font-weight:600;font-size:10.5px;letter-spacing:1px;color:#7a4a12}
#cuPerson .mem{font-size:14px;font-style:italic;margin:2px 0}
#cuTabs{display:flex;gap:6px;justify-content:center;margin:0 0 10px;flex-wrap:wrap}#cuTabs button{padding:2px 12px;font-size:14px}
#chron .e.leg{border-left:3px solid var(--gold);padding-left:10px}#chron .e.leg em{display:block;font-size:12.5px;color:var(--ink2)}
#chron .e.leg strong{display:block;font-family:Cinzel,serif;font-size:15px;color:var(--wood);letter-spacing:.5px}
#chron .e.leg span:first-letter{all:unset}
#cuLabels{position:fixed;inset:0;pointer-events:none;z-index:14;display:none;overflow:hidden}
body.photo #cuLabels{display:block}
.cuLbl{position:absolute;transform:translate(-50%,-100%);font-family:Cinzel,serif;font-size:13px;letter-spacing:2.2px;color:#fff3d6;text-shadow:0 1px 4px #000,0 0 12px rgba(0,0,0,.8);white-space:nowrap;text-transform:uppercase;transition:opacity .4s}
.cuLbl:after{content:'';display:block;width:1px;height:12px;margin:2px auto 0;background:linear-gradient(#fff3d6,transparent)}
.cuLbl small{display:block;text-align:center;font-family:'EB Garamond',serif;font-style:italic;font-size:12px;letter-spacing:.5px;text-transform:none;opacity:.8}
#cuTip{position:fixed;display:none;z-index:9;pointer-events:none;padding:4px 11px;font-size:14px;max-width:260px;line-height:1.25}
#cuTip b{font-family:Cinzel,serif;font-size:13px;letter-spacing:1px;color:var(--wood);display:block}
body.photo #cuFeed,body.photo #cuNotes,body.photo #cuTip{display:none!important}
body.inmenu #cuFeed,body.inmenu #cuNotes{display:none!important}
body.cuwalk #vig{background:radial-gradient(ellipse 80% 75% at 50% 50%,rgba(0,0,0,0) 60%,rgba(20,10,4,.35) 100%)}
body.photo.cuorbit #photo .cap i:after{content:'  ·  slow orbit';opacity:.6}
`;document.head.appendChild(st);})();
const feed=document.createElement('div');feed.id='cuFeed';feed.className='panel hidden';
feed.innerHTML='<header><h2 id="cuFT">Tales<small id="cuFS"></small></h2><button class="mini" id="cuFX" title="Close (N)">×</button></header><div class="cuChips" id="cuChips"></div><div id="cuList"></div>';document.body.appendChild(feed);
const notes=document.createElement('div');notes.id='cuNotes';document.body.appendChild(notes);
const tip=document.createElement('div');tip.id='cuTip';tip.className='panel';document.body.appendChild(tip);
const pp=document.createElement('div');pp.id='cuPerson';pp.className='panel hidden';document.body.appendChild(pp);
const lbls=document.createElement('div');lbls.id='cuLabels';document.body.appendChild(lbls);
const fb=document.createElement('button');fb.id='gTales';fb.title='The folk’s tales (N)';fb.innerHTML='Tales<span id="cuBadge"></span>';
{const ref=$q('gChron');if(ref&&ref.parentNode)ref.parentNode.insertBefore(fb,ref);}
let feedDirty=true,feedT=0;
function mkChips(){$q('cuChips').innerHTML=CHIPS.map(([k,l])=>`<button data-f="${k}" class="${FILTER===k?'on':''}">${l}</button>`).join('');}
function setBadge(){const b=$q('cuBadge');if(!b)return;b.style.display=UNSEEN>0?'inline-block':'none';b.textContent=UNSEEN>99?'99+':UNSEEN;}
function renderFeed(){feedDirty=false;const st=(G.story||[]).filter(e=>FILTER==='all'||kindInfo(e.k)[0]===FILTER).slice(0,140);
  $q('cuFS').textContent=`${G.town}, as the folk tell it`;let html='',day=null;
  if(!st.length)html=`<div class="cuEmpty">${(G.story||[]).length?'Nothing of this kind has happened yet.':'Nothing has yet happened worth telling. Give them time.'}</div>`;
  for(const e of st){if(e.day!==day){day=e.day;html+=`<div class="cuDay">${esc(e.date||('Day '+e.day))}</div>`;}
    const [,ic]=kindInfo(e.k),live=(e.who||[]).find(id=>vById(id));
    html+=`<div class="cuE${live?' link':''}${e.big?' big':''}" ${live?`data-id="${live}"`:''} data-town="${esc(e.town||'')}"><span class="ic">${svgI(ic)}</span><span class="tx">${esc(e.txt)}<span class="tm">${todWord(e.t)}${live?' · follow':''}</span></span></div>`;}
  $q('cuList').innerHTML=html;}
function toggleFeed(on){FEED_OPEN=on==null?!FEED_OPEN:on;feed.classList.toggle('hidden',!FEED_OPEN);if(FEED_OPEN)layoutCu();fb.classList.toggle('on',FEED_OPEN);if(FEED_OPEN){UNSEEN=0;setBadge();mkChips();renderFeed();}}
globalThis.cuToggleFeed=toggleFeed;
fb.onclick=()=>toggleFeed();$q('cuFX').onclick=()=>toggleFeed(false);
$q('cuChips').addEventListener('click',e=>{const b=e.target.closest('button[data-f]');if(!b)return;FILTER=b.dataset.f;mkChips();renderFeed();});
$q('cuList').addEventListener('click',e=>{const r=e.target.closest('.cuE.link');if(r)cuFollow(+r.dataset.id,r.dataset.town);});
function cuFollow(id,town){if(town&&town!==G.town){const k=TOWNS.list.findIndex((s,j)=>!s.dead&&sName(j)===town);if(k>=0&&k!==TOWNS.cur)viewSettlement(k,true);}
  const v=vById(id);if(!v){quietNote('That life has ended, but it is written here.','death');return false;}G.follow=v;selected=null;cam.dist=Math.min(cam.dist,Math.max(cam.walk?2.5:0,28));godInspector();return true;}
globalThis.cuFollow=cuFollow;
function quietNote(txt,icon,id,town){const n=document.createElement('div');n.className='cuNote panel';n.innerHTML=`<span class="ic">${svgI(icon||'miracle')}</span><span>${esc(txt.length>150?txt.slice(0,148)+'…':txt)}</span>`;
  if(id)n.onclick=()=>{cuFollow(id,town);n.remove();};notes.appendChild(n);requestAnimationFrame(()=>n.classList.add('in'));
  while(notes.children.length>3)notes.firstChild.remove();setTimeout(()=>{n.classList.remove('in');setTimeout(()=>n.remove(),600);},7000);}
STORY.on(e=>{try{if(MODE!=='god')return;if(FEED_OPEN&&(e.town===G.town))feedDirty=true;else if(!FEED_OPEN&&kindInfo(e.k)[0]!=='life'){UNSEEN++;setBadge();}
  let note=e.big&&!e.chron;if(!note&&e.k==='wedding'&&e.who&&e.who.length){const v=vAny(e.who[0]),c=G.cu;if(v&&c&&c.founderFams&&c.founderFams.includes(v.fam))note=true;}
  if(!note&&e.k==='death'&&e.who&&e.who[0]){const v=vAny(e.who[0]);if(v&&v.age>=64)note=true;}
  if(note&&!document.body.classList.contains('photo')&&e.town===G.town)quietNote(e.txt,kindInfo(e.k)[1],(e.who||[]).find(id=>vById(id)),e.town);}catch(err){console.error('culture note',err);}});

// ---- the person page
const FALLBACK_TRAITS=null;
const nrm=x=>{if(x==null)return null;if(typeof x==='number'){const o=vAny(x);return {id:x,name:o?fullName(o):null};}
  if(typeof x==='string')return {id:0,name:x};const o=x.v||x.who||x.person||x;if(typeof o==='number'){const w=vAny(o);return {id:o,name:w?fullName(w):(x.name||null),note:x.note||x.why||''};}
  const nm=o.name?(o.fam&&!String(o.name).includes(o.fam)?o.name+' '+o.fam:o.name):null;return {id:o.id||0,name:nm,note:x.note||x.why||''};};
const nl=a=>(a||[]).map(nrm).filter(x=>x&&x.name);
const link=p=>p.id&&vById(p.id)?`<a class="cuL" data-id="${p.id}">${esc(p.name)}</a>`:esc(p.name)+(p.id?' <i style="min-width:0">(passed on)</i>':'');
function famOf(v){const sp=v.spouse?vById(v.spouse):null,pr=(v.parents||[]).map(id=>vById(id)).filter(Boolean),kids=G.vill.filter(o=>o.parents&&o.parents.includes(v.id)),
  sib=v.parents&&v.parents.length?G.vill.filter(o=>o!==v&&o.parents&&o.parents.some(p=>v.parents.includes(p))):[];
  return {spouse:sp?[{id:sp.id,name:fullName(sp)}]:[],parents:pr.map(o=>({id:o.id,name:fullName(o)})),children:kids.map(o=>({id:o.id,name:fullName(o)})),siblings:sib.map(o=>({id:o.id,name:fullName(o)}))};}
let PM={id:0,t:0,fam:null,sum:null};
function personHtml(v){const id=cuIdent(),h=bById(v.home),w=bById(v.work),m=vMood(v);let S=null;
  if(typeof lifeSummary==='function'){const now=performance.now();if(PM.id!==v.id||now-PM.t>1500){try{PM.sum=lifeSummary(v)||null;}catch(e){PM.sum=null;}PM.id=v.id;PM.t=now;PM.fam=null;}S=PM.sum;}
  else if(PM.id!==v.id||performance.now()-PM.t>1500){PM.id=v.id;PM.t=performance.now();PM.fam=null;PM.sum=null;}
  let F;if(S&&S.family){F={spouse:nl(Array.isArray(S.family.spouse)?S.family.spouse:S.family.spouse?[S.family.spouse]:[]),parents:nl(S.family.parents),children:nl(S.family.children),siblings:nl(S.family.siblings)};}
  else{if(!PM.fam)PM.fam=famOf(v);F=PM.fam;}
  const role=v.age<14?'Child':v.age>64?'Elder':JOBN[v.job]||'Idle',near=h?cuPlaceNear(h.x,h.z,20):cuPlaceNear(v.x,v.z,12);
  let html=`<div class="cuP" style="--c1:${hexs(id.c1)};--c2:${hexs(id.c2)}"><h2>${esc(fullName(v))}</h2><div class="kind"><span class="flag"></span>${role}, ${Math.floor(v.age)} years old${v.sick?' · sick':''}</div>`;
  if(near)html+=`<div class="near">Lives near ${esc(near.name)}</div>`;
  html+=`<div class="thought">“${esc(v.thought||'…')}”</div><div class="mood">Mood <span class="bar"><i style="width:${S&&typeof S.mood==='number'?clamp(Math.round(S.mood),0,100):m}%"></i></span> ${S&&typeof S.mood==='number'?clamp(Math.round(S.mood),0,100):m}%</div>`;
  const tr=S&&S.traits&&S.traits.length?S.traits.map(t=>typeof t==='string'?t:(t.name||t.t||'')).filter(Boolean):null;
  if(tr)html+=`<div class="chips" style="margin:6px 0 2px">${tr.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`;
  html+=`<div class="small">Home: ${h?esc(h.info?h.info.name:'house'):'none — sleeps by the fire'}${w?`<br>Works at: ${esc(w.info?w.info.name:siteName(w))}`:''}</div>`;
  const rows=[['Spouse',F.spouse],['Parents',F.parents],['Children',F.children],['Siblings',F.siblings]].filter(r=>r[1].length);
  if(rows.length)html+=`<h4>Family</h4><div class="fam">${rows.map(([l,a])=>`<div><i>${l}</i>${a.slice(0,8).map(link).join(', ')}${a.length>8?` and ${a.length-8} more`:''}</div>`).join('')}</div>`;
  if(S){const fr=nl(S.friends),ri=nl(S.rivals);if(fr.length||ri.length)html+=`<h4>Bonds</h4><div class="fam">${fr.length?`<div><i>Friends</i>${fr.slice(0,5).map(link).join(', ')}</div>`:''}${ri.length?`<div><i>Rivals</i>${ri.slice(0,4).map(link).join(', ')}</div>`:''}</div>`;
    const mem=(S.memories||[]).map(x=>typeof x==='string'?x:(x&&(x.txt||x.t||x.text))||'').filter(Boolean);if(mem.length)html+=`<h4>Remembers</h4>${mem.slice(0,4).map(t=>`<div class="mem">“${esc(t)}”</div>`).join('')}`;}
  const evs=(S&&S.story&&S.story.length?S.story:storyOf(v.id)).slice(0,8);
  const hero=(G.cu&&G.cu.heroes||[]).find(x=>x.who===v.id);
  const heroDup=hero&&evs.some(e=>e.txt===hero.txt);
  if(evs.length||hero)html+=`<h4>Their story</h4><ul class="tl">${hero&&!heroDup?`<li><b>HONOURED</b>${esc(hero.txt)}</li>`:''}${evs.map(e=>`<li><b>${esc((e.date||'').toUpperCase())}</b>${esc(e.txt||e.t||'')}</li>`).join('')}</ul>`;
  html+=`<div class="acts"><button data-a="stop">Stop watching</button><button data-a="walk" title="Street-level camera (V)">${cam.walk?'Look down':'Walk with them'}</button><button data-a="tales">Tales</button></div></div>`;
  return html;}
globalThis.cuPersonHtml=personHtml;
pp.addEventListener('click',e=>{const a=e.target.closest('a.cuL');if(a){cuFollow(+a.dataset.id);return;}const b=e.target.closest('button[data-a]');if(!b)return;
  const k=b.dataset.a;if(k==='close'){G.follow=null;selected=null;godInspector();}else if(k==='stop'){G.follow=null;godInspector();}else if(k==='walk'){toggleWalk();godInspector();}else if(k==='tales'){toggleFeed(true);}});
function layoutCu(){const ui=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui'))||1,bar=$q('gtop'),tb=bar&&!bar.classList.contains('hidden')?bar.getBoundingClientRect().bottom+10:12;
  const tr=toolsEl.getBoundingClientRect();pp.style.top=tb+'px';pp.style.left=(tr.right+12)+'px';pp.style.maxHeight=Math.max(120,(innerHeight-tb-14)/ui)+'px';
  feed.style.top=tb+'px';feed.style.right=(272*ui+24)+'px';feed.style.maxHeight=Math.max(120,(innerHeight-tb-14)/ui)+'px';}
addEventListener('resize',()=>{layoutCu();});
{const _gi=godInspector;godInspector=function(){_gi.apply(this,arguments);try{const v=G.follow;
  if(v&&G.vill.includes(v)){const html='<button class="mini x" data-a="close" title="Close">×</button>'+personHtml(v);insp.classList.add('hidden');
    if(pp._cu!==html){const sc=pp.scrollTop;pp.innerHTML=html;pp._cu=html;pp.scrollTop=sc;}if(pp.classList.contains('hidden')){pp.classList.remove('hidden');layoutCu();}}
  else{if(!pp.classList.contains('hidden')){pp.classList.add('hidden');pp._cu=null;}
    if(!insp.classList.contains('hidden')&&insp.querySelector('h2')&&!insp.querySelector('.cuNear')){const b=selected||hoverB;const p=b&&cuPlaceNear(b.x,b.z,14);if(p)insp.insertAdjacentHTML('beforeend',`<div class="small cuNear" style="font-style:italic">Near ${esc(p.name)}</div>`);}}
  }catch(e){console.error('culture insp',e);}};}

// ---- the Chronicle in the folk's own voice
const VOICE_SK=[[/^The Spirit sent (rain|snow) over the valley\./,'$1 came over the valley, and some said it was sent.'],[/^The Spirit parted the clouds\. A golden day\./,'The clouds parted for a golden day. Some called it a gift.'],
  [/^The Spirit lifted the sickness\./,'The sickness lifted. Some thanked the Spirit; the healers thanked the herbs.'],[/^The Spirit blessed the fields\. /,'The fields did well. Some said they were blessed. '],[/^By the Spirit’s blessing, a festival/,'By general agreement, a festival'],
  [/^The Spirit quenched the fire at the (.+)\./,'The fire at the $1 went out. Some say a hand did it.'],[/^The Spirit called a thunderstorm/,'A thunderstorm broke']];
function voice(t){if(skeptic())for(const [r,s] of VOICE_SK)if(r.test(t))return t.replace(r,s);return t;}
function chronHead(){const cc=cuEnsure(),id=cuIdent();return `<p class="e" style="text-align:center;font-style:italic;color:var(--ink2)">As the folk of ${esc(G.town)} tell it — under the ${id.nm} banner${skeptic()?', where doubt runs deep':''}.</p>`;}
function cuChronRender(){const el=$q('chronList');if(!el)return;const c=cuEnsure();let tabs=$q('cuTabs');
  if(!tabs){tabs=document.createElement('div');tabs.id='cuTabs';el.parentNode.insertBefore(tabs,el);tabs.addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(b){TAB=b.dataset.t;cuChronRender();}});}
  tabs.innerHTML=[['days','Days'],['legends','Legends'],['ages','The Ages'],['names','Names & customs']].map(([k,l])=>`<button data-t="${k}" class="${TAB===k?'on':''}">${l}</button>`).join('');
  $q('chronTitle').textContent=`The Chronicle of ${G.town}`;let html='';
  if(TAB==='days'){html=chronHead()+(G.chron.map(e=>`<p class="e"><b>${esc(e.d)}</b><span>${esc(voice(e.t))}</span></p>`).join('')||'<p class="e">Nothing yet has been written.</p>');}
  else if(TAB==='legends'){html=c.legends.length?c.legends.map(L=>`<p class="e leg"><strong>${esc(L.title)}</strong><span>${esc(L.txt)}</span><em>${L.sk?'Told with a shrug':'Told with reverence'} · Year ${L.yr0}${L.n>1?`, retold ${L.n} times`:''}${L.stage>=3?', now very old':''}</em></p>`).join(''):'<p class="e">No wonder has yet been remembered. Legends are born when the Spirit’s hand is seen.</p>';}
  else if(TAB==='ages'){html=c.ages.length?c.ages.slice().reverse().map(a=>`<p class="e"><b>${esc(a.name.toUpperCase())} — ${esc(a.date)}</b><span>${esc(a.txt)}</span></p>`).join(''):`<p class="e"><b>${esc(ERAS[G.era].name.toUpperCase())}</b><span>${esc(G.town)} is still living in the ${esc(ERAS[G.era].name)}. When it ends, the folk will write down how they remember it.</span></p>`;}
  else{const pl=c.places.map(p=>`<p class="e"><b>${esc(p.name.toUpperCase())} — named in year ${p.yr}</b><span>${esc(p.why)}</span></p>`).join('');
    const cu=Object.keys(c.customs).map(k=>{const d=CUST.find(x=>x.key===k),r=c.customs[k];const nm=d?nmOf(d):k==='harvest'?'Harvest-Home':k==='topping'?'Topping-Out':k;return `<p class="e"><b>${esc(nm.toUpperCase())} — since year ${r.yr}</b><span>Kept ${r.n} time${r.n>1?'s':''}.${d?' '+esc(d.blurb[tierOf()]):''}</span></p>`;}).join('');
    html=(cu?'<p class="e" style="text-align:center;font-style:italic">Customs</p>'+cu:'')+(pl?'<p class="e" style="text-align:center;font-style:italic">Places the folk have named</p>'+pl:'')||'<p class="e">The folk have not yet named their world.</p>';}
  el.innerHTML=html;}
globalThis.cuChronRender=cuChronRender;

// ---- place labels (photo mode) and hover names
const LB=[];let lastLbl=0;const _pv=new THREE.Vector3();
function updateLabels(){const all=[];TOWNS.list.forEach((s,i)=>{if(s.dead)return;const cu=sGet(i,'cu');if(cu&&cu.places)for(const p of cu.places)all.push(p);});
  const pr={hearth:0,memorial:1,hill:2,river:2,lake:2,church:3,market:3,quarry:4,ford:5};const items=[];
  for(const p of all){_pv.set(p.x,hAt(p.x,p.z)+3,p.z).project(camera);if(_pv.z>1||_pv.z<0||Math.abs(_pv.x)>1.05||Math.abs(_pv.y)>1.05)continue;const d=camera.position.distanceTo(new THREE.Vector3(p.x,hAt(p.x,p.z),p.z));if(d>420)continue;
    items.push({p,x:(_pv.x*.5+.5)*innerWidth,y:(-_pv.y*.5+.5)*innerHeight,d,pr:pr[p.k]!=null?pr[p.k]:6});}
  items.sort((a,b)=>a.pr-b.pr||a.d-b.d);const placed=[];let n=0;
  for(const it of items){if(n>=14)break;if(placed.some(q=>Math.abs(q.x-it.x)<130&&Math.abs(q.y-it.y)<34))continue;placed.push(it);
    let el=LB[n];if(!el){el=document.createElement('div');el.className='cuLbl';lbls.appendChild(el);LB[n]=el;}
    const txt=it.p.name;if(el._t!==txt){el._t=txt;el.innerHTML=esc(txt)+(it.p.k==='memorial'?'<small>in memory</small>':'');}
    el.style.display='block';el.style.left=it.x+'px';el.style.top=it.y+'px';el.style.opacity=clamp(1-(it.d-140)/280,.25,1).toFixed(2);n++;}
  for(let i=n;i<LB.length;i++)LB[i].style.display='none';}
let mx=0,my=0;addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});
let lastTip=0,tipFor=null;
function updateTip(){const photo=document.body.classList.contains('photo');if(photo||MODE!=='god'||UIBLOCK||!hover||!mouse.in||(G.follow&&cam.walk)){tip.style.display='none';tipFor=null;return;}
  const p=cuPlaceNear(hover.x,hover.z);if(!p){tip.style.display='none';tipFor=null;return;}
  if(tipFor!==p){tipFor=p;tip.innerHTML=`<b>${esc(p.name)}</b>${esc(p.why.length>110?p.why.slice(0,108)+'…':p.why)}`;}
  tip.style.display='block';tip.style.left=Math.min(innerWidth-280,mx+16)+'px';tip.style.top=Math.min(innerHeight-90,my+18)+'px';}

// ---- cameras: smooth chase, street-level walk, photo polish
const sdamp=(cur,tgt,vel,st,dt)=>{const o=2/st,x=o*dt,ex=1/(1+x+.48*x*x+.235*x*x*x),ch=cur-tgt,tmp=(vel+o*ch)*dt;return [tgt+(ch+tmp)*ex,(vel-o*tmp)*ex];};
const angD=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};
let walkSave=null,walkT=0,walkIn=false,lastDown=-9,orbit=false,vx=0,vz=0;
addEventListener('mousedown',()=>{lastDown=performance.now();},true);
function toggleWalk(on){const want=on==null?!cam.walk:on;if(want===!!cam.walk)return;
  if(want){if(!G.follow){quietNote('Choose someone to follow first (I, then click a villager).','life');return;}walkSave={dist:cam.dist,pitch:cam.pitch};cam.walk=true;walkT=0;document.body.classList.add('cuwalk');quietNote('Walking with '+G.follow.name+'. V to look down again.','life');}
  else{cam.walk=false;cam.eye=0;document.body.classList.remove('cuwalk');if(walkSave){cam.dist=Math.max(cam.dist,walkSave.dist>40?30:walkSave.dist);cam.pitch=Math.max(cam.pitch,.6);}walkSave=null;}}
globalThis.cuToggleWalk=toggleWalk;
globalThis.cuCamFollow=function(dt){const v=G.follow;if(!v)return;if(!G.vill.includes(v)){G.follow=null;return;}
  const r1=sdamp(cam.tx,v.x,vx,cam.walk?.18:.32,dt),r2=sdamp(cam.tz,v.z,vz,cam.walk?.18:.32,dt);cam.tx=r1[0];vx=r1[1];cam.tz=r2[0];vz=r2[1];
  if(cam.walk){walkT+=dt;const k=Math.min(1,dt*2.6),inside=v.hidden||v.inside;cam.eye=(cam.eye||0)+(((inside?.4:1.5))-(cam.eye||0))*k;
    // indoors there is nothing to see through the walls: float up above the roof until they step out again
    if(inside){walkIn=true;cam.dist+=(11-cam.dist)*Math.min(1,dt*1.6);cam.pitch+=(.75-cam.pitch)*Math.min(1,dt*1.6);}
    else if(walkIn){cam.dist+=(3.6-cam.dist)*Math.min(1,dt*1.8);cam.pitch+=(.17-cam.pitch)*Math.min(1,dt*1.8);if(Math.abs(cam.dist-3.6)<.3)walkIn=false;}
    else if(walkT<1.4){cam.dist+=(3.6-cam.dist)*k;cam.pitch+=(.17-cam.pitch)*k;}
    if(performance.now()-lastDown>2200&&(v.path||v.anim==='walk')&&!dragCam){const target=(v.rot||0)+PI;cam.yaw+=angD(cam.yaw,target)*Math.min(1,dt*.9);}}};
// Esc and tool changes drop the follow; make sure walk mode lets go with it
function loop(now){requestAnimationFrame(loop);try{if(MODE!=='god')return;
  if(cam.walk&&!G.follow)toggleWalk(false);
  if(now-lastLbl>66){lastLbl=now;if(document.body.classList.contains('photo')){updateLabels();if(orbit)cam.yaw+=.0035;}else if(LB.length&&lbls.firstChild&&lbls.style.display!=='none'){}updateTip();
    if(FEED_OPEN&&feedDirty&&now-feedT>350){feedT=now;renderFeed();}}}catch(e){if(!loop.err){loop.err=1;console.error('culture loop',e);}}}
requestAnimationFrame(loop);
addEventListener('keydown',e=>{if(MODE!=='god'||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;if(G.phase!=='play')return;
  if(e.code==='KeyN'){toggleFeed();e.preventDefault();}
  else if(e.code==='KeyV'&&G.follow){toggleWalk();e.preventDefault();}
  else if(e.code==='KeyO'&&document.body.classList.contains('photo')){orbit=!orbit;document.body.classList.toggle('cuorbit',orbit);e.preventDefault();}
  else if(e.code==='Escape'&&FEED_OPEN&&!document.body.classList.contains('photo')){toggleFeed(false);}},true);
{const _tp=togglePhoto;togglePhoto=function(){_tp.apply(this,arguments);try{const on=document.body.classList.contains('photo');if(!on){orbit=false;document.body.classList.remove('cuorbit');lbls.querySelectorAll('.cuLbl').forEach(x=>x.style.display='none');return;}
  if(MODE==='god'){const c=cuEnsure(),big=(G.story||[]).find(e=>e.big);const p=cuPlaceNear(cam.tx,cam.tz,30);
    $q('phLine').textContent=`${ERAS[G.era].name} · ${dateStr()}${p?' · near '+p.name:''}${big?' — '+big.txt:(G.chron[0]?' — '+G.chron[0].t:'')}`;}}catch(e){console.error('culture photo',e);}};}
toggleFeed(false);mkChips();
}
