'use strict';
// ================================================================ GOD GAME — powers, UI, visuals, loop
const $=id=>document.getElementById(id);
function godToolDefs(){const e=G.era||0,L=r=>e>=r?null:`Unlocks in the ${ERAS[r].name}`;
  return [
    ['Shape the land',[['raise','Raise','1','~'],['lower','Lower','2','~'],['smooth','Smooth','3','~'],['flatten','Flatten','4','~'],['cliff','Cliff','5','~',L(1)],['canyon','Canyon','6','~',L(1)],['greathill','Great hill','7',120,L(3)]]],
    ['Water & nature',[['pour','Pour water','8','~'],['spring','Spring','9',30,L(1)],['drain','Drain','0','~'],['plant','Grow forest','T','~'],['w:deer','Deer herd','',20],['w:boar','Boar','',20,L(1)],['w:hare','Hares','',8],['w:fox','Foxes','',10],['w:horse','Wild horses','',25,L(1)]]],
    ['Sky',[['p:rain','Rain','R',35],['p:sun','Sunshine','',25],['p:snow','Snowfall','',30,L(1)],['p:rainbow','Rainbow','',40,L(1)],['p:storm','Thunderstorm','',70,L(2)],['meteor','Meteor','',150,L(1)]]],
    ['Guide the people',[['m:settle','Settle here','',mkCount('settle')],['m:farm','Farm here','',mkCount('farm')],['m:worship','Worship here','',mkCount('worship'),L(1)],['m:forbid','Keep clear','',mkCount('forbid')],['bless','Bless','B',20],['inspect','Watch','I']]],
    ['Miracles',[['p:harvest','Harvest','',50,L(1)],['smite','Smite','X',15,L(2)],['p:heal','Heal','',40,L(2)],['p:festival','Festival','',60,L(2)]]],
    ['Against doubt',[['p:sign','Divine sign','',60],['p:hush','Silence prophet','',40],['p:anoint','Anoint seer','',50]]]];}
Object.assign(HINTS,{
  'm:settle':'Plant a banner where you want homes built. The folk will settle near it.','m:farm':'Plant a banner where fields should go — flat land near water grows best.',
  'm:worship':'Show the folk where to raise their church. Hilltops make grand churches.','m:forbid':'Mark land to keep clear of building (protect a forest, a view, a flood plain).',
  bless:'Click a building: speeds construction and saves materials, puts out fires, or makes a home the next to be improved.',smite:'Call down lightning. Kills raiders — but careful near your own folk and thatched roofs.',
  inspect:'Click a villager to follow them, or a building to see who lives and works there.',greathill:'Click to raise a great hill in a heartbeat. Castles love hilltops.',
  spring:'Click to open a spring that flows forever. Rivers bring life — and floods.',meteor:'Click to call down a falling star: a crater, a firestorm — and star-stone for the masons.',rocks:'Drag to scatter boulders. Rocks become stone for quarries.',
  'w:deer':'Click to release a herd of deer. Hunters need game.','w:boar':'Click to release wild boar — fierce but filling.','w:hare':'Click to release hares into the meadow.','w:fox':'Click to release a pair of foxes.','w:horse':'Click to release a herd of wild horses — beautiful, and never hunted.',fell:'Drag to clear trees.',
  'p:sun':'','m:x':'','p:sign':'Send a sign of light and warmth. Eases doubt and weakens a false prophet. Better still: ease what troubles them.','p:hush':'Strike down the false prophet. If their cult is already strong, they become a martyr.','p:anoint':'Raise a faithful villager as a true prophet who calms the people for a month.',plant:'Drag to grow forest. Woodcutters need trees; forests shelter log cabins.'});
