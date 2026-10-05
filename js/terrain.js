'use strict';
// ================================================================ terrain generation (world presets)
const WORLDS={
  river:{name:'Riverlands',desc:'Meadows, forests and lakes linked by rivers. Fish, game and farmland in balance.',trees:.53,game:1},
  lake:{name:'Lakeland',desc:'A great lake with wooded islands and long shores. Fishing folk and boatwrights thrive.',trees:.55,game:.8},
  high:{name:'Highlands',desc:'Mountains, pine forests and cold tarns. Stone is plentiful; flat land is precious.',trees:.52,game:.8},
  dry:{name:'Dry Steppe',desc:'Wide dry plains around a single oasis. Water is scarce — farming and hunting rule.',trees:.71,game:.6},
  blank:{name:'Blank Canvas',desc:'A flat, empty meadow. Raise every hill, pour every river, plant every forest yourself.',trees:2,game:0}};
let WORLD='river';const LAKES=[];
function carvePath(pts,h0,h1,wid,dep){
  const segs=[];let tot=0;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push({a,b,L,s:tot});tot+=L;}
  for(const p of pts){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);}
  const i0=Math.max(0,Math.floor(x0-wid+HALF)),i1=Math.min(N,Math.ceil(x1+wid+HALF)),j0=Math.max(0,Math.floor(z0-wid+HALF)),j1=Math.min(N,Math.ceil(z1+wid+HALF));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=i-HALF,z=j-HALF;let bd=1e9,bt=0;
    for(const g of segs){const dx=g.b[0]-g.a[0],dz=g.b[1]-g.a[1];let u=((x-g.a[0])*dx+(z-g.a[1])*dz)/(g.L*g.L);u=clamp(u,0,1);
      const d=Math.hypot(x-g.a[0]-dx*u,z-g.a[1]-dz*u);if(d<bd){bd=d;bt=(g.s+u*g.L)/tot;}}
    if(bd<wid){const k=j*S+i;const tgt=lerp(h0,h1,bt)-dep*(1-(bd/wid)**2);const bl=sstep(wid,wid*.3,bd);H[k]=lerp(H[k],Math.min(H[k],tgt),bl);}}
}
function wanderPath(a,b,n,amp,r){const pts=[a];const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),px=-dz/L,pz=dx/L;
  for(let i=1;i<n;i++){const t=i/n,o=(r()-.5)*amp*Math.sin(PI*t);pts.push([a[0]+dx*t+px*o,a[1]+dz*t+pz*o]);}pts.push(b);return pts;}
function ringMin(x,z,r){let m=1e9;for(let i=0;i<24;i++){const a=i/24*TAU;m=Math.min(m,hAt(x+Math.cos(a)*r,z+Math.sin(a)*r));}return m;}
function addLake(x,z,rad,L,el=1.15,depth=1){
  const R=rad*1.6;const i0=Math.max(0,Math.floor(x-R+HALF)),i1=Math.min(N,Math.ceil(x+R+HALF)),j0=Math.max(0,Math.floor(z-R*el+HALF)),j1=Math.min(N,Math.ceil(z+R*el+HALF));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*S+i,dx=i-HALF-x,dz=(j-HALF-z)/el;const ang=Math.atan2(dz,dx);
    const wob=1+.16*Math.sin(ang*3+x)+.1*Math.sin(ang*5+z);const dl=Math.hypot(dx,dz)/wob;
    const rim=sstep(rad*1.55,rad*1.12,dl)*sstep(rad*.75,rad,dl);H[k]=Math.max(H[k],lerp(H[k],L+1.7,rim));
    const bowl=sstep(rad,rad*.35,dl);H[k]=lerp(H[k],L-2.4-(1-dl/rad)*(1.5+rad*.06)*depth,bowl);}
  LAKES.push({x,z,L,rad});}
