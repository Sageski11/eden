'use strict';
// ================================================================ procedural building generators
const GEN={};
const ROOFNAME={thatch:'Thatched roof',tile:'Clay-tile roof',slate:'Slate roof',shingle:'Wooden shingles'};

GEN.house=(b,c,K)=>{
  const {B,rng}=K,T=K.traits,att=c.attach,aL=!!att.L,aR=!!att.R;
  const inWater=c.wC>.2,lake=!inWater&&c.waterDist<5.5;
  let style,name;const lvl=b.level==null?3:b.level;const cw=b.cw==null?5:b.cw,cs=b.cs==null?5:b.cs;
  if(lvl>=4)return eraHouse(b,c,K,lvl);
  if(lvl===0){style='hut';name='Wattle Hut';}
  else if(inWater){style='lake';name='Stilt House';}
  else if(lake){style='lake';name='Lake House';}
  else if(lvl>=3&&cw>=3&&(c.castleD<24||c.houses>=7||att.size>=3)){style='town';name='Townhouse';}
  else if(lvl>=2&&cs>=3&&(c.hC>16||c.elev>.58)){style='stone';name='Mountain Lodge';}
  else if(c.trees>=8){style='log';name='Log Cabin';}
  else{style='timber';name=c.farmD<16?'Farmhouse':(rng()<.5?'Cottage':'Timber House');}
  const o={w:b.w,d:b.d,attL:aL,attR:aR,beam:COL.beam,cw,cs};let rt;
  if(style==='hut'){o.w=b.w*.84;o.d=b.d*.86;o.wallCol=K.pick([0x8f7a58,0x9a8562,0x857052]);o.gableCol=0x7a6648;rt='thatch';o.st=1;o.shut=null;o.noSideWin=true;o.found=0x6f6558;o.doorCol=0x5a4632;}
  else if(style==='lake'){o.wallCol=K.pick([0x8a7a62,0x7d7468,0x8f8270,0x76706a]);o.shut=K.pick([0x3b5675,0x4f6f7a,0x6b4a2e]);rt=rng()<.5?'shingle':'thatch';o.st=rng()<.3?2:1;o.waterTop=K.rectWater(b.w/2+.6,b.d/2+.6);o.found=0x6f675c;}
  else if(style==='town'){o.groundCol=K.pick(STONE);o.wallCol=K.pick(TOWN_UP);o.frame=true;o.jetty=true;o.st=2+(rng()<.45?1:0);rt='tile';o.shut=K.pick(SHUT);o.boxes=rng()<.6;}
  else if(style==='stone'){o.wallCol=K.pick(STONE);o.quoins=true;rt='slate';o.st=rng()<.4?2:1;o.shut=K.pick(SHUT);}
  else if(style==='log'){o.style='log';o.wallCol=0x6d4a2d;o.gableCol=0x6d4a2d;rt='shingle';o.st=1;o.shut=0x5a3d26;o.found=0x6f6558;}
  else{o.wallCol=K.pick(PLASTER);o.frame=true;rt=rng()<.65?'thatch':'shingle';o.st=rng()<.35?2:1;o.shut=K.pick(SHUT);}
  if(att.size>=2&&o.st===1&&rng()<.6)o.st=2;
  if(lvl<=1)o.st=1;else if(lvl===2)o.st=Math.min(o.st,2);
  o.roofCol=K.pick(ROOF[rt]);o.pitch=rt==='thatch'?1.05:rt==='slate'?.95:.8+rng()*.2;o.roofT=rt==='thatch'?.38:.18;o.ov=rt==='thatch'?.45:.32;
  if(rt==='thatch')o.capCol=0x8a6f3a;
  if(style==='hut'){o.pitch=1.3;o.roofT=.42;o.ov=.4;}
  const R=buildHall(K,o);
  if(style==='hut'){K.smoke(0,R.top+R.hr+.3,0,.7);T.push('Wattle-and-daub walls','Smoke hole in the thatch');b._st=1;b._cap=3;return {name,r:Math.max(b.w,b.d)/2+.2};}
  // chimney
  if(lvl>=1&&(rng()<.8||style==='log'||style==='stone')){const cx=aR?b.w/2-.35:aL?-b.w/2+.35:(rng()<.5?-1:1)*(b.w/2-.45),cz=(rng()-.5)*.5,ty=R.top+R.hr+.75;
    B.box(cx,R.top-.4,cz,.56,ty-R.top+.4,.56,style==='log'?0x6f6558:0x7d7468);B.box(cx,ty,cz,.68,.12,.68,0x5f584f);if(cs>=3){B.cyl(cx-.12,ty+.12,cz,.08,.22,0x9a5a3a,6);B.cyl(cx+.12,ty+.12,cz,.08,.18,0x9a5a3a,6);}if(rng()<.75)K.smoke(cx,ty+.2,cz,1);}
  if(c.hC>22){gable(B,{x:0,z:0,top:R.top+.17,len:b.w,span:R.dTop,k:o.pitch,t:.08,col:0xf2f4f6,ov:o.ov-.05,eA:aL?0:undefined,eB:aR?0:undefined});T.push('Snow-capped roof');}
  // context extras
  if(inWater){T.push('Raised on stilts over the water');boat(K,b.w/2+1.4,c.wsC-.12,.3,0);}
  else if(lake){if(R.stilts)T.push('Stilted over the shoreline');dock(K,c,Math.max(b.w,b.d)/2+.4,9,T);}
  else if(style==='log'){const sx=aR?-1:1;if(!(aL&&aR)){const x=sx*(b.w/2+.8),g=K.gh(x,0);
      for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.hcyl(x+(i-(3-r)/2)*.32,g+.17+r*.3,-.2,.16,1.6,K.pick([0x8a6440,0x7a5632,0x9a7448]),'z');
      B.cyl(x,g,1.3,.3,.45,0x7a5632,8);T.push('Woodpile & chopping block');}}
  else if(style==='timber'){const z0=-b.d/2-.4,z1=z0-2.4,hw=b.w/2;const pts=[[-hw,z0],[-hw,z1],[hw,z1],[hw,z0]];
    for(let i=0;i<3;i++){const [x1,z1_]=pts[i],[x2,z2]=pts[i+1],n=Math.max(1,Math.round(Math.hypot(x2-x1,z2-z1_)/1.1));
      for(let s=0;s<=n;s++){const x=lerp(x1,x2,s/n),z=lerp(z1_,z2,s/n),g=K.gh(x,z);B.box(x,g-.2,z,.1,.95,.1,COL.woodL);
        if(s<n){const x3=lerp(x1,x2,(s+1)/n),z3=lerp(z1_,z2,(s+1)/n),g3=K.gh(x3,z3);B.beam(x,g+.45,z,x3,g3+.45,z3,.06,COL.woodL);}}}
    for(let r=0;r<3;r++)for(let i=0;i<Math.floor(b.w/.55)-1;i++){const x=-hw+.5+i*.55,z=z0-.6-r*.65;B.sph(x,K.gh(x,z)+.12,z,.17,.14,.17,r===1?0x7fa04a:0x4f7a35);}
    T.push('Kitchen garden');
    if(c.farmD<16){const g=K.gh(hw+1.4,-.5);B.cone(hw+1.4,g-.1,-.5,.9,1.8,COL.hay,9);T.push('Haystack for the fields');}}
  else if(style==='town'){if(o.boxes)T.push('Window boxes in bloom');T.push('Jettied upper floors');}
  else if(style==='stone'){T.push('Thick stone walls');}
  if(rng()<.5&&!inWater){const g=K.gh(R.doorX+.9,b.d/2+.45);B.cyl(R.doorX+.9,g,b.d/2+.45,.24,.6,0x6b4a2e,8);B.box(R.doorX+.9,g+.18,b.d/2+.45,.5,.05,.5,0x3a3d42);}
  if(att.size>=2){name=style==='town'?'Terraced Townhouse':style==='lake'?'Waterfront Row':'Row House';T.unshift(`Merged into a row of ${att.size}`);}
  T.push(`${o.st} storey${o.st>1?'s':''}`,ROOFNAME[rt]);if(cw>=3&&style!=='log'&&style!=='hut')T.push('Carved bargeboards (woodworking '+cw+')');if(cs>=3&&style!=='hut')T.push('Dressed stonework (stonecutting '+cs+')');
  if(R.gMax-R.gMin>.9&&!R.stilts)T.push('Stone plinth levels the slope');
  b._st=o.st;b._cap=lvl<=1?4:o.st*2+(lvl>=3?2:1);
  return {name,r:Math.max(b.w,b.d)/2+.3};
};

