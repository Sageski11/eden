'use strict';
// ================================================================ GOD GAME — state, time, pathfinding, villagers
let MODE='title';
const HOUR_REAL=4,DPS=5;
const SEASONS=['Spring','Summer','Autumn','Winter'];
const ERAS=[{name:'Stone Age',pop:0,cap:300,intro:'a stone age camp'},{name:'Bronze Age',pop:10,cap:450,intro:'the Bronze Age'},{name:'Iron Age',pop:24,cap:700,intro:'the Iron Age'},{name:'Medieval',pop:50,cap:1000,intro:'a medieval town'},{name:'High Medieval',pop:100,cap:1500,intro:'a great medieval city'},
  {name:'Industrial',pop:170,cap:2200,intro:'the Industrial Age'},{name:'Modern',pop:320,cap:3200,intro:'the Modern Age'},{name:'Futuristic',pop:520,cap:4500,intro:'a future of glass and light'}];
const GC=2,GN=N/GC,NN=GN*GN;
const G={};
const rnd=Math.random,pickA=a=>a[Math.floor(rnd()*a.length)];
const NM=['Aldric','Bram','Cedric','Duncan','Edric','Finn','Gareth','Hugh','Ivo','Jory','Kenric','Leof','Merek','Osric','Piers','Roland','Simon','Tobin','Ulric','Wat','Alard','Bertram','Godwin','Hamon','Odo','Rolf','Walter','Giles','Ansel','Benedict','Robin','Hal'];
const NF=['Agnes','Beatrix','Cecily','Edith','Elena','Gisela','Hilda','Isolde','Joan','Juliana','Linnet','Mabel','Matilda','Maud','Nell','Odila','Rosamund','Sybil','Tilda','Wynn','Alys','Emma','Ida','Avice','Margery','Petra','Eleanor','Ysolde','Eda','Rose'];
const FAM=['Ashby','Brook','Cooper','Thatcher','Miller','Fletcher','Wright','Hollins','Marsh','Fenwick','Underwood','Hale','Tanner','Shepherd','Carter','Fisher','Mason','Baker','Woodward','Reeve','Croft','Fairweather','Ridley','Stone','Ashdown','Merriman'];
function townName(){return pickA(['Ash','Oak','Bram','Thorn','Wil','Elder','Stan','Mer','Holl','Ral','Wend','Fen','Briar','Kings','Red','Cold','Hart','Lark'])+pickA(['ford','mere','by','ton','wick','stead','holm','dale','bury','well','brook','field']);}
function resetG(){for(const k in G)delete G[k];if(typeof netReset==='function')netReset();Object.assign(G,{dev:devNew(),tf:tfNew(),t:7,speed:1,paused:false,faith:160,food:70,wood:45,stone:0,era:0,hap:62,hapT:62,hapF:{},
  vill:[],bandits:[],markers:[],prayers:[],chron:[],center:null,rain:0,rainI:1,drought:false,snowmelt:0,harvest:0,festival:0,festCool:0,raid:null,raidCool:40,
  sad:0,grief:0,joy:0,nextV:1,town:townName(),phase:'pick',wantHouse:[],lastDay:-1,lastHour:-1,pid:1,flooded:0,floodMap:new Uint8Array(NN),siteFail:null,noTrees:false,
  follow:null,pathBudget:0,prod:{food:0,wood:0,stone:0},prodY:{food:0,wood:0,stone:0},failCool:{},sk:{wood:0,work:0,stone:0,farm:0,fish:0,hunt:0},unl:{},fish:1,boatsBuilt:0,boatWork:0,sun:0,snow:0,rainbow:0,storm:0,env:null,lastRain:-99,noGame:false,cons:0,firstHut:false,raids:0,births:0,deaths:0,arrivals:0,prayerCool:{},plagueCool:0,lastFest:-9,storm:0});if(typeof sInit==='function')sInit();}
const dayN=()=>Math.floor(G.t/24),hod=()=>G.t%24,seasonN=()=>Math.floor(dayN()/DPS)%4,yearN=()=>Math.floor(dayN()/(DPS*4))+1,dayInSeason=()=>dayN()%DPS+1;
const isSunday=()=>dayN()%7===6;
const dateStr=()=>`Year ${yearN()}, ${SEASONS[seasonN()]}, day ${dayInSeason()}`;
const hhmm=h=>`${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor((h%1)*60)).padStart(2,'0')}`;
// building lookups are indexed (rebuilt only when the set of buildings changes, completes, or the settlement is swapped)
let BVER=0,SWAPV=0;const BI={len:-1,ver:-1,swap:-1,byId:new Map(),done:new Map()};
function bIdx(){if(BI.len===buildings.length&&BI.ver===BVER&&BI.swap===SWAPV)return BI;BI.len=buildings.length;BI.ver=BVER;BI.swap=SWAPV;BI.byId.clear();BI.done.clear();
  for(const b of buildings){BI.byId.set(b.id,b);if(!b.build){let l=BI.done.get(b.type);if(!l)BI.done.set(b.type,l=[]);l.push(b);}}return BI;}
const bById=id=>id?(bIdx().byId.get(id)||null):null;
const done=b=>b&&!b.build;
const built=t=>bIdx().done.get(t)||[];
const hasBuilt=t=>bIdx().done.has(t);
const adults=()=>G.vill.filter(v=>v.age>=14&&!v.leaving);
const popN=()=>G.vill.filter(v=>!v.leaving&&!v.arriving).length;
function chron(txt,major){if(typeof TOWNS!=='undefined'&&TOWNS.list.length>1&&G.town&&!txt.includes(G.town))txt=G.town+': '+txt;G.chron.unshift({d:dateStr(),t:txt,m:!!major});if(G.chron.length>300)G.chron.pop();if(major)toast(txt.length>70?txt.slice(0,68)+'…':txt);}
function toW2(b,lx,lz){const cs=Math.cos(b.rot),sn=Math.sin(b.rot);return [b.x+lx*cs+lz*sn,b.z-lx*sn+lz*cs];}
function doorOf(b){if(b.type==='farm'){const a=rnd()*TAU;return toW2(b,Math.cos(a)*3.5,Math.sin(a)*2.5);}
  const dz=b.type==='house'?(b.d||3)/2+.7:b.type==='hall'?(b.level?2.9:0):b.r*.85;return toW2(b,b.type==='hall'&&!b.level?1.6:0,dz);}