function flood(x,z,lvl,maxR=1e9){const seen=new Uint8Array(V),q=[];const ci=clamp(Math.round(x+HALF),0,N),cj=clamp(Math.round(z+HALF),0,N);q.push(cj*S+ci);seen[cj*S+ci]=1;
  while(q.length){const k=q.pop();if(H[k]>=lvl)continue;const i=k%S,j=(k/S)|0;if(Math.hypot(i-HALF-x,j-HALF-z)>maxR)continue;W[k]=Math.max(W[k],lvl-H[k]);
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>N||nj>N)continue;const nk=nj*S+ni;if(!seen[nk]){seen[nk]=1;q.push(nk);}}}}
function edgeOf(x,z){const ax=Math.abs(x),az=Math.abs(z);if(ax>az)return [Math.sign(x)*(HALF+4),z*1.1];return [x*1.1,Math.sign(z)*(HALF+4)];}
function genTerrain(seed,preset){
  preset=preset||WORLD;WORLD=preset;const r=mulberry(seed);LAKES.length=0;springs.length=0;
  W.fill(0);F.fill(0);SPD.fill(0);ROAD.fill(0);ROADT.fill(0);FX.fill(0);FZ.fill(0);
  const mts=[];
  if(preset==='blank'){for(let k=0;k<V;k++){const i=k%S,j=(k/S)|0;H[k]=4+(fbm(i*.012,j*.012,seed)-.5)*1.8;}return;}
  for(let m=0;m<(preset==='high'?4:preset==='dry'?1:2);m++){const a=r()*TAU,d=95+r()*45;mts.push([Math.cos(a)*d,Math.sin(a)*d,preset==='high'?50+r()*30:28+r()*22,70+r()*40]);}
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){const x=i-HALF,z=j-HALF,k=j*S+i;let h;
    if(preset==='high'){const rg=1-Math.abs(fbm(x*.009,z*.009,seed)*2-1);h=5+rg*rg*30+(fbm(x*.03,z*.03,seed+4)-.5)*8;}
    else if(preset==='dry'){h=4+(fbm(x*.007+1,z*.007+2,seed)-.5)*11+(fbm(x*.04,z*.04,seed+2)-.5)*1.5;const mesa=fbm(x*.02+9,z*.02+3,seed+7);if(mesa>.64)h+=Math.min(6,(mesa-.64)*120);}
    else h=6+(fbm(x*.008+3.1,z*.008+7.7,seed)-.5)*22+(fbm(x*.03,z*.03,seed+9,4)-.5)*5;
    for(const [mx,mz,amp,rad] of mts){const dm=Math.hypot(x-mx,z-mz),mm=Math.max(0,1-dm/rad);h+=mm*mm*amp*(.55+.9*fbm(x*.04,z*.04,seed+5));}
    const edge=Math.max(Math.abs(x),Math.abs(z));h+=sstep(HALF-30,HALF,edge)*3;
    H[k]=h;}
  const hc=(x,z)=>hAt(x,z);
  if(preset==='high'){const a=r()*TAU;const p0=[Math.cos(a)*120,Math.sin(a)*120],p1=[-p0[0]*.9,-p0[1]*.9];const v=wanderPath(p0,p1,8,90,r);
    for(let j=0;j<S;j++)for(let i=0;i<S;i++){const x=i-HALF,z=j-HALF;let bd=1e9;for(let s=0;s<v.length-1;s++){const A=v[s],B=v[s+1],dx=B[0]-A[0],dz=B[1]-A[1];let u=((x-A[0])*dx+(z-A[1])*dz)/(dx*dx+dz*dz);u=clamp(u,0,1);bd=Math.min(bd,Math.hypot(x-A[0]-dx*u,z-A[1]-dz*u));}
      const k=j*S+i,f=sstep(34,12,bd);H[k]=lerp(H[k],7+(fbm(x*.05,z*.05,seed+8)-.5)*2,f);}
    const t1=v[3],t2=v[6];addLake(t1[0],t1[1],13+r()*5,hc(t1[0],t1[1])-1);addLake(t2[0],t2[1],11+r()*5,Math.min(LAKES[0].L-1.2,hc(t2[0],t2[1])-1));}
  else if(preset==='lake'){const L=4;addLake((r()-.5)*30,(r()-.5)*30,62,L,1.1,1.3);const lk=LAKES[0];
    for(let n=0;n<3;n++){const a=r()*TAU,d=15+r()*28,ix=lk.x+Math.cos(a)*d,iz=lk.z+Math.sin(a)*d,ir=5+r()*6;
      for(let j=0;j<S;j++)for(let i=0;i<S;i++){const dd=Math.hypot(i-HALF-ix,j-HALF-iz);if(dd<ir*1.8){const k=j*S+i;H[k]=Math.max(H[k],L+2.4+(1-dd/ir)*3-(dd>ir?(dd-ir)*2.5:0));}}}
    const a=r()*TAU;addLake(Math.cos(a)*110,Math.sin(a)*110,16,Math.max(L+4,hc(Math.cos(a)*110,Math.sin(a)*110)-1));}
  else if(preset==='dry'){const ox=(r()-.5)*60,oz=(r()-.5)*60;addLake(ox,oz,9,hc(ox,oz)-.6,1,.8);
    const a=r()*TAU,nx=-Math.sin(a),nz=Math.cos(a),sd=(ox*nx+oz*nz)>0?-1:1,off=60;const p0=[Math.cos(a)*150+nx*off*sd,Math.sin(a)*150+nz*off*sd],p1=[-Math.cos(a)*150+nx*off*sd,-Math.sin(a)*150+nz*off*sd];carvePath(wanderPath(p0,p1,9,110,r),hc(p0[0],p0[1])-1,hc(p1[0],p1[1])-3,4.5,2.2);}
  else{for(let n=0;n<3;n++){let x,z,ok=false;for(let t=0;t<40&&!ok;t++){x=(r()-.5)*190;z=(r()-.5)*190;ok=LAKES.every(l=>Math.hypot(l.x-x,l.z-z)>80)&&mts.every(m=>Math.hypot(m[0]-x,m[1]-z)>60);}
      const rr=15+r()*12;addLake(x,z,rr,Math.min(hc(x,z)-1.2,ringMin(x,z,rr*1.9)+.4));}}
  // order lakes high → low and connect with rivers
  LAKES.sort((a,b)=>b.L-a.L);
  for(let i=1;i<LAKES.length;i++)if(LAKES[i].L>LAKES[i-1].L-1.4){const l=LAKES[i];addLake(l.x,l.z,l.rad,LAKES[i-1].L-1.6);LAKES.splice(LAKES.length-1,1);LAKES[i].L=LAKES[i-1].L-1.6;}
  for(let i=0;i<LAKES.length;i++){const a=LAKES[i],b=LAKES[i+1];
    if(b&&preset!=='dry'){const p=wanderPath([a.x,a.z],[b.x,b.z],7,40,r);carvePath(p,a.L-.35,b.L-.5,3.4,.9);}
    else if(!b&&preset!=='dry'){const e=edgeOf(a.x+(r()-.5)*40,a.z+(r()-.5)*40);carvePath(wanderPath([a.x,a.z],e,7,40,r),a.L-.35,a.L-7,3.4,.9);}}
  if(preset!=='dry'&&LAKES.length){for(const [mx,mz] of mts.slice(0,preset==='high'?3:2)){const l=LAKES.reduce((b,o)=>Math.hypot(o.x-mx,o.z-mz)<Math.hypot(b.x-mx,b.z-mz)?o:b,LAKES[0]);
    const dx=l.x-mx,dz=l.z-mz,dd=Math.hypot(dx,dz);const sx=mx+dx/dd*Math.min(dd*.35,40),sz=mz+dz/dd*Math.min(dd*.35,40);if(Math.abs(sx)>HALF-8||Math.abs(sz)>HALF-8)continue;
    const hs=hc(sx,sz);if(hs<l.L+3)continue;carvePath(wanderPath([sx,sz],[l.x,l.z],8,30,r),hs-.8,l.L-.6,3.6,1);springs.push({x:sx,z:sz,rate:.34});}}
  if(preset==='dry'&&LAKES[0])springs.push({x:LAKES[0].x+4,z:LAKES[0].z+2,rate:.05});
  for(const l of LAKES)flood(l.x,l.z,l.L-.3,l.rad*1.35);
}
// ================================================================ terrain mesh
const tGeo=new THREE.BufferGeometry();
const tPos=new Float32Array(V*3),tCol=new Float32Array(V*3);
for(let j=0;j<S;j++)for(let i=0;i<S;i++){const k=j*S+i;tPos[k*3]=i-HALF;tPos[k*3+2]=j-HALF;}
const gIdx=new Uint32Array(N*N*6);
{let p=0;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*S+i,b=a+1,c=a+S,d=c+1;
  if((i+j)&1){gIdx[p++]=a;gIdx[p++]=c;gIdx[p++]=b;gIdx[p++]=b;gIdx[p++]=c;gIdx[p++]=d;}
  else{gIdx[p++]=a;gIdx[p++]=c;gIdx[p++]=d;gIdx[p++]=a;gIdx[p++]=d;gIdx[p++]=b;}}}
