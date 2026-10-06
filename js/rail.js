'use strict';
// ================================================================ the railway: a network of stations, depots and track
// The folk lay railways only where there is a real need (a quarry or forest far from the store, another people across the valley, a far
// harbour or farm belt). The line starts at a station at the EDGE of the town, skirts the built-up area, climbs gently, cuts and fills the
// land, bridges rivers, tunnels through spurs and ends at a freight depot (or at the station of the other people).
//
// DATA (all of it lives in G.net.lines, which is already saved with each settlement; the runtime graph is derived from it):
//   a rail line  L = {kind:'rail', id, own:townIdx, pts:[[x,z]..] (~2 apart), ys:[track height..], a:F, b:F, br:[[s0,s1,'w'|'v']..] bridges/viaducts,
//                     tn:[[s0,s1]..] tunnels, lx:[s..] level crossings, lp:[s..] passing loops, e:era built, len}
//   a facility   F = {k:'station'|'halt'|'depot'|'buffer'|'junction', x,z (centre), ax:[ux,uz] (track axis), out:[ox,oz] (the side away from the
//                     platform/yard), len, y, t:townIdx, bid:station building id, nm, cargo:'stone'|'wood'|'food'|'goods', stock, rate, qid}
//   graph nodes are the ports of facilities, loop ends and junctions; track segments are the edges. Trains run on the union of every
//   settlement's lines (so a line that joins two peoples works whichever town is being viewed).
// Exported: railBuildLine railPetition railExecute railPaint railDaily railFrame railReload railReset railLinked railTravel railCap railMission
//           railDepotPut railHit railHoldStation railTick railNetwork railMigrate.
{
const RC={TZ:8,STL:28,HLT:16,DPL:26,SIDE:3.8,WID:2.3,LOOPH:13,LOOPMIN:120,MAXG:.07};
const RN={gr:null,trains:[],grp:new THREE.Group(),mesh:null,glow:null,dirty:true,tD:0,era:5,lastT:null,sig:'',nextMesh:0,hash:null,uid:1,quiet:false};
scene.add(RN.grp);
const rS=()=>{const n=netEnsure();if(!n.rs)n.rs={n:0,cd:0,pax:0,frt:0,runs:0,fail:0,own:0};return n.rs;};
const fkey=F=>F.k+':'+Math.round(F.x)+':'+Math.round(F.z);
const v2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function railAll(){const o=[];for(const t of netsAll())for(const L of t.net.lines)if(L.kind==='rail')o.push(L);return o;}
function railLines(){return railAll().filter(L=>L.ys&&L.pts.length>1);}
function lcum(L){if(!L._c)Object.defineProperty(L,'_c',{value:netLen(L.pts),enumerable:false,writable:true,configurable:true});return L._c;}
function llen(L){const c=lcum(L);return c[c.length-1];}
// position (x,y,z) and tangent at arc length s of line L
function lAt(L,s){const c=lcum(L),n=c.length;s=clamp(s,0,c[n-1]);let i=1;while(i<n-1&&c[i]<s)i++;const t=(s-c[i-1])/Math.max(1e-6,c[i]-c[i-1]),p=L.pts[i-1],q=L.pts[i];
  const dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz)||1;return [lerp(p[0],q[0],t),lerp(L.ys[i-1],L.ys[i],t),lerp(p[1],q[1],t),dx/l,dz/l];}
function lNearest(L,x,z){let bd=1e9,bs=0;const c=lcum(L);for(let i=0;i<L.pts.length-1;i++){const p=L.pts[i],q=L.pts[i+1],dx=q[0]-p[0],dz=q[1]-p[1],l2=dx*dx+dz*dz||1,t=clamp(((x-p[0])*dx+(z-p[1])*dz)/l2,0,1),d=Math.hypot(p[0]+dx*t-x,p[1]+dz*t-z);if(d<bd){bd=d;bs=c[i]+(c[i+1]-c[i])*t;}}return {d:bd,s:bs};}
const inR=(list,s)=>{if(list)for(const r of list)if(s>=r[0]&&s<=r[1])return r;return null;};

// ---------------------------------------------------------------- the derived graph
function seg3(pts){const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][2]-pts[i-1][2]));return cum;}
function segAt(sg,s){const c=sg.cum,n=c.length;s=clamp(s,0,c[n-1]);let i=1;while(i<n-1&&c[i]<s)i++;const t=(s-c[i-1])/Math.max(1e-6,c[i]-c[i-1]),p=sg.pts[i-1],q=sg.pts[i];
  const dx=q[0]-p[0],dz=q[2]-p[2],l=Math.hypot(dx,dz)||1;return [lerp(p[0],q[0],t),lerp(p[1],q[1],t),lerp(p[2],q[2],t),dx/l,dz/l];}
function facTrack(F,off,y){// polyline (x,y,z) of a facility's main (off=0) or siding track
  const a=F.ax,o=F.out,h=F.len/2,P=[];const n=off?15:3;for(let i=0;i<n;i++){const u=i/(n-1),l=(u-.5)*F.len;let d=0;if(off){d=off*sstep(0,.2,u)*sstep(1,.8,u);}P.push([F.x+a[0]*l+o[0]*d,F.y,F.z+a[1]*l+o[1]*d]);}return P;}
function railGraph(){
  const gr={segs:[],nodes:[],fx:new Map(),svcs:[],lines:railLines(),secs:[]};
  const nodeAt=(x,y,z,split)=>{for(const n of gr.nodes)if(Math.abs(n.x-x)<1&&Math.abs(n.z-z)<1){if(split)n.sp=true;return n;}const n={id:gr.nodes.length,x,y,z,segs:[],sp:!!split};gr.nodes.push(n);return n;};
  const addSeg=(pts,kind,o)=>{const sg=Object.assign({id:gr.segs.length,pts,cum:seg3(pts),kind,occ:[],sec:null,twin:null},o||{});sg.len=sg.cum[sg.cum.length-1];
    const A=pts[0],B=pts[pts.length-1];sg.a=nodeAt(A[0],A[1],A[2],kind!=='line');sg.b=nodeAt(B[0],B[1],B[2],kind!=='line');
    if(kind!=='line'){sg.a.sp=true;sg.b.sp=true;}sg.a.segs.push({sg,end:'a'});sg.b.segs.push({sg,end:'b'});gr.segs.push(sg);return sg;};
  // facilities (a facility at the end of several lines is one)
  for(const L of gr.lines)for(const e of ['a','b']){const F=L[e];if(!F||F.k==='junction'||F.k==='buffer')continue;const key=fkey(F);if(!gr.fx.has(key))gr.fx.set(key,{F,key,main:null,side:null});}
  for(const fx of gr.fx.values()){const F=fx.F;fx.main=addSeg(facTrack(F,0),'fmain',{fx});if(F.k==='station'||F.k==='depot'){fx.side=addSeg(facTrack(F,RC.SIDE),'fside',{fx});fx.main.twin=fx.side;fx.side.twin=fx.main;}}
  // lines, cut at loops and junctions
  for(const L of gr.lines){const len=llen(L),br=[0,len];const loops=[];
    for(const s of (L.lp||[])){const s0=s-RC.LOOPH,s1=s+RC.LOOPH;if(s0>6&&s1<len-6){br.push(s0,s1);loops.push([s0,s1]);}}
    for(const M of gr.lines){if(M===L)continue;for(const e of ['a','b']){const F=M[e];if(F&&F.k==='junction'&&F.on===L.id){const r=lNearest(L,F.x,F.z);F.s=r.s;br.push(r.s);}}}
    br.sort((p,q)=>p-q);const cut=[br[0]];for(const s of br)if(s-cut[cut.length-1]>2.5)cut.push(s);if(len-cut[cut.length-1]<2.5)cut[cut.length-1]=len;else cut.push(len);
    for(let i=0;i<cut.length-1;i++){const s0=cut[i],s1=cut[i+1],pts=[];const c=lcum(L);
      const p0=lAt(L,s0);pts.push([p0[0],p0[1],p0[2]]);for(let k=0;k<c.length;k++)if(c[k]>s0+.01&&c[k]<s1-.01)pts.push([L.pts[k][0],L.ys[k],L.pts[k][1]]);const p1=lAt(L,s1);pts.push([p1[0],p1[1],p1[2]]);
      const isLoop=loops.some(r=>Math.abs(r[0]-s0)<.6&&Math.abs(r[1]-s1)<.6);
      const sg=addSeg(pts,isLoop?'lmain':'line',{L,sa:s0});
      if(isLoop){// the passing loop: a second track beside the main one
        const side=[];for(let k=0;k<15;k++){const u=k/14,s=lerp(s0,s1,u),q=lAt(L,s);const off=RC.SIDE*sstep(0,.2,u)*sstep(1,.8,u);side.push([q[0]-q[4]*off,q[1],q[2]+q[3]*off]);}
        const sd=addSeg(side,'lside',{L,sa:s0});sg.twin=sd;sd.twin=sg;}}}
  // sections of single track between facilities and loops
  const par=gr.segs.map((_,i)=>i),find=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
  for(const n of gr.nodes){if(n.sp)continue;const ls=n.segs.filter(e=>e.sg.kind==='line');for(let i=1;i<ls.length;i++)par[find(ls[i].sg.id)]=find(ls[0].sg.id);}
  const secs=new Map();for(const sg of gr.segs)if(sg.kind==='line'){const r=find(sg.id);if(!secs.has(r))secs.set(r,{id:r,occ:[],segs:[]});sg.sec=secs.get(r);sg.sec.segs.push(sg);}gr.secs=[...secs.values()];
  railServices(gr);return gr;}

// shortest directed route over the segment graph; a train never reverses except at its starting point
function railRoute(gr,starts,goal){// starts:[{sg,dir,cost}], goal(sg,dir)->bool ; returns [{sg,dir}..] including the start state
  const key=(sg,d)=>sg.id*2+(d>0?0:1),best=new Map(),prev=new Map(),open=[];
  for(const s of starts){const k=key(s.sg,s.dir);best.set(k,s.cost||0);open.push([s.cost||0,s.sg,s.dir]);}
  let guard=0;while(open.length&&guard++<4000){let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [c,sg,d]=open.splice(bi,1)[0];const k=key(sg,d);if(c>best.get(k)+1e-6)continue;
    if(goal(sg,d)){const path=[];let kk=k;while(kk!==undefined){path.push({sg:gr.segs[kk>>1],dir:(kk&1)?-1:1});kk=prev.get(kk);}return path.reverse();}
    const nd=d>0?sg.b:sg.a;for(const e of nd.segs){if(e.sg===sg)continue;const d2=e.end==='a'?1:-1,k2=key(e.sg,d2),c2=c+e.sg.len+(e.sg.kind==='fside'||e.sg.kind==='lside'?4:0);
      if(!best.has(k2)||c2<best.get(k2)-1e-6){best.set(k2,c2);prev.set(k2,k);open.push([c2,e.sg,d2]);}}}
  return null;}
function railConnected(gr,fa,fb){const a=gr.fx.get(fa),b=gr.fx.get(fb);if(!a||!b)return null;
  const r=railRoute(gr,[{sg:a.main,dir:1},{sg:a.main,dir:-1}],(sg)=>sg===b.main||sg===b.side);return r;}
function railServices(gr){const fx=[...gr.fx.values()],st=fx.filter(f=>f.F.k==='station'),dp=fx.filter(f=>f.F.k==='depot'),hl=fx.filter(f=>f.F.k==='halt');
  const era=RN.era;gr.svcs=[];
  for(const D of dp){let bs=null,bl=1e9;for(const S of st){const r=railConnected(gr,S.key,D.key);if(!r)continue;const l=r.reduce((a,e)=>a+e.sg.len,0)+(S.F.t===D.F.t?0:400);if(l<bl){bl=l;bs=S;}}
    if(bs)gr.svcs.push({id:'f:'+D.key,k:'freight',cargo:D.F.cargo||'stone',stops:[bs.key,D.key],len:bl,n:era>=6?2:1,t:D.F.t});}
  for(let i=0;i<st.length;i++)for(let j=i+1;j<st.length;j++){const r=railConnected(gr,st[i].key,st[j].key);if(!r)continue;
    const mids=[];for(const e of r){const h=hl.find(q=>q.main===e.sg);if(h&&!mids.includes(h.key))mids.push(h.key);}
    const l=r.reduce((a,e)=>a+e.sg.len,0);gr.svcs.push({id:'p:'+st[i].key+'>'+st[j].key,k:'pax',stops:[st[i].key,...mids,st[j].key],len:l,n:era>=6?2:1,t:st[i].F.t});
    if(st[i].F.t!==st[j].F.t)gr.svcs.push({id:'g:'+st[i].key+'>'+st[j].key,k:'freight',cargo:'goods',stops:[st[i].key,st[j].key],len:l,n:1,t:st[i].F.t});}
  if(!st.length&&hl.length>1){// sandbox: a shuttle between the two far ends of a chain of halts
    let bp=null,bl=0;for(let i=0;i<hl.length;i++)for(let j=i+1;j<hl.length;j++){const r=railConnected(gr,hl[i].key,hl[j].key);if(!r)continue;const l=r.reduce((a,e)=>a+e.sg.len,0);if(l>bl){bl=l;bp=[i,j,r];}}
    if(bp&&bl>20){const [i,j,r]=bp,mids=[];for(const e of r){const h=hl.find(q=>q.main===e.sg);if(h&&h!==hl[i]&&h!==hl[j]&&!mids.includes(h.key))mids.push(h.key);}gr.svcs.push({id:'p:'+hl[i].key+'>'+hl[j].key,k:'pax',stops:[hl[i].key,...mids,hl[j].key],len:bl,n:1,t:hl[i].F.t});}}
}

// ---------------------------------------------------------------- routing: a heading-aware A* over a coarse cost grid, then smoothing, a gentle profile and grading
const CS=3,GW=Math.ceil(N/CS)+1,DI=[1,1,0,-1,-1,-1,0,1],DJ=[0,1,1,1,0,-1,-1,-1];
const cxz=(i,j)=>[i*CS-HALF,j*CS-HALF],cellOf2=(x,z)=>[clamp(Math.round((x+HALF)/CS),0,GW-1),clamp(Math.round((z+HALF)/CS),0,GW-1)];
const dirIdx=(hx,hz)=>((Math.round(Math.atan2(hz,hx)/(PI/4))%8)+8)%8;
// the cost of laying track through each cell: the town is dear, open land is cheap, water is bridged only where it is narrow
function railCosts(o){o=o||{};const SBX=MODE==='sandbox';if(!o.blocks)o.blocks=RN.blocks||[];const C=new Float32Array(GW*GW).fill(1),track=new Uint8Array(GW*GW);
  const mark=(x,z,R,add,block)=>{const [ci,cj]=cellOf2(x,z),r=Math.ceil(R/CS)+1;for(let j=cj-r;j<=cj+r;j++)for(let i=ci-r;i<=ci+r;i++){if(i<0||j<0||i>=GW||j>=GW)continue;const [px,pz]=cxz(i,j);if(Math.hypot(px-x,pz-z)>R)continue;const k=j*GW+i;if(block)C[k]=Infinity;else C[k]+=add;}};
  for(let j=0;j<GW;j++)for(let i=0;i<GW;i++){const [x,z]=cxz(i,j),k=j*GW+i;if(Math.abs(x)>HALF-7||Math.abs(z)>HALF-7){C[k]=Infinity;continue;}
    const w=wAt(x,z);if(w>.12)C[k]+=(SBX?3.2:9)+Math.min(8,w*4)*(SBX?.4:1);else if(w>.03)C[k]+=SBX?1:3;}
  for(const t of trees){if(t.t===4)continue;const [i,j]=cellOf2(t.x,t.z);C[j*GW+i]+=.09;}
  for(const b of allB()){const r=(b.r||3);if(b.type==='farm')mark(b.x,b.z,r+1.5,40);else mark(b.x,b.z,r+RC.WID+1.6,0,true);}
  for(const t of netsAll()){const P=t.plan;if(!P)continue;
    if(P.v>=3&&typeof lyZone==='function'){const zc={civic:30,mix:13,res:10,ind:.4,farm:2};for(let j=0;j<GW;j++)for(let i=0;i<GW;i++){const [x,z]=cxz(i,j);if(Math.hypot(x-P.C[0],z-P.C[1])>150)continue;let zn='farm';try{zn=lyZone(P,x,z);}catch(e){}C[j*GW+i]+=zc[zn]||0;}}
    else if(P.C){mark(P.C[0],P.C[1],46,8);}
    if(P.plaza)mark(P.plaza.x,P.plaza.z,P.plaza.r+4,40);
    for(const s of P.streets||[])for(const p of s.pts)mark(p[0],p[1],(s.hw||1.5)+1.6,2.2);
    for(const p of P.plots||[]){mark(p.x,p.z,6,14);mark(p.x,p.z,2.8,0,true);}}
  TOWNS.list.forEach((s,i)=>{if(s.dead)return;const cc=sGet(i,'center');if(!cc)return;const R=withSettlement(i,urbanR);mark(cc.x,cc.z,R*.85,22);});
  for(const e of o.blocks||[])mark(e.x,e.z,e.r,0,true);
  for(const m of allMarkers())if(m.k==='forbid')mark(m.x,m.z,13,0,true);
  for(const L of netLines()){if(L.kind==='highway'){for(const p of L.pts)mark(p[0],p[1],4,5);}}
  if(RN.gr)for(const sg of RN.gr.segs){for(let i=0;i<sg.pts.length;i++){const p=sg.pts[i];const [ci,cj]=cellOf2(p[0],p[2]);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=ci+di,jj=cj+dj;if(ii<0||jj<0||ii>=GW||jj>=GW)continue;const [px,pz]=cxz(ii,jj);if(Math.hypot(px-p[0],pz-p[2])<CS*1.1){const k=jj*GW+ii;track[k]=sg.kind==='line'?1:2;C[k]+=30;}}}}
  if(RN.gr)for(const sg of RN.gr.segs)if(sg.kind==='fmain'||sg.kind==='fside')for(let s=0;s<=sg.len;s+=4){const q=segAt(sg,s);mark(q[0],q[2],7,0,true);}
  return {C,track};}
