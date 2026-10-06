'use strict';
// new buildings (see bdefs.js for defBuilding): Age 6 Modern x5, Age 7 Futuristic x5
{
const TEAL=0x2fd6c8,CYAN=0x7ff0ff,WHITE=0xeef3f6,PEARL=0xd9e3ea,GL=0x6f9ab4,MUL=0xb9c0c4,SLAB=0xbfc4c8,ASPH=0x4a4d52,LEAF=[0x4f9a4a,0x5aa84f,0x3f8a44,0x6bb05a];
const LIT=[0xffe9b0,0xfff4d0,0xcfe8ff,0xffffff],CARC=[0xb8321f,0x2f4a8e,0xe8e8e2,0x3a3d42,0xd4a73c,0x2f6b3a,0x8a8d90];
const sg=(a,b)=>Math.sin(a)*b;
function car(K,x,y,z,ax,col){const B=K.B,l=ax==='x';B.box(x,y+.06,z,l?.95:.5,.26,l?.5:.95,col);B.box(x,y+.3,z,l?.5:.46,.2,l?.46:.5,0x9fc0d0);}
function lamp(K,x,y,z,h,dz){h=h||2.4;K.B.cyl(x,y,z,.05,h,0x55595c,5);K.G.box(x,y+h,z+(dz||0),.38,.07,.14,0xfff2c0);}
function tree(K,x,y,z,s){s=s||1;K.B.cyl(x,y,z,.06*s,.55*s,0x6a4a2e,5);K.B.sph(x,y+.75*s,z,.34*s,.38*s,.34*s,K.pick(LEAF),0);}
// glazed box with floor slabs, mullions and lit windows
function curtain(K,cx,cz,w,d,y0,nf,fh,o){o=o||{};const {B,G,rng}=K,H=nf*fh,gl=o.glass||GL,mu=o.mull||MUL,sp=o.span||SLAB,lp=o.lit==null?.28:o.lit;
  B.box(cx,y0,cz,w,H,d,gl);for(let i=0;i<=nf;i++)B.box(cx,y0+i*fh,cz,w+.12,.2,d+.12,sp);
  const nw=Math.max(2,Math.round(w/1.3)),nd=Math.max(2,Math.round(d/1.3));
  for(let k=0;k<=nw;k++){const x=cx-w/2+k*w/nw;for(const s of [1,-1])B.box(x,y0,cz+s*(d/2+.03),.07,H,.06,mu);}
  for(let k=1;k<nd;k++){const z=cz-d/2+k*d/nd;for(const s of [1,-1])B.box(cx+s*(w/2+.03),y0,z,.06,H,.07,mu);}
  for(let i=0;i<nf;i++){for(let k=0;k<nw;k++)for(const s of [1,-1])if(rng()<lp)G.box(cx-w/2+(k+.5)*w/nw,y0+i*fh+.4,cz+s*(d/2+.05),w/nw*.7,fh*.5,.04,K.pick(LIT));
    for(let k=0;k<nd;k++)for(const s of [1,-1])if(rng()<lp)G.box(cx+s*(w/2+.05),y0+i*fh+.4,cz-d/2+(k+.5)*d/nd,.04,fh*.5,d/nd*.7,K.pick(LIT));}
  return y0+H;}
function ringBoxes(B,cx,y,cz,Rx,Rz,n,h,th,col,ph){ph=ph||0;const P=i=>{const t=ph+i/n*TAU;return [cx+Math.sin(t)*Rx,cz+Math.cos(t)*Rz,t];};
  for(let i=0;i<n;i++){const [x,z,t]=P(i),[x2,z2]=P(i+1),L=Math.hypot(x2-x,z2-z)*1.08;B.box(x,y,z,L,h,th,col,Math.atan2(Math.sin(t)/Rx,Math.cos(t)/Rz));}}
function carpark(K,y,x0,x1,z,n){for(let i=0;i<n;i++){const x=x0+(x1-x0)*i/Math.max(1,n-1);K.B.box(x,y+.01,z,.04,.02,1.1,0xe8e8e2);if(K.rng()<.6)car(K,x+.3,y,z,'z',K.pick(CARC));}}
function mast(K,x,y,z,h){K.B.cyl(x,y,z,.05,h,0x55595c,5);K.B.box(x,y+h*.6,z,.5,.04,.04,0x55595c);K.G.sph(x,y+h+.05,z,.09,.09,.09,0xff3a2a,0);}
function hvac(K,x,y,z,n,sp){for(let i=0;i<n;i++){K.B.box(x+i*sp,y,z,.8,.55,.7,0xb5b9bc);K.B.cyl(x+i*sp,y+.55,z,.28,.06,0x3a3d42,8);}}
function engine(K,x,y,z,ax,col){const B=K.B,l=ax==='x',L=2.1,W=.8;
  B.box(x,y+.18,z,l?L:W,.38,l?W:L,0x2a2d31);B.box(x,y+.42,z,l?L:W,.78,l?W:L,col);
  B.box(x+(l?.6:0),y+1.2,z+(l?0:-.6),l?.9:W*.9,.55,l?W*.9:.9,col);B.box(x+(l?-.05:0),y+1.1,z,l?.12:W*.4,.18,l?W*.4:.12,0xe8e8e2);
  K.G.box(x+(l?.55:0),y+1.62,z+(l?0:-.55),l?.14:.5,.07,l?.5:.14,0x7ac4ff);K.G.box(x+(l?-.55:0),y+1.62,z+(l?0:.55),l?.14:.5,.07,l?.5:.14,0xff3a2a);
  for(const s of [-1,1])for(const t of [-.65,.65])B.cyl(x+(l?t:s*W/2),y,z+(l?s*W/2:t),.19,.2,0x1a1a1a,6);}

// ================================================================ AGE 6 - MODERN
defBuilding({type:'office_tower',age:6,name:'Office Tower',desc:'Glass and steel offices; the day shift fills it with light.',variants:['Glass Slab','Stepped Tower','Round Tower'],r:5.8,joy:0,
gen:(b,c,K,vi)=>{const {B,G,rng}=K;const base=BH.pad(K,4.7,4.7);
  const zp=-.5;let y,top;
  // podium + lobby
  B.box(0,base,zp,6.6,3.0,3.8,0xcfcfca);B.box(0,base+3.0,zp,6.9,.2,4.1,0x77797a);
  curtain(K,0,zp+.2,6.2,3.8,base,1,3.0,{glass:0x3f6a86,lit:.5});
  B.box(0,base,zp+1.95,2.2,2.2,.1,0x2c4a5e);G.box(0,base+.3,zp+2.0,1.6,1.7,.05,0xffeab0);B.box(0,base+2.35,zp+2.5,3.0,.14,1.2,0x55595c);for(const s of [-1,1])B.cyl(s*1.4,base,zp+3.0,.06,2.35,0x55595c,5);
  G.box(-2.2,base+2.55,zp+2.0,1.6,.36,.05,0x2fd6c8);G.box(-2.2,base+2.55,zp+2.02,.5,.36,.05,0xffffff);
  B.box(0,base+3.2,zp+1.0,5.4,.5,.12,0x55595c);
  if(vi===0){const nf=9;top=curtain(K,0,-.6,4.8,3.4,base+3.2,nf,1.9,{lit:.4});
    B.box(0,top,-.6,4.2,.9,3,0x8c8f90);hvac(K,-1.2,top+.9,-.6,3,.8);mast(K,.9,top+.9,-1.2,3.4);B.box(1.5,top,-.6,.25,1.2,.25,0x3a3d42);B.box(0,top+.9,.9,1.2,.3,.1,0xe8e8e2);
    K.flag(-1.5,top+.9,.5,0x8e2f1f,.8,2.2);B.box(0,top+.5,-.6+1.48,1.4,.3,.5,0x3a3d42);K.anim&&0;
    G.box(0,base+3.5,zp+1.2,3.6,.18,.04,0x2fd6c8);}
  else if(vi===1){let w=5.4,d=3.8,yy=base+3.2;const tiers=[[3,1.9],[3,1.9],[3,1.9]];
    for(let t=0;t<3;t++){const [nf,fh]=tiers[t];yy=curtain(K,0,-.6,w,d,yy,nf,fh,{lit:.4,glass:t===1?0x2f5a7a:GL});
      B.box(0,yy,-.6,w+.5,.2,d+.5,0xcfcfca);for(const s of [-1,1]){B.box(s*(w/2+.25),yy+.2,-.6,.04,.4,d+.5,0xb9c0c4);}B.box(0,yy+.2,-.6+d/2+.25,w+.5,.4,.04,0xb9c0c4);
      for(let i=0;i<3;i++)tree(K,-w/2+.5+i*w/2.2,yy+.2,-.6+d/2-.2,.8);w-=1.0;d-=.7;}
    top=yy;B.cyl(0,top+.2,-.6,.4,.7,0x8c8f90,8);mast(K,0,top+.9,-.6,4.4);K.flag(1,top+.2,-.2,0x2f4a8e,.8,2);}
  else{const R=2.5,nf=9,fh=1.9,y0=base+3.2,H=nf*fh;B.cyl(0,y0,-.6,R,H,GL,14);
    for(let i=0;i<=nf;i++)B.cyl(0,y0+i*fh,-.6,R+.07,.2,SLAB,14);
    for(let i=0;i<nf;i++)for(let k=0;k<12;k++)if(rng()<.28){const a=k/12*TAU+(i&1)*.26;G.box(Math.sin(a)*(R*.97+.04),y0+i*fh+.4,-.6+Math.cos(a)*(R*.97+.04),.75,.85,.05,K.pick(LIT),a);}
    for(let k=0;k<7;k++){const a=k/7*TAU;B.box(Math.sin(a)*(R*.97+.03),y0,-.6+Math.cos(a)*(R*.97+.03),.08,H,.07,MUL,a);}
    top=y0+H;B.cyl(0,top,-.6,R,.25,0x8c8f90,14);B.cyl(0,top+.25,-.6,R*.8,.05,0xcfcfca,14);
    for(const [bx,bz,bw,bd] of [[-.8,-.2,.1,.8],[.8,-.2,.1,.8],[0,-1,1.7,.1],[0,.6,1.7,.1]]){}
    B.cyl(0,top+.3,-.6,1.2,.08,0x3a3d42,12);G.box(0,top+.4,-.6,.14,.02,.9,0xffffff);G.box(0,top+.4,-.6,.14,.02,.9,0xffffff);G.box(.35,top+.4,-.6,.14,.02,.9,0xffffff);G.box(.17,top+.4,-.6,.5,.02,.12,0xffffff);
    for(let k=0;k<8;k++){const a=k/8*TAU;G.sph(Math.sin(a)*1.25,top+.38,-.6+Math.cos(a)*1.25,.05,.05,.05,0xff3a2a,0);}
    mast(K,-1.5,top+.25,-1.2,3);}
  // forecourt: trees, lamps, car park
  carpark(K,base,-3.8,3.8,3.6,6);for(const s of [-1,1]){lamp(K,s*4.3,base,1.4);tree(K,s*4.2,base,2.8,.9);}
  B.box(0,base,4.55,9.4,.12,.1,0x8d9094);
  return {name:['Glass Slab Tower','Stepped Tower','Round Tower'][vi]};}});

defBuilding({type:'stadium',age:6,name:'Stadium',desc:'Floodlit stands where the whole town cheers the home side.',variants:['Oval Bowl','Roofed Arena','Grandstand Ground'],r:8.5,joy:3,
gen:(b,c,K,vi)=>{const {B,G,rng}=K;const base=BH.pad(K,7.2,6.2);
  const pitch=(Rx,Rz,y)=>{B.put('cyl:24:1',0,y,0,Rx,.12,Rz,0x4f9a3a);for(let i=0;i<6;i++)B.put('cyl:24:1',0,y+.12,0,Rx,.01,Rz,i%2?0x4a9235:0x58a640);
    B.box(0,y+.13,0,.06,.02,Rz*2*.88,0xf2f2f2);B.box(0,y+.13,Rz*.88,Rx*2*.88,.02,.06,0xf2f2f2);B.box(0,y+.13,-Rz*.88,Rx*2*.88,.02,.06,0xf2f2f2);};
  const pylon=(x,z,h)=>{B.cyl(x,base,z,.12,h,0x77797a,6);B.box(x,base+h,z,1.1,.7,.2,0x3a3d42,Math.atan2(-x,-z)+PI);for(let i=0;i<3;i++)for(let j=0;j<2;j++)G.box(x+Math.sin(Math.atan2(-x,-z))*.12+(i-1)*.32*Math.cos(Math.atan2(-x,-z)),base+h-.12+j*.3,z+Math.cos(Math.atan2(-x,-z))*.12-(i-1)*.32*Math.sin(Math.atan2(-x,-z)),.26,.22,.05,0xffffff,Math.atan2(-x,-z));};
  if(vi===0){const Rx=6.2,Rz=4.6;pitch(3.6,2.4,base);
    for(let t=0;t<3;t++){const k=1-t*.12;ringBoxes(B,0,base+t*.9,0,Rx*.78+t*.55,Rz*.72+t*.5,28,.9,.7+t*0,[0xb8321f,0xd8d8d2,0x2f4a8e][t]);}
    ringBoxes(B,0,base,0,Rx*.78+1.8,Rz*.72+1.5,32,2.7,.3,0xcfcfca);ringBoxes(B,0,base+2.7,0,Rx*.78+1.8,Rz*.72+1.5,32,.25,.5,0x77797a);
    for(let i=0;i<16;i++){const a=i/16*TAU,x=Math.sin(a)*(Rx*.78+1.8),z=Math.cos(a)*(Rz*.72+1.5);if(i%2==0)G.box(x,base+2.05,z,.45,.35,.05,0xffeab0,Math.atan2(Math.sin(a)/Rx,Math.cos(a)/Rz));}
    for(const [x,z] of [[-5.2,-4.3],[5.2,-4.3],[-5.2,4.3],[5.2,4.3]])pylon(x,z,6.2);
    B.box(0,base,Rz*.72+1.65,2.4,2.2,.5,0xb9bcb8);G.box(0,base+1.4,Rz*.72+1.9,1.6,.4,.05,0xff6a3a);
    K.flag(-3.8,base+2.9,5.1,0xb8321f,.9,2.2);K.flag(3.8,base+2.9,5.1,0x2f4a8e,.9,2.2);}
  else if(vi===1){const w=11.4,d=8.8;B.box(0,base,0,w,3.4,d,0xcfd0cc);B.box(0,base+3.4,0,w+.4,.25,d+.4,0x77797a);
    // barrel roof along x
    B.put('cyl:18:1',w*.48,base+3.6,0,2.4,w*.96,d*.46,0xc9d0d4,0,0,PI/2);for(let i=-4;i<=4;i++)B.put('cyl:18:1',i*w*.115+.07,base+3.6,0,2.45,.14,d*.47,0x6c7278,0,0,PI/2);
    B.box(0,base+3.4,0,w*.9,.4,.5,0x6c7278);G.box(0,base+3.62,d/2-.1,w*.7,.16,.05,0x2fd6c8);G.box(0,base+3.62,-d/2+.1,w*.7,.16,.05,0x2fd6c8);
    for(let i=0;i<7;i++){const x=-w/2+1+i*(w-2)/6;B.box(x,base,d/2+.03,.5,3.4,.1,0xb9bcb8);B.box(x,base+1.3,d/2+.06,.9,1.5,.05,0x3f6a86);if(i%2==0)G.box(x,base+1.5,d/2+.1,.7,1.0,.04,0xffe9b0);}
    B.box(0,base,d/2+.2,2.8,2.2,.2,0x2c4a5e);B.box(0,base+2.2,d/2+.9,3.6,.16,1.8,0x55595c);for(const s of [-1,1])B.cyl(s*1.6,base,d/2+1.6,.07,2.2,0x55595c,5);
    G.box(0,base+2.7,d/2+.12,3.2,.5,.05,0xff6a3a);
    for(let k=0;k<4;k++){const x=-4.8+k*3.2;K.flag(x,base+3.6,d/2-.2,[0xb8321f,0x2f4a8e,0xd4a73c,0x2f6b3a][k],.8,2.3);}
    hvac(K,-w/2+1,base+3.65,-d/2+1,0,.8);carpark(K,base,-w/2+.8,w/2-.8,d/2+2.3,9);}
  else{pitch(4.6,2.8,base);
    // big west stand with cantilever roof, small east stand
    for(let t=0;t<5;t++){B.box(-5.6-t*.6,base,0,.9,.55+t*.55,7.4+t*.3,[0xb8321f,0xd8d8d2][t&1]);}
    B.box(-7.2,base,0,.5,3.4,8,0xcfd0cc);B.wedge(-6.1,base+3.5,0,3.8,.45,8.2,0xc9d0d4,PI/2);B.box(-7.4,base+3.5,0,.2,.7,8.2,0x6c7278);
    for(let i=0;i<5;i++)B.cyl(-4.5,base,-3.5+i*1.75,.1,3.4,0x77797a,6);
    for(let t=0;t<2;t++)B.box(5.5+t*.6,base,0,.9,.5+t*.45,6.2,[0x2f4a8e,0xd8d8d2][t]);
    for(const s of [-1,1]){B.box(0,base,s*3.7,9.6,.5,.4,0x4a6a7a);}
    for(const z of [-.55,.55]){B.cyl(4.6,base,z,.04,1.5,0xf2f2f2,4);}B.box(4.6,base+1.5,0,.04,.04,1.1,0xf2f2f2);for(const z of [-.55,.55]){B.cyl(-4.6,base,z,.04,1.5,0xf2f2f2,4);}B.box(-4.6,base+1.5,0,.04,.04,1.1,0xf2f2f2);
    B.cyl(6.9,base,-3.6,.1,2.4,0x55595c,6);B.box(6.9,base+2.4,-3.6,.3,1.3,2.4,0x2a2d31);G.box(6.74,base+2.6,-3.6,.04,.9,2.0,0x2fd6c8);G.box(6.74,base+2.9,-3.6,.04,.12,1.2,0xffe9b0);
    pylon(-6.2,-5.4,6.2);pylon(-6.2,5.4,6.2);pylon(6.4,-5.4,6.2);pylon(6.4,5.4,6.2);
    for(let i=0;i<14;i++){const sx=-5.8-(i%5)*.6,sz=-3.2+(i%7)*1,sy=base+(i%5)*.55+.55;B.sph(sx,sy+.15,sz,.12,.13,.12,K.pick([0xe8c9a0,0xc9a070,0x6b4a2e,0xf2e0c0]),0);}
    K.flag(-7.2,base+3.9,0,0xb8321f,1,2);for(let i=0;i<6;i++)car(K,-3+i*1.2,base,5.3,'z',K.pick(CARC));}
  return {name:['Oval Stadium','Arena','Football Ground'][vi]};}});

defBuilding({type:'cinema',age:6,name:'Cinema',desc:'Neon marquee, buttered popcorn and the latest picture.',variants:['Multiplex','Picture Palace','Drive-In'],r:6.2,joy:2,
gen:(b,c,K,vi)=>{const {B,G,rng}=K;const base=BH.pad(K,5,4.8);
  const poster=(x,y,z,w,h)=>{B.box(x,y,z,w+.1,h+.1,.06,0x1a1a1a);G.box(x,y+.05,z+.04,w,h,.03,K.pick([0xff6a3a,0x7ff0ff,0xffd24a,0xc070ff,0xff4a7a]));};
  if(vi===0){B.box(0,base,-.6,8.4,4.6,5.4,0xbfc4c8);B.box(0,base+4.6,-.6,8.7,.25,5.7,0x2a2d31);
    B.box(-1.4,base,2.3,5.6,3.4,1.5,0xd6d3cb);B.box(-1.4,base+3.4,2.3,5.9,.2,1.8,0x2a2d31);for(let i=0;i<4;i++){B.box(-3.3+i*1.2,base+.3,3.06,1.0,2.4,.08,0x3f6a86);G.box(-3.3+i*1.2,base+.5,3.1,.8,1.9,.04,0xffe9b0);}
    // sign tower
    B.box(3.4,base,2.4,1.6,6.6,.5,0x1f2326);for(let i=0;i<5;i++)G.box(3.4,base+.5+i*1.15,2.7,1.2,.7,.05,[0xff6a3a,0x7ff0ff,0xffd24a,0xc070ff,0xff4a7a][i]);
    G.box(-1.4,base+3.7,3.12,5.3,.45,.05,0xff4a7a);G.box(-1.4,base+3.7,3.15,5.1,.12,.05,0xffffff);
    for(let i=0;i<5;i++)poster(-3.3+i*1.2,base+3.9,1.5,.9,.1);
    for(let i=0;i<4;i++)poster(-3+i*1.9,base+1.2,-3.27,1.1,1.6);
    hvac(K,-3,base+4.85,-1.5,3,1.6);B.box(2,base+4.85,-1.2,1.2,.6,.9,0x77797a);mast(K,-3.8,base+4.85,0,3);
    B.cyl(-3.9,base,4.3,.3,.9,0xb8321f,8);B.cyl(-3.9,base+.9,4.3,.34,.2,0xf2f2f2,8);
    carpark(K,base,-4.2,2.6,4.1,6);lamp(K,4.4,base,4.2);lamp(K,-4.6,base,1);}
  else if(vi===1){const cream=0xe8dcc0;B.box(0,base,-.5,8,3.4,4.6,cream);B.box(-3.7,base,.6,2.2,3.4,2.6,cream);B.box(3.7,base,.6,2.2,3.4,2.6,cream);
    for(const s of [-1,1]){B.box(s*3.7,base+3.4,.6,2.4,.2,2.8,0xb8321f);B.box(s*3.7,base+3.6,.6,1.8,.4,2.2,cream);}
    B.box(0,base+3.4,-.5,8.2,.2,4.8,0xb8321f);B.box(0,base+3.6,-.5,3.6,4.4,2.4,cream);B.box(0,base+8.0,-.5,2.6,.4,1.6,0xb8321f);
    // vertical blade sign
    B.box(0,base+3.6,1.0,1.6,5.8,.35,0x2a2d31);G.box(0,base+4.1,1.2,1.1,4.8,.05,0xff4a7a);for(let i=0;i<5;i++)G.box(0,base+4.5+i*.95,1.25,.8,.14,.04,0xffffff);
    B.cyl(0,base+9.4,-.5,.05,1.2,0x55595c,5);G.sph(0,base+10.7,-.5,.1,.1,.1,0xff3a2a,0);
    // marquee
    B.box(0,base+2.5,2.4,5.4,.5,2.2,0x2a2d31);G.box(0,base+2.6,3.51,5.2,.3,.04,0xffe9b0);for(let i=0;i<14;i++)G.sph(-2.5+i*5/13,base+2.5,3.53,.07,.07,.07,0xffffff,0);
    for(const s of [-1,1])B.cyl(s*2.5,base,3.3,.1,2.5,0xb8321f,6);
    for(let i=0;i<3;i++){B.box(-1.2+i*1.2,base,2.0,.9,2.2,.1,0x2c4a5e);G.box(-1.2+i*1.2,base+.2,2.06,.7,1.7,.04,0xffe9b0);}
    for(const s of [-1,1]){poster(s*3.7,base+1.3,1.93,1.4,1.7);G.box(s*3.7,base+3.0,1.95,1.4,.12,.04,0xffd24a);}
    for(let i=0;i<5;i++){B.box(-3.8+i*1.9,base+3.6,-2.9,.1,1.6,.1,cream);}
    K.flag(3.7,base+3.8,.6,0xb8321f,.8,2);K.flag(-3.7,base+3.8,.6,0xd4a73c,.8,2);
    for(const s of [-1,1]){tree(K,s*4.4,base,3.6,.9);car(K,s*2.5,base,4.4,'x',K.pick(CARC));}lamp(K,0,base,4.5);}
  else{ // drive-in
    B.box(0,base,-3.7,8.6,.2,.3,0x55595c);for(const s of [-3.8,3.8])B.box(s,base,-3.9,.3,5.7,.4,0x77797a);
    B.box(0,base+1.2,-3.7,7.6,4.2,.2,0xe8e8e2);B.box(0,base+1.2,-3.62,7.6,.14,.12,0x2a2d31);B.box(0,base+5.3,-3.62,7.6,.14,.12,0x2a2d31);
    B.box(0,base+1.5,-3.58,7,3.6,.04,0xd8d8d2);for(let i=0;i<8;i++)G.box(-3+i*.86,base+1.6+(i%3)*.4,-3.54,.5,1.2+(i*37%5)*.3,.03,[0xffd24a,0x7ff0ff,0xff6a3a,0xc070ff][i%4]);
    G.box(0,base+5.5,-3.5,6,.12,.04,0xffffff);
    for(let r=0;r<4;r++){const R=2.4+r*1.05;for(let i=-4;i<=4;i++){const a=i*.2;if(Math.abs(a*R)>R*1.1)continue;const x=Math.sin(a)*R,z=-3.6+Math.cos(a)*R*.9+.6;
        if(z>4.4||Math.abs(x)>4.6)continue;B.box(x,base,z,1.0,.14+r*.05,.5,0x6a6d72,-a*.8);if(rng()<.55&&r>0)car(K,x,base+.14+r*.05,z,'z',K.pick(CARC));}}
    // snack bar & projector hut
    B.box(3.4,base,2.9,2.2,1.9,1.6,0xe8dcc0);B.box(3.4,base+1.9,2.9,2.6,.2,2.0,0xb8321f);G.box(3.4,base+1.2,3.74,1.6,.5,.04,0xffe9b0);G.box(3.4,base+2.3,3.9,1.8,.3,.04,0xff4a7a);
    B.box(0,base,.8,1.4,1.5,1.2,0x77797a);B.box(0,base+1.5,.8,1.6,.14,1.4,0x3a3d42);G.box(0,base+1.0,-.1,.3,.2,.04,0xfff4d0);
    for(let i=0;i<5;i++)lamp(K,-4.4+i*.4,base,4+((i*7)%3)*.1,1.1);
    B.box(0,base,4.55,3.4,.08,.2,0xe8e8e2);}
  return {name:['Multiplex Cinema','Picture Palace','Drive-In Cinema'][vi]};}});

defBuilding({type:'fire_station',age:6,name:'Fire Station',desc:'Bays always ready; the bell rings and the engines roll.',variants:['Brick Hose Tower','Modern Two-Bay','Helipad Station'],r:6,joy:0,
gen:(b,c,K,vi)=>{const {B,G,rng}=K;const base=BH.pad(K,5,4.6);const RED=0xc23a28;
  if(vi===0){const br=0x9a4a3a;B.box(-.8,base,-.6,7.2,3.6,4,br);B.box(-.8,base+3.6,-.6,7.5,.22,4.3,0xb8aa94);B.box(-.8,base+3.82,-.6,6.9,.2,3.7,0x5c6168);
    for(let i=0;i<3;i++){const x=-2.6+i*1.8;B.box(x,base,1.43,1.5,2.5,.1,0x2a2d31);for(let k=0;k<5;k++)B.box(x,base+.15+k*.45,1.5,1.4,.1,.04,0xe8e8e2);B.box(x,base+2.5,1.46,1.7,.15,.14,0xb8aa94);G.box(x,base+2.9,1.45,.6,.3,.04,0xffe9b0);}
    // hose tower
    B.box(3.6,base,-.9,1.8,7.6,1.8,br);B.box(3.6,base+7.6,-.9,2.1,.22,2.1,0xb8aa94);B.cone(3.6,base+7.8,-.9,1.7,1.8,0x4f5866,4,PI/4);
    for(let k=0;k<3;k++)B.box(3.6,base+1.6+k*2.0,.0,.5,.9,.08,0x2a2d31);G.box(3.6,base+3.7,.03,.4,.8,.04,0xffe9b0);G.box(3.6,base+5.7,.03,.4,.8,.04,0xffe9b0);G.box(3.6,base+6.5,.03,.9,.9,.04,0xf2ecd8);
    B.cyl(3.6,base+9.6,-.9,.04,1.2,0x55595c,5);K.flag(3.65,base+9.7,-.9,0xb8321f,.8,1.2);
    G.box(-.8,base+3.2,1.43,2.8,.5,.05,0xe8e8e2);G.box(-.8,base+3.2,1.46,2.8,.38,.04,0xc23a28);
    B.box(-4.8,base,-.6,.6,2.8,.6,br);B.cyl(-4.8,base+2.8,-.6,.16,.7,0x77797a,6);K.smoke(-4.8,base+3.7,-.6,.5,1);
    engine(K,-1.2,base,3.4,'x',RED);B.cyl(3.9,base,3.3,.12,.9,RED,6);B.box(3.9,base+.9,3.3,.34,.2,.34,0x2a2d31);
    for(let i=0;i<3;i++)B.box(-1.2+i*.7,base+1.7,3.4+(i-1)*.0,.04,.04,.04,0xffffff);}
  else if(vi===1){B.box(-.6,base,-.3,8.4,3.7,3.6,0xd0d1cc);B.box(-.6,base+3.7,-.3,9.4,.3,4.8,0x44484c);
    for(let i=0;i<2;i++){const x=-2.6+i*3.6;B.box(x,base,1.55,3.0,3.1,.1,0x3a3d42);for(let k=0;k<6;k++)G.box(x,base+.2+k*.5,1.6,2.8,.3,.03,[0xcfe8ff,0xfff4d0][(k+i)&1]);B.box(x,base+3.1,1.52,3.2,.15,.14,RED);}
    B.box(-.6,base+.1,1.57,.2,3.0,.08,0xe8e8e2);
    curtain(K,2.8,-.4,2.0,3.2,base,2,1.85,{lit:.6,glass:0x3f6a86});
    B.box(2.8,base+3.7,-.4,2.4,.3,3.6,0x44484c);
    G.box(-.6,base+3.35,1.6,6,.3,.04,RED);G.box(-3,base+3.38,1.64,1.4,.2,.04,0xffffff);
    // training tower
    for(const [x,z] of [[-4.2,-2.8],[-3.2,-2.8],[-4.2,-1.8],[-3.2,-1.8]])B.box(x,base,z,.12,5.4,.12,0x55595c);for(let k=0;k<5;k++){B.box(-3.7,base+k*1.1+1.1,-2.8,1.0,.1,.1,0x55595c);B.box(-3.7,base+k*1.1+1.1,-1.8,1.0,.1,.1,0x55595c);B.box(-4.2,base+k*1.1+1.1,-2.3,.1,.1,1.0,0x55595c);B.box(-3.2,base+k*1.1+1.1,-2.3,.1,.1,1.0,0x55595c);}
    B.box(-3.7,base+5.4,-2.3,1.4,.15,1.4,0x77797a);B.box(-3.7,base+2.2,-2.3,.8,.6,.1,0x3a3d42);
    hvac(K,0,base+4.0,-1,3,1.0);K.flag(4.2,base+4.0,1,0xb8321f,.8,2);
    engine(K,-1.6,base,3.6,'x',RED);B.box(1.7,base+.3,3.5,2.0,.8,.8,0xe8e8e2);B.box(1.7,base+.9,3.5,1.9,.7,.8,0xe8e8e2);B.box(1.7,base+.8,3.9,1.9,.2,.02,RED);G.box(1.7,base+1.65,3.5,.4,.07,.14,0x7ac4ff);}
  else{B.box(-1.6,base,-.8,6.2,3.4,3.8,0xcfcfca);B.box(2.9,base,.3,3.2,3.4,2.6,0xb8321f);B.box(2.9,base+3.4,.3,3.4,.2,2.8,0x44484c);B.box(-1.6,base+3.4,-.8,6.5,.2,4.1,0x44484c);
    for(let i=0;i<2;i++){const x=-2.7+i*2.4;B.box(x,base,1.13,2.1,2.7,.1,0x3a3d42);for(let k=0;k<5;k++)B.box(x,base+.15+k*.5,1.2,2,.1,.04,0xe8e8e2);}
    B.box(2.9,base,1.63,1.6,2.1,.1,0x2c4a5e);G.box(2.9,base+.2,1.68,1.2,1.6,.04,0xffe9b0);
    for(let i=0;i<4;i++){B.box(-3.4+i*1.5,base+1.5,1.15,.8,1.0,.05,0x3f6a86);G.box(-3.4+i*1.5,base+1.6,1.18,.6,.7,.03,K.pick(LIT));}
    // rooftop helipad over main block
    B.cyl(-1.6,base+3.6,-.8,2.1,.14,0x4a4d52,16);B.cyl(-1.6,base+3.74,-.8,1.8,.02,0x5c6168,16);G.box(-1.6,base+3.78,-.8,1.0,.02,.14,0xffffff);G.box(-1.6,base+3.78,-.8,.14,.02,1.0,0xffffff);
    for(let k=0;k<12;k++){const a=k/12*TAU;G.sph(-1.6+Math.sin(a)*2.0,base+3.76,-.8+Math.cos(a)*2.0,.06,.04,.06,0xffe9b0,0);}
    B.box(-3.5,base+3.6,-.6,.6,.8,.9,0x77797a);
    // helicopter
    B.sph(-1.6,base+4.4,-.8,.5,.4,.45,0xc23a28,0);B.box(-1.6,base+4.35,-1.55,.12,.12,1.2,0xc23a28);B.box(-1.6,base+4.6,-2.15,.04,.5,.1,0xc23a28);B.box(-1.6,base+3.8,-.8,.9,.05,.05,0x3a3d42);B.cyl(-1.6,base+4.7,-.8,.05,.2,0x3a3d42,5);
    const rot=K.sub();rot.box(0,0,0,3.4,.04,.14,0x2a2d31);rot.box(0,0,0,.14,.04,3.4,0x2a2d31);K.anim(rot,'spin',-1.6,base+4.92,-.8,{axis:'y',speed:14});
    G.box(-1.6,base+4.4,-.4,.5,.2,.04,0xcfe8ff);
    engine(K,-2.2,base,3.3,'x',RED);engine(K,.8,base,3.3,'x',0xe8e8e2);
    G.box(2.9,base+3.0,1.63,1.6,.28,.04,0xffffff);K.flag(4.2,base+3.6,-.4,0xb8321f,.8,2);}
  lamp(K,-4.6,base,3.6,2.2);lamp(K,4.6,base,3.6,2.2);
  return {name:['Brick Fire Station','Modern Fire Station','Fire & Rescue Station'][vi]};}});

defBuilding({type:'solar_farm',age:6,name:'Solar Farm',desc:'Shining fields that turn sunlight into the town’s power.',variants:['Panel Rows','Mirror Tower','Wind & Solar'],r:7,joy:0,
gen:(b,c,K,vi)=>{const {B,G,rng}=K;const base=BH.pad(K,5.7,5.2);
  const panel=(x,y,z,w,d,tilt,ry)=>{B.boxC(x,y,z,w,.08,d,0x23406e,tilt,ry||0,0);B.boxC(x,y+.045,z,w*.96,.02,d*.96,0x3a6aa8,tilt,ry||0,0);B.boxC(x,y+.06,z,.04,.02,d*.96,0xcfd8e0,tilt,ry||0,0);B.boxC(x,y+.06,z,w*.96,.02,.04,0xcfd8e0,tilt,ry||0,0);};
  const row=(x0,x1,z,n)=>{for(let i=0;i<n;i++){const x=x0+(x1-x0)*i/(n-1);panel(x,base+.85,z,1.05,1.2,.55);B.box(x,base,z-.25,.08,.8,.08,0x77797a);B.box(x,base,z+.3,.08,.45,.08,0x77797a);}};
  const shed=(x,z)=>{B.box(x,base,z,1.6,1.3,1.1,0xd0d1cc);B.box(x,base+1.3,z,1.8,.12,1.3,0x55595c);G.box(x,base+.9,z+.56,.3,.1,.03,0x7ff0ff);B.box(x+.4,base,z+.57,.5,.9,.04,0x77797a);for(let i=0;i<3;i++)B.box(x-.5+i*.15,base+1.42,z,.06,.3,.06,0x3a3d42);};
  const fence=(x0,x1,z0,z1)=>{for(const z of [z0,z1])for(let x=x0;x<=x1;x+=1.4)B.box(x,base,z,.05,.8,.05,0x8a8d90);B.box((x0+x1)/2,base+.7,z0,x1-x0,.04,.03,0x8a8d90);B.box((x0+x1)/2,base+.7,z1,x1-x0,.04,.03,0x8a8d90);};
  if(vi===0){for(let r=0;r<4;r++)row(-4.2,3.4,-4+r*1.9,6);shed(3.6,-3.6);
    B.cyl(4.5,base,1.5,.07,3.4,0x77797a,5);B.box(4.5,base+3.4,1.5,1.4,.07,.07,0x77797a);for(const s of [-1,1])B.cyl(4.5+s*.65,base+3.3,1.5,.05,.2,0xcfd0cc,5);
    B.beam(4.5,base+3.4,1.5,4.5,base,3.5,.03,0x3a3d42);B.box(4.4,base,3.6,.7,.5,.5,0x77797a);
    fence(-5,5,-5,5);K.flag(-5,base,5,0xe8e8e2,.5,1.2);
    for(let i=0;i<3;i++)B.sph(-4.8+i*.5,base+.12,4.5,.2,.14,.18,0xe8e4d8,0);G.box(0,base+.6,-5.05,.9,.2,.03,0xffd24a);}
  else if(vi===1){B.cyl(0,base,0,.9,7,0xd6d3cb,10,.7);B.cyl(0,base+7,0,.9,.3,0x77797a,10);B.cyl(0,base+7.3,0,.5,.8,0x5a5d60,10);B.sph(0,base+8.4,0,.8,.7,.8,0xf2e6b8,1);G.sph(0,base+8.4,0,.5,.5,.5,0xffd88a,1);
    B.box(.65,base,0,.04,7,.18,0x3a3d42);
    const rings=[[2.3,10],[3.4,14],[4.4,18]];for(const [R,n] of rings)for(let i=0;i<n;i++){const a=i/n*TAU+R*.3,x=Math.sin(a)*R,z=Math.cos(a)*R*.95;if(z>3.2&&Math.abs(x)<1)continue;
      B.box(x,base,z,.07,.5,.07,0x77797a);B.boxC(x,base+.7,z,.95,.06,.75,0xaecbe0,.9-R*.04,a+PI,0);B.boxC(x,base+.74,z,.82,.02,.62,0x6a95b8,.9-R*.04,a+PI,0);}
    shed(4.4,-4.2);B.box(-4.4,base,-4.2,1.6,1.1,.9,0xd0d1cc);G.box(-4.4,base+.8,-3.73,.9,.14,.03,0x7ff0ff);}
  else{row(-4.8,-1.2,1.8,4);row(-4.8,-1.2,3.5,4);row(-4.8,-1.2,-.2,4);
    shed(-3.8,-3.4);B.box(-1.4,base,-3.4,1.5,.9,.8,0x7aa6c0);B.box(.3,base,-3.4,1.5,.9,.8,0x7aa6c0);G.box(-1.4,base+.7,-3.0,.7,.1,.03,0x7fffa0);G.box(.3,base+.7,-3.0,.7,.1,.03,0x7fffa0);
    for(const [tx,tz,ph] of [[3.2,-1.6,0],[3.0,2.6,1.4]]){B.cyl(tx,base,tz,.3,7.4,0xe8eaec,10,.55);B.box(tx,base+7.3,tz,.55,.5,1.1,0xe8eaec);
      const bl=K.sub();bl.sph(0,0,0,.2,.2,.3,0xe8eaec,0);for(let k=0;k<3;k++){const a=k/3*TAU+ph;bl.beam(0,0,0,Math.sin(a)*3.4,Math.cos(a)*3.4,0,.18,0xf2f4f6,.04);}
      K.anim(bl,'spin',tx,base+7.3,tz+.62,{axis:'z',speed:1.1+ph*.1});G.sph(tx,base+7.85,tz,.07,.07,.07,0xff3a2a,0);}
    fence(-5.2,-.5,-4.6,4.4);}
  return {name:['Solar Farm','Solar Tower Plant','Wind & Solar Park'][vi]};}});

// ================================================================ AGE 7 - FUTURISTIC
defBuilding({type:'vertical_farm',age:7,name:'Vertical Farm',desc:'Stacked gardens under violet grow-lights feed the whole valley.',variants:['Glass Stack','Green Silo','Terraced Farm'],r:5.6,joy:0,
gen:(b,c,K,vi)=>{const {B,F,rng}=K;const base=BH.pad(K,4.5,4.5);
  const crops=(x,y,z,w,d,n)=>{for(let i=0;i<n;i++){const px=x-w/2+(i+.5)*w/n;B.box(px,y,z,w/n*.8,.12+(i%3)*.05,d,K.pick([0x5aa84f,0x6bb05a,0x3f8a44,0x8ac85a]));}};
  const vturb=(x,y,z)=>{B.cyl(x,y,z,.05,.8,0xd9e3ea,5);const t=K.sub();for(let k=0;k<3;k++){const a=k/3*TAU;t.box(Math.sin(a)*.22,0,Math.cos(a)*.22,.05,.9,.14,0xeef3f6,a);}K.anim(t,'spin',x,y+.1,z,{axis:'y',speed:2.2});};
  B.cyl(0,base,3.0,1.2,.1,0x7fb86a,12);B.box(0,base,3.4,3.4,.06,1.2,0x8ac85a);for(let i=0;i<3;i++)tree(K,-1+i,base,3.4,.6);
  if(vi===0){let y=base+.1;const tiers=[[6.2,4.4,0],[5.4,3.8,.3],[4.6,3.4,-.2],[3.8,3.0,.2]];
    for(let t=0;t<4;t++){const [w,d,ox]=tiers[t],H=2.5;B.box(ox,y,-.4,w,H,d,PEARL);
      for(const s of [1,-1]){B.box(ox,y+.35,-.4+s*(d/2+.03),w*.92,H-.7,.06,0x2f5a5a);F.box(ox,y+.5,-.4+s*(d/2+.07),w*.86,.14,.04,0xc070ff);F.box(ox,y+H-.6,-.4+s*(d/2+.07),w*.86,.14,.04,0xc070ff);
        crops(ox,y+.55,-.4+s*(d/2+.1),w*.84,.18,9);crops(ox,y+1.25,-.4+s*(d/2+.1),w*.84,.18,9);
        B.box(ox+s*(w/2+.03),y+.35,-.4,.06,H-.7,d*.92,0x2f5a5a);F.box(ox+s*(w/2+.07),y+.5,-.4,.04,.14,d*.86,0xc070ff);crops(ox+s*(w/2+.1),y+.9,-.4,.18,d*.8,6);}
      B.box(ox,y+H,-.4,w+.4,.14,d+.4,TEAL);
      if(t<3){const nw=tiers[t+1][0];B.box(ox+(w-nw)/4,y+H+.14,-.4+d/2-.4,w*.4,.1,.5,0x4f9a4a);for(let i=0;i<4;i++)tree(K,ox-w/2+.6+i*.6,y+H+.14,-.4+d/2-.2,.6);}
      y+=H+.14;}
    B.box(-.3,y,-.4,3.8,.14,3.0,0xdfe6ee);for(let i=0;i<3;i++)vturb(-1.2+i*1.2,y+.14,-.4);B.sph(1.4,y+.5,.8,.5,.5,.5,0xdfe6ee,1);B.cyl(1.4,y,.8,.5,.2,0xaab6c2,8);
    F.box(0,base+.4,-.4+2.23,3,.12,.04,0x7ff0ff);}
  else if(vi===1){const R=2.4,H=11.6;B.cyl(0,base,-.4,R+.5,.6,0xdfe6ee,16);B.cyl(0,base+.6,-.4,R,H,PEARL,16,.9);
    for(let t=0;t<4;t++){const y=base+1.3+t*2.7,rr=R*(1-t*.017)+.55;B.cyl(0,y,-.4,rr,.18,TEAL,16);B.cyl(0,y+.18,-.4,rr-.04,.14,0x4f9a4a,16);
      for(let k=0;k<16;k++){const a=k/16*TAU+t;if(k%2)tree(K,Math.sin(a)*(rr-.18),y+.3,-.4+Math.cos(a)*(rr-.18),.38);else B.box(Math.sin(a)*(rr-.18),y+.3,-.4+Math.cos(a)*(rr-.18),.34,.2,.34,K.pick([0x6bb05a,0x8ac85a,0x3f8a44]),a);}
      for(let k=0;k<8;k++){const a=k/8*TAU+t*.4;B.box(Math.sin(a)*(R*.95),y+.5,-.4+Math.cos(a)*(R*.95),.5,1.3,.05,0x2f5a5a,a);F.box(Math.sin(a)*(R*.97+.04),y+1.5,-.4+Math.cos(a)*(R*.97+.04),.5,.1,.04,0xc070ff,a);}}
    B.cyl(0,base+12.2,-.4,R*.85,.3,TEAL,16);B.sph(0,base+12.5,-.4,1.6,.9,1.6,0xdfe6ee,1);
    const rg=K.sub();for(let k=0;k<20;k++){const a=k/20*TAU;rg.box(Math.sin(a)*3.1,0,Math.cos(a)*3.1,.55,.1,.2,k%2?0x7ff0ff:0xeef3f6,a);}K.anim(rg,'spin',0,base+10.4,-.4,{axis:'y',speed:.5});
    F.box(0,base+13.2,-.4,.1,.8,.1,0x7ff0ff);for(let k=0;k<4;k++)B.cyl(Math.sin(k*1.57)*3.2,base,-.4+Math.cos(k*1.57)*3.2,.2,.8,0x7fa7b8,8);}
  else{let y=base+.1;const n=5;for(let t=0;t<n;t++){const w=7.8-t*1.35,d=5.4-t*.5,H=1.9,z=-.4-t*.4;B.box(0,y,z,w,H,d,PEARL);
      B.box(0,y+.3,z+d/2+.03,w*.92,H-.6,.06,0x2f5a5a);F.box(0,y+H-.5,z+d/2+.07,w*.86,.12,.04,0xc070ff);F.box(0,y+.4,z+d/2+.07,w*.86,.1,.04,0x7ff0ff);
      for(let i=0;i<7;i++)B.box(-w*.42+i*w*.14,y+.5,z+d/2+.1,w*.1,.22,.15,K.pick([0x5aa84f,0x6bb05a,0x3f8a44,0x8ac85a]));
      B.box(0,y+H,z+d/2-.55,w+.2,.14,1.2,0x7fb86a);B.box(0,y+H+.14,z+d/2-.55,w*.96,.1,.9,0x5aa84f);for(let i=0;i<Math.round(w/1.2);i++)tree(K,-w/2+.6+i*1.2,y+H+.2,z+d/2-.5,.55+rng()*.2);
      B.box(0,y+H,z-.6,w,.12,d-1.2,TEAL);y+=H+.12;}
    for(let i=0;i<2;i++){B.box(-1.8+i*3.6,y,-2.4,1.6,.1,.9,0x23406e);B.boxC(-1.8+i*3.6,y+.6,-2.4,1.8,.05,1.0,0x3a6aa8,.5,0,0);}
    for(let k=0;k<2;k++){const a=0;}
    const rg=K.sub();for(let k=0;k<18;k++){const a=k/18*TAU;rg.box(Math.sin(a)*2.4,0,Math.cos(a)*2.4,.5,.08,.18,k%2?0x7ff0ff:0xeef3f6,a);}K.anim(rg,'spin',0,y+1.2,-2.4,{axis:'y',speed:-.6});}
  return {name:['Glass Stack Farm','Green Silo Farm','Terraced Farm'][vi]};}});

defBuilding({type:'hyperloop_station',age:7,name:'Hyperloop Station',desc:'Pods hum through glowing tubes, crossing the land in minutes.',variants:['Tube Terminal','Arch Concourse','Ring Hub'],r:8,joy:0,
gen:(b,c,K,vi)=>{const {B,F,rng}=K;const base=BH.pad(K,6.4,5.2);
  const pod=(x,y,z,ax)=>{const l=ax==='x';B.put('cyl:12:1',x+(l?.95:0),y,z-(l?0:.95),.34,1.9,.34,0xeef3f6,l?0:PI/2,0,l?PI/2:0);B.sph(x+(l?.95:0),y,z+(l?0:.95),.34,.3,.34,0xeef3f6,1);B.sph(x-(l?.95:0),y,z-(l?0:.95),.34,.3,.34,0xeef3f6,1);F.box(x,y+.06,z+(l?.3:0),l?1.1:.06,.14,l?.06:1.1,0x7ff0ff);};
  const pyl=(x,z,h)=>{const g=K.gh(x,z);B.cyl(x,Math.min(g,base)-.3,z,.22,h+.3+Math.max(0,base-Math.min(g,base)),0xd9e3ea,8,.7);};
  if(vi===0){B.box(0,base,0,8,.3,4.4,0xdfe6ee);
    // tube
    const ty=base+1.7;B.put('cyl:14:1',5.5,ty,0,.95,11,.95,0xdfeaf0,0,0,PI/2);for(let i=-2;i<=2;i++){F.put('cyl:14:1',i*2.3+.05,ty,0,1.0,.1,1.0,0x7ff0ff,0,0,PI/2);}
    for(const x of [-5,5])pyl(x,0,ty-base);F.box(0,ty-.95,0,11,.06,.5,0x7ff0ff);
    // terminal capsule over the centre
    B.put('cyl:16:1',0,base+.3,0,3.6,.5,2.2,0xeef3f6);B.sph(0,base+.8,0,3.7,2.4,2.4,0xeef3f6,1);B.sph(0,base+.8,2.0,3.0,1.9,.9,0xc9d3dd,1);
    for(let i=0;i<7;i++)F.box(-2.4+i*.8,base+1.3,2.38,.5,.1,.03,0x7ff0ff);B.put('cyl:16:1',0,base+2.9,0,2.4,.2,1.6,TEAL);
    B.box(0,base+.3,2.2,1.6,1.5,.1,0x2f5a6a);F.box(0,base+.4,2.28,1.2,1.3,.04,0xcfe8ff);
    pod(-4.8,base+.6,0,'x');for(let i=0;i<2;i++)pod(1.6+i*0,ty-.55,0,'x');
    for(let i=0;i<5;i++){B.box(-4.6+i*.9,base+.3,2.8,.3,.9,.3,0xaab6c2);B.sph(-4.6+i*.9,base+1.35,2.8,.22,.22,.22,0x4f9a4a,0);}
    F.box(0,base+4.0,0,1.4,.14,.5,0x7ff0ff);}
  else if(vi===1){const n=9,L=11;
    for(let i=0;i<n;i++){const z=-L/2+i*L/(n-1),pts=[];for(let k=0;k<=8;k++){const a=-PI/2+k/8*PI;pts.push([Math.sin(a)*4.4,Math.cos(a)*4.2+base+.1]);}
      for(let k=0;k<8;k++)B.beam(pts[k][0],pts[k][1],z,pts[k+1][0],pts[k+1][1],z,.2,0xeef3f6,.5);B.sph(0,base+4.45,z,.1,.1,.1,0x7ff0ff,0);}
    B.box(0,base,0,9.2,.3,L+.4,0xdfe6ee);
    for(let i=0;i<n-1;i++){const z=-L/2+(i+.5)*L/(n-1);for(let k=0;k<8;k++){const a1=-PI/2+k/8*PI,a2=-PI/2+(k+1)/8*PI;if(k%2==0)B.quad([Math.sin(a1)*4.3,Math.cos(a1)*4.1+base+.1,z-.5],[Math.sin(a2)*4.3,Math.cos(a2)*4.1+base+.1,z-.5],[Math.sin(a2)*4.3,Math.cos(a2)*4.1+base+.1,z+.5],[Math.sin(a1)*4.3,Math.cos(a1)*4.1+base+.1,z+.5],0x9fd8d8);}}
    for(let k=0;k<8;k+=2){const a1=-PI/2+k/8*PI,a2=-PI/2+(k+1)/8*PI;F.box(Math.sin((a1+a2)/2)*4.45,Math.cos((a1+a2)/2)*4.25+base+.1,0,.05,.05,L,0x7ff0ff);}
    B.box(0,base+.3,0,8,.1,L-1,0x5a6670);for(const x of [-2,2])B.box(x,base+.4,0,.2,.05,L-1,0x7ff0ff);
    pod(0,base+.9,-1,'z');
    B.box(0,base,L/2+.2,3,3,.2,0x2f5a6a);F.box(0,base+.2,L/2+.3,2.4,2.6,.04,0xcfe8ff);
    B.put('cyl:14:1',0,base+1.4,-L/2-3,.95,3,.95,0xdfeaf0,PI/2,0,0);for(let i=0;i<2;i++)F.put('cyl:14:1',0,base+1.4,-L/2-.8-i*1.4,1.0,.1,1.0,0x7ff0ff,PI/2,0,0);
    for(const s of [-1,1])for(let k=0;k<3;k++)tree(K,s*4.6,base,-3+k*3,.7);}
  else{const R=5;B.cyl(0,base,0,R+.6,.4,0xdfe6ee,24);B.cyl(0,base+.4,0,R*.62,2.4,0xeef3f6,18);B.cyl(0,base+2.8,0,R*.7,.3,TEAL,18);
    for(let k=0;k<18;k++){const a=k/18*TAU;B.cyl(Math.sin(a)*R*.62,base+.4,Math.cos(a)*R*.62,.14,2.4,0xaab6c2,5);F.box(Math.sin(a)*(R*.62+.2),base+1.4,Math.cos(a)*(R*.62+.2),.5,1.2,.05,0xcfe8ff,a);}
    B.sph(0,base+3.1,0,R*.45,1.1,R*.45,0xdfe6ee,1);F.cyl(0,base+3.9,0,.6,.1,0x7ff0ff,10);
    const rg=K.sub();for(let k=0;k<24;k++){const a=k/24*TAU;rg.box(Math.sin(a)*(R+.4),0,Math.cos(a)*(R+.4),.9,.2,.25,k%3?0xeef3f6:0x7ff0ff,a);}K.anim(rg,'spin',0,base+5.6,0,{axis:'y',speed:.35});
    for(let k=0;k<3;k++){const a=k/3*TAU+PI/6,x=Math.sin(a),z=Math.cos(a),h=2.6+k*.3;
      B.beam(x*(R+.8),base+h,z*(R+.8),x*(R+3.2),base+h,z*(R+3.2),1.1,0xdfeaf0,1.1);
      B.beam(x*R*.62,base+2.6,z*R*.62,x*(R+1),base+h,z*(R+1),.4,0xdfeaf0,.4);
      F.beam(x*(R+1),base+h-.6,z*(R+1),x*(R+3.2),base+h-.6,z*(R+3.2),.3,0x7ff0ff,.08);
      pyl(x*(R+2.4),z*(R+2.4),h-.6);}
    for(let k=0;k<6;k++){const a=k/6*TAU+.5;tree(K,Math.sin(a)*(R+.2),base+.4,Math.cos(a)*(R+.2),.6);}}
  return {name:['Hyperloop Terminal','Hyperloop Concourse','Hyperloop Hub'][vi]};}});

defBuilding({type:'holo_theatre',age:7,name:'Holo Theatre',desc:'Light itself is the actor here; whole worlds bloom in the dark.',variants:['Projection Dome','Open Amphitheatre','Prism Hall'],r:6.4,joy:3,
gen:(b,c,K,vi)=>{const {B,F,rng}=K;const base=BH.pad(K,5,5);
  const orb=(x,y,z,s,col)=>{F.sph(x,y,z,s,s,s,col||0xffffff,1);F.sph(x,y,z,s*.6,s*.6,s*.6,0xffffff,1);};
  const spinRing=(x,y,z,R,n,sp,col)=>{const r=K.sub();for(let k=0;k<n;k++){const a=k/n*TAU;r.box(Math.sin(a)*R,0,Math.cos(a)*R,R*.35,.1,.2,k%2?col||0x7ff0ff:0xeef3f6,a);}K.anim(r,'spin',x,y,z,{axis:'y',speed:sp});};
  if(vi===0){B.cyl(0,base,0,4.4,.5,0xdfe6ee,20);B.sph(0,base+.5,0,3.9,3.5,3.9,0xeef3f6,2);
    for(let k=0;k<10;k++){const a=k/10*TAU;B.beam(0,base+4.0,0,Math.sin(a)*3.88,base+.55,Math.cos(a)*3.88,.1,TEAL,.1);}
    B.box(0,base+.5,3.5,2.4,1.9,.9,0xdfe6ee);B.box(0,base+.5,4.0,1.6,1.6,.1,0x2f5a6a);F.box(0,base+.6,4.06,1.2,1.4,.04,0xcfe8ff);F.box(0,base+2.4,3.5,2.4,.18,.9,0x7ff0ff);
    for(let k=0;k<5;k++){const a=-.9+k*.45;F.box(Math.sin(a)*3.9,base+.9,Math.cos(a)*3.9,.3,.9,.05,0x7ff0ff,a);}
    B.cyl(0,base+4.0,0,.35,1.0,0xdfe6ee,8);F.cyl(0,base+5.0,0,.12,3.4,0x7ff0ff,6);orb(0,base+8.8,0,.7,0xc070ff);
    spinRing(0,base+6.0,0,2.0,16,.9,0xc070ff);spinRing(0,base+7.2,0,1.4,12,-1.3,0x7ff0ff);
    for(let k=0;k<4;k++){const a=k*1.57+.8;B.cyl(Math.sin(a)*4.6,base,Math.cos(a)*4.6,.12,1.6,0xaab6c2,6);F.sph(Math.sin(a)*4.6,base+1.7,Math.cos(a)*4.6,.14,.14,.14,0x7ff0ff,0);}}
  else if(vi===1){for(let t=0;t<5;t++){B.cyl(0,base+t*.42,0,4.8-t*.6,.42,[0xdfe6ee,0xc9d6de][t&1],20);}
    for(let t=0;t<5;t++)F.cyl(0,base+t*.42+.4,0,4.8-t*.6+.02,.03,0x7ff0ff,20);
    B.cyl(0,base+2.1,0,2.4,.3,0x2f5a6a,20);F.cyl(0,base+2.4,0,1.9,.04,0xc070ff,20);
    for(let k=0;k<8;k++){const a=k/8*TAU;B.cyl(Math.sin(a)*5.3,base,Math.cos(a)*5.3,.14,5.4,0xeef3f6,6);}
    const cr=K.sub();for(let k=0;k<24;k++){const a=k/24*TAU;cr.box(Math.sin(a)*5.3,0,Math.cos(a)*5.3,.9,.18,.35,k%3?0xeef3f6:0x7ff0ff,a);}K.anim(cr,'spin',0,base+5.4,0,{axis:'y',speed:.25});
    // hologram: a dancer of light
    F.sph(0,base+3.2,0,.35,.5,.35,0xc070ff,1);F.sph(0,base+4.0,0,.22,.22,.22,0xffffff,1);F.box(0,base+3.4,0,1.4,.07,.07,0x7ff0ff);F.cyl(0,base+2.4,0,.7,.04,0x7ff0ff,10);
    for(let k=0;k<7;k++){const a=k/7*TAU;F.sph(Math.sin(a)*1.6,base+3.4+Math.sin(a*2)*.6,Math.cos(a)*1.6,.1,.1,.1,[0x7ff0ff,0xc070ff,0xffd24a][k%3],0);}
    for(let i=0;i<3;i++){B.sph(4.9*Math.sin(i*2.1+.5),base+.1,4.9*Math.cos(i*2.1+.5),.35,.3,.35,K.pick(LEAF),0);}}
  else{// prism hall: leaning slabs around a glowing screen
    B.box(0,base,0,9,.3,7,0xdfe6ee);
    B.boxC(-2.7,base+3.0,-.5,.5,6.0,5.8,0xeef3f6,0,0,-.22);B.boxC(2.7,base+3.0,-.5,.5,6.0,5.8,0xeef3f6,0,0,.22);
    B.box(0,base+.3,-3.1,6.6,6.0,.5,0xdfe6ee);B.wedge(0,base+6.0,-.9,6.6,1.2,5,0xc9d6de);
    B.box(0,base+.4,-2.8,5.4,4.5,.08,0x23323f);F.box(0,base+.6,-2.74,5.0,4.0,.04,0x1b6a8a);
    for(let k=0;k<6;k++)F.box(-2.1+k*.84,base+.8+(k*53%7)*.4,-2.7,.5,.6+(k*31%5)*.35,.04,[0x7ff0ff,0xc070ff,0xffd24a][k%3]);
    B.box(0,base+.3,2.5,3.4,3.0,.2,0x2f5a6a);F.box(0,base+.4,2.62,3.0,2.7,.04,0xcfe8ff);F.box(0,base+3.3,2.6,3.4,.2,.05,0x7ff0ff);
    B.boxC(0,base+3.8,3.0,3.8,.14,1.6,0xeef3f6,-.2,0,0);for(const s of [-1,1])B.cyl(s*1.7,base,3.3,.08,3.4,0xaab6c2,5);
    for(let i=0;i<3;i++){const x=-3.4+i*3.4;F.cyl(x,base+.3,3.9,.4,.05,0x7ff0ff,10);}
    F.box(0,base+7.6,-.9,.1,2.6,.1,0x7ff0ff);orb(0,base+9.4,-.9,.55,0xc070ff);spinRing(0,base+7.9,-.9,1.6,14,1.1,0xc070ff);
    for(let k=0;k<4;k++)F.box(-4.7+k*3.13,base+.2,4.2,.5,.05,.5,0x7ff0ff);}
  return {name:['Holo Dome','Holo Amphitheatre','Prism Theatre'][vi]};}});

defBuilding({type:'data_spire',age:7,name:'Data Spire',desc:'The valley’s memory hums inside, cooled by the wind.',variants:['Needle Spire','Server Stack','Helix Tower'],r:5,joy:0,
gen:(b,c,K,vi)=>{const {B,F,rng}=K;const base=BH.pad(K,4,4);
  const spinRing=(x,y,z,R,n,sp,col)=>{const r=K.sub();for(let k=0;k<n;k++){const a=k/n*TAU;r.box(Math.sin(a)*R,0,Math.cos(a)*R,R*.45,.1,.14,k%2?col||0x7ff0ff:0xeef3f6,a);}K.anim(r,'spin',x,y,z,{axis:'y',speed:sp});};
  B.cyl(0,base,0,3.2,.3,0xdfe6ee,18);for(let k=0;k<6;k++){const a=k/6*TAU;B.box(Math.sin(a)*2.6,base+.3,Math.cos(a)*2.6,.5,.8,.5,0xaab6c2,a);F.box(Math.sin(a)*2.6,base+.8,Math.cos(a)*2.6+0,.3,.04,.52,0x7ff0ff,a);}
  if(vi===0){B.cyl(0,base+.3,0,1.2,12,PEARL,14,.45);for(let t=0;t<5;t++){const y=base+2.4+t*2.4;B.cyl(0,y,0,1.2*(1-(y-base-.3)/12*.55)+.5,.22,TEAL,14);}
    for(let k=0;k<4;k++){const a=k/4*TAU+.4;F.box(Math.sin(a)*.8,base+3,Math.cos(a)*.8,.08,8,.08,0x7ff0ff,a);B.box(Math.sin(a)*.74,base+3,Math.cos(a)*.74,.2,8,.2,0xaab6c2,a);}
    B.cyl(0,base+12.3,0,.5,.6,0xdfe6ee,10);B.cyl(0,base+12.9,0,.08,4.2,0xaab6c2,5);F.sph(0,base+17.2,0,.2,.2,.2,0xff4a7a,1);
    spinRing(0,base+8.2,0,2.0,18,.8);spinRing(0,base+10.6,0,1.5,14,-1.2,0xc070ff);
    for(let k=0;k<3;k++){const a=k/3*TAU;F.sph(Math.sin(a)*3.2,base+.4,Math.cos(a)*3.2,.18,.18,.18,0x7ff0ff,0);}}
  else if(vi===1){let y=base+.3,w=4.2;for(let t=0;t<6;t++){const ry=t*.32,h=1.9;B.box(0,y,0,w,h,w,t%2?0xdfe6ee:0xc9d6de,ry);
      for(let k=0;k<4;k++){const a=ry+k*PI/2,d=w/2+.04;for(let s=0;s<3;s++)F.box(Math.sin(a)*d+Math.cos(a)*(s-1)*.0,y+.35+s*.45,Math.cos(a)*d,w*.78,.1,.05,s===1?0xc070ff:0x7ff0ff,a);}
      for(let k=0;k<4;k++){const a=ry+k*PI/2+PI/4,d=w*.7;B.box(Math.sin(a)*d,y,Math.cos(a)*d,.14,h,.14,0x8a98a4);}
      B.box(0,y+h,0,w+.3,.12,w+.3,TEAL,ry);y+=h+.12;w-=.4;}
    // cooling fins and vents on top
    for(let k=0;k<6;k++)B.box(-1+k*.4,y,0,.1,.9,2.0,0xaab6c2);const fan=K.sub();for(let k=0;k<4;k++){const a=k*PI/2;fan.box(Math.sin(a)*.3,0,Math.cos(a)*.3,.18,.04,.5,0xeef3f6,a);}K.anim(fan,'spin',0,y+.2,1.3,{axis:'y',speed:5});B.cyl(0,y,1.3,.5,.12,0x8a98a4,10);
    B.cyl(0,y+.9,0,.05,2.4,0xaab6c2,5);F.sph(0,y+3.4,0,.15,.15,.15,0xff4a7a,1);
    for(const s of [-1,1]){B.sph(s*3.6,base+1.0,2.4,.9,1.1,.9,0xdfe6ee,1);F.box(s*3.6,base+1.2,3.3,.5,.08,.04,0x7ff0ff);B.cyl(s*3.6,base+.2,2.4,.9,.3,0xaab6c2,10);}}
  else{B.cyl(0,base+.3,0,.6,13,0xdfe6ee,10);
    for(let k=0;k<2;k++)for(let i=0;i<26;i++){const t=i/25,a=t*TAU*3+k*PI,R=1.5-t*.35,y=base+.8+t*11.8;B.sph(Math.sin(a)*R,y,Math.cos(a)*R,.2,.2,.2,k?0xeef3f6:TEAL,0);
      if(i%3==0)F.sph(Math.sin(a)*R,y,Math.cos(a)*R,.1,.1,.1,k?0x7ff0ff:0xc070ff,0);}
    for(let i=0;i<13;i++){const t=i/12,a=t*TAU*3,R=1.5-t*.35,y=base+.8+t*11.8;B.beam(Math.sin(a)*R,y,Math.cos(a)*R,Math.sin(a+PI)*R,y+(i%2?.04:-.04),Math.cos(a+PI)*R,.05,0x7ff0ff,.05);}
    B.sph(0,base+13.2,0,.9,.6,.9,0xeef3f6,1);F.sph(0,base+13.2,0,.4,.4,.4,0xc070ff,1);B.cyl(0,base+13.7,0,.06,2.2,0xaab6c2,5);F.sph(0,base+16,0,.14,.14,.14,0xff4a7a,1);
    spinRing(0,base+14,0,1.6,14,1.0,0xc070ff);spinRing(0,base+6,0,2.2,18,-.5);}
  return {name:['Needle Data Spire','Server Stack Spire','Helix Data Tower'][vi]};}});

defBuilding({type:'sky_garden',age:7,name:'Sky Garden',desc:'A park lifted into the air, where the city comes to breathe.',variants:['Terrace Park','Floating Pods','Glass Conservatory'],r:6.6,joy:3,
gen:(b,c,K,vi)=>{const {B,F,rng}=K;const base=BH.pad(K,5.4,5.4);
  const spinRing=(x,y,z,R,n,sp,col)=>{const r=K.sub();for(let k=0;k<n;k++){const a=k/n*TAU;r.box(Math.sin(a)*R,0,Math.cos(a)*R,R*.4,.1,.18,k%2?col||0x7ff0ff:0xeef3f6,a);}K.anim(r,'spin',x,y,z,{axis:'y',speed:sp});};
  const bush=(x,y,z,s)=>B.sph(x,y+.2*s,z,.4*s,.28*s,.4*s,K.pick(LEAF),0);
  if(vi===0){const rs=[4.9,3.9,2.9,1.9];let y=base;B.cyl(0,base,0,5,.7,0xdfe6ee,22);y+=.7;
    for(let t=0;t<4;t++){const R=rs[t];B.cyl(0,y,0,R,.5,t&1?0xdfe6ee:0xc9d6de,22);B.cyl(0,y+.5,0,R-.12,.1,0x5aa84f,22);F.cyl(0,y+.5,0,R+.01,.04,0x7ff0ff,22);
      for(let k=0;k<Math.round(R*3.2);k++){const a=k/Math.round(R*3.2)*TAU+t*.5;const rr=R-.55-(k%2)*.5;if(rng()<.5)tree(K,Math.sin(a)*rr,y+.6,Math.cos(a)*rr,.7+rng()*.5);else bush(Math.sin(a)*rr,y+.6,Math.cos(a)*rr,1);}
      y+=.6+.5;if(t==1){B.cyl(1,y-.45,1.2,1.0,.06,0x2fb8c8,14);}}
    B.cyl(0,y-.4,0,.3,.8,0x6a4a2e,6);B.sph(0,y+.8,0,1.2,1.1,1.2,0x4f9a4a,1);B.sph(.5,y+1.4,.3,.8,.7,.8,0x5aa84f,1);
    for(let k=0;k<12;k++){const a=k/12*TAU;B.box(Math.sin(a)*3.3,base+.7,Math.cos(a)*3.3,.2,.5,.2,0xaab6c2,a);}
    spinRing(0,y+3.0,0,2.6,18,.5);F.sph(0,y+3.2,0,.14,.14,.14,0xffffff,0);
    for(let k=0;k<5;k++){const a=-.6+k*.3;B.box(Math.sin(a)*5.1,base+.1,Math.cos(a)*5.1,.7,.16,.5,0xdfe6ee,a);}}
  else if(vi===1){B.cyl(0,base,0,2.2,.5,0xdfe6ee,14);B.cyl(0,base+.5,0,.55,10.5,0xeef3f6,10,.7);F.cyl(0,base+.6,0,.58,.1,0x7ff0ff,10);
    const pods=[[1.6,2.4,1.0,.0],[-1.7,4.6,.9,1.0],[1.3,6.8,1.1,2.1],[-1.4,9.0,.9,3.4]];let k=0;
    for(const [ox,h,s,ph] of pods){const z=(k%2?-1:1)*1.5;const x=ox*1.8;
      B.beam(0,base+h,0,x,base+h,z,.22,0xdfe6ee,.22);B.put('cyl:16:1',x,base+h,z,1.6*s,.4,1.6*s,0xeef3f6);B.sph(x,base+h+.1,z,1.6*s,.35,1.6*s,0xdfe6ee,1);
      B.cyl(x,base+h+.4,z,1.4*s,.12,0x5aa84f,16);F.cyl(x,base+h-.02,z,1.62*s,.05,0x7ff0ff,16);B.box(x,base+h+.5,z,.0,.0,.0,0xffffff);
      for(let q=0;q<5;q++){const a=q/5*TAU+ph;tree(K,x+Math.sin(a)*1.0*s,base+h+.5,z+Math.cos(a)*1.0*s,.65);}
      B.cyl(x,base+h-.9,z,.45,.9,0xaab6c2,8,.4);F.sph(x,base+h-1.0,z,.2,.2,.2,0x7ff0ff,0);
      spinRing(x,base+h-.3,z,1.9*s,14,.6+.2*k,k&1?0xc070ff:0x7ff0ff);k++;}
    F.sph(0,base+11.5,0,.3,.3,.3,0xffffff,1);
    for(let q=0;q<4;q++){const a=q*1.57+.4;B.sph(Math.sin(a)*3.2,base+.5,Math.cos(a)*3.2,.5,.4,.5,K.pick(LEAF),0);}}
  else{B.cyl(0,base,0,5,.6,0xdfe6ee,22);B.cyl(0,base+.6,0,4.5,.15,0x6a8a5a,22);F.cyl(0,base+.7,0,4.5,.04,0x7ff0ff,22);
    const R=4.1,cy=base+.7;
    for(let m=0;m<10;m++){const az=m/10*TAU;let prev=null;for(let k=0;k<=7;k++){const e=k/7*(PI/2)*.98,p=[Math.sin(az)*Math.cos(e)*R,cy+Math.sin(e)*R*.95,Math.cos(az)*Math.cos(e)*R];if(prev)B.beam(prev[0],prev[1],prev[2],p[0],p[1],p[2],.09,0xeef3f6,.09);prev=p;}}
    for(let k=1;k<6;k++){const e=k/7*(PI/2)*.98,rr=Math.cos(e)*R,y=cy+Math.sin(e)*R*.95;for(let m=0;m<14;m++){const a1=m/14*TAU,a2=(m+1)/14*TAU;B.beam(Math.sin(a1)*rr,y,Math.cos(a1)*rr,Math.sin(a2)*rr,y,Math.cos(a2)*rr,.07,0xeef3f6,.07);}}
    for(let m=0;m<10;m++){const az=m/10*TAU+.3;if(m%3==0)F.box(Math.sin(az)*3.5,cy+2.2+(m%2),Math.cos(az)*3.5,.3,.5,.3,0x7ff0ff);}
    // plants inside
    B.cyl(0,cy,0,.28,3.6,0x6a4a2e,7,.6);B.sph(0,cy+4.3,0,1.8,1.2,1.8,0x4f9a4a,1);B.sph(.8,cy+3.7,.5,1.1,.8,1.1,0x5aa84f,1);
    for(let q=0;q<9;q++){const a=q/9*TAU+.3,R2=2.4+(q%2)*.6;if(q%3)bush(Math.sin(a)*R2,cy,Math.cos(a)*R2,1.4);else tree(K,Math.sin(a)*R2,cy,Math.cos(a)*R2,1.3);}
    B.cyl(1.4,cy,-1.4,1.0,.08,0x2fb8c8,12);
    B.box(0,base,4.6,1.8,1.9,.35,0x2f5a6a);F.box(0,base+.15,4.8,1.4,1.6,.04,0xcfe8ff);
    B.sph(0,cy+4.25*1.0+.55,0,.001,.001,.001,0xffffff,0);spinRing(0,cy+5.0,0,2.2,16,.4,0xc070ff);
    for(let q=0;q<4;q++){const a=q*1.57+.8;B.box(Math.sin(a)*5.1,base+.1,Math.cos(a)*5.1,.9,.4,.5,0xaab6c2,a);bush(Math.sin(a)*5.1,base+.5,Math.cos(a)*5.1,.8);}}
  return {name:['Terrace Sky Garden','Floating Pod Garden','Conservatory Garden'][vi]};}});
}
