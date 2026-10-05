'use strict';
// new buildings (see bdefs.js for defBuilding): Age 0 totem, burial_mound, flint_works, drying_rack, storage_pit; Age 1 granary, kiln, longhouse, shrine, bronze_foundry
{
const COPPER=0xb87333,VERD=0x4f8a76,CLAY=[0xc7a37a,0xb9916a,0xd0ae86],TURF=0x5a7a3a;
// ---- helpers (all heights are absolute: built from K.gh / K.rect)
const earthPad=(K,R,col,seg=14)=>{const [mn,mx]=K.rect(R,R);const base=mx+.12;K.B.cyl(0,mn-.6,0,R+.2,base-mn+.6,col||TURF,seg,.97);return base;};
const stonePad=(K,R,seg=14)=>earthPad(K,R,COL.stoneD,seg);
const post=(K,x,z,h,t,col)=>{const g=K.gh(x,z);K.B.box(x,g-.35,z,t,h+.35,t,col||COL.woodD);return g+h;};
const stone=(K,x,z,s,col)=>{const g=K.gh(x,z);K.B.box(x,g-.12,z,s,s*.75,s*.9,col||K.pick(STONE),K.rng()*PI);};
const lx=(B,cx,y,z,r,len,col,seg)=>B.hcyl(cx-len/2,y,z,r,len,col,'x',seg);
const lz=(B,x,y,cz,r,len,col,seg)=>B.hcyl(x,y,cz+len/2,r,len,col,'z',seg);
const dbl=(B,a,b,c,d,col,m)=>{B.quad(a,b,c,d,col,m);B.quad(a,d,c,b,col,m);};
const pot=(K,x,y,z,r,col)=>{const B=K.B;B.cyl(x,y,z,r,r*1.5,col||K.pick(CLAY),8,.6);B.cyl(x,y+r*1.45,z,r*.62,r*.2,COL.dark,8);};
const sack=(K,x,y,z,col,ry)=>{K.B.box(x,y,z,.5,.42,.34,col||COL.canvas,ry||0);K.B.box(x,y+.4,z,.26,.1,.2,COL.hay,ry||0);};
const logs=(K,x,z,n,ry,len=1.6)=>{const B=K.B,g=K.gh(x,z);const c=Math.cos(ry),s=Math.sin(ry);let k=0;for(let r=0;r<3;r++)for(let i=0;i<n-r;i++){const o=(i-(n-r-1)/2)*.36;const px=x+c*o,pz=z-s*o;B.hcyl(px-Math.sin(ry)*len/2,g+.17+r*.3,pz-Math.cos(ry)*len/2,.17,len,K.pick([0x8a6440,0x7a5632]),'z',6);k++;}};
// a hide-covered cone with a dark door arch (tipi)
const hideCone=(K,x,g,z,r,h,col,ry=0)=>{const B=K.B;B.mt=9;B.cone(x,g-.05,z,r,h,col,9,ry);B.mt=null;};
const poleFan=(K,x,g,z,r,top,n,ry0=0,t=.07,col)=>{for(let i=0;i<n;i++){const a=ry0+i/n*TAU;K.B.beam(x+Math.sin(a)*r,K.gh(x+Math.sin(a)*r,z+Math.cos(a)*r)-.05,z+Math.cos(a)*r,x+Math.sin(a)*.08,top,z+Math.cos(a)*.08,t,col||COL.woodD);}};
const hang=(K,x,y,z,len,col,w=.1,ry=0)=>K.B.box(x,y-len,z,w,len,.04,col,ry);

// ================================================================ AGE 0
defBuilding({type:'totem',age:0,name:'Totem Pole',desc:'A carved spirit pole the people gather round.',variants:['Bear','Eagle','Serpent'],r:1.9,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;const base=stonePad(K,1.1,12);
    for(let i=0;i<8;i++){const a=i/8*TAU+.2;stone(K,Math.sin(a)*1.45,Math.cos(a)*1.45,.4+rng()*.2);}
    const W=COL.wood,WD=COL.woodD,WL=COL.woodL,RED=BANNER[0],BK=COL.dark,WH=PLASTER[0],TEAL=VERD,OC=COL.gold;
    const face=(y,s,col)=>{B.box(0,y+s*.2,.45*s,.9*s,.14*s,.1,WH);B.box(-.26*s,y+s*.45,.46*s,.22*s,.2*s,.07,WH);B.box(.26*s,y+s*.45,.46*s,.22*s,.2*s,.07,WH);
      B.box(-.26*s,y+s*.5,.5*s,.1*s,.1*s,.05,BK);B.box(.26*s,y+s*.5,.5*s,.1*s,.1*s,.05,BK);B.box(0,y+s*.28,.52*s,.3*s,.12*s,.05,RED);};
    if(vi===0){ // bear: stacked blocky beasts
      B.cyl(0,base,0,.36,4.0,W,8);
      B.box(0,base+.1,0,1.0,1.15,.9,0x6b4a2e);for(const s of [-1,1]){B.box(s*.62,base+.25,.1,.24,.85,.34,WD);for(let k=-1;k<=1;k++)B.box(s*.62+k*.07,base+.2,.3,.05,.12,.06,WH);}
      B.box(0,base+.3,.48,.6,.16,.06,RED);
      B.box(0,base+1.3,0,1.1,1.0,1.0,0x7a5632);for(const s of [-1,1])B.box(s*.52,base+2.28,0,.26,.28,.22,0x6b4a2e);
      B.box(0,base+1.45,.62,.55,.42,.5,WL);B.box(0,base+1.78,.88,.24,.16,.1,BK);B.box(0,base+1.5,.88,.42,.07,.06,RED);
      for(const s of [-1,1]){B.box(s*.3,base+1.95,.52,.24,.2,.06,WH);B.box(s*.3,base+2.0,.56,.1,.1,.05,BK);}
      B.box(0,base+2.4,0,.8,.8,.75,0x6b4a2e);face(base+2.4,.9);B.box(0,base+3.2,0,.9,.14,.8,RED);
      for(const s of [-1,0,1])B.beam(s*.2,base+3.3,0,s*.45,base+3.95,-.05,.06,PLASTER[1]);
      T.push('Bear spirit with white claws');}
    else if(vi===1){ // eagle: tall, wings spread
      B.cyl(0,base,0,.34,4.7,W,8);
      B.box(0,base+.05,0,.9,1.2,.8,WD);face(base+.1,1.15,0);B.box(0,base+.3,.49,.7,.1,.06,TEAL);
      B.box(0,base+1.3,0,1.0,.9,.85,W);for(const s of [-1,1]){B.boxC(s*.62,base+1.75,0,.22,1.05,.5,WH,0,0,s*.12);B.boxC(s*.64,base+1.75,0,.12,.9,.52,TEAL,0,0,s*.12);}
      B.box(0,base+2.3,0,.85,.8,.8,WD);B.box(0,base+2.35,.44,.6,.1,.06,RED);
      // eagle on top
      const ty=base+3.1;B.box(0,ty,0,.8,.95,.7,0x6b4a2e);B.box(0,ty+.6,.15,.55,.5,.55,PLASTER[1]);
      B.put('cone:6',0,ty+.65,.55,.15,.42,.15,OC,PI/2,0,0);B.box(-.17,ty+.78,.42,.1,.1,.05,BK);B.box(.17,ty+.78,.42,.1,.1,.05,BK);
      for(const s of [-1,1])for(let i=0;i<3;i++){B.boxC(s*(.85+i*.5),ty+.8-i*.18,-.08,.7,.15,.5-i*.07,[0x6b4a2e,RED,WH][i],0,0,s*(-.18-i*.1));}
      B.box(0,ty-.05,-.4,.35,.1,.7,RED);T.push('Eagle with outstretched wings');}
    else { // serpent: coil round the pole
      B.cyl(0,base,0,.3,4.4,WD,8);
      const N=26;for(let i=0;i<N;i++){const t=i/N,a=t*TAU*2.8,y=base+.2+t*3.5,rr=.5;
        B.sph(Math.sin(a)*rr,y,Math.cos(a)*rr,.34-.1*t,.27,.34-.1*t,i%4<2?TEAL:RED,1);}
      const hy=base+3.95;B.box(0,hy,0,.75,.55,.9,TEAL);B.box(0,hy+.5,.1,.6,.18,.7,RED);for(const s of [-1,1]){B.box(s*.3,hy+.58,.2,.16,.14,.06,WH);B.box(s*.12,hy-.2,.55,.07,.3,.06,WH);}
      B.box(0,hy+.12,.5,.08,.06,.5,RED);B.box(-.1,hy+.12,.95,.08,.06,.14,RED);B.box(.1,hy+.12,.95,.08,.06,.14,RED);
      for(let i=0;i<9;i++){const a=2.6+i*.35,rr=1.4+i*.1;B.sph(Math.sin(a)*rr,K.gh(Math.sin(a)*rr,Math.cos(a)*rr)+.05,Math.cos(a)*rr,.2-.012*i,.14,.2-.012*i,i%2?TEAL:OC,0);}
      T.push('Serpent coiling up the pole');}
    // offerings
    pot(K,.9,base,1.2,.22,CLAY[0]);K.smoke(.9,base+.6,1.2,.5);
    for(let i=0;i<3;i++){const x=-.9+i*.25,z=1.3;B.box(x,K.gh(x,z),z,.1,.22,.1,PLASTER[1]);}
    B.beam(.0,base+3.2,.0,.55,base+2.9,.55,.025,COL.beam);hang(K,.55,base+2.9,.55,.4,0xb0a07a,.12);
    return {r:1.9};}});

