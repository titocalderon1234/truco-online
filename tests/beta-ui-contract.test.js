const assert=require('assert');
const fs=require('fs');
const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../client/index.html'),'utf8');
const main=fs.readFileSync(path.join(__dirname,'../client/main.js'),'utf8');

// Buttons that are always visible must have a real event route in main.js.
const wiredIds=['offlineBtn','enterCityBtn','onlineBtn','createRoom','joinRoom','editProfile','avatarsBtn','saveProfileBtn','rulesBtn','rankBtn','settingsBtn','emotesBtn','closeModal','exitGame'];
for(const id of wiredIds){
  assert(html.includes(`id="${id}"`),`missing UI control #${id}`);
  const assign=new RegExp(`\\$\\('#${id.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}'\\)\\.(?:onclick|onkeydown)=`);
  assert(assign.test(main),`UI control #${id} is present but not wired`);
}
assert(main.includes("$$('[data-online-mode]').forEach"),'online mode buttons are not wired');
assert(main.includes("$$('.close[data-to]').forEach"),'screen close/back buttons are not wired');

// Dynamic buttons emitted by HTML strings must point to globally exposed handlers.
for(const fn of ['startCampaignBot','returnToCityRoute','retryCampaignBot','callTruco','respondTruco','callEnvido','respondEnvido','fold','copyRoomCode','requestOnlineRematch','leaveOnlineAndMenu']){
  assert(main.includes(`window.${fn}=`),`dynamic onclick handler window.${fn} is missing`);
}

console.log('OK beta UI contract: botones estáticos y dinámicos conectados');
