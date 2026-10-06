'use strict';
// ================================================================ city layout: planned towns
// Every settlement gets a plan drawn up front around its Town Hall, chosen from the lie of the land and a per-settlement seed:
//   radial (ring and spokes) | grid (rotated to the shore or the contours) | ribbon (along a river or coast) |
//   terrace (streets that follow the contours of a hillside) | crescent (arcs around a bay).
// The plan is data (G.plan, v3): streets (polylines), house plots along them, a civic plaza and DISTRICT ZONES
// (civic square, trade/mixed ring, residential blocks, an industrial wedge downwind, outer farm fields; harbour at the water).
// Buildings are only placed on plots (houses) or on street frontage inside the zone that suits them (everything else).
// The plan reacts: when the land changes (the player flattens, raises, drains) or the town outgrows its plots it is re-plotted,
// and the folk level the districts and cut terraces for the streets as they go (see lyGradeTick).
const LY={ign:0,rec:null,v:0,settle:1500};
const LY_NAME={radial:'ring-and-spoke town',grid:'gridded town',ribbon:'ribbon town along the water',terrace:'terraced hill town',crescent:'crescent around the bay'};
const LY_HOUSEZ=['mix','res'];
const LY_ZONES={church:['civic','mix'],market:['civic','mix'],tavern:['civic','mix'],well:['civic','mix','res'],school:['civic','mix'],smith:['civic','mix','ind'],mill:['mix','ind','res'],
  mason:['mix','ind'],sawmill:['mix','ind'],factory:['ind'],powerplant:['ind'],fusion:['ind','farm'],station:['mix','ind'],farm:['farm']};
const lyUnit=(x,z)=>{const l=Math.hypot(x,z)||1;return [x/l,z/l];};
function lySeedOf(hx,hz){return (((G.seed|0)*7919+Math.round(hx*13)*31+Math.round(hz*29)*17)^0x9e3779b9)|0;}
// ---------------------------------------------------------------- reading the land
function lyWaterVec(x,z,R){// vector to the nearest water (rings of 16 directions)
  for(let r=2;r<=R;r+=2){for(let k=0;k<16;k++){const a=k/16*TAU,dx=Math.cos(a)*r,dz=Math.sin(a)*r;if(wAt(x+dx,z+dz)>.1)return {d:r,nx:Math.cos(a),nz:Math.sin(a)};}}
  return null;}
function lyAnalyze(hx,hz){
  const R=72,st=6,A={flat:0,dry:0,ms:0,msN:0,gx:0,gz:0,wn:0,wc:[],dmin:99,nx:0,nz:0,cover:0,elong:1,wa:0,cx:hx,cz:hz};
  for(let j=-R;j<=R;j+=st)for(let i=-R;i<=R;i+=st){const x=hx+i,z=hz+j,d=Math.hypot(i,j);if(d>R||Math.abs(x)>HALF-4||Math.abs(z)>HALF-4)continue;
    if(wAt(x,z)>.08){A.wn++;A.wc.push([x,z,d]);if(d<A.dmin){A.dmin=d;A.nx=x;A.nz=z;}continue;}
    A.dry++;const dx=(hAt(x+6,z)-hAt(x-6,z))/12,dz=(hAt(x,z+6)-hAt(x,z-6))/12,sl=Math.hypot(dx,dz);if(sl<.1)A.flat++;
    if(d<48){A.ms+=sl;A.msN++;A.gx+=dx;A.gz+=dz;}}
  const near=A.wc.filter(c=>c[2]<68);
  if(near.length>=6){let mx=0,mz=0;for(const c of near){mx+=c[0];mz+=c[1];}mx/=near.length;mz/=near.length;let cxx=0,cxz=0,czz=0;for(const c of near){const a=c[0]-mx,b=c[1]-mz;cxx+=a*a;cxz+=a*b;czz+=b*b;}
    const tr=cxx+czz,det=cxx*czz-cxz*cxz,disc=Math.sqrt(Math.max(0,tr*tr/4-det)),l1=tr/2+disc,l2=Math.max(1,tr/2-disc);A.elong=Math.sqrt(l1/l2);A.wa=.5*Math.atan2(2*cxz,cxx-czz);A.cx=mx;A.cz=mz;}
  const bins=new Array(12).fill(0);for(const c of A.wc)if(c[2]>14&&c[2]<62)bins[Math.floor(((Math.atan2(c[1]-hz,c[0]-hx)/TAU+1)%1)*12)]++;A.cover=bins.filter(n=>n>=2).length;
  A.fl=A.dry?A.flat/A.dry:0;A.slope=A.msN?A.ms/A.msN:0;return A;}
function lyPickTemplate(A,rr){// a weighted draw (without replacement) among the plans the land allows, so two towns on similar land still differ
  if(typeof LY_FORCE==='string'&&LY_FORCE)return [LY_FORCE];
  const hill=A.slope>.3,W={radial:(.5+A.fl)*(hill?.25:1),grid:(.5+A.fl)*(hill?.25:1)};
  if(hill)W.terrace=3;
  if(A.wn>=10&&A.dmin<48&&A.elong>2.3)W.ribbon=2.4;
  if(A.wn>=40&&A.dmin<54&&A.cover>=6&&A.elong<2.1)W.crescent=2;
  const out=[];while(Object.keys(W).length){let tot=0;for(const k in W)tot+=W[k];let x=rr()*tot,pick=null;for(const k in W){x-=W[k];if(x<=0){pick=k;break;}}if(!pick)pick=Object.keys(W)[0];out.push(pick);delete W[pick];}
  return out;}