GEN.church=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;
  const tier=c.houses25>=10?2:c.houses25>=4?1:0;
  const stone=c.castleD<34?0xd2c9b2:K.pick([0x9b9488,0xa69e8f,0x8f887c]);
  const roof=tier===2?0x4a5462:K.pick([0x4f5866,0x9a4a30,0x5a4632]);
  const nw=[3.6,4.6,6][tier],nl=[6.5,9.5,14][tier],wh=[3.4,4.4,6.4][tier],aisle=tier===2?2.3:0;
  const hill=c.hilltop?2.5:0;
  const [gMin,gMax]=K.rect(nw/2+aisle+.3,nl/2+(tier?2.4:.6));const base=gMax+.25;
  B.box(0,gMin-.6,tier?1:0,nw+aisle*2+.7,base-gMin+.6,nl+(tier?2.6:.7),0x7d766a);
  B.box(0,base,0,nw,wh,nl,stone);
  const hr=gable(B,{x:0,z:0,top:base+wh,len:nl,span:nw,k:1.15,t:.22,col:roof,wall:stone,axis:'z',ov:.3});
  for(let z=-nl/2+1.2;z<nl/2-.6;z+=1.8)for(const f of [-1,1]){const x=f*(nw/2+.03);
    G.box(x,base+wh*.42,z,.06,wh*.4,.5,0xb8d0ff);G.sph(x,base+wh*.82,z,.04,.25,.25,0xb8d0ff);B.box(x+f*.02,base+wh*.4,z,.06,.08,.7,0x6f685e);}
  // door
  B.box(0,base,nl/2+.03,1.3,2.2,.1,COL.door);B.hcyl(0,base+2.2,nl/2+.05,.65,.12,COL.door,'z');B.box(0,base+2.15,nl/2+.06,1.6,.18,.12,0x7a7266);
  if(tier===0){B.box(0,base+wh+hr*.4,nl/2-.25,.9,hr*.6+1.3,.6,stone);B.cone(0,base+wh+hr+1.25,nl/2-.25,.75,1.2,roof,4,PI/4);
    B.sph(0,base+wh+hr+.75,nl/2-.25,.22,.28,.22,0x8a6a2a);T.push('Bellcote with a single bell');}
  if(tier>=1){B.cyl(0,base,-nl/2,nw/2-.05,wh*.92,stone,12);B.cone(0,base+wh*.92,-nl/2,nw/2+.25,hr*.9,roof,12);T.push('Rounded apse');}
  const towers=tier===1?[[0,nl/2+1.2,2.7]]:tier===2?[[-nw/2-.6,nl/2+.6,3.1],[nw/2+.6,nl/2+.6,3.1]]:[];
  for(const [tx,tz,ts] of towers){const th=wh+(tier===2?8:5.5)+hill;const tb=K.rect(ts/2,ts/2,tx,tz)[0]-.5;
    B.box(tx,tb,tz,ts,th+base-tb,ts,stone);B.box(tx,base+th,tz,ts+.3,.25,ts+.3,0x7a7266);
    for(const [fx,fz] of [[1,0],[-1,0],[0,1],[0,-1]]){B.box(tx+fx*(ts/2+.02),base+th-2.2,tz+fz*(ts/2+.02),fz?.7:.06,1.4,fx?.7:.06,COL.dark);}
    const sh=(tier===2?6.5:5)+hill*.8;B.cone(tx,base+th+.25,tz,ts*.72,sh,roof,4,PI/4);
    B.box(tx,base+th+sh+.2,tz,.09,.9,.09,COL.gold);B.box(tx,base+th+sh+.75,tz,.5,.09,.09,COL.gold);
    G.cyl(tx,base+th-4,tz+ts/2+.02,.5,.04,0xfff2c0,12);}
  if(tier===1)T.push('Bell tower with spire');
  if(tier===2){
    for(const f of [-1,1]){const ax=f*(nw/2+aisle/2);B.box(ax,base,0,aisle,wh*.58,nl-1.5,stone);
      B.wedge(ax,base+wh*.58,0,nl-1.3,1.4,aisle+.4,roof,f>0?PI/2:-PI/2);
      for(let z=-nl/2+1.4;z<nl/2-1;z+=2.4){B.box(f*(nw/2+aisle+.2),base-.3,z,.5,wh*.62,.55,0x857f74);B.beam(f*(nw/2+aisle+.3),base+wh*.6,z,f*(nw/2+.1),base+wh*.92,z,.3,0x857f74);
        G.box(f*(nw/2+aisle+.03),base+wh*.18,z+1.2,.06,wh*.3,.45,0xffc890);}}
    G.cyl(0,base+wh*.62,nl/2+.05,1.15,.05,0xd0a0ff,14);
    for(let i=0;i<8;i++){const a=i/8*TAU;B.beam(0,base+wh*.62,nl/2+.09,Math.cos(a)*1.15,base+wh*.62+Math.sin(a)*1.15,nl/2+.09,.07,0x5f584f);}
    T.push('Twin towers & rose window','Side aisles with buttresses');}
  // graveyard
  if(tier>=1||rng()<.5){const s=c.freeSide,x0=s*(nw/2+aisle+1.3),x1=s*(nw/2+aisle+5.5),z0=-nl/2+.5,z1=nl/2*.55;
    const corners=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
    for(let i=0;i<3;i++){const [ax,az]=corners[i],[bx,bz]=corners[i+1],n=Math.ceil(Math.hypot(bx-ax,bz-az)/1.2);
      for(let k=0;k<n;k++){const x=lerp(ax,bx,(k+.5)/n),z=lerp(az,bz,(k+.5)/n),g=K.gh(x,z);B.box(x,g-.3,z,Math.abs(bx-ax)>.1?1.25:.32,.75,Math.abs(bz-az)>.1?1.25:.32,0x8f887c);}}
    const n=6+tier*5;for(let i=0;i<n;i++){const x=lerp(x0,x1,.15+rng()*.7),z=lerp(z0,z1,.12+rng()*.76),g=K.gh(x,z),ry=(rng()-.5)*.3;
      if(rng()<.35){B.box(x,g-.1,z,.12,.9,.12,0xa8a191);B.box(x,g+.45,z,.5,.11,.12,0xa8a191,ry);}else B.box(x,g-.1,z,.48,.6+rng()*.25,.13,K.pick([0x9b9488,0xb3ac9c,0x8a8378]),ry);}
    const yx=lerp(x0,x1,.8),yz=lerp(z0,z1,.85);B.cone(yx,K.gh(yx,yz)-.1,yz,.9,3,0x2f4a2a,7);
    T.push('Walled graveyard');}
  const nm=['Chapel','Parish Church','Cathedral'][tier];
  T.unshift(`Serves ${c.houses25} nearby homes`);
  if(c.hilltop&&tier)T.push('Hilltop: spire raised higher');
  if(c.castleD<34)T.push('Pale limestone near the castle');
  return {name:(c.hilltop?'Hilltop ':'')+nm,r:[4.4,6.6,9][tier]};
};

GEN.well=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;const plaza=c.houses>=4,spring=c.waterDist<7&&!plaza,deep=c.elev>.45;
  const [gMin,gMax]=K.rect(plaza?3.6:1.2,plaza?3.6:1.2);const base=K.rect(1.1,1.1)[1]+.05;
  let name='Village Well';
  if(plaza){B.cyl(0,gMin-.4,0,3.9,base-gMin+.42,0x8a857c,16);B.cyl(0,base,0,3.9,.04,0x9c968b,16);
    for(let i=0;i<16;i++){const a=i/16*TAU;B.box(Math.sin(a)*3.75,base-.02,Math.cos(a)*3.75,.4,.1,.9,0x77726a,a);}
    for(let i=0;i<3;i++){const a=i/3*TAU+.5,x=Math.sin(a)*2.7,z=Math.cos(a)*2.7;B.box(x,base,z,1.4,.42,.45,COL.wood,a);B.box(x,base+.42,z,1.5,.08,.5,COL.woodL,a);}
    name='Town Square Well';T.push('Cobbled square for the neighbourhood','Benches for gossip');}
  if(spring){B.cyl(0,base-.1,0,1.5,.55,0x9a9283,12);B.cyl(0,base+.38,0,1.32,.04,COL.water,12);
    B.cyl(0,base,0,.28,1.5,0x8a8478,8);B.cone(0,base+1.5,0,.5,.5,0x8a8478,8);B.beam(0,base+1.3,0,.0,base+1.2,.45,.1,0x6a655d);
    name='Spring Fountain';T.push('Fed by the nearby water','Stone basin');return {name,r:1.7};}
  B.cyl(0,base-.1,0,.95,1.0,0x8d877b,10);B.cyl(0,base+.88,0,.98,.08,0x77726a,10);B.cyl(0,base+.9,0,.78,.02,0x1a2a30,10);
  const pc=deep?COL.woodD:COL.wood;for(const f of [-1,1])B.box(f*.85,base+.8,0,.16,1.7,.16,pc);
  B.hcyl(0,base+1.95,0,.08,2,COL.woodD,'x');B.box(0,base+1.2,0,.03,.75,.03,0xbfa98a);B.cyl(0,base+.95,0,.17,.28,0x6b4a2e,7);
  const rt=rng()<.5?'thatch':'tile';gable(B,{x:0,z:0,top:base+2.45,len:2.0,span:1.5,k:1.0,t:rt==='thatch'?.25:.12,col:K.pick(ROOF[rt]),ov:.3});
  if(deep){const w=K.sub();makeWheel(w,.55,.12,'x');K.anim(w,'spin',1.25,base+1.95,0,{axis:'x',speed:.4});B.box(1.0,base+1.85,0,.3,.2,.2,COL.woodD);name='Deep Well';T.push('Deep shaft with winch wheel');}
  else T.push(rt==='thatch'?'Thatched canopy':'Tiled canopy');
  if(rng()<.6){const g=K.gh(1.4,.9);B.cyl(1.4,g,.9,.24,.55,0x6b4a2e,8);}
  return {name,r:plaza?3.9:1.4};
};

GEN.castle=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;
  const tier=(c.houses25>=12||(c.hilltop&&c.houses25>=5))?2:(c.houses25>=5||c.hilltop)?1:0;
  const R=[7,8.6,10.6][tier],nT=[4,6,8][tier],wallH=[3.3,4.1,5][tier];
  const stone=c.elev>.5?0x8a8478:K.pick([0x9d968a,0xa39b8a,0x948d81]),roofC=K.pick([0x3f5a8a,0x8a2f2a,0x4a4e5a]),ban=K.pick(BANNER);
  const moat=c.waterDist<14;
  const pts=[];for(let i=0;i<nT;i++){const a=(i+.5)/nT*TAU;pts.push([Math.sin(a)*R,Math.cos(a)*R]);}
  const gateZ=R*Math.cos(PI/nT);
  // walls
  for(let i=0;i<nT;i++){const [ax,az]=pts[i],[bx,bz]=pts[(i+1)%nT];const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/1.35),ry=Math.atan2(bx-ax,bz-az);
    const front=i===nT-1;
    for(let k=0;k<n;k++){const t=(k+.5)/n,px=lerp(ax,bx,t),pz=lerp(az,bz,t);if(front&&Math.abs(px)<1.45)continue;
      const g=K.gh(px,pz),top=g+wallH;B.box(px,g-1.4,pz,1.15,top-g+1.4,L/n+.04,stone,ry);
      const nl=Math.hypot(px,pz),ox=px/nl,oz=pz/nl;B.box(px+ox*.4,top,pz+oz*.4,.32,.55,.5,stone,ry);B.box(px-ox*.4,top,pz-oz*.4,.3,.3,L/n,stone,ry);}}
  // towers
  const tr=[1.45,1.65,1.95][tier];
  pts.forEach(([x,z],i)=>{const g=K.gh(x,z),gm=Math.min(K.gh(x+tr,z),K.gh(x-tr,z),K.gh(x,z+tr),K.gh(x,z-tr));const top=g+wallH+2.4;
    B.cyl(x,gm-.8,z,tr,top-gm+.8,stone,10);B.cyl(x,top-.1,z,tr+.2,.3,0x7d776b,10);
    for(let k=0;k<8;k++){const a=k/8*TAU;B.box(x+Math.sin(a)*(tr+.05),top+.2,z+Math.cos(a)*(tr+.05),.42,.55,.42,stone,a);}
    if(tier>=1){B.cone(x,top+.2,z,tr+.25,3+tier*.4,roofC,10);if(i%2===0)K.flag(x,top+3+tier*.4,z,ban,.9,1.2);}
    B.box(x+Math.sin(Math.atan2(x,z))*tr*.98,g+wallH*.6,z+Math.cos(Math.atan2(x,z))*tr*.98,.18,.8,.18,COL.dark);});
  // gatehouse
  {const g=K.gh(0,gateZ),top=g+wallH;
    for(const f of [-1,1]){B.box(f*1.85,g-1,gateZ,1.5,wallH+2.6,2,stone);for(const q of [-1,1])B.box(f*1.85+q*.5,g+wallH+1.6,gateZ+1,.4,.5,.4,stone);}
    B.box(0,g+2.9,gateZ,2.3,top-g-2.9+.6,1.6,stone);B.box(0,g-.05,gateZ+.82,2.3,2.95,.05,COL.dark);
    for(let i=-2;i<=2;i++)B.box(i*.42,g+.2,gateZ+.86,.07,2.6,.05,COL.iron);for(let j=0;j<5;j++)B.box(0,g+.4+j*.5,gateZ+.87,2.1,.06,.05,COL.iron);
    G.box(-1.85,g+wallH*.75,gateZ+1.02,.25,.5,.04,0xffffff);G.box(1.85,g+wallH*.75,gateZ+1.02,.25,.5,.04,0xffffff);
    if(moat){B.boxC(0,K.gh(0,gateZ+2.6)+.12,gateZ+2.6,2.1,.16,3.2,COL.plank);for(const f of [-1,1])B.beam(f*1.0,g+.2,gateZ+4.1,f*1.0,g+3,gateZ+.9,.05,COL.iron);}}
  // keep
  const ks=[4.2,5.2,6.4][tier],kh=[8,10.5,13.5][tier]+(c.hilltop?2:0);
  const [kMin,kMax]=K.rect(ks/2,ks/2,0,-.5);const kb=kMax+.15;
  B.box(0,kMin-.8,-.5,ks+.5,kb-kMin+.8,ks+.5,0x7d776b);B.box(0,kb,-.5,ks,kh,ks,stone);B.box(0,kb+kh,-.5,ks+.4,.3,ks+.4,0x7d776b);
  for(const [ex,ez,lx,lz] of [[1,0,0,1],[-1,0,0,1],[0,1,1,0],[0,-1,1,0]]){const n=Math.round(ks/.8);
    for(let k=0;k<=n;k+=1){if(k%2)continue;const t=-ks/2+k*ks/n;B.box(ex*(ks/2+.1)+lx*t,kb+kh+.3,-.5+ez*(ks/2+.1)+lz*t,.42,.55,.42,stone);}
    for(let lv=0;lv<3;lv++)G.box(ex*(ks/2+.03)+lx*0,kb+2.2+lv*kh*.27,-.5+ez*(ks/2+.03),ex?.05:.24,.7,ez?.05:.24,0xffffff);}
  B.box(0,kb,-.5+ks/2+.03,1,1.7,.08,COL.door);B.box(0,kb+kh*.45,-.5+ks/2+.05,.9,kh*.35,.04,ban);B.box(0,kb+kh*.45+kh*.15,-.5+ks/2+.08,.4,.4,.03,COL.gold);
  if(tier>=1){for(const [cx,cz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const x=cx*ks/2,z=-.5+cz*ks/2;B.cyl(x,kb+kh-2.4,z,.75,3.6,stone,8);B.cone(x,kb+kh+1.2,z,.95,2.2,roofC,8);}T.push('Corner turrets on the keep');}
  K.flag(0,kb+kh+.3,-.5,ban,1.5,2.6);
  if(tier>=1){for(const f of [-1,1]){const hx=f*R*.55,hz=-R*.2,hg=K.rect(1.3,2.2,hx,hz);B.box(hx,hg[0]-.4,hz,2.6,hg[1]-hg[0]+2.6,4.2,stone);gable(B,{x:hx,z:hz,top:hg[1]+2.2,len:4.2,span:2.6,k:.9,t:.15,col:roofC,wall:stone,axis:'z',ov:.25});}T.push('Great hall & barracks inside the walls');}
  if(moat){const mr=R+2.3,n=Math.ceil(TAU*mr/1.2);for(let i=0;i<n;i++){const a=i/n*TAU,x=Math.sin(a)*mr,z=Math.cos(a)*mr;if(Math.abs(x)<1.3&&z>0)continue;B.box(x,K.gh(x,z)-.1,z,1.5,.14,2.4,COL.water,a);}T.push('Moat & drawbridge (water nearby)');}
  const nm=['Motte Fort','Castle','Royal Citadel'][tier];
  T.unshift(`${nT} towers, curtain walls follow the ground`);
  if(c.hilltop)T.push('Commands the hilltop');
  return {name:(c.hilltop&&tier<2?'Hill ':'')+nm,r:R+1.9};
};

