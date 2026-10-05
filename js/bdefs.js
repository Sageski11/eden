'use strict';
// ================================================================ extra buildings, each with named variants
// A building is described once with defBuilding(); the framework registers its name, size and cost, wraps its generator so that
// b.variant picks one of the named forms, and adds it to the Buildings page of the sandbox (SBC, sandbox.js).
//   defBuilding({type:'granary', age:1, name:'Granary', desc:'one line', variants:['Round','Long','Raised'], r:4.2, joy:0,
//     gen:(b,c,K,vi,vname)=>{ ...draw with K.B / K.G (glass, glows) / K.F (fire)...; return {name:'Granary', r:4.2}; }})
// gen(b,c,K,vi,vname): vi is the variant's index, vname its name. Returns {name,r}; push descriptive strings to K.traits.
const BDEF={};
const BCOST=[[8,0,5],[10,6,8],[14,12,10],[16,28,16],[20,40,22],[24,40,24],[30,50,30],[40,70,40]];
function defBuilding(s){
  BDEF[s.type]=s;BT[s.type]=s.name;TYPE_R[s.type]=s.r;FPR[s.type]=s.fpr||[-s.r*.8,s.r*.8,-s.r*.8,s.r*.8];COST[s.type]=s.cost||BCOST[s.age];
  GEN[s.type]=(b,c,K)=>{const vs=s.variants,vi=Math.max(0,vs.indexOf(b.variant)),o=s.gen(b,c,K,vi,vs[vi])||{};
    if(!K.traits.length)K.traits.push(s.desc);K.traits.push('Form: '+vs[vi]);return {name:o.name||s.name,r:o.r||s.r};};
  SBC.push({id:'n_'+s.type,age:s.age,type:s.type,level:null,variant:s.variants[0],variants:s.variants.slice(),n:s.name,d:s.desc||''});}
// shared helpers for the drawings
const BH={
  // levelled plinth under a rectangle: returns the top of the plinth
  pad(K,hw,hd,col){const [mn,mx]=K.rect(hw+.3,hd+.3);const base=mx+.15;K.B.box(0,mn-.6,0,hw*2+.4,base-mn+.6,hd*2+.4,col||0x6f6a62);return base;},
  // ring of `n` posts / pillars
  ring(B,x,y,z,R,n,h,col,t=.18,seg=8){for(let i=0;i<n;i++){const a=i/n*TAU;B.cyl(x+Math.sin(a)*R,y,z+Math.cos(a)*R,t,h,col,seg);}},
  glass(K,x,y,z,w,h,ax){if(ax==='z')K.G.box(x,y,z,w,h,.05,GLASS);else K.G.box(x,y,z,.05,h,w,GLASS);}
};
// happiness from the amenities of a city (populated games only)
{const _h=eraHapF;eraHapF=function(f){_h(f);let j=0;for(const b of buildings){if(b.build)continue;const d=BDEF[b.type];if(d&&d.joy)j+=d.joy;}if(j)f.Amenities=Math.min(12,Math.round(j));};}
