(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.TrucoCore=factory();
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  const SUITS=['espada','basto','oro','copa'];
  const VALUES=[1,2,3,4,5,6,7,10,11,12];
  const TRUCO_NAMES={2:'Truco',3:'Retruco',4:'Vale 4'};
  const ENVIDO_NAMES={envido:'Envido',real:'Real Envido',falta:'Falta Envido'};
  const MODES={
    '1v1':{playersPerTeam:1,maxPlayers:2,label:'1 vs 1'},
    '2v2':{playersPerTeam:2,maxPlayers:4,label:'2 vs 2'},
    '3v3':{playersPerTeam:3,maxPlayers:6,label:'3 vs 3'}
  };

  const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  function normalizeMode(mode){return typeof mode==='string'&&hasOwn(MODES,mode)?mode:'1v1';}
  function cardId(c){ return `${c.value}_${c.suit}`; }
  function shuffle(a,rng=Math.random){ a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  function deck(rng=Math.random){const d=[];for(const suit of SUITS)for(const value of VALUES)d.push({suit,value,id:cardId({suit,value})});return shuffle(d,rng);}
  function power(c){
    if(!c) return -1;
    const k=`${c.value}_${c.suit}`;
    const special={'1_espada':14,'1_basto':13,'7_espada':12,'7_oro':11};
    if(special[k]) return special[k];
    if(c.value===3)return 10;if(c.value===2)return 9;if(c.value===1)return 8;
    if(c.value===12)return 7;if(c.value===11)return 6;if(c.value===10)return 5;
    if(c.value===7)return 4;if(c.value===6)return 3;if(c.value===5)return 2;if(c.value===4)return 1;
    return 0;
  }
  function envido(hand){
    let best=0;
    for(const s of SUITS){
      const vals=hand.filter(c=>c.suit===s).map(c=>c.value>=10?0:c.value).sort((a,b)=>b-a);
      if(vals.length>=2) best=Math.max(best,20+vals[0]+vals[1]);
      else if(vals.length===1) best=Math.max(best,vals[0]);
    }
    return best;
  }
  function freshTruco(){return {level:1,pending:null,by:null,byTeam:null,raiseRight:null,raiseTeam:null};}
  function freshEnvido(){return {done:false,pending:false,by:null,byTeam:null,chain:[]};}
  function safePlayerName(value){const s=String(value??'').replace(/\s+/g,' ').trim().slice(0,16);return s||'Jugador';}
  function safeAvatar(value){const s=String(value??'');return /^[a-z0-9_-]{1,32}$/i.test(s)?s:'tano';}

  function newGame(code='LOCAL',targetScore=15,mode='1v1'){
    mode=normalizeMode(typeof mode==='object'?(mode?.mode||'1v1'):mode);
    const cfg=MODES[mode];
    return {
      code,targetScore,mode,playersPerTeam:cfg.playersPerTeam,maxPlayers:cfg.maxPlayers,
      phase:'waiting',players:{},order:[],teams:[[],[]],teamScore:[0,0],score:{},
      handNumber:0,matchNumber:1,round:1,turn:null,mano:null,trickLeader:null,
      truco:freshTruco(),envido:freshEnvido(),table:{},tableSettled:false,
      history:[],winner:null,winnerTeam:null,message:`Esperando jugadores 0/${cfg.maxPlayers}`,
      needsDeal:false,lastResult:null,rematchReady:[]
    };
  }
  function teamOf(g,id){return g?.players?.[id]?.team??null;}
  function teamMembers(g,team){return (g?.teams?.[team]||[]).filter(id=>!!g.players[id]);}
  function opponents(g,id){const t=teamOf(g,id);return t===null?[]:teamMembers(g,1-t);}
  function teammates(g,id){const t=teamOf(g,id);return t===null?[]:teamMembers(g,t).filter(x=>x!==id);}
  function other(g,id){return opponents(g,id)[0]||null;}
  function allCards(g,id){ const p=g.players[id]; return p?[...p.hand,...p.played]:[]; }
  function syncScores(g){for(const id of g.order)g.score[id]=g.teamScore[teamOf(g,id)]||0;}
  function teamLabel(g,team){
    if(g.playersPerTeam===1){const id=teamMembers(g,team)[0];return id?g.players[id].name:`Equipo ${team+1}`;}
    return team===0?'Equipo A':'Equipo B';
  }
  function nextSeatAll(g,id){
    if(!g.order.length)return null;let i=g.order.indexOf(id);if(i<0)i=-1;return g.order[(i+1)%g.order.length]||null;
  }
  function activePlayers(g){return g.order.filter(id=>g.players[id]&&!g.players[id].folded);}
  function activeTeamMembers(g,team){return teamMembers(g,team).filter(id=>!g.players[id].folded);}
  function nextToActInTrick(g,afterId){
    if(!g.order.length)return null;const start=g.order.indexOf(afterId);
    for(let step=1;step<=g.order.length;step++){
      const id=g.order[(start+step+g.order.length)%g.order.length],p=g.players[id];
      if(p&&!p.folded&&!g.table[id])return id;
    }
    return null;
  }
  function assignSeats(g){
    g.teams=[[],[]];
    g.order.forEach((id,seat)=>{const p=g.players[id];p.seat=seat;p.team=seat%2;g.teams[p.team].push(id);});
    syncScores(g);
  }
  function addPlayer(g,id,profile={}){
    if(g.phase==='ended'||g.players[id]||g.order.length>=g.maxPlayers) return false;
    const seat=g.order.length,team=seat%2;
    g.players[id]={name:safePlayerName(profile.name),avatar:safeAvatar(profile.avatar),hand:[],played:[],folded:false,team,seat};
    g.order.push(id);g.teams[team].push(id);g.score[id]=g.teamScore[team]||0;
    if(g.order.length===g.maxPlayers){g.phase='playing';if(!g.mano)g.mano=g.order[0];deal(g);}
    else g.message=`Esperando jugadores ${g.order.length}/${g.maxPlayers}`;
    return true;
  }
  function removePlayerWaiting(g,id){
    if(!g||g.phase!=='waiting'||!g.players[id])return false;
    delete g.players[id];delete g.score[id];g.order=g.order.filter(x=>x!==id);g.rematchReady=(g.rematchReady||[]).filter(x=>x!==id);assignSeats(g);
    g.message=`Esperando jugadores ${g.order.length}/${g.maxPlayers}`;return true;
  }
  function deal(g,rng=Math.random){
    if(g.phase==='ended'||g.order.length!==g.maxPlayers) return false;
    const d=deck(rng);g.handNumber++;g.round=1;g.table={};g.tableSettled=false;g.history=[];g.truco=freshTruco();g.envido=freshEnvido();
    for(const id of g.order){g.players[id].hand=d.splice(0,3);g.players[id].played=[];g.players[id].folded=false;}
    g.trickLeader=g.mano;g.turn=g.mano;g.message='Mano nueva';g.needsDeal=false;g.lastResult={type:'deal',handNumber:g.handNumber};return true;
  }
  function validateLive(g){ if(!g||g.phase!=='playing'||g.needsDeal) return {ok:false,error:'La mano no está disponible'}; return null; }

  function determineHandWinner(history,mano){
    if(!history.length)return null;const h1=history[0],h2=history[1],h3=history[2];if(!h2)return null;
    if(!h1.winner){if(!h2.winner)return mano;return h2.winner;}
    if(!h2.winner)return h1.winner;if(h2.winner===h1.winner)return h1.winner;if(!h3)return null;if(!h3.winner)return h1.winner;return h3.winner;
  }
  function determineHandWinnerTeam(history,manoTeam){
    if(!history.length)return null;const h1=history[0],h2=history[1],h3=history[2];if(!h2)return null;
    const a=h1.winnerTeam??null,b=h2.winnerTeam??null,c=h3?.winnerTeam??null;
    if(a===null){if(b===null)return manoTeam;return b;}
    if(b===null)return a;if(b===a)return a;if(!h3)return null;if(c===null)return a;return c;
  }
  function addTeamPoints(g,team,points){const aliases=teamMembers(g,team).map(id=>g.score[id]||0);const base=Math.max(g.teamScore[team]||0,...aliases);g.teamScore[team]=base+points;syncScores(g);}
  function finishHand(g,winnerTeam,points,reason,winnerPlayer=null){
    points=Math.max(0,Math.floor(points||0));addTeamPoints(g,winnerTeam,points);
    const rep=(winnerPlayer&&teamOf(g,winnerPlayer)===winnerTeam)?winnerPlayer:teamMembers(g,winnerTeam)[0];
    g.message=`${teamLabel(g,winnerTeam)} ganó la mano +${points}`;
    const result={type:'handEnd',winner:rep,winnerTeam,points,reason};
    if(g.teamScore[winnerTeam]>=g.targetScore){
      g.phase='ended';g.winner=rep;g.winnerTeam=winnerTeam;g.needsDeal=false;g.message=`${teamLabel(g,winnerTeam)} ganó la partida`;result.matchEnded=true;
    }else{
      g.mano=nextSeatAll(g,g.mano);g.needsDeal=true;
    }
    g.lastResult=result;return result;
  }

  function clearSettledTable(g){if(g.tableSettled){g.table={};g.tableSettled=false;}}
  function trickOrder(g,leader){
    const out=[];if(!g.order.length)return out;let start=g.order.indexOf(leader);if(start<0)start=0;
    for(let step=0;step<g.order.length;step++){const id=g.order[(start+step)%g.order.length];if(g.players[id]&&!g.players[id].folded)out.push(id);}return out;
  }
  function resolveTrick(g){
    const leader=g.trickLeader||g.mano,order=trickOrder(g,leader),cards=order.filter(id=>g.table[id]).map(id=>({id,card:g.table[id],pow:power(g.table[id])}));
    if(!cards.length)return {trickWinner:null,trickWinnerTeam:null,handWinner:null,handWinnerTeam:null,handEnded:false};
    const max=Math.max(...cards.map(x=>x.pow)),tops=cards.filter(x=>x.pow===max),topTeams=[...new Set(tops.map(x=>teamOf(g,x.id)))];
    const winnerTeam=topTeams.length===1?topTeams[0]:null,winnerPlayer=winnerTeam===null?null:tops[0].id;
    const nextLeader=winnerTeam===null?leader:tops[0].id;
    const item={round:g.round,leader,cards:{...g.table},winner:winnerPlayer,winnerTeam,nextLeader};g.history.push(item);g.tableSettled=true;
    const handWinnerTeam=determineHandWinnerTeam(g.history,teamOf(g,g.mano));
    if(handWinnerTeam!==null){
      const preferred=winnerTeam===handWinnerTeam?winnerPlayer:null,end=finishHand(g,handWinnerTeam,g.truco.level,'bazas',preferred);
      return {trickWinner:winnerPlayer,trickWinnerTeam:winnerTeam,handWinner:end.winner,handWinnerTeam,handEnded:true,end};
    }
    g.round=g.history.length+1;g.trickLeader=nextLeader;g.turn=g.trickLeader;
    g.message=winnerTeam!==null?`Gana baza ${teamLabel(g,winnerTeam)}`:'Baza empatada';
    const result={type:'trick',trickWinner:winnerPlayer,trickWinnerTeam:winnerTeam,handWinner:null,handWinnerTeam:null,handEnded:false};g.lastResult=result;return result;
  }
  function playCard(g,id,cardIdStr){
    const err=validateLive(g);if(err)return err;if(g.truco.pending||g.envido.pending)return {ok:false,error:'Primero hay que responder el canto'};
    const p=g.players[id];if(!p||p.folded)return {ok:false,error:'Jugador inválido'};if(g.turn!==id)return {ok:false,error:'No es tu turno'};
    clearSettledTable(g);const idx=p.hand.findIndex(c=>c.id===cardIdStr);if(idx<0)return {ok:false,error:'Carta inválida'};
    const [card]=p.hand.splice(idx,1);p.played.push(card);g.table[id]=card;
    const next=nextToActInTrick(g,id);
    if(next){g.turn=next;g.message='Turno del siguiente jugador';const result={ok:true,type:'card',player:id,card,trickResolved:false};g.lastResult=result;return result;}
    const result=resolveTrick(g);return {ok:true,type:'card',player:id,card,trickResolved:true,...result};
  }

  function nextTrucoLevel(g){return ({1:2,2:3,3:4})[g.truco.level]||null;}
  function canInitiateTruco(g,id){
    if(validateLive(g)||g.truco.pending||g.envido.pending)return false;const p=g.players[id];if(!p||p.folded)return false;if(g.playersPerTeam===1&&g.turn!==id)return false;
    const next=nextTrucoLevel(g);if(!next)return false;if(g.truco.level===1)return true;
    const rt=g.truco.raiseTeam??(g.truco.raiseRight?teamOf(g,g.truco.raiseRight):null);return rt===teamOf(g,id);
  }
  function callTruco(g,id){
    const err=validateLive(g);if(err)return err;if(!canInitiateTruco(g,id))return {ok:false,error:'No podés cantar eso ahora'};
    const next=nextTrucoLevel(g);g.truco.pending=next;g.truco.by=id;g.truco.byTeam=teamOf(g,id);g.message=`${g.players[id].name} cantó ${TRUCO_NAMES[next]}`;
    const result={ok:true,type:'trucoCall',level:next,by:id,byTeam:g.truco.byTeam,label:TRUCO_NAMES[next]};g.lastResult=result;return result;
  }
  function canRespondTeamCall(g,id,byTeam){const p=g.players[id];return !!p&&!p.folded&&teamOf(g,id)!==byTeam;}
  function respondTruco(g,id,response){
    const err=validateLive(g);if(err)return err;const proposer=g.truco.by,proposerTeam=g.truco.byTeam??teamOf(g,proposer);
    if(!g.truco.pending||!canRespondTeamCall(g,id,proposerTeam))return {ok:false,error:'No hay canto para responder'};
    const proposed=g.truco.pending,responderTeam=teamOf(g,id);
    if(response==='raise'){
      if(proposed>=4)return {ok:false,error:'No se puede subir más'};g.truco.level=proposed;const next=proposed+1;
      g.truco.pending=next;g.truco.by=id;g.truco.byTeam=responderTeam;g.truco.raiseRight=null;g.truco.raiseTeam=null;
      g.message=`${g.players[id].name} cantó ${TRUCO_NAMES[next]}`;const result={ok:true,type:'trucoRaise',accepted:proposed,level:next,by:id,byTeam:responderTeam,label:TRUCO_NAMES[next]};g.lastResult=result;return result;
    }
    if(response===true||response==='want'){
      g.truco.level=proposed;g.truco.pending=null;g.truco.by=null;g.truco.byTeam=null;g.truco.raiseRight=id;g.truco.raiseTeam=responderTeam;g.message='Quiso';
      const result={ok:true,type:'trucoAccepted',level:proposed,by:id,byTeam:responderTeam};g.lastResult=result;return result;
    }
    if(response===false||response==='no'){
      const points=g.truco.level;g.truco.pending=null;g.truco.by=null;g.truco.byTeam=null;const end=finishHand(g,proposerTeam,points,'noQuisoTruco',proposer);
      return {ok:true,type:'trucoRejected',winner:end.winner,winnerTeam:proposerTeam,points,end};
    }
    return {ok:false,error:'Respuesta inválida'};
  }

  function isFirstTrickWindow(g,id){const p=g.players[id];return !!p&&!p.folded&&g.history.length===0&&p.played.length===0;}
  function canStartEnvido(g,id){
    if(validateLive(g)||g.envido.done||g.envido.pending||!isFirstTrickWindow(g,id))return false;
    if(g.truco.pending){const bt=g.truco.byTeam??teamOf(g,g.truco.by);return teamOf(g,id)!==bt;}
    return g.playersPerTeam>1?true:g.turn===id;
  }
  function fixedEnvidoValue(chain){let total=0;for(const c of chain){if(c==='envido')total+=2;else if(c==='real')total+=3;}return total;}
  function faltaValue(g){const scores=[...g.teamScore,...Object.values(g.score||{})];return Math.max(1,g.targetScore-Math.max(0,...scores));}
  function acceptedEnvidoValue(g,chain){return chain.includes('falta')?faltaValue(g):fixedEnvidoValue(chain);}
  function rejectEnvidoValue(g,chainBeforeNew){return chainBeforeNew.length?acceptedEnvidoValue(g,chainBeforeNew):1;}
  function allowedEnvidoRaises(chain){
    if(chain.includes('falta'))return [];if(chain.includes('real'))return ['falta'];const envCount=chain.filter(x=>x==='envido').length;
    if(envCount===0)return ['envido','real','falta'];if(envCount===1)return ['envido','real','falta'];return ['real','falta'];
  }
  function callEnvido(g,id,type='envido'){
    const err=validateLive(g);if(err)return err;if(typeof type!=='string'||!hasOwn(ENVIDO_NAMES,type))return {ok:false,error:'Canto de envido inválido'};
    const team=teamOf(g,id);if(g.players[id]?.folded)return {ok:false,error:'Envido no disponible'};
    if(!g.envido.pending){
      if(!canStartEnvido(g,id))return {ok:false,error:'Envido no disponible'};g.envido.pending=true;g.envido.by=id;g.envido.byTeam=team;g.envido.chain=[type];
    }else{
      const byTeam=g.envido.byTeam??teamOf(g,g.envido.by);if(team===byTeam)return {ok:false,error:'Esperando respuesta del rival'};
      const allowed=allowedEnvidoRaises(g.envido.chain);if(!allowed.includes(type))return {ok:false,error:'No se puede subir a ese canto'};
      g.envido.chain.push(type);g.envido.by=id;g.envido.byTeam=team;
    }
    g.message=`${g.players[id].name} cantó ${ENVIDO_NAMES[type]}`;const result={ok:true,type:'envidoCall',call:type,label:ENVIDO_NAMES[type],chain:[...g.envido.chain],by:id,byTeam:team};g.lastResult=result;return result;
  }
  function envidoTeamSnapshot(g){
    const values={};for(const id of g.order){values[id]=g.players[id].folded?null:envido(allCards(g,id));}
    const priority=trickOrder(g,g.mano),best=[0,0],bestPlayer=[null,null];
    for(const id of priority){const t=teamOf(g,id),v=values[id]??0;if(bestPlayer[t]===null||v>best[t]){best[t]=v;bestPlayer[t]=id;}}
    return {values,best,bestPlayer,priority};
  }
  function markMatchEndedByScore(g,team){g.phase='ended';g.winnerTeam=team;g.winner=teamMembers(g,team)[0];g.needsDeal=false;g.message=`${teamLabel(g,team)} ganó la partida`;}
  function respondEnvido(g,id,wants){
    const err=validateLive(g);if(err)return err;const proposer=g.envido.by,proposerTeam=g.envido.byTeam??teamOf(g,proposer);
    if(!g.envido.pending||!canRespondTeamCall(g,id,proposerTeam))return {ok:false,error:'No hay envido para responder'};
    const chain=[...g.envido.chain];
    if(wants===true||wants==='want'){
      const snap=envidoTeamSnapshot(g);let winnerTeam;if(snap.best[0]>snap.best[1])winnerTeam=0;else if(snap.best[1]>snap.best[0])winnerTeam=1;else{const first=snap.priority.find(pid=>(snap.values[pid]??-1)===snap.best[0]);winnerTeam=first?teamOf(g,first):teamOf(g,g.mano);}
      const points=acceptedEnvidoValue(g,chain);addTeamPoints(g,winnerTeam,points);g.envido.pending=false;g.envido.by=null;g.envido.byTeam=null;g.envido.done=true;
      const winner=snap.bestPlayer[winnerTeam]||teamMembers(g,winnerTeam)[0];g.message=`Envido: ${teamLabel(g,0)} ${snap.best[0]} / ${teamLabel(g,1)} ${snap.best[1]} · +${points}`;
      const result={ok:true,type:'envidoAccepted',winner,winnerTeam,points,values:snap.values,teamValues:{0:snap.best[0],1:snap.best[1]},bestPlayers:{0:snap.bestPlayer[0],1:snap.bestPlayer[1]},chain};
      if(g.teamScore[winnerTeam]>=g.targetScore){markMatchEndedByScore(g,winnerTeam);result.matchEnded=true;}g.lastResult=result;return result;
    }
    if(wants===false||wants==='no'){
      const before=chain.slice(0,-1),points=rejectEnvidoValue(g,before);addTeamPoints(g,proposerTeam,points);g.envido.pending=false;g.envido.by=null;g.envido.byTeam=null;g.envido.done=true;
      g.message=`No quiso ${ENVIDO_NAMES[chain[chain.length-1]]} · +${points}`;const result={ok:true,type:'envidoRejected',winner:proposer,winnerTeam:proposerTeam,points,chain};
      if(g.teamScore[proposerTeam]>=g.targetScore){markMatchEndedByScore(g,proposerTeam);result.matchEnded=true;}g.lastResult=result;return result;
    }
    return {ok:false,error:'Respuesta inválida'};
  }

  function fold(g,id){
    const err=validateLive(g);if(err)return err;if(g.truco.pending||g.envido.pending)return {ok:false,error:'Primero respondé el canto'};
    const p=g.players[id];if(!p||p.folded)return {ok:false,error:'Jugador inválido'};
    if(g.playersPerTeam>1&&g.turn!==id)return {ok:false,error:'Solo podés irte al mazo en tu turno'};
    clearSettledTable(g);p.folded=true;const loserTeam=p.team,winnerTeam=1-loserTeam;
    if(activeTeamMembers(g,loserTeam).length===0){const points=g.truco.level,end=finishHand(g,winnerTeam,points,'mazoEquipo');return {ok:true,type:'fold',player:id,winner:end.winner,winnerTeam,points,teamFolded:true,end};}
    if(g.trickLeader===id&&!Object.keys(g.table).length)g.trickLeader=nextToActInTrick(g,id);
    if(g.turn===id){const next=nextToActInTrick(g,id);if(next){g.turn=next;g.message=`${p.name} se fue al mazo`;}
      else {const r=resolveTrick(g);return {ok:true,type:'fold',player:id,teamFolded:false,trickResolved:true,...r};}}
    const result={ok:true,type:'fold',player:id,teamFolded:false};g.lastResult=result;return result;
  }
  function nextHandIfNeeded(g,rng=Math.random){if(g.needsDeal&&g.phase==='playing')return deal(g,rng);return false;}
  function restartMatch(g,rng=Math.random){
    if(!g||g.phase!=='ended'||g.order.length!==g.maxPlayers)return false;
    const oldMano=g.mano;g.teamScore=[0,0];syncScores(g);g.handNumber=0;g.round=1;g.table={};g.tableSettled=false;g.history=[];g.truco=freshTruco();g.envido=freshEnvido();
    g.winner=null;g.winnerTeam=null;g.needsDeal=false;g.rematchReady=[];g.matchNumber=(g.matchNumber||1)+1;g.phase='playing';g.mano=nextSeatAll(g,oldMano)||g.order[0];g.trickLeader=g.mano;return deal(g,rng);
  }

  function getActions(g,id){
    const empty={canPlay:false,canFold:false,trucoCall:null,canRespondTruco:false,canCounterTruco:false,envidoCalls:[],canRespondEnvido:false,envidoRaises:[]};
    if(!g||g.phase!=='playing'||g.needsDeal||!g.players[id]||g.players[id].folded)return empty;
    if(g.envido.pending){const bt=g.envido.byTeam??teamOf(g,g.envido.by);if(teamOf(g,id)!==bt){empty.canRespondEnvido=true;empty.envidoRaises=allowedEnvidoRaises(g.envido.chain);}return empty;}
    if(g.truco.pending){const bt=g.truco.byTeam??teamOf(g,g.truco.by);if(teamOf(g,id)!==bt){empty.canRespondTruco=true;empty.canCounterTruco=g.truco.pending<4;if(canStartEnvido(g,id))empty.envidoCalls=['envido','real','falta'];}return empty;}
    empty.canFold=g.playersPerTeam===1||g.turn===id;
    if(g.turn===id){empty.canPlay=true;if(canStartEnvido(g,id))empty.envidoCalls=['envido','real','falta'];}
    else if(g.playersPerTeam>1&&canStartEnvido(g,id))empty.envidoCalls=['envido','real','falta'];
    if(canInitiateTruco(g,id))empty.trucoCall=TRUCO_NAMES[nextTrucoLevel(g)];
    return empty;
  }

  function publicPlayer(g,id){const p=g.players[id];return {id,name:p.name,avatar:p.avatar,team:p.team,seat:p.seat,folded:!!p.folded,handCount:p.hand.length,played:p.played||[]};}
  function publicState(g,playerId){
    const me=g.players[playerId],rivalId=other(g,playerId),rival=rivalId?g.players[rivalId]:null;
    const others=g.order.filter(id=>id!==playerId).map(id=>publicPlayer(g,id));
    const ready=g.rematchReady||[];
    return {
      room:g.code,mode:g.mode,playersPerTeam:g.playersPerTeam,maxPlayers:g.maxPlayers,playerCount:g.order.length,targetScore:g.targetScore,phase:g.phase,
      score:{...g.score},teamScore:[...g.teamScore],handNumber:g.handNumber,matchNumber:g.matchNumber||1,round:g.round,turn:g.turn,mano:g.mano,trickLeader:g.trickLeader,
      truco:{...g.truco},envido:{...g.envido,chain:[...g.envido.chain]},history:g.history.map(h=>({round:h.round,leader:h.leader,winner:h.winner,winnerTeam:h.winnerTeam,nextLeader:h.nextLeader,cards:{...h.cards}})),
      table:{...g.table},tableSettled:g.tableSettled,winner:g.winner,winnerTeam:g.winnerTeam,message:g.message,needsDeal:g.needsDeal,actions:getActions(g,playerId),
      me:me?{id:playerId,name:me.name,avatar:me.avatar,team:me.team,seat:me.seat,folded:!!me.folded,hand:me.hand||[],played:me.played||[]}:null,
      rival:rival?{...publicPlayer(g,rivalId)}:null,players:others,teammates:me?teammates(g,playerId).map(id=>publicPlayer(g,id)):[],opponents:me?opponents(g,playerId).map(id=>publicPlayer(g,id)):[],
      rematch:{readyCount:ready.length,max:g.order.length,meReady:ready.includes(playerId)}
    };
  }

  return {SUITS,VALUES,TRUCO_NAMES,ENVIDO_NAMES,MODES,normalizeMode,cardId,shuffle,deck,power,envido,other,opponents,teammates,teamOf,teamMembers,allCards,newGame,addPlayer,removePlayerWaiting,deal,
    determineHandWinner,determineHandWinnerTeam,playCard,callTruco,respondTruco,callEnvido,respondEnvido,fold,nextHandIfNeeded,restartMatch,getActions,publicState,
    allowedEnvidoRaises,acceptedEnvidoValue,faltaValue,fixedEnvidoValue,activeTeamMembers,teamLabel};
});
