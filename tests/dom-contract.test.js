const assert=require('assert'),fs=require('fs'),path=require('path');
const main=fs.readFileSync(path.join(__dirname,'..','client','main.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','client','index.html'),'utf8');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const used=new Set([...main.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]));
const missing=[...used].filter(id=>!ids.has(id));assert.deepEqual(missing,[],`IDs usados por main.js que no existen en index.html: ${missing.join(', ')}`);
for(const required of ['profileEditorPreview','profileNameInput','saveProfileBtn','avatarGrid','myAvatar','myName','rivalAvatar'])assert(ids.has(required),`falta elemento de perfil: ${required}`);
assert(html.includes('<script src="profile.js"></script>'),'profile.js debe cargarse antes de main.js');
console.log('dom-contract.test.js: OK · todos los IDs usados por main.js existen en index.html');
