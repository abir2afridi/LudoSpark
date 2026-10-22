/**
 * Post-game actions.
 */
(function () {
  'use strict';

  window.LudoApp.register('post-game', function (App) {
    const playAgain = App.byId('btn-play-again');
    if (!playAgain) return;

    playAgain.onclick = function () {
      App.ui.playClick();
      App.setDisplay(App.dom.winnerModal, 'none');
      const botCount = App.game.playerConfigs.filter(function (cfg) { return cfg.isAI; }).length;
      App.game.newGame(App.game.numPlayers, botCount, App.game.difficulty);
      App.ui.startGameScreen();
    };
  });
})();