GEN.camp=(b,c,K)=>{
  const {B,rng}=K,T=K.traits;
  const v=b.variant||(c.waterDist<7?'fish':c.trees>=7?'lumber':(c.castleD<30||c.hilltop)?'war':'travel');
  const g0=K.gh(0,0);
  for(let i=0;i<9;i++){const a=i/9*TAU;B.box(Math.sin(a)*.62,g0-.1,Math.cos(a)*.62,.32,.28,.32,0x7a756c,a);}
  B.hcyl(0,g0+.12,0,.1,1.0,0x4a3020,'x');B.hcyl(0,g0+.2,0,.1,1.0,0x4a3020,'z');
  K.flame(0,g0+.05,0,1);K.smoke(0,g0+1.2,0,1.6);
  const n=v==='war'?5:3+Math.floor(rng()*2);
  const tc=v==='fish'?[0x9fa8a8,0xb8b4a0]:v==='war'?[0xe8e2d2,0x8e2f1f]:v==='lumber'?[0x8a7a5a,0x9a8a68]:[0xd8cdb0,0xc9a86a,0xa86a4a];
  const used=[];for(let i=0;i<n;i++){let a=i/n*TAU+(rng()-.5)*.4,rr=3+rng()*.5,ok=false;
    for(let t=0;t<16&&!ok;t++){const aa=a+t*TAU/16;const xx=Math.sin(aa)*rr,zz=Math.cos(aa)*rr;let wet=false;for(const [ox,oz] of [[0,0],[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]])if(K.wd(xx+ox,zz+oz)>.03)wet=true;
      if(!wet&&used.every(u=>Math.abs(angDiff(u,aa))>.55)){a=aa;ok=true;}}
    if(!ok)continue;used.push(a);const x=Math.sin(a)*rr,z=Math.cos(a)*rr,g=K.gh(x,z);const col=tc[i%tc.length];
    if(v==='war'){bellTent(K,x,g-.05,z,1.35,2.6,i%2?0xe8e2d2:0xd8d0c0,i%2?0x8e2f1f:ban(K),a+PI);}
    else{ridgeTent(K,x,g-.04,z,2.1,1.5,2.0,col,a+PI/2,{patch:rng()<.4});}}
  let name;
  if(v==='lumber'){name='Lumber Camp';for(let p=0;p<2;p++){const x=p?-3.6:3.8,z=p?2.2:-2,g=K.gh(x,z);
      for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)B.hcyl(x+(i-(3-r)/2)*.42,g+.2+r*.38,z,.21,2.6,K.pick([0x8a6440,0x7a5632]),'z');}
    for(let i=0;i<4;i++){const a=rng()*TAU,x=Math.sin(a)*4.6,z=Math.cos(a)*4.6;B.cyl(x,K.gh(x,z)-.1,z,.35,.45,0x8a6440,8);}
    B.box(1.6,g0,-1.4,1.6,.7,.12,COL.woodL);B.beam(1.6,g0+.7,-1.4,1.9,g0+1.3,-1.6,.06,COL.iron);T.push('Log piles & stumps','Forest nearby');}
  else if(v==='fish'){name='Fishing Camp';const wl=c.wLocal;
    for(let r=0;r<2;r++){const x=-2.2+r*.2,z=-2.4+r*1.6,g=K.gh(x,z);B.box(x-1,g,z,.08,1.4,.08,COL.woodD);B.box(x+1,g,z,.08,1.4,.08,COL.woodD);B.box(x,g+1.35,z,2.1,.06,.06,COL.wood);
      for(let i=0;i<5;i++)B.box(x-.8+i*.4,g+.95,z,.1,.38,.04,K.pick([0xc98a5a,0xb8b0a0,0xd4a070]));}
    const bx=wl.x*3.8,bz=wl.z*3.8;boat(K,bx,Math.max(K.gh(bx,bz),c.waterLevel-.15),bz,Math.atan2(wl.x,wl.z));
    B.box(1.8,K.gh(1.8,2),2,1.3,.12,1.0,0x8a8a70);T.push('Drying racks & nets','Boat pulled up on the shore');}
  else if(v==='war'){name='War Camp';const n2=28;for(let i=0;i<n2;i++){const a=i/n2*TAU;if(Math.abs(angDiff(a,0))<.35)continue;const x=Math.sin(a)*5.3,z=Math.cos(a)*5.3,g=K.gh(x,z);
      B.put('cyl:5:.05',x,g-.3,z,.15,1.9,.15,0x7a5632,(rng()-.5)*.2,0,Math.sin(a)*.15);}
    K.flag(-1.6,g0,1.5,0x8e2f1f,1.1,2.6);K.flag(1.6,g0,1.5,0x2f4a8e,1.1,2.6);
    B.box(-2.2,g0,-1,1.6,.1,.4,COL.woodD);for(let i=0;i<5;i++)B.beam(-2.8+i*.3,g0+.05,-.9,-2.8+i*.3,g0+1.5,-1.1,.04,COL.iron);
    T.push('Sharpened palisade','Banners & weapon rack');}
  else{name="Travellers' Camp";const cx=-1.8,cz=-2.6,g=K.gh(cx,cz);
    B.box(cx,g+.5,cz,1.3,.4,2.2,COL.wood);for(const f of [-1,1])B.hcyl(cx+f*.75,g+.45,cz,.45,.1,COL.woodD,'x');
    B.beam(cx,g+.6,cz+1.1,cx,g+.25,cz+2.4,.07,COL.wood);wagonCover(K,cx,g+.7,cz,2.1,1.3,0xe0d4b0,PI/2);
    for(let i=0;i<3;i++)B.cyl(1.7+i*.5,K.gh(1.7,1.8),1.8,.24,.6,0x6b4a2e,8);B.box(2,K.gh(2,2.6),2.6,.55,.5,.55,0x8a6a40);T.push('Covered wagon','Barrels & crates');}
  T.unshift(`${n} tents round a campfire`);
  return {name,r:v==='war'?5.4:4.3};
};
function ban(K){return K.pick(BANNER);}

GEN.smith=(b,c,K)=>{
  const {B,G,F,rng}=K,T=K.traits;
  const water=c.waterDist<7,armory=c.castleD<28,forest=c.trees>=7;
  const w=armory?5.4:4.6,d=4.2,hw=w/2,hd=d/2;
  const [gMin,gMax]=K.rect(hw+.3,hd+.3);const base=gMax+.15;
  B.box(0,gMin-.6,0,w+.3,base-gMin+.6,d+.3,0x7d766a);
  B.box(0,base,-d/4,w,2.5,d/2,K.pick(STONE));
  for(const f of [-1,1]){B.box(f*(hw-.15),base,hd-.2,.22,2.6,.22,COL.wood);B.box(f*(hw-.15),base,0,.22,2.6,.22,COL.wood);}
  B.box(0,base+2.5,hd-.2,w,.18,.22,COL.wood);
  const rc=K.pick(ROOF.shingle);B.wedge(0,base+2.55,0,w+.5,1.1,d+.7,rc);
  const fx=-hw/2,fz=.5;B.box(fx,base,fz,1.4,.9,1.1,0x6f685e);F.box(fx,base+.9,fz,1.0,.08,.7,0xff6a1a);F.box(fx,base+.92,fz,.6,.06,.4,0xffd060);
  B.box(fx,base+.9,fz-.45,1.4,1.0,.2,0x6f685e);B.box(fx,base+1.6,fz-.35,.75,4.2,.75,0x6f685e);K.smoke(fx,base+5.9,fz-.35,2.2,1);
  B.cyl(fx-.9,base,fz+.3,.3,.6,COL.woodD,6);B.box(fx-.9,base+.6,fz+.3,.5,.2,.5,0x7a5232);
  B.cyl(.7,base,1.2,.3,.55,0x5a3d26,8);B.box(.7,base+.55,1.2,.85,.24,.34,COL.iron);B.box(.7,base+.79,1.2,.55,.08,.22,0x4a4d52);
  B.cyl(1.6,base,.5,.32,.65,0x6b4a2e,8);B.cyl(1.6,base+.62,.5,.29,.02,COL.water,8);
  for(let i=0;i<4;i++)B.box(-hw+.8+i*.4,base+1.3,-.02,.06,.7,.04,COL.iron);
  let name='Blacksmith';
  if(water){const wl=c.wLocal,ax=Math.abs(wl.x)>Math.abs(wl.z)?'x':'z';const s=ax==='x'?Math.sign(wl.x)||1:Math.sign(wl.z)||1;
    const wx=ax==='x'?s*(hw+.55):0,wz=ax==='z'?s*(hd+.55):0;const wb=K.sub();makeWheel(wb,1.35,.6,ax);
    const wy=Math.max(c.waterLevel+.9,base+.6);K.anim(wb,'spin',wx,wy,wz,{axis:ax,speed:.9+Math.min(1.5,c.flow*.6)});
    B.box(ax==='x'?s*(hw-.4):0,base+.5,ax==='z'?s*(hd-.4):0,ax==='x'?.8:1,.9,ax==='z'?.8:1,COL.woodD);
    B.box(.2,base+.8,-.6,1.8,.25,.25,COL.wood);B.box(-.6,base,-.6,.5,.85,.5,COL.iron);
    name='Water-Forge';T.push('Water wheel drives the trip-hammer');}
  if(armory){for(let i=0;i<3;i++){const x=hw+.9,z=-1+i*1.1,g=K.gh(x,z);B.box(x,g,z,.08,1.3,.08,COL.wood);B.box(x,g+1.1,z,.5,.6,.32,0x8a8f96);B.sph(x,g+1.6,z,.18,.2,.18,0x8a8f96);}
    K.flag(-hw-.4,base,hd,K.pick(BANNER),.9,2.4);name=water?'Armoury Forge':'Armoury';T.push('Armour stands for the garrison');}
  if(forest&&!armory){const x=-hw-2,z=-1.4,g=K.gh(x,z);B.sph(x,g,z,1.3,.95,1.3,0x3a2e24,1);K.smoke(x,g+1,z,.8,1);name=water?name:'Charcoal Forge';T.push('Charcoal kiln fed by the forest');}
  T.unshift('Open-fronted forge with anvil & quench barrel');
  return {name,r:Math.max(hw,hd)+.7};
};

