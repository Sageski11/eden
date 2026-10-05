'use strict';
// ================================================================ town planning: plaza, streets that follow the land, plots along them
// Footprint reserves (local x0,x1,z0,z1; +z is the front/door). Measured from the generators, padded, covering every upgrade level.
const FPR={church:[-2.7,2.7,-3.9,3.9],well:[-1.4,1.4,-1.3,1.3],castle:[-7,7,-7,7],smith:[-2.8,2.8,-2.8,2.8],mill:[-3.4,3.4,-3.4,2],tavern:[-4.1,6.3,-3.3,5.1],
  market:[-4.9,4.9,-5,5],tower:[-1.5,1.5,-1.5,1.8],farm:[-5.1,5.1,-4.1,4.1],quarry:[-3.5,3.6,-3.5,3],hall:[-5.8,4.7,-4.7,4.7],dock:[-3.1,4.9,-.7,7.9],
  fishmkt:[-4.2,4.2,-5.4,3.8],lodge:[-4.4,5.4,-2.4,4.5],shipyard:[-2.5,4.9,-6.6,10.1],sawmill:[-3.8,4.5,-2.9,2.9],mason:[-2.8,2.7,-2.4,2.3],camp:[-4.6,4.8,-4.7,5.3]};
function fpOf(type,w){if(type==='house'){const h=(w||3.6)/2+.02;return [-h,h,-4.8,2.6];}return FPR[type]||[-3,3,-3,3];}
function fpRect(x,z,rot,f){return {x,z,cs:Math.cos(rot),sn:Math.sin(rot),f};}
function _proj(R,ax,az){// project rect onto axis -> [min,max]
  const {x,z,cs,sn,f}=R;let mn=1e9,mx=-1e9;for(const lx of [f[0],f[1]])for(const lz of [f[2],f[3]]){const wx=x+lx*cs+lz*sn,wz=z-lx*sn+lz*cs;const p=wx*ax+wz*az;if(p<mn)mn=p;if(p>mx)mx=p;}return [mn,mx];}
function rectsHit(A,B,m){for(const R of [A,B]){for(const [ax,az] of [[R.cs,-R.sn],[R.sn,R.cs]]){const a=_proj(A,ax,az),b=_proj(B,ax,az);if(a[1]+m<=b[0]||b[1]+m<=a[0])return false;}}return true;}
function bRect(b){return fpRect(b.x,b.z,b.rot,fpOf(b.type,b.w));}
function sameRow(a,type,x,z,rot,w){if(a.type!=='house'||type!=='house')return false;if(Math.abs(angDiff(a.rot,rot))>.02)return false;
  const cs=Math.cos(a.rot),sn=Math.sin(a.rot),dx=x-a.x,dz=z-a.z;const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;return Math.abs(lz)<.4&&Math.abs(Math.abs(lx)-(a.w+w)/2)<.4;}
// true if a building of this type/footprint collides with any building or planned street
function blockedAt(type,x,z,rot,w,ignore){const R=fpRect(x,z,rot,fpOf(type,w));const rr=Math.hypot(R.f[0],R.f[2])+Math.hypot(R.f[1],R.f[3]);
  for(const o of buildings){if(o===ignore)continue;const or=o.type==='house'?6:Math.max(o.r||3,(FPR[o.type]?Math.hypot(FPR[o.type][1],FPR[o.type][3]):4))+2;if(Math.hypot(o.x-x,o.z-z)>rr+or)continue;
    const row=sameRow(o,type,x,z,rot,w);if(rectsHit(R,bRect(o),row?-.08:.9))return true;}
  if(G.plan&&!['dock','shipyard'].includes(type)&&streetHit(R,type==='well'||type==='market',!['house','church','market','tavern','smith','well','fishmkt','hall'].includes(type)))return true;
  return false;}
function streetHit(R,skipPlaza,paintedOnly){const P=G.plan;const {x,z,cs,sn,f}=R;const rad=Math.max(Math.abs(f[0]),Math.abs(f[1]),Math.abs(f[2]),Math.abs(f[3]))*1.5+3;
  for(const s of P.streets){const hw=s.hw+.15;const lim=paintedOnly?s.painted:1e9;for(let pi=0;pi<s.pts.length&&pi<=lim;pi++){const p=s.pts[pi];const dx=p[0]-x,dz=p[1]-z;if(Math.abs(dx)>rad||Math.abs(dz)>rad)continue;const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;
      if(lx>f[0]-hw&&lx<f[1]+hw&&lz>f[2]-hw&&lz<f[3]+hw)return true;}}
  const pl=P.plaza;if(pl&&!skipPlaza){const dx=pl.x-x,dz=pl.z-z;const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;const cx=clamp(lx,f[0],f[1]),cz=clamp(lz,f[2],f[3]);if(Math.hypot(lx-cx,lz-cz)<pl.r)return true;}
  return false;}
