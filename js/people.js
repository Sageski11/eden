'use strict';
// ================================================================ articulated villagers (instanced body parts)
const PCAP=900;
const PG={};
function pgeo(name,g){PG[name]=g;return g;}
{const B=(w,h,d,ty=0,tz=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(0,ty,tz);return g;};
 const C=(rt,rb,h,seg,ty=0)=>{const g=new THREE.CylinderGeometry(rt,rb,h,seg);g.translate(0,ty,0);return g;};
 const merge=(...gs)=>{const p=[];for(let g of gs){g=g.index?g.toNonIndexed():g;p.push(...g.attributes.position.array);}const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(p,3));o.computeVertexNormals();return o;};
 pgeo('torso',C(.135,.165,.42,8,.21));
 pgeo('chest',merge(B(.3,.12,.2,.36,.0)));
 pgeo('skirt',C(.165,.27,.48,9,-.24));
 pgeo('belt',C(.17,.17,.045,9,0));
 pgeo('head',(()=>{const h=new THREE.IcosahedronGeometry(.115,1);h.scale(1,1.08,1);return merge(h,B(.03,.04,.04,-.005,.115),C(.05,.055,.06,6,-.12));})());
 pgeo('hairS',(()=>{const g=new THREE.SphereGeometry(.128,10,6,0,TAU,0,PI*.55);g.translate(0,.012,-.012);return g;})());
 pgeo('hairL',merge((()=>{const g=new THREE.SphereGeometry(.128,10,6,0,TAU,0,PI*.55);g.translate(0,.012,-.012);return g;})(),B(.2,.26,.06,-.1,-.09)));
 pgeo('hairB',merge((()=>{const g=new THREE.SphereGeometry(.126,10,6,0,TAU,0,PI*.5);g.translate(0,.012,-.012);return g;})(),(()=>{const g=new THREE.IcosahedronGeometry(.06,0);g.translate(0,.06,-.13);return g;})()));
 pgeo('beard',merge(B(.15,.09,.05,-.075,.085),B(.11,.05,.04,-.13,.08)));
 pgeo('hatStraw',merge(C(.26,.26,.018,12,.07),C(.09,.12,.11,10,.12)));
 pgeo('hatHood',merge((()=>{const g=new THREE.ConeGeometry(.15,.3,8);g.translate(0,.12,-.035);g.rotateX(-.25);return g;})(),C(.15,.17,.16,8,-.02)));
 pgeo('hatHelm',merge((()=>{const g=new THREE.SphereGeometry(.135,10,6,0,TAU,0,PI*.5);g.translate(0,.02,0);return g;})(),B(.025,.1,.03,-.03,.13),C(.142,.142,.025,10,.02)));
 pgeo('hatCap',merge(C(.12,.13,.07,10,.07),B(.12,.015,.08,.04,.12)));
 pgeo('hatCoif',(()=>{const g=new THREE.SphereGeometry(.14,10,7,0,TAU,0,PI*.62);g.translate(0,0,-.01);return g;})());
 pgeo('hatFeltCone',merge(C(.02,.13,.24,8,.16),C(.19,.19,.018,10,.05)));
 pgeo('arm',merge(C(.048,.042,.4,6,-.2)));
 pgeo('sleeve',C(.06,.055,.2,6,-.1));
 pgeo('hand',(()=>{const g=new THREE.IcosahedronGeometry(.045,0);return g;})());
 pgeo('leg',C(.058,.05,.47,6,-.235));
 pgeo('foot',B(.085,.06,.16,-.03,.035));
 // tools (grip at origin, extending along +z when arm hangs, i.e. along local -y? we orient along -y of hand)
 pgeo('tHammer',merge(B(.03,.36,.03,-.12),B(.14,.07,.07,-.3)));
 pgeo('tAxe',merge(B(.032,.62,.032,-.24),B(.02,.14,.16,-.5,.07)));
 pgeo('tHoe',merge(B(.03,1.1,.03,-.35),B(.02,.06,.18,-.88,.08)));
 pgeo('tPick',merge(B(.03,.62,.03,-.24),B(.36,.05,.05,-.52)));
 pgeo('tRod',merge(C(.012,.022,1.6,5,-.6),B(.004,.6,.004,-1.6+.3,0)));
 pgeo('tSpear',merge(C(.018,.018,1.6,5,-.3),(()=>{const g=new THREE.ConeGeometry(.035,.18,5);g.rotateX(PI);g.translate(0,-1.18,0);return g;})()));
 pgeo('tBow',(()=>{const bb=new Builder(Math.random,0);const pt=z=>[0,-.13*(1-(z/.48)**2),z];for(let i=0;i<8;i++){const a=pt(-.48+i*.12),b=pt(-.48+(i+1)*.12);bb.beam(...a,...b,.028,0x6a4a2a);}bb.beam(0,.0,-.48,0,0,.48,.006,0xdddddd);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(bb.p,3));g.computeVertexNormals();return g;})());
 pgeo('tKnife',merge(B(.025,.1,.03,-.04),B(.012,.16,.04,-.17)));
 pgeo('tSword',merge(B(.03,.12,.03,-.04),B(.16,.025,.04,-.1),B(.014,.62,.05,-.42)));
 pgeo('tBasket',merge(C(.13,.1,.14,8,-.12),B(.01,.14,.01,-.02)));
 pgeo('tStaff',merge(C(.02,.02,1.3,5,-.25)));
 pgeo('tTorch',merge(C(.02,.025,.5,5,-.15),C(.045,.03,.09,6,.12)));
 pgeo('cLog',(()=>{const g=new THREE.CylinderGeometry(.11,.11,1.1,7);g.rotateX(PI/2);return g;})());
 pgeo('cStone',B(.26,.2,.24));pgeo('cSack',(()=>{const g=new THREE.IcosahedronGeometry(.17,1);g.scale(1,1.15,.8);return g;})());
 pgeo('cFish',merge(...[0,1,2].map(i=>{const g=new THREE.IcosahedronGeometry(.06,0);g.scale(.6,1.9,.5);g.translate((i-1)*.07,-.1,0);return g;}),B(.22,.01,.01,0)));
 pgeo('cMeat',(()=>{const g=new THREE.IcosahedronGeometry(.2,0);g.scale(1.6,.8,.9);return g;})());
}
for(const k in PG)if(k[0]==='t'&&k!=='tBow'&&k!=='torso')PG[k].rotateX(PI);
const peopleMat=new THREE.MeshStandardMaterial({flatShading:true,roughness:.82});
const PM={};
for(const k in PG){const m=new THREE.InstancedMesh(PG[k],peopleMat,PCAP);m.setColorAt(0,new THREE.Color());m.count=0;m.castShadow=!/^(hand|foot|belt)$/.test(k);m.frustumCulled=false;PM[k]=m;scene.add(m);}
const TUNIC={builder:[0x9a6a32,0x8a5a2a,0xa8763a],wood:[0x4f6e2c,0x5d7a34,0x3f5e28],farmer:[0xc9a24a,0xb8923a,0xa89a5a,0x8a7a4a],fisher:[0x3b5675,0x4a6a88,0x2f4a66],quarry:[0x7d786e,0x6a665e],
  forager:[0x6f8a3a,0x7a8a4a],priest:[0xe8e2d2],guard:[0x8e2f1f,0x7a2a1a],miller:[0xd8cfb0,0xc8bea0],smith:[0x3a3d42,0x4a4a4a],keeper:[0x7a3a5a,0x6a4a3a],merchant:[0x2f6b6a,0x6b2f6b,0x2f4a8e],
  clerk:[0x4a4e8a],hunter:[0x5a4a2a,0x4a5a2a,0x6a5232],sawyer:[0x8a6a3a],mason:[0x9a948a],shipwright:[0x4a5a6a],fishmonger:[0x5a7a9a],none:[0x8a7a62,0x9a7a52,0x7a6a5a,0xa08868,0x6a7a8a,0x8a5a4a]};