// ---------------------------------------------------------------- the frame of a plan (front direction f, plaza, template parameters)
function lyFrame(P,hall,A,rr,fixed){
  const tpl=P.tpl,hx=hall.x,hz=hall.z;let fx,fz;
  const toW=A.dmin<60?lyUnit(A.nx-hx,A.nz-hz):null,down=A.slope>.05?lyUnit(-A.gx,-A.gz):null;
  if(tpl==='ribbon'||(tpl==='grid'&&toW)){const p=[-Math.sin(A.wa),Math.cos(A.wa)];const dt=toW?p[0]*toW[0]+p[1]*toW[1]:1;[fx,fz]=dt>=0?p:[-p[0],-p[1]];}
  else if(tpl==='crescent'){[fx,fz]=lyUnit(A.cx-hx,A.cz-hz);}
  else if((tpl==='terrace'||tpl==='grid')&&down)[fx,fz]=down;
  else if(toW&&A.dmin<40&&rr()<.6)[fx,fz]=toW;
  else{const a=rr()*TAU;fx=Math.sin(a);fz=Math.cos(a);}
  let psi=Math.atan2(fx,fz);if(tpl==='grid'||tpl==='terrace'||tpl==='ribbon')psi+=(rr()-.5)*.1;else rr();
  if(fixed)psi=hall.rot;
  else for(const add of [0,PI/2,-PI/2,PI,PI/4,-PI/4,3*PI/4,-3*PI/4]){const a=psi+add,px=hx+Math.sin(a)*11,pz=hz+Math.cos(a)*11;
    if(wAt(px,pz)<.04&&wAt(px+Math.sin(a)*5,pz+Math.cos(a)*5)<.1&&Math.abs(px)<HALF-12&&Math.abs(pz)<HALF-12){psi=a;break;}}
  P.psi=psi;P.f=[Math.sin(psi),Math.cos(psi)];P.r=[Math.cos(psi),-Math.sin(psi)];
  P.C=[hx+P.f[0]*11,hz+P.f[1]*11];P.plaza={x:P.C[0],z:P.C[1],r:5.5};}
function lyPickIndustry(P,rr){// the industrial wedge: dry, downwind of the town, by the water if there is any, away from the hall's front
  const wind=rr()*TAU;let best=0,bs=-9;const fa=Math.atan2(P.f[1],P.f[0]);
  for(let k=0;k<12;k++){const a=k/12*TAU+rr()*.2;let dry=0,n=0;for(const r of [34,48,62,76])for(const da of [-.4,0,.4]){const x=P.C[0]+Math.cos(a+da)*r,z=P.C[1]+Math.sin(a+da)*r;n++;if(Math.abs(x)>HALF-12||Math.abs(z)>HALF-12)continue;if(wAt(x,z)<.05)dry++;}
    const sl=Math.abs(hAt(P.C[0]+Math.cos(a)*50,P.C[1]+Math.sin(a)*50)-hAt(P.C[0],P.C[1]));
    let s=dry/n*2-sl*.05+Math.cos(a-wind)*.7-(Math.cos(a-fa)>.6?1.2:0);if(lyWaterVec(P.C[0]+Math.cos(a)*45,P.C[1]+Math.sin(a)*45,20))s+=.5;
    if(s>bs){bs=s;best=a;}}
  P.ind={a:best,hw:.62};P.wind=wind;}
// ---------------------------------------------------------------- districts
function lyD(P,x,z){const dx=x-P.C[0],dz=z-P.C[1],e=P.el;if(!e)return Math.hypot(dx,dz);const al=dx*e[0]+dz*e[1],ac=-dx*e[1]+dz*e[0];return Math.hypot(al*e[2],ac*e[3]);}
function lyZone(P,x,z,stat){const d=lyD(P,x,z),s=P.sc,Z=P.z;if(d<Z.civic*s)return 'civic';
  if(P.ind&&d>=26*s){const dx=x-P.C[0],dz=z-P.C[1];if(Math.abs(angDiff(Math.atan2(dz,dx),P.ind.a))<P.ind.hw)return 'ind';}
  if(d<Z.mix*s)return 'mix';if(d<(stat||!P.zr?Z.res:Math.min(Z.res,P.zr))*s)return 'res';return 'farm';}
const lyRmax=P=>Math.min(HALF-14,P.z.res*P.sc+16);// reach of the plan, in the plan's own metric
const lyRlen=P=>Math.min(HALF*1.2,lyRmax(P)/(P.el?Math.min(P.el[2],1):1)+8);// length of the analytic lines
// ---------------------------------------------------------------- street primitives (analytic polylines, 2 units apart)
function lyLine(x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(L/2)),o=[];for(let i=0;i<=n;i++)o.push([x0+(x1-x0)*i/n,z0+(z1-z0)*i/n]);return o;}
function lyArc(fx,fz,r,a0,a1,wob,sd){const o=[],n=Math.max(2,Math.round(Math.abs(a1-a0)*r/2));for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,rr=r+(wob?(fbm(Math.cos(a)*3+r*.1,Math.sin(a)*3,sd,2)-.5)*wob:0);o.push([fx+Math.cos(a)*rr,fz+Math.sin(a)*rr]);}return o;}
function lyOffsetPts(pts,off){const o=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const [tx,tz]=lyUnit(b[0]-a[0],b[1]-a[1]);o.push([pts[i][0]+tz*off,pts[i][1]-tx*off]);}return o;}
function lyShoreN(x,z,R){// smoothed outward normal to the water around (x,z) and distance to the nearest water
  let sx=0,sz=0,n=0,dm=99;for(let j=-R;j<=R;j+=3)for(let i=-R;i<=R;i+=3){const d=Math.hypot(i,j);if(d>R||d<1)continue;if(wAt(x+i,z+j)>.1){const w=1/(d*d);sx+=i*w;sz+=j*w;n++;if(d<dm)dm=d;}}
  if(!n)return null;const l=Math.hypot(sx,sz);if(l<1e-9)return null;return {d:dm,nx:sx/l,nz:sz/l};}
function lySmooth(pts,k,passes){let a=pts;for(let p=0;p<passes;p++){a=a.map((q,i)=>{let sx=0,sz=0,c=0;for(let j=Math.max(0,i-k);j<=Math.min(a.length-1,i+k);j++){sx+=a[j][0];sz+=a[j][1];c++;}return [sx/c,sz/c];});}return a;}
function lyShoreWalk(x,z,dx,dz,len,target){const pts=[[x,z]];let hx=dx,hz=dz;
  for(let L=0;L<len;L+=2){const wn=lyShoreN(x,z,target+22);
    if(wn){let tx=-wn.nz,tz=wn.nx;if(tx*hx+tz*hz<0){tx=-tx;tz=-tz;}const e=clamp((wn.d-target)*.3,-1,1);hx=hx*.6+tx*.4;hz=hz*.6+tz*.4;const hl=Math.hypot(hx,hz);hx/=hl;hz/=hl;x+=hx*2+wn.nx*e;z+=hz*2+wn.nz*e;}
    else{x+=hx*2;z+=hz*2;}pts.push([x,z]);}
  return pts;}