const MK={settle:{c:0xd4a73c,c2:0x8e2f1f,n:'Settle here'},farm:{c:0x7aa04a,c2:0xd8b84a,n:'Farm here'},worship:{c:0xe8e2d2,c2:0x2f4a8e,n:'Worship here'},forbid:{c:0x2a2018,c2:0xb03020,n:'Keep clear'}};
const markGrp=new THREE.Group();scene.add(markGrp);
function refreshMarkers(){while(markGrp.children.length){const m=markGrp.children.pop();m.traverse(o=>o.geometry&&o.geometry.dispose());}
  for(const m of G.markers){const B=new Builder(rnd,0),F=new Builder(rnd,0);const g=hAt(m.x,m.z);const d=MK[m.k];
    B.box(0,g-.2,0,.14,4.6,.14,0x5a4030);B.box(0,g+4.3,0,.12,.12,1.6,0x5a4030);
    F.box(0,-1.5,.75,.05,1.5,1.3,d.c);F.box(0,-1.1,.75,.06,.35,1.32,d.c2);if(m.k==='forbid'){F.beam(0,-2.2,.2,0,-.6,1.3,.12,d.c2);}
    const grp=new THREE.Group();grp.position.set(m.x,0,m.z);grp.add(B.mesh(matB));const f=F.mesh(matB);f.position.set(0,g+4.35,0);grp.add(f);grp.userData.flag=f;markGrp.add(grp);
    const R=new THREE.Mesh(new THREE.RingGeometry(m.k==='forbid'?9.6:7.6,m.k==='forbid'?10:8,48),new THREE.MeshBasicMaterial({color:d.c2,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
    R.rotation.x=-PI/2;R.position.set(0,g+.3,0);grp.add(R);}}
function spend(c){if(G.faith<c){toast(`Not enough Faith (${c} needed)`);sfx('deny');return false;}G.faith-=c;return true;}
function godCharge(vol,wat,planted){if(G.phase==='shape')return;G.faith=Math.max(0,G.faith-vol/110-wat/70-planted*.3);}
function dirWord(x,z){const c=G.center||{x:0,z:0};const a=Math.atan2(z-c.z,x-c.x);return ['east','south-east','south','south-west','west','north-west','north','north-east'][Math.round(((a/TAU*8)%8+8)%8)%8];}
function godStrokeEnd(vol,hv){if(vol>900&&hv&&['raise','lower','cliff','canyon','flatten'].includes(tool)){const w={raise:'raised the land',lower:'lowered the land',cliff:'carved cliffs',canyon:'cut a canyon',flatten:'levelled the ground'}[tool];chron(`The Spirit ${w} to the ${dirWord(hv.x,hv.z)} of ${G.town}.`);}gridDirty=true;}
function sparkle(x,z,col){const y=hAt(x,z);for(let i=0;i<30;i++){const a=rnd()*TAU,r=rnd()*2.5;spawn(x+Math.cos(a)*r,y+rnd()*3,z+Math.sin(a)*r,0,1+rnd(),0,1.6,.5,col[0],col[1],col[2],0);}}
function castPower(id){
  const lock=TOOLDEFS.some(([,l])=>l.some(t=>t[0]===id&&t[4]));if(lock){toast('That miracle is not yet unlocked');return;}
  if(G.phase==='pick'||G.phase==='shape'){toast('First, show your people where to settle');return;}
  if(castWeather(id)){updateUI(true);return;}
  if(devCast(id)){updateUI(true);return;}
  const c=G.center||{x:0,z:0};
  if(id==='p:rain'){if(G.rain>12){toast('It is already raining');return;}if(!spend(35))return;G.rain=24;G.rainI=1;chron(seasonN()===3?'The Spirit sent snow over the valley.':'The Spirit sent rain over the valley.');sfx('thunder');}
  else if(id==='p:harvest'){if(seasonN()===3){toast('Nothing grows in winter');return;}if(G.harvest>0){toast('The harvest is already blessed');return;}if(!spend(50))return;G.harvest=24*(DPS-dayInSeason()+1);chron('The Spirit blessed the fields. The crops grew tall and golden.',true);for(const f of built('farm'))sparkle(f.x,f.z,[1,.85,.3]);}
  else if(id==='p:heal'){if(!G.vill.some(v=>v.sick)){toast('No one is sick');return;}if(!spend(40))return;for(const v of G.vill){if(v.sick)sparkle(v.x,v.z,[.6,1,.7]);v.sick=0;}chron('The Spirit lifted the sickness.',true);G.joy+=5;}
  else if(id==='p:festival'){if(G.festival>0){toast('The festival is already under way');return;}if(G.t-G.lastFest<48){toast('The folk are still tired from the last festival');return;}if(!spend(60))return;startFestival(10,'cast');chron('By the Spirit’s blessing, a festival was held in '+G.town+'.',true);}
  sfx('chime');updateUI(true);
}
let hoverV=null,startAuto=0;
function godClick(e){
  if(G.phase==='pick'){if(hover)chooseStart(hover.x,hover.z);return true;}
  if(tool.startsWith('m:')){markerClick(tool.slice(2));return true;}
  if(tool.startsWith('w:')){if(!hover)return true;if(!goodGround(hover.x,hover.z)){toast('Animals need dry, gentle ground');return true;}if(G.phase!=='shape'&&!spend(tool==='w:hare'?8:tool==='w:fox'?10:tool==='w:horse'?25:20))return true;
    const sp=tool.slice(2),n=sp==='deer'?5:sp==='boar'?3:sp==='fox'?2:sp==='horse'?5:5;for(let i=0;i<n;i++)spawnAnimal(sp,hover.x+(rnd()-.5)*5,hover.z+(rnd()-.5)*5,{hx:hover.x,hz:hover.z});sparkle(hover.x,hover.z,[.8,1,.7]);
    toast(`${SPEC[sp].n}: ${n} released`);if(G.noGame)G.noGame=false;envRep=null;return true;}
  if(tool==='meteor'){if(!hover)return true;if(G.phase!=='shape'&&!spend(150))return true;launchMeteor(hover.x,hover.z);return true;}
  if(tool==='bless'){const b=hoverB;if(!b){toast('Click a building to bless it');return true;}
    if(b.fire){if(!spend(20))return true;b.fire=null;realize(b);chron(`The Spirit quenched the fire at the ${b.info.name}.`);}
    else if(siteProj(b)){const P=siteProj(b);if(P.blessed){toast('Already blessed');return true;}if(!spend(20))return true;P.blessed=true;for(const m of ['wood','stone']){P.need[m]=Math.max(P.have[m]+P.inb[m],Math.ceil(P.need[m]*.6));}toast('Blessed: builders work faster');}
    else{if(b.blessedUp){toast('Already blessed');return true;}if(!spend(20))return true;b.blessedUp=true;G.joy=Math.min(25,G.joy+2);toast(b.type==='house'?'Blessed: this home will be improved next':'Blessed: the folk rejoice');}
    sparkle(b.x,b.z,[1,.9,.5]);sfx('chime');godInspector();return true;}
  if(tool==='smite'){if(!hover)return true;if(!spend(15))return true;smite(hover.x,hover.z);return true;}
  if(tool==='spring'){if(!hover)return true;if(shift){let bi=-1,bd=6;springs.forEach((s,i)=>{const d=Math.hypot(s.x-hover.x,s.z-hover.z);if(d<bd){bd=d;bi=i;}});if(bi>=0){springs.splice(bi,1);refreshSprings();toast('Spring sealed');}return true;}
    if(G.phase!=='shape'&&!spend(30))return true;springs.push({x:hover.x,z:hover.z,rate:.06+brush.s*.35});refreshSprings();chron(`The Spirit opened a spring to the ${dirWord(hover.x,hover.z)}.`);sfx('chime');return true;}
  if(G.phase==='shape')return false;
  if(tool==='greathill'){if(!hover)return true;if(!spend(120))return true;G.hill={x:hover.x,z:hover.z,t:0};chron(`The Spirit raised a great hill to the ${dirWord(hover.x,hover.z)} of ${G.town}.`,true);sfx('thunder');return true;}
  if(tool==='inspect'){if(hoverV){G.follow=hoverV;selected=null;cam.dist=Math.min(cam.dist,22);}else{G.follow=null;selected=hoverB;}godInspector();return true;}
  return false;
}
function godKey(e){
  const c=e.code;
  if(c==='Space'){e.preventDefault();setSpeed(G.paused?G.speed:0);return true;}
  if(c==='Equal'||c==='NumpadAdd'){setSpeed(G.speed>=3?10:G.speed>=1?3:1);return true;}
  if(c==='Minus'||c==='NumpadSubtract'){setSpeed(G.speed>=10?3:1);return true;}
  if(c==='KeyK'){togglePhoto();return true;}
  if(c==='KeyR'){setTool('p:rain');return true;}if(c==='KeyB'){setTool('bless');return true;}if(c==='KeyX'){if(toolAvailable('smite'))setTool('smite');return true;}
  if(c==='KeyC'){toggleChron();return true;}
  if(c==='KeyJ'){toggleCrafts();return true;}
  if(c==='Escape'){if(document.body.classList.contains('photo')){togglePhoto();return true;}G.follow=null;selected=null;$('chron').classList.add('hidden');godInspector();return true;}
  if(c==='KeyH'){$('ghelp').classList.toggle('hidden');return true;}
  if(c==='KeyG'||c==='KeyY'||c==='KeyP'||c==='KeyV'||c==='KeyF')return true;
  return false;
}
function setSpeed(s){if(s===0){G.paused=!G.paused;}else{G.speed=s;G.paused=false;}updateUI(true);}
// ---------------- lightning & smite
const boltMat=new THREE.LineBasicMaterial({color:0xeef4ff,transparent:true,opacity:1});let bolts=[];let flash=0;
function lightning(x,z){const g=hAt(x,z)+wAt(x,z);const pts=[];let px=x+(rnd()-.5)*8,pz=z+(rnd()-.5)*8;for(let i=0;i<=14;i++){const f=i/14;pts.push(new THREE.Vector3(lerp(px,x,f)+(i&&i<14?(rnd()-.5)*2.4:0),lerp(g+70,g,f),lerp(pz,z,f)+(i&&i<14?(rnd()-.5)*2.4:0)));}
  const L=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),boltMat.clone());L.renderOrder=10;scene.add(L);bolts.push({L,t:.35});flash=1;
  for(let i=0;i<30;i++){const a=rnd()*TAU;spawn(x,g+.3,z,Math.cos(a)*3,2+rnd()*3,Math.sin(a)*3,.6,.5,1,.9,.6,1);}}
function smite(x,z){lightning(x,z);sfx('thunder');
  let k=0;for(const b of G.bandits.slice())if(Math.hypot(b.x-x,b.z-z)<3.8){hitBandit(b,99);k++;}
  for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(Math.hypot(t.x-x,t.z-z)<2.2){trees.splice(i,1);treesDirty=true;}}
  for(const v of G.vill.slice())if(!v.hidden&&Math.hypot(v.x-x,v.z-z)<1.6){chron(`The Spirit’s lightning struck down ${fullName(v)}. The folk are afraid.`,true);G.grief+=4;removeVillager(v,'died');}
  for(const b of buildings)if(Math.hypot(b.x-x,b.z-z)<b.r+.3&&rnd()<.5)ignite(b,`Lightning set the ${b.info?b.info.name:'building'} alight!`);
  if(k)chron(`The Spirit’s lightning struck down ${k} raider${k>1?'s':''}.`);}
