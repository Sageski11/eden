'use strict';
// ================================================================ animated splash artwork for the main menu
// "The Spirit of the Valley": a cloaked guardian with a hearth-flame staff and a stag made of light,
// on a crag above a castle town at sunset. Painted procedurally in layered 2D with parallax and living motion.
const ART={on:false,W:1920,H:1080,cw:0,ch:0,s:1,t:0,last:0,layers:{},mx:0,my:0,pmx:0,pmy:0,intro:0,parts:[],wisps:[],birds:[],leaves:[],smoke:[],flies:[],clouds:[],mist:[],stars:[]};
const artCv=document.createElement('canvas');artCv.id='mart';const actx=artCv.getContext('2d');
const TX=130;const SUN={x:1005+TX,y:560,r:74};const MV=90;// virtual margin for parallax
const AR=mulberry(77);
function avn(x){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);const h=n=>{let t=Math.sin(n*127.1+311.7)*43758.5453;return t-Math.floor(t);};return h(i)*(1-u)+h(i+1)*u;}
function afbm(x,o=5){let v=0,a=.5,f=1;for(let i=0;i<o;i++){v+=a*avn(x*f+i*13.7);a*=.5;f*=2.03;}return v;}
function lg(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
function rg(c,x,y,r0,r1,stops){const g=c.createRadialGradient(x,y,r0,x,y,r1);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
function poly(c,pts){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();}
function ridgePts(x0,x1,step,base,amp,sc,seed,shape){const p=[];for(let x=x0;x<=x1+step;x+=step){const n=afbm(x*sc+seed,6);p.push([x,base-(n-.35)*amp-(shape?shape(x):0)]);}return p;}
// ---------------------------------------------------------------- static layers (rendered once per resize)
function mkLayer(draw){const c=document.createElement('canvas');const s=ART.s;c.width=Math.ceil((ART.W+2*MV)*s);c.height=Math.ceil((ART.H+2*MV)*s);const x=c.getContext('2d');x.setTransform(s,0,0,s,MV*s,MV*s);draw(x);return c;}
function grainTile(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const d=x.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);return c;}
function paintTexture(x,pts,alpha,dark){// brush-stroke texture clipped to a shape
  x.save();poly(x,pts);x.clip();x.globalAlpha=alpha;const r=mulberry(pts.length*31+7);
  for(let i=0;i<260;i++){const px=-MV+r()*(ART.W+2*MV),py=-MV+r()*(ART.H+2*MV);x.strokeStyle=r()<.5?(dark||'rgba(0,0,0,.5)'):'rgba(255,220,180,.35)';x.lineWidth=1+r()*3;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+20+r()*40,py-6+r()*12,px+40+r()*80,py+r()*8-4);x.stroke();}
  x.restore();}
function drawSky(x){const W=ART.W,H=ART.H;
  x.fillStyle=lg(x,0,-MV,0,H,[[0,'#0a0820'],[.22,'#1f1438'],[.42,'#4a2147'],[.55,'#8e3a4a'],[.64,'#d0684a'],[.71,'#f2a45c'],[.78,'#ffd590'],[1,'#ffe7b4']]);x.fillRect(-MV,-MV,W+2*MV,H+2*MV);
  x.fillStyle=rg(x,SUN.x,SUN.y,0,900,[[0,'rgba(255,236,190,.95)'],[.12,'rgba(255,200,120,.55)'],[.4,'rgba(240,120,80,.18)'],[1,'rgba(120,40,80,0)']]);x.fillRect(-MV,-MV,W+2*MV,H+2*MV);
  // high wispy cirrus painted into the sky
  const r=mulberry(5);x.globalCompositeOperation='screen';
  x.filter='blur(3px)';for(let i=0;i<22;i++){const y=80+r()*280,x0=-100+r()*W,len=200+r()*500;x.strokeStyle=`rgba(255,${150+r()*60|0},${140+r()*60|0},${.04+r()*.05})`;x.lineWidth=4+r()*10;x.beginPath();x.moveTo(x0,y);x.bezierCurveTo(x0+len*.3,y-10-r()*20,x0+len*.7,y+10,x0+len,y-4);x.stroke();}
  x.filter='none';x.globalCompositeOperation='source-over';}
function drawFarMountains(x){const W=ART.W;
  const back=ridgePts(-MV,W+MV,8,560,300,.0028,41,x=>Math.max(0,140-Math.abs(x-300)*.25)+Math.max(0,120-Math.abs(x-1650)*.2));
  const pts1=[...back,[W+MV,800],[-MV,800]];x.fillStyle=lg(x,0,300,0,720,[[0,'#8a5f8e'],[.5,'#9a6382'],[1,'#c07a74']]);poly(x,pts1);x.fill();
  // snow caps & lit faces
  x.save();poly(x,pts1);x.clip();x.globalCompositeOperation='screen';
  for(let i=0;i<back.length-1;i++){const [ax,ay]=back[i],[bx,by]=back[i+1];if(ay<470){x.strokeStyle=`rgba(255,215,190,${clamp((470-ay)/150,0,.55)})`;x.lineWidth=3;x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();
      if(i%3===0){x.fillStyle='rgba(255,220,200,.12)';x.beginPath();x.moveTo(ax,ay);x.lineTo(ax+(SUN.x>ax?40:-40),ay+90);x.lineTo(ax+(SUN.x>ax?10:-10),ay+110);x.closePath();x.fill();}}}
  x.globalCompositeOperation='source-over';x.restore();
  x.fillStyle=lg(x,0,500,0,700,[[0,'rgba(255,190,150,0)'],[1,'rgba(255,190,150,.45)']]);poly(x,pts1);x.fill();
  const near=ridgePts(-MV,W+MV,7,640,170,.004,9,x=>-Math.max(0,90-Math.abs(x-SUN.x)*.35));
  const pts2=[...near,[W+MV,900],[-MV,900]];x.fillStyle=lg(x,0,520,0,760,[[0,'#6a3f66'],[1,'#7c4760']]);poly(x,pts2);x.fill();
  x.fillStyle=lg(x,0,560,0,760,[[0,'rgba(255,170,130,0)'],[1,'rgba(255,170,130,.35)']]);poly(x,pts2);x.fill();
  paintTexture(x,pts2,.08,'rgba(40,10,40,.5)');}
