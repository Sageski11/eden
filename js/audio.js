'use strict';
// ================================================================ procedural audio (WebAudio only, no files)
// Three layers: (1) beds - looping noise/oscillators whose level follows what is under the camera (water, wind, rain, forest, crowd, machines);
// (2) one-shots - birds by the hour, crickets, owls, hammering, forge, bells, whistles, drawn at random with rates set by the same scene sample;
// (3) a generative score per age (modes, voices and rhythm change from the Stone Age to the Futuristic) that turns tense under threat.
// Everything is sampled twice a second from the camera focus (never per villager per frame) and the score schedules a few nodes per note.
const SETS=Object.assign({master:.8,music:.7,fx:.8,autoQ:true,ui:1,captions:true,camSens:1,invX:false,invY:false,reduce:false,cb:false,autosave:90,fps:false,hints:true,gfx:{}},(()=>{try{return JSON.parse(localStorage.getItem('hearthmere_settings')||'{}');}catch(e){return {};}})());
function saveSets(){try{localStorage.setItem('hearthmere_settings',JSON.stringify(SETS));}catch(e){}}
function applyVolumes(){if(!SND.ctx)return;const t=SND.ctx.currentTime;SND.master.gain.setTargetAtTime(SND.on?.75*SETS.master:0,t,.15);SND.musV.gain.setTargetAtTime(SETS.music,t,.15);SND.fxg.gain.setTargetAtTime(SETS.fx,t,.15);}
const SND={on:false,ctx:null,lvl:{},tz:0,eraSeen:{},realm:null};
const mf=m=>440*Math.pow(2,(m-69)/12);
function audioInit(){if(SND.ctx)return;try{
  const ctx=new (window.AudioContext||window.webkitAudioContext)();SND.ctx=ctx;const sr=ctx.sampleRate;
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);SND.master=master;
  const comp=ctx.createDynamicsCompressor();comp.connect(master);const fxg=ctx.createGain();fxg.gain.value=SETS.fx;fxg.connect(comp);SND.out=fxg;SND.fxg=fxg;
  const nb=ctx.createBuffer(1,sr*3,sr),d=nb.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=.98*b+.02*w;d[i]=w*.6+b*3;}SND.noise=nb;
  // a small room: a decaying noise impulse. Bells, owls and the score send a little of themselves into it.
  const rev=ctx.createConvolver(),ir=ctx.createBuffer(2,Math.floor(sr*1.7),sr);for(let c=0;c<2;c++){const y=ir.getChannelData(c);for(let i=0;i<y.length;i++)y[i]=(Math.random()*2-1)*Math.pow(1-i/y.length,2.6);}
  rev.buffer=ir;const revIn=ctx.createGain();revIn.gain.value=1;revIn.connect(rev);const revOut=ctx.createGain();revOut.gain.value=.5;rev.connect(revOut);revOut.connect(comp);SND.rev=revIn;
  const loop=(type,freq,q)=>{const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||.7;const g=ctx.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(fxg);s.start(0,Math.random()*2);return {g,f,s};};
  const osc=(type,fr,dest,gain)=>{const o=ctx.createOscillator();o.type=type;o.frequency.value=fr;const g=ctx.createGain();g.gain.value=gain==null?1:gain;o.connect(g);g.connect(dest);o.start();return {o,g};};
  // beds
  SND.lvl.water=loop('bandpass',520,.6);SND.lvl.wind=loop('lowpass',380,.5);SND.lvl.rain=loop('highpass',2600,.4);SND.lvl.crowd=loop('bandpass',900,1.2);
  SND.lvl.forest=loop('bandpass',3100,.9);SND.lvl.traffic=loop('lowpass',230,.6);SND.lvl.mill=loop('lowpass',170,1.4);
  {const a=ctx.createGain();a.gain.value=.55;SND.lvl.crowd.g.disconnect();SND.lvl.crowd.f.disconnect();SND.lvl.crowd.f.connect(a);a.connect(SND.lvl.crowd.g);SND.lvl.crowd.g.connect(fxg);// speech-like wobble
    for(const [fr,dp] of [[3.1,.28],[5.3,.2],[.9,.15]]){const l=ctx.createOscillator();l.frequency.value=fr;const lg=ctx.createGain();lg.gain.value=dp;l.connect(lg);lg.connect(a.gain);l.start();}
    for(const [fr,dp] of [[.17,.4],[.11,.35]]){const l=ctx.createOscillator();l.frequency.value=fr;const lg=ctx.createGain();lg.gain.value=dp*SND.lvl.forest.f.frequency.value*.25;l.connect(lg);lg.connect(SND.lvl.forest.f.frequency);l.start();}}
  // machines: factory hum, turbines, and a pulsed cricket chorus
  const fh=ctx.createGain();fh.gain.value=0;fh.connect(fxg);{const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.connect(fh);osc('sawtooth',55,f,.5);osc('sawtooth',55.7,f,.4);osc('square',110,f,.15);}SND.lvl.fact={g:fh};
  const pw=ctx.createGain();pw.gain.value=0;pw.connect(fxg);osc('sine',100,pw,.5);osc('sine',150.4,pw,.3);osc('sine',301,pw,.12);osc('sine',1180,pw,.025);SND.lvl.power={g:pw};
  {const cr=ctx.createGain();cr.gain.value=0;cr.connect(fxg);const ph=ctx.createGain();ph.gain.value=.5;ph.connect(cr);const gate=ctx.createGain();gate.gain.value=.5;gate.connect(ph);osc('sine',4350,gate,1);osc('sine',4400,gate,.5);
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=60;const l1=ctx.createOscillator();l1.type='square';l1.frequency.value=17;const lg1=ctx.createGain();lg1.gain.value=.5;l1.connect(lp);lp.connect(lg1);lg1.connect(gate.gain);l1.start();
    const l2=ctx.createOscillator();l2.type='square';l2.frequency.value=1.1;const lg2=ctx.createGain();lg2.gain.value=.5;l2.connect(lg2);lg2.connect(ph.gain);l2.start();SND.lvl.cricket={g:cr};}
  // music
  const mvol=ctx.createGain();mvol.gain.value=SETS.music;mvol.connect(comp);SND.musV=mvol;const mg=ctx.createGain();mg.gain.value=.55;mg.connect(mvol);SND.mus=mg;
  {const send=ctx.createGain();send.gain.value=.42;mg.connect(send);send.connect(revIn);}
  {const dl=ctx.createDelay(1.5);dl.delayTime.value=.375;const fb=ctx.createGain();fb.gain.value=.38;const dlp=ctx.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=2400;dl.connect(dlp);dlp.connect(fb);fb.connect(dl);const ds=ctx.createGain();ds.gain.value=.45;ds.connect(dl);dlp.connect(mg);SND.dly=ds;}
  const dr=ctx.createGain();dr.gain.value=1;dr.connect(mg);SND.drone=dr;
  SND.dr={sub:osc('sine',55,dr,0),fifth:osc('sine',82,dr,0),oct:osc('sine',110,dr,0),tri:osc('sine',77.8,dr,0)};
  {const hf=ctx.createBiquadFilter();hf.type='lowpass';hf.frequency.value=720;hf.Q.value=2.2;hf.connect(dr);SND.dr.hu1=osc('sawtooth',110,hf,0);SND.dr.hu2=osc('sawtooth',164.8,hf,0);SND.dr.hf=hf;
   const mfl=ctx.createBiquadFilter();mfl.type='lowpass';mfl.frequency.value=190;mfl.connect(dr);SND.dr.ma=osc('sawtooth',55,mfl,0);SND.dr.mb=osc('square',55.3,mfl,0);}
  SND.pl=new Map();SND.m={step:0,bar:0,deg:3,motif:[],replay:[],rest:0,chord:0,prog:[0,5,3,4],pk:null};SND.next=ctx.currentTime+1;SND.prof=-1;
  setSound(true);}catch(e){console.warn('audio',e);SND.ctx=null;}}
