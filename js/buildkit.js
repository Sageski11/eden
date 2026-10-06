'use strict';
// ================================================================ geometry builder (merges primitives into one vertex-coloured mesh)
const TPL={};
const MATC=new Map();function regM(list,id){for(const c of list)MATC.set(c,id);}
const MATAUTO=new Map();
function autoMat(h){let m=MATAUTO.get(h);if(m!==undefined)return m;const r=((h>>16)&255)/255,g=((h>>8)&255)/255,b=(h&255)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,sat=mx-mn;let hue=0;
  if(sat>1e-3){if(mx===r)hue=((g-b)/sat+6)%6;else if(mx===g)hue=(b-r)/sat+2;else hue=(r-g)/sat+4;}hue*=60;
  if(mx>.96&&sat<.25)m=0;                                   // glows / whites (glass, light)
  else if(l<.17)m=10;                                        // iron, black fittings
  else if(sat<.075&&l<.82)m=(b>r+.02&&l<.45)?5:2;              // greys -> dressed stone (blue-grey dark -> slate)
  else if(hue>=70&&hue<=170&&sat>.12)m=11;                   // greens: foliage, crops, moss
  else if(hue>=190&&hue<=260&&sat>.14)m=7;                   // blue/green painted woodwork (shutters, doors)
  else if((hue<20||hue>330)&&sat>.35&&l>.3)m=9;              // saturated reds: banners, cloth
  else if(hue>=38&&hue<62&&sat>.28&&l>.45)m=3;               // straw / hay yellows
  else if(hue>=15&&hue<55&&l<.47)m=7;                        // browns: timber
  else if(hue>=15&&hue<55&&l<.6)m=8;                         // light browns: planks
  else if(l>=.6&&sat<.35)m=9;                                // pale beige: canvas / linen
  else m=2;
  MATAUTO.set(h,m);return m;}
