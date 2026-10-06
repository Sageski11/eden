'use strict';
// ================================================================ folk terraforming
// The folk reshape the land themselves: they level plots for their buildings, dig quarry pits into hills,
// and, for the big works (draining a marsh, felling a forest, cutting into a mountain), they ask the Spirit's leave.
// The god keeps the final word: Allow, Forbid (plants a Keep-clear banner), or ignore the petition.
function tfNew(){return {pet:[],pid:1,graded:0,mined:0,drained:0,cut:0,mountain:false,cool:{},log:[]};}
function tfEnsure(){if(!G.tf)G.tf=tfNew();const t=G.tf,n=tfNew();for(const k in n)if(t[k]===undefined)t[k]=n[k];return t;}
// how much earth the folk can move per site, by era (hand tools -> machines)
const TF_CAP=[.5,.8,1.3,2,2.8,4.5,7,10];
function tfCap(){return TF_CAP[Math.min(G.era||0,TF_CAP.length-1)];}
function tfExtra(){return Math.max(0,tfCap()-.9);}
function tfMineMax(){const e=G.era||0;return G.tf&&G.tf.mountain?(e>=5?14:7):1.4+e*.1;}
function tfDust(x,z,n,col){const y=hAt(x,z)+.4;col=col||[.62,.55,.45];for(let i=0;i<n;i++){const a=rnd()*TAU,r=rnd()*2.5;spawn(x+Math.cos(a)*r,y,z+Math.sin(a)*r,Math.cos(a)*.7,.4+rnd()*.6,Math.sin(a)*.7,1.6,1.4,col[0],col[1],col[2],0);}}
function tfRegion(x,z,R){return [Math.max(0,Math.floor(x-R+HALF)),Math.max(0,Math.floor(z-R+HALF)),Math.min(N,Math.ceil(x+R+HALF)),Math.min(N,Math.ceil(z+R+HALF))];}
// ---------------- levelling a building plot
function tfGradeSite(b){
  if(MODE!=='god'||G.phase!=='play'||!G.tf||(G.era||0)<1)return;const type=b.type;
  if(type==='dock'||type==='shipyard'||type==='fishmkt'||type==='quarry'||(type==='camp'&&b.variant==='fish'))return;
  const r=TYPE_R[type]||2.5,s=[];for(let i=0;i<17;i++){const a=i/8*TAU,rr=i===16?0:i<8?r*1.05:r*.55;s.push(hAt(b.x+Math.cos(a)*rr,b.z+Math.sin(a)*rr));}
  const mn=Math.min(...s),mx=Math.max(...s),range=mx-mn;if(range<.45)return;
  const tgt=s.reduce((a,v)=>a+v,0)/s.length,cap=tfCap(),R=r*1.25+1.2,[i0,j0,i1,j1]=tfRegion(b.x,b.z,R);let moved=0;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*S+i;if(W[k]>.04)continue;const d=Math.hypot(i-HALF-b.x,j-HALF-b.z);if(d>R)continue;
    const w=d<r*.9?1:1-(d-r*.9)/(R-r*.9),dh=clamp(lerp(H[k],tgt,w)-H[k],-cap,cap);H[k]+=dh;moved+=Math.abs(dh);}
  if(moved<.5)return;refreshTerrain(i0,j0,i1,j1);treesDirty=true;gridDirty=true;tfDust(b.x,b.z,22);
  const T=G.tf;T.graded++;if(range>1.1&&T.graded%4===1)chron(`The builders levelled the ground for the ${siteName(b)}, cutting into the slope.`);
}
// ---------------- quarry pits: stone is dug out of the hillside
function tfMine(q){
  if(MODE!=='god'||!G.tf||!q||q.build)return;const T=G.tf;
  if(!q.pit){let bh=-1e9,ba=0;for(let i=0;i<16;i++){const a=i/16*TAU,h=hAt(q.x+Math.cos(a)*7,q.z+Math.sin(a)*7);if(h>bh){bh=h;ba=a;}}
    q.pit={x:q.x+Math.cos(ba)*3.4,z:q.z+Math.sin(ba)*3.4,depth:0};}
  const P=q.pit,lim=tfMineMax();if(P.depth>=lim)return;
  const amt=.045*(1+(G.era||0)*.3),R=3.8+Math.min(P.depth,6)*.35,[i0,j0,i1,j1]=tfRegion(P.x,P.z,R);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i-HALF-P.x,j-HALF-P.z);if(d>R)continue;const f=.5+.5*Math.cos(PI*d/R);H[j*S+i]-=amt*f;}
  P.depth+=amt;T.mined+=amt;refreshTerrain(i0,j0,i1,j1);gridDirty=true;if(rnd()<.35)tfDust(P.x,P.z,5,[.55,.5,.45]);
}
// ---------------- petitions for the big works
function tfFindMarsh(){const c=G.center;if(!c)return null;let best=null;
  for(let t=0;t<40;t++){const a=rnd()*TAU,r=10+rnd()*40,x=c.x+Math.cos(a)*r,z=c.z+Math.sin(a)*r;if(Math.abs(x)>HALF-10||Math.abs(z)>HALF-10)continue;const w=wAt(x,z);if(w<.04||w>1.1)continue;
    if(G.markers.some(m=>m.k==='forbid'&&Math.hypot(m.x-x,m.z-z)<12))continue;const cl=tfWetBlob(x,z);if(cl&&cl.n>=25&&cl.n<=2600&&cl.max<=1.4&&(!best||cl.n>best.n))best={x:cl.cx,z:cl.cz,n:cl.n};}
  return best;}
