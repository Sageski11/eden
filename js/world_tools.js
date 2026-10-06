'use strict';
// ================================================================ particles (smoke, droplets)
const PN=1400;const pPos=new Float32Array(PN*3),pSize=new Float32Array(PN),pAlpha=new Float32Array(PN),pCol=new Float32Array(PN*3);
const parts=[];for(let i=0;i<PN;i++)parts.push({life:1,max:0});
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('aSize',new THREE.BufferAttribute(pSize,1));
pGeo.setAttribute('aAlpha',new THREE.BufferAttribute(pAlpha,1));pGeo.setAttribute('aCol',new THREE.BufferAttribute(pCol,3));
const pMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uScale:{value:innerHeight*.5}},
  vertexShader:`attribute float aSize;attribute float aAlpha;attribute vec3 aCol;varying float vA;varying vec3 vC;uniform float uScale;
  void main(){vA=aAlpha;vC=aCol;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uScale/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,d)*vA;if(a<.01)discard;gl_FragColor=vec4(vC,a);}`});
const pts=new THREE.Points(pGeo,pMat);pts.frustumCulled=false;pts.renderOrder=3;scene.add(pts);
let pCur=0;
function spawn(x,y,z,vx,vy,vz,max,size,r,g,b,kind){const p=parts[pCur];pCur=(pCur+1)%PN;Object.assign(p,{x,y,z,vx,vy,vz,life:0,max,size,r,g,b,kind});}
let nightF=0;
function updateParticles(dt){
  const cullR=cam.dist*1.15+70;// chimneys out of sight smoke for no one: they do not spend particles
  for(const b of allB()){if(b.emit.length&&Math.hypot(b.x-cam.tx,b.z-cam.tz)>cullR)continue;for(const e of b.emit){e.acc+=dt*e.rate*4;while(e.acc>1){e.acc-=1;const s=e.dark?.32:.72;const n=nightF*.6;
    spawn(e.wx+(Math.random()-.5)*.2,e.wy,e.wz+(Math.random()-.5)*.2,(Math.random()-.5)*.2,.7+Math.random()*.4,(Math.random()-.5)*.2,3.5+Math.random()*2,.9,s*(1-n),s*(1-n),s*(1-n)*1.03,0);}}}
  for(let i=0;i<PN;i++){const p=parts[i];if(p.life>=p.max){pAlpha[i]=0;continue;}p.life+=dt;const t=p.life/p.max;
    if(p.kind===1){p.vy-=18*dt;}else if(p.kind===3){p.vy-=3*dt;p.vx*=.98;p.vz*=.98;}else if(p.kind===0){p.vx+=.35*dt;p.vy*=.995;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
    if(p.kind===1&&p.y<hAt(p.x,p.z)+wAt(p.x,p.z)){p.life=p.max;}
    pPos[i*3]=p.x;pPos[i*3+1]=p.y;pPos[i*3+2]=p.z;
    pSize[i]=p.kind===0?p.size*(1+t*2.5):p.size;pAlpha[i]=p.kind===1?.75:p.kind===2?.9:p.kind===3?(1-t)*1.2:(1-t)*Math.min(1,p.life*3)*.42;pCol[i*3]=p.r;pCol[i*3+1]=p.g;pCol[i*3+2]=p.b;}
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.aSize.needsUpdate=true;pGeo.attributes.aAlpha.needsUpdate=true;pGeo.attributes.aCol.needsUpdate=true;
}

// ================================================================ spring markers
const springGrp=new THREE.Group();scene.add(springGrp);
function refreshSprings(){while(springGrp.children.length){const m=springGrp.children.pop();m.geometry.dispose();}
  for(const s of springs){const B=new Builder(Math.random,.05);const g=hAt(s.x,s.z);
    for(let i=0;i<7;i++){const a=i/7*TAU;B.box(Math.sin(a)*1.1,g-.3,Math.cos(a)*1.1,.55,.6,.45,0x8a857c,a);}
    const m=B.mesh(matB);m.position.set(s.x,0,s.z);springGrp.add(m);}}

// ================================================================ camera
const cam={tx:0,tz:6,ty:6,yaw:.62,pitch:.82,dist:150,vx:0,vz:0};CAMREF=cam;
function updateCamera(dt){
  const k=keys,sp=cam.dist*.9*dt;let mx=0,mz=0;
  if(k.KeyW||k.ArrowUp)mz-=1;if(k.KeyS||k.ArrowDown)mz+=1;if(k.KeyA||k.ArrowLeft)mx-=1;if(k.KeyD||k.ArrowRight)mx+=1;
  if(k.KeyQ)cam.yaw+=dt*1.4;if(k.KeyE)cam.yaw-=dt*1.4;
  {const cs=Math.cos(cam.yaw),sn=Math.sin(cam.yaw),nm=mx&&mz?.7071:1,ac=Math.min(1,dt*((mx||mz)?10:7));cam.vx+=((mx*cs+mz*sn)*nm-cam.vx)*ac;cam.vz+=((-mx*sn+mz*cs)*nm-cam.vz)*ac;if(Math.abs(cam.vx)<.002)cam.vx=0;if(Math.abs(cam.vz)<.002)cam.vz=0;cam.tx+=cam.vx*sp;cam.tz+=cam.vz*sp;}
  cam.tx=clamp(cam.tx,-HALF,HALF);cam.tz=clamp(cam.tz,-HALF,HALF);cam.pitch=clamp(cam.pitch,cam.walk?.04:.12,1.45);cam.dist=clamp(cam.dist,cam.walk?2.2:10,300);
  cam.ty+=(hAt(cam.tx,cam.tz)-cam.ty)*Math.min(1,dt*3);
  const cp=Math.cos(cam.pitch);let px=cam.tx+cam.dist*cp*Math.sin(cam.yaw),py=cam.ty+(cam.eye||0)+cam.dist*Math.sin(cam.pitch),pz=cam.tz+cam.dist*cp*Math.cos(cam.yaw);
  const gh=hAt(px,pz)+wAt(px,pz)+(cam.walk?.7:1.5);if(py<gh)py=gh;
  camera.position.set(px,py,pz);camera.lookAt(cam.tx,cam.ty+(cam.eye||0),cam.tz);sky.position.copy(camera.position);
}

// ================================================================ time of day
const _c1=new THREE.Color(),_c2=new THREE.Color();
let hour=15.5;
function setTime(h){hour=h;
  const t=(h-6)/12,ang=t*PI,el=Math.sin(ang);
  const day=clamp(el*3+.2,0,1),dusk=clamp(1-Math.abs(el)*3,0,1)*(el>-.3?1:0);
  nightF=1-day;
  const sd=new THREE.Vector3(Math.cos(ang)*.85,Math.max(el,.12),.42).normalize();
  if(el<0)sd.set(-.4,.8,-.3).normalize();
  sun.position.set(cam.tx+sd.x*220,sd.y*220,cam.tz+sd.z*220);sun.target.position.set(cam.tx,0,cam.tz);
  sun.color.setRGB(1,lerp(.95,.62,dusk),lerp(.85,.42,dusk));if(el<0)sun.color.setRGB(.55,.65,1);
  sun.intensity=el<0?.22:lerp(.35,1.05,day)*(1-dusk*.25);
  hemi.intensity=lerp(.16,.58,day);hemi.color.setRGB(lerp(.35,.82,day),lerp(.42,.88,day),lerp(.7,1,day));
  amb.intensity=lerp(.12,.08,day);
  const top=_c1.setRGB(lerp(.03,.36,day),lerp(.05,.58,day),lerp(.13,.86,day)),hor=_c2.setRGB(lerp(.08,.80,day),lerp(.1,.88,day),lerp(.2,.92,day));
  hor.lerp(new THREE.Color(.98,.62,.36),dusk*.8);top.lerp(new THREE.Color(.32,.34,.55),dusk*.5);
  skyU.top.value.copy(top);skyU.hor.value.copy(hor);skyU.sunDir.value.copy(sd);skyU.sunCol.value.copy(sun.color).multiplyScalar(el<0?.3:1);
  scene.fog.color.copy(hor);waterU.uSky.value.copy(hor).lerp(top,.4);waterU.uFog.value.copy(hor);waterU.uSun.value.copy(sd);waterU.uSunCol.value.copy(sun.color).multiplyScalar(sun.intensity);waterU.uDay.value=lerp(.35,1,day);
  matGlow.color.setRGB(lerp(.17,1,nightF),lerp(.15,.7,nightF),lerp(.13,.32,nightF));
  document.getElementById('todv').textContent=`${Math.floor(h)}:${String(Math.floor((h%1)*60)).padStart(2,'0')}`;
}

// ================================================================ undo / save
const undoStack=[];
function snapshot(){return {H:H.slice(),W:W.slice(),R:ROAD.slice(),trees:trees.map(t=>({...t})),springs:springs.map(s=>({...s})),
  bl:buildings.map(b=>({type:b.type,x:b.x,z:b.z,rot:b.rot,manual:b.manual,seed:b.seed,w:b.w,d:b.d,lv:b.level,vr:b.variant})),
  net:MODE==='sandbox'&&G.net?G.net.lines.map(l=>JSON.parse(JSON.stringify(l))):null,pv:MODE==='sandbox'&&typeof SB!=='undefined'?SB.paved.slice():null};}
function pushUndo(){undoStack.push(snapshot());if(undoStack.length>30)undoStack.shift();}
function restore(s){
  H.set(s.H);W.set(s.W);ROAD.set(s.R);F.fill(0);
  trees.length=0;for(const t of s.trees)trees.push({...t});treesDirty=true;
  springs.length=0;for(const p of s.springs)springs.push({...p});refreshSprings();
  for(const b of buildings.slice())removeBuilding(b);
  for(const r of s.bl){const b=newRecord(r.type,r.x,r.z,r.rot,r.seed);Object.assign(b,{manual:r.manual,w:r.w,d:r.d,level:r.lv==null?null:r.lv,variant:r.vr||null});addBuilding(b);}
  if(s.pv&&typeof SB!=='undefined'){SB.paved.set(s.pv);G.net={lines:(s.net||[]).map(l=>JSON.parse(JSON.stringify(l))),paved:false};netReload();}
  refreshCivic();for(const b of buildings)realize(b);
  refreshTerrain();updateSkirt();selected=null;ghostKey='';
}
function undo(){const s=undoStack.pop();if(!s){toast('Nothing to undo');return;}restore(s);toast('Undone');}
function f32b64(a){const u=new Uint8Array(a.buffer.slice(0));let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);}
function b64f32(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Float32Array(u.buffer);}
function serialize(){const s=snapshot();return JSON.stringify({v:1,N,H:f32b64(s.H),W:f32b64(s.W),R:f32b64(s.R),trees:s.trees,springs:s.springs,bl:s.bl,net:s.net,pv:s.pv?f32b64(new Float32Array(Array.from(s.pv))):null,hour,cam:{tx:cam.tx,tz:cam.tz,yaw:cam.yaw,pitch:cam.pitch,dist:cam.dist}});}
function deserialize(str){const o=JSON.parse(str);if(o.N!==N)throw new Error('size');pushUndo();
  restore({H:b64f32(o.H),W:b64f32(o.W),R:b64f32(o.R),trees:o.trees,springs:o.springs,bl:o.bl,net:o.net,pv:o.pv&&MODE==='sandbox'?Uint8Array.from(b64f32(o.pv)):null});if(o.cam)Object.assign(cam,o.cam);if(o.hour){tod.value=o.hour;setTime(o.hour);}}

