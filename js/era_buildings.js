'use strict';
// ================================================================ buildings of the machine ages
// Houses climb in place: level 4 brick tenement (Industrial), 5 concrete apartment block (Modern), 6 arcology spire (Futuristic).
const eraNow=()=>G.era||0;
const BRICK=[0x9a4a3a,0xa85a42,0x8a4030,0x8f5a44,0x7d3a2e],CONC=[0xcfcfca,0xbfc4c8,0xd6d3cb,0xb9bcb8],GLASS=0xffffff;
function windowRows(K,w,d,y0,sh,n,wh,col,glassW){const {B,G}=K;for(let s=0;s<n;s++){const yy=y0+s*sh+(sh-wh)/2;
  for(const f of [1,-1]){const nw=Math.max(2,Math.floor(w/1.15));for(let i=0;i<nw;i++){const x=-w/2+(i+.5)*w/nw;B.box(x,yy-.06,f*(d/2+.01),glassW+.14,wh+.12,.05,col);G.box(x,yy,f*(d/2+.04),glassW,wh,.05,GLASS);}}
  for(const f of [1,-1]){const nd=Math.max(1,Math.floor(d/1.3));for(let i=0;i<nd;i++){const z=-d/2+(i+.5)*d/nd;B.box(f*(w/2+.01),yy-.06,z,.05,wh+.12,glassW+.14,col);G.box(f*(w/2+.04),yy,z,.05,wh,glassW,GLASS);}}}}
function glazeFace(K,axis,sgn,w,y,h,off,mull,col,glass){const {B,G,rng}=K;const n=Math.max(2,Math.floor(w/1.0)),cw=w/n;
  if(axis==='z')B.box(0,y,sgn*off,w,h,.06,glass);else B.box(sgn*off,y,0,.06,h,w,glass);
  for(let i=0;i<=n;i++){const t=-w/2+i*cw;if(axis==='z')B.box(t,y,sgn*(off+.02),.09,h,.07,mull);else B.box(sgn*(off+.02),y,t,.07,h,.09,mull);}
  for(let i=0;i<n;i++){if(rng()<.35)continue;const t=-w/2+(i+.5)*cw;if(axis==='z')G.box(t,y+h*.25,sgn*(off+.05),cw*.55,h*.5,.04,GLASS);else G.box(sgn*(off+.05),y+h*.25,t,.04,h*.5,cw*.55,GLASS);}}
