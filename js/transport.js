'use strict';
// ================================================================ transport: paved streets, railways, highways
// Streets are paved in the Industrial age. Railways and highways are laid as corridors: the land is cut and filled to a
// gentle grade, a ribbon of ballast or asphalt follows it, and trains and cars run along it. The folk petition for them.
// ROADT (core.js) marks terrain cells: 2 paved street, 3 railway, 4 highway. It is derived data, rebuilt from G.net.
const netGrp=new THREE.Group();scene.add(netGrp);let netMesh=null,netDirty=true,netT=0;const netVeh=[];
const netMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
// every settlement's network is drawn and painted, wherever the view is
function netsAll(){const o=[];TOWNS.list.forEach((s,i)=>{const n=sGet(i,'net');if(n)o.push({net:n,plan:sGet(i,'plan')});});return o;}
function netLines(){const o=[];for(const t of netsAll())for(const L of t.net.lines)o.push(L);return o;}
function netEnsure(){if(!G.net)G.net={lines:[],paved:false};return G.net;}
function netSmooth(pts){let a=pts.map(p=>[p[0],p[1]]);for(let it=0;it<2;it++){const o=[a[0]];for(let i=0;i<a.length-1;i++){const p=a[i],q=a[i+1];o.push([p[0]*.75+q[0]*.25,p[1]*.75+q[1]*.25],[p[0]*.25+q[0]*.75,p[1]*.25+q[1]*.75]);}o.push(a[a.length-1]);a=o;}
  const r=[a[0]];let acc=0;for(let i=1;i<a.length;i++){acc+=Math.hypot(a[i][0]-a[i-1][0],a[i][1]-a[i-1][1]);if(acc>=2.2){r.push(a[i]);acc=0;}}const L=a[a.length-1];if(Math.hypot(r[r.length-1][0]-L[0],r[r.length-1][1]-L[1])>.5)r.push(L);return r;}
function netLen(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c;}
// cut and fill the land along a corridor, limiting the slope
function netGrade(pts,wid,maxStep){const n=pts.length,h=pts.map(p=>hAt(p[0],p[1])),sm=h.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-6);j<=Math.min(n-1,i+6);j++){s+=h[j];c++;}return s/c;});
  for(let it=0;it<3;it++){for(let i=1;i<n;i++)sm[i]=clamp(sm[i],sm[i-1]-maxStep,sm[i-1]+maxStep);for(let i=n-2;i>=0;i--)sm[i]=clamp(sm[i],sm[i+1]-maxStep,sm[i+1]+maxStep);}
  const R=wid*2.4;let i0=N,j0=N,i1=0,j1=0;for(const p of pts){i0=Math.min(i0,Math.floor(p[0]-R+HALF));i1=Math.max(i1,Math.ceil(p[0]+R+HALF));j0=Math.min(j0,Math.floor(p[1]-R+HALF));j1=Math.max(j1,Math.ceil(p[1]+R+HALF));}
  i0=Math.max(0,i0);j0=Math.max(0,j0);i1=Math.min(N,i1);j1=Math.min(N,j1);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=i-HALF,z=j-HALF;let bd=1e9,bi=0;
    for(let q=0;q<n;q++){const dx=pts[q][0]-x,dz=pts[q][1]-z,d=dx*dx+dz*dz;if(d<bd){bd=d;bi=q;}}
    bd=Math.sqrt(bd);if(bd>R)continue;const k=j*S+i;const w=bd<wid?1:sstep(R,wid,bd);H[k]=lerp(H[k],sm[bi],w);if(bd<wid*1.2)W[k]=0;}
  const r2=(wid+1.2)**2;for(let t=trees.length-1;t>=0;t--){const tr=trees[t];if(tr.t===4)continue;for(const p of pts){if((tr.x-p[0])**2+(tr.z-p[1])**2<r2){trees.splice(t,1);break;}}}
  treesDirty=true;refreshTerrain(i0,j0,i1,j1);gridDirty=true;}
