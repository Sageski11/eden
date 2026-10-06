'use strict';
// new buildings (see bdefs.js for defBuilding): Iron Age (age 2) and Medieval (age 3)
{
// ------------------------------------------------------------ shared helpers
function door(B,x,y,z,col,w=.9,h=1.6){B.box(x,y,z+.02,w,h,.09,col||COL.door);B.box(x,y+h,z+.03,w+.22,.14,.12,COL.beamD);}
function barrel(K,x,z,s=1,y){const B=K.B,g=y==null?K.gh(x,z):y;B.cyl(x,g,z,.27*s,.55*s,COL.wood,8);B.cyl(x,g+.12*s,z,.285*s,.04,COL.iron,8);B.cyl(x,g+.4*s,z,.285*s,.04,COL.iron,8);}
function sack(K,x,z,y,col){const g=y==null?K.gh(x,z):y;K.B.sph(x,g+.17,z,.21,.18,.17,col||COL.canvas,0);}
function bale(K,x,z,y,ry=0){const g=y==null?K.gh(x,z):y;K.B.box(x,g,z,.7,.4,.45,COL.hay,ry);}
function crate(K,x,z,y,s=.45){const g=y==null?K.gh(x,z):y;K.B.box(x,g,z,s,s,s,COL.plank,K.rng()*.6);}
function fence(K,pts,h=.9,col=COL.woodL,gap=1.05,skip){const B=K.B;
  for(let i=0;i<pts.length-1;i++){const [x1,z1]=pts[i],[x2,z2]=pts[i+1],n=Math.max(1,Math.round(Math.hypot(x2-x1,z2-z1)/gap));
    for(let s=0;s<=n;s++){const x=lerp(x1,x2,s/n),z=lerp(z1,z2,s/n),g=K.gh(x,z);
      if(!(i>0&&s===0))B.box(x,g-.15,z,.11,h+.15,.11,col);
      if(s<n){const x3=lerp(x1,x2,(s+1)/n),z3=lerp(z1,z2,(s+1)/n);if(skip&&skip((x+x3)/2,(z+z3)/2))continue;const g3=K.gh(x3,z3);
        B.beam(x,g+h*.45,z,x3,g3+h*.45,z3,.06,col);B.beam(x,g+h*.85,z,x3,g3+h*.85,z3,.06,col);}}}}
function horse(K,x,z,ang,col,sc=1){const B=K.B,g=K.gh(x,z),c=Math.cos(ang),s=Math.sin(ang);
  const P=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c],dark=_shade(col,.55);let p=P(0,0);
  B.box(p[0],g+.62*sc,p[1],.42*sc,.46*sc,1.0*sc,col,ang);
  for(const [lx,lz] of [[-.14,-.4],[.14,-.4],[-.14,.4],[.14,.4]]){p=P(lx*sc,lz*sc);B.box(p[0],g,p[1],.1*sc,.66*sc,.1*sc,dark,ang);}
  const a=P(0,.45*sc),b=P(0,.7*sc),h=P(0,1.0*sc),t0=P(0,-.5*sc),t1=P(0,-.65*sc);
  B.beam(a[0],g+.95*sc,a[1],b[0],g+1.4*sc,b[1],.18*sc,col,.2*sc);B.beam(b[0],g+1.4*sc,b[1],h[0],g+1.15*sc,h[1],.15*sc,col,.13*sc);
  B.beam(t0[0],g+1.0*sc,t0[1],t1[0],g+.55*sc,t1[1],.07*sc,dark);}
function sheep(K,x,z,ang){const B=K.B,g=K.gh(x,z),c=Math.cos(ang),s=Math.sin(ang);
  B.sph(x,g+.42,z,.3,.26,.4,0xe8e0d0,0);B.box(x+s*.4,g+.4,z+c*.4,.14,.16,.2,COL.dark,ang);
  for(const [lx,lz] of [[-.12,-.2],[.12,-.2],[-.12,.2],[.12,.2]])B.box(x+lx*c+lz*s,g,z-lx*s+lz*c,.07,.25,.07,COL.dark);}
function chimney(K,x,y0,z,top,w=.6,col,smoke=1){const B=K.B,c=col||COL.stoneD;B.box(x,y0,z,w,top-y0,w,c);B.box(x,top,z,w+.14,.12,w+.14,COL.stoneF);if(smoke)K.smoke(x,top+.15,z,smoke);}
function sign(K,x,y,z,col,shape){const B=K.B;B.box(x,y,z+.3,.06,.06,.6,COL.iron);B.box(x,y-.5,z+.58,.5,.4,.05,col||COL.woodL);B.box(x-.2,y-.1,z+.58,.02,.1,.02,COL.iron);B.box(x+.2,y-.1,z+.58,.02,.1,.02,COL.iron);
  if(shape)B.sph(x,y-.3,z+.62,.1,.1,.03,shape,0);}
function post(K,x,z,h,col,t=.16){K.B.box(x,K.gh(x,z)-.25,z,t,h+.25,t,col||COL.wood);}
function crenLine(B,x1,z1,x2,z2,y,col,n,sz=.4){for(let i=0;i<n;i++){const t=(i+.5)/n;B.box(lerp(x1,x2,t),y,lerp(z1,z2,t),sz,.5,sz,col,Math.atan2(x2-x1,z2-z1));}}
function crenRing(B,cx,y,cz,R,n,col,sz=.42){for(let k=0;k<n;k++){const a=k/n*TAU;B.box(cx+Math.sin(a)*R,y,cz+Math.cos(a)*R,sz,.5,sz,col,a);}}
function plants(K,x0,z0,w,d,cols,step=.42){const B=K.B;for(let a=0;a<=w/step;a++)for(let b=0;b<=d/step;b++){const x=x0-w/2+a*step,z=z0-d/2+b*step,g=K.gh(x,z);B.sph(x,g+.2,z,.15,.13,.15,K.pick(cols),0);}}
// timber / plastered hall with roof; returns {base,top,hr}
function hall(K,o){const B=K.B,x=o.x||0,z=o.z||0,w=o.w,d=o.d,sh=o.sh||2,st=o.st||1,rt=o.roof||'thatch';
  const [mn,mx]=K.rect(w/2+.2,d/2+.2,x,z);const base=mx+.15;B.box(x,mn-.6,z,w+.3,base-mn+.6,d+.3,o.found||COL.stoneF);
  let y=base;
  for(let s=0;s<st;s++){const dd=d+(o.jetty&&s>0?.5:0);B.box(x,y,z,w,sh,dd,(s===0&&o.low!=null)?o.low:o.wall);
    if(o.frame&&!(s===0&&o.low!=null))timberFrame(K,x,z,w,dd,y,sh,false,false,o.beam||COL.beam);
    if(o.jetty&&s<st-1)B.box(x,y+sh-.14,z,w+.04,.18,d+.56,COL.beamD);
    y+=sh;}
  const dT=d+(o.jetty&&st>1?.5:0),th=rt==='thatch',col=o.roofCol!=null?o.roofCol:K.pick(ROOF[rt]);
  const hr=o.noRoof?0:gable(B,{x,z,top:y,len:w,span:dT,k:o.pitch||(th?1.05:.85),t:o.roofT||(th?.38:.2),col,wall:o.gableCol!=null?o.gableCol:o.wall,ov:o.ov!=null?o.ov:(th?.45:.32),cap:th?0x8a6f3a:undefined,rows:!th,eA:o.eA,eB:o.eB});
  return {base,top:y,hr,dT,col,x,z,w,d,sh};}
function winsFront(K,R,n,shut,skipX,both){const hz=R.d/2;for(const f of both?[1,-1]:[1])for(let i=0;i<n;i++){const px=R.x-R.w/2+(i+.5)*R.w/n;if(f===1&&skipX!=null&&Math.abs(px-skipX)<.8)continue;win(K,px,R.base+.85,R.z+f*hz,f,'z',shut);}}
function dome(K,x,z,r,flame){const B=K.B,g=K.gh(x,z);B.sph(x,g+.1,z,r,r*.85,r,0xcab08a,1);B.cyl(x,g-.15,z,r*1.05,.3,COL.stoneF,10);B.box(x,g+.08,z+r*.85,r*.5,r*.4,.2,COL.dark);
  if(flame){K.flame(x,g+.12,z+r*.78,.32);K.smoke(x,g+r*.95,z,.8);}}
function palisade(K,pts,gate,h=2.2){const B=K.B;for(let i=0;i<pts.length-1;i++){const [x1,z1]=pts[i],[x2,z2]=pts[i+1],n=Math.round(Math.hypot(x2-x1,z2-z1)/.5);
  for(let s=0;s<n;s++){const x=lerp(x1,x2,s/n),z=lerp(z1,z2,s/n);if(gate&&gate(x,z))continue;const g=K.gh(x,z),hh=h*(.9+K.rng()*.2);B.cyl(x,g-.3,z,.17,hh+.3,COL.woodD,5);B.cone(x,g+hh,z,.17,.3,COL.woodD,5);}}}

// ============================================================ AGE 2
defBuilding({type:'stable',age:2,name:'Stable',desc:'Stalls for horses and ponies, with hay and tack.',variants:['Long Stable','Open Shed','Round Stable'],r:5,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G;
  if(vi===0){const R=hall(K,{w:6.2,d:3,sh:1.9,wall:COL.plank,frame:true,beam:COL.beamD,x:0,z:-.8,found:COL.stoneD,low:COL.plank}),zf=R.z+1.5;
    for(let i=0;i<3;i++){const px=-1.9+i*1.9;B.box(px,R.base,zf+.02,1.05,1.5,.06,COL.dark);B.box(px,R.base,zf+.07,1.05,.75,.07,COL.door);B.box(px,R.base+.7,zf+.12,1.1,.06,.06,COL.iron);G.box(px,R.base+1.75,zf+.12,.12,.16,.12,0xffd890);}
    B.box(0,R.base+R.sh+.3,zf+.05,.9,.7,.08,COL.dark);B.box(0,R.base+R.sh+.25,zf+.1,1.1,.06,.08,COL.woodL);
    B.box(-1.9,K.gh(-1.9,zf+.8),zf+.8,1.5,.38,.4,COL.woodD);B.cyl(-1.9,K.gh(-1.9,zf+.8)+.3,zf+.8,.01,.02,COL.water,6);
    for(let i=0;i<3;i++)bale(K,3.7,-.9,K.gh(3.7,-.9)+i*.4,i*.15);bale(K,3.7,-1.2,K.gh(3.7,-.9)+.4);
    fence(K,[[-3.7,.4],[-3.7,4],[3.2,4],[3.2,.4]],.95);horse(K,.8,2.8,.5,0x7a4a2a);horse(K,-1.8,3.0,-.3,0xc8b08a);barrel(K,3.3,-.2);}
  else if(vi===1){const w=6,d=3.2,hd=d/2,base=BH.pad(K,w/2,hd,COL.stoneD),by=base;
    B.box(0,by,-hd,w,2.9,.16,COL.plank);for(const f of [-1,1])B.box(f*w/2,by,0,.16,2.5,d,COL.plank);
    for(const px of [-w/2,-w/6,w/6,w/2])B.box(px,by,hd,.2,2.2,.2,COL.woodD);B.box(0,by+2.1,hd,w+.2,.2,.2,COL.woodD);
    B.boxC(0,by+2.65,.1,w+.8,.26,d+1.0,K.pick(ROOF.thatch),Math.atan(.8/3.2),0,0);
    for(const px of [-w/6,w/6])B.box(px,by,-.3,.1,1.2,2.3,COL.woodD);
    B.box(-w/2+.5,by+.9,-hd+.25,.9,.1,.3,COL.woodL);B.sph(-w/2+.55,by+1.1,-hd+.3,.4,.2,.2,COL.hay,0);
    horse(K,-2,-.2,0,0x6e4a30);horse(K,0,-.2,0,0xd0c0a0);bale(K,2.1,-.6,by);bale(K,2.1,-.6,by+.4);sack(K,2.5,.5,by);
    B.box(0,K.gh(0,hd+.6),hd+.65,2.6,.34,.4,COL.woodD);G.box(2.2,by+1.8,hd+.15,.12,.16,.12,0xffd890);
    fence(K,[[-3.6,hd+1.4],[3.6,hd+1.4],[3.6,.4]],.95,COL.woodL,1.05);fence(K,[[-3.6,hd+1.4],[-3.6,.4]],.95);}
  else{const R0=2.3,[mn,mx]=K.rect(R0,R0),base=mx+.15;B.cyl(0,mn-.6,0,R0+.25,base-mn+.6,COL.stoneF,12);
    B.cyl(0,base,0,R0,1.7,COL.plank,12);B.cone(0,base+1.6,0,R0+.65,2.7,K.pick(ROOF.thatch),12);B.cyl(0,base+4.2,0,.35,.4,0x8a6f3a,6);
    door(B,0,base,R0*.97,COL.door,1.0,1.5);G.box(0,base+1.7,R0*.97+.05,.14,.18,.12,0xffd890);
    const pts=[];for(let i=0;i<=11;i++){const a=-2.1+i*4.2/11;pts.push([Math.sin(a)*4.1,Math.cos(a)*4.1]);}
    fence(K,pts,.95,COL.woodL,1.1);horse(K,.5,2.9,1.2,0x6e4a30);horse(K,-1.9,2.6,-.6,0xc8b08a);
    B.box(1.9,K.gh(1.9,1.2),1.2,1.2,.36,.4,COL.woodD,.9);bale(K,-2.9,-.2);bale(K,-2.9,-.2,K.gh(-2.9,-.2)+.4);K.smoke(0,base+4.5,0,.6);}
  return {name:['Longstable','Open-Sided Stable','Round Stable'][vi]};}});