defBuilding({type:'burial_mound',age:0,name:'Burial Mound',desc:'Where the ancestors rest beneath turf and stone.',variants:['Round Barrow','Stone Cairn','Long Barrow'],r:4.2,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;
    if(vi===0){const [mn,mx]=K.rect(2.6,2.6);const R=2.7;B.cyl(0,mn-.6,0,R,mx-mn+.6,TURF,16,.95);
      B.sph(0,mx-.15,0,R*.96,2.1,R*.96,TURF,1);for(let i=0;i<10;i++){const a=i/10*TAU+.3;if(Math.abs(angDiff(a,0))<.5)continue;stone(K,Math.sin(a)*(R+.15),Math.cos(a)*(R+.15),.55,K.pick(STONE));}
      const gz=2.15,g=K.gh(0,gz);B.box(-.7,g-.1,gz,.5,1.5,.5,K.pick(STONE));B.box(.7,g-.1,gz,.5,1.5,.5,K.pick(STONE));B.box(0,g+1.4,gz,1.9,.4,.6,K.pick(STONE));B.box(0,g,gz-.05,.9,1.4,.3,COL.dark);
      stone(K,0,3.1,.9);B.box(1.9,K.gh(1.9,2.9),2.9,.45,1.6,.4,STONE[1]);B.box(-1.9,K.gh(-1.9,2.9),2.9,.45,1.3,.4,STONE[2]);
      pot(K,-.9,K.gh(-.9,3.0),3.0,.2,CLAY[1]);K.flame(.9,K.gh(.9,3.0),3.0,.5);K.smoke(.9,K.gh(.9,3)+.8,3,.6);
      for(let i=0;i<6;i++){const a=rng()*TAU,d=rng()*1.6;B.sph(Math.sin(a)*d,mx+1.7-d*.35,Math.cos(a)*d,.09,.09,.09,i%2?PLASTER[0]:COL.gold,0);}
      T.push('Earth heaped over a stone passage','Flowers left for the dead');}
    else if(vi===1){const R=2.5,base=stonePad(K,R,16);
      for(let L=0;L<5;L++){const n=Math.max(1,9-L*2),rr=2.1-L*.4;for(let i=0;i<n;i++){const a=i/n*TAU+L*.5;const s=.75-L*.06;
        B.box(Math.sin(a)*rr*(L===4?0:1),base+L*.52,Math.cos(a)*rr*(L===4?0:1),s,.55,s*.85,K.pick(STONE),a+rng());if(L===4)break;}}
      B.sph(0,base+2.15,0,.8,.55,.8,STONE[1],1);for(let i=0;i<4;i++){const a=i/4*TAU;B.sph(Math.sin(a)*.7,base+1.85,Math.cos(a)*.7,.55,.4,.55,K.pick(STONE),0);}
      B.beam(0,base+2.4,0,.0,base+4.0,0,.07,COL.woodD);B.box(-.35,base+3.55,0,.7,.08,.08,COL.woodD);B.box(0,base+3.85,.0,.3,.22,.2,PLASTER[0]);
      for(let i=0;i<14;i++){const a=i/14*TAU+.1;if(Math.abs(angDiff(a,0))<.3)continue;stone(K,Math.sin(a)*3.4,Math.cos(a)*3.4,.45+rng()*.25);}
      B.box(0,K.gh(0,3.2),3.2,1.3,.35,.8,STONE[3]);K.flame(-.3,K.gh(0,3.2)+.35,3.2,.45);K.smoke(-.3,K.gh(0,3.2)+1,3.2,.6);
      B.cyl(.6,K.gh(.6,3.1)+.35,3.1,.18,.12,COL.dark,6);
      T.push('Heaped field stones','A bone-topped marker');}
    else{const [mn,mx]=K.rect(1.9,4.2,0,-1.0);
      for(let i=0;i<7;i++){const z=-4.0+i*.95;B.cyl(0,mn-.6,z,1.85,mx-mn+.6,TURF,12,.95);B.sph(0,mx-.1,z,1.95,1.9-Math.abs(i-4)*.12,1.1,TURF,1);}
      // forecourt facade of slabs
      const zf=2.4;for(let i=-3;i<=3;i++){const x=i*.55,g=K.gh(x,zf),h=i===0?0:1.9-Math.abs(i)*.2;if(i===0)continue;B.box(x,g-.15,zf,.5,h+.15,.35,K.pick(STONE),rng()*.2-.1);}
      const g0=K.gh(0,zf);B.box(0,g0-.1,zf,.5,.0,.3,COL.dark);B.box(-.62,g0-.1,zf+.02,.22,1.6,.35,STONE[2]);B.box(.62,g0-.1,zf+.02,.22,1.6,.35,STONE[1]);B.box(0,g0+1.5,zf,1.5,.35,.5,STONE[0]);B.box(0,g0,zf-.1,.9,1.5,.2,COL.dark);
      for(const s of [-1,1]){const x=s*1.7,g=K.gh(x,3.3);B.cyl(x,g,3.3,.28,.4,COL.stoneD,6);K.flame(x,g+.4,3.3,.4);}
      K.smoke(0,K.gh(0,3.3)+1,3.4,.3);B.box(0,K.gh(0,3.6),3.6,1.4,.14,1.0,STONE[3]);
      T.push('Long earth barrow with a slab facade','Braziers at the forecourt');}
    return {};}});