// ================================================================ input / tools
const keys={};let shift=false;
let TOOLDEFS=[
  ['Shape the land',[['raise','Raise','1'],['lower','Lower','2'],['smooth','Smooth','3'],['flatten','Flatten','4'],['cliff','Cliff','5'],['terrace','Terrace','6'],['canyon','Canyon','7']]],
  ['Water',[['pour','Pour','8'],['spring','Spring','9'],['drain','Drain','0']]],
  ['Nature',[['plant','Plant trees','T'],['fell','Fell trees','Y']]],
  ['Plan',[['road','Road','G'],['inspect','Inspect','I'],['demolish','Demolish','X']]],
  ['Build',Object.entries(BT).map(([k,v])=>['b:'+k,v,''])]
];
const HINTS={raise:'Drag to raise hills. Shift lowers.',lower:'Drag to dig down. Shift raises.',smooth:'Drag to soften the land.',flatten:'Drag to level ground to the height where you started — good for building plots.',
  cliff:'Drag to lift a plateau with sheer cliffs. Shift sinks a sharp pit — pour water in for a pond.',terrace:'Drag to cut hillsides into steps.',canyon:'Drag to carve a narrow canyon — water poured upstream will run through it as a river. Shift raises a ridge.',
  pour:'Hold to pour water. It flows downhill, fills hollows into ponds and lakes, and runs through valleys as rivers.',spring:'Click to place a spring that flows forever (strength = flow). Shift-click removes the nearest spring.',
  drain:'Drag to soak up water. Also removes springs under the brush.',plant:'Drag to plant trees. Species follow the land: pines up high, willows by water, oaks & birch in the lowlands. Shift fells.',fell:'Drag to clear trees and rocks.',
  road:'Paint roads. Buildings turn to face roads; roads near castles, churches and markets become cobbled. Shift erases.',inspect:'Click a building to see why it looks the way it does.',demolish:'Click a building to tear it down.',
  build:'Buildings adapt to what is around them. Try water, hills, forests, roads — or place houses side by side to join them into rows.'};