defBuilding({type:'bakery',age:2,name:'Bakery',desc:'Bakes the daily bread in clay ovens.',variants:['Clay Oven House','Stone Bakehouse','Beehive Ovens'],r:4.6,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G;
  if(vi===0){const R=hall(K,{w:3.6,d:3,sh:1.9,wall:K.pick(PLASTER),frame:true,x:-.6,z:-.4});door(B,-.6,R.base,R.z+1.5,COL.door);winsFront(K,R,2,K.pick(SHUT),-.6);
    G.box(R.x+R.w/2+.05,R.base+.9,R.z,.04,.5,.4,0xffe0a0);dome(K,2.2,-.4,.95,true);B.box(2.2,K.gh(2.2,-.4)+.8,.5,.06,.06,1.8,COL.woodL);
    B.box(.4,K.gh(.4,1.9),1.9,1.4,.5,.6,COL.wood);for(let i=0;i<4;i++)B.sph(-.1+i*.35,K.gh(.4,1.9)+.62,1.9,.15,.1,.12,0xc99a5a,0);
    for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)B.hcyl(-3+i*.3,K.gh(-3,-1)+.15+r*.28,-1.2,.13,1.1,COL.wood,'x');sack(K,-2.6,1.5);sack(K,-2.3,1.8);}
  else if(vi===1){const R=hall(K,{w:4,d:3.2,sh:2.1,wall:K.pick(STONE),roof:'tile',found:COL.stoneD,x:0,z:-.4});door(B,-.9,R.base,R.z+1.6,COL.door,.9,1.6);
    winsFront(K,R,3,K.pick(SHUT),-.9);chimney(K,1.2,R.base+1.2,R.z-.5,R.top+R.hr+.9,.7,COL.stoneD,1.4);
    B.sph(0,R.base+.5,R.z-1.8,1.3,.9,.9,0xcab08a,1);K.smoke(0,R.base+1.4,R.z-1.8,.8);
    B.box(1.1,R.base,R.z+1.85,1.6,.8,.5,COL.wood);B.boxC(1.1,R.base+1.75,R.z+2.0,2,.1,1.0,K.pick(BANNER),.5,0,0);
    for(const px of [.4,1.8])B.box(px,R.base,R.z+2.35,.07,1.75,.07,COL.woodD);for(let i=0;i<5;i++)B.sph(.5+i*.3,R.base+.9,R.z+1.9,.13,.09,.11,0xc99a5a,0);
    sign(K,-1.9,R.base+2.0,R.z+1.6,COL.woodL,COL.gold);barrel(K,-2.4,R.z+1.9);sack(K,-2.2,R.z+2.3);}
  else{const w=5.2,d=2.6,base=BH.pad(K,w/2,d/2,COL.stoneD);
    for(const px of [-w/2,w/2])for(const pz of [-d/2,d/2])B.box(px,base,pz,.22,2.2,.22,COL.woodD);B.box(0,base+2.1,d/2,w+.2,.2,.2,COL.woodD);B.box(0,base+2.1,-d/2,w+.2,.2,.2,COL.woodD);
    gable(B,{x:0,z:0,top:base+2.3,len:w,span:d,k:.95,t:.38,col:K.pick(ROOF.thatch),ov:.5,cap:0x8a6f3a});B.box(0,base,-d/2,w,2.2,.14,COL.plank);
    for(let i=0;i<3;i++)dome(K,-1.7+i*1.7,-.4,.75,true);
    B.box(0,base,1.55,2,.6,.7,COL.wood);for(let i=0;i<6;i++)B.sph(-.7+i*.28,base+.7,1.55,.12,.09,.1,0xc99a5a,0);
    for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.hcyl(2.4+r*.0+i*.0,base+.15+r*.28,-1.5+i*.3,.13,.9,COL.wood,'x');sack(K,-2.9,1.7);sack(K,-2.5,1.9);G.box(2.5,base+1.7,d/2,.12,.16,.12,0xffd890);}
  return {name:['Clay Oven Bakery','Stone Bakehouse','Beehive Bakery'][vi]};}});

defBuilding({type:'weaver',age:2,name:'Weaver',desc:'Spins wool and weaves cloth on upright looms.',variants:['Loom Hall','Dye Works','Spinner\'s Hut'],r:4.6,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G;
  const loom=(x,z,y)=>{for(const f of [-1,1])B.box(x+f*.65,y,z,.1,1.9,.1,COL.woodD);B.box(x,y+1.8,z,1.5,.1,.12,COL.wood);B.box(x,y+.35,z,1.4,.08,.1,COL.wood);
    for(let i=0;i<9;i++){B.box(x-.6+i*.15,y+.4,z,.02,1.4,.02,0xe8dcc0);B.sph(x-.6+i*.15,y+.3,z,.06,.07,.06,COL.stoneD,0);}B.box(x,y+.8,z+.02,1.2,.55,.03,K.pick(BANNER));};
  if(vi===0){const R=hall(K,{w:4.6,d:3.2,sh:1.9,wall:K.pick(PLASTER),frame:true,x:0,z:-.5});B.box(-.2,R.base,R.z+1.55,2.2,1.9,.1,COL.dark);
    door(B,-1.6,R.base,R.z+1.6,COL.door);loom(-.3,R.z+1.2,R.base);winsFront(K,R,1,K.pick(SHUT));G.box(1.6,R.base+.9,R.z+1.65,.4,.5,.04,0xffe0a0);
    for(let i=0;i<4;i++)B.cyl(-2.8+i*.2,R.base+1.0,R.z+1.9,.1,.4,K.pick([0xc9b48a,0x8a3a2a,0x3b5675,0xe8dcc0]),6,.4);
    sack(K,2.9,1.4,null,0xe8e0d0);sack(K,3.2,1.2);B.box(3,K.gh(3,-1.5),-1.5,.8,.5,.5,COL.plank);chimney(K,1.5,R.base+1.4,R.z-.8,R.top+R.hr+.6,.5,COL.stoneD,.7);}
  else if(vi===1){const R=hall(K,{w:3.4,d:2.6,sh:1.8,wall:K.pick(PLASTER),frame:true,x:0,z:-1.6});door(B,0,R.base,R.z+1.3,COL.door);winsFront(K,R,2,K.pick(SHUT),0);
    const cols=[0xa0402c,0x3b5675,0xd0a030];for(let i=0;i<3;i++){const x=-1.5+i*1.5,z=1.2,g=K.gh(x,z);B.cyl(x,g,z,.5,.65,COL.woodD,10);B.cyl(x,g+.6,z,.42,.04,cols[i],10);B.cyl(x,g+.64,z,.2,.02,_shade(cols[i],1.2),8);}
    B.box(-1.5,K.gh(-1.5,1.9)+.0,2.0,.6,.2,.4,COL.stoneD);K.flame(-1.5,K.gh(-1.5,2.0)+.2,2.0,.35);K.smoke(-1.5,K.gh(-1.5,1.2)+1.1,1.2,.9);
    for(const sx of [-1,1]){const x=sx*3.1,z=-.2,g=K.gh(x,z);B.box(x-.7,g,z,.1,1.8,.1,COL.woodD);B.box(x+.7,g,z,.1,1.8,.1,COL.woodD);B.box(x,g+1.75,z,1.6,.08,.1,COL.wood);
      B.box(x-.3,g+.7,z,.5,1.0,.04,sx<0?cols[0]:cols[1]);B.box(x+.35,g+.9,z,.5,.85,.04,sx<0?cols[2]:0xe8dcc0);}
    barrel(K,1.9,-.4);chimney(K,1,R.base+1.2,R.z-.6,R.top+R.hr+.6,.5,COL.stoneD,.6);}
  else{const R0=1.9,[mn,mx]=K.rect(R0,R0,0,-1.2),base=mx+.15;B.cyl(0,mn-.6,-1.2,R0+.25,base-mn+.6,COL.stoneF,12);B.cyl(0,base,-1.2,R0,1.5,COL.plank,12);
    B.cone(0,base+1.45,-1.2,R0+.6,2.4,K.pick(ROOF.thatch),12);door(B,0,base,-1.2+R0*.97,COL.door,.9,1.4);G.box(1.0,base+.8,-1.2+R0*.82,.3,.4,.04,0xffe0a0);K.smoke(0,base+3.9,-1.2,.7);
    fence(K,[[-2.8,1.4],[-2.8,3.8],[0,3.8],[0,1.4],[-2.8,1.4]],.8);sheep(K,-1.9,2.6,.5);sheep(K,-.9,3.1,-.6);sheep(K,-1.4,2.0,2);
    const g=K.gh(2.4,1.6);B.box(1.8,g,1.6,.1,1.9,.1,COL.woodD);B.box(3.0,g,1.6,.1,1.9,.1,COL.woodD);B.box(2.4,g+1.8,1.6,1.4,.08,.1,COL.wood);
    for(let i=0;i<5;i++)B.cyl(1.95+i*.25,g+1.2,1.6,.1,.55,K.pick([0xe8e0d0,0xc9b48a,0x8a3a2a]),6,.4);
    sack(K,2.5,.4,null,0xe8e0d0);sack(K,2.9,.2,null,0xe8e0d0);}
  return {name:['Weaver\'s Hall','Dye Works','Spinner\'s Hut'][vi]};}});

