'use strict';
// new buildings (see bdefs.js for defBuilding): High Medieval (age 4) and Industrial (age 5)
{
const TRM=0x9a9283,WG=0xffc890,DK=COL.dark,IRON=0x3a3d42,SOOT=0x2f2a26;
// ---------------- shared helpers.  a = outward normal angle of the face (0 +z, PI -z, PI/2 +x, -PI/2 -x)
function lan(K,x,y,z,w,h,a,fr){const s=Math.sin(a),c=Math.cos(a),B=K.B,G=K.G,F=fr==null?TRM:fr;
  B.box(x+s*.02,y-.05,z+c*.02,w+.22,h+.05,.07,F,a);B.prism(x+s*.02,y+h,z+c*.02,.07,w*.9,w+.22,F,a+PI/2);
  G.box(x+s*.05,y,z+c*.05,w,h,.04,WG,a);G.prism(x+s*.05,y+h,z+c*.05,.04,w*.8,w,WG,a+PI/2);}
function door(K,x,y,z,w,h,a,col){const s=Math.sin(a),c=Math.cos(a),B=K.B;col=col==null?COL.door:col;
  B.box(x+s*.02,y,z+c*.02,w+.3,h+.05,.07,TRM,a);B.prism(x+s*.02,y+h+.05,z+c*.02,.07,w*.85,w+.3,TRM,a+PI/2);
  B.box(x+s*.05,y,z+c*.05,w,h,.07,col,a);B.prism(x+s*.05,y+h,z+c*.05,.07,w*.7,w,col,a+PI/2);}
function rose(K,x,y,z,r,a){const s=Math.sin(a),c=Math.cos(a),B=K.B,G=K.G;
  B.put('cyl:14:1',x+s*.0,y,z+c*.0,r+.2,.14,r+.2,TRM,PI/2,a,0);
  G.put('cyl:14:1',x+s*.1,y,z+c*.1,r,.06,r,WG,PI/2,a,0);
  const tx=Math.cos(a),tz=-Math.sin(a);
  for(let i=0;i<8;i++){const t=i/8*PI;B.beam(x+s*.17-tx*Math.cos(t)*r,y-Math.sin(t)*r,z+c*.17+tz*Math.cos(t)*r,x+s*.17+tx*Math.cos(t)*r,y+Math.sin(t)*r,z+c*.17-tz*Math.cos(t)*r,.07,TRM);}
  B.put('cyl:8:1',x+s*.1,y,z+c*.1,r*.25,.14,r*.25,TRM,PI/2,a,0);}
function chim(K,x,y,z,h,col,rate,w){w=w||.7;const B=K.B;B.box(x,y,z,w,h,w,col);B.box(x,y+h,z,w+.2,.16,w+.2,TRM);K.smoke(x,y+h+.5,z,rate||1.2,0);}
function barrel(B,x,y,z,s){s=s||1;B.cyl(x,y,z,.3*s,.6*s,COL.wood,8);B.cyl(x,y+.14*s,z,.32*s,.05*s,IRON,8);B.cyl(x,y+.42*s,z,.32*s,.05*s,IRON,8);}
function crate(B,x,y,z,s,ry){s=s||.5;B.box(x,y,z,s,s,s,COL.plank,ry||0);B.box(x,y+s*.45,z,s+.04,.05,s+.04,COL.woodD,ry||0);}
function sack(B,x,y,z){B.sph(x,y+.18,z,.22,.2,.22,COL.canvas,0);}
function board(K,x,y,z,w,h,a,col){const s=Math.sin(a),c=Math.cos(a),B=K.B;
  B.box(x,y,z,w,h,.07,COL.woodD,a);B.box(x+s*.04,y+.05,z+c*.04,w-.12,h-.1,.04,col==null?COL.gold:col,a);}
// tower: shaft with string courses, belfry lancets and corner buttresses; top 'flat' (parapet+pinnacles) or 'spire'
function tower(K,o){const B=K.B,{x,z,base,h,wall}=o,w=o.w,d=o.d||o.w;
  B.box(x,base,z,w,h,d,wall);
  for(const f of [.42,.68])B.box(x,base+h*f,z,w+.14,.13,d+.14,TRM);
  const wy=base+h*(o.wy||.76);
  for(const a of [0,PI/2,PI,-PI/2]){const hw=(a===0||a===PI)?d/2:w/2;lan(K,x+Math.sin(a)*hw,wy,z+Math.cos(a)*hw,.55,h*.14,a);
    if(!o.noLow)lan(K,x+Math.sin(a)*hw,base+h*.28,z+Math.cos(a)*hw,.3,h*.12,a);}
  for(const sx of [-1,1])for(const sz of [-1,1]){B.box(x+sx*w/2,base,z+sz*d/2,.5,h*.45,.5,wall);B.cone(x+sx*w/2,base+h*.45,z+sz*d/2,.34,.7,wall,4,PI/4);}
  const top=base+h;
  if(o.top==='spire'){B.box(x,top,z,w+.3,.2,d+.3,TRM);
    const sg=o.seg||4;B.cone(x,top+.2,z,(sg===4?Math.max(w,d)*.78:Math.max(w,d)*.62),o.sh,o.rc,sg,sg===4?PI/4:0);
    for(const sx of [-1,1])for(const sz of [-1,1])B.cone(x+sx*w*.5,top+.2,z+sz*d*.5,.25,1.1,wall,4,PI/4);
    B.box(x,top+.2+o.sh,z,.08,.8,.08,COL.gold);B.box(x,top+.2+o.sh+.45,z,.4,.08,.08,COL.gold);}
  else{B.box(x,top,z,w+.34,.26,d+.34,TRM);
    for(const sx of [-1,1])for(const sz of [-1,1]){B.box(x+sx*(w/2+.02),top+.26,z+sz*(d/2+.02),.36,.5,.36,wall);B.cone(x+sx*(w/2+.02),top+.76,z+sz*(d/2+.02),.3,.95,wall,4,PI/4);}
    for(let i=-1;i<=1;i++){B.box(x+i*w*.34,top+.26,z+d/2+.1,.34,.42,.18,wall);B.box(x+i*w*.34,top+.26,z-d/2-.1,.34,.42,.18,wall);}}
  return top;}
// nave: stone body, gabled roof along z, optional aisles and flying buttresses
function nave(K,o){const B=K.B,{x,z,w,len,base,H,wall,rc}=o,aw=o.aw||0,aH=o.aH||0;
  B.box(x,base,z,w,H,len,wall);
  gable(B,{x,z,top:base+H,len,span:w,k:o.k||1.05,t:.22,col:rc,wall,axis:'z',ov:.15});
  const n=Math.max(2,Math.round(len/1.8)),st=len/n;
  for(const s of [-1,1]){
    if(aw){B.box(x+s*(w/2+aw/2),base,z,aw,aH,len,wall);B.wedge(x+s*(w/2+aw/2),base+aH,z,len,.9,aw+.3,rc,s>0?PI/2:-PI/2);}
    for(let i=0;i<n;i++){const zi=z-len/2+(i+.5)*st;
      if(aw){lan(K,x+s*w/2,base+aH+1.15,zi,.5,H-aH-2.35,s*PI/2);lan(K,x+s*(w/2+aw),base+1.0,zi,.45,aH-1.7,s*PI/2);}
      else lan(K,x+s*w/2,base+H*.3,zi,.55,H*.42,s*PI/2);}
    for(let i=0;i<=n;i++){const zb=z-len/2+i*st;
      if(aw){const px=x+s*(w/2+aw+.12);B.box(px,base,zb,.5,aH+.9,.6,wall);B.cone(px,base+aH+.9,zb,.3,.9,wall,4,PI/4);
        B.beam(px,base+aH+.7,zb,x+s*(w/2),base+H-.9,zb,.22,wall,.3);}
      else{B.box(x+s*(w/2+.2),base,zb,.45,H*.72,.5,wall);B.wedge(x+s*(w/2+.2),base+H*.72,zb,.5,.5,.45,wall,s>0?PI/2:-PI/2);}}}
}
function headstones(K,n,x0,x1,z0,z1){const B=K.B;for(let i=0;i<n;i++){const x=x0+(x1-x0)*K.rng(),z=z0+(z1-z0)*K.rng(),g=K.gh(x,z);B.box(x,g-.3,z,.5,.85,.16,K.pick(STONE),(K.rng()-.5)*.4);}}

// ================================================================ AGE 4
defBuilding({type:'cathedral',age:4,name:'Cathedral',desc:'A great stone house of God, raised over generations.',variants:['Twin Towers','Cruciform Spire','Rose Window Hall'],r:11,joy:3,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const wall=K.pick(STONE);
  if(vi===0){const base=BH.pad(K,5.3,10.2,0x6f6a62),rc=K.pick(ROOF.slate),H=7.2;
    nave(K,{x:0,z:-1.5,w:4.4,len:14,base,H,aw:1.7,aH:3.6,wall,rc});
    B.cyl(0,base,-8.5,2.2,H,wall,8);B.cone(0,base+H,-8.5,2.5,3,rc,8);
    for(const a of [PI-.393,PI+.393,PI-1.18,PI+1.18])lan(K,Math.sin(a)*2.03,base+2.6,-8.5+Math.cos(a)*2.03,.5,2.2,a);
    B.box(0,base,7.7,7.8,8.8,3.8,wall);B.prism(0,base+8.8,7.7,3.8,2.3,2.6,wall,PI/2);
    for(const s of [-1,1])tower(K,{x:s*2.6,z:7.7,w:2.6,d:3.8,base,h:13,wall,top:'flat'});
    rose(K,0,base+6.0,9.6,.95,0);door(K,0,base,9.6,1.5,2.4,0);for(const s of [-1,1])door(K,s*2.6,base,9.6,1.0,1.8,0);
    for(let i=-4;i<=4;i++){if(Math.abs(i)<2)continue;B.box(i*.45*1.7,base+3.9,9.66,.3,.8,.18,TRM);B.sph(i*.45*1.7,base+4.82,9.66,.14,.14,.14,TRM);}
    B.box(0,base,10.0,3.4,.14,.8,TRM);for(const s of [-1,1]){B.cyl(s*1.6,base,10.2,.2,.9,IRON,6);K.flame(s*1.6,base+.95,10.2,.7);}
    K.flag(-2.6,base+13.6,7.7,K.pick(BANNER),1.2,2.4);K.flag(2.6,base+13.6,7.7,K.pick(BANNER),1.2,2.4);
    T.push('Twin bell towers','Flying buttresses along the nave','Rose window over a triple portal');}
  else if(vi===1){const base=BH.pad(K,7.3,9.9,0x6f6a62),rc=K.pick(ROOF.slate);
    nave(K,{x:0,z:5.7,w:4.2,len:7.2,base,H:6.8,aw:1.6,aH:3.4,wall,rc});
    nave(K,{x:0,z:-5.1,w:3.8,len:6.4,base,H:6.6,wall,rc});
    B.box(0,base,0,14,6.6,3.8,wall);gable(B,{x:0,z:0,top:base+6.6,len:14,span:3.8,k:1.05,t:.22,col:rc,wall,axis:'x',ov:.15});
    for(const s of [-1,1]){rose(K,s*7,base+4.3,0,.8,s*PI/2);for(const q of [-1,1])lan(K,s*7,base+1.0,q*1.0,.5,1.9,s*PI/2);
      for(const q of [-1,1]){lan(K,s*5,base+2.0,q*1.9,.6,2.4,q>0?0:PI);lan(K,s*3.2,base+2.0,q*1.9,.6,2.4,q>0?0:PI);}
      B.box(s*7.1,base,1.9,.5,4.5,.5,wall);B.box(s*7.1,base,-1.9,.5,4.5,.5,wall);}
    tower(K,{x:0,z:0,w:3.4,base,h:11.5,wall,top:'spire',sh:9,rc,seg:8,noLow:true,wy:.8});
    door(K,0,base,9.3,1.4,2.3,0);rose(K,0,base+5.0,9.3,.8,0);B.box(0,base,9.9,2.8,.14,.8,TRM);
    for(const s of [-1,1]){B.box(s*2.15,base,9.35,.5,5,.5,wall);B.cone(s*2.15,base+5,9.35,.32,.9,wall,4,PI/4);}
    for(const q of [-1,0,1])lan(K,q*1.0,base+2.2,-8.3,.45,2.6,PI);
    K.flag(0,base+8.8,8.6,K.pick(BANNER),1.2,2.0);headstones(K,9,4.8,8,2.5,8.5);headstones(K,6,-8,-4.8,3,8);
    T.push('Crossing tower and tall stone spire','Cruciform plan with a rose-lit transept','Graves in the churchyard');}
  else{const base=BH.pad(K,6.9,9.6,0x6f6a62),rc=K.pick(ROOF.tile),H=8;
    nave(K,{x:0,z:0,w:8.4,len:14.6,base,H,wall,rc,k:1.0});
    for(const s of [-1,1])for(const zc of [-4.4,0,4.4]){B.box(s*5.5,base,zc,2.6,4.6,2.8,wall);
      gable(B,{x:s*5.5,z:zc,top:base+4.6,len:2.6,span:2.8,k:.8,t:.2,col:rc,wall,axis:'x',ov:.1});lan(K,s*6.8,base+1.5,zc,.8,1.8,s*PI/2);
      lan(K,s*4.2,base+5.7,zc,.9,1.9,s*PI/2);}
    B.cyl(0,base,-7.3,3.0,H,wall,8);B.cone(0,base+H,-7.3,3.4,3.8,rc,8);
    for(const a of [PI-.393,PI+.393])lan(K,Math.sin(a)*2.75,base+2.6,-7.3+Math.cos(a)*2.75,.7,2.8,a);
    rose(K,0,base+5.8,7.3,2.0,0);
    B.box(0,base,8.4,3.2,3.4,2.2,wall);gable(B,{x:0,z:8.4,top:base+3.4,len:2.2,span:3.2,k:1.0,t:.2,col:rc,wall,axis:'z',ov:.1});door(K,0,base,9.5,1.5,2.4,0);
    for(const s of [-1,1]){B.cyl(s*3.9,base,7.3,1.0,9.6,wall,8);B.cone(s*3.9,base+9.6,7.3,1.3,3.2,rc,8);B.cyl(s*3.9,base+4.5,7.3,1.06,.14,TRM,8);lan(K,s*3.9,base+6,7.3+.98,.4,1.2,0);
      K.flame(s*1.8,base+1.0,9.9,.6);B.cyl(s*1.8,base,9.9,.2,1.0,IRON,6);}
    B.cyl(0,base+H+4.2,-1,.45,1.6,COL.wood,6);B.cone(0,base+H+5.8,-1,.75,2.8,K.pick(ROOF.slate),6);B.box(0,base+H+8.5,-1,.08,.8,.08,COL.gold);B.box(0,base+H+8.9,-1,.4,.08,.08,COL.gold);
    K.flag(3.9,base+12.9,7.3,K.pick(BANNER),1.2,2.0);
    T.push('A huge rose window over the portal','Side chapels under their own gables','Tiled roof and a bell flèche');}
  return {name:['Twin-Tower Cathedral','Spired Cathedral','Rose Window Minster'][vi],r:11};}});
