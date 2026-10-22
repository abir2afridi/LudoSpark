/**
 * 7 Up 7 Down mini game.
 */
(function () {
  'use strict';

  window.LudoApp.register('seven-up', function (App) {
    const modal = App.byId('modal-game-7updown');
    if (!modal) return;

    const diceFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    let category = 'down';
    let bet = 100;

    const setCategory = function (next) {
      category = next;
      [['bet-cat-down', 'down'], ['bet-cat-7', '7'], ['bet-cat-up', 'up']].forEach(function (pair) {
        const btn = App.byId(pair[0]);
        if (btn) btn.classList.toggle('active', pair[1] === next);
      });
    };

    const setBet = function (amount) {
      bet = amount;
      [['bet-amt-100', 100], ['bet-amt-500', 500], ['bet-amt-1000', 1000]].forEach(function (pair) {
        const btn = App.byId(pair[0]);
        if (btn) btn.classList.toggle('active', pair[1] === amount);
      });
    };

    const bind = function (id, fn) {
      const el = App.byId(id);
      if (el) el.onclick = fn;
    };

    bind('mode-btn-7game', function () {
      App.ui.playClick();
      App.setDisplay(modal, 'flex');
    });
    bind('btn-close-7up', function () {
      App.ui.playClick();
      App.setDisplay(modal, 'none');
    });
    bind('bet-cat-down', function () { App.ui.playClick(); setCategory('down'); });
    bind('bet-cat-7', function () { App.ui.playClick(); setCategory('7'); });
    bind('bet-cat-up', function () { App.ui.playClick(); setCategory('up'); });
    bind('bet-amt-100', function () { App.ui.playClick(); setBet(100); });
    bind('bet-amt-500', function () { App.ui.playClick(); setBet(500); });
    bind('bet-amt-1000', function () { App.ui.playClick(); setBet(1000); });

    bind('btn-roll-7up', function () {
      if (App.wallet.coins < bet) {
        App.ui.toast('Not enough coins. Claim free coins in the store.', 'error');
        return;
      }
      App.ui.playClick();
      if (window.soundEngine) window.soundEngine.playDiceTumble();

      App.wallet.coins -= bet;
      App.wallet.updateUI();

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2;

      const dice1 = App.byId('7up-dice1');
      const dice2 = App.byId('7up-dice2');
      const result = App.byId('7up-result-text');
      if (dice1) dice1.innerText = diceFaces[d1];
      if (dice2) dice2.innerText = diceFaces[d2];
      if (result) result.innerText = 'Total Sum: ' + sum;

      let won = false;
      let multiplier = 2;
      if (category === 'down' && sum < 7) { won = true; multiplier = 2; }
      else if (category === '7' && sum === 7) { won = true; multiplier = 5; }
      else if (category === 'up' && sum > 7) { won = true; multiplier = 2; }

      setTimeout(function () {
        if (won) {
          const winAmount = bet * multiplier;
          App.wallet.addCoins(winAmount);
          App.ui.toast('You won ' + winAmount.toLocaleString() + ' coins! Total: ' + sum, 'success', 3200);
        } else {
          App.ui.toast('No win this time. Dice total: ' + sum, 'error');
        }
      }, 300);
    });

    setCategory(category);
    setBet(bet);
  });
})();
