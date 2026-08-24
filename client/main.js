const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const Core=window.TrucoCore, Bots=window.TrucoBots, Campaign=window.TrucoCampaign, Profile=window.TrucoProfile;
const chars=Profile.AVATARS;
const emotes=['mate','mano','ceja','risa','llanto','golpe','fuego','ojo','carta','aplauso','sospecha','termo'];
function loadProfile(){try{return Profile.normalize(JSON.parse(localStorage.getItem(Profile.STORAGE_KEY)||'null'));}catch(_){return Profile.normalize(null);}}
let profile=loadProfile(),pendingAvatar=profile.avatar;
let mode='offline',socket=null,onlineState=null,game=null,bot=null,botMemory=null,botTimer=null,nextHandTimer=null,speechTimer=null;
let onlineBusy=false,onlineActionPending=false,leavingOnline=false,connectionWaitModal=false,ownConnectionLost=false,onlineCreateMode='1v1',lastOnlinePhase=null;
const lostOnlinePlayers=new Map();
const recordedOnlineRooms=new Set();
let campaign=loadCampaign(),offlineContext={source:'free',replay:false,botId:null};
const cityStops=['Belgrano','Palermo','Recoleta','Microcentro','Caballito','Villa Crespo','Boedo','San Telmo','La Boca','Congreso'];

