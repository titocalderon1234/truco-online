const assert=require('assert');const C=require('../client/trucoCore');
let seed=0xA51CE55;function rnd(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}function pick(a){return a[Math.floor(rnd()*a.length)];}
function check(g){
 assert.equal(g.order.length,g.maxPlayers);assert.equal(g.teams[0].length,g.playersPerTeam);assert.equal(g.teams[1].length,g.playersPerTeam);
 const all=g.order.flatMap(id=>[...g.players[id].hand,...g.players[id].played].map(c=>c.id));assert.equal(all.length,new Set(all).size,'carta duplicada entre jugadores');
 for(const id of g.order)assert.equal(g.score[id],g.teamScore[g.players[id].team],'score individual debe reflejar score de equipo');
 assert(g.round>=1&&g.round<=3,'ronda inválida');
}
function one(mode,n){
 const g=C.newGame(mode+n,5,mode);for(let i=0;i<g.maxPlayers;i++)C.addPlayer(g,'p'+i,{name:'P'+i});let steps=0;
 while(g.phase!=='ended'&&steps++<900){check(g);if(g.needsDeal){C.nextHandIfNeeded(g);continue;}
  const options=[];
  for(const id of g.order){const a=C.getActions(g,id);
   if(a.canRespondEnvido){if(a.envidoRaises.length&&rnd()<.16)options.push(()=>C.callEnvido(g,id,pick(a.envidoRaises)));options.push(()=>C.respondEnvido(g,id,rnd()<.72));}
   else if(a.canRespondTruco){if(a.envidoCalls.length&&rnd()<.07)options.push(()=>C.callEnvido(g,id,pick(a.envidoCalls)));if(a.canCounterTruco&&rnd()<.14)options.push(()=>C.respondTruco(g,id,'raise'));options.push(()=>C.respondTruco(g,id,rnd()<.78?'want':'no'));}
   else {if(a.envidoCalls.length&&rnd()<.05)options.push(()=>C.callEnvido(g,id,pick(a.envidoCalls)));if(a.trucoCall&&rnd()<.10)options.push(()=>C.callTruco(g,id));if(a.canFold&&g.playersPerTeam>1&&rnd()<.018)options.push(()=>C.fold(g,id));if(a.canPlay&&g.players[id].hand.length)options.push(()=>C.playCard(g,id,pick(g.players[id].hand).id));}
  }
  assert(options.length,`${mode} quedó sin acción legal`);const r=pick(options)();assert(r&&r.ok,r?.error||'acción falló');
 }
 assert(steps<900,`${mode} partida ${n} bloqueada`);assert.equal(g.phase,'ended');assert(g.winnerTeam===0||g.winnerTeam===1);assert(g.teamScore[g.winnerTeam]>=g.targetScore);check(g);
}
for(const mode of ['2v2','3v3'])for(let i=0;i<250;i++)one(mode,i);
console.log('team-fuzz.test.js: OK · 500 partidas completas 2v2/3v3 sin bloqueo');