// ---------------------------------------------------------------- pathfinding grid
const gCost=new Float32Array(NN),gOcc=new Int32Array(NN);let gridDirty=true;
// Routes between the same two grid cells (same blocking building) are the same route until the grid changes: remember them.
const PCACHE=new Map();let GVER=0;const PCST={hit:0,miss:0};
function rebuildGrid(){
  for(let gj=0;gj<GN;gj++)for(let gi=0;gi<GN;gi++){const x=gi*GC+1-HALF,z=gj*GC+1-HALF,k=gj*GN+gi;
    const w=wAt(x,z),sl=Math.max(Math.abs(hAt(x+1.2,z)-hAt(x-1.2,z)),Math.abs(hAt(x,z+1.2)-hAt(x,z-1.2)))/2.4;
    let c=1+sl*2.2;if(sl>1.3||w>.6)c=Infinity;else if(w>.12)c+=5;
    if(c<Infinity&&sampleArr(ROAD,x,z)>.3)c*=.6;gCost[k]=c;}
  gOcc.fill(0);
  for(const b of allB()){if(b.type==='farm')continue;const r=b.r*.7;const i0=Math.floor((b.x-r+HALF)/GC),i1=Math.floor((b.x+r+HALF)/GC),j0=Math.floor((b.z-r+HALF)/GC),j1=Math.floor((b.z+r+HALF)/GC);
    for(let j=Math.max(0,j0);j<=Math.min(GN-1,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(GN-1,i1);i++){const x=i*GC+1-HALF,z=j*GC+1-HALF;if(Math.hypot(x-b.x,z-b.z)<r)gOcc[j*GN+i]=b.id;}}
  gridDirty=false;GVER++;PCACHE.clear();labelComps();
}
// connected regions of walkable ground: a villager whose goal lies in another region can never walk there, so they are not
// left searching forever (and a failed search never floods a whole region); they are carried to the nearest ground that connects.
const gComp=new Int32Array(NN);
function labelComps(){gComp.fill(0);let c=0;const st=[];for(let k=0;k<NN;k++){if(gComp[k]||gCost[k]===Infinity)continue;c++;gComp[k]=c;st.push(k);
  while(st.length){const q=st.pop(),qi=q%GN,qj=(q/GN)|0;
    if(qi>0){const n=q-1;if(!gComp[n]&&gCost[n]!==Infinity){gComp[n]=c;st.push(n);}}if(qi<GN-1){const n=q+1;if(!gComp[n]&&gCost[n]!==Infinity){gComp[n]=c;st.push(n);}}
    if(qj>0){const n=q-GN;if(!gComp[n]&&gCost[n]!==Infinity){gComp[n]=c;st.push(n);}}if(qj<GN-1){const n=q+GN;if(!gComp[n]&&gCost[n]!==Infinity){gComp[n]=c;st.push(n);}}}}}
function compAt(i,j){const k=j*GN+i;if(gComp[k])return gComp[k];for(let d=0;d<8;d++){const ni=i+DI[d],nj=j+DJ[d];if(ni<0||nj<0||ni>=GN||nj>=GN)continue;const c=gComp[nj*GN+ni];if(c)return c;}return 0;}
function compOfPt(x,z){if(gridDirty)rebuildGrid();const [i,j]=cellOf(x,z);return compAt(i,j);}
function nearestInComp(x,z,comp){if(gridDirty)rebuildGrid();const [ci,cj]=cellOf(x,z);for(let r=0;r<=90;r++){for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=ci+di,j=cj+dj;if(i<1||j<1||i>=GN-1||j>=GN-1)continue;
    if(gComp[j*GN+i]===comp)return [i*GC+1-HALF,j*GC+1-HALF];}}return null;}