defBuilding({type:'flint_works',age:0,name:'Flint Works',desc:'Tool-makers chip sharp edges from raw flint.',variants:['Knapper\'s Lean-to','Flint Pit','Heat Hearth'],r:3.2,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;const FL=[0xd6d2c4,0xa5a090,0x7a756c];
    const nodules=(x,z,n,sp)=>{for(let i=0;i<n;i++){const a=rng()*TAU,d=rng()*sp,xx=x+Math.sin(a)*d,zz=z+Math.cos(a)*d;B.box(xx,K.gh(xx,zz)-.05+(rng()*.1),zz,.2+rng()*.18,.16+rng()*.1,.2+rng()*.15,K.pick(FL),rng()*PI);}};
    if(vi===0){const base=earthPad(K,2.5,TURF,12);B.mt=9;
      for(const s of [-1,1]){B.beam(s*1.5,K.gh(s*1.5,.9)-.1,.9,s*1.5,base+2.2,.9,.12,COL.woodD);B.beam(s*1.5,K.gh(s*1.5,-1.0)-.1,-1.0,s*1.5,base+1.3,-1.0,.12,COL.woodD);B.beam(s*1.5,base+1.3,-1,s*1.5,base+2.2,.9,.08,COL.wood);}
      B.boxC(0,base+1.78,-.05,3.5,.12,2.2,0xc9a86a,-Math.atan(.9/2.0),0,0);B.mt=null;
      lx(B,0,base+2.2,.9,.08,3.4,COL.wood);lx(B,0,base+1.3,-1,.08,3.4,COL.wood);
      B.box(0,base,-1.05,3.1,1.3,.2,COL.plank);for(let i=0;i<5;i++)lx(B,0,base+.2+i*.25,-.93,.05,3.1,COL.woodL);
      for(let i=0;i<7;i++)B.box(-1.35+i*.45,base+1.28,-1.05,.1,.2,.2,COL.woodD);
      B.cyl(-.4,base,.1,.4,.5,COL.wood,8);nodules(-.4,.1,9,.5);for(const p of [[.3,.4],[.7,.0]])B.sph(p[0],base+.05,p[1],.12,.05,.1,FL[0],0);
      B.beam(-.2,base+.55,.1,.1,base+.9,.4,.06,PLASTER[1]);B.box(1.0,base,.2,.5,.3,.45,STONE[0]);nodules(1.1,-.3,6,.4);
      nodules(-1.9,1.6,10,.5);B.box(1.9,base,1.4,.7,.5,.6,COL.plank);sack(K,1.9,base+.5,1.4,COL.canvas);
      hang(K,-1.2,base+2.2,.9,.55,COL.plank,.28);hang(K,1.0,base+2.2,.9,.45,0x6a5a40,.2);
      K.flame(-1.9,base,-.3,.5);K.smoke(-1.9,base+.9,-.3,.7);for(let i=0;i<5;i++){const a=i/5*TAU;stone(K,-1.9+Math.sin(a)*.4,-.3+Math.cos(a)*.4,.22);}
      T.push('Hide lean-to over the knapping stump','Flint flakes underfoot');}
    else if(vi===1){const base=earthPad(K,2.9,TURF,14);
      B.cyl(0,base-.02,0,1.4,.06,COL.dark,12);B.cyl(0,base+.04,0,1.2,.06,0x1c150f,12);
      for(let i=0;i<14;i++){const a=i/14*TAU+.1,d=1.45+rng()*.2;B.box(Math.sin(a)*d,base,Math.cos(a)*d,.5,.3+rng()*.2,.4,K.pick([FL[0],FL[1],STONE[1]]),a);}
      for(let i=0;i<7;i++){const a=i/7*TAU+.5,d=2.15;B.sph(Math.sin(a)*d,base+.05,Math.cos(a)*d,.55,.35,.5,i%2?0xcfc8b4:0xe0dac8,0);}
      B.beam(.2,base+.1,1.3,.9,base+1.6,2.4,.1,COL.woodD);B.beam(-.2,base+.1,1.3,.5,base+1.6,2.4,.1,COL.woodD);for(let i=0;i<4;i++)B.box(.1+i*.0,base+.2+i*.3,1.55+i*.28,.7,.05,.06,COL.wood);
      B.beam(-1.8,base+.05,2.3,-1.0,base+1.0,1.8,.07,COL.beam);B.box(-1.85,base+.05,2.3,.3,.12,.08,STONE[2]);
      for(const p of [[-2.2,-1],[2.1,-.6]]){B.cyl(p[0],base,p[1],.42,.5,COL.plank,8,.8);B.cyl(p[0],base+.48,p[1],.33,.04,COL.dark,8);nodules(p[0],p[1]+.1,0,0);}
      for(const p of [[1.0,-2.1],[-1,-2.2]])nodules(p[0],p[1],8,.6);
      for(let i=0;i<3;i++)B.box(-.4+i*.35,base,2.7,.2,.5,.1,COL.woodD);
      post(K,1.9,1.9,1.5,.12);post(K,-1.9,-1.7,1.5,.12);hang(K,1.9,base+1.5,1.9,.5,COL.canvas,.3);
      K.smoke(-1.9,base+.6,2.1,.35);K.flame(-2.1,base,2.1,.4);
      T.push('Open pit where flint is dug','Chalky spoil heaps');}
    else{const base=earthPad(K,2.8,TURF,14);
      for(let i=0;i<12;i++){const a=i/12*TAU;B.box(Math.sin(a)*.95,base,Math.cos(a)*.95,.5,.45,.45,K.pick(STONE),a);}
      B.cyl(0,base,0,.7,.2,0x2a1d12,10);K.flame(0,base+.1,0,1.0);K.smoke(0,base+1.4,0,1.5);
      for(let s=0;s<2;s++){const x=s?1.1:-1.1;B.beam(x*1.0,K.gh(x,-.4)-.1,-.4,x*.5,base+2.3,0,.08,COL.woodD);}B.beam(-.7,base+2.3,-.1,.7,base+2.3,.1,.08,COL.wood);
      for(let i=0;i<4;i++)hang(K,-.4+i*.27,base+2.25,0,.5+.1*(i%2),i%2?FL[0]:FL[1],.12);
      B.hcyl(-1.6,base,1.7,.2,1.6,COL.wood,'x');B.hcyl(-1.5,base+.38,1.7,.2,1.4,COL.woodD,'x');
      for(let i=0;i<6;i++)B.box(-1.2+i*.22,base+.58,1.7,.08,.3,.05,i%2?FL[0]:FL[1],.15);
      B.box(1.8,base,1.4,.9,.35,.7,STONE[2]);for(let i=0;i<4;i++)B.box(1.5+i*.2,base+.35,1.4,.08,.35,.06,FL[0]);
      for(const p of [[-2.0,-1.0],[1.9,-1.4],[0,-2.3]])nodules(p[0],p[1],8,.6);
      for(let i=0;i<3;i++)pot(K,2.2+i*.35,K.gh(2.2,.3),.0-i*.1,.2,CLAY[i%3]);
      T.push('Fire hardens the flint before flaking','Strings of finished blades');}
    return {};}});

defBuilding({type:'drying_rack',age:0,name:'Drying Racks',desc:'Fish, meat and hides are cured in smoke and wind.',variants:['Fish Racks','Hide Frames','Smoke Tipi'],r:3.2,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;const base=earthPad(K,2.7,TURF,14);
    if(vi===0){for(let r=0;r<2;r++){const z=-1.1+r*2.2;for(const s of [-1,1]){const x=s*1.7;B.beam(x-.12,K.gh(x,z)-.1,z,x,base+1.6,z,.1,COL.woodD);B.beam(x+.12,K.gh(x,z)-.1,z,x,base+1.6,z,.1,COL.woodD);}
      for(const y of [1.0,1.45])lx(B,0,base+y,z,.06,3.8,COL.wood,6);
      for(let k=0;k<2;k++)for(let i=0;i<10;i++){const x=-1.55+i*.34;const yy=base+1.0+k*.45;B.box(x,yy-.55,z+(k?.04:-.04),.13,.52,.04,K.pick([0xb9b4a0,0xa8a898,0xc99a62]));B.box(x,yy-.12,z,.14,.1,.05,0x6a5a40);}}
      B.cyl(0,base,0,.5,.08,COL.dark,8);K.smoke(0,base+.3,0,.9);for(let i=0;i<5;i++){const a=i/5*TAU;B.hcyl(Math.sin(a)*.35-.2,base+.05,Math.cos(a)*.35,.06,.5,i%2?COL.wood:COL.woodD,'x',5);}
      B.cyl(2.0,base,1.6,.38,.4,COL.plank,8,.85);for(let i=0;i<4;i++)B.box(1.8+i*.1,base+.38,1.55+i*.04,.28,.06,.12,0xb9b4a0,i);
      B.box(-2.1,base,1.7,.8,.4,.55,COL.plank);B.box(-2.1,base+.4,1.7,.6,.06,.4,0xb9b4a0);
      T.push('Fish hung on poles over a smouldering fire');}
    else if(vi===1){const hid=[0xc9a86a,0xb89a64,0xd8cdb0];
      for(let i=0;i<3;i++){const x=-1.7+i*1.7,z=-.4+(i%2)*.7,ang=(i-1)*.35;
        B.mt=9;B.boxC(x,base+1.2,z,1.5,1.6,.07,hid[i],-.18,ang,0);B.mt=null;
        for(const s of [-1,1]){const px=x+Math.cos(ang)*s*.85,pz=z-Math.sin(ang)*s*.85;B.beam(px,K.gh(px,pz)-.05,pz,px,base+2.1,pz,.1,COL.woodD);}
        const a1=[x-Math.cos(ang)*.85,base+2.0,z+Math.sin(ang)*.85],a2=[x+Math.cos(ang)*.85,base+2.0,z-Math.sin(ang)*.85];B.beam(a1[0],a1[1],a1[2],a2[0],a2[1],a2[2],.08,COL.wood);B.beam(a1[0],base+.38,a1[2],a2[0],base+.38,a2[2],.08,COL.wood);
        for(let k=0;k<5;k++){const t=(k+.5)/5;B.box(lerp(a1[0],a2[0],t),base+.4,lerp(a1[2],a2[2],t)+.08,.05,1.55,.04,0x6a5a40,ang);}}
      B.mt=9;B.box(-.5,base,1.9,1.5,.22,1.0,hid[1],.3);B.box(-.45,base+.22,1.9,1.3,.18,.9,hid[2],-.2);B.box(-.4,base+.4,1.9,1.1,.15,.8,hid[0],.4);B.mt=null;
      lx(B,.9,base+1.9,1.9,.07,2.0,COL.wood,6);post(K,-.1,1.9,1.9,.12);post(K,1.9,1.9,1.9,.12);B.mt=9;B.box(1.2,base+.4,1.9,.8,1.5,.05,hid[1]);B.mt=null;
      B.box(2.2,base,-1.7,.9,.55,.35,COL.plank);B.cyl(-2.0,base,1.7,.3,.4,COL.plank,8);B.box(-2.2,base+.4,1.5,.1,.1,.6,STONE[1]);
      T.push('Hides stretched and laced on frames');}
    else{const hid=0xc9a86a;
      poleFan(K,0,base,0,1.3,base+3.6,9,.2,.08);poleFan(K,0,base,0,1.45,base+3.3,9,.55,.06);
      hideCone(K,0,base,0,1.45,2.1,hid,.4);B.box(0,base,1.2,.7,1.0,.1,COL.dark);B.beam(-.35,base+1.0,1.25,0,base+1.5,1.2,.05,COL.woodD);B.beam(.35,base+1.0,1.25,0,base+1.5,1.2,.05,COL.woodD);
      K.smoke(0,base+3.7,0,1.8);for(let i=0;i<3;i++){B.box(0,base+2.1+i*.2,0,.02,.1,.02,COL.dark);}
      for(const s of [-1,1]){const x=s*2.0;B.beam(x,K.gh(x,-.9)-.1,-.9,x,base+1.7,-.9,.1,COL.woodD);B.beam(x,K.gh(x,.7)-.1,.7,x,base+1.7,.7,.1,COL.woodD);}
      for(const z of [-.9,.7])lx(B,0,base+1.7,z,.06,4.0,COL.wood,6);
      for(let i=0;i<8;i++){const z=i%2?.7:-.9;B.box(-1.7+i*.5,base+.85,z,.2,.8,.05,i%3?0x8a3a2a:0xa85a42);}
      logs(K,-1.9,2.0,3,.4,1.4);K.flame(1.9,base,1.9,.45);for(let i=0;i<5;i++){const a=i/5*TAU;stone(K,1.9+Math.sin(a)*.4,1.9+Math.cos(a)*.4,.22);}
      T.push('Hide tipi smoking strips of meat');}
    return {};}});