function loadCampaign(){try{return Campaign.normalizeCampaign(JSON.parse(localStorage.getItem(Campaign.STORAGE_KEY)||'null'));}catch(_){return Campaign.createCampaign();}}
function saveCampaign(){localStorage.setItem(Campaign.STORAGE_KEY,JSON.stringify(campaign));renderCampaignCover();}
function save(){profile=Profile.normalize(profile);localStorage.setItem(Profile.STORAGE_KEY,JSON.stringify(profile));renderProfile();}
function asset(p){return 'assets/'+p;}
function avatarId(id){return Profile.renderableAvatar(id)?id:Profile.DEFAULT.avatar;}
function avatarSrc(id){return asset('avatars/'+avatarId(id)+'.png');}
function show(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');}
function cardImg(c,cls='card'){return `<img class="${cls}" src="${asset('cards/'+c.id+'.png')}" alt="${c.value} ${c.suit}">`;}
function backImg(){return `<img class="mini-back" src="${asset('cards/back.png')}">`;}
function cardName(c){return `${c.value} de ${c.suit}`;}
function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function renderProfile(){
  const av=Profile.getAvatar(profile.avatar);
  $('#profileName').textContent=profile.name;$('#profileAvatar').src=avatarSrc(profile.avatar);$('#profilePhrase').textContent=av.tag;
  $('#wins').textContent=profile.wins;$('#coins').textContent=profile.coins;$('#streak').textContent=profile.streak;
}
function renderAvatars(){
  $('#avatarGrid').innerHTML=chars.map(c=>`<div class="avatar-card ${c.id===pendingAvatar?'selected':''}" data-av="${c.id}" role="button" tabindex="0" aria-label="Elegir ${c.name}"><img src="${avatarSrc(c.id)}" alt="${c.name}"><b>${c.name}</b><small>${c.tag}</small></div>`).join('');
  $$('[data-av]').forEach(el=>{
    const choose=()=>{pendingAvatar=el.dataset.av;$('#profileEditorPreview').src=avatarSrc(pendingAvatar);renderAvatars();};
    el.onclick=choose;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
  });
}
function openProfileEditor(){
  pendingAvatar=profile.avatar;$('#profileNameInput').value=profile.name;$('#profileEditorPreview').src=avatarSrc(pendingAvatar);renderAvatars();show('avatarScreen');
}
function saveProfileEditor(){
  profile.name=Profile.cleanName($('#profileNameInput').value);profile.avatar=pendingAvatar;save();
  const preview=$('#profileEditorPreview');preview.classList.remove('profile-save-flash');void preview.offsetWidth;preview.classList.add('profile-save-flash');show('menu');
}
function renderCampaignCover(){
  const p=Campaign.progress(campaign),text=p.completed?'Gira completada':`${p.won} de ${p.total} vencidos`;
  const t=$('#coverProgressText'),bar=$('#coverProgressBar');if(t)t.textContent=text;if(bar)bar.style.width=`${(p.won/p.total)*100}%`;
}
function campaignStatusText(status){return status==='defeated'?'VENCIDO':status==='available'?'DISPONIBLE':'BLOQUEADO';}
function renderCampaignRoute(){
  campaign=Campaign.normalizeCampaign(campaign);saveCampaign();
  const p=Campaign.progress(campaign),next=Campaign.nextIndex(campaign);
  $('#routeProgressText').textContent=p.completed?'10 de 10 · Todos disponibles para revancha':`${p.won} de ${p.total} vencidos · próximo: ${next>=0?Bots.BOTS[campaign.route[next]].name:'—'}`;
  const badge=$('#routeStatusBadge');badge.textContent=p.completed?'COMPLETADA':'EN CURSO';badge.classList.toggle('complete',p.completed);
  $('#campaignRoute').innerHTML=campaign.route.map((id,index)=>{
    const b=Bots.BOTS[id],status=Campaign.statusAt(campaign,index),locked=status==='locked';
    const special=id==='cristina'?'<span class="node-special final">JEFA FINAL</span>':id==='chiqui'?'<span class="node-special middle">MITAD DE GIRA</span>':'';
    return `<button class="tour-node ${status} ${id==='cristina'?'final-node':''} ${id==='chiqui'?'middle-node':''}" data-tour-bot="${id}" ${locked?'disabled':''}>
      <span class="node-step">${index+1}</span><span class="node-photo"><img src="${asset('bots/'+b.avatar+'.png')}" alt="${b.name}"></span>
      <span class="node-copy"><small>${cityStops[index]} · ${campaignStatusText(status)}</small><b>${b.name}</b><em>${Campaign.META[id].short}</em>${special}</span>
      <span class="node-state">${status==='defeated'?'✓':status==='available'?'▶':'🔒'}</span>
    </button>`;
  }).join('');
  $$('[data-tour-bot]').forEach(el=>el.onclick=()=>openCampaignBot(el.dataset.tourBot));
}
function statMeter(label,value){return `<div class="bot-stat"><span><b>${label}</b><strong>${value}</strong></span><div><i style="width:${value}%"></i></div></div>`;}
function openCampaignBot(botId){
  const index=campaign.route.indexOf(botId);if(index<0)return;
  const status=Campaign.statusAt(campaign,index),b=Bots.BOTS[botId],meta=Campaign.META[botId];
  if(status==='locked')return modal('Rival bloqueado','<p>Primero tenés que vencer al rival anterior del recorrido.</p>');
  const action=status==='defeated'?'REVANCHA':'JUGAR';
  modal(b.name,`<div class="campaign-bot-sheet"><div class="bot-sheet-head"><img src="${asset('bots/'+b.avatar+'.png')}" alt="${b.name}"><div><span class="sheet-status ${status}">${campaignStatusText(status)}</span><small>Parada ${index+1} · ${cityStops[index]}</small><h4>${b.style}</h4></div></div><div class="bot-stat-list">${statMeter('MENTIROSO',b.stats.mentiroso)}${statMeter('PESCADOR',b.stats.pescador)}${statMeter('AGRESIVO',b.stats.agresivo)}</div><p class="bot-bio">${meta.bio}</p><button class="big gold campaign-play" onclick="startCampaignBot('${botId}')">${action}</button></div>`);
}
window.startCampaignBot=botId=>{
  if(!Campaign.canPlay(campaign,botId))return;
  const idx=campaign.route.indexOf(botId),replay=Campaign.statusAt(campaign,idx)==='defeated';
  closeModal();initOffline(botId,{source:'campaign',replay,botId});
};
window.returnToCityRoute=()=>{closeModal();renderCampaignRoute();show('tourMap');};
window.retryCampaignBot=()=>{if(!bot)return;closeModal();const replay=campaign.defeated.includes(bot.id);initOffline(bot.id,{source:'campaign',replay,botId:bot.id});};
function modal(title,body){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modal').classList.remove('hidden');}
function closeModal(){$('#modal').classList.add('hidden');}
function emotePanel(){modal('Emotes',`<div class="emote-grid">${emotes.map(e=>`<button class="emote" data-em="${e}"><img src="${asset('emotes/'+e+'.gif')}"></button>`).join('')}</div>`);$$('[data-em]').forEach(b=>b.onclick=()=>{sendEmote(b.dataset.em);closeModal();});}
function sendEmote(e){if(!emotes.includes(e))return;showEmote(e);if(mode==='online'&&socket?.connected)socket.emit('emote',e);}
function showEmote(e){if(!emotes.includes(e))return;const host=$('#floatingEmote');host.innerHTML='';const img=document.createElement('img');img.src=asset('emotes/'+e+'.gif')+'?t='+Date.now();img.alt=e;host.appendChild(img);setTimeout(()=>{if(host.contains(img))host.removeChild(img);},1700);}
function showActionError(msg){const el=$('#actionError');if(!el)return;el.textContent=msg||'Acción inválida';el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1700);}

function botSpeak(event,force=false){
  if(mode!=='offline'||!bot||!botMemory)return;
  const text=Bots.maybePhrase(bot.id,event,botMemory,force);if(!text)return;
  const el=$('#botSpeech');el.textContent=text;el.classList.add('show');clearTimeout(speechTimer);speechTimer=setTimeout(()=>el.classList.remove('show'),3100);
}
function cantoEvent(label){if(label==='Truco')return 'truco';if(label==='Retruco')return 'retruco';if(label==='Vale 4')return 'vale4';return 'envido';}
function scheduleBot(delay=650){clearTimeout(botTimer);if(mode==='offline')botTimer=setTimeout(botStep,delay);}
function scheduleNextHand(){
  clearTimeout(nextHandTimer);if(!game?.needsDeal||game.phase!=='playing')return;
  nextHandTimer=setTimeout(()=>{
    if(mode!=='offline'||!game?.needsDeal)return;
    Core.nextHandIfNeeded(game);Bots.resetHandMemory(botMemory,game.handNumber);renderOffline();
    if(game.turn==='rival')scheduleBot(750);
  },2200);
}
function endOfflineIfNeeded(){
  if(game?.phase!=='ended')return false;
  const won=game.winner==='me';
  if(won){profile.wins++;profile.streak++;profile.coins+=50;}else profile.streak=0;
  let campaignResult=null;
  if(offlineContext.source==='campaign'&&won){
    campaignResult=Campaign.recordWin(campaign,bot.id);campaign=campaignResult.campaign;saveCampaign();
  }
  save();botSpeak(won?'matchLose':'matchWin',true);
  setTimeout(()=>{
    if(offlineContext.source==='campaign'){
      if(won&&campaignResult?.newlyDefeated){
        if(campaignResult.completed){
          modal('¡La Ciudad de la Furia completada!',`<div class="result-campaign"><p>Venciste a <b>${bot.name}</b> y completaste los 10 rivales.</p><p>Todos quedan disponibles para revancha cuando quieras.</p><button class="big gold" onclick="returnToCityRoute()">VER RECORRIDO COMPLETO</button><button class="big" onclick="retryCampaignBot()">REVANCHA</button></div>`);
        }else{
          const next=Bots.BOTS[campaignResult.unlocked];
          modal('Rival vencido',`<div class="result-campaign"><p>Le ganaste a <b>${bot.name}</b>.</p><p>Se desbloqueó el siguiente rival: <b>${next.name}</b>.</p><button class="big gold" onclick="returnToCityRoute()">SEGUIR RECORRIDO</button><button class="big" onclick="retryCampaignBot()">REVANCHA</button></div>`);
        }
      }else if(won){
        modal('Revancha ganada',`<div class="result-campaign"><p>Volviste a vencer a <b>${bot.name}</b>. Tu progreso de la gira no cambia.</p><button class="big gold" onclick="returnToCityRoute()">VOLVER AL RECORRIDO</button><button class="big" onclick="retryCampaignBot()">JUGAR OTRA</button></div>`);
      }else{
        modal('Perdiste',`<div class="result-campaign"><p><b>${bot.name}</b> se quedó con esta partida. El rival sigue disponible para que lo intentes de nuevo.</p><button class="big gold" onclick="retryCampaignBot()">REINTENTAR</button><button class="big" onclick="returnToCityRoute()">VOLVER AL RECORRIDO</button></div>`);
      }
    }else{
      modal(won?'Ganaste':'Perdiste',`<p>Partida terminada a ${game.targetScore} puntos contra <b>${bot.name}</b>.</p><button onclick="closeModal();initOffline()">Jugar otra</button>`);
    }
  },650);
  return true;
}
function handleTrickSpeech(result){
  if(!result?.trickResolved)return;
  if(result.trickWinner==='rival')botSpeak('trickWin');else if(result.trickWinner==='me')botSpeak('trickLose');else botSpeak('tie');
  if(result.handEnded){
    if(result.handWinner==='rival')botSpeak('handWin');else botSpeak('handLose');
  }
}
function postAction(result){
  if(!result?.ok){showActionError(result?.error);return;}
  if(result.type==='card')handleTrickSpeech(result);
  if(endOfflineIfNeeded())return;
  if(game.needsDeal){scheduleNextHand();return;}
  renderOffline();
  if(game.phase==='playing'&&(game.turn==='rival'||(game.envido.pending&&game.envido.by==='me')||(game.truco.pending&&game.truco.by==='me')))scheduleBot();
}

function initOffline(botId,context={}){
  mode='offline';clearTimeout(botTimer);clearTimeout(nextHandTimer);
  offlineContext={source:context.source||'free',replay:!!context.replay,botId:botId||null};
  bot={...(Bots.BOTS[botId]||Bots.BOTS[Bots.BOT_ORDER[Math.floor(Math.random()*Bots.BOT_ORDER.length)]]),seat:'rival'};
  botMemory=Bots.createMemory();game=Core.newGame('LOCAL',15);game.botId=bot.id;
  Core.addPlayer(game,'me',{name:profile.name,avatar:profile.avatar});
  Core.addPlayer(game,'rival',{name:bot.name,avatar:bot.avatar});
  Bots.resetHandMemory(botMemory,game.handNumber);show('game');renderOffline();botSpeak('start',true);
  if(game.turn==='rival')scheduleBot(900);
}

function offlineView(){
  const s=Core.publicState(game,'me');
  return {
    score:{me:s.score.me||0,rival:s.score.rival||0},me:s.me,
    rival:{...s.rival,style:`${bot.style} · Mentiroso ${bot.stats.mentiroso} · Pescador ${bot.stats.pescador} · Agresivo ${bot.stats.agresivo}`,assetType:'bot'},
    table:{me:s.table.me,rival:s.table.rival},history:s.history.map(h=>({round:h.round,cards:{me:h.cards.me,rival:h.cards.rival},winner:h.winner})),
    round:s.round,message:s.message,turn:s.turn,truco:s.truco,envido:s.envido,actions:s.actions,phase:s.phase,needsDeal:s.needsDeal
  };
}
function renderOffline(){renderCommon(offlineView());}

function setMultiplayerLayout(on){
  $('#rivalZone').classList.toggle('hidden',on);$('#rivalLane').classList.toggle('hidden',on);$('#myLane').classList.toggle('hidden',on);
  $('#multiPlayers').classList.toggle('hidden',!on);$('#multiPlayed').classList.toggle('hidden',!on);
  $('.table-inner').classList.toggle('team-game',on);
}
function onlineModeLabel(mode){return mode==='3v3'?'3 vs 3':mode==='2v2'?'2 vs 2':'1 vs 1';}
function allOnlinePlayers(s){return [s.me,...(s.players||[])].filter(Boolean).sort((a,b)=>(a.seat??0)-(b.seat??0));}
function teamPlayerRole(s,p){if(p.id===s.me.id)return 'VOS';return p.team===s.me.team?'COMPAÑERO':'RIVAL';}
function renderTeamPlayers(s){
  const all=allOnlinePlayers(s),bySeat=new Map(all.map(p=>[p.seat,p]));
  $('#multiPlayers').className=`multi-players count-${s.maxPlayers}`;
  $('#multiPlayers').innerHTML=Array.from({length:s.maxPlayers},(_,seat)=>{
    const p=bySeat.get(seat),team=seat%2;if(!p)return `<div class="multi-player empty team-${team}"><span class="seat-num">${seat+1}</span><div class="empty-avatar">?</div><div><b>Esperando...</b><small>Equipo ${team===s.me.team?'tuyo':'rival'}</small></div></div>`;
    const turn=p.id===s.turn?' turn':'';const folded=p.folded?' folded':'';const side=p.team===s.me.team?'mine':'opp';
    return `<div class="multi-player ${side}${turn}${folded}"><span class="seat-num">${seat+1}</span><img src="${avatarSrc(p.avatar)}" alt="${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${teamPlayerRole(s,p)}${p.folded?' · MAZO':''}</small></div><div class="multi-backs">${p.id===s.me.id?'':Array.from({length:p.handCount||0},backImg).join('')}</div></div>`;
  }).join('');
}
function renderTeamPlayed(s){
  const all=allOnlinePlayers(s);
  $('#multiPlayed').className=`multi-played count-${s.maxPlayers}`;
  $('#multiPlayed').innerHTML=all.map(p=>{const c=s.table?.[p.id],side=p.team===s.me.team?'mine':'opp';return `<div class="multi-play-slot ${side} ${p.folded?'folded':''}"><small>${esc(p.name)}</small>${c?cardImg(c,'playedCard'):`<span>${p.folded?'MAZO':'—'}</span>`}</div>`;}).join('');
}
function renderOnlineTeams(s){
  setMultiplayerLayout(true);renderTeamPlayers(s);renderTeamPlayed(s);
  const mine=s.teamScore?.[s.me.team]||0,theirs=s.teamScore?.[1-s.me.team]||0;$('#scoreHud').textContent=`Tu equipo ${mine} · Rivales ${theirs} · ${onlineModeLabel(s.mode)}`;
  $('#myAvatar').src=avatarSrc(s.me?.avatar||profile.avatar);$('#myName').textContent=s.me?.name||profile.name;
  const turnP=allOnlinePlayers(s).find(p=>p.id===s.turn);$('#roundMsg').textContent=s.phase==='waiting'?`Esperando jugadores ${s.playerCount}/${s.maxPlayers} · ${onlineModeLabel(s.mode)}`:`${s.message||`Ronda ${s.round||1}`}${turnP&&s.phase==='playing'&&!s.needsDeal?` · Juega ${turnP.name}`:''}`;
  $('#history').innerHTML=(s.history||[]).map(h=>{const result=h.winnerTeam===null?'Parda':h.winnerTeam===s.me.team?'Ganó tu equipo':'Ganó el rival';const detail=allOnlinePlayers(s).map(p=>h.cards?.[p.id]?`${esc(p.name)}: ${cardName(h.cards[p.id])}`:null).filter(Boolean).join(' · ');return `<div class="hist">Baza ${h.round}: ${detail}<br><b>${result}</b></div>`;}).join('');
  $('#hand').innerHTML=(s.me?.hand||[]).map(c=>`<button class="cardBtn" data-card="${c.id}" ${s.actions?.canPlay?'':'disabled'}>${cardImg(c)}</button>`).join('');$$('.cardBtn').forEach(b=>b.onclick=()=>playMyCard(b.dataset.card));
  if(s.phase==='waiting')$('#actions').innerHTML=`<button onclick="copyRoomCode('${s.room}')">Copiar código</button>`;else renderActions(s.actions||{},s);
}

function renderCommon(s){
  setMultiplayerLayout(false);
  const myScore=s.score?.me??0,rivalScore=s.score?.rival??0,myName=s.me?.name||profile.name;
  $('#scoreHud').textContent=`${myName} ${myScore} · Rival ${rivalScore}`;
  const rivalAvatar=$('#rivalAvatar');
  if(s.rival){const rav=s.rival.avatar||Profile.DEFAULT.avatar;rivalAvatar.style.visibility='visible';rivalAvatar.src=s.rival.assetType==='bot'?asset('bots/'+rav+'.png'):avatarSrc(rav);}
  else rivalAvatar.style.visibility='hidden';
  $('#rivalName').textContent=s.rival?.name||'Esperando rival';$('#rivalStyle').textContent=s.rival?.style||'';
  $('#myAvatar').src=avatarSrc(s.me?.avatar||profile.avatar);$('#myName').textContent=s.me?.name||profile.name;
  $('#rivalHand').innerHTML=Array.from({length:s.rival?.handCount||0},backImg).join('');
  $('#myPlayed').innerHTML=s.table?.me?cardImg(s.table.me,'playedCard'):'';$('#rivalPlayed').innerHTML=s.table?.rival?cardImg(s.table.rival,'playedCard'):'';
  $('#roundMsg').textContent=s.message||`Ronda ${s.round||1}`;
  $('#history').innerHTML=(s.history||[]).map(h=>`<div class="hist">Baza ${h.round}: ${h.cards?.me?cardName(h.cards.me):'Vos'} vs ${h.cards?.rival?cardName(h.cards.rival):'Rival'}<br><b>${h.winner==='me'?'Ganaste':h.winner==='rival'?'Ganó rival':'Parda'}</b></div>`).join('');
  $('#hand').innerHTML=(s.me?.hand||[]).map(c=>`<button class="cardBtn" data-card="${c.id}" ${s.actions?.canPlay?'':'disabled'}>${cardImg(c)}</button>`).join('');
  $$('.cardBtn').forEach(b=>b.onclick=()=>playMyCard(b.dataset.card));renderActions(s.actions||{},s);
}
function envLabel(t){return t==='envido'?'Envido':t==='real'?'Real Envido':'Falta Envido';}
function renderActions(a,s){
  let html='';
  if(a.canRespondEnvido){
    html+=`<button onclick="respondEnvido(true)">Quiero</button><button onclick="respondEnvido(false)">No quiero</button>`;
    for(const r of a.envidoRaises||[])html+=`<button onclick="callEnvido('${r}')">${envLabel(r)}</button>`;
  }else if(a.canRespondTruco){
    html+=`<button onclick="respondTruco('want')">Quiero</button><button onclick="respondTruco('no')">No quiero</button>`;
    if(a.canCounterTruco){const nxt=(s.truco?.pending||1)+1;html+=`<button onclick="respondTruco('raise')">${nxt===3?'Retruco':'Vale 4'}</button>`;}
    for(const r of a.envidoCalls||[])html+=`<button onclick="callEnvido('${r}')">${envLabel(r)}</button>`;
  }else{
    for(const r of a.envidoCalls||[])html+=`<button onclick="callEnvido('${r}')">${envLabel(r)}</button>`;
    if(a.trucoCall)html+=`<button onclick="callTruco()">${a.trucoCall}</button>`;
    if(a.canFold)html+=`<button class="foldBtn" onclick="fold()">Ir al mazo</button>`;
  }
  $('#actions').innerHTML=html;
}
function setOnlineActionPending(value){
  onlineActionPending=!!value;
  if(mode==='online'&&onlineActionPending)document.querySelectorAll('#actions button,#hand button').forEach(b=>b.disabled=true);
}
function releaseOnlineAction(redraw=false){
  onlineActionPending=false;
  if(redraw&&mode==='online'&&onlineState)renderOnline(onlineState);
}
function emitOnlineAction(event,...args){
  if(!socket?.connected){showActionError('Sin conexión con la mesa');return false;}
  if(onlineActionPending)return false;
  setOnlineActionPending(true);socket.emit(event,...args);return true;
}

function playMyCard(id){
  if(mode==='online'){emitOnlineAction('playCard',id);return;}
  const r=Core.playCard(game,'me',id);renderOffline();postAction(r);
}
window.callTruco=()=>{
  if(mode==='online')return emitOnlineAction('callTruco');
  const r=Core.callTruco(game,'me');renderOffline();if(!r.ok)return showActionError(r.error);scheduleBot(650);
};
window.respondTruco=response=>{
  if(mode==='online')return emitOnlineAction('respondTruco',response);
  if(response==='want')Bots.recordPlayer(botMemory,'trucoWant');else if(response==='no')Bots.recordPlayer(botMemory,'trucoNo');else if(response==='raise')Bots.recordPlayer(botMemory,'raise');
  const r=Core.respondTruco(game,'me',response);renderOffline();postAction(r);
};
window.callEnvido=(type='envido')=>{
  if(mode==='online')return emitOnlineAction('callEnvido',type);
  if(game.envido.pending&&game.envido.by==='rival')Bots.recordPlayer(botMemory,'raise');
  const r=Core.callEnvido(game,'me',type);renderOffline();if(!r.ok)return showActionError(r.error);scheduleBot(650);
};
window.respondEnvido=w=>{
  if(mode==='online')return emitOnlineAction('respondEnvido',w);
  Bots.recordPlayer(botMemory,w?'envidoWant':'envidoNo');
  const r=Core.respondEnvido(game,'me',w);renderOffline();postAction(r);
};
window.fold=()=>{
  if(mode==='online')return emitOnlineAction('fold');
  const r=Core.fold(game,'me');if(r.ok)botSpeak('handWin');renderOffline();postAction(r);
};

function botStep(){
  if(mode!=='offline'||!game||game.phase!=='playing'||game.needsDeal)return;
  Bots.resetHandMemory(botMemory,game.handNumber);
  let actions=Core.getActions(game,'rival');
  if(actions.canRespondEnvido){
    const d=Bots.decideEnvidoResponse(game,bot,botMemory);if(!d)return;
    if(d.type==='raise'){
      const r=Core.callEnvido(game,'rival',d.call);if(r.ok)botSpeak('envido');renderOffline();return;
    }
    const r=Core.respondEnvido(game,'rival',d.type==='want');botSpeak(d.type==='want'?'quiero':'noQuiero');renderOffline();postAction(r);return;
  }
  if(actions.canRespondTruco){
    // Envido can interrupt a pending Truco while it is still legally available.
    if(actions.envidoCalls?.length){const e=Bots.decideInitialEnvido(game,bot,botMemory);if(e){const r=Core.callEnvido(game,'rival',e);if(r.ok)botSpeak('envido');renderOffline();return;}}
    const d=Bots.decideTrucoResponse(game,bot,botMemory);if(!d)return;
    const r=Core.respondTruco(game,'rival',d);
    if(d==='raise')botSpeak(cantoEvent(r.label));else botSpeak(d==='want'?'quiero':'noQuiero');
    renderOffline();postAction(r);return;
  }
  if(game.turn!=='rival')return;
  const e=Bots.decideInitialEnvido(game,bot,botMemory);if(e){const r=Core.callEnvido(game,'rival',e);if(r.ok){botSpeak('envido');renderOffline();return;}}
  if(Bots.decideInitialTruco(game,bot,botMemory)){
    const r=Core.callTruco(game,'rival');if(r.ok){botSpeak(cantoEvent(r.label));renderOffline();return;}
  }
  if(bot.id==='chiqui'&&!botMemory.specialShown&&Math.random()<.09){botMemory.specialShown=true;botSpeak('special',true);}
  const card=Bots.chooseCard(game,bot,botMemory);if(!card)return;
  const r=Core.playCard(game,'rival',card.id);renderOffline();postAction(r);
}

function setOnlineBusy(value){onlineBusy=!!value;$('#createRoom').disabled=onlineBusy;$('#joinRoom').disabled=onlineBusy;}
function disconnectOnlineLocal(){
  const s=socket;socket=null;onlineState=null;mode='offline';onlineActionPending=false;leavingOnline=false;connectionWaitModal=false;lastOnlinePhase=null;lostOnlinePlayers.clear();setOnlineBusy(false);
  if(s){try{s.removeAllListeners();s.disconnect();}catch(_){}}
  ownConnectionLost=false;
}
function leaveOnlineRoom(destination='menu'){
  const s=socket;leavingOnline=true;onlineState=null;mode='offline';onlineActionPending=false;setOnlineBusy(false);socket=null;connectionWaitModal=false;closeModal();show(destination);
  if(s){
    let finished=false;const finish=()=>{if(finished)return;finished=true;try{s.removeAllListeners();s.disconnect();}catch(_){}};
    try{s.emit('leaveRoom',finish);}catch(_){finish();}
    setTimeout(finish,700);
  }
}
window.leaveOnlineAndMenu=()=>leaveOnlineRoom('menu');
window.copyRoomCode=code=>{
  const text=String(code||'').trim();if(!text)return;
  const ok=()=>showActionError('Código copiado');
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(ok).catch(()=>fallbackCopy(text,ok));}else fallbackCopy(text,ok);
};
function fallbackCopy(text,done){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(_){}ta.remove();}
function renderConnectionWait(graceMs=20000){
  if(!lostOnlinePlayers.size){if(connectionWaitModal)closeModal();connectionWaitModal=false;return;}
  connectionWaitModal=true;const names=[...lostOnlinePlayers.values()].map(esc).join(', '),plural=lostOnlinePlayers.size>1;
  modal('Conexión interrumpida',`<p><b>${names}</b> ${plural?'perdieron':'perdió'} conexión. La mesa queda pausada unos ${Math.ceil(graceMs/1000)} segundos mientras intentamos recuperar ${plural?'a los jugadores':'al jugador'}.</p>`);
}
function connect(){
  if(socket)return;leavingOnline=false;socket=io();
  socket.on('state',s=>{if(leavingOnline)return;mode='online';onlineState=s;releaseOnlineAction(false);connectionWaitModal=false;if(lastOnlinePhase==='ended'&&s.phase!=='ended')closeModal();lastOnlinePhase=s.phase;renderOnline(s);show('game');});
  socket.on('actionError',msg=>{releaseOnlineAction(true);showActionError(msg);});
  socket.on('emote',d=>showEmote(d?.name));
  socket.on('opponentConnectionLost',d=>{if(leavingOnline)return;lostOnlinePlayers.set(d?.playerId||('unknown-'+Date.now()),d?.playerName||'Un jugador');renderConnectionWait(d?.graceMs||20000);});
  socket.on('opponentReconnected',d=>{if(d?.playerId)lostOnlinePlayers.delete(d.playerId);renderConnectionWait();showActionError(`${d?.playerName||'Jugador'} reconectado`);});
  socket.on('waitingPlayerLeft',d=>{if(d?.playerId)lostOnlinePlayers.delete(d.playerId);renderConnectionWait();showActionError(`${d?.playerName||'Un jugador'} salió de la sala`);});
  socket.on('opponentLeft',()=>{if(leavingOnline)return;disconnectOnlineLocal();modal('Mesa cerrada','<p>Un jugador salió de la partida o no pudo reconectarse, así que la mesa se cerró.</p><button class="big gold" onclick="leaveOnlineAndMenu()">VOLVER AL MENÚ</button>');});
  socket.on('rematchStarted',()=>{closeModal();showActionError('¡Revancha!');});
  socket.on('roomExpired',()=>{if(leavingOnline)return;disconnectOnlineLocal();modal('Sala cerrada','<p>Esta sala ya no está disponible.</p><button class="big gold" onclick="leaveOnlineAndMenu()">VOLVER AL MENÚ</button>');});
  socket.on('connect_error',()=>{setOnlineBusy(false);if(mode==='online')showActionError('No se pudo conectar. Reintentando...');else $('#onlineStatus').textContent='No se pudo conectar al servidor.';});
  socket.on('connect',()=>{
    if(ownConnectionLost){
      const recovered=!!socket.recovered;ownConnectionLost=false;
      if(!recovered&&mode==='online'&&onlineState){disconnectOnlineLocal();modal('Sala perdida','<p>No se pudo recuperar la mesa después del corte. Vas a tener que crear o entrar a una sala nueva.</p><button class="big gold" onclick="leaveOnlineAndMenu()">VOLVER AL MENÚ</button>');}
    }
  });
  socket.on('disconnect',reason=>{if(!leavingOnline&&mode==='online'&&reason!=='io client disconnect'){onlineActionPending=false;ownConnectionLost=true;showActionError('Conexión interrumpida. Intentando reconectar...');}});
}
function recordOnlineResult(s){
  if(s.phase!=='ended')return;const key=`${s.room}:${s.matchNumber||1}`;if(recordedOnlineRooms.has(key))return;
  recordedOnlineRooms.add(key);const won=s.playersPerTeam>1?s.winnerTeam===s.me.team:s.winner===s.me.id;
  if(won){profile.wins++;profile.streak++;profile.coins+=50;}else profile.streak=0;save();
}
window.requestOnlineRematch=()=>{
  if(!socket?.connected||onlineState?.phase!=='ended'||onlineState?.rematch?.meReady)return;
  const btn=document.querySelector('.online-end .gold');if(btn)btn.disabled=true;
  socket.emit('requestRematch',r=>{if(!r?.ok){if(btn)btn.disabled=false;showActionError(r?.error||'No se pudo pedir revancha');}});
};
function onlineEndModal(s){
  recordOnlineResult(s);const won=s.playersPerTeam>1?s.winnerTeam===s.me.team:s.winner===s.me.id,ready=s.rematch?.readyCount||0,max=s.rematch?.max||s.maxPlayers||2,meReady=!!s.rematch?.meReady;
  const teamText=s.playersPerTeam>1?(won?'Tu equipo ganó la partida.':'El equipo rival ganó la partida.'):(won?'La victoria quedó guardada en tu perfil.':'Esta vez ganó el rival.');
  modal(won?'Ganaste':'Perdiste',`<div class="online-end"><p>${teamText}</p><p class="rematch-status">Revancha: <b>${ready}/${max}</b> jugadores listos.</p><button class="big gold" ${meReady?'disabled':''} onclick="requestOnlineRematch()">${meReady?'ESPERANDO A LOS DEMÁS...':'REVANCHA'}</button><button class="big" onclick="leaveOnlineAndMenu()">VOLVER AL MENÚ</button></div>`);
}
function renderOnline(s){
  if(s.playersPerTeam>1){renderOnlineTeams(s);}else{
    const myScore=s.score[s.me.id]||0,rivalScore=s.rival?(s.score[s.rival.id]||0):0;
    const table={me:s.table[s.me.id],rival:s.rival?s.table[s.rival.id]:null};
    const history=s.history.map(h=>({round:h.round,cards:{me:h.cards[s.me.id],rival:s.rival?h.cards[s.rival.id]:null},winner:h.winner===s.me.id?'me':(s.rival&&h.winner===s.rival.id?'rival':null)}));
    renderCommon({score:{me:myScore,rival:rivalScore},me:s.me,rival:s.rival?{...s.rival,style:'',assetType:'profile'}:null,table,history,round:s.round,message:s.message,turn:s.turn===s.me.id?'me':'rival',truco:{...s.truco,by:s.truco.by===s.me.id?'me':(s.truco.by?'rival':null)},envido:{...s.envido,by:s.envido.by===s.me.id?'me':(s.envido.by?'rival':null)},actions:s.actions,phase:s.phase,needsDeal:s.needsDeal});
    if(s.phase==='waiting'){$('#roundMsg').textContent='Esperando rival... código '+s.room;$('#actions').innerHTML=`<button onclick="copyRoomCode('${s.room}')">Copiar código</button>`;}
  }
  if(s.phase==='ended')onlineEndModal(s);
}