const TOWN={wins:[],chims:[],banner:[1006,398]};
function drawTown(x){const r=mulberry(12);TOWN.wins.length=0;TOWN.chims.length=0;x.save();x.translate(TX,0);
  const hill=[[620,760],[720,700],[820,662],[920,640],[1000,634],[1090,642],[1180,664],[1280,700],[1390,760],[1390,800],[620,800]];
  const sil='#2a1830';
  x.fillStyle=lg(x,0,600,0,800,[[0,'#3a2038'],[1,'#2a1830']]);poly(x,hill);x.fill();
  const shapes=[];const S=(pts)=>{shapes.push(pts);};
  const crenRect=(x0,x1,yt,yb,merl)=>{const p=[[x0,yb],[x0,yt]];const n=Math.max(2,Math.round((x1-x0)/merl));for(let i=0;i<n;i++){const a=x0+(x1-x0)*i/n,b=x0+(x1-x0)*(i+.5)/n,c=x0+(x1-x0)*(i+1)/n;p.push([a,yt],[a,yt-9],[b,yt-9],[b,yt]);}p.push([x1,yt],[x1,yb]);return p;};
  const tower=(cx,w,yt,yb,roof)=>{S([[cx-w/2,yb],[cx-w/2,yt],[cx-w/2-5,yt],[cx,yt-roof],[cx+w/2+5,yt],[cx+w/2,yt],[cx+w/2,yb]]);};
  S(crenRect(890,1120,598,650,22));S(crenRect(958,1052,508,600,16));tower(905,38,548,650,52);tower(1100,40,532,650,58);tower(1005,32,462,512,58);tower(958,22,520,600,34);tower(1052,22,515,600,36);
  S([[1004,404],[1006,404],[1006,462],[1004,462]]);
  // chapel on the left shoulder of the hill
  S([[790,668],[790,618],[812,600],[834,618],[834,668]]);S([[838,668],[838,612],[848,602],[848,560],[853,520],[858,560],[858,602],[868,612],[868,668]]);
  // houses down both slopes
  const house=(hx,base,w,h,flip)=>{const roof=h*.8;S([[hx-w/2,base+4],[hx-w/2,base-h],[hx-w/2-3,base-h],[hx,base-h-roof],[hx+w/2+3,base-h],[hx+w/2,base-h],[hx+w/2,base+4]]);
    const nw=1+(r()<.6);for(let i=0;i<nw;i++)TOWN.wins.push([hx-w/2+w*(i+1)/(nw+1),base-h*.55,1+r()*.6,r()*9]);if(r()<.6){const cx=hx+(flip?-1:1)*w*.25,cy=base-h-roof*.45;S([[cx-3,cy+8],[cx-3,cy-10],[cx+4,cy-10],[cx+4,cy+8]]);TOWN.chims.push([cx,cy-10]);}};
  const hillY=X=>{for(let i=0;i<hill.length-2;i++){const [ax,ay]=hill[i],[bx,by]=hill[i+1];if(X>=ax&&X<=bx)return ay+(by-ay)*(X-ax)/(bx-ax);}return 760;};
  for(let X=660;X<890;X+=24+r()*14){if(X>780&&X<875)continue;house(X,hillY(X)+6,20+r()*10,16+r()*10,false);}
  for(let X=1130;X<1370;X+=22+r()*16)house(X,hillY(X)+6,20+r()*12,16+r()*12,true);
  for(let X=700;X<1330;X+=30+r()*20)if(X<870||X>1135)house(X+8,hillY(X)+24,18+r()*8,12+r()*8,r()<.5);
  for(const p of shapes){x.fillStyle=sil;poly(x,p);x.fill();}
  // castle windows
  for(const [wx,wy] of [[905,590],[905,620],[1100,575],[1100,610],[985,540],[1025,540],[985,570],[1025,570],[1005,486],[1010,620],[960,628],[1060,628],[852,640],[812,640]])TOWN.wins.push([wx,wy,1.4+r()*.5,r()*9]);
  // backlit rim
  x.save();x.globalCompositeOperation='screen';x.shadowColor='rgba(255,160,80,.9)';x.shadowBlur=14;x.strokeStyle='rgba(255,170,90,.28)';x.lineWidth=1.4;
  for(const p of shapes){poly(x,p);x.stroke();}poly(x,hill);x.stroke();x.restore();
  // haze over the town base
  x.fillStyle=rg(x,1000,790,40,480,[[0,'rgba(230,140,130,.28)'],[1,'rgba(230,140,130,0)']]);x.fillRect(500,560,1000,300);
  x.restore();for(const w of TOWN.wins)w[0]+=TX;for(const c of TOWN.chims)c[0]+=TX;TOWN.banner=[1006+TX,404];}
const RIVER={L:[[1102,742],[1086,760],[1040,786],[960,818],[880,860],[800,930],[690,1020],[600,1180]],R:[[1120,742],[1112,762],[1080,790],[1020,824],[960,866],[900,936],[830,1020],[790,1180]]};
function drawValley(x){const W=ART.W;
  // valley floor meadows
  const floor=[[-MV,760],[400,742],[700,752],[1000,746],[1300,752],[1700,742],[W+MV,760],[W+MV,1200],[-MV,1200]];
  x.fillStyle=lg(x,0,740,0,1000,[[0,'#6a4258'],[.3,'#4a3044'],[1,'#22162a']]);poly(x,floor);x.fill();
  // fields: warm stripes
  const r=mulberry(3);x.save();poly(x,floor);x.clip();x.globalCompositeOperation='overlay';
  for(let i=0;i<40;i++){const fx=r()*W,fy=760+r()*120;x.fillStyle=`rgba(${200+r()*55|0},${120+r()*60|0},70,${.12+r()*.1})`;x.beginPath();x.ellipse(fx,fy,60+r()*120,6+r()*10,(r()-.5)*.1,0,TAU);x.fill();}
  x.restore();
  // river
  const rp=[...RIVER.L,...RIVER.R.slice().reverse()];x.fillStyle=lg(x,0,742,0,1080,[[0,'#ffe2a0'],[.25,'#f2a868'],[.6,'#a8587a'],[1,'#3a2a50']]);poly(x,rp);x.fill();
  x.strokeStyle='rgba(30,15,30,.55)';x.lineWidth=3;x.beginPath();x.moveTo(...RIVER.L[0]);for(const p of RIVER.L)x.lineTo(...p);x.stroke();x.beginPath();x.moveTo(...RIVER.R[0]);for(const p of RIVER.R)x.lineTo(...p);x.stroke();}
function pine(x,px,py,h,col,rim){const w=h*.36;x.fillStyle=col;x.beginPath();x.moveTo(px,py-h);const tiers=5;
  for(let i=1;i<=tiers;i++){const y=py-h+h*i/tiers,ww=w*(.35+.65*i/tiers);x.lineTo(px+ww,y);x.lineTo(px+ww*.45,y-h*.05);}
  for(let i=tiers;i>=1;i--){const y=py-h+h*i/tiers,ww=w*(.35+.65*i/tiers);x.lineTo(px-ww*.45,y-h*.05);x.lineTo(px-ww,y);}x.closePath();x.fill();
  if(rim){x.strokeStyle=rim;x.lineWidth=1.4;x.beginPath();x.moveTo(px,py-h);const side=px>SUN.x?-1:1;for(let i=1;i<=tiers;i++){const y=py-h+h*i/tiers,ww=w*(.35+.65*i/tiers);x.lineTo(px+side*ww,y);x.moveTo(px+side*ww*.45,y-h*.05);}x.stroke();}}
function drawForest(x){const W=ART.W;const r=mulberry(19);
  const lefth=[[-MV,830],[200,800],[420,812],[600,840],[720,870],[820,912],[760,1000],[660,1200],[-MV,1200]];
  const righth=[[1000,900],[1060,850],[1180,836],[1300,830],[1500,822],[1750,812],[W+MV,826],[W+MV,1200],[930,1200]];
  for(const h of [lefth,righth]){x.fillStyle=lg(x,0,800,0,1000,[[0,'#2e1c30'],[1,'#160e1a']]);poly(x,h);x.fill();}
  const row=(x0,x1,yf,hmin,hmax,col,rim)=>{for(let X=x0;X<x1;X+=9+r()*14){pine(x,X,yf(X)+6,hmin+r()*(hmax-hmin),col,rim);}};
  const yl=X=>X<200?830-X*.15:X<420?800+(X-200)*.05:X<600?812+(X-420)*.15:840+(X-600)*.32;
  const yr=X=>X<1180?880-(X-1050)*.34:X<1500?836-(X-1180)*.044:822-(X-1500)*.03;
  row(-MV,790,yl,50,120,'#22142a','rgba(255,150,100,.45)');row(1050,W+MV,yr,50,130,'#22142a','rgba(255,150,100,.4)');
  row(-MV,700,X=>yl(X)+40,70,150,'#180e1e','rgba(255,140,90,.25)');row(1090,W+MV,X=>yr(X)+46,70,150,'#180e1e','rgba(255,140,90,.22)');}
