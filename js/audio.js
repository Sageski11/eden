'use strict';
// ================================================================ procedural audio
const SETS=Object.assign({master:.8,music:.7,fx:.8,autoQ:true,ui:1,captions:true},(()=>{try{return JSON.parse(localStorage.getItem('hearthmere_settings')||'{}');}catch(e){return {};}})());
function saveSets(){try{localStorage.setItem('hearthmere_settings',JSON.stringify(SETS));}catch(e){}}
function applyVolumes(){if(!SND.ctx)return;const t=SND.ctx.currentTime;SND.master.gain.setTargetAtTime(SND.on?.75*SETS.master:0,t,.15);SND.musV.gain.setTargetAtTime(SETS.music,t,.15);SND.fxg.gain.setTargetAtTime(SETS.fx,t,.15);}
const SND={on:false,ctx:null,lvl:{}};
function audioInit(){if(SND.ctx)return;try{
  const ctx=new (window.AudioContext||window.webkitAudioContext)();SND.ctx=ctx;
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);SND.master=master;
  const comp=ctx.createDynamicsCompressor();comp.connect(master);const fxg=ctx.createGain();fxg.gain.value=SETS.fx;fxg.connect(comp);SND.out=fxg;SND.fxg=fxg;
  const nb=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=nb.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=.98*b+.02*w;d[i]=w*.6+b*3;}SND.noise=nb;
  const loop=(type,freq,q)=>{const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||.7;const g=ctx.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(fxg);s.start(0,Math.random()*2);return {g,f};};
  SND.lvl.water=loop('bandpass',520,.6);SND.lvl.wind=loop('lowpass',380,.5);SND.lvl.rain=loop('highpass',2600,.4);SND.lvl.crowd=loop('bandpass',900,1.2);
  // music: Karplus-Strong lute + soft drone
  const sr=ctx.sampleRate,notes=[146.83,164.81,174.61,196,220,246.94,261.63,293.66,329.63,349.23,392,440];SND.pl=notes.map(f=>{const len=Math.floor(sr*2.4),buf=ctx.createBuffer(1,len,sr),y=buf.getChannelData(0),P=Math.round(sr/f);
    for(let i=0;i<P;i++)y[i]=(Math.random()*2-1)*.5;for(let i=P;i<len;i++)y[i]=(y[i-P]+y[i-P+1])*.4985;return buf;});
  const mvol=ctx.createGain();mvol.gain.value=SETS.music;mvol.connect(comp);SND.musV=mvol;const mg=ctx.createGain();mg.gain.value=.22;mg.connect(mvol);SND.mus=mg;
  const dr=ctx.createGain();dr.gain.value=0;dr.connect(mg);SND.drone=dr;for(const f of [73.42,110,146.83]){const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;const g=ctx.createGain();g.gain.value=f<100?.18:.08;o.connect(g);g.connect(dr);o.start();}
  SND.beat=0;SND.melo=7;SND.next=ctx.currentTime+1;
  setSound(true);}catch(e){SND.ctx=null;}}
