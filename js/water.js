'use strict';
// ================================================================ water simulation (virtual pipes)
// wet-span acceleration: each row only iterates the columns that hold (or border) water
const RLO=new Int32Array(S).fill(0),RHI=new Int32Array(S).fill(N);let simScan=7;
function rescanWet(){for(let j=0;j<S;j++){let lo=S,hi=-1;const row=j*S;for(let i=0;i<S;i++){const k=row+i;if(W[k]>1e-5){if(i<lo)lo=i;hi=i;}else if(F[k*4]||F[k*4+1]||F[k*4+2]||F[k*4+3]){F[k*4]=F[k*4+1]=F[k*4+2]=F[k*4+3]=0;}}RLO[j]=lo;RHI[j]=hi;}}
function simStep(){
  const c=SIM.c,dm=SIM.damp,drain=SIM.drain;
  if(++simScan>=8){simScan=0;rescanWet();}
  for(const s of springs){const ci=Math.round(s.x+HALF),cj=Math.round(s.z+HALF);
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=ci+di,j=cj+dj;if(i<0||j<0||i>N||j>N)continue;W[j*S+i]+=s.rate/9;if(i<RLO[j])RLO[j]=i;if(i>RHI[j])RHI[j]=i;}}
  for(let j=0;j<S;j++){const hi0=RHI[j];if(hi0<0)continue;const row=j*S;for(let i=RLO[j];i<=hi0;i++){const k=row+i,k4=k*4,w=W[k];
    if(w<=1e-5){F[k4]=F[k4+1]=F[k4+2]=F[k4+3]=0;continue;}
    const h=H[k]+w;let fl,fr,ft,fb,n;
    if(i>0){n=k-1;fl=F[k4]*dm+c*(h-H[n]-W[n]);}else fl=drain?F[k4]*dm+c*w*.5:0;
    if(i<N){n=k+1;fr=F[k4+1]*dm+c*(h-H[n]-W[n]);}else fr=drain?F[k4+1]*dm+c*w*.5:0;
    if(j>0){n=k-S;ft=F[k4+2]*dm+c*(h-H[n]-W[n]);}else ft=drain?F[k4+2]*dm+c*w*.5:0;
    if(j<N){n=k+S;fb=F[k4+3]*dm+c*(h-H[n]-W[n]);}else fb=drain?F[k4+3]*dm+c*w*.5:0;
    if(w<.4){const q=.2+w*2;fl*=q;fr*=q;ft*=q;fb*=q;}
    if(fl<0)fl=0;if(fr<0)fr=0;if(ft<0)ft=0;if(fb<0)fb=0;
    const sm=fl+fr+ft+fb;if(sm>w){const q=w/sm;fl*=q;fr*=q;ft*=q;fb*=q;}
    F[k4]=fl;F[k4+1]=fr;F[k4+2]=ft;F[k4+3]=fb;}}
  let pLo=S,pHi=-1;// previous row's span (before update) for neighbour union
  for(let j=0;j<S;j++){const cLo=RLO[j],cHi=RHI[j];const nLo=j<N?RLO[j+1]:S,nHi=j<N?RHI[j+1]:-1;
    let lo=Math.min(pLo,cLo,nLo)-1,hi=Math.max(pHi,cHi,nHi)+1;pLo=cLo;pHi=cHi;
    if(hi<lo||hi<0){RLO[j]=S;RHI[j]=-1;continue;}if(lo<0)lo=0;if(hi>N)hi=N;
    const row=j*S;let wLo=S,wHi=-1;
    for(let i=lo;i<=hi;i++){const k=row+i,k4=k*4;
      const inL=i>0?F[(k-1)*4+1]:0,inR=i<N?F[(k+1)*4]:0,inT=j>0?F[(k-S)*4+3]:0,inB=j<N?F[(k+S)*4+2]:0;
      const out=F[k4]+F[k4+1]+F[k4+2]+F[k4+3];
      let w=W[k]+inL+inR+inT+inB-out;
      if(w<.01)w*=.97;if(w<2e-4)w=0;
      if(w===0){if(W[k]!==0||SPD[k]!==0){W[k]=0;SPD[k]=0;FX[k]=0;FZ[k]=0;}F[k4]=F[k4+1]=F[k4+2]=F[k4+3]=0;continue;}
      const vx=(inL-F[k4]+F[k4+1]-inR)*.5,vz=(inT-F[k4+2]+F[k4+3]-inB)*.5;
      const iw=1/Math.max(w,.08);SPD[k]+=(Math.hypot(vx,vz)*iw-SPD[k])*.15;FX[k]+=(vx*iw-FX[k])*.1;FZ[k]+=(vz*iw-FZ[k])*.1;
      W[k]=w;if(i<wLo)wLo=i;wHi=i;}
    RLO[j]=wLo;RHI[j]=wHi;}
}
const wGeo=new THREE.BufferGeometry();
const wPos=new Float32Array(V*3),wD=new Float32Array(V),wS=new Float32Array(V),wF=new Float32Array(V*2),tWD=new Float32Array(V);
for(let k=0;k<V;k++){wPos[k*3]=tPos[k*3];wPos[k*3+2]=tPos[k*3+2];}
wGeo.setAttribute('position',new THREE.BufferAttribute(wPos,3));
wGeo.setAttribute('aD',new THREE.BufferAttribute(wD,1));wGeo.setAttribute('aS',new THREE.BufferAttribute(wS,1));wGeo.setAttribute('aF',new THREE.BufferAttribute(wF,2));
for(const a of ['position','aD','aS','aF'])wGeo.attributes[a].setUsage(THREE.DynamicDrawUsage);
wGeo.setIndex(new THREE.BufferAttribute(gIdx,1));
wGeo.boundingSphere=new THREE.Sphere(new THREE.Vector3(),200);
tGeo.setAttribute('aWD',new THREE.BufferAttribute(tWD,1).setUsage(THREE.DynamicDrawUsage));
const waterU={uIce:{value:0},uTime:{value:0},uSun:{value:new THREE.Vector3(1,1,1)},uSunCol:{value:new THREE.Color(1,1,1)},uSky:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uFogN:{value:260},uFogF:{value:900},uDay:{value:1},
  uTop:skyU.top,uHor:skyU.hor,uRain:{value:0}};