function tfWetBlob(x,z){const si=clamp(Math.round(x+HALF),0,N),sj=clamp(Math.round(z+HALF),0,N);let start=-1;
  for(let d=0;d<4&&start<0;d++)for(let dj=-d;dj<=d&&start<0;dj++)for(let di=-d;di<=d;di++){const i=si+di,j=sj+dj;if(i<0||j<0||i>N||j>N)continue;if(W[j*S+i]>.03){start=j*S+i;break;}}
  if(start<0)return null;const seen=new Set([start]),q=[start];let n=0,sx=0,sz=0,mx=0;
  while(q.length&&n<4200){const k=q.pop();n++;const i=k%S,j=(k/S)|0;sx+=i;sz+=j;mx=Math.max(mx,W[k]);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>N||jj>N)continue;const kk=jj*S+ii;if(seen.has(kk)||W[kk]<=.03)continue;seen.add(kk);q.push(kk);}}
  if(n>=4200)return {n,max:9,cx:sx/n-HALF,cz:sz/n-HALF,cells:seen};return {n,max:mx,cx:sx/n-HALF,cz:sz/n-HALF,cells:seen};}
function tfFindForest(){const c=G.center;if(!c)return null;let best=null;
  for(let t=0;t<30;t++){const a=rnd()*TAU,r=18+rnd()*34,x=c.x+Math.cos(a)*r,z=c.z+Math.sin(a)*r;if(Math.abs(x)>HALF-12||Math.abs(z)>HALF-12)continue;
    if(G.markers.some(m=>m.k==='forbid'&&Math.hypot(m.x-x,m.z-z)<14))continue;let n=0;for(const tr of trees)if(tr.t!==4&&tr.t!==5&&(tr.x-x)**2+(tr.z-z)**2<256)n++;if(n>=70&&(!best||n>best.n))best={x,z,n};}
  return best;}
function tfFile(k,o){const T=tfEnsure();const w=dirWord(o.x,o.z);let txt,how,short;
  if(k==='drain'){short='drain the marsh';txt=`The folk ask leave to drain the marsh ${w} of ${G.town} and turn it to fields.`;how='Allowed: farmland grows, but fish, frogs and waterfowl are lost, and springs fail.';}
  else if(k==='clearcut'){short='fell the forest';txt=`The folk ask leave to fell the great wood ${w} of ${G.town} for timber and fields.`;how=`Allowed: about ${o.n} trees fall. Timber and fields — but the game flees and the soil loosens.`;}
  else if(k==='rail'){short=o.short||'lay the railway';txt=o.txt||`The folk ask leave to lay a railway from the station to the works ${w} of ${G.town}.`;how=o.how||'Allowed: the land is cut and filled for the line, trees fall, and it costs 60 wood and 80 stone. Trade and newcomers come — and more smoke.';}
  else if(k==='highway'){short='build the highway';txt=`The folk ask leave to build a highway from ${G.town} to the ${w} edge of the valley.`;how='Allowed: a corridor is graded through the land, costs 80 wood and 140 stone. Cars bring trade and speed — and noise, smoke and scattered game.';}
  else if(k==='terrace'){short='cut terraces for the new streets';txt=`The elders ask leave to cut terraces into the hillside ${w} of ${G.town}, so that streets and homes can be laid out level.`;how='Allowed: the folk will level wide benches along the streets, cutting into slopes and filling hollows. Forbidden: they build only where the land is already gentle.';}
  else{short='cut into the hill';txt=`The quarrymen ask leave to cut deep into the hills ${w} of ${G.town}.`;how='Allowed: the hillside will be scarred and pits dug, but stone flows.';}
  T.pet.push({id:T.pid++,k,x:o.x,z:o.z,n:o.n||0,a:o.a,b:o.b,txt,how,short,until:G.t+5*24,rp:o.rp,cost:o.cost});T.cool[k]=dayN()+8;sfx('chime');}