// ---------------------------------------------------------------- street generation
function streetPtOK(x,z,hw){if(Math.abs(x)>HALF-6||Math.abs(z)>HALF-6)return false;if(wAt(x,z)>.04)return false;
  for(const [ox,oz] of [[hw,0],[-hw,0],[0,hw],[0,-hw]])if(wAt(x+ox,z+oz)>.08)return false;return true;}
function nearOtherStreet(P,x,z,self,minD){for(const s of P.streets){if(s===self)continue;for(const p of s.pts){if(Math.abs(p[0]-x)<minD&&Math.abs(p[1]-z)<minD&&Math.hypot(p[0]-x,p[1]-z)<minD)return true;}}return false;}
function walkStreet(P,x,z,dx,dz,maxLen,hw,kind,parent){const s={pts:[[x,z]],hw,kind,painted:0,parent};const base=Math.atan2(dx,dz);let ang=base,seg=0,L=0;
  const hallR=G.center?bRect(G.center):null;
  while(L<maxLen){// keep straight segments ~10-14 units so plots along them line up into terraces
    if(seg<=0){let best=null,bc=1e9;for(const da of [0,-.14,.14,-.28,.28,-.42,.42]){const a=ang+da;if(Math.abs(angDiff(a,base))>.75)continue;let c=Math.abs(da)*1.2+Math.abs(angDiff(a,base))*.6,ok=true;
        let px=x,pz=z,h0=hAt(x,z);for(let k=1;k<=6;k++){px+=Math.sin(a)*2;pz+=Math.cos(a)*2;if(!streetPtOK(px,pz,hw)){ok=false;break;}const h=hAt(px,pz);const sl=Math.abs(h-h0)/2;if(sl>.42){ok=false;break;}c+=sl*3;h0=h;
          if(hallR&&rectsHit(fpRect(px,pz,0,[-hw,hw,-hw,hw]),hallR,.3)){ok=false;break;}}
        if(ok&&c<bc){bc=c;best=a;}}
      if(best==null)break;ang=best;seg=10+Math.floor(rnd()*3)*2;}
    const nx=x+Math.sin(ang)*2,nz=z+Math.cos(ang)*2;if(!streetPtOK(nx,nz,hw)||Math.abs(hAt(nx,nz)-hAt(x,z))>.9)break;
    if(L>6&&nearOtherStreet(P,nx,nz,s,hw+3.5)){s.pts.push([nx,nz]);break;}// joins another street: stop there
    x=nx;z=nz;s.pts.push([x,z]);L+=2;seg-=2;}
  return s.pts.length>=4?s:null;}
function makePlan(hall){const P={streets:[],plots:[],v:2};G.plan=P;
  const fx=Math.sin(hall.rot),fz=Math.cos(hall.rot),rx=Math.cos(hall.rot),rz=-Math.sin(hall.rot);
  P.plaza={x:hall.x+fx*11,z:hall.z+fz*11,r:5.5};const px=P.plaza.x,pz=P.plaza.z;
  const add=s=>{if(s){P.streets.push(s);return s;}return null;};
  const mains=[add(walkStreet(P,px+rx*5.5,pz+rz*5.5,rx,rz,96,2.1,'main')),add(walkStreet(P,px-rx*5.5,pz-rz*5.5,-rx,-rz,96,2.1,'main')),add(walkStreet(P,px+fx*5.5,pz+fz*5.5,fx,fz,84,2.0,'main'))].filter(Boolean);
  // a lane behind the hall
  add(walkStreet(P,hall.x-fx*6.5+rx*7,hall.z-fz*6.5+rz*7,-fx,-fz,50,1.6,'lane'));
  for(const m of mains){const n=m.pts.length;for(let i=12;i<n-4;i+=13){const [x,z]=m.pts[i],[x2,z2]=m.pts[i+1];const tx=x2-x,tz=z2-z,tl=Math.hypot(tx,tz)||1;
      for(const sd of [1,-1]){const dx=-tz/tl*sd,dz=tx/tl*sd;const c=walkStreet(P,x+dx*(m.hw+.2),z+dz*(m.hw+.2),dx,dz,46,1.6,'lane',m);if(c){P.streets.push(c);
          // second-order lanes for a denser grid further out
          const cn=c.pts.length;if(cn>14){const [a,b]=c.pts[10],[a2,b2]=c.pts[11];const ux=a2-a,uz=b2-b,ul=Math.hypot(ux,uz)||1;for(const s2 of [1,-1])add(walkStreet(P,a-uz/ul*s2*(c.hw+.2),b+ux/ul*s2*(c.hw+.2),-uz/ul*s2,ux/ul*s2,26,1.5,'lane',c));}}}}}
  for(const s of P.streets)genPlots(P,s);
  return P;}
