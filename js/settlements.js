'use strict';
// ================================================================ settlements
// The valley can hold several peoples. Each settlement has its own folk, buildings, resources, age, crafts, devotion and
// petitions; weather, the seasons, the world and your Faith are shared. To keep the single-town simulation unchanged,
// the settlement being simulated (or viewed) is swapped into the live game state G and the `buildings` array;
// everything else is parked in TOWNS.list[i]. With one settlement nothing is ever swapped.
const PERKEYS=['dev','tf','net','vill','bandits','markers','prayers','center','plan','food','wood','stone','era','hap','hapT','hapF','sad','grief','joy','wantHouse','flooded','floodMap','siteFail','noTrees',
  'prod','prodY','failCool','sk','unl','fish','boatsBuilt','boatWork','env','noGame','cons','firstHut','raids','births','deaths','arrivals','prayerCool','plagueCool','lastFest','harvest','festival','festCool',
  'raid','raidCool','town','poll','pollWarn','waterDist','starve','starveH','lowDays','pid'];
const TOWNS={list:[],cur:0,act:0};
let SHARED=true; // true on the first settlement's pass of an hour/day: weather and other world-wide work happens once
function sDefaults(town){return {dev:devNew(),tf:tfNew(),net:null,vill:[],bandits:[],markers:[],prayers:[],center:null,plan:null,food:70,wood:45,stone:0,era:0,hap:62,hapT:62,hapF:{},sad:0,grief:0,joy:0,wantHouse:[],flooded:0,floodMap:new Uint8Array(NN),siteFail:null,noTrees:false,
  prod:{food:0,wood:0,stone:0},prodY:{food:0,wood:0,stone:0},failCool:{},sk:{wood:0,work:0,stone:0,farm:0,fish:0,hunt:0},unl:{},fish:1,boatsBuilt:0,boatWork:0,env:null,noGame:false,cons:0,firstHut:false,raids:0,births:0,deaths:0,arrivals:0,prayerCool:{},plagueCool:0,lastFest:-9,harvest:0,festival:0,festCool:0,
  raid:null,raidCool:40,town:town||townName(),poll:0,pollWarn:false,waterDist:0,starve:0,starveH:0,lowDays:0,pid:1};}
function sInit(){TOWNS.list=[{st:null,bld:[],dead:false}];TOWNS.cur=0;TOWNS.act=0;}
const sMulti=()=>TOWNS.list.length>1;
function swapOut(){const s=TOWNS.list[TOWNS.cur];if(!s)return;s.st={};for(const k of PERKEYS)s.st[k]=G[k];s.bld=buildings.slice();}
function swapIn(i){const s=TOWNS.list[i];if(!s||!s.st)return;for(const k of PERKEYS)G[k]=s.st[k];buildings.length=0;for(const b of s.bld)buildings.push(b);TOWNS.cur=i;}
function withSettlement(i,fn){if(i===TOWNS.cur)return fn();const prev=TOWNS.cur;swapOut();swapIn(i);try{return fn();}finally{swapOut();swapIn(prev);}}
function eachSettlement(fn){if(TOWNS.list.length<=1){fn(0);return;}for(let i=0;i<TOWNS.list.length;i++){if(TOWNS.list[i].dead)continue;withSettlement(i,()=>fn(i));}}
// everything that is drawn or stamped on the terrain must see every settlement
function allB(){if(TOWNS.list.length<=1)return buildings;const out=[];TOWNS.list.forEach((s,i)=>{const l=i===TOWNS.cur?buildings:s.bld;for(const b of l)out.push(b);});return out;}
function allVill(){if(TOWNS.list.length<=1)return G.vill;const out=[];TOWNS.list.forEach((s,i)=>{const l=i===TOWNS.cur?G.vill:(s.st&&s.st.vill)||[];for(const v of l)out.push(v);});return out;}
function allBandits(){if(TOWNS.list.length<=1)return G.bandits;const out=[];TOWNS.list.forEach((s,i)=>{const l=i===TOWNS.cur?G.bandits:(s.st&&s.st.bandits)||[];for(const v of l)out.push(v);});return out;}
function allMarkers(){if(TOWNS.list.length<=1)return G.markers;const out=[];TOWNS.list.forEach((s,i)=>{const l=i===TOWNS.cur?G.markers:(s.st&&s.st.markers)||[];for(const m of l)out.push(m);});return out;}
// read a per-settlement value of settlement i without swapping
function sGet(i,k){return i===TOWNS.cur?G[k]:(TOWNS.list[i].st?TOWNS.list[i].st[k]:undefined);}
const sName=i=>sGet(i,'town');