GEN.mill=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;
  if(c.waterDist<6.5){
    const o={cw:b.cw,cs:b.cs,w:4.2,d:3.6,st:2,wallCol:K.pick(PLASTER),frame:true,roofCol:K.pick(ROOF.thatch),pitch:1,roofT:.34,ov:.42,capCol:0x8a6f3a,shut:K.pick(SHUT)};
    const R=buildHall(K,o);const wl=c.wLocal,ax=Math.abs(wl.x)>Math.abs(wl.z)?'x':'z',s=ax==='x'?Math.sign(wl.x)||1:Math.sign(wl.z)||1;
    const wx=ax==='x'?s*(o.w/2+.55):0,wz=ax==='z'?s*(o.d/2+.55):0;const wb=K.sub();makeWheel(wb,1.9,.7,ax);
    const wy=Math.max(c.waterLevel+1.2,R.base+.5);K.anim(wb,'spin',wx,wy,wz,{axis:ax,speed:.6+Math.min(1.6,c.flow*.7)});
    B.box(wx*1.6,wy+1.9,wz*1.6,ax==='x'?2:.5,.15,ax==='z'?2:.5,COL.plank);
    for(let i=0;i<4;i++){const x=-1.4+i*.5,z=o.d/2+.6,g=K.gh(x,z);B.box(x,g,z,.45,.35,.6,0xd8cfb0);}
    T.push(c.flow>.8?'Fast current spins the wheel':'Undershot water wheel','Flour sacks by the door');
    return {name:'Watermill',r:3.2};}
  const tall=c.elev>.35||c.hilltop;
  const wind=.6+c.elev*1.6+(c.hilltop?.6:0);
  if(tall){const g=K.rect(2,2);const base=g[1]+.1;B.cyl(0,g[0]-.5,0,2.0,base-g[0]+.5,0x7d766a,12);
    B.cyl(0,base,0,1.9,7,K.pick([0xd8d0bc,0xc9c0aa,0xa39b8a]),12,.72);B.cyl(0,base+7,0,1.5,.35,COL.wood,12);B.sph(0,base+7.3,0,1.45,1.1,1.45,K.pick(ROOF.thatch),1);
    for(let i=0;i<3;i++)K.G.box(0,base+1.6+i*2,1.72-i*.17,.4,.55,.06,0xffffff);B.box(0,base,1.85,.8,1.4,.12,COL.door);
    const sb=K.sub();makeSails(sb,4.2);K.anim(sb,'spin',0,base+6.8,1.75,{axis:'z',speed:-wind});
    T.push('Stone tower mill','Hill winds: sails turn fast');return {name:'Tower Windmill',r:2.6};}
  const g=K.gh(0,0);B.beam(-1.3,g,-1.3,0,g+1.6,0,.18,COL.woodD);B.beam(1.3,g,1.3,0,g+1.6,0,.18,COL.woodD);B.beam(-1.3,g,1.3,0,g+1.6,0,.18,COL.woodD);B.beam(1.3,g,-1.3,0,g+1.6,0,.18,COL.woodD);
  B.cyl(0,g,0,.28,2.2,COL.wood,8);
  B.box(0,g+2.0,0,2.4,3.2,2.6,K.pick([0x9a7448,0x8a6440,0xa58055]));gable(B,{x:0,z:0,top:g+5.2,len:2.6,span:2.4,k:1,t:.16,col:K.pick(ROOF.shingle),wall:0x8a6440,axis:'z',ov:.25});
  B.beam(0,g,-3.2,0,g+2.1,-1.3,.5,COL.wood,.12);K.G.box(0,g+3.6,1.32,.4,.5,.05,0xffffff);
  const sb=K.sub();makeSails(sb,3.8);K.anim(sb,'spin',0,g+4.2,1.55,{axis:'z',speed:-wind});
  T.push('Wooden post mill on a trestle',c.elev<.2?'Lowland breeze: gentle sails':'Steady breeze');
  return {name:'Post Windmill',r:2.6};
};

const TAV_A=['Gilded','Crooked','Sleeping','Merry','Silver','Red','Wandering','Laughing','Old','Golden'];
const TAV_N=['Stag','Boar','Lantern','Kettle','Raven','Goose','Barrel','Hound','Oak','Mare'];
GEN.tavern=(b,c,K)=>{
  const {B,G,rng}=K,T=K.traits;
  const harbour=c.waterDist<6,inn=c.roadDist<9;
  const o={cw:b.cw,cs:b.cs,w:5.8,d:4.4,st:c.houses>=6?3:2,wallCol:K.pick(PLASTER),frame:true,jetty:true,groundCol:K.pick(STONE),roofCol:K.pick(ROOF.tile.concat(ROOF.thatch)),pitch:.9,shut:K.pick(SHUT),boxes:true};
  o.roofT=.22;const R=buildHall(K,o);
  const wing={ox:o.w/2+1.4,oz:-.5,w:2.8,d:3.2,st:1,wallCol:o.wallCol,frame:true,roofCol:o.roofCol,pitch:.9,attL:true,shut:o.shut,doorX:.4};buildHall(K,wing);
  {const cx=o.w/2-.45,ty=R.top+R.hr*.55+1;B.box(cx,R.top-.5,-.6,.6,ty-R.top+.5,.6,0x7d7468);B.box(cx,ty,-.6,.72,.12,.72,0x5f584f);K.smoke(cx,ty+.2,-.6,1.4);}
  const sx=-o.w/2+.5,sy=R.base+2.7,sz=o.d/2;B.box(sx,sy,sz,.08,.08,1.1,COL.iron);B.box(sx,sy,sz+.02,.08,.08,.08,COL.iron);
  const sg=K.sub();const sc=K.pick([0x8e2f1f,0x2f4a8e,0x2f6b3a,0x6b4a2e]);sg.box(0,-.75,0,.07,.62,.85,sc);sg.box(0,-.6,0,.09,.3,.3,COL.gold);sg.box(0,-.1,0,.03,.1,.6,COL.iron);
  K.anim(sg,'swing',sx,sy,sz+.95,{});
  for(let t=0;t<2;t++){const x=-1.4+t*2.4,z=o.d/2+1.9,g=K.gh(x,z);B.box(x,g+.65,z,1.4,.08,.75,COL.woodL);for(const f of [-1,1])B.box(x+f*.55,g,z,.1,.65,.6,COL.wood);
    for(const f of [-1,1])B.box(x,g+.35,z+f*.7,1.4,.07,.3,COL.wood);B.cyl(x+.3,g+.73,z,.07,.18,0x8a6a40,6);}
  for(let i=0;i<3;i++)B.cyl(-o.w/2-.6,K.gh(-o.w/2-.6,1)+i*.0,1-i*.55,.28,.62,0x6b4a2e,8);B.hcyl(-o.w/2-.6,K.gh(-o.w/2-.6,.4)+.85,.4,.28,.62,0x6b4a2e,'z',8);
  let name=`The ${K.pick(TAV_A)} ${harbour?K.pick(['Anchor','Eel','Pike','Gull']):c.castleD<30?K.pick(['Crown','Shield','Lion']):K.pick(TAV_N)}`;
  T.push('Inn: '+(harbour?'Harbour Tavern':inn?'Coaching Inn':c.houses>=6?'Town Tavern':'Village Alehouse'),'Swinging sign & ale tables');
  if(inn&&!harbour){const x=-o.w/2-1.7,g=K.rect(1.2,2,x,-.6);const sb=g[1];for(const [px,pz] of [[x-1,-2.4],[x-1,1.2],[x+.9,-2.4],[x+.9,1.2]])B.box(px,K.gh(px,pz),pz,.15,sb-K.gh(px,pz)+2,.15,COL.wood);
    B.wedge(x,sb+2,-.6,2.6,.7,4,K.pick(ROOF.shingle),-PI/2);B.box(x,sb,-.6,1.6,.6,2.8,COL.hay);B.box(x-.2,sb,1.6,1.4,.4,.5,COL.wood);T.push('Stables for coaches on the road');}
  if(harbour)dock(K,c,o.d/2+.6,9,T);
  T.push(`${o.st} storeys + kitchen wing`);
  return {name,r:4.6};
};

GEN.market=(b,c,K)=>{
  const {B,rng}=K,T=K.traits;const fish=c.waterDist<7;
  const n=clamp(3+Math.floor(c.houses/2),3,7);const g=K.rect(4.4,4.4);const base=g[1]+.03;
  B.cyl(0,g[0]-.4,0,4.7,base-g[0]+.42,0x8f8a80,18);
  for(let r=1;r<5;r++)B.cyl(0,base+.01,0,r*.95,.02,r%2?0x9a958a:0x86817a,18);
  const AW=fish?[[0x3b5675,0xe8e2d2],[0x2f6b7a,0xf0ead8]]:[[0x8e2f1f,0xe8dcc0],[0x2f6b3a,0xe8dcc0],[0x3b4f8e,0xf0e6c8],[0xc98a2a,0xf2ead2],[0x6b2f6b,0xe8dcc0]];
  for(let i=0;i<n;i++){const a=i/n*TAU+.3,rr=3.1,cx=Math.sin(a)*rr,cz=Math.cos(a)*rr,ry=a+PI;
    const rot=(lx,lz)=>[cx+lx*Math.cos(ry)+lz*Math.sin(ry),cz-lx*Math.sin(ry)+lz*Math.cos(ry)];
    for(const [lx,lz] of [[-.9,-.5],[.9,-.5],[-.9,.6],[.9,.6]]){const [x,z]=rot(lx,lz);B.box(x,base,z,.09,lz<0?2.3:2.0,.09,COL.wood);}
    const [tx,tz]=rot(0,-.2);B.box(tx,base,tz,1.8,.8,.7,COL.woodL,ry);
    const aw=AW[i%AW.length];for(let s=0;s<4;s++){const [x,z]=rot(-.675+s*.45,.05);B.boxC(x,base+2.2,z,.45,.05,1.45,aw[s%2],-.32,ry,0);}
    for(let q=0;q<5;q++){const [x,z]=rot(-.6+q*.3,-.2+(rng()-.5)*.3);
      if(fish)B.box(x,base+.82,z,.12,.06,.35,K.pick([0xb8b0a0,0xc98a5a]),ry+(rng()-.5));else B.sph(x,base+.9,z,.13,.12,.13,K.pick([0xc0392b,0x6a9a2a,0xd98a1a,0xe8c84a,0x7a3a6a]));}
    const [bx,bz]=rot(.6,-.9);B.box(bx,base,bz,.5,.45,.5,0x8a6a40,ry+.3);}
  if(c.wellD>8){B.box(0,base,0,.9,.4,.9,0x8a857c);B.box(0,base+.4,0,.35,2.4,.35,0x9a9488);B.box(0,base+2.2,0,.9,.18,.18,0x9a9488);T.push('Stone market cross');}
  else T.push('Gathered around the well');
  T.unshift(`${n} stalls (grows with the town)`);if(fish)T.push('Fresh catch from the water');
  return {name:fish?'Fish Market':n>=5?'Market Square':'Market Stalls',r:4.8};
};