// binary heap of [f,state]
function hpush(h,f,s){let i=h.length;h.push([f,s]);while(i>0){const p=(i-1)>>1;if(h[p][0]<=f)break;h[i]=h[p];i=p;}h[i]=[f,s];}
function hpop(h){const top=h[0],last=h.pop();if(h.length){let i=0;const n=h.length;for(;;){let c=2*i+1;if(c>=n)break;if(c+1<n&&h[c+1][0]<h[c][0])c++;if(h[c][0]>=last[0])break;h[i]=h[c];i=c;}h[i]=last;}return top;}
function railAStar(CG,sx,sz,sdir,gx,gz,joinMask){const SBS=MODE==='sandbox'?.4:1;const C=CG.C,GWW=GW,NS=GWW*GWW*8,g=new Float32Array(NS).fill(Infinity),from=new Int32Array(NS).fill(-1);
  const hc=new Float32Array(GWW*GWW);for(let j=0;j<GWW;j++)for(let i=0;i<GWW;i++){const [x,z]=cxz(i,j);hc[j*GWW+i]=hAt(x,z);}
  const [si,sj]=cellOf2(sx,sz),[ti,tj]=cellOf2(gx,gz),s0=(sj*GWW+si)*8+sdir;g[s0]=0;const open=[];hpush(open,0,s0);let pops=0,goal=-1;
  const hw=joinMask?.35:1;
  while(open.length&&pops++<150000){const [f,st]=hpop(open);const gc=g[st];if(f>gc+Math.hypot(((st>>3)%GWW)-ti,(((st>>3)/GWW)|0)-tj)*CS*hw+1e-3)continue;
    const cell=st>>3,d=st&7,ci=cell%GWW,cj=(cell/GWW)|0;
    if((ci===ti&&cj===tj)||(joinMask&&joinMask[cell]&&gc>12)||(Math.hypot(ci-ti,cj-tj)<1.2&&!joinMask)){goal=st;break;}
    for(const dd of [0,1,-1,2,-2]){const d2=(d+dd+8)%8,ni=ci+DI[d2],nj=cj+DJ[d2];if(ni<0||nj<0||ni>=GWW||nj>=GWW)continue;const nc=nj*GWW+ni;if(C[nc]===Infinity)continue;
      const L=(DI[d2]&&DJ[d2])?CS*1.414:CS,m=(C[cell]+C[nc])*.5,dh=Math.abs(hc[nc]-hc[cell]),gr=dh/L,sc=(gr*10+(gr>.045?(gr-.045)*55:0))*SBS+(gr>.32?150:0);
      const tc=dd===0?0:Math.abs(dd)===1?4:18;const ng=gc+L*(m+sc)+tc,ns=nc*8+d2;
      if(ng<g[ns]){g[ns]=ng;from[ns]=st;hpush(open,ng+Math.hypot(ni-ti,nj-tj)*CS*hw,ns);}}}
  if(goal<0)return null;const path=[];let st=goal;while(st>=0){const cell=st>>3;path.push(cxz(cell%GWW,(cell/GWW)|0));st=from[st];}path.reverse();return {path,cost:g[goal],end:goal>>3};}
function chaikin(p,it){for(let k=0;k<it;k++){const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}o.push(p[p.length-1]);p=o;}return p;}
function resampleU(p,ds){const c=netLen(p),tot=c[c.length-1],n=Math.max(2,Math.round(tot/ds)+1),o=[];let j=1;for(let i=0;i<n;i++){const s=tot*i/(n-1);while(j<c.length-1&&c[j]<s)j++;const t=(s-c[j-1])/Math.max(1e-6,c[j]-c[j-1]);o.push([lerp(p[j-1][0],p[j][0],t),lerp(p[j-1][1],p[j][1],t)]);}return o;}
// lay out a polyline from port P0 (leaving along out0) to port P1 (whose own outward heading is out1) - or onto existing track (join)
function railTrace(P0,out0,P1,out1,o){o=o||{};const CG=railCosts(o),L0=[P0[0]+out0[0]*7,P0[1]+out0[1]*7];let mask=null,gx,gz,lead1=null;
  if(o.join){mask=new Uint8Array(GW*GW);for(let k=0;k<mask.length;k++)if(CG.track[k]===1&&CG.C[k]<Infinity){const i=k%GW,j=(k/GW)|0,[x,z]=cxz(i,j);if(o.joinOK(x,z))mask[k]=1;}
    for(let k=0;k<mask.length;k++)if(mask[k])CG.C[k]-=14;// the track cells carry a crossing cost; joining is not crossing
    gx=P1[0];gz=P1[1];}
  else if(o.free){gx=P1[0];gz=P1[1];}
  else{lead1=[P1[0]+out1[0]*7,P1[1]+out1[1]*7];gx=lead1[0];gz=lead1[1];}
  // the start lead and the end lead sit on cells that other costs may have blocked (they are next to our own buildings): free them
  const free=(x,z)=>{const [ci,cj]=cellOf2(x,z);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=ci+di,jj=cj+dj;if(ii<0||jj<0||ii>=GW||jj>=GW)continue;const k=jj*GW+ii;if(CG.C[k]===Infinity){const [px,pz]=cxz(ii,jj);let hit=false;for(const b of allB())if(Math.hypot(b.x-px,b.z-pz)<(b.r||3)+1.8){hit=true;break;}if(!hit)CG.C[k]=6;}}};
  free(L0[0],L0[1]);if(lead1)free(lead1[0],lead1[1]);
  const r=railAStar(CG,L0[0],L0[1],dirIdx(out0[0],out0[1]),gx,gz,mask);if(!r)return null;
  let poly=[P0,[P0[0]+out0[0]*3.5,P0[1]+out0[1]*3.5],L0];for(const p of r.path.slice(1))poly.push(p);let join=null;
  if(o.join){const la=poly[poly.length-1],lb=poly[poly.length-2];// find the nearest point on the track we are joining
    let bd=1e9,bL=null,bs=0;for(const L of o.lines){const q=lNearest(L,la[0],la[1]);if((o.joinOK2||o.joinOK)(lAt(L,q.s)[0],lAt(L,q.s)[2])&&q.d<bd){bd=q.d;bL=L;bs=q.s;}}if(!bL)return null;
    const J=lAt(bL,bs);let tx=J[3],tz=J[4];const hx=J[0]-lb[0],hz=J[2]-lb[1];if(tx*hx+tz*hz<0){tx=-tx;tz=-tz;}
    const nx=-tz,nz=tx,lat=(la[0]-J[0])*nx+(la[1]-J[2])*nz;
    poly.pop();poly.push([J[0]-tx*14+nx*lat*.6,J[2]-tz*14+nz*lat*.6],[J[0]-tx*7+nx*lat*.15,J[2]-tz*7+nz*lat*.15],[J[0],J[2]]);join={L:bL,s:bs,x:J[0],y:J[1],z:J[2],tx,tz};}
  else if(o.free){poly.pop();poly.push([P1[0],P1[1]]);}
  else{poly.pop();poly.push(lead1,[P1[0]+out1[0]*3.5,P1[1]+out1[1]*3.5],P1);}
  const pts=resampleU(chaikin(poly,3),2);pts[0]=[P0[0],P0[1]];pts[pts.length-1]=join?[join.x,join.z]:[P1[0],P1[1]];if(o.free)pts[pts.length-1]=[P1[0],P1[1]];
  return {pts,cost:r.cost,join};}

// ---------------------------------------------------------------- the profile: a gentle grade with bridges, cuttings, embankments, viaducts and tunnels
function railProfile(pts,y0,y1){const n=pts.length,ds=2,g=[],surf=[],wet=[];
  for(let i=0;i<n;i++){const [x,z]=pts[i],h=hAt(x,z),w=wAt(x,z);g.push(h);wet.push(w>.08);surf.push(h+(w>.02?w:0));}
  for(let i=0;i<n;i++){if(wet[i]){if(i>0)wet[i-1]=wet[i-1]||0;}}
  const wd=wet.slice();for(let i=0;i<n;i++)if(wet[i]){for(let k=-2;k<=2;k++)if(i+k>=0&&i+k<n)wd[i+k]=true;}
  const base=g.map((_,i)=>Math.max(g[i],surf[i]));let y=base.map((_,i)=>{let s=0,c=0;for(let k=-5;k<=5;k++){const j=i+k;if(j>=0&&j<n){s+=base[j];c++;}}return s/c;});
  const need=i=>wd[i]?surf[i]+(wet[i]||wd[i]?1.9:0):-1e9;
  if(y0==null)y0=y[0];const ms=RC.MAXG*ds;y[0]=y0;for(let i=1;i<=4&&i<n;i++)y[i]=y0;if(y1!=null){y[n-1]=y1;for(let i=n-2;i>=n-5&&i>=0;i--)y[i]=y1;}
  for(let it=0;it<6;it++){for(let i=0;i<n;i++){const q=need(i);if(q>y[i])y[i]=q;}
    for(let i=1;i<n;i++)y[i]=clamp(y[i],y[i-1]-ms,y[i-1]+ms);for(let i=n-2;i>=0;i--)y[i]=clamp(y[i],y[i+1]-ms,y[i+1]+ms);
    y[0]=y0;for(let i=1;i<n;i++)y[i]=clamp(y[i],y[i-1]-ms,y[i-1]+ms);if(y1!=null){const e=y[n-1]-y1;if(Math.abs(e)<.05)break;}}
  // a fixed far end (a station platform or an existing track) is met by easing the last stretch there
  if(y1!=null){const e=y[n-1]-y1;if(Math.abs(e)>.08){const m=Math.min(n-1,16);for(let k=0;k<m;k++){y[n-1-k]-=e*(1-k/m);}}}
  // classify
  const br=[],tn=[],kind=new Array(n).fill(0);// 0 ground 1 bridge/viaduct 2 tunnel
  for(let i=0;i<n;i++){const d=g[i]-y[i];if(wd[i]&&wet[i])kind[i]=1;else if(d>3.3&&i>10&&i<n-10)kind[i]=2;else if(d<-4.4&&i>4&&i<n-4)kind[i]=3;}
  // runs
  const runs=(cond,min)=>{const o=[];let a=-1;for(let i=0;i<=n;i++){const c=i<n&&cond(i);if(c&&a<0)a=i;if(!c&&a>=0){if(i-a>=min)o.push([a,i-1]);a=-1;}}return o;};
  for(const r of runs(i=>kind[i]===2,4))tn.push([Math.max(0,r[0]-0)*ds,Math.min(n-1,r[1])*ds]);
  for(const r of runs(i=>kind[i]===1,1))br.push([Math.max(0,r[0]-1)*ds,Math.min(n-1,r[1]+1)*ds,'w']);
  for(const r of runs(i=>kind[i]===3,3))br.push([r[0]*ds,r[1]*ds,'v']);
  br.sort((p,q)=>p[0]-q[0]);const mb=[];for(const r of br){const l=mb[mb.length-1];if(l&&r[0]<=l[1]+2){l[1]=Math.max(l[1],r[1]);if(r[2]==='w')l[2]='w';}else mb.push(r.slice());}
  return {ys:y.map(v=>Math.round(v*100)/100),br:mb,tn};}
// where the line crosses a street or road (a level crossing)
function railCrossings(pts,br,tn){const out=[];const strs=[];for(const t of netsAll()){if(t.plan&&t.plan.streets)for(const s of t.plan.streets){if(s.kind==='lane'&&s.hw<1.4)continue;strs.push([s.pts,s.hw+1.1,s.painted]);}}
  for(const L of netLines())if(L.kind==='highway')strs.push([L.pts,4.3,1e9]);
  let last=-99;for(let i=2;i<pts.length-2;i++){const s=i*2;if(inR(br,s)||inR(tn,s)||s-last<14)continue;const [x,z]=pts[i];let hit=false;
    for(const [sp,hw,pn] of strs){const lim=Math.min(sp.length-1,pn);for(let k=0;k<lim&&!hit;k++){const p=sp[k],q=sp[k+1];const dx=q[0]-p[0],dz=q[1]-p[1],l2=dx*dx+dz*dz||1,t=clamp(((x-p[0])*dx+(z-p[1])*dz)/l2,0,1);if(Math.hypot(p[0]+dx*t-x,p[1]+dz*t-z)<hw)hit=true;}if(hit)break;}
    if(hit){out.push(s);last=s;}}
  return out;}
// cut and fill the land under the track, with side slopes; nothing is moved under bridges or over tunnels
function railGrade(pts,ys,skip,wid,pad){wid=wid||RC.WID;const n=pts.length,KS=.6;if(!RN.sd){RN.sd=new Float32Array(V);RN.sy=new Float32Array(V);}const sd=RN.sd,sy=RN.sy,touched=[];
  let i0=N,j0=N,i1=0,j1=0;
  const prot=new Set();for(const b of allB()){const r=(b.r||3)+1.2,bi=Math.floor(b.x-r+HALF),bj=Math.floor(b.z-r+HALF),ei=Math.ceil(b.x+r+HALF),ej=Math.ceil(b.z+r+HALF);for(let j=Math.max(0,bj);j<=Math.min(N,ej);j++)for(let i=Math.max(0,bi);i<=Math.min(N,ei);i++)if(Math.hypot(i-HALF-b.x,j-HALF-b.z)<r&&(!pad||!b._railPad))prot.add(j*S+i);}
  for(let q=0;q<n;q++){if(skip(q))continue;const [x,z]=pts[q],y=ys[q],g=hAt(x,z),R=wid+clamp(Math.abs(g-y)/KS*1.15+3,3,17);
    const a0=Math.max(0,Math.floor(x-R+HALF)),a1=Math.min(N,Math.ceil(x+R+HALF)),b0=Math.max(0,Math.floor(z-R+HALF)),b1=Math.min(N,Math.ceil(z+R+HALF));
    for(let j=b0;j<=b1;j++)for(let i=a0;i<=a1;i++){const dx=i-HALF-x,dz=j-HALF-z,d=Math.hypot(dx,dz);if(d>R)continue;const k=j*S+i;if(sd[k]===0){sd[k]=d+.001;sy[k]=y;touched.push(k);}else if(d<sd[k]){sd[k]=d+.001;sy[k]=y;}}}
  let wchg=false;for(const k of touched){const d=sd[k]-.001,y=sy[k];sd[k]=0;if(prot.has(k))continue;const i=k%S,j=(k/S)|0;
    if(d<=wid)H[k]=y;else{const t=d-wid;H[k]=clamp(H[k],y-t*KS,y+t*KS);}
    if(d<wid*1.2&&W[k]>0){W[k]=0;wchg=true;}if(i<i0)i0=i;if(i>i1)i1=i;if(j<j0)j0=j;if(j>j1)j1=j;}
  const r2=(wid+1.3)**2;for(let t=trees.length-1;t>=0;t--){const tr=trees[t];if(tr.t===4)continue;for(let q=0;q<n;q+=1){if(skip(q))continue;const p=pts[q];if(Math.abs(tr.x-p[0])<wid+1.4&&(tr.x-p[0])**2+(tr.z-p[1])**2<r2){trees.splice(t,1);break;}}}
  treesDirty=true;if(i1>=i0){refreshTerrain(i0,j0,i1,j1);}gridDirty=true;if(wchg&&typeof updateWaterMesh==='function')updateWaterMesh(true);}
const lyIgn=f=>{if(typeof LY==='undefined')return f();LY.ign++;try{return f();}finally{LY.ign--;}};

// ---------------------------------------------------------------- stations at the edge of the town, freight depots at the far works
const portPos=(F,sg)=>[F.x+F.ax[0]*F.len/2*sg,F.z+F.ax[1]*F.len/2*sg];
function portUsed(F,sg){const P=portPos(F,sg);for(const L of railAll()){if(!L.pts||L.pts.length<2)continue;for(const p of [L.pts[0],L.pts[L.pts.length-1]])if(Math.hypot(p[0]-P[0],p[1]-P[1])<1.6)return true;}return false;}
function urbanR(){const c=G.center;if(!c)return 20;const d=[];for(const b of buildings){if(b.build)continue;if(['farm','camp','quarry','lodge','dock','shipyard','fishmkt','tower'].includes(b.type))continue;d.push(Math.hypot(b.x-c.x,b.z-c.z));}
  if(d.length<4)return 22;d.sort((p,q)=>p-q);const P=G.plan;let r=d[Math.floor(d.length*.9)]+5;if(P&&P.zr)r=Math.min(r,P.zr*(P.sc||1)*.95);return Math.max(22,r);}
