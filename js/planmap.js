'use strict';
// Debug aid: draws the plan of the current settlement (terrain, streets, plots, zones, buildings) onto a canvas. Used by tools/plantest.js and layouttest.js.
window.__planmap=function(cx,cz,R,px){px=px||800;const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d'),sc=px/(2*R);const X=x=>(x-cx+R)*sc,Z=z=>(z-cz+R)*sc;
  const img=g.createImageData(px,px);const P=G.plan;
  for(let j=0;j<px;j++)for(let i=0;i<px;i++){const x=cx-R+i/sc,z=cz-R+j/sc;const w=wAt(x,z),h=hAt(x,z);let r,gg,b;
    if(w>.05){r=60;gg=110;b=170;}else{const l=60+h*7;r=clamp(l*.8,40,220);gg=clamp(l*1.1,40,230);b=clamp(l*.6,30,200);
      if(P&&P.v>=3){const z0=lyZone(P,x,z);if(z0==='civic'){r+=40;gg+=20;}else if(z0==='ind'){r+=26;gg-=14;b-=14;}else if(z0==='farm'){gg+=14;r+=8;}}}
    const k=(j*px+i)*4;img.data[k]=r;img.data[k+1]=gg;img.data[k+2]=b;img.data[k+3]=255;}
  g.putImageData(img,0,0);
  if(P){g.lineCap='round';for(const s of P.streets){g.strokeStyle=s.kind==='main'?'#f4e2b0':s.kind==='ring'?'#e0d0a0':'#d8cca8';g.lineWidth=s.hw*2*sc;g.beginPath();s.pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.stroke();
      if(s.painted){g.strokeStyle='#a07840';g.lineWidth=s.hw*1.4*sc;g.beginPath();s.pts.slice(0,s.painted+1).forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.stroke();}}
    g.fillStyle='#e8e0c0';g.beginPath();g.arc(X(P.plaza.x),Z(P.plaza.z),P.plaza.r*sc,0,TAU);g.fill();
    g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1;for(const p of P.plots){const cs=Math.cos(p.rot),sn=Math.sin(p.rot),f=[-p.w/2,p.w/2,-4.8,2.6];g.beginPath();[[f[0],f[2]],[f[1],f[2]],[f[1],f[3]],[f[0],f[3]]].forEach(([lx,lz],i)=>{const wx=p.x+lx*cs+lz*sn,wz=p.z-lx*sn+lz*cs;i?g.lineTo(X(wx),Z(wz)):g.moveTo(X(wx),Z(wz));});g.closePath();g.stroke();}}
  const col={house:'#c0392b',hall:'#f1c40f',church:'#8e44ad',market:'#e67e22',tavern:'#d35400',smith:'#34495e',mill:'#16a085',well:'#3498db',farm:'#27ae60',camp:'#7f8c8d',lodge:'#7f8c8d',quarry:'#555',tower:'#2c3e50',castle:'#1b2631',factory:'#2c2c2c',station:'#1abc9c',powerplant:'#111',fusion:'#00e5ff',school:'#9b59b6',dock:'#2980b9',shipyard:'#2980b9',fishmkt:'#2e86c1',sawmill:'#6e2c00',mason:'#7b7d7d'};
  for(const b of buildings){const r=(b.type==='farm'?4.5:b.type==='house'?(b.w||3.5)/2+.6:Math.max(2.5,b.r||3))*sc;g.fillStyle=col[b.type]||'#fff';g.globalAlpha=b.build?.5:1;g.save();g.translate(X(b.x),Z(b.z));g.rotate(-(b.rot||0));g.fillRect(-r,-r*.8,r*2,r*1.6);g.restore();g.globalAlpha=1;}
  g.fillStyle='#fff';g.font='14px sans-serif';g.fillText(`${G.town} ${P?P.tpl:''} era ${G.era} pop ${popN()} bld ${buildings.length}`,8,18);
  return c.toDataURL('image/png');};