const HAIRC=[0x2a1d14,0x3a2a1a,0x5a3a22,0x7a5230,0xa07a4a,0xc8a060,0xd8c090,0x8a3a1a,0x1a1612];
const DRESS=[0x7a3a3a,0x3a5a7a,0x5a6a3a,0x8a6a3a,0x6a4a6a,0x9a8a6a,0x4a6a6a,0xa05a3a];
function makeLook(v){const r=Math.random;const L={};
  L.skin=pickA(SKIN);L.hairC=v.age>55?pickA([0xb8b0a8,0xd8d4cc,0x8a8580]):pickA(HAIRC);
  L.hair=v.female?pickA(['hairL','hairB','hairL','hairS']):(v.age>50&&r()<.4?null:pickA(['hairS','hairS','hairL']));
  L.beard=!v.female&&v.age>=18&&r()<.45;L.skirt=v.female||(r()<.06);L.dress=pickA(DRESS);
  L.pants=pickA([0x4a3a2a,0x5a4a3a,0x3a3a3a,0x6a5a42,0x4a4a5a,0x5a3a2a]);L.boots=pickA([0x3a2618,0x2a1c12,0x4a3420]);
  L.tint=r();L.h=.92+r()*.16;L.w=.9+r()*.22;L.hatPref=r()<.35?pickA(['hatCap','hatFeltCone','hatHood']):null;L.hatC=pickA([0x6a4a2a,0x3a5a3a,0x7a2a2a,0x2a3a5a,0x8a7a5a]);
  return L;}