// the best place for a station: beyond the houses, on gentle ground, on the side of the town that faces the other end of the line
const STPTS=[[-7,-5],[0,-5],[7,-5],[-7,0],[0,0],[7,0],[-7,4],[0,4],[7,4],[-12,-2],[12,-2],[-22,8],[-14,8],[-7,8],[0,8],[7,8],[14,8],[22,8],[-14,12],[0,12],[14,12]];
function stationSpot(tx,tz,opt){return stationSpot1(tx,tz,2,opt||{});}
// pass 0 is strict; pass 1 allows a steeper bench, more struck plots and any heading; pass 2 may also clear a farm, camp or lodge that stands in the way
function stationSpot1(tx,tz,rx,opt){const avoid=opt.avoid;const c=G.center;if(!c)return null;const Rb=urbanR(),P=G.plan;let best=null,bs=-1e9;const t0=Math.atan2(tz-c.z,tx-c.x);
  const streetEnds=[];if(P&&P.streets)for(const s of P.streets){streetEnds.push(s.pts[0],s.pts[s.pts.length-1]);}
  const others=[];for(const f of RN.gr?RN.gr.fx.values():[])others.push([f.F.x,f.F.z]);
  const td=Math.hypot(tx-c.x,tz-c.z),rMax=Math.min(Rb+(rx?44:30),td-(opt.minLine||(rx?24:30)));
  const clearT=rx===2?['farm','camp','lodge']:null,offs=rx?[0,.6,-.6,1.2,-1.2]:[0];
  for(let da=-3.1;da<=3.11;da+=.1)for(let r=Math.max(24,Rb-3);r<=rMax;r+=2){const a=t0+da,Tx=c.x+Math.cos(a)*r,Tz=c.z+Math.sin(a)*r;if(Math.abs(Tx)>HALF-26||Math.abs(Tz)>HALF-26)continue;
    for(const off of offs){const ao=a+off,dx=Math.cos(ao),dz=Math.sin(ao),out=[dx,dz],rot=Math.atan2(dx,dz),ax=[Math.cos(rot),-Math.sin(rot)],Bx=Tx-dx*RC.TZ,Bz=Tz-dz*RC.TZ;
      let ok=true,mn=1e9,mx=-1e9;const clr=[];
      for(const [lx,lz] of STPTS){const x=Bx+ax[0]*lx+out[0]*lz,z=Bz+ax[1]*lx+out[1]*lz;{if(wAt(x,z)>.03||Math.abs(x)>HALF-10||Math.abs(z)>HALF-10){ok=false;break;}const h=hAt(x,z);if(h<mn)mn=h;if(h>mx)mx=h;
          for(const b of buildings)if(Math.hypot(b.x-x,b.z-z)<(b.r||3)+(b.type==='farm'?1.2:rx?1.6:2.4)){if(clearT&&clearT.includes(b.type)&&!b.build){if(!clr.includes(b))clr.push(b);}else{ok=false;break;}}
          if(!ok)break;if(P){if(P.plaza&&Math.hypot(P.plaza.x-x,P.plaza.z-z)<P.plaza.r+4){ok=false;break;}
            if(!(rx&&lz>6))for(const s of P.streets||[]){const lim=Math.min(s.pts.length,(s.painted||0)+3);for(let k=0;k<lim;k+=2){const q=s.pts[k];if(Math.hypot(q[0]-x,q[1]-z)<(s.hw||1.5)+2){ok=false;break;}}if(!ok)break;}}}
        if(!ok)break;}
      if(!ok||mx-mn>(rx?5.2:3.6)||clr.length>3)continue;let bad=false;for(const m of G.markers)if(m.k==='forbid'&&Math.hypot(m.x-Tx,m.z-Tz)<14){bad=true;break;}if(bad)continue;
      for(const o of others)if(Math.hypot(o[0]-Tx,o[1]-Tz)<24){bad=true;break;}if(avoid&&Math.hypot(avoid[0]-Tx,avoid[1]-Tz)<48)bad=true;if(bad)continue;
      let np=0;if(P)for(const pl of P.plots||[]){const ex=pl.x-Bx,ez=pl.z-Bz,al=ex*ax[0]+ez*ax[1],lz=ex*out[0]+ez*out[1];if(Math.abs(al)<14&&lz>-6.5&&lz<14)np++;}
      if(np>(rx?24:12))continue;let zb=-np*.4-clr.length*5-Math.abs(off)*2;if(P&&P.v>=3&&typeof lyZone==='function'){try{const z=lyZone(P,Bx,Bz);zb+=z==='ind'?3:z==='farm'?1.5:z==='mix'?-2:z==='res'?-1:-30;}catch(e){}}
      let ge=1e9;for(const e of streetEnds)ge=Math.min(ge,Math.hypot(e[0]-Tx,e[1]-Tz));
      const sc=(opt.prefer&&Math.hypot(Tx-opt.prefer[0],Tz-opt.prefer[1])<5?40:0)+3*Math.cos(da)-Math.hypot(Tx-tx,Tz-tz)*.2-(r>Rb?(r-Rb)*.3:(Rb-r)*.5)-(mx-mn)*2+zb+Math.max(0,10-ge*.12);if(sc>bs){bs=sc;best={Tx,Tz,out,rot,ax,Bx,Bz,range:mx-mn,clear:clr.map(b=>b.id)};}}}
  return best;}
// build the station (instantly: the railway company's gangs raise it) and return its facility record
function clearForStation(ids){let n=0;for(const id of ids||[]){const b=bById(id);if(!b||b.type==='hall')continue;for(const v of G.vill){if(v.home===b.id)v.home=0;if(v.work===b.id){v.work=0;v.job=null;}if(v.site===b.id)v.site=0;if(v.inside===b.id)v.inside=0;}removeBuilding(b);n++;}
  if(n){chron(`${n} ${n>1?'old farm buildings were':'old farm building was'} cleared to make room for the station.`);assignHomes();assignJobs();gridDirty=true;refreshCivic();}return n;}
function raiseStation(spot,i){return withSettlement(i,()=>{clearForStation(spot.clear);const b=startSite('station',spot.Bx,spot.Bz,spot.rot,{});completeSite(b);b._railPad=1;
  const y=hAt(spot.Tx,spot.Tz),F={k:'station',x:spot.Tx,z:spot.Tz,ax:[spot.ax[0],spot.ax[1]],out:[spot.out[0],spot.out[1]],len:RC.STL,y:Math.round(y*100)/100,t:i,bid:b.id,nm:G.town+' Station',stock:0};
  const pts=[],ys=[];for(let l=-20;l<=20;l+=2){pts.push([F.x+F.ax[0]*l,F.z+F.ax[1]*l]);ys.push(F.y);}
  // level a bench for the platform and both tracks
  lyIgn(()=>railGrade(pts.map(p=>[p[0]+F.out[0]*2,p[1]+F.out[1]*2]),ys,()=>false,5.4));
  // the plots that lay where the station stands are struck from the plan
  if(G.plan&&G.plan.plots){const P=G.plan,ax=F.ax,ou=F.out;P.plots=P.plots.filter(pl=>{const dx=pl.x-spot.Bx,dz=pl.z-spot.Bz,al=dx*ax[0]+dz*ax[1],lz=dx*ou[0]+dz*ou[1];return !(Math.abs(al)<15&&lz>-7&&lz<15);});}
  // a short street from the station to the town
  try{railLinkStreet(b);}catch(e){console.error('station link',e);}
  return F;});}