const BRUSH_DEF={raise:12,lower:12,smooth:10,flatten:9,cliff:8,terrace:12,canyon:4,pour:3,drain:8,plant:10,fell:8,road:1.6,rocks:8};
const brushMem={};
let tool='b:house';const brush={r:8,s:.6};
const toolsEl=document.getElementById('tools');
let toolsCollapsed=innerWidth<900;
function buildToolbox(defs){TOOLDEFS=defs;toolsEl.innerHTML='<div class="tbhead"><span>Powers<i class="cur" id="tbCur"></i></span><button class="mini" id="tbToggle" title="Collapse / expand">'+(toolsCollapsed?'+':'–')+'</button></div>';
  toolsEl.classList.toggle('collapsed',toolsCollapsed);
  toolsEl.querySelector('#tbToggle').onclick=()=>{toolsCollapsed=!toolsCollapsed;buildToolbox(TOOLDEFS);if(typeof applyUI==='function')applyUI();};
  for(const [gname,list] of defs){const d=document.createElement('div');d.className='grp';d.innerHTML=`<h3>${gname}</h3><div class="tg"></div>`;
    for(const [id,label,key,cost,lock] of list){const btn=document.createElement('button');btn.dataset.tool=id;
      btn.innerHTML=`<span>${label}</span>${cost!=null?`<i class="cost">${cost}</i>`:''}${key?`<kbd>${key}</kbd>`:''}`;
      if(lock){btn.disabled=true;btn.title=lock;btn.classList.add('locked');}
      btn.onclick=()=>setTool(id);d.querySelector('.tg').appendChild(btn);}
    toolsEl.appendChild(d);}
  for(const b of toolsEl.querySelectorAll('button[data-tool]'))b.classList.toggle('on',b.dataset.tool===tool);updToolCur();}