function genPlots(P,s){const pts=s.pts;
  for(const side of [1,-1]){let carry=0,inRow=0,rowMax=3+Math.floor(rnd()*3),prev=null;
    for(let i=0;i<pts.length-1;i++){const [x0,z0]=pts[i],[x1,z1]=pts[i+1];const tx=x1-x0,tz=z1-z0,tl=Math.hypot(tx,tz);if(tl<1e-3)continue;const ux=tx/tl,uz=tz/tl;
      const nx=-uz*side,nz=ux*side;// outward normal
      let t=carry;while(t<tl){const w=Math.round((3.3+rnd()*.9)*10)/10;
        if(s.kind!=='main'&&i===0&&t<4){t+=1;continue;}
        if(s.kind==='main'&&i<3){t+=1;continue;}
        const off=s.hw+.55+2.6;const cxp=x0+ux*(t+w/2)+nx*off,czp=z0+uz*(t+w/2)+nz*off;const rot=Math.atan2(-nx,-nz);
        const pl={x:+cxp.toFixed(2),z:+czp.toFixed(2),rot:+rot.toFixed(4),w,st:P.streets.indexOf(s),i,d:Math.hypot(cxp-P.plaza.x,czp-P.plaza.z)};
        if(prev&&Math.abs(angDiff(prev.rot,pl.rot))<.02&&inRow<rowMax){// snap exactly beside the previous plot so the houses join into a terrace
          const cs=Math.cos(prev.rot),sn=Math.sin(prev.rot);const sx=(prev.w+w)/2*(-side);pl.x=+(prev.x+sx*cs).toFixed(3);pl.z=+(prev.z-sx*sn).toFixed(3);pl.rot=prev.rot;}
        if(plotOK(P,pl)){P.plots.push(pl);prev=pl;inRow++;if(inRow>=rowMax){t+=w+1.8;inRow=0;prev=null;rowMax=3+Math.floor(rnd()*3);continue;}}else{prev=null;inRow=0;}
        t+=w;}
      carry=t-tl;}}}
function plotOK(P,pl){const R=fpRect(pl.x,pl.z,pl.rot,fpOf('house',pl.w));if(Math.abs(pl.x)>HALF-8||Math.abs(pl.z)>HALF-8)return false;
  for(const o of P.plots){if(Math.abs(o.x-pl.x)>9||Math.abs(o.z-pl.z)>9)continue;const row=Math.abs(angDiff(o.rot,pl.rot))<.02;if(rectsHit(R,fpRect(o.x,o.z,o.rot,fpOf('house',o.w)),row?-.08:.6))return false;}
  const sv=G.plan;G.plan=P;const hit=streetHit(R);G.plan=sv;if(hit)return false;
  if(G.center&&rectsHit(R,bRect(G.center),.8))return false;
  let mn=1e9,mx=-1e9;for(const lx of [R.f[0],0,R.f[1]])for(const lz of [R.f[2],0,R.f[3]]){const wx=pl.x+lx*R.cs+lz*R.sn,wz=pl.z-lx*R.sn+lz*R.cs;if(wAt(wx,wz)>.08)return false;const h=hAt(wx,wz);mn=Math.min(mn,h);mx=Math.max(mx,h);}
  return mx-mn<2.2;}
// nearest street point -> facing rotation
function nearestStreet(x,z){const P=G.plan;if(!P)return null;let best=null,bd=1e9;for(const s of P.streets)for(let i=0;i<s.pts.length;i++){const p=s.pts[i];const d=Math.hypot(p[0]-x,p[1]-z);if(d<bd){bd=d;best={s,i,p,d};}}return best;}
function faceStreetRot(x,z,fallback){const n=nearestStreet(x,z);if(n&&n.d<22)return Math.atan2(n.p[0]-x,n.p[1]-z);const P=G.plan;if(P&&P.plaza&&Math.hypot(P.plaza.x-x,P.plaza.z-z)<30)return Math.atan2(P.plaza.x-x,P.plaza.z-z);return fallback;}
// frontage candidates for bigger buildings: along streets & around the plaza, facing them
function frontageCands(type,maxD){const P=G.plan,out=[];if(!P)return out;const f=fpOf(type),front=f[3];
  const pl=P.plaza;for(let k=0;k<16;k++){const a=k/16*TAU;const r=pl.r+front+.7;out.push([pl.x+Math.sin(a)*r,pl.z+Math.cos(a)*r,Math.atan2(-Math.sin(a),-Math.cos(a))]);}
  for(const s of P.streets){for(let i=1;i<s.pts.length-1;i+=2){const [x0,z0]=s.pts[i],[x1,z1]=s.pts[i+1];const tl=Math.hypot(x1-x0,z1-z0)||1;const ux=(x1-x0)/tl,uz=(z1-z0)/tl;
      if(Math.hypot(x0-pl.x,z0-pl.z)>maxD)continue;
      for(const side of [1,-1]){const nx=-uz*side,nz=ux*side;const off=s.hw+.6+front;out.push([x0+nx*off,z0+nz*off,Math.atan2(-nx,-nz)]);}}}
  return out;}