function tfDaily(){const T=tfEnsure();if(G.phase!=='play'||G.menu||!G.center)return;
  for(const p of T.pet.slice()){if(G.t>p.until){T.pet.splice(T.pet.indexOf(p),1);G.sad=Math.min(20,G.sad+1);T.cool[p.k]=dayN()+10;chron(`The petition to ${p.short} was left unanswered. The folk grumbled.`);}}
  if(T.pet.length>=2||(G.era||0)<2)return;const d=dayN(),p=popN(),can=k=>!(T.cool[k]>d)&&!T.pet.some(q=>q.k===k);
  if(can('drain')&&p>=12&&(G.siteFail||cnt('farm')<2+Math.floor(p/20))&&rnd()<.4){const m=tfFindMarsh();if(m)return tfFile('drain',m);}
  if(can('clearcut')&&p>=14&&(G.siteFail||G.wood<p*.8)&&rnd()<.35){const f=tfFindForest();if(f)return tfFile('clearcut',f);}
  if((G.era||0)>=5){const net=netEnsure();
    if(can('rail')&&typeof railPetition==='function'){const o=railPetition();if(o)return tfFile('rail',o);}
    if(can('highway')&&(G.era||0)>=6&&p>=300&&!net.lines.some(l=>l.kind==='highway')){const c=G.center,t=netEdgeTarget([c.x,c.z]);if(t)return tfFile('highway',{x:t[0],z:t[1],a:(typeof lyGate==='function'&&lyGate(t))||doorOf(c),b:t});}}
  if(can('mountain')&&!T.mountain&&p>=16&&G.stone<90){const q=buildings.find(b=>b.type==='quarry'&&b.pit&&b.pit.depth>=tfMineMax()-.15);if(q&&rnd()<.5)return tfFile('mountain',{x:q.pit.x,z:q.pit.z});}
}
function tfDecide(id,yes){const T=tfEnsure(),p=T.pet.find(q=>q.id===id);if(!p)return;T.pet.splice(T.pet.indexOf(p),1);T.cool[p.k]=dayN()+(yes?12:20);
  if(yes)tfExecute(p);
  else{if(G.markers.filter(m=>m.k==='forbid').length<MKMAX.forbid){G.markers.push({k:'forbid',x:p.x,z:p.z});refreshMarkers();}G.sad=Math.min(20,G.sad+1.5);chron(`The Spirit forbade the folk to ${p.short}. A Keep-clear banner was raised there.`);sfx('deny');}
  if(MODE==='god'){buildToolbox(godToolDefs());updateUI(true);}}