function setSound(on){SND.on=on;if(!SND.ctx)return;if(on&&SND.ctx.state==='suspended')SND.ctx.resume();SND.master.gain.setTargetAtTime(on?.75*SETS.master:0,SND.ctx.currentTime,.4);const b=document.getElementById('gSound');if(b)b.textContent=on?'Sound on':'Sound off';}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
function tone(f,t,dec,peak,type='sine',dest){const c=SND.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;o.connect(g);g.connect(dest||SND.out);env(g,t,.005,peak,dec);o.start(t);o.stop(t+dec+.05);return o;}
function noiseHit(t,dec,peak,type,freq,q){const c=SND.ctx,s=c.createBufferSource();s.buffer=SND.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||1;const g=c.createGain();s.connect(f);f.connect(g);g.connect(SND.out);env(g,t,.003,peak,dec);s.start(t,Math.random()*2);s.stop(t+dec+.05);}
function glide(f0,f1,t,dur,peak,type,atk){const c=SND.ctx,o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);o.connect(g);g.connect(SND.out);env(g,t,atk||.01,peak,dur);o.start(t);o.stop(t+dur+.1);return g;}
// play fn with every sound routed through a gain (distance mixing)
function withVol(v,fn){const c=SND.ctx;if(v>=.97){fn();return;}const g=c.createGain();g.gain.value=Math.max(0,v);g.connect(SND.fxg);const o=SND.out;SND.out=g;curVol=v;try{fn();}finally{SND.out=o;curVol=1;}}
let curVol=1;
function sendRev(g,amt){const s=SND.ctx.createGain();s.gain.value=amt*curVol;g.connect(s);s.connect(SND.rev);}
function sfx(name,vol){if(!SND.on||!SND.ctx)return;const c=SND.ctx,t=c.currentTime+.01;withVol(vol==null?1:vol,()=>{
  if(name==='bell'){for(let s=0;s<3;s++){const tt=t+s*1.1;for(const [r,a,d] of [[1,.18,3.2],[2,.08,2.4],[2.4,.06,1.8],[3,.05,1.4],[4.2,.03,1]])tone(330*r,tt,d,a);}}
  else if(name==='toll'){for(let s=0;s<3;s++){const tt=t+s*3.2;for(const [r,a,d] of [[1,.2,4],[2,.07,3],[2.4,.05,2.4],[3,.04,1.6]])tone(262*r,tt,d,a);}}
  else if(name==='peal'){for(let s=0;s<10;s++){const tt=t+s*.5+(s%3)*.05,f=[392,330,294,262][s%4];for(const [r,a,d] of [[1,.13,1.8],[2,.06,1.2],[2.4,.04,.9],[3,.03,.7]])tone(f*r,tt,d,a);}}
  else if(name==='chime'){[0,4,7].forEach((n,i)=>tone(523.25*Math.pow(2,n/12),t+i*.09,1.2,.08));}
  else if(name==='prayer'){[0,7].forEach((n,i)=>{tone(659.25*Math.pow(2,n/12),t+i*.14,1.6,.045);tone(1318.5*Math.pow(2,n/12),t+i*.14,.9,.012);});}
  else if(name==='petition'){[0,5,9].forEach((n,i)=>tone(392*Math.pow(2,n/12),t+i*.16,1.1,.05,'triangle'));}
  else if(name==='tick'){tone(1500,t,.05,.03,'triangle');}
  else if(name==='click'){tone(900,t,.04,.025,'triangle');noiseHit(t,.02,.02,'highpass',4000);}
  else if(name==='era'){[0,4,7,12,16].forEach((n,i)=>{tone(392*Math.pow(2,n/12),t+i*.2,2.4,.07);tone(784*Math.pow(2,n/12),t+i*.2,1.4,.02);});}
  else if(name==='thunder'){noiseHit(t,.25,.6,'highpass',1800);noiseHit(t+.05,3.2,.9,'lowpass',160);noiseHit(t+.4,2.4,.5,'lowpass',90);}
  else if(name==='alarm'){for(let s=0;s<4;s++)for(const [r,a] of [[1,.12],[2.6,.05]])tone(620*r,t+s*.32,.5,a);}
  else if(name==='deny')tone(110,t,.25,.15,'triangle');
  else if(name==='pop'){noiseHit(t,.12,.25,'bandpass',2500,2);noiseHit(t+.15,.6,.18,'highpass',3500);}
  else if(name==='cheer'){for(let i=0;i<5;i++)noiseHit(t+i*.05,.5+Math.random()*.4,.05,'bandpass',900+Math.random()*700,1.4);}
  else if(name==='hammer'){tone(880+Math.random()*300,t,.06,.05,'triangle');noiseHit(t,.05,.08,'bandpass',2000,3);}
  else if(name==='chop'){tone(220+Math.random()*60,t,.1,.08,'triangle');noiseHit(t,.07,.1,'bandpass',900,2);}
  else if(name==='saw'){for(let i=0;i<3;i++){const tt=t+i*.34;const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.Q.value=2;f.frequency.value=1500;o.type='sawtooth';o.frequency.setValueAtTime(190,tt);o.frequency.linearRampToValueAtTime(230,tt+.28);o.connect(f);f.connect(g);g.connect(SND.out);g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.035,tt+.06);g.gain.linearRampToValueAtTime(0,tt+.3);o.start(tt);o.stop(tt+.32);noiseHit(tt,.28,.03,'bandpass',2600,1.5);}}
  else if(name==='clang'){const f=900+Math.random()*500;for(const [r,a,d] of [[1,.07,.9],[2.76,.05,.5],[5.4,.03,.28]])tone(f*r,t,d,a);noiseHit(t,.04,.07,'highpass',3500);if(Math.random()<.6){for(const [r,a,d] of [[1,.05,.7],[2.76,.04,.4]])tone(f*1.19*r,t+.35,d,a);}}
  else if(name==='pick'){tone(1500+Math.random()*400,t,.05,.04,'triangle');noiseHit(t,.06,.06,'bandpass',3000,2);}
  else if(name==='train'){const era=G.era||5;if(era<=5){for(const [f,a] of [[392,.05],[494,.05],[587,.035]]){const g=glide(f*.97,f,t,1.1,a,'sawtooth',.06);sendRev(g,.3);}
      for(let i=0;i<10;i++)noiseHit(t+1.4+i*.28,.12,.04,'bandpass',900+i*40,1);}
    else{const g1=glide(311,311,t,1.1,.05,'sawtooth',.05),g2=glide(392,392,t,1.1,.04,'sawtooth',.05);sendRev(g1,.2);sendRev(g2,.2);tone(311,t+1.3,.9,.04,'sawtooth');tone(392,t+1.3,.9,.03,'sawtooth');}}
  else if(name==='horn'){tone(420,t,.22,.03,'sawtooth');tone(525,t,.22,.025,'sawtooth');}
  else if(name==='steam'){noiseHit(t,.8,.07,'highpass',3200,.7);}
  else if(name==='owl'){for(const [dt,f] of [[0,430],[.55,340],[1.1,340]]){const g=glide(f*1.04,f,t+dt,.38,.05,'sine',.08);sendRev(g,.5);}}
  else if(name==='gull'){const f=1500+Math.random()*400;const g=glide(f,f*.72,t,.5,.025,'triangle',.03);sendRev(g,.3);glide(f*1.1,f*.8,t+.22,.4,.018,'triangle',.03);}
  else if(name==='frog'){for(let i=0;i<2+Math.floor(Math.random()*3);i++){const f=170+Math.random()*60;glide(f,f*1.35,t+i*.14,.09,.03,'square',.01);}}
  else if(name==='dog'){const f=300+Math.random()*80;for(let i=0;i<1+Math.floor(Math.random()*3);i++){glide(f*1.2,f*.8,t+i*.3,.14,.05,'sawtooth',.01);noiseHit(t+i*.3,.1,.03,'bandpass',900,1);}}
  else if(name==='rooster'){const f=520;const g=glide(f,f*1.6,t,.25,.035,'sawtooth',.02);glide(f*1.5,f*.9,t+.3,.22,.03,'sawtooth',.02);glide(f*1.7,f,t+.6,.3,.03,'sawtooth',.02);glide(f*1.3,f*.7,t+1.0,.5,.025,'sawtooth',.03);sendRev(g,.3);}
  else if(name==='moo'){glide(140,115,t,1.3,.035,'triangle',.25);}
  else if(name==='chirp'){bird(t);}
  else if(name==='splash'){noiseHit(t,.4,.08,'bandpass',1400,.8);}
  });}
