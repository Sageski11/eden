'use strict';
// ================================================================ utils
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const PI=Math.PI, TAU=PI*2;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash2(x,y,s){let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,s,o=5){let t=0,a=.5,f=1,n=0;for(let k=0;k<o;k++){t+=a*vnoise(x*f,y*f,s+k*17);n+=a;a*=.5;f*=2.03;}return t/n;}
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};

// ================================================================ world grid
const N=320,S=N+1,V=S*S,HALF=N/2;
const H=new Float32Array(V),W=new Float32Array(V),F=new Float32Array(V*4),SPD=new Float32Array(V),ROAD=new Float32Array(V),FX=new Float32Array(V),FZ=new Float32Array(V);
const NOI=new Float32Array(V),NOI2=new Float32Array(V);
for(let j=0;j<S;j++)for(let i=0;i<S;i++){const k=j*S+i;NOI[k]=vnoise(i*.13,j*.13,7);NOI2[k]=hash2(i,j,3);}
function sampleArr(A,x,z){let gx=clamp(x+HALF,0,N),gz=clamp(z+HALF,0,N);let i=Math.floor(gx),j=Math.floor(gz);if(i>=N)i=N-1;if(j>=N)j=N-1;
  const fx=gx-i,fz=gz-j,k=j*S+i;return (A[k]*(1-fx)+A[k+1]*fx)*(1-fz)+(A[k+S]*(1-fx)+A[k+S+1]*fx)*fz;}
const hAt=(x,z)=>sampleArr(H,x,z), wAt=(x,z)=>sampleArr(W,x,z);
const springs=[];
const SIM={c:.2,damp:.995,paused:false,steps:3,drain:true};
let SNOWF=0,AUTUMN=0,WINTER=0;

// ================================================================ renderer / scene
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const canvas=renderer.domElement;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.5,4200);
const hemi=new THREE.HemisphereLight(0xcfe3ff,0x5a4a30,.55);scene.add(hemi);
const amb=new THREE.AmbientLight(0xffffff,.1);scene.add(amb);
const sun=new THREE.DirectionalLight(0xfff1d6,1);sun.castShadow=true;sun.shadow.mapSize.set(location.search.includes("lowq")?1024:4096,location.search.includes("lowq")?1024:4096);
{const c=sun.shadow.camera;c.left=-112;c.right=112;c.top=112;c.bottom=-112;c.near=10;c.far=900;}
sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
scene.fog=new THREE.Fog(0xcfe0ea,420,1700);
const skyU={top:{value:new THREE.Color()},hor:{value:new THREE.Color()},bot:{value:new THREE.Color(0x2a2a24)},sunDir:{value:new THREE.Vector3()},sunCol:{value:new THREE.Color()},uTime:{value:0},uCloud:{value:.55},uDay:{value:1}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(2400,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform vec3 top,hor,bot,sunDir,sunCol;uniform float uTime,uCloud,uDay;varying vec3 vP;
   float ch(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float cn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ch(i),ch(i+vec2(1.,0.)),f.x),mix(ch(i+vec2(0.,1.)),ch(i+1.),f.x),f.y);}
   float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*cn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
   void main(){vec3 d=normalize(vP);float h=d.y;
   vec3 c=h>0.?mix(hor,top,pow(clamp(h,0.,1.),.55)):mix(hor,bot,pow(clamp(-h,0.,1.),.4));
   vec3 L=normalize(sunDir);float s=max(dot(d,L),0.);c+=sunCol*(pow(s,600.)*2.+pow(s,12.)*.25);
   if(h>0.01){vec2 uv=d.xz/(h+.12)*1.6+vec2(uTime*.012,uTime*.004);float f=fbm(uv);float f2=fbm(uv*2.1+vec2(f*.8,-uTime*.01));
     float cov=smoothstep(1.-uCloud,1.25-uCloud*.6,f*.75+f2*.35);float edge=smoothstep(.0,.25,h);
     vec3 lit=mix(vec3(.62,.64,.7),vec3(1.,.98,.94),uDay)*(.78+.32*smoothstep(.2,.9,f2))+sunCol*pow(s,6.)*.35;
     vec3 shade=mix(hor,vec3(.5,.52,.58)*mix(.25,1.,uDay),.6);
     vec3 cc=mix(shade,lit,clamp(1.15-cov*.7+ (f2-.5)*.6,0.,1.));
     c=mix(c,cc,cov*edge*.92);}
   gl_FragColor=vec4(c,1.);}`}));
sky.renderOrder=-10;scene.add(sky);
const table=new THREE.Mesh(new THREE.CylinderGeometry(290,320,8,64),new THREE.MeshStandardMaterial({color:0x2c2117,roughness:1}));
table.position.y=-19;scene.add(table);