// a place for newcomers to appear that really connects to the town
function reachableSpawn(ex,ez,tx,tz){const c=compOfPt(tx,tz);if(!c||compOfPt(ex,ez)===c)return [ex,ez];const p=nearestInComp(ex,ez,c);return p||[ex,ez];}
const gS=new Float32Array(NN),gSt=new Int32Array(NN),gCl=new Int32Array(NN),gFrom=new Int32Array(NN);let gStamp=0;
const hpK=new Int32Array(NN*4),hpF=new Float32Array(NN*4);let hpN=0;
// binary min-heap on typed arrays (hole-based sifting: no swaps, no allocation)
function hPush(k,f){let i=hpN++;while(i>0){const p=(i-1)>>1;if(hpF[p]<=f)break;hpK[i]=hpK[p];hpF[i]=hpF[p];i=p;}hpK[i]=k;hpF[i]=f;}
function hPop(){const top=hpK[0];hpN--;if(hpN>0){const k=hpK[hpN],f=hpF[hpN];let i=0;for(;;){let c=i*2+1;if(c>=hpN)break;if(c+1<hpN&&hpF[c+1]<hpF[c])c++;if(hpF[c]>=f)break;hpK[i]=hpK[c];hpF[i]=hpF[c];i=c;}hpK[i]=k;hpF[i]=f;}return top;}
const cellOf=(x,z)=>[clamp(Math.floor((x+HALF)/GC),0,GN-1),clamp(Math.floor((z+HALF)/GC),0,GN-1)];
const DI=[1,-1,0,0,1,1,-1,-1],DJ=[0,0,1,-1,1,-1,1,-1],DCOST=[1,1,1,1,1.414,1.414,1.414,1.414];
function findPath(x0,z0,x1,z1,tb,sb,hw,cap){hw=hw||.62;cap=cap||30000;
  if(gridDirty)rebuildGrid();
  const [si,sj]=cellOf(x0,z0),[ti,tj]=cellOf(x1,z1),s=sj*GN+si,t=tj*GN+ti;
  if(s===t)return [[x1,z1]];
  {const cs=compAt(si,sj),ct=compAt(ti,tj);if(cs&&ct&&cs!==ct)return null;}
  const ck=s+':'+t+':'+(tb||0)+':'+(sb||0),hit=PCACHE.get(ck);
  if(hit!==undefined){PCST.hit++;if(hit===null)return null;const out=[];for(let i=0;i<hit.length;i++)out.push([hit[i][0]+(rnd()-.5)*.8,hit[i][1]+(rnd()-.5)*.8]);out.push([x1,z1]);return out;}
  PCST.miss++;
  gStamp++;hpN=0;gS[s]=0;gSt[s]=gStamp;gFrom[s]=-1;hPush(s,0);let it=0,found=false;
  while(hpN&&it<cap){it++;const k=hPop();if(gCl[k]===gStamp)continue;gCl[k]=gStamp;if(k===t){found=true;break;}
    const ki=k%GN,kj=(k/GN)|0;
    const gk=gS[k];
    for(let d=0;d<8;d++){const ni=ki+DI[d],nj=kj+DJ[d];if(ni<0||nj<0||ni>=GN||nj>=GN)continue;const n=nj*GN+ni;if(gCl[n]===gStamp)continue;
      let c=gCost[n];if(n===t&&c===Infinity)c=3;if(c===Infinity)continue;const dc=DCOST[d];
      if(dc>1&&(gCost[kj*GN+ni]===Infinity||gCost[nj*GN+ki]===Infinity))continue;
      const o=gOcc[n];if(o&&o!==tb&&o!==sb)c+=7;
      const g=gk+c*dc;if(gSt[n]===gStamp&&g>=gS[n])continue;gS[n]=g;gSt[n]=gStamp;gFrom[n]=k;
      const hx=ni>ti?ni-ti:ti-ni,hz=nj>tj?nj-tj:tj-nj;hPush(n,g+((hx>hz?hx:hz)+.414*(hx>hz?hz:hx))*hw);}}
  if(PCACHE.size>2500)PCACHE.clear();
  if(!found){if(hw<1&&it>=cap)return findPath(x0,z0,x1,z1,tb,sb,1.6,90000);// a very long way round: look again, more eagerly
    PCACHE.set(ck,null);return null;}
  const cells=[];for(let k=t;k!==-1&&k!==s;k=gFrom[k])cells.push(k);cells.reverse();
  const out=[],base=[];let pdx=9,pdz=9;
  for(let i=0;i<cells.length;i++){const k=cells[i],x=(k%GN)*GC+1-HALF,z=((k/GN)|0)*GC+1-HALF;
    const nk=cells[i+1];if(nk!=null){const dx=(nk%GN)-(k%GN),dz=((nk/GN)|0)-((k/GN)|0);if(dx===pdx&&dz===pdz){continue;}pdx=dx;pdz=dz;}
    base.push([x,z]);out.push([x+(rnd()-.5)*.8,z+(rnd()-.5)*.8]);}
  PCACHE.set(ck,base);
  out.push([x1,z1]);return out;
}

// ---------------------------------------------------------------- villager rendering
const SKIN=[0xe8c8a8,0xd8b090,0xc89878,0xe0bc98,0xb88a68,0x9a6a48,0x7a5038];
const selRing=new THREE.Mesh(new THREE.RingGeometry(.45,.6,24),new THREE.MeshBasicMaterial({color:0xffe080,transparent:true,opacity:.9,depthTest:false,side:THREE.DoubleSide}));selRing.rotation.x=-PI/2;selRing.renderOrder=9;selRing.visible=false;scene.add(selRing);
function renderAgents(){
  drawPeople(allVill().concat(allBandits()),TT);
  const f=G.follow;if(f&&!f.hidden){selRing.visible=true;selRing.position.set(f.x,hAt(f.x,f.z)+.06,f.z);}else selRing.visible=false;
}
// ---------------------------------------------------------------- villagers
function newVillager(o={}){const female=o.female!=null?o.female:rnd()<.5;
  const v=Object.assign({id:G.nextV++,kind:'v',female,name:pickA(female?NF:NM),fam:o.fam||pickA(FAM),age:18+Math.floor(rnd()*22),job:null,home:0,work:0,x:0,z:0,rot:0,
    path:null,pi:0,onArrive:null,timer:0,onDone:null,tick:null,anim:'idle',hidden:false,carry:null,amt:0,mood:60,thought:'',spouse:0,sick:0,hp:3,skin:pickA(SKIN),site:0,lowDays:0},o);
  G.vill.push(v);return v;}
const fullName=v=>`${v.name} ${v.fam}`;
// grief felt by the town is shared out as it grows, so a big city is not crushed by ordinary deaths and fires
function griefAdd(x){G.grief=Math.min(30,G.grief+x*clamp(28/Math.max(28,popN()),.1,1));}
function removeVillager(v,why){v._gone=true;releaseRes(v);const i=G.vill.indexOf(v);if(i>=0)G.vill.splice(i,1);
  for(const o of G.vill)if(o.spouse===v.id)o.spouse=0;if(G.follow===v)G.follow=null;
  if(why==='died'){G.deaths++;griefAdd(3);}}