function _shade(h,f){const r=(Math.min(255,Math.round(((h>>16)&255)*f))<<16)|(Math.min(255,Math.round(((h>>8)&255)*f))<<8)|Math.min(255,Math.round((h&255)*f));const m=MATC.get(h);if(m&&!MATC.has(r))MATC.set(r,m);return r;}
function triGeo(tris){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(tris.flat(),3));return g;}
function tpl(key){
  if(TPL[key])return TPL[key];
  const [kind,a,b]=key.split(':');let g;
  if(kind==='box'){g=new THREE.BoxGeometry(1,1,1);g.translate(0,.5,0);}
  else if(kind==='cyl'){g=new THREE.CylinderGeometry(+b,1,1,+a);g.translate(0,.5,0);}
  else if(kind==='cone'){g=new THREE.ConeGeometry(1,1,+a);g.translate(0,.5,0);}
  else if(kind==='sph'){g=new THREE.IcosahedronGeometry(1,+a);}
  else if(kind==='prism'){const A=[-.5,0,-.5],B=[.5,0,-.5],C=[.5,0,.5],D=[-.5,0,.5],E=[-.5,1,0],F=[.5,1,0];
    g=triGeo([A,F,B,A,E,F,D,C,F,D,F,E,A,D,E,B,F,C,A,B,C,A,C,D]);}
  else if(kind==='wedge'){const A=[-.5,0,-.5],B=[.5,0,-.5],C=[.5,0,.5],D=[-.5,0,.5],E=[-.5,1,-.5],F=[.5,1,-.5];
    g=triGeo([A,E,F,A,F,B,D,C,F,D,F,E,A,D,E,B,F,C,A,B,C,A,C,D]);}
  if(g.index)g=g.toNonIndexed();
  return TPL[key]=g.attributes.position.array;
}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,'YXZ'),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0),_d=new THREE.Vector3();
class Builder{
  constructor(rng,jit=.07){this.p=[];this.c=[];this.m=[];this.mt=null;this.rng=rng||Math.random;this.jit=jit;}
  _emit(key,col){const p=tpl(key),e=_m.elements;
    let r,g,b;if(Array.isArray(col)){[r,g,b]=col;}else{r=((col>>16)&255)/255;g=((col>>8)&255)/255;b=(col&255)/255;}
    const f=1+(this.rng()-.5)*2*this.jit;r*=f;g*=f;b*=f;const mid=this.mt!=null?this.mt:(Array.isArray(col)?0:(MATC.has(col)?MATC.get(col):autoMat(col)));
    for(let i=0;i<p.length;i+=3){const x=p[i],y=p[i+1],z=p[i+2];
      this.p.push(e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]);this.c.push(r,g,b);this.m.push(mid);}}
  put(key,x,y,z,sx,sy,sz,col,rx=0,ry=0,rz=0){_e.set(rx,ry,rz,'YXZ');_q.setFromEuler(_e);_m.compose(_v.set(x,y,z),_q,_s.set(sx,sy,sz));this._emit(key,col);}
  tri(a,b,c,col,mid){let r,g,bb;if(Array.isArray(col)){[r,g,bb]=col;}else{r=((col>>16)&255)/255;g=((col>>8)&255)/255;bb=(col&255)/255;}
    const m=mid!=null?mid:(this.mt!=null?this.mt:(Array.isArray(col)?0:(MATC.has(col)?MATC.get(col):autoMat(col))));
    for(const p of [a,b,c]){this.p.push(p[0],p[1],p[2]);this.c.push(r,g,bb);this.m.push(m);}}
  quad(a,b,c,d,col,mid){this.tri(a,b,c,col,mid);this.tri(a,c,d,col,mid);}
  box(x,y,z,sx,sy,sz,col,ry=0){this.put('box',x,y,z,sx,sy,sz,col,0,ry,0);}
  boxC(x,y,z,sx,sy,sz,col,rx=0,ry=0,rz=0){_e.set(rx,ry,rz,'YXZ');_d.set(0,-sy/2,0).applyEuler(_e);this.put('box',x+_d.x,y+_d.y,z+_d.z,sx,sy,sz,col,rx,ry,rz);}
  cyl(x,y,z,r,h,col,seg=8,top=1){this.put('cyl:'+seg+':'+top,x,y,z,r,h,r,col);}
  cone(x,y,z,r,h,col,seg=8,ry=0){this.put('cone:'+seg,x,y,z,r,h,r,col,0,ry,0);}
  sph(x,y,z,rx,ry,rz,col,det=0){this.put('sph:'+det,x,y,z,rx,ry,rz,col);}
  prism(x,y,z,sx,sy,sz,col,ry=0){this.put('prism',x,y,z,sx,sy,sz,col,0,ry,0);}
  wedge(x,y,z,sx,sy,sz,col,ry=0){this.put('wedge',x,y,z,sx,sy,sz,col,0,ry,0);}
  hcyl(x,y,z,r,len,col,axis='x',seg=7){if(axis==='x')this.put('cyl:'+seg+':1',x+len/2,y,z,r,len,r,col,0,0,PI/2);else this.put('cyl:'+seg+':1',x,y,z-len/2,r,len,r,col,PI/2,0,0);}
  beam(x1,y1,z1,x2,y2,z2,t,col,t2){_d.set(x2-x1,y2-y1,z2-z1);const L=_d.length();if(L<1e-4)return;_d.divideScalar(L);_q.setFromUnitVectors(_up,_d);
    _m.compose(_v.set(x1,y1,z1),_q,_s.set(t,L,t2==null?t:t2));this._emit('box',col);}
  mesh(mat,shadow=true){if(this.ao&&this.p.length){let mn=1e9;for(let i=1;i<this.p.length;i+=3)if(this.p[i]<mn)mn=this.p[i];const base=this.aoBase!=null?this.aoBase:mn;
      for(let i=0,v=0;i<this.p.length;i+=3,v++){const y=this.p[i+1]-base;const f=.74+.26*Math.min(1,Math.max(0,(y+.15)/1.4));this.c[v*3]*=f;this.c[v*3+1]*=f;this.c[v*3+2]*=f;}this.ao=false;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));if(this.m.some(v=>v))g.setAttribute('aM',new THREE.BufferAttribute(new Uint8Array(this.m),1));g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.castShadow=shadow;m.receiveShadow=shadow;return m;}
}
const matB=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.86,metalness:0});
// procedural surface materials: plaster, ashlar stone, thatch, clay tile, slate, shingle, timber, planks — colour + bump, no textures needed
const SURF_GLSL=`
float sh1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float svn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sh1(i),sh1(i+vec2(1.,0.)),f.x),mix(sh1(i+vec2(0.,1.)),sh1(i+1.),f.x),f.y);}
float surf(float id,vec3 wp,vec3 n,inout vec3 col,inout float rough){
 vec3 t=abs(n.y)>.96?vec3(1.,0.,0.):normalize(cross(vec3(0.,1.,0.),n));vec3 b=cross(n,t);
 vec2 uv=vec2(dot(wp,t),dot(wp,b));float fw=length(fwidth(uv));float det=1.-smoothstep(.035,.16,fw);float h=0.;
 if(id<1.5){float m=svn(uv*1.2)*.55+svn(uv*4.3)*.3+svn(uv*14.)*.15;col*=.88+.2*m;col*=1.-.12*smoothstep(.55,.9,svn(uv*.7+7.))*smoothstep(.0,1.,-b.y+.5);h=m*.25;rough=.93;}
 else if(id<2.5){vec2 s=vec2(.6,.32);float row=floor(uv.y/s.y);vec2 q=vec2(uv.x/s.x+mod(row,2.)*.5+sh1(vec2(row,1.))*.2,uv.y/s.y);vec2 c=floor(q),f=fract(q);
  float r=sh1(c);col*=.8+.32*r;col*=.92+.16*svn(uv*7.);float e=min(min(f.x,1.-f.x)*s.x,min(f.y,1.-f.y)*s.y);float mo=1.-smoothstep(.012,.035,e);
  col=mix(col,col*.55+vec3(.07,.065,.06),mo*det);h=(1.-mo)*.7+svn(uv*11.)*.15+smoothstep(.0,.08,e)*.2;rough=.88;
  col=mix(col,col*vec3(.72,.82,.6),smoothstep(.68,.92,svn(uv*1.1+vec2(4.,9.)))*.5);col*=.9+.1*smoothstep(0.,1.,sh1(c+7.));}
 else if(id<3.5){float course=fract(uv.y/.3);float st=svn(vec2(uv.x*34.,uv.y*2.2))*.6+svn(vec2(uv.x*85.,uv.y*4.))*.4;
  col*=.74+.4*st*det+.2*(1.-det);col*=.82+.18*smoothstep(0.,.3,course);col=mix(col,col*vec3(.8,.85,.72),smoothstep(.6,.9,svn(uv*1.5))*.5);h=st*.55+smoothstep(0.,.4,course)*.45;rough=.97;}
 else if(id<4.5){float ry=uv.y/.25;float row=floor(ry);float fy=fract(ry);float u2=uv.x/.2+row*.5;float fx=fract(u2);
  float bar=sin(fx*3.14159);col*=.76+.3*bar*det+.15*(1.-det);col*=1.-.38*(1.-smoothstep(0.,.2,fy))*det;col*=.88+.24*sh1(vec2(floor(u2),row));col=mix(col,col*vec3(.75,.8,.7),smoothstep(.65,.95,svn(uv*1.3))*.45);
  h=bar*.65+smoothstep(0.,.22,fy)*.35;rough=.72;}
 else if(id<6.5){bool sl=id<5.5;vec2 s=sl?vec2(.32,.19):vec2(.24,.21);float row=floor(uv.y/s.y);vec2 q=vec2(uv.x/s.x+mod(row,2.)*.5+sh1(vec2(row,3.))*.25,uv.y/s.y);vec2 c=floor(q),f=fract(q);
  float r=sh1(c);col*=.78+.36*r;float ed=1.-smoothstep(0.,.14,f.y);float sd=1.-smoothstep(.0,.07,min(f.x,1.-f.x));col*=1.-(.42*ed+.28*sd)*det;
  if(!sl)col*=.86+.26*svn(vec2(q.x*3.,uv.y*38.));h=f.y*.6+(1.-sd)*.4;rough=sl?.55:.85;}
 else if(id>8.5&&id<9.5){vec2 q=uv*vec2(22.,22.);float wx=sin(q.x*3.14159)*sin(q.y*1.5708),wy=sin(q.y*3.14159)*sin(q.x*1.5708);float weave=(wx*wx-wy*wy)*.5+.5;float detW=1.-smoothstep(.012,.04,fw);
  float st=svn(uv*1.7)*.6+svn(uv*5.)*.4;float fold=svn(vec2(uv.x*2.2,uv.y*.35));col*=.9+.1*weave*detW;col*=.88+.18*st;col*=.86+.22*fold;col=mix(col,col*vec3(.82,.76,.66),smoothstep(.62,.9,svn(uv*.9+3.))*.55);
  float seam=1.-smoothstep(0.,.03,abs(fract(uv.x/.9)-.5)*.9);col*=1.-.18*seam*det;h=weave*.2*detW+st*.3+fold*.5;rough=.96;}
 else if(id>9.5&&id<10.5){float sc=svn(vec2(uv.x*40.,uv.y*3.))*.5+svn(uv*12.)*.5;col*=.75+.5*sc;col=mix(col,vec3(.42,.26,.16),smoothstep(.62,.85,svn(uv*3.+9.))*.45);h=sc*.4;rough=.42+.3*sc;}
 else if(id>10.5&&id<11.5){float f1=svn(uv*6.),f2=svn(uv*19.);col*=.72+.38*f1*det+.2*(1.-det);col*=.88+.2*f2;col=mix(col,col*vec3(1.15,1.1,.75),smoothstep(.7,.9,f2)*.4);h=f1*.6+f2*.4;rough=.9;}
 else{vec2 g=abs(n.y)>.7?uv.yx:uv;float gr=svn(vec2(g.x*20.,g.y*1.3))*.6+svn(vec2(g.x*55.,g.y*2.6))*.4;col*=.8+.3*gr;h=gr*.3;rough=.8;
  if(id>7.5){float pl=fract(g.x/.23);float se=1.-smoothstep(0.,.06,min(pl,1.-pl));col*=1.-.45*se*det;h+=(1.-se)*.6;}
  else{col*=.92+.12*svn(g*vec2(3.,.4));}}
 return h*det;}
`;
function surfInject(mat){mat.onBeforeCompile=sh=>{
  sh.vertexShader='attribute float aM;varying float vM;varying vec3 vSW;\n'+sh.vertexShader.replace('#include <fog_vertex>','#include <fog_vertex>\nvM=aM;vSW=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.uniforms.uCT=CLOUDU.uCT;sh.uniforms.uCS=CLOUDU.uCS;
  sh.fragmentShader='varying float vM;varying vec3 vSW;\n'+SURF_GLSL+CLOUDSH+sh.fragmentShader
   .replace('#include <color_fragment>','#include <color_fragment>\nfloat sRough=roughness;float sH=0.;vec3 sWN=normalize(cross(dFdx(vSW),dFdy(vSW)));if(dot(sWN,cameraPosition-vSW)<0.)sWN=-sWN;\nif(vM>.5){sH=surf(vM,vSW,sWN,diffuseColor.rgb,sRough);}diffuseColor.rgb*=cloudShade(vSW);')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(vM>.5)roughnessFactor=sRough;')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(vM>.5){float hh=sH*.035;vec3 dpx=dFdx(-vViewPosition),dpy=dFdy(-vViewPosition);vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float dt=dot(dpx,r1);vec3 gr=sign(dt)*(dFdx(hh)*r1+dFdy(hh)*r2);normal=normalize(abs(dt)*normal-gr);}');};
  mat.customProgramCacheKey=()=>'surf';return mat;}
