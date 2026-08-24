const assert=require('assert');const C=require('../client/campaign');
let seed=1;const rng=()=>{seed=(1103515245*seed+12345)>>>0;return seed/4294967296;};
const seen=new Set();for(let i=0;i<500;i++){const c=C.createCampaign(rng);assert.equal(c.route.length,10);assert.equal(new Set(c.route).size,10);assert.equal(c.route[4],'chiqui');assert.equal(c.route[9],'cristina');seen.add(c.route.join('|'));}
assert(seen.size>20,'la ruta aleatoria casi no varía');
console.log('campaign-fuzz.test.js: OK · 500 rutas, Chiqui #5 y Cristina #10 siempre');
