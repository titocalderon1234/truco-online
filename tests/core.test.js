const assert=require('assert');
const C=require('../client/trucoCore');
function card(v,s){return {value:v,suit:s,id:`${v}_${s}`};}
function g(){const x=C.newGame('T',15);C.addPlayer(x,'a',{name:'A'});C.addPlayer(x,'b',{name:'B'});return x;}
function setHands(x,a,b){x.players.a.hand=a;x.players.a.played=[];x.players.b.hand=b;x.players.b.played=[];x.history=[];x.table={};x.tableSettled=false;x.round=1;x.turn=x.mano;x.needsDeal=false;x.phase='playing';x.truco={level:1,pending:null,by:null,raiseRight:null};x.envido={done:false,pending:false,by:null,chain:[]};}
function play(x,id,c){const r=C.playCard(x,id,c.id);assert(r.ok,r.error);return r;}

assert.equal(C.power(card(1,'espada')),14);assert.equal(C.power(card(1,'basto')),13);assert.equal(C.power(card(7,'espada')),12);assert.equal(C.power(card(7,'oro')),11);assert.equal(C.power(card(4,'copa')),1);
assert.equal(C.envido([card(7,'oro'),card(6,'oro'),card(12,'copa')]),33);assert.equal(C.envido([card(12,'oro'),card(7,'copa'),card(4,'basto')]),7);