GEN.tower=(b,c,K)=>{
  const {B,G,F,rng}=K,T=K.traits;
  if(c.waterDist<5.5){const g=K.rect(1.6,1.6);const base=g[1]+.1;const h=10+c.elev*4;
    B.cyl(0,g[0]-.6,0,1.9,base-g[0]+.6,0x7d766a,12);
    for(let i=0;i<5;i++){const y0=base+i*h/5,r0=1.55-i*.08;B.cyl(0,y0,0,r0,h/5,i%2?0x9a2f22:0xeee8da,12,(r0-.08)/r0);}
    B.cyl(0,base+h,0,1.4,.2,COL.iron,12);F.cyl(0,base+h+.2,0,.75,1.1,0xffd68a,8);for(let i=0;i<6;i++){const a=i/6*TAU;B.box(Math.sin(a)*.82,base+h+.2,Math.cos(a)*.82,.07,1.1,.07,COL.iron);}
    B.cone(0,base+h+1.3,0,1.05,1.3,0x9a2f22,8);B.box(0,base,1.52,.7,1.3,.12,COL.door);
    T.push('Lantern guides boats on the water','Painted bands');return {name:'Lighthouse',r:2};}
  if(c.elev>.4||c.hilltop||c.castleD<26){const g=K.rect(1.7,1.7);const base=g[1]+.1;const h=7.5+(c.hilltop?3:0)+c.elev*2;
    B.cyl(0,g[0]-.8,0,2.0,base-g[0]+.8,0x7d766a,10);B.cyl(0,base,0,1.7,h,K.pick(STONE),10,.93);B.cyl(0,base+h,0,1.85,.3,0x7d776b,10);
    for(let k=0;k<8;k++){const a=k/8*TAU;B.box(Math.sin(a)*1.7,base+h+.3,Math.cos(a)*1.7,.45,.55,.45,0x8f897d,a);}
    for(let i=0;i<3;i++)G.box(Math.sin(i*2.1)*1.62,base+2+i*2.1,Math.cos(i*2.1)*1.62,.18,.6,.18,0xffffff);B.box(0,base,1.6,.75,1.4,.12,COL.door);
    K.flag(0,base+h+.3,0,K.pick(BANNER),1,2.2);
    T.push(c.hilltop?'Hilltop lookout: taller':'Stone keep-tower','Crenellated parapet');return {name:'Stone Watchtower',r:2.1};}
  const g=K.gh(0,0),h=5.5+(rng()*.8);
  for(const [x,z] of [[-1.1,-1.1],[1.1,-1.1],[1.1,1.1],[-1.1,1.1]])B.beam(x,K.gh(x,z)-.3,z,x*.72,g+h,z*.72,.2,COL.woodD);
  for(let L=1;L<3;L++){const y=g+L*h/3,s=1.1-L*.12;for(const [a,bb] of [[[-s,-s],[s,-s]],[[s,-s],[s,s]],[[s,s],[-s,s]],[[-s,s],[-s,-s]]])B.beam(a[0],y,a[1],bb[0],y,bb[1],.1,COL.wood);}
  B.box(0,g+h,0,2.2,.18,2.2,COL.plank);for(const [x,z,sx,sz] of [[0,1.05,2.2,.07],[0,-1.05,2.2,.07],[1.05,0,.07,2.2],[-1.05,0,.07,2.2]])B.box(x,g+h+.6,z,sx,.08,sz,COL.wood);
  for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]])B.box(x,g+h,z,.1,1.9,.1,COL.wood);
  B.cone(0,g+h+1.9,0,1.75,1.4,K.pick(ROOF.thatch),4,PI/4);B.beam(.9,g,1.6,.7,g+h,1.0,.25,COL.wood,.05);
  T.push('Timber lookout on stilted legs','Ladder & thatched canopy');
  return {name:'Wooden Lookout',r:2};
};

GEN.farm=(b,c,K)=>{
  const {B,rng}=K,T=K.traits;const fw=9,fd=7;
  const [gMin,gMax]=K.rect(fw/2,fd/2);const slope=gMax-gMin;
  let crop=c.millD<16?'wheat':c.waterDist<8?'cabbage':(slope>2.4||c.elev>.5)?'vine':K.pick(['wheat','barley','flax','pumpkin','cabbage']);
  const CN={wheat:'Wheat Field',barley:'Barley Field',flax:'Flax Field',pumpkin:'Pumpkin Patch',cabbage:'Cabbage Rows',vine:'Vineyard'};
  for(let z=-fd/2+.45;z<fd/2-.3;z+=.72)for(let x=-fw/2+.5;x<fw/2-.4;x+=1){const g=K.gh(x,z);
    B.box(x,g-.12,z,1.02,.17,.62,COL.soil);
    if(crop==='wheat'||crop==='barley'){for(let q=0;q<3;q++){const hh=.5+rng()*.3;B.box(x-.32+q*.32,g,z+(rng()-.5)*.08,.24,hh,.34,crop==='wheat'?K.pick([0xd8b84a,0xcfa83e,0xe0c060,0xc8a040]):K.pick([0xb8a860,0xa89a50,0xc0b070]));B.box(x-.32+q*.32,g+hh,z,.16,.12,.22,crop==='wheat'?0xe8cc6a:0xc8b878);}}
    else if(crop==='flax')B.box(x,g,z,.9,.45,.36,K.pick([0x8a8fc8,0x7a86b8,0x6f9a4a]));
    else if(crop==='cabbage'){for(const q of [-.25,.25])B.sph(x+q,g+.12,z,.2,.16,.2,K.pick([0x7aa04a,0x5f8a3a,0x8ab05a]));}
    else if(crop==='pumpkin'){B.box(x,g,z,.9,.06,.5,0x4f7a35);if(rng()<.6)B.sph(x+(rng()-.5)*.5,g+.15,z,.24,.18,.24,0xd9781a,1);}
    else{B.box(x,g,z,.07,1.2,.07,COL.woodD);B.sph(x,g+.95,z,.5,.32,.28,0x4f7a35);if(rng()<.5)B.sph(x+.25,g+.75,z+.15,.09,.14,.09,0x5a2a5a);}}
  const P=[[-fw/2-.2,-fd/2-.2],[fw/2+.2,-fd/2-.2],[fw/2+.2,fd/2+.2],[-fw/2-.2,fd/2+.2],[-fw/2-.2,-fd/2-.2]];
  for(let i=0;i<4;i++){const [ax,az]=P[i],[bx,bz]=P[i+1],n=Math.ceil(Math.hypot(bx-ax,bz-az)/1.5);
    for(let s=0;s<n;s++){if(i===2&&s===Math.floor(n/2))continue;const x=lerp(ax,bx,s/n),z=lerp(az,bz,s/n),x2=lerp(ax,bx,(s+1)/n),z2=lerp(az,bz,(s+1)/n),g=K.gh(x,z),g2=K.gh(x2,z2);
      B.box(x,g-.2,z,.1,1,.1,COL.woodL);B.beam(x,g+.55,z,x2,g2+.55,z2,.06,COL.woodL);B.beam(x,g+.25,z,x2,g2+.25,z2,.06,COL.woodL);}}
  const sx=1.2,sz=.3,g=K.gh(sx,sz);B.box(sx,g,sz,.1,1.9,.1,COL.wood);B.box(sx,g+1.4,sz,1.2,.08,.08,COL.wood);B.box(sx,g+1.0,sz,.45,.6,.25,0x8a6a40);B.sph(sx,g+1.85,sz,.2,.22,.2,0xd8c8a0);B.cone(sx,g+1.95,sz,.38,.4,COL.hay,8);
  T.push(crop==='vine'?'Slope suits vines':crop==='wheat'&&c.millD<16?'Wheat for the nearby mill':crop==='cabbage'&&c.waterDist<8?'Irrigated by the water':'Crop chosen by soil','Fenced, with a scarecrow');
  if(slope>1.2)T.push('Rows follow the hillside');
  return {name:CN[crop],r:5.4};
};

function stockpile(K,x,z,wood,stone,food){const B=K.B;const g=K.gh(x,z);
  const nl=Math.min(14,Math.ceil(wood/8));let i=0;
  for(let r=0;i<nl;r++)for(let c=0;c<5-r&&i<nl;c++,i++)B.hcyl(x-1.2+(c-(4-r)/2)*.36+1.2,g+.18+r*.32,z-1.1,.17,1.7,K.pick([0x8a6440,0x7a5632,0x9a7448]),'z');
  const ns=Math.min(14,Math.ceil(stone/8));for(let s=0;s<ns;s++){const r=Math.floor(s/5),c=s%5;B.box(x+1.4+(c-2)*.42,g+r*.36,z-1.1+(r%2)*.1,.4,.36,.55,K.pick([0xa39c8e,0x8f897d,0xb3ab9a]));}
  const nf=Math.min(10,Math.ceil(food/14));for(let s=0;s<nf;s++){const a=s*1.1;B.sph(x+Math.cos(a)*.7,g+.25,z+1.1+Math.sin(a)*.4,.28,.32,.26,K.pick([0xc8b48a,0xd2bf95,0xb8a478]));}
  if(nf>3)B.box(x-1.3,g,z+1.2,.6,.5,.6,0x8a6a40);}