surfInject(matB);
function cloneB(m){const c=m.clone();if(m.onBeforeCompile&&m.customProgramCacheKey&&m.customProgramCacheKey()==='surf')surfInject(c);return c;}
const matGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:0x2b2620});
const matFire=new THREE.MeshBasicMaterial({vertexColors:true});
const matGhost=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,transparent:true,opacity:.62,emissive:0x1f5a1f,emissiveIntensity:.55,depthWrite:false});
const matGhostBad=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,transparent:true,opacity:.55,emissive:0x8a1010,emissiveIntensity:.9,depthWrite:false});

// ================================================================ palette
const COL={beam:0x4a3020,beamD:0x3a2516,door:0x4b2f1c,stoneF:0x857d70,stoneD:0x6f685e,iron:0x3a3d42,wood:0x7a5634,woodD:0x5a3d26,woodL:0x9a7448,plank:0x8a7356,hay:0xd2b45a,canvas:0xd8cdb0,soil:0x6b5236,leaf:0x4f7a35,water:0x3f7f96,gold:0xd4a73c,dark:0x2a2018};
const PLASTER=[0xeadfc4,0xf2e8d2,0xe4cfa6,0xdcc8a2,0xe8d6b8,0xefe2c6];
const TOWN_UP=[0xe2c9a0,0xd8b48e,0xc7cdb8,0xe6d5b4,0xcfae8a,0xd9c2a8,0xb9c4c9,0xe3c4b0];
const STONE=[0x8f897d,0x9c9486,0x857f74,0xa59c8b];
const ROOF={thatch:[0xb39558,0xa88b4f,0xbf9f61,0x9e8550],tile:[0xa5492f,0x9a3f2a,0xb35a3a,0x8c3b25,0xa8563a],slate:[0x4f5866,0x5a6170,0x474e5a],shingle:[0x6e4c30,0x5f432b,0x7a5638,0x66503a]};
const SHUT=[0x3d6b4a,0x8b3a2a,0x3b5675,0x6b4a2e,0x5c6b3a,0x7a5a2a];
const BANNER=[0x8e2f1f,0x2f4a8e,0x2f6b3a,0x6b2f6b];
regM(PLASTER,1);regM(TOWN_UP,1);regM(STONE,2);regM([COL.stoneF,COL.stoneD],2);regM(ROOF.thatch,3);regM([COL.hay],3);regM(ROOF.tile,4);regM(ROOF.slate,5);regM(ROOF.shingle,6);regM([COL.beam,COL.beamD,COL.wood,COL.woodD,COL.woodL,COL.door],7);regM([COL.plank],8);regM([0x8a6440,0x7a5632,0x9a7448,0x6d4a2d,0x7a5232,0xa08060,0x9a7a52,0x5a3d26,0x6a4a2a,0x6b4a2e,0x8a6a40],7);regM([0x7a756c,0x9a8f7c,0x9a9283,0x6f6558,0x8a8478,0x9a9486,0xb8b0a0],2);