// ---------------- rain / snow
const RN=2600,rGeo=new THREE.BufferGeometry(),rP=new Float32Array(RN*2*3),rE=new Float32Array(RN*2);
for(let i=0;i<RN;i++){const x=(rnd()-.5)*110,y=rnd()*45,z=(rnd()-.5)*110;rP.set([x,y,z,x,y,z],i*6);rE[i*2]=0;rE[i*2+1]=1;}
rGeo.setAttribute('position',new THREE.BufferAttribute(rP,3));rGeo.setAttribute('aE',new THREE.BufferAttribute(rE,1));
const rainU={uC:{value:new THREE.Vector3()},uT:{value:0},uA:{value:0},uSnow:{value:0}};
const rainMesh=new THREE.LineSegments(rGeo,new THREE.ShaderMaterial({uniforms:rainU,transparent:true,depthWrite:false,
  vertexShader:`attribute float aE;uniform vec3 uC;uniform float uT,uSnow;varying float vE;void main(){vec3 p=position;float sp=mix(34.,4.,uSnow);
   p.y=mod(p.y-uT*sp,45.);p.x+=uSnow*sin(uT*.8+p.y*.3+p.z)*1.2;p+=uC-vec3(0.,4.,0.);p.y+=aE*mix(.9,.12,uSnow);p.x+=aE*mix(.12,.08,uSnow);vE=aE;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float uA,uSnow;varying float vE;void main(){gl_FragColor=vec4(mix(vec3(.75,.82,.9),vec3(1.),uSnow),uA*mix(.45,.9,uSnow)*(1.-vE*.5*(1.-uSnow)));}`}));