defBuilding({type:'barracks',age:2,name:'Barracks',desc:'Quarters for the warriors of the tribe.',variants:['Longhouse Barracks','Palisade Fort','Watch Barracks'],r:5.6,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G;
  const shield=(x,y,z,col)=>{B.hcyl(x,y,z+.13,.28,.1,col,'z',8);B.hcyl(x,y,z+.15,.08,.05,COL.iron,'z',6);};
  if(vi===0){const R=hall(K,{w:8,d:3.4,sh:1.9,wall:COL.wood,found:COL.stoneD,x:0,z:-.6,pitch:.9,roofT:.38});const zf=R.z+1.7;
    for(let i=0;i<9;i++)B.hcyl(0,R.base+.2+i*.2,zf+.02,.1,8,COL.woodL,'x',5);
    door(B,0,R.base,zf,COL.door,1.1,1.7);for(let i=0;i<5;i++){if(i===2)continue;shield(-3.2+i*1.6,R.base+1.2,zf,i%2?BANNER[0]:BANNER[1]);}
    K.flag(3.8,R.base,zf+.2,BANNER[0],1.1,3);G.box(-3.9,R.base+1.0,R.z,.05,.4,.3,0xffe0a0);
    for(let i=0;i<4;i++)B.beam(-3.2+i*.25,K.gh(-3.2,zf+.8),zf+.8,-3.2+i*.25+.2,K.gh(-3.2,zf+.8)+1.6,zf+.9,.05,COL.iron);B.box(-2.8,K.gh(-3,zf+.8),zf+.8,1.4,.1,.3,COL.woodD);
    B.cyl(1.6,K.gh(1.6,zf+1.6),zf+1.6,.4,.2,COL.stoneD,8);K.flame(1.6,K.gh(1.6,zf+1.6)+.2,zf+1.6,.8);K.smoke(0,R.top+R.hr+.4,R.z,1.1);}
  else if(vi===1){const S=3.4;palisade(K,[[-S,-S],[S,-S],[S,S],[-S,S],[-S,-S]],(x,z)=>z>S-.1&&Math.abs(x)<1.1);
    for(const f of [-1,1]){const g=K.gh(f*1.3,S);B.box(f*1.3,g-.3,S,.3,3.4,.3,COL.woodD);B.cone(f*1.3,g+3.1,S,.2,.45,COL.woodD,5);}B.box(0,K.gh(0,S)+2.8,S,2.9,.3,.3,COL.woodD);
    K.flag(0,K.gh(0,S)+3,S,BANNER[0],1,1.2);const R1=hall(K,{w:3,d:2.4,sh:1.7,wall:COL.wood,x:-1.5,z:-1.6,found:COL.stoneD,pitch:1.0});door(B,-1.5,R1.base,R1.z+1.2,COL.door,.8,1.4);G.box(-.8,R1.base+.8,R1.z+1.22,.3,.4,.04,0xffe0a0);
    const R2=hall(K,{w:2.4,d:2.4,sh:1.5,wall:COL.wood,x:2,z:-1.6,found:COL.stoneD,pitch:1.0});door(B,2,R2.base,R2.z+1.2,COL.door,.8,1.3);
    B.cyl(0,K.gh(0,1)+.0,1,.45,.2,COL.stoneD,8);K.flame(0,K.gh(0,1)+.2,1,.8);K.smoke(0,K.gh(0,1)+1.2,1,1);
    for(let i=0;i<4;i++)B.beam(-2.6+i*.25,K.gh(-2.6,1.8),1.8,-2.6+i*.25+.1,K.gh(-2.6,1.8)+1.5,1.9,.05,COL.iron);B.box(-2.3,K.gh(-2.3,1.8),1.8,1.2,.1,.3,COL.woodD);barrel(K,2.7,1.5);crate(K,2.7,.8);}
  else{const R=hall(K,{w:5,d:3.4,sh:2,st:2,jetty:true,wall:K.pick(PLASTER),low:K.pick(STONE),frame:true,found:COL.stoneD,x:-.6,z:-1.4,roof:'thatch',pitch:.95,ov:.5});const zf=R.z+1.7;
    door(B,-.6,R.base,zf,COL.door,1.0,1.6);winsFront(K,R,3,K.pick(SHUT),-.6);for(const px of [-2.4,-.8,.8,1.6])win(K,px-.6+.6,R.base+2.9,R.z+1.95,1,'z',K.pick(SHUT));
    shield(-2.2,R.base+1.0,zf,BANNER[1]);shield(1.0,R.base+1.0,zf,BANNER[0]);chimney(K,1.3,R.base+1.8,R.z-.8,R.top+R.hr+.8,.6,COL.stoneD,1.2);
    const gx=2.7,gz=1.4;K.flag(gx+.6,K.gh(gx,gz),gz,BANNER[0],1.1,4);
    const g=K.gh(gx-1,gz+1.2);B.cyl(gx-1.4,g,gz+1.2,.15,1.6,COL.woodD,6);B.sph(gx-1.4,g+1.6,gz+1.2,.22,.22,.22,COL.hay,0);B.box(gx-1.4,g+1.15,gz+1.2,.9,.1,.1,COL.wood);
    for(let i=0;i<4;i++)B.beam(-3.3+i*.25,K.gh(-3.3,1.9),1.9,-3.3+i*.25+.1,K.gh(-3.3,1.9)+1.5,2.0,.05,COL.iron);B.box(-3,K.gh(-3,1.9),1.9,1.2,.1,.3,COL.woodD);
    B.cyl(gx+.6,K.gh(gx+.6,gz+1.4),gz+1.4,.3,.5,COL.iron,6);K.flame(gx+.6,K.gh(gx+.6,gz+1.4)+.5,gz+1.4,.5);}
  return {name:['Warrior Longhouse','Palisade Fort','Watch Barracks'][vi]};}});

defBuilding({type:'apothecary',age:2,name:'Apothecary',desc:'Herbs and remedies for the sick and wounded.',variants:['Herb Hut','Healer\'s House','Physic Garden'],r:4.2,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G;const herbs=[0x4f7a35,0x7fa04a,0x9b59b6,0xe8e0d0];
  const bundles=(x0,x1,y,z)=>{B.box((x0+x1)/2,y,z,x1-x0,.05,.05,COL.woodD);for(let x=x0+.2;x<x1;x+=.3)B.cyl(x,y-.42,z,.1,.4,K.pick([0x4f7a35,0x7fa04a,0x8a7a4a]),6,.3);};
  if(vi===0){const R=hall(K,{w:3.2,d:2.7,sh:1.8,wall:K.pick(PLASTER),frame:true,x:0,z:-.5,pitch:1.1});door(B,.8,R.base,R.z+1.35,COL.door,.8,1.5);win(K,-.7,R.base+.9,R.z+1.35,1,'z',K.pick(SHUT));
    bundles(-1.4,-.2,R.base+1.75,R.z+1.5);chimney(K,-1,R.base+1.3,R.z-.7,R.top+R.hr+.6,.5,COL.stoneD,.7);
    for(let r=0;r<2;r++)plants(K,-.4+r*.4,2.2+r*.0,3.0,.4,herbs,.4);B.box(-.4,K.gh(-.4,2.4)-.1,2.2,3.2,.2,.8,COL.soil);plants(K,-.4,2.2,3.0,.6,herbs,.4);
    sign(K,1.9,R.base+1.9,R.z+1.4,COL.woodL,0x4f7a35);barrel(K,-2.3,R.z+1.9);}
  else if(vi===1){const R=hall(K,{w:3.8,d:3,sh:2,st:1,wall:K.pick(PLASTER),frame:true,x:-.4,z:-.6,roof:'thatch'});door(B,-1.2,R.base,R.z+1.5,COL.door,.85,1.6);winsFront(K,R,2,K.pick(SHUT),-1.2);G.box(R.x+R.w/2+.05,R.base+.9,R.z,.04,.5,.4,0xffe0a0);
    sign(K,.9,R.base+2.0,R.z+1.5,COL.woodL,0x8a8f96);chimney(K,.6,R.base+1.4,R.z-.7,R.top+R.hr+.7,.5,COL.stoneD,.8);
    const cx=2.1,cz=1.5,g=K.gh(cx,cz);for(let i=0;i<3;i++){const a=i/3*TAU;B.beam(cx+Math.sin(a)*.5,g,cz+Math.cos(a)*.5,cx,g+1.2,cz,.06,COL.iron);}
    B.sph(cx,g+.65,cz,.36,.3,.36,COL.iron,1);B.cyl(cx,g+.84,cz,.26,.02,0x4f7a35,8);K.flame(cx,g+.05,cz,.45);K.smoke(cx,g+1.2,cz,.9);
    B.box(-1.8,K.gh(-1.8,2),2.1,1.4,.5,.5,COL.wood);for(let i=0;i<4;i++)B.cyl(-2.3+i*.32,K.gh(-1.8,2)+.5,2.1,.1,.22,K.pick([0x8a3a2a,0x3b5675,0x4f7a35,COL.gold]),6);}
  else{const R=hall(K,{w:2.6,d:2.4,sh:1.7,wall:K.pick(PLASTER),frame:true,x:-.2,z:-2.2,roof:'thatch'});door(B,-.2,R.base,R.z+1.2,COL.door,.8,1.4);win(K,.8,R.base+.9,R.z+1.2,1,'z',K.pick(SHUT));
    for(const [x,z] of [[-1.6,.3],[1.2,.3],[-1.6,1.9],[1.2,1.9]]){const g=K.gh(x,z);B.box(x,g-.1,z,1.7,.35,1.2,COL.wood);B.box(x,g+.2,z,1.5,.16,1,COL.soil);plants(K,x,z,1.3,.8,herbs,.4);}
    fence(K,[[-2.8,-.4],[-2.8,3.1],[2.4,3.1],[2.4,-.4]],.8,COL.woodL,1.1);
    for(let i=0;i<2;i++){const x=2.8,z=-1.2+i*1.0,g=K.gh(x,z);B.cone(x,g+.05,z,.35,.6,COL.hay,8);B.sph(x,g+.62,z,.07,.07,.07,COL.hay,0);}B.box(2.8,K.gh(2.8,-1.2),-1.2,.7,.04,.7,COL.plank);
    barrel(K,-2.2,-1.1);sign(K,1.1,R.base+1.9,R.z+1.2,COL.woodL,0x4f7a35);}
  return {name:['Herb Hut','Healer\'s House','Physic Garden'][vi]};}});

// ============================================================ AGE 3
const padAt=(K,hw,hd,ox,oz,col)=>{const [mn,mx]=K.rect(hw+.2,hd+.2,ox,oz),base=mx+.15;K.B.box(ox,mn-.6,oz,hw*2+.3,base-mn+.6,hd*2+.3,col||COL.stoneD);return base;};
function arch(B,x,y,z,w,h){B.box(x,y,z,w,h,.14,COL.dark);B.hcyl(x,y+h,z,w/2,.14,COL.dark,'z',10);}
function archFrame(B,x,y,z,w,h,col){B.box(x-w/2-.15,y,z,.3,h,.3,col);B.box(x+w/2+.15,y,z,.3,h,.3,col);B.hcyl(x,y+h,z,w/2+.3,.3,col,'z',10);}
function lancet(K,x,y,z,f,ax,w=.4,h=1.0){const G=K.G,B=K.B;
  if(ax==='z'){G.box(x,y,z+f*.04,w,h,.04,GLASS);G.hcyl(x,y+h,z+f*.04,w/2,.04,GLASS,'z',8);B.box(x,y-.08,z+f*.03,w+.24,.08,.1,COL.stoneF);}
  else{G.box(x+f*.04,y,z,.04,h,w,GLASS);G.hcyl(x+f*.04,y+h,z,w/2,.04,GLASS,'x',8);B.box(x+f*.03,y-.08,z,.1,.08,w+.24,COL.stoneF);}}
