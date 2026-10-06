'use strict';
// ================================================================ prayers that fit the age, and come at a human pace
// Each prayer has an age window (era:[from,to]) and may word itself differently as the ages change (tv: [[fromEra,text],...]).
// New prayers appear one at a time, picked at random from those that apply, with a pause between them: the panel is a few real
// people with real worries, not a standing list. Urgent ones (fire, flood, raiders, sickness, drought) skip the pause.
const PRAYER_META={
  settle:{era:[0,0]},water:{era:[0,2]},sunrise:{era:[0,1]},
  food:{era:[0,7],tv:[[5,'The markets stand empty and our people go hungry. Help us feed the city!']],w:2},
  rain:{era:[0,7],tv:[[5,'The reservoirs run dry. Send us rain!']]},
  harvest:{era:[0,4]},
  trees:{era:[0,4]},
  land:{era:[0,7],w:2},worship:{era:[1,7]},fire:{era:[0,7]},flood:{era:[0,7]},
  protect:{era:[1,7],tv:[[5,'Looters and rioters are in the streets! Protect us, Spirit!']]},
  game:{era:[0,4]},
  fished:{era:[0,4],w:.7},heal:{era:[0,7]}};
const BLESSN={church:'house of worship',market:'market',tavern:'tavern',smith:'forge',mill:'mill',school:'school',factory:'works',station:'station',powerplant:'power station',fusion:'reactor',castle:'castle',hall:'town hall',well:'well',tower:'tower',lodge:'lodge',dock:'harbour',farm:'fields'};
// returns a building worth blessing that has not been blessed lately
function blessTarget(){const era=G.era||0,c=buildings.filter(b=>!b.build&&!b.upg&&!b.fire&&BLESSN[b.type]&&b.type!=='farm'&&!(b.blessUntil>G.t-96)&&(b.type!=='lodge'||era<=4));return c.length?pickA(c):null;}
Object.assign(PRAYERS,{
  festival:{t:'We are weary and short of joy. Let us hold a festival!',how:'Cast Festival.',when:()=>popN()>=14&&G.era>=1&&G.hap<56&&G.festival<=0&&G.t-(G.lastFest||-999)>72,ok:()=>G.festival>0||G.t-G.lastFest<10,r:25,d:4,w:1,cool:96},
  blessB:{t:'Bless the {X}, Spirit, that its work may prosper.',how:'Use Bless on it.',when:()=>popN()>=12&&G.era>=1&&!!blessTarget(),ok:pr=>{const b=bById(pr.tgt);return !b||b.blessUntil>G.t;},r:15,d:5,w:.45,tgt:1,cool:80},
  wet:{t:'The endless rain is rotting what we planted. Send the sun!',how:'Cast Sunshine.',when:()=>!G.openRain&&G.rain>60&&G.era<=6,ok:()=>G.rain<=0||G.sun>0,r:20,d:3,w:1.2},
  cold:{t:'The winter is bitter and our fuel is nearly gone. Send us warmth!',how:'Cast Sunshine, or help them find timber.',when:()=>seasonN()===3&&popN()>=10&&G.wood<popN()*1.1&&G.era<=5,ok:()=>G.sun>0||seasonN()!==3||G.wood>popN()*3,r:25,d:3,w:1.2},
  smog:{t:'The smoke is choking us and the children cough. Wash the sky clean!',how:'Cast Rain, and let the forests grow near the town.',when:()=>G.era>=5&&(G.poll||0)>34,ok:()=>G.rain>0||(G.poll||0)<22,r:30,d:4,urgent:0,w:2.2},
  poison:{t:'The river runs grey from the works and the fish are dead. Cleanse our waters!',how:'Cast Rain, or raise a spring.',when:()=>G.era>=5&&(G.fish||1)<.5&&(G.poll||0)>26,ok:()=>G.rain>0||(G.fish||1)>.75||(G.poll||0)<18,r:30,d:5,w:1.4},
  park:{t:'Our city has no green left. Let a wood grow among the towers!',how:'Grow forest near the town.',when:()=>G.era>=5&&G.center&&!G.center.build&&trees.filter(t=>t.t!==4&&t.t!==5&&Math.hypot(t.x-G.center.x,t.z-G.center.z)<55).length<30,ok:()=>G.center&&trees.filter(t=>t.t!==4&&t.t!==5&&Math.hypot(t.x-G.center.x,t.z-G.center.z)<55).length>=45,r:30,d:6,w:1.3},
  housing:{t:'Families are crowded into too few homes. We need room to build!',how:'Flatten dry ground near the town, or plant a banner.',when:()=>popN()>=40&&G.era>=2&&bedsFree()<=0,ok:()=>bedsFree()>=4,r:25,d:6,w:1.2},
  power:{t:'The storm has knocked out our power! Calm the sky!',how:'Calm the weather: cast Sunshine.',when:()=>G.era>=6&&G.storm>0,ok:()=>G.storm<=0||G.sun>0,r:25,d:3,urgent:1,w:1.5},
  grief:{t:'We are grieving and the days are heavy. Give us something to lift our hearts.',how:'Cast Festival, or Heal.',when:()=>G.grief>7&&G.era>=1,ok:()=>G.grief<3||G.festival>0,r:20,d:4,w:1.1}});