const CRAG=[[1120,1200],[1140,960],[1190,880],[1250,846],[1330,834],[1480,828],[1620,834],[1720,856],[1800,846],[1880,862],[1920+MV,876],[1920+MV,1200]];
function drawCrag(x){x.fillStyle=lg(x,0,820,0,1080,[[0,'#2c1c26'],[.4,'#1e1219'],[1,'#0c070b']]);poly(x,CRAG);x.fill();
  // rock facets
  const r=mulberry(44);for(let i=0;i<26;i++){const cx=1170+r()*720,cy=880+r()*200,s=40+r()*90;const f=[[cx,cy],[cx+s*(.4+r()*.5),cy+s*(.1+r()*.3)],[cx+s*(.2+r()*.4),cy+s*(.5+r()*.5)],[cx-s*(.2+r()*.4),cy+s*(.3+r()*.4)]];
    x.save();poly(x,CRAG);x.clip();x.fillStyle=r()<.5?`rgba(255,160,110,${.03+r()*.05})`:`rgba(0,0,0,${.12+r()*.18})`;poly(x,f);x.fill();x.restore();}
  // lit top edge (sun from the left)
  x.save();x.globalCompositeOperation='screen';x.strokeStyle='rgba(255,170,110,.7)';x.lineWidth=3;x.shadowColor='rgba(255,150,80,.8)';x.shadowBlur=10;x.beginPath();x.moveTo(...CRAG[1]);for(let i=2;i<CRAG.length-1;i++)x.lineTo(...CRAG[i]);x.stroke();x.restore();
  // grass tufts along the top
  for(let i=1;i<CRAG.length-2;i++){const [ax,ay]=CRAG[i],[bx,by]=CRAG[i+1];for(let t=0;t<1;t+=.06){const gx=ax+(bx-ax)*t,gy=ay+(by-ay)*t;if(r()<.4)continue;
      for(let k=0;k<4;k++){const h=6+r()*14,lean=(r()-.3)*8;x.strokeStyle=r()<.3?'rgba(255,170,100,.6)':'#1a1012';x.lineWidth=1.3;x.beginPath();x.moveTo(gx+k*2,gy+2);x.quadraticCurveTo(gx+k*2+lean*.4,gy-h*.6,gx+k*2+lean,gy-h);x.stroke();}}}
  paintTexture(x,CRAG,.1,'rgba(0,0,0,.6)');}
function drawFrameLeft(x){const r=mulberry(8);
  const rocks=[[-MV,1200],[-MV,860],[60,850],[170,872],[260,910],[350,960],[430,1030],[480,1200]];x.fillStyle=lg(x,0,840,0,1080,[[0,'#1c1016'],[1,'#07040a']]);poly(x,rocks);x.fill();
  x.save();x.globalCompositeOperation='screen';x.strokeStyle='rgba(255,150,100,.35)';x.lineWidth=2;x.beginPath();x.moveTo(...rocks[1]);for(let i=2;i<rocks.length-1;i++)x.lineTo(...rocks[i]);x.stroke();x.restore();
  for(let i=0;i<70;i++){const t=r(),gx=rocks[2][0]+t*360,gy=850+t*170+r()*10;const h=10+r()*24;x.strokeStyle='#120a10';x.lineWidth=1.5;x.beginPath();x.moveTo(gx,gy);x.quadraticCurveTo(gx+4,gy-h*.6,gx+8+r()*6,gy-h);x.stroke();}}
function buildLayers(){ART.cw=artCv.width;ART.ch=artCv.height;ART.s=Math.max(ART.cw/ART.W,ART.ch/ART.H);
  const L=ART.layers;L.sky=mkLayer(drawSky);L.mount=mkLayer(drawFarMountains);L.town=mkLayer(drawTown);L.valley=mkLayer(drawValley);L.forest=mkLayer(drawForest);L.crag=mkLayer(drawCrag);L.frame=mkLayer(drawFrameLeft);
  if(!ART.grain)ART.grain=grainTile();
  if(!ART.cloudSpr){ART.cloudSpr=[];for(let k=0;k<5;k++){const c=document.createElement('canvas');c.width=560;c.height=200;const x=c.getContext('2d');const r=mulberry(100+k);
      for(let i=0;i<46;i++){const px=60+r()*440,py=70+r()*70-Math.sin((px-60)/440*PI)*40,rr=22+r()*46;x.fillStyle=rg(x,px,py,0,rr,[[0,`rgba(${150+r()*40|0},${90+r()*30|0},${130+r()*30|0},.55)`],[1,'rgba(120,70,120,0)']]);x.beginPath();x.arc(px,py,rr,0,TAU);x.fill();}
      x.globalCompositeOperation='source-atop';x.fillStyle=lg(x,0,40,0,190,[[0,'rgba(120,80,140,.9)'],[.6,'rgba(230,130,110,.9)'],[1,'rgba(255,200,140,1)']]);x.fillRect(0,0,560,200);ART.cloudSpr.push(c);}}
  if(!ART.mistSpr){const c=document.createElement('canvas');c.width=800;c.height=120;const x=c.getContext('2d');for(let i=0;i<30;i++){const px=60+Math.random()*680,py=60+(Math.random()-.5)*30,rr=40+Math.random()*60;x.fillStyle=rg(x,px,py,0,rr,[[0,'rgba(255,200,200,.09)'],[1,'rgba(255,200,200,0)']]);x.beginPath();x.ellipse(px,py,rr*1.8,rr*.5,0,0,TAU);x.fill();}ART.mistSpr=c;}}
function initArtState(){const r=Math.random;
  ART.stars=[];for(let i=0;i<140;i++)ART.stars.push([r()*1920,r()*380,r()*1.4+.3,r()*9]);
  ART.clouds=[];for(let i=0;i<7;i++)ART.clouds.push({x:r()*2300-200,y:140+r()*300,s:.7+r()*.9,v:4+r()*7,k:i%5,a:.55+r()*.4});
  ART.mist=[];for(let i=0;i<6;i++)ART.mist.push({x:r()*2000-200,y:i<3?700+r()*40:850+r()*50,s:1+r()*.8,v:(6+r()*8)*(r()<.5?1:-1),d:i<3?.25:.55});
  ART.birds=[];ART.flies=[];for(let i=0;i<26;i++)ART.flies.push({x:1150+r()*700,y:760+r()*200,ph:r()*9,v:.4+r()*.8});
  ART.leaves=[];ART.smoke=[];ART.wisps=[];ART.parts=[];ART.nextBirds=4;}