function pyramid(B,x,y,z,s,h,col){B.cone(x,y,z,s*.74,h,col,4,PI/4);}
function sGable(B,o){return gable(B,Object.assign({k:.95,t:.2,rows:true,ov:.3},o));}
function cross(B,x,y,z,s=1){B.box(x,y,z,.08*s,.8*s,.08*s,COL.gold);B.box(x,y+.5*s,z,.4*s,.08*s,.08*s,COL.gold);}

defBuilding({type:'monastery',age:3,name:'Monastery',desc:'Monks pray, copy and tend the sick behind quiet stone walls.',variants:['Cloister','Abbey Church','Hill Priory'],r:7.5,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,st=K.pick(STONE),slate=K.pick(ROOF.slate),tile=K.pick(ROOF.tile);
  if(vi===0){const base=padAt(K,4.3,5,0,0);B.box(0,base,1.6,4.4,.08,5.4,COL.leaf);
    B.box(-.6,base,-3.6,5.8,3.4,2.8,st);sGable(B,{x:-.6,z:-3.6,top:base+3.4,len:5.8,span:2.8,k:1.0,col:slate,wall:st});
    for(let i=0;i<3;i++)lancet(K,-2.4+i*1.5,base+1.2,-2.2,1,'z',.4,1.3);arch(B,-2.2,base,-2.17,.8,1.4);
    B.box(3.4,base,-3.6,2.2,6.2,2.2,st);pyramid(B,3.4,base+6.2,-3.6,2.2,3,slate);cross(B,3.4,base+9.1,-3.6,.8);G.box(3.4,base+4.4,-2.5,.3,.8,.04,GLASS);G.box(2.3,base+4.4,-3.6,.04,.8,.3,GLASS);
    for(const f of [-1,1]){const x=f*3.2;B.box(x,base,1.3,1.8,2.4,5.6,st);sGable(B,{x,z:1.3,top:base+2.4,len:5.6,span:1.8,k:.9,col:tile,wall:st,axis:'z'});
      for(let i=0;i<3;i++){lancet(K,x-f*.91,base+1.0,-.2+i*1.5,-f,'x',.3,.8);}}
    chimney(K,-3.5,base+1.5,0,base+4.2,.5,st,1.1);
    for(let i=0;i<6;i++){const x=-2+i*.8;B.box(x,base,-1.3,.2,1.7,.2,COL.stoneF);}B.boxC(0,base+1.9,-1.75,5.8,.14,1.0,tile,-.3,0,0);
    
    for(const sx of [-1,1]){B.box(sx*1.65,base,4.5,1.3,1.5,.4,st);}B.box(-1.1,base,4.5,.3,2.4,.4,COL.stoneF);B.box(1.1,base,4.5,.3,2.4,.4,COL.stoneF);B.box(0,base+2.2,4.5,2.5,.3,.4,COL.stoneF);G.box(0,base+1.8,4.7,.14,.2,.1,0xffd890);
    const g=K.gh(0,1.6);B.cyl(0,base-.1,1.7,.7,.7,COL.stoneF,10);B.cyl(0,base+.6,1.7,.55,.03,COL.water,8);post(K,-.55,1.7,1.9,COL.woodD);post(K,.55,1.7,1.9,COL.woodD);B.box(0,base+1.85,1.7,1.3,.1,.1,COL.woodD);
    for(const sx of [-1,1])plants(K,sx*1.4,.0,1.2,1.0,[0x4f7a35,0x7fa04a,0xe8e0d0],.4);for(const sx of [-1,1])plants(K,sx*1.4,3.2,1.2,1.0,[0x4f7a35,0x7fa04a,0x9b59b6],.4);}
  else if(vi===1){const base=padAt(K,4.2,5.2,0,0);
    B.box(0,base,.6,3,3.6,7.4,st);sGable(B,{x:0,z:.6,top:base+3.6,len:7.4,span:3,k:1.04,col:slate,wall:st,axis:'z',t:.22});
    for(const f of [-1,1]){B.box(f*2.15,base,1.0,1.3,2.0,6.2,st);B.wedge(f*2.2,base+2.0,1.0,6.4,1.0,1.9,tile,f>0?PI/2:-PI/2);
      for(let i=0;i<4;i++){const z=-1.6+i*1.7;lancet(K,f*2.82,base+.8,z,f,'x',.34,1.0);B.box(f*2.9,base,z+.85,.35,2.3,.3,COL.stoneF);}}
    B.box(0,base,-.2,7.6,3.6,2.6,st);sGable(B,{x:0,z:-.2,top:base+3.6,len:7.6,span:2.6,k:1.2,col:slate,wall:st,t:.22});
    for(const f of [-1,1])lancet(K,f*3.85,base+1.0,-.2,f,'x',.5,1.4);
    B.box(0,base+3.6,-.2,2.2,3.2,2.2,st);pyramid(B,0,base+6.8,-.2,2.2,3.8,slate);cross(B,0,base+10.4,-.2,.9);for(const f of [-1,1]){G.box(f*1.12,base+5.2,-.2,.04,.9,.4,GLASS);G.box(0,base+5.2,f*1.12-.2,.4,.9,.04,GLASS);}
    B.cyl(0,base,-3.2,1.6,3.0,st,10);B.cone(0,base+3.0,-3.2,1.85,2.0,slate,10);for(let i=0;i<3;i++){const a=PI+(i-1)*.7;G.box(Math.sin(a)*1.6,base+1.0,-3.2+Math.cos(a)*1.6,.3,1.0,.3,GLASS);}
    archFrame(B,0,base,4.3,1.0,1.8,COL.stoneF);B.box(0,base,4.31,1.0,1.8,.08,COL.door);B.hcyl(0,base+1.8,4.31,.5,.08,COL.door,'z',10);G.hcyl(0,base+2.9,4.32,.5,.05,GLASS,'z',12);
    for(let i=0;i<8;i++){const a=i/8*TAU;B.beam(0,base+2.9,4.37,Math.cos(a)*.52,base+2.9+Math.sin(a)*.52,4.37,.05,COL.stoneD);}
    B.box(3.8,base,3.4,.8,1.6,2.4,st);B.boxC(3.8,base+1.9,3.4,1.0,.12,2.6,tile,0,0,.4);K.flag(0,base+10.4,-.2,BANNER[0],1.1,1);K.smoke(3.8,base+2.2,3.4,.5);}
  else{const base=padAt(K,4.6,4.4,0,0);
    B.cyl(-2.7,base-.4,-1.6,1.35,7.2,st,12);B.cyl(-2.7,base+6.6,-1.6,1.55,.3,COL.stoneF,12);B.cone(-2.7,base+6.8,-1.6,1.7,3.4,slate,12);cross(B,-2.7,base+10.1,-1.6,.7);
    for(let i=0;i<3;i++)G.box(-2.7+Math.sin(.4)*0,base+1.5+i*1.6,-1.6+1.34,.2,.7,.05,GLASS);door(B,-2.7,base,-1.6+1.3,COL.door,.8,1.5);K.flag(-2.7,base+7.0,-1.6,BANNER[3],1,.1);
    B.box(1.5,base,-1.6,3.2,2.8,4.4,st);sGable(B,{x:1.5,z:-1.6,top:base+2.8,len:4.4,span:3.2,k:.9,col:slate,wall:st,axis:'z'});for(let i=0;i<2;i++)lancet(K,1.5+1.61*(i?1:-1),base+1.0,-1.6,i?1:-1,'x',.4,1.1);
    lancet(K,1.5,base+1.2,.62,1,'z',.4,1.2);B.box(1.5,base,.62,.9,1.0,.12,COL.door);cross(B,1.5,base+2.8+1.45,-1.6+2.1,.8);B.box(1.5,base+2.8+1.5,-3.6,.5,.7,.5,st);B.cone(1.5,base+5.0,-3.8,.4,.4,slate,4,PI/4);
    B.box(3.8,base,.8,1.6,1.7,2.4,st);B.wedge(3.8,base+1.7,.8,2.0,.8,2.6,tile,PI/2);G.box(3.8,base+.9,2.02,.3,.4,.04,GLASS);chimney(K,4.1,base+1.5,.0,base+3.0,.5,st,.9);
    for(const f of [-1,1]){const x=f*2.4,z=3.8;}
    for(let i=0;i<14;i++){const x=-4.4+i*.63;if(Math.abs(x-0)<.9)continue;B.box(x,base,3.9,.65,1.1,.35,st);}B.box(-.85,base,3.9,.3,2.2,.4,COL.stoneF);B.box(.85,base,3.9,.3,2.2,.4,COL.stoneF);B.box(0,base+2.0,3.9,2,.3,.4,COL.stoneF);
    plants(K,-1.5,1.6,2,1.4,[0x4f7a35,0x7fa04a],.4);B.box(-1.5,base,1.6,2.2,.2,1.6,COL.soil);plants(K,-1.5,1.6,2,1.4,[0x4f7a35,0x7fa04a,0xe8e0d0],.4);}
  return {name:['Cloister Monastery','Abbey','Hill Priory'][vi]};}});