const WNOISE=`
vec3 nzd(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f),du=6.*f*(1.-f);
 float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453),b=fract(sin(dot(i+vec2(1.,0.),vec2(127.1,311.7)))*43758.5453),
 c=fract(sin(dot(i+vec2(0.,1.),vec2(127.1,311.7)))*43758.5453),d=fract(sin(dot(i+vec2(1.,1.),vec2(127.1,311.7)))*43758.5453);
 return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,du*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));}
vec3 waves(vec2 p,float t){vec3 h=vec3(0.);float A=1.,fq=.42;mat2 R=mat2(.8,.6,-.6,.8);vec2 q=p;
 for(int i=0;i<4;i++){vec3 n=nzd(q*fq+vec2(t*(.11+.05*float(i)),-t*.07*float(i+1)));h+=vec3(n.x*A,n.yz*A*fq);A*=.52;fq*=2.07;q=R*q;}
 return h;}
float caus(vec2 p,float t){vec2 q=p*.62;float c=0.;
 for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.27+t*.9+float(i)),cos(q.x*1.13-t*.8+float(i)*1.7))*.55;c+=1./(1.+9.*abs(sin(q.x+q.y*.3)*sin(q.y-q.x*.2)));}
 return c*c*.16;}
`;
const CLOUDU={uCT:{value:0},uCS:{value:.2}};
const CLOUDSH=`uniform float uCT,uCS;
float csh(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*15731.743);}
float csn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(csh(i),csh(i+vec2(1.,0.)),f.x),mix(csh(i+vec2(0.,1.)),csh(i+1.),f.x),f.y);}
float cloudShade(vec3 wp){vec2 p=wp.xz*.011+vec2(uCT*.05,uCT*.017);float f=csn(p)*.6+csn(p*2.3+4.1)*.3+csn(p*5.)*.1;return 1.-uCS*smoothstep(.5,.72,f);}
`;
const TDETAIL=`
float th1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float tvn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(th1(i),th1(i+vec2(1.,0.)),f.x),mix(th1(i+vec2(0.,1.)),th1(i+1.),f.x),f.y);}
float tdetail(vec3 wp,vec3 n,inout vec3 c){vec2 p=wp.xz;float fw=length(fwidth(p));float det=1.-smoothstep(.08,.6,fw);
 float n1=tvn(p*.22),n2=tvn(p*1.1+3.1),n3=tvn(p*5.3),n4=tvn(p*17.);
 float green=smoothstep(.01,.09,c.g-max(c.r,c.b)*.92);float slope=1.-n.y;
 float rk=smoothstep(.22,.5,slope)*(1.-green*.6);
 // meadow variation: dry patches, lush hollows, clover speckle
 c*=mix(1.,.9+.2*n1,green);c=mix(c,c*vec3(1.16,1.07,.72),green*smoothstep(.58,.85,n1)*.55);c=mix(c,c*vec3(.82,.95,.85),green*smoothstep(.6,.9,n2)*.4);
 c*=1.-green*.14*smoothstep(.35,.95,n4)*det;
 // bare soil / sand grain
 c*=mix(1.,.9+.18*n3,(1.-green)*(1.-rk));
 // rock strata on steep ground
 float st=tvn(vec2(wp.y*3.2+n2*1.6,(wp.x+wp.z)*.11));float st2=tvn(vec2(wp.y*9.+n3,(wp.x-wp.z)*.3));
 c*=1.-rk*(.22*st+.12*st2-.12);c=mix(c,c*vec3(1.05,1.,.92),rk*smoothstep(.6,.8,n2)*.4);
 return (green*(n4*.5+n3*.3)*det+rk*(st*.7+st2*.5)+(1.-green)*(1.-rk)*n3*.4*det);}
`;
const waterMat=new THREE.ShaderMaterial({uniforms:waterU,transparent:true,depthWrite:false,extensions:{derivatives:true},
  vertexShader:`attribute float aD;attribute float aS;attribute vec2 aF;varying float vD;varying float vS;varying vec2 vF;varying vec3 vP;
  void main(){vD=aD;vS=aS;vF=aF;vec4 wp=modelMatrix*vec4(position,1.);vP=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`,
  fragmentShader:`uniform float uTime,uFogN,uFogF,uDay,uIce,uRain;uniform vec3 uSun,uSunCol,uSky,uFog,uTop,uHor;varying float vD;varying float vS;varying vec2 vF;varying vec3 vP;
  ${WNOISE}
  vec3 skyAt(vec3 r){float h=clamp(r.y,0.,1.);return mix(uHor,uTop,pow(h,.55));}
  void main(){float a=smoothstep(.0,.06,vD);if(a<.01)discard;
   vec3 gn=normalize(cross(dFdx(vP),dFdy(vP)));if(gn.y<0.)gn=-gn;
   float t=uTime;vec2 p=vP.xz;float dist=length(cameraPosition-vP);
   // flow-mapped ripples (two phases) blended with drifting lake waves
   float fs=clamp(length(vF),0.,3.);vec2 fl=vF*1.6;
   float ph=fract(t*.32),ph2=fract(t*.32+.5),wb=abs(1.-2.*ph);
   vec3 w0=waves(p-fl*ph,t*.6),w1=waves(p-fl*ph2+vec2(3.7,1.9),t*.6);
   vec3 wv=mix(w0,w1,wb);vec3 lk=waves(p*1.3+vec2(9.1,2.3),t);
   vec2 g=mix(lk.yz,wv.yz,smoothstep(.05,.6,fs));
   float lodf=1./(1.+dist*.004);
   float amp=(.22+.35*smoothstep(.1,1.5,fs)+uRain*.25)*lodf;
   vec3 n=normalize(vec3(-g.x*amp,1.,-g.y*amp));
   n=normalize(mix(n,gn,smoothstep(.55,.95,1.-gn.y)*.8));
   // rain rings
   if(uRain>.01){vec2 c=floor(p*.9);vec2 f=fract(p*.9)-.5;float rr=fract(t*1.3+fract(sin(dot(c,vec2(12.9,78.2)))*437.5));float ring=sin(clamp(length(f)-rr*.45,-.2,.2)*60.)*(1.-rr);n.xz+=f*ring*.25*uRain;n=normalize(n);}
   n=normalize(mix(n,gn,uIce*.9));
   vec3 V=normalize(cameraPosition-vP);float NdV=max(dot(n,V),0.);
   float Fr=.02+.98*pow(1.-NdV,5.);
   vec3 L=normalize(uSun);
   // body colour from depth absorption
   vec3 T=exp(-max(vD,0.)*vec3(1.05,.42,.30));
   vec3 deep=vec3(.02,.13,.2),shal=vec3(.15,.5,.47);
   float diff=max(dot(n,L),0.)*.5+.5;
   vec3 body=mix(deep,shal,T.g)*diff*mix(.22,1.,uDay);
   // subsurface glow on wave flanks facing the sun
   body+=vec3(.05,.22,.18)*pow(max(dot(V,-L),0.),3.)*clamp(wv.x+lk.x-.8,0.,1.)*uDay;
   vec3 R=reflect(-V,n);R.y=abs(R.y);vec3 refl=skyAt(R)*mix(.3,1.,uDay);
   vec3 col=mix(body,refl,Fr*.9);
   // sun glint + sparkles
   float sd=max(dot(R,L),0.);
   col+=uSunCol*(pow(sd,900.)*6.+pow(sd,90.)*.35)*(1.-uIce*.7);
   float sparkle=step(.985,fract(sin(dot(floor(p*6.+n.xz*30.),vec2(21.1,57.3)))*4375.5))*pow(sd,18.);
   col+=uSunCol*sparkle*1.6*lodf*(1.-uIce);
   // shore & rapids foam
   float fn=nzd(p*2.3+vec2(t*.35,-t*.27)).x*.6+nzd(p*5.1-fl*t*.5).x*.4;
   float shore=(1.-smoothstep(.0,.32,vD))*smoothstep(.35,.75,fn+.35*sin(vD*22.-t*2.2));
   float rap=smoothstep(.9,2.2,vS)*smoothstep(.45,.7,fn);
   float foam=clamp(shore*.85+rap,0.,.9)*(1.-uIce);
   vec3 fcol=vec3(.93,.96,.97)*mix(.3,1.,uDay)*(.75+.25*max(dot(gn,L),0.));
   col=mix(col,fcol,foam);
   // ice
   vec3 ice=mix(vec3(.74,.84,.9),vec3(.9,.95,.98),nzd(p*.8).x)*mix(.35,1.,uDay);
   col=mix(col,ice+uSunCol*pow(sd,40.)*.4,uIce*.88*smoothstep(0.,.25,vD));
   float al=1.-dot(T,vec3(.33))*.9;al=clamp(al+.12,0.,1.);al=mix(al,1.,Fr);al=max(al,foam);al=mix(al*a,a*.97,uIce);
   float fd=smoothstep(uFogN,uFogF,dist);col=mix(col,uFog,fd);
   gl_FragColor=vec4(col,al);}`});
