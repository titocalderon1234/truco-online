const assert=require('assert'),fs=require('fs'),path=require('path');
const server=fs.readFileSync(path.join(__dirname,'..','server','server.js'),'utf8');const main=fs.readFileSync(path.join(__dirname,'..','client','main.js'),'utf8');const html=fs.readFileSync(path.join(__dirname,'..','client','index.html'),'utf8');
assert(server.includes("socket.on('requestRematch'"),'servidor debe aceptar revancha');assert(server.includes('logic.restartMatch(g)'),'revancha debe reiniciar la misma sala');assert(main.includes('requestOnlineRematch'),'cliente debe tener botón de revancha');assert(main.includes('rematch.readyCount')||main.includes('rematch?.readyCount'),'debe mostrar cuántos aceptaron');
assert(html.includes('data-online-mode="2v2"')&&html.includes('data-online-mode="3v3"'),'selector online debe incluir 2v2 y 3v3');assert(main.includes('renderOnlineTeams'),'cliente debe renderizar mesas por equipos');
console.log('rematch-ui.test.js: OK · revancha y selectores 2v2/3v3 presentes');