defBuilding({type:'storage_pit',age:0,name:'Storage Pit',desc:'Grain and roots kept safe from damp and thieves.',variants:['Covered Pit','Stilt Cache','Pot Yard'],r:3.0,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;
    if(vi===0){const base=earthPad(K,2.4,TURF,14);const R=1.7;
      for(let i=0;i<12;i++){const a=i/12*TAU;B.box(Math.sin(a)*R,base,Math.cos(a)*R,.55,.4,.45,K.pick(STONE),a);}
      B.sph(0,base+.15,0,1.55,.9,1.55,TURF,1);B.mt=3;B.cone(0,base+.5,0,1.35,.9,ROOF.thatch[0],10);B.mt=null;
      for(let i=0;i<10;i++){const a=i/10*TAU,rr=.9;B.beam(Math.sin(a)*rr,base+.6+0*i,Math.cos(a)*rr,Math.sin(a)*.3,base+1.5,Math.cos(a)*.3,.05,COL.woodD);}
      B.cyl(0,base+1.35,0,.2,.2,COL.woodD,6);K.smoke(0,base+1.2,0,.25);
      B.box(0,base+.0,1.55,1.0,.7,.25,COL.plank,0);B.box(0,base+.0,1.7,.8,.55,.06,COL.dark);B.box(0,base+.7,1.55,1.1,.1,.3,COL.woodD);
      pot(K,-2.0,base,1.1,.3,CLAY[0]);pot(K,-1.6,base,1.7,.22,CLAY[2]);pot(K,1.9,base,1.2,.26,CLAY[1]);B.box(2.0,base,-1.0,.8,.5,.55,COL.plank);sack(K,1.9,base+.5,-1.0);sack(K,-1.8,base,-1.0,COL.canvas,.5);
      T.push('Roof of turf and thatch over a dug cellar');}
    else if(vi===1){const base=earthPad(K,2.2,TURF,12);const W=1.15,H=1.7;
      for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*W*.8,z=sz*W*.8;const g=K.gh(x,z);B.box(x,g-.3,z,.2,H+.3,.2,COL.woodD);B.cyl(x,g+.9,z,.34,.07,COL.stoneD,8);}
      B.box(0,base+H,0,2.2,.15,2.2,COL.plank);for(let i=0;i<5;i++)B.box(-.9+i*.45,base+H+.15,0,.06,.04,2.2,COL.woodL);
      B.box(0,base+H+.15,0,1.9,.9,1.9,COL.wood);for(let i=0;i<4;i++)lx(B,0,base+H+.25+i*.2,.97,.05,1.95,COL.woodD,5);
      B.mt=3;B.cone(0,base+H+1.0,0,1.65,1.45,ROOF.thatch[1],9);B.mt=null;B.box(0,base+H+.15,.98,.45,.6,.06,COL.dark);
      B.beam(1.0,K.gh(1.0,1.8)-.05,1.8,.55,base+H+.2,1.15,.13,COL.wood);B.beam(.6,K.gh(.6,1.8)-.05,1.8,.4,base+H+.2,1.15,.13,COL.wood);for(let i=0;i<4;i++)B.box(.78,base+.3+i*.4,1.55-i*.12,.5,.06,.1,COL.woodD);
      hang(K,-.8,base+H,1.0,.55,COL.canvas,.34);hang(K,.0,base+H,1.05,.5,0x8a3a2a,.12);sack(K,-1.6,base,1.4);sack(K,-1.75,base+.4,1.3,COL.canvas,.3);pot(K,1.7,base,-1.3,.25);
      T.push('Raised hut keeps rats off the grain','Rat-guard stones on each post');}
    else{const base=earthPad(K,2.7,TURF,14);const R=2.2;
      for(let i=0;i<20;i++){const a=i/20*TAU;if(Math.abs(angDiff(a,0))<.3)continue;const x=Math.sin(a)*R,z=Math.cos(a)*R;post(K,x,z,1.1+rng()*.1,.1,COL.woodD);}
      for(let r=0;r<3;r++){for(let i=0;i<20;i++){const a=i/20*TAU,a2=(i+1)/20*TAU;if(Math.abs(angDiff(a,0))<.34||Math.abs(angDiff(a2,0))<.34)continue;
        const x1=Math.sin(a)*R,z1=Math.cos(a)*R,x2=Math.sin(a2)*R,z2=Math.cos(a2)*R;B.beam(x1,base+.3+r*.32+(i%2)*.05,z1,x2,base+.3+r*.32+((i+1)%2)*.05,z2,.07,r%2?COL.woodL:COL.wood);}}
      const spots=[[0,0,.55],[1.0,-.2,.4],[-1.0,.1,.42],[.3,1.0,.38],[-.5,-1.0,.45],[.9,-1.0,.36]];
      spots.forEach(([x,z,r],i)=>{const g=K.gh(x,z);B.cyl(x,g,z,r,r*1.9,CLAY[i%3],10,.7);B.cyl(x,g+r*1.85,z,r*.7,r*.15,CLAY[i%3],10,1);if(i%2)B.cyl(x,g+r*2.0,z,r*.65,r*.1,COL.hay,8);else B.cyl(x,g+r*2.0,z,r*.6,r*.18,COL.woodL,8);});
      B.box(1.5,base,1.5,.8,.5,.6,COL.plank);sack(K,1.5,base+.5,1.5);for(let i=0;i<3;i++)B.box(-1.6,base+i*.2,1.7,.9,.2,.5,COL.hay,.2*i);
      T.push('Wattle-fenced yard of buried grain jars');}
    return {};}});