function lyGrad(x,z){return [(hAt(x+2,z)-hAt(x-2,z))/4,(hAt(x,z+2)-hAt(x,z-2))/4];}
function lyContour(x,z,level,sgn,len){// walk along a contour line; first bring (x,z) onto the level
  for(let it=0;it<24;it++){const [gx,gz]=lyGrad(x,z),g2=gx*gx+gz*gz;if(g2<1e-4)break;const dh=level-hAt(x,z);if(Math.abs(dh)<.1)break;const m=clamp(dh/g2*.7,-3,3);x+=gx*m;z+=gz*m;}
  const pts=[[x,z]];let hx=0,hz=0;
  for(let L=0;L<len;L+=2){const [gx,gz]=lyGrad(x,z),g=Math.hypot(gx,gz);if(g<.02){if(!hx&&!hz)break;x+=hx*2;z+=hz*2;pts.push([x,z]);continue;}
    let tx=-gz/g*sgn,tz=gx/g*sgn;if((hx||hz)&&tx*hx+tz*hz<0){tx=-tx;tz=-tz;}hx=tx;hz=tz;x+=tx*2;z+=tz*2;
    const [gx2,gz2]=lyGrad(x,z),g22=gx2*gx2+gz2*gz2;if(g22>1e-4){const m=clamp((level-hAt(x,z))/g22*.6,-1.4,1.4);x+=gx2*m;z+=gz2*m;}
    pts.push([x,z]);}
  return pts;}
// the analytic street lines of a plan out to length R: [{pts,hw,kind,smax}]
function lyDefs(P,R){const D=[],C=P.C,f=P.f,r=P.r,rr=mulberry(P.seed^0x51ed270b),at=(a,b)=>[C[0]+f[0]*a+r[0]*b,C[1]+f[1]*a+r[1]*b];
  const phi=Math.atan2(f[1],f[0]),add=(pts,hw,kind,smax,o)=>D.push(Object.assign({pts,hw,kind,smax:smax||.42},o||{}));const tpl=P.tpl;
  if(tpl==='radial'){const n=5+(P.seed&3)%3+((P.seed>>3)&1),a0=phi+(rr()-.5)*.15;
    for(let k=0;k<n;k++){const a=a0+k*TAU/n+(rr()-.5)*.12,mn=k===0||k===Math.round(n/2);add(lyLine(C[0]+Math.cos(a)*6.4,C[1]+Math.sin(a)*6.4,C[0]+Math.cos(a)*R,C[1]+Math.sin(a)*R),mn?2.1:1.9,mn?'main':'lane');}
    const sp=27+rr()*4;for(let k=0,rad=25+rr()*3;rad<R;k++,rad+=sp)add(lyArc(C[0],C[1],rad,0,TAU,3.2,P.seed+k),k===0?2:1.7,'ring');}
  else if(tpl==='grid'){const Sx=28+rr()*4,Sz=27+rr()*4;
    add(lyLine(...at(6.4,0),...at(R,0)),2.2,'main');add(lyLine(...at(-22,0),...at(-R,0)),1.9,'lane');
    add(lyLine(...at(0,6.4),...at(0,R)),2.2,'main');add(lyLine(...at(0,-6.4),...at(0,-R)),2.2,'main');
    for(let i=1;i*Sx<R;i++)for(const sg of [1,-1])add(lyLine(...at(-R,sg*i*Sx),...at(R,sg*i*Sx)),1.7,'lane');
    for(let j=1;j*Sz<R;j++)for(const sg of [1,-1])add(lyLine(...at(sg*j*Sz,-R),...at(sg*j*Sz,R)),1.7,'lane');}
  else if(tpl==='ribbon'){const a=[-f[1],f[0]],tgt=P.shoreD||15;
    const w1=lyShoreWalk(C[0],C[1],a[0],a[1],R,tgt),w2=lyShoreWalk(C[0],C[1],-a[0],-a[1],R,tgt),main=lySmooth(w2.slice(1).reverse().concat(w1),3,2);
    add(main,2.2,'main',.5);if(tgt-7.5>2.5)add(lyOffsetPts(main,tgt-7.5),1.6,'lane',.5,{quay:1});
    for(let k=1;k<=3;k++)add(lyOffsetPts(main,-27*k),k===1?1.9:1.7,'lane',.5);
    for(let i=4;i<main.length-4;i+=13){const p=main[i],q=main[i+1],[ux,uz]=lyUnit(q[0]-p[0],q[1]-p[1]),nx=uz,nz=-ux;add(lyLine(p[0]+nx*(tgt-7),p[1]+nz*(tgt-7),p[0]-nx*R*.8,p[1]-nz*R*.8),1.7,'lane',.5);}}
  else if(tpl==='terrace'){const hC=hAt(C[0],C[1]),sl=Math.max(.06,P.slope||.15),dl=clamp(sl*28,1.4,6);
    for(let k=-2;k<=2;k++){const L=hC+k*dl,a=lyContour(C[0],C[1],L,1,R),b=lyContour(C[0],C[1],L,-1,R);if(a.length+b.length<8)continue;add(lySmooth(b.slice(1).reverse().concat(a),3,2),k===0?2.1:1.8,k===0?'main':'lane',.5);}
    const m0=lyContour(C[0],C[1],hC,1,R*.9),m1=lyContour(C[0],C[1],hC,-1,R*.9),mid=m1.slice(1).reverse().concat(m0);
    for(let i=6;i<mid.length-3;i+=17){const [x,z]=mid[i];for(const s2 of [1,-1]){const pts=[[x,z]];let px=x,pz=z;for(let L=0;L<46;L+=2){const [gx,gz]=lyGrad(px,pz),g=Math.hypot(gx,gz)||1;px-=gx/g*2*s2;pz-=gz/g*2*s2;pts.push([px,pz]);}add(pts,1.5,'lane',.75,{stair:1});}}}
  else if(tpl==='crescent'){const F=P.F,r0=Math.hypot(F[0]-C[0],F[1]-C[1]),beta=Math.atan2(C[1]-F[1],C[0]-F[0]),sw=1.85;
    for(let k=0;;k++){const rad=r0+(k-.2)*24;if(rad>R+r0)break;if(rad<6)continue;add(lyArc(F[0],F[1],rad,beta-sw,beta+sw,2.4,P.seed+k),k<=1?2:1.7,k===1?'main':'lane');}
    for(let j=-7;j<=7;j++){const a=beta+j*.27,rin=j%4===0?Math.max(r0-10,4):j%2===0?r0+14:r0+48;add(lyLine(F[0]+Math.cos(a)*rin,F[1]+Math.sin(a)*rin,F[0]+Math.cos(a)*(r0+R),F[1]+Math.sin(a)*(r0+R)),j===0?2.1:1.7,j===0?'main':'lane');}}
  return D;}
