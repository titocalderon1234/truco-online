const assert=require('assert');
const P=require('../client/profile');
assert.equal(P.AVATARS.length,8,'debe haber exactamente 8 avatares seleccionables');
assert.equal(new Set(P.AVATAR_IDS).size,8,'los IDs de avatar deben ser únicos');
for(const a of P.AVATARS){assert(P.validAvatar(a.id),`avatar inválido: ${a.id}`);assert(a.name&&a.tag);}
let p=P.normalize({name:'   Juan     Pérez   ',avatar:P.AVATAR_IDS[3],wins:'7',coins:99.9,streak:2});
assert.equal(p.name,'Juan Pérez');assert.equal(p.avatar,P.AVATAR_IDS[3]);assert.equal(p.wins,7);assert.equal(p.coins,99);assert.equal(p.streak,2);
p=P.normalize({name:'   ',avatar:'../../etc/passwd',wins:-4,coins:'x',streak:-2});
assert.equal(p.name,'Jugador');assert.equal(p.avatar,P.DEFAULT.avatar);assert.equal(p.wins,0);assert.equal(p.coins,250);assert.equal(p.streak,0);
assert.equal(P.cleanName('12345678901234567890').length,16);
for(const legacy of P.LEGACY_IDS)assert(P.renderableAvatar(legacy),'los avatares legacy deben seguir renderizando para compatibilidad online');
console.log('profile.test.js: OK',P.AVATAR_IDS.join(', '));