defBuilding({type:'college',age:4,name:'College',desc:'Scholars lodge, read and dispute under one stone roof.',variants:['Quadrangle','Hall and Gate Tower','Cloister and Chapel'],r:7.5,joy:1,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const wall=K.pick(STONE),rc=K.pick(ROOF.tile),sh=K.pick(SHUT);
  if(vi===0){const base=BH.pad(K,5.4,4.8,0x6f6a62);
    B.box(0,base,3.7,10.8,4,2.2,wall);B.box(0,base,-3.7,10.8,4,2.2,wall);for(const s of [-1,1])B.box(s*4.3,base,0,2.2,4,5.2,wall);
    for(const z of [3.7,-3.7])gable(B,{x:0,z,top:base+4,len:10.8,span:2.2,k:.95,t:.2,col:rc,wall,axis:'x',ov:.2});
    for(const s of [-1,1])gable(B,{x:s*4.3,z:0,top:base+4,len:5.2,span:2.2,k:.95,t:.2,col:rc,wall,axis:'z',ov:.2});
    B.box(0,base,0,6.6,.08,5.2,COL.leaf);B.cyl(0,base,0,.55,.6,TRM,8);for(const s of [-1,1])B.box(s*.5,base+.6,0,.08,1.2,.08,COL.woodD);B.box(0,base+1.8,0,1.3,.1,.08,COL.woodD);
    for(let i=0;i<4;i++){const x=-3.6+i*2.4;win(K,x,base+1.1,4.8,1,'z',sh);win(K,x,base+2.7,4.8,1,'z',sh);win(K,x,base+1.1,-4.8,-1,'z',sh);win(K,x,base+1.1,2.6,-1,'z',sh);win(K,x,base+1.1,-2.6,1,'z',sh);}
    for(const s of [-1,1])for(const z of [-1.4,1.4]){win(K,s*5.4,base+1.8,z,s,'x',sh);win(K,s*3.2,base+1.8,z,-s,'x',sh);}
    B.box(0,base,5.0,3.4,6.2,2.8,wall);B.cone(0,base+6.2,5.0,2.6,2.8,rc,4,PI/4);
    for(const s of [-1,1]){B.cyl(s*1.7,base,6.2,.55,6.8,wall,8);B.cone(s*1.7,base+6.8,6.2,.8,1.6,rc,8);}
    B.box(0,base,6.42,1.5,2.4,.1,DK);B.prism(0,base+2.4,6.42,.1,1.0,1.5,DK,PI/2);lan(K,0,base+3.5,6.42,.5,1.4,0);
    B.box(0,base+4.9,6.45,.8,.9,.06,K.pick(BANNER));B.box(0,base+4.9,6.46,.5,.5,.06,COL.gold);
    chim(K,-3,base+4.6,3.7,1.4,wall,1.2);chim(K,3.4,base+4.6,-3.7,1.4,wall,1.2);K.flag(0,base+9.0,5.0,K.pick(BANNER),1.2,2.2);
    T.push('Four wings round a green court','Gatehouse with twin turrets');}
  else if(vi===1){const base=BH.pad(K,6.2,3.8,0x6f6a62),rs=K.pick(ROOF.slate);
    B.box(-1.2,base,-.2,9.6,4.4,4.2,wall);gable(B,{x:-1.2,z:-.2,top:base+4.4,len:9.6,span:4.2,k:1.0,t:.22,col:rs,wall,axis:'x',ov:.25});
    for(let i=0;i<4;i++){const x=-4.6+i*2.1;lan(K,x,base+1.4,1.9,.7,2.0,0);B.box(x+1.05,base,2.0,.4,3.2,.4,wall);lan(K,x,base+1.4,-2.3,.7,2.0,PI);}
    B.box(-5.0,base,-.2,.5,3.6,.5,wall);door(K,-1.0,base,1.9,1.1,1.9,0);B.box(-3.3,base+1.0,2.35,1.8,1.7,.55,wall);B.box(-3.3,base+2.7,2.35,2.0,.15,.7,TRM);
    for(let i=0;i<3;i++)win(K,-3.3+(i-1)*.55,base+1.6,2.64,1,'z',null);
    tower(K,{x:4.7,z:.2,w:3.2,base,h:10.4,wall,top:'spire',sh:3.6,rc:K.pick(ROOF.tile),noLow:false});
    G.cyl(4.7,base+7.4,1.85,.5,.04,0xf2ecd8,12);B.box(4.7,base,1.85,1.3,2.1,.1,COL.door);B.prism(4.7,base+2.1,1.85,.1,.8,1.3,COL.door,PI/2);
    B.box(-3.1,base,-3.5,4,3.6,3.2,wall);gable(B,{x:-3.1,z:-3.5,top:base+3.6,len:3.2,span:4,k:.9,t:.2,col:rc,wall,axis:'z',ov:.2});
    lan(K,-3.1,base+1.0,-5.1,.6,1.6,PI);win(K,-5.1,base+1.6,-3.5,-1,'x',sh);
    chim(K,-5,base+4.4,.8,1.5,wall,1.4);chim(K,2.4,base+4.4,-1.4,1.5,wall,1.2);
    barrel(B,-5.4,base,1.6);crate(B,-5.2,base,2.4);K.flag(4.7,base+14.2,.2,K.pick(BANNER),1.2,2.4);
    T.push('Long dining hall with tall windows','Gate tower with a clock','Library wing behind');}
  else{const base=BH.pad(K,5.6,5.2,0x6f6a62),rs=K.pick(ROOF.slate);
    B.box(.4,base,-3.6,9.4,4.8,3.4,wall);gable(B,{x:.4,z:-3.6,top:base+4.8,len:9.4,span:3.4,k:1.0,t:.22,col:rs,wall,axis:'x',ov:.2});
    B.cyl(5.1,base,-3.6,1.7,4.8,wall,8);B.cone(5.1,base+4.8,-3.6,2.0,2.4,rs,8);
    for(let i=0;i<4;i++){lan(K,-3+i*1.9,base+1.4,-1.9,.6,2.4,0);lan(K,-3+i*1.9,base+1.4,-5.3,.6,2.4,PI);}
    for(const a of [.393,1.18])lan(K,5.1+Math.sin(a)*1.55,base+1.5,-3.6+Math.cos(a)*1.55,.5,2.0,a);
    tower(K,{x:-5.0,z:-3.6,w:2.4,base,h:8.2,wall,top:'spire',sh:3,rc:rs,noLow:true});
    B.box(0,base,0,6.8,.08,5.0,COL.leaf);B.cyl(0,base,.2,.2,1.8,COL.woodD,6);B.sph(0,base+1.9,.2,1.2,.9,1.2,COL.leaf,1);
    for(const [x,z,l,ry] of [[0,3.6,8.8,0],[-3.6,.9,5.6,PI/2],[3.6,.9,5.6,PI/2]]){const ax=ry===0;
      B.box(ax?0:x,base,ax?z-1.1:z,ax?8.8:.3,2.8,ax?.3:l,wall);
      for(let i=0;i<=Math.round(l/.9);i++){const t=-l/2+i*l/Math.round(l/.9);if(ax)B.cyl(t,base,z+.6,.11,2.1,TRM,6);else B.cyl(x+(x>0?.6:-.6),base,z+t,.11,2.1,TRM,6);}
      if(ax)B.wedge(0,base+2.1,z-.1,l,.7,1.9,rc,0);else B.wedge(x+(x>0?-.1:.1)*0,base+2.1,z,l,.7,1.9,rc,x>0?PI/2:-PI/2);}
    K.smoke(5.1,base+7.8,-3.6,1,0);B.box(-2.2,base+.0,3.05,.9,.3,.5,COL.plank);
    T.push('Chapel with an apse and bell tower','Cloister walk round a quiet garth');}
  return {name:['Quadrangle College','Hall College','Cloister College'][vi],r:7.5};}});
defBuilding({type:'clocktower',age:4,name:'Clock Tower',desc:'The town learns the hour from its tall clock.',variants:['Belfry Tower','Market Hall Clock','Round Campanile'],r:5,joy:1,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const wall=K.pick(STONE),clk=(x,y,z,r,a)=>{const s=Math.sin(a),c2=Math.cos(a);B.put('cyl:14:1',x+s*.02,y,z+c2*.02,r,.1,r,0xefe6cc,PI/2,a,0);
    B.beam(x+s*.1,y,z+c2*.1,x+s*.1+Math.cos(a)*r*.1,y+r*.7,z+c2*.1-Math.sin(a)*r*.1,.07,DK,.03);B.beam(x+s*.1,y,z+c2*.1,x+s*.1+Math.cos(a)*r*.6,y+r*.15,z+c2*.1-Math.sin(a)*r*.6,.06,DK,.03);};
  if(vi===0){const base=BH.pad(K,1.9,1.9,0x6f6a62),rs=K.pick(ROOF.slate);
    const top=tower(K,{x:0,z:0,w:3,base,h:10,wall,top:'flat',wy:.55,noLow:true});
    for(const a of [0,PI/2,PI,-PI/2])clk(Math.sin(a)*1.5,base+8.1,Math.cos(a)*1.5,.7,a);
    B.box(0,top+.26,0,2.4,1.9,2.4,wall);for(const a of [0,PI/2,PI,-PI/2])lan(K,Math.sin(a)*1.2,top+.5,Math.cos(a)*1.2,.55,1.0,a);
    B.cone(0,top+2.2,0,2.0,3.8,rs,4,PI/4);B.box(0,top+6,0,.08,.9,.08,COL.gold);B.sph(0,top+6.9,0,.16,.16,.16,COL.gold);
    door(K,0,base,1.5,.9,1.7,0);B.box(2.6,base,.4,2.0,2.2,2.6,wall);gable(B,{x:2.6,z:.4,top:base+2.2,len:2.0,span:2.6,k:.8,t:.2,col:K.pick(ROOF.tile),wall,axis:'z',ov:.15});win(K,2.6,base+1.2,1.7,1,'z',K.pick(SHUT));
    K.flag(0,top+6.6,0,K.pick(BANNER),1.0,1.6);T.push('Clock faces on all four sides','A watchman’s lodge at its foot');}
  else if(vi===1){const base=BH.pad(K,3.7,2.7,0x6f6a62);
    B.box(0,base-.05,0,7.2,.25,5.2,TRM);for(let i=0;i<4;i++)for(const z of [-2,2])B.cyl(-2.8+i*1.87,base+.2,z,.2,2.4,COL.woodD,6);
    for(const z of [-2,2])B.box(0,base+2.55,z,7.2,.25,.34,COL.beamD);
    B.box(0,base+2.6,0,6.6,2.4,4.6,K.pick(PLASTER));timberFrame(K,0,0,6.6,4.6,base+2.6,2.4,false,false,COL.beam);
    B.box(0,base+2.5,0,7.0,.2,5.0,COL.beamD);
    for(let i=0;i<3;i++){win(K,-2+i*2,base+3.6,2.3,1,'z',K.pick(SHUT));win(K,-2+i*2,base+3.6,-2.3,-1,'z',K.pick(SHUT));}
    const hr=gable(B,{x:0,z:0,top:base+5.0,len:6.6,span:4.6,k:.85,t:.22,col:K.pick(ROOF.tile),wall:K.pick(PLASTER),axis:'x',ov:.35});
    B.box(0,base+5+hr*.5,0,1.5,2.0,1.5,K.pick(PLASTER));for(const a of [0,PI])clk(Math.sin(a)*.78,base+6.8,Math.cos(a)*.78,.5,a);
    B.cone(0,base+7.5,0,1.3,1.8,K.pick(ROOF.tile),4,PI/4);K.flag(0,base+9.3,0,K.pick(BANNER),1.0,1.6);
    B.box(0,base+.2,0,2.6,.7,1.4,COL.plank);crate(B,-2.4,base+.2,-1.2);crate(B,2.5,base+.2,.8,.6);barrel(B,-1.6,base+.2,1.4);sack(B,1.6,base+.2,-1);sack(B,1.9,base+.2,-.7);
    T.push('Open arcade for market traders','Clock turret over a jettied loft');return {name:'Market Hall Clock',r:4.6};}
  else{const base=BH.pad(K,2.5,2.5,0x6f6a62),rs=K.pick(ROOF.slate);
    B.cyl(0,base,0,1.6,9,wall,12);for(const y of [3,5.6])B.cyl(0,base+y,0,1.7,.15,TRM,12);
    B.cyl(0,base+9,0,1.95,.25,TRM,12);B.cyl(0,base+9.25,0,1.3,2.2,wall,12);
    for(let i=0;i<6;i++){const a=i/6*TAU+.52;lan(K,Math.sin(a)*1.25,base+9.5,Math.cos(a)*1.25,.4,1.3,a);}
    B.cone(0,base+11.45,0,1.75,3.2,rs,12);B.sph(0,base+14.8,0,.18,.18,.18,COL.gold);
    clk(0,base+6.9,1.62,.65,0);lan(K,0,base+4.0,1.6,.4,1.4,0);for(const a of [.9,-.9,2.3,-2.3])lan(K,Math.sin(a)*1.58,base+4.1,Math.cos(a)*1.58,.35,1.2,a);
    B.cone(0,base+2.2,0,2.9,.9,K.pick(ROOF.tile),10);for(let i=0;i<8;i++){const a=i/8*TAU;B.cyl(Math.sin(a)*2.3,base,Math.cos(a)*2.3,.12,2.3,TRM,6);}
    B.cyl(0,base,0,2.35,.18,TRM,10);door(K,0,base,1.6,.9,1.6,0);
    const bell=K.sub();bell.cone(0,-.6,0,.35,.6,COL.gold,8);bell.sph(0,0,0,.08,.08,.08,COL.gold,0);K.anim(bell,'swing',0,base+10.9,0);
    K.flag(0,base+15,0,K.pick(BANNER),1.0,1.6);T.push('Round belfry with a copper-gold bell','An open loggia at its foot');return {name:'Round Campanile',r:4.8};}
  return {name:['Clock Tower','Market Hall Clock','Campanile'][vi],r:5};}});