function updToolCur(){const c=document.getElementById('tbCur');if(!c)return;let lab='';for(const [,l] of TOOLDEFS)for(const t of l)if(t[0]===tool)lab=t[1];c.textContent=lab?'· '+lab:'';}
function toolAvailable(id){return TOOLDEFS.some(([,l])=>l.some(t=>t[0]===id&&!t[4]));}
buildToolbox(TOOLDEFS);
const bSize=document.getElementById('bSize'),bStr=document.getElementById('bStr'),bSizeV=document.getElementById('bSizeV'),brushbar=document.getElementById('brushbar'),hintEl=document.getElementById('hint'),insp=document.getElementById('insp');
bSize.oninput=()=>{brush.r=+bSize.value;bSizeV.textContent=brush.r;brushMem[tool]=brush.r;};bStr.oninput=()=>{brush.s=+bStr.value;};
function setTool(id){if(MODE==='god'&&id.startsWith('p:')){castPower(id);return;}tool=id;selected=null;if(MODE==='god'){G.follow=null;}for(const b of toolsEl.querySelectorAll('button[data-tool]'))b.classList.toggle('on',b.dataset.tool===id);updToolCur();
  const isB=id.startsWith('b:');brushbar.classList.toggle('hidden',BRUSH_DEF[id]==null);
  document.getElementById('bTip').textContent=id==='spring'?'Strength = flow rate':'Shift inverts';
  if(BRUSH_DEF[id]!=null){brush.r=brushMem[id]||BRUSH_DEF[id];bSize.value=brush.r;bSizeV.textContent=brush.r;}
  hintEl.textContent=HINTS[isB?'build':id]||'';
  if(isB&&MODE!=='god'){ghostB=newRecord(id.slice(2),0,0,0,(Math.random()*1e9)|0);ghostB.manual=false;}else ghostB=null;
  clearGhost();ghostKey='';
}
let toastT=0;function toast(s){const t=document.getElementById('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),1800);}

const ray=new THREE.Raycaster(),_ndc=new THREE.Vector2();
function pick(nx,ny,withWater){_ndc.set(nx,ny);ray.setFromCamera(_ndc,camera);const o=ray.ray.origin,d=ray.ray.direction;
  let t=0;if(o.y>60&&d.y<0)t=(o.y-60)/-d.y;
  const surf=(x,z)=>hAt(x,z)+(withWater?wAt(x,z):0);
  for(let k=0;k<3000;k++){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;
    if(Math.abs(x)<=HALF&&Math.abs(z)<=HALF&&y<=surf(x,z)){let a=t-.6,b2=t;for(let i=0;i<10;i++){const m=(a+b2)/2;if(o.y+d.y*m<=surf(o.x+d.x*m,o.z+d.z*m))b2=m;else a=m;}
      const x2=o.x+d.x*b2,z2=o.z+d.z*b2;return {x:x2,z:z2,y:surf(x2,z2)};}
    if(y<-20)return null;t+=.6;}return null;}
let mouse={nx:0,ny:0,in:false},hover=null,painting=false,dragCam=null,flatH=0,strokeBox=null,plantAcc=0,selected=null,hoverB=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(UIBLOCK)return;canvas.setPointerCapture(e.pointerId);shift=e.shiftKey;
  if(e.button===2||e.button===1){dragCam={b:e.button,x:e.clientX,y:e.clientY};return;}
  if(e.button!==0)return;
  if(MODE==='god'){if(godClick(e))return;if(!BRUSH_DEF[tool])return;}
  if(!hover)return;
  if(tool.startsWith('b:')){placeGhost();return;}
  if(tool==='inspect'){selected=hoverB;showInspector();return;}
  if(tool==='demolish'){if(hoverB){pushUndo();const b=hoverB;removeBuilding(b);rebuildNear(b.x,b.z,34);toast(`${b.info.name} demolished`);hoverB=null;}return;}
  if(tool==='spring'){pushUndo();if(shift){let bi=-1,bd=6;springs.forEach((s,i)=>{const d=Math.hypot(s.x-hover.x,s.z-hover.z);if(d<bd){bd=d;bi=i;}});if(bi>=0){springs.splice(bi,1);toast('Spring sealed');}}
    else{springs.push({x:hover.x,z:hover.z,rate:.06+brush.s*.4});toast('A spring bubbles up');}refreshSprings();return;}
  if(MODE!=='god'||G.phase==='shape')pushUndo();painting=true;flatH=hover.y;strokeBox=null;strokeVol=0;
  if(tool==='drain'){for(let i=springs.length-1;i>=0;i--)if(Math.hypot(springs[i].x-hover.x,springs[i].z-hover.z)<brush.r)springs.splice(i,1);refreshSprings();}
  if(tool==='flatten'||tool==='cliff')flatH=hAt(hover.x,hover.z);
});
canvas.addEventListener('pointermove',e=>{mouse.nx=e.clientX/innerWidth*2-1;mouse.ny=-(e.clientY/innerHeight)*2+1;mouse.in=true;shift=e.shiftKey;
  if(dragCam){const dx=e.clientX-dragCam.x,dy=e.clientY-dragCam.y;dragCam.x=e.clientX;dragCam.y=e.clientY;
    if(dragCam.b===2&&!e.shiftKey){const cs2=SETS.camSens||1;cam.yaw-=dx*.006*cs2*(SETS.invX?-1:1);cam.pitch+=dy*.005*cs2*(SETS.invY?-1:1);}
    else{const s=cam.dist*.0016,cs=Math.cos(cam.yaw),sn=Math.sin(cam.yaw);cam.tx+=(-dx*cs-dy*sn)*s;cam.tz+=(dx*sn-dy*cs)*s;}}});
