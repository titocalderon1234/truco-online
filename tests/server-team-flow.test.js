const assert=require('assert');const Module=require('module');
const originalLoad=Module._load,realSetTimeout=global.setTimeout,realClearTimeout=global.clearTimeout;
let ioInstance=null;
class FakeSocket{
 constructor(id,io){this.id=id;this.io=io;this.data={};this.rooms=new Set();this.handlers={};this.clientEvents=[];this.recovered=false;}
 on(e,fn){this.handlers[e]=fn;return this;}
 join(r){this.rooms.add(r);}leave(r){this.rooms.delete(r);}
 emit(e,p){this.clientEvents.push({e,p});}
 to(room){return {emit:(e,p)=>this.io.broadcast(room,this.id,e,p)}}
 clientEmit(e,...args){assert(this.handlers[e],`handler ${e} missing`);return this.handlers[e](...args);}
 latest(e='state'){const a=this.clientEvents.filter(x=>x.e===e);return a.length?a[a.length-1].p:null;}
}
class FakeIO{
 constructor(){ioInstance=this;this.handlers={};this.sockets={sockets:new Map()};}
 on(e,fn){this.handlers[e]=fn;}
 to(target){return {emit:(e,p)=>{const direct=this.sockets.sockets.get(target);if(direct)direct.emit(e,p);else this.broadcast(target,null,e,p);}}}
 broadcast(room,except,e,p){for(const s of this.sockets.sockets.values())if(s.id!==except&&s.rooms.has(room))s.emit(e,p);}
 connect(id){const s=new FakeSocket(id,this);this.sockets.sockets.set(id,s);this.handlers.connection(s);return s;}
}
function express(){return {use(){},get(){}}}express.static=()=>()=>{};
Module._load=function(request,parent,isMain){if(request==='express')return express;if(request==='http')return {createServer:()=>({listen:(_p,cb)=>cb&&cb()})};if(request==='socket.io')return {Server:FakeIO};return originalLoad(request,parent,isMain);};
// Deal timers fire immediately; disconnect/expiry timers stay dormant for this deterministic integration test.
global.setTimeout=(fn,ms)=>{if(ms===2200){fn();return {immediate:true};}return {fn,ms};};global.clearTimeout=()=>{};
require('../server/server');
assert(ioInstance,'server did not initialize Socket.IO');
const sockets=['A','B','C','D'].map(id=>ioInstance.connect(id));
let created;sockets[0].clientEmit('createRoom',{profile:{name:'A',avatar:'tano'},mode:'2v2'},r=>created=r);assert(created.ok);assert.equal(created.mode,'2v2');assert.equal(created.maxPlayers,4);const code=created.code;
for(let i=1;i<4;i++){let joined;sockets[i].clientEmit('joinRoom',{code,profile:{name:String.fromCharCode(65+i),avatar:'tano'}},r=>joined=r);assert(joined.ok);}
for(const s of sockets){const st=s.latest();assert.equal(st.phase,'playing');assert.equal(st.mode,'2v2');assert.equal(st.playerCount,4);assert.equal(st.maxPlayers,4);assert.equal(st.me.team,st.me.seat%2);assert.equal(st.teammates.length,1);assert.equal(st.opponents.length,2);}
// Complete one normal four-player trick through the real server event handlers.
for(let i=0;i<4;i++){const st=sockets[0].latest(),turn=sockets.find(x=>x.id===st.turn),mine=turn.latest();assert(mine.actions.canPlay);turn.clientEmit('playCard',mine.me.hand[0].id);}
assert.equal(sockets[0].latest().history.length,1,'2v2 trick should contain all four plays');
// Repeatedly make team B go to the deck. Team A should reach 15; immediate deal timers keep the test fast.
let guard=0;while(sockets[0].latest().phase!=='ended'&&guard++<200){const st=sockets[0].latest();if(st.needsDeal)continue;const turn=sockets.find(x=>x.id===st.turn);assert(turn,'turn socket missing');const mine=turn.latest();if(mine.me.team===1)turn.clientEmit('fold');else{assert(mine.actions.canPlay,'team A should be able to play');turn.clientEmit('playCard',mine.me.hand[0].id);}}
assert(guard<200,'server 2v2 match got stuck');let ended=sockets[0].latest();assert.equal(ended.phase,'ended');assert.equal(ended.winnerTeam,0);assert(ended.teamScore[0]>=15);
// Every player must opt in. The final vote starts a fresh match in the SAME room and resets team scores.
for(let i=0;i<3;i++){let ack;sockets[i].clientEmit('requestRematch',r=>ack=r);assert(ack.ok);const st=sockets[0].latest();assert.equal(st.phase,'ended');assert.equal(st.rematch.readyCount,i+1);}
let lastAck;sockets[3].clientEmit('requestRematch',r=>lastAck=r);assert(lastAck.ok);for(const s of sockets){const st=s.latest();assert.equal(st.phase,'playing');assert.equal(st.room,code);assert.equal(st.matchNumber,2);assert.deepEqual(st.teamScore,[0,0]);assert.equal(st.me.hand.length,3);}
// Also verify that a six-player room starts correctly and one trick waits for all six cards.
const six=['E','F','G','H','I','J'].map(id=>ioInstance.connect(id));let c3;six[0].clientEmit('createRoom',{profile:{name:'E',avatar:'tano'},mode:'3v3'},r=>c3=r);assert(c3.ok);assert.equal(c3.maxPlayers,6);for(let i=1;i<6;i++){let j;six[i].clientEmit('joinRoom',{code:c3.code,profile:{name:six[i].id,avatar:'tano'}},r=>j=r);assert(j.ok);}for(const s of six){const st=s.latest();assert.equal(st.mode,'3v3');assert.equal(st.phase,'playing');assert.equal(st.teammates.length,2);assert.equal(st.opponents.length,3);}for(let i=0;i<6;i++){const st=six[0].latest(),turn=six.find(x=>x.id===st.turn),mine=turn.latest();turn.clientEmit('playCard',mine.me.hand[0].id);}assert.equal(six[0].latest().history.length,1,'3v3 trick should wait for six cards');
Module._load=originalLoad;global.setTimeout=realSetTimeout;global.clearTimeout=realClearTimeout;
console.log('server-team-flow.test.js: OK · salas 2v2/3v3 reales, turnos, fin de partida y revancha en la misma sala');