defBuilding({type:'merchant_house',age:4,name:'Merchant House',desc:'A rich trader lives above his shop and his stores.',variants:['Jettied Townhouse','Stepped-Gable House','Counting House'],r:4.6,joy:0,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const sh=K.pick(SHUT);
  if(vi===0){const o=buildHall(K,{w:5.6,d:4.4,st:3,sh:1.9,jetty:true,frame:true,wallCol:K.pick(PLASTER),roofCol:K.pick(ROOF.tile),shut:sh,cw:5,cs:5,pitch:.9,groundCol:K.pick(STONE),quoins:true});
    const {base,hr}=o,z=2.2+.55;B.box(-1.9,base+3.6,z+.45,.14,.14,1.2,COL.beamD);B.beam(-1.9,base+3.5,z-.2,-1.9,base+2.9,z+.7,.07,COL.beamD);B.box(-1.9,base+3.55,z+1.02,.2,.1,.1,IRON);
    B.box(-1.9,base+2.2,z+1.0,.03,1.3,.03,0xb8a888);crate(B,-1.9,base+1.7,z+1.0,.5);
    chim(K,2.1,base+5.7+hr*.3,-.6,1.8,K.pick(STONE),1.4);
    barrel(B,2.4,base,2.9);barrel(B,2.9,base,2.6);crate(B,-2.6,base,2.9,.6);crate(B,-2.6,base+.6,2.9,.5,.4);sack(B,-3.1,base,2.5);
    B.box(-3.2,base+1.9,2.3,.08,.08,.8,IRON);board(K,-3.2,base+1.6,2.7,.08,.5,PI/2,COL.gold);
    T.push('Three jettied storeys of timber and plaster','A hoist beam for hauling bales to the loft');return {name:'Jettied Townhouse',r:4.6};}
  else if(vi===1){const base=BH.pad(K,2.7,3.3,0x6f6a62),wl=K.pick(BRICK),rc=K.pick(ROOF.tile);
    B.box(0,base,0,5.2,7,6.4,wl);gable(B,{x:0,z:0,top:base+7,len:6.4,span:5.2,k:.7,t:.22,col:rc,wall:wl,axis:'z',ov:.25});
    for(let i=0;i<5;i++){const w=4.6-i*.95;B.box(0,base+7+i*.55,3.0,w,.57,.5,wl);B.box(0,base+7+i*.55+.55,3.0,w+.1,.08,.56,TRM);}
    B.box(0,base+9.3,3.0,.5,.9,.5,wl);
    for(const s of [-1,1]){B.box(s*2.62,base,0,.1,7.2,6.4,wl);for(let i=0;i<4;i++){win(K,s*2.6,base+1.0+i*1.6,-1.4+(i%2)*2.8,s,'x',sh);}}
    for(let s=0;s<4;s++)for(const x of [-1.1,1.1]){if(s===0&&Math.abs(x)<2)continue;win(K,x,base+.9+s*1.55,3.2,1,'z',s%2?sh:null);B.box(x,base+.7+s*1.55,3.25,.8,.1,.15,TRM);}
    door(K,0,base,3.2,1.2,1.9,0,K.pick(SHUT));win(K,0,base+3.2,3.2,1,'z',null);win(K,0,base+4.8,3.2,1,'z',null);
    B.beam(0,base+8.2,3.0,0,base+8.2,4.2,.14,COL.beamD);B.beam(0,base+8.9,3.1,0,base+8.3,4.1,.08,COL.beamD);B.box(0,base+6.6,4.15,.03,1.5,.03,0xb8a888);crate(B,0,base+6.0,4.15,.55);
    B.box(1.6,base,3.7,1.2,.18,.9,TRM);B.box(-1.2,base,3.6,.8,.14,.7,TRM);barrel(B,2.1,base,3.9);barrel(B,2.6,base,3.4);crate(B,-1.8,base,3.9,.6);
    chim(K,-1.8,base+7.3,-2,1.2,wl,1.3);B.box(-2.8,base+2.2,2.8,.08,.5,.5,COL.gold);
    T.push('Stepped gable, brick on the canal side','A hoist and pulley under the gable');return {name:'Stepped-Gable House',r:4.6};}
  else{const base=BH.pad(K,3,2.6,0x6f6a62),wl=K.pick(STONE);
    B.box(0,base,0,6,5.4,4.6,wl);B.box(0,base+2.7,0,6.2,.18,4.8,TRM);
    for(const x of [-2,0,2]){B.box(x,base,2.28,1.3,2.2,.1,DK);B.prism(x,base+2.2,2.28,.1,.6,1.3,DK,PI/2);}
    for(const s of [-1,1])B.box(s*2.95,base,2.1,.4,2.6,.4,TRM);B.box(0,base+2.7,2.7,5.6,.1,.9,COL.plank);
    for(let i=0;i<=9;i++)B.box(-2.7+i*.6,base+2.8,3.1,.08,.8,.08,COL.woodD);B.box(0,base+3.6,3.1,5.6,.08,.1,COL.woodD);
    door(K,0,base,2.3,1.1,1.8,0,COL.woodD);
    for(const x of [-1.8,-.6,.6,1.8])lan(K,x,base+3.5,2.3,.5,1.3,0);for(const s of [-1,1])for(const z of [-.9,.9]){lan(K,s*3,base+1.2,z,.5,1.5,s*PI/2);lan(K,s*3,base+3.6,z,.5,1.3,s*PI/2);}
    gable(B,{x:0,z:0,top:base+5.4,len:6,span:4.6,k:.6,t:.22,col:K.pick(ROOF.tile),wall:wl,axis:'x',ov:.3});
    B.box(0,base+5.4+.1,0,1.8,1.2,1.8,wl);B.cone(0,base+6.6,0,1.5,1.4,K.pick(ROOF.tile),4,PI/4);lan(K,0,base+5.8,.92,.4,.6,0);K.flag(0,base+8,0,K.pick(BANNER),1.0,1.8);
    B.beam(3.1,base+3.5,1.2,3.9,base+3.5,1.2,.06,IRON);B.cyl(3.9,base+3.0,1.2,.04,.5,IRON,4);for(const dz of [-.3,.3])B.cyl(3.9,base+2.9,1.2+dz,.28,.06,COL.gold,8);B.beam(3.9,base+3.0,.9,3.9,base+3.0,1.5,.04,IRON);
    chim(K,-2,base+5.2,-1.4,1.4,wl,1.2);crate(B,-3.6,base,1.6,.6);crate(B,-3.6,base+.6,1.6,.5,.3);for(let i=0;i<3;i++)sack(B,-3.8+(i%2)*.5,base,.6-i*.5);B.box(3.7,base,-.6,.7,.5,.9,COL.woodD);B.box(3.7,base+.5,-.6,.6,.08,.8,COL.gold);
    T.push('Arcaded counting house for coin and cloth','Gold scales hang over the door');return {name:'Counting House',r:4.8};}
  }});
defBuilding({type:'bathhouse',age:4,name:'Bathhouse',desc:'Steaming baths keep the town clean and cheerful.',variants:['Domed Baths','Steam Cabin and Tubs','Hot Spring Pool'],r:5.5,joy:2,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;
  if(vi===0){const base=BH.pad(K,4,3.6,0x6f6a62),wl=K.pick(PLASTER),rc=K.pick(ROOF.tile);
    B.box(0,base,-.2,7,3.6,5.6,wl);B.box(0,base+3.5,-.2,7.2,.18,5.8,TRM);B.cyl(0,base+3.6,-.2,2.6,.7,wl,12);B.sph(0,base+4.1,-.2,2.7,2.0,2.7,rc,1);B.cyl(0,base+5.9,-.2,.45,.4,TRM,8);
    K.smoke(0,base+6.5,-.2,1.8,0);for(const x of [-2.6,0,2.6]){lan(K,x,base+1.2,-3.03,.7,1.5,PI);}
    for(const s of [-1,1]){lan(K,s*3.5,base+1.2,-.2,.7,1.5,s*PI/2);B.box(s*2.6,base+4.1,2.2,.5,1.1,.5,TRM);}
    for(const x of [-2.4,-.8,.8,2.4])B.cyl(x,base,3.3,.22,3.2,0xe4dfd2,8);B.box(0,base+3.2,3.3,6.2,.25,1.2,TRM);gable(B,{x:0,z:3.3,top:base+3.45,len:6.2,span:1.4,k:.4,t:.15,col:rc,wall:wl,axis:'x',ov:.1});
    B.box(0,base,3.0,1.2,2.2,.1,COL.door);B.prism(0,base+2.2,3.0,.1,.6,1.2,COL.door,PI/2);lan(K,-1.7,base+1.0,2.8,.6,1.4,0);lan(K,1.7,base+1.0,2.8,.6,1.4,0);
    B.box(3.4,base,-3.4,2.0,2.6,1.6,wl);B.box(3.4,base+2.6,-3.4,2.2,.15,1.8,TRM);chim(K,3.6,base+2.7,-3.6,3.0,0x7d3a2e,2,.8);K.flame(2.4,base+.9,-3.4,.5);B.box(2.4,base,-3.4,.1,1.2,.9,DK);
    barrel(B,-3.8,base,-3.4);B.box(-3.0,base,-3.6,1.2,.5,.5,COL.woodD);for(let i=0;i<3;i++)B.box(-3.3+i*.3,base+.5,-3.6,.25,.15,.4,COL.canvas);
    T.push('Domed hot room with a steaming oculus','A furnace in the cellar stack');}
  else if(vi===1){const base=BH.pad(K,4.6,3.8,0x6f6a62);
    B.box(-1.4,base,-1.2,5.0,2.6,3.6,COL.plank);B.box(-1.4,base,-1.2,5.1,.15,3.7,COL.woodD);for(let i=0;i<=8;i++)B.box(-3.8+i*.6,base,.62,.1,2.6,.06,COL.woodD);
    gable(B,{x:-1.4,z:-1.2,top:base+2.6,len:5.0,span:3.6,k:.75,t:.2,col:K.pick(ROOF.shingle),axis:'x',ov:.3});
    win(K,-2.6,base+1.5,.62,1,'z',null);win(K,-.2,base+1.5,.62,1,'z',null);B.box(-1.4,base,.64,.9,1.7,.08,COL.door);
    chim(K,-3.2,base+2.6,-2,1.6,K.pick(STONE),2,.8);K.smoke(-3.2,base+5,-2,1.2,0);
    for(const [x,z] of [[2.4,.8],[3.9,-.8],[2.6,-2.4]]){B.cyl(x,base,z,.95,.75,COL.wood,10);B.cyl(x,base+.15,z,1.0,.06,IRON,10);B.cyl(x,base+.6,z,.84,.14,COL.water,10);K.smoke(x,base+1.0,z,.8,0);}
    B.box(1.5,base,2.4,.9,.5,.6,COL.woodD);for(let i=0;i<3;i++)B.hcyl(.9,base+.15+i*.2,2.1+i*.01,.09,1.2,COL.woodL,'x');
    B.cyl(-3.8,base,2.3,.4,.5,TRM,8);B.cone(-3.8,base,2.3,.4,.0,TRM,6);K.flame(-3.8,base+.1,2.3,.6);B.cyl(-3.8,base+.9,2.3,.45,.4,IRON,8);
    for(const x of [-4.6,-.6]){B.cyl(x,base,3.4,.07,1.8,COL.woodD,5);}B.box(-2.6,base+1.3,3.4,3.9,.04,.05,0xb8a888);for(let i=0;i<4;i++)B.box(-4.1+i*1.0,base+.55,3.42,.6,.75,.03,COL.canvas);
    for(const x of [1.2,2.2,3.2,4.2])B.box(x,base,3.4,.08,.7,.08,COL.woodD);B.box(2.7,base+.55,3.4,3.1,.06,.08,COL.woodD);
    B.box(-4.2,base,-2.8,.9,.7,1.4,COL.woodD);for(let i=0;i<4;i++)B.hcyl(-4.5,base+.7+(i%2)*.15,-3.2+i*.3,.14,.9,COL.woodL,'x');
    T.push('Wooden steam cabin','Wash-tubs steaming in the yard','Linen drying on the line');}
  else{const base=BH.pad(K,4.4,3.2,0x6f6a62);
    B.box(-.4,base,.0,6.4,.55,4.6,K.pick(STONE));B.box(-.4,base+.5,0,5.6,.08,3.8,COL.water);
    for(let i=0;i<9;i++){const a=i/9*TAU,x=-.4+Math.sin(a)*3.4,z=Math.cos(a)*2.5;B.sph(x,base+.35,z,.5+K.rng()*.3,.4,.5+K.rng()*.25,K.pick(STONE),0);}
    for(const [x,z] of [[-1.5,.5],[.4,-.9],[1.3,.8],[-.6,-.3]])K.smoke(x,base+.6,z,.9,0);
    for(let i=0;i<3;i++)B.box(-3.6-.0,base+.4+i*.0,-1+i*.8,.5,.12,.4,COL.plank);
    B.box(3.6,base,-.6,2.0,2.2,2.0,COL.plank);gable(B,{x:3.6,z:-.6,top:base+2.2,len:2.0,span:2.0,k:.8,t:.25,col:K.pick(ROOF.thatch),axis:'x',ov:.3});B.box(3.0,base,.45,.8,1.6,.08,COL.door);
    for(let i=0;i<8;i++)B.box(-4.2+i*.9,base,2.9,.12,1.3+(i%2)*.15,.1,COL.woodD);B.box(-1.2,base+1.0,2.9,7.3,.07,.07,COL.woodD);
    B.box(-1.2,base,3.0,.1,.1,.1,COL.woodD);for(const x of [-3.2,2.4]){B.cyl(x,base,3.4,.09,1.4,COL.woodD,5);B.box(x,base+1.4,3.4,.34,.34,.34,TRM);K.flame(x,base+1.52,3.4,.3);}
    B.box(-4.4,base,-2.6,1.4,.4,.5,COL.woodL);B.cyl(-3.0,base,-2.7,.5,.4,COL.woodL,8);B.cyl(-3.0,base+.4,-2.7,.4,.08,COL.water,8);
    B.cyl(-4.4,base,2.0,.2,2.2,COL.woodD,5);B.sph(-4.4,base+2.3,2.0,.9,.7,.9,COL.leaf,1);
    T.push('Natural hot spring in a stone basin','Steam drifting over the water');}
  return {name:['Domed Bathhouse','Steam Bathhouse','Hot Spring Baths'][vi],r:5.5};}});
