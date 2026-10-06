'use strict';
// ================================================================ the opening: rain, and fetching their own water
// The settlers arrive in steady rain. Their first prayer is for the sun, and the first Sunshine is free: that is how the
// game starts. They never ask you to pour water for them: they walk to the river or the well themselves, and wells come
// with the Bronze Age (ERA_BUILD.well). Distance to water costs them time and happiness.
delete PRAYERS.water;
Object.assign(PRAYERS,{sunrise:{t:'The rain will not stop! Our fire will not catch and the children shiver. Send us the sun!',how:'Cast Sunshine — it is free this once.',
  when:()=>!!G.openRain&&G.rain>0&&!!G.center,ok:()=>!G.openRain||G.rain<=0,r:40,d:5,urgent:1}});
function openingStart(){G.openRain=true;G.rain=150;G.rainI=.25;chron(`Rain fell steadily over the valley as the settlers came. The ground was sodden, and no one could light a fire.`);}
function openingHapF(f){if(G.openRain&&G.rain>0)f.Rain=-8;}
// how far the homes are from water (a well counts); far water means slower work
function waterDaily(){if(G.phase!=='play'||G.menu||!G.center)return;const homes=buildings.filter(b=>(b.type==='house'||b.type==='hall')&&!b.build);if(!homes.length){G.waterDist=0;return;}
  const wells=built('well');const stride=Math.max(1,Math.ceil(homes.length/30)),off=dayN()%stride;let sum=0,n=0;// at most ~30 homes a day: the average is what matters
  for(let i=off;i<homes.length;i+=stride){const h=homes[i];let d=nearWater(h.x,h.z,40);for(const w of wells)d=Math.min(d,Math.hypot(w.x-h.x,w.z-h.z));sum+=d;n++;}G.waterDist=n?sum/n:0;}
function waterMul(){return clamp(1-Math.max(0,(G.waterDist||0)-9)/140,.82,1);}
// leisure errand: the folk walk to the well or the shore for water
function fetchWater(v){if(v.age<10||v.hidden)return false;let tx,tz,th;const wells=built('well');let bw=null,bd=40;for(const w of wells){const d=Math.hypot(w.x-v.x,w.z-v.z);if(d<bd){bd=d;bw=w;}}
  if(bw){[tx,tz]=doorOf(bw);th='Drawing water at the well.';}else{const s=findShore(v.x,v.z,40);if(!s)return false;[tx,tz]=s;th='Fetching water from the river.';}
  goTo(v,tx,tz,vv=>wait(vv,.5+rnd()*.5,'work',false));setThought(v,th);return true;}
