/**
 * Full-screen menu page navigation and info popup.
 */
(function () {
  'use strict';

  window.LudoApp.register('navigation', function (App) {
    const tabs = ['home', 'event', 'adda', 'inventory', 'social'];

    const openPage = function (pageName) {
      tabs.forEach(function (tab) {
        const pageEl = App.byId('page-' + tab);
        const tabBtn = App.byId('nav-tab-' + tab);
        if (pageEl) pageEl.classList.toggle('active', tab === pageName);
        if (tabBtn) tabBtn.classList.toggle('active', tab === pageName);
      });
    };

    const bind = function (id, fn) {
      const el = App.byId(id);
      if (el) el.onclick = fn;
    };

    bind('nav-tab-home', function () { App.ui.playClick(); openPage('home'); });
    bind('nav-tab-event', function () { App.ui.playClick(); openPage('event'); });
    bind('nav-tab-adda', function () { App.ui.playClick(); openPage('adda'); });
    bind('nav-tab-inventory', function () {
      App.ui.playClick();
      openPage('inventory');
      if (App.inventory) App.inventory.render('pawns');
    });
    bind('nav-tab-social', function () { App.ui.playClick(); openPage('social'); });

    const openInfo = function (title, desc, icon) {
      App.ui.playClick();
      const titleEl = App.byId('nav-info-title');
      const descEl = App.byId('nav-info-desc');
      const iconEl = App.byId('nav-info-icon');
      if (titleEl) titleEl.innerText = title;
      if (descEl) descEl.innerText = desc;
      if (iconEl) iconEl.innerText = icon || '✨';
      App.setDisplay(App.dom.navInfoModal, 'flex');
    };

    bind('btn-close-nav-info', function () {
      App.ui.playClick();
      App.setDisplay(App.dom.navInfoModal, 'none');
    });

    App.nav = { openPage: openPage, openInfo: openInfo };
    window.openNavInfo = openInfo;
  });
})();