defBuilding({type:'playhouse',age:4,name:'Playhouse',desc:'Players, minstrels and crowds gather for plays.',variants:['Round Timber Theatre','Inn-Yard Stage','Pageant Wagon Stage'],r:6,joy:3,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const sh=K.pick(SHUT);
  if(vi===0){const R=4.4,base=BH.pad(K,5.2,5.2,0x6f6a62),pl=K.pick(PLASTER),N=12,sl=2*R*Math.tan(PI/N)+.1;
    for(let i=0;i<N;i++){const a=i/N*TAU,x=Math.sin(a)*R,z=Math.cos(a)*R;B.box(x,base,z,sl,4.0,.45,pl,a);
      const x2=Math.sin(a+PI/N)*R*1.02,z2=Math.cos(a+PI/N)*R*1.02;B.box(x2,base,z2,.22,4.2,.22,COL.beam);
      B.box(x,base+2.0,z,sl,.14,.55,COL.beamD,a);if(i%3!==0){const wx=Math.sin(a)*(R+.25),wz=Math.cos(a)*(R+.25);G.box(wx,base+2.5,wz,.6,.7,.05,WG,a);B.box(wx,base+2.4,wz,.8,.1,.2,TRM,a);}
      B.wedge(Math.sin(a)*(R-.35),base+4.0,Math.cos(a)*(R-.35),sl,1.3,2.2,K.pick(ROOF.thatch),a);}
    B.cyl(0,base,0,R-1.2,.08,COL.soil,12);B.box(0,base,-2.0,4.2,.9,1.6,COL.plank);B.box(0,base+.9,-2.4,4.2,.12,.8,COL.woodD);
    for(const x of [-1.9,1.9]){B.cyl(x,base+.9,-1.5,.12,3.1,COL.woodD,6);}B.wedge(0,base+4.0,-1.9,4.8,.9,1.9,K.pick(ROOF.tile),PI);B.box(0,base+1.0,-2.55,4,2.6,.1,K.pick(BANNER));
    door(K,0,base,R+.2,1.1,1.8,0,COL.door);board(K,-1.4,base+2.6,R+.25,1.6,.6,0,COL.gold);K.flag(0,base+5.4,0,K.pick(BANNER),1.6,2.8);K.flag(2.9,base+4.9,3.2,K.pick(BANNER),1.0,1.6);
    for(const a of [.6,-.6]){K.flame(Math.sin(a)*R*1.4,base+.8,Math.cos(a)*R*1.45,.5);B.cyl(Math.sin(a)*R*1.4,base,Math.cos(a)*R*1.45,.1,.8,IRON,5);}
    T.push('A round wooden playhouse under a thatched gallery','Open to the sky, with a painted stage');return {name:'Round Theatre',r:6};}
  else if(vi===1){const base=BH.pad(K,5.2,4.6,0x6f6a62),pl=K.pick(PLASTER),rc=K.pick(ROOF.tile);
    B.box(0,base,-3.0,10.2,5.0,3.0,pl);timberFrame(K,0,-3.0,10.2,3.0,base,2.5,false,false,COL.beam);timberFrame(K,0,-3.0,10.2,3.0,base+2.5,2.5,false,false,COL.beam);B.box(0,base+2.4,-1.4,10.5,.2,.35,COL.beamD);
    gable(B,{x:0,z:-3,top:base+5,len:10.2,span:3.0,k:.8,t:.22,col:rc,wall:pl,axis:'x',ov:.3});
    for(const s of [-1,1]){B.box(s*4.4,base,.5,1.4,4.2,5.4,pl);gable(B,{x:s*4.4,z:.5,top:base+4.2,len:5.4,span:1.4,k:.9,t:.2,col:rc,wall:pl,axis:'z',ov:.25});
      for(let i=0;i<3;i++)B.box(s*3.5,base+2.2,-1.5+i*1.9,.14,.14,.14,COL.woodD);B.box(s*3.6,base+2.1,.8,.1,.16,5.2,COL.woodD);B.box(s*3.6,base+2.7,.8,.07,.07,5.2,COL.woodD);
      for(let i=0;i<4;i++){B.cyl(s*3.62,base,-1.4+i*1.6,.1,2.2,COL.woodD,5);win(K,s*5.1,base+1.0+(i%2)*.0,-1.3+i*1.5,s,'x',sh);}}
    for(let i=0;i<5;i++){B.cyl(-3+i*1.5,base,-1.45,.1,2.2,COL.woodD,5);B.box(-3+i*1.5,base+2.3,-1.4,.08,.7,.08,COL.woodD);}B.box(0,base+2.1,-1.4,6.2,.12,.8,COL.woodD);B.box(0,base+2.7,-1.1,6.2,.07,.07,COL.woodD);
    for(let i=0;i<4;i++){win(K,-3.6+i*2.4,base+1.2,-1.46,1,'z',sh);win(K,-3.6+i*2.4,base+3.3,-1.46,1,'z',sh);}
    B.box(0,base,-.4,4.2,.8,2.4,COL.plank);B.box(0,base+.8,-1.5,3.8,2.3,.08,K.pick(BANNER));for(const x of [-1.9,1.9]){B.box(x,base+.8,-.4,.5,2.3,.2,K.pick(BANNER));}
    B.wedge(0,base+3.1,-.8,4.6,.5,1.6,K.pick(BANNER),PI);
    B.box(-4.6,base,4.0,.15,2.8,.15,COL.woodD);B.box(4.6,base,4.0,.15,2.8,.15,COL.woodD);B.box(0,base+2.7,4.0,9.5,.3,.2,COL.woodD);board(K,0,base+2.2,4.0,3.0,.8,0,COL.gold);
    for(let i=0;i<3;i++)B.box(-2.2+i*2.2,base,2.2,1.8,.4,.4,COL.plank);barrel(B,3.0,base,2.8);barrel(B,3.5,base,2.4);K.flame(-3.0,base+.9,3.6,.5);B.cyl(-3.0,base,3.6,.1,.9,IRON,5);
    chim(K,3.2,base+5.0,-3.2,1.4,K.pick(STONE),1.2);K.flag(-4.4,base+4.8,.5,K.pick(BANNER),1.0,1.8);
    T.push('Galleried inn-yard with a trestle stage','Painted curtains and a hanging sign');}
  else{const base=BH.pad(K,5.0,4.2,0x6f6a62);
    B.box(0,base,-.8,6.2,.9,3.6,COL.plank);for(let i=0;i<=6;i++)B.box(-3.0+i,base-.1,-.8+1.82,.08,.5,.08,COL.woodD);
    for(const x of [-2.2,2.2])for(const z of [-2.0,.4]){B.cyl(x,base+.9,z,.1,2.6,COL.woodD,5);}
    B.box(0,base+3.4,-.8,6.4,.16,3.2,COL.beamD);B.wedge(0,base+3.5,-.8,6.4,.9,3.4,K.pick(ROOF.shingle),PI);
    B.box(0,base+.9,-2.4,6.2,2.5,.12,K.pick(PLASTER));B.box(0,base+1.3,-2.3,2.0,1.6,.06,K.pick(BANNER));B.prism(0,base+2.9,-2.3,.06,.8,2.0,K.pick(BANNER),PI/2);
    for(const s of [-1,1]){B.box(s*1.6,base+.9,-2.3,1.2,2.2,.06,K.pick(BANNER));}
    for(const x of [-2.2,-.7,.7,2.2])K.flag(x,base+3.5,.9,K.pick(BANNER),.5,.8);
    for(const w of [-1.9,1.9]){B.box(w,.0+base,3.0,.4,.4,.3,COL.plank);}
    for(let r=0;r<3;r++)for(const s of [-1,1])B.box(s*1.9,base,1.7+r*.9,2.0,.38,.4,COL.plank);
    B.box(0,base,1.0,1.2,.5,.5,COL.woodD);B.cyl(3.9,base,-1.0,.3,.5,COL.wood,8);B.cyl(3.9,base+.5,-1.0,.3,.05,0xefe6cc,8);
    for(const x of [-4.1,4.1]){B.cyl(x,base,1.5,.08,1.5,IRON,5);K.flame(x,base+1.6,1.5,.4);}
    ridgeTent(K,-3.8,base,-2.8,3.0,1.7,2.0,K.pick(BANNER),PI/2);
    const wx=3.6,wz=-2.6;B.box(wx,base+.5,wz,2.2,.18,1.3,COL.wood);for(const dz of [-.7,.7])for(const dx of [-.8,.8]){B.cyl(wx+dx,base+.5,wz+dz,.45,.1,COL.woodD,10);}
    wagonCover(K,wx,base+.7,wz,2.0,1.2,K.pick(BANNER),PI/2);
    T.push('A painted wagon stage with a canopy','Torches, bunting and benches for the crowd');}
  return {name:['Round Theatre','Inn-Yard Playhouse','Pageant Stage'][vi],r:6};}});
defBuilding({type:'infirmary',age:4,name:'Infirmary',desc:'Brothers and herb-wives nurse the sick and wounded.',variants:['Ward and Chapel','Cruciform Ward','Herbalist Sick-House'],r:6,joy:2,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const sh=K.pick(SHUT),wl=K.pick(PLASTER),rc=K.pick(ROOF.tile);
  const bed=(x,y,z,l)=>{B.box(x,y,z,.9,.3,l,COL.plank);B.box(x,y+.3,z,.8,.12,l-.2,COL.canvas);};
  if(vi===0){const base=BH.pad(K,5,3.2,0x6f6a62),wl2=K.pick(STONE);
    B.box(-.8,base,0,8,3.6,4,wl2);gable(B,{x:-.8,z:0,top:base+3.6,len:8,span:4,k:.85,t:.22,col:rc,wall:wl2,axis:'x',ov:.3});
    for(let i=0;i<4;i++){lan(K,-3.8+i*2.0,base+1.2,2.0,.6,1.6,0);lan(K,-3.8+i*2.0,base+1.2,-2.0,.6,1.6,PI);B.box(-2.8+i*2,base,2.1,.4,2.6,.4,wl2);}
    B.box(4.0,base,0,2.8,4.4,3.2,wl2);gable(B,{x:4,z:0,top:base+4.4,len:3.2,span:2.8,k:1.0,t:.2,col:rc,wall:wl2,axis:'z',ov:.2});B.cyl(5.4,base,0,1.4,3.6,wl2,8);B.cone(5.4,base+3.6,0,1.6,2.0,rc,8);
    lan(K,5.0,base+1.2,.0,.5,1.6,PI/2*0+PI/2);lan(K,4.0,base+1.6,1.6+0,.6,1.8,0);
    B.cyl(3.4,base+8,0,.0,0,TRM,3);B.box(4,base+6.5,0,.5,1,.5,wl2);B.cone(4,base+7.5,0,.5,1.0,K.pick(ROOF.slate),4,PI/4);B.box(4,base+8.5,0,.08,.7,.08,COL.gold);B.box(4,base+8.8,0,.4,.08,.08,COL.gold);
    door(K,-.8,base,2.05,1.0,1.9,0);B.box(-.8,base+2.5,2.15,.9,.9,.06,0xefe6cc);B.box(-.8,base+2.95,2.2,.2,.9,.04,BANNER[0]);B.box(-.8,base+2.95,2.2,.9,.2,.04,BANNER[0]);
    for(let i=0;i<3;i++){const x=-4.2+i*1.5;B.box(x,base,3.9,1.2,.3,.8,COL.soil);for(let q=0;q<3;q++)B.sph(x-.35+q*.35,base+.34,3.9,.17,.15,.17,COL.leaf,0);}
    for(let i=0;i<9;i++)B.box(-4.9+i*1.0,base,4.6,.08,.7,.08,COL.woodD);B.box(-.4,base+.5,4.6,9.0,.06,.06,COL.woodD);
    chim(K,-3.0,base+3.7,-.8,1.4,wl2,1.2);B.cyl(1.9,base,3.2,.35,.5,TRM,8);B.cyl(1.9,base+.5,3.2,.3,.06,COL.water,8);
    T.push('Long ward lined with beds','Chapel and herb garden','A red cross over the door');}
  else if(vi===1){const base=BH.pad(K,5.6,5.6,0x6f6a62),wl2=K.pick(STONE);
    for(const [ax,w,d] of [[0,10.4,3.6],[1,3.6,10.4]]){B.box(0,base,0,w,3.6,d,wl2);gable(B,{x:0,z:0,top:base+3.6,len:ax?d:w,span:ax?w:d,k:.85,t:.22,col:rc,wall:wl2,axis:ax?'z':'x',ov:.25});}
    B.box(0,base+3.5,0,2.8,2.2,2.8,wl2);B.cone(0,base+5.7,0,2.1,2.2,rc,4,PI/4);for(const a of [0,PI/2,PI,-PI/2])lan(K,Math.sin(a)*1.4,base+4.2,Math.cos(a)*1.4,.45,1.0,a);
    B.box(0,base+7.8,0,.08,.9,.08,COL.gold);B.box(0,base+8.1,0,.45,.08,.08,COL.gold);
    for(const a of [0,PI/2,PI,-PI/2]){const s=Math.sin(a),c2=Math.cos(a);for(const o of [-1.1,1.1]){lan(K,s*5.2+c2*o,base+1.2,c2*5.2-s*o,.55,1.6,a);}lan(K,s*1.8+c2*0,base+.0,c2*1.8,.01,.01,a);}
    for(const a of [0,PI/2,PI,-PI/2])for(const o of [-1.6,1.6]){const s=Math.sin(a),c2=Math.cos(a);lan(K,s*1.8+c2*o,base+1.2,c2*1.8-s*o,.5,1.6,a+0);}
    door(K,0,base,5.2,1.1,1.9,0);B.box(0,base+2.55,5.28,.9,.9,.05,0xefe6cc);B.box(0,base+2.55,5.32,.2,.8,.04,BANNER[0]);B.box(0,base+2.55,5.32,.8,.2,.04,BANNER[0]);
    for(const [x,z] of [[-2.8,-2.8],[2.8,2.8]]){B.cyl(x,base,z,.5,.5,TRM,8);B.cyl(x,base+.5,z,.42,.06,COL.water,8);}
    chim(K,3.6,base+3.7,-.6,1.4,wl2,1.2);chim(K,-3.6,base+3.7,.6,1.4,wl2,1.2);
    for(const s of [-1,1])for(let i=0;i<3;i++)B.box(s*3.6,base,-4.1+i*1.2,.7,.35,.5,COL.plank);
    B.box(3.4,base,3.6,1.6,.3,1.4,COL.soil);for(let q=0;q<4;q++)B.sph(2.9+q*.3,base+.35,3.6,.15,.14,.15,COL.leaf,0);K.flag(0,base+8.4,0,K.pick(BANNER),1.0,1.6);
    T.push('Four wards meeting under a lantern roof','Beds in every wing, a chapel in the middle');}
  else{const o=buildHall(K,{w:5.2,d:4.2,st:2,sh:2.0,jetty:true,frame:true,wallCol:wl,roofCol:K.pick(ROOF.thatch),shut:sh,cw:4,cs:3,pitch:1.0,roofT:.28,noDormer:true});
    const {base}=o;
    B.box(0,base+1.9,2.1+.5,.05,1.0,.05,COL.woodD);board(K,-2.0,base+2.2,2.5+.4,.1,.8,PI/2,0xefe6cc);B.box(-2.0+.07,base+2.2,2.9,.06,.6,.2,BANNER[0]);
    for(let i=0;i<4;i++){const x=-1.8+i*1.2;B.box(x,base+2.0,2.65,.12,.5,.1,COL.leaf);B.box(x,base+2.0,2.65,.06,.6,.06,COL.woodD);}
    for(let i=0;i<3;i++){const x=-2.6+i*1.6;B.box(x,base,3.5,1.2,.35,.7,COL.woodD);B.box(x,base+.35,3.5,1.0,.1,.5,COL.soil);for(let q=0;q<4;q++)B.sph(x-.35+q*.24,base+.5,3.5,.15,.14,.15,K.pick([COL.leaf,0x6a8a45,0x9b59b6,0xd4a73c]),0);}
    B.cyl(3.4,base,.8,.5,.55,IRON,8);K.flame(3.4,base+.0,.8,.6);B.cyl(3.4,base+.55,.8,.42,.3,COL.water,8);K.smoke(3.4,base+1.2,.8,1.0,0);for(const s of [-1,1])B.cyl(3.4+s*.5,base,.8+0,.05,.9,COL.woodD,4);
    chim(K,1.6,base+4.8,-1.0,1.6,K.pick(STONE),1.4);barrel(B,-3.3,base,2.0);bed(2.9,base,-2.6,1.6);
    T.push('Herb beds and drying bundles','A cauldron of broth on the fire');return {name:'Sick-House',r:5.4};}
  return {name:['Hospital Ward','Cruciform Hospital','Sick-House'][vi],r:6};}});