defBuilding({type:'manor',age:3,name:'Manor House',desc:'The hall of a local lord, with bailiff, kitchens and a fine solar.',variants:['Moated Manor','Half-Timber Manor','Fortified Manor'],r:7,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,st=K.pick(STONE),tile=K.pick(ROOF.tile),slate=K.pick(ROOF.slate),sh=K.pick(SHUT);
  if(vi===0){const base=padAt(K,4.6,3.8,0,0);
    for(const [mx,mz,sx,sz] of [[0,3.05,9.2,1.3],[0,-3.05,9.2,1.3],[3.75,0,1.7,4.8],[-3.75,0,1.7,4.8]])B.box(mx,base-.1,mz,sx,.13,sz,COL.water);B.box(0,base,0,6.0,.28,4.8,COL.stoneF);
    const R=hall(K,{w:5.2,d:3.2,sh:2.1,st:2,wall:st,roof:'tile',roofCol:tile,found:COL.stoneF,x:-.3,z:-.2,pitch:.9});
    B.box(2.8,R.base,.4,2.2,2.2,2.2,st);sGable(B,{x:2.8,z:.4,top:R.base+2.2,len:2.2,span:2.2,k:1.0,col:tile,wall:st,axis:'z'});
    B.box(-.3,R.base+2.1,R.z+1.62,5.3,.1,.14,COL.stoneF);
    door(B,-.3,R.base,R.z+1.6,COL.door,1.0,1.7);archFrame(B,-.3,R.base,R.z+1.62,1.0,1.7,COL.stoneF);
    for(let i=0;i<3;i++){if(i===1)continue;win(K,-1.7+i*1.4,R.base+.8,R.z+1.6,1,'z',sh);}for(let i=0;i<4;i++)win(K,-1.9+i*1.2,R.base+2.9,R.z+1.6,1,'z',sh);
    chimney(K,-2.3,R.base+2.0,R.z-.8,R.top+R.hr+1.0,.7,st,1.5);chimney(K,1.5,R.base+2.0,R.z-.8,R.top+R.hr+.9,.7,st,1.0);
    B.box(-.3,base+.05,3.05,1.7,.12,1.9,COL.plank);for(const f of [-1,1])B.box(-.3+f*.8,base+.1,3.05,.1,.5,1.8,COL.woodD);
    K.flag(2.8,R.base+2.2,.4,BANNER[1],.9,1.5);}
  else if(vi===1){const R=hall(K,{w:5.6,d:3,sh:2,st:2,jetty:true,wall:K.pick(PLASTER),low:st,frame:true,roof:'tile',roofCol:tile,x:-.4,z:-1.2,pitch:.85,found:COL.stoneD});
    const wx=3.0,wz=-.4,wd=4.4,wy=R.base;B.box(wx,wy,wz,3.0,2.0,wd,K.pick(PLASTER));timberFrame(K,wx,wz,3.0,wd,wy,2.0,false,false,COL.beam);B.box(wx,wy+2.0,wz,3.0,2.0,wd,K.pick(PLASTER));timberFrame(K,wx,wz,3.0,wd,wy+2.0,2.0,false,false,COL.beam);
    sGable(B,{x:wx,z:wz,top:wy+4.0,len:wd,span:3.0,k:.85,col:tile,wall:K.pick(PLASTER),axis:'z',ov:.3});
    door(B,-.4,R.base,R.z+1.5,COL.door,.95,1.6);for(let i=0;i<4;i++)if(i!==2)win(K,-2.4+i*1.4,R.base+.8,R.z+1.5,1,'z',sh);for(let i=0;i<4;i++)win(K,-2.4+i*1.4,R.base+2.9,R.z+1.75,1,'z',sh);
    win(K,wx,wy+.85,wz+wd/2,1,'z',sh);win(K,wx,wy+2.85,wz+wd/2,1,'z',sh);for(let i=0;i<2;i++)B.box(-1.8+i*2.8,R.base+2.35,R.z+1.95,.9,.2,.2,0x4a5a2a);
    chimney(K,-2.5,R.base+2.0,R.z-.8,R.top+R.hr+.9,.7,COL.stoneD,1.4);chimney(K,3.0,wy+3.6,wz-1.0,wy+4.0+1.35+.7,.6,COL.stoneD,1);
    fence(K,[[-3.4,2.4],[-3.4,3.6],[.0,3.6]],.85);fence(K,[[1.4,3.6],[4.2,3.6],[4.2,1.6]],.85);post(K,0,3.6,1.2);post(K,1.4,3.6,1.2);B.box(.7,K.gh(.7,3.6)+1.1,3.6,1.6,.1,.1,COL.woodD);
    plants(K,-1.8,2.6,2.4,.8,[0x4f7a35,0xc0392b,0xd4a73c],.4);sign(K,-2.9,R.base+2.0,R.z+1.5,COL.woodL,COL.gold);}
  else{const base=padAt(K,4.6,4.0,0,0);
    B.box(0,base,-.4,5.4,3.6,3.8,st);B.box(0,base+3.6,-.4,5.8,.3,4.2,COL.stoneF);crenLine(B,-2.9,1.7,2.9,1.7,base+3.9,st,8);crenLine(B,-2.9,-2.5,2.9,-2.5,base+3.9,st,8);crenLine(B,-2.9,-2.5,-2.9,1.7,base+3.9,st,6);crenLine(B,2.9,-2.5,2.9,1.7,base+3.9,st,6);
    sGable(B,{x:0,z:-.4,top:base+3.9,len:3.6,span:2.0,k:.9,col:tile,wall:st});
    B.cyl(-2.6,base-.4,-2.4,1.25,6.2,st,10);B.cyl(-2.6,base+5.6,-2.4,1.45,.3,COL.stoneF,10);B.cone(-2.6,base+5.8,-2.4,1.55,2.8,slate,10);K.flag(-2.6,base+8.5,-2.4,BANNER[0],.9,1.3);
    for(let i=0;i<2;i++)G.box(-2.6,base+1.6+i*1.7,-2.4+1.24,.2,.6,.05,GLASS);
    archFrame(B,.4,base,1.7,1.0,1.9,COL.stoneF);B.box(.4,base,1.72,1.0,1.9,.08,COL.door);B.hcyl(.4,base+1.9,1.72,.5,.08,COL.door,'z',10);
    for(let i=0;i<3;i++){lancet(K,-1.4+i*0+(i-1)*1.0*0-1.0+i*0,base+1.8,1.7,1,'z',.3,.8);}lancet(K,2.0,base+1.8,1.7,1,'z',.3,.8);lancet(K,-1.4,base+1.8,1.7,1,'z',.3,.8);G.box(.4,base+2.8,1.72,.3,.5,.04,GLASS);
    chimney(K,1.8,base+3.6,-1.4,base+5.6,.7,st,1.3);K.flag(2.4,base+4.0,-.4,BANNER[2],.9,1.4);
    for(const f of [-1,1]){B.box(f*3.3,base,3.5,.9,1.6,.4,st);}
    for(let i=0;i<4;i++){const x=-4.4+i*.9,x2=1.4+i*.9;B.box(x,base,3.6,.9,1.5,.4,st);B.box(x+.0+5.2,base,3.6,.9,1.5,.4,st);}
    B.box(1.2,base,3.6,.4,2.2,.5,COL.stoneF);B.box(-.4,base,3.6,.4,2.2,.5,COL.stoneF);arch(B,.4,base,3.62,1.2,1.7);B.box(.4,base+2.3,3.6,1.6,.3,.5,COL.stoneF);}
  return {name:['Moated Manor','Half-Timber Manor','Fortified Manor'][vi]};}});

function wallSeg(K,x1,z1,x2,z2,h,col,mer=true){const B=K.B,L=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.ceil(L/1.3)),ry=Math.atan2(x2-x1,z2-z1);
  for(let k=0;k<n;k++){const t=(k+.5)/n,px=lerp(x1,x2,t),pz=lerp(z1,z2,t),g=K.gh(px,pz);B.box(px,g-1.2,pz,1.1,h+1.2,L/n+.04,col,ry);if(mer&&k%2===0)B.box(px,g+h,pz,1.1,.5,L/n*.6,col,ry);}}
function slit(K,x,y,z,f,ax){if(ax==='z')K.B.box(x,y,z+f*.02,.14,.55,.05,COL.dark);else K.B.box(x+f*.02,y,z,.05,.55,.14,COL.dark);}

defBuilding({type:'gatehouse',age:3,name:'Gatehouse',desc:'A fortified gate through the town wall, with portcullis and murder holes.',variants:['Twin-Tower Gate','Barbican','Timber Town Gate'],r:6,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,st=K.pick(STONE),slate=K.pick(ROOF.slate),tile=K.pick(ROOF.tile);
  const bars=(x,y,z,w,h)=>{for(let i=0;i<=Math.round(w/.35);i++)B.box(x-w/2+i*.35,y,z,.06,h,.06,COL.iron);for(let j=0;j<4;j++)B.box(x,y+.3+j*h/4,z,w,.06,.06,COL.iron);};
  if(vi===0){const base=padAt(K,5.2,2.2,0,0);
    for(const f of [-1,1]){const x=f*2.5;B.cyl(x,base-.3,0,1.5,6.7,st,12);B.cyl(x,base+6.2,0,1.72,.3,COL.stoneF,12);B.cone(x,base+6.4,0,1.85,3.0,slate,12);K.flag(x,base+9.3,0,BANNER[f>0?0:1],.9,1.2);
      for(let i=0;i<2;i++)slit(K,x,base+2.0+i*1.8,1.5,1,'z');G.box(x,base+4.4,1.49,.2,.5,.05,GLASS);
      wallSeg(K,f*3.8,0,f*5.4,0,3.6,st);}
    B.box(0,base+3.1,0,3.6,2.6,2.6,st);crenLine(B,-1.7,1.2,1.7,1.2,base+5.7,st,4);crenLine(B,-1.7,-1.2,1.7,-1.2,base+5.7,st,4);
    archFrame(B,0,base,1.2,2.0,2.8,COL.stoneF);arch(B,0,base,1.28,2.0,2.8);bars(0,base+.9,1.0,2.0,2.4);
    G.box(0,base+4.3,1.32,.3,.7,.05,GLASS);B.box(0,base+3.05,1.35,.6,.5,.12,COL.gold);}
  else if(vi===1){const base=padAt(K,5.2,3.6,0,0);
    for(const f of [-1,1]){const x=f*2.1;B.box(x,base,0,1.6,4.2,6.4,st);crenLine(B,x,-3.2,x,3.2,base+4.2,st,5,.7);for(let i=0;i<3;i++)slit(K,x-f*.81,base+2.4,-2+i*2,-f,'x');wallSeg(K,f*3.0,0,f*5.2,0,3.4,st);}
    B.box(0,base+3.1,-2.4,2.8,2.6,2.4,st);archFrame(B,0,base,3.2,2.6,2.7,COL.stoneF);arch(B,0,base,3.26,2.6,2.7);
    B.box(0,base+4.2,-2.4,2.8,3.0,2.4,st);pyramid(B,0,base+7.2,-2.4,3,3.0,slate);K.flag(0,base+10.2,-2.4,BANNER[0],1,1.2);G.box(0,base+5.4,-1.18,.3,.8,.05,GLASS);crenLine(B,-1.4,-1.2,1.4,-1.2,base+7.2,st,0);
    B.box(0,base,3.6,2.4,2.7,.12,COL.plank);for(const f of [-1,1])B.box(f*.9,base,3.67,.12,2.7,.1,COL.iron);for(let j=0;j<3;j++)B.box(0,base+.5+j*.9,3.67,2.4,.1,.1,COL.iron);
    for(const f of [-1,1])B.beam(f*1.0,base+2.7,3.6,f*1.0,base+3.5,3.2,.05,COL.iron);for(const f of [-1,1])G.box(f*1.7,base+3.0,3.22,.12,.18,.1,0xffd890);
    B.box(0,K.gh(0,0),0,2.5,.04,6.4,COL.plank);}
  else{const base=padAt(K,5.2,2.2,0,0);
    for(const f of [-1,1]){B.box(f*2.0,base,0,1.6,3.3,2.6,st);wallSeg(K,f*3.0,0,f*5.2,0,3.4,st);B.box(f*2.0,base+3.3,0,1.8,.2,2.8,COL.stoneF);}
    B.box(0,base+3.1,0,2.5,.9,2.6,st);archFrame(B,0,base,1.35,2.4,2.4,COL.stoneF);arch(B,0,base,1.34,2.4,2.4);
    B.box(0,base+3.5,0,5.0,.3,3.0,COL.beamD);
    B.box(0,base+3.8,0,4.6,2.0,2.8,K.pick(PLASTER));timberFrame(K,0,0,4.6,2.8,base+3.8,2.0,false,false,COL.beam);gable(B,{x:0,z:0,top:base+5.8,len:4.6,span:2.8,k:.9,t:.2,col:tile,wall:K.pick(PLASTER),rows:true,ov:.4});
    win(K,-1.3,base+4.5,1.42,1,'z',K.pick(SHUT));win(K,1.3,base+4.5,1.42,1,'z',K.pick(SHUT));G.box(0,base+4.5,1.45,.4,.5,.04,GLASS);chimney(K,1.7,base+5,-.8,base+7.1,.6,COL.stoneD,.9);
    for(const f of [-1,1]){B.box(f*1.25,base,1.0,.12,2.3,1.1,COL.door,f*.9);}sign(K,-2.6,base+2.9,1.3,COL.woodL,COL.gold);K.flag(2.6,base+3.3,1.2,BANNER[1],.9,1.5);}
  return {name:['Twin-Tower Gatehouse','Barbican','Town Gate'][vi]};}});