// songbirds: a handful of phrase shapes, every one a little different
function bird(t,vol){const c=SND.ctx,kind=Math.floor(Math.random()*4),f=2300+Math.random()*2000,pk=(vol==null?1:vol);
  const note=(f0,f1,tt,dur,a)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f0,tt);o.frequency.exponentialRampToValueAtTime(Math.max(300,f1),tt+dur);o.connect(g);g.connect(SND.out);env(g,tt,.008,a*pk,dur);o.start(tt);o.stop(tt+dur+.05);};
  if(kind===0){note(f,f*(.7+Math.random()*.6),t,.12,.025);if(Math.random()<.6)note(f*1.1,f*.8,t+.18,.1,.02);}
  else if(kind===1){const n=3+Math.floor(Math.random()*4);for(let i=0;i<n;i++)note(f*1.3,f*1.25,t+i*.09,.05,.02);}
  else if(kind===2){note(f*.8,f*1.4,t,.14,.022);note(f*1.4,f*.9,t+.17,.16,.02);note(f*.9,f*1.2,t+.38,.1,.018);}
  else{for(let i=0;i<4;i++)note(f*(1+(i%2)*.25),f*(1.1+(i%2)*.2),t+i*.07,.045,.018);}}
// ---------------------------------------------------------------- scene sampling (twice a second, from the camera focus)
const AUD={water:0,flow:0,forest:0,folk:0,site:0,smith:0,saw:0,chop:0,pick:0,mill:0,fact:0,power:0,market:0,church:0,farm:0,house:0,station:0,dock:0,tavern:0,fire:0,fest:0,close:1};
let audT=0,audOne=0,audBeat=0,audLastHr=-1;
function audSample(){const cx=cam.tx,cz=cam.tz;let w=0,sp=0;
  for(let dz=-15;dz<=15;dz+=3)for(let dx=-15;dx<=15;dx+=3){const k=wAt(cx+dx,cz+dz);w+=Math.min(k,1);if(typeof SPD!=='undefined')sp+=Math.min(sampleArr(SPD,cx+dx,cz+dz),3)*Math.min(k,1);}
  AUD.water=clamp(w/40,0,1)*(1-waterU.uIce.value*.8);AUD.flow=clamp(sp/40,0,1);
  let tn=0;for(let i=0;i<trees.length;i++){const t=trees[i];if(t.t===4||t.t===5)continue;const dx=t.x-cx,dz=t.z-cz;if(dx*dx+dz*dz<900)tn++;}AUD.forest=clamp(tn/90,0,1);
  for(const k of ['site','smith','saw','chop','pick','mill','fact','power','market','church','farm','house','station','dock','tavern','fire'])AUD[k]=0;
  const hr=typeof hod==='function'?hod():12,work=hr>6.5&&hr<18;
  if(MODE==='god'||MODE==='sandbox')for(const b of allB()){const dx=b.x-cx,dz=b.z-cz;const d2=dx*dx+dz*dz;if(d2>3600)continue;const f=1-Math.sqrt(d2)/60,t=b.type;
    if(b.fire)AUD.fire=Math.max(AUD.fire,f);
    if(b.build){AUD.site=Math.max(AUD.site,f);continue;}
    if(t==='smith')AUD.smith=Math.max(AUD.smith,work?f:0);else if(t==='sawmill'||t==='mason')AUD.saw=Math.max(AUD.saw,work?f:0);else if(t==='lumber')AUD.chop=Math.max(AUD.chop,work?f:0);
    else if(t==='quarry')AUD.pick=Math.max(AUD.pick,work?f:0);else if(t==='mill')AUD.mill=Math.max(AUD.mill,f);else if(t==='factory')AUD.fact=Math.max(AUD.fact,f);else if(t==='powerplant'||t==='fusion')AUD.power=Math.max(AUD.power,f);
    else if(t==='market')AUD.market=Math.max(AUD.market,work?f:f*.3);else if(t==='church')AUD.church=Math.max(AUD.church,f);else if(t==='farm')AUD.farm=Math.max(AUD.farm,f);else if(t==='house')AUD.house+=f*.05;
    else if(t==='station')AUD.station=Math.max(AUD.station,f);else if(t==='dock')AUD.dock=Math.max(AUD.dock,f);else if(t==='tavern')AUD.tavern=Math.max(AUD.tavern,f);}
  AUD.house=Math.min(1,AUD.house);
  let n=0;const vs=MODE==='god'?(TOWNS.list.length>1?allVill():G.vill):[];for(const v of vs){if(v.hidden)continue;const dx=v.x-cx,dz=v.z-cz;if(dx*dx+dz*dz<900)n++;}AUD.folk=clamp(n/22,0,1);
  AUD.fest=0;if(MODE==='god'&&G.festival>0&&typeof festSpot==='function'){try{const [fx,fz]=festSpot();AUD.fest=clamp(1-Math.hypot(fx-cx,fz-cz)/110,0,1);}catch(e){}}
  AUD.close=clamp(1-(cam.dist-20)/160,.15,1);}