// ================================================================ AGE 1
defBuilding({type:'granary',age:1,name:'Granary',desc:'Dry stores to carry the village through winter.',variants:['Round Granary','Raised Granary','Threshing Barn'],r:4.0,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;const thatch=K.pick(ROOF.thatch);
    if(vi===0){const base=stonePad(K,2.1,16),R=1.85;
      B.cyl(0,base,0,R+.1,.5,K.pick(STONE),14);B.mt=1;B.cyl(0,base+.5,0,R,1.5,K.pick(PLASTER),14,1);B.mt=null;
      for(let i=0;i<14;i++){const a=i/14*TAU;B.box(Math.sin(a)*(R+.02),base+.5,Math.cos(a)*(R+.02),.12,1.55,.12,COL.beam,a);}
      B.cyl(0,base+1.95,0,R+.05,.14,COL.beam,14);B.mt=3;B.cone(0,base+2.0,0,R+.75,2.3,thatch,14);B.mt=null;
      B.cyl(0,base+4.2,0,.12,.4,COL.woodD,6);B.sph(0,base+4.65,0,.22,.22,.22,CLAY[0],0);
      B.box(0,base+.5,R+.02,.8,1.1,.1,COL.door);B.box(0,base+1.5,R+.06,1.0,.1,.1,COL.beam);G_( K,0,base+1.8,R+.06);
      for(const s of [-1,1])B.box(s*.52,base+.5,R+.05,.1,1.1,.1,COL.beam);
      sack(K,-1.4,K.gh(-1.4,2.3),2.3);sack(K,-1.0,K.gh(-1,2.5),2.5,COL.canvas,.4);B.box(1.6,K.gh(1.6,2.3),2.3,.9,.55,.5,COL.plank);pot(K,1.7,K.gh(1.7,2.3)+.55,2.3,.2);
      for(let i=0;i<3;i++){B.sph(-2.5+i*.1,K.gh(-2.5,-.5)+.1,-.5+i*.5,.2,.2,.2,COL.hay,0);}
      T.push('Round wattle-and-daub store on a stone ring','Tall thatched cone roof');}
    else if(vi===1){const base=K.rect(2.4,1.7)[1]+.6;const hw=2.1,hd=1.45;
      for(const sx of [-1,0,1])for(const sz of [-1,1]){const x=sx*hw*.85,z=sz*(hd-.15),g=K.gh(x,z);B.cyl(x,g-.3,z,.18,base-g+.3-.2,COL.woodD,7);B.cyl(x,base-.35,z,.38,.12,K.pick(STONE),8);}
      B.box(0,base-.2,0,hw*2+.4,.2,hd*2+.2,COL.plank);
      B.box(0,base,0,hw*2,1.35,hd*2,COL.plank);for(let i=0;i<11;i++)for(const s of [-1,1])B.box(-hw+.1+i*.4,base,s*(hd+.02),.08,1.38,.06,COL.woodD);
      for(const s of [-1,1])for(let k=0;k<3;k++)B.box(-1.4+k*1.4,base+.5,s*(hd+.04),.5,.12,.06,COL.dark);
      gable(B,{x:0,z:0,top:base+1.35,len:hw*2,span:hd*2,k:.85,t:.3,col:thatch,ov:.45,axis:'x',rows:true,wall:COL.plank});
      B.box(0,base+0,hd+.05,.8,1.2,.08,COL.door);
      B.beam(1.4,K.gh(1.4,hd+1.3)-.05,hd+1.3,.9,base-.05,hd+.2,.14,COL.wood);B.beam(1.0,K.gh(1.0,hd+1.3)-.05,hd+1.3,.7,base-.05,hd+.2,.14,COL.wood);
      B.box(-.1,base-.05,hd+.4,1.4,.1,.5,COL.plank);
      hang(K,-1.4,base+1.2,hd+.4,.45,COL.hay,.3);sack(K,-2.6,K.gh(-2.6,1.8),1.8);sack(K,-2.3,K.gh(-2.3,2.1),2.1,COL.canvas,.4);
      B.cyl(2.6,K.gh(2.6,-1.4),-1.4,.4,.55,COL.plank,8,.9);K.flag(-hw,base+1.35,hd,K.pick(BANNER),.8,1.6);
      T.push('Plank store raised on stone staddles','Ladder keeps the mice out');}
    else{const base=K.rect(2.7,2.1)[1]+.2;const hw=2.7,hd=1.9;
      B.box(0,K.rect(hw,hd)[0]-.5,0,hw*2+.3,base-K.rect(hw,hd)[0]+.5,hd*2+.3,COL.stoneF);
      for(const sx of [-1,0,1])for(const sz of [-1,1])post(K,sx*hw*.9,sz*hd*.85,2.2,.22,COL.beam);
      B.box(0,base+2.1,0,hw*2+.4,.14,hd*2+.2,COL.beam);gable(B,{x:0,z:0,top:base+2.2,len:hw*2,span:hd*2,k:.5,t:.3,col:thatch,ov:.5,axis:'x',rows:true});
      lx(B,0,base+2.0,hd*.85,.09,hw*2,COL.wood,6);
      B.cyl(-.3,base+.02,0,1.35,.06,COL.plank,14);for(let i=0;i<10;i++){const a=i/10*TAU;B.box(Math.sin(a)*.5-.3,base+.08,Math.cos(a)*.5,.12,.04,.9,COL.woodL,a);}
      for(let i=0;i<6;i++)B.box(-.3+Math.sin(i)*.6,base+.1+i*.0,Math.cos(i)*.6,.7,.12,.1,COL.hay,i);
      for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.box(1.65,base+.02+r*.4,-1.2+i*.55+r*.28,.55,.4,.45,COL.hay,.1*i);
      B.sph(-1.95,base+.4,-1.0,.7,.55,.7,COL.hay,1);B.cone(-1.95,base+.7,-1.0,.5,.7,COL.hay,7);
      sack(K,-2.0,base,1.2);sack(K,-1.6,base,1.35,COL.canvas,.4);sack(K,-1.85,base+.4,1.25,COL.canvas,.2);
      B.beam(1.8,base,1.2,1.0,base+1.4,1.0,.05,COL.woodD);B.beam(1.4,base+1.2,1.0,1.9,base+.2,1.2,.04,COL.iron);
      hang(K,1.6,base+2.0,hd*.85,.5,COL.hay,.4);hang(K,-1.2,base+2.0,hd*.85,.45,COL.hay,.4);
      T.push('Open barn where sheaves are threshed','Heaped straw and sacks');}
    return {};}});
function G_(K,x,y,z){K.B.box(x-.3,y-.12,z,.6,.1,.06,COL.beamD);}

defBuilding({type:'kiln',age:1,name:'Kiln',desc:'Clay fired hard, wood turned to charcoal.',variants:['Pottery Kiln','Charcoal Clamp','Tall Shaft Kiln'],r:3.6,
  gen(b,c,K,vi){const {B,F,rng}=K,T=K.traits;
    if(vi===0){const base=stonePad(K,2.6,14);
      const cl=K.pick(TOWN_UP);B.mt=1;B.sph(0,base+.2,0,1.6,1.45,1.6,cl,1);B.cyl(0,base-.05,0,1.6,.4,cl,12,1);B.mt=null;
      for(let i=0;i<4;i++)B.cyl(0,base+.4+i*.3,0,1.62-i*.1,.06,COL.stoneD,12);
      B.box(0,base,1.5,1.0,1.0,.9,STONE[0]);B.box(0,base,1.9,.55,.8,.1,0x1b1410);B.box(0,base+.8,1.95,.7,.12,.3,STONE[2]);F.box(0,base+.05,2.0,.35,.2,.04,0xff8a20);F.box(0,base+.03,2.02,.18,.12,.04,0xffd060);
      K.flame(0,base+.0,2.3,.45);
      B.cyl(.4,base+1.4,-.5,.35,1.9,STONE[1],8,.85);B.cyl(.4,base+3.3,-.5,.4,.14,COL.stoneD,8);K.smoke(.4,base+3.5,-.5,1.9,1);
      for(let i=0;i<3;i++)B.box(-.6+i*.6,base+1.05,.8,.2,.08,.2,STONE[3]);
      for(let r=0;r<3;r++)for(let i=0;i<3;i++)pot(K,-2.4+i*.45,base+r*.33,1.6-r*.0,.17,CLAY[(i+r)%3]);
      B.box(-2.2,base,-1.5,1.4,.2,.8,COL.plank);for(let i=0;i<4;i++)pot(K,-2.6+i*.35,base+.2,-1.5,.15,CLAY[i%3]);
      logs(K,2.3,-.2,3,.2,1.2);
      T.push('Domed clay kiln with a flue stack','Pots stacked to fire and dry');}
    else if(vi===1){const base=earthPad(K,3.0,TURF,16);
      B.sph(0,base-.3,0,2.3,1.9,2.3,0x3d3a33,1);for(let i=0;i<9;i++){const a=i/9*TAU,rr=1.2+rng()*.7;B.sph(Math.sin(a)*rr,base+.3+(2-rr)*.5,Math.cos(a)*rr,.5,.28,.5,TURF,0);}
      B.cyl(0,base-.2,0,2.4,.4,COL.soil,16,.9);
      for(const p of [[0,0],[1.0,.7],[-1.0,.5],[.3,-1.2],[-.7,-1.0]]){K.smoke(p[0],base+1.55-Math.hypot(p[0],p[1])*.35,p[1],.5,1);B.cyl(p[0],base+1.4-Math.hypot(p[0],p[1])*.35,p[1],.2,.18,COL.dark,6);}
      for(let i=0;i<5;i++){const a=i/5*TAU+.5;stone(K,Math.sin(a)*2.5,Math.cos(a)*2.5,.5);}
      for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.hcyl(-3.1,base+.15+r*.36,1.4-i*.36-r*.18+.9,.17,1.4,K.pick([0x8a6440,0x7a5632]),'x',6);
      const hx=2.5,hz=1.9;B.box(hx,base,hz,1.5,.15,1.2,COL.plank);for(const s of [-1,1]){B.beam(hx+s*.7,K.gh(hx+s*.7,hz+.5)-.1,hz+.5,hx+s*.7,base+1.5,hz+.5,.1,COL.woodD);B.beam(hx+s*.7,K.gh(hx+s*.7,hz-.5)-.1,hz-.5,hx+s*.7,base+1.1,hz-.5,.1,COL.woodD);}
      B.boxC(hx,base+1.35,hz,1.9,.1,1.5,K.pick(ROOF.thatch),-.3,0,0);
      B.box(hx,base,hz-.2,.5,.12,.5,COL.canvas);sack(K,hx+.3,base,hz+.1);B.cyl(0.0,K.gh(0,-2.7),-2.7,.0,.0,COL.dark,5);
      K.flame(hx-.8,K.gh(hx-.8,hz+1.0),hz+1.0,.35);
      T.push('Wood stack smouldering under turf','Burner\'s lean-to shelter');}
    else{const base=stonePad(K,2.3,14);const R=1.25,H=3.3;
      B.cyl(0,base,0,R+.2,.5,STONE[1],12);const br=K.pick(BRICK);B.mt=4;B.cyl(0,base+.45,0,R,H,br,12,.86);B.mt=null;
      for(let i=0;i<4;i++)B.cyl(0,base+.9+i*.75,0,R*(1-.035*i*1.0)+.05,.08,COL.iron,12);
      B.cyl(0,base+H+.4,0,R*.88,.3,STONE[2],12);B.cyl(0,base+H+.7,0,R*.7,.25,COL.dark,10);K.smoke(0,base+H+1.1,0,2.0,1);
      B.box(0,base,R-.05,1.1,1.3,.5,STONE[0]);B.box(0,base,R+.2,.62,1.0,.1,0x1b1410);B.box(0,base+1.0,R+.2,.8,.12,.14,STONE[3]);F.box(0,base+.1,R+.27,.4,.3,.04,0xff7a1a);F.box(0,base+.08,R+.3,.2,.2,.04,0xffd060);
      for(const s of [-1,1]){B.box(s*.7,base,R-.1,.2,1.2,.25,STONE[1]);}
      B.box(-2.2,K.gh(-2.2,.4),.4,1.0,.12,1.3,COL.plank);for(let r=0;r<4;r++)B.box(-2.2,K.gh(-2.2,.4)+.12+r*.12,.4,.9,.1,1.0,K.pick(ROOF.tile));
      B.box(2.2,K.gh(2.2,.4),.4,1.0,.12,1.3,COL.plank);for(let r=0;r<3;r++)for(let i=0;i<2;i++)B.box(2.0+i*.4,K.gh(2.2,.4)+.12+r*.3,.4,.3,.28,1.0,K.pick(BRICK));
      logs(K,0,2.3,3,0,1.8);
      T.push('Tall brick shaft kiln with arched stoke hole','Tiles and bricks stacked to cure');}
    return {};}});