// ================================================================ kit: per-building generation helpers
function makeKit(b,ctx){
  const rng=mulberry(b.seed*9973+b.type.length*131);
  const cs=Math.cos(b.rot),sn=Math.sin(b.rot);
  const toW=(lx,lz)=>[b.x+lx*cs+lz*sn,b.z-lx*sn+lz*cs];
  const K={rng,B:new Builder(rng),G:new Builder(rng,0),F:new Builder(rng,0),anims:[],emitters:[],traits:[],toW,
    pick:a=>a[Math.floor(rng()*a.length)],
    gh:(lx,lz)=>{const p=toW(lx,lz);return hAt(p[0],p[1]);},
    wd:(lx,lz)=>{const p=toW(lx,lz);return wAt(p[0],p[1]);},
    rect(hw,hd,ox=0,oz=0){let mn=1e9,mx=-1e9;const nx=Math.max(2,Math.ceil(hw*2)),nz=Math.max(2,Math.ceil(hd*2));
      for(let a=0;a<=nx;a++)for(let c=0;c<=nz;c++){const h=K.gh(ox-hw+a*2*hw/nx,oz-hd+c*2*hd/nz);if(h<mn)mn=h;if(h>mx)mx=h;}return [mn,mx];},
    rectWater(hw,hd,ox=0,oz=0){let mx=null;const nx=Math.max(2,Math.ceil(hw*2)),nz=Math.max(2,Math.ceil(hd*2));
      for(let a=0;a<=nx;a++)for(let c=0;c<=nz;c++){const lx=ox-hw+a*2*hw/nx,lz=oz-hd+c*2*hd/nz,w=K.wd(lx,lz);if(w>.1){const s=K.gh(lx,lz)+w;if(mx==null||s>mx)mx=s;}}return mx;},
    sub:()=>new Builder(rng,.05),
    smoke:(x,y,z,rate=1,dark=0)=>K.emitters.push({x,y,z,rate,dark}),
    anim:(builder,type,x,y,z,o={})=>K.anims.push(Object.assign({builder,type,x,y,z,ph:rng()*10},o)),
    flame(x,y,z,s=1){const f=new Builder(rng,0);
      for(let i=0;i<5;i++){const a=i/5*TAU+rng(),d=(.08+rng()*.1)*s,h=(.55+rng()*.45)*s;f.put('cone:5',Math.sin(a)*d,0,Math.cos(a)*d,.16*s,h,.16*s,i%2?0xff6a12:0xff8a20,(rng()-.5)*.35,a,(rng()-.5)*.35);}
      f.cone(0,0,0,.3*s,.95*s,0xff7a1a,7);f.cone(0,.02,0,.19*s,.72*s,0xffc040,6);f.cone(0,.04,0,.09*s,.45*s,0xfff2b0,5);
      for(let i=0;i<7;i++){const a=rng()*TAU,d=(.15+rng()*.25)*s;f.sph(Math.sin(a)*d,.03,Math.cos(a)*d,.06*s,.035*s,.06*s,rng()<.5?0xff4a10:0xffa030,0);}
      K.anim(f,'flame',x,y,z,{fire:true});
      const B=K.B;for(let i=0;i<4;i++){const a=i/4*TAU+.4;B.beam(x+Math.sin(a)*.42*s,y+.02,z+Math.cos(a)*.42*s,x-Math.sin(a)*.05*s,y+.32*s,z-Math.cos(a)*.05*s,.09*s,i%2?0x3a2616:0x4a3020);}
      K.G.sph(x,y+.01,z,.32*s,.04,.32*s,0xff6a20,0);},
    flag(x,y,z,col,len=1,pole=2){K.B.box(x,y,z,.07,pole,.07,0x5a4a3a);const f=K.sub();f.box(0,-len*.62,len/2,.04,len*.6,len,col);f.box(0,-len*.42,len*.55,.05,len*.15,len*.25,COL.gold);K.anim(f,'flag',x,y+pole,z,{base:rng()*TAU});}
  };
  return K;
}
// gable roof with sloped slabs, gable fill and ridge cap. axis 'x' => ridge along x
function gable(B,o){
  const ov=o.ov==null?.35:o.ov,t=o.t==null?.2:o.t,k=o.k;
  const D=o.span+2*ov,hr=k*o.span/2,a=Math.atan(k),L=(D/2)/Math.cos(a)+.04;
  const eA=o.eA==null?ov:o.eA,eB=o.eB==null?ov:o.eB,rl=o.len+eA+eB,off=(eB-eA)/2;
  const yE=o.top-k*ov,mid=(yE+o.top+hr)/2,nx=Math.sin(a)*t/2,ny=Math.cos(a)*t/2;
  const cap=o.cap==null?o.col:o.cap;
  if(o.rows&&o.t<.3){const n=Math.max(3,Math.round(L/.34));const sh=_shade(o.col,.82);for(let i=1;i<n;i++){const f=i/n;const along=D/2*f,yy=yE+(o.top+hr-yE)*(1-f)+(Math.cos(a)*t)+.012;
      if(o.axis!=='z'){B.boxC(o.x+off,yy,o.z+along,rl,.035,.07,sh,a,0,0);B.boxC(o.x+off,yy,o.z-along,rl,.035,.07,sh,-a,0,0);}
      else{B.boxC(o.x+along,yy,o.z+off,.07,.035,rl,sh,0,0,-a);B.boxC(o.x-along,yy,o.z+off,.07,.035,rl,sh,0,0,a);}}}
  if(o.barge){const bc=o.barge;for(const e of [-1,1]){if((e<0&&o.eA===0)||(e>0&&o.eB===0))continue;const ex=e<0?-o.len/2-eA+.02:o.len/2+eB-.02;
      for(const sd of [-1,1]){const n=6;for(let i=0;i<n;i++){const f0=i/n,f1=(i+.5)/n;const p=f=>[ex,yE+(o.top+hr-yE)*f+t*.6,sd*(D/2)*(1-f)];
        const A=p(f0),C2=p(f1);if(o.axis!=='z'){B.beam(o.x+A[0]*1,A[1],o.z+A[2],o.x+C2[0],C2[1]-.12,o.z+C2[2],.06,bc,.05);}else{B.beam(o.x+A[2],A[1],o.z+A[0],o.x+C2[2],C2[1]-.12,o.z+C2[0],.05,bc,.06);}}}
      if(o.finial){if(o.axis!=='z')B.cone(o.x+ex,o.top+hr+t*.9,o.z,.07,.45,bc,6);else B.cone(o.x,o.top+hr+t*.9,o.z+ex,.07,.45,bc,6);}}}
  if(o.axis!=='z'){
    B.boxC(o.x+off,mid+ny,o.z+D/4+nx,rl,t,L,o.col,a,0,0);B.boxC(o.x+off,mid+ny,o.z-D/4-nx,rl,t,L,o.col,-a,0,0);
    if(o.wall!=null)B.prism(o.x,o.top-.01,o.z,o.len-.02,hr,o.span,o.wall);
    B.boxC(o.x+off,o.top+hr+t*.75,o.z,rl+.02,.16,.26,cap,0,0,0);
  }else{
    B.boxC(o.x+D/4+nx,mid+ny,o.z+off,L,t,rl,o.col,0,0,-a);B.boxC(o.x-D/4-nx,mid+ny,o.z+off,L,t,rl,o.col,0,0,a);
    if(o.wall!=null)B.prism(o.x,o.top-.01,o.z,o.len-.02,hr,o.span,o.wall,PI/2);
    B.boxC(o.x,o.top+hr+t*.75,o.z+off,.26,.16,rl+.02,cap,0,0,0);
  }
  return hr;
}
function win(K,x,y,z,f,ax,sh){const {B,G}=K;
  if(ax==='z'){B.box(x,y-.08,z+f*.02,.6,.72,.06,COL.beamD);G.box(x,y,z+f*.05,.42,.52,.04,0xffffff);
    if(sh!=null){B.box(x-.37,y-.01,z+f*.05,.2,.56,.04,sh);B.box(x+.37,y-.01,z+f*.05,.2,.56,.04,sh);}B.box(x,y-.13,z+f*.08,.68,.07,.14,0x9a8f7c);}
  else{B.box(x+f*.02,y-.08,z,.06,.72,.6,COL.beamD);G.box(x+f*.05,y,z,.04,.52,.42,0xffffff);
    if(sh!=null){B.box(x+f*.05,y-.01,z-.37,.04,.56,.2,sh);B.box(x+f*.05,y-.01,z+.37,.04,.56,.2,sh);}B.box(x+f*.08,y-.13,z,.14,.07,.68,0x9a8f7c);}
}
function timberFrame(K,ox,oz,w,dd,y,SH,attL,attR,bc){
  const B=K.B,hw=w/2,hd=dd/2,t=.12;
  for(const f of [1,-1]){const zf=oz+f*(hd+.025);
    B.box(ox,y,zf,w+.02,t,.06,bc);B.box(ox,y+SH-t,zf,w+.02,t,.06,bc);B.box(ox,y+SH*.46,zf,w,t*.8,.06,bc);
    const n=Math.max(2,Math.round(w/1.05));for(let i=0;i<=n;i++)B.box(ox-hw+i*w/n,y,zf,t,SH,.07,bc);
    const pw=w/n;B.beam(ox-hw+.06,y+.1,zf,ox-hw+pw-.06,y+SH*.46,zf,.08,bc);B.beam(ox+hw-.06,y+.1,zf,ox+hw-pw+.06,y+SH*.46,zf,.08,bc);}
  for(const f of [-1,1]){if((f<0&&attL)||(f>0&&attR))continue;const xf=ox+f*(hw+.025);
    B.box(xf,y,oz,.06,t,dd+.02,bc);B.box(xf,y+SH-t,oz,.06,t,dd+.02,bc);B.box(xf,y,oz,.07,SH,t,bc);
    B.box(xf,y,oz-hd,.07,SH,t,bc);B.box(xf,y,oz+hd,.07,SH,t,bc);
    B.beam(xf,y+.1,oz-hd+.08,xf,y+SH*.6,oz-.08,.08,bc);B.beam(xf,y+.1,oz+hd-.08,xf,y+SH*.6,oz+.08,.08,bc);}
}
// generic hall: foundation / stilts, storeys, frame, windows, door, roof
function buildHall(K,o){
  const {B,rng}=K;const ox=o.ox||0,oz=o.oz||0,w=o.w,d=o.d,hw=w/2,hd=d/2,st=o.st,SH=o.sh||1.9;
  const [gMin,gMax]=K.rect(hw+.2,hd+.2,ox,oz);
  let base=gMax+.18,stilts=false;
  if(o.waterTop!=null&&o.waterTop>gMin-.05){base=Math.max(base,o.waterTop+.6);stilts=true;}
  if(stilts){B.box(ox,base-.24,oz,w+1.3,.24,d+1.3,COL.plank);
    for(const px of [-hw-.55,0,hw+.55])for(const pz of [-hd-.55,0,hd+.55]){if(px===0&&pz===0)continue;const g=K.gh(ox+px,oz+pz);B.cyl(ox+px,g-.5,oz+pz,.13,base-g+.3,COL.woodD,6);}
    for(const f of [1,-1]){B.box(ox,base+.55,oz+f*(hd+.6),w+1.3,.07,.07,COL.wood);B.box(ox+f*(hw+.6),base+.55,oz,.07,.07,d+1.3,COL.wood);}
  }else B.box(ox,gMin-.6,oz,w+.24,base-gMin+.6,d+.24,o.found||COL.stoneF);
  const doorX=o.doorX!=null?o.doorX:(w>3.6?(rng()<.5?-1:1)*w*.2:0);
  let y=base,dTop=d;
  for(let s=0;s<st;s++){
    const dd=d+(o.jetty&&s>0?.55:0),hd2=dd/2;
    const ground=s===0&&o.groundCol!=null,col=ground?o.groundCol:o.wallCol;
    if(o.style==='log'){B.box(ox,y,oz,w-.12,SH,dd-.12,0x4e3522);const n=Math.round(SH/.31);
      for(let L=0;L<n;L++){const yy=y+.16+L*SH/n,c=(L&1)?0x7a5232:0x6d4a2d;
        B.hcyl(ox,yy,oz+hd2-.12,.17,w+.3,c,'x');B.hcyl(ox,yy,oz-hd2+.12,.17,w+.3,c,'x');
        if(!o.attL)B.hcyl(ox-hw+.12,yy+.08,oz,.17,dd+.3,c,'z');if(!o.attR)B.hcyl(ox+hw-.12,yy+.08,oz,.17,dd+.3,c,'z');}}
    else B.box(ox,y,oz,w,SH,dd,col);
    if(o.frame&&!ground)timberFrame(K,ox,oz,w,dd,y,SH,o.attL,o.attR,o.beam||COL.beam);
    if(o.quoins&&(ground||!o.frame)){for(const cx of [-1,1])for(const cz of [-1,1]){if((cx<0&&o.attL)||(cx>0&&o.attR))continue;
      for(let L=0;L<Math.floor(SH/.38);L++){const lg=(L&1)?.5:.3;B.box(ox+cx*(hw-lg/2+.03),y+L*.38,oz+cz*(hd2-.15+.03),lg,.34,.3,0xb3ab9a);}}}
    const n=Math.max(1,Math.floor(w/1.3)),wy=y+.8;
    for(const f of [1,-1])for(let i=0;i<n;i++){const px=-hw+(i+.5)*w/n;if(s===0&&f===1&&Math.abs(px-doorX)<.75)continue;win(K,ox+px,wy,oz+f*hd2,f,'z',o.shut);}
    if(!o.attL&&!o.noSideWin)win(K,ox-hw,wy,oz,-1,'x',o.shut);if(!o.attR&&!o.noSideWin)win(K,ox+hw,wy,oz,1,'x',o.shut);
    if(o.jetty&&s<st-1)B.box(ox,y+SH-.14,oz,w+.04,.18,d+.62,COL.beamD);
    if(o.boxes&&s>0)for(let i=0;i<n;i++){const px=ox-hw+(i+.5)*w/n;B.box(px,wy-.42,oz+hd2+.16,.6,.2,.2,0x4a5a2a);for(let q=0;q<3;q++)B.sph(px-.2+q*.2,wy-.17,oz+hd2+.17,.09,.07,.09,K.pick([0xc0392b,0xd4a73c,0x9b59b6,0xe8e0d0]));}
    y+=SH;dTop=dd;
  }
  B.box(ox+doorX,base,oz+hd+.02,.84,1.45,.09,o.doorCol||COL.door);
  B.box(ox+doorX,base+1.45,oz+hd+.03,1.02,.15,.12,o.groundCol!=null||o.quoins?0xb5ad9c:COL.beamD);
  const gF=K.gh(ox+doorX,oz+hd+.7);
  if(!stilts&&base-gF>.22){const n=Math.min(6,Math.ceil((base-gF)/.24));for(let i=0;i<n;i++)B.box(ox+doorX,gF-.2,oz+hd+.3+i*.3,1.0,base-gF+.2-i*(base-gF)/n,.32,0x9a9283);}
  const cw=o.cw==null?5:o.cw,cs=o.cs==null?5:o.cs;
  const hr=gable(B,{x:ox,z:oz,top:y,len:w,span:dTop,k:o.pitch||.85,t:o.roofT||.2,col:o.roofCol,wall:o.gableCol==null?o.wallCol:o.gableCol,ov:o.ov,eA:o.attL?0:undefined,eB:o.attR?0:undefined,cap:o.capCol,
    rows:cw>=2,barge:cw>=3&&o.style!=='log'?(o.bargeCol||0x5a3a22):null,finial:cw>=4});
  // craft details
  if(cw>=2&&o.style!=='log'){for(let s=0;s<st;s++){const n=Math.max(1,Math.floor(w/1.3)),wy=base+s*SH+.8,dd=d+(o.jetty&&s>0?.55:0);
    for(const f of [1,-1])for(let i=0;i<n;i++){const px=-hw+(i+.5)*w/n;if(s===0&&f===1&&Math.abs(px-doorX)<.75)continue;K.B.box(ox+px,wy-.27,oz+f*(dd/2+.07),.035,.52,.02,COL.beamD);K.B.box(ox+px,wy-.02,oz+f*(dd/2+.07),.42,.035,.02,COL.beamD);}}}
  if(cw>=3&&o.jetty&&st>1)for(let i=0;i<=Math.round(w/1.1);i++){const px=ox-hw+i*w/Math.round(w/1.1);for(const f of [1,-1])K.B.beam(px,base+SH-.55,oz+f*(d/2+.02),px,base+SH-.12,oz+f*(d/2+.28),.09,COL.beamD);}
  if(cw>=4&&st>=2&&!o.noDormer){const dx=ox+(o.attR?-w*.18:w*.18),dz=oz+dTop/2-.15,dy=y+hr*.12;K.B.box(dx,dy,dz-.35,1.0,.95,.9,o.wallCol);win(K,dx,dy+.45,dz+.1,1,'z',o.shut);gable(K.B,{x:dx,z:dz-.35,top:dy+.95,len:.9,span:1.0,k:1,t:.1,col:o.roofCol,wall:o.wallCol,axis:'z',ov:.12});}
  if(cs>=4&&!stilts){K.B.hcyl(ox+doorX,base+1.45,oz+hd+.06,.46,.12,o.groundCol!=null?0xb5ad9c:0x9a9283,'z');}
  if(cs>=2&&!stilts){const fh=base-gMin;if(fh>.35)for(let yy=gMin+.1;yy<base-.05;yy+=.32){K.B.box(ox,yy,oz+hd+.125,w+.26,.025,.02,0x6a645a);K.B.box(ox,yy,oz-hd-.125,w+.26,.025,.02,0x6a645a);}}
  if(o.frame&&!o.attL&&!o.attR){for(const f of [-1,1]){if(o.style!=='log')K.B.box(ox+f*(hw+.03),y,oz,.07,hr*.92,.12,o.beam||COL.beam);}}
  return {base,top:y,hr,dTop,gMin,gMax,stilts,doorX};
}
function boat(K,x,y,z,ang){const B=K.B;loftHull(B,x,y-.02,z,2.3,.95,ang,0x6b4a2e);
  const dx=Math.sin(ang),dz=Math.cos(ang);B.boxC(x,y+.3,z,.75,.05,.2,COL.woodL,0,ang,0);B.boxC(x-dx*.6,y+.28,z-dz*.6,.6,.05,.2,COL.woodL,0,ang,0);
  B.beam(x+dz*.3,y+.4,z-dx*.3,x+dz*.2-dx*.9,y+.42,z-dx*.2-dz*.9,.05,COL.woodL);B.beam(x-dz*.3,y+.4,z+dx*.3,x-dz*.2-dx*.9,y+.42,z+dx*.2-dz*.9,.05,COL.woodL);
  B.boxC(x+dx*.5,y+.12,z+dz*.5,.35,.18,.3,0x8a7a5a,0,ang+.3,0);}