// ---------------------------------------------------------------- the score
const SCALES={minp:[0,3,5,7,10],pent:[0,2,4,7,9],dor:[0,2,3,5,7,9,10],mix:[0,2,4,5,7,9,10],lyd:[0,2,4,6,7,9,11],min:[0,2,3,5,7,8,10],phr:[0,1,3,5,7,8,10],maj:[0,2,4,5,7,9,11]};
const MP=[{root:57,sc:'minp',v:'flute',bpm:50,perc:'frame',dens:.4,pad:0,drone:'sine'},{root:55,sc:'pent',v:'pluck',bpm:60,perc:'frame',dens:.5,pad:0,drone:'sine'},
  {root:50,sc:'dor',v:'pluck',bpm:64,perc:'frame',dens:.5,pad:.25,drone:'sine'},{root:50,sc:'dor',v:'pluck',bpm:70,perc:null,dens:.55,pad:.3,drone:'hurdy',organ:1},
  {root:55,sc:'mix',v:'pluck',bpm:68,perc:null,dens:.5,pad:.6,drone:'hurdy',organ:1},{root:52,sc:'min',v:'piano',bpm:74,perc:'mach',dens:.42,pad:.6,drone:'mach'},
  {root:53,sc:'maj',v:'ep',bpm:60,perc:null,dens:.3,pad:1,drone:'sine'},{root:50,sc:'lyd',v:'synth',bpm:80,perc:'soft',dens:.5,pad:1,drone:'sine',delay:1}];