// ---------------------------------------------------------------- the guardian
function drawHero(x,t){const ox=1640,oy=828;x.save();x.translate(ox,oy);const br=1+Math.sin(t*1.1)*.005;x.scale(1,br);
  const w=k=>Math.sin(t*1.6-k*2.6)+Math.sin(t*2.7-k*3.9)*.45;
  // --- outer mantle streaming in the wind (behind)
  const M=[];const NM=14;for(let i=0;i<=NM;i++){const u=i/NM;M.push([40+u*170+w(u)*10*u,-292+u*230+Math.sin(t*2-u*4.5)*22*u]);}
  const Lw=[];for(let i=0;i<=NM;i++){const u=i/NM;Lw.push([20+u*120+w(u+.3)*8*u,-150+u*130+Math.sin(t*2.2-u*4)*14*u]);}
  x.beginPath();x.moveTo(-36,-298);x.lineTo(M[0][0],M[0][1]);for(let i=1;i<=NM;i++)x.lineTo(M[i][0],M[i][1]);for(let i=NM;i>=0;i--)x.lineTo(Lw[i][0],Lw[i][1]);x.lineTo(-10,-160);x.closePath();
  x.fillStyle=lg(x,0,-300,200,-20,[[0,'#6e1c14'],[.5,'#4a120e'],[1,'#22070a']]);x.fill();
  x.save();x.clip();x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=6;for(let k=1;k<5;k++){const i=Math.round(NM*k/5);x.beginPath();x.moveTo(30,-270+k*10);x.quadraticCurveTo((M[i][0]+Lw[i][0])/2,(M[i][1]+Lw[i][1])/2-20,M[Math.min(NM,i+3)][0],M[Math.min(NM,i+3)][1]);x.stroke();}x.restore();
  x.strokeStyle='#c99a3b';x.lineWidth=2.4;x.beginPath();x.moveTo(M[0][0],M[0][1]);for(let i=1;i<=NM;i++)x.lineTo(M[i][0],M[i][1]);x.stroke();
  // --- body cloak
  const hem=[];const NH=10;for(let i=0;i<=NH;i++){const u=i/NH;hem.push([66+w(.9)*6-u*134,-2+Math.sin(u*PI*4+t*2.4)*3-(1-u)*4]);}
  x.beginPath();x.moveTo(-26,-334);x.bezierCurveTo(-24,-356,-6,-370,12,-366);x.bezierCurveTo(28,-362,36,-346,34,-326);x.bezierCurveTo(34,-316,44,-304,52,-292);
  x.bezierCurveTo(60,-230,62+w(.5)*3,-120,hem[0][0],hem[0][1]);for(let i=1;i<=NH;i++)x.lineTo(hem[i][0],hem[i][1]);
  x.bezierCurveTo(-62,-110,-58,-220,-50,-292);x.bezierCurveTo(-40,-300,-30,-312,-26,-334);x.closePath();
  const bodyG=lg(x,-60,-370,60,0,[[0,'#2e1e22'],[.5,'#1d1418'],[1,'#0e090c']]);x.fillStyle=bodyG;x.fill();
  x.save();x.clip();for(let k=0;k<7;k++){const fx=-48+k*16;x.strokeStyle=k%2?'rgba(0,0,0,.4)':'rgba(120,90,90,.18)';x.lineWidth=4+k%3*2;x.beginPath();x.moveTo(fx*.5,-280);x.bezierCurveTo(fx*.7,-200,fx+w(k*.3)*3,-90,fx*1.1+w(k*.3)*4,0);x.stroke();}
  x.fillStyle=rg(x,-140,-300,10,240,[[0,'rgba(255,170,90,.38)'],[1,'rgba(255,170,90,0)']]);x.fillRect(-120,-380,240,400);
  x.fillStyle='rgba(0,0,0,.4)';x.beginPath();x.moveTo(-22,-332);x.bezierCurveTo(-18,-350,0,-358,14,-352);x.bezierCurveTo(4,-340,-6,-326,-22,-318);x.closePath();x.fill();x.restore();
  // belt & clasp
  x.strokeStyle='#4a2e18';x.lineWidth=6;x.beginPath();x.moveTo(-58,-176);x.quadraticCurveTo(0,-168,62,-178);x.stroke();x.fillStyle='#d9a650';x.beginPath();x.arc(-46,-176,4,0,TAU);x.fill();
  x.fillStyle='#e2b45a';x.beginPath();x.arc(-36,-292,5,0,TAU);x.fill();
  // boots
  x.fillStyle='#120a08';x.beginPath();x.ellipse(-30,0,14,6,0,0,TAU);x.fill();x.beginPath();x.ellipse(10,1,13,6,0,0,TAU);x.fill();
  // rim light on the sunward edge
  x.save();x.globalCompositeOperation='lighter';x.shadowColor='rgba(255,170,80,1)';x.shadowBlur=14;x.strokeStyle='rgba(255,205,130,.9)';x.lineWidth=2.2;
  x.beginPath();x.moveTo(12,-366);x.bezierCurveTo(-6,-370,-24,-356,-26,-334);x.bezierCurveTo(-30,-312,-40,-300,-50,-292);x.bezierCurveTo(-58,-220,-62,-110,-68,-4);x.stroke();x.restore();
  // arm, hand & staff
  const sx=-92+Math.sin(t*.8)*1.2,top=-476;
  x.fillStyle='#24171b';x.beginPath();x.moveTo(-48,-288);x.quadraticCurveTo(-82,-262,sx-4,-214);x.lineTo(sx+14,-206);x.quadraticCurveTo(-64,-246,-36,-262);x.closePath();x.fill();
  x.strokeStyle='rgba(255,190,120,.6)';x.lineWidth=1.6;x.beginPath();x.moveTo(-48,-288);x.quadraticCurveTo(-82,-262,sx-4,-214);x.stroke();
  x.strokeStyle='#2a170c';x.lineWidth=7;x.beginPath();x.moveTo(sx+4,6);x.lineTo(sx-2,top+34);x.stroke();
  x.strokeStyle='rgba(255,185,110,.75)';x.lineWidth=2;x.beginPath();x.moveTo(sx+1,6);x.lineTo(sx-5,top+34);x.stroke();
  x.fillStyle='#c58f6a';x.beginPath();x.ellipse(sx+3,-208,8,10,0,0,TAU);x.fill();
  x.strokeStyle='#3a2210';x.lineWidth=6;x.beginPath();x.moveTo(sx-2,top+36);x.bezierCurveTo(sx-8,top,sx+24,top-24,sx+32,top+4);x.bezierCurveTo(sx+34,top+20,sx+18,top+24,sx+14,top+12);x.stroke();
  x.strokeStyle='#d9a650';x.lineWidth=2;x.beginPath();x.arc(sx+6,top+8,17,0,TAU);x.stroke();
  const orb=[sx+6,top+8],fl=.85+.15*Math.sin(t*13)+.08*Math.sin(t*29);
  x.save();x.globalCompositeOperation='lighter';
  x.fillStyle=rg(x,orb[0],orb[1],0,230*fl,[[0,'rgba(255,210,130,.5)'],[.25,'rgba(255,150,60,.18)'],[1,'rgba(255,120,40,0)']]);x.fillRect(orb[0]-250,orb[1]-250,500,500);
  x.fillStyle=rg(x,orb[0],orb[1],0,18*fl,[[0,'#fffbe8'],[.4,'#ffd27a'],[1,'rgba(255,140,40,0)']]);x.beginPath();x.arc(orb[0],orb[1],18*fl,0,TAU);x.fill();
  for(let k=0;k<5;k++){const a=-PI/2+(k-2)*.35+Math.sin(t*6+k)*.15,L=(18+k%2*8)*fl;x.fillStyle=`rgba(255,${170+k*15},80,.55)`;x.beginPath();x.moveTo(orb[0]-5,orb[1]);x.quadraticCurveTo(orb[0]+Math.cos(a)*L*.6-4,orb[1]+Math.sin(a)*L*.6,orb[0]+Math.cos(a)*L,orb[1]+Math.sin(a)*L);x.quadraticCurveTo(orb[0]+Math.cos(a)*L*.6+4,orb[1]+Math.sin(a)*L*.6,orb[0]+5,orb[1]);x.fill();}
  x.strokeStyle='rgba(255,220,150,.75)';x.lineWidth=1.6;x.shadowColor='rgba(255,180,80,1)';x.shadowBlur=8;
  for(let k=0;k<7;k++){const a=t*.7+k*TAU/7,rx=orb[0]+Math.cos(a)*46,ry=orb[1]+Math.sin(a)*14;const sz=4+Math.sin(t*2+k);x.globalAlpha=.4+.6*(Math.sin(a)*.5+.5);
    x.beginPath();if(k%3===0){x.moveTo(rx-sz,ry+sz);x.lineTo(rx,ry-sz);x.lineTo(rx+sz,ry+sz);}else if(k%3===1){x.moveTo(rx,ry-sz);x.lineTo(rx,ry+sz);x.moveTo(rx-sz,ry-sz*.3);x.lineTo(rx+sz,ry+sz*.3);}else{x.arc(rx,ry,sz*.8,0,PI*1.5);}x.stroke();}
  x.restore();x.restore();
  ART.orbW=[ox+orb[0],oy+orb[1]*br];}
