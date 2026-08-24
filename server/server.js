const express=require('express');
const path=require('path');
const http=require('http');
const {randomInt}=require('crypto');
const {Server}=require('socket.io');
const logic=require('./gameLogic');

const app=express();
const server=http.createServer(app);
const ROOM_GRACE_MS=20000;
const ROOM_END_TTL_MS=10*60*1000;
const VALID_EMOTES=new Set(['mate','mano','ceja','risa','llanto','golpe','fuego','ojo','carta','aplauso','sospecha','termo']);
const CHAT_MAX=120;
const CHAT_RATE_MS=550;
const io=new Server(server,{maxHttpBufferSize:64*1024,connectionStateRecovery:{maxDisconnectionDuration:ROOM_GRACE_MS,skipMiddlewares:true}});
const PORT=process.env.PORT||3000;
const ROOT=path.join(__dirname,'..','client');
const rooms=new Map();
const disconnectTimers=new Map(); // key: room:socket, because 2v2/3v3 can lose more than one connection.
const expiryTimers=new Map();

app.use(express.static(ROOT));
app.get('/',(_,res)=>res.sendFile(path.join(ROOT,'index.html')));

function code(){return randomInt(36**4).toString(36).padStart(4,'0').toUpperCase();}
function safeCb(cb,payload){if(typeof cb==='function')cb(payload);}
function dkey(roomCode,id){return `${roomCode}:${id}`;}
function emitRoom(g){if(!g)return;for(const id of g.order)io.to(id).emit('state',logic.publicState(g,id));}
function clearTimer(map,key){const t=map.get(key);if(t){clearTimeout(t);map.delete(key);}}
function clearDisconnect(roomCode,id){clearTimer(disconnectTimers,dkey(roomCode,id));}
function roomHasDisconnect(roomCode){for(const key of disconnectTimers.keys())if(key.startsWith(roomCode+':'))return true;return false;}
function clearRoomTimers(roomCode){
  clearTimer(expiryTimers,roomCode);
  for(const key of [...disconnectTimers.keys()])if(key.startsWith(roomCode+':'))clearTimer(disconnectTimers,key);
}
function clearSocketRoomData(roomCode){
  const g=rooms.get(roomCode);if(!g)return;
  for(const id of g.order){const s=io.sockets.sockets.get(id);if(s){s.leave(roomCode);if(s.data.room===roomCode)s.data.room=null;}}
}
function closeRoom(roomCode,leaverId=null,eventName='opponentLeft',payload={}){
  const g=rooms.get(roomCode);if(!g)return false;clearRoomTimers(roomCode);
  if(eventName){for(const id of g.order){if(id===leaverId)continue;const s=io.sockets.sockets.get(id);if(s)s.emit(eventName,payload);}}
  clearSocketRoomData(roomCode);rooms.delete(roomCode);return true;
}
function removeWaitingPlayer(roomCode,id,reason='left'){
  const g=rooms.get(roomCode);if(!g||g.phase!=='waiting'||!g.players[id])return false;
  const playerName=g.players[id].name,wasHost=g.order[0]===id;
  if(wasHost){closeRoom(roomCode,id,'opponentLeft',{reason:'host_'+reason});return true;}
  logic.removePlayerWaiting(g,id);clearDisconnect(roomCode,id);
  const s=io.sockets.sockets.get(id);if(s){s.leave(roomCode);if(s.data.room===roomCode)s.data.room=null;}
  io.to(roomCode).emit('waitingPlayerLeft',{reason,playerId:id,playerName});emitRoom(g);return true;
}
function leaveCurrentRoom(socket,reason='leave'){
  const roomCode=socket.data.room;if(!roomCode)return false;const g=rooms.get(roomCode);
  if(g){if(g.phase==='waiting')removeWaitingPlayer(roomCode,socket.id,reason);else closeRoom(roomCode,socket.id,'opponentLeft',{reason});}
  socket.leave(roomCode);socket.data.room=null;return !!g;
}
function scheduleEndedRoomExpiry(g){
  if(!g||g.phase!=='ended')return;clearTimer(expiryTimers,g.code);
  expiryTimers.set(g.code,setTimeout(()=>closeRoom(g.code,null,'roomExpired',{reason:'expired'}),ROOM_END_TTL_MS));
}
function roomMode(value){return logic.normalizeMode(value);}
function cleanChatText(value){return String(value??'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,CHAT_MAX);}
function roomLog(g,item){if(!g)return;g.chatMessages=Array.isArray(g.chatMessages)?g.chatMessages:[];g.chatMessages.push(item);if(g.chatMessages.length>60)g.chatMessages.splice(0,g.chatMessages.length-60);}
function sendChatHistory(socket,g){if(!socket||!g)return;socket.emit('chatHistory',{messages:Array.isArray(g.chatMessages)?g.chatMessages:[]});}
function interactionFor(g,id,fn,args,r){
  if(!r?.ok||fn==='playCard')return null;const p=g.players[id];if(!p)return null;let text='';
  if(fn==='callTruco')text=`¡${r.label||'Truco'}!`;
  else if(fn==='respondTruco'){const a=args[0];text=a==='raise'?`¡${r.label||'Subo'}!`:(a===true||a==='want'?'¡Quiero!':'No quiero');}
  else if(fn==='callEnvido')text=`¡${r.label||'Envido'}!`;
  else if(fn==='respondEnvido'){const a=args[0];text=(a===true||a==='want')?'¡Quiero!':'No quiero';}
  else if(fn==='fold')text='Me voy al mazo';
  if(!text)return null;return {from:id,name:p.name,team:p.team,kind:fn,text,ts:Date.now()};
}
function emitInteraction(g,d){if(!g||!d)return;roomLog(g,{system:true,text:`${d.name}: ${d.text}`,ts:d.ts});io.to(g.code).emit('gameInteraction',d);}

io.on('connection',socket=>{
  if(socket.recovered&&socket.data.room){
    const roomCode=socket.data.room,g=rooms.get(roomCode);
    if(g&&g.players[socket.id]){
      clearDisconnect(roomCode,socket.id);socket.to(roomCode).emit('opponentReconnected',{playerId:socket.id,playerName:g.players[socket.id].name});emitRoom(g);
    }else{socket.data.room=null;socket.emit('roomExpired',{reason:'recovery_failed'});}
  }

  socket.on('createRoom',(payload,cb)=>{
    if(socket.data.room)leaveCurrentRoom(socket,'new_room');
    // Backwards compatible: old clients sent the profile directly.
    const wrapped=payload&&typeof payload==='object'&&payload.profile;
    const profile=wrapped?payload.profile:(payload||{}),mode=roomMode(wrapped?payload.mode:'1v1');
    let c;do{c=code();}while(rooms.has(c));
    const g=logic.newGame(c,15,mode);g.chatMessages=[];rooms.set(c,g);logic.addPlayer(g,socket.id,profile||{});
    socket.join(c);socket.data.room=c;safeCb(cb,{ok:true,code:c,mode:g.mode,maxPlayers:g.maxPlayers});emitRoom(g);sendChatHistory(socket,g);
  });

  socket.on('joinRoom',(payload,cb)=>{
    payload=(payload&&typeof payload==='object')?payload:{};const roomCode=String(payload.code||'').trim().toUpperCase();
    if(!/^[A-Z0-9]{4}$/.test(roomCode))return safeCb(cb,{ok:false,error:'Código inválido'});
    if(socket.data.room===roomCode)return safeCb(cb,{ok:false,error:'Ya estás en esa sala'});
    const g=rooms.get(roomCode);if(!g)return safeCb(cb,{ok:false,error:'Sala no existe'});
    if(roomHasDisconnect(roomCode))return safeCb(cb,{ok:false,error:'Esperando que un jugador de la sala se reconecte'});
    if(g.phase==='ended')return safeCb(cb,{ok:false,error:'La partida ya terminó'});
    if(g.phase!=='waiting'||g.order.length>=g.maxPlayers)return safeCb(cb,{ok:false,error:'Sala llena'});
    if(socket.data.room)leaveCurrentRoom(socket,'joined_other_room');
    if(!logic.addPlayer(g,socket.id,payload.profile||{}))return safeCb(cb,{ok:false,error:'No se pudo entrar a la sala'});
    socket.join(g.code);socket.data.room=g.code;safeCb(cb,{ok:true,code:g.code,mode:g.mode,maxPlayers:g.maxPlayers,playerCount:g.order.length});emitRoom(g);sendChatHistory(socket,g);
  });

  const act=(fn,...args)=>{
    const roomCode=socket.data.room,g=rooms.get(roomCode);if(!g){socket.emit('actionError','La sala ya no existe');return;}
    if(roomHasDisconnect(roomCode)){socket.emit('actionError','Esperando que un jugador se reconecte');return;}
    const r=logic[fn](g,socket.id,...args);if(r&&!r.ok)socket.emit('actionError',r.error||'Acción inválida');else emitInteraction(g,interactionFor(g,socket.id,fn,args,r));emitRoom(g);
    if(g.needsDeal)setTimeout(()=>{const current=rooms.get(roomCode);if(current===g&&g.needsDeal&&g.phase==='playing'&&!roomHasDisconnect(roomCode)){logic.nextHandIfNeeded(g);emitRoom(g);}},2200);
    if(g.phase==='ended')scheduleEndedRoomExpiry(g);return r;
  };

  socket.on('playCard',id=>act('playCard',id));
  socket.on('callTruco',()=>act('callTruco'));
  socket.on('respondTruco',r=>act('respondTruco',r));
  socket.on('callEnvido',type=>act('callEnvido',type||'envido'));
  socket.on('respondEnvido',w=>act('respondEnvido',w===true));
  socket.on('fold',()=>act('fold'));

  socket.on('requestRematch',cb=>{
    const roomCode=socket.data.room,g=rooms.get(roomCode);
    if(!g)return safeCb(cb,{ok:false,error:'La sala ya no existe'});
    if(g.phase!=='ended')return safeCb(cb,{ok:false,error:'La partida todavía no terminó'});
    if(!g.players[socket.id])return safeCb(cb,{ok:false,error:'Jugador inválido'});
    if(!g.rematchReady.includes(socket.id)){g.rematchReady.push(socket.id);emitInteraction(g,{from:socket.id,name:g.players[socket.id].name,team:g.players[socket.id].team,kind:'rematch',text:'Pidió revancha',ts:Date.now()});}
    safeCb(cb,{ok:true,readyCount:g.rematchReady.length,max:g.order.length});
    if(g.rematchReady.length===g.order.length){
      clearTimer(expiryTimers,roomCode);logic.restartMatch(g);io.to(roomCode).emit('rematchStarted',{matchNumber:g.matchNumber});emitRoom(g);
    }else emitRoom(g);
  });

  socket.on('chatMessage',(payload,cb)=>{
    const roomCode=socket.data.room,g=rooms.get(roomCode);if(!g||!g.players[socket.id])return safeCb(cb,{ok:false,error:'No estás en una sala'});
    const now=Date.now();if(now-(socket.data.lastChatAt||0)<CHAT_RATE_MS)return safeCb(cb,{ok:false,error:'Esperá un instante antes de enviar otro mensaje'});
    const text=cleanChatText(payload&&typeof payload==='object'?payload.text:payload);if(!text)return safeCb(cb,{ok:false,error:'Mensaje vacío'});
    socket.data.lastChatAt=now;const msg={from:socket.id,name:g.players[socket.id].name,text,ts:now};roomLog(g,msg);io.to(roomCode).emit('chatMessage',msg);safeCb(cb,{ok:true});
  });

  socket.on('emote',name=>{
    const roomCode=socket.data.room,g=rooms.get(roomCode);if(!g||!g.players[socket.id]||!VALID_EMOTES.has(name))return;
    const now=Date.now();if(now-(socket.data.lastEmoteAt||0)<350)return;socket.data.lastEmoteAt=now;
    socket.to(roomCode).emit('emote',{from:socket.id,name});
  });
  socket.on('leaveRoom',cb=>{leaveCurrentRoom(socket,'left');safeCb(cb,{ok:true});});

  socket.on('disconnect',reason=>{
    const roomCode=socket.data.room,g=rooms.get(roomCode);if(!g||!g.players[socket.id])return;
    socket.to(roomCode).emit('opponentConnectionLost',{graceMs:ROOM_GRACE_MS,playerId:socket.id,playerName:g.players[socket.id].name});
    clearDisconnect(roomCode,socket.id);
    disconnectTimers.set(dkey(roomCode,socket.id),setTimeout(()=>{
      const current=rooms.get(roomCode);if(!current||!current.players[socket.id])return;
      if(current.phase==='waiting')removeWaitingPlayer(roomCode,socket.id,'disconnect_timeout');
      else closeRoom(roomCode,socket.id,'opponentLeft',{reason:'disconnect_timeout',playerId:socket.id});
    },ROOM_GRACE_MS));
  });
});

server.listen(PORT,()=>console.log('Truco Argentino listo en http://localhost:'+PORT));