function dock(K,c,start,maxLen,T){
  const wl=c.wLocal,ang=Math.atan2(wl.x,wl.z);const len=clamp(c.waterDist+3-start*.4,3,9);
  let dy=c.waterLevel+.32;const gs=K.gh(wl.x*start,wl.z*start);if(gs+.12>dy)dy=gs+.12;
  const cx=wl.x*(start+len/2),cz=wl.z*(start+len/2);
  K.B.boxC(cx,dy,cz,1.15,.12,len,COL.plank,0,ang,0);
  for(let s=0;s<=len;s+=1.6){const px=wl.x*(start+s),pz=wl.z*(start+s);const ox=wl.z*.55,oz=-wl.x*.55;
    for(const f of [-1,1]){const g=K.gh(px+ox*f,pz+oz*f);K.B.cyl(px+ox*f,g-.4,pz+oz*f,.08,dy-g+.65,COL.woodD,5);}}
  const e=start+len-.9;boat(K,wl.x*e+wl.z*1.05,c.waterLevel-.12,wl.z*e-wl.x*1.05,ang);
  T.push('Fishing dock','Rowboat moored');
}
function makeWheel(Bw,r,wd,axis){
  const n=10,P=(a,rr,o)=>axis==='x'?[o,Math.cos(a)*rr,Math.sin(a)*rr]:[Math.cos(a)*rr,Math.sin(a)*rr,o];
  for(const o of [-wd/2,wd/2]){for(let i=0;i<n;i++){const a=i/n*TAU,a2=(i+1)/n*TAU;Bw.beam(...P(a,r,o),...P(a2,r,o),.13,COL.wood);}
    for(let i=0;i<n/2;i++){const a=i/n*TAU;Bw.beam(...P(a,r,o),...P(a+PI,r,o),.1,COL.woodD);}}
  Bw.hcyl(0,0,0,.22,wd+.5,COL.woodD,axis);
  for(let i=0;i<n;i++){const a=(i+.5)/n*TAU;const p1=P(a,r-.4,0),p2=P(a,r+.22,0);
    if(axis==='x')Bw.beam(...p1,...p2,wd,COL.woodL,.07);else Bw.beam(...p1,...p2,.07,COL.woodL,wd);}
}
function makeSails(Bs,L){
  for(let k=0;k<4;k++){const a=k*PI/2+PI/4,dx=Math.sin(a),dy=Math.cos(a),px=Math.cos(a),py=-Math.sin(a);
    const at=(q,w,z)=>[dx*q+px*w,dy*q+py*w,z];
    Bs.beam(0,0,0,dx*L,dy*L,0,.14,COL.woodD,.14);                       // stock / whip
    const q0=.75,q1=L-.08,W=.95;
    for(const w of [.06,W]){const a0=at(q0,w,.07),a1=at(q1,w,.07);Bs.beam(a0[0],a0[1],a0[2],a1[0],a1[1],a1[2],.045,COL.wood);}  // hemlath & leading rail
    const NB=9;for(let s=0;s<=NB;s++){const q=q0+s*(q1-q0)/NB;const a0=at(q,-.12,.07),a1=at(q,W+.03,.07);Bs.beam(a0[0],a0[1],a0[2],a1[0],a1[1],a1[2],.04,COL.wood);}  // sail bars
    const ls=[.32,.62];for(const w of ls){const a0=at(q0,w,.07),a1=at(q1,w,.07);Bs.beam(a0[0],a0[1],a0[2],a1[0],a1[1],a1[2],.025,COL.woodD);}  // laths
    // billowing canvas, partly reefed on alternate sails
    const reef=k%2?.72:1,NU=6,NW=3,cq1=q0+(q1-q0)*reef;
    for(let i=0;i<NU;i++)for(let j=0;j<NW;j++){const u0=q0+i*(cq1-q0)/NU,u1=q0+(i+1)*(cq1-q0)/NU,w0=.08+j*(W-.12)/NW,w1=.08+(j+1)*(W-.12)/NW;
      const bz=(u,w)=>-.02-Math.sin((u-q0)/(cq1-q0)*PI)*Math.sin((w-.08)/(W-.12)*PI)*.14;
      const P0=at(u0,w0,bz(u0,w0)),P1=at(u1,w0,bz(u1,w0)),P2=at(u1,w1,bz(u1,w1)),P3=at(u0,w1,bz(u0,w1));const c=_shade(0xe6dac0,.95+((i+j)%2)*.04);
      Bs.quad(P0,P1,P2,P3,c,9);Bs.quad(P0,P3,P2,P1,c,9);}
    if(reef<1){for(let r=0;r<3;r++){const q=cq1+.05+r*.07;const a0=at(q,.08,.02),a1=at(q,W-.04,.02);Bs.beam(a0[0],a0[1],a0[2],a1[0],a1[1],a1[2],.07,0xd8ccb0);}}}
  Bs.hcyl(0,0,-.3,.3,.75,COL.woodD,'z');Bs.hcyl(0,0,.42,.16,.12,COL.iron,'z');
}
// ================================================================ detailed tents (sagging canvas, poles, ridge, flaps, guy ropes, pegs)
function _rotP(x,z,ang){const c=Math.cos(ang),s=Math.sin(ang);return [x*c+z*s,-x*s+z*c];}
function ridgeTent(K,x,g,z,len,ht,wid,col,ang,o={}){const B=K.B,rng=K.rng;B.mt=9;const hw=wid/2,hl=len/2;
  const P=(lx,ly,lz)=>{const [rx,rz]=_rotP(lx,lz,ang);return [x+rx,g+ly,z+rz];};
  const hem=_shade(col,.72),inner=_shade(col,.55),dark=0x2a2018;
  const NU=6,NV=3;// along length, down the slope
  const sag=(u,v)=>-Math.sin(u*PI)*Math.sin(v*PI)*.09*ht-(v>.98?0:0);
  for(const side of [-1,1]){
    for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const u0=i/NU,u1=(i+1)/NU,v0=j/NV,v1=(j+1)/NV;
      const pt=(u,v)=>{const lx=-hl+u*len,yy=ht*(1-v)+sag(u,v)*(1),lz=side*hw*v+side*sag(u,v)*.4;return P(lx,yy,lz);};
      const c=j===NV-1?hem:_shade(col,.97+((i*7+j*3)%3)*.015);
      if(side>0)B.quad(pt(u0,v0),pt(u0,v1),pt(u1,v1),pt(u1,v0),c);else B.quad(pt(u0,v0),pt(u1,v0),pt(u1,v1),pt(u0,v1),c);}}
  // back wall (closed) and front (door flaps tied open)
  const back=[P(-hl,0,-hw),P(-hl,0,hw),P(-hl,ht,0)];B.tri(back[0],back[1],back[2],_shade(col,.9));B.tri(back[0],back[2],back[1],inner);
  const f0=P(hl,0,-hw),f1=P(hl,0,hw),ft=P(hl,ht,0);
  if(o.closed){B.tri(f0,ft,f1,_shade(col,.9));}
  else{const fa=P(hl+.18,0,-hw*.62),fb=P(hl+.18,0,hw*.62),fm=P(hl+.05,ht*.55,0);
    B.tri(f0,ft,fa,_shade(col,.86));B.tri(f0,fa,ft,inner);B.tri(f1,fb,ft,_shade(col,.86));B.tri(f1,ft,fb,inner);
    B.tri(P(hl-.04,0,-hw*.62),P(hl-.04,0,hw*.62),P(hl-.04,ht*.55,0),dark,0);B.tri(P(hl-.04,0,-hw*.62),P(hl-.04,ht*.55,0),P(hl-.04,0,hw*.62),dark,0);
    const tie=P(hl+.2,ht*.45,-hw*.52),tie2=P(hl+.2,ht*.45,hw*.52);B.beam(tie[0],tie[1]-.03,tie[2],tie[0],tie[1]+.03,tie[2],.05,0x6a5a40);B.beam(tie2[0],tie2[1]-.03,tie2[2],tie2[0],tie2[1]+.03,tie2[2],.05,0x6a5a40);}
  B.mt=null;
  // poles & ridge
  for(const e of [-1,1]){const a=P(e*(hl+.12),0,0),b2=P(e*(hl+.12),ht+.22,0);B.beam(a[0],a[1]-.1,a[2],b2[0],b2[1],b2[2],.07,COL.woodD);}
  {const a=P(-hl-.18,ht+.03,0),b2=P(hl+.18,ht+.03,0);B.beam(a[0],a[1],a[2],b2[0],b2[1],b2[2],.06,COL.wood);}
  // guy ropes and pegs
  for(const e of [-1,1])for(const side of [-1,1]){const top=P(e*(hl*.8),ht*.42,side*hw*.58),peg=P(e*(hl*.9+.25),0,side*(hw+.75));const gp=hAt(peg[0],peg[2]);
    B.beam(top[0],top[1],top[2],peg[0],gp+.08,peg[2],.016,0xb8a888);B.boxC(peg[0],gp+.08,peg[2],.05,.22,.05,COL.woodD,.2,ang,0);}
  {const a=P(hl+.12,ht+.2,0),pg=P(hl+1.1,0,0),gp=hAt(pg[0],pg[2]);B.beam(a[0],a[1],a[2],pg[0],gp+.08,pg[2],.016,0xb8a888);B.boxC(pg[0],gp+.08,pg[2],.05,.22,.05,COL.woodD);}
  // bedroll / clutter inside the door
  if(!o.closed&&rng()<.7){const r=P(hl-.5,.06,0);B.boxC(r[0],r[1],r[2],.5,.12,.9,K.pick([0x7a3a2a,0x5a6a3a,0x6a5a7a]),0,ang,0);}
  if(o.patch){const pp=P(-hl*.3,ht*.55,hw*.52);B.boxC(pp[0],pp[1],pp[2],.36,.03,.3,_shade(col,.8),.6,ang,0);}}
