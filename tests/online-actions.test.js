const assert=require('assert');
const C=require('../client/trucoCore');
function clone(x){return structuredClone(x)}
function make(){const g=C.newGame('AUD1',15);C.addPlayer(g,'A',{name:'A',avatar:'abuela_mate'});C.addPlayer(g,'B',{name:'B',avatar:'paisana'});return g;}
function check(g,id){
  const a=C.getActions(g,id),p=g.players[id];
  if(a.canPlay){const t=clone(g),r=C.playCard(t,id,t.players[id].hand[0].id);assert(r.ok,r.error);}
  if(a.trucoCall){const t=clone(g),r=C.callTruco(t,id);assert(r.ok,r.error);}
  for(const e of a.envidoCalls){const t=clone(g),r=C.callEnvido(t,id,e);assert(r.ok,r.error);}
  if(a.canRespondTruco){for(const v of ['want','no']){const t=clone(g),r=C.respondTruco(t,id,v);assert(r.ok,r.error);}if(a.canCounterTruco){const t=clone(g),r=C.respondTruco(t,id,'raise');assert(r.ok,r.error);}}
  if(a.canRespondEnvido){for(const v of [true,false]){const t=clone(g),r=C.respondEnvido(t,id,v);assert(r.ok,r.error);}for(const e of a.envidoRaises){const t=clone(g),r=C.callEnvido(t,id,e);assert(r.ok,r.error);}}
  if(a.canFold){const t=clone(g),r=C.fold(t,id);assert(r.ok,r.error);}
  const s=C.publicState(g,id);assert(s.me);if(s.rival){assert(!('hand' in s.rival));assert.equal(s.rival.handCount,g.players[C.other(g,id)].hand.length);}
}
let states=0;
for(let run=0;run<250;run++){
  const g=make();
  for(let step=0;step<180&&g.phase==='playing';step++){
    for(const id of g.order){check(g,id);states++;}
    if(g.needsDeal){C.nextHandIfNeeded(g);continue;}
    const options=[];
    for(const id of g.order){
      const a=C.getActions(g,id);
      if(a.canRespondEnvido){options.push(()=>C.respondEnvido(g,id,Math.random()<.72));for(const e of a.envidoRaises)options.push(()=>C.callEnvido(g,id,e));}
      else if(a.canRespondTruco){options.push(()=>C.respondTruco(g,id,a.canCounterTruco&&Math.random()<.16?'raise':(Math.random()<.78?'want':'no')));for(const e of a.envidoCalls)options.push(()=>C.callEnvido(g,id,e));}
      else {for(const e of a.envidoCalls)options.push(()=>C.callEnvido(g,id,e));if(a.trucoCall)options.push(()=>C.callTruco(g,id));if(a.canPlay&&g.players[id].hand.length)options.push(()=>C.playCard(g,id,g.players[id].hand[Math.floor(Math.random()*g.players[id].hand.length)].id));if(a.canFold&&Math.random()<.02)options.push(()=>C.fold(g,id));}
    }
    assert(options.length,'estado online sin acciones legales');
    const r=options[Math.floor(Math.random()*options.length)]();assert(r&&r.ok,r?.error||'acción legal falló');
  }
}
console.log('online-actions.test.js: OK · '+states+' estados públicos/acciones verificados');