// ---------------------------------------------------------------- laying the lines onto the land
function lyHashPts(P){const M=new Map();for(const s of P.streets)for(const p of s.pts){const k=Math.floor(p[0]/4)*4096+Math.floor(p[1]/4);let a=M.get(k);if(!a)M.set(k,a=[]);a.push(p);}return M;}
function lyNearHash(M,x,z,r){const ci=Math.floor(x/4),cj=Math.floor(z/4);for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const a=M.get(i*4096+j);if(a)for(const p of a)if(Math.hypot(p[0]-x,p[1]-z)<r)return true;}return false;}
function lyBuildHash(){const M=new Map();for(const b of buildings){const k=Math.floor(b.x/8)*4096+Math.floor(b.z/8);let a=M.get(k);if(!a)M.set(k,a=[]);a.push(b);}return M;}
function lyBuildingsNear(M,x,z,r){const o=[],ci=Math.floor(x/8),cj=Math.floor(z/8),n=Math.ceil((r+8)/8);for(let i=ci-n;i<=ci+n;i++)for(let j=cj-n;j<=cj+n;j++){const a=M.get(i*4096+j);if(a)for(const b of a)o.push(b);}return o;}
function lyClip(P,d,exist,bh,rmax){
  const hw=d.hw,hr=P.hallR,pl=P.plaza,runs=[];let cur=[],prev=null,dupPrev=null;
  const flush=()=>{if(cur.length>=5)runs.push(cur);cur=[];};
  for(let i=0;i<d.pts.length;i++){const [x,z]=d.pts[i];let ok=streetPtOK(x,z,hw);
    if(ok&&lyD(P,x,z)>rmax)ok=false;
    if(ok&&hr&&rectsHit(fpRect(x,z,0,[-hw,hw,-hw,hw]),hr,1.4))ok=false;
    if(ok&&Math.hypot(x-pl.x,z-pl.z)<pl.r+.6)ok=false;
    if(ok&&prev&&Math.abs(hAt(x,z)-hAt(prev[0],prev[1]))/Math.max(.5,Math.hypot(x-prev[0],z-prev[1]))>d.smax)ok=false;
    if(ok&&bh){const q=fpRect(x,z,0,[-hw,hw,-hw,hw]);for(const b of lyBuildingsNear(bh,x,z,hw+2))if(rectsHit(q,bRect(b),.9)){ok=false;break;}}
    const dup=ok&&exist&&lyNearHash(exist,x,z,3.4);
    if(!ok){if(cur.length)flush();prev=null;dupPrev=null;continue;}
    if(dup){if(cur.length){cur.push([x,z]);flush();}dupPrev=[x,z];prev=[x,z];continue;}
    if(!cur.length&&dupPrev)cur.push(dupPrev);cur.push([x,z]);dupPrev=null;prev=[x,z];}
  flush();return runs;}
function lyLay(P,defs,opt){opt=opt||{};const rmax=lyRmax(P),exist=P.streets.length?lyHashPts(P):null,bh=opt.avoidB?lyBuildHash():null,added=[];
  for(const d of defs)for(const run of lyClip(P,d,exist,bh,rmax)){const s={pts:run.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),hw:d.hw,kind:d.kind,painted:0,gen:P.gen||0};if(d.stair)s.stair=1;if(d.quay)s.quay=1;
    lyParent(P,s);P.streets.push(s);added.push(s);}
  return added;}
function lyParent(P,s){let best=null,bd=7;for(const o of P.streets){if(o===s)continue;for(const e of [s.pts[0],s.pts[s.pts.length-1]])for(let i=0;i<o.pts.length;i++){const d=Math.hypot(o.pts[i][0]-e[0],o.pts[i][1]-e[1]);if(d<bd){bd=d;best=o;}}}
  s.par=best?P.streets.indexOf(best):-1;Object.defineProperty(s,'parent',{value:best,enumerable:false,writable:true,configurable:true});}
function lyRelink(P){for(const s of P.streets)Object.defineProperty(s,'parent',{value:s.par>=0?P.streets[s.par]:null,enumerable:false,writable:true,configurable:true});}
// ---------------------------------------------------------------- plots (house lots along the streets)
function lyPlotOK(P,pl,chkB){const R=fpRect(pl.x,pl.z,pl.rot,fpOf('house',pl.w));if(Math.abs(pl.x)>HALF-8||Math.abs(pl.z)>HALF-8)return false;
  for(const o of P.plots){if(Math.abs(o.x-pl.x)>9||Math.abs(o.z-pl.z)>9)continue;const row=Math.abs(angDiff(o.rot,pl.rot))<.02;if(rectsHit(R,fpRect(o.x,o.z,o.rot,fpOf('house',o.w)),row?-.08:.6))return false;}
  if(streetHit(R))return false;if(P.hallR&&rectsHit(R,P.hallR,.8))return false;
  let mn=1e9,mx=-1e9;for(const lx of [R.f[0],0,R.f[1]])for(const lz of [R.f[2],0,R.f[3]]){const wx=pl.x+lx*R.cs+lz*R.sn,wz=pl.z-lx*R.sn+lz*R.cs;if(wAt(wx,wz)>.08)return false;const h=hAt(wx,wz);mn=Math.min(mn,h);mx=Math.max(mx,h);}
  if(mx-mn>=(P.tpl==='terrace'?4.2:2.8))return false;
  if(chkB&&blockedAt('house',pl.x,pl.z,pl.rot,pl.w,null))return false;
  return true;}