const PROGS=[[0,5,3,4],[0,3,4,3],[0,4,5,3],[0,2,3,4],[0,3,0,4],[5,3,0,4]];
function ksBuf(m){let b=SND.pl.get(m);if(b)return b;const c=SND.ctx,sr=c.sampleRate,f=mf(m),len=Math.floor(sr*2.2),P=Math.max(2,Math.round(sr/f));b=c.createBuffer(1,len,sr);const y=b.getChannelData(0);
  for(let i=0;i<P;i++)y[i]=(Math.random()*2-1)*.5;for(let i=P;i<len;i++)y[i]=(y[i-P]+y[i-P+1])*.4985;SND.pl.set(m,b);if(SND.pl.size>70){const k=SND.pl.keys().next().value;SND.pl.delete(k);}return b;}
function mPluck(m,t,v){const c=SND.ctx,s=c.createBufferSource();s.buffer=ksBuf(m);const g=c.createGain();g.gain.value=v;s.connect(g);g.connect(SND.mus);s.start(t);}
function mFlute(m,t,dur,v){const c=SND.ctx,f=mf(m),o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain();o.type='sine';o2.type='triangle';o.frequency.value=f;o2.frequency.value=f*2;l.frequency.value=4.6;lg.gain.value=f*.007;l.connect(lg);lg.connect(o.frequency);
  const g2=c.createGain();g2.gain.value=.12;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(SND.mus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.5,t+.12);g.gain.setValueAtTime(v*.42,t+dur*.6);g.gain.linearRampToValueAtTime(0,t+dur);
  const s=c.createBufferSource();s.buffer=SND.noise;const bf=c.createBiquadFilter();bf.type='bandpass';bf.frequency.value=f*2;bf.Q.value=3;const ng=c.createGain();ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(.03*v,t+.08);ng.gain.linearRampToValueAtTime(0,t+dur);s.connect(bf);bf.connect(ng);ng.connect(SND.mus);s.start(t,Math.random()*2);s.stop(t+dur+.05);
  o.start(t);o2.start(t);l.start(t);o.stop(t+dur+.05);o2.stop(t+dur+.05);l.stop(t+dur+.05);}
function mBell(m,t,v,dec){const f=mf(m);for(const [r,a,d] of [[1,.5,dec],[2.01,.18,dec*.6],[3.99,.07,dec*.35]])tone(f*r,t,d,a*v,'sine',SND.mus);}
function mEp(m,t,v){const c=SND.ctx,f=mf(m),car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),g=c.createGain();car.frequency.value=f;mod.frequency.value=f;mg.gain.setValueAtTime(f*1.4,t);mg.gain.exponentialRampToValueAtTime(f*.05,t+.9);mod.connect(mg);mg.connect(car.frequency);car.connect(g);g.connect(SND.mus);env(g,t,.006,v*.5,1.8);car.start(t);mod.start(t);car.stop(t+1.9);mod.stop(t+1.9);}
function mSynth(m,t,v,dur,type){const c=SND.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=type||'sawtooth';o.frequency.value=mf(m);f.type='lowpass';f.Q.value=3;f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(3200,t+dur*.3);f.frequency.exponentialRampToValueAtTime(500,t+dur);
  o.connect(f);f.connect(g);g.connect(SND.mus);if(SND.dly)g.connect(SND.dly);env(g,t,.01,v*.28,dur);o.start(t);o.stop(t+dur+.05);}
function mPad(notes,t,dur,v,kind){const c=SND.ctx;for(const m of notes){for(const det of [-6,6]){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=kind==='organ'?'triangle':kind==='saw'?'sawtooth':'triangle';o.frequency.value=mf(m);o.detune.value=det;f.type='lowpass';f.frequency.value=kind==='saw'?650:kind==='organ'?1100:900;f.Q.value=.4;
    o.connect(f);f.connect(g);g.connect(SND.mus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.05);}
    if(kind==='organ')tone(mf(m)*2,t,dur,v*.15,'sine',SND.mus);}}
function mThump(t,v,low){const c=SND.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(low?85:110,t);o.frequency.exponentialRampToValueAtTime(low?42:55,t+.18);o.connect(g);g.connect(SND.mus);env(g,t,.004,v,.3);o.start(t);o.stop(t+.4);}
function mTick(t,v,f){const c=SND.ctx,s=c.createBufferSource();s.buffer=SND.noise;const fl=c.createBiquadFilter();fl.type='highpass';fl.frequency.value=f||5500;const g=c.createGain();s.connect(fl);fl.connect(g);g.connect(SND.mus);env(g,t,.002,v,.05);s.start(t,Math.random()*2);s.stop(t+.1);}
function degM(p,sc,d){const n=sc.length,o=Math.floor(d/n);return p.root+12*o+sc[((d%n)+n)%n];}
function musState(){const raid=!!(G.raid&&G.raid.active),vs=G.vill||[];let sick=0;for(let i=0;i<vs.length;i+=3)if(vs[i].sick)sick++;
  const tense=MODE==='god'&&G.phase==='play'&&(raid||(G.dev&&G.dev.cult&&G.dev.cult.strength>.25)||sick*3>Math.max(6,vs.length*.1)||G.hap<30||(G.storm>0));return tense?1:0;}
