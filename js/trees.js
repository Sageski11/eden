'use strict';
// ================================================================ trees
const trees=[];let CAMREF=null;
const TCAP={trunk:20000,cone:34000,blob:40000,rock:7000};
const gTrunk=new THREE.CylinderGeometry(.55,1,1,6);gTrunk.translate(0,.5,0);
const gCone=new THREE.ConeGeometry(1,1,7);gCone.translate(0,.5,0);
const gBlob=new THREE.IcosahedronGeometry(1,0);
const gRock=new THREE.DodecahedronGeometry(1,0);
const tMat=new THREE.MeshStandardMaterial({flatShading:true,roughness:.9});
const IM={};
for(const [k,g] of [['trunk',gTrunk],['cone',gCone],['blob',gBlob],['rock',gRock]]){const m=new THREE.InstancedMesh(g,tMat,TCAP[k]);
  m.castShadow=true;m.receiveShadow=true;m.setColorAt(0,new THREE.Color());m.count=0;m.frustumCulled=false;IM[k]=m;scene.add(m);}
const _o=new THREE.Object3D(),_tc=new THREE.Color(),_tc2=new THREE.Color(),_snowC=new THREE.Color(0xe8eef2);
let treesDirty=true;
function treeColor(t,base,v){_tc.setHex(base);const f=.85+t.c*.3;_tc.r*=f*(1+v*.1);_tc.g*=f;_tc.b*=f*(1-v*.1);return _tc;}
function rebuildTrees(){
  const cnt={trunk:0,cone:0,blob:0,rock:0};
  const put=(kind,x,y,z,sx,sy,sz,col,ry=0,rx=0,rz=0)=>{const n=cnt[kind];if(n>=TCAP[kind])return;
    _o.position.set(x,y,z);_o.rotation.set(rx,ry,rz);_o.scale.set(sx,sy,sz);_o.updateMatrix();IM[kind].setMatrixAt(n,_o.matrix);IM[kind].setColorAt(n,col);cnt[kind]=n+1;};
  const bare=(t,y,s,h)=>{const bc=treeColor(t,0x4a3828,0).clone();for(let i=0;i<3;i++){const a=t.r+i*2.1;put('trunk',t.x,y+h*.45*s,t.z,.09*s,1.3*s,.09*s,bc,a,.7,0);}};
  const seasonal=(g,t,yl)=>{if(AUTUMN>.01){_tc2.setHex(yl?0xd8b030:(t.c<.33?0xc0502a:t.c<.66?0xd88a2a:0xc9a032));g.lerp(_tc2,AUTUMN*(.55+t.c*.45));}return g;};
  const useT2=CAMREF&&typeof TREE2!=='undefined'&&!location.search.includes('notree2');let cx2=0,cz2=0,R2=0;
  if(useT2){t2Begin();TREE2.cx=cx2=CAMREF.tx;TREE2.cz=cz2=CAMREF.tz;R2=TREE2.R*TREE2.R;}
  for(const t of trees){const y=hAt(t.x,t.z)-.15,s=t.s;
    if(useT2&&(t.x-cx2)**2+(t.z-cz2)**2<R2&&t2Put(t,y,s))continue;
    switch(t.t){
      case 0: // pine
        put('trunk',t.x,y,t.z,.22*s,1.3*s,.22*s,treeColor(t,0x5a3e28,0));
        {const g=treeColor(t,t.c>.8?0x2f5a3a:0x2e5730,0).clone();if(WINTER>.5)g.lerp(_snowC,.35);
        put('cone',t.x,y+.8*s,t.z,1.45*s,2.1*s,1.45*s,g,t.r);
        put('cone',t.x,y+1.8*s,t.z,1.1*s,1.9*s,1.1*s,g.multiplyScalar(1.08),t.r+.4);
        put('cone',t.x,y+2.75*s,t.z,.75*s,1.7*s,.75*s,g.multiplyScalar(1.08),t.r+.9);}
        break;
      case 1: { // oak
        put('trunk',t.x,y,t.z,.3*s,1.9*s,.3*s,treeColor(t,0x5b4129,0));
        if(WINTER>.5){bare(t,y,s,2.2);break;}
        const au=t.c>.955;const g=seasonal(treeColor(t,au?0xb8732c:0x4c7a2f,0).clone(),t);
        put('blob',t.x,y+2.6*s,t.z,1.45*s,1.2*s,1.4*s,g,t.r);
        put('blob',t.x+.65*s*Math.cos(t.r),y+2.2*s,t.z+.6*s*Math.sin(t.r),1.0*s,.9*s,1.0*s,g.clone().multiplyScalar(.92),t.r+1);
        put('blob',t.x-.6*s*Math.sin(t.r),y+3.2*s,t.z+.55*s*Math.cos(t.r),.9*s,.8*s,.9*s,g.clone().multiplyScalar(1.1),t.r+2);
        break;}
      case 2: { // birch
        put('trunk',t.x,y,t.z,.17*s,2.8*s,.17*s,treeColor(t,0xdcd6c8,0));
        if(WINTER>.5){bare(t,y,s,2.4);break;}
        const g=seasonal(treeColor(t,t.c>.93?0xc9b03a:0x7fa246,0).clone(),t,1);
        put('blob',t.x,y+2.9*s,t.z,.85*s,1.4*s,.85*s,g,t.r);
        put('blob',t.x+.3*s,y+2.3*s,t.z-.2*s,.7*s,.9*s,.7*s,g.clone().multiplyScalar(.9),t.r+1);
        break;}
      case 3: { // willow
        put('trunk',t.x,y,t.z,.32*s,1.7*s,.32*s,treeColor(t,0x5a4630,0));
        if(WINTER>.5){bare(t,y,s,1.9);break;}
        const g=seasonal(treeColor(t,0x8aa548,0).clone(),t,1);
        put('blob',t.x,y+2.3*s,t.z,1.8*s,1.25*s,1.8*s,g,t.r);
        put('blob',t.x,y+1.4*s,t.z,1.6*s,1.1*s,1.6*s,g.clone().multiplyScalar(.85),t.r+.6);
        break;}
      case 4: // rock
        put('rock',t.x,y+.15*s,t.z,1.1*s,.65*s,.95*s,treeColor(t,0x8a857c,0),t.r,t.c*.5,0);
        break;
      case 5: // bush
        if(WINTER>.5)break;put('blob',t.x,y+.45*s,t.z,.75*s,.55*s,.75*s,treeColor(t,0x547d33,0),t.r);
        break;
    }}
  for(const k in IM){IM[k].count=cnt[k];IM[k].instanceMatrix.needsUpdate=true;if(IM[k].instanceColor)IM[k].instanceColor.needsUpdate=true;}
  if(useT2)t2End();
  treesDirty=false;
}
function slopeAt(x,z){return Math.hypot(hAt(x+1,z)-hAt(x-1,z),hAt(x,z+1)-hAt(x,z-1))*.5;}
function treeTypeFor(x,z,rng){
  const h=hAt(x,z),wd=nearWater(x,z,5);
  if(wd<4&&rng()<.55)return 3;
  if(h>15)return rng()<.85?0:2;
  if(h>9)return rng()<.5?0:rng()<.5?1:2;
  return rng()<.55?1:rng()<.5?2:rng()<.4?0:5;
}
function nearWater(x,z,R){let b=99;for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const d=Math.hypot(dx,dz);if(d<b&&d<=R&&wAt(x+dx,z+dz)>.2)b=d;}return b;}
function genTrees(seed){
  trees.length=0;const r=mulberry(seed*7+1);const Wd=WORLDS[WORLD]||WORLDS.river,th=Wd.trees;
  forestMask.fill(0);if(th>1){treesDirty=true;return;}
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){const k=j*S+i;forestMask[k]=sstep(th,th+.09,fbm(i*.022+11,j*.022+5,seed+33,4));}
  const cap=WORLD==='dry'?3500:13000;
  for(let a=0;a<42000&&trees.length<cap;a++){const x=(r()-.5)*(N-4),z=(r()-.5)*(N-4);
    const fm=sampleArr(forestMask,x,z);if(r()>fm*.95+(WORLD==='dry'?.03:.012))continue;
    if(wAt(x,z)>.05||slopeAt(x,z)>1.1)continue;
    let ok=true;for(let q=trees.length-1;q>=Math.max(0,trees.length-500);q--){const t=trees[q];if((t.x-x)**2+(t.z-z)**2<2.2){ok=false;break;}}
    if(!ok)continue;
    let ty=treeTypeFor(x,z,r);if(WORLD==='dry'&&r()<.55)ty=5;
    trees.push({x,z,t:ty,s:.75+r()*.55,r:r()*TAU,c:r()});}
  const rockP=WORLD==='high'?.2:WORLD==='dry'?.09:.12;
  for(let a=0;a<12000;a++){const x=(r()-.5)*(N-4),z=(r()-.5)*(N-4);const sl=slopeAt(x,z),h=hAt(x,z);
    if(wAt(x,z)>.1)continue;if(sl>.6||h>16?r()<rockP:r()<.006)trees.push({x,z,t:4,s:.5+r()*1.3,r:r()*TAU,c:r()});}
  treesDirty=true;
}

