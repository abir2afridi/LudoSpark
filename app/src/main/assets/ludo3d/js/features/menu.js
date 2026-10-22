/**
 * Main menu / match setup: player count, vs-bot, difficulty, mode cards.
 */
(function () {
  'use strict';

  window.LudoApp.register('menu', function (App) {
    const setup = App.setup;
    const dom = App.dom;
    const game = App.game;

    const setPlayers = function (count) {
      setup.players = count;
      ['opt-2p', 'opt-3p', 'opt-4p'].forEach(function (id, idx) {
        const btn = App.byId(id);
        if (btn) btn.style.background = (idx + 2 === count) ? '#3B82F6' : '#1E293B';
      });
    };

    const setVsBot = function (value) {
      setup.vsBot = value;
      const botBtn = App.byId('opt-vs-bot');
      const humanBtn = App.byId('opt-pass-play');
      if (botBtn) botBtn.style.background = value ? '#3B82F6' : '#1E293B';
      if (humanBtn) humanBtn.style.background = value ? '#1E293B' : '#3B82F6';
    };

    const setDifficulty = function (level) {
      setup.difficulty = level;
      [['opt-easy', 'easy'], ['opt-normal', 'normal'], ['opt-hard', 'hard']].forEach(function (pair) {
        const btn = App.byId(pair[0]);
        if (btn) btn.style.background = (pair[1] === level) ? '#3B82F6' : '#1E293B';
      });
    };

    const openModeSetup = function (title, vsBotDefault) {
      App.ui.playClick();
      const titleEl = App.byId('mode-setup-title');
      if (titleEl) titleEl.innerText = title;
      setVsBot(vsBotDefault !== false);
      App.setDisplay(dom.modeSetupModal, 'flex');
    };

    const bindClick = function (id, fn) {
      const el = App.byId(id);
      if (el) el.onclick = fn;
    };

    bindClick('opt-2p', function () { App.ui.playClick(); setPlayers(2); });
    bindClick('opt-3p', function () { App.ui.playClick(); setPlayers(3); });
    bindClick('opt-4p', function () { App.ui.playClick(); setPlayers(4); });
    bindClick('opt-vs-bot', function () { App.ui.playClick(); setVsBot(true); });
    bindClick('opt-pass-play', function () { App.ui.playClick(); setVsBot(false); });
    bindClick('opt-easy', function () { App.ui.playClick(); setDifficulty('easy'); });
    bindClick('opt-normal', function () { App.ui.playClick(); setDifficulty('normal'); });
    bindClick('opt-hard', function () { App.ui.playClick(); setDifficulty('hard'); });

    bindClick('mode-btn-online', function () { openModeSetup('🌍 Online Ludo Room', true); });
    bindClick('mode-btn-teamup', function () { openModeSetup('⚔️ Team Up 2v2 Match', true); });
    bindClick('mode-btn-friends', function () { openModeSetup('❤️ Friends Private Table', false); });
    bindClick('mode-btn-computer', function () { openModeSetup('📱 Vs Computer', true); });
    bindClick('mode-btn-passplay', function () { openModeSetup('🧑‍🤝‍🧑 Pass & Play', false); });

    bindClick('mode-btn-snake', function () {
      App.ui.playClick();
      game.newSnakeLadderGame(setup.players, setup.vsBot ? setup.players - 1 : 0);
      App.ui.startGameScreen();
    });

    bindClick('btn-start-game', function () {
      App.ui.playClick();
      const botCount = setup.vsBot ? setup.players - 1 : 0;
      game.newGame(setup.players, botCount, setup.difficulty);
      App.setDisplay(dom.modeSetupModal, 'none');
      App.ui.startGameScreen();
    });

    bindClick('btn-cancel-game', function () {
      App.ui.playClick();
      App.setDisplay(dom.modeSetupModal, 'none');
    });

    bindClick('btn-restart', function () {
      App.ui.playClick();
      App.setDisplay(dom.modeSetupModal, 'flex');
    });

    setPlayers(setup.players);
    setVsBot(setup.vsBot);
    setDifficulty(setup.difficulty);

    App.menu = {
      setPlayers: setPlayers,
      setVsBot: setVsBot,
      setDifficulty: setDifficulty,
      openModeSetup: openModeSetup
    };
  });
})();