function lyPlots(P,s,box,chkB){const pts=s.pts,si=P.streets.indexOf(s);let n=0;if(s.stair)return 0;
  for(const side of [1,-1]){let carry=0,inRow=0,rowMax=3+Math.floor(rnd()*3),prev=null;
    for(let i=0;i<pts.length-1;i++){const [x0,z0]=pts[i],[x1,z1]=pts[i+1];const tx=x1-x0,tz=z1-z0,tl=Math.hypot(tx,tz);if(tl<1e-3)continue;const ux=tx/tl,uz=tz/tl,nx=-uz*side,nz=ux*side;
      let t=carry;while(t<tl){const w=Math.round((3.3+rnd()*.9)*10)/10;
        if(i===0&&t<4&&s.kind!=='ring'){t+=1;continue;}
        const off=s.hw+.55+2.6,cxp=x0+ux*(t+w/2)+nx*off,czp=z0+uz*(t+w/2)+nz*off,rot=Math.atan2(-nx,-nz);
        if(box&&(cxp<box[0]||cxp>box[2]||czp<box[1]||czp>box[3])){t+=w;prev=null;inRow=0;continue;}
        const zn=lyZone(P,cxp,czp,true);if(!LY_HOUSEZ.includes(zn)||(zn==='mix'&&s.kind==='main'&&lyD(P,cxp,czp)<26*P.sc)){prev=null;inRow=0;t+=w;continue;}
        const pl={x:+cxp.toFixed(2),z:+czp.toFixed(2),rot:+rot.toFixed(4),w,st:si,i,d:Math.hypot(cxp-P.plaza.x,czp-P.plaza.z)};
        if(prev&&Math.abs(angDiff(prev.rot,pl.rot))<.02&&inRow<rowMax){const cs=Math.cos(prev.rot),sn=Math.sin(prev.rot),sx=(prev.w+w)/2*(-side);pl.x=+(prev.x+sx*cs).toFixed(3);pl.z=+(prev.z-sx*sn).toFixed(3);pl.rot=prev.rot;}
        if(lyPlotOK(P,pl,chkB)){P.plots.push(pl);n++;prev=pl;inRow++;if(inRow>=rowMax){t+=w+1.8;inRow=0;prev=null;rowMax=3+Math.floor(rnd()*3);continue;}}else{prev=null;inRow=0;}
        t+=w;}
      carry=t-tl;}}
  return n;}
// ---------------------------------------------------------------- making a plan
function lyBuild(hall,tpl,seed,A,founding){
  const rr=mulberry(seed^0x2545f491),P={v:3,seed,tpl,streets:[],plots:[],gen:0,sc:1,z:{civic:12,mix:34,res:60},slope:+A.slope.toFixed(3),eraSeen:G.era||0,seenV:0};G.plan=P;
  lyFrame(P,hall,A,rr,!founding);
  if(tpl==='ribbon'){P.shoreD=15;P.el=[-P.f[1],P.f[0],.62,1.35];}
  if(tpl==='terrace')P.el=[-P.f[1],P.f[0],.7,1.25];
  if(tpl==='crescent')P.F=[A.cx,A.cz];
  P.hallR=fpRect(hall.x,hall.z,founding?P.psi:hall.rot,[-6.3,5.2,-5.2,5.2]);
  const pre=buildings.length>1;lyPickIndustry(P,rr);lyLay(P,lyDefs(P,lyRlen(P)),{avoidB:pre});
  for(const s of P.streets)lyPlots(P,s,null,pre);
  return P;}
makePlan=function(hall){
  const seed=lySeedOf(hall.x,hall.z),rr=mulberry(seed),A=lyAnalyze(hall.x,hall.z),founding=!!(hall.build&&!G.firstHut),order=lyPickTemplate(A,rr);
  let best=null;for(const t of order.slice(0,3)){const P=lyBuild(hall,t,seed,A,founding);P.q=(P.plots.length+Math.min(30,P.streets.length))*({radial:1.25,crescent:1.35,ribbon:1.4,terrace:1.5}[t]||1);if(!best||P.q>best.q)best=P;if(P.plots.length>=(t==='grid'||t==='radial'?52:30))break;}
  const P=G.plan=best;
  if(founding){hall.rot=P.psi;realize(hall);}// the hall turns to face its plaza while it is still being founded
  for(const s of P.streets)if(s.kind==='main'&&s.par<0)paintStreetTo(s,Math.min(8,s.pts.length-1));
  if(MODE==='god')chron(`The elders walked the ground and laid out ${G.town||'the town'} as a ${LY_NAME[P.tpl]}.`);
  return P;};
// ---------------------------------------------------------------- finding places
function lyOccupied(M,x,z,r){const ci=Math.floor(x/8),cj=Math.floor(z/8);for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++){const a=M.get(i*4096+j);if(a)for(const b of a)if(Math.hypot(b.x-x,b.z-z)<r)return true;}return false;}
function lyFreePlots(P){const M=lyBuildHash();let n=0;for(const p of P.plots)if(!lyOccupied(M,p.x,p.z,3.2))n++;return n;}
function lyFront(P,type,zs,dmin,dmax,o){o=o||{};const out=[],front=fpOf(type)[3],pl=P.plaza,C=P.C;
  if(o.plaza)for(let k=0;k<16;k++){const a=k/16*TAU,r=pl.r+front+.7;out.push([pl.x+Math.sin(a)*r,pl.z+Math.cos(a)*r,{rot:Math.atan2(-Math.sin(a),-Math.cos(a)),front:1}]);}
  for(const s of P.streets){if(s.stair)continue;if(o.kinds&&!o.kinds.includes(s.kind))continue;
    for(let i=1;i<s.pts.length-1;i+=2){const [x0,z0]=s.pts[i],[x1,z1]=s.pts[i+1],d=Math.hypot(x0-C[0],z0-C[1]);if(d<dmin||d>dmax)continue;
      const tl=Math.hypot(x1-x0,z1-z0)||1,ux=(x1-x0)/tl,uz=(z1-z0)/tl;
      for(const side of [1,-1])for(const extra of (o.rows||[0])){const nx=-uz*side,nz=ux*side,off=s.hw+.6+front+extra,px=x0+nx*off,pz=z0+nz*off;
        if(zs&&!zs.includes(lyZone(P,px,pz)))continue;out.push([px,pz,{rot:Math.atan2(-nx,-nz),front:1}]);}}}
  return out;}
function lyShuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// candidates for findSite on a v3 plan: houses on plots, everything else on the frontage of its district
function lyFillCands(need,cands){const P=G.plan,type=need.type,keep=cands.slice();cands.length=0;
  if(type==='house'){const bh=lyBuildHash(),ps=[];
    for(const p of P.plots){if(lyOccupied(bh,p.x,p.z,3.2))continue;let nb=0;for(const o of lyBuildingsNear(bh,p.x,p.z,8))if(o.type==='house'&&Math.abs(o.x-p.x)<6&&Math.abs(o.z-p.z)<6)nb++;
      let sc=p.d-nb*4+rnd()*6;if(need.fam){const ph=buildings.find(b=>b.type==='house'&&G.vill.some(v=>v.home===b.id&&v.fam===need.fam));if(ph)sc+=Math.hypot(ph.x-p.x,ph.z-p.z)*.4;}ps.push([p,sc]);}
    ps.sort((a,b)=>a[1]-b[1]);let n=0;for(const [p] of ps){if(n>=36)break;if(blockedAt('house',p.x,p.z,p.rot,p.w,null))continue;cands.push([p.x,p.z,{rot:p.rot,w:p.w,d:+(3.2+rnd()*.5).toFixed(1),plot:p}]);n++;}
    return;}
  const zs=LY_ZONES[type],mixR=P.z.mix*P.sc+10,resR=P.z.res*P.sc+18;let fr=null;
  if(type==='farm')fr=lyFront(P,type,zs,18,resR+40,{rows:[4.1-.6,15.4]});
  else if(['church','market','tavern','well','school'].includes(type))fr=lyFront(P,type,zs,0,mixR,{plaza:type!=='school'});
  else if(['smith','mill','mason','sawmill','station'].includes(type))fr=lyFront(P,type,zs,8,resR);
  else if(['factory','powerplant','fusion'].includes(type))fr=lyFront(P,type,zs,22,lyRmax(P)+12,{rows:[0,3]});
  else if(type==='tower'||type==='castle')fr=lyFront(P,type,null,26,lyRmax(P)+8);
  if(type==='well'||type==='market'){const pl=P.plaza;fr=fr||[];for(let k=0;k<8;k++){const a=k/8*TAU,rr=type==='market'?0:2.6;fr.push([pl.x+Math.sin(a)*rr,pl.z+Math.cos(a)*rr,{rot:Math.atan2(G.center.x-pl.x,G.center.z-pl.z)+PI,front:1}]);}}
  if(fr){lyShuffle(fr);for(const c of fr.slice(0,170))cands.push(c);}
  else for(const c of keep)cands.push([c[0],c[1],c[2]||{rot:faceStreetRot(c[0],c[1],rnd()*TAU)}]);}
// hard zone rule and a soft bonus (called from evalSite)
function lyScore(type,x,z,s,snap){const P=G.plan;if(!P||P.v<3)return s;const zs=LY_ZONES[type];if(!zs||(snap&&snap.plot))return s;
  const z0=lyZone(P,x,z);if(!zs.includes(z0))return null;s+=z0===zs[0]?6:2;
  if(type==='farm'){const wd=nearWater(x,z,16);if(wd<16)s+=6-wd*.25;}// fields like level ground by the water
  return s;}
// the town ran out of room: widen the plan (more streets and plots further out)
function lyGrow(){const P=G.plan;if(!P||P.v<3||P.sc>=1.95||G.t<(P.growT||0))return false;P.growT=G.t+10;P.sc=+(P.sc+.14).toFixed(2);
  const n0=P.streets.length,added=lyLay(P,lyDefs(P,lyRlen(P)),{avoidB:true});let np=0;for(const s of added)np+=lyPlots(P,s,null,true);for(let i=0;i<n0;i++)np+=lyPlots(P,P.streets[i],null,true);
  if(added.length||np){G.failCool={};G.siteFail=null;if(MODE==='god')chron(`${G.town} spread outward: the elders staked new streets and plots.`);}
  return true;}
extendPlanToward=(function(old){return function(x,z){const P=G.plan;if(!P||P.v<3)return old(x,z);if(P.plots.some(p=>Math.hypot(p.x-x,p.z-z)<12))return false;
  const n=nearestStreet(x,z);if(!n)return false;const dx=x-n.p[0],dz=z-n.p[1],d=Math.hypot(dx,dz)||1;
  const s=walkStreet(P,n.p[0]+dx/d*(n.s.hw+.3),n.p[1]+dz/d*(n.s.hw+.3),dx/d,dz/d,Math.min(70,d+20),1.6,'lane',n.s);if(!s)return false;s.gen=P.gen;P.streets.push(s);lyParent(P,s);lyPlots(P,s,null,true);return true;};})(extendPlanToward);
// ---------------------------------------------------------------- the plan reacts to changes of the land
function lyNote(i0,j0,i1,j1){if(LY.ign||G.phase!=='play')return;const x0=i0-HALF,z0=j0-HALF,x1=i1-HALF,z1=j1-HALF,r=LY.rec,now=performance.now();
  if(r&&now-r.rt<8000){r.x0=Math.min(r.x0,x0);r.z0=Math.min(r.z0,z0);r.x1=Math.max(r.x1,x1);r.z1=Math.max(r.z1,z1);r.rt=now;}else LY.rec={x0,z0,x1,z1,rt:now};LY.v++;}
{const _rt=refreshTerrain;refreshTerrain=function(i0,j0,i1,j1){try{lyNote(i0===undefined?0:i0,j0===undefined?0:j0,i1===undefined?N:i1,j1===undefined?N:j1);}catch(e){}return _rt.apply(this,arguments);};}
{const _ab=applyBrush;applyBrush=function(dt){try{if(hover&&['pour','drain','spring'].includes(tool)){const R=brush.r+4;lyNote(Math.floor(hover.x-R+HALF),Math.floor(hover.z-R+HALF),Math.ceil(hover.x+R+HALF),Math.ceil(hover.z+R+HALF));}}catch(e){}return _ab.apply(this,arguments);};}
function lyChanged(P){const p=LY.rec;if(!p||P.seenV===LY.v||performance.now()-p.rt<LY.settle)return null;const hx=G.center.x,hz=G.center.z,R=lyRmax(P)+30;
  if(p.x1<hx-R||p.x0>hx+R||p.z1<hz-R||p.z0>hz+R){P.seenV=LY.v;return null;}return p;}