const water=new THREE.Mesh(wGeo,waterMat);water.renderOrder=2;water.frustumCulled=false;scene.add(water);
// caustics + wet darkening on the terrain under water
terrain.material.onBeforeCompile=sh=>{sh.uniforms.uCT=CLOUDU.uCT;sh.uniforms.uCS=CLOUDU.uCS;sh.uniforms.uTime=waterU.uTime;sh.uniforms.uSunCol=waterU.uSunCol;sh.uniforms.uIce=waterU.uIce;sh.uniforms.uDay=waterU.uDay;
  sh.vertexShader='attribute float aWD;varying float vWD;varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <fog_vertex>','#include <fog_vertex>\nvWD=aWD;vWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normal;');
  sh.fragmentShader='uniform float uTime,uIce,uDay;uniform vec3 uSunCol;varying float vWD;varying vec3 vWP;varying vec3 vWN;\n'+WNOISE+TDETAIL+CLOUDSH+sh.fragmentShader
   .replace('#include <color_fragment>','#include <color_fragment>\nfloat tH=tdetail(vWP,normalize(vWN),diffuseColor.rgb);diffuseColor.rgb*=cloudShade(vWP);')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n{float hh=tH*.06;vec3 dpx=dFdx(-vViewPosition),dpy=dFdy(-vViewPosition);vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float dt=dot(dpx,r1);vec3 gr=sign(dt)*(dFdx(hh)*r1+dFdy(hh)*r2);normal=normalize(abs(dt)*normal-gr);}')
   .replace('#include <fog_fragment>',
   `if(vWD>.02){float d=vWD;vec3 tint=exp(-d*vec3(.9,.35,.25));gl_FragColor.rgb*=mix(vec3(1.),tint*.85+.05,smoothstep(.02,.5,d));
    gl_FragColor.rgb+=uSunCol*caus(vWP.xz,uTime*.9)*.32*exp(-d*.55)*smoothstep(.02,.25,d)*(1.-uIce)*uDay;}
   #include <fog_fragment>`);};
