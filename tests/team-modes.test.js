const assert=require('assert');
const C=require('../client/trucoCore');
function card(v,s){return {value:v,suit:s,id:`${v}_${s}`};}
function make(mode){const g=C.newGame('TEAM',15,mode);for(let i=0;i<C.MODES[mode].maxPlayers;i++)assert(C.addPlayer(g,'p'+i,{name:'P'+i,avatar:'tano'}));return g;}
function setHands(g,hands){for(const [id,h] of Object.entries(hands)){g.players[id].hand=h;g.players[id].played=[];g.players[id].folded=false;}g.history=[];g.table={};g.tableSettled=false;g.round=1;g.turn=g.mano;g.trickLeader=g.mano;g.needsDeal=false;g.phase='playing';g.truco={level:1,pending:null,by:null,byTeam:null,raiseRight:null,raiseTeam:null};g.envido={done:false,pending:false,by:null,byTeam:null,chain:[]};}
function play(g,id,c){const r=C.playCard(g,id,c.id);assert(r.ok,r.error);return r;}

{
 const g=C.newGame('A',15,'2v2');assert.equal(g.maxPlayers,4);C.addPlayer(g,'p0',{});C.addPlayer(g,'p1',{});C.addPlayer(g,'p2',{});assert.equal(g.phase,'waiting');C.addPlayer(g,'p3',{});assert.equal(g.phase,'playing');assert.deepEqual(g.teams,[['p0','p2'],['p1','p3']]);assert.equal(g.turn,'p0');
}
{
 const g=make('3v3');assert.equal(g.maxPlayers,6);assert.deepEqual(g.teams,[['p0','p2','p4'],['p1','p3','p5']]);for(const id of g.order)assert.equal(g.players[id].hand.length,3);
}
// Four players play one trick; highest card decides team and next leader.
{
 const g=make('2v2');setHands(g,{
  p0:[card(4,'oro'),card(5,'oro'),card(6,'oro')],p1:[card(3,'basto'),card(4,'basto'),card(5,'basto')],
  p2:[card(7,'espada'),card(6,'copa'),card(4,'copa')],p3:[card(7,'oro'),card(5,'copa'),card(4,'espada')]
 });
 play(g,'p0',g.players.p0.hand[0]);play(g,'p1',g.players.p1.hand[0]);play(g,'p2',g.players.p2.hand[0]);const r=play(g,'p3',g.players.p3.hand[0]);
 assert.equal(r.trickResolved,true);assert.equal(r.trickWinner,'p2');assert.equal(r.trickWinnerTeam,0);assert.equal(g.turn,'p2');
}
// Equal top cards belonging to same team still win the trick; the earliest tied partner leads.
{
 const g=make('2v2');setHands(g,{
  p0:[card(3,'oro'),card(5,'oro'),card(6,'oro')],p1:[card(2,'basto'),card(4,'basto'),card(5,'basto')],
  p2:[card(3,'copa'),card(6,'copa'),card(4,'copa')],p3:[card(1,'copa'),card(5,'copa'),card(4,'espada')]
 });
 play(g,'p0',g.players.p0.hand[0]);play(g,'p1',g.players.p1.hand[0]);play(g,'p2',g.players.p2.hand[0]);const r=play(g,'p3',g.players.p3.hand[0]);
 assert.equal(r.trickWinnerTeam,0);assert.equal(r.trickWinner,'p0');assert.equal(g.turn,'p0');
}
// Equal top cards across rival teams are parda; earliest tied player remains leader.
{
 const g=make('2v2');setHands(g,{
  p0:[card(3,'oro'),card(5,'oro'),card(6,'oro')],p1:[card(3,'copa'),card(4,'basto'),card(5,'basto')],
  p2:[card(2,'copa'),card(6,'copa'),card(4,'copa')],p3:[card(1,'copa'),card(5,'copa'),card(4,'espada')]
 });
 play(g,'p0',g.players.p0.hand[0]);play(g,'p1',g.players.p1.hand[0]);play(g,'p2',g.players.p2.hand[0]);const r=play(g,'p3',g.players.p3.hand[0]);
 assert.equal(r.trickWinnerTeam,null);assert.equal(r.trickWinner,null);assert.equal(g.turn,'p0');
}