canvas.addEventListener('pointerup',e=>{if(dragCam){dragCam=null;return;}if(painting){painting=false;endStroke();}});
canvas.addEventListener('pointerleave',()=>{mouse.in=false;});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(UIBLOCK)return;if(tool.startsWith('b:')&&e.shiftKey){rotateGhost(e.deltaY>0?1:-1);return;}cam.dist*=Math.pow(1.0012,e.deltaY);},{passive:false});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||UIBLOCK)return;if(e.code==='Tab'&&MODE==='god'&&typeof cycleSettlement==='function'){e.preventDefault();cycleSettlement();return;}keys[e.code]=true;shift=e.shiftKey;
  if(MODE==='title')return;
  if(MODE==='god'&&godKey(e))return;
  if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();if(MODE!=='god'||G.phase==='shape')undo();return;}
  const map={Digit1:'raise',Digit2:'lower',Digit3:'smooth',Digit4:'flatten',Digit5:'cliff',Digit6:'terrace',Digit7:'canyon',Digit8:'pour',Digit9:'spring',Digit0:'drain',KeyT:'plant',KeyY:'fell',KeyG:'road',KeyI:'inspect',KeyX:'demolish'};
  if(map[e.code]){if(toolAvailable(map[e.code]))setTool(map[e.code]);return;}
  if(e.code==='KeyR'){if(ghostB)rotateGhost(e.shiftKey?-1:1);else if(selected){pushUndo();selected.rot+=e.shiftKey?-PI/4:PI/4;selected.manual=true;realize(selected);rebuildNear(selected.x,selected.z,12,selected);showInspector();}}
  if(e.code==='KeyV'){if(ghostB){ghostB.seed=(Math.random()*1e9)|0;const r=newRecord(ghostB.type,0,0,0,ghostB.seed);ghostB.w=r.w;ghostB.d=r.d;ghostKey='';}else if(selected){pushUndo();selected.seed=(Math.random()*1e9)|0;realize(selected);showInspector();}}
  if(e.code==='KeyF'&&ghostB){ghostB.manual=!ghostB.manual;ghostKey='';toast(ghostB.manual?'Auto-facing off':'Auto-facing on');}
  if(e.code==='KeyP'&&MODE!=='god')togglePause();
  if(e.code==='KeyH')document.getElementById('help').classList.toggle('hidden');
  if(e.code==='Escape'){setTool('inspect');document.getElementById('help').classList.add('hidden');}
});
addEventListener('keyup',e=>{keys[e.code]=false;shift=e.shiftKey;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);pMat.uniforms.uScale.value=innerHeight*.5;});