function setThought(v,t){v.thought=t;}
function goTo(v,x,z,cb,tb){
  x=clamp(x,-HALF+.5,HALF-.5);z=clamp(z,-HALF+.5,HALF-.5);
  const d=Math.hypot(x-v.x,z-v.z);let p=null;
  if(d<2.5)p=[[x,z]];
  else{if(G.pathBudget<=0){v.timer=.04;return false;}G.pathBudget--;p=findPath(v.x,v.z,x,z,tb,v._sb||0);}
  if(!p){if(d<12)p=[[x,z]];else{v._pf=(v._pf||0)+1;if(v._pf>=3){v._pf=0;const c=compOfPt(x,z);if(c){const q=nearestInComp(v.x,v.z,c);if(q){v.x=q[0];v.z=q[1];setThought(v,'Found a way across at last.');v.timer=.1;return false;}}}
    v.timer=.6+rnd();setThought(v,"I can't find a way there…");return false;}}
  v._pf=0;v.path=p;v.pi=0;v.onArrive=cb||null;v.hidden=false;v.anim='walk';return true;
}
function wait(v,h,anim,hidden,onDone,tick){v.timer=h;v.anim=anim||'idle';v.hidden=!!hidden;v.onDone=onDone||null;v.tick=tick||null;}
function moveAlong(v,dtH){
  const k=Math.round(clamp(v.z+HALF,0,N))*S+Math.round(clamp(v.x+HALF,0,N));
  let sp=v.kind==='bandit'?8:7.2;if(ROAD[k]>.3)sp*=1.3;const w=W[k];if(w>.12)sp*=.5;if(v.age<14)sp*=.85;if(v.sick)sp*=.6;
  let rem=sp*dtH;
  while(rem>0&&v.pi<v.path.length){const [tx,tz]=v.path[v.pi],dx=tx-v.x,dz=tz-v.z,d=Math.hypot(dx,dz);
    if(d<=rem){v.x=tx;v.z=tz;rem-=d;v.pi++;wear(v,d);v.wph=(v.wph||0)+d*3.2;}else{v.x+=dx/d*rem;v.z+=dz/d*rem;v.rot=Math.atan2(dx,dz);wear(v,rem);v.wph=(v.wph||0)+rem*3.2;rem=0;}}
  v._mu=sp>0?dtH-Math.max(0,rem)/sp:dtH;return v.pi>=v.path.length;
}
function wear(v,d){if(v.kind==='bandit')return;v.wd=(v.wd||0)+d;if(v.wd<.8)return;v.wd=0;
  const i=Math.round(v.x+HALF),j=Math.round(v.z+HALF);
  for(const [di,dj,f] of [[0,0,1],[1,0,.5],[-1,0,.5],[0,1,.5],[0,-1,.5]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>N||jj>N)continue;const k=jj*S+ii;if(W[k]>.1)continue;ROAD[k]=Math.min(1,ROAD[k]+.016*f*(1-ROAD[k]*.6));}}
function updAgent(v,dtH){
  if(v.path){if(moveAlong(v,dtH)){v.path=null;v.anim='idle';const cb=v.onArrive;v.onArrive=null;if(cb)cb(v);}return;}
  if(v.timer>0){v.timer-=dtH;if(v.tick)v.tick(v,dtH);if(v.timer>0)return;v.tick=null;if(v.onDone){const f=v.onDone;v.onDone=null;f(v);if(v.timer>0||v.path)return;}}
  v.hidden=false;v.anim='idle';
  if(v.kind==='bandit')thinkBandit(v);else think(v);
}
// Same as updAgent, but for a long step taken at once (villagers away from the camera): it reports the hours it used so that
// the caller can go on with what is left, and a villager far from the player works exactly as fast as one beside them.
function updAgentC(v,dtH){
  if(v.path){if(moveAlong(v,dtH)){v.path=null;v.anim='idle';const cb=v.onArrive;v.onArrive=null;if(cb)cb(v);return v._mu;}return dtH;}
  if(v.timer>0){const use=Math.min(dtH,v.timer);v.timer-=dtH;if(v.tick)v.tick(v,dtH);if(v.timer>0)return dtH;v.tick=null;if(v.onDone){const f=v.onDone;v.onDone=null;f(v);}return use;}
  v.hidden=false;v.anim='idle';if(v.kind==='bandit')thinkBandit(v);else think(v);return 0;
}
function coarseStep(v,dtH){let r=dtH;for(let i=0;i<6&&r>1e-4;i++)r-=updAgentC(v,r);}
function goInside(v,b,hours,why,thought){
  if(!b){wait(v,hours,'idle',false);return;}
  const [dx,dz]=doorOf(b);if(thought)setThought(v,thought);
  v._sb=0;goTo(v,dx,dz,vv=>{wait(vv,hours,'idle',true);vv.inside=b.id;},b.id);
}
function sleepHours(){const h=hod();return ((h>=12?24-h:-h)+5.3+rnd()*.9);}
function think(v){
  if(v._res&&(v.job!=='builder'||!bById(v._res.site)||!siteProj(bById(v._res.site))))releaseRes(v);
  if(v.mission)return missionStep(v);
  const h=hod(),home=bById(v.home);v._sb=v.inside||0;v.inside=0;
  if(v.leaving){goTo(v,v.lx,v.lz,vv=>removeVillager(vv,'left'));return;}
  if(v.arriving){if(!G.center){wait(v,1);return;}const [x,z]=doorOf(G.center);goTo(v,x+(rnd()-.5)*3,z+(rnd()-.5)*3,vv=>{vv.arriving=false;assignHomes();assignJobs();});return;}
  if(G.raid&&G.raid.active&&v.job!=='guard'){goInside(v,home||G.center,.8,'hide','Bar the doors! Raiders!');return;}
  if(v.job==='guard'&&G.raid&&G.raid.active&&G.bandits.length)return guardFight(v);
  if(h>=21.5||h<5.2){goInside(v,home||G.center,sleepHours(),'sleep',home?'Home to bed.':'Another night in a tent…');return;}
  if(v.sick){goInside(v,home||G.center,2,'sick','I feel feverish…');return;}
  if(G.festival>0&&h>=9&&h<21.3&&v.age>=4)return festive(v);
  const ch=built('church')[0];
  if(isSunday()&&h>=8&&h<11.5&&ch&&v.job!=='guard'){goInside(v,ch,11.6-h,'church','Sunday service.');return;}
  if(v.age<14)return childPlay(v,home);
  if(h<17.5&&!(v.age>64))return doJob(v);
  return leisure(v,home);
}
function wander(v,cx,cz,r,hrs,th){const a=rnd()*TAU,d=rnd()*r;goTo(v,cx+Math.cos(a)*d,cz+Math.sin(a)*d,vv=>wait(vv,hrs,'idle',false));if(th)setThought(v,th);}
function childPlay(v,home){const b=home||G.center;if(!b){wait(v,1);return;}
  if(rnd()<.3&&G.center){const [x,z]=doorOf(G.center);goTo(v,x+(rnd()-.5)*6,z+(rnd()-.5)*6,vv=>wait(vv,.6+rnd(),'dance',false));setThought(v,pickA(['Tag, you’re it!','Let’s play by the fire!','I’m a knight!']));return;}
  wander(v,b.x,b.z,7,.5+rnd()*.8,pickA(['Look, a frog!','When I grow up I’ll be a smith.','Catch me!']));}