function profileNow(){return MODE==='title'?MP[3]:MP[clamp(G.era||0,0,7)];}
function setDrones(p,pi,tz){const c=SND.ctx,now=c.currentTime,D=SND.dr,r=p.root,T=(n,v)=>n.g.gain.setTargetAtTime(v,now,2.5),F=(n,m)=>n.o.frequency.setTargetAtTime(mf(m),now,1.5);
  F(D.sub,r-24);F(D.fifth,r-17);F(D.oct,r-12);F(D.tri,r-18+0);D.tri.o.frequency.setTargetAtTime(mf(r-12+6),now,1.5);F(D.hu1,r-12);F(D.hu2,r-5);F(D.ma,r-24);D.mb.o.frequency.setTargetAtTime(mf(r-24)*1.006,now,1);
  const k=p.drone;T(D.sub,k==='sine'?.17:k==='hurdy'?.1:.08);T(D.fifth,k==='sine'?.07:.03);T(D.oct,k==='sine'?.06:.04);T(D.tri,0);T(D.hu1,k==='hurdy'?.045:0);T(D.hu2,k==='hurdy'?.03:0);T(D.ma,k==='mach'?.055:0);T(D.mb,k==='mach'?.03:0);}
function scoreStep(t,p,tense){const S=SND.m,c=SND.ctx;let sc=SCALES[p.sc];const fest=AUD.fest>.35;if(tense>.5)sc=SCALES[(G.era||0)<=4?'phr':'min'];else if(fest)sc=SCALES[(G.era||0)<=1?'pent':'mix'];
  const st=S.step%8,bar=Math.floor(S.step/8),night=typeof nightF!=='undefined'&&nightF>.5;
  const dens=p.dens*(tense>.5?.6:1)*(night?.7:1)*(fest?1.5:1)*(MODE==='title'?1.05:1);
  if(st===0){S.bar=bar;if(bar%2===0){const pr=PROGS[S.pk==null?(S.pk=Math.floor(Math.random()*PROGS.length)):S.pk];S.chord=pr[(bar/2)%4|0];if(bar%8===0&&Math.random()<.5)S.pk=Math.floor(Math.random()*PROGS.length);}
    S.rest=(bar%4===3&&Math.random()<.4)?1:0;if(S.replay.length===0&&S.motif.length>=3&&Math.random()<.28)S.replay=S.motif.slice();S.motif=[];
    const n=sc.length,ch=[S.chord,S.chord+2,S.chord+4].map(d=>degM(p,sc,d));
    // bass and pads on chord changes
    if(bar%2===0){if(p.pad&&Math.random()<p.pad){const kind=p.organ?'organ':(G.era||0)===5?'saw':(G.era||0)===7?'saw':'sine';const notes=ch.map(m=>m>p.root+13?m-12:m).concat(kind==='saw'?[degM(p,sc,S.chord+6)]:[]);mPad(notes,t,beat(p,tense)*9,(kind==='saw'?.03:.045)*(tense>.5?.8:1),kind);}
      if((G.era||0)>=5&&MODE!=='title'){tone(mf(ch[0]-24),t,beat(p,tense)*7,.18,'triangle',SND.mus);}}
    if(tense>.5&&bar%2===0)mThump(t,.35,true);}
  const beatS=beat(p,tense)/2,pv=p.v;
  // melody
  const rest=S.rest&&bar%4===3;let go=false;
  if(!rest&&(st%2===0||Math.random()<dens*.25)&&Math.random()<dens*(st%4===0?1.7:1)*(pv==='synth'?.55:1))go=true;
  if(go){let d;if(S.replay.length){d=S.replay.shift();d+=S.chord-(S._rc||0);}else{S.deg=clamp(S.deg+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)],-2,9);
      if(st%4===0&&Math.random()<.6){const ct=[S.chord,S.chord+2,S.chord+4,S.chord+7];let b=ct[0],bd=99;for(const x of ct)for(const o of [-7,0,7]){const dd=Math.abs(x+o-S.deg);if(dd<bd){bd=dd;b=x+o;}}S.deg=clamp(b,-2,9);}d=S.deg;}
    S._rc=S.chord;S.motif.push(d);let m=degM(p,sc,d)+((p.v==='flute'||p.v==='synth'||p.v==='ep')?12:0);if(tense>.5&&p.v!=='synth')m-=5;
    const vel=.32+Math.random()*.14;
    if(pv==='pluck')mPluck(m,t,vel);else if(pv==='flute')mFlute(m,t,beatS*(2+Math.floor(Math.random()*3)),vel);else if(pv==='piano')mBell(m,t,vel*.7,1.5);else if(pv==='ep')mEp(m,t,vel);else if(pv==='synth')mSynth(m,t,vel*.9,beatS*3,'triangle');
    if(st===0&&(pv==='pluck')&&Math.random()<.6)mPluck(degM(p,sc,S.chord)-12,t+.02,.28);}
  // arpeggio for the futuristic score
  if(pv==='synth'&&!rest&&Math.random()<.5*(tense>.5?.5:1)){const ct=[S.chord,S.chord+2,S.chord+4,S.chord+7,S.chord+9];const d=ct[(S.step*3+((S.step>>3)&3))%5];mSynth(degM(p,sc,d)+12,t,.35,beatS*1.4,'sawtooth');}
  // percussion
  if(p.perc==='frame'&&(MODE!=='god'||!G.paused)){if(st===0)mThump(t,.28*(fest?1.4:1),false);if((st===4||(fest&&st%2===0))&&Math.random()<(fest?.9:.55))mThump(t,.16,false);if(fest&&st%2===1&&Math.random()<.5)mTick(t,.04,3000);}
  else if(p.perc==='mach'){if(st%2===0)mThump(t,.14,true);else if(Math.random()<.45){tone(1800+Math.random()*600,t,.05,.025,'triangle',SND.mus);mTick(t,.05,2500);}if(st===6&&Math.random()<.3){const s=c.createBufferSource();s.buffer=SND.noise;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=4000;const g=c.createGain();s.connect(f);f.connect(g);g.connect(SND.mus);env(g,t,.02,.04,.35);s.start(t,Math.random()*2);s.stop(t+.5);}}
  else if(p.perc==='soft'){if(st%4===0)mThump(t,.12,true);if(Math.random()<.55)mTick(t,.025,7000);}
  if(tense>.5&&!p.perc&&st%4===0)mThump(t,.12,true);
  S.step++;}