defBuilding({type:'brewery',age:3,name:'Brewery',desc:'Brews ale and mead for the thirsty town.',variants:['Alehouse Brewhouse','Copper Brewery','Malthouse'],r:5,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,tile=K.pick(ROOF.tile);
  const stackBarrels=(x,z,y0)=>{for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)B.hcyl(x+(i-(2-r)/2)*.55,y0+.28+r*.5,z,.27,.8,COL.wood,'z',8);};
  if(vi===0){const R=hall(K,{w:4.6,d:3.2,sh:2,st:2,jetty:true,wall:K.pick(PLASTER),low:K.pick(STONE),frame:true,roof:'tile',roofCol:tile,x:-.3,z:-.6,found:COL.stoneD});
    door(B,-.3,R.base,R.z+1.6,COL.door,1.1,1.7);winsFront(K,R,3,K.pick(SHUT),-.3);for(let i=0;i<3;i++)win(K,-1.5+i*1.2,R.base+2.9,R.z+1.85,1,'z',K.pick(SHUT));
    B.box(-1.5,R.base+2.2,R.z+1.9,.8,.8,.1,COL.door);B.box(-1.5,R.base+3.4,R.z+1.9,.1,.1,1.0,COL.woodD);B.box(-1.5,R.base+2.6,R.z+2.8,.03,.8,.03,COL.hay);
    chimney(K,1.3,R.base+2,R.z-.8,R.top+R.hr+.9,.7,COL.stoneD,1.6);sign(K,1.6,R.base+2.0,R.z+1.6,COL.woodL,0x4f7a35);B.sph(2.1,R.base+1.2,R.z+2.2,.3,.3,.3,0x4f7a35,1);
    stackBarrels(2.6,1.3,K.gh(2.6,1.3));barrel(K,-2.5,1.8);barrel(K,-2.9,1.4);G.box(2.1,R.base+.9,R.z+1.64,.1,.16,.1,0xffd890);}
  else if(vi===1){const R=hall(K,{w:4.2,d:3,sh:2.4,wall:K.pick(STONE),roof:'slate',found:COL.stoneD,x:-.8,z:-.8,pitch:.9});door(B,-1.6,R.base,R.z+1.5,COL.door,1,1.7);winsFront(K,R,2,K.pick(SHUT),-1.6);
    chimney(K,-2.4,R.base+2.2,R.z-.9,R.top+R.hr+2.0,.8,K.pick(STONE),2.2);
    const bx=2.6,bz=-.6,by=R.base;for(const px of [bx-1,bx+1])for(const pz of [bz-1.1,bz+1.1])B.box(px,by,pz,.18,2.0,.18,COL.woodD);B.boxC(bx,by+2.2,bz,2.6,.2,3.0,K.pick(ROOF.shingle),0,0,0);B.box(bx,by,bz-1.1,2.2,2.0,.12,COL.plank);
    for(const [kx,kz] of [[bx-.2,bz-.4],[bx+.2,bz+.5]]){B.cyl(kx,by,kz,.55,.5,COL.stoneD,10);B.sph(kx,by+.75,kz,.62,.5,.62,0xb87a48,1);B.cyl(kx,by+1.2,kz,.2,.35,0xb87a48,8,.6);K.flame(kx,by+.1,kz+.55,.35);}K.smoke(bx,by+1.7,bz,1.0);
    for(let i=0;i<3;i++){barrel(K,-2.4+i*.7,1.8+i*.0,1);}B.box(-1.7,K.gh(-1.7,2.0),2.0,2.2,.15,.6,COL.woodD);barrel(K,.6,2.0);}
  else{const R1=hall(K,{w:2.8,d:2.8,sh:3.4,wall:K.pick(PLASTER),frame:true,roof:'tile',noRoof:true,x:-1.2,z:-.6,found:COL.stoneD});
    pyramid(B,-1.2,R1.top,-.6,2.8,2.6,tile);B.cyl(-1.2,R1.top+2.3,-.6,.4,.5,COL.woodD,8);B.cone(-1.2,R1.top+2.8,-.6,.6,.5,K.pick(ROOF.shingle),8);K.smoke(-1.2,R1.top+3.2,-.6,1.4);
    for(let i=0;i<2;i++)win(K,-1.2,R1.base+1.0+i*1.3,.8,1,'z',K.pick(SHUT));
    const R2=hall(K,{w:3.4,d:2.8,sh:1.8,wall:K.pick(PLASTER),frame:true,roof:'tile',roofCol:tile,x:1.5,z:-.6,found:COL.stoneD,pitch:.85});door(B,1.5,R2.base,R2.z+1.4,COL.door,1.1,1.5);win(K,2.5,R2.base+.8,R2.z+1.4,1,'z',K.pick(SHUT));
    for(let i=0;i<4;i++)sack(K,-.4+i*.45,1.7+(i%2)*.3);sack(K,-.2,1.75,K.gh(-.2,1.75)+.3);B.box(3.2,K.gh(3.2,1.2),1.2,1.2,.4,.7,COL.hay);
    for(let i=0;i<8;i++){const x=-1.2+i*.5-1.9+0,g=K.gh(x,2.9);B.cyl(x,g,2.9,.05,.5+(i%2)*.1,COL.hay,4);B.sph(x,g+.55,2.9,.07,.12,.07,COL.hay,0);}}
  return {name:['Alehouse Brewery','Copper Brewery','Malthouse'][vi]};}});

defBuilding({type:'tannery',age:3,name:'Tannery',desc:'Cures hides into leather in stinking pits.',variants:['Pit Tannery','Rack Tannery','Tanner\'s Row'],r:5,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,shing=K.pick(ROOF.shingle),hides=[0xc9b48a,0x9a7a52,0xe8dcc0,0xa88a60];
  const rack=(x,z,n=3,w=2.4)=>{const g=K.gh(x,z);for(const f of [-1,1])B.box(x+f*w/2,g-.2,z,.1,1.9,.1,COL.woodD);B.box(x,g+1.7,z,w+.2,.08,.1,COL.wood);for(let i=0;i<n;i++)B.box(x-w/2+.5+i*(w-.8)/Math.max(1,n-1),g+.55,z,.7,1.15,.04,K.pick(hides));};
  if(vi===0){const R=hall(K,{w:3.2,d:2.2,sh:1.7,wall:K.pick(PLASTER),frame:true,roof:'shingle',roofCol:shing,x:-.4,z:-2.0,found:COL.stoneD,pitch:.8});door(B,-.4,R.base,R.z+1.1,COL.door,.8,1.4);win(K,.7,R.base+.9,R.z+1.1,1,'z',K.pick(SHUT));chimney(K,-1.3,R.base+1.4,R.z-.5,R.top+R.hr+.5,.45,COL.stoneD,.5);
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){const x=-1.7+i*1.3,z=.2+j*1.3,g=K.gh(x,z);B.cyl(x,g-.1,z,.58,.5,COL.woodD,10);B.cyl(x,g+.38,z,.46,.03,K.pick([0x5a4a30,0x4a5a3a]),10);}
    rack(2.6,-.6,3,2.0);rack(2.6,1.5,2,2.0);const g=K.gh(-3.0,1.2);B.cone(-3.0,g,1.2,.8,.9,COL.woodD,8);barrel(K,-2.8,2.4);barrel(K,-2.3,2.7);for(let i=0;i<3;i++)B.box(-.4+i*.3,K.gh(-.4,2.6)+.0,2.6,.3,.1,.5,K.pick(hides));}
  else if(vi===1){const R=hall(K,{w:3.6,d:2.8,sh:1.9,wall:K.pick(PLASTER),frame:true,roof:'shingle',roofCol:shing,x:0,z:-1.6,found:COL.stoneD,pitch:.85});door(B,-.8,R.base,R.z+1.4,COL.door,.9,1.5);winsFront(K,R,2,K.pick(SHUT),-.8);
    chimney(K,1.2,R.base+1.4,R.z-.8,R.top+R.hr+.6,.5,COL.stoneD,.6);
    for(const [x,z] of [[-2.4,1.0],[0,1.6],[2.4,1.0]]){const g=K.gh(x,z);for(const f of [-1,1]){B.beam(x+f*.9,g,z-.5,x,g+1.9,z,.09,COL.woodD);B.beam(x+f*.9,g,z+.5,x,g+1.9,z,.09,COL.woodD);}B.box(x,g+1.85,z,.1,.1,1.0,COL.wood);for(let i=0;i<3;i++)B.box(x,g+.6,z-.5+i*.5,.06,1.2,.5,K.pick(hides));}
    const g2=K.gh(-2.9,-1.4);B.box(-2.9,g2+.2,-1.4,.9,.04,1.2,K.pick(hides));B.box(-2.9,g2,-1.4,1.0,.5,1.3,COL.woodD);B.beam(-2.5,g2+.5,-1.0,-3.2,g2+.9,-1.4,.08,COL.iron);
    barrel(K,2.8,-1.2);barrel(K,2.8,-.5);barrel(K,3.2,-.9);crate(K,-3.0,2.6);}
  else{const R=hall(K,{w:4.6,d:3,sh:1.9,st:2,jetty:true,wall:K.pick(PLASTER),frame:true,roof:'shingle',roofCol:shing,x:-.4,z:-1.2,found:COL.stoneD,low:COL.dark,pitch:.8});
    B.box(-.4,R.base,R.z+1.45,4.2,1.9,.1,COL.dark);for(const px of [-2.5,-.4,1.7])B.box(px,R.base,R.z+1.52,.28,1.9,.28,COL.stoneD);B.box(-.4,R.base+1.8,R.z+1.52,4.6,.25,.3,COL.beamD);
    B.box(-1.4,R.base,R.z+1.2,1.6,.5,.7,COL.woodD);B.box(.3,R.base,R.z+.9,.9,.6,.6,COL.plank);
    for(let i=0;i<3;i++)win(K,-1.5+i*1.2,R.base+2.9,R.z+1.85,1,'z',K.pick(SHUT));door(B,1.4,R.base+2.0,R.z+1.9,COL.door,.7,.9);
    for(let i=0;i<4;i++)B.box(-2.4+i*.9,R.base+1.1,R.z+1.9+.0,.7,1.0,.04,K.pick(hides));B.box(-.4,R.base+2.05,R.z+1.95,4.4,.08,.1,COL.wood);
    for(let i=0;i<2;i++){const x=2.9,z=-.3+i*1.5,g=K.gh(x,z);B.cyl(x,g-.1,z,.62,.5,COL.woodD,10);B.cyl(x,g+.38,z,.5,.03,i?0xcfcfc0:0x5a4a30,10);}
    B.box(2.9,K.gh(2.9,.5)+.3,.5,.3,.05,2.6,COL.plank);chimney(K,1.2,R.base+2,R.z-.9,R.top+R.hr+.7,.6,COL.stoneD,.7);barrel(K,-3.0,1.2);crate(K,-3.0,.5);}
  return {name:['Pit Tannery','Rack Tannery','Tanner\'s Row'][vi]};}});