// ---------------------------------------------------------------- the spirit stag
const STAG={body:null,head:null};
function buildStag(){const BP=[],HP=[];const NB=()=>{const p=new Path2D();BP.push(p);return p;};const NH=()=>{const p=new Path2D();HP.push(p);return p;};
  NB().ellipse(4,-162,96,40,-.05,0,TAU);NB().ellipse(-62,-164,46,50,.1,0,TAU);NB().ellipse(70,-170,44,40,0,0,TAU);
  const limb=(pts,w)=>{const B=NB();// tapered limb along a polyline
    const L=[],R=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;const ww=w[i];L.push([pts[i][0]-dy/l*ww,pts[i][1]+dx/l*ww]);R.push([pts[i][0]+dy/l*ww,pts[i][1]-dx/l*ww]);}
    B.moveTo(L[0][0],L[0][1]);for(const p of L.slice(1))B.lineTo(p[0],p[1]);for(const p of R.reverse())B.lineTo(p[0],p[1]);B.closePath();};
  limb([[-74,-150],[-80,-96],[-82,-50],[-84,-4]],[15,8,5,5]);limb([[-46,-148],[-44,-96],[-40,-50],[-38,-4]],[14,8,5,5]);
  limb([[56,-160],[70,-110],[82,-74],[78,-36],[74,-4]],[22,14,7,5,5]);limb([[88,-160],[100,-112],[110,-76],[104,-36],[100,-4]],[20,12,6,5,5]);
  for(const hx of [-84,-38,74,100]){const B=NB();B.moveTo(hx-6,-8);B.lineTo(hx+6,-8);B.lineTo(hx+7,1);B.lineTo(hx-7,1);B.closePath();}
  {const B=NB();B.moveTo(108,-182);B.quadraticCurveTo(126,-186,122,-166);B.quadraticCurveTo(112,-168,108,-182);}
  let H;// relative to pivot (-80,-180)
  H=NH();H.moveTo(-34,8);H.quadraticCurveTo(-34,-40,-40,-82);H.lineTo(-16,-92);H.quadraticCurveTo(-4,-40,26,8);H.closePath();// neck
  H=NH();{const hp=[[-10,-86],[-12,-102],[-28,-110],[-46,-104],[-60,-92],[-78,-80],[-84,-72],[-78,-64],[-58,-64],[-38,-68],[-16,-74]];H.moveTo(hp[0][0],hp[0][1]);for(const q of hp.slice(1))H.lineTo(q[0],q[1]);H.closePath();}// head & muzzle
  H=NH();H.moveTo(-18,-98);H.quadraticCurveTo(4,-116,10,-110);H.quadraticCurveTo(2,-98,-14,-92);H.closePath();// ear
  H=NH();H.moveTo(-28,-40);H.quadraticCurveTo(-46,-30,-36,-4);H.lineTo(-24,-4);H.closePath();// throat ruff
  STAG.body=BP;STAG.head=HP;
  const A=new Path2D(),A2=new Path2D();const tine=(P,pts)=>{P.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)P.lineTo(pts[i][0],pts[i][1]);};
  const antler=(P,sx,o)=>{tine(P,[[-26+o,-102],[-32+o*1.2,-132],[-24+o*1.6,-170],[-6+o*2,-204],[14+o*2,-226]]);tine(P,[[-30+o,-122],[-52+o,-138]]);tine(P,[[-28+o*1.4,-152],[-54+o*1.4,-170]]);
    tine(P,[[-14+o*1.8,-188],[-28+o*1.8,-220]]);tine(P,[[2+o*2,-214],[0+o*2,-240]]);tine(P,[[6+o*2,-218],[30+o*2,-236]]);};
  antler(A,1,0);antler(A2,1,14);STAG.ant=A;STAG.ant2=A2;}
const stagCv=document.createElement('canvas');stagCv.width=640;stagCv.height=600;const sctx=stagCv.getContext('2d');const glowCv=document.createElement('canvas');glowCv.width=340;glowCv.height=320;const gctx=glowCv.getContext('2d');let stagT=-1;
function drawStag(x,t){if(!STAG.body)buildStag();const ox=1395,oy=832,SC=1.05;
  if(t-stagT>.06||t<stagT){stagT=t;renderStagSprite(t);}
  x.save();x.globalCompositeOperation='lighter';x.globalAlpha=.85;x.drawImage(glowCv,ox-350*SC,oy-580*SC,680*SC,640*SC);x.globalAlpha=.95;x.globalCompositeOperation='source-over';x.drawImage(stagCv,ox-330*SC,oy-560*SC,640*SC,600*SC);
  x.globalAlpha=1;STAGDOTS(x,t,ox,oy,SC);x.restore();
  if(Math.random()<.9){const u=Math.random();ART.wisps.push({x:ox+(-110+u*220)*SC,y:oy-(110+Math.random()*90)*SC,vx:-(4+Math.random()*10),vy:-(10+Math.random()*24),life:0,max:2+Math.random()*2.5,r:1+Math.random()*2.2});}}
function renderStagSprite(t){
  const c=sctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,640,600);c.setTransform(1,0,0,1+Math.sin(t*1.3)*.008,330,560);
  const look=Math.sin(t*.37)*.06+Math.max(0,Math.sin(t*.23-1))*.12;
  // solid silhouette (union), then tint with the spirit gradient
  c.fillStyle='#fff';for(const p of STAG.body)c.fill(p);c.save();c.translate(-80,-180);c.rotate(look);c.lineCap='round';c.lineJoin='round';c.globalAlpha=.6;c.strokeStyle='#fff';c.lineWidth=4;c.stroke(STAG.ant2);c.globalAlpha=1;for(const p of STAG.head)c.fill(p);c.lineWidth=5;c.stroke(STAG.ant);c.restore();
  c.globalCompositeOperation='source-in';c.setTransform(1,0,0,1,0,0);
  c.fillStyle=lg(c,0,0,0,600,[[0,'rgba(235,252,255,.97)'],[.45,'rgba(150,225,255,.85)'],[1,'rgba(80,160,240,.62)']]);c.fillRect(0,0,640,600);
  // inner shading: darker belly, light along the back
  c.globalCompositeOperation='source-atop';c.fillStyle=rg(c,330,430,10,170,[[0,'rgba(40,90,170,.0)'],[1,'rgba(30,70,160,.35)']]);c.fillRect(0,0,640,600);
  c.setTransform(1,0,0,1,330,560);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=2;c.lineCap='round';
  c.beginPath();c.moveTo(-96,-194);c.quadraticCurveTo(-10,-206,100,-196);c.moveTo(46,-136);c.quadraticCurveTo(74,-196,110,-170);c.moveTo(-104,-140);c.quadraticCurveTo(-84,-194,-40,-196);c.stroke();
  c.globalCompositeOperation='source-over';
  gctx.clearRect(0,0,340,320);gctx.filter='blur(9px)';gctx.globalAlpha=1;gctx.drawImage(stagCv,10,10,320,300);gctx.drawImage(stagCv,10,10,320,300);gctx.filter='none';gctx.globalCompositeOperation='source-in';gctx.fillStyle='rgba(90,200,255,.9)';gctx.fillRect(0,0,340,320);gctx.globalCompositeOperation='source-over';}