GEN.hall=(b,c,K)=>{const {B,G,rng}=K,T=K.traits;const lvl=b.level||0;const st=b.stock||{wood:0,stone:0,food:0};
  if(lvl===0){const g0=K.gh(0,0);
    for(let i=0;i<9;i++){const a=i/9*TAU;B.box(Math.sin(a)*.66,g0-.1,Math.cos(a)*.66,.32,.3,.32,0x7a756c,a);}
    B.hcyl(0,g0+.12,0,.1,1.1,0x4a3020,'x');B.hcyl(0,g0+.2,0,.1,1.1,0x4a3020,'z');K.flame(0,g0+.05,0,1.1);K.smoke(0,g0+1.3,0,1.6);
    const cols=[0xc4b48e,0xb5a27a,0xa88f68,0xbca782];
    for(let i=0;i<4;i++){const a=i/4*TAU+.6,x=Math.sin(a)*3.4,z=Math.cos(a)*3.4,gg=K.gh(x,z);ridgeTent(K,x,gg-.04,z,2.2,1.6,2.1,cols[i],a+PI/2,{patch:i%2===0});}
    stockpile(K,0,-.2,st.wood,st.stone,st.food);
    B.box(-3,K.gh(-3,1.5),1.5,1.3,.4,2.0,COL.wood);for(const f of [-1,1])B.hcyl(-3+f*.72,K.gh(-3,1.5)+.42,1.5,.42,.1,COL.woodD,'x');
    T.push('Tents round the first campfire','Stockpile of wood, stone & food');return {name:"Settlers' Camp",r:4.6};}
  const w=lvl>=2?7.2:6,d=lvl>=2?5:4.4;
  const o={cw:b.cw,cs:b.cs,w,d,st:2,groundCol:K.pick(STONE),wallCol:K.pick(PLASTER),frame:true,jetty:lvl>=2,roofCol:lvl>=2?K.pick(ROOF.slate):K.pick(ROOF.tile),pitch:.95,roofT:.2,shut:0x3b5675,doorX:0,boxes:lvl>=2};
  const R=buildHall(K,o);const ty=R.top+R.hr;
  B.box(0,ty-.3,0,1.2,1.5,1.2,o.wallCol);B.box(0,ty+1.2,0,1.4,.12,1.4,COL.beamD);B.cone(0,ty+1.3,0,1.05,1.5,o.roofCol,4,PI/4);B.sph(0,ty+.55,0,.3,.36,.3,0xb08a3a);
  for(const f of [-1,1])B.box(f*.61,ty+.2,0,.04,.7,.6,COL.dark);
  if(lvl>=2){G.cyl(0,R.base+3.1,d/2+.32,.45,.04,0xfff2c0,12);}
  K.flag(-w/2-.3,R.base,d/2+.3,0x8e2f1f,1,3);K.flag(w/2+.3,R.base,d/2+.3,0x2f4a8e,1,3);
  stockpile(K,w/2+2.6,0,st.wood,st.stone,st.food);
  B.box(-w/2-1.4,K.gh(-w/2-1.4,1.6),1.6,.1,1.5,.1,COL.wood);B.box(-w/2-1.4,K.gh(-w/2-1.4,1.6)+.9,1.6,.9,.6,.06,COL.woodL);
  T.push(lvl>=2?'Guildhall with clock & bell':'Town hall with bell cupola','Stores the town’s wood, stone & food');
  return {name:lvl>=2?'Guildhall':'Town Hall',r:5.4};};
GEN.quarry=(b,c,K)=>{const {B,rng}=K,T=K.traits;const [gMin,gMax]=K.rect(2.6,2);
  const g=gMin;B.box(0,g-1.1,0,5,1.05,4,0x5e5850);B.box(0,g-1.12,0,4.2,.04,3.2,0x4f4a44);
  for(let i=0;i<3;i++)B.box(-1.8+i*.5,g-1.1+i*.33,-1.4,.6,.33,1.2,0x857f74);
  for(let i=0;i<10;i++){const a=i/10*TAU;B.box(Math.sin(a)*2.9,K.gh(Math.sin(a)*2.9,Math.cos(a)*2.4)-.3,Math.cos(a)*2.4,.7,.5,.6,0x8f897d,a);}
  const cx=2.6,cz=1.6,cg=K.gh(cx,cz);B.beam(cx-.6,cg,cz,cx,cg+3.6,cz,.15,COL.wood);B.beam(cx+.6,cg,cz,cx,cg+3.6,cz,.15,COL.wood);B.beam(cx,cg+3.5,cz,cx-2.6,cg+2.6,cz-1.4,.12,COL.wood);
  B.box(cx-2.6,cg-.4,cz-1.4,.03,3,.03,0xbfa98a);B.box(cx-2.6,cg-.9,cz-1.4,.5,.45,.5,0xa39c8e);
  for(let i=0;i<6;i++)B.box(-2.8+(i%3)*.5,K.gh(-2.8,2.4)+Math.floor(i/3)*.4,2.4,.45,.38,.6,K.pick([0xa39c8e,0xb3ab9a]));
  B.box(1,K.gh(1,-2.8),-2.8,1.2,.35,.8,COL.wood);for(const f of [-1,1])B.hcyl(1+f*.66,K.gh(1,-2.8)+.25,-2.8,.3,.08,COL.woodD,'x');
  T.push(gMax-gMin>1.5?'Cut into the hillside':'Open pit quarry','Wooden crane hoists the blocks');
  return {name:'Stone Quarry',r:3.8};};

// ================================================================ environment-driven buildings
function hull(B,x,y,z,len,wid,ang,col,ribs){const dx=Math.sin(ang),dz=Math.cos(ang),px=dz,pz=-dx;
  const pts=7;for(let i=0;i<pts;i++){const f=i/(pts-1)-.5,ww=wid*(1-Math.pow(Math.abs(f)*2,2.2)*.85),cx=x+dx*f*len,cz=z+dz*f*len;
    if(!ribs){if(i===0)loftHull(B,x,y,z,len,wid,ang,col);}
    else{for(const s of [-1,1])B.beam(cx,y,cz,cx+px*s*ww/2,y+.45,cz+pz*s*ww/2,.06,col);B.beam(cx-px*ww/2,y+.45,cz-pz*ww/2,cx+px*ww/2,y+.45,cz+pz*ww/2,.04,col);}}
  B.beam(x-dx*len*.5,y+.05,z-dz*len*.5,x+dx*len*.5,y+.05,z+dz*len*.5,.1,COL.woodD);B.beam(x+dx*len*.48,y,z+dz*len*.48,x+dx*len*.58,y+.55,z+dz*len*.58,.08,COL.woodD);}
// smooth clinker-built hull: lofted sections, sheer curve, planks, inner floor, gunwale, stem & stern posts
function loftHull(B,x,y,z,len,wid,ang,col){const NS=12,NR=5,dx=Math.sin(ang),dz=Math.cos(ang),px=dz,pz=-dx;
  const sec=(f)=>{const t=Math.abs(f)*2,half=wid/2*Math.max(.02,1-Math.pow(t,2.4));const sheer=.42+Math.pow(t,2)*.22,keel=.02+Math.pow(t,3)*.25;return {half,sheer,keel};};
  const P=(f,s,r)=>{const S=sec(f);const a=r/NR*PI/2;const w=S.half*Math.sin(a),h=S.keel+(S.sheer-S.keel)*(1-Math.cos(a));const cx=x+dx*f*len,cz=z+dz*f*len;return [cx+px*w*s,y+h,cz+pz*w*s];};
  for(let i=0;i<NS;i++)for(let r=0;r<NR;r++){const f0=i/NS-.5,f1=(i+1)/NS-.5;const c=_shade(col,(r%2?.92:1.02)*(1-.04*(r===NR-1)));
    for(const s of [-1,1]){const a=P(f0,s,r),b=P(f1,s,r),c2=P(f1,s,r+1),d=P(f0,s,r+1);if(s>0)B.quad(a,d,c2,b,c,8);else B.quad(a,b,c2,d,c,8);
      const ci=_shade(col,.62);if(s>0)B.quad(a,b,c2,d,ci,8);else B.quad(a,d,c2,b,ci,8);}}
  for(let i=0;i<NS;i++){const f0=i/NS-.5,f1=(i+1)/NS-.5;for(const s of [-1,1]){const a=P(f0,s,NR),b=P(f1,s,NR);B.beam(a[0],a[1]+.02,a[2],b[0],b[1]+.02,b[2],.07,COL.woodD,.09);}}
  {const fl=.15;const a=P(-.38,-1,1),b=P(.38,-1,1),c2=P(.38,1,1),d=P(-.38,1,1);B.quad(a,d,c2,b,_shade(col,.7),8);}
  for(const e of [-1,1]){const t=P(e*.5,1,NR),k=P(e*.5,1,0);B.beam(k[0],k[1]-.02,k[2],t[0]+dx*e*.08,t[1]+.16,t[2]+dz*e*.08,.09,COL.woodD);}}
function makeBoatMesh(sail,col){const B=new Builder(Math.random,.04);hull(B,0,0,0,3.2,1.1,0,col||0x6b4a2e,false);
  for(let i=-1;i<=1;i++)B.boxC(0,.33,i*.7,.9,.05,.18,COL.woodL,0,0,0);
  if(sail){B.box(0,.2,.25,.09,2.75,.09,COL.woodD);B.box(0,2.62,.25,1.5,.06,.06,COL.woodD);B.box(0,.95,.25,1.4,.05,.05,COL.woodD);
    const NU=5,NV=5;for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const x0=-.68+i*1.36/NU,x1=-.68+(i+1)*1.36/NU,y0=2.58-j*1.6/NV,y1=2.58-(j+1)*1.6/NV;
      const bz=(xx,yy)=>.3+Math.sin((xx+.68)/1.36*PI)*Math.sin((2.58-yy)/1.6*PI)*.22;const c=_shade(0xe8dcc0,(j===2?.86:1)*(.96+(i%2)*.03));
      const a=[x0,y0,bz(x0,y0)],b=[x1,y0,bz(x1,y0)],c2=[x1,y1,bz(x1,y1)],d=[x0,y1,bz(x0,y1)];B.quad(a,b,c2,d,c,9);B.quad(a,d,c2,b,c,9);}
    for(const s of [-1,1]){B.beam(s*.7,2.6,.25,s*.5,.45,-1.3,.012,0xb8a888);B.beam(s*.7,2.6,.25,s*.45,.45,1.3,.012,0xb8a888);}}
  else for(const s of [-1,1])B.beam(s*.4,.36,0,s*1.2,.0,-.4,.04,COL.woodL);
  return B.mesh(matB);}
GEN.dock=(b,c,K)=>{const {B,rng}=K,T=K.traits;const wl=c.wLocal,ang=Math.atan2(wl.x,wl.z);
  let len=6;for(let s=2;s<16;s+=.5){if(K.wd(wl.x*s,wl.z*s)>1.1){len=s+2.5;break;}}len=clamp(len,5,16);
  const dy=Math.max(c.waterLevel,K.gh(0,0))+.38;const cx=wl.x*len/2,cz=wl.z*len/2;
  B.boxC(cx,dy,cz,1.8,.14,len+1,COL.plank,0,ang,0);
  for(let s=.5;s<=len;s+=1.4)for(const f of [-1,1]){const px=wl.x*s+wl.z*.85*f,pz=wl.z*s-wl.x*.85*f,g=K.gh(px,pz);B.cyl(px,g-.5,pz,.1,dy-g+.9,COL.woodD,6);}
  const ex=wl.x*len,ez=wl.z*len;B.boxC(ex+wl.z*1.6,dy,ez-wl.x*1.6,3.4,.14,2.2,COL.plank,0,ang+PI/2,0);
  for(const f of [-1,1]){B.cyl(ex+wl.z*f*2.8,dy,ez-wl.x*f*2.8,.12,.4,COL.woodD,6);}
  for(let i=0;i<3;i++)B.box(wl.x*1.4+wl.z*(.5-i*.5),K.gh(wl.x*1.4,wl.z*1.4)+.02,wl.z*1.4-wl.x*(.5-i*.5),.6,.5,.6,0x8a6a40,ang+i);
  boat(K,ex-wl.z*1.6,c.waterLevel-.12,ez+wl.x*1.6,ang);
  const lp=[wl.x*(len-.4)+wl.z*.9,wl.z*(len-.4)-wl.x*.9];B.box(lp[0],dy,lp[1],.1,1.8,.1,COL.woodD);K.F.box(lp[0],dy+1.8,lp[1],.22,.26,.22,0xffc860);
  const cw=b.cw==null?5:b.cw;if(cw>=4){const hx=wl.x*(len*.55)+wl.z*2.6,hz=wl.z*(len*.55)-wl.x*2.6;for(const [a2,b2] of [[1,1],[1,-1],[-1,1],[-1,-1]])B.box(hx+a2*1.2,dy-1.5,hz+b2*1.6,.12,3.4,.12,COL.woodD,ang);
    gable(B,{x:hx,z:hz,top:dy+1.9,len:3.6,span:2.6,k:.9,t:.15,col:K.pick(ROOF.shingle),axis:'x',ov:.3,rows:true});T.push('Covered boathouse');}
  T.push('Pier reaching deep water','Moorings for fishing boats');return {name:'Fishing Dock',r:3.2};};
