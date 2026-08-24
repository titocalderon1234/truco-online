const assert=require('assert');const fs=require('fs');const path=require('path');
const P=require('../client/profile');const B=require('../client/bots');
const root=path.join(__dirname,'..','client','assets');
function exists(rel){const p=path.join(root,rel);assert(fs.existsSync(p),`falta asset: ${rel}`);assert(fs.statSync(p).size>500,`asset vacío o sospechoso: ${rel}`);return p;}
function pngSize(p){const b=fs.readFileSync(p);assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',`PNG inválido: ${p}`);return [b.readUInt32BE(16),b.readUInt32BE(20)];}
for(const id of P.AVATAR_IDS){const p=exists(`avatars/${id}.png`);const [w,h]=pngSize(p);assert(w>=400&&h>=400,`${id} tiene resolución insuficiente: ${w}x${h}`);}
for(const id of B.BOT_ORDER)exists(`bots/${B.BOTS[id].avatar}.png`);
for(const suit of ['espada','basto','oro','copa'])for(const v of [1,2,3,4,5,6,7,10,11,12])exists(`cards/${v}_${suit}.png`);
exists('cards/back.png');
for(const e of ['mate','mano','ceja','risa','llanto','golpe','fuego','ojo','carta','aplauso','sospecha','termo'])exists(`emotes/${e}.gif`);
exists('ui/buenos-aires-map.svg');
console.log('assets.test.js: OK · avatares, bots, 40 cartas, dorso, 12 emotes y mapa presentes');