// First parda + second winner => second winner wins hand.
{
 const x=g();setHands(x,[card(4,'oro'),card(3,'oro'),card(5,'oro')],[card(4,'copa'),card(2,'copa'),card(6,'copa')]);
 play(x,'a',x.players.a.hand[0]);let r=play(x,'b',x.players.b.hand[0]);assert.equal(r.trickWinner,null);assert.equal(x.turn,'a');
 play(x,'a',x.players.a.hand.find(c=>c.value===3));r=play(x,'b',x.players.b.hand.find(c=>c.value===2));assert.equal(r.handWinner,'a');
}
// First parda + second parda => mano wins.
{
 const x=g();setHands(x,[card(4,'oro'),card(5,'oro'),card(6,'oro')],[card(4,'copa'),card(5,'copa'),card(7,'copa')]);
 play(x,'a',x.players.a.hand[0]);play(x,'b',x.players.b.hand[0]);
 play(x,'a',x.players.a.hand.find(c=>c.value===5));const r=play(x,'b',x.players.b.hand.find(c=>c.value===5));assert.equal(r.handWinner,'a');
}
// Win first + parda second => first winner wins.
{
 const x=g();setHands(x,[card(3,'oro'),card(5,'oro'),card(6,'oro')],[card(2,'copa'),card(5,'copa'),card(7,'copa')]);
 play(x,'a',x.players.a.hand[0]);play(x,'b',x.players.b.hand[0]);
 play(x,'a',x.players.a.hand.find(c=>c.value===5));const r=play(x,'b',x.players.b.hand.find(c=>c.value===5));assert.equal(r.handWinner,'a');
}
// Split first two + parda third => winner of first.
{
 const x=g();setHands(x,[card(3,'oro'),card(4,'oro'),card(5,'oro')],[card(2,'copa'),card(1,'espada'),card(5,'copa')]);
 play(x,'a',x.players.a.hand[0]);play(x,'b',x.players.b.hand[0]); // a
 play(x,'a',x.players.a.hand.find(c=>c.value===4));play(x,'b',x.players.b.hand.find(c=>c.value===1)); // b
 play(x,'b',x.players.b.hand.find(c=>c.value===5));const r=play(x,'a',x.players.a.hand.find(c=>c.value===5));assert.equal(r.handWinner,'a');
}
// Settled cards remain visible until next card.
{
 const x=g();setHands(x,[card(3,'oro'),card(4,'oro'),card(5,'oro')],[card(2,'copa'),card(6,'copa'),card(7,'copa')]);
 play(x,'a',x.players.a.hand[0]);play(x,'b',x.players.b.hand[0]);assert.equal(Object.keys(x.table).length,2);assert.equal(x.tableSettled,true);
 const leader=x.turn;const c=x.players[leader].hand[0];play(x,leader,c);assert.equal(Object.keys(x.table).length,1);assert.equal(x.tableSettled,false);
}
// Truco only on turn; acceptance preserves card turn, response side gets raise right.
{
 const x=g();assert.equal(x.turn,'a');assert.equal(C.callTruco(x,'b').ok,false);let r=C.callTruco(x,'a');assert(r.ok);assert.equal(x.turn,'a');r=C.respondTruco(x,'b','want');assert(r.ok);assert.equal(x.truco.level,2);assert.equal(x.truco.raiseRight,'b');assert.equal(x.turn,'a');assert.equal(C.callTruco(x,'a').ok,false);
}
// Counter-raise accepts prior level and no-quiero pays previous accepted stake.
{
 const x=g();C.callTruco(x,'a');let r=C.respondTruco(x,'b','raise');assert(r.ok);assert.equal(x.truco.level,2);assert.equal(x.truco.pending,3);r=C.respondTruco(x,'a','no');assert.equal(r.points,2);assert.equal(x.score.b,2);
}
// Vale 4 rejection pays 3.
{
 const x=g();C.callTruco(x,'a');C.respondTruco(x,'b','raise');C.respondTruco(x,'a','raise');const r=C.respondTruco(x,'b','no');assert.equal(r.points,3);assert.equal(x.score.a,3);
}
// Envido tie is mano.
{
 const x=g();setHands(x,[card(7,'oro'),card(6,'oro'),card(4,'copa')],[card(7,'copa'),card(6,'copa'),card(4,'oro')]);C.callEnvido(x,'a','envido');const r=C.respondEnvido(x,'b',true);assert.equal(r.values.a,33);assert.equal(r.values.b,33);assert.equal(r.winner,'a');assert.equal(x.score.a,2);
}
// Envido + Envido accepted = 4, rejection of second = 2.
{
 const x=g();C.callEnvido(x,'a','envido');C.callEnvido(x,'b','envido');let r=C.respondEnvido(x,'a',false);assert.equal(r.points,2);assert.equal(x.score.b,2);
}
{
 const x=g();C.callEnvido(x,'a','envido');C.callEnvido(x,'b','envido');let r=C.respondEnvido(x,'a',true);assert.equal(r.points,4);
}
// Envido + Real accepted =5, rejection of Real =2.
{
 const x=g();C.callEnvido(x,'a','envido');C.callEnvido(x,'b','real');let r=C.respondEnvido(x,'a',false);assert.equal(r.points,2);
}
{
 const x=g();C.callEnvido(x,'a','envido');C.callEnvido(x,'b','real');let r=C.respondEnvido(x,'a',true);assert.equal(r.points,5);
}
// Real direct no quiero =1; Real accepted=3.
{
 const x=g();C.callEnvido(x,'a','real');let r=C.respondEnvido(x,'b',false);assert.equal(r.points,1);
}
{
 const x=g();C.callEnvido(x,'a','real');let r=C.respondEnvido(x,'b',true);assert.equal(r.points,3);
}
// Falta to 15 is points leader needs.
{
 const x=g();x.score.a=7;x.score.b=9;C.callEnvido(x,'a','falta');const r=C.respondEnvido(x,'b',true);assert.equal(r.points,6);
}
// Envido window: mano can play; pie can still call before own first card.
{
 const x=g();const c=x.players.a.hand[0];play(x,'a',c);assert(C.getActions(x,'b').envidoCalls.includes('envido'));const r=C.callEnvido(x,'b','envido');assert(r.ok);
}
// After both players have played first card envido is gone.
{
 const x=g();play(x,'a',x.players.a.hand[0]);play(x,'b',x.players.b.hand[0]);assert.equal(C.getActions(x,x.turn).envidoCalls.length,0);
}
// Envido can interrupt pending Truco and Truco remains pending after settlement.
{
 const x=g();C.callTruco(x,'a');assert(C.getActions(x,'b').envidoCalls.length);C.callEnvido(x,'b','envido');C.respondEnvido(x,'a',false);assert.equal(x.truco.pending,2);assert.equal(C.getActions(x,'b').canRespondTruco,true);
}
// Fold blocked under pending call, normal fold pays accepted truco level.
{
 const x=g();C.callTruco(x,'a');assert.equal(C.fold(x,'b').ok,false);C.respondTruco(x,'b','want');const r=C.fold(x,'a');assert(r.ok);assert.equal(r.points,2);assert.equal(x.score.b,2);
}
// No actions after match end.
{
 const x=g();x.score.a=14;C.callEnvido(x,'a','envido');const r=C.respondEnvido(x,'b',false);assert.equal(x.phase,'ended');assert.equal(C.playCard(x,'a',x.players.a.hand[0].id).ok,false);
}
console.log('core.test.js: OK');