$('#offlineBtn').onclick=()=>{renderCampaignCover();show('tourCover');};
$('#enterCityBtn').onclick=()=>{renderCampaignRoute();show('tourMap');};
$('#onlineBtn').onclick=()=>show('online');
$$('[data-online-mode]').forEach(b=>b.onclick=()=>{onlineCreateMode=b.dataset.onlineMode;$$('[data-online-mode]').forEach(x=>x.classList.toggle('active',x===b));$('#createRoom').textContent='Crear sala '+onlineModeLabel(onlineCreateMode);});
$('#createRoom').onclick=()=>{if(onlineBusy)return;$('#onlineStatus').textContent='Creando sala '+onlineModeLabel(onlineCreateMode)+'...';setOnlineBusy(true);connect();socket.emit('createRoom',{profile,mode:onlineCreateMode},r=>{setOnlineBusy(false);$('#onlineStatus').textContent=r?.ok?`Sala ${r.code} creada · ${onlineModeLabel(r.mode)} · ${r.maxPlayers} jugadores. Pasales el código.`:(r?.error||'No se pudo crear la sala');});};
$('#joinRoom').onclick=()=>{if(onlineBusy)return;const code=$('#roomCode').value.trim().toUpperCase();$('#roomCode').value=code;if(!/^[A-Z0-9]{4}$/.test(code)){return $('#onlineStatus').textContent='Ingresá un código válido de 4 caracteres.';}$('#onlineStatus').textContent='Buscando sala...';setOnlineBusy(true);connect();socket.emit('joinRoom',{code,profile},r=>{setOnlineBusy(false);$('#onlineStatus').textContent=r?.ok?`Entrando a ${onlineModeLabel(r.mode)} · ${r.playerCount}/${r.maxPlayers} jugadores...`:(r?.error||'No se pudo entrar');});};
$('#editProfile').onclick=openProfileEditor;
$('#avatarsBtn').onclick=openProfileEditor;
$('#saveProfileBtn').onclick=saveProfileEditor;
$('#profileNameInput').onkeydown=e=>{if(e.key==='Enter')saveProfileEditor();};
$('#rulesBtn').onclick=()=>modal('Reglas','<p>Truco argentino a 15 puntos. Jerarquía real de cartas, pardas por mano, Truco → Retruco → Vale 4 y Envido completo con Envido, Real Envido y Falta Envido.</p><p><b>2 vs 2 y 3 vs 3:</b> los equipos se sientan alternados. En cada baza juegan todos los jugadores activos; gana el equipo de la carta más alta. Si las cartas más altas empatadas pertenecen a equipos distintos, la baza es parda y vuelve a salir quien había iniciado esa baza. En el Envido cuenta el mejor puntaje de cada equipo y los empates respetan la prioridad desde el mano. Irse al mazo elimina solo a ese jugador; la mano termina recién si todo su equipo se fue al mazo. El 3 vs 3 se juega en formato redonda: participan los seis en cada mano.</p>');
$('#rankBtn').onclick=()=>modal('Ranking local',`<p>Victorias: ${profile.wins}<br>Racha: ${profile.streak}<br>Monedas: ${profile.coins}</p>`);
$('#settingsBtn').onclick=()=>modal('Ajustes','<button onclick="localStorage.removeItem(\'trucoProfile\');localStorage.removeItem(\'trucoCityFury\');location.reload()">Reiniciar progreso</button>');
$('#emotesBtn').onclick=emotePanel;$('#closeModal').onclick=closeModal;$('#exitGame').onclick=()=>{clearTimeout(botTimer);clearTimeout(nextHandTimer);clearTimeout(speechTimer);if(mode==='online'){leaveOnlineRoom('menu');return;}if(mode==='offline'&&offlineContext.source==='campaign'){renderCampaignRoute();show('tourMap');}else show('menu');};$$('.close[data-to]').forEach(b=>b.onclick=()=>{if(b.dataset.to==='tourCover')renderCampaignCover();show(b.dataset.to);});
renderProfile();saveCampaign();
