const assert=require('assert');
const fs=require('fs');
const path=require('path');
const C=require('../client/trucoCore');

// Enum hardening: inherited Object keys must never become game modes.
for(const bad of ['__proto__','constructor','toString','valueOf','hasOwnProperty','']){
  assert.strictEqual(C.normalizeMode(bad),'1v1',`invalid mode ${bad} must fall back to 1v1`);
  const g=C.newGame('SAFE',15,bad);
  assert.strictEqual(g.mode,'1v1');
  assert.strictEqual(g.maxPlayers,2);
}
for(const good of ['1v1','2v2','3v3']) assert.strictEqual(C.normalizeMode(good),good);

// Invalid Envido names must be rejected before touching the challenge state.
const g=C.newGame('SAFE',15,'1v1');
C.addPlayer(g,'a',{name:'A'});
C.addPlayer(g,'b',{name:'B'});
for(const bad of ['__proto__','constructor','toString','valueOf','hasOwnProperty','']){
  const before=JSON.stringify(g.envido);
  const r=C.callEnvido(g,'a',bad);
  assert(r && r.ok===false,`invalid envido ${bad} must be rejected`);
  assert.strictEqual(JSON.stringify(g.envido),before,'invalid envido must not mutate state');
}

// Final beta UX contracts: online actions use a pending lock and small screens
// have a compact horizontal action rail plus a short-landscape layout.
const main=fs.readFileSync(path.join(__dirname,'../client/main.js'),'utf8');
for(const token of ['onlineActionPending','emitOnlineAction','releaseOnlineAction']){
  assert(main.includes(token),`main.js missing online pending-action guard: ${token}`);
}
for(const call of ["emitOnlineAction('playCard'","emitOnlineAction('callTruco'","emitOnlineAction('respondTruco'","emitOnlineAction('callEnvido'","emitOnlineAction('respondEnvido'","emitOnlineAction('fold'"]){
  assert(main.includes(call),`online action is not routed through pending guard: ${call}`);
}
const css=fs.readFileSync(path.join(__dirname,'../client/style.css'),'utf8');
assert(css.includes('@media(max-height:600px) and (min-width:761px)'), 'missing short landscape breakpoint');
assert(css.includes('overflow-x:auto'), 'missing horizontally scrollable mobile action rail');

console.log('OK hardening beta: enums, action lock y responsive contracts');
