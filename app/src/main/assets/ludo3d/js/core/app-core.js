/**
 * Ludo Spark - shared application core.
 * Every feature module registers itself here and receives this namespace.
 */
(function () {
  'use strict';

  const App = window.LudoApp = window.LudoApp || {};
  App.modules = App.modules || {};
  App.register = function (name, init) {
    App.modules[name] = init;
  };
  App.byId = function (id) {
    return document.getElementById(id);
  };
  App.setDisplay = function (el, display) {
    if (el) el.style.display = display;
  };

  App.boot = function () {
    const order = [
      'settings',
      'system-logs',
      'menu',
      'seven-up',
      'daily-streak',
      'tournament',
      'profile',
      'quests',
      'emoji',
      'rewards',
      'spin-wheel',
      'navigation',
      'inventory',
      'pause-menu',
      'post-game',
      'save-resume',
      'dice',
      'hud'
    ];

    order.forEach(function (name) {
      const init = App.modules[name];
      if (!init) return;
      try {
        init(App);
      } catch (err) {
        console.error('[LudoApp] Failed to initialize module: ' + name, err);
      }
    });

    if (App.dice && App.dice.renderIcon) App.dice.renderIcon(6);
    App.game.notifyUI();
  };

  window.addEventListener('DOMContentLoaded', function () {
    const game = new LudoGame();
    window.ludoGame = game;
    App.game = game;

    App.dom = {
      mainMenuEl: App.byId('main-menu'),
      uiOverlayEl: App.byId('ui-overlay'),
      diceSlot: App.byId('dice-slot'),
      soundBtn: App.byId('btn-sound'),
      cameraBtn: App.byId('btn-camera'),
      rulesModal: App.byId('modal-rules'),
      modeSetupModal: App.byId('modal-mode-setup'),
      winnerModal: App.byId('modal-winner'),
      pauseModal: App.byId('modal-pause'),
      resumeModal: App.byId('modal-resume'),
      settingsModal: App.byId('modal-menu-settings'),
      spinModal: App.byId('modal-spin-wheel'),
      mailModal: App.byId('modal-mail'),
      shopModal: App.byId('modal-shop'),
      navInfoModal: App.byId('modal-nav-info')
    };

    const wallet = App.wallet = {
      coins: parseInt(localStorage.getItem('ludoSpark.coins') || '2550', 10),
      gems: parseInt(localStorage.getItem('ludoSpark.gems') || '50', 10),
      updateUI: function () {
        const coinEl = App.byId('menu-coin-count');
        const gemEl = App.byId('menu-diamond-count');
        if (coinEl) coinEl.innerText = wallet.coins.toLocaleString();
        if (gemEl) gemEl.innerText = wallet.gems.toLocaleString();
        localStorage.setItem('ludoSpark.coins', wallet.coins);
        localStorage.setItem('ludoSpark.gems', wallet.gems);
      },
      addCoins: function (amt) {
        wallet.coins += amt;
        wallet.updateUI();
        if (window.soundEngine) window.soundEngine.playTokenHome();
      },
      addGems: function (amt) {
        wallet.gems += amt;
        wallet.updateUI();
        if (window.soundEngine) window.soundEngine.playTokenHome();
      }
    };
    wallet.updateUI();
    window.addCoins = wallet.addCoins;
    window.addGems = wallet.addGems;

    let diceInputLockUntil = 0;
    let toastEl = null;
    let toastTimer = null;
    const playClick = function () {
      if (window.soundEngine) window.soundEngine.playButtonClick();
    };
    const showToast = function (message, tone, duration) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'app-toast';
        toastEl.className = 'app-toast';
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = message;
      toastEl.setAttribute('data-tone', tone || 'info');
      toastEl.classList.remove('is-visible');
      void toastEl.offsetWidth;
      toastEl.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toastEl.classList.remove('is-visible');
      }, duration || 2800);
    };
    const showMainMenu = function () {
      game.stopRunning();
      App.setDisplay(App.dom.mainMenuEl, 'flex');
      App.setDisplay(App.dom.uiOverlayEl, 'none');
      App.setDisplay(App.dom.pauseModal, 'none');
      App.setDisplay(App.dom.winnerModal, 'none');
      if (window.SysLogs) window.SysLogs.push('lifecycle', 'Main menu shown');
    };
    const startGameScreen = function () {
      App.setDisplay(App.dom.mainMenuEl, 'none');
      App.setDisplay(App.dom.uiOverlayEl, 'flex');
      diceInputLockUntil = performance.now() + 700;
      game.startRunning();
      if (window.SysLogs) {
        window.SysLogs.push('game', 'Match started: mode=' + game.gameMode +
          ', players=' + game.numPlayers + ', difficulty=' + game.difficulty);
      }
    };
    const onAppBackground = function () {
      if (window.SysLogs) window.SysLogs.push('lifecycle', 'App moved to background');
      game.pauseForBackground();
      if (window.soundEngine && window.soundEngine.stopBGM) window.soundEngine.stopBGM();
    };
    const onAppForeground = function () {
      if (window.SysLogs) window.SysLogs.push('lifecycle', 'App returned to foreground');
      game.resumeFromBackground();
    };
    window.onAppBackground = onAppBackground;
    window.onAppForeground = onAppForeground;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) onAppBackground();
      else onAppForeground();
    });
    const openPauseMenu = function () {
      if (game.state === 'GAME_OVER') return;
      if (App.dom.uiOverlayEl.style.display !== 'none') {
        App.setDisplay(App.dom.pauseModal, 'flex');
      }
    };

    App.ui = {
      playClick: playClick,
      toast: showToast,
      showMainMenu: showMainMenu,
      startGameScreen: startGameScreen,
      openPauseMenu: openPauseMenu,
      lockDice: function (ms) {
        diceInputLockUntil = performance.now() + ms;
      },
      isDiceLocked: function () {
        return performance.now() < diceInputLockUntil;
      }
    };
    window.openPauseMenu = openPauseMenu;
    window.showToast = showToast;

    App.setup = {
      players: 4,
      vsBot: true,
      difficulty: game.difficulty || 'normal'
    };

    App.boot();
  });
})();