let strokeVol=0;
function applyBrush(dt){
  if(!hover)return;const R=brush.r,s=brush.s,inv=shift;const cx=hover.x+HALF,cz=hover.z+HALF;
  if(MODE==='god'&&G.faith<1){painting=false;endStroke();toast('Not enough Faith');return;}
  let dVol=0,dWat=0,nTree=trees.length;
  const i0=Math.max(0,Math.floor(cx-R)),i1=Math.min(N,Math.ceil(cx+R)),j0=Math.max(0,Math.floor(cz-R)),j1=Math.min(N,Math.ceil(cz+R));
  let terr=false,tmp=null;
  if(tool==='smooth'||tool==='road'){tmp=new Float32Array((i1-i0+1)*(j1-j0+1));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){let a=0,n=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>N||jj>N)continue;a+=H[jj*S+ii];n++;}tmp[(j-j0)*(i1-i0+1)+i-i0]=a/n;}}
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i-cx,j-cz);if(d>R)continue;const k=j*S+i,f=.5+.5*Math.cos(PI*d/R);const h0=H[k],w0=W[k];
    switch(tool){
      case 'raise':case 'lower':{const sg=(tool==='raise')!==inv?1:-1;H[k]+=sg*f*s*dt*9;terr=true;break;}
      case 'smooth':H[k]=lerp(H[k],tmp[(j-j0)*(i1-i0+1)+i-i0],clamp(f*s*dt*12,0,1));terr=true;break;
      case 'flatten':H[k]=lerp(H[k],flatH,clamp(f*s*dt*9,0,1));terr=true;break;
      case 'cliff':{const hf=sstep(R,R*.72,d),tg=flatH+(inv?-4:4);const nv=lerp(H[k],tg,clamp(hf*s*dt*7,0,1));H[k]=inv?Math.min(H[k],nv):Math.max(H[k],nv);terr=true;break;}
      case 'terrace':{const st=2.2,q=H[k]/st,fl=Math.floor(q),fr=q-fl,tg=(fl+sstep(.62,.8,fr))*st;H[k]=lerp(H[k],tg,clamp(f*s*dt*5,0,1));terr=true;break;}
      case 'canyon':{const p=f*f*f;H[k]+=(inv?1:-1)*p*s*dt*12;terr=true;break;}
      case 'pour':if(d<R)W[k]+=f*s*dt*5;break;
      case 'drain':W[k]=Math.max(0,W[k]-f*s*dt*5)*(1-clamp(f*s*dt*3,0,1));break;
      case 'road':{ROAD[k]=clamp(ROAD[k]+(inv?-1:1)*f*s*dt*6,0,1);if(!inv&&W[k]<.1)H[k]=lerp(H[k],tmp[(j-j0)*(i1-i0+1)+i-i0],clamp(f*s*dt*3,0,1));terr=true;break;}
    }
    if(terr)H[k]=clamp(H[k],-14,48);dVol+=Math.abs(H[k]-h0);dWat+=Math.abs(W[k]-w0);}
  if(tool==='pour'){for(let q=0;q<4;q++){const a=Math.random()*TAU,r=Math.random()*R*.8;spawn(hover.x+Math.cos(a)*r,hover.y+8+Math.random()*2,hover.z+Math.sin(a)*r,0,-6,0,3,.45,.55,.8,.95,1);}}
  if(tool==='rocks'){plantAcc+=dt*(1+R*R*.02)*s*2;while(plantAcc>1){plantAcc--;const a=Math.random()*TAU,r=Math.sqrt(Math.random())*R,x=hover.x+Math.cos(a)*r,z=hover.z+Math.sin(a)*r;if(wAt(x,z)>.1||Math.abs(x)>HALF-1||Math.abs(z)>HALF-1)continue;trees.push({x,z,t:4,s:.5+Math.random()*1.4,r:Math.random()*TAU,c:Math.random()});treesDirty=true;}}
  if(tool==='plant'||tool==='fell'){const fell=(tool==='fell')!==inv&&!(MODE==='god'&&G.phase!=='shape');
    if(fell){const n=trees.length;for(let q=trees.length-1;q>=0;q--){const t=trees[q];if((t.x-hover.x)**2+(t.z-hover.z)**2<R*R)trees.splice(q,1);}if(n!==trees.length)treesDirty=true;}
    else{plantAcc+=dt*(1+R*R*.03)*s*6;const rng=Math.random;while(plantAcc>1){plantAcc--;const a=rng()*TAU,r=Math.sqrt(rng())*R,x=hover.x+Math.cos(a)*r,z=hover.z+Math.sin(a)*r;
      if(Math.abs(x)>HALF-1||Math.abs(z)>HALF-1||wAt(x,z)>.08||slopeAt(x,z)>1.3)continue;
      if(buildings.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+.5))continue;
      if(MODE==='god'&&G.faith<.5)break;
      if(trees.some(t=>(t.x-x)**2+(t.z-z)**2<2.4))continue;
      trees.push({x,z,t:treeTypeFor(x,z,rng),s:.7+rng()*.55,r:rng()*TAU,c:rng()});treesDirty=true;}}}
  if(MODE==='god'){const planted=Math.max(0,trees.length-nTree);godCharge(dVol,dWat,planted);strokeVol+=dVol;}
  if(terr||tool==='road'){refreshTerrain(i0,j0,i1,j1);
    strokeBox=strokeBox?[Math.min(strokeBox[0],i0),Math.min(strokeBox[1],j0),Math.max(strokeBox[2],i1),Math.max(strokeBox[3],j1)]:[i0,j0,i1,j1];
    if(trees.some(t=>Math.abs(t.x+HALF-cx)<R+1&&Math.abs(t.z+HALF-cz)<R+1))treesDirty=true;}
}
function endStroke(){
  if(strokeBox){const [i0,j0,i1,j1]=strokeBox;const x0=i0-HALF,x1=i1-HALF,z0=j0-HALF,z1=j1-HALF;
    for(const b of allB()){if(b.x+b.r>x0&&b.x-b.r<x1&&b.z+b.r>z0&&b.z-b.r<z1)realize(b);}
    if(tool==='road'){for(const b of buildings)if(!b.manual&&b.type!=='house'&&b.x+12>x0&&b.x-12<x1&&b.z+12>z0&&b.z-12<z1){}recolorAll();}}
  if(MODE==='god')godStrokeEnd(strokeVol,hover);
  strokeBox=null;
}
// ---------------- ghost preview
let ghostB=null,ghost=null,ghostKey='',ghostInfo=null,ghostErr=null,ghostT=0;
function clearGhost(){if(ghost){scene.remove(ghost);disposeObj(ghost);ghost=null;}}
function rotateGhost(dir){if(!ghostB)return;ghostB.manual=true;ghostB.rot+=dir*PI/8;ghostKey='';}
function updateGhost(now){
  if(!ghostB||!hover||!mouse.in){clearGhost();if(ghostB)insp.classList.add('hidden');return;}
  if(now-ghostT<45)return;
  const fresh=newRecord(ghostB.type,0,0,0,ghostB.seed);ghostB.d=fresh.d;
  ghostB.x=hover.x;ghostB.z=hover.z;ghostB.id=-1;let snapped=null;
  if(ghostB.type==='house')snapped=houseSnap(ghostB,hover.x,hover.z);
  if(!snapped&&!ghostB.manual)ghostB.rot=autoRot(ghostB);
  const key=[ghostB.type,ghostB.seed,ghostB.x.toFixed(1),ghostB.z.toFixed(1),ghostB.rot.toFixed(3),buildings.length].join('|');
  if(key===ghostKey)return;ghostKey=key;ghostT=now;
  clearGhost();
  const pre=generate(ghostB,'ok');ghostErr=canPlace(ghostB,pre.info.r);
  if(ghostErr){disposeObj(pre.grp);ghost=generate(ghostB,'bad').grp;}else ghost=pre.grp;
  ghostInfo=pre.info;ghostInfo.snapped=!!snapped;scene.add(ghost);
  showInspector();
}
function placeGhost(){
  if(!ghostB||!ghostInfo)return;if(ghostErr){toast(ghostErr);return;}
  pushUndo();const b=newRecord(ghostB.type,ghostB.x,ghostB.z,ghostB.rot,ghostB.seed);b.w=ghostB.w;b.d=ghostB.d;b.manual=ghostB.manual;b.level=ghostB.level;b.variant=ghostB.variant;
  addBuilding(b);realize(b);clearTreesAround(b.x,b.z,b.r+(b.type==='camp'||b.type==='castle'?1.5:.4));rebuildNear(b.x,b.z,34,b);realize(b);
  if(['castle','church','market'].includes(b.type))recolorAll();
  toast(`${b.info.name} built`);
  ghostB.seed=(Math.random()*1e9)|0;const r=newRecord(ghostB.type,0,0,0,ghostB.seed);ghostB.w=r.w;ghostB.d=r.d;ghostKey='';
}
function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function showInspector(){
  if(MODE==='god'){godInspector();return;}
  let html='';
  if(ghostB&&ghostInfo){html=`<h2>${esc(ghostInfo.name)}</h2><div class="kind">${BT[ghostB.type]} · preview${ghostInfo.snapped?' · joining neighbour':''}</div><ul>${ghostInfo.traits.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`+
    (ghostErr?`<div class="warn">${esc(ghostErr)}</div>`:`<div class="ok">Click to build</div>`)+
    `<div class="keys">R rotate · V new variant · F auto-facing ${ghostB.manual?'<b>off</b>':'<b>on</b>'}${ghostB.type==='house'?'<br>Place beside another house to merge them':''}</div>`;}
  else{const b=selected||((tool==='inspect'||tool==='demolish')?hoverB:null);
    if(b&&b.info){html=`<h2>${esc(b.info.name)}</h2><div class="kind">${BT[b.type]}${selected?'':' · click to select'}</div><ul>${b.info.traits.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
      if(selected===b)html+=`<div class="acts"><button data-a="rot">Rotate (R)</button><button data-a="var">Variant (V)</button><button data-a="del">Demolish</button></div>`;}}
  insp.innerHTML=html;insp.classList.toggle('hidden',!html);
  for(const btn of insp.querySelectorAll('button[data-a]'))btn.onclick=()=>{const b=selected;if(!b)return;pushUndo();
    if(btn.dataset.a==='rot'){b.rot+=PI/4;b.manual=true;realize(b);rebuildNear(b.x,b.z,12,b);}
    if(btn.dataset.a==='var'){b.seed=(Math.random()*1e9)|0;const r=newRecord(b.type,0,0,0,b.seed);if(!isAttachedAny(b)){b.w=r.w;}realize(b);rebuildNear(b.x,b.z,12,b);}
    if(btn.dataset.a==='del'){removeBuilding(b);rebuildNear(b.x,b.z,34);selected=null;}
    showInspector();};
}
function isAttachedAny(b){return buildings.some(o=>o!==b&&isAttached(b,o));}
// ---------------- brush ring
const ringN=72;const ringGeo=new THREE.BufferGeometry();ringGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ringN*3),3));
const ring=new THREE.LineLoop(ringGeo,new THREE.LineBasicMaterial({color:0xfff1c0,transparent:true,opacity:.85,depthTest:false}));ring.renderOrder=9;scene.add(ring);
function updateRing(){
  let R=brush.r,cx,cz,col=0xfff1c0,show=false;
  if(hover&&mouse.in){if(BRUSH_DEF[tool]!=null||tool==='spring'){show=true;cx=hover.x;cz=hover.z;if(tool==='spring')R=1.5;
      col={pour:0x7fd0ff,drain:0x7fd0ff,spring:0x7fd0ff,plant:0x9fe07a,fell:0xe0a07a,road:0xe6c48a}[tool]||(shift?0xffa080:0xfff1c0);}
    else if((tool==='inspect'||tool==='demolish')&&hoverB){show=true;cx=hoverB.x;cz=hoverB.z;R=hoverB.r;col=tool==='demolish'?0xff5040:0xffe080;}}
  ring.visible=show;if(!show)return;ring.material.color.setHex(col);const p=ringGeo.attributes.position.array;
  for(let i=0;i<ringN;i++){const a=i/ringN*TAU,x=cx+Math.cos(a)*R,z=cz+Math.sin(a)*R;p[i*3]=x;p[i*3+1]=hAt(x,z)+Math.max(0,wAt(x,z))+.25;p[i*3+2]=z;}
  ringGeo.attributes.position.needsUpdate=true;ringGeo.computeBoundingSphere();
}
// ---------------- top bar
const tod=document.getElementById('tod');tod.oninput=()=>setTime(+tod.value);
function togglePause(){SIM.paused=!SIM.paused;const b=document.getElementById('bPause');b.textContent=SIM.paused?'Water paused':'Water flowing';b.classList.toggle('on',SIM.paused);}
document.getElementById('bPause').onclick=togglePause;
document.getElementById('bUndo').onclick=undo;
document.getElementById('bSave').onclick=()=>{try{localStorage.setItem('hearthmere_save',serialize());toast('Realm saved in this browser');}catch(e){toast('Could not save here — use Export');}};
document.getElementById('bLoad').onclick=()=>{let s=null;try{s=localStorage.getItem('hearthmere_save');}catch(e){}if(!s){toast('No saved realm found');return;}try{deserialize(s);toast('Realm loaded');}catch(e){toast('Save could not be read');}};
document.getElementById('bExport').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([serialize()],{type:'application/json'}));a.download='hearthmere-realm.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);};
const fileIn=document.getElementById('fileIn');document.getElementById('bImport').onclick=()=>fileIn.click();
fileIn.onchange=()=>{const f=fileIn.files[0];if(!f)return;f.text().then(t=>{try{deserialize(t);toast('Realm imported');}catch(e){toast('That file is not a Hearthmere realm');}});fileIn.value='';};
document.getElementById('bNew').onclick=()=>{pushUndo();newWorld((Math.random()*1e6)|0);toast('New land surveyed');};
document.getElementById('bHelp').onclick=()=>document.getElementById('help').classList.toggle('hidden');
document.getElementById('bHelpClose').onclick=()=>document.getElementById('help').classList.add('hidden');
const stEls={p:document.getElementById('stPop'),b:document.getElementById('stB'),t:document.getElementById('stT'),w:document.getElementById('stW')};
function updateStats(){let pop=0;for(const b of buildings){if(b.type==='house')pop+=(b._st||1)*2+1;else if(b.type==='tavern')pop+=4;else if(b.type==='castle')pop+=12;else if(b.type==='camp')pop+=5;else if(b.type==='church')pop+=1;else if(b.type==='smith'||b.type==='mill')pop+=2;}
  let wv=0;for(let k=0;k<V;k++)wv+=W[k];
  stEls.p.textContent=pop;stEls.b.textContent=buildings.length;stEls.t.textContent=trees.filter(t=>t.t!==4).length;stEls.w.textContent=wv>=1000?(wv/1000).toFixed(1)+'k':wv.toFixed(0);}

// ================================================================ world init
function newWorld(seed){
  for(const b of buildings.slice())removeBuilding(b);selected=null;
  genTerrain(seed);for(let i=0;i<700;i++)simStep();genTrees(seed);
  refreshTerrain();updateSkirt();refreshSprings();refreshCivic();updateWaterMesh(true);rebuildTrees();
}