function tfExecute(p){const T=tfEnsure();
  if(p.k==='drain'){const bl=tfWetBlob(p.x,p.z);if(!bl){chron('The marsh had already dried.');return;}
    let lo=1e9,hi=-1e9,i0=N,j0=N,i1=0,j1=0;for(const k of bl.cells){W[k]=0;const i=k%S,j=(k/S)|0;i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j);}
    for(const s of springs)if(Math.hypot(s.x-p.x,s.z-p.z)<22){if(s.base==null)s.base=s.rate;s.base*=.2;s.rate*=.2;}
    let ba=0,bh=1e9;for(let i=0;i<16;i++){const a=i/16*TAU,h=hAt(p.x+Math.cos(a)*34,p.z+Math.sin(a)*34);if(h<bh){bh=h;ba=a;}}
    const ox=p.x+Math.cos(ba)*34,oz=p.z+Math.sin(ba)*34;carvePath([[p.x,p.z],[ox,oz]],hAt(p.x,p.z)-.25,hAt(ox,oz),2.2,.45);
    refreshTerrain(Math.max(0,Math.min(i0,Math.floor(ox+HALF))-6),Math.max(0,Math.min(j0,Math.floor(oz+HALF))-6),Math.min(N,Math.max(i1,Math.ceil(ox+HALF))+6),Math.min(N,Math.max(j1,Math.ceil(oz+HALF))+6));
    updateWaterMesh(true);refreshSprings();G.fish=Math.max(.15,(G.fish||1)-.12);T.drained++;gridDirty=true;tfDust(p.x,p.z,30,[.45,.4,.3]);
    chron(`By the Spirit's leave the folk dug a ditch and drained the marsh ${dirWord(p.x,p.z)} of ${G.town}. The frogs fell silent; the ground turned to good black earth.`,true);}
  else if(p.k==='clearcut'){let n=0;for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.t!==4&&t.t!==5&&(t.x-p.x)**2+(t.z-p.z)**2<18*18){trees.splice(i,1);n++;}}
    treesDirty=true;G.wood+=n*.7;T.cut+=n;let fled=0;for(let i=animals.length-1;i>=0;i--){const a=animals[i];if(Math.hypot(a.x-p.x,a.z-p.z)<26&&rnd()<.4){animals.splice(i,1);fled++;}}
    G.noGame=G.noGame||fled>3;tfDust(p.x,p.z,26,[.5,.45,.3]);gridDirty=true;chron(`The folk felled ${n} trees in the wood ${dirWord(p.x,p.z)} of ${G.town}. The timber was welcome; the deer fled the clearing.`,true);}
  else if(p.k==='rail'&&p.rp&&typeof railExecute==='function'){railExecute(p);}
  else if(p.k==='rail'||p.k==='highway'){const cost=p.k==='rail'?[60,80]:[80,140];
    if(G.wood<cost[0]||G.stone<cost[1]){chron(`The folk lacked the ${G.wood<cost[0]?'timber':'stone'} to ${p.short}. They will ask again.`);T.cool[p.k]=dayN()+3;return;}
    G.wood-=cost[0];G.stone-=cost[1];const r=netBuild(p.k,p.a,p.b);
    if(!r){G.wood+=cost[0];G.stone+=cost[1];chron(`The surveyors could find no way to ${p.short}.`);T.cool[p.k]=dayN()+10;return;}
    if(r.scared>0){G.noGame=G.noGame||r.scared>6;for(let i=animals.length-1;i>=0;i--)if(rnd()<.2&&Math.hypot(animals[i].x-p.x,animals[i].z-p.z)<60)animals.splice(i,1);}
    chron(p.k==='rail'?`By the Spirit's leave the folk laid ${r.len} paces of railway through the valley. The first train came puffing in, trailing smoke.`:`The highway was finished: ${r.len} paces of grey road cut straight through the valley. Cars hummed along it, and the deer fled.`,true);
    showBanner(p.k==='rail'?'The railway':'The highway',`${G.town} is joined to the world`);sfx('bell');}
  else if(p.k==='terrace'){chron(`By the Spirit's leave the folk began to cut terraces for the streets ${dirWord(p.x,p.z)} of ${G.town}.`,true);}
  else if(p.k==='mountain'){T.mountain=true;chron(`The quarrymen began to cut deep into the hills ${dirWord(p.x,p.z)} of ${G.town}. The mountain will not stay as it was.`,true);}
  sfx('chime');}
function tfPanelHTML(){const T=tfEnsure();if(!T.pet.length)return '';let h='<h3 style="margin-top:12px">Petitions</h3>';
  for(const p of T.pet){const hl=Math.max(0,p.until-G.t);h+=`<div class="pr"><b>${esc(p.txt)}</b><em>${esc(p.how)}</em><div class="acts" style="display:flex;gap:6px;margin:5px 0 2px"><button data-tf="${p.id}:1">Allow</button><button data-tf="${p.id}:0">Forbid</button></div><span class="rw">${hl>=24?Math.ceil(hl/24)+' days':Math.ceil(hl)+' hours'} to decide</span></div>`;}
  return h;}
function tfBind(){for(const b of document.querySelectorAll('#prayers [data-tf]'))b.onclick=()=>{const [id,yes]=b.dataset.tf.split(':');tfDecide(+id,yes==='1');};}
