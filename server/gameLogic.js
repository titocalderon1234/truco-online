const core=require('../client/trucoCore');
module.exports={
  ...core,
  newGame:core.newGame,
  addPlayer:core.addPlayer,
  removePlayerWaiting:core.removePlayerWaiting,
  publicState:core.publicState,
  playCard:core.playCard,
  callTruco:core.callTruco,
  respondTruco:core.respondTruco,
  callEnvido:core.callEnvido,
  respondEnvido:core.respondEnvido,
  fold:core.fold,
  nextHandIfNeeded:core.nextHandIfNeeded,
  restartMatch:core.restartMatch
};