function festive(v){const c=festSpot();goTo(v,c[0]+(rnd()-.5)*8,c[1]+(rnd()-.5)*8,vv=>wait(vv,.8+rnd(),'dance',false));setThought(v,pickA(['What a feast!','Dance with me!','Praise the Spirit of the valley!','More ale!']));}
function festSpot(){const m=built('market')[0]||built('well')[0]||G.center;if(!m)return [0,0];const [x,z]=doorOf(m);return [x,z];}
function leisure(v,home){
  if(typeof fetchWater==='function'&&rnd()<.14&&fetchWater(v))return;
  const tav=built('tavern')[0],mk=built('market')[0]||built('well')[0];
  if(tav&&rnd()<.45&&v.age>=16){goInside(v,tav,1.2+rnd()*1.5,'tavern',pickA(['An ale after a long day.','Did you hear the news?','To the tavern!']));return;}
  if(mk&&rnd()<.5){const [x,z]=doorOf(mk);goTo(v,x+(rnd()-.5)*5,z+(rnd()-.5)*5,vv=>wait(vv,.8+rnd(),'idle',false));setThought(v,pickA(['Lovely evening.','Gossip by the well…','Have you met the new family?']));return;}
  if(home){goInside(v,home,1.5,'home','Supper at home.');return;}
  if(G.center){const [x,z]=doorOf(G.center);goTo(v,x+(rnd()-.5)*4,z+(rnd()-.5)*4,vv=>wait(vv,1,'idle',false));setThought(v,'Warming my hands by the fire.');}else wait(v,1);
}
// ---------------- jobs
function doJob(v){
  switch(v.job){
    case 'builder':return builderTask(v);
    case 'wood':return woodTask(v);
    case 'farmer':return farmTask(v);
    case 'fisher':return fishTask(v);
    case 'quarry':return quarryTask(v);
    case 'forager':return forageTask(v);
    case 'guard':return guardPatrol(v);
    case 'hunter':return huntTask(v);
    case null:case undefined:return forageTask(v);
    default:return serviceTask(v);
  }
}
const seasonFood=()=>[.9,1.15,1.4,0][seasonN()];
function workMul(){return (hasBuilt('smith')?1.2:1)*(.85+G.hap/100*.3)*(typeof eraMul==='function'?eraMul():1)*(typeof waterMul==='function'?waterMul():1);}
function farmRate(f){if(!f||f.build)return 0;let r=.64*seasonFood()*(G.unl.rotation?1.2:1)*(1+(skLvl('farm')-1)*.04)*(G.sun>0?1.25:1)*(G.snow>0?0:1);if(f._mill)r*=1.3;if(G.harvest>0||f.blessUntil>G.t)r*=1.5;if(G.drought)r*=.6;if(wAt(f.x,f.z)>.15)r=0;return r*workMul();}
function storeFor(m,x,z){let best=G.center,bd=G.center?Math.hypot(G.center.x-x,G.center.z-z):1e9;
  for(const b of buildings){if(b.build)continue;const ok=(m==='wood'&&b.type==='camp'&&b.variant==='lumber')||(m==='stone'&&b.type==='quarry');if(!ok)continue;const d=Math.hypot(b.x-x,b.z-z);if(d<bd){bd=d;best=b;}}return best;}