function STAGDOTS(x,t,ox,oy,SC){{const lk=Math.sin(t*.37)*.06+Math.max(0,Math.sin(t*.23-1))*.12,ex=-80+(-40)*Math.cos(lk)-(-92)*Math.sin(lk),ey=-180+(-40)*Math.sin(lk)+(-92)*Math.cos(lk);x.fillStyle='#fff';x.beginPath();x.arc(ox+ex*SC,oy+ey*SC,2.2,0,TAU);x.fill();}
  for(const [a,b] of [[-70,-170],[-10,-190],[50,-180],[85,-160],[-40,-140],[20,-146]]){x.fillStyle=`rgba(255,255,255,${.6+.4*Math.sin(t*3+a)})`;x.beginPath();x.arc(ox+a*SC,oy+b*SC,1.8,0,TAU);x.fill();}
}
// ---------------------------------------------------------------- animated pieces
function drawClouds(x,dt){for(const c of ART.clouds){c.x+=c.v*dt;if(c.x>2200)c.x=-700;const s=ART.cloudSpr[c.k];x.globalAlpha=c.a;x.drawImage(s,c.x,c.y,560*c.s,200*c.s);}x.globalAlpha=1;}
function drawRays(x,t){x.save();x.globalCompositeOperation='lighter';for(let i=0;i<11;i++){const a=-PI*.95+i/10*PI*.9+Math.sin(t*.07+i)*.03,w=.035+(i%3)*.02,L=1500;
    const al=(.05+.04*Math.sin(t*.3+i*1.7))*(1-Math.abs(i-5)/8);x.fillStyle=lg(x,SUN.x,SUN.y,SUN.x+Math.cos(a)*L,SUN.y+Math.sin(a)*L,[[0,`rgba(255,215,150,${al})`],[1,'rgba(255,215,150,0)']]);
    x.beginPath();x.moveTo(SUN.x,SUN.y);x.lineTo(SUN.x+Math.cos(a-w)*L,SUN.y+Math.sin(a-w)*L);x.lineTo(SUN.x+Math.cos(a+w)*L,SUN.y+Math.sin(a+w)*L);x.closePath();x.fill();}x.restore();}
function drawSun(x,t){x.save();x.globalCompositeOperation='lighter';const p=1+Math.sin(t*.5)*.03;
  x.fillStyle=rg(x,SUN.x,SUN.y,0,SUN.r*4*p,[[0,'rgba(255,240,200,.9)'],[.2,'rgba(255,210,140,.45)'],[1,'rgba(255,150,80,0)']]);x.fillRect(SUN.x-400,SUN.y-400,800,800);
  x.fillStyle='rgba(255,248,225,1)';x.beginPath();x.arc(SUN.x,SUN.y,SUN.r,0,TAU);x.fill();x.restore();}
function drawStars(x,t){for(const [sx,sy,r,ph] of ART.stars){const a=clamp((380-sy)/380,0,1)*(.45+.55*Math.sin(t*1.7+ph))*.85;if(a<.05)continue;x.fillStyle=`rgba(255,240,230,${a})`;x.fillRect(sx,sy,r,r);}}
function drawTownLife(x,t,dt){x.save();x.globalCompositeOperation='lighter';
  for(const [wx,wy,s,ph] of TOWN.wins){const f=.65+.35*Math.sin(t*3+ph)*Math.sin(t*1.3+ph*2);x.fillStyle=`rgba(255,${170+f*40|0},90,${.55+.4*f})`;x.fillRect(wx-1.2*s,wy-1.6*s,2.4*s,3*s);
    x.fillStyle=`rgba(255,160,70,${.12*f})`;x.beginPath();x.arc(wx,wy,7*s,0,TAU);x.fill();}
  x.restore();
  // banner on the central tower
  const [bx,by]=TOWN.banner;x.fillStyle='#8e2f1f';x.beginPath();x.moveTo(bx+1,by);for(let i=0;i<=8;i++){const u=i/8;x.lineTo(bx+1+u*30,by+Math.sin(t*4-u*4)*3*u);}for(let i=8;i>=0;i--){const u=i/8;x.lineTo(bx+1+u*30,by+12-u*3+Math.sin(t*4-u*4)*3*u);}x.closePath();x.fill();
  // chimney smoke
  if(Math.random()<dt*14){const c=pickA(TOWN.chims);if(c)ART.smoke.push({x:c[0],y:c[1],life:0,max:5+Math.random()*3,r:3});}
  for(let i=ART.smoke.length-1;i>=0;i--){const s=ART.smoke[i];s.life+=dt;if(s.life>s.max){ART.smoke.splice(i,1);continue;}s.y-=dt*10;s.x+=dt*(6+s.life*3);s.r+=dt*3;
    const a=Math.sin(s.life/s.max*PI)*.22;x.fillStyle=`rgba(200,150,170,${a})`;x.beginPath();x.arc(s.x,s.y,s.r,0,TAU);x.fill();}}
function drawRiverGlint(x,t){x.save();x.globalCompositeOperation='lighter';
  {const g=lg(x,0,742,0,1080,[[0,'rgba(255,230,170,.55)'],[.5,'rgba(255,180,120,.18)'],[1,'rgba(255,160,120,0)']]);x.fillStyle=g;x.beginPath();x.moveTo(...RIVER.L[0]);for(let i=1;i<RIVER.L.length;i++){const a=RIVER.L[i],b=RIVER.R[i];x.lineTo(a[0]+(b[0]-a[0])*.32,a[1]);}for(let i=RIVER.R.length-1;i>=0;i--){const a=RIVER.L[i],b=RIVER.R[i];x.lineTo(a[0]+(b[0]-a[0])*.68,a[1]);}x.closePath();x.globalAlpha=.6+.15*Math.sin(t*1.3);x.fill();x.globalAlpha=1;}
  for(let i=0;i<RIVER.L.length-1;i++){const [l0x,l0y]=RIVER.L[i],[r0x]=RIVER.R[i],[l1x,l1y]=RIVER.L[i+1],[r1x]=RIVER.R[i+1];
    for(let k=0;k<7;k++){const v=(k+.5)/7;const yy=l0y+(l1y-l0y)*v,lx=l0x+(l1x-l0x)*v,rx=r0x+(r1x-r0x)*v;const ph=Math.sin(t*2.3+i*3+k*1.7);if(ph<.2)continue;
      const cx=lx+(rx-lx)*(.3+.4*Math.sin(t*.8+k+i)*.5+.2),w=(rx-lx)*.3*ph;x.strokeStyle=`rgba(255,240,200,${.35*ph*(1-i/7)})`;x.lineWidth=1.4;x.beginPath();x.moveTo(cx-w,yy);x.lineTo(cx+w,yy);x.stroke();}}
  x.restore();}
function drawMist(x,dt,depth){for(const m of ART.mist){if(m.d!==depth)continue;m.x+=m.v*dt;if(m.x>2200)m.x=-900;if(m.x<-900)m.x=2200;x.drawImage(ART.mistSpr,m.x,m.y-60*m.s,800*m.s,120*m.s);}}
function drawBirds(x,t,dt){ART.nextBirds-=dt;if(ART.nextBirds<=0){ART.nextBirds=14+Math.random()*16;const y=200+Math.random()*220,n=5+Math.floor(Math.random()*6),dir=Math.random()<.6?1:-1;
    for(let i=0;i<n;i++)ART.birds.push({x:dir>0?-60-i*28-Math.random()*20:1980+i*28,y:y+Math.abs(i-n/2)*12+Math.random()*6,v:dir*(55+Math.random()*10),ph:Math.random()*9,s:.8+Math.random()*.4});}
  x.strokeStyle='rgba(30,15,30,.85)';x.lineWidth=1.8;x.lineCap='round';
  for(let i=ART.birds.length-1;i>=0;i--){const b=ART.birds[i];b.x+=b.v*dt;b.y+=Math.sin(t+b.ph)*dt*4;if(b.x>2100||b.x<-200){ART.birds.splice(i,1);continue;}const f=Math.sin(t*9+b.ph)*5*b.s,w=9*b.s;
    x.beginPath();x.moveTo(b.x-w,b.y-f);x.quadraticCurveTo(b.x-w*.4,b.y-f*.2-2,b.x,b.y);x.quadraticCurveTo(b.x+w*.4,b.y-f*.2-2,b.x+w,b.y-f);x.stroke();}}