function lyRegen(P,box){// lay the lines of the template again: new runs appear where the land now allows, plots fill in
  const added=lyLay(P,lyDefs(P,lyRlen(P)),{avoidB:true}),n0=P.streets.length-added.length;let np=0;for(const s of added)np+=lyPlots(P,s,null,true);
  const b=box?[box.x0-14,box.z0-14,box.x1+14,box.z1+14]:null;for(let i=0;i<n0;i++)np+=lyPlots(P,P.streets[i],b,true);
  return {streets:added.length,plots:np};}
function lyLandTick(){const P=G.plan;if(!P||P.v<3||!G.center)return;
  P.zr=clamp(24+Math.sqrt(popN())*5,36,P.z.res);// the fields lie just beyond the houses: the belt moves outward as the town grows
  const p=lyChanged(P);
  if(p&&G.t>=(P.reT||0)){P.reT=G.t+3;P.seenV=LY.v;const box={x0:p.x0,z0:p.z0,x1:p.x1,z1:p.z1},cx=(box.x0+box.x1)/2,cz=(box.z0+box.z1)/2;
    let r={streets:0,plots:0};r=lyRegen(P,box);
    if(!r.plots&&wAt(cx,cz)<.05&&Math.hypot(cx-G.center.x,cz-G.center.z)<lyRmax(P)+40&&!P.plots.some(q=>Math.hypot(q.x-cx,q.z-cz)<12))extendPlanToward(cx,cz);
    G.siteFail=null;G.failCool={};
    if(r.streets||r.plots)chron(`The elders redrew the plan where the land had changed: ${r.streets?r.streets+' new street'+(r.streets>1?'s':'')+' and ':''}${r.plots} new plots.`);}
  if(G.t>=(P.growT||0)&&lyFreePlots(P)<4+Math.floor(popN()/45))lyGrow();}
// ---------------------------------------------------------------- the folk level districts and cut terraces
function lyFallow(x,z,r){for(const m of G.markers)if(m.k==='forbid'&&Math.hypot(m.x-x,m.z-z)<r)return false;return true;}
function lyGradeSeg(s,a,b,cap){// level a bench along street points a..b: the street bed and the plots on both sides share one smooth profile
  const pts=s.pts.slice(a,b+1);if(pts.length<3)return 0;const n=pts.length,h0=pts.map(p=>hAt(p[0],p[1]));
  const sm=h0.map((_,i)=>{let t=0,c=0;for(let j=Math.max(0,i-3);j<=Math.min(n-1,i+3);j++){t+=h0[j];c++;}return t/c;});
  for(let it=0;it<2;it++){for(let i=1;i<n;i++)sm[i]=clamp(sm[i],sm[i-1]-.34,sm[i-1]+.34);for(let i=n-2;i>=0;i--)sm[i]=clamp(sm[i],sm[i+1]-.34,sm[i+1]+.34);}
  const wi=s.hw+7.4,wo=wi+3.2;let i0=N,j0=N,i1=0,j1=0;for(const p of pts){i0=Math.min(i0,Math.floor(p[0]-wo+HALF));i1=Math.max(i1,Math.ceil(p[0]+wo+HALF));j0=Math.min(j0,Math.floor(p[1]-wo+HALF));j1=Math.max(j1,Math.ceil(p[1]+wo+HALF));}
  i0=Math.max(1,i0);j0=Math.max(1,j0);i1=Math.min(N-1,i1);j1=Math.min(N-1,j1);
  const bl=buildings.filter(o=>o.x>i0-HALF-8&&o.x<i1-HALF+8&&o.z>j0-HALF-8&&o.z<j1-HALF+8);let moved=0;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*S+i;if(W[k]>.04)continue;const x=i-HALF,z=j-HALF;let bd=1e9,bi=0;
    for(let q=0;q<n;q++){const dx=pts[q][0]-x,dz=pts[q][1]-z,d=dx*dx+dz*dz;if(d<bd){bd=d;bi=q;}}bd=Math.sqrt(bd);if(bd>wo)continue;
    let blocked=false;for(const o of bl)if(Math.hypot(o.x-x,o.z-z)<(o.r||3)+.6){blocked=true;break;}if(blocked)continue;
    const w=bd<wi?1:1-sstep(wi,wo,bd),dh=clamp((sm[bi]-H[k])*w,-cap,cap);H[k]+=dh;moved+=Math.abs(dh);}
  if(moved<.6)return 0;LY.ign++;try{refreshTerrain(i0,j0,i1,j1);}finally{LY.ign--;}treesDirty=true;gridDirty=true;
  const m=pts[n>>1];tfDust(m[0],m[1],26);tfDust(pts[0][0],pts[0][1],10);return moved;}
function lyRough(s,a,b){const n=Math.min(b,s.pts.length-1);let lo=1e9,hi=-1e9,steep=0;for(let i=a;i<=n;i++){const [x,z]=s.pts[i];for(const o of [-6,0,6]){const h=hAt(x+o,z+o*.5);lo=Math.min(lo,h);hi=Math.max(hi,h);}
  if(i>a)steep=Math.max(steep,Math.abs(hAt(x,z)-hAt(s.pts[i-1][0],s.pts[i-1][1]))/2);}return Math.max(steep*6,(hi-lo)*.45);}
function lyUsablePlots(P){const M=lyBuildHash(),lim=2.6+tfExtra();let n=0;
  for(const p of P.plots){if(lyOccupied(M,p.x,p.z,3.2))continue;let mn=1e9,mx=-1e9;for(const [lx,lz] of [[-1.8,-4.8],[1.8,-4.8],[0,-1],[-1.8,2.6],[1.8,2.6]]){const cs=Math.cos(p.rot),sn=Math.sin(p.rot),h=hAt(p.x+lx*cs+lz*sn,p.z-lx*sn+lz*cs);mn=Math.min(mn,h);mx=Math.max(mx,h);}if(mx-mn<lim)n++;}
  return n;}
