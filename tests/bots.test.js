const assert=require('assert');
const C=require('../client/trucoCore');
const B=require('../client/bots');
function card(v,s){return {value:v,suit:s,id:`${v}_${s}`};}
function make(botKey,hand=[card(4,'oro'),card(6,'copa'),card(10,'basto')]){
  const g=C.newGame('AI',15);C.addPlayer(g,'me',{name:'Yo'});C.addPlayer(g,'rival',{name:'Bot'});
  g.mano='rival';g.turn='rival';g.players.rival.hand=hand;g.players.rival.played=[];g.players.me.played=[];g.history=[];g.table={};g.tableSettled=false;g.round=1;g.envido={done:false,pending:false,by:null,chain:[]};g.truco={level:1,pending:null,by:null,raiseRight:null};
  return {g,bot:{...B.BOTS[botKey],seat:'rival'},mem:B.createMemory()};
}
for(const key of B.BOT_ORDER){
  const {g,bot,mem}=make(key,[card(1,'espada'),card(7,'oro'),card(5,'copa')]);
  const c=B.chooseCard(g,bot,mem);assert(c&&g.players.rival.hand.some(x=>x.id===c.id),`${key} eligió carta inválida`);
  assert.equal(typeof B.phrase(key,'start',mem),'string');
}
// Chiqui must be substantially more conservative than Walter on a mediocre hand.
function rate(key,n=1600){let yes=0;for(let i=0;i<n;i++){const {g,bot,mem}=make(key);mem.considered.envido=true;if(B.decideInitialTruco(g,bot,mem))yes++;}return yes/n;}
const ch=rate('chiqui'),wa=rate('walter'),fe=rate('ferraro'),to=rate('tomi');
assert(wa>ch+.20,`Walter ${wa} no se diferencia de Chiqui ${ch}`);
assert(fe>ch+.20,`Ferraro ${fe} no se diferencia de Chiqui ${ch}`);
assert(to>ch+.15,`Tomi ${to} no se diferencia de Chiqui ${ch}`);
// Phrase anti-repeat when there are alternatives.
{
 const m=B.createMemory();const a=B.phrase('clara','start',m),b=B.phrase('clara','start',m);assert.notEqual(a,b);
}
console.log('bots.test.js: OK', {chiqui:ch.toFixed(2),walter:wa.toFixed(2),ferraro:fe.toFixed(2),tomi:to.toFixed(2)});