function beat(p,tense){return 60/(p.bpm*(tense>.5?.88:1)*(AUD.fest>.35?1.4:1)*(MODE==='god'&&typeof nightF!=='undefined'&&nightF>.5?.92:1));}
function stinger(era){if(!SND.ctx||!SND.on)return;const c=SND.ctx,t=c.currentTime+.05,p=MP[clamp(era,0,7)],sc=SCALES[p.sc==='lyd'?'lyd':p.sc==='min'?'dor':p.sc];
  const ds=[0,2,4,7,9,11];ds.forEach((d,i)=>{const m=degM(p,sc,d)+12;mBell(m,t+i*.32,.9,3.4);if(era>=5)mSynth(m,t+i*.32,.5,1.2,'triangle');});
  mPad([p.root-12,p.root-5,p.root,degM(p,sc,2)],t,6,.06,era>=5?'saw':'organ');SND.eraStinger=t;}
let sndEraInit=false;
function audioUpdate(dt){if(!SND.on||!SND.ctx)return;const c=SND.ctx,now=c.currentTime;audT+=dt;const title=MODE==='title';
  if(audT>.5){audT=0;if(title){for(const k of ['site','smith','saw','chop','pick','mill','fact','power','market','church','farm','house','station','dock','tavern','fire','fest','water','forest','folk'])AUD[k]=0;AUD.close=1;}else audSample();
    const L=SND.lvl,close=AUD.close,e=title?3:(G.era||0),sn=MODE==='god'?seasonN():1,night=(typeof nightF!=='undefined'?nightF:0),rain=rainU.uA.value,work=(typeof hod==='function'&&hod()>6.5&&hod()<18)?1:0;
    L.water.g.gain.setTargetAtTime((AUD.water*.12+AUD.flow*.25)*close*(title?0:1),now,.6);L.water.f.frequency.setTargetAtTime(400+AUD.flow*900,now,.6);
    L.wind.g.gain.setTargetAtTime(title?.04:.05+(MODE==='god'&&sn===3?.08:0)+rain*.12+clamp((cam.dist-80)/300,0,.1)+AUD.forest*.02,now,1);
    L.rain.g.gain.setTargetAtTime(title?0:rain*(rainU.uSnow.value?.04:.22),now,.8);
    L.forest.g.gain.setTargetAtTime(AUD.forest*.07*close*(1+rain*.5)*(sn===3?.5:1),now,1.2);
    const bab=Math.max(AUD.folk*.55,AUD.market*.9,AUD.tavern*(night>.4?.8:.3),AUD.fest*1.1);L.crowd.g.gain.setTargetAtTime((bab*.09)*close+AUD.fire*.05,now,.8);L.crowd.f.frequency.setTargetAtTime(700+AUD.market*250+AUD.fest*200,now,1);
    L.mill.g.gain.setTargetAtTime(AUD.mill*.12*close*work,now,1);L.fact.g.gain.setTargetAtTime(AUD.fact*.05*close*(e>=5?1:0),now,1.2);L.power.g.gain.setTargetAtTime(AUD.power*.045*close,now,1.2);
    const roads=(e>=6&&G.net&&G.net.lines&&G.net.lines.length)?1:0;L.traffic.g.gain.setTargetAtTime((e>=6?AUD.house*.07+AUD.folk*.03:e>=5?AUD.house*.03*(AUD.station>0?1.5:1):0)*close*(1+roads*.4),now,1.5);
    const warm=(sn>=1&&sn<=2)?1:sn===0?.5:0;L.cricket.g.gain.setTargetAtTime(clamp(night*1.6-.3,0,1)*warm*.03*(rain>.1?0:1)*(title?0:1)*Math.max(.3,AUD.forest+.3)*(MODE==='god'&&G.phase==='shape'?1:1),now,2);
    // score level and drones
    const pi=title?3:clamp(G.era||0,0,7);const tz=title?0:musState();SND.tz+=(tz-SND.tz)*.35;
    if(pi!==SND.prof){SND.prof=pi;setDrones(MP[pi],pi,SND.tz);}
    SND.dr.tri.g.gain.setTargetAtTime(SND.tz>.5?.045:0,now,3);
    const slow=!title&&G.paused&&MODE==='god';SND.mus.gain.setTargetAtTime((slow?.25:.55)*(AUD.fest>.35?1.25:1)*(title?1:1),now,.8);
    // an age begins
    if(!title&&MODE==='god'&&G.phase==='play'){const key=(G.realm||'')+':'+TOWNS.cur,seen=SND.eraSeen[key];if(seen==null)SND.eraSeen[key]=G.era;else if(G.era>seen){SND.eraSeen[key]=G.era;stinger(G.era);}else if(G.era<seen)SND.eraSeen[key]=G.era;}}
  // random one-shots
  if(title)return musicPump(now,dt);
  const hr=typeof hod==='function'?hod():12,night=typeof nightF!=='undefined'?nightF:0,day=1-night,sn=MODE==='god'?seasonN():1,rain=rainU.uA.value,close=AUD.close,e=G.era||0;
  const dawn=hr>4.5&&hr<9.5?1.6:1,r=(rate)=>Math.random()<rate*dt;
  if(day>.5&&sn!==3&&rain<.1&&r((.25+AUD.forest*.9+AUD.house*.25)*dawn*(cam.dist<140?1:.3)*close*1.6))withVol(.4+close*.6,()=>bird(now+.01));
  if(night>.6&&AUD.forest>.15&&sn!==3&&r(.04*AUD.forest*close))sfx('owl',.35+close*.4);
  if(night>.3&&AUD.water>.25&&sn>=1&&sn<=2&&rain<.1&&r(.5*AUD.water))sfx('frog',.4+close*.5);
  if(AUD.dock>.1&&AUD.water>.1&&day>.4&&r(.12*AUD.dock))sfx('gull',.3+close*.5);
  if(e<=5&&hr>4.8&&hr<8.5&&AUD.farm+AUD.house>.15&&r(.03))sfx('rooster',.25+close*.4);
  if(e<=6&&AUD.house>.15&&day>.3&&r(.012))sfx('dog',.25+close*.4);
  if(e<=5&&AUD.farm>.2&&day>.4&&r(.012))sfx('moo',.2+close*.35);
  if(!G.paused||MODE!=='god'){
    const mul=Math.min(G.speed||1,3);
    if(AUD.site>0&&r(Math.min(5,3.4*AUD.site)*mul*close*(day>.2?1:0)))sfx(Math.random()<.35?'saw':'hammer',(.3+AUD.site*.7)*(.4+close*.6));
    if(AUD.smith>0&&r(.9*AUD.smith*mul))sfx('clang',(.3+AUD.smith*.7)*(.4+close*.6));
    if(AUD.saw>0&&r(.45*AUD.saw*mul))sfx('saw',(.3+AUD.saw*.6)*(.4+close*.6));
    if(AUD.chop>0&&r(1.2*AUD.chop*mul))sfx('chop',(.3+AUD.chop*.7)*(.4+close*.6));
    if(AUD.pick>0&&r(1.2*AUD.pick*mul))sfx('pick',(.3+AUD.pick*.7)*(.4+close*.6));
    if(AUD.fact>0&&e>=5&&r(.5*AUD.fact*mul))sfx('clang',.25*AUD.fact*(.4+close*.6));
    if(AUD.station>0&&e>=5&&r(.012))sfx('train',(.3+AUD.station*.7)*(.4+close*.6));
    if(AUD.fire>0&&r(8*AUD.fire))noiseHit(now+.01,.04,.06*AUD.fire,'highpass',3000);}
  if(AUD.fest>.3&&r(1.1*AUD.fest))sfx('cheer',.3+AUD.fest*.5);
  // the bells
  if(MODE==='god'&&G.phase==='play'&&AUD.church>.05){const hh=Math.floor(hr);if(hh!==audLastHr){audLastHr=hh;if(hh===9&&isSunday()&&e>=1&&e<=6)sfx(e>=5?'chime':'bell',.25+AUD.church*.6);}}else if(typeof hod==='function')audLastHr=Math.floor(hr);
  musicPump(now,dt);}