// paint streets as they come into use
function paintStreetTo(s,upto){upto=Math.min(upto,s.pts.length-1);if(upto<=s.painted)return;
  for(let i=Math.max(0,s.painted-1);i<=upto;i++){const [x,z]=s.pts[i];const r=s.hw*.85;const i0=Math.floor(x-r-1+HALF),i1=Math.ceil(x+r+1+HALF),j0=Math.floor(z-r-1+HALF),j1=Math.ceil(z+r+1+HALF);
    for(let j=Math.max(0,j0);j<=Math.min(N,j1);j++)for(let ii=Math.max(0,i0);ii<=Math.min(N,i1);ii++){const d=Math.hypot(ii-HALF-x,j-HALF-z);if(d>r+.8)continue;const k=j*S+ii;if(W[k]>.1)continue;const v=d<r?.82:.82*(1-(d-r)/.8);if(v>ROAD[k])ROAD[k]=v;}}
  {const r2=(s.hw+1.3)**2;let cut=0;for(let ti=trees.length-1;ti>=0;ti--){const t=trees[ti];if(t.t===4)continue;for(let i=Math.max(0,s.painted-1);i<=upto;i++){const p=s.pts[i];if((t.x-p[0])**2+(t.z-p[1])**2<r2){trees.splice(ti,1);cut++;break;}}}
   if(cut){treesDirty=true;if(typeof G!=="undefined"&&G.phase==="play")G.wood+=cut;}}
  if(s.parent&&s.parent.painted<1)paintStreetTo(s.parent,4);
  s.painted=upto;gridDirty=true;}
function paintPlaza(){const pl=G.plan&&G.plan.plaza;if(!pl)return;const r=pl.r+.8;for(let j=Math.floor(pl.z-r+HALF);j<=Math.ceil(pl.z+r+HALF);j++)for(let i=Math.floor(pl.x-r+HALF);i<=Math.ceil(pl.x+r+HALF);i++){if(i<0||j<0||i>N||j>N)continue;const d=Math.hypot(i-HALF-pl.x,j-HALF-pl.z);if(d>r)continue;const k=j*S+i;if(W[k]>.1)continue;ROAD[k]=Math.max(ROAD[k],d<pl.r?.9:.9*(r-d)/.8);}}
function clearFootprint(b){const R=fpRect(b.x,b.z,b.rot,fpOf(b.type,b.w));const f=R.f,m=1;let cut=0;
  for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.t===4&&b.type==='quarry')continue;const dx=t.x-b.x,dz=t.z-b.z;if(Math.abs(dx)>20||Math.abs(dz)>20)continue;const lx=dx*R.cs-dz*R.sn,lz=dx*R.sn+dz*R.cs;
    if(lx>f[0]-m&&lx<f[1]+m&&lz>f[2]-m&&lz<f[3]+m){trees.splice(i,1);cut++;}}if(cut){treesDirty=true;G.wood+=cut;}}
function onPlannedBuild(b){const P=G.plan;if(!P)return;clearFootprint(b);
  {const R=bRect(b);const f=R.f;for(const s of P.streets){const hw=s.hw+.3;for(let i=Math.max(1,s.painted+1);i<s.pts.length;i++){const dx=s.pts[i][0]-b.x,dz=s.pts[i][1]-b.z;if(Math.abs(dx)>16||Math.abs(dz)>16)continue;
      const lx=dx*R.cs-dz*R.sn,lz=dx*R.sn+dz*R.cs;if(lx>f[0]-hw&&lx<f[1]+hw&&lz>f[2]-hw&&lz<f[3]+hw){s.pts.length=Math.max(2,i-1);break;}}}}const n=nearestStreet(b.x,b.z);if(n&&n.d<16){// open the street from its start up to this building
    paintStreetTo(n.s,n.i+3);}
  if(['church','market','tavern','well','hall'].includes(b.type))paintPlaza();}
// grow the plan toward a "Settle here" banner that has no plots nearby
function extendPlanToward(x,z){const P=G.plan;if(!P)return false;if(P.plots.some(p=>Math.hypot(p.x-x,p.z-z)<12))return false;
  const n=nearestStreet(x,z);if(!n)return false;const dx=x-n.p[0],dz=z-n.p[1],d=Math.hypot(dx,dz)||1;
  const s=walkStreet(P,n.p[0]+dx/d*(n.s.hw+.3),n.p[1]+dz/d*(n.s.hw+.3),dx/d,dz/d,Math.min(70,d+20),1.6,'lane',n.s);if(!s)return false;P.streets.push(s);genPlots(P,s);return true;}