function railLinkStreet(b){const P=G.plan;if(!P||!P.streets||!P.streets.length)return;let bd=1e9,be=null;const d=doorOf(b);
  for(const s of P.streets){if(s.kind==='lane'&&s.hw<1.2)continue;for(const e of [s.pts[0],s.pts[s.pts.length-1],s.pts[Math.floor(s.pts.length/2)]]){const dd=Math.hypot(e[0]-d[0],e[1]-d[1]);if(dd<bd&&dd>3){bd=dd;be=e;}}}
  if(!be||bd>70)return;const path=findPath(d[0],d[1],be[0],be[1],b.id,0);if(!path)return;let px=d[0],pz=d[1];
  for(const q of [[d[0],d[1]],...path]){for(let t=0;t<=1;t+=.25){const x=lerp(px,q[0],t),z=lerp(pz,q[1],t),i0=Math.floor(x-1.6+HALF),i1=Math.ceil(x+1.6+HALF),j0=Math.floor(z-1.6+HALF),j1=Math.ceil(z+1.6+HALF);
      for(let j=Math.max(0,j0);j<=Math.min(N,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(N,i1);i++){if(Math.hypot(i-HALF-x,j-HALF-z)<1.5&&W[j*S+i]<.1){const k=j*S+i;ROAD[k]=Math.max(ROAD[k],.92);}}}px=q[0];pz=q[1];}}
// ---------------------------------------------------------------- where the works are: the far quarry in the hills, the far forest, the far farms, the harbour
const NEEDW={stone:'stone',timber:'wood',grain:'food',harbour:'food'};
function walkHours(d){return Math.round(d/ (G.walkSpeed||5.5) *10)/10;}
function rocksNear(x,z,R){let n=0;for(const t of trees)if(t.t===4&&Math.abs(t.x-x)<R&&Math.abs(t.z-z)<R&&(t.x-x)**2+(t.z-z)**2<R*R)n++;return n;}
function treesNear(x,z,R){let n=0;for(const t of trees)if(t.t!==4&&t.t!==5&&Math.abs(t.x-x)<R&&Math.abs(t.z-z)<R&&(t.x-x)**2+(t.z-z)**2<R*R)n++;return n;}
function farFromTowns(x,z,d){for(let i=0;i<TOWNS.list.length;i++){const c=sGet(i,'center');if(c&&Math.hypot(c.x-x,c.z-z)<d)return false;}return true;}
function depotSpots(need,from){// ranked candidate sites for a depot, best first
  const c=G.center,out=[];if(!c)return out;const hc=hAt(c.x,c.z);
  const forest=need==='timber',stone=need==='stone',Rb0=urbanR();
  if(need==='harbour'||need==='grain'){const ty=need==='harbour'?'dock':'farm';const Rb1=urbanR(),L=buildings.filter(b=>b.type===ty&&!b.build&&Math.hypot(b.x-c.x,b.z-c.z)>Rb1+26);
    if(L.length<(need==='farm'?3:1))return out;let sx=0,sz=0;for(const b of L){sx+=b.x;sz+=b.z;}sx/=L.length;sz/=L.length;
    for(let r=6;r<=18;r+=3)for(let a=0;a<TAU;a+=PI/8){const x=sx+Math.cos(a)*r,z=sz+Math.sin(a)*r;if(Math.abs(x)>HALF-16||Math.abs(z)>HALF-16||wAt(x,z)>.03)continue;
      let ok=true;for(const b of buildings)if(Math.hypot(b.x-x,b.z-z)<(b.r||3)+7){ok=false;break;}if(!ok)continue;let mn=1e9,mx=-1e9;for(let k=0;k<5;k++){const h=hAt(x+(k%3-1)*5,z+((k/3)|0)*5-2.5);mn=Math.min(mn,h);mx=Math.max(mx,h);}
      if(mx-mn>4)continue;out.push({x,z,score:30-r*.5-(mx-mn)*2,value:L.length,dist:Math.hypot(x-c.x,z-c.z)});}
    out.sort((p,q)=>q.score-p.score);return out.slice(0,6);}
  for(let x=-HALF+18;x<=HALF-18;x+=6)for(let z=-HALF+18;z<=HALF-18;z+=6){const d=Math.hypot(x-c.x,z-c.z);if(d<Rb0+74||d>190||wAt(x,z)>.03)continue;if(!farFromTowns(x,z,48))continue;
    let mn=1e9,mx=-1e9,wet=false;for(let k=0;k<9;k++){const px=x+(k%3-1)*7,pz=z+((k/3|0)-1)*7,h=hAt(px,pz);mn=Math.min(mn,h);mx=Math.max(mx,h);if(wAt(px,pz)>.05)wet=true;}if(wet||mx-mn>6)continue;
    let ok=true;for(const b of allB())if(Math.hypot(b.x-x,b.z-z)<(b.r||3)+10){ok=false;break;}if(!ok)continue;
    let val=0,desc='';if(stone){const rk=rocksNear(x,z,13);let rel=0;for(let k=0;k<8;k++){const h=hAt(x+Math.cos(k*PI/4)*15,z+Math.sin(k*PI/4)*15);rel=Math.max(rel,h-mn);}const up=clamp(hAt(x,z)-hc,0,28);if(rk<5&&rel<7)continue;val=rk*.7+rel*1.3+up*.5;}
    else if(forest){const tn=treesNear(x,z,15);if(tn<60)continue;val=tn*.18;}
    const sc=val-d*.14-(mx-mn)*1.4;out.push({x,z,score:sc,value:val,dist:d,relief:mx-mn});}
  out.sort((p,q)=>q.score-p.score);
  // keep sites that are not neighbours of each other
  const pick=[];for(const o of out){if(pick.length>=5)break;if(pick.every(q=>Math.hypot(q.x-o.x,q.z-o.z)>26))pick.push(o);}return pick;}
function depotAxis(F,ax){F.ax=ax;const n1=[-ax[1],ax[0]],h1=hAt(F.x+n1[0]*6,F.z+n1[1]*6),h2=hAt(F.x-n1[0]*6,F.z-n1[1]*6);F.out=h1<=h2?n1:[-n1[0],-n1[1]];}
function depotRecord(site,toward,i,need){const ux=toward[0]-site.x,uz=toward[1]-site.z,l=Math.hypot(ux,uz)||1;let ax=[-ux/l,-uz/l];// the axis points away from the town
  const n1=[-ax[1],ax[0]],h1=hAt(site.x+n1[0]*6,site.z+n1[1]*6),h2=hAt(site.x-n1[0]*6,site.z-n1[1]*6);const out=h1<=h2?n1:[-n1[0],-n1[1]];
  const hill=need==='stone'&&hAt(site.x,site.z)>22;
  return {k:'depot',x:site.x,z:site.z,ax,out,len:RC.DPL,y:Math.round(hAt(site.x,site.z)*100)/100,t:i,cargo:NEEDW[need]||'goods',what:need,nm:({stone:hill?'Mountain Quarry':'Stone Quarry Depot',timber:'Timber Yard',grain:'Grain Depot',harbour:'Harbour Goods Yard'})[need]||'Depot',stock:need==='stone'?44:need==='timber'?40:34,rate:need==='stone'?1.6:need==='timber'?1.4:1.2,virt:1};}

// ---------------------------------------------------------------- laying a line
function railGuard(L){for(const k of ['_c'])if(L[k]===undefined)delete L[k];}
function newId(i){const r=rS();return 'r'+i+'_'+(r.n++);}
function finishLine(L,y0,y1,opt){// profile, features, a halt site, passing loops, grading
  opt=opt||{};const pf=railProfile(L.pts,y0,y1);L.ys=pf.ys;L.br=pf.br;L.tn=pf.tn;L.lx=railCrossings(L.pts,L.br,L.tn);L.len=Math.round(llen(L)*10)/10;delete L.hs;
  const bad=(l,q,m)=>l&&l.some(r=>(Array.isArray(r)?(q+m+3>r[0]&&q-m-3<r[1]):Math.abs(q-r)<m+4));
  if(opt.halt&&L.len>=130){// a halt in the middle of a long line between towns, on a straight, level, dry stretch
    for(const f of [.5,.44,.56,.38,.62,.32,.68]){const s=L.len*f;if(bad(L.br,s,16)||bad(L.tn,s,16)||bad(L.lx,s,18))continue;const a=lAt(L,s-12),b=lAt(L,s+12);
      if(Math.abs(angDiff(Math.atan2(a[3],a[4]),Math.atan2(b[3],b[4])))>.14)continue;L.hs=s;
      const y=lAt(L,s)[1];for(let k=0;k<L.pts.length;k++){const d=Math.abs(k*2-s);if(d<16)L.ys[k]=Math.round(lerp(y,L.ys[k],sstep(8,16,d))*100)/100;}break;}}
  if(L.len>RC.LOOPMIN){const nL=Math.floor(L.len/RC.LOOPMIN);L.lp=[];for(let k=1;k<=nL;k++){const s=L.len*k/(nL+1);for(const sh of [0,12,-12,24,-24,36,-36]){const q=s+sh;
      if(q>30&&q<L.len-30&&!bad(L.br,q,RC.LOOPH)&&!bad(L.tn,q,RC.LOOPH)&&!bad(L.lx,q,RC.LOOPH)&&!(L.hs!=null&&Math.abs(q-L.hs)<RC.LOOPH+20)){L.lp.push(Math.round(q));break;}}}}
  const skip=q=>inR(L.br,q*2)||inR(L.tn,q*2);lyIgn(()=>railGrade(L.pts,L.ys,skip));
  return L;}
// cut a long line in two at its halt (the halt is a facility with a port on each side)
function railSplitHalt(L,i){if(L.hs==null)return [L];const s=L.hs,c=lAt(L,s),ax=[c[3],c[4]],n=[-ax[1],ax[0]],h1=hAt(c[0]+n[0]*5,c[2]+n[1]*5),h2=hAt(c[0]-n[0]*5,c[2]-n[1]*5);const out=h1<=h2?n:[-n[0],-n[1]];
  const F={k:'halt',x:c[0],z:c[2],ax,out,len:RC.HLT,y:c[1],t:i,nm:G.town+' Road Halt',stock:0},cum=lcum(L),pm=s-RC.HLT/2,pp=s+RC.HLT/2;
  const cut=(s0,s1)=>{const pts=[],ys=[];const q0=lAt(L,s0);pts.push([q0[0],q0[2]]);ys.push(q0[1]);for(let k=0;k<cum.length;k++)if(cum[k]>s0+.4&&cum[k]<s1-.4){pts.push([L.pts[k][0],L.pts[k][1]]);ys.push(L.ys[k]);}const q1=lAt(L,s1);pts.push([q1[0],q1[2]]);ys.push(q1[1]);return {pts,ys};};
  const A=cut(0,pm),B=cut(pp,L.len);A.pts[A.pts.length-1]=[F.x-ax[0]*RC.HLT/2,F.z-ax[1]*RC.HLT/2];A.ys[A.ys.length-1]=F.y;B.pts[0]=[F.x+ax[0]*RC.HLT/2,F.z+ax[1]*RC.HLT/2];B.ys[0]=F.y;
  const shift=(arr,d,lo,hi)=>(arr||[]).filter(r=>Array.isArray(r)?(r[0]>=lo&&r[1]<=hi):(r>=lo&&r<=hi)).map(r=>Array.isArray(r)?[r[0]-d,r[1]-d].concat(r.slice(2)):r-d);
  const L1={kind:'rail',id:L.id,own:L.own,pts:A.pts,ys:A.ys,a:L.a,b:F,e:L.e,br:shift(L.br,0,0,pm),tn:shift(L.tn,0,0,pm),lx:shift(L.lx,0,0,pm),lp:shift(L.lp,0,0,pm)};
  const L2={kind:'rail',id:newId(i),own:L.own,pts:B.pts,ys:B.ys,a:F,b:L.b,e:L.e,br:shift(L.br,pp,pp,1e9),tn:shift(L.tn,pp,pp,1e9),lx:shift(L.lx,pp,pp,1e9),lp:shift(L.lp,pp,pp,1e9)};
  for(const X of [L1,L2])X.len=Math.round(llen(X)*10)/10;return [L1,L2];}
// route + build between two facility ends. a/b: {F, sg} (port sign) or {join:true}
function railLay(i,Fa,sa,Fb,sb,opt){opt=opt||{};
  const Pa=portPos(Fa,sa),oa=[Fa.ax[0]*sa,Fa.ax[1]*sa];let route;
  if(Fb){const Pb=portPos(Fb,sb),ob=[Fb.ax[0]*sb,Fb.ax[1]*sb];route=railTrace(Pa,oa,Pb,ob,{});if(!route)return null;
    const L={kind:'rail',id:newId(i),own:i,pts:route.pts,a:Fa,b:Fb,e:G.era||5};finishLine(L,Fa.y,Fb.k==='station'?Fb.y:null);
    if(Fb.k!=='station'){Fb.y=L.ys[L.ys.length-1];}if(Fa.k!=='station'&&opt.setA){Fa.y=L.ys[0];}return L;}
  // a branch onto existing track: aim at the nearest track of this people's network
  const lines=railLines().filter(L=>L.own===i);if(!lines.length)return null;
  const near=(x,z)=>{for(const sg of RN.gr?RN.gr.segs:[])if(sg.kind!=='line')for(const p of sg.pts)if(Math.hypot(p[0]-x,p[2]-z)<(sg.kind==='fmain'||sg.kind==='fside'?24:3))return false;
    for(const L of lines)if(lNearest(L,x,z).d<3)return true;return false;};
  route=railTrace(Pa,oa,[opt.tx,opt.tz],null,{join:true,lines,joinOK:near});if(!route||!route.join)return null;
  const J=route.join,Fj={k:'junction',x:J.x,z:J.z,y:J.y,on:J.L.id,ax:[J.tx,J.tz]};
  const L={kind:'rail',id:newId(i),own:i,pts:route.pts,a:Fa,b:Fj,e:G.era||5};finishLine(L,Fa.y,J.y);return L;}
function commitLine(L,i){const net=netEnsure();net.lines.push(L);railClearPlots(L);return L;}
// house plots that lie on the new track are struck from the plans (the folk will lay their streets and plots elsewhere)
function railClearPlots(L){const pts=L.pts;for(const t of netsAll()){const P=t.plan;if(!P||!P.plots||!P.plots.length)continue;
    P.plots=P.plots.filter(pl=>{for(let k=0;k<pts.length;k+=1){if(Math.abs(pts[k][0]-pl.x)<4&&Math.abs(pts[k][1]-pl.z)<4&&Math.hypot(pts[k][0]-pl.x,pts[k][1]-pl.z)<3.8)return false;}return true;});}}

// ---------------------------------------------------------------- scouting a work: station + line + depot (nothing is built yet)
function stationsOf(i){const o=[];for(const L of railAll())for(const F of [L.a,L.b])if(F&&F.k==='station'&&F.t===i&&!o.some(q=>fkey(q)===fkey(F)))o.push(F);return o;}
function stationOf(i,tx,tz){const l=stationsOf(i);if(!l.length)return null;if(tx!=null)l.sort((a,b)=>Math.hypot(a.x-tx,a.z-tz)-Math.hypot(b.x-tx,b.z-tz));return l[0];}
// the station a line should start from: the town's own if it lies on the right side, else a new one at the edge facing the target (in the context of town i)
function pickStation(i,tx,tz,opt){const c=G.center;let F=stationOf(i,tx,tz),sp=null;
  if(F){const dEx=Math.hypot(F.x-tx,F.z-tz);if(dEx>Math.hypot(c.x-tx,c.z-tz)+20){sp=stationSpot(tx,tz,opt);if(!sp||Math.hypot(sp.Tx-tx,sp.Tz-tz)+30>dEx)sp=null;}}
  else{sp=stationSpot(tx,tz,opt);if(!sp)return null;}
  if(sp)F={k:'station',x:sp.Tx,z:sp.Tz,ax:sp.ax,out:sp.out,len:RC.STL,y:hAt(sp.Tx,sp.Tz),t:i,nm:G.town+' Station',stock:0};
  return {F,sp};}
function pickPort(F,tx,tz){const c=[1,-1].map(sg=>({sg,used:portUsed(F,sg),dot:F.ax[0]*sg*(tx-F.x)+F.ax[1]*sg*(tz-F.z)}));c.sort((p,q)=>(p.used-q.used)||(q.dot-p.dot));return c[0].used?null:c[0].sg;}
function railScout(i,need,arg,pref){pref=pref||{};return withSettlement(i,()=>{const c=G.center;if(!c)return {ok:false,why:'no town'};
  const tgt=need==='link'?(sGet(arg,'center')?[sGet(arg,'center').x,sGet(arg,'center').z]:null):[arg.x,arg.z];if(!tgt)return {ok:false,why:'no target'};
  // for a link both towns need a station: the one that already has a station is fixed first, the other keeps well away from it
  let ps=null,spB=null,j=null,Fb=null;const cc=[c.x,c.z];
  if(need==='link'){j=arg;const hasA=!!stationOf(i),hasB=!!withSettlement(j,()=>stationOf(j));
    const pickB=(av)=>withSettlement(j,()=>{const q=pickStation(j,cc[0],cc[1],{avoid:av||undefined,prefer:pref.sb});return q?{F:q.F,sp:q.sp}:null;});
    let r=null;
    if(hasB&&!hasA){r=pickB(null);if(r)ps=pickStation(i,tgt[0],tgt[1],{avoid:[r.F.x,r.F.z],prefer:pref.sa});}
    else{ps=pickStation(i,tgt[0],tgt[1],{prefer:pref.sa});if(ps)r=pickB([ps.F.x,ps.F.z]);}
    if(!ps)return {ok:false,why:'There was no gentle ground at the edge of the town for a station.'};
    if(!r)return {ok:false,why:'There was no gentle ground at the edge of the other town for a station.'};Fb=r.F;spB=r.sp;}
  else{ps=pickStation(i,tgt[0],tgt[1],{minLine:66,prefer:pref.sa});if(!ps)return {ok:false,why:'There was no gentle ground at the edge of the town for a station.'};}
  const F=ps.F,fresh=ps.sp;const sg=pickPort(F,tgt[0],tgt[1]);
  if(need!=='link')Fb=depotRecord(arg,[F.x,F.z],i,need);
  let sb=-1;const blocks=[];if(fresh)blocks.push({x:F.x-F.out[0]*RC.TZ,z:F.z-F.out[1]*RC.TZ,r:11.4});if(spB)blocks.push({x:Fb.x-Fb.out[0]*RC.TZ,z:Fb.z-Fb.out[1]*RC.TZ,r:11.4});if(Fb.k==='depot')blocks.push({x:Fb.x,z:Fb.z,r:8.5,depot:1});RN.blocks=blocks;
  if(need==='link')sb=pickPort(Fb,F.x,F.z);
  if(Fb.k==='depot'&&sg!=null){// find how the line would really arrive, and turn the depot to face it
    RN.blocks=blocks.filter(q=>!q.depot);const r0=railTrace(portPos(F,sg),[F.ax[0]*sg,F.ax[1]*sg],[Fb.x,Fb.z],null,{free:true});RN.blocks=blocks;
    if(r0&&r0.pts.length>6){const n=r0.pts.length,a=r0.pts[n-7],b=r0.pts[n-1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;depotAxis(Fb,[(b[0]-a[0])/l,(b[1]-a[1])/l]);}}
  // candidate routes: port to port, or a branch onto the existing track at either end (the shortest sound one wins)
  const dd=Math.hypot(F.x-Fb.x,F.z-Fb.z),cands=[];let why='The surveyors found no way through the land.';
  const sound=(r)=>{if(!r)return false;for(let t=0;t<TOWNS.list.length;t++){if(TOWNS.list[t].dead)continue;const cc=sGet(t,'center');if(!cc)continue;const R=withSettlement(t,urbanR)*(pref.exec?.74:.88);for(const q of r.pts)if(Math.hypot(q[0]-cc.x,q[1]-cc.z)<R){why='The only way ran through the middle of a town.';return false;}}
    const len=netLen(r.pts).slice(-1)[0];if(len>560||len>dd*(need==='link'?3:2.4)+60){why='The only way round was far too long.';return false;}return true;};
  const add=(r,rev)=>{if(r&&sound(r)){r.rev=!!rev;cands.push(r);}};
  const lens=r=>netLen(r.pts).slice(-1)[0];
  if(sg!=null&&sb!=null){const Pa=portPos(F,sg),oa=[F.ax[0]*sg,F.ax[1]*sg],Pb=portPos(Fb,sb),ob=[Fb.ax[0]*sb,Fb.ax[1]*sb];add(railTrace(Pa,oa,Pb,ob,{}),false);}
  if(need==='link'||sb==null){if(sg!=null)add(railJoin(portPos(F,sg),[F.ax[0]*sg,F.ax[1]*sg],[Fb.x,Fb.z],linesReach(Fb)),false);}
  if(sb!=null&&(need==='link'||sg==null))add(railJoin(portPos(Fb,sb),[Fb.ax[0]*sb,Fb.ax[1]*sb],[F.x,F.z],linesReach(F)),true);
  RN.blocks=null;
  if(sg==null&&sb==null)return {ok:false,why:'no free track at either station'};
  if(!cands.length)return {ok:false,why,dd:Math.round(dd)};
  cands.sort((a,b)=>lens(a)-lens(b));const route=cands[0],len=lens(route);
  return {ok:true,F,fresh,sg,Fb,spB,sb,j,route,len:Math.round(len),need,join:route.join,rev:!!route.rev};});}
// every line that can be reached by rail from a station (its whole connected network)
function linesReach(F){const gr=RN.gr;if(!gr)return [];const fx=gr.fx.get(fkey(F));if(!fx)return [];const seen=new Set([fx.main.id]),q=[fx.main],out=new Set();
  while(q.length){const sg=q.pop();if(sg.L)out.add(sg.L);for(const nd of [sg.a,sg.b])for(const e of nd.segs)if(!seen.has(e.sg.id)){seen.add(e.sg.id);q.push(e.sg);}}return [...out];}
// branch from a port onto existing track (never within a station throat or a loop)
function railJoin(P,out,tgt,lines){if(!lines.length)return null;
  const mk=(rad)=>(x,z)=>{if(RN.gr)for(const sg of RN.gr.segs)if(sg.kind!=='line')for(const p of sg.pts)if(Math.hypot(p[0]-x,p[2]-z)<(sg.kind==='fmain'||sg.kind==='fside'?rad:3))return false;for(const L of lines)if(lNearest(L,x,z).d<3)return true;return false;};
  const r=railTrace(P,out,tgt,null,{join:true,lines,joinOK:mk(24),joinOK2:mk(16)});return r&&r.join?r:null;}
function railCost(len,nst){return [clamp(Math.round(20+len*.25+nst*8),35,100),clamp(Math.round(30+len*.45+nst*10),55,150)];}

// ---------------------------------------------------------------- build the works
function railPad(F){const pts=[],ys=[];for(let l=-(F.len/2+4);l<=F.len/2+4;l+=2){pts.push([F.x+F.ax[0]*l-F.out[0]*1.6,F.z+F.ax[1]*l-F.out[1]*1.6]);ys.push(F.y);}lyIgn(()=>railGrade(pts,ys,()=>false,F.k==='depot'?6.2:4));}
function railBuildPlan(i,plan){return withSettlement(i,()=>{
  let F=plan.F;if(plan.fresh)F=raiseStation(plan.fresh,i);
  let Fb=plan.Fb;if(plan.need==='link'&&plan.spB)Fb=raiseStation(plan.spB,plan.j);
  let L;
  if(plan.rev){// a depot/station end branching onto the line: the line runs from Fb to the junction
    const J=plan.route.join;L={kind:'rail',id:newId(i),own:i,pts:plan.route.pts,a:Fb,b:{k:'junction',x:J.x,z:J.z,y:J.y,on:J.L.id,ax:[J.tx,J.tz]},e:G.era||5};finishLine(L,Fb.k==='depot'?null:Fb.y,J.y);if(Fb.k==='depot')Fb.y=L.ys[0];}
  else if(plan.join){const J=plan.join;L={kind:'rail',id:newId(i),own:i,pts:plan.route.pts,a:F,b:{k:'junction',x:J.x,z:J.z,y:J.y,on:J.L.id,ax:[J.tx,J.tz]},e:G.era||5};finishLine(L,F.y,J.y);}
  else{L={kind:'rail',id:newId(i),own:i,pts:plan.route.pts,a:F,b:Fb,e:G.era||5};finishLine(L,F.y,Fb.k==='station'?Fb.y:null,{halt:plan.need==='link'});if(Fb.k!=='station')Fb.y=L.ys[L.ys.length-1];}
  if(L.hs!=null){const parts=railSplitHalt(L,i);for(const X of parts)commitLine(X,i);L=parts[0];Object.defineProperty(L,'_all',{value:parts,enumerable:false,configurable:true});}else commitLine(L,i);
  for(const X of [F,Fb])if(X&&(X.k==='depot'||X.k==='halt'))railPad(X);
  return L;});}
function railRebuildGraph(){try{RN.era=railEraNow();RN.gr=railGraph();railBuildHash();}catch(e){console.error('rail graph',e);RN.gr=null;}
  RN.link={};if(RN.gr)for(const s of RN.gr.svcs)if(s.k==='pax'){const ts=s.stops.map(k=>RN.gr.fx.get(k)).filter(f=>f&&f.F.k==='station').map(f=>f.F.t);for(let a=0;a<ts.length;a++)for(let b=a+1;b<ts.length;b++)if(ts[a]!==ts[b])RN.link[Math.min(ts[a],ts[b])+'-'+Math.max(ts[a],ts[b])]=1;}}
function railChanged(){RN.dirty=true;railRebuildGraph();if(typeof netPaint==='function')netPaint();RN.nextMesh=0;gridDirty=true;}
function placeName(x,z){const c=G.center;return c?dirWord(x,z):'';}
function railExecute(p){const rp=p.rp;if(!rp)return false;const i=TOWNS.cur,T=tfEnsure(),cost=p.cost||[60,80];
  if(G.wood<cost[0]||G.stone<cost[1]){chron(`The folk lacked the ${G.wood<cost[0]?'timber':'stone'} to ${p.short}. They will ask again.`);T.cool.rail=dayN()+3;return true;}
  const plan=railScout(i,rp.need,rp.need==='link'?rp.j:{x:rp.sx,z:rp.sz},{sa:rp.sa,sb:rp.sb,exec:1});
  if(!plan.ok){chron(`The surveyors could find no way to ${p.short}. ${plan.why||''}`);T.cool.rail=dayN()+10;return true;}
  if(rp.need==='link'&&railLinked(i,rp.j)){chron(`The two towns were already joined by rail.`);return true;}
  const L=railBuildPlan(i,plan);G.wood-=cost[0];G.stone-=cost[1];railChanged();
  const Fb=plan.Fb,town=G.town,len=plan.len,fresh=plan.fresh;let txt,big;
  if(rp.need==='link'){const o=sName(rp.j);txt=`By the Spirit's leave the folk laid ${len} paces of railway between ${town} and ${o}, with a station at the edge of each town. The first train steamed across the valley.`;}
  else{const what={stone:'the quarry depot in the hills',timber:'the timber yard in the far forest',grain:'the grain depot among the far farms',harbour:'the goods yard at the harbour'}[rp.need];
    txt=`By the Spirit's leave the folk laid ${len} paces of railway ${fresh?`from a new station at the edge of ${town} `:'from the station '}to ${what} ${placeName(Fb.x,Fb.z)} of ${town}. It skirts the town and keeps clear of the streets.`;}
  const LS=L._all||[L],nb=LS.reduce((a,l)=>a+l.br.length,0),nt=LS.reduce((a,l)=>a+l.tn.length,0),nx=LS.reduce((a,l)=>a+(l.lx||[]).length,0),feat=[];if(nb)feat.push(`${nb} bridge${nb>1?'s':''}`);if(nt)feat.push(`${nt} tunnel${nt>1?'s':''}`);if(nx)feat.push(`${nx} level crossing${nx>1?'s':''}`);
  if(feat.length)txt+=` It needed ${feat.join(', ')}.`;
  chron(txt,true);showBanner('The railway',rp.need==='link'?`${town} and ${sName(rp.j)} are joined`:`${town} is joined to its works`);sfx('bell');
  if(typeof storyEvent==='function')try{storyEvent('milestone',{txt:`The first train ran on the new railway of ${town}.`,big:true});}catch(e){}
  rS().own++;if(rp.need==='link'){withSettlement(rp.j,()=>{chron(`A railway reached ${town}: a station was raised at the edge of ${G.town}.`,false);});}
  return true;}
// the sandbox's and old saves' free-form line between two points
function railBuildLine(a,b){const i=TOWNS.cur;const u=[b[0]-a[0],b[1]-a[1]],l=Math.hypot(u[0],u[1])||1;u[0]/=l;u[1]/=l;
  const mk=(x,z)=>{const o=[-u[1],u[0]],h1=hAt(x+o[0]*5,z+o[1]*5),h2=hAt(x-o[0]*5,z-o[1]*5);const out=h1<=h2?o:[-o[0],-o[1]];return {k:'halt',x,z,ax:[u[0],u[1]],out,len:RC.HLT,y:Math.round(hAt(x,z)*100)/100,t:i,nm:(G.town||'Halt')+' Halt',stock:0};};
  let Fa=null,sa=1;for(const L of railAll())for(const F of [L.a,L.b])if(F&&(F.k==='halt'||F.k==='station')&&Math.hypot(F.x-a[0],F.z-a[1])<10){Fa=F;}
  if(Fa){let bs=null;for(const sg of [1,-1]){if(portUsed(Fa,sg))continue;const d=Fa.ax[0]*sg*u[0]+Fa.ax[1]*sg*u[1];if(bs===null||d>bs[1])bs=[sg,d];}if(!bs)Fa=null;else sa=bs[0];}
  // a station building standing near an end of the line is joined: the track runs along its platform
  const stnAt=p=>{let best=null,bd=16;for(const q of buildings)if(q.type==='station'&&!q.build){const d=Math.hypot(q.x-p[0],q.z-p[1]);if(d<bd){bd=d;best=q;}}return best;};
  const facOfStation=q=>{for(const L of railAll())for(const F of [L.a,L.b])if(F&&F.k==='station'&&F.bid===q.id)return F;const out=[Math.sin(q.rot),Math.cos(q.rot)],ax=[Math.cos(q.rot),-Math.sin(q.rot)],T=[q.x+out[0]*RC.TZ,q.z+out[1]*RC.TZ];
    return {k:'station',x:T[0],z:T[1],ax,out,len:RC.STL,y:Math.round(hAt(T[0],T[1])*100)/100,t:i,bid:q.id,nm:(G.town||'')+' Station',stock:0};};
  const bestPort=(F,dx,dz)=>{let bs=null;for(const sg of [1,-1]){if(portUsed(F,sg))continue;const d=F.ax[0]*sg*dx+F.ax[1]*sg*dz;if(bs===null||d>bs[1])bs=[sg,d];}return bs&&bs[0];};
  const qa=!(Fa&&Fa.k==='station')?stnAt(a):null;if(qa){const F=facOfStation(qa),sg=bestPort(F,u[0],u[1]);if(sg){Fa=F;sa=sg;railPad(F);}}
  if(!Fa){Fa=mk(a[0],a[1]);sa=1;}
  let Fb=null,sb=-1;const qb=stnAt(b);if(qb){const F=facOfStation(qb),sg=bestPort(F,-u[0],-u[1]);if(sg){Fb=F;sb=sg;railPad(F);}}
  if(!Fb)Fb=mk(b[0],b[1]);let L=railLay(i,Fa,sa,Fb,sb,{setA:false});
  if(!L){// last resort: shift the far end a little (the terrain may be blocked)
    if(Fb.k==='halt')for(const sh of [[6,0],[-6,0],[0,6],[0,-6]]){const Fb2=mk(b[0]+sh[0],b[1]+sh[1]);L=railLay(i,Fa,sa,Fb2,-1,{});if(L)break;}}
  if(!L)return false;commitLine(L,i);for(const X of [L.a,L.b])if(X.k==='halt')railPad(X);
  railChanged();let sc=0;for(let k=0;k<animals.length;k++){const an=animals[k];for(const p of L.pts){if(Math.hypot(an.x-p[0],an.z-p[1])<9){sc++;break;}}}
  return {len:Math.round(L.len),scared:sc};}
// old saves: a line without a profile becomes a track between two halts
function railMigrate(){let n=0;TOWNS.list.forEach((s,idx)=>{const net=sGet(idx,'net');if(!net)return;
    for(const L of net.lines){if(L.kind!=='rail'||L.ys||!L.pts||L.pts.length<8)continue;let pts=L.pts.map(p=>[p[0],p[1]]);const cut=Math.min(8,Math.floor(pts.length/4));pts=pts.slice(cut,pts.length-cut);if(pts.length<4)continue;
      const tan=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;return [dx/l,dz/l];};const t0=tan(pts[0],pts[3]),t1=tan(pts[pts.length-4],pts[pts.length-1]);
      const ys=pts.map(p=>Math.round(hAt(p[0],p[1])*100)/100);
      const mk=(x,z,ax)=>{const o=[-ax[1],ax[0]];return {k:'halt',x,z,ax,out:o,len:RC.HLT,y:Math.round(hAt(x,z)*100)/100,t:idx,nm:'Halt',stock:0};};
      const Fa=mk(pts[0][0]-t0[0]*8,pts[0][1]-t0[1]*8,t0),Fb=mk(pts[pts.length-1][0]+t1[0]*8,pts[pts.length-1][1]+t1[1]*8,t1);
      L.pts=pts;L.ys=ys;L.a=Fa;L.b=Fb;L.br=[];L.tn=[];L.lx=[];L.lp=[];L.own=idx;L.id=L.id||('r'+idx+'_'+(net.rs?net.rs.n++:Math.floor(Math.random()*1e6)));L.e=5;delete L._c;L.len=Math.round(llen(L)*10)/10;n++;}});return n;}

// ---------------------------------------------------------------- the picture of the line: ballast, sleepers, rails, bridges, portals, crossings, platforms, depots
const CBAL=[0x8b857a,0x827c71],CSLP=0x5b4632,CRAIL=0x70757c,CRAILT=0xa3a8ae;
function railDispose(){if(RN.mesh){RN.grp.remove(RN.mesh);RN.mesh.geometry.dispose();RN.mesh=null;}if(RN.glow){RN.grp.remove(RN.glow);RN.glow.geometry.dispose();RN.glow=null;}}
function sampleSeg(sg,step){const o=[],n=Math.max(1,Math.round(sg.len/step));for(let k=0;k<=n;k++){const s=sg.len*k/n,q=segAt(sg,s);o.push({s,x:q[0],y:q[1],z:q[2],tx:q[3],tz:q[4],nx:-q[4],nz:q[3]});}return o;}
// a box laid along the track between two samples (with the pitch of the grade)
function chunk(B,a,b,o,y0,w,h,col,mt){const mx=(a.x+b.x)/2+(a.nx+b.nx)/2*o,mz=(a.z+b.z)/2+(a.nz+b.nz)/2*o,my=(a.y+b.y)/2+y0,dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||.01,ry=Math.atan2(dx,dz),rx=-Math.atan2(b.y-a.y,l);
  if(mt!=null)B.mt=mt;B.put('box',mx,my,mz,w,h,l+.04,col,rx,ry,0);if(mt!=null)B.mt=0;}
function railMeshBuild(){railDispose();const gr=RN.gr;if(!gr||!gr.segs.length)return;const era=RN.era;const B=new Builder(()=>.5,0),Fx=new Builder(()=>.5,0);B.mt=0;Fx.mt=0;let nv=0;
  const maglev=era>=7,elec=era===6;
  for(const sg of gr.segs){const L=sg.L,isLine=sg.kind==='line'||sg.kind==='lmain';const S=sampleSeg(sg,1);const sa=sg.sa||0;
    const feat=i=>{if(!L||!isLine)return 0;const s=sa+S[i].s;if(inR(L.tn,s))return 2;const b=inR(L.br,s);return b?(b[2]==='v'?3:1):0;};
    for(let i=0;i<S.length-1;i++){const a=S[i],b=S[i+1],f=feat(i);if(f===2)continue;const alt=(i>>2)&1;
      if(maglev){// the guideway: a slim white beam with a glowing edge, on pylons
        chunk(B,a,b,0,-.48,2.7,.58,0xe6ebef);chunk(Fx,a,b,1.0,.08,.12,.05,0x7ff0ff);chunk(Fx,a,b,-1.0,.08,.12,.05,0x7ff0ff);
        if(i%8===3&&f===0){const g=hAt(a.x,a.z)-.3,h=a.y-.5-g;if(h>.7){B.mt=0;B.cyl(a.x,g,a.z,.38,h,0xd7dee4,8);}}}
      else{
        // ballast bed with shoulders
        {const q=(o0,o1,d0,d1,col)=>{const A0=[a.x+a.nx*o0,a.y+d0,a.z+a.nz*o0],A1=[b.x+b.nx*o0,b.y+d0,b.z+b.nz*o0],B0=[a.x+a.nx*o1,a.y+d1,a.z+a.nz*o1],B1=[b.x+b.nx*o1,b.y+d1,b.z+b.nz*o1];B.quad(A0,B0,B1,A1,col,0);};
          q(-1.75,1.75,.1,.1,CBAL[alt]);q(-2.4,-1.75,.03,.1,0x77716a);q(1.75,2.4,.1,.03,0x77716a);}
        // sleepers and rails
        B.put('box',a.x,a.y+.1,a.z,2.5,.1,.3,CSLP,-Math.atan2(b.y-a.y,1),Math.atan2(b.x-a.x,b.z-a.z),0);
        for(const o of [-.72,.72]){chunk(B,a,b,o,.2,.12,.17,CRAIL);chunk(B,a,b,o,.37,.07,.015,CRAILT);}
        if(f===1||f===3){// bridge: deck, girders, parapet
          chunk(B,a,b,0,-.62,4.3,.72,era>=6?0xb3b0a7:0x4a5058);
          for(const o of [-2.05,2.05]){chunk(B,a,b,o,-.1,.22,.92,era>=6?0xa7a39a:0x3d4249);if(era<6&&i%2===0){B.put('box',a.x+a.nx*o,a.y-.1,a.z+a.nz*o,.14,1.9,.14,0x3d4249,0,0,0);}}
          if(era<6)for(const o of [-2.05,2.05])chunk(B,a,b,o,1.7,.2,.18,0x3d4249);
          if(i%8===4){const g=hAt(a.x,a.z)-.4,top=a.y-.62-.05;if(top-g>.6){B.mt=2;B.put('box',a.x,g,a.z,1.5,top-g,1.5,0x8f897d,0,Math.atan2(a.tx,a.tz),0);B.put('box',a.x,top-.2,a.z,2.1,.3,2.1,0x9c9486,0,Math.atan2(a.tx,a.tz),0);B.mt=0;}}}
        // overhead wire masts
        if(elec&&i%14===5&&f===0){const side=(Math.floor(i/14)%2?1:-1)*2.55;B.put('box',a.x+a.nx*side,a.y,a.z+a.nz*side,.17,5.4,.17,0x6b7078,0,0,0);
          B.put('box',a.x+a.nx*side*.5,a.y+5.1,a.z+a.nz*side*.5,.12,.12,Math.abs(side)+.1,0x6b7078,0,Math.atan2(a.nx*Math.sign(side),a.nz*Math.sign(side)),0);}
        if(elec&&i%2===1&&f!==2){chunk(B,a,b,0,4.55,.05,.05,0x2a2a2e);}}
      // level crossings
      if(L&&isLine&&L.lx){const s=sa+a.s;for(const x of L.lx)if(s<=x&&sa+b.s>x){B.put('box',a.x,a.y+.22,a.z,3.2,.08,3.6,0x6e5e4a,-Math.atan2(b.y-a.y,1),Math.atan2(a.tx,a.tz),0);
        for(const sd of [-1,1])for(const al of [-2.7,2.7]){const px=a.x+a.nx*sd*2.9+a.tx*al,pz=a.z+a.nz*sd*2.9+a.tz*al,ry=Math.atan2(a.tx,a.tz);B.put('box',px,a.y,pz,.1,2.0,.1,0xe6e6e6,0,0,0);
          B.put('box',px,a.y+1.55,pz,1.2,.15,.05,0xf2f2f2,0,ry,.7);B.put('box',px,a.y+1.55,pz,1.2,.15,.05,0xf2f2f2,0,ry,-.7);Fx.put('box',px,a.y+2.0,pz,.2,.2,.2,0xff3a2a,0,0,0);}}}}
    // tunnel portals
    if(L&&isLine&&L.tn){for(const r of L.tn){for(const end of [0,1]){const s=end?r[1]:r[0],lo=sa,hi=sa+sg.len;if(s<lo-.01||s>hi+.01)continue;const q=lAt(L,s);const dir=end?-1:1,ry=Math.atan2(q[3]*dir,q[4]*dir);
          B.mt=2;const nx=-q[4],nz=q[3];const col=0x8f897d,col2=0x7b756a;
          for(const sd of [-1,1]){B.put('box',q[0]+nx*sd*2.15,q[1],q[2]+nz*sd*2.15,.95,4.2,1.6,col,0,ry,0);B.put('box',q[0]+nx*sd*3.4+q[3]*dir*-.4,q[1],q[2]+nz*sd*3.4+q[4]*dir*-.4,2.3,3.0,.8,col2,0,ry+sd*.55,0);}
          B.put('box',q[0],q[1]+4.15,q[2],5.4,1.0,1.7,0x9c9486,0,ry,0);B.put('box',q[0],q[1]+5.1,q[2],5.9,.22,2.1,0x6f685e,0,ry,0);B.mt=0;
          B.put('box',q[0]+q[3]*dir*1.4,q[1]-.05,q[2]+q[4]*dir*1.4,3.2,4.1,.2,0x0b0b0c,0,ry,0);}}}}
  // facilities
  for(const fx of gr.fx.values())drawFacility(B,Fx,fx.F,gr);
  // buffer stops at the free ends of facilities and at dead ends
  for(const fx of gr.fx.values()){const F=fx.F;for(const sgn of [1,-1])if(!portUsed(F,sgn)){const P=portPos(F,sgn),ry=Math.atan2(F.ax[0],F.ax[1]);B.put('box',P[0]+F.ax[0]*sgn*.3,F.y+.1,P[1]+F.ax[1]*sgn*.3,2.4,.5,.4,0x6a3a2a,0,ry,0);B.put('box',P[0]+F.ax[0]*sgn*.3,F.y+.6,P[1]+F.ax[1]*sgn*.3,2.6,.18,.46,0xc9c4b8,0,ry,0);Fx.put('box',P[0]+F.ax[0]*sgn*.3,F.y+.82,P[1]+F.ax[1]*sgn*.3,.2,.2,.2,0xff3a2a,0,0,0);}}
  RN.mesh=B.mesh(matB);RN.mesh.castShadow=true;RN.mesh.receiveShadow=true;RN.mesh.frustumCulled=false;RN.grp.add(RN.mesh);
  RN.glow=Fx.mesh(matFire,false);RN.glow.frustumCulled=false;RN.grp.add(RN.glow);}
// a box in a facility's own frame: l along the track, o across (positive = the siding/outer side), y0 above the track level
function fbox(B,F,l,o,y0,w,h,len,col,mt){const x=F.x+F.ax[0]*l+F.out[0]*o,z=F.z+F.ax[1]*l+F.out[1]*o;if(mt!=null)B.mt=mt;B.put('box',x,F.y+y0,z,w,h,len,col,0,Math.atan2(F.ax[0],F.ax[1]),0);if(mt!=null)B.mt=0;}
function fcyl(B,F,l,o,y0,r,h,col,seg,mt){if(mt!=null)B.mt=mt;B.cyl(F.x+F.ax[0]*l+F.out[0]*o,F.y+y0,F.z+F.ax[1]*l+F.out[1]*o,r,h,col,seg||10);if(mt!=null)B.mt=0;}
function fsph(B,F,l,o,y0,rx,ry,rz,col,mt){if(mt!=null)B.mt=mt;B.sph(F.x+F.ax[0]*l+F.out[0]*o,F.y+y0,F.z+F.ax[1]*l+F.out[1]*o,rx,ry,rz,col,0);if(mt!=null)B.mt=0;}
function flog(B,F,l,o,y0,r,len,col){// a log lying across the track direction (along the facility's outward normal)
  const x=F.x+F.ax[0]*l+F.out[0]*o,z=F.z+F.ax[1]*l+F.out[1]*o,ry=Math.atan2(F.out[0],F.out[1]);B.put('cyl:7:1',x-F.out[0]*len/2,F.y+y0,z-F.out[1]*len/2,r,len,r,col,PI/2,ry,0);}
function lamp(B,Fx,F,l,o,era){fbox(B,F,l,o,0,.12,3.0,.12,0x3a3d42);if(era>=7)Fx.put('box',F.x+F.ax[0]*l+F.out[0]*o,F.y+3.0,F.z+F.ax[1]*l+F.out[1]*o,.5,.12,.5,0x7ff0ff,0,0,0);else Fx.put('box',F.x+F.ax[0]*l+F.out[0]*o-.12,F.y+2.9,F.z+F.ax[1]*l+F.out[1]*o,.3,.35,.3,era>=6?0xf4f1d8:0xffd980,0,0,0);}
function drawFacility(B,Fx,F,gr){const era=RN.era,pc=era>=7?0xdfe6ee:era>=6?0xaaa8a0:0xb8b2a6,edge=era>=7?0x7ff0ff:0xe9e1b0;
  const sgnal=(sgn)=>{const l=sgn*(F.len/2+4.5),o=-2.7;if(era<6){fbox(B,F,l,o,0,.12,3.6,.12,0x3a3d42);const dir=sgn;B.put('box',F.x+F.ax[0]*l+F.out[0]*o,F.y+3.3,F.z+F.ax[1]*l+F.out[1]*o,.1,.4,1.1,0xc83a2a,0,Math.atan2(F.ax[0],F.ax[1]),-.35);}
    else{fbox(B,F,l,o,0,.12,3.2,.12,0x3a3d42);fbox(B,F,l,o,3.0,.4,.9,.28,0x23262a);Fx.put('box',F.x+F.ax[0]*l+F.out[0]*o,F.y+3.65,F.z+F.ax[1]*l+F.out[1]*o,.22,.22,.3,era>=7?0x7ff0ff:0x33e066,0,0,0);}};
  if(F.k==='station'){fbox(B,F,0,-2.9,0,3.6,.5,23,pc);fbox(B,F,0,-1.15,.5,.34,.03,23,edge);fbox(B,F,0,-4.6,0,.3,.5,23,0x9a948a);
    for(const l of [-8,0,8])lamp(B,Fx,F,l,-3.9,era);
    if(era<6){for(const l of [-9,-3,3,9])fbox(B,F,l,-4.2,.5,.16,2.9,.16,0x3a3d42);fbox(B,F,0,-3.4,3.4,3.9,.16,21,0x3d4f5e);for(const l of [-6,6])fbox(B,F,l,-4.0,.5,.9,.5,2.4,0x6a5a48);}
    else if(era<7){fbox(B,F,0,-3.2,3.3,3.8,.14,22,0x77797a);for(const l of [-9,0,9])fbox(B,F,l,-4.5,.5,.14,2.8,.14,0xcfcfca);}
    else{fbox(B,F,0,-3.2,3.3,3.8,.12,22,0xeef3f6);Fx.put('box',F.x,F.y+3.4,F.z,.1,.06,22,0x7ff0ff,0,Math.atan2(F.ax[0],F.ax[1]),0);}
    sgnal(1);sgnal(-1);}
  else if(F.k==='halt'){fbox(B,F,0,-2.2,0,2.6,.45,12,pc);fbox(B,F,0,-.95,.45,.3,.03,12,edge);fbox(B,F,0,-3.0,.45,2.6,2.2,3.6,era>=6?0xcfcfca:0x7a5a3a);fbox(B,F,0,-3.0,2.65,3.1,.16,4.2,era>=6?0x77797a:0x4f5866);lamp(B,Fx,F,4.5,-2.9,era);lamp(B,Fx,F,-4.5,-2.9,era);}
  else if(F.k==='depot'){const w=F.what||'stone',base=era>=7?0xcfd6dc:era>=6?0x8a8f94:0x8a8478;
    fbox(B,F,0,-5.6,0,12.5,.14,25,base);fbox(B,F,0,.3,0,3.0,.14,F.len,0x7e776c);
    if(w==='stone'){// a gantry over the track with a hopper, rock piles and stacked blocks
      for(const l of [-2,2])for(const o of [-2.7,2.7])fbox(B,F,l,o,0,.36,5.6,.36,era>=7?0xd7dee4:0x4a5058);
      for(const o of [-2.7,2.7])fbox(B,F,0,o,5.6,.4,.5,4.8,0x4a5058);fbox(B,F,0,0,5.7,6.2,.4,.5,0x4a5058);
      fbox(B,F,0,0,3.4,2.6,2.0,3.2,era>=7?0xeef3f6:0x6a5d4c);fbox(B,F,0,0,2.9,.9,.6,1.2,0x2a2d31);
      fsph(B,F,-6,-6.5,0,3.0,2.0,2.6,0x7d776c,2);fsph(B,F,-1.5,-8,0,2.4,1.6,2.2,0x8f897d,2);fsph(B,F,7,-6,0,2.6,1.7,2.4,0x6f6a62,2);
      for(let k=0;k<5;k++)fbox(B,F,9+(k%2)*1.1,-3.2-((k/2)|0)*1.2,0,1.7,1.0,1.7,0xa59c8b,2);
      fbox(B,F,-9.5,-4.8,0,3.6,2.4,4.2,0x6a5a48);fbox(B,F,-9.5,-4.8,2.4,4.2,.16,4.8,0x4f5866);
      if(era>=6){fbox(B,F,5,-5.6,0,1.3,6,1.3,0xaab0b6);fbox(B,F,5,-3.6,6,2,.3,3.6,0xaab0b6);}}
    else if(w==='timber'){for(let r=0;r<3;r++)for(let k=0;k<4-r;k++)flog(B,F,-8+r*3.6,-3.5-k*.62-r*.1,.35+r*.55,.33,7.5,0x7a5634);
      for(let k=0;k<4;k++)for(let r=0;r<3-((k>1)?1:0);r++)flog(B,F,6+k*1.3,-3.2-r*.7,.35+((k%2)?.55:0),.32,6.5,0x8a6a40);
      fbox(B,F,-1,-9.5,0,8,3.4,5,0x7a5634);fbox(B,F,-1,-9.5,3.4,9,.2,5.8,era>=6?0x77797a:0x6e4c30);fbox(B,F,2.5,-3,0,.3,5.2,.3,0x4a5058);fbox(B,F,2.5,-1.2,5,.3,.3,4.2,0x4a5058);}
    else{const r=era>=7?0xeef3f6:era>=6?0xcfcfca:0xb89a52;for(const l of [-4,4]){fcyl(B,F,l,-6,0,1.9,6,r,12);B.cone(F.x+F.ax[0]*l+F.out[0]*-6,F.y+6,F.z+F.ax[1]*l+F.out[1]*-6,2.1,1.6,era>=6?0x77797a:0x6e4c30,12);}
      fbox(B,F,0,-2.2,3.4,1.4,1.6,10,0x6a6e74);fbox(B,F,0,-9.5,0,10,3,5,0x8a6a3a);fbox(B,F,0,-9.5,3,11,.2,5.8,0x6e4c30);
      if(w==='harbour'){for(let k=0;k<5;k++)fbox(B,F,-8+k*1.5,-3.6,0,1.2,1.0,1.2,[0x7a5634,0x4a6a7a,0x6a3a2a][k%3]);fbox(B,F,9,-3,0,.5,7,.5,0x3a3d42);fbox(B,F,8,-3,7,5,.4,.5,0x3a3d42);}}
    sgnal(1);if(F.what==='stone')for(const l of [-3,3])lamp(B,Fx,F,l,2.6,era);}
}

// ---------------------------------------------------------------- rolling stock by age: steam engines, diesel and electric trains, maglev capsules
// every car is built facing +z with its origin at the middle of the car, on top of the rail
function wheel(B,x,z,r,col){B.put('cyl:10:1',x+(x>0?.1:0),r,z,r,.12,r,col||0x1b1c1e,0,0,PI/2);}
function carGeo(kind,era,cargo,seed){const B=new Builder(()=>.5,0),Fx=new Builder(()=>.5,0),LD=new Builder(()=>.5,0);B.mt=0;let len=3.6,chim=null,load=null;
  if(era>=7){len=kind==='loco'?5.2:4.8;const col=kind==='wagon'?0xcfd6dc:0xeef3f6;
    B.sph(0,.95,0,.9,.72,len/2,col,1);B.box(0,.2,0,1.5,.3,len-.6,0x9aa6b2);
    if(kind==='wagon'){B.box(0,.5,0,1.7,1.1,len-.8,0xdfe6ee);LD.box(0,1.62,0,1.5,.3,len-1,0x7ff0ff);}
    else{B.box(0,1.0,0,1.82,.42,len-1.6,0x2a4a6a);if(kind==='loco'){B.sph(0,.95,len/2-.2,.7,.5,.6,0x2a4a6a,1);}}
    Fx.box(0,.42,0,1.86,.06,len-.7,0x7ff0ff);Fx.box(0,.42,0,.06,.06,len,0x7ff0ff);}
  else if(era>=6){
    if(kind==='loco'){len=5.4;B.box(0,.5,0,1.75,.15,5.4,0x2a2d31);B.box(0,.62,0,1.7,1.9,5.0,0xc9822a);B.box(0,.62,0,1.72,.5,5.02,0x2f3338);B.box(0,2.5,-.2,1.5,.5,3.6,0xb87420);B.box(0,2.4,1.9,1.4,.1,1.1,0x2a2d31);
      B.box(0,1.6,2.52,1.2,.8,.05,0x1f3a52);B.box(0,.4,2.7,1.7,.35,.2,0x3a3d42);Fx.box(.5,.95,2.54,.26,.26,.06,0xfff4c0);Fx.box(-.5,.95,2.54,.26,.26,.06,0xfff4c0);
      B.box(0,3.0,-.8,.12,.5,.12,0x4a4f55);B.box(0,3.5,-.8,.12,.08,1.6,0x4a4f55);B.box(0,3.5,-.8,1.3,.08,.12,0x4a4f55);// pantograph
      for(const z of [-1.6,1.6])for(const x of [-.82,.82])wheel(B,x,z,.4);}
    else if(kind==='coach'){len=4.6;B.box(0,.5,0,1.7,.15,4.6,0x2a2d31);B.box(0,.62,0,1.72,1.85,4.4,0xdfe6ea);B.box(0,.62,0,1.74,.45,4.42,0x2f5a8a);B.box(0,1.45,0,1.76,.6,4.1,0x2a3f55);B.box(0,2.5,0,1.5,.14,4.2,0xb8bdc2);for(const z of [-1.5,1.5])for(const x of [-.82,.82])wheel(B,x,z,.36);}
    else{len=3.8;if(cargo==='wood'){B.box(0,.5,0,1.7,.15,3.8,0x2a2d31);B.box(0,.66,0,1.7,.14,3.7,0x5a5048);for(const sx of [-.7,.7])for(const sz of [-1.6,1.6])B.box(sx,.8,sz,.1,1.1,.1,0x3a3d42);for(let k=0;k<4;k++)LD.put('cyl:7:1',(k%2?.3:-.3),.95+(k>1?.5:0),-1.7,.3,3.4,.3,0x8a6a40,PI/2,0,0);}
      else if(cargo==='food'){B.box(0,.5,0,1.7,.15,3.8,0x2a2d31);B.box(0,.62,0,1.7,1.5,3.6,0xcfcfca);B.box(0,2.1,0,1.5,.3,3.0,0xaaa8a0);}
      else if(cargo==='goods'){B.box(0,.5,0,1.7,.15,3.8,0x2a2d31);const cc=[0x2f5a8a,0xc9822a,0x4a7a4a][seed%3];B.box(0,.66,-.9,1.6,1.7,1.7,cc);B.box(0,.66,1.0,1.6,1.7,1.7,[0x7a2f22,0x6a6e74,0x2f5a8a][seed%3]);}
      else{B.box(0,.5,0,1.7,.15,3.8,0x2a2d31);B.box(0,.62,0,1.7,.95,3.7,0x5a4a3a);LD.box(0,1.5,0,1.5,.5,3.2,0x8f897d);}
      for(const z of [-1.3,1.3])for(const x of [-.82,.82])wheel(B,x,z,.36);}}
  else{// the steam age
    if(kind==='loco'){len=5.0;B.box(0,.45,0,1.5,.13,5.0,0x2a2d31);B.hcyl(0,1.45,.55,.66,3.2,0x24262a,'z',12);B.hcyl(0,1.45,2.2,.68,.5,0x16171a,'z',12);B.box(0,.56,-1.7,1.62,2.3,1.5,0x7a2f22);B.box(0,2.86,-1.7,1.9,.15,1.9,0x3a3d42);
      B.box(.82,1.3,-1.7,.05,.7,.7,0x16171a);B.box(-.82,1.3,-1.7,.05,.7,.7,0x16171a);B.cyl(0,2.1,1.9,.2,.9,0x1f2124,8);B.cone(0,2.95,1.9,.36,.3,0x1f2124,8);B.sph(0,2.1,.45,.4,.3,.4,0xb08d4a,1);B.sph(0,2.12,-.5,.3,.22,.3,0xb08d4a,1);
      B.box(0,.4,2.8,1.4,.4,.35,0x3a3d42);B.box(0,2.2,2.5,.3,.3,.2,0xf4e5a0);B.box(0,1.2,.5,1.74,.09,2.6,0xb08d4a);
      for(const z of [-1.3,-.15,1.0,2.0])for(const x of [-.8,.8])wheel(B,x,z,z>1.9?.3:.46);for(const x of [-.86,.86])B.box(x,.78,.45,.06,.1,3.0,0x6a6e74);
      chim={x:0,y:3.2,z:1.9};len=5.0;}
    else if(kind==='tender'){len=3.2;B.box(0,.45,0,1.5,.13,3.2,0x2a2d31);B.box(0,.58,0,1.5,1.0,2.9,0x24262a);B.sph(0,1.7,0,.7,.45,1.2,0x18181c,1);for(const z of [-.9,.9])for(const x of [-.8,.8])wheel(B,x,z,.38);}
    else if(kind==='coach'){len=4.0;B.box(0,.45,0,1.55,.13,4.0,0x2a2d31);B.box(0,.58,0,1.6,1.7,3.8,[0x7a2f22,0x2f4a6e,0x6e5a2f][seed%3]);B.box(0,1.2,0,1.62,.55,3.6,0xbcd4e0);B.box(0,2.3,0,1.7,.16,3.9,0x3a3d42);B.box(0,2.46,0,1.2,.1,3.4,0x4a4f55);for(const z of [-1.3,1.3])for(const x of [-.8,.8])wheel(B,x,z,.34);}
    else{len=3.6;if(cargo==='wood'){B.box(0,.45,0,1.6,.13,3.6,0x2a2d31);B.box(0,.62,0,1.6,.16,3.5,0x5a4a3a);for(const sx of [-.72,.72])for(const sz of [-1.5,1.5])B.box(sx,.78,sz,.08,1.0,.08,0x3a3d42);for(let k=0;k<5;k++)LD.put('cyl:7:1',[-.45,0,.45,-.22,.22][k],.9+(k>2?.5:0),-1.6,.3,3.2,.3,0x8a6a40,PI/2,0,0);}
      else if(cargo==='food'){B.box(0,.45,0,1.6,.13,3.6,0x2a2d31);B.box(0,.58,0,1.6,1.3,3.4,0xb89a52);B.box(0,1.88,0,1.3,.22,3.0,0x6e4c30);B.box(0,2.1,0,.5,.2,.5,0x4a4f55);}
      else if(cargo==='goods'){B.box(0,.45,0,1.6,.13,3.6,0x2a2d31);B.box(0,.58,0,1.6,1.7,3.4,[0x7a4a2a,0x5a4030,0x6a3a2a][seed%3]);B.box(0,2.28,0,1.7,.14,3.6,0x4a3a2a);}
      else{B.box(0,.45,0,1.6,.13,3.6,0x2a2d31);B.box(0,.58,0,1.6,.95,3.4,0x5a4a3a);B.box(0,.58,1.72,1.64,.95,.1,0x4a3a2c);B.box(0,.58,-1.72,1.64,.95,.1,0x4a3a2c);LD.sph(0,1.52,0,.74,.38,1.5,0x8f897d,1);LD.sph(.2,1.7,.4,.45,.3,.7,0x9c9486,1);}
      for(const z of [-1.2,1.2])for(const x of [-.8,.8])wheel(B,x,z,.34);}}
  return {B,Fx,LD,len,chim,kind};}
function carObj(kind,era,cargo,seed){const g=carGeo(kind,era,cargo,seed),grp=new THREE.Group();grp.rotation.order='YXZ';
  const m=g.B.mesh(matB);m.castShadow=true;m.receiveShadow=true;grp.add(m);
  if(g.Fx.p.length){const f=g.Fx.mesh(matFire,false);grp.add(f);}
  let load=null;if(g.LD.p.length){load=g.LD.mesh(matB);load.castShadow=true;load.visible=false;grp.add(load);}
  const o={obj:grp,len:g.len,load,kind,chim:g.chim,lift:era>=7?.5:0};grp.matrixAutoUpdate=true;return o;}
function makeTrain(svc,k){const era=RN.era,cars=[];const seed=(RN.uid*7+k*3)|0;
  const loco=()=>era>=7?'loco':'loco';
  if(svc.k==='pax'){const n=era>=7?3:era>=6?3:2;cars.push(carObj('loco',era,null,seed));if(era<6)cars.push(carObj('tender',era,null,seed));for(let i=0;i<n;i++)cars.push(carObj('coach',era,null,seed+i));}
  else{const n=era>=7?3:era>=6?4:3,cg=svc.cargo==='wood'||svc.cargo==='food'||svc.cargo==='goods'?svc.cargo:'stone';cars.push(carObj('loco',era,null,seed));if(era<6)cars.push(carObj('tender',era,null,seed));for(let i=0;i<n;i++)cars.push(carObj('wagon',era,cg,seed+i));}
  const gap=.4;let L=0;for(const c of cars){c.d=L+c.len/2;L+=c.len+gap;}L-=gap;
  const t={id:RN.uid++,svc:svc.id,kind:svc.k,cargo:svc.cargo,stops:svc.stops.slice(),si:0,sd:1,cars,Lst:L,hist:[],hi:0,p:0,v:0,state:'dwell',timer:0,waitT:0,load:null,smoke:0,
    cap:svc.k==='freight'?(cars.filter(c=>c.kind==='wagon').length*(era>=7?30:era>=6?20:12)):0,n:k,riders:[],trips:0};
  t.vmax=era>=7?24:era>=6?15:11;
  for(const c of cars)RN.grp.add(c.obj);return t;}

// ---------------------------------------------------------------- the dispatcher: schedules, single-track blocks, passing loops, dwell, loading
const RACC=2.6,RDEC=3.8,elLen=e=>Math.abs(e.b-e.a);
function mkEl(sg,dir,final,Lst){const a=dir>0?0:sg.len;let b=dir>0?sg.len:0;if(final)b=clamp(sg.len/2+dir*Lst/2,0,sg.len);return {sg,dir,a,b};}
function trainPt(t,d){let k=t.hi,q=t.p-d;while(q<0&&k>0){k--;q+=elLen(t.hist[k]);}const e=t.hist[k],sg=e.sg,s=e.a+e.dir*q,sc=clamp(s,0,sg.len),o=segAt(sg,sc),ex=(s-sc)*(e.dir>0?1:1);
  if(ex!==0){return [o[0]+o[3]*ex,o[1],o[2]+o[4]*ex];}return o;}
function railOcc(){const gr=RN.gr;if(!gr)return;for(const sg of gr.segs)sg.occ.length=0;for(const sc of gr.secs)sc.occ.length=0;
  for(const t of RN.trains){const add=sg=>{if(!sg.occ.includes(t))sg.occ.push(t);if(sg.sec&&!sg.sec.occ.includes(t))sg.sec.occ.push(t);};let rem=t.Lst-t.p+1,k=t.hi-1;add(t.hist[t.hi].sg);while(rem>0&&k>=0){add(t.hist[k].sg);rem-=elLen(t.hist[k]);k--;}}}
function segFree(t,sg){if(sg.kind==='line'&&sg.sec){for(const o of sg.sec.occ)if(o!==t)return false;return true;}for(const o of sg.occ)if(o!==t)return false;return true;}
// may the train roll into hist[idx]? (a facility's second track is used when the first is taken)
function trainFree(t,idx,commit){const e=t.hist[idx];if(t.waitT>25)return true;let sg=e.sg;
  if(!segFree(t,sg)){const tw=sg.twin;if(tw&&segFree(t,tw)){if(commit){const fin=idx===t.hist.length-1;t.hist[idx]=mkEl(tw,e.dir,fin,t.Lst);sg=tw;}else return true;}else return false;}
  if(commit){if(!sg.occ.includes(t))sg.occ.push(t);if(sg.sec&&!sg.sec.occ.includes(t))sg.sec.occ.push(t);}return true;}
function trainDepart(t){const gr=RN.gr;if(!gr)return;let ni=t.si+t.sd;if(ni<0||ni>=t.stops.length){t.sd=-t.sd;ni=t.si+t.sd;}
  const fx=gr.fx.get(t.stops[ni]);if(!fx||!t.hist.length){t.timer=6;return;}
  // the station at the far end must have a free track for us on arrival (or the trains would block each other on the single line)
  {const used=[fx.main,fx.side].filter(Boolean).filter(sg=>sg.occ.some(o=>o!==t)).length+(fx.resv||[]).filter(o=>o!==t).length,cap=fx.side?2:1;
    if(used>=cap&&(t.depWait=(t.depWait||0)+1)<=12){t.timer=2.5;return;}t.depWait=0;}
  const e=t.hist[t.hi],sgc=e.sg,dir=e.dir;
  const path=railRoute(gr,[{sg:sgc,dir,cost:0},{sg:sgc,dir:-dir,cost:5}],(sg)=>sg===fx.main||sg===fx.side);
  if(!path||path.length<2){t.timer=8;return;}
  if(path[0].dir!==dir){const frontS=e.a+e.dir*t.p;t.hist=[{sg:sgc,dir:-dir,a:frontS,b:-dir>0?sgc.len:0}];t.hi=0;t.p=t.Lst;}
  else{e.b=dir>0?sgc.len:0;}
  const keep=t.hist.slice(Math.max(0,t.hi-5),t.hi+1);t.hist=keep;t.hi=keep.length-1;
  for(let k=1;k<path.length;k++)t.hist.push(mkEl(path[k].sg,path[k].dir,k===path.length-1,t.Lst));
  t.si=ni;t.state='run';t.waitT=0;(fx.resv=fx.resv||[]).push(t);t.resv=fx;if(RN.near(t)&&typeof sfx==='function')try{sfx('train',.5);}catch(e2){}}
function trainStep(t,dt){
  if(t.state==='dwell'){t.timer-=dt;if(t.state==='dwell'&&t.timer>0)return;if(t.timer<=0)trainDepart(t);if(t.state==='dwell')return;}
  const H=t.hist;let el=H[t.hi],last=t.hi===H.length-1;let remEl=elLen(el)-t.p,rem=remEl;for(let k=t.hi+1;k<H.length;k++)rem+=elLen(H[k]);
  let stopAt=rem,blocked=false;if(!last&&!trainFree(t,t.hi+1,false)){stopAt=remEl;blocked=true;}
  if(blocked&&t.v<.2)t.waitT+=dt;else if(!blocked)t.waitT=0;
  let vt=Math.min(t.vmax,Math.sqrt(2*RDEC*Math.max(0,stopAt-.03)));const k0=el.sg.kind;if(k0==='fmain'||k0==='fside'||k0==='lside')vt=Math.min(vt,5.5);else if(el.sg.pts.length&&el.sg.len<60)vt=Math.min(vt,t.vmax);
  t.v+=clamp(vt-t.v,-RDEC*dt,RACC*dt);if(t.v<0)t.v=0;
  let dist=t.v*dt;
  while(dist>0){remEl=elLen(el)-t.p;if(dist<remEl){t.p+=dist;dist=0;break;}dist-=remEl;t.p=elLen(el);
    if(t.hi===H.length-1){trainArrive(t);return;}
    if(trainFree(t,t.hi+1,true)){t.hi++;t.p=0;el=H[t.hi];t.waitT=0;}else{t.v=0;return;}}
  if(t.hi===H.length-1&&elLen(el)-t.p<.07&&t.v<1.2){t.p=elLen(el);trainArrive(t);}}
function trainArrive(t){t.v=0;t.state='dwell';const fx=RN.gr.fx.get(t.stops[t.si]);if(t.resv){t.resv.resv=(t.resv.resv||[]).filter(o=>o!==t);t.resv=null;}t.timer=t.kind==='freight'?7:5;t.waitT=0;t.trips++;if(RN.log)RN.log.push({t:t.id,stop:t.stops[t.si],f:t.kind});if(!fx)return;trainStopActions(t,fx.F);}
function setLoad(t,on){for(const c of t.cars)if(c.load)c.load.visible=!!on;}
function trainStopActions(t,F){
  if(t.kind==='freight'){
    if(F.k==='depot'){const amt=Math.min(t.cap,Math.floor(F.stock||0));F.stock=Math.max(0,(F.stock||0)-amt);t.load=amt>0?{res:F.cargo||'stone',amt}:null;setLoad(t,amt>0);t.timer=5+Math.min(6,amt/10);}
    else if(F.k==='station'){if(t.load&&t.load.amt>0){const ld=t.load;t.load=null;withSettlement(F.t,()=>{const r=ld.res;if(G[r]!=null){G[r]+=ld.amt;if(G.prod&&G.prod[r]!=null)G.prod[r]+=ld.amt;}const rs2=rS();rs2.frt+=ld.amt;rs2.runs++;
        if(!rs2.first){rs2.first=1;const nm={stone:'stone',wood:'timber',food:'grain'}[r]||'goods';chron(`The first freight train rolled in with ${ld.amt} loads of ${nm}. The carts were left at home.`,true);}});setLoad(t,false);t.timer=6;}
      else if(t.cargo==='goods'){setLoad(t,t.si===0);}}
    else if(t.cargo==='goods'&&F.k==='station'){setLoad(t,!t.cars.some(c=>c.load&&c.load.visible));}}
  else{withSettlement(F.t,()=>{const rs2=rS();const n=3+Math.floor(rnd()*14);rs2.pax+=n;rs2.paxDay=(rs2.paxDay||0)+1;});if(F.k==='station'&&RN.stopHook)RN.stopHook(t,F);}
  if(F.k==='station'||F.k==='depot'){RN.chuff=(RN.chuff||0)+1;}}
RN.near=t=>{const c=t.cars[0].obj.position;return Math.hypot(c.x-cam.tx,c.z-cam.tz)<160;};
function trainShow(t,dt){for(const c of t.cars){const A=trainPt(t,c.d-c.len/2),Bp=trainPt(t,c.d+c.len/2),mx=(A[0]+Bp[0])/2,my=(A[1]+Bp[1])/2,mz=(A[2]+Bp[2])/2;
    c.obj.position.set(mx,my+.37+c.lift,mz);c.obj.rotation.set(-Math.atan2(A[1]-Bp[1],c.len),Math.atan2(A[0]-Bp[0],A[2]-Bp[2]),0);}
  const lc=t.cars[0];if(RN.era<6&&lc.chim&&RN.near(t)){t.smoke+=dt;if(t.smoke>(t.v>.5?.2:.9)){t.smoke=0;const y=lc.obj.rotation.y,p=lc.obj.position,cz=lc.chim.z,cx=p.x+Math.sin(y)*cz,cz2=p.z+Math.cos(y)*cz;
      spawn(cx,p.y+lc.chim.y,cz2,(rnd()-.5)*.3+Math.sin(y)*-.4*t.v/6,1.3+rnd()*.5,(rnd()-.5)*.3+Math.cos(y)*-.4*t.v/6,2.6,1.1+t.v*.05,.84,.84,.86,0);}}}
function railStep(dt){railOcc();const n=RN.trains.length;RN.rr=((RN.rr||0)+1)%Math.max(1,n);for(let k=0;k<n;k++){const t=RN.trains[(k+RN.rr)%n];try{trainStep(t,dt);}catch(e){console.error('train',e);t.state='dwell';t.timer=30;}}}
function placeAtStop(t,fx){let sg=fx.main;if(fx.main.occ.length&&fx.side&&!fx.side.occ.length)sg=fx.side;const dir=1,mid=sg.len/2;t.hist=[{sg,dir,a:mid-t.Lst/2,b:sg.len}];t.hi=0;t.p=t.Lst;t.v=0;sg.occ.push(t);}
function railRelease(){for(const t of RN.trains)for(const r of t.riders||[]){const v=r.v;if(v&&v.mission===r.m){v.hidden=false;v.timer=.2;v.path=null;r.m.rail=null;r.m.noRail=1;const T=t.cars[0].obj.position;v.x=T.x;v.z=T.z;}}
  for(const w of RN.waiting||[]){if(w.v&&w.v.mission===w.m){w.m.rail=null;w.m.noRail=1;}}RN.waiting=[];}
function railSpawn(){railRelease();for(const t of RN.trains)for(const c of t.cars){RN.grp.remove(c.obj);c.obj.traverse(m=>{if(m.geometry)m.geometry.dispose();});}RN.trains=[];const gr=RN.gr;if(!gr)return;let k=0;
  for(const svc of gr.svcs){for(let n=0;n<svc.n;n++){const t=makeTrain(svc,k++),si=n%2===0?0:svc.stops.length-1;t.si=si;t.sd=si===0?1:-1;const fx=gr.fx.get(svc.stops[si]);
      if(!fx){for(const c of t.cars)RN.grp.remove(c.obj);continue;}placeAtStop(t,fx);t.timer=2+n*9+(k%3)*5;RN.trains.push(t);railOcc();trainStopActions(t,fx.F);}}
  for(const t of RN.trains)trainShow(t,0);}

// ---------------------------------------------------------------- needs: when do the folk ask for a railway?
function farDist(b){const c=G.center;return Math.hypot(b.x-c.x,b.z-c.z);}
function dirOfTo(x,z){return dirWord(x,z);}
function haulText(d){const h=walkHours(d*1.25);return h>=12?`a full day's haul`:`${Math.max(2,Math.round(h))} hours of hauling`;}
// returns the petition (for tfFile) or null; runs once every few days per people, inside that people's context
function railPetition(){if(window.RAILOFF)return null;if(MODE!=='god'||G.phase!=='play'||G.menu||!G.center||G.center.build)return null;const e=G.era||0;if(e<5)return null;const rs=rS(),d=dayN();if((rs.cd||0)>d)return null;rs.cd=d+2;if(!rs.nx)rs.nx={};const due=k=>(rs.nx[k]||0)<=d,later=(k,n)=>{rs.nx[k]=d+n;};
  const p=popN();if(p<60)return null;const own=TOWNS.cur,c=G.center;
  if(!RN.gr)try{RN.gr=railGraph();}catch(er){}
  const T=tfEnsure();const has=what=>railAll().some(L=>L.own===own&&[L.a,L.b].some(F=>F&&F.k==='depot'&&F.what===what));
  const out=(plan,txt,how,need,extra)=>{const cost=railCost(plan.len,(plan.fresh?1:0)+(plan.spB?1:0));
    return Object.assign({x:plan.Fb.x,z:plan.Fb.z,a:[plan.F.x,plan.F.z],b:[plan.Fb.x,plan.Fb.z],txt,how:how.replace('{W}',cost[0]).replace('{S}',cost[1]),short:need==='link'?'lay the railway between the towns':'lay the railway',cost,rp:Object.assign({need,len:plan.len,sx:plan.Fb.x,sz:plan.Fb.z,sa:plan.fresh?[plan.fresh.Tx,plan.fresh.Tz]:null,sb:plan.spB?[plan.spB.Tx,plan.spB.Tz]:null},extra||{})},{});};
  const costTxt=`it costs {W} wood and {S} stone`;
  // (b) another people across the valley
  for(let j=0;j<TOWNS.list.length;j++){if(j===own||TOWNS.list[j].dead)continue;const cj=sGet(j,'center'),pj=(sGet(j,'vill')||[]).filter(v=>!v.leaving&&!v.arriving).length;if(!cj||cj.build||pj<24)continue;
    const dist=Math.hypot(cj.x-c.x,cj.z-c.z);if(dist<urbanR()+withSettlement(j,urbanR)+30)continue;if(railLinked(own,j))continue;if(((sGet(j,'tf')||{}).pet||[]).some(q=>q.k==='rail'))continue;
    if(!due('link'+j))continue;const plan=railScout(own,'link',j);if(!plan.ok){later('link'+j,12);continue;}
    return out(plan,`The folk ask leave to lay a railway between ${G.town} and ${sName(j)}, ${Math.round(dist)} paces across the valley. A journey there takes ${haulText(dist)} on foot and by cart; with a station at the edge of each town, grain, timber and travellers could cross in an afternoon.`,
      `Allowed: ${plan.len} paces of track are cut and filled (bridged and tunnelled where the land demands) and a station is raised at the edge of each town, so the line skirts the streets; ${costTxt}. Trade caravans ride the train, and newcomers come.`,'link',{j});}
  // (a) a distant resource: stone in the hills, timber in the far forest, far farms, the harbour
  const wants=[];
  if(!has('stone')&&p>=90&&(G.stone<100+p*.9))wants.push('stone');
  if(!has('timber')&&p>=110&&G.wood<80+p*.6&&treesNear(c.x,c.z,42)<140)wants.push('timber');
  const Rb=urbanR();if(!has('harbour')&&p>=120&&buildings.some(b=>b.type==='dock'&&!b.build&&farDist(b)>Rb+26))wants.push('harbour');
  if(!has('grain')&&p>=150&&buildings.filter(b=>b.type==='farm'&&!b.build&&farDist(b)>Rb+26).length>=3)wants.push('grain');
  for(const need of wants){if(!due(need))continue;const sites=depotSpots(need);let found=false;for(const s of sites.slice(0,2)){const plan=railScout(own,need,s);if(!plan.ok)continue;found=true;
      const where=dirOfTo(s.x,s.z),dist=Math.round(Math.hypot(s.x-c.x,s.z-c.z));
      const what={stone:`the stone must come from the hills ${dist} paces ${where} of ${G.town}, and the carts take ${haulText(dist)}`,timber:`the great forest lies ${dist} paces ${where} of ${G.town} and the sawyers wait ${haulText(dist)} for every load`,
        harbour:`the goods landed at the harbour ${where} of ${G.town} must be hauled ${dist} paces`,grain:`the far farms ${where} of ${G.town} send grain ${dist} paces by cart`}[need];
      const tail={stone:'Stone will come down from the quarry by train.',timber:'Timber will come down from the forest by train.',harbour:'Goods from the harbour will come by train.',grain:'The harvest will come in by train.'}[need];
      return out(plan,`Our ${need==='stone'?'stone':need==='timber'?'timber':need==='grain'?'grain':'harbour goods'} is far from home: ${what}. The folk ask leave to lay a railway from a station at the edge of ${G.town} to a depot at the works, skirting the town.`,
        `Allowed: ${plan.len} paces of track are cut and filled (bridged and tunnelled where the land demands), a station is raised at the edge of the town and a depot at the works; ${costTxt}. ${tail}`,need,{});}
    if(!found)later(need,14);}
  return null;}
// ---------------------------------------------------------------- economy hooks, linking, daily upkeep
function railDepotPut(q,amt){// stone hewn at a far quarry goes into the depot beside it, to wait for the train
  for(const L of railLines())for(const F of [L.a,L.b])if(F&&F.k==='depot'&&F.qid===q.id){F.stock=(F.stock||0)+amt;return true;}return false;}
function railLinked(a,b){if(!RN.link)return false;return !!RN.link[Math.min(a,b)+'-'+Math.max(a,b)];}
function railCap(a,b,def){return railLinked(a,b)?def*2:def;}
function railTravel(){const gr=RN.gr;if(!gr)return 0;let n=0;for(const s of gr.svcs)if(s.k==='pax'&&s.stops.some(k=>{const f=gr.fx.get(k);return f&&f.F.t===TOWNS.cur;}))n++;return Math.min(3,n);}
function railHoldStation(){return !window.RAILOFF&&(G.era||0)>=5&&popN()<230&&!stationOf(TOWNS.cur)&&(rS().fail||0)<3;}
function railEraNow(){let e=0;TOWNS.list.forEach((s,i)=>{if(s.dead)return;if(railAll().some(L=>L.own===i))e=Math.max(e,sGet(i,'era')||0);});
  if(MODE==='sandbox'){let a=0;try{a=typeof sbStats==='function'?sbStats().age||0:0;}catch(er){}e=Math.max(e,a);}return clamp(Math.max(5,e),5,7);}
function railDaily(){const rs=rS();
  for(const L of railAll())for(const F of [L.a,L.b])if(F&&F.k==='station'&&F.t===TOWNS.cur&&F.bid&&!bById(F.bid)){const nb=buildings.find(q=>q.type==='station'&&Math.hypot(q.x-(F.x-F.out[0]*RC.TZ),q.z-(F.z-F.out[1]*RC.TZ))<7);F.bid=nb?nb.id:0;}
  const seen=new Set();for(const L of railLines()){if(L.own!==TOWNS.cur)continue;for(const F of [L.a,L.b])if(F&&F.k==='depot'&&F.virt&&!F.qid){const k=fkey(F);if(seen.has(k))continue;seen.add(k);F.stock=Math.min(240,(F.stock||0)+(F.rate||1)*24*(1+Math.max(0,(G.era||5)-5)*.3));}}
  // attach far quarries to depots beside them
  for(const q of buildings)if(q.type==='quarry'&&!q.build)for(const L of railLines())for(const F of [L.a,L.b])if(F&&F.k==='depot'&&!F.qid&&F.cargo==='stone'&&Math.hypot(F.x-q.x,F.z-q.z)<22){F.qid=q.id;F.virt=0;q.rdep=1;}
  if(rs.paxDay>=2&&typeof arriveFamily==='function'&&G.center&&!G.center.build&&G.hap>=50&&typeof bedsFree==='function'&&bedsFree()>=3&&rnd()<.3)arriveFamily(2);rs.paxDay=0;
  const e=railEraNow();if(e!==RN.era){const was=RN.era;RN.era=e;RN.dirty=true;RN.tD=1;if(e>was&&railAll().some(L=>L.own===TOWNS.cur))chron(e>=7?`The old railway was rebuilt as a gleaming maglev guideway; the trains no longer touch the ground.`:`The railway was electrified and the steam engines were retired.`,true);}
  if(RN.dirty&&!RN.gr)RN.tD=1;}
function railPaint(L){if(!L.ys)return;const pts=L.pts;const paint=(x,z,r)=>{const i0=Math.floor(x-r-1+HALF),i1=Math.ceil(x+r+1+HALF),j0=Math.floor(z-r-1+HALF),j1=Math.ceil(z+r+1+HALF);
    for(let j=Math.max(0,j0);j<=Math.min(N,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(N,i1);i++){if(Math.hypot(i-HALF-x,j-HALF-z)<r){const k=j*S+i;if(W[k]<.1)ROADT[k]=3;}}};
  for(let i=0;i<pts.length;i++){const s=i*2;if(inR(L.br,s)||inR(L.tn,s))continue;paint(pts[i][0],pts[i][1],1.7);}
  for(const F of [L.a,L.b]){if(!F||F.k==='junction'||F.k==='buffer')continue;for(let l=-F.len/2;l<=F.len/2;l+=2){paint(F.x+F.ax[0]*l,F.z+F.ax[1]*l,1.7);if(F.k!=='halt')paint(F.x+F.ax[0]*l+F.out[0]*RC.SIDE,F.z+F.ax[1]*l+F.out[1]*RC.SIDE,1.6);}}}
function railBuildHash(){const h=new Map();if(RN.gr)for(const sg of RN.gr.segs){const big=sg.kind==='fmain'||sg.kind==='fside';for(let s=0;s<=sg.len;s+=2.5){const q=segAt(sg,s),k=Math.floor(q[0]/8)+','+Math.floor(q[2]/8);let a=h.get(k);if(!a)h.set(k,a=[]);a.push(q[0],q[2],big?5.4:2.6);}}RN.hash=h;}
function railHit(x,z,r){if(!RN.hash||!RN.hash.size)return false;const cx=Math.floor(x/8),cz=Math.floor(z/8);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=RN.hash.get((cx+i)+','+(cz+j));if(!a)continue;for(let k=0;k<a.length;k+=3)if(Math.hypot(a[k]-x,a[k+1]-z)<a[k+2]+r)return true;}return false;}
function railSyncAll(){railRebuildGraph();try{railMeshBuild();}catch(e){console.error('rail mesh',e);}try{railSpawn();}catch(e){console.error('rail spawn',e);}}
function railFrame(dt){if(MODE!=='god'&&MODE!=='sandbox')return;
  if(RN.dirty){RN.tD+=dt;if(RN.tD>.5||!RN.mesh){RN.tD=0;RN.dirty=false;railSyncAll();}}
  if(!RN.trains.length||PAUSED||G.paused)return;const ts=clamp(G.speed||1,1,4);dt=Math.min(dt,.1)*ts;let rest=dt;while(rest>1e-4){const h=Math.min(rest,.05);railStep(h);rest-=h;}
  for(const t of RN.trains)trainShow(t,dt);}
function railTick(sec){let r=sec;while(r>1e-4){const h=Math.min(r,.05);railStep(h);r-=h;}for(const t of RN.trains)trainShow(t,sec);}
function railReload(){railMigrate();RN.dirty=true;RN.tD=1;railRebuildGraph();}
function railReset(){railRelease();railDispose();for(const t of RN.trains)for(const c of t.cars)RN.grp.remove(c.obj);RN.trains=[];RN.gr=null;RN.hash=null;RN.link={};RN.dirty=false;}
function railNetwork(){const gr=RN.gr;return {era:RN.era,lines:railLines().map(L=>({id:L.id,own:L.own,len:L.len,a:L.a&&L.a.k,b:L.b&&L.b.k,br:L.br.length,tn:L.tn.length,lx:(L.lx||[]).length,lp:(L.lp||[]).length})),
  facs:gr?[...gr.fx.values()].map(f=>({k:f.F.k,t:f.F.t,x:Math.round(f.F.x),z:Math.round(f.F.z),stock:Math.round(f.F.stock||0),cargo:f.F.cargo,bid:f.F.bid})):[],svcs:gr?gr.svcs.map(s=>({id:s.id,k:s.k,cargo:s.cargo,n:s.n})):[],
  trains:RN.trains.map(t=>({id:t.id,kind:t.kind,cargo:t.cargo,state:t.state,v:+t.v.toFixed(1),si:t.si,stops:t.stops,load:t.load,x:Math.round(t.cars[0].obj.position.x),z:Math.round(t.cars[0].obj.position.z),trips:t.trips}))};}
// ---------------------------------------------------------------- trade missions ride the train between the towns' stations
RN.waiting=[];
function mDst(m){return m.phase==='out'?m.to:m.from;}
function railBoard(v,m,src,dst){m.rail='wait';m.rt=G.t;const gr=RN.gr;
  const tr=RN.trains.find(t=>t.kind==='pax'&&t.state==='dwell'&&gr&&gr.fx.get(t.stops[t.si])&&gr.fx.get(t.stops[t.si]).F.t===src&&t.stops.some(k=>{const f=gr.fx.get(k);return f&&f.F.k==='station'&&f.F.t===dst;}));
  if(tr)return rideOn(tr,v,m,dst);RN.waiting.push({v,m,src,dst});wait(v,1.2,'idle',false);}
function rideOn(t,v,m,dst){m.rail='ride';t.riders.push({v,m,dst});wait(v,9999,'idle',true);setThought(v,'On the train.');}
function railAlight(r,F){const v=r.v,m=r.m;if(!v||v._gone||!v.mission||v.mission!==m)return;const ox=F.out[0],oz=F.out[1];v.x=F.x-ox*3.2+F.ax[0]*(rnd()-.5)*8;v.z=F.z-oz*3.2+F.ax[1]*(rnd()-.5)*8;v.hidden=false;v.path=null;v.timer=.3;m.rail=null;
  const out=m.phase==='out';if(out)withSettlement(m.from,()=>tradeArrive(v));else withSettlement(m.from,()=>tradeHome(v));}
RN.stopHook=(t,F)=>{for(const r of t.riders.slice())if(r.dst===F.t){t.riders.splice(t.riders.indexOf(r),1);railAlight(r,F);}
  const gr=RN.gr;for(const w of RN.waiting.slice()){if(w.src!==F.t)continue;if(t.stops.some(k=>{const f=gr.fx.get(k);return f&&f.F.k==='station'&&f.F.t===w.dst;})){RN.waiting.splice(RN.waiting.indexOf(w),1);rideOn(t,w.v,w.m,w.dst);}}};
function linkStation(src,dst){const gr=RN.gr;if(!gr)return null;for(const s of gr.svcs){if(s.k!=='pax')continue;const fs=s.stops.map(k=>gr.fx.get(k)).filter(f=>f&&f.F.k==='station'),a=fs.find(f=>f.F.t===src),b=fs.find(f=>f.F.t===dst);if(a&&b)return a.F;}return null;}
function railMission(v,m){const src=m.phase==='out'?m.from:m.to,dst=m.phase==='out'?m.to:m.from;
  if(m.rail==='ride'){wait(v,1.5,'idle',true);return true;}
  if(m.rail==='wait'){if(G.t-m.rt>30){m.rail=null;m.noRail=1;RN.waiting=RN.waiting.filter(w=>w.v!==v);return false;}wait(v,1.5,'idle',false);return true;}
  if(m.rail==='walk'){if(G.t-m.rtw>16){m.rail=null;m.noRail=1;return false;}wait(v,1,'idle');return true;}
  if(m.noRail||!railLinked(src,dst))return false;const Fs=linkStation(src,dst);if(!Fs)return false;
  const px=Fs.x-Fs.out[0]*3.2+Fs.ax[0]*(rnd()-.5)*8,pz=Fs.z-Fs.out[1]*3.2+Fs.ax[1]*(rnd()-.5)*8;m.rail='walk';m.rtw=G.t;setThought(v,`Off by train to ${sName(dst)}.`);
  goTo(v,px,pz,vv=>{if(!vv.mission||vv.mission!==m){return;}railBoard(vv,m,src,dst);});return true;}
// highways take the same careful route: round the town's edge, over narrow water, along gentle ground
function railRouteHW(a,b){const l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<20)return null;const u=[(b[0]-a[0])/l,(b[1]-a[1])/l];let r=null;try{r=railTrace([a[0],a[1]],u,[b[0],b[1]],[-u[0],-u[1]],{});}catch(e){console.error('hw route',e);}return r?r.pts.map(p=>[p[0],p[1]]):null;}
RN.dbgTrains=()=>RN.trains.map(t=>{const e=t.hist[t.hi];return {id:t.id,kind:t.kind,cargo:t.cargo,state:t.state,v:+t.v.toFixed(2),timer:+t.timer.toFixed(1),waitT:+t.waitT.toFixed(1),si:t.si,sd:t.sd,hi:t.hi,nh:t.hist.length,p:+t.p.toFixed(1),seg:e.sg.id+':'+e.sg.kind+':'+Math.round(e.sg.len),dir:e.dir,stops:t.stops,secOcc:e.sg.sec?e.sg.sec.occ.map(o=>o.id):null,segOcc:e.sg.occ.map(o=>o.id)};});
RN.dbg={depotRecord,railJoin,linesReach,railBuildPlan,stationSpot,urbanR,railTrace,railCosts,railProfile,railGraph,depotSpots,railScout,portPos,RC,railAStar,railGrade,lyIgn,stationOf,pickPort,fkey};
// for the other systems (routines, overlays, culture): where the stations are and which trains are about
function railStations(t){const o=[];for(const L of railAll())for(const F of [L.a,L.b])if(F&&F.k==='station'&&(t==null||F.t===t)&&!o.some(q=>q.x===F.x&&q.z===F.z))o.push({x:F.x,z:F.z,ax:F.ax,out:F.out,t:F.t,bid:F.bid,name:F.nm,platform:[F.x-F.out[0]*2.9,F.z-F.out[1]*2.9]});return o;}
function railTrains(){return RN.trains.map(t=>({id:t.id,kind:t.kind,cargo:t.cargo,state:t.state,speed:t.v,x:t.cars[0].obj.position.x,z:t.cars[0].obj.position.z}));}
// the game must never stop because of the railway: every entry point is guarded
const safe=(f,d)=>function(){try{return f.apply(this,arguments);}catch(e){console.error('rail: '+f.name,e);return d;}};
Object.assign(window,{railBuildLine:safe(railBuildLine,false),railPetition:safe(railPetition,null),railExecute:safe(railExecute,false),railPaint:safe(railPaint),railDaily:safe(railDaily),railFrame:safe(railFrame),railReload:safe(railReload),railReset:safe(railReset),
  railLinked:safe(railLinked,false),railTravel:safe(railTravel,0),railCap:safe(railCap,70),railDepotPut:safe(railDepotPut,false),railHit:safe(railHit,false),railHoldStation:safe(railHoldStation,false),railTick:safe(railTick),railNetwork,railStations:safe(railStations,[]),railTrains:safe(railTrains,[]),railMigrate:safe(railMigrate,0),
  railChanged:safe(railChanged),railRouteHW:safe(railRouteHW,null),railScout,railSyncAll:safe(railSyncAll),RAIL:RN,railMission:safe(railMission,false)});
}
