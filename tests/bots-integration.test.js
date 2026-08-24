const assert=require('assert');const C=require('../client/trucoCore');const B=require('../client/bots');
let seed=0xB07B07;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
function playerStrength(g){return B.handStrength(g.players.me.hand);}
function ok(r,label){assert(r&&r.ok,`${label}: ${r&&r.error}`);}
function run(botId,n){
 const g=C.newGame('BOT'+n,5);C.addPlayer(g,'me',{name:'Tester'});C.addPlayer(g,'rival',{name:B.BOTS[botId].name});
 const bot={...B.BOTS[botId],seat:'rival'},mem=B.createMemory();let steps=0;
 while(g.phase!=='ended'&&steps++<550){
   B.resetHandMemory(mem,g.handNumber);
   if(g.needsDeal){C.nextHandIfNeeded(g);B.resetHandMemory(mem,g.handNumber);continue;}
   if(g.envido.pending){
     const responder=C.other(g,g.envido.by);
     if(responder==='rival'){
       const d=B.decideEnvidoResponse(g,bot,mem);assert(d,`${botId} no respondió Envido`);
       if(d.type==='raise')ok(C.callEnvido(g,'rival',d.call),`${botId} raise envido`);else ok(C.respondEnvido(g,'rival',d.type==='want'),`${botId} responde envido`);
     }else{
       const want=C.envido(g.players.me.hand)>=25;B.recordPlayer(mem,want?'envidoWant':'envidoNo');ok(C.respondEnvido(g,'me',want),'player envido');
     }continue;
   }
   if(g.truco.pending){
     const responder=C.other(g,g.truco.by);
     if(responder==='rival'){
       const a=C.getActions(g,'rival');
       if(a.envidoCalls?.length){const e=B.decideInitialEnvido(g,bot,mem);if(e){ok(C.callEnvido(g,'rival',e),`${botId} interrumpe con envido`);continue;}}
       const d=B.decideTrucoResponse(g,bot,mem);assert(d,`${botId} no respondió Truco`);ok(C.respondTruco(g,'rival',d),`${botId} responde truco`);
     }else{
       const a=C.getActions(g,'me'),str=playerStrength(g);let d='no';if(a.canCounterTruco&&str>.78)d='raise';else if(str>.42)d='want';B.recordPlayer(mem,d==='want'?'trucoWant':d==='raise'?'raise':'trucoNo');ok(C.respondTruco(g,'me',d),'player truco');
     }continue;
   }
   const id=g.turn,a=C.getActions(g,id);
   if(id==='rival'){
     const e=B.decideInitialEnvido(g,bot,mem);if(e){ok(C.callEnvido(g,'rival',e),`${botId} canta envido`);continue;}
     if(B.decideInitialTruco(g,bot,mem)){ok(C.callTruco(g,'rival'),`${botId} canta truco`);continue;}
     const c=B.chooseCard(g,bot,mem);assert(c,`${botId} sin carta`);ok(C.playCard(g,'rival',c.id),`${botId} juega carta`);
   }else{
     const ev=C.envido(g.players.me.hand),str=playerStrength(g);
     if(a.envidoCalls?.length&&ev>=29&&Math.random()<.35){ok(C.callEnvido(g,'me','envido'),'player canta envido');continue;}
     if(a.trucoCall&&str>.72&&Math.random()<.4){ok(C.callTruco(g,'me'),'player canta truco');continue;}
     const hand=g.players.me.hand;assert(hand.length,'player sin carta');const sorted=[...hand].sort((x,y)=>C.power(y)-C.power(x));ok(C.playCard(g,'me',sorted[0].id),'player juega carta');
   }
 }
 assert(steps<550,`${botId} dejó la partida trabada`);assert.equal(g.phase,'ended');assert(g.winner,'partida sin ganador');
}
for(const id of B.BOT_ORDER)for(let n=0;n<30;n++)run(id,n);
console.log('bots-integration.test.js: OK · 300 partidas completas contra los 10 perfiles de IA');