defBuilding({type:'longhouse',age:1,name:'Longhouse',desc:'A long communal hall; a whole kin shares the hearth.',variants:['Thatched Longhouse','Turf Hall','Boat Hall'],r:5.4,
  gen(b,c,K,vi){const {B,G,F,rng}=K,T=K.traits;
    if(vi===0){const w=7,d=3.3,hw=w/2,hd=d/2;const base=BH.pad(K,hw,hd,COL.stoneF);const wc=K.pick(PLASTER);
      B.mt=1;B.box(0,base,0,w-.1,1.6,d-.1,wc);B.mt=null;
      for(let i=0;i<=7;i++)for(const s of [-1,1])B.box(-hw+.15+i*(w-.3)/7,base,s*(hd-.02),.14,1.62,.1,COL.beam);
      for(const s of [-1,1]){B.box(0,base+1.5,s*(hd-.02),w,.12,.1,COL.beam);B.box(0,base+.03,s*(hd-.02),w,.1,.1,COL.beam);}
      for(const s of [-1,1])B.box(s*(hw-.02),base,0,.1,1.62,d,COL.beam);
      gable(B,{x:0,z:0,top:base+1.6,len:w,span:d,k:.95,t:.32,col:K.pick(ROOF.thatch),ov:.5,axis:'x',rows:true,wall:wc,barge:COL.beam,finial:true});
      B.box(-.9,base,hd,.9,1.35,.1,COL.door);B.box(-.9,base+1.35,hd+.04,1.1,.1,.14,COL.beam);B.box(2.0,base,hd,.9,1.35,.1,COL.door);
      for(const x of [-2.4,.5,3.0]){B.box(x,base+.95,hd+.03,.45,.4,.06,COL.beamD);G.box(x,base+1.0,hd+.06,.32,.28,.04,GLASS);}
      K.smoke(-1.3,base+3.0,0,1.8,1);K.smoke(1.5,base+3.1,0,1.4,1);B.box(-1.3,base+2.55,0,.4,.7,.5,COL.beamD);
      logs(K,0,hd+1.3,3,PI/2,1.8);B.box(-hw-.05,base,1.0,.6,.7,.5,COL.plank);hang(K,1.0,base+1.5,hd+.05,.5,0xb9a97a,.3);
      pot(K,hw+.5,base,hd,.24,CLAY[0]);B.cyl(-hw-.6,K.gh(-hw-.6,hd+.6),hd+.6,.35,.55,COL.plank,8);
      T.push('Wattle-and-daub walls','Hearth smoke seeps through the thatch');return {r:4.9};}
    else if(vi===1){const w=5.6,d=3.8,hw=w/2,hd=d/2;const base=BH.pad(K,hw,hd,COL.stoneD);
      B.box(0,base,0,w,1.05,d,STONE[0]);for(let i=0;i<5;i++)for(const s of [-1,1])B.box(-hw+.5+i*1.15,base+.1,s*(hd+.01),1.0,.45,.08,K.pick(STONE));
      B.box(0,base+1.0,0,w+.2,.2,d+.2,COL.woodD);
      const hr=gable(B,{x:0,z:0,top:base+1.2,len:w,span:d,k:.5,t:.5,col:COL.leaf,ov:.3,axis:'x',wall:STONE[1],cap:COL.leaf});
      for(let i=0;i<8;i++){const x=-hw+.3+i*.7;B.sph(x,base+1.2+hr+.45,0,.4,.22,.35,K.pick([COL.leaf,TURF]),0);}for(let i=0;i<5;i++)B.sph(-2+i,base+1.55+Math.sin(i)*.1,hd*.5+(i%2)*.2,.12,.08,.12,[BANNER[0],COL.gold,PLASTER[0]][i%3],0);
      B.box(0,base,hd+.5,1.9,.12,1.1,STONE[2]);post(K,-.75,hd+1.0,1.55,.18,COL.beam);post(K,.75,hd+1.0,1.55,.18,COL.beam);B.wedge(0,base+1.55,hd+.5,2.1,.6,1.3,ROOF.shingle[0],PI);
      B.box(0,base,hd+.04,.9,1.45,.1,COL.door);B.box(-hw+.8,base+.0,hd+.0,.0,.0,.0,COL.door);
      for(const s of [-1,1])B.box(s*1.6,base+.6,hd+.04,.4,.4,.06,COL.beamD);
      B.box(hw+.2,base,0,.14,.35,d,STONE[3]);K.smoke(0,base+1.2+hr+.3,0,1.9,1);B.cyl(0,base+1.2+hr,0,.3,.2,STONE[2],7);
      B.beam(-hw-.1,base+1.7,-1.0,-hw-.2,base+2.4,-1.6,.05,PLASTER[1]);B.beam(-hw-.1,base+1.7,1.0,-hw-.2,base+2.4,1.6,.05,PLASTER[1]);
      logs(K,-hw-1.0,-.3,3,0,1.8);K.flag(hw-.3,base+1.0,hd,K.pick(BANNER),.9,2.3);
      T.push('Low stone walls under a grassy turf roof','Warm and wind-proof');return {r:4.3};}
    else{const L=8.4,hl=L/2,wm=1.95,we=1.0,yw=1.35,yr=3.1;const base=K.rect(hl,wm)[1]+.2;
      const W=x=>we+(wm-we)*(1-Math.pow(x/hl,2)),YR=x=>yr+Math.pow(x/hl,4)*1.0;
      B.box(0,K.rect(hl,wm)[0]-.5,0,L*.7,base-K.rect(hl,wm)[0]+.5,wm*2+.2,COL.stoneF);
      const N=14,th=K.pick(ROOF.thatch);
      for(let i=0;i<N;i++){const x0=-hl+i*L/N,x1=-hl+(i+1)*L/N,xm=(x0+x1)/2;
        for(const s of [-1,1]){const a=[x0,base+yw,s*W(x0)],b2=[x1,base+yw,s*W(x1)],c1=[x1,base+yr*YR(x1)/yr-.45,0],d1=[x0,base+yr*YR(x0)/yr-.45,0];
          const col=_shade(th,.95+(i%2)*.06);dbl(B,a,b2,c1,d1,col,3);
          dbl(B,[x0,base,s*W(x0)],[x1,base,s*W(x1)],b2,a,wc2(K));}
        B.box(xm,base+yr-.5+Math.pow(xm/hl,4),0,L/N+.05,.18,.3,COL.beam);}
      for(const e of [-1,1]){const x=e*hl,w0=W(x);B.tri([x,base+yw,-w0],[x,base+yw,w0],[x,base+YR(x)-.45,0],COL.plank);B.tri([x,base+yw,w0],[x,base+yw,-w0],[x,base+YR(x)-.45,0],COL.plank);
        B.beam(x,base+YR(x)-.5,0,x+e*.35,base+YR(x)+.35,-.55,.07,COL.beam);B.beam(x,base+YR(x)-.5,0,x+e*.35,base+YR(x)+.35,.55,.07,COL.beam);}
      for(let i=0;i<=8;i++){const x=-hl+i*L/8;for(const s of [-1,1])B.box(x,base,s*W(x)-.0,.14,yw+.1,.14,COL.beam);}
      B.box(0,base,wm-.05+.0,1.0,1.25,.1,COL.door);B.box(0,base+1.25,wm,1.3,.1,.14,COL.beam);
      for(const x of [-2.6,2.6]){const z=W(x)+.02;B.box(x,base+.7,z,.4,.4,.08,COL.beamD);}
      B.mt=null;K.smoke(-1.0,base+3.0,0,1.8,1);K.smoke(1.7,base+3.0,0,1.2,1);
      for(let i=0;i<4;i++)B.box(-1.8+i*1.2,base+yr-.1,0,.06,.06,.06,COL.beam);
      K.flag(hl+.35,base+yr+.2,0,K.pick(BANNER),.9,1.5);
      logs(K,2.5,wm+1.1,3,PI/2,1.8);pot(K,-3.0,K.gh(-3.0,wm+.4),wm+.4,.24);B.box(-3.7,K.gh(-3.7,wm+.7),wm+.7,1.0,.5,.5,COL.plank);
      T.push('Bow-sided hall shaped like an upturned boat','Carved dragon-beams at both gables');return {r:5.2};}
    return {};}});