defBuilding({type:'almshouse',age:3,name:'Almshouse',desc:'Charity homes for the old and the poor.',variants:['Row Almshouse','Courtyard Almshouse','Hospital Hall'],r:5.8,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,tile=K.pick(ROOF.tile),sh=K.pick(SHUT),pl=K.pick(PLASTER);
  if(vi===0){const R=hall(K,{w:8,d:2.6,sh:2,wall:pl,frame:true,roof:'tile',roofCol:tile,x:0,z:-1.0,found:COL.stoneD,pitch:.85});
    for(let i=0;i<4;i++){const x=-3+i*2;door(B,x-.4,R.base,R.z+1.3,COL.door,.75,1.5);win(K,x+.55,R.base+.85,R.z+1.3,1,'z',sh);if(i%2===0)chimney(K,x+1,R.base+1.8,R.z-.5,R.top+R.hr+.7,.55,COL.stoneD,.9);
      const g=K.gh(x,R.z+2.2);B.box(x,g-.1,R.z+2.2,1.5,.2,.8,COL.soil);plants(K,x,R.z+2.2,1.2,.5,[0x4f7a35,0x7fa04a,0xd4a73c],.4);}
    G.box(0,R.base+1.0,R.z+1.32,.01,.01,.01,0xffe0a0);const wx=0,wz=2.6;B.cyl(wx,K.gh(wx,wz)-.1,wz,.5,.8,COL.stoneF,8);B.cyl(wx,K.gh(wx,wz)+.7,wz,.38,.03,COL.water,8);}
  else if(vi===1){const R=hall(K,{w:6.4,d:2.4,sh:2,wall:pl,frame:true,roof:'tile',roofCol:tile,x:0,z:-2.4,found:COL.stoneD,pitch:.85});door(B,0,R.base,R.z+1.2,COL.door,.9,1.5);winsFront(K,R,4,sh,0);chimney(K,-2.4,R.base+1.8,R.z-.5,R.top+R.hr+.7,.55,COL.stoneD,.9);
    for(const f of [-1,1]){const x=f*2.8,z=.6,base=R.base;B.box(x,base,z,1.8,2,3.4,pl);timberFrame(K,x,z,1.8,3.4,base,2,false,false,COL.beam);gable(B,{x,z,top:base+2,len:3.4,span:1.8,k:.85,t:.2,col:tile,wall:pl,axis:'z',rows:true,ov:.3});door(B,x-f*.4,base,z+1.7,COL.door,.7,1.4);win(K,x+f*.4,base+.8,z+1.7,1,'z',sh);
      win(K,x-f*.9,base+.8,z,-f,'x',sh);}
    chimney(K,-2.8,R.base+1.8,-.3,R.base+3.4,.5,COL.stoneD,.8);
    const g=K.gh(0,.4);B.cyl(0,g-.1,.5,.55,.8,COL.stoneF,8);B.cyl(0,g+.7,.5,.4,.03,COL.water,8);post(K,-.5,.5,1.8);post(K,.5,.5,1.8);B.box(0,g+1.75,.5,1.2,.1,.1,COL.woodD);
    fence(K,[[-3.7,2.7],[-1.0,2.7]],.8);fence(K,[[1.0,2.7],[3.7,2.7]],.8);post(K,-.9,2.7,1.2);post(K,.9,2.7,1.2);B.box(0,K.gh(0,2.7)+1.15,2.7,1.8,.08,.1,COL.woodD);
    plants(K,-1.2,1.8,1.4,.5,[0x4f7a35,0xe8e0d0],.4);plants(K,1.2,1.8,1.4,.5,[0x4f7a35,0xd4a73c],.4);}
  else{const R=hall(K,{w:5.6,d:3.2,sh:2.3,wall:K.pick(STONE),roof:'slate',found:COL.stoneD,x:-.4,z:-1.2,pitch:.95});
    B.box(-.4,R.base,R.z+1.6+.5,2.0,2.0,1.0,K.pick(STONE));gable(B,{x:-.4,z:R.z+2.1,top:R.base+2.0,len:1.0,span:2.0,k:1.0,t:.2,col:K.pick(ROOF.slate),wall:K.pick(STONE),axis:'z',ov:.15,rows:true});
    archFrame(B,-.4,R.base,R.z+2.62,.9,1.5,COL.stoneF);B.box(-.4,R.base,R.z+2.63,.9,1.5,.08,COL.door);B.hcyl(-.4,R.base+1.5,R.z+2.63,.45,.08,COL.door,'z',10);G.box(-.4+.0,R.base+1.85,R.z+2.66,.12,.18,.06,0xffd890);
    for(const f of [-1,1])lancet(K,-.4+f*1.7,R.base+.9,R.z+1.62,1,'z',.38,1.0);for(const f of [-1,1])lancet(K,-.4+f*2.6,R.base+.9,R.z+1.62,1,'z',.3,.9);
    B.box(-.4,R.base+R.sh+R.hr+.1,R.z,.7,.7,.7,K.pick(STONE));B.cone(-.4,R.base+R.sh+R.hr+.8,R.z,.5,.9,K.pick(ROOF.slate),4,PI/4);B.sph(-.4,R.base+R.sh+R.hr+.4,R.z,.14,.14,.14,COL.gold,0);cross(B,-.4,R.base+R.sh+R.hr+1.7,R.z,.5);
    chimney(K,1.9,R.base+2,R.z-.8,R.top+R.hr+.9,.6,COL.stoneD,1.1);
    for(const f of [-1,1]){const x=2.4+f*0,z=1.7;}
    const g=K.gh(3.2,1.8);B.box(3.2,g-.1,1.8,1.7,.3,1.5,COL.wood);B.box(3.2,g+.2,1.8,1.5,.14,1.3,COL.soil);plants(K,3.2,1.8,1.3,1.0,[0x4f7a35,0x7fa04a,0xe8e0d0],.4);
    B.box(-3.4,K.gh(-3.4,1.2),1.2,.4,.4,1.4,COL.plank);B.box(-3.4,K.gh(-3.4,1.2)+.4,1.2,.5,.06,1.5,COL.woodL);B.box(-3.6,K.gh(-3.4,1.2)+.4,1.2,.08,.5,1.5,COL.woodL);}
  return {name:['Almshouse Row','Almshouse Court','Hospital Hall'][vi]};}});

defBuilding({type:'archery_butts',age:3,name:'Archery Butts',desc:'Where archers drill with the longbow.',variants:['Earth Butts','Practice Range','Popinjay Lodge'],r:6.2,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G;
  const target=(x,y,z,s=1)=>{B.hcyl(x,y,z,.62*s,.08,COL.hay,'z',10);B.hcyl(x,y,z+.04,.5*s,.08,COL.canvas,'z',10);B.hcyl(x,y,z+.08,.38*s,.08,BANNER[0],'z',10);B.hcyl(x,y,z+.12,.24*s,.08,COL.canvas,'z',10);B.hcyl(x,y,z+.16,.1*s,.08,COL.gold,'z',8);};
  const stand=(x,z,s=1)=>{const g=K.gh(x,z);B.beam(x-.5,g,z-.55,x,g+1.0*s+.4,z-.05,.08,COL.woodD);B.beam(x+.5,g,z-.55,x,g+1.0*s+.4,z-.05,.08,COL.woodD);B.beam(x,g,z+.5,x,g+1.0*s+.4,z-.05,.08,COL.woodD);target(x,g+1.4*s,z+.1,s);};
  const bows=(x,z)=>{const g=K.gh(x,z);B.box(x,g,z,1.1,.08,.35,COL.woodD);for(const f of [-1,1])B.box(x+f*.5,g,z,.08,1.2,.08,COL.woodD);B.box(x,g+1.15,z,1.1,.08,.1,COL.woodD);for(let i=0;i<3;i++)B.hcyl(x-.3+i*.3,g+.7,z+.04,.04,1.3,COL.woodL,'x',4);};
  if(vi===0){for(const f of [-1,1]){const x=f*2.4,z=-4,g=K.gh(x,z);B.sph(x,g-.2,z,1.9,1.5,1.0,COL.leaf,1);B.box(x,g,z+.5,3.4,.2,.9,COL.soil);target(x,g+1.3,z+1.0,1.1);B.box(x+1.1,g+.1,z+1.0,.1,.1,.1,COL.soil);}
    B.box(0,K.gh(0,-3.2),-3.5,.8,.3,.8,COL.leaf);
    for(let i=0;i<7;i++){const x=-4+i*1.33,g=K.gh(x,3.4);B.box(x,g-.1,3.4,.08,.55,.08,COL.woodL);}B.box(0,K.gh(0,3.4)+.45,3.4,8.1,.03,.03,COL.hay);
    B.box(-3,K.gh(-3,4.2),4.2,1.6,.4,.4,COL.wood);bows(3,4.5);K.flag(-4.4,K.gh(-4.4,2.5),2.5,BANNER[0],.9,2.6);
    }
  else if(vi===1){for(let i=0;i<4;i++)stand(-3.6+i*2.4,-3.6,1);
    for(let i=0;i<4;i++){const x=-3.6+i*2.4,g=K.gh(x,2.4);B.box(x,g-.1,2.4,.08,.6,.08,COL.woodL);}B.box(0,K.gh(0,2.4)+.5,2.4,7.4,.03,.03,COL.hay);
    const px=-2.4,pz=4.2,pg=padAt(K,1.9,1.1,px,pz,COL.stoneD);for(const [a,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])B.box(px+a*1.6,pg,pz+z*.9,.18,2.1,.18,COL.woodD);B.box(px,pg,pz-.9,3.4,2.1,.1,COL.plank);
    gable(B,{x:px,z:pz,top:pg+2.1,len:3.8,span:2.4,k:.55,t:.3,col:K.pick(ROOF.thatch),ov:.35,cap:0x8a6f3a});B.box(px,pg+.4,pz-.4,2.6,.1,.5,COL.woodL);bows(px+2.7,pz);
    K.flag(2.0,K.gh(2.0,3.4),3.4,BANNER[1],1,3);K.flag(3.4,K.gh(3.4,3.4),3.4,BANNER[0],1,3);
    for(let i=0;i<3;i++)bale(K,3.4,0+i*.5,null,.1);}
  else{const g=K.gh(0,-3);B.cyl(0,g-.3,-3,.17,6.6,COL.woodD,6);B.box(0,g+5.0,-3,1.1,.1,.1,COL.woodD);B.box(0,g+5.0,-3,.1,.1,1.1,COL.woodD);
    B.sph(0,g+6.55,-3,.22,.17,.3,BANNER[1],0);B.sph(0,g+6.8,-2.8,.1,.1,.1,BANNER[0],0);B.cone(0,g+6.55,-3.3,.07,.25,COL.gold,4);for(const sx of [-1,1])B.sph(sx*.5,g+5.2,-3,.12,.12,.12,BANNER[0],0);
    for(let i=0;i<4;i++){const a=PI*.5+i*TAU/4+PI/4,x=Math.sin(a)*1.0,z=-3+Math.cos(a)*1.0;B.beam(x*1.9,K.gh(x*1.9,z*1.2),z*1.2-.6*0,0,g+4.5,-3,.06,COL.woodD);}
    const pts=[];for(let i=0;i<=10;i++){const a=-PI*.9+i*PI*1.8/10;pts.push([Math.sin(a)*3.0,-3+Math.cos(a)*2.2]);}
    for(const p of pts.slice(0,1))void p;
    const R=hall(K,{w:3.6,d:2.4,sh:1.8,wall:K.pick(PLASTER),frame:true,roof:'tile',x:2.4,z:2.6,found:COL.stoneD,pitch:.85});door(B,2.4,R.base,R.z+1.2,COL.door,.8,1.4);win(K,3.4,R.base+.9,R.z+1.2,1,'z',K.pick(SHUT));
    bows(-1.8,3.3);const tx=-2.8,tz=2.0,tg=K.gh(tx,tz);for(const f of [-1,1])B.box(tx+f*1.1,tg,tz,.1,2.2,.1,COL.woodD);B.box(tx,tg+2.1,tz,2.6,.1,.1,COL.wood);
    for(let i=0;i<8;i++)B.boxC(tx-1.15+i*.33,tg+2.15,tz+.35,.34,.05,1.0,i%2?COL.canvas:BANNER[0],.35,0,0);
    for(let i=0;i<4;i++){const x=-3.4+i*2.2,z=-1,g=K.gh(x,z);B.box(x,g-.1,z,.08,.5,.08,COL.woodL);}
    stand(-3.4,-.4,.8);barrel(K,4.4,0.8);}
  return {name:['Earth Butts','Practice Range','Popinjay Lodge'][vi]};}});