// On a cross-team parda, the player who LED the trick leads again (not the first tied high card).
{
 const g=make('2v2');g.mano='p2';g.turn='p2';g.trickLeader='p2';setHands(g,{
  p0:[card(3,'oro'),card(5,'oro'),card(6,'oro')],p1:[card(2,'basto'),card(4,'basto'),card(5,'basto')],
  p2:[card(4,'copa'),card(6,'copa'),card(5,'copa')],p3:[card(3,'copa'),card(7,'basto'),card(4,'espada')]
 });g.mano='p2';g.turn='p2';g.trickLeader='p2';
 play(g,'p2',g.players.p2.hand[0]);play(g,'p3',g.players.p3.hand[0]);play(g,'p0',g.players.p0.hand[0]);const r=play(g,'p1',g.players.p1.hand[0]);
 assert.equal(r.trickWinnerTeam,null);assert.equal(g.turn,'p2');
}
// If best Envido values tie across teams, priority is the earliest PLAYER from mano, not automatically mano's team.
{
 const g=make('2v2');setHands(g,{
  p0:[card(4,'oro'),card(5,'copa'),card(6,'espada')], // 6, mano but low
  p1:[card(7,'copa'),card(6,'copa'),card(4,'basto')], // 33, earlier tied player
  p2:[card(7,'oro'),card(6,'oro'),card(5,'basto')], // 33, later tied player
  p3:[card(4,'espada'),card(5,'espada'),card(12,'basto')]
 });
 assert(C.callEnvido(g,'p0','envido').ok);const r=C.respondEnvido(g,'p3',true);assert.equal(r.teamValues[0],33);assert.equal(r.teamValues[1],33);assert.equal(r.winnerTeam,1);assert.equal(r.winner,'p1');
}
// In partnership Truco any active partner can sing Truco/Retruco even when it is not their card turn.
{
 const g=make('2v2');assert.equal(g.turn,'p0');assert(C.getActions(g,'p2').trucoCall,'non-turn teammate should be able to sing Truco');assert(C.callTruco(g,'p2').ok);assert(C.respondTruco(g,'p1','want').ok);assert.equal(g.truco.raiseTeam,1);assert(C.getActions(g,'p3').trucoCall,'team with raise right can sing Retruco later without owning card turn');
}
// Team Envido uses the best envido on each team; in a simple non-tie the higher team wins.
{
 const g=make('2v2');setHands(g,{
  p0:[card(7,'oro'),card(6,'oro'),card(4,'copa')], // 33
  p1:[card(7,'copa'),card(4,'copa'),card(1,'oro')], // 31
  p2:[card(5,'espada'),card(4,'espada'),card(12,'oro')], // 29
  p3:[card(7,'basto'),card(5,'basto'),card(4,'oro')] // 32
 });
 assert(C.callEnvido(g,'p0','envido').ok);const r=C.respondEnvido(g,'p3',true);assert(r.ok);assert.equal(r.teamValues[0],33);assert.equal(r.teamValues[1],32);assert.equal(r.winnerTeam,0);assert.equal(g.teamScore[0],2);assert.equal(g.score.p0,2);assert.equal(g.score.p2,2);assert.equal(g.score.p1,0);
}
// Any active member of the challenged team can answer/raise Truco.
{
 const g=make('2v2');assert(C.callTruco(g,'p0').ok);let r=C.respondTruco(g,'p3','raise');assert(r.ok);assert.equal(g.truco.level,2);assert.equal(g.truco.pending,3);assert.equal(g.truco.byTeam,1);r=C.respondTruco(g,'p2','want');assert(r.ok);assert.equal(g.truco.level,3);assert.equal(g.truco.raiseTeam,0);
}
// Going to the deck only removes that player in teams; the hand ends only when their whole team folds.
{
 const g=make('2v2');let r=C.fold(g,'p0');assert(r.ok);assert.equal(r.teamFolded,false);assert.equal(g.phase,'playing');assert.equal(g.players.p0.folded,true);assert.equal(g.turn,'p1');
 // p1 plays; p2 can now fold, leaving team A with nobody active.
 r=C.playCard(g,'p1',g.players.p1.hand[0].id);assert(r.ok);assert.equal(g.turn,'p2');r=C.fold(g,'p2');assert(r.ok);assert.equal(r.teamFolded,true);assert.equal(r.winnerTeam,1);assert.equal(g.teamScore[1],1);
}
// Public state never leaks partners' or opponents' hidden cards.
{
 const g=make('3v3'),s=C.publicState(g,'p2');assert.equal(s.players.length,5);assert.equal(s.teammates.length,2);assert.equal(s.opponents.length,3);assert.equal(s.me.hand.length,3);for(const p of s.players)assert(!('hand' in p));for(const p of [...s.teammates,...s.opponents])assert(!('hand' in p));
}
// Rematch keeps players/teams, resets score, rotates mano, and deals again.
{
 const g=make('2v2');g.teamScore=[14,0];for(const id of g.order)g.score[id]=g.teamScore[g.players[id].team];const oldMano=g.mano;assert(C.callEnvido(g,'p0','envido').ok);const r=C.respondEnvido(g,'p1',false);assert(r.ok);assert.equal(g.phase,'ended');assert.equal(g.winnerTeam,0);const oldMatch=g.matchNumber;assert(C.restartMatch(g));assert.equal(g.phase,'playing');assert.equal(g.matchNumber,oldMatch+1);assert.deepEqual(g.teamScore,[0,0]);assert.notEqual(g.mano,oldMano);for(const id of g.order){assert.equal(g.players[id].hand.length,3);assert.equal(g.score[id],0);}
}
console.log('team-modes.test.js: OK · 2v2/3v3, equipos, envido, truco, mazo, privacidad y revancha');