defBuilding({type:'library',age:4,name:'Library',desc:'Chained books and quiet scribes keep the town’s memory.',variants:['Scriptorium','Reading Hall','Chapter House Library'],r:5.5,joy:1,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const wl=K.pick(STONE),sh=K.pick(SHUT),rs=K.pick(ROOF.slate);
  if(vi===0){const base=BH.pad(K,4.4,2.6,0x6f6a62);
    B.box(0,base,0,8.4,3.6,4.4,wl);gable(B,{x:0,z:0,top:base+3.6,len:8.4,span:4.4,k:.9,t:.22,col:rs,wall:wl,axis:'x',ov:.3});
    for(let i=0;i<5;i++){const x=-3.4+i*1.7;if(i!==2)lan(K,x,base+1.3,2.2,.5,1.7,0);lan(K,x,base+1.3,-2.2,.5,1.7,PI);B.box(x+.85,base,2.3,.4,3.0,.4,wl);}
    door(K,0,base,2.2,1.1,1.9,0);B.box(0,base+2.4,2.3,1.3,.8,.1,COL.woodD);B.box(0,base+2.4,2.36,1.1,.6,.04,COL.gold);
    for(const x of [-2.4,2.4]){B.box(x,base+3.6,.0,1.4,1.2,1.4,wl);gable(B,{x,z:0,top:base+4.8,len:1.4,span:1.4,k:.9,t:.15,col:rs,wall:wl,axis:'z',ov:.1});G.box(x,base+3.9,.72,.5,.6,.04,WG);}
    chim(K,3.4,base+4.5,-1.4,1.4,wl,1.2);chim(K,-3.4,base+4.5,-1.4,1.4,wl,1.0);
    B.box(3.9,base,3.0,.5,.9,.8,COL.woodD);B.box(3.9,base+.9,3.0,.7,.1,.7,COL.woodL);B.box(3.9,base+1.0,3.0,.5,.08,.3,COL.canvas);crate(B,-3.8,base,3.0,.6);crate(B,-3.2,base,3.2,.45);B.cyl(-4.4,base,2.4,.07,2.0,IRON,5);K.flame(-4.4,base+2.05,2.4,.3);
    T.push('Tall lancets give light to the scribes','Smoke from the copyists’ stoves');}
  else if(vi===1){const base=BH.pad(K,3.7,4.2,0x6f6a62);
    B.box(0,base,0,4.6,5.6,8.2,wl);gable(B,{x:0,z:0,top:base+5.6,len:8.2,span:4.6,k:1.0,t:.22,col:K.pick(ROOF.tile),wall:wl,axis:'z',ov:.25});
    for(const s of [-1,1]){B.box(s*3.0,base,0,1.6,2.6,8.2,wl);B.wedge(s*3.0,base+2.6,0,8.2,.9,1.9,K.pick(ROOF.tile),s>0?PI/2:-PI/2);
      for(let i=0;i<4;i++){lan(K,s*3.8,base+.7,-2.8+i*1.9,.4,1.3,s*PI/2);lan(K,s*2.3,base+3.2,-2.8+i*1.9,.5,1.6,s*PI/2);}}
    for(const q of [-1,1])lan(K,q*1.0,base+3.0,4.1,.6,2.0,0);rose(K,0,base+5.0,4.1,.7,0);
    door(K,0,base,4.1,1.2,2.0,0);for(const s of [-1,1])B.box(s*1.6,base,4.1,.4,3.6,.4,wl);
    B.box(0,base+.0,4.8,3.6,.3,.9,TRM);
    for(const x of [-2.6,0,2.6])if(false)0;
    B.box(-3.6,base,5.0,.12,2.0,.12,COL.woodD);B.box(-.0,base,5.2,.12,2.0,.12,COL.woodD);B.wedge(-1.9,base+2.0,5.1,3.8,.3,.8,K.pick(BANNER),PI);
    B.box(-2.0,base,5.1,3.2,.6,.7,COL.woodL);for(let i=0;i<6;i++)B.box(-3.3+i*.5,base+.62,5.1+(i%2)*.1,.4,.18,.28,K.pick([0x7a3a2a,0x3d5a80,0x4a6a3a,0x6b4a2e,0x8e2f1f]),.2);
    B.box(2.2,base,4.9,1.4,.6,.6,COL.woodL);for(let i=0;i<3;i++)B.box(1.8+i*.4,base+.62,4.9,.3,.12,.22,0x6b4a2e);
    chim(K,1.0,base+5.4,-2.4,1.2,wl,1.0);K.flag(0,base+8.6,-3,K.pick(BANNER),1.0,1.6);
    T.push('Tall reading hall with side aisles','Booksellers’ stalls under an awning');}
  else{const base=BH.pad(K,3.7,3.7,0x6f6a62);
    B.cyl(0,base,0,3.2,4.6,wl,8);B.cyl(0,base+4.6,0,3.45,.22,TRM,8);
    for(let i=0;i<8;i++){const a=(i+.5)*PI/4;lan(K,Math.sin(a)*2.96,base+1.5,Math.cos(a)*2.96,.55,2.1,a);B.box(Math.sin(a+PI/8)*3.45,base,Math.cos(a+PI/8)*3.45,.4,3.6,.4,wl,a);}
    B.cone(0,base+4.8,0,3.7,3.4,K.pick(ROOF.tile),8);B.cyl(0,base+8.0,0,.75,1.0,wl,8);B.cone(0,base+9,0,1.0,1.4,rs,8);for(let i=0;i<4;i++){const a=i*PI/2;G.box(Math.sin(a)*.74,base+8.4,Math.cos(a)*.74,.04,.5,.4,WG,a);}
    B.box(0,base+10.3,0,.08,.7,.08,COL.gold);B.box(0,base+10.6,0,.4,.08,.08,COL.gold);
    B.box(0,base,3.0,2.2,3.0,1.6,wl);gable(B,{x:0,z:3.0,top:base+3.0,len:1.6,span:2.2,k:.8,t:.2,col:rs,wall:wl,axis:'z',ov:.15});door(K,0,base,3.8,1.0,1.8,0);
    chim(K,2.0,base+4.7,-1.6,1.3,wl,1.0);for(let i=0;i<3;i++)barrel(B,-3.6+i*.35,base,3.0);crate(B,3.3,base,3.2,.5);K.flag(0,base+10.7,0,K.pick(BANNER),1.0,1.5);
    T.push('Eight-sided library under a lantern','Reading desks by every window');}
  return {name:['Scriptorium','Reading Hall','Octagonal Library'][vi],r:5.5};}});
defBuilding({type:'treadmill_crane',age:4,name:'Treadmill Crane',desc:'Men walking a great wheel haul stone and cargo skyward.',variants:['Harbour Crane','Tower-top Crane','Builders’ Gantry'],r:5,joy:0,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;
  const wheel=(x,y,z,r,wd,sp)=>{const wb=K.sub();makeWheel(wb,r,wd,'x');K.anim(wb,'spin',x,y,z,{axis:'x',speed:sp});};
  if(vi===0){const base=BH.pad(K,3.8,3.2,0x6f6a62);
    B.box(0,base,0,7,.3,5.6,COL.plank);for(const x of [-1.8,1.8]){B.beam(x,base+.3,-.9,x*.3,base+5.2,0,.3,COL.woodD,.3);B.beam(x,base+.3,.9,x*.3,base+5.2,0,.3,COL.woodD,.3);}
    B.box(0,base+5.0,0,1.4,.5,1.0,COL.woodD);B.cyl(0,base+.3,0,.3,5.7,COL.woodD,6);
    B.beam(0,base+5.6,0,3.8,base+4.5,0,.28,COL.wood,.3);B.beam(.2,base+3.6,0,3.2,base+4.7,0,.14,COL.woodD);B.cyl(3.7,base+4.3,0,.22,.34,COL.woodD,8);
    wheel(-1.1,base+2.3,0,2.0,1.1,.3);B.hcyl(-1.1-1,base+2.3,0,.18,2.4,COL.woodD,'x');
    B.box(3.7,base+1.7,0,.03,2.6,.03,0xb8a888);B.box(3.7,base+1.0,0,.9,.9,.9,COL.plank);B.box(3.7,base+1.9,0,.95,.06,.95,COL.woodD);B.box(3.7,base+1.9,0,.06,.06,.95,IRON);B.cyl(3.7,base+3.9,0,.1,.5,IRON,6);
    for(let i=0;i<3;i++)B.cyl(-3.0,base+.3+i*.0,2.2+i*.0,.0,.0,IRON,3);
    barrel(B,2.4,base+.3,2.0);barrel(B,2.9,base+.3,2.3);crate(B,-3.0,base+.3,2.2,.7);crate(B,-3.0,base+1.0,2.2,.55,.3);B.sph(-2.2,base+.5,2.4,.4,.2,.4,0x6a5a40,0);for(const s of [-1,1])K.flag(s*3.4,base+.3,-2.4,K.pick(BANNER),.8,1.8);
    T.push('A tread-wheel turned by walking men','A swinging jib over the quay');return {name:'Harbour Crane',r:5};}
  else if(vi===1){const base=BH.pad(K,2.9,2.9,0x6f6a62),wl=K.pick(STONE);
    B.box(0,base,0,3.2,5.4,3.2,wl);for(const f of [.4,.8])B.box(0,base+5.4*f,0,3.4,.14,3.4,TRM);
    for(const a of [0,PI,PI/2,-PI/2])lan(K,Math.sin(a)*1.6,base+2.6,Math.cos(a)*1.6,.4,1.4,a);door(K,0,base,1.6,.9,1.7,0);
    const sw=K.sub();sw.box(0,5.4,0,3.6,.18,3.6,COL.woodD);for(const sx of [-1,1])for(const sz of [-1,1])sw.box(sx*1.6,5.5,sz*1.6,.2,1.4,.2,COL.woodD);
    sw.box(0,6.8,0,3.8,.18,3.8,COL.woodD);B.cone(0,base+6.9,0,2.9,2.2,K.pick(ROOF.shingle),4,PI/4);for(const sx of [-1,1])for(const sz of [-1,1])B.box(sx*1.6,base+5.5,sz*1.6,.2,1.4,.2,COL.woodD);B.box(0,base+5.4,0,3.6,.18,3.6,COL.woodD);
    B.beam(0,base+6.0,.0,0,base+6.0,4.2,.3,COL.wood,.28);B.beam(0,base+7.2,0,0,base+6.2,3.9,.14,COL.woodD);B.box(0,base+5.3,4.3,.4,.4,.4,COL.woodD);
    B.box(0,base+3.6,4.2,.03,2.4,.03,0xb8a888);B.box(0,base+2.9,4.2,.9,.8,.9,wl);B.box(0,base+3.7,4.2,.7,.06,.7,COL.woodD);
    wheel(2.1,base+3.0,0,1.6,.9,.3);B.hcyl(1.2,base+3.0,0,.16,1.8,COL.woodD,'x');B.box(2.1,base+1.5,0,.2,.2,.2,COL.woodD);
    for(let i=0;i<4;i++)B.box(-3.1+(i%2)*.9,base+(i>>1)*.5,2.3+(i>>1)*.2,.8,.5,.55,K.pick(STONE),(i-1.5)*.2);B.box(-3.0,base,1.0,.8,.4,.6,K.pick(STONE));K.flag(0,base+9.0,0,K.pick(BANNER),1.0,1.6);
    T.push('Wheel lifted stone to the church roof','A turning cap with a swinging jib');return {name:'Tower Crane',r:5};}
  else{const base=BH.pad(K,4.8,3.4,0x6f6a62);
    for(const x of [-2.6,2.6])for(const z of [-1.2,1.2])B.beam(x,base,z,x*.9,base+5.8,z*.9,.3,COL.woodD,.3);
    for(const z of [-1.2,1.2]){B.box(0,base+5.7,z*.9,6.1,.35,.34,COL.wood);B.beam(-2.6,base+1.0,z,2.4,base+4.2,z,.1,COL.woodD);B.beam(2.6,base+1.0,z,-2.4,base+4.2,z,.1,COL.woodD);}
    for(const x of [-2.6,2.6])B.box(x*.9,base+5.7,0,.34,.35,2.7,COL.wood);B.box(0,base+5.5,0,.1,.1,2.4,IRON);
    wheel(0,base+3.0,-2.9,1.5,.8,.3);B.hcyl(-.8,base+3.0,-2.9,.14,1.6,COL.woodD,'x');B.beam(-1.9,base,-2.9,-.7,base+3.0,-2.9,.22,COL.woodD);B.beam(1.9,base,-2.9,.7,base+3.0,-2.9,.22,COL.woodD);
    B.box(0,base+5.1,0,.03,.6,.03,0xb8a888);B.box(0,base+4.4,0,1.4,.7,1.0,K.pick(STONE));B.box(0,base+5.1,0,1.5,.05,.05,IRON);
    for(let i=0;i<6;i++)B.box(-3.8+(i%3)*1.2,base+(i/3|0)*.55,2.2+(i/3|0)*.2,1.0,.55,.7,K.pick(STONE),(i-3)*.07);
    B.box(3.9,base,2.2,.14,3.2,.14,COL.woodD);B.box(4.4,base,2.2,.14,3.2,.14,COL.woodD);for(let i=0;i<6;i++)B.box(4.15,base+.4+i*.5,2.2,.55,.07,.08,COL.woodD);B.box(4.1,base+3.0,1.6,.9,.12,1.4,COL.plank);
    B.box(-4.2,base,-.6,1.6,1.7,1.4,COL.plank);gable(B,{x:-4.2,z:-.6,top:base+1.7,len:1.4,span:1.6,k:.5,t:.2,col:K.pick(ROOF.thatch),axis:'z',ov:.2});K.smoke(-4.2,base+2.7,-.6,.7,0);K.flag(-2.6,base+5.9,1.2,K.pick(BANNER),.9,1.6);
    T.push('Portal gantry over the building site','Cut stone waiting under the hoist');return {name:'Builders’ Gantry',r:5};}
  }});