function bellTent(K,x,g,z,r,ht,col,trim,ang){const B=K.B;const N=12;const wallH=ht*.28,top=g+ht;B.mt=9;
  const pt=(i,y,rr)=>{const a=ang+i/N*TAU;return [x+Math.sin(a)*rr,y,z+Math.cos(a)*rr];};
  for(let i=0;i<N;i++){const i1=i+1;const am=(i+.5);
    // wall
    const c=_shade(col,.9+((i%2)?.06:0));B.quad(pt(i,g,r),pt(i1,g,r),pt(i1,g+wallH,r),pt(i,g+wallH,r),c);
    // roof with sag between ribs
    const mid=pt(am,g+wallH+(ht-wallH)*.45,r*.5);
    B.tri(pt(i,g+wallH,r),pt(i1,g+wallH,r),mid,col);B.tri(pt(i,g+wallH,r),mid,[x,top,z],col);B.tri(pt(i1,g+wallH,r),[x,top,z],mid,_shade(col,.96));
    // scalloped valance
    const vm=pt(am,g+wallH-.22,r+.04);B.tri(pt(i,g+wallH+.02,r+.05),vm,pt(i1,g+wallH+.02,r+.05),trim);}
  // door opening
  B.mt=null;const d0=pt(-.5,g,r+.02),d1=pt(.5,g,r+.02),dt=pt(0,g+wallH*1.9,r*.83);B.tri(d0,dt,d1,0x221a12,0);
  B.beam(x,g-.1,z,x,top+.55,z,.08,COL.woodD);B.sph(x,top+.58,z,.07,.07,.07,COL.gold);
  for(let i=0;i<N;i+=2){const p0=pt(i,g+wallH,r),pg=pt(i,g,r+1.1);const gp=hAt(pg[0],pg[2]);B.beam(p0[0],p0[1],p0[2],pg[0],gp+.06,pg[2],.015,0xb8a888);B.box(pg[0],gp-.05,pg[2],.05,.18,.05,COL.woodD);}}