function eraHouse(b,c,K,lvl){
  const {B,G,F,rng}=K,T=K.traits;const w=b.w*(lvl>=5?1.2:1.08),d=b.d*(lvl>=5?1.25:1.12),hw=w/2,hd=d/2;
  const [gMin,gMax]=K.rect(hw+.3,hd+.3);const base=gMax+.15;let name,st,top;
  B.box(0,gMin-.6,0,w+.3,base-gMin+.6,d+.3,0x6f6a62);
  if(lvl===4){name='Brick Tenement';st=4+(rng()<.4?1:0);const SH=2.3,wall=K.pick(BRICK);
    B.box(0,base,0,w,st*SH,d,wall);for(let s=1;s<=st;s++)B.box(0,base+s*SH-.1,0,w+.18,.14,d+.18,0xb8aa94);
    windowRows(K,w,d,base+.2,SH,st,1.15,0x3a2e26,.5);
    const dz=hd+.02;B.box(.0,base,dz,.9,1.8,.08,0x4a2f1c);B.box(0,base+1.8,dz+.15,1.3,.1,.5,0x6b655b);
    top=base+st*SH;B.box(0,top,0,w+.3,.22,d+.3,0x5a5750);
    for(const f of [-1,1]){const cx=f*(hw-.45),cz=(rng()-.5)*.8;B.box(cx,top+.2,cz,.6,1.7,.6,0x7d3a2e);B.box(cx,top+1.9,cz,.74,.14,.74,0x3a3d42);for(let i=0;i<2;i++)B.cyl(cx+(i-.5)*.26,top+2.04,cz,.1,.35,0x8a4a3a,6);K.smoke(cx,top+2.5,cz,1.1,1);}
    T.push(`${st} storeys of soot-dark brick`,'Chimney stacks on the roof','Many families under one roof');b._st=st;b._cap=10;}
  else if(lvl===5){name='Apartment Block';st=7+(rng()<.5?1:0);const SH=2.9,wall=K.pick(CONC);
    B.box(0,base,0,w,st*SH,d,wall);
    for(let s=0;s<st;s++){const y=base+s*SH;B.box(0,y+SH-.2,0,w+.34,.2,d+.34,0x8f9190);
      for(const f of [1,-1]){glazeFace(K,'z',f,w*.9,y+.45,1.75,hd+.01,wall,0x7aa6c0,0x7aa6c0);glazeFace(K,'x',f,d*.9,y+.45,1.75,hw+.01,wall,0x7aa6c0,0x7aa6c0);}
      if(s>0&&s%2===1){B.box(0,y,hd+.35,w*.5,.12,.7,0xa8aaa6);B.box(0,y+.12,hd+.7,w*.5,.7,.05,0x6c6f72);}}
    top=base+st*SH;B.box(0,top,0,w+.3,.2,d+.3,0x77797a);for(let i=0;i<3;i++)B.box(-hw*.5+i*hw*.5,top+.2,(rng()-.5)*d*.4,.9,.7,.9,0x8c8f90);B.cyl(hw*.6,top+.2,-hd*.5,.05,3.6,0x55595c,5);G.sph(hw*.6,top+3.8,-hd*.5,.09,.09,.09,0xff3a2a);
    B.box(0,base,hd+.02,1.4,2.1,.08,0x4a6a7a);T.push(`${st} storeys of concrete and glass`,'Lifts, balconies and a roof of aerials');b._st=st;b._cap=18;}
  else{name='Arcology Spire';st=5;const SH=4.4;let y=base;const W0=w*1.1,D0=d*1.1;
    B.box(0,y,0,W0+.5,1.4,D0+.5,0x8d93a0);y+=1.4;
    for(let s=0;s<st;s++){const f=1-s*.13,ww=W0*f,dd=D0*f;B.box(0,y,0,ww,SH,dd,s%2?0xdfe6ee:0xc9d3dd);
      for(const f of [1,-1]){glazeFace(K,'z',f,ww*.9,y+.6,SH-1.2,dd/2+.01,0xf2f5f8,0x8fc4e0,0x8fc4e0);glazeFace(K,'x',f,dd*.9,y+.6,SH-1.2,ww/2+.01,0xf2f5f8,0x8fc4e0,0x8fc4e0);}
      F.box(0,y+SH-.12,dd/2+.06,ww+.1,.08,.04,0x3fe0ff);F.box(0,y+SH-.12,-dd/2-.06,ww+.1,.08,.04,0x3fe0ff);
      if(s<st-1){B.box(0,y+SH,0,ww+.9,.22,dd+.9,0x6fae62);for(let i=0;i<5;i++)B.sph(-ww*.4+i*ww*.2,y+SH+.35,dd*.45,.3,.3,.3,0x4f9a4a);}
      y+=SH;}
    B.cyl(0,y,0,.18,5.5,0xdfe6ee,6);F.sph(0,y+5.6,0,.22,.22,.22,0x7ff0ff);
    T.push('Tapering tower of glass, garden terraces and light','Homes for a thousand souls');b._st=st*2;b._cap=30;top=y;}
  return {name,r:Math.max(w,d)/2+.8};
}
GEN.factory=(b,c,K)=>{
  const {B,G,F,rng}=K,T=K.traits;const w=9.4,d=7.4,hw=w/2,hd=d/2;const [gMin,gMax]=K.rect(hw+.4,hd+.4);const base=gMax+.15;
  B.box(0,gMin-.6,0,w+.5,base-gMin+.6,d+.5,0x5f5a52);const brick=K.pick(BRICK);
  B.box(0,base,0,w,3.8,d,brick);B.box(0,base+3.7,0,w+.2,.16,d+.2,0xb8aa94);
  const hr=gable(B,{x:0,z:0,top:base+3.8,len:w,span:d,k:.3,t:.2,col:0x5d6068,wall:brick,axis:'x',ov:.3});
  for(let i=0;i<5;i++){const x=-hw+.9+i*(w-1.8)/4;B.box(x,base+.9,hd+.01,.9,2.1,.05,0x2a2622);G.box(x,base+1.05,hd+.04,.7,1.8,.05,GLASS);B.box(x,base+.9,-hd-.01,.9,2.1,.05,0x2a2622);G.box(x,base+1.05,-hd-.04,.7,1.8,.05,GLASS);}
  B.box(0,base,hd+.03,2.3,2.8,.1,0x3a2f26);
  for(const [cx,cz,hh] of [[-hw+.9,-hd+.9,9.2],[hw-.9,-hd+.9,7.6]]){B.box(cx,base+3.8,cz,1.1,hh-3.8,1.1,0x7d3a2e);B.box(cx,base+hh,cz,1.35,.22,1.35,0x2f2a26);K.smoke(cx,base+hh+.5,cz,3.2,1);}
  B.box(hw+1.6,base-.05,0,.25,.1,d+3,0x3a3d42);B.box(hw+2.2,base-.05,0,.25,.1,d+3,0x3a3d42);for(let i=0;i<8;i++)B.box(hw+1.9,base-.1,-hd-.6+i*1.0,1.2,.08,.22,0x4a3a2a);
  B.sph(-hw-1.4,base,hd*.4,1.2,.8,1.1,0x2a2622,1);
  T.push('Brick works under a sawn-toothed roof','Two soot-black chimneys','Rail siding for the coal wagons');return {name:'Factory',r:6.2};
};
GEN.school=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;const uni=b.level!=null?b.level>=1:eraNow()>=6;const w=uni?9.4:8,d=uni?5.6:5,hw=w/2,hd=d/2;const [gMin,gMax]=K.rect(hw+.3,hd+.3);const base=gMax+.15;
  B.box(0,gMin-.6,0,w+.4,base-gMin+.6,d+.4,0x7d766a);const wall=uni?K.pick(CONC):K.pick([0xc9b896,0xb9a888,0xd2c4a2]);
  B.box(0,base,0,w,3.6,d,wall);B.box(0,base+3.6,0,w+.3,.18,d+.3,0x8f8a7e);
  for(let i=0;i<5;i++){const x=-hw+.9+i*(w-1.8)/4;if(Math.abs(x)<1)continue;B.box(x,base+1.2,hd+.01,.8,1.7,.05,0x3a3028);G.box(x,base+1.3,hd+.04,.62,1.5,.05,GLASS);B.box(x,base+1.2,-hd-.01,.8,1.7,.05,0x3a3028);G.box(x,base+1.3,-hd-.04,.62,1.5,.05,GLASS);}
  for(const f of [-1,1])B.cyl(f*1.1,base,hd+.5,.2,3.4,0xe4dfd2,8);B.box(0,base+3.4,hd+.5,3,.3,.9,0xcfc8b8);B.box(0,base,hd+.4,3.2,.3,1.2,0x9a948a);
  const rc=uni?0x6c7078:0x6b4a3a;if(!uni)gable(B,{x:0,z:0,top:base+3.8,len:w,span:d,k:.5,t:.2,col:rc,wall,axis:'x',ov:.35});else B.box(0,base+3.78,0,w,.2,d,0x5c6168);
  const tz=0;B.box(0,base+3.7,tz,2.2,2.6,2.2,wall);B.cone(0,base+6.3,tz,1.6,1.8,rc,4,PI/4);G.box(0,base+4.5,1.12,.9,.9,.04,0xf2ecd8);G.box(0,base+4.5,-1.12,.9,.9,.04,0xf2ecd8);
  if(uni){B.sph(0,base+3.8,-hd*.2,2.2,1.6,2.2,0xcfd6dc,1);T.push('Domed lecture hall');}
  T.push('Clock tower over the entrance','Scholars study the world’s workings');return {name:uni?'University':'Academy',r:5.2};
};
GEN.station=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;const w=12,d=5,hw=w/2;const [gMin,gMax]=K.rect(hw+.5,3.2);const base=gMax+.15;
  B.box(0,gMin-.6,0,w+.6,base-gMin+.6,d+1.4,0x6f6a62);const brick=K.pick(BRICK);
  B.box(0,base,-1.2,w-3,3.2,2.6,brick);gable(B,{x:0,z:-1.2,top:base+3.2,len:w-3,span:2.6,k:.55,t:.2,col:0x4f5866,wall:brick,axis:'x',ov:.3});
  B.box(0,base,-1.2,2.4,5.6,2.6,brick);B.cone(0,base+5.6,-1.2,1.9,1.6,0x4f5866,4,PI/4);G.box(0,base+4.2,.12,.8,.8,.04,0xf2ecd8);
  for(let i=0;i<4;i++){const x=-hw*.6+i*hw*.4;if(Math.abs(x)<1.4)continue;B.box(x,base+1.0,.1,.8,1.5,.04,0x2a2622);G.box(x,base+1.1,.12,.62,1.3,.04,GLASS);}
  B.box(0,base,1.9,w,.35,2.2,0x9a948a);for(let i=0;i<5;i++)B.box(-hw+1+i*(w-2)/4,base+.35,1.9,.14,2.8,.14,0x2f3236);B.box(0,base+3.15,1.9,w,.14,2.4,0x3d4f5e);
  // the tracks and the trains are drawn by the railway itself (js/rail.js): the station only has its hall, canopy and platform
  T.push('Brick station hall with a clock tower','Platform canopy beside the railway','The railway brings strangers and trade');return {name:'Railway Station',r:7.5};
};
GEN.powerplant=(b,c,K)=>{
  const {B,G,F,rng}=K,T=K.traits;const [gMin,gMax]=K.rect(6,5);const base=gMax+.15;
  B.box(0,gMin-.6,0,13,base-gMin+.6,11,0x6f6a62);B.box(-1.5,base,1,8,4.4,5,0x9a9d9e);B.box(-1.5,base+4.4,1,8.3,.2,5.3,0x6c6f72);
  for(let i=0;i<4;i++){G.box(-4.5+i*2,base+1.3,3.55,1.1,1.9,.05,GLASS);}
  for(const [x,z] of [[3.6,-2.4],[3.6,2.6]]){B.cyl(x,base,z,2.2,8,0xc9c6bd,14,.72);B.cyl(x,base+8,z,1.6,.3,0xaaa79e,14);K.smoke(x,base+8.5,z,3.6,0);}
  B.cyl(-4.6,base+4.6,-3.2,.5,9,0xd2d0c8,8,.8);B.cyl(-4.6,base+9.2,-3.2,.52,.7,0xb8321f,8);B.cyl(-4.6,base+12.4,-3.2,.46,.7,0xb8321f,8);K.smoke(-4.6,base+14,-3.2,1.2,1);
  for(let i=0;i<3;i++)B.box(-5.2+i*1.6,base,-4,1,2.2,1.1,0x5f6366);
  B.box(5.6,base,4,2.2,1.8,1.6,0x8a8d90);for(let i=0;i<4;i++)B.cyl(5.6+(i%2)*.8-.4,base+1.8,4+(i>1?.5:-.3),.05,3,0x3a3d42,4);
  T.push('Great cooling towers','Turbine hall humming day and night','Lamps now burn through the night');return {name:'Power Station',r:7.6};
};
GEN.fusion=(b,c,K)=>{
  const {B,G,F,rng}=K,T=K.traits;const [gMin,gMax]=K.rect(5,5);const base=gMax+.15;
  B.box(0,gMin-.6,0,11,base-gMin+.6,11,0x848c96);B.cyl(0,base,0,4.6,.8,0xc9d3dd,16);
  B.sph(0,base+.8,0,3.8,3.2,3.8,0xdfe6ee,1);F.sph(0,base+3.4,0,1.5,1.5,1.5,0x7fe8ff);
  for(let i=0;i<8;i++){const a=i/8*TAU,x=Math.sin(a)*5.2,z=Math.cos(a)*5.2;B.cyl(x,base,z,.35,5.2,0xaab6c2,6);F.box(x,base+5.2,z,.5,.2,.5,0x3fe0ff);}
  F.box(0,base+.9,0,8.4,.1,.1,0x3fe0ff);F.box(0,base+.9,0,.1,.1,8.4,0x3fe0ff);
  T.push('A captured star in a ring of light','Clean power for the whole valley');return {name:'Fusion Reactor',r:6.4};
};