// ================================================================ AGE 5 helpers
const COLM=0xb8b0a0,LAMPG=0xffd890;
function bwin(K,x,y,z,w,h,a){const s=Math.sin(a),c=Math.cos(a);K.B.box(x+s*.02,y-.06,z+c*.02,w+.16,h+.12,.05,0x3a2e26,a);K.G.box(x+s*.05,y,z+c*.05,w,h,.04,GLASS,a);K.B.box(x+s*.09,y-.12,z+c*.09,w+.28,.07,.12,COLM,a);}
function lamp(K,x,y,z){const B=K.B;B.cyl(x,y,z,.07,2.1,SOOT,5);B.box(x,y+2.1,z,.3,.07,.3,SOOT);K.G.box(x,y+2.17,z,.2,.3,.2,LAMPG);B.cone(x,y+2.47,z,.24,.2,SOOT,4,PI/4);}
function stack(K,x,y,z,h,w,col,rate){const B=K.B;w=w||1;B.box(x,y,z,w*1.25,h*.2,w*1.25,col);B.box(x,y+h*.2,z,w,h*.55,w,col);B.box(x,y+h*.75,z,w*.8,h*.25,w*.8,col);B.box(x,y+h,z,w*.95,.2,w*.95,SOOT);K.smoke(x,y+h+.4,z,rate||3,1);}
function track(K,x,y,z,len,ang){const B=K.B,s=Math.sin(ang),c=Math.cos(ang);
  for(const o of [-.38,.38])B.box(x+c*o,y,z-s*o,.1,.1,len,0x6a6e74,ang+PI/2*0);
  const n=Math.max(2,Math.round(len/.55));for(let i=0;i<=n;i++){const t=-len/2+i*len/n;B.box(x+s*t,y-.04,z+c*t,1.2,.07,.2,COL.woodD,ang);}}
function tram(K,x,y,z,ang,col,len){len=len||3.0;const B=K.B,G=K.G,cs=Math.cos(ang),sn=Math.sin(ang);
  const P=(lx,lz)=>[x+lx*cs+lz*sn,z-lx*sn+lz*cs];
  const part=(lx,ly,lz,sx,sy,sz,cl)=>{const p=P(lx,lz);B.box(p[0],y+ly,p[1],sx,sy,sz,cl,ang);};
  part(0,.3,0,1.3,.18,len,IRON);part(0,.45,0,1.3,.95,len,col);part(0,1.4,0,1.2,.1,len+.1,0xd8cdb0);part(0,1.5,0,1.0,.1,len-.3,0x6a6e74);
  for(let i=-1;i<=1;i++){const p=P(.66,i*.9);G.box(p[0],y+.85,p[1],.04*1,.55,.6,GLASS,ang);const q=P(-.66,i*.9);G.box(q[0],y+.85,q[1],.04,.55,.6,GLASS,ang);}
  for(const e of [-1,1]){const p=P(0,e*(len/2+.01));G.box(p[0],y+.85,p[1],.8,.55,.04,GLASS,ang);}
  for(const e of [-1,1])for(const f of [-1,1]){const p=P(f*.5,e*len*.34);B.box(p[0],y+.1,p[1],.1,.3,.34,SOOT,ang);}
  const q=P(0,-.4),p2=P(0,-len*.5-.6);B.beam(q[0],y+1.6,q[1],p2[0],y+2.6,p2[1],.05,SOOT);}
function wire(K,x1,y1,z1,x2,y2,z2){K.B.beam(x1,y1,z1,x2,y2,z2,.035,SOOT);}

// ================================================================ AGE 5
defBuilding({type:'gasworks',age:5,name:'Gasworks',desc:'Coal is baked into gas to light the streets.',variants:['Gasholder and Retort House','Twin Gasholders','Retort and Coke Ovens'],r:7.5,joy:1,
 gen:(b,c,K,vi)=>{const {B,G,F}=K,T=K.traits;const brick=K.pick(BRICK);
  const holder=(x,z,R,hh,up,n)=>{const base=K._gb;B.cyl(x,base,z,R+.1,.9,brick,16);B.cyl(x,base+.9,z,R+.14,.12,TRM,16);
    B.cyl(x,base+.9+up,z,R-.15,hh,0x6a6e74,16);B.cone(x,base+.9+up+hh,z,R-.15,.6,0x5d6068,16);B.cyl(x,base+.9+up-.05,z,R-.1,.12,SOOT,16);
    const pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,px=x+Math.sin(a)*(R+.5),pz=z+Math.cos(a)*(R+.5);pts.push([px,pz]);B.cyl(px,base+.9,pz,.13,up+hh+1.7,0x2f3236,6);}
    for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];for(const y of [up*.5+1.4,up+hh+1.9])B.beam(p[0],base+y,p[1],q[0],base+y,q[1],.1,0x2f3236);B.beam(p[0],base+1.0,p[1],q[0],base+up*.5+1.4,q[1],.06,0x2f3236);B.beam(q[0],base+1.0,q[1],p[0],base+up*.5+1.4,p[1],.06,0x2f3236);}
    for(const p of pts)B.cone(p[0],base+up+hh+2.6,p[1],.16,.5,0x2f3236,4,PI/4);};
  if(vi===0){const base=BH.pad(K,6.2,4.6,0x5f5a52);K._gb=base;holder(-2.4,-.4,3.0,3.3,1.7,10);
    B.box(3.8,base,.4,4.4,3.6,5.2,brick);gable(B,{x:3.8,z:.4,top:base+3.6,len:4.4,span:5.2,k:.5,t:.2,col:K.pick(ROOF.slate),wall:brick,axis:'z',ov:.3});
    for(let i=0;i<3;i++){bwin(K,1.6,base+1.0,-1.2+i*1.6,.8,1.6,-PI/2);bwin(K,6.0,base+1.0,-1.2+i*1.6,.8,1.6,PI/2);}
    B.box(3.8,base,3.04,1.4,2.3,.1,0x2a2622);F.box(3.8,base+.1,3.1,1.1,1.6,.05,0xff7a2a);B.box(3.8,base+2.3,3.05,1.7,.2,.2,COLM);
    stack(K,5.4,base+3.6,-1.6,7.4,1.0,brick,3.4);B.box(2.6,base+3.6,-1.8,.9,1.8,.9,brick);K.smoke(2.6,base+5.8,-1.8,1.8,1);
    B.cyl(-.2,base+.9,2.4,.12,1.8,0x2f3236,5);B.beam(-.2,base+2.5,2.4,3.0,base+3.0,2.4,.12,0x2f3236);
    B.sph(5.6,base,3.6,1.0,.8,1.0,SOOT,1);B.sph(4.6,base,4.0,.6,.5,.6,SOOT,1);track(K,0,base,4.2,10,PI/2);B.box(-3.6,base+.2,4.2,2.2,.6,1.0,0x7a3a2a);B.box(-1.3,base+.2,4.2,2.2,.6,1.0,0x7a3a2a);
    lamp(K,-5.6,base,3.2);lamp(K,.4,base,2.2);T.push('A tall iron-framed gasholder','Retort house with a glowing furnace door','Coal wagons on the siding');return {name:'Gasworks',r:7.5};}
  else if(vi===1){const base=BH.pad(K,5.4,5.4,0x5f5a52);K._gb=base;holder(-2.6,-2.4,2.2,2.6,2.6,8);holder(2.4,-2.6,2.2,2.4,.3,8);
    B.box(-.1,base,2.5,4.6,2.8,3.0,brick);gable(B,{x:-.1,z:2.5,top:base+2.8,len:4.6,span:3.0,k:.55,t:.2,col:K.pick(ROOF.slate),wall:brick,axis:'x',ov:.25});
    for(let i=0;i<3;i++)bwin(K,-1.5+i*1.4,base+.9,4.0,.7,1.3,0);B.box(-.1,base,4.04,1.0,1.9,.1,0x2a2622);
    stack(K,1.7,base+2.8,1.6,5.8,.7,brick,2.4);B.cyl(0,base,-.2,.35,.9,0x6a6e74,8);B.hcyl(-2.6,base+.5,-.2,.18,2.0,0x6a6e74,'x');B.hcyl(.0,base+.5,-.2,.18,3.0,0x6a6e74,'x');
    track(K,4.0,base,2.6,6,0);B.box(4.0,base+.2,1.4,1.0,.6,2.2,0x7a3a2a);B.box(4.0,base+.2,3.8,1.0,.6,2.2,0x7a3a2a);B.sph(4.0,base+.8,1.4,.5,.25,.9,SOOT,0);
    lamp(K,-4.2,base,2.6);lamp(K,2.0,base,4.4);K.flame(-2.2,base+.1,3.6,.4);
    T.push('Two telescoping gasholders, one full and one empty','A governor house for the gas pressure');return {name:'Twin Gasholders',r:7.5};}
  else{const base=BH.pad(K,5.6,4.2,0x5f5a52);
    B.box(-.4,base,.2,9.2,3.8,4.0,brick);gable(B,{x:-.4,z:.2,top:base+3.8,len:9.2,span:4.0,k:.45,t:.2,col:K.pick(ROOF.slate),wall:brick,axis:'x',ov:.3});
    B.box(-.4,base+4.2,.2,7.4,.9,1.2,brick);G.box(-.4,base+4.5,.82,7.0,.5,.04,GLASS);G.box(-.4,base+4.5,-.42,7.0,.5,.04,GLASS);B.box(-.4,base+5.0,.2,7.6,.14,1.4,0x5d6068);
    for(let i=0;i<4;i++){const x=-3.8+i*2.2;bwin(K,x,base+1.9,2.2,.9,1.1,0);B.box(x,base,2.2,.9,1.6,.08,0x2a2622);F.box(x,base+.1,2.25,.7,1.0,.05,0xff7a2a);K.flame(x,base+.1,2.6,.5);B.box(x,base+1.6,2.22,1.15,.14,.14,COLM);}
    for(const x of [-3.6,.2,3.8])stack(K,x,base+3.8,-1.5,5.6+(x===.2?1.4:0),.8,brick,2.6);
    B.beam(-4.5,base+.5,-3.4,-1.4,base+4.6,-1.4,.5,0x3a3d42,.5);for(let i=0;i<5;i++)B.cyl(-5.4+(i%2)*.4,base,-3.5+(i>>1)*.5,0,0,SOOT,3);
    B.sph(-5.0,base,-3.2,1.0,.8,1.0,SOOT,1);B.sph(-4.0,base,-3.8,.7,.6,.7,SOOT,1);B.cyl(5.5,base,-1.7,.1,.1,SOOT,3);
    K._gb=base;B.cyl(4.2,base,-2.6,1.4,.7,brick,12);B.cyl(4.2,base+.7,-2.6,1.25,1.6,0x6a6e74,12);B.cone(4.2,base+2.3,-2.6,1.25,.4,0x5d6068,12);
    for(let i=0;i<6;i++){const a=i/6*TAU;B.cyl(4.2+Math.sin(a)*1.55,base+.7,-2.6+Math.cos(a)*1.55,.08,2.1,0x2f3236,5);}
    track(K,0,base,3.8,11,PI/2);B.box(3.4,base+.2,3.8,2.2,.6,1.0,0x7a3a2a);lamp(K,-5.2,base,2.8);lamp(K,5.0,base,2.8);
    T.push('A row of glowing retorts','Three chimneys and a coke heap','A small gasholder behind');return {name:'Retort House',r:7.5};}
  }});