defBuilding({type:'scriptorium',age:3,name:'Scriptorium',desc:'Scribes copy books and charters by candlelight.',variants:['Scribe House','Library Tower','Chapter Library'],r:4.4,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,st=K.pick(STONE),tile=K.pick(ROOF.tile),slate=K.pick(ROOF.slate),sh=K.pick(SHUT);
  if(vi===0){const R=hall(K,{w:3.8,d:3,sh:2,st:2,jetty:true,wall:K.pick(PLASTER),low:st,frame:true,roof:'tile',roofCol:tile,x:0,z:-.4,found:COL.stoneD});door(B,-.9,R.base,R.z+1.5,COL.door,.9,1.6);win(K,.8,R.base+.85,R.z+1.5,1,'z',sh);
    B.box(.4,R.base+2.3,R.z+1.9,1.6,1.1,.7,K.pick(PLASTER));B.box(.4,R.base+3.4,R.z+1.9,1.8,.15,.8,COL.beamD);G.box(.4,R.base+2.55,R.z+2.26,1.2,.7,.04,GLASS);G.box(-1.0,R.base+2.9,R.z+1.77,.5,.6,.04,GLASS);
    for(let i=0;i<2;i++)win(K,-1.2+i*0,R.base+2.9,R.z+1.77,1,'z',sh);chimney(K,-1.3,R.base+2.2,R.z-.8,R.top+R.hr+.8,.6,COL.stoneD,1.0);
    sign(K,-2.1,R.base+2.0,R.z+1.5,COL.woodL,COL.canvas);B.box(1.9,K.gh(1.9,2.0)+.3,2.0,1.1,.12,.5,COL.wood);for(const f of [-1,1])B.box(1.9+f*.45,K.gh(1.9,2.0),2.0,.1,.3,.4,COL.woodD);for(let i=0;i<3;i++)B.box(1.6+i*.3,K.gh(1.9,2.0)+.42,2.0,.25,.1,.3,K.pick(BANNER));}
  else if(vi===1){const base=padAt(K,2.0,2.0,0,0);B.box(0,base,-.2,2.8,6.4,2.8,st);B.box(0,base+6.4,-.2,3.1,.3,3.1,COL.stoneF);pyramid(B,0,base+6.7,-.2,3.1,3.4,slate);cross(B,0,base+10.0,-.2,.7);
    for(let i=0;i<3;i++){lancet(K,0,base+1.7+i*1.5,1.2,1,'z',.4,.9);lancet(K,1.41,base+1.7+i*1.5,-.2,1,'x',.4,.9);lancet(K,-1.41,base+1.7+i*1.5,-.2,-1,'x',.4,.9);}
    B.cyl(-1.5,base-.3,-1.6,.6,6.5,st,8);B.cone(-1.5,base+6.1,-1.6,.75,1.4,slate,8);
    B.box(1.9,base,1.1,1.6,1.8,1.9,st);B.wedge(1.9,base+1.8,1.1,2.0,.8,2.2,tile,PI/2);door(B,1.9,base,2.05,COL.door,.8,1.4);G.box(1.9,base+1.1,2.07,.3,.4,.04,GLASS);
    B.box(-1.5,K.gh(-1.5,2.2),2.2,1.4,.4,.45,COL.wood);K.flag(0,base+10,-.2,BANNER[1],.9,1.0);}
  else{const R=hall(K,{w:6,d:2.8,sh:2.6,wall:st,roof:'slate',found:COL.stoneD,x:0,z:-.8,pitch:.95});
    for(let i=0;i<5;i++){const x=-2.4+i*1.2;if(i===2)continue;lancet(K,x,R.base+.9,R.z+1.4,1,'z',.4,1.3);B.box(x+.6,R.base,R.z+1.55,.3,2.5,.3,COL.stoneF);}B.box(-3.0,R.base,R.z+1.55,.3,2.5,.3,COL.stoneF);B.box(3.0,R.base,R.z+1.55,.3,2.5,.3,COL.stoneF);
    B.box(0,R.base,R.z+1.9,1.7,2.0,.9,st);gable(B,{x:0,z:R.z+1.9,top:R.base+2.0,len:.9,span:1.7,k:.9,t:.2,col:slate,wall:st,axis:'z',ov:.12,rows:true});archFrame(B,0,R.base,R.z+2.36,.8,1.4,COL.stoneF);B.box(0,R.base,R.z+2.37,.8,1.4,.08,COL.door);B.hcyl(0,R.base+1.4,R.z+2.37,.4,.08,COL.door,'z',10);
    chimney(K,2.2,R.base+2.4,R.z-.9,R.top+R.hr+.9,.6,COL.stoneD,.9);
    const lx=2.2,lz=2.6,g=K.gh(lx,lz);B.box(lx,g,lz,.14,1.2,.14,COL.woodD);B.boxC(lx,g+1.25,lz,.7,.08,.55,COL.wood,.5,0,0);B.box(lx,g+1.4,lz,.3,.04,.2,COL.canvas);
    B.box(-2.0,K.gh(-2,2.6),2.6,1.8,.4,.4,COL.wood);G.box(0,R.base+2.05,R.z+2.4,.1,.16,.1,0xffd890);}
  return {name:['Scribe House','Library Tower','Chapter Library'][vi]};}});

defBuilding({type:'wall_tower',age:3,name:'Wall Tower',desc:'A stout tower on the town wall, manned by the watch.',variants:['Round Tower','Hoarded Tower','Bastion Turret'],r:4.6,
gen:(b,c,K,vi)=>{const B=K.B,G=K.G,st=K.pick(STONE),slate=K.pick(ROOF.slate),ban=K.pick(BANNER);
  const sides=(h)=>{for(const f of [-1,1])wallSeg(K,f*1.9,0,f*4.4,0,h,st);};
  const foot=(R)=>{const gm=Math.min(K.gh(R,0),K.gh(-R,0),K.gh(0,R),K.gh(0,-R),K.gh(0,0));return gm-.8;};
  if(vi===0){const R=1.7,fy=foot(R),g=K.gh(0,0),top=g+6.6;B.cyl(0,fy,0,R,top-fy,st,12);B.cyl(0,top-.1,0,R+.25,.35,COL.stoneF,12);crenRing(B,0,top+.2,0,R+.1,9,st,.5);
for(let i=0;i<3;i++)slit(K,Math.sin(i*.6-.6)*R,g+2.4+i*1.4,Math.cos(i*.6-.6)*R,0,'z');
    for(let i=0;i<3;i++){const a=(i-1)*.7;B.box(Math.sin(a)*R*.97,g+2.2+i*1.5,Math.cos(a)*R*.97,.14,.55,.14,COL.dark,a);}
    G.box(0,g+4.5,R*.97,.28,.5,.06,GLASS);door(B,0,g,R*.97,COL.door,.9,1.4);K.flag(0,top,0,ban,1,2.8);sides(3.8);}
  else if(vi===1){const s=3.2,fy=foot(s/2+.3),g=K.gh(0,0),top=g+5.2;B.box(0,fy,0,s,top-fy,s,st);B.box(0,top-.3,0,s+.9,.4,s+.9,COL.woodD);
    for(const f of [-1,1]){B.box(0,top+.1,f*(s/2+.4),s+.9,1.2,.14,COL.plank);B.box(f*(s/2+.4),top+.1,0,.14,1.2,s+.9,COL.plank);}
    for(let i=0;i<4;i++){const a=i*PI/2,x=Math.sin(a)*(s/2+.4),z=Math.cos(a)*(s/2+.4);B.box(x+Math.cos(a)*.0,top+.9,z,.14,.14,.14,COL.woodD);}
    for(const [x,z] of [[1,1],[1,-1],[-1,1],[-1,-1]])B.box(x*(s/2+.4),top,z*(s/2+.4),.18,1.8,.18,COL.woodD);
    pyramid(B,0,top+1.7,0,s+1.2,2.6,slate);for(let i=0;i<3;i++)G.box(-1+i*1,top+.35,s/2+.48,.3,.5,.04,0xffd890);
    for(const f of [-1,1])B.beam(f*(s/2+.4),top-.3,s/2+.4,f*(s/2),top-1.1,s/2,.12,COL.woodD);
    door(B,0,g,s/2,COL.door,1.0,1.7);slit(K,-.9,g+2.4,s/2,1,'z');slit(K,.9,g+2.4,s/2,1,'z');K.flag(0,top+4.2,0,ban,.9,1.2);sides(3.6);}
  else{const R=1.55,fy=foot(R),g=K.gh(0,0),top=g+5.0;B.cyl(0,fy,0,R,top-fy,st,8);
    B.cyl(0,top,0,R+.2,.2,COL.stoneF,8);for(let k=0;k<8;k++){const a=k/8*TAU;B.box(Math.sin(a)*(R+.28),top-.55,Math.cos(a)*(R+.28),.3,.55,.3,COL.stoneF,a);}
    B.cyl(0,top+.2,0,R+.5,.45,st,8);crenRing(B,0,top+.65,0,R+.4,8,st,.42);B.cyl(0,top+1.1,0,R-.2,.2,COL.woodD,8);
    B.cone(0,top+1.0,0,R+.1,3.8,slate,8);cross(B,0,top+4.7,0,.001);K.flag(0,top+4.8,0,ban,1,1.4);
    for(let i=0;i<3;i++){const a=(i-1)*.8;B.box(Math.sin(a)*R*.95,g+1.6+i*1.1,Math.cos(a)*R*.95,.14,.55,.14,COL.dark,a);}
    G.box(0,g+3.8,R*.93,.3,.5,.06,GLASS);door(B,0,g,R*.95,COL.door,.85,1.4);
    for(let i=0;i<4;i++)B.box(R+.5+(i%2)*.0,K.gh(R+.5,0.0)+i*.0,i*.3-.5,.5,.2+i*.0,.4,COL.stoneF);sides(3.4);}
  return {name:['Round Wall Tower','Hoarded Tower','Bastion Turret'][vi]};}});

// @@END
}