function setSound(on){SND.on=on;if(!SND.ctx)return;if(on&&SND.ctx.state==='suspended')SND.ctx.resume();SND.master.gain.setTargetAtTime(on?.75*SETS.master:0,SND.ctx.currentTime,.4);const b=document.getElementById('gSound');if(b)b.textContent=on?'Sound on':'Sound off';}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
function tone(f,t,dec,peak,type='sine',dest){const c=SND.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;o.connect(g);g.connect(dest||SND.out);env(g,t,.005,peak,dec);o.start(t);o.stop(t+dec+.05);return o;}
function noiseHit(t,dec,peak,type,freq,q){const c=SND.ctx,s=c.createBufferSource();s.buffer=SND.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||1;const g=c.createGain();s.connect(f);f.connect(g);g.connect(SND.out);env(g,t,.003,peak,dec);s.start(t,Math.random()*2);s.stop(t+dec+.05);}
function sfx(name){if(!SND.on||!SND.ctx)return;const c=SND.ctx,t=c.currentTime+.01;
  if(name==='bell'){for(let s=0;s<3;s++){const tt=t+s*1.1;for(const [r,a,d] of [[1,.18,3.2],[2,.08,2.4],[2.4,.06,1.8],[3,.05,1.4],[4.2,.03,1]])tone(330*r,tt,d,a);}}
  else if(name==='chime'){[0,4,7].forEach((n,i)=>tone(523.25*Math.pow(2,n/12),t+i*.09,1.2,.08));}
  else if(name==='thunder'){noiseHit(t,.25,.6,'highpass',1800);noiseHit(t+.05,3.2,.9,'lowpass',160);noiseHit(t+.4,2.4,.5,'lowpass',90);}
  else if(name==='alarm'){for(let s=0;s<4;s++)for(const [r,a] of [[1,.12],[2.6,.05]])tone(620*r,t+s*.32,.5,a);}
  else if(name==='deny')tone(110,t,.25,.15,'triangle');
  else if(name==='pop'){noiseHit(t,.12,.25,'bandpass',2500,2);noiseHit(t+.15,.6,.18,'highpass',3500);}
  else if(name==='hammer'){tone(880+Math.random()*300,t,.06,.05,'triangle');noiseHit(t,.05,.08,'bandpass',2000,3);}
  else if(name==='chop'){tone(220+Math.random()*60,t,.1,.08,'triangle');noiseHit(t,.07,.1,'bandpass',900,2);}
  else if(name==='chirp'){const o=c.createOscillator(),g=c.createGain();o.type='sine';const f=2600+Math.random()*1800;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*(.7+Math.random()*.6),t+.12);
    o.connect(g);g.connect(SND.out);env(g,t,.01,.025,.13);o.start(t);o.stop(t+.2);if(Math.random()<.6){const o2=c.createOscillator(),g2=c.createGain();o2.frequency.setValueAtTime(f*1.1,t+.18);o2.frequency.exponentialRampToValueAtTime(f*.8,t+.28);o2.connect(g2);g2.connect(SND.out);env(g2,t+.18,.01,.02,.12);o2.start(t+.18);o2.stop(t+.4);}}
}
let audT=0,audWater=0,audWork=0,audFire=0;
function audioUpdate(dt){if(!SND.on||!SND.ctx)return;const c=SND.ctx,now=c.currentTime;audT+=dt;
  if(audT>.5){audT=0;let w=0,sp=0;for(let dz=-15;dz<=15;dz+=3)for(let dx=-15;dx<=15;dx+=3){const k=wAt(cam.tx+dx,cam.tz+dz);w+=Math.min(k,1);sp+=Math.min(sampleArr(SPD,cam.tx+dx,cam.tz+dz),3)*Math.min(k,1);}
    audWater=clamp(w/40,0,1)*(1-waterU.uIce.value*.8);const flow=clamp(sp/40,0,1);
    audWork=G.vill?G.vill.filter(v=>v.job==='builder'&&v.anim==='work'&&!v.hidden&&Math.hypot(v.x-cam.tx,v.z-cam.tz)<35).length:0;
    audFire=buildings.some(b=>b.fire&&Math.hypot(b.x-cam.tx,b.z-cam.tz)<45)?1:0;
    const close=clamp(1-(cam.dist-20)/160,.15,1);
    SND.lvl.water.g.gain.setTargetAtTime((audWater*.12+flow*.25)*close,now,.6);SND.lvl.water.f.frequency.setTargetAtTime(400+flow*900,now,.6);
    SND.lvl.wind.g.gain.setTargetAtTime(.05+(MODE==='god'&&seasonN()===3?.08:0)+rainU.uA.value*.12+clamp((cam.dist-80)/300,0,.1),now,1);
    SND.lvl.rain.g.gain.setTargetAtTime(rainU.uA.value*(rainU.uSnow.value?.04:.22),now,.8);
    const crowd=G.festival>0?.08:0;SND.lvl.crowd.g.gain.setTargetAtTime(crowd*close+audFire*.1,now,.8);
    SND.drone.gain.setTargetAtTime(nightF>.5?.35:.2,now,2);}
  const day=1-nightF,sn=MODE==='god'?seasonN():1;
  if(day>.5&&sn!==3&&rainU.uA.value<.1&&Math.random()<dt*.9*(cam.dist<120?1:.3))sfx('chirp');
  if(MODE!=='title'&&audWork&&!G.paused&&Math.random()<dt*Math.min(5,1.8*Math.sqrt(audWork))*Math.min(G.speed,3))sfx(Math.random()<.2?'chop':'hammer');
  if(audFire&&Math.random()<dt*8)noiseHit(now+.01,.04,.06,'highpass',3000);
  // generative lute
  if(now>=SND.next){const bp=(MODE==='title'?.52:.42)*(nightF>.5?1.35:1);SND.next=now+bp;SND.beat++;
    const b=SND.beat%16;const play=b%4===0||Math.random()<(b%2===0?(MODE==='title'?.7:.55):.18);if(MODE==='title'&&b%16===0)menuSwell(now);
    if(play&&!(G.paused&&MODE==='god')){SND.melo=clamp(SND.melo+Math.round((Math.random()-.5)*4),2,11);if(b%8===0)SND.melo=[4,7,9,7][Math.floor(SND.beat/16)%4];
      const s=c.createBufferSource();s.buffer=SND.pl[SND.melo];const g=c.createGain();g.gain.value=.35+Math.random()*.15;s.connect(g);g.connect(SND.mus);s.start(now+.01);
      if(b%8===0){const s2=c.createBufferSource();s2.buffer=SND.pl[[0,3,4,0][Math.floor(SND.beat/16)%4]];const g2=c.createGain();g2.gain.value=.3;s2.connect(g2);g2.connect(SND.mus);s2.start(now+.02);}}}
}
function menuSwell(t){if(!SND.ctx)return;const c=SND.ctx;const roots=[[73.42,110,146.83,220],[65.41,98,130.81,196],[87.31,130.81,174.61,261.63],[98,146.83,196,293.66]];const ch=roots[Math.floor(SND.beat/16)%4];
  for(const f of ch){for(const det of [-3,3]){const o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;fl.type='lowpass';fl.frequency.value=f*2.2;fl.Q.value=.4;
    o.connect(fl);fl.connect(g);g.connect(SND.mus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022,t+2.4);g.gain.linearRampToValueAtTime(.016,t+5.5);g.gain.linearRampToValueAtTime(0,t+8.4);o.start(t);o.stop(t+8.6);}}}