function siteProj(b){return b.build||b.upg;}
function matFrac(P){let f=1;for(const m of ['wood','stone'])if(P.need[m]>0)f=Math.min(f,P.have[m]/P.need[m]);return f;}
// a builder who is taken off a site (new job, death) gives back what he had set aside for it, so the site never waits for timber that nobody is bringing
function releaseRes(v){const r=v._res;if(!r)return;v._res=null;const b=bById(r.site),P=b&&siteProj(b);if(P)P.inb[r.m]=Math.max(0,P.inb[r.m]-r.amt);G[r.m]+=r.amt;if(v.carry===r.m){v.carry=null;v.amt=0;}}
function builderTask(v){
  let site=bById(v.site);if(!site||!siteProj(site)){site=chooseSite(v);v.site=site?site.id:0;}
  if(!site){if(v.carry){const st=G.center;if(st){const m=v.carry,a=v.amt;goTo(v,...doorOf(st),vv=>{G[m]+=a;vv.carry=null;},st.id);return;}}return forageTask(v);}
  const P=siteProj(site);const w0=v._wait||0;v._wait=0;
  if(P.done>=P.work-.03&&matFrac(P)>=1-1e-6){P.done=P.work;completeSite(site);return;}// nothing left to do: never wait for another hammer blow
  if(v.carry){const [x,z]=doorOf(site);setThought(v,`Hauling ${v.carry} to the ${siteName(site)}.`);
    goTo(v,x+(rnd()-.5)*2,z+(rnd()-.5)*2,vv=>{const p=siteProj(site);if(p){p.have[vv.carry]+=vv.amt;p.inb[vv.carry]=Math.max(0,p.inb[vv.carry]-vv.amt);}else G[vv.carry]+=vv.amt;vv.carry=null;vv.amt=0;vv._res=null;wait(vv,.15,'work');},site.id);return;}
  const nw=P.need.wood-P.have.wood-P.inb.wood,ns=P.need.stone-P.have.stone-P.inb.stone;
  const canW=nw>0&&G.wood>=1,canS=ns>0&&G.stone>=1;
  const workable=P.done<P.work*matFrac(P)-.02;
  if((canW||canS)&&!(workable&&rnd()<.4)){const m=canS&&(!canW||rnd()<.5)?'stone':'wood';const amt=Math.min(5,m==='wood'?nw:ns,Math.floor(G[m]));
    G[m]-=amt;P.inb[m]+=amt;v._res={site:site.id,m,amt};const st=storeFor(m,site.x,site.z);setThought(v,`Fetching ${m} for the ${siteName(site)}.`);
    if(!goTo(v,...doorOf(st),vv=>{vv.carry=m;vv.amt=amt;wait(vv,.2,'work');},st.id)){G[m]+=amt;P.inb[m]=Math.max(0,P.inb[m]-amt);v._res=null;}return;}
  if(workable){const a=rnd()*TAU,r=site.r*.9+.4;setThought(v,pickA([`Raising the ${siteName(site)}.`,'Hammer and nails…','Steady that beam!']));
    goTo(v,site.x+Math.cos(a)*r,site.z+Math.sin(a)*r,vv=>{vv.rot=Math.atan2(site.x-vv.x,site.z-vv.z);wait(vv,1.2,'work',false,null,(w,dt)=>{const p=siteProj(site);if(!p)return;
      const pd=p.done;p.done=Math.min(p.work*matFrac(p),p.done+dt*workMul()*(p.blessed?2.5:1));if(p.done>pd){gainXP('work',(p.done-pd)*.5*(p.need.wood>0?1:.3));if(p.need.stone>0)gainXP('stone',(p.done-pd)*.18);}G.hammer=(G.hammer||0)+dt;if(p.done>=p.work-1e-6&&matFrac(p)>=1)completeSite(site);});},site.id);return;}
  setThought(v,G.wood<1&&nw>0?'Waiting for timber…':G.stone<1&&ns>0?'We need stone — is there a quarry?':'Waiting for materials…');
  // a site that cannot be worked (no stone, no timber) must not hold every builder: after two idle turns try another one
  if(w0>=1&&siteCount()>1){v._skip=site.id;v._skipT=G.t+8;v.site=0;v._wait=0;}else v._wait=w0+1;
  const [x,z]=doorOf(site);goTo(v,x+(rnd()-.5)*3,z+(rnd()-.5)*3,vv=>wait(vv,.7,'idle'));
}
function siteCount(){let n=0;for(const b of buildings)if(siteProj(b))n++;return n;}
function chooseSite(v){const all=buildings.filter(b=>siteProj(b));if(!all.length)return null;
  const cnts=new Map();for(const o of G.vill)if(o.site&&o.job==='builder')cnts.set(o.site,(cnts.get(o.site)||0)+1);
  // a small job does not need a crowd: sites with room come first, so houses and fields are not left waiting while a camp has five hands
  const room=s=>{const P=siteProj(s);const cap=s.type==='castle'?6:Math.max(1,Math.min(8,Math.ceil(P.work/3)));return (cnts.get(s.id)||0)<cap;};
  let sites=all.filter(room);if(!sites.length)sites=all;
  {const ok=sites.filter(s=>!(v._skip===s.id&&G.t<v._skipT));if(ok.length)sites=ok;}
  let best=null,bs=1e9;for(const s of sites){const n=cnts.get(s.id)||0;const big=SITE_PRIORITY[s.type]||0,sc=Math.hypot(s.x-v.x,s.z-v.z)*.05+(G.center?Math.hypot(s.x-G.center.x,s.z-G.center.z)*.03:0)+n*2-(s.type==='house'?1:0)-(siteProj(s).blessed?2:0)+(s.upg?2:0)-(!s.upg&&n<(s.type==='castle'?4:2)?big:0);if(sc<bs){bs=sc;best=s;}}return best;}
// large civic works must not be starved of builders by the many small jobs of a big town
const SITE_PRIORITY={castle:8,church:5,market:4,tavern:3,mill:3,smith:3,school:4,factory:5,station:5,powerplant:6,fusion:6,tower:2,mason:3,sawmill:3,shipyard:3};
function siteName(b){return b.type==='house'?(b.upg?'house':'new home'):b.type==='camp'?(b.variant==='lumber'?'lumber camp':b.variant==='fish'?'fishing camp':'camp'):(BT[b.type]||b.type).toLowerCase();}
// trees in 16-unit cells so a woodcutter only looks near the camp
const TI={h:-9,cells:new Map()};const _tk=(i,j)=>(i+64)*256+(j+64);
function treeCells(){const h=Math.floor(G.t*2);if(TI.h===h)return TI.cells;TI.h=h;TI.cells.clear();for(const t of trees){if(t.t===4||t.t===5||t.s<.6)continue;const k=_tk(Math.floor(t.x/16),Math.floor(t.z/16));let a=TI.cells.get(k);if(!a)TI.cells.set(k,a=[]);a.push(t);}return TI.cells;}
function pickTree(v,base){const cells=treeCells(),ci=Math.floor(base.x/16),cj=Math.floor(base.z/16);let bt=null,bd=1e9;
  for(let di=-3;di<=3;di++)for(let dj=-3;dj<=3;dj++){const l=cells.get(_tk(ci+di,cj+dj));if(!l)continue;for(const t of l){if(t.res&&G.t-t.res<8)continue;const d=Math.hypot(t.x-base.x,t.z-base.z);if(d<46){const dv=Math.hypot(t.x-v.x,t.z-v.z)+d*.5;if(dv<bd){bd=dv;bt=t;}}}}return bt;}