tGeo.setAttribute('position',new THREE.BufferAttribute(tPos,3));
const tNor=new Float32Array(V*3);tGeo.setAttribute('normal',new THREE.BufferAttribute(tNor,3));
tGeo.setAttribute('color',new THREE.BufferAttribute(tCol,3));
tGeo.setIndex(new THREE.BufferAttribute(gIdx,1));
const terrain=new THREE.Mesh(tGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:0}));
terrain.receiveShadow=true;terrain.castShadow=true;scene.add(terrain);
// skirt
const skN=S*4,skPos=new Float32Array(skN*2*3),skCol=new Float32Array(skN*2*3);
const skGeo=new THREE.BufferGeometry();
{const ix=[];for(let s=0;s<4;s++)for(let t=0;t<N;t++){const a=(s*S+t)*2,b=a+2;ix.push(a,a+1,b,b,a+1,b+1);}skGeo.setIndex(ix);}
skGeo.setAttribute('position',new THREE.BufferAttribute(skPos,3));skGeo.setAttribute('color',new THREE.BufferAttribute(skCol,3));
const skirt=new THREE.Mesh(skGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));scene.add(skirt);
function edgeK(s,t){return s===0?t:s===1?t*S+N:s===2?N*S+(N-t):(N-t)*S;}
function updateSkirt(){
  for(let s=0;s<4;s++)for(let t=0;t<S;t++){const k=edgeK(s,t),v=(s*S+t)*2;const x=tPos[k*3],z=tPos[k*3+2],h=H[k];
    skPos[v*3]=x;skPos[v*3+1]=h;skPos[v*3+2]=z;skPos[v*3+3]=x;skPos[v*3+4]=-15;skPos[v*3+5]=z;
    const st=.5+.5*Math.sin(h*1.7);skCol.set([.42+.06*st,.33+.04*st,.24],v*3);skCol.set([.18,.14,.1],v*3+3);}
  skGeo.attributes.position.needsUpdate=true;skGeo.attributes.color.needsUpdate=true;skGeo.computeVertexNormals();
}
let civicSpots=[];
const C3=(h)=>[((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
const TC={g1:C3(0x5d8a37),g2:C3(0x7a9a3e),dry:C3(0x9a955a),rock:C3(0x7b746b),rock2:C3(0x5e5850),snow:C3(0xeef1f4),sand:C3(0xcdb98a),mud:C3(0x5a5038),road:C3(0x8d7350),cob:C3(0x8a8780),forest:C3(0x4a6e2c),st1:C3(0xb3a160),st2:C3(0x9c8c4e)};
let forestMask=new Float32Array(V);
const AOF=new Float32Array(V);let aoSig='';
function stampAOAt(x,z,r0,r1,amt){const i0=Math.max(0,Math.floor(x-r1+HALF)),i1=Math.min(N,Math.ceil(x+r1+HALF)),j0=Math.max(0,Math.floor(z-r1+HALF)),j1=Math.min(N,Math.ceil(z+r1+HALF));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i-HALF-x,j-HALF-z);if(d>r1)continue;const v=amt*(d<r0?1:1-(d-r0)/(r1-r0));const k=j*S+i;if(v>AOF[k])AOF[k]=v;}}
function updateAO(force){if(typeof buildings==='undefined')return;const AB=allB(),sig=AB.length+':'+(AB.length?AB[AB.length-1].id:0)+':'+trees.length;if(!force&&sig===aoSig)return;aoSig=sig;AOF.fill(0);
  for(const t of trees){if(t.t===4||t.t===5)continue;stampAOAt(t.x,t.z,.4,1.6*(t.s||1),.22);}
  for(const b of allB()){if(b.type==='farm')continue;const r=(b.r||2)*.8;stampAOAt(b.x,b.z,r,r+1.8,.32);}}
function colorVert(i,j){
  const k=j*S+i,h=H[k];
  const sx=(H[j*S+Math.min(i+1,N)]-H[j*S+Math.max(i-1,0)])*.5,sz=(H[Math.min(j+1,N)*S+i]-H[Math.max(j-1,0)*S+i])*.5;
  const slope=Math.hypot(sx,sz),n=NOI[k];
  let r=lerp(TC.g1[0],TC.g2[0],n),g=lerp(TC.g1[1],TC.g2[1],n),b=lerp(TC.g1[2],TC.g2[2],n);
  const fm=forestMask[k]*.6;r=lerp(r,TC.forest[0],fm);g=lerp(g,TC.forest[1],fm);b=lerp(b,TC.forest[2],fm);
  if(WORLD==='dry'){const x=i-HALF,z=j-HALF;let wet=0;for(const L of LAKES){const d=Math.hypot(L.x-x,L.z-z);wet=Math.max(wet,1-sstep(L.rad*.9,L.rad+26,d));}
    const ar=.82*(1-wet)*(1-forestMask[k]*.5);r=lerp(r,lerp(TC.st1[0],TC.st2[0],n),ar);g=lerp(g,lerp(TC.st1[1],TC.st2[1],n),ar);b=lerp(b,lerp(TC.st1[2],TC.st2[2],n),ar);}
  const dr=sstep(9,20,h)*.7;r=lerp(r,TC.dry[0],dr);g=lerp(g,TC.dry[1],dr);b=lerp(b,TC.dry[2],dr);
  const rk=sstep(.65,1.25,slope),st=.5+.5*Math.sin(h*2.3+n*4);
  r=lerp(r,lerp(TC.rock[0],TC.rock2[0],st),rk);g=lerp(g,lerp(TC.rock[1],TC.rock2[1],st),rk);b=lerp(b,lerp(TC.rock[2],TC.rock2[2],st),rk);
  const sn=sstep(24,29,h+n*4)*(1-rk*.6);r=lerp(r,TC.snow[0],sn);g=lerp(g,TC.snow[1],sn);b=lerp(b,TC.snow[2],sn);
  const w=W[k];
  if(w>.05){const m=clamp(w*1.5,0,1)*.85;r=lerp(r,TC.mud[0],m);g=lerp(g,TC.mud[1],m);b=lerp(b,TC.mud[2],m);}
  else{let near=0;for(let dj=-2;dj<=2;dj+=2)for(let di=-2;di<=2;di+=2){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>N||jj>N)continue;if(W[jj*S+ii]>.12)near++;}
    if(near){const m=Math.min(1,near*.3)*(1-rk)*.8;r=lerp(r,TC.sand[0],m);g=lerp(g,TC.sand[1],m);b=lerp(b,TC.sand[2],m);}}
  const rd=ROAD[k];
  if(rd>.02){let cob=false;const x=i-HALF,z=j-HALF;for(const c of civicSpots){if((c[0]-x)**2+(c[1]-z)**2<c[2])cob=true;}
    const C=cob?TC.cob:TC.road,m=sstep(.04,.45,rd);const ck=cob?((i+j)&1?.93:1.05):1;
    r=lerp(r,C[0]*ck,m);g=lerp(g,C[1]*ck,m);b=lerp(b,C[2]*ck,m);
    const rt=ROADT[k];if(rt){const T2=rt===2?.36:rt===3?.5:.24,wr=rt===3?1.02:1;const am=.92*m;r=lerp(r,T2*wr,am);g=lerp(g,T2*(rt===3?.97:1),am);b=lerp(b,T2*(rt===3?.92:1.04),am);}}
  if(SNOWF>.01&&w<=.05){const m=SNOWF*(1-rk*.75)*(.72+.28*n)*(rd>.3?.5:1);r=lerp(r,.92,m);g=lerp(g,.94,m);b=lerp(b,.97,m);}
  const jt=(.93+NOI2[k]*.12)*(1-AOF[k]);tCol[k*3]=r*jt;tCol[k*3+1]=g*jt;tCol[k*3+2]=b*jt;
}
function refreshTerrain(i0=0,j0=0,i1=N,j1=N){
  i0=Math.max(0,i0-2);j0=Math.max(0,j0-2);i1=Math.min(N,i1+2);j1=Math.min(N,j1+2);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*S+i;tPos[k*3+1]=H[k];colorVert(i,j);
    const nx=H[j*S+Math.max(i-1,0)]-H[j*S+Math.min(i+1,N)],nz=H[Math.max(j-1,0)*S+i]-H[Math.min(j+1,N)*S+i],l=Math.hypot(nx,2,nz);tNor[k*3]=nx/l;tNor[k*3+1]=2/l;tNor[k*3+2]=nz/l;}
  tGeo.attributes.position.needsUpdate=true;tGeo.attributes.color.needsUpdate=true;tGeo.attributes.normal.needsUpdate=true;if(!tGeo.boundingSphere)tGeo.computeBoundingSphere();
  if(i0<=0||j0<=0||i1>=N||j1>=N)updateSkirt();
}
function recolorAll(){for(let j=0;j<S;j++)for(let i=0;i<S;i++)colorVert(i,j);tGeo.attributes.color.needsUpdate=true;}
let recRow=0;function recolorStep(rows){for(let r=0;r<rows;r++){const j=recRow;for(let i=0;i<S;i++)colorVert(i,j);recRow=(recRow+1)%S;}tGeo.attributes.color.needsUpdate=true;}

