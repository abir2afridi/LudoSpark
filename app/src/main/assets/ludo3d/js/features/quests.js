/**
 * Daily quests.
 */
(function () {
  'use strict';

  window.LudoApp.register('quests', function (App) {
    window.claimQuest = function (id, coins) {
      App.ui.playClick();
      App.wallet.addCoins(coins);

      const btn = App.byId('btn-claim-quest' + id);
      if (btn) {
        btn.innerText = 'Claimed ✓';
        btn.classList.add('btn-claimed');
        btn.disabled = true;
      }

      const progress = App.byId('quest' + id + '-progress');
      if (progress) progress.innerText = 'Completed!';
    };
  });
})();