const _B=new THREE.Matrix4(),_U=new THREE.Matrix4(),_T=new THREE.Matrix4(),_O=new THREE.Matrix4(),_A=new THREE.Matrix4(),_Q=new THREE.Quaternion(),_E=new THREE.Euler(),_P=new THREE.Vector3(),_Sv=new THREE.Vector3(1,1,1),_C=new THREE.Color();
const pcnt={};
const _cc=new Map();// hex -> linear rgb, converted once
function pput(k,M,col){const n=pcnt[k]||0;if(n>=PCAP)return;const m=PM[k];m.setMatrixAt(n,M);let c=_cc.get(col);if(!c){_C.setHex(col);c=[_C.r,_C.g,_C.b];_cc.set(col,c);}const a=m.instanceColor.array,o=n*3;a[o]=c[0];a[o+1]=c[1];a[o+2]=c[2];pcnt[k]=n+1;}
// people far outside the view (plus a margin that covers their shadows) are not drawn
const _pfr=new THREE.Frustum(),_pfm=new THREE.Matrix4(),_psp=new THREE.Sphere(new THREE.Vector3(),12);
function local(px,py,pz,rx,ry,rz,s=1){_E.set(rx,ry,rz,'YXZ');_Q.setFromEuler(_E);_T.compose(_P.set(px,py,pz),_Q,_Sv.set(s,s,s));return _T;}
const JOBTOOL={builder:'tHammer',wood:'tAxe',farmer:'tHoe',quarry:'tPick',fisher:'tRod',hunter:'tSpear',guard:'tSpear',priest:'tStaff',forager:'tBasket',mason:'tHammer',sawyer:'tAxe',shipwright:'tHammer'};
const JOBHAT={farmer:'hatStraw',guard:'hatHelm',priest:'hatCoif',hunter:'hatHood',fisher:'hatFeltCone',miller:'hatCoif',smith:null,quarry:'hatCap',bandit:'hatHood'};
function drawPeople(list,T){
  for(const k in pcnt)pcnt[k]=0;
  camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();_pfm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_pfr.setFromProjectionMatrix(_pfm);
  for(const v of list){if(v.hidden)continue;
    const y=hAt(v.x,v.z)+Math.max(0,wAt(v.x,v.z)-.3)*.7;
    _psp.center.set(v.x,y+1,v.z);if(!_pfr.intersectsSphere(_psp))continue;
    if(!v.look)v.look=makeLook(v);const L=v.look;
    const kid=v.age<14,sc=(kid?.55+v.age*.03:1)*L.h,elder=v.age>58;
    const moving=!!v.path;let legA=0,armL=0,armR=0,bob=0,lean=elder?.16:0,twist=0,headY=0,armLz=.08,armRz=.08,armRx=0,spin=0;
    const ph=(v.wph||0);
    if(moving){legA=Math.sin(ph)*.62;armL=-legA*.8;armR=legA*.8;bob=Math.abs(Math.cos(ph))*.045;if(v.kind==='bandit'||v.flee){legA*=1.2;lean+=.12;}}
    const tool=v.kind==='bandit'?(v.id%2?'tSword':'tSpear'):v.carry?null:v.weapon==='tBow'?null:(v.weapon||JOBTOOL[v.job]||null);
    let act=v.anim;
    if(!moving){
      if(act==='work'){const j=v.act||v.job;const t=T*5.5+v.id;
        if(j==='builder'||j==='mason'||j==='shipwright'){armR=-2.3+Math.max(0,Math.sin(t*1.3))*1.6;armL=-.6;lean+=.12;}
        else if(j==='wood'||j==='sawyer'||j==='quarry'){const s=Math.sin(t);armR=-2.0+s*1.3;armL=-2.0+s*1.3;lean+=.1+s*.12;twist=s*.25;}
        else if(j==='farmer'){const s=Math.sin(t*.8);armR=-.9+s*.5;armL=-.7+s*.5;lean+=.32+s*.08;}
        else if(j==='fisher'){armR=-1.1+Math.sin(T*1.3+v.id)*.08;armL=-.4;}
        else if(j==='forager'||j==='gather'){lean+=.55;armR=-.7+Math.sin(t)*.3;armL=-.6-Math.sin(t)*.3;}
        else if(j==='hunter'){armR=-1.4+Math.sin(t*1.6)*.5;armL=-1.1;lean+=.1;}
        else{armR=-.5+Math.sin(t)*.3;armL=-.3;}}
      else if(act==='fight'){const s=Math.sin(T*12+v.id);armR=-1.5+s*.8;armL=-.8;lean+=.15;legA=.25;}
      else if(act==='dance'){spin=T*2.5+v.id;armR=-2.6+Math.sin(T*8+v.id)*.4;armL=-2.6-Math.sin(T*8+v.id)*.4;bob=Math.abs(Math.sin(T*7+v.id))*.16;legA=Math.sin(T*7+v.id)*.4;}
      else if(act==='aim'){armL=-1.57;armR=-1.45;armLz=.0;twist=.35;}
      else{armL=Math.sin(T*1.1+v.id)*.05;armR=-armL;headY=Math.sin(T*.4+v.id*1.7)*.5;}}
    if(v.carry){if(v.carry==='wood'||v.carry==='meat'){armR=-2.7;armRz=-.15;}else{armL=-1.0;armR=-1.0;armLz=-.3;armRz=-.3;}}
    const rot=(v.rot||0)+spin;
    _B.compose(_P.set(v.x,y+bob*sc,v.z),_Q.setFromEuler(_E.set(0,rot,0,'YXZ')),_Sv.set(sc*L.w,sc,sc*L.w));
    // legs + feet
    const pants=v.kind==='bandit'?0x2a2420:L.pants;
    for(const s of [-1,1]){_O.multiplyMatrices(_B,local(s*.075,.5,0,s*legA,0,0));pput('leg',_O,pants);_A.multiplyMatrices(_O,local(0,-.47,0,0,0,0));pput('foot',_A,L.boots);}
    // upper body pivot at hips with lean & twist
    _U.multiplyMatrices(_B,local(0,.5,0,lean,twist,0));
    const tun=v.kind==='bandit'?0x3a2a24:(()=>{const p=TUNIC[v.job]||TUNIC.none;return p[Math.floor(L.tint*p.length)%p.length];})();
    const body=L.skirt&&v.kind!=='bandit'?(v.job==='priest'?0xe8e2d2:L.dress):tun;
    _O.multiplyMatrices(_U,local(0,0,0,0,0,0));pput('torso',_O,v.job==='priest'?0xe8e2d2:L.skirt?L.dress:tun);
    _O.multiplyMatrices(_U,local(0,0,0,0,0,0,1));pput('chest',_O,v.job==='priest'?0xe8e2d2:L.skirt?L.dress:tun);
    if(L.skirt||v.job==='priest'){_O.multiplyMatrices(_U,local(0,.06,0,-lean*.6,0,0));pput('skirt',_O,body);}
    _O.multiplyMatrices(_U,local(0,.05,0,0,0,0));pput('belt',_O,v.job==='guard'?0x2a2018:0x4a3020);
    // head
    _O.multiplyMatrices(_U,local(0,.555,0,-lean*.4,headY,0));pput('head',_O,v.sick?0xa8c098:L.skin);
    let hat=v.kind==='bandit'?'hatHood':(JOBHAT[v.job]!==undefined?JOBHAT[v.job]:null)||L.hatPref;if(kid)hat=null;
    if(L.hair&&hat!=='hatHelm'&&hat!=='hatHood'&&hat!=='hatCoif'){_A.multiplyMatrices(_O,local(0,0,0,0,0,0));pput(L.hair,_A,L.hairC);}
    if(L.beard&&!kid&&v.kind!=='bandit')pput('beard',_O,L.hairC);
    if(hat){_A.multiplyMatrices(_O,local(0,hat==='hatStraw'?.0:.02,0,0,0,0));pput(hat,_A,hat==='hatHelm'?0x9aa0a8:hat==='hatStraw'?0xd8c070:hat==='hatCoif'?0xeee8dc:v.kind==='bandit'?0x2a1a14:hat===L.hatPref?L.hatC:hat==='hatHood'?0x4a5a2a:0x6a4a2a);}
    // arms
    for(const s of [-1,1]){const ax=s<0?armL:armR,az=s<0?armLz:armRz;
      _O.multiplyMatrices(_U,local(s*.19,.4,0,ax,0,s*az));pput('sleeve',_O,v.job==='priest'?0xe8e2d2:L.skirt?L.dress:tun);pput('arm',_O,L.skin);
      _A.multiplyMatrices(_O,local(0,-.42,0,0,0,0));pput('hand',_A,L.skin);
      if(s>0&&tool){const tl=local(0,0,0,(tool==='tRod'||tool==='tSpear'||tool==='tHoe'||tool==='tStaff'||tool==='tTorch')?.3:tool==='tBasket'?0:1.8,0,0);_A.multiplyMatrices(_A,tl);
        pput(tool,_A,tool==='tSword'||tool==='tKnife'?0x9aa0a8:tool==='tBasket'?0xa08050:0x6a4a2a);}
      if(s<0&&v.weapon==='tBow'){_A.multiplyMatrices(_O,local(0,-.42,0,0,0,0));pput('tBow',_A,0x6a4a2a);}}
    // carried goods
    if(v.carry){const ck={wood:'cLog',stone:'cStone',food:'cSack',loot:'cSack',fish:'cFish',meat:'cMeat'}[v.carry]||'cSack';
      const pos=v.carry==='wood'?local(.12,.66,0,0,.3,0):v.carry==='meat'?local(0,.62,-.05,0,PI/2,0):v.carry==='fish'?local(-.24,.12,.08,0,0,0):local(0,.28,.24,0,0,0);
      _O.multiplyMatrices(_U,pos);pput(ck,_O,{cLog:0x8a6440,cStone:0xa39c8e,cSack:0xc8b48a,cFish:0x9ab0b8,cMeat:0x8a4a3a}[ck]);}
  }
  for(const k in PM){PM[k].count=pcnt[k]||0;PM[k].instanceMatrix.needsUpdate=true;if(PM[k].instanceColor)PM[k].instanceColor.needsUpdate=true;}
}
