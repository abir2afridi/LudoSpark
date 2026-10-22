/**
 * 8-player knockout tournament.
 */
(function () {
  'use strict';

  window.LudoApp.register('tournament', function (App) {
    const modal = App.byId('modal-tournament-bracket');
    if (!modal) return;

    const bind = function (id, fn) {
      const el = App.byId(id);
      if (el) el.onclick = fn;
    };

    bind('mode-btn-tournament', function () {
      App.ui.playClick();
      App.setDisplay(modal, 'flex');
    });

    bind('btn-close-tourney', function () {
      App.ui.playClick();
      App.setDisplay(modal, 'none');
    });

    bind('btn-start-tourney-match', function () {
      App.ui.playClick();
      App.setDisplay(modal, 'none');
      App.game.newGame(4, 3, 'normal');
      App.ui.startGameScreen();
    });
  });
})();