defBuilding({type:'warehouse',age:5,name:'Warehouse',desc:'Brick stores for goods, grain and cargo.',variants:['Dockside Warehouse','Saw-tooth Goods Shed','Grain Elevator Store'],r:6,joy:0,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const brick=K.pick(BRICK),rs=K.pick(ROOF.slate);
  if(vi===0){const base=BH.pad(K,3.4,2.6,0x5f5a52),w=6.6,d=4.8;
    B.box(0,base,0,w,7.4,d,brick);for(let i=1;i<4;i++)B.box(0,base+i*1.85,0,w+.14,.1,d+.14,COLM);
    gable(B,{x:0,z:0,top:base+7.4,len:w,span:d,k:.45,t:.2,col:rs,wall:brick,axis:'x',ov:.3});
    windowRows(K,w,d,base+.3,1.85,4,1.0,0x3a2e26,.45);
    for(let s=1;s<4;s++){B.box(0,base+s*1.85+.05,d/2+.05,1.1,1.5,.08,0x2a2622);B.box(0,base+s*1.85+1.58,d/2+.05,1.3,.12,.12,COLM);}
    B.box(0,base,d/2+.05,2.0,2.1,.1,0x2a2622);B.box(0,base+2.1,d/2+.06,2.3,.14,.14,COLM);
    B.box(1.9,base+7.4,0,.4,.5,.4,0x3a3d42);B.beam(0,base+7.1,d/2,0,base+7.1,d/2+1.7,.2,COL.woodD,.2);B.beam(0,base+8.5,d/2-.2,0,base+7.2,d/2+1.6,.1,COL.woodD);B.box(0,base+8.5,d/2-.2,.3,.3,.3,COL.woodD);
    B.box(0,base+5.6,d/2+1.65,.03,1.5,.03,0xb8a888);crate(B,0,base+4.9,d/2+1.65,.6);
    B.box(0,base+6.6,d/2+.08,3.8,.7,.05,0x2a2622);B.box(0,base+6.62,d/2+.12,3.5,.5,.04,COL.gold);
    stack(K,-2.2,base+7.4,-1.3,2.8,.8,brick,1.6);for(const [x,z] of [[2.4,3.1],[2.9,2.6],[-2.6,3.0]])barrel(B,x,base,z);crate(B,-2.0,base,3.1,.7);crate(B,-2.0,base+.7,3.1,.55,.4);crate(B,-3.2,base,3.0,.6);
    B.box(0,base,4.3,1.3,.5,2.0,COL.woodD);B.hcyl(-.7,base+.2,4.9,.28,.12,COL.woodD,'x',8);B.hcyl(.6,base+.2,4.9,.28,.12,COL.woodD,'x',8);lamp(K,3.4,base,3.4);
    T.push('Four storeys of brick under a slate roof','A hoist and loading hatches on every floor');}
  else if(vi===1){const base=BH.pad(K,5.4,3.6,0x5f5a52),w=10.2,d=5.0;
    B.box(0,base,-.4,w,3.4,d,brick);B.box(0,base+3.3,-.4,w+.14,.14,d+.14,COLM);
    for(let i=0;i<5;i++){const x=-4.08+i*2.04,tw=2.04;B.wedge(x,base+3.4,-.4,d+.2,1.5,tw,rs,PI/2);G.box(x-tw/2+.02,base+4.15,-.4,.05,1.4,d-.3,GLASS);B.box(x-tw/2,base+3.4,-.4,.1,1.5,d+.2,0x3a3d42);}
    for(let i=0;i<5;i++){bwin(K,-4+i*2,base+1.1,-2.9,.9,1.2,PI);B.box(-4+i*2,base,2.1+.0,.1,.1,.1,SOOT);}
    for(let i=0;i<3;i++){B.box(-3.4+i*3.4,base,2.14,2.2,2.3,.1,0x2a2622);B.box(-3.4+i*3.4,base+2.3,2.17,2.5,.14,.14,COLM);}
    B.box(0,base,3.4,w,.9,1.8,TRM);B.box(0,base+.9,3.4,w,.07,1.9,0x5f5a52);for(let i=0;i<6;i++)B.cyl(-4.6+i*1.84,base+.9,4.1,.07,2.2,0x2f3236,5);B.wedge(0,base+3.1,3.5,w,.45,2.0,0x3d4f5e,PI);B.box(0,base+3.05,4.2,w,.1,.12,0x2f3236);
    for(const [x,z] of [[-3.8,3.4],[-3.3,3.5],[3.4,3.4],[4.0,3.2]])crate(B,x,base+.9,z,.6);for(let i=0;i<3;i++)barrel(B,.4+i*.5,base+.9,3.2);for(let i=0;i<4;i++)sack(B,-1.4+i*.35,base+.9,3.4);
    track(K,0,base-.0,5.4,11,PI/2);B.box(-2.6,base+.35,5.4,2.6,.8,1.1,0x7a3a2a);B.box(-2.6,base+.15,5.4,2.7,.2,1.1,SOOT);stack(K,3.6,base+3.4,-2.2,3.8,.8,brick,2);lamp(K,5.3,base,4.1);
    T.push('Saw-tooth skylights for even daylight','A loading platform beside the rails');return {name:'Goods Shed',r:6.2};}
  else{const base=BH.pad(K,4.2,3.0,0x5f5a52);
    B.box(-1.2,base,0,5.6,3.8,4.6,brick);gable(B,{x:-1.2,z:0,top:base+3.8,len:5.6,span:4.6,k:.5,t:.2,col:rs,wall:brick,axis:'x',ov:.25});
    for(let i=0;i<3;i++){bwin(K,-2.6+i*1.4,base+1.2,2.3,.7,1.2,0);bwin(K,-2.6+i*1.4,base+1.2,-2.3,.7,1.2,PI);}B.box(-1.2,base,2.34,1.6,2.2,.1,0x2a2622);
    B.box(2.4,base,.0,2.6,10.4,2.6,COL.plank);for(const y of [3,6,8.6])B.box(2.4,base+y,0,2.8,.12,2.8,COL.woodD);for(const sx of [-1,1])for(const sz of [-1,1])B.box(2.4+sx*1.3,base,sz*1.3,.18,10.4,.18,COL.woodD);
    for(let i=0;i<4;i++){G.box(2.4,base+4+i*1.1,1.32,.8,.5,.05,GLASS);B.box(2.4,base+3.9+i*1.1,1.31,.95,.7,.03,COL.woodD);}
    gable(B,{x:2.4,z:0,top:base+10.4,len:2.6,span:2.6,k:.8,t:.2,col:rs,wall:COL.plank,axis:'z',ov:.25});B.box(2.4,base+12.2,0,.5,.7,.5,SOOT);
    B.beam(2.4,base+9.2,-.4,-1.6,base+3.9,-.4,.4,COL.woodD,.5);B.box(-1.2,base+3.7,-.4,3.0,.5,.7,COL.woodD);
    B.cone(.6,base,2.6,.5,.0,TRM,6);B.box(2.4,base,2.0,1.4,.7,1.1,COL.woodD);B.cone(2.4,base+.7,2.0,.6,.5,0x5d6068,6);B.box(2.4,base,3.1,1.8,.2,1.0,0x3a3d42);
    for(let i=0;i<5;i++)sack(B,-.2+i*.4,base,3.2+(i%2)*.3);B.box(3.7,base,3.3,1.5,.6,.9,COL.woodD);B.hcyl(3.0,base+.15,3.8,.26,.1,COL.woodD,'x',8);B.hcyl(4.2,base+.15,3.8,.26,.1,COL.woodD,'x',8);
    stack(K,-3.2,base+3.8,-1.3,3.0,.7,brick,1.5);lamp(K,.6,base,3.2);
    T.push('A timber elevator tower above the shed','Sacks of grain waiting to be loaded');return {name:'Grain Elevator',r:6};}
  return {name:['Warehouse','Goods Shed','Grain Elevator'][vi],r:6};}});
defBuilding({type:'bank',age:5,name:'Bank',desc:'Vaults, ledgers and loans for the growing town.',variants:['Classical Bank','Palazzo Bank','Gothic Revival Bank'],r:5,joy:0,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const wl=K.pick(STONE),rs=K.pick(ROOF.slate);
  if(vi===0){const base=BH.pad(K,4.4,3.3,0x6f6a62);
    B.box(0,base,-.4,8,4.6,5.2,wl);B.box(0,base+4.5,-.4,8.4,.3,5.6,COLM);B.box(0,base+4.8,-.4,8.0,.35,5.2,wl);
    for(let i=0;i<4;i++)for(const x of [-3.2,3.2]){if(i>1)continue;bwin(K,x+(x>0?-i*1.0:i*1.0)*1.0,base+1.5,2.2,.8,1.8,0);}
    for(let i=0;i<3;i++){bwin(K,-3.4,base+1.5,-3.0,.8,1.8,PI);bwin(K,3.4,base+1.5,-3.0,.8,1.8,PI);}
    for(const s of [-1,1])for(let i=0;i<3;i++)bwin(K,s*4.0,base+1.5,-2+i*1.7,.8,1.8,s*PI/2);
    for(let i=0;i<4;i++)B.cyl(-1.8+i*1.2,base,3.0,.24,4.0,COLM,8);B.box(0,base+4.0,3.0,5.2,.4,1.4,COLM);B.prism(0,base+4.4,3.0,1.4,1.3,5.2,wl,PI/2);
    for(let i=0;i<3;i++)B.box(0,base-.0+0,3.9+i*.0,3.4+0,.1+i*.0,.6,TRM);B.box(0,base,3.4,5.2,.25,1.7,TRM);B.box(0,base,3.9,4.6,.15,.8,COLM);
    B.box(0,base,2.6,1.4,2.6,.1,0x2a2622);B.box(0,base+2.6,2.65,1.7,.14,.14,COLM);B.box(0,base+3.5,3.72,3.4,.4,.1,COL.gold);
    B.cyl(0,base+4.9,-.4,2.0,.7,wl,10);B.sph(0,base+5.5,-.4,2.1,1.4,2.1,rs,1);B.cyl(0,base+6.8,-.4,.45,.6,COLM,6);B.cone(0,base+7.4,-.4,.6,.8,rs,6);for(let i=0;i<8;i++){const a=i/8*TAU;G.box(Math.sin(a)*2.02,base+5.3,-.4+Math.cos(a)*2.02,.3,.4,.06,GLASS,a);}
    K.flag(0,base+8.1,-.4,K.pick(BANNER),1.1,2.0);lamp(K,-2.8,base,4.4);lamp(K,2.8,base,4.4);
    T.push('Columned portico and a copper dome','Iron-bound vault doors','Gas lamps at the steps');return {name:'Classical Bank',r:5.2};}
  else if(vi===1){const base=BH.pad(K,3.6,3.0,0x6f6a62);
    B.box(0,base,0,7,6.8,5.0,wl);for(let i=0;i<5;i++)B.box(0,base+i*.0+.6+i*1.3,2.55,7.1,.04+.0,.02,TRM);
    B.box(0,base+2.4,0,7.3,.16,5.3,COLM);B.box(0,base+4.6,0,7.2,.14,5.2,COLM);B.box(0,base+6.8,0,8.0,.4,5.8,COLM);B.box(0,base+7.2,0,7.6,.35,5.4,wl);
    for(let i=0;i<9;i++){B.cyl(-3.6+i*.9,base+7.5,2.45,.07,.5,COLM,5);B.cyl(-3.6+i*.9,base+7.5,-2.45,.07,.5,COLM,5);}B.box(0,base+8.0,2.45,7.4,.08,.14,COLM);B.box(0,base+8.0,-2.45,7.4,.08,.14,COLM);
    B.cone(0,base+7.5,0,4.0,.9,rs,4,PI/4);
    for(let i=0;i<4;i++){const x=-2.55+i*1.7;if(Math.abs(x)<.4)continue;lan(K,x,base+.6,2.5,.6,1.3,0);}
    for(const x of [-2.6,-.9,.9,2.6]){bwin(K,x,base+2.9,2.5,.7,1.3,0);bwin(K,x,base+5.1,2.5,.7,1.3,0);}
    for(const s of [-1,1])for(const z of [-1.2,1.2]){bwin(K,s*3.5,base+1.2,z,.7,1.4,s*PI/2);bwin(K,s*3.5,base+3.3,z,.7,1.3,s*PI/2);bwin(K,s*3.5,base+5.4,z,.7,1.3,s*PI/2);}
    door(K,0,base,2.5,1.3,2.0,0,0x2a2622);B.box(0,base+2.5,3.0,2.2,.15,1.0,COLM);for(const s of [-1,1])B.cyl(s*.9,base,3.0,.14,2.5,COLM,6);B.box(0,base+2.65,3.0,2.2,.07,.9,0x2f3236);
    for(let i=0;i<7;i++)B.box(-.9+i*.3,base+2.65,3.5,.05,.4,.05,0x2f3236);
    tower(K,{x:-3.3,z:-2.3,w:1.8,base,h:10.2,wall:wl,top:'spire',sh:2.6,rc:rs,noLow:true,wy:.8});G.box(-3.3,base+7.6,-1.38,.7,.7,.04,0xf2ecd8);
    lamp(K,-2.2,base,4.1);lamp(K,2.2,base,4.1);K.flag(0,base+8.5,0,K.pick(BANNER),1.1,2.0);T.push('A palazzo of banded stone and heavy cornices','A clock-topped corner campanile');return {name:'Palazzo Bank',r:5.2};}
  else{const base=BH.pad(K,3.7,3.4,0x6f6a62),br=K.pick(BRICK);
    B.box(0,base,0,6.6,4.6,6.0,br);for(let i=0;i<5;i++)B.box(0,base+.6+i*.85,0,6.7,.14,6.1,COLM);gable(B,{x:0,z:0,top:base+4.6,len:6.0,span:6.6,k:1.25,t:.22,col:rs,wall:br,axis:'z',ov:.25});
    for(let i=0;i<4;i++)B.box(0,base+4.7+i*.85,3.02,6.0-i*1.5,.14,.06,COLM);
    lan(K,-1.7,base+1.6,3.0,.8,2.0,0);lan(K,1.7,base+1.6,3.0,.8,2.0,0);rose(K,0,base+5.0,3.0,.8,0);for(const s of [-1,1])for(const z of [-1.5,1.5]){lan(K,s*3.3,base+1.6,z,.6,1.7,s*PI/2);lan(K,s*3.3,base+4.2,z,.5,1.1,s*PI/2);}
    door(K,0,base,3.0,1.2,2.1,0,0x2a2622);B.hcyl(0,base+1.2,3.12,.3,.1,0x6a6e74,'z',10);B.box(0,base+3.1,3.1,2.4,.5,.1,COL.gold);
    B.cyl(3.4,base,2.9,.8,5.2,br,8);B.cone(3.4,base+5.2,2.9,1.1,3.2,rs,8);lan(K,3.4+0,base+3.6,2.9+.78,.35,1.0,0);B.box(3.4,base+8.4,2.9,.08,.7,.08,COL.gold);
    B.cyl(-3.4,base,2.9,.8,3.4,br,8);B.cone(-3.4,base+3.4,2.9,1.1,2.2,rs,8);
    stack(K,-1.6,base+4.6,-1.8,2.6,.8,br,1.6);K.flag(-3.4,base+5.6,2.9,K.pick(BANNER),1.0,1.6);lamp(K,-1.8,base,4.2);lamp(K,1.8,base,4.2);
    T.push('Banded brick and stone with pointed arches','A great round vault door','Turrets topped with spires');return {name:'Gothic Revival Bank',r:5.2};}
  }});