function wc2(K){return COL.plank;}

defBuilding({type:'shrine',age:1,name:'Shrine',desc:'Sacred ground where the people give thanks to the sun.',variants:['Stone Circle','Timber Circle','Sun Shrine'],r:3.9,
  gen(b,c,K,vi){const {B,rng}=K,T=K.traits;
    if(vi===0){const base=stonePad(K,3.0,18);const n=8,R=2.5;
      for(let i=0;i<n;i++){const a=i/n*TAU+.2;if(Math.abs(angDiff(a,0))<.4)continue;const x=Math.sin(a)*R,z=Math.cos(a)*R,g=K.gh(x,z),h=1.8+rng()*.5;B.box(x,g-.3,z,.65,h+.3,.45,K.pick(STONE),a+rng()*.2);B.box(x,g+h-.15,z,.5,.3,.35,K.pick(STONE),a);}
      for(const s of [-1,1])B.box(s*.9,base,-1.5,.5,2.4,.5,STONE[0]);B.box(0,base+2.35,-1.5,2.4,.5,.7,STONE[2]);
      B.box(0,base,.1,1.5,.5,.9,STONE[3]);B.box(0,base+.5,.1,1.7,.14,1.0,STONE[1]);B.cyl(0,base+.64,.1,.3,.14,COL.dark,8);K.flame(0,base+.7,.1,.55);K.smoke(0,base+1.4,.1,1.0);
      B.cyl(0,base+.65,.45,.28,.05,COL.gold,10);for(const s of [-1,1])pot(K,s*.6,base+.64,.1,.12,CLAY[0]);
      for(let i=0;i<4;i++)K.flag(Math.sin(i*1.5+.3)*R*.95,K.gh(Math.sin(i*1.5+.3)*R*.95,Math.cos(i*1.5+.3)*R*.95)+1.2,Math.cos(i*1.5+.3)*R*.95,i%2?BANNER[0]:COL.gold,.5,.0);
      for(let i=0;i<10;i++){const a=i/10*TAU+.1,x=Math.sin(a)*3.2,z=Math.cos(a)*3.2;stone(K,x,z,.3);}
      T.push('Ring of standing stones with a lintelled gate','Offering fire on the altar');}
    else if(vi===1){const base=earthPad(K,3.0,TURF,18);const n=10,R=2.6;
      for(let i=0;i<n;i++){const a=i/n*TAU;const x=Math.sin(a)*R,z=Math.cos(a)*R,g=K.gh(x,z);B.cyl(x,g-.3,z,.2,2.3+.3,COL.wood,7);B.cone(x,g+2.0,z,.22,.5,COL.woodD,7);}
      for(let i=0;i<n;i++){const a=i/n*TAU,a2=(i+1)/n*TAU;if(i===0)continue;const x1=Math.sin(a)*R,z1=Math.cos(a)*R,x2=Math.sin(a2)*R,z2=Math.cos(a2)*R;B.beam(x1,K.gh(x1,z1)+1.85,z1,x2,K.gh(x2,z2)+1.85,z2,.14,COL.beam);}
      B.cyl(0,base,0,.9,.18,STONE[2],12);B.cyl(0,base+.18,0,.6,.14,STONE[1],12);
      B.cyl(0,base+.2,0,.17,4.2,COL.wood,8);B.cyl(0,base+4.2,0,.4,.1,COL.gold,12);B.put('cyl:14:1',0,base+4.65,0,.7,.08,.7,COL.gold,PI/2,0,0);B.put('cyl:14:1',0,base+4.65,0,.4,.1,.4,COPPER,PI/2,0,0);
      for(let i=0;i<5;i++){const a=i/5*TAU;B.beam(0,base+4.1,0,Math.sin(a)*R*.9,K.gh(Math.sin(a)*R*.9,Math.cos(a)*R*.9)+1.9,Math.cos(a)*R*.9,.025,COL.beam);}
      for(let i=0;i<4;i++){const a=i/4*TAU+.4;K.flag(Math.sin(a)*1.4,base,Math.cos(a)*1.4,i%2?BANNER[0]:BANNER[1],.8,2.0);}
      for(const s of [-1,1]){B.cyl(s*1.1,base,1.6,.25,.35,COL.stoneD,8);K.flame(s*1.1,base+.35,1.6,.4);}
      T.push('Ring of carved posts round a sun pole','Bronze disc catches the dawn');}
    else{const base=BH.pad(K,2.2,2.6,COL.stoneF);const hw=1.3,hd=1.4;
      for(let s=0;s<3;s++)B.box(0,base,1.55+s*.4,2.2-s*.4,.12-s*0+.0,.4,STONE[s]);
            B.box(0,base,0,hw*2,1.5,hd*2,COL.plank);for(let i=0;i<7;i++)for(const s of [-1,1])B.box(-hw+.15+i*.33,base,s*(hd+.02),.06,1.52,.05,COL.woodD);
      for(const s of [-1,1])for(const t of [-1,1])B.box(s*hw,base,t*hd,.2,1.7,.2,COL.beam);
      B.box(0,base+1.55,hd,hw*2+.2,.14,.2,COL.beam);B.box(0,base+1.55,-hd,hw*2+.2,.14,.2,COL.beam);
      gable(B,{x:0,z:0,top:base+1.6,len:hd*2,span:hw*2,k:1.0,t:.3,col:K.pick(ROOF.thatch),ov:.45,axis:'z',rows:true,wall:COL.plank,barge:COL.beam});
      B.box(0,base,hd+.02,.9,1.35,.08,COL.door);
      B.put('cyl:14:1',0,base+2.35,hd+.12,.55,.08,.55,COL.gold,PI/2,0,0);B.put('cyl:14:1',0,base+2.35,hd+.17,.3,.06,.3,COPPER,PI/2,0,0);
      for(let i=0;i<8;i++){const a=i/8*TAU;B.beam(Math.sin(a)*.55,base+2.35+Math.cos(a)*.55,hd+.12,Math.sin(a)*.8,base+2.35+Math.cos(a)*.8,hd+.12,.04,COL.gold);}
      for(const s of [-1,1]){B.beam(s*.25,base+2.95,0,s*.7,base+3.5,0,.07,COL.beam);}
      for(const s of [-1,1]){const x=s*1.7,z=hd+1.0,g=K.gh(x,z);B.cyl(x,g,z,.28,.55,COL.stoneD,8);K.flame(x,g+.55,z,.45);K.flag(s*2.2,K.gh(s*2.2,.0),0,s>0?BANNER[0]:BANNER[1],.9,2.6);}
      B.box(0,K.gh(0,hd+1.5),hd+1.5,1.0,.4,.7,STONE[0]);B.box(0,K.gh(0,hd+2.0),hd+2.0,1.4,.2,.6,STONE[1]);K.smoke(0,base+1.9,-.3,.6);
      T.push('Plank temple with a gilded sun disc','Banners and braziers flank the steps');}
    return {};}});