function musicPump(now,dt){const c=SND.ctx;if(MODE==='god'&&G.paused&&SND.next<now){SND.next=now+.3;return;}
  const p=profileNow(),tz=SND.tz;if(SND.next<now-1)SND.next=now+.2;
  let guard=0;while(SND.next<now+.25&&guard++<4){const be=beat(p,tz);const st=SND.m.step%8;
    if(MODE==='title'&&SND.m.step%16===0)menuSwell(SND.next);
    scoreStep(SND.next,p,tz);SND.next+=be/2;}}
function menuSwell(t){if(!SND.ctx)return;const c=SND.ctx;const roots=[[73.42,110,146.83,220],[65.41,98,130.81,196],[87.31,130.81,174.61,261.63],[98,146.83,196,293.66]];const ch=roots[Math.floor(SND.m.step/16)%4];
  for(const f of ch){for(const det of [-3,3]){const o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;fl.type='lowpass';fl.frequency.value=f*2.2;fl.Q.value=.4;
    o.connect(fl);fl.connect(g);g.connect(SND.mus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022,t+2.4);g.gain.linearRampToValueAtTime(.016,t+5.5);g.gain.linearRampToValueAtTime(0,t+8.4);o.start(t);o.stop(t+8.6);}}}
// ---------------------------------------------------------------- bells for the folk's days (listen to the story bus)
addEventListener('load',()=>{if(typeof STORY!=='undefined')STORY.on(e=>{if(!SND.on||!SND.ctx||MODE!=='god')return;const near=AUD.church>.05||AUD.folk>.2;const v=near?.7:.3;
  if(e.k==='wedding'&&(G.era||0)>=1)sfx((G.era||0)>=6?'chime':'peal',v);else if((e.k==='funeral'||e.k==='death'&&e.big)&&(G.era||0)>=1)sfx((G.era||0)>=6?'chime':'toll',v*.8);});});