function woodTask(v){
  const base=bById(v.work)||G.center;if(!base)return wait(v,1);
  if(v.carry==='wood'){setThought(v,'A fine log for the store.');goTo(v,...doorOf(base),vv=>{G.wood+=vv.amt;G.prod.wood+=vv.amt;vv.carry=null;wait(vv,.2);},base.id);return;}
  let bt=pickTree(v,base);if(bt&&trees.indexOf(bt)<0){TI.h=-9;bt=pickTree(v,base);}// the index is refreshed twice an hour; a felled tree is never chosen
  if(!bt){G.noTrees=true;setThought(v,'No trees left near the camp!');return forageTask(v);}
  bt.res=G.t;setThought(v,'Off to fell a tree.');
  goTo(v,bt.x+.7,bt.z+.4,vv=>{vv.rot=Math.atan2(bt.x-vv.x,bt.z-vv.z);wait(vv,1.3,'work',false,ww=>{const i=trees.indexOf(bt);if(i>=0){trees.splice(i,1);treesDirty=true;}ww.carry='wood';ww.amt=Math.round((6*bt.s*workMul()+1.5)*(G.unl.axes?1.2:1)*(sawStaffed()?1.25:1));gainXP('wood',1);});});
}
function farmTask(v){const f=bById(v.work);if(!f||f.build||seasonN()===3)return forageTask(v);
  const [x,z]=toW2(f,(rnd()-.5)*7.5,(rnd()-.5)*5.5);setThought(v,pickA(['Tending the rows.','Good soil this year.','My back aches from hoeing.']));
  goTo(v,x,z,vv=>wait(vv,1.4,'work',false,null,(w,dt)=>{const r=farmRate(f)*dt;G.food+=r;G.prod.food+=r;gainXP('farm',r*.12);}),f.id);}
function fishTask(v){const c=bById(v.work);if(!c||c.build)return forageTask(v);
  if(c.type==='dock'){const [dx,dz]=doorOf(c);setThought(v,G.boatsBuilt?'Out on the boat with the nets!':'Mending nets on the pier.');
    goTo(v,dx,dz,vv=>{vv.inside=c.id;wait(vv,Math.max(1,Math.min(3,17.5-hod())),G.boatsBuilt?'idle':'work',!!G.boatsBuilt,null,(w,dt)=>{const r=.42*(G.boatsBuilt?2:1)*fishMul()*fishAt(c.x,c.z)*dt;G.food+=r;G.prod.food+=r;G.fish=Math.max(.05,(G.fish||1)-r/Math.max(60,(G.env?G.env.deepCells:400)*.25));gainXP('fish',r*.15);});},c.id);return;}
  if(!c._spot)c._spot=findShore(c.x,c.z,12)||[c.x,c.z];
  setThought(v,seasonN()===3?'Fishing through the ice.':'The fish are biting!');
  goTo(v,c._spot[0]+(rnd()-.5)*2,c._spot[1]+(rnd()-.5)*2,vv=>{vv.rot=Math.atan2(c._spot[0]-c.x,c._spot[1]-c.z);wait(vv,1.8,'work',false,null,(w,dt)=>{const r=.42*fishMul()*fishAt(c.x,c.z)*workMul()*dt;G.food+=r;G.prod.food+=r;G.fish=Math.max(.05,(G.fish||1)-r/Math.max(60,(G.env?G.env.deepCells:400)*.25));gainXP('fish',r*.15);});});}
function findShore(x,z,R){let best=null,bd=1e9;for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const d=Math.hypot(dx,dz);if(d>=bd)continue;if(wAt(x+dx,z+dz)<.05&&(wAt(x+dx+1,z+dz)>.3||wAt(x+dx-1,z+dz)>.3||wAt(x+dx,z+dz+1)>.3||wAt(x+dx,z+dz-1)>.3)){bd=d;best=[x+dx,z+dz];}}return best;}
function quarryTask(v){const q=bById(v.work);if(!q||q.build)return forageTask(v);
  if(v.carry==='stone'){goTo(v,...toW2(q,-2.8,2.4),vv=>{G.stone+=vv.amt;G.prod.stone+=vv.amt;vv.carry=null;wait(vv,.2);});return;}
  setThought(v,'Cutting stone blocks.');goTo(v,...toW2(q,(rnd()-.5)*3,(rnd()-.5)*2.5),vv=>wait(vv,1.6,'work',false,ww=>{tfMine(q);ww.carry='stone';ww.amt=Math.round(4*workMul()*(masonStaffed()?1.25:1)*(1+(skLvl('stone')-1)*.05));gainXP('stone',1);}),q.id);}
function forageTask(v){const c=G.center;if(!c)return wait(v,1);
  let tx=c.x+(rnd()-.5)*30,tz=c.z+(rnd()-.5)*30;const near=trees.filter(t=>t.t!==4&&Math.abs(t.x-c.x)<26&&Math.abs(t.z-c.z)<26);if(near.length){const t=pickA(near);tx=t.x+1;tz=t.z+1;}
  setThought(v,seasonN()===3?'Scraping for roots in the snow…':pickA(['Gathering berries and mushrooms.','Collecting kindling and nuts.']));
  goTo(v,tx,tz,vv=>wait(vv,1.5,'work',false,null,(w,dt)=>{const r=.26*[1,1.1,1.25,.3][seasonN()]*dt;G.food+=r;G.prod.food+=r;}));}