defBuilding({type:'post_office',age:5,name:'Post Office',desc:'Letters and telegrams cross the land in a day.',variants:['Mail Coach Office','Sorting Office','Corner Post Office'],r:5,joy:0,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const brick=K.pick(BRICK),rs=K.pick(ROOF.slate);
  const pillar=(x,y,z)=>{B.cyl(x,y,z,.3,1.1,BANNER[0],8);B.cyl(x,y+1.1,z,.34,.1,SOOT,8);B.cone(x,y+1.2,z,.3,.2,SOOT,8);B.box(x,y+.65,z+.3,.28,.07,.04,SOOT);};
  if(vi===0){const base=BH.pad(K,3.9,2.8,0x5f5a52),w=7.4,d=4.4;
    B.box(0,base,-.2,w,3.6,d,brick);B.box(0,base+3.5,-.2,w+.14,.14,d+.14,COLM);gable(B,{x:0,z:-.2,top:base+3.6,len:w,span:d,k:.6,t:.2,col:rs,wall:brick,axis:'x',ov:.3});
    for(let i=0;i<3;i++){const x=-2.6+i*2.6;if(i===1)continue;bwin(K,x,base+1.0,2.0,.9,1.5,0);}door(K,0,base,2.0,1.2,2.0,0,0x2a2622);board(K,0,base+2.8,2.1,3.0,.6,0,COL.gold);B.box(0,base,2.4,1.6,.2,.6,COLM);
    for(const s of [-1,1])for(let i=0;i<2;i++)bwin(K,s*3.7,base+1.0,-1+i*1.6,.8,1.5,s*PI/2);for(let i=0;i<3;i++)bwin(K,-2.4+i*2.4,base+1.0,-2.4,.8,1.5,PI);
    B.box(2.6,base+3.6,-.2,1.2,1.4,1.2,brick);B.cone(2.6,base+5.0,-.2,1.1,1.3,rs,4,PI/4);for(const a of [0,PI]){B.hcyl&&B.put('cyl:12:1',2.6+Math.sin(a)*.62,base+4.3,-.2+Math.cos(a)*.62,.4,.08,.4,0xefe6cc,PI/2,a,0);}
    chim(K,-2.6,base+3.8,-1.0,1.5,brick,1.4);pillar(-3.9+0,base,3.3);
    B.box(3.0,base,3.4,2.4,.6,1.0,SOOT);B.box(3.0,base+.6,3.4,1.5,.8,.95,0x7a3a2a);B.box(3.0,base+1.4,3.4,1.6,.08,1.0,SOOT);for(const dz of [-.55,.55])for(const dx of [-.8,.8]){B.hcyl(3.0+dx-.04,base+.3,3.4+dz,.34,.1,COL.woodD,'x',8);}
    B.box(4.3,base,3.4,.25,.8,.6,COL.woodD);B.box(4.3,base+.4,3.9,.15,.06,.8,COL.woodD);lamp(K,-1.8,base,3.5);lamp(K,.0,base,3.5);K.flag(0,base+5.0,-.2,K.pick(BANNER),1.0,1.6);
    T.push('A brick post office with a clock turret','Red pillar box and a waiting mail coach');return {name:'Post Office',r:5};}
  else if(vi===1){const base=BH.pad(K,4.6,2.8,0x5f5a52);
    B.box(0,base,0,9,5.2,4.6,brick);B.box(0,base+2.55,0,9.15,.12,4.75,COLM);B.box(0,base+5.1,0,9.3,.2,4.9,COLM);B.cone(0,base+5.2,0,6.4,1.6,rs,4,PI/4);
    for(let i=0;i<5;i++){const x=-3.4+i*1.7;bwin(K,x,base+3.1,2.3,.8,1.5,0);bwin(K,x,base+3.1,-2.3,.8,1.5,PI);if(i!==2)bwin(K,x,base+.8,2.3,.8,1.5,0);}
    for(const s of [-1,1])for(let i=0;i<2;i++){bwin(K,s*4.5,base+.8,-.8+i*1.6,.8,1.5,s*PI/2);bwin(K,s*4.5,base+3.1,-.8+i*1.6,.8,1.5,s*PI/2);}
    door(K,0,base,2.3,1.5,2.0,0,0x2a2622);B.box(0,base+2.1,2.4,2.0,.5,.1,COL.gold);B.box(0,base,2.8,2.6,.2,.8,COLM);
    for(const [x,z] of [[-3.7,3.2],[-3.1,3.4]])B.sph(x,base+.2,z,.35,.25,.3,COL.canvas,0);B.box(3.3,base,3.2,1.3,.5,.8,COL.woodD);B.hcyl(2.8,base+.1,3.7,.25,.1,COL.woodD,'x',8);B.hcyl(3.7,base+.1,3.7,.25,.1,COL.woodD,'x',8);for(let i=0;i<3;i++)B.box(3.1+i*.3,base+.5,3.2,.25,.25,.3,COL.canvas);
    B.cyl(-5.4,base,.8,.12,9.6,COL.woodD,6);B.box(-5.4,base+8.6,.8,1.6,.12,.12,COL.woodD);B.box(-5.4,base+7.6,.8,1.2,.1,.1,COL.woodD);
    for(const dx of [-.7,0,.7]){B.cyl(-5.4+dx,base+8.7,.8,.05,.25,0xefe6cc,4);}for(const dx of [-.5,.5]){B.cyl(-5.4+dx,base+7.7,.8,.05,.25,0xefe6cc,4);}
    wire(K,-5.9,base+8.9,.8,-4.2,base+4.2,2.0);wire(K,-4.9,base+8.9,.8,-4.2,base+4.0,2.0);wire(K,-5.4,base+7.9,.8,-4.2,base+4.0,2.0);
    pillar(1.9,base,4.0);stack(K,2.8,base+5.0,-.8,2.8,.7,brick,1.8);lamp(K,-1.6,base,3.6);lamp(K,2.8,base,4.4);K.flag(0,base+6.8,0,K.pick(BANNER),1.0,1.6);
    T.push('Night-shift sorting rooms with lit windows','Telegraph pole with wires to the roof');return {name:'Sorting Office',r:5.4};}
  else{const base=BH.pad(K,3.9,3.9,0x5f5a52);
    B.box(-1.2,base,-1.0,5.6,3.8,3.6,brick);B.box(1.2,base,1.6,3.6,3.8,5.0,brick);B.box(-1.2,base+3.7,-1.0,5.8,.14,3.8,COLM);B.box(1.2,base+3.7,1.6,3.8,.14,5.2,COLM);
    gable(B,{x:-1.2,z:-1.0,top:base+3.8,len:5.6,span:3.6,k:.55,t:.2,col:rs,axis:'x',ov:.25});gable(B,{x:1.4,z:1.6,top:base+3.8,len:5.0,span:3.6,k:.55,t:.2,col:rs,wall:brick,axis:'z',ov:.25});
    B.cyl(-2.5,base,1.6,1.3,5.4,brick,10);B.cyl(-2.5,base+5.3,1.6,1.5,.2,COLM,10);B.cone(-2.5,base+5.5,1.6,1.6,2.4,rs,10);B.sph(-2.5,base+7.9,1.6,.15,.15,.15,COL.gold,0);
    for(const a of [PI/2,PI/4*3,PI/4*5,0,PI]){const s=Math.sin(a),c2=Math.cos(a);bwin(K,-2.5+s*1.28,base+1.2,1.6+c2*1.28,.6,1.3,a);bwin(K,-2.5+s*1.28,base+3.2,1.6+c2*1.28,.6,1.1,a);}
    for(let i=0;i<3;i++){bwin(K,3.0,base+1.2,.3+i*1.6,.8,1.5,PI/2);bwin(K,-.2+i*1.4,base+1.2,4.15,.8,1.5,0);}
    door(K,1.2,base,4.1,1.3,2.0,0,0x2a2622);board(K,1.2,base+2.9,4.2,2.0,.5,0,COL.gold);
    B.cyl(-1.2,base+4.8,-1.0,.06,3.6,COL.woodD,5);for(let i=0;i<3;i++)B.box(-1.2,base+7.8-i*.8,-1.0,1.4-i*.25,.08,.08,COL.woodD);
    const sem=K.sub();sem.box(0,0,0,1.3,.14,.1,0x8e2f1f);sem.box(0,.0,0,.12,.5,.1,SOOT);K.anim(sem,'swing',-1.2,base+8.2,-1.0);
    wire(K,-1.2,base+8.4,-1.0,-2.5,base+7.0,1.6);pillar(3.6,base,4.0);pillar(-3.8,base,3.2);chim(K,.4,base+3.8,-2.2,1.6,brick,1.4);lamp(K,-.8,base,4.6);lamp(K,3.6,base,2.6);K.flag(-2.5,base+8.0,1.6,K.pick(BANNER),1.0,1.6);
    T.push('Corner turret with a clock-bell cap','A signal mast with moving arms on the roof');return {name:'Corner Post Office',r:5.2};}
  }});
defBuilding({type:'tram_depot',age:5,name:'Tram Depot',desc:'Trams are housed, repaired and sent out along the streets.',variants:['Brick Tram Barn','Horse-tram Stables','Iron Shed and Turntable'],r:7,joy:0,
 gen:(b,c,K,vi)=>{const {B,G}=K,T=K.traits;const brick=K.pick(BRICK),rs=K.pick(ROOF.slate);
  if(vi===0){const base=BH.pad(K,4.6,5.6,0x5f5a52),w=8.4,d=6.2;
    B.box(0,base,-1.8,w,4.2,d,brick);B.box(0,base+4.1,-1.8,w+.14,.14,d+.14,COLM);gable(B,{x:0,z:-1.8,top:base+4.2,len:w,span:d,k:.4,t:.2,col:rs,wall:brick,axis:'x',ov:.3});
    B.box(0,base+4.6,-1.8,w*.6,.9,1.3,brick);G.box(0,base+4.9,-1.12,w*.55,.5,.04,GLASS);G.box(0,base+4.9,-2.48,w*.55,.5,.04,GLASS);B.box(0,base+5.5,-1.8,w*.62,.14,1.5,0x5d6068);
    for(let i=0;i<3;i++){const x=-2.7+i*2.7;B.box(x,base,1.32,2.1,3.0,.1,0x2a2622);B.prism(x,base+3.0,1.32,.1,.7,2.1,0x2a2622,PI/2);B.box(x,base+3.0,1.36,2.4,.16,.14,COLM);G.box(x,base+.3,1.28,1.8,1.6,.04,0x6a5a40);}
    for(const s of [-1,1])for(let i=0;i<2;i++){bwin(K,s*4.2,base+1.6,-3.4+i*2.6,.8,1.4,s*PI/2);}for(let i=0;i<4;i++)bwin(K,-3.0+i*2,base+1.6,-4.9,.8,1.4,PI);
    for(let i=0;i<3;i++)track(K,-2.7+i*2.7,base,3.4,4.8,0);
    tram(K,0,base+.05,3.9,0,0x8e2f1f,3.0);
    for(const x of [-4.4,4.4]){B.cyl(x,base,3.6,.08,4.1,0x2f3236,5);B.beam(x,base+4.0,3.6,x*.6,base+4.1,3.6,.07,0x2f3236);}wire(K,-2.6,base+4.1,3.6,2.6,base+4.1,3.6);
    stack(K,3.2,base+4.2,-3.2,4.6,.8,brick,1.8);B.box(0,base+3.5,1.4,5.6,.55,.08,0x2a2622);B.box(0,base+3.5,1.43,5.3,.4,.04,COL.gold);lamp(K,-4.6,base,3.0);sack(B,4.2,base,2.0);barrel(B,4.3,base,2.6);
    T.push('Three arched bays for the trams','A red tram on the line outside','Overhead wires on iron poles');}
  else if(vi===1){const base=BH.pad(K,5.4,4.6,0x6f6a62),pl=K.pick(PLASTER);
    B.box(0,base,-3.2,10,3.8,2.8,brick);gable(B,{x:0,z:-3.2,top:base+3.8,len:10,span:2.8,k:.7,t:.2,col:K.pick(ROOF.tile),wall:brick,axis:'x',ov:.3});
    for(const s of [-1,1]){B.box(s*4.4,base,.0,1.4,3.2,6.4,brick);gable(B,{x:s*4.4,z:0,top:base+3.2,len:6.4,span:1.4,k:.9,t:.2,col:K.pick(ROOF.tile),wall:brick,axis:'z',ov:.2});
      for(let i=0;i<3;i++){B.box(s*3.68,base,-1.8+i*1.8,.08,2.1,1.0,COL.woodD);B.box(s*3.68,base+1.0,-1.8+i*1.8,.1,.06,1.0,SOOT);}for(let i=0;i<3;i++)bwin(K,s*5.1,base+1.6,-1.8+i*1.8,.7,1.0,s*PI/2);}
    for(let i=0;i<4;i++){const x=-3.0+i*2;B.box(x,base,-1.8,1.6,2.8,.08,COL.woodD);B.box(x,base+1.4,-1.78,1.5,.07,.06,SOOT);B.prism(x,base+2.8,-1.8,.1,.6,1.6,COL.woodD,PI/2);}
    B.box(0,base+3.8,-1.8,.0,.0,.0,brick);B.box(0,base+4.0,-4.6,1.8,2.4,1.8,brick);B.cone(0,base+6.4,-4.6,1.4,1.5,rs,4,PI/4);G.box(0,base+5.3,-3.68,.7,.7,.04,0xf2ecd8);K.flag(0,base+7.9,-4.6,K.pick(BANNER),1.0,1.6);
    B.box(0,base,0,0,0,0,brick);track(K,0,base,.8,7,0);tram(K,-.8,base+.05,1.2,0,0x3d5a80,2.4);
    const hx=2.2,hz=1.4;B.box(hx,base+.7,hz,.5,.5,1.3,0x6a4a2e);B.box(hx,base+1.2,hz+.75,.3,.4,.4,0x6a4a2e);B.box(hx,base+1.5,hz+.9,.2,.2,.3,0x4a3020);for(const dx of [-.15,.15])for(const dz of [-.5,.5])B.box(hx+dx,base,hz+dz,.1,.7,.1,0x4a3020);
    B.sph(-3.8,base+.5,2.3,1.2,.8,1.0,COL.hay,1);B.box(-3.8,base,2.3,.5,.1,.5,COL.hay);B.box(3.4,base,3.2,1.6,.3,.5,COL.woodD);B.box(3.4,base+.3,3.2,1.4,.05,.3,COL.water);barrel(B,4.4,base,3.0);
    B.box(-.0,base,3.4,.12,2.4,.12,COL.woodD);B.box(-.0,base+2.3,3.4,2.0,.2,.1,COL.woodD);board(K,0,base+2.1,3.4,1.8,.5,0,COL.gold);
    chim(K,-3.6,base+3.8,-3.8,1.6,brick,1.4);lamp(K,-4.8,base,3.6);lamp(K,4.8,base,3.6);
    T.push('A stable yard for the tram horses','A hay stack and a water trough');}
  else{const base=BH.pad(K,5.2,5.0,0x5f5a52);
    B.box(0,base,-1.4,7.0,2.6,7.0,brick);B.cyl(0,base+2.6,-1.4,0,0,brick,3);
    B.put('cyl:14:1',-3.5,base+2.6,-1.4,2.4,7.0,2.4,0x5d6068,0,0,-PI/2);for(let i=0;i<8;i++){B.box(-3.2+i*.88,base+2.6,-1.4,.07,2.45,6.9,0x6a6e74);}
    G.box(0,base+4.2,2.12,5.0,.4,.04,GLASS);
    for(const s of [-1,1]){B.box(s*3.55,base,-1.4,.14,3.6,6.4,brick);}B.box(0,base,2.14,5.0,2.4,.1,0x2a2622);B.put('cyl:14:1',0,base+2.4,2.08,2.6,.1,2.0,0x2a2622,PI/2,0,0);G.put('cyl:14:1',0,base+2.4,2.12,2.3,.04,1.7,0x6a5a40,PI/2,0,0);
    for(let i=0;i<4;i++)bwin(K,-2.4+i*1.6,base+1.2,-4.9,.8,1.2,PI);stack(K,3.6,base+2.6,-4.3,5.2,.8,brick,2.2);
    B.cyl(3.4,base,3.6,.1,.0,SOOT,3);for(const [x,z] of [[-4.0,2.2],[-3.0,2.2]])B.cyl(x,base,z,.2,.0,SOOT,3);
    const wx=-3.8,wz=-5.2;for(const [dx,dz] of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]])B.beam(wx+dx,base,wz+dz,wx+dx*.8,base+4.6,wz+dz*.8,.12,0x6a6e74,.1);
    B.cyl(wx,base+4.6,wz,1.2,1.7,0x9a8a70,10);B.cone(wx,base+6.3,wz,1.3,.7,0x5d6068,10);
    const tx=-.6,tz=4.1;B.cyl(tx,base,tz,1.9,.05,0x2f3236,16);B.box(tx,base+.05,tz,.1,.1,3.6,0x6a6e74);B.box(tx,base+.05,tz,3.6,.1,.1,0x6a6e74);track(K,tx,base+.05,tz,3.6,0);tram(K,tx,base+.1,tz,0,0x3d5a80,2.8);
    for(const z of [-.05])B.cyl(tx,base,tz,.15,.3,SOOT,6);lamp(K,3.8,base,3.6);lamp(K,-4.4,base,3.6);B.box(4.2,base,1.4,.8,.5,.6,COL.hay);
    T.push('A long barrel-vaulted iron shed','A turntable to swing the tram round','Water tower on iron legs');return {name:'Iron Tram Shed',r:7};}
  return {name:['Tram Depot','Horse-tram Depot','Iron Tram Shed'][vi],r:7};}});
//END
}