defBuilding({type:'bronze_foundry',age:1,name:'Bronze Foundry',desc:'Copper and tin are smelted and cast into bright bronze.',variants:['Casting Shed','Shaft Furnace','Cauldron Yard'],r:4.1,
  gen(b,c,K,vi){const {B,F,rng}=K,T=K.traits;const ING=()=>K.pick([COPPER,COL.gold]);
    const ingots=(x,y,z,n)=>{for(let i=0;i<n;i++)for(let j=0;j<=i&&j<3;j++)B.box(x+j*.38-i*.1,y+i*.14,z,.34,.14,.2,ING());};
    if(vi===0){const w=5.4,d=3.6,hw=w/2,hd=d/2;const base=BH.pad(K,hw,hd,COL.stoneF);
      for(const sx of [-1,1])for(const sz of [-1,1])B.box(sx*(hw-.15),base,sz*(hd-.15),.24,2.4,.24,COL.beam);
      B.box(0,base,-hd+.1,w,1.5,.18,K.pick(PLASTER));B.box(0,base+2.35,0,w,.15,.2,COL.beam);
      gable(B,{x:0,z:0,top:base+2.4,len:w,span:d,k:.5,t:.3,col:K.pick(ROOF.shingle),ov:.45,axis:'x',cap:COL.woodD});
      const fx=-1.3,fz=-.9;B.cyl(fx,base,fz,.85,1.2,K.pick(TOWN_UP),10,.75);B.cyl(fx,base+1.2,fz,.55,.14,STONE[2],10);F.box(fx,base+1.22,fz,.7,.06,.7,0xff7a1a);F.box(fx,base+1.25,fz,.4,.06,.4,0xffd060);K.flame(fx,base+1.25,fz,.55);
      B.box(fx,base+.4,fz+.8,.45,.45,.16,0x1b1410);F.box(fx,base+.42,fz+.9,.28,.18,.04,0xff8a20);
      K.smoke(fx,base+3.5,fz,1.8,1);B.cyl(fx,base+2.6,fz,.25,.8,STONE[1],8);for(const s of [-1,1])B.beam(fx+s*.5,base+1.2,fz,fx+s*.3,base+2.4,fz,.08,COL.woodD);
      // bellows
      B.wedge(fx+1.5,base+.1,fz+.2,.8,.5,1.1,COL.woodL,PI/2);B.box(fx+1.0,base+.3,fz+.15,.7,.08,.08,COL.iron);B.box(fx+.9,base+.1,fz+.18,.3,.2,.3,COL.dark);
      // anvil and ingots
      B.cyl(1.4,base,.7,.3,.5,COL.wood,8);B.box(1.4,base+.5,.7,.75,.2,.35,COL.iron);B.box(1.4,base+.7,.7,.45,.1,.25,STONE[2]);
      ingots(1.5,base,-1.0,3);B.box(.3,base,-1.3,.8,.4,.5,COL.plank);for(const x of [-.2,.1,.4,.7])B.box(x,base+.4,-1.3,.2,.06,.4,COPPER);
      for(let i=0;i<3;i++){hang(K,-2.1+i*.5,base+2.35,hd-.2,.7,COL.iron,.06);}B.box(-.6,base+1.0,hd-.1,.5,.9,.06,COL.canvas);
      B.cyl(-2.0,base,hd-.6,.25,.5,COPPER,8,.9);pot(K,2.0,base,hd-.5,.2,CLAY[1]);
      sack(K,-hw-.6,K.gh(-hw-.6,1.0),1.0,0x3a3d42);sack(K,-hw-.5,K.gh(-hw-.5,1.5),1.5,COL.dark,.4);logs(K,hw+.9,0,3,PI/2,1.6);
      T.push('Open shed: crucible furnace, bellows and anvil');return {r:4.1};}
    else if(vi===1){const base=stonePad(K,3.0,16);const cl=K.pick(TOWN_UP);
      B.mt=1;B.cyl(0,base,0,1.05,3.2,cl,10,.62);B.mt=null;for(let i=0;i<4;i++)B.cyl(0,base+.5+i*.7,0,1.0-.1*i+.03,.07,COL.iron,10);
      B.cyl(0,base+3.1,0,.5,.3,STONE[2],10,1.2);F.cyl(0,base+3.28,0,.4,.05,0xff7a1a,8);K.flame(0,base+3.25,0,.65);K.smoke(0,base+4.2,0,2.4,1);
      B.box(0,base,1.0,.8,.7,.3,STONE[0]);B.box(0,base,1.18,.45,.5,.08,0x1b1410);F.box(0,base+.1,1.2,.25,.2,.04,0xff7a1a);
      for(const s of [-1,1]){const x=s*2.0;B.wedge(x,base,.4,.9,.8,1.3,COL.woodL,s>0?PI/2:-PI/2);B.beam(x-s*.5,base+.35,.4,s*1.0,base+.35,.4,.1,COL.iron);B.box(x+s*.3,base+.8,.4,.6,.2,.3,COL.plank);B.beam(s*.95,base+.35,.4,s*.95,base+.35,.3,.12,COPPER);}
      for(let i=0;i<8;i++){const a=rng()*TAU,d=1.7+rng()*.5;B.sph(Math.sin(a)*d,base+.1,-1.3+Math.cos(a)*d*.5,.35,.22,.3,0x1c1c18,0);}
      for(let i=0;i<6;i++)B.sph(-1.9+rng()*.9,K.gh(-1.9,-2)+.15,-2.0+rng()*.7,.28,.2,.25,VERD,0);
      for(let i=0;i<5;i++)B.sph(1.8+rng()*.6,K.gh(2,-1.9)+.1,-1.9+rng()*.6,.28,.2,.25,i%2?COL.stoneD:0x2e2a22,0);
      ingots(-.5,base,2.1,3);B.box(1.3,base,2.1,.9,.5,.6,COL.plank);B.cyl(1.3,base+.5,2.1,.28,.3,COPPER,8,.9);sack(K,-1.5,base,2.2);
      T.push('Tall clay furnace smelts ore with charcoal','Bellows on either side');return {r:3.7};}
    else{const base=earthPad(K,3.2,TURF,16);
      for(let i=0;i<3;i++){const a=i/3*TAU+.5;B.beam(Math.sin(a)*1.2,K.gh(Math.sin(a)*1.2,Math.cos(a)*1.2)-.05,Math.cos(a)*1.2,0,base+2.3,0,.12,COL.woodD);}
      B.cyl(0,base+1.0,0,.6,.05,COL.iron,8);B.cyl(0,base+.9,0,.62,.55,COPPER,10,1.25);B.cyl(0,base+1.43,0,.7,.08,COL.gold,10);B.cyl(0,base+1.47,0,.55,.03,0xff8a20,10);F.cyl(0,base+1.46,0,.5,.04,0xffa030,10);
      K.flame(0,base,0,.8);K.smoke(0,base+2.0,0,1.5,1);
      for(let i=0;i<7;i++){const a=i/7*TAU;B.box(Math.sin(a)*.85,base,Math.cos(a)*.85,.35,.3,.3,K.pick(STONE),a);}
      // lean-to hut
      const hx=-2.1,hz=-1.6;for(const s of [-1,1]){post(K,hx+s*1.1,hz+.8,1.9,.14,COL.beam);post(K,hx+s*1.1,hz-.8,1.2,.14,COL.beam);}
      B.boxC(hx,base+1.75,hz,2.6,.12,1.9,K.pick(ROOF.thatch),.4,0,0);B.box(hx,base,hz-.8,2.4,1.2,.12,COL.plank);
      B.box(hx,base,hz,1.6,.6,.7,COL.plank);ingots(hx-.4,base+.6,hz,2);for(const x of [.2,.5])B.box(hx+x,base+.6,hz,.2,.08,.45,COPPER);
      // rack of finished bronzes
      const rx=2.0,rz=1.6;lx(B,rx,base+1.6,rz,.06,2.0,COL.wood,6);post(K,rx-1.0,rz,1.6,.12);post(K,rx+1.0,rz,1.6,.12);
      for(let i=0;i<6;i++){const x=rx-.8+i*.32;B.box(x,base+1.0+((i%2)*.1),rz,.1,.6,.04,COPPER);B.box(x,base+.95,rz,.22,.14,.04,i%2?COL.gold:COPPER);}
      B.put('cyl:14:1',rx-2.5,base+.9,rz+.4,.5,.06,.5,COL.gold,PI/2,0,0);B.beam(rx-2.5,base,rz+.4,rx-2.5,base+.9,rz+.4,.08,COL.wood);
      B.cyl(1.9,base,-1.4,.45,.5,COL.plank,8);B.cyl(1.9,base+.47,-1.4,.36,.04,COL.water,8);
      for(let i=0;i<3;i++)B.box(-.5+i*.7,K.gh(0,2.5),2.4,.3,.14,.5,K.pick(STONE),.1);
      K.flag(2.8,K.gh(2.8,-.2),-.2,K.pick(BANNER),.9,2.4);
      T.push('Copper cauldron on a tripod over the fire','Display rack of axes and spearheads');return {r:4.2};}
    return {};}});
}