GEN.fishmkt=(b,c,K)=>{const {B,G,rng}=K,T=K.traits;const [gMin,gMax]=K.rect(3.8,3);const base=gMax+.1;
  B.box(0,gMin-.4,0,7.8,base-gMin+.4,6.2,0x8f8a80);for(let i=0;i<5;i++)B.box(-3.2+i*1.6,base,-2.6+.02,1.5,.02,5.2,i%2?0x9a958a:0x86817a);
  for(const x of [-3.4,-1.15,1.15,3.4])for(const z of [-2.6,2.6])B.box(x,base,z,.2,2.8,.2,COL.wood);
  for(const z of [-2.6,2.6])B.box(0,base+2.7,z,7.2,.18,.2,COL.beamD);
  gable(B,{x:0,z:0,top:base+2.85,len:7.2,span:5.2,k:.75,t:.16,col:K.pick(ROOF.tile),ov:.4,rows:true,barge:(b.cw||5)>=3?0x5a3a22:null});
  for(let i=0;i<3;i++){const x=-2.3+i*2.3;B.box(x,base,0,1.6,.8,1.1,COL.woodL);B.box(x,base+.8,0,1.5,.06,1.0,0xd8e4e8);
    for(let q=0;q<6;q++)B.boxC(x-.6+q*.24,base+.9,(rng()-.5)*.6,.09,.06,.32,K.pick([0x9ab0b8,0xb8a890,0xc08a6a,0x8a9aa8]),0,rng()*3,0);}
  for(let q=0;q<5;q++)B.cyl(-3.6+q*.4,K.gh(-3.6,3.4),3.4,.22,.32,0x9a7a4a,8);for(let q=0;q<3;q++)B.cyl(3.2,K.gh(3.2,3.3)+q*0,3.3-q*.5,.28,.62,0x6b4a2e,8);
  for(let q=0;q<7;q++)B.box(-3.2+q*1.05,base+2.2,2.62,.05,.36,.03,K.pick([0x9ab0b8,0xa8b8c0]));
  B.boxC(0,base+2.3,3.1,7.6,.04,1.1,0x3b5675,-.35,0,0);for(let s=0;s<8;s++)B.boxC(-3.3+s*.95,base+2.31,3.1,.45,.045,1.1,0xeee8da,-.35,0,0);
  T.push('Fresh catch sold daily','Fish feed the town better (+20%)');return {name:'Fish Market',r:4.4};};
GEN.lodge=(b,c,K)=>{const {B,F,rng}=K,T=K.traits;const o={w:4.2,d:3.4,st:1,style:'log',wallCol:0x6d4a2d,gableCol:0x6d4a2d,roofCol:K.pick(ROOF.shingle),pitch:1,roofT:.2,shut:0x5a3d26,found:0x6f6558,cw:b.cw,cs:b.cs};
  const R=buildHall(K,o);const hw=o.w/2;
  const ay=R.base+1.75,az=o.d/2+.1;B.box(0,ay,az,.1,.12,.08,0xc8b898);for(const s of [-1,1]){B.beam(s*.04,ay+.06,az,s*.35,ay+.45,az,.04,0xc8b898);B.beam(s*.25,ay+.3,az,s*.45,ay+.35,az,.03,0xc8b898);B.beam(s*.35,ay+.45,az,s*.38,ay+.62,az,.03,0xc8b898);}
  for(let i=0;i<2;i++){const x=hw+1.2+i*1.3,z=-.4,g=K.gh(x,z);B.box(x-.55,g,z,.07,1.6,.07,COL.woodD);B.box(x+.55,g,z,.07,1.6,.07,COL.woodD);B.box(x,g+1.55,z,1.2,.06,.06,COL.woodD);
    B.box(x,g+.45,z,.95,1.0,.03,K.pick([0x8a6a4a,0x7a5a3a,0x9a7a5a]));}
  const sx=-hw-1.4,sz=.4,sg=K.gh(sx,sz);for(const f of [-1,1])B.box(sx+f*.6,sg,sz,.08,1.5,.08,COL.woodD);B.box(sx,sg+1.4,sz,1.3,.06,.06,COL.woodD);
  for(let q=0;q<4;q++)B.box(sx-.45+q*.3,sg+1.0,sz,.12,.35,.08,0x8a3a2a);
  const fx=0,fz=o.d/2+2,fg=K.gh(fx,fz);for(let i=0;i<7;i++){const a=i/7*TAU;B.box(fx+Math.sin(a)*.5,fg-.1,fz+Math.cos(a)*.5,.26,.24,.26,0x7a756c,a);}K.flame(fx,fg+.05,fz,.8);
  if(G&&G.unl&&G.unl.smoking){K.smoke(sx,sg+1.6,sz,1.2);T.push('Smokehouse cures the meat');}
  for(let q=0;q<4;q++)B.beam(hw+.2,R.base+.2,-1.2+q*.25,hw+.25,R.base+1.8,-1.25+q*.25,.035,q%2?0x6a4a2a:0x8a6a3a);
  T.push('Hides stretched to dry','Antlers over the door','Game from the forests nearby');return {name:"Hunter's Lodge",r:3.6};};
GEN.shipyard=(b,c,K)=>{const {B,rng}=K,T=K.traits;const wl=c.wLocal,ang=Math.atan2(wl.x,wl.z);const g0=K.gh(0,0);
  const L=9;for(let s=-3;s<L;s+=.9){const px=wl.x*s,pz=wl.z*s,g=Math.max(K.gh(px,pz),c.waterLevel-.6);B.boxC(px,g+.08+(-s)*.02,pz,2.4,.12,.95,COL.plank,0,ang+PI/2,0);}
  const hx=-wl.x*.5,hz=-wl.z*.5;hull(B,hx,g0+.4,hz,5.2,1.8,ang,0x8a6440,true);B.beam(hx-wl.x*2.6,g0+.45,hz-wl.z*2.6,hx+wl.x*2.6,g0+.45,hz+wl.z*2.6,.14,COL.woodD);
  for(const s of [-1,1]){const px=wl.z*s*2.2,pz=-wl.x*s*2.2;B.beam(px-wl.x*1.5,K.gh(px,pz),pz-wl.z*1.5,px,g0+4.2,pz,.14,COL.wood);B.beam(px+wl.x*1.5,K.gh(px,pz),pz+wl.z*1.5,px,g0+4.2,pz,.14,COL.wood);}
  B.beam(wl.z*2.2,g0+4.2,-wl.x*2.2,-wl.z*2.2,g0+4.2,wl.x*2.2,.14,COL.wood);B.box(0,g0+2.6,0,.03,1.6,.03,0xbfa98a);
  const sx=-wl.x*5+wl.z*3,sz=-wl.z*5-wl.x*3,sg=K.gh(sx,sz);for(const [a2,b2] of [[1,1],[1,-1],[-1,1],[-1,-1]])B.box(sx+a2*1.4,sg,sz+b2*1.1,.14,2.4,.14,COL.woodD);
  B.wedge(sx,sg+2.4,sz,3.3,.8,2.8,K.pick(ROOF.shingle),ang);for(let r=0;r<3;r++)for(let i=0;i<5-r;i++)B.hcyl(sx-1+(i-(4-r)/2)*.36+1,sg+.18+r*.32,sz,.17,2.2,K.pick([0x8a6440,0x9a7448]),'z');
  T.push('Slipway into the water','Hull taking shape on the stocks');return {name:'Shipyard',r:4.6};};
GEN.sawmill=(b,c,K)=>{const {B,rng}=K,T=K.traits;const [gMin,gMax]=K.rect(2.6,2.2);const base=gMax+.15;
  B.box(0,gMin-.5,0,5.4,base-gMin+.5,4.6,0x7d766a);for(const [x,z] of [[-2.5,-2.1],[2.5,-2.1],[-2.5,2.1],[2.5,2.1],[0,-2.1],[0,2.1]])B.box(x,base,z,.2,2.6,.2,COL.wood);
  B.box(0,base,-2.05,5.2,2.6,.12,COL.plank);gable(B,{x:0,z:0,top:base+2.6,len:5.2,span:4.4,k:.7,t:.16,col:K.pick(ROOF.shingle),ov:.35,rows:true});
  B.box(0,base,.3,4.4,.5,.6,COL.woodD);B.hcyl(0,base+.75,.3,.28,4,0x8a6440,'x');B.box(.3,base+.5,.3,.12,1.9,.9,COL.iron);B.box(.3,base+2.2,.3,.6,.12,.9,COL.wood);
  for(let r=0;r<4;r++)B.box(-2+r*.05,K.gh(-3.8,0)+r*.13,0,.9,.12,3.2,COL.plank,PI/2);for(let r=0;r<4;r++)B.box(3.9,K.gh(3.9,0)+r*.12,0,.9,.1,2.6,COL.woodL);
  if(c.waterDist<6.5){const ax=Math.abs(c.wLocal.x)>Math.abs(c.wLocal.z)?'x':'z',s=ax==='x'?Math.sign(c.wLocal.x)||1:Math.sign(c.wLocal.z)||1;const wb=K.sub();makeWheel(wb,1.5,.6,ax);
    K.anim(wb,'spin',ax==='x'?s*3.3:0,Math.max(c.waterLevel+1,base+.5),ax==='z'?s*2.9:0,{axis:ax,speed:.8});T.push('Water-powered saw');}else T.push('Pit saw worked by two sawyers');
  T.push('Planks for finer building (+25% wood)');return {name:'Sawmill',r:3.8};};
GEN.mason=(b,c,K)=>{const {B,rng}=K,T=K.traits;const [gMin,gMax]=K.rect(2.4,2);const base=gMax+.1;
  B.box(0,gMin-.4,0,5,base-gMin+.4,4.2,0x8f8a80);B.box(-1.2,base,-1,2.4,2.2,1.9,K.pick(STONE));B.wedge(-1.2,base+2.2,-1,2.8,.7,2.3,K.pick(ROOF.tile));
  for(let i=0;i<8;i++){const x=.6+(i%3)*.55,z=-1.4+Math.floor(i/3)*.6;B.box(x,base,z,.5,.42,.55,K.pick([0xb3ab9a,0xa39c8e,0xc2b9a6]));}
  B.box(1.2,base,1.2,1.6,.8,.7,COL.woodD);B.box(1.2,base+.8,1.2,.6,.35,.5,0xc2b9a6);
  B.cyl(-1.6,base,1.3,.26,1.6,0xd2c9b2,10);B.box(-1.6,base+1.6,1.3,.65,.18,.65,0xd2c9b2);B.sph(-.6,base+.5,1.5,.28,.5,.28,0xc8bfa8,1);B.box(-.6,base,1.5,.45,.15,.45,0xb3ab9a);
  T.push('Dressed blocks for finer walls (+25% stone)','Carving a column capital');return {name:"Stonemason's Yard",r:3.4};};