function lyGradeTick(){const P=G.plan;if(MODE!=='god'||!P||P.v<3||(G.era||0)<1||!G.tf||!G.center||G.center.build)return;if(G.t<(P.gT||0))return;P.gT=G.t+3;
  // the folk level ground when the town has too few good plots, nearest the square first
  if(lyUsablePlots(P)>=6+Math.floor(popN()/22)){lyReclaim(P);return;}
  const cap=tfCap()*.55,d0=s=>Math.hypot(s.pts[0][0]-P.C[0],s.pts[0][1]-P.C[1]);
  const ordered=P.streets.filter(s=>!s.stair).sort((a,b)=>d0(a)-d0(b));
  for(const s of ordered){let gi=s.gi||0;
    while(gi<s.pts.length-1){const e=Math.min(gi+9,s.pts.length-1),m=s.pts[(gi+e)>>1];
      if(lyD(P,m[0],m[1])>P.z.res*P.sc+8){gi=s.pts.length;break;}
      if(!lyFallow(m[0],m[1],10)){gi=e;continue;}
      const rough=lyRough(s,gi,e);if(rough<.5){gi=e;s.gp=0;continue;}
      if(rough>1.4){if(P.tfAllow===false||(G.era||0)<2){gi=e;continue;}
        if(P.tfAllow===undefined){const T=tfEnsure();if(!T.pet.some(q=>q.k==='terrace')&&!(T.cool.terrace>dayN()))tfFile('terrace',{x:m[0],z:m[1],n:Math.round(rough*10)});s.gi=gi;return;}}
      const mv=lyGradeSeg(s,gi,e,cap);s.gp=(s.gp||0)+1;
      if(mv&&((P.nGr=(P.nGr||0)+1)%3===1))chron(rough>1.3?`The folk cut a terrace into the slope for the ${s.kind==='main'?'main street':'new street'} ${dirWord(m[0],m[1])} of ${G.town}.`:`The folk levelled the ground along a new street ${dirWord(m[0],m[1])} of ${G.town}.`);
      if(!mv||s.gp>=3){gi=e;s.gp=0;}s.gi=gi;return;}
    s.gi=gi;}
  lyReclaim(P);}
// shallow shore beside a street is filled in, so the town reaches the water's edge
function lyReclaim(P){if((G.era||0)<2||P.tfAllow===false)return;
  for(const s of P.streets){if(s.painted<4)continue;for(let i=2;i<Math.min(s.painted,s.pts.length-1);i+=3){const [x,z]=s.pts[i],key=Math.round(x/6)+','+Math.round(z/6);if(P.rcl&&P.rcl[key])continue;
    const R=s.hw+6.5;let wet=0;const [i0,j0,i1,j1]=tfRegion(x,z,R);for(let j=j0;j<=j1;j++)for(let ii=i0;ii<=i1;ii++){const k=j*S+ii;if(W[k]>.04&&W[k]<.4&&Math.hypot(ii-HALF-x,j-HALF-z)<R)wet++;}
    if(!wet||wet>90||!lyFallow(x,z,10))continue;(P.rcl||(P.rcl={}))[key]=1;
    for(let j=j0;j<=j1;j++)for(let ii=i0;ii<=i1;ii++){const k=j*S+ii;if(W[k]>.04&&W[k]<.4&&Math.hypot(ii-HALF-x,j-HALF-z)<R){H[k]+=W[k]+.12;W[k]=0;}}
    LY.ign++;try{refreshTerrain(i0,j0,i1,j1);updateWaterMesh(true);}finally{LY.ign--;}tfDust(x,z,20,[.5,.5,.42]);gridDirty=true;
    if((P.nRc=(P.nRc||0)+1)%4===1)chron(`The folk filled in the shallows ${dirWord(x,z)} of ${G.town} to carry the street to the water.`);return;}}}
// ---------------------------------------------------------------- roads laid as the town grows
function lyRoadTick(){const P=G.plan;if(!P||P.v<3||!G.center)return;const bh=lyBuildHash();
  for(const s of P.streets){if(s.painted>=s.pts.length-1)continue;let far=-1;
    for(let i=Math.max(0,s.painted);i<s.pts.length;i+=2){const [x,z]=s.pts[i];if(lyBuildingsNear(bh,x,z,9).some(b=>!b.build&&Math.hypot(b.x-x,b.z-z)<9))far=i;}
    if(far>s.painted)paintStreetTo(s,Math.min(s.pts.length-1,far+3));}}
// ---------------------------------------------------------------- hooks
{const _pt=planTick;planTick=function(){_pt.apply(this,arguments);try{lyLandTick();lyGradeTick();}catch(e){console.error('layout tick',e);}};}
{const _ed=eraDaily;eraDaily=function(){_ed.apply(this,arguments);try{lyRoadTick();}catch(e){console.error('road tick',e);}};}
{const _td=tfDecide;tfDecide=function(id,yes){const p=tfEnsure().pet.find(q=>q.id===id);if(p&&p.k==='terrace'&&G.plan)G.plan.tfAllow=!!yes;return _td.apply(this,arguments);};}
{const _lt=loadTown;loadTown=function(td){_lt.apply(this,arguments);if(G.plan&&G.plan.v>=3)lyRelink(G.plan);};}

// where a road to the edge of the valley leaves the town: the outer end of the plan's street that points that way (not the hall door)
function lyGate(t){const P=G.plan;if(!P||P.v<3)return null;const [dx,dz]=lyUnit(t[0]-P.C[0],t[1]-P.C[1]);let best=null,bs=-1e9;
  for(const s of P.streets){if(s.kind==='lane'&&s.hw<1.8)continue;for(const e of [s.pts[0],s.pts[s.pts.length-1]]){const ex=e[0]-P.C[0],ez=e[1]-P.C[1],al=ex*dx+ez*dz,side=Math.abs(-ex*dz+ez*dx),sc=al-side*.8;if(sc>bs&&wAt(e[0],e[1])<.05){bs=sc;best=e;}}}
  return best?[best[0],best[1]]:null;}
