/**
 * In-game HUD: player cards, turn timer, dice state and game-over handling.
 */
(function () {
  'use strict';

  window.LudoApp.register('hud', function (App) {
    const game = App.game;

    const avatarBoxes = [0, 1, 2, 3].map(function (idx) {
      return App.byId('avatar-p' + (idx + 1));
    });
    const cornerEls = [0, 1, 2, 3].map(function (idx) {
      return App.byId('corner-p' + (idx + 1));
    });

    window.onTimerUpdate = function (activePlayerId, remainingSec, totalSec) {
      const secInt = Math.ceil(remainingSec);
      const circumference = 201;
      const ratio = Math.max(0, Math.min(1, remainingSec / totalSec));
      const offset = circumference * (1 - ratio);

      [0, 1, 2, 3].forEach(function (idx) {
        const ring = App.byId('timer-ring-' + idx);
        const fill = App.byId('timer-fill-' + idx);
        const badge = App.byId('timer-badge-' + idx);

        if (idx === activePlayerId && game.timerActive) {
          if (ring) ring.style.display = 'block';
          if (badge) {
            badge.style.display = 'flex';
            badge.innerText = secInt;
          }
          if (fill) {
            fill.style.strokeDashoffset = offset;
            fill.classList.toggle('warning', secInt <= 5);
          }
          if (badge) badge.classList.toggle('warning', secInt <= 5);
        } else {
          if (ring) ring.style.display = 'none';
          if (badge) badge.style.display = 'none';
        }
      });
    };

    window.onGameStateChanged = function (data) {
      const activePlayer = data.activePlayer;
      const state = data.state;
      const currentRoll = data.currentRoll;
      const progress = data.playerProgress || [];
      const numPlayers = data.numPlayers || 4;

      cornerEls.forEach(function (el, idx) {
        if (el) el.style.display = (idx < numPlayers) ? '' : 'none';
      });

      if (App.dice) {
        App.dice.attachToCorner(activePlayer.id);
        App.dice.setPointing(state === 'WAIT_ROLL' && activePlayer.id === 0);
      }

      avatarBoxes.forEach(function (box, idx) {
        if (box) box.classList.toggle('active-turn', idx === activePlayer.id);
        if (progress[idx] === undefined) return;

        const label = 'Player ' + (idx + 1) + ' · ' + progress[idx] + '%';
        const nameBadge = App.byId('name-p' + (idx + 1));
        if (nameBadge) nameBadge.innerText = label;
        const tag = box && box.querySelector('.player-tag');
        if (tag) tag.innerText = label;
      });

      if (App.dice) {
        App.dice.setRolling(state === 'ROLLING');
        if (state === 'ROLLING') {
          App.dice.rollTo(currentRoll || Math.floor(Math.random() * 6) + 1);
        } else if (currentRoll >= 1 && currentRoll <= 6) {
          App.dice.rollTo(currentRoll);
        }
      }

      let prompt = '';
      if (state === 'WAIT_ROLL') {
        prompt = activePlayer.isAI ? 'Thinking...' : 'Your Turn: Tap Dice!';
      } else if (state === 'ROLLING') {
        prompt = 'Rolling dice...';
      } else if (state === 'WAIT_SELECT') {
        prompt = activePlayer.isAI ? 'Rolled ' + currentRoll + '!' : 'Rolled ' + currentRoll + '! Tap token on board';
      } else if (state === 'MOVING') {
        prompt = 'Moving token...';
      }

      [0, 1, 2, 3].forEach(function (idx) {
        const bubble = App.byId('bubble-p' + (idx + 1));
        if (!bubble) return;
        if (idx === activePlayer.id) {
          bubble.innerText = prompt;
          bubble.classList.add('active');
        } else {
          bubble.classList.remove('active');
        }
      });

      if (state === 'GAME_OVER') {
        const winnerName = data.finishedPlayers[0] || 'Champion';
        const title = App.byId('winner-title');
        const desc = App.byId('winner-desc');
        if (title) title.innerText = winnerName + ' Wins!';
        if (desc) desc.innerText = 'Congratulations on winning the match!';
        const stats = data.stats || {};
        const setStat = function (id, val) {
          const el = App.byId(id);
          if (el) el.innerText = (val === undefined || val === null) ? '—' : String(val);
        };
        setStat('stat-turns', stats.turns);
        setStat('stat-sixes', stats.sixes);
        setStat('stat-captures', stats.captures);
        App.setDisplay(App.dom.winnerModal, 'flex');
        App.wallet.addCoins(3000);
      }
    };

    App.hud = {
      refresh: function () { game.notifyUI(); }
    };
  });
})();
