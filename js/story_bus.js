'use strict';
// ================================================================ the story bus: one place where the lives of the folk are recorded
// Everything that happens to a person worth telling (a wedding, a birth, a death, a grudge, a miracle remembered, a tradition born)
// is sent here with storyEvent(kind, {who:[villagerIds], txt:'...', big:bool, ...}). Other systems (the story feed, a person's page,
// the Chronicle, legends, culture) listen with STORY.on(fn). It is per settlement (G.story), saved with the town, capped, and cheap:
// events are things that HAPPEN, never things computed per frame.
//   kinds in use: birth death wedding courtship friendship rivalry grudge kindness apprentice inherit funeral memorial hero villain
//                 miracle legend custom festival naming tradition journey trade arrival departure milestone
const STORY={subs:[],on(f){this.subs.push(f);},fire(e){for(const f of this.subs){try{f(e);}catch(err){console.error('story',err);}}}};
function storyEvent(kind,o){o=o||{};if(!G.story)G.story=[];
  const e=Object.assign({k:kind,t:G.t,day:typeof dayN==='function'?dayN():0,date:typeof dateStr==='function'?dateStr():'',town:G.town,who:[]},o);
  G.story.unshift(e);if(G.story.length>600)G.story.length=600;
  if(o.chron&&typeof chron==='function')chron(e.txt,!!o.big);
  STORY.fire(e);return e;}
// storyEvents about one person, newest first
function storyOf(id){return (G.story||[]).filter(e=>e.who&&e.who.includes(id));}
SAVE_PER.push('story');if(typeof PERKEYS!=='undefined')PERKEYS.push('story');
