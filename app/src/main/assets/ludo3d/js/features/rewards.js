/**
 * Header, side rewards, mail and shop actions.
 */
(function () {
  'use strict';

  window.LudoApp.register('rewards', function (App) {
    const dom = App.dom;

    const bind = function (id, fn) {
      const el = App.byId(id);
      if (el) el.onclick = fn;
    };

    bind('menu-btn-settings', function () {
      App.ui.playClick();
      App.setDisplay(dom.settingsModal, 'flex');
    });

    bind('menu-btn-mail', function () {
      App.ui.playClick();
      App.setDisplay(dom.mailModal, 'flex');
    });

    bind('menu-btn-shop', function () {
      App.ui.playClick();
      App.setDisplay(dom.shopModal, 'flex');
    });

    bind('menu-btn-coins', function () {
      App.ui.playClick();
      App.setDisplay(dom.shopModal, 'flex');
    });

    bind('menu-btn-diamonds', function () {
      App.ui.playClick();
      App.setDisplay(dom.shopModal, 'flex');
    });

    bind('menu-btn-free-chest', function () {
      App.ui.playClick();
      App.wallet.addCoins(500);
      alert('🧰 Free Daily Chest Opened!\n+500 Coins added!');
    });

    bind('menu-btn-ad-reward', function () {
      App.ui.playClick();
      App.wallet.addCoins(1200);
      App.wallet.addGems(10);
      alert('🎬 Video Ad Watched!\n+1,200 Coins & +10 Gems added!');
    });

    bind('menu-btn-help', function () {
      App.ui.playClick();
      App.setDisplay(dom.rulesModal, 'flex');
    });

    bind('btn-claim-mail', function () {
      App.ui.playClick();
      App.wallet.addCoins(1000);
      App.setDisplay(dom.mailModal, 'none');
      alert('🎁 Mail Rewards Claimed!');
    });

    bind('btn-close-mail', function () {
      App.ui.playClick();
      App.setDisplay(dom.mailModal, 'none');
    });

    bind('btn-close-shop', function () {
      App.ui.playClick();
      App.setDisplay(dom.shopModal, 'none');
    });
  });
})();