terrain.material.customProgramCacheKey=()=>'terrainWater';
let wmFrame=0;
function updateWaterMesh(full){wmFrame=(wmFrame+1)%8;
  for(let j=0;j<S;j++){if(!full&&RHI[j]<0&&(j===0||RHI[j-1]<0)&&(j===N||RHI[j+1]<0)&&(j&7)!==wmFrame)continue;for(let i=0;i<S;i++){const k=j*S+i,w=W[k];tWD[k]=w;
    if(w>.012){wPos[k*3+1]=H[k]+w;wD[k]=w;wS[k]=SPD[k];wF[k*2]=FX[k];wF[k*2+1]=FZ[k];continue;}
    let lv=-1e9,sp=0,src=-1;
    if(i>0&&W[k-1]>.012&&H[k-1]+W[k-1]>lv){lv=H[k-1]+W[k-1];src=k-1;}
    if(i<N&&W[k+1]>.012&&H[k+1]+W[k+1]>lv){lv=H[k+1]+W[k+1];src=k+1;}
    if(j>0&&W[k-S]>.012&&H[k-S]+W[k-S]>lv){lv=H[k-S]+W[k-S];src=k-S;}
    if(j<N&&W[k+S]>.012&&H[k+S]+W[k+S]>lv){lv=H[k+S]+W[k+S];src=k+S;}
    if(src>=0){const dd=Math.min(lv-H[k],w);wPos[k*3+1]=Math.min(lv,H[k]+Math.max(w,0));wD[k]=lv-H[k]<0?lv-H[k]-.05:dd;wS[k]=SPD[src];wF[k*2]=FX[src];wF[k*2+1]=FZ[src];}
    else{wPos[k*3+1]=H[k]-.3;wD[k]=-1;wS[k]=0;wF[k*2]=wF[k*2+1]=0;}}}
  wGeo.attributes.position.needsUpdate=true;wGeo.attributes.aD.needsUpdate=true;wGeo.attributes.aS.needsUpdate=true;wGeo.attributes.aF.needsUpdate=true;tGeo.attributes.aWD.needsUpdate=true;
}