function serviceTask(v){const b=bById(v.work);if(!b||b.build)return forageTask(v);
  if(v.job==='shipwright'&&G.unl.boats){setThought(v,'Caulking a new hull.');goTo(v,...doorOf(b),vv=>{vv.inside=b.id;wait(vv,2,'work',true,null,(w,dt)=>{G.boatWork+=dt;gainXP('work',dt*.2);const docks=buildings.filter(o=>o.type==='dock'&&!o.build).length;if(G.boatWork>=14&&G.boatsBuilt<docks*2){G.boatWork=0;G.boatsBuilt++;chron('The shipwrights launched a new fishing boat.',true);}});},b.id);return;}
  if(v.job==='sawyer'){gainXP('work',.4);}if(v.job==='mason'){gainXP('stone',.4);}if(v.job==='machinist'){gainXP('machine',.6);}if(v.job==='scholar'){gainXP('science',.6);}if(v.job==='engineer'){gainXP('machine',.4);gainXP('science',.3);}
  const th={sawyer:'Sawing planks.',mason:'Dressing stone blocks.',fishmonger:'Fresh fish! Fresh fish!',shipwright:'Shaping ribs for a hull.',priest:'Preparing Sunday’s sermon.',miller:'Grinding flour.',smith:'Clang! Clang! Forging tools.',keeper:'Pouring ale and stew.',merchant:'Fresh goods, fair prices!',clerk:'Counting the town’s stores.',machinist:'Tending the machines.',scholar:'Poring over a book of figures.',stationmaster:'Checking the timetable.',engineer:'Watching the gauges.'}[v.job]||'At work.';
  goInside(v,b,Math.max(1,17.5-hod()),'work',th);}
function guardPatrol(v){const b=bById(v.work)||G.center;if(!b)return wait(v,1);const a=rnd()*TAU,r=6+rnd()*14;setThought(v,'Keeping watch.');
  goTo(v,b.x+Math.cos(a)*r,b.z+Math.sin(a)*r,vv=>wait(vv,1,'idle',false));}
function guardFight(v){let bt=null,bd=1e9;for(const b of G.bandits){if(b.flee)continue;const d=Math.hypot(b.x-v.x,b.z-v.z);if(d<bd){bd=d;bt=b;}}
  if(!bt)return guardPatrol(v);setThought(v,'For the town!');
  if(bd<1.3){v.rot=Math.atan2(bt.x-v.x,bt.z-v.z);wait(v,.35,'fight',false,vv=>{if(rnd()<.6)hitBandit(bt,1);if(rnd()<.3){vv.hp-=1;if(vv.hp<=0){chron(`${fullName(vv)} fell defending the town.`,true);removeVillager(vv,'died');}}});return;}
  goTo(v,bt.x,bt.z,null);if(v.path&&v.path.length>3)v.path.length=3;}

function sawStaffed(){return buildings.some(b=>b.type==='sawmill'&&!b.build&&G.vill.some(v=>v.work===b.id));}
function masonStaffed(){return buildings.some(b=>b.type==='mason'&&!b.build&&G.vill.some(v=>v.work===b.id));}
function fishAt(x,z){let n=0;for(let dz=-12;dz<=12;dz+=3)for(let dx=-12;dx<=12;dx+=3)if(wAt(x+dx,z+dz)>.7)n++;return clamp(.35+n/30,.35,1.15);}
function arrowFx(v,a){const y0=hAt(v.x,v.z)+1,y1=hAt(a.x,a.z)+.7;for(let q=0;q<6;q++){const f=q/6;spawn(lerp(v.x,a.x,f),lerp(y0,y1,f)+Math.sin(f*PI)*.6,lerp(v.z,a.z,f),(a.x-v.x)*.3,0,(a.z-v.z)*.3,.25,.22,.85,.75,.45,2);}}
function huntTask(v){const L=bById(v.work);if(!L||L.build)return forageTask(v);
  v.weapon=G.unl.bows?'tBow':'tSpear';v.act='hunter';
  if(v.carry==='meat'){setThought(v,'Venison for the stores!');goTo(v,...doorOf(L),vv=>{const f=vv.amt*(G.unl.smoking?1.3:1);G.food+=f;G.prod.food+=f;vv.carry=null;gainXP('hunt',3);wait(vv,.3);},L.id);return;}
  let best=null,bd=1e9;for(const a of animals){if(SPEC[a.sp].nohunt)continue;const dl=Math.hypot(a.x-L.x,a.z-L.z);if(dl>75)continue;if(a.hunted&&a.hunted!==v.id&&G.t-(a.huntT||0)<3)continue;const dv=Math.hypot(a.x-v.x,a.z-v.z)+(a.sp==='hare'?12:a.sp==='fox'?16:0);if(dv<bd){bd=dv;best=a;}}
  if(!best){G.noGame=true;setThought(v,'The woods are empty of game…');return forageTask(v);}
  best.hunted=v.id;best.huntT=G.t;setThought(v,`Stalking a ${SPEC[best.sp].n.toLowerCase()}.`);
  const range=v.weapon==='tBow'?8:1.3,ang=Math.atan2(v.x-best.x,v.z-best.z);
  goTo(v,best.x+Math.sin(ang)*range*.85,best.z+Math.cos(ang)*range*.85,vv=>{if(!animals.includes(best))return;const d=Math.hypot(best.x-vv.x,best.z-vv.z);vv.rot=Math.atan2(best.x-vv.x,best.z-vv.z);if(d>range*1.7)return;
    wait(vv,.4,vv.weapon==='tBow'?'aim':'fight',false,ww=>{if(!animals.includes(best))return;if(ww.weapon==='tBow')arrowFx(ww,best);
      if(rnd()<(ww.weapon==='tBow'?.62:.4)+skLvl('hunt')*.04){best.hp--;if(best.hp<=0){killAnimal(best);ww.carry='meat';ww.amt=SPEC[best.sp].food*best.sc;setThought(ww,`Brought down a ${SPEC[best.sp].n.toLowerCase()}!`);gainXP('hunt',2);return;}}
      const dx=best.x-ww.x,dz=best.z-ww.z,dd=Math.hypot(dx,dz)||1;best.tx=best.x+dx/dd*16;best.tz=best.z+dz/dd*16;best.state='flee';
      if(best.sp==='boar'&&ww.weapon!=='tBow'&&rnd()<.12){ww.hp-=1;setThought(ww,'That boar gored me!');if(ww.hp<=0){chron(`${fullName(ww)} was killed by a wild boar.`,true);removeVillager(ww,'died');}}});});}