function drawBranch(x,t){const sw=Math.sin(t*.9)*.012+Math.sin(t*2.1)*.004;x.save();x.translate(-60,-40);x.rotate(sw);
  x.fillStyle='#0d080d';x.strokeStyle='#0d080d';x.lineCap='round';
  const br=(x0,y0,x1,y1,cx,cy,w)=>{x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.quadraticCurveTo(cx,cy,x1,y1);x.stroke();};
  br(0,0,620,150,260,10,34);br(240,48,420,10,330,10,12);br(380,92,560,250,470,140,14);br(520,138,760,200,640,150,9);br(150,30,250,210,180,120,10);
  const r=mulberry(66);for(let i=0;i<46;i++){const u=r();const px=u*720+r()*40,py=40+u*160+(r()-.5)*90;const s=10+r()*22;const ph=r()*9;
    x.save();x.translate(px,py);x.rotate(Math.sin(t*1.6+ph)*.12);for(let k=0;k<5;k++){x.beginPath();x.ellipse((r()-.5)*s,(r()-.5)*s*.6,s*.55,s*.28,r()*PI,0,TAU);x.fill();}x.restore();}
  x.restore();
  if(Math.random()<.02+0)ART.leaves.push({x:100+Math.random()*600,y:80+Math.random()*120,vx:20+Math.random()*30,vy:20+Math.random()*20,r:Math.random()*TAU,vr:(Math.random()-.5)*4,ph:Math.random()*9,life:0});}
function drawLeaves(x,t,dt){for(let i=ART.leaves.length-1;i>=0;i--){const l=ART.leaves[i];l.life+=dt;l.x+=(l.vx+Math.sin(t*2+l.ph)*25)*dt;l.y+=l.vy*dt;l.r+=l.vr*dt;if(l.y>1150){ART.leaves.splice(i,1);continue;}
    x.save();x.translate(l.x,l.y);x.rotate(l.r);x.scale(1,Math.sin(t*3+l.ph));x.fillStyle=i%3?'#b8562a':'#d98a3a';x.beginPath();x.ellipse(0,0,7,3.4,0,0,TAU);x.fill();x.restore();}}
