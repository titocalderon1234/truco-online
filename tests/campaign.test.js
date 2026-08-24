const assert=require('assert');
const C=require('../client/campaign');
const B=require('../client/bots');

let seed=123456789;
const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
let c=C.createCampaign(rng);
assert.equal(c.route.length,10);
assert.equal(new Set(c.route).size,10);
assert.equal(c.route[4],'chiqui','Chiqui debe estar quinto');
assert.equal(c.route[9],'cristina','Cristina debe ser la última');
assert(B.BOT_ORDER.every(id=>c.route.includes(id)));
assert.equal(C.nextIndex(c),0);
assert.equal(C.statusAt(c,0),'available');
assert.equal(C.statusAt(c,1),'locked');
assert.equal(C.canPlay(c,c.route[0]),true);
assert.equal(C.canPlay(c,c.route[1]),false);

const first=c.route[0],second=c.route[1];
let r=C.recordWin(c,first);c=r.campaign;
assert.equal(r.newlyDefeated,true);
assert.equal(r.unlocked,second);
assert.equal(C.statusAt(c,0),'defeated');
assert.equal(C.statusAt(c,1),'available');
assert.equal(C.canPlay(c,first),true,'un vencido debe poder jugar revancha');

r=C.recordWin(c,first);c=r.campaign;
assert.equal(r.newlyDefeated,false,'la revancha no debe avanzar progreso');
assert.equal(C.nextIndex(c),1);

for(let i=1;i<c.route.length;i++)c=C.recordWin(c,c.route[i]).campaign;
assert.equal(c.completed,true);
assert.equal(c.defeated.length,10);
assert.equal(C.nextIndex(c),-1);
assert(c.route.every(id=>C.canPlay(c,id)),'todos deben quedar disponibles para revancha al completar');

const broken={route:[...c.route],defeated:[c.route[0],c.route[2],c.route[3]]};
const normalized=C.normalizeCampaign(broken,rng);
assert.deepEqual(normalized.defeated,[c.route[0]],'no debe permitir saltar rivales bloqueados');

console.log('campaign.test.js: OK', c.route.join(' -> '));
