/**
 * Saved match restore prompt.
 */
(function () {
  'use strict';

  window.LudoApp.register('save-resume', function (App) {
    const savedGame = App.game.loadSave();
    if (!savedGame) return;

    App.setDisplay(App.dom.resumeModal, 'flex');

    const handleDiscard = function () {
      App.ui.playClick();
      App.setDisplay(App.dom.resumeModal, 'none');
      App.game.clearSave();
      App.ui.showMainMenu();
    };

    const yesBtn = App.byId('btn-resume-yes');
    if (yesBtn) {
      yesBtn.onclick = function () {
        App.ui.playClick();
        App.setDisplay(App.dom.resumeModal, 'none');
        App.game.restoreGame(savedGame);
        App.ui.startGameScreen();
      };
    }

    const noBtn = App.byId('btn-resume-no');
    if (noBtn) {
      noBtn.onclick = function () {
        App.ui.playClick();
        App.setDisplay(App.dom.resumeModal, 'none');
        App.game.clearSave();
        if (App.dom.modeSetupModal) {
          App.setDisplay(App.dom.modeSetupModal, 'flex');
        } else {
          App.ui.showMainMenu();
        }
      };
    }

    const discardBtn = App.byId('btn-resume-discard');
    if (discardBtn) {
      discardBtn.onclick = handleDiscard;
    }

    const closeTopBtn = App.byId('btn-close-resume-top');
    if (closeTopBtn) {
      closeTopBtn.onclick = handleDiscard;
    }
  });
})();
