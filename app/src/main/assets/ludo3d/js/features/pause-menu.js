/**
 * In-game pause menu and navigation.
 */
(function () {
  'use strict';

  window.LudoApp.register('pause-menu', function (App) {
    const dom = App.dom;

    const bind = function (id, fn) {
      const el = App.byId(id);
      if (el) el.onclick = fn;
    };

    bind('btn-back-header', function () {
      App.ui.playClick();
      App.setDisplay(dom.pauseModal, 'flex');
    });

    bind('btn-pause-resume', function () {
      App.ui.playClick();
      App.setDisplay(dom.pauseModal, 'none');
    });

    bind('btn-pause-restart', function () {
      App.ui.playClick();
      App.setDisplay(dom.pauseModal, 'none');
      const botCount = App.game.playerConfigs.filter(function (c) { return c.isAI; }).length;
      App.game.newGame(App.game.numPlayers, botCount, App.game.difficulty);
      App.ui.startGameScreen();
    });

    bind('btn-pause-rules', function () {
      App.ui.playClick();
      App.setDisplay(dom.pauseModal, 'none');
      App.setDisplay(dom.rulesModal, 'flex');
    });

    bind('btn-pause-settings', function () {
      App.ui.playClick();
      App.setDisplay(dom.pauseModal, 'none');
      App.setDisplay(App.byId('modal-menu-settings'), 'flex');
    });

    bind('btn-pause-abort', function () {
      App.ui.playClick();
      App.game.clearSave();
      App.setDisplay(dom.pauseModal, 'none');
      App.ui.showMainMenu();
    });

    bind('btn-winner-mainmenu', function () {
      App.ui.playClick();
      App.ui.showMainMenu();
    });

    bind('btn-close-rules', function () {
      App.ui.playClick();
      App.setDisplay(dom.rulesModal, 'none');
    });
  });
})();