function wagonCover(K,x,y,z,len,wid,col,ang){const B=K.B;const N=7,NA=6;
  const P=(lx,ly,lz)=>{const [rx,rz]=_rotP(lx,lz,ang);return [x+rx,y+ly,z+rz];};
  for(let i=0;i<N;i++)for(let j=0;j<NA;j++){const u0=-len/2+i/N*len,u1=-len/2+(i+1)/N*len,a0=j/NA*PI,a1=(j+1)/NA*PI;const sg=(i%2)?.0:.04;
    const q=(u,a,s)=>P(u,Math.sin(a)*(wid*.55-s),Math.cos(a)*(wid/2-s*.5));
    const cc=_shade(col,.93+(j%2)*.05);B.quad(q(u0,a0,0),q(u0,a1,0),q(u1,a1,sg),q(u1,a0,sg),cc,9);B.quad(q(u0,a0,0),q(u1,a0,sg),q(u1,a1,sg),q(u0,a1,0),cc,9);}
  for(let i=0;i<=N;i+=N){for(let j=0;j<NA;j++){const a0=j/NA*PI,a1=(j+1)/NA*PI,u=-len/2+i/N*len;const p0=P(u,Math.sin(a0)*wid*.55,Math.cos(a0)*wid/2),p1=P(u,Math.sin(a1)*wid*.55,Math.cos(a1)*wid/2);B.beam(p0[0],p0[1],p0[2],p1[0],p1[1],p1[2],.05,COL.woodD);}}}