function netPaint(){ROADT.fill(0);netEnsure();for(const {net:N2,plan} of netsAll()){
  if(N2.paved&&plan)for(const s of plan.streets){if(!s.painted)continue;const r=s.hw*.85;for(let q=0;q<=Math.min(s.painted,s.pts.length-1);q++){const [x,z]=s.pts[q];const i0=Math.floor(x-r-1+HALF),i1=Math.ceil(x+r+1+HALF),j0=Math.floor(z-r-1+HALF),j1=Math.ceil(z+r+1+HALF);
    for(let j=Math.max(0,j0);j<=Math.min(N,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(N,i1);i++){const k=j*S+i;if(ROAD[k]>.3&&Math.hypot(i-HALF-x,j-HALF-z)<r+.8)ROADT[k]=2;}}}
  for(const L of N2.lines){const wd=L.kind==='highway'?3.2:1.6;for(const p of L.pts){const i0=Math.floor(p[0]-wd-1+HALF),i1=Math.ceil(p[0]+wd+1+HALF),j0=Math.floor(p[1]-wd-1+HALF),j1=Math.ceil(p[1]+wd+1+HALF);
    for(let j=Math.max(0,j0);j<=Math.min(N,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(N,i1);i++){const d=Math.hypot(i-HALF-p[0],j-HALF-p[1]);if(d<wd){const k=j*S+i;ROADT[k]=L.kind==='highway'?4:3;ROAD[k]=Math.max(ROAD[k],.9);}}}}}
  recolorAll();netDirty=true;}
// ---------------- ribbon geometry that follows the ground
function netBuildMesh(){if(netMesh){netGrp.remove(netMesh);netMesh.geometry.dispose();netMesh=null;}const P=[],C=[];const ALLL=netLines();if(!ALLL.length)return;
  const quad=(a,b,c,d,col)=>{P.push(...a,...b,...c,...a,...c,...d);for(let i=0;i<6;i++)C.push(col[0],col[1],col[2]);};
  const col=h=>[((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  for(const L of ALLL){const pts=L.pts,cum=netLen(pts),tot=cum[cum.length-1];const step=1.4;const S2=[];for(let s=0;s<=tot;s+=step){let i=1;while(i<cum.length-1&&cum[i]<s)i++;const t=(s-cum[i-1])/Math.max(1e-6,cum[i]-cum[i-1]);const x=lerp(pts[i-1][0],pts[i][0],t),z=lerp(pts[i-1][1],pts[i][1],t);
      const dx=pts[i][0]-pts[i-1][0],dz=pts[i][1]-pts[i-1][1],l=Math.hypot(dx,dz)||1;S2.push({x,z,nx:-dz/l,nz:dx/l,y:hAt(x,z)});}
    const at=(o,wv,dy)=>S2.map(q=>[q.x+q.nx*o,q.y+dy,q.z+q.nz*o]);
    const strip=(o0,o1,dy,c,every)=>{const A=at(o0,0,dy),B=at(o1,0,dy);for(let i=0;i<S2.length-1;i++){if(every&&(i%every)>=every-1)continue;quad(A[i],A[i+1],B[i+1],B[i],c);}};
    if(L.kind==='highway'){strip(-3.1,3.1,.09,col(0x3b3b3f));strip(-3.1,-2.85,.1,col(0xd8d4c4));strip(2.85,3.1,.1,col(0xd8d4c4));strip(-.07,.07,.1,col(0xe4c64a));strip(-1.55,-1.45,.1,col(0xe8e4d0),3);strip(1.45,1.55,.1,col(0xe8e4d0),3);
      strip(-3.7,-3.1,.07,col(0x7a7468));strip(3.1,3.7,.07,col(0x7a7468));}
    else{strip(-1.4,1.4,.07,col(0x8a8379));strip(-.82,-.58,.12,col(0x6a6e74));strip(.58,.82,.12,col(0x6a6e74));
      const A=at(-1.0,0,.1),B=at(1.0,0,.1);for(let i=0;i<S2.length-1;i++)if(i%1===0)quad(A[i],[A[i][0]+(A[i+1][0]-A[i][0])*.3,A[i][1],A[i][2]+(A[i+1][2]-A[i][2])*.3],[B[i][0]+(B[i+1][0]-B[i][0])*.3,B[i][1],B[i][2]+(B[i+1][2]-B[i][2])*.3],B[i],col(0x4a3a2a));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
  netMesh=new THREE.Mesh(g,netMat);netMesh.receiveShadow=true;netMesh.frustumCulled=false;netGrp.add(netMesh);}
// ---------------- trains and cars
function netMakeVehicle(kind,seed){const r=mulberry(seed),B=new Builder(r,0);
  if(kind==='train'){B.box(0,.3,0,1.5,1.5,3.6,0x1f2124);B.box(0,1.8,-.7,1.3,.2,2.0,0x7a2f22);B.cyl(0,.5,.9,.62,1.9,0x2a2d31,8);B.cyl(0,2.4,1.4,.22,.9,0x1f2124,6);for(let w=0;w<3;w++){B.box(0,.3,-3.1-w*3.2,1.5,1.6,2.9,[0x7a2f22,0x2f4a6e,0x6e5a2f][w]);B.box(0,1.9,-3.1-w*3.2,1.4,.12,3.0,0x3a3d42);}}
  else{const c=[0xc0392b,0x2e86c1,0xe8e4d8,0x2f3a3a,0xe0b03a,0x58a05a][Math.floor(r()*6)];B.box(0,.2,0,1.3,.55,2.6,c);B.box(0,.75,-.1,1.15,.5,1.4,0xbcd4e0);B.box(0,.2,1.25,1.2,.2,.08,0xfff0b0);}
  const m=B.mesh(matB);m.castShadow=true;return m;}
function netSyncVehicles(){for(const v of netVeh.splice(0)){netGrp.remove(v.m);v.m.geometry.dispose();}const ALLL=netLines();
  ALLL.forEach((L,li)=>{Object.defineProperty(L,'cum',{value:netLen(L.pts),enumerable:false,writable:true,configurable:true});const n=L.kind==='rail'?1:5;for(let i=0;i<n;i++){const m=netMakeVehicle(L.kind==='rail'?'train':'car',li*77+i);netGrp.add(m);netVeh.push({m,L,li,s:Math.random()*L.cum[L.cum.length-1],dir:L.kind==='rail'?1:(i%2?1:-1),sp:L.kind==='rail'?9:14+Math.random()*6});}});}
function netFrame(dt){if(MODE!=='god'||!netVeh.length&&!netDirty)return;netT+=dt;
  if(netDirty&&(netT>.8||!netMesh)){netT=0;netDirty=false;netBuildMesh();}
  if(PAUSED||G.paused)return;const spd=Math.max(1,G.speed||1);
  for(const v of netVeh){const L=v.L;if(!L)continue;const tot=L.cum[L.cum.length-1];v.s+=v.dir*v.sp*dt*Math.min(spd,4)*.35;if(v.s>tot){v.s=tot;v.dir=-1;}if(v.s<0){v.s=0;v.dir=1;}
    let i=1;while(i<L.cum.length-1&&L.cum[i]<v.s)i++;const t=(v.s-L.cum[i-1])/Math.max(1e-6,L.cum[i]-L.cum[i-1]);const x=lerp(L.pts[i-1][0],L.pts[i][0],t),z=lerp(L.pts[i-1][1],L.pts[i][1],t);
    const dx=L.pts[i][0]-L.pts[i-1][0],dz=L.pts[i][1]-L.pts[i-1][1],l=Math.hypot(dx,dz)||1,off=L.kind==='highway'?(v.dir>0?1.5:-1.5):0;
    v.m.position.set(x-dz/l*off,hAt(x,z)+.14,z+dx/l*off);v.m.rotation.y=Math.atan2(dx,dz)+(v.dir<0?PI:0);}}
// ---------------- building a line
function netRoute(a,b){const p=findPath(a[0],a[1],b[0],b[1],0,0);if(!p)return null;return [a,...p];}
// buildings in the way of a new line are pulled down (the hall and stations are spared)
function netClearCorridor(pts,wid,kind){let n=0;for(const b of buildings.slice()){if(b===G.center||b.type==='station'||b.type==='hall')continue;let d=1e9;for(const p of pts)d=Math.min(d,Math.hypot(b.x-p[0],b.z-p[1]));
    if(d<wid+1.4+(b.r||2)*.55){for(const v of G.vill){if(v.home===b.id)v.home=0;if(v.work===b.id){v.work=0;v.job=null;}if(v.site===b.id)v.site=0;if(v.inside===b.id)v.inside=0;}removeBuilding(b);n++;}}
  if(n){G.sad=Math.min(20,G.sad+Math.min(5,n*.6));griefAdd(n);chron(`${n} building${n>1?'s were':' was'} pulled down to make way for the ${kind==='rail'?'railway':'highway'}.`,true);assignHomes();assignJobs();gridDirty=true;refreshCivic();}return n;}
function netBuild(kind,a,b){const route=netRoute(a,b);if(!route||route.length<3)return false;const pts=netSmooth(route);const wid=kind==='highway'?3.6:2.2;
  netClearCorridor(pts,wid,kind);netGrade(pts,wid,kind==='highway'?.34:.2);const L={kind,pts};netEnsure().lines.push(L);netPaint();netSyncVehicles();
  let sc=0;for(let i=0;i<animals.length;i++){const an=animals[i];for(const p of pts){if(Math.hypot(an.x-p[0],an.z-p[1])<9){sc++;break;}}}
  return {len:Math.round(netLen(pts).slice(-1)[0]),scared:sc};}
function netPave(){const N2=netEnsure();if((G.era||0)<5)return;if(!N2.paved){N2.paved=true;chron(`The streets of ${G.town} were paved with tar and stone, and the mud of the old lanes was gone.`,true);}netPaint();}
function netEdgeTarget(from){let best=null,bc=1e9;for(let t=0;t<14;t++){const a=t/14*TAU,[ex,ez]=edgePoint(a);const c=Math.hypot(ex-from[0],ez-from[1])+Math.abs(hAt(ex,ez)-hAt(from[0],from[1]))*6;if(wAt(ex,ez)>.1||c>=bc)continue;if(findPath(from[0],from[1],ex,ez,0,0)){best=[ex,ez];bc=c;}}return best;}
function netDaily(){if(G.phase!=='play'||G.menu||(G.era||0)<5||!G.center)return;const N2=netEnsure();if(!N2.paved||(dayN()%7===0))netPave();}
function netReload(){netEnsure();netPaint();netSyncVehicles();netDirty=true;}
function netReset(){netVeh.splice(0).forEach(v=>{netGrp.remove(v.m);v.m.geometry.dispose();});if(netMesh){netGrp.remove(netMesh);netMesh.geometry.dispose();netMesh=null;}ROADT.fill(0);}