function drawParticles(x,t,dt){x.save();x.globalCompositeOperation='lighter';
  // embers from the hearth-flame
  if(ART.orbW&&Math.random()<dt*28)ART.parts.push({x:ART.orbW[0]+(Math.random()-.5)*10,y:ART.orbW[1],vx:(Math.random()-.3)*30+18,vy:-(30+Math.random()*50),life:0,max:2+Math.random()*2.5,r:1+Math.random()*2,c:0});
  if(Math.random()<dt*10)ART.parts.push({x:Math.random()*1920,y:1110,vx:(Math.random()-.5)*10+10,vy:-(20+Math.random()*30),life:0,max:6+Math.random()*6,r:1+Math.random()*2.4,c:0});
  for(let i=ART.parts.length-1;i>=0;i--){const p=ART.parts[i];p.life+=dt;if(p.life>p.max){ART.parts.splice(i,1);continue;}p.x+=(p.vx+Math.sin(t*2+i)*8)*dt;p.y+=p.vy*dt;p.vy*=.995;
    const a=Math.sin(p.life/p.max*PI)*(.6+.4*Math.sin(t*12+i));x.fillStyle=rg(x,p.x,p.y,0,p.r*4,[[0,`rgba(255,230,150,${a})`],[.4,`rgba(255,140,50,${a*.5})`],[1,'rgba(255,100,30,0)']]);x.beginPath();x.arc(p.x,p.y,p.r*4,0,TAU);x.fill();}
  for(let i=ART.wisps.length-1;i>=0;i--){const p=ART.wisps[i];p.life+=dt;if(p.life>p.max){ART.wisps.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;
    const a=Math.sin(p.life/p.max*PI)*.7;x.fillStyle=rg(x,p.x,p.y,0,p.r*4,[[0,`rgba(220,250,255,${a})`],[1,'rgba(120,220,255,0)']]);x.beginPath();x.arc(p.x,p.y,p.r*4,0,TAU);x.fill();}
  for(const f of ART.flies){f.ph+=dt*f.v;const fx=f.x+Math.sin(f.ph)*30,fy=f.y+Math.cos(f.ph*1.3)*16;const a=Math.max(0,Math.sin(t*1.8+f.ph*3))*.8;if(a<.05)continue;x.fillStyle=rg(x,fx,fy,0,7,[[0,`rgba(255,240,170,${a})`],[1,'rgba(255,220,120,0)']]);x.beginPath();x.arc(fx,fy,7,0,TAU);x.fill();}
  x.restore();}
// ---------------------------------------------------------------- compositor
function artSize(){const r=Math.min(devicePixelRatio||1,1.5)*((typeof qualKey!=='undefined'&&qualKey==='low')?.75:1);artCv.width=Math.round(innerWidth*r);artCv.height=Math.round(innerHeight*r);buildLayers();}
function setT(depth,zoom){const x=actx,s=ART.s*zoom,px=-ART.pmx*depth*46+Math.sin(ART.t*.05)*depth*14,py=-ART.pmy*depth*20+Math.sin(ART.t*.07)*depth*5;
  x.setTransform(s,0,0,s,ART.cw/2+(px-ART.W/2)*s,ART.ch/2+(py-ART.H/2)*s);}
function layer(name,depth,zoom){setT(depth,zoom);actx.drawImage(ART.layers[name],-MV,-MV,ART.W+2*MV,ART.H+2*MV);}
function artFrame(now){if(!ART.on)return;requestAnimationFrame(artFrame);const _p0=performance.now();try{artFrame2(now);}finally{ART.ft=performance.now()-_p0;}}
function artFrame2(now){const dt=Math.min(.05,(now-(ART.last||now))/1000);ART.last=now;ART.t+=dt;const t=ART.t;
  ART.pmx+=(ART.mx-ART.pmx)*Math.min(1,dt*2);ART.pmy+=(ART.my-ART.pmy)*Math.min(1,dt*2);ART.intro=Math.min(1,ART.intro+dt/5);
  const zi=1+.07*Math.pow(1-ART.intro,3),zb=1+Math.sin(t*.12)*.008;const Z=d=>(zi-1)*(.4+d)+zb*(1+d*.01);
  const x=actx;x.setTransform(1,0,0,1,0,0);
  layer('sky',0,Z(0));setT(0,Z(0));drawStars(x,t);drawSun(x,t);
  setT(.06,Z(.06));drawClouds(x,dt);
  layer('mount',.1,Z(.1));setT(.06,Z(.06));drawRays(x,t);
  setT(.18,Z(.18));drawBirds(x,t,dt);
  layer('town',.22,Z(.22));setT(.22,Z(.22));drawTownLife(x,t,dt);
  layer('valley',.28,Z(.28));setT(.28,Z(.28));drawRiverGlint(x,t);drawMist(x,dt,.25);
  layer('forest',.42,Z(.42));setT(.42,Z(.42));drawMist(x,dt,.55);
  layer('crag',.62,Z(.62));setT(.62,Z(.62));drawStag(x,t);drawHero(x,t);
  setT(.62,Z(.62));drawParticles(x,t,dt);
  layer('frame',1,Z(1));setT(1,Z(1));drawBranch(x,t);drawLeaves(x,t,dt);
  // film grain
  x.setTransform(1,0,0,1,0,0);x.globalAlpha=.05;x.globalCompositeOperation='overlay';const gx=-(Math.random()*256|0),gy=-(Math.random()*256|0);
  x.fillStyle=x.createPattern(ART.grain,'repeat');x.translate(gx,gy);x.fillRect(0,0,ART.cw+256,ART.ch+256);x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';
  if(MODE==='title'&&typeof audioUpdate==='function'&&SND.ctx)audioUpdate(dt);}
function startArt(){if(ART.on)return;ART.on=true;if(!artCv.parentNode)$('title').prepend(artCv);artSize();initArtState();ART.intro=0;ART.last=0;requestAnimationFrame(artFrame);}
function stopArt(){ART.on=false;}
addEventListener('resize',()=>{if(ART.on)artSize();});
addEventListener('pointermove',e=>{ART.mx=e.clientX/innerWidth*2-1;ART.my=e.clientY/innerHeight*2-1;});

function debugStag(){ART.t=3;drawStag({save(){},restore(){},drawImage(){},beginPath(){},arc(){},fill(){}},3);return stagCv.toDataURL();}
// ================================================================ main menu (splash artwork), pause menu, settings
const loadEl=$('loading');loadEl.style.zIndex=70;
function setLoading(on,txt){if(txt)loadEl.textContent=txt;loadEl.style.display=on?'flex':'none';}
function menuCam(){}function menuSkyHour(){return 16;}
// ---------------------------------------------------------------- menu flow
(()=>{const t=$('mTitle');t.innerHTML='HEARTHMERE'.split('').map((c,i)=>`<span style="animation-delay:${.5+i*.09}s,${i*.12}s">${c}</span>`).join('');})();
function showMenuUI(){renderer.domElement.style.visibility='hidden';const t=$('title');t.classList.remove('hidden');document.body.classList.add('inmenu');UIBLOCK=true;startArt();
  requestAnimationFrame(()=>t.classList.add('cine'));refreshContinue();setTimeout(()=>$('mFade').classList.add('clear'),80);}
function enterMenu(first){$('pause').classList.add('hidden');$('settings').classList.add('hidden');document.body.classList.remove('paused','photo');PAUSED=false;
  for(const id of ['gtop','top','prayers','insp','chron','crafts','ghelp','help','setup','saves'])$(id)&&$(id).classList.add('hidden');
  if(MODE==='god'||MODE==='sandbox'){exitMenu(true);}
  MODE='title';G.menu=false;setLoading(false);$('mFade').classList.remove('clear');showMenuUI();}
function exitMenu(keepHidden){stopArt();renderer.domElement.style.visibility='';$('title').classList.add('hidden');$('title').classList.remove('cine');document.body.classList.remove('inmenu');UIBLOCK=false;
  for(let i=boats.length-1;i>=0;i--){scene.remove(boats[i].m);boats.splice(i,1);}try{endFestival();}catch(e){}if(G.vill){G.vill=[];G.bandits=[];}try{drawPeople([],TT);}catch(e){}}
$('tSet').onclick=()=>{audioInit();openSettings();};
$('tQuit').onclick=()=>quitGame();
$('mSound').onclick=e=>{e.stopPropagation();audioInit();setSound(!SND.on);$('mSound').textContent=SND.on?'♪ Sound on':'♪ Sound off';};
function firstSound(){if(!SND.ctx){audioInit();$('mIntro').style.display='none';$('mSound').textContent=SND.on?'♪ Sound on':'♪ Sound off';}}
addEventListener('pointerdown',()=>{if(MODE==='title')firstSound();},true);
addEventListener('keydown',()=>{if(MODE==='title')firstSound();},true);
// menu tick sound on hover
for(const b of document.querySelectorAll('.mnav button'))b.addEventListener('pointerenter',()=>{if(SND.on&&SND.ctx){const t=SND.ctx.currentTime;tone(660,t,.25,.025,'sine');tone(990,t+.03,.3,.012,'sine');}});
// ---------------------------------------------------------------- realm naming (setup)
const _showSetup=showSetup;
showSetup=function(){_showSetup();$('title').classList.remove('hidden');const n=$('realmName');if(!n.value)n.value=townName();};
$('rnRoll').onclick=()=>{$('realmName').value=townName();};
$('setupBack').onclick=()=>{$('setup').classList.add('hidden');showMenuUI();};
$('setupGo').onclick=()=>{document.activeElement&&document.activeElement.blur();const nm=($('realmName').value||'').trim()||townName();$('setup').classList.add('hidden');startShaping(setupWorld,setupSeed);G.town=nm;$('realmName').value='';updateUI(true);};
// ---------------------------------------------------------------- pause menu
function inGame(){return MODE==='god'||MODE==='sandbox';}
function openPause(){if(!inGame())return;PAUSED=true;UIBLOCK=true;document.body.classList.add('paused');$('pause').classList.remove('hidden');
  $('pSub').textContent=MODE==='sandbox'?'Sandbox':`${G.town} · ${G.phase==='shape'?'shaping the land':ERAS[G.era].name+', year '+yearN()}`;
  $('pause').querySelector('[data-p=save]').style.display=MODE==='god'&&G.phase!=='pick'?'':'none';}
function closePause(){PAUSED=false;UIBLOCK=false;document.body.classList.remove('paused');$('pause').classList.add('hidden');}
for(const b of $('pause').querySelectorAll('button'))b.onclick=async()=>{const a=b.dataset.p;
  if(a==='resume')closePause();
  else if(a==='save'){openSaves();showNameRow(true);}
  else if(a==='load'){openSaves();}
  else if(a==='settings')openSettings();
  else if(a==='menu'){if(MODE==='god')await autoSave();closePause();enterMenu(false);}
  else if(a==='quit'){quitGame();}};
$('gMenu').onclick=()=>openPause();$('gMenu').textContent='Menu';
addEventListener('keydown',e=>{if(e.code!=='Escape')return;if(e.target.tagName==='INPUT'&&e.target.offsetParent!==null)return;
  if(!$('settings').classList.contains('hidden')){closeSettings();e.stopImmediatePropagation();return;}
  if(!$('saves').classList.contains('hidden')){$('saves').classList.add('hidden');e.stopImmediatePropagation();return;}
  if(!$('pause').classList.contains('hidden')){closePause();e.stopImmediatePropagation();return;}
  if(!inGame())return;
  const busy=document.body.classList.contains('photo')||(MODE==='god'&&(G.follow||selected||!$('chron').classList.contains('hidden')||!$('crafts').classList.contains('hidden')||!$('ghelp').classList.contains('hidden')))||(MODE==='sandbox'&&(ghostB||selected||!$('help').classList.contains('hidden')));
  if(busy)return;e.stopImmediatePropagation();e.preventDefault();openPause();},true);
// ---------------------------------------------------------------- settings
const QDESC={high:'Full resolution, sharp 4K shadows, grass and detailed trees all around you.',bal:'Slightly softer image and shadows, less grass. Good for laptops.',low:'Lowest resolution and shadows, no grass. For older machines.'};
function openSettings(){const s=$('settings');s.classList.remove('hidden');UIBLOCK=true;
  const bind=(id,oid,key,fn)=>{const el=$(id),o=$(oid);el.value=Math.round(SETS[key]*100);o.textContent=el.value+'%';el.oninput=()=>{SETS[key]=el.value/100;o.textContent=el.value+'%';fn&&fn();saveSets();};};
  bind('sMaster','oMaster','master',applyVolumes);bind('sMusic','oMusic','music',applyVolumes);bind('sFx','oFx','fx',applyVolumes);bind('sUI','oUI','ui',()=>applyUI());
  for(const b of s.querySelectorAll('[data-q]')){b.classList.toggle('on',b.dataset.q===qualKey);b.onclick=()=>{applyQuality(b.dataset.q);openSettings();};}
  $('qDesc').textContent=QDESC[qualKey];$('sAutoQ').checked=SETS.autoQ!==false;$('sAutoQ').onchange=()=>{SETS.autoQ=$('sAutoQ').checked;saveSets();};}
function closeSettings(){$('settings').classList.add('hidden');UIBLOCK=MODE==='title'||!$('pause').classList.contains('hidden');}
$('sDone').onclick=closeSettings;
// ---------------------------------------------------------------- quit
async function quitGame(){if(MODE==='god'){try{await autoSave();}catch(e){}}
  try{window.close();}catch(e){}setTimeout(()=>{$('farewell').classList.remove('hidden');PAUSED=true;},250);}
$('fwBack').onclick=()=>{$('farewell').classList.add('hidden');if(inGame()){PAUSED=false;closePause();}else PAUSED=false;};

Object.assign(window.HM,{debugStag,ART,openPause,closePause,enterMenu});