// ================================================================ building management
const buildings=[];let nextId=1;let UIBLOCK=false,PAUSED=false;
const BT={house:'House',church:'Church',well:'Well',castle:'Castle',camp:'Camp',smith:'Blacksmith',mill:'Mill',tavern:'Tavern',market:'Market',tower:'Tower',farm:'Farm Field',quarry:'Quarry',hall:'Town Hall',dock:'Fishing Dock',fishmkt:'Fish Market',lodge:"Hunter's Lodge",shipyard:'Shipyard',sawmill:'Sawmill',mason:'Stonemason'};
function newRecord(type,x,z,rot,seed){const r=mulberry(seed);return {id:0,type,x,z,rot,manual:false,seed,w:Math.round((3+r()*1.4)*10)/10,d:Math.round((3.1+r()*.6)*10)/10,r:2,obj:null,info:null,anims:[],emit:[],level:null,variant:null};}
const toLocal=(b,x,z)=>{const cs=Math.cos(b.rot),sn=Math.sin(b.rot),dx=x-b.x,dz=z-b.z;return [dx*cs-dz*sn,dx*sn+dz*cs];};
function isAttached(a,o){if(a.type!=='house'||o.type!=='house')return 0;if(Math.abs(angDiff(a.rot,o.rot))>.02)return 0;
  const [lx,lz]=toLocal(a,o.x,o.z);if(Math.abs(lz)>.4)return 0;if(Math.abs(Math.abs(lx)-(a.w+o.w)/2)>.4)return 0;return lx<0?-1:1;}
function rowSize(b){const seen=new Set([b]),q=[b];while(q.length){const a=q.pop();for(const o of buildings)if(!seen.has(o)&&isAttached(a,o)){seen.add(o);q.push(o);}}return seen.size;}
function analyze(b){
  const x=b.x,z=b.z,cs=Math.cos(b.rot),sn=Math.sin(b.rot);
  const c={hC:hAt(x,z),wC:wAt(x,z)};c.wsC=c.hC+c.wC;
  let best=99,bx=0,bz=0,lvl=-99,fl=0;
  for(let dz=-12;dz<=12;dz++)for(let dx=-12;dx<=12;dx++){const d2=dx*dx+dz*dz;if(d2>144||d2>=best*best)continue;const w=wAt(x+dx,z+dz);
    if(w>.25){best=Math.sqrt(d2);bx=dx;bz=dz;lvl=hAt(x+dx,z+dz)+w;fl=sampleArr(SPD,x+dx,z+dz);}}
  c.waterDist=best;c.waterLevel=lvl;c.flow=fl;
  if(best>0&&best<99){const wx=bx/best,wz=bz/best;c.wLocal={x:wx*cs-wz*sn,z:wx*sn+wz*cs};}else c.wLocal={x:0,z:1};
  let tc=0;for(const t of trees){if(t.t===4)continue;if((t.x-x)**2+(t.z-z)**2<81)tc++;}c.trees=tc;
  c.houses=0;c.houses25=0;c.castleD=c.churchD=c.wellD=c.millD=c.farmD=c.marketD=99;let left=0,right=0;
  for(const o of buildings){if(o.id===b.id)continue;const d=Math.hypot(o.x-x,o.z-z);
    if(o.type==='house'||o.type==='tavern'){if(d<15)c.houses++;if(d<28)c.houses25++;}
    const key={castle:'castleD',church:'churchD',well:'wellD',mill:'millD',farm:'farmD',market:'marketD'}[o.type];if(key&&d<c[key])c[key]=d;
    if(d<16){const [lx]=toLocal(b,o.x,o.z);if(lx<0)left++;else right++;}}
  c.freeSide=left<=right?-1:1;
  let rd=99;for(let dz=-9;dz<=9;dz++)for(let dx=-9;dx<=9;dx++){const d=Math.hypot(dx,dz);if(d<rd&&sampleArr(ROAD,x+dx,z+dz)>.35)rd=d;}c.roadDist=rd;
  c.elev=clamp((c.hC-3)/22,0,1);
  let mx=-1e9;for(let i=0;i<16;i++){const a=i/16*TAU;for(const r of [9,15])mx=Math.max(mx,hAt(x+Math.sin(a)*r,z+Math.cos(a)*r));}
  c.hilltop=c.hC>mx-.3&&c.hC>6;
  c.attach={L:null,R:null,size:1};
  if(b.type==='house'){for(const o of buildings){if(o.id===b.id)continue;const s=isAttached(b,o);if(s<0)c.attach.L=o;else if(s>0)c.attach.R=o;}
    if(c.attach.L||c.attach.R){const tmp=buildings.includes(b)?b:null;if(tmp)c.attach.size=rowSize(b);else{let n=1;const seen=new Set();const q=[c.attach.L,c.attach.R].filter(Boolean);
      while(q.length){const a=q.pop();if(seen.has(a))continue;seen.add(a);n++;for(const o of buildings)if(!seen.has(o)&&isAttached(a,o))q.push(o);}c.attach.size=n;}}}
  return c;
}
function sigOf(c){const a=c.attach;return [c.wC>.2,c.waterDist<5.5,c.waterDist<6,c.waterDist<6.5,c.waterDist<7,c.waterDist<8,c.waterDist<14,c.trees>=7,c.trees>=8,Math.round(c.hC*3),c.hilltop,c.roadDist<9,
  Math.min(c.houses,12),Math.min(c.houses25,13),c.castleD<24,c.castleD<26,c.castleD<28,c.castleD<30,c.castleD<34,c.farmD<16,c.millD<16,c.wellD>8,c.freeSide,a.L?a.L.id:0,a.R?a.R.id:0,a.size].join(',');}
function generate(b,ghost){
  const ctx=analyze(b),K=makeKit(b,ctx);const info=GEN[b.type](b,ctx,K);info.traits=K.traits;info.r=info.r||2;
  const grp=new THREE.Group();grp.position.set(b.x,0,b.z);grp.rotation.y=b.rot;
  const mm=ghost?(ghost==='bad'?matGhostBad:matGhost):null;
  if(!ghost)K.B.ao=true;grp.add(K.B.mesh(mm||matB,!ghost));
  if(K.G.p.length)grp.add(K.G.mesh(mm||matGlow,false));
  if(K.F.p.length)grp.add(K.F.mesh(mm||matFire,false));
  for(const a of K.anims){const m=a.builder.mesh(mm||(a.fire?matFire:matB),!ghost&&!a.fire);m.position.set(a.x,a.y,a.z);grp.add(m);a.obj=m;}
  const cs=Math.cos(b.rot),sn=Math.sin(b.rot);
  const emit=K.emitters.map(e=>({wx:b.x+e.x*cs+e.z*sn,wy:e.y,wz:b.z-e.x*sn+e.z*cs,rate:e.rate,dark:e.dark,acc:Math.random()}));
  return {grp,info,ctx,anims:K.anims,emit};
}
function disposeObj(o){o.traverse(m=>{if(m.geometry)m.geometry.dispose();});}
function realize(b){
  if(b.obj){scene.remove(b.obj);disposeObj(b.obj);}
  const g=generate(b,false);b.obj=g.grp;b.info=g.info;b.r=g.info.r;b.anims=g.anims;b.emit=g.emit;b.sig=sigOf(g.ctx);scene.add(b.obj);
  onRealize(b);
}
function addBuilding(rec){rec.id=nextId++;buildings.push(rec);return rec;}
function removeBuilding(b){const i=buildings.indexOf(b);if(i>=0)buildings.splice(i,1);if(b.obj){scene.remove(b.obj);disposeObj(b.obj);}}
function rebuildNear(x,z,R,skip,force){for(const o of buildings){if(o===skip)continue;if(Math.hypot(o.x-x,o.z-z)<R+o.r){if(force||sigOf(analyze(o))!==o.sig)realize(o);}}refreshCivic();}
function refreshCivic(){civicSpots=buildings.filter(b=>['castle','church','market'].includes(b.type)).map(b=>[b.x,b.z,(b.type==='castle'?26:16)**2]);}
function canPlace(b,r){
  if(Math.abs(b.x)>HALF-r*.6||Math.abs(b.z)>HALF-r*.6)return 'Too close to the edge of the world';
  const wc=wAt(b.x,b.z);
  if(wc>1.8)return 'The water is too deep here';
  if(wc>.25&&!['house','tower','mill'].includes(b.type))return 'Cannot build this in water';
  for(const o of buildings){if(o.id===b.id)continue;if(isAttached(b,o))continue;const d=Math.hypot(o.x-b.x,o.z-b.z);
    const k=(b.type==='house'&&o.type==='house')?.72:.84;if(d<(r+o.r)*k)return 'Overlaps '+(o.info?o.info.name:BT[o.type]);}
  return null;
}
function clearTreesAround(x,z,r){const n=trees.length;for(let i=trees.length-1;i>=0;i--){const t=trees[i];if((t.x-x)**2+(t.z-z)**2<(r+.6)**2)trees.splice(i,1);}if(trees.length!==n)treesDirty=true;}
function houseSnap(gb,px,pz){
  let best=null,bd=1e9;for(const o of buildings){if(o.type!=='house')continue;const d=Math.hypot(o.x-px,o.z-pz);if(d<bd&&d<o.w/2+gb.w/2+1.8){bd=d;best=o;}}
  if(!best)return null;const [lx,lz]=toLocal(best,px,pz);if(Math.abs(lz)>best.d*.75)return null;
  const side=lx<0?-1:1,off=(best.w+gb.w)/2*side,cs=Math.cos(best.rot),sn=Math.sin(best.rot);const nx=best.x+off*cs,nz=best.z-off*sn;
  for(const o of buildings)if(o!==best&&o.type==='house'&&Math.hypot(o.x-nx,o.z-nz)<(o.w+gb.w)*.4)return null;
  gb.x=nx;gb.z=nz;gb.rot=best.rot;gb.d=best.d;return best;
}
function autoRot(b){
  let best=99,dir=null;
  for(let dz=-9;dz<=9;dz++)for(let dx=-9;dx<=9;dx++){const d=Math.hypot(dx,dz);if(d<best&&d>.5&&sampleArr(ROAD,b.x+dx,b.z+dz)>.4){best=d;dir=[dx,dz];}}
  if(dir&&!['castle','farm'].includes(b.type))return Math.atan2(dir[0],dir[1]);
  if(['house','tavern'].includes(b.type)){const nw=nearWater(b.x,b.z,7);if(nw<7){let bx=0,bz=0,bd=99;for(let dz=-7;dz<=7;dz++)for(let dx=-7;dx<=7;dx++){const d=Math.hypot(dx,dz);if(d<bd&&wAt(b.x+dx,b.z+dz)>.25){bd=d;bx=dx;bz=dz;}}if(bd>.5)return Math.atan2(bx,bz);}}
  let cx=0,cz=0,n=0;for(const o of buildings){if(o.type==='farm')continue;const d=Math.hypot(o.x-b.x,o.z-b.z);if(d<16&&d>1){cx+=o.x;cz+=o.z;n++;}}
  if(n)return Math.atan2(cx/n-b.x,cz/n-b.z);
  return Math.round(cam.yaw/(PI/4))*(PI/4);
}