rainMesh.frustumCulled=false;rainMesh.visible=false;scene.add(rainMesh);
// ---------------- UI
function updateUI(force){
  if(MODE!=='god')return;
  $('gTown').textContent=G.town;$('gEra').textContent=G.phase==='shape'?WORLDS[WORLD].name+' · shaping':ERAS[G.era].name+(G.phase==='pick'?' · unsettled':'');
  $('gFaith').textContent=Math.floor(G.faith);$('gFaithCap').textContent='/'+faithCap();$('gPop').textContent=popN();
  $('gHap').style.width=Math.round(G.hap)+'%';$('gHap').parentNode.parentNode.title='Happiness '+Math.round(G.hap)+'%\n'+Object.entries(G.hapF).map(([k,v])=>`${k}: ${v>0?'+':''}${v}`).join('\n');
  const net=(G.prodY.food||0)-(G.cons||0);$('gFood').textContent=Math.floor(G.food);$('gFood').parentNode.title=`Food — yesterday made ${Math.round(G.prodY.food||0)}, folk eat ${Math.round(G.cons||0)} a day`;
  $('gWood').textContent=Math.floor(G.wood);$('gStone').textContent=Math.floor(G.stone);
  $('gDate').textContent=`Year ${yearN()} · ${SEASONS[seasonN()]} ${dayInSeason()}${isSunday()?' · Sunday':''}`;
  $('gTime').textContent=hhmm(hod())+(G.storm>0?' · storm':G.snow>0?' · snow':G.rain>0?(seasonN()===3?' · snow':' · rain'):G.sun>0?' · sunny':G.drought?' · drought':'')+(G.festival>0?' · festival':'');
  for(const b of document.querySelectorAll('#gtop .speed button')){const s=+b.dataset.sp;b.classList.toggle('on',s===0?G.paused:(!G.paused&&G.speed===s));}
  // prayers
  let h=G.phase==='shape'?'<h3>Your valley</h3>':'<h3>Prayers</h3>';
  if(G.phase==='shape')h+=envReportHTML()+'<div class="small" style="margin:6px 0;color:var(--ink2)">All shaping is free until they arrive. Ctrl+Z undoes.</div><button id="callS" class="on">Call the settlers</button>';
  else if(G.phase==='pick')h+=`<div class="pr urgent">Five weary settlers wander into the valley.<em>Click the land to plant a banner where they should make camp. Flat, dry ground near water and forest is best.</em></div><button id="autoPick">Let them choose</button>`;
  else{if(!G.prayers.length)h+='<div class="pr none">The folk are content. No prayers for now.</div>';
    for(const p of G.prayers){const hl=Math.max(0,p.until-G.t);h+=`<div class="pr${p.urgent?' urgent':''}">${esc(p.txt)}<em>${esc(PRAYERS[p.k].how)}</em><span class="rw">Reward ${PRAYERS[p.k].r} faith · ${hl>=24?Math.ceil(hl/24)+' days':Math.ceil(hl)+' hours'} left</span></div>`;}
    const nx=ERA_REQ[G.era+1];if(nx)h+=`<div class="pr none" style="margin-top:4px">Next: <b>${ERAS[G.era+1].name}</b> — ${nx.txt}</div>`;h+=tfPanelHTML()+devPanelHTML();}
  if(force||$('prayers')._h!==h){$('prayers').innerHTML=h;$('prayers')._h=h;devBind();tfBind();const ap=$('autoPick');if(ap)ap.onclick=()=>autoChooseStart();const cs=$('callS');if(cs)cs.onclick=()=>callSettlers();}
  layoutGod();
}
function layoutGod(){applyUI();}
const JOBN={hunter:'Hunter',sawyer:'Sawyer',mason:'Stonemason',shipwright:'Shipwright',fishmonger:'Fishmonger',builder:'Builder',wood:'Woodcutter',farmer:'Farmer',fisher:'Fisher',quarry:'Quarryman',forager:'Forager',priest:'Priest',guard:'Guard',miller:'Miller',smith:'Smith',keeper:'Innkeeper',merchant:'Merchant',clerk:'Reeve',machinist:'Machinist',scholar:'Scholar',stationmaster:'Stationmaster',engineer:'Engineer'};
function vMood(v){let m=G.hap;if(!v.home)m-=15;if(v.sick)m-=20;const h=bById(v.home);if(h&&h.type==='house')m+=(h.level||0)*3;if(h&&h.type==='hall')m-=6;return clamp(Math.round(m),0,100);}
function godInspector(){
  let html='';const v=G.follow;
  if(v&&(G.vill.includes(v))){const h=bById(v.home),w=bById(v.work),sp=v.spouse&&G.vill.find(o=>o.id===v.spouse);const m=vMood(v);
    const role=v.age<14?'Child':v.age>64?'Elder':JOBN[v.job]||'Idle';
    html=`<h2>${esc(fullName(v))}</h2><div class="kind">${role}, ${Math.floor(v.age)} years old${v.sick?' · sick':''}</div>
      <div class="thought">“${esc(v.thought||'…')}”</div>
      <div class="mood">Mood <span class="bar"><i style="width:${m}%"></i></span> ${m}%</div>
      <div class="small">Home: ${h?esc(h.info?h.info.name:'house'):'none — sleeps by the fire'}${w?`<br>Works at: ${esc(w.info?w.info.name:siteName(w))}`:''}${sp?`<br>Married to ${esc(sp.name)}`:''}</div>
      <div class="acts"><button data-a="stop">Stop watching</button></div>`;}
  else{const b=selected||((tool==='inspect'||tool==='bless')?hoverB:null);
    if(b&&b.info&&buildings.includes(b)){const P=siteProj(b);const res=G.vill.filter(o=>o.home===b.id),wk=G.vill.filter(o=>o.work===b.id);
      html=`<h2>${esc(b.info.name)}</h2><div class="kind">${BT[b.type]||'Building'}${b.type==='house'?` · level ${(b.level||0)+1}/4`:''}${selected?'':' · click to select'}</div>`;
      if(b.fire)html+=`<div class="warn">On fire! Rain or a blessing will save it.</div>`;
      if(b.flooded)html+=`<div class="warn">Flooded — drain it or it will collapse.</div>`;
      if(P){const pr=Math.round(P.done/P.work*100);const nw=Math.max(0,P.need.wood-P.have.wood),ns=Math.max(0,P.need.stone-P.have.stone);
        html+=`<div class="small">${b.upg?'Being improved':'Under construction'}${P.blessed?' · blessed':''}</div><div class="prog"><i style="width:${pr}%"></i></div><div class="small">${pr}% built${nw||ns?` · still needs ${nw?Math.ceil(nw)+' wood':''}${nw&&ns?', ':''}${ns?Math.ceil(ns)+' stone':''}`:' · all materials delivered'}</div>`;}
      html+=`<ul>${b.info.traits.slice(0,5).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
      if(b.type==='farm'&&!b.build)html+=`<div class="small">Yields about ${(farmRate(b)*2*9).toFixed(1)} food a day this season.</div>`;
      if(res.length)html+=`<div class="small">Home of: ${res.map(o=>esc(o.name+(o.age<14?' (child)':''))).join(', ')}</div>`;
      if(wk.length)html+=`<div class="small">Workers: ${wk.map(o=>esc(o.name)).join(', ')}</div>`;
      if(b.type==='house'&&!P&&capOf(b))html+=`<div class="small">Room for ${capOf(b)} adults</div>`;
      html+=`<div class="acts"><button data-a="bless">Bless (20)</button></div>`;}}
  if(html)html='<button class="mini x" data-a="close" title="Close">×</button>'+html;
  if(insp._h===html)return;insp._h=html;insp.innerHTML=html;insp.classList.toggle('hidden',!html);
  for(const btn of insp.querySelectorAll('button[data-a]'))btn.onclick=()=>{if(btn.dataset.a==='close'){G.follow=null;selected=null;godInspector();return;}if(btn.dataset.a==='stop'){G.follow=null;godInspector();}
    if(btn.dataset.a==='bless'){const b=selected||hoverB;if(b){const pt=tool;hoverB=b;tool='bless';godClick({});tool=pt;}}};
  layoutGod();
}
function showBanner(t,s){const b=$('banner');b.innerHTML=`<big>${esc(t)}</big><span>${esc(s)}</span>`;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),3800);}
function toggleChron(){const c=$('chron');c.classList.toggle('hidden');if(!c.classList.contains('hidden')){$('chronTitle').textContent=`The Chronicle of ${G.town}`;
  $('chronSub').textContent=`${ERAS[G.era].name} of ${popN()} souls · ${dateStr()} · born ${G.births}, arrived ${G.arrivals}, died ${G.deaths}`;
  $('chronList').innerHTML=G.chron.map(e=>`<p class="e"><b>${esc(e.d)}</b><span>${esc(e.t)}</span></p>`).join('')||'<p class="e">Nothing yet has been written.</p>';}}
function togglePhoto(){const on=!document.body.classList.contains('photo');document.body.classList.toggle('photo',on);$('photo').classList.toggle('hidden',!on);
  if(on){$('phTown').textContent=MODE==='god'?`${G.town.toUpperCase()}`:'HEARTHMERE';const last=MODE==='god'&&G.chron[0];$('phLine').textContent=MODE==='god'?`${ERAS[G.era].name} · ${dateStr()}${last?' — '+last.t:''}`:'';}}
// ---------------- start / save / load
function chooseStart(x,z){
  const r=5;let mn=1e9,mx=-1e9;for(let i=0;i<9;i++){const a=i/8*TAU,rr=i===8?0:r;const h=hAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr);mn=Math.min(mn,h);mx=Math.max(mx,h);if(wAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr)>.1){toast('Too wet — choose dry ground');return;}}
  if(mx-mn>2.6){toast('Too steep — choose flatter ground (or flatten it first)');return;}
  if(Math.abs(x)>HALF-14||Math.abs(z)>HALF-14){toast('Too close to the edge of the world');return;}
  G.phase='play';devApplyMeta();openingStart();const b=startSite('hall',x,z,Math.round(cam.yaw/(PI/2))*(PI/2),{level:0});G.center=b;makePlan(b);onPlannedBuild(b);paintPlaza();b.stock={wood:G.wood,stone:G.stone,food:G.food};
  let [ex,ez]=edgePoint(Math.atan2(z,x)+(rnd()-.5)*.6);{const dx=ex-x,dz=ez-z,d=Math.hypot(dx,dz);if(d>45){for(let r2=45;r2<d;r2+=5){const tx=x+dx/d*r2,tz=z+dz/d*r2;if(wAt(tx,tz)<.05){ex=tx;ez=tz;break;}}}}
  const fam=pickA(FAM),fam2=pickA(FAM.filter(f=>f!==fam));
  const spec=[{female:false,fam},{female:true,fam},{female:false,fam:fam2},{female:true,fam:fam2},{female:rnd()<.5,fam:pickA(FAM),age:19}];
  spec.forEach((s,i)=>{const v=newVillager(Object.assign({x:ex+(rnd()-.5)*3,z:ez+(rnd()-.5)*3,arriving:true},s));v.timer=i*.12;});
  G.vill[0].spouse=G.vill[1].id;G.vill[1].spouse=G.vill[0].id;G.vill[2].spouse=G.vill[3].id;G.vill[3].spouse=G.vill[2].id;
  chron(`Five settlers came over the hills to the place the Spirit had marked: the ${fam}s, the ${fam2}s and young ${G.vill[4].name}.`,true);
  showBanner(G.town,'Watch over them');setTool('inspect');try{if(!localStorage.getItem('hearthmere_ghelp')){$('ghelp').classList.remove('hidden');localStorage.setItem('hearthmere_ghelp','1');}}catch(e){}refreshMarkers();updateUI(true);
  cam.tx=x;cam.tz=z;cam.dist=55;sfx('chime');
}
function autoChooseStart(){for(const lim of [2,2.6,3.5])if(autoTry(lim))return;}
function autoTry(lim){const best=autoFindSpot(lim);if(best){chooseStart(best[0],best[1]);return G.phase==='play';}return false;}
function autoFindSpot(lim){let best=null,bs=-1e9;for(let i=0;i<600;i++){const x=(rnd()-.5)*(N-40),z=(rnd()-.5)*(N-40);if(wAt(x,z)>.05)continue;
  let mn=1e9,mx=-1e9,wet=false;for(let k=0;k<9;k++){const a=k/8*TAU,rr=k===8?0:6;const h=hAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr);mn=Math.min(mn,h);mx=Math.max(mx,h);if(wAt(x+Math.cos(a)*rr,z+Math.sin(a)*rr)>.1)wet=true;}
  if(wet||mx-mn>lim||Math.abs(x)>HALF-16||Math.abs(z)>HALF-16)continue;const wd=nearWater(x,z,14);let tr=0;for(const t of trees)if(t.t!==4&&Math.abs(t.x-x)<20&&Math.abs(t.z-z)<20)tr++;
  const s=-(mx-mn)*3-Math.abs(wd-8)*.8+Math.min(tr,40)*.15-Math.hypot(x,z)*.05;if(s>bs){bs=s;best=[x,z];}}
  return best;}
function serializeGod(){const s=snapshot();const pick=(o,ks)=>{const r={};for(const k of ks)r[k]=o[k];return r;};
  return JSON.stringify({v:2,mode:'god',N,H:f32b64(s.H),W:f32b64(s.W),R:f32b64(s.R),trees:s.trees.map(t=>({x:t.x,z:t.z,t:t.t,s:t.s,r:t.r,c:t.c})),springs:springs.map(p=>({x:p.x,z:p.z,rate:p.base||p.rate})),
    bl:buildings.map(b=>pick(b,['id','type','x','z','rot','manual','seed','w','d','level','variant','build','upg','forFam','stock','blessedUp','flooded','cw','cs'])),
    vill:G.vill.filter(v=>!v.leaving).map(v=>pick(v,['id','name','fam','female','age','job','home','work','x','z','spouse','parents','sick','skin','site','hp','arriving','look','cult','prophet','seer'])),
    G:pick(G,['t','speed','faith','food','wood','stone','era','hap','markers','prayers','chron','town','raids','births','deaths','arrivals','raidCool','plagueCool','drought','rain','rainI','harvest','firstHut','wantHouse','nextV','prayerCool','lastFest','phase','realm','seed','plan','sk','unl','fish','boatsBuilt','boatWork','world','sun','snow','storm','rainbow','lastRain','dev','tf','net']),animals:animals.map(a=>({sp:a.sp,x:+a.x.toFixed(1),z:+a.z.toFixed(1),male:a.male,sc:a.sc})),
    center:G.center?G.center.id:0,cam:{tx:cam.tx,tz:cam.tz,yaw:cam.yaw,pitch:cam.pitch,dist:cam.dist}});}
function loadGod(str){const o=JSON.parse(str);if(o.mode!=='god'||o.N!==N)throw new Error('bad');
  enterGodUI();resetG();
  H.set(b64f32(o.H));W.set(b64f32(o.W));ROAD.set(b64f32(o.R));F.fill(0);trees.length=0;for(const t of o.trees)trees.push(t);treesDirty=true;
  springs.length=0;for(const p of o.springs)springs.push(p);refreshSprings();
  for(const b of buildings.slice())removeBuilding(b);let mx=0;
  for(const r of o.bl){const b=newRecord(r.type,r.x,r.z,r.rot,r.seed);Object.assign(b,r);buildings.push(b);mx=Math.max(mx,b.id);}nextId=mx+1;
  Object.assign(G,o.G);G.paused=false;G.raid=null;G.bandits=[];G.vill=[];
  for(const r of o.vill){const v=newVillager(r);v.id=r.id;v.timer=rnd()*.3;}G.nextV=Math.max(G.nextV,...G.vill.map(v=>v.id+1),1);
  G.center=bById(o.center);if(o.cam)Object.assign(cam,o.cam);WORLD=G.world||'river';animals.length=0;for(const a of (o.animals||[]))spawnAnimal(a.sp,a.x,a.z,{male:a.male,sc:a.sc});if(!G.sk)G.sk={wood:0,work:0,stone:0,farm:0,fish:0,hunt:0};if(!G.unl)G.unl={};devEnsure();tfEnsure();devRefreshShrine();netReload();
  if(G.center&&!G.plan)makePlan(G.center);
  refreshCivic();for(const b of buildings)realize(b);refreshTerrain();updateSkirt();updateWaterMesh(true);refreshMarkers();
  if(G.phase==='shape'){buildToolbox(shapeToolDefs());setTool('raise');}else{buildToolbox(godToolDefs());setTool('inspect');}assignHomes();gridDirty=true;treesDirty=true;rebuildTrees();updateUI(true);applyUI();
}
function enterGodUI(){exitMenu();MODE='god';$('title').classList.add('hidden');$('top').classList.add('hidden');$('gtop').classList.remove('hidden');$('prayers').classList.remove('hidden');$('help').classList.add('hidden');
  renderer.localClippingEnabled=true;}
function startGod(seed){enterGodUI();resetG();G.seed=seed||((rnd()*1e6)|0);newWorld(G.seed);for(const b of buildings.slice())removeBuilding(b);springs.forEach(s=>s.base=null);
  buildToolbox(godToolDefs());setTool('m:settle');G.phase='pick';startAuto=0;refreshMarkers();
  cam.tx=0;cam.tz=0;cam.dist=170;cam.pitch=.95;
  hintEl.textContent='Click the land to show the settlers where to make camp.';updateUI(true);showBanner('A new valley','Choose where your people will settle');}
function startSandbox(){exitMenu();resetG();G.phase='sandbox';MODE='sandbox';$('title').classList.add('hidden');$('gtop').classList.add('hidden');$('prayers').classList.add('hidden');$('top').classList.remove('hidden');
  renderer.localClippingEnabled=false;
  buildToolbox([['Shape the land',[['raise','Raise','1'],['lower','Lower','2'],['smooth','Smooth','3'],['flatten','Flatten','4'],['cliff','Cliff','5'],['terrace','Terrace','6'],['canyon','Canyon','7']]],
    ['Water',[['pour','Pour','8'],['spring','Spring','9'],['drain','Drain','0']]],['Nature',[['plant','Plant trees','T'],['fell','Fell trees','Y']]],
    ['Plan',[['road','Road','G'],['inspect','Inspect','I'],['demolish','Demolish','X']]],['Build',Object.entries(BT).map(([k,v])=>['b:'+k,v,''])]]);
  SNOWF=0;AUTUMN=0;WINTER=0;waterU.uIce.value=0;treesDirty=true;
  newWorld(1337);setTool('b:house');setTime(+tod.value);layout();
  try{if(!localStorage.getItem('hearthmere_seen')){$('help').classList.remove('hidden');localStorage.setItem('hearthmere_seen','1');}}catch(e){}}
function showTitle(){showMenuUI();}
$('tNew').onclick=()=>{audioInit();showSetup();};$('tSand').onclick=()=>{audioInit();startSandbox();};
$('gChron').onclick=toggleChron;$('gHelpB').onclick=()=>$('ghelp').classList.toggle('hidden');$('ghelpClose').onclick=()=>$('ghelp').classList.add('hidden');$('chronClose').onclick=toggleChron;$('gPhoto').onclick=togglePhoto;
$('gSound').onclick=()=>{audioInit();setSound(!SND.on);$('gSound').textContent=SND.on?'Sound on':'Sound off';};
for(const b of document.querySelectorAll('#gtop .speed button'))b.onclick=()=>setSpeed(+b.dataset.sp);
// ---------------- main loop
let aoT=0,treeT=0,last=performance.now(),TT=0,recolorT=0,drownT=0,evalI=0,evalT=0,statT=0,uiT=0,saveT=0,prevWinter=0,prevAut=0;
function gameStep(dtH){
  G.pathBudget=14;
  const h0=Math.floor(G.t);G.t+=dtH;
  for(let h=h0+1;h<=Math.floor(G.t);h++){if(h%24===5&&G.phase==='play')newDay();if(G.phase==='play')hourTick();}
  const n=Math.max(1,Math.ceil(dtH/.06)),sd=dtH/n;
  for(let s=0;s<n;s++){for(const v of G.vill.slice())updAgent(v,sd);for(const b of G.bandits.slice())updAgent(b,sd);towersShoot(sd);}
  if(dtH>0)updateAnimals(dtH);
  // seasons
  const se=seasonN(),k=dtH;
  SNOWF=clamp(SNOWF+(se===3||G.snow>0?.035:-.07)*k,0,1);
  const autT=se===2?clamp(dayInSeason()/3,0,1):0;AUTUMN+=(autT-AUTUMN)*Math.min(1,k*.08);
  WINTER=se===3||G.snow>8?1:0;waterU.uIce.value=clamp(waterU.uIce.value+(se===3&&dayInSeason()>=2?.03:-.06)*k,0,.92);
  if(WINTER!==prevWinter||Math.abs(AUTUMN-prevAut)>.08){prevWinter=WINTER;prevAut=AUTUMN;treesDirty=true;}
  if(G.hill){const hl=G.hill,step=Math.min(dtH*4,1-hl.t);hl.t+=step;const R=14;const i0=Math.max(0,Math.floor(hl.x+HALF-R)),i1=Math.min(N,Math.ceil(hl.x+HALF+R)),j0=Math.max(0,Math.floor(hl.z+HALF-R)),j1=Math.min(N,Math.ceil(hl.z+HALF+R));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i-HALF-hl.x,j-HALF-hl.z);if(d<R){const f=.5+.5*Math.cos(PI*d/R);H[j*S+i]+=step*9.5*f;}}
    refreshTerrain(i0,j0,i1,j1);treesDirty=true;if(hl.t>=1){G.hill=null;for(const b of buildings)if(Math.hypot(b.x-hl.x,b.z-hl.z)<R+b.r)realize(b);gridDirty=true;}}
}
const PROF={};
function frame(now){
  if(MODE==='title'||(PAUSED&&frame.pr>1)){last=now;requestAnimationFrame(frame);return;}
  if(PAUSED)frame.pr=(frame.pr||0)+1;else frame.pr=0;
  const dt=Math.min(.05,(now-last)/1000);last=now;TT+=dt;
  if(MODE==='god'&&G.menu)menuCam(dt);
  else if(MODE==='god'&&G.follow){const v=G.follow;if(!G.vill.includes(v))G.follow=null;else{cam.tx+=(v.x-cam.tx)*Math.min(1,dt*4);cam.tz+=(v.z-cam.tz)*Math.min(1,dt*4);}}
  updateCamera(dt);
  hover=mouse.in&&MODE!=='title'&&!UIBLOCK?pick(mouse.nx,mouse.ny,['pour','drain','spring'].includes(tool)):null;
  const prevHB=hoverB;hoverB=null;hoverV=null;
  if(hover&&['inspect','demolish','bless'].includes(tool)){let bd=1e9;for(const b of buildings){const d=Math.hypot(b.x-hover.x,b.z-hover.z);if(d<b.r&&d<bd){bd=d;hoverB=b;}}
    if(MODE==='god'&&tool==='inspect'){let vd=1.6;for(const v of G.vill){if(v.hidden)continue;const d=Math.hypot(v.x-hover.x,v.z-hover.z);if(d<vd){vd=d;hoverV=v;}}}}
  if(prevHB!==hoverB&&!selected&&!ghostB&&!(MODE==='god'&&G.follow))showInspector();
  if(painting)applyBrush(dt);
  let _pt=performance.now();const PT=k=>{const n=performance.now();PROF[k]=(PROF[k]||0)+n-_pt;_pt=n;};
  if(MODE==='god'){
    let dtH=0;if(!G.paused&&!PAUSED){const hh=hod();const night=(hh>22.3||hh<4.6)&&!(G.raid&&G.raid.active)&&!buildings.some(b=>b.fire)&&G.speed<10;dtH=dt/HOUR_REAL*G.speed*(night?3:1);}
    if(G.phase==='pick'||G.phase==='shape'){if(G.phase==='pick')startAuto+=dt;dtH=0;updateAnimals(dt/HOUR_REAL);}
    gameStep(dtH);updateBoats(dtH);netFrame(dt);PT('game');
    if(G.phase==='shape'){envT+=dt;if(envT>1.5){envT=0;envRep=null;updateUI();}}
    setTime(G.menu?menuSkyHour():hod());
    const rv=G.rain>0||G.snow>0?1:0;rainU.uA.value+=((rv?.55:0)-rainU.uA.value)*Math.min(1,dt*1.5);rainU.uSnow.value=seasonN()===3||G.snow>0?1:0;rainU.uT.value=TT;rainU.uC.value.set(cam.tx,cam.ty,cam.tz);rainMesh.visible=rainU.uA.value>.01;
    const dim=rainU.uA.value*1.1;sun.intensity*=1-dim*.55;hemi.intensity*=1-dim*.25;skyU.top.value.lerp(_c2.setRGB(.42,.45,.5),dim*.6);skyU.hor.value.lerp(_c2.setRGB(.6,.62,.65),dim*.5);scene.fog.color.copy(skyU.hor.value);
    if(flash>0){hemi.intensity+=flash*2.5;flash=Math.max(0,flash-dt*5);}
    for(const b of bolts){b.t-=dt;b.L.material.opacity=Math.max(0,b.t/.35);}bolts=bolts.filter(b=>{if(b.t<=0){scene.remove(b.L);b.L.geometry.dispose();return false;}return true;});
    SIM.steps=G.paused?0:waterU.uIce.value>.7?1:(G.speed>=3?6:4);
    updateSites(dt);
    for(const b of buildings)if(b._flames&&b.fire)for(const f of b._flames){const s=.75+.3*Math.sin(TT*13+f.userData.ph)+.15*Math.sin(TT*29+f.userData.ph);f.scale.set(1,s,1);}
    for(const g of markGrp.children){const f=g.userData.flag;if(f)f.rotation.y=Math.sin(TT*2.3+g.position.x)*.4;}
    PT('godmisc');renderAgents();PT('agents');
    rainbow.visible=G.rainbow>0;if(rainbow.visible){rainbow.userData.t=Math.min(1,(rainbow.userData.t||0)+dt*.3);const c=G.center||{x:cam.tx,z:cam.tz};const sd=skyU.sunDir.value;rainbow.position.set(c.x-sd.x*200,hAt(c.x,c.z)-10,c.z-sd.z*200);rainbow.rotation.y=Math.atan2(-sd.x,-sd.z);}else rainbow.userData.t=0;
    if(G.sun>0){sun.intensity*=1.12;}if(G.storm>0&&rnd()<dt*.6){flash=.6;sfx('thunder');}
    uiT+=dt;if(uiT>.25&&!G.menu){uiT=0;updateUI();godInspector();}
    saveT+=dt;if(saveT>90&&!G.menu&&(G.phase==='play'||G.phase==='shape')){saveT=0;autoSave();}
    if(G.phase==='pick'&&startAuto>60)autoChooseStart();
    audioUpdate(dt);
    if(festObj&&nightF>.5&&rnd()<dt*1.4){const [fx,fz]=festSpot();const y=hAt(fx,fz)+14+rnd()*6,x=fx+(rnd()-.5)*14,z=fz+(rnd()-.5)*14;const c=pickA([[1,.4,.3],[1,.85,.3],[.5,.8,1],[.7,1,.5],[1,.6,.9]]);
      for(let i=0;i<40;i++){const a=rnd()*TAU,e=rnd()*PI-PI/2,sp=4+rnd()*3;spawn(x,y,z,Math.cos(a)*Math.cos(e)*sp,Math.sin(e)*sp,Math.sin(a)*Math.cos(e)*sp,1.4,.5,c[0],c[1],c[2],3);}sfx('pop');}
  }
  PT('god');
  if(!SIM.paused&&MODE!=='title'&&!PAUSED)for(let s=0;s<SIM.steps;s++)simStep();PT('sim');
  updateWaterMesh();PT('water');waterU.uTime.value=TT;waterU.uRain.value=rainU.uSnow.value?0:rainU.uA.value;
  {skyU.uTime.value=TT;CLOUDU.uCT.value=TT;const sunny=MODE==='god'&&G.sun>0;const tgt=clamp(.42+rainU.uA.value*.5+(MODE==='god'&&G.storm>0?.3:0)-(sunny?.25:0),.12,.95);skyU.uCloud.value+=(tgt-skyU.uCloud.value)*Math.min(1,dt*.3);
   skyU.uDay.value=waterU.uDay.value;CLOUDU.uCS.value=.22*clamp((waterU.uDay.value-.35)/.65,0,1)*clamp(skyU.uCloud.value*1.6-.2,0,1);}
  aoT+=dt;if(aoT>1.5){aoT=0;updateAO();}
  PT('misc');recolorStep(Math.ceil(S/24));PT('recolor');
  drownT+=dt;if(drownT>1.5){drownT=0;const n=trees.length;for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.t!==4&&wAt(t.x,t.z)>(t.t===3?1.2:.7))trees.splice(i,1);}if(n!==trees.length){treesDirty=true;gridDirty=true;}}
  evalT+=dt;if(evalT>.25&&buildings.length&&!painting){evalT=0;for(let q=0;q<3;q++){evalI=(evalI+1)%buildings.length;const b=buildings[evalI];if(!b)break;const s=sigOf(analyze(b));if(s!==b.sig){realize(b);if(selected===b)showInspector();}}}
  treeT+=dt;if(typeof TREE2!=='undefined'){TREE2.u.uTime.value=TT;TREE2.u.uWind.value=1+rainU.uA.value*1.5;if(Math.hypot(cam.tx-TREE2.cx,cam.tz-TREE2.cz)>20)treesDirty=true;}PT('misc');if(treesDirty&&treeT>.25){treeT=0;rebuildTrees();}PT('trees');
  if(MODE==='sandbox')updateGhost(now);updateRing();
  for(const b of buildings)for(const a of b.anims){const o=a.obj;if(!o)continue;
    if(a.type==='spin')o.rotation[a.axis]+=a.speed*dt*(MODE==='god'&&G.paused?0:1);
    else if(a.type==='flag')o.rotation.y=a.base+Math.sin(TT*2.6+a.ph)*.45+Math.sin(TT*5.3+a.ph)*.12;
    else if(a.type==='swing')o.rotation.x=Math.sin(TT*1.7+a.ph)*.12;
    else if(a.type==='flame'){const f=.8+.25*Math.sin(TT*17+a.ph)+.15*Math.sin(TT*31+a.ph*2);o.scale.set(1+.1*Math.sin(TT*13+a.ph),f,1+.1*Math.cos(TT*11+a.ph));}}
  if(MODE==='sandbox'&&!PAUSED)updateAnimals(dt/HOUR_REAL);
  PT('misc');drawAnimals(TT,dt,cam.tx,cam.tz,cam.dist);PT('animals');updateGrass(dt,TT,cam.tx,cam.tz,cam.dist);PT('grass');updateMeteors(dt);
  if(shake>0){camera.position.x+=(rnd()-.5)*shake*1.6;camera.position.y+=(rnd()-.5)*shake*1.2;camera.position.z+=(rnd()-.5)*shake*1.6;shake=Math.max(0,shake-dt*1.2);}
  updateParticles(MODE==='god'&&G.paused?dt*.15:dt);
  if(MODE!=='god'&&(Math.abs(sun.target.position.x-cam.tx)>8||Math.abs(sun.target.position.z-cam.tz)>8))setTime(hour);
  if(MODE==='sandbox'){statT+=dt;if(statT>.5){statT=0;updateStats();}}
  {const ext=clamp(cam.dist*.9+25,60,230),sc=sun.shadow.camera;if(Math.abs(sc.right-ext)>ext*.08){sc.left=-ext;sc.right=ext;sc.top=ext;sc.bottom=-ext;sc.updateProjectionMatrix();}}
  PT('misc');renderer.render(scene,camera);PT('render');PROF.frames=(PROF.frames||0)+1;requestAnimationFrame(frame);
}
function layout(){applyUI();}
function applyUI(){const ui=clamp(Math.min(innerWidth/1500,innerHeight/900),.55,1)*(SETS.ui||1);document.documentElement.style.setProperty('--ui',ui);
  const bar=MODE==='god'?$('gtop'):$('top');const tb=bar.classList.contains('hidden')?12:bar.getBoundingClientRect().bottom+10;
  toolsEl.style.top=tb+'px';toolsEl.style.maxHeight=Math.max(80,(innerHeight-tb-14)/ui)+'px';
  const pr=$('prayers');pr.style.top=tb+'px';pr.style.maxHeight=Math.max(60,(innerHeight*.64-tb)/ui+160)+'px';
  let it=tb;if(MODE==='god'&&!pr.classList.contains('hidden'))it=pr.getBoundingClientRect().bottom+10;
  insp.style.top=it+'px';insp.style.maxHeight=Math.max(80,(innerHeight-it-14)/ui)+'px';
  const tr=toolsEl.getBoundingClientRect();hintEl.style.left=(tr.right+14)+'px';hintEl.style.bottom=(64*ui)+'px';hintEl.style.display=innerWidth<1000?'none':'';}
addEventListener('resize',layout);
newWorld(1337);setTime(15.5);cam.dist=175;cam.pitch=.7;
applyUI();setTimeout(()=>{enterMenu(true);},30);
$('prayers').addEventListener('click',e=>{if(e.target.tagName==='H3'){$('prayers').classList.toggle('collapsed');applyUI();}});
requestAnimationFrame(frame);
// fast-forward for balancing (headless)
window.HM={addBuilding,rebuildTrees,rebuildGrass,prof(){const o={};for(const k in PROF)if(k!=='frames')o[k]=+(PROF[k]/PROF.frames).toFixed(2);o.frames=PROF.frames;for(const k in PROF)delete PROF[k];return o;},generate,newRecord,realize,spawnAnimal,wAt,hAt,killAnimal,MODELS,startShaping,callSettlers,animals,envScan,launchMeteor,G2:()=>G,preview(w,seed){WORLD=w;newWorld(seed);},dbgGhost:()=>({err:ghostErr,info:!!ghostInfo,hover,tool,gb:!!ghostB,mode:MODE}),bedsFree,dbgPlan(){const sites=buildings.filter(siteProj);return {sites:sites.map(s=>s.type),needs:pickNeed(sites).map(n=>n.type+(n.variant||'')+':'+(findSite(n)?'ok':'FAIL')),pop:popN(),p:planTick.toString().length};},G,buildings,trees,cam,startGod,startSandbox,chooseStart,autoChooseStart,popN,setSpeed,godKey,castPower,setTool,
  ff(hours,simEvery=.25){let acc=0;const st=.05;for(let t=0;t<hours;t+=st){gameStep(st);acc+=st;if(acc>=simEvery){acc=0;for(let s=0;s<4;s++)simStep();}}rebuildTrees();updateWaterMesh(true);updateUI(true);},
  snap(){return {day:dayN(),year:yearN(),season:SEASONS[seasonN()],pop:popN(),hap:Math.round(G.hap),faith:Math.round(G.faith),food:Math.round(G.food),wood:Math.round(G.wood),stone:Math.round(G.stone),era:ERAS[G.era].name,
    b:buildings.reduce((a,b)=>(a[b.type+(b.variant?':'+b.variant:'')+(b.build?'*':'')]=(a[b.type+(b.variant?':'+b.variant:'')+(b.build?'*':'')]||0)+1,a),{}),hf:G.hapF,homeless:G.vill.filter(v=>!v.home&&!v.arriving).length,
    jobs:G.vill.reduce((a,v)=>(a[v.job||'-']=(a[v.job||'-']||0)+1,a),{}),prayers:G.prayers.map(p=>p.k),prodY:G.prodY,cons:Math.round(G.cons||0),sk:Object.fromEntries(Object.keys(SKN).map(k=>[k,skLvl(k)])),unl:Object.keys(G.unl),fish:+(G.fish||0).toFixed(2),animals:animals.length,boats:G.boatsBuilt,env:G.env&&{f:+G.env.fishPot.toFixed(2),g:+G.env.gamePot.toFixed(2),a:+G.env.farmPot.toFixed(2)},fail:Object.keys(G.failCool).filter(k=>G.failCool[k]>G.t),raids:G.raids,deaths:G.deaths,births:G.births,arr:G.arrivals};}};