function prayerText(k,D){let t=D.t;const m=PRAYER_META[k];if(m&&m.tv){for(const [e,x] of m.tv)if((G.era||0)>=e)t=x;}return t;}
function prayerOpen(k,D){const m=PRAYER_META[k]||{},e=G.era||0;return e>=(m.era?m.era[0]:0)&&e<=(m.era?m.era[1]:7);}
function prayerCap(){const p=popN();return p>=40?3:p>=12?2:1;}
function prayerTick(){
  for(const pr of G.prayers.slice()){const D=PRAYERS[pr.k];if(!D){G.prayers.splice(G.prayers.indexOf(pr),1);continue;}
    if(!prayerOpen(pr.k,D)&&pr.k!=='fire'){G.prayers.splice(G.prayers.indexOf(pr),1);continue;}// the age moved on: the worry went with it
    if(D.ok(pr)){G.prayers.splice(G.prayers.indexOf(pr),1);devPrayer(true);G.faith=Math.min(faithCap(),G.faith+D.r);G.joy=Math.min(20,G.joy+4);chron(`The Spirit answered the prayer: “${pr.txt}” (+${D.r} faith)`);toast(`Prayer answered! +${D.r} faith`);sfx('chime');G.prayerCool[pr.k]=G.t+(D.cool||30);continue;}
    if(G.t>pr.until){G.prayers.splice(G.prayers.indexOf(pr),1);devPrayer(false);G.sad=Math.min(20,G.sad+5);chron(`A prayer went unanswered: “${pr.txt}”`);G.prayerCool[pr.k]=G.t+48;}}
  const cap=prayerCap(),pause=G.t<(G.prayNext||0);
  const cands=[];for(const k in PRAYERS){const D=PRAYERS[k];if(G.prayers.some(p=>p.k===k)||(G.prayerCool[k]||0)>G.t||!prayerOpen(k,D))continue;
    if(!D.urgent&&(pause||G.prayers.length>=cap))continue;if(D.urgent&&G.prayers.length>=cap+1)continue;
    let ok=false;try{ok=!!D.when();}catch(e){ok=false;}if(ok)cands.push(k);}
  if(!cands.length)return;
  let tot=0;const ws=cands.map(k=>{const m=PRAYER_META[k]||{},D=PRAYERS[k],w=(D.w||m.w||1)*(D.urgent?3:1);tot+=w;return w;});let x=rnd()*tot,k=cands[0];for(let i=0;i<cands.length;i++){x-=ws[i];if(x<=0){k=cands[i];break;}}
  const D=PRAYERS[k];let xx='';if(k==='fire'){const b=buildings.find(o=>o.fire);xx=b&&b.info?b.info.name:'house';}if(k==='land')xx=G.siteFail?siteName({type:G.siteFail.type,variant:null,r:3}):'building';if(D.x)xx=D.x();
  const pr={k,txt:'',until:G.t+D.d*24,urgent:!!D.urgent};
  if(D.tgt){const b=blessTarget();if(!b)return;pr.tgt=b.id;xx=b.info?b.info.name:(BLESSN[b.type]||b.type);}
  pr.txt=prayerText(k,D).replace('{X}',xx);G.prayers.push(pr);G.prayerCool[k]=G.t+16;if(!D.urgent)G.prayNext=G.t+9+rnd()*15;if(D.urgent)sfx('alarm');
}
// rain washes the air
{const _d=eraDaily;eraDaily=function(){_d();if(G.rain>0&&(G.poll||0)>0)G.poll=Math.max(0,G.poll-6);};}
// ---------------- faith is worth less as the ages go on: miracles cost more (income grows with the town; costs did not)
const faithMul=()=>1+(G.era||0)*.4;
{const _spend=spend;spend=function(c){return _spend(Math.round(c*faithMul()));};
 const _gtd=godToolDefs;godToolDefs=function(){const defs=_gtd.apply(this,arguments),m=faithMul();return defs.map(([g,list])=>[g,list.map(t=>(typeof t[3]==='number'&&t[3]>0)?[t[0],t[1],t[2],Math.round(t[3]*m),t[4]]:t)]);};}
