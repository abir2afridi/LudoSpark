/**
 * 7-day daily check-in streak.
 */
(function () {
  'use strict';

  window.LudoApp.register('daily-streak', function (App) {
    const modal = App.byId('modal-daily-calendar');
    if (!modal) return;

    const rewards = [500, 1000, 1500, 50, 3000, 5000, 10000];
    let streakDay = parseInt(localStorage.getItem('ludoSpark.streakDay') || '1', 10);
    const lastClaimDate = localStorage.getItem('ludoSpark.lastClaimDate') || '';
    const today = new Date().toDateString();

    if (lastClaimDate !== today) {
      setTimeout(function () {
        App.setDisplay(modal, 'flex');
      }, 800);
    }

    const closeBtn = App.byId('btn-close-streak');
    if (closeBtn) {
      closeBtn.onclick = function () {
        App.ui.playClick();
        App.setDisplay(modal, 'none');
      };
    }

    const claimBtn = App.byId('btn-claim-streak');
    if (claimBtn) {
      claimBtn.onclick = function () {
        App.ui.playClick();
        const reward = rewards[(streakDay - 1) % 7];
        if (streakDay === 4) {
          App.wallet.addGems(reward);
        } else {
          App.wallet.addCoins(reward);
        }
        localStorage.setItem('ludoSpark.lastClaimDate', today);
        localStorage.setItem('ludoSpark.streakDay', (streakDay % 7) + 1);
        App.setDisplay(modal, 'none');
        alert('🎁 Day ' + streakDay + ' Daily Streak Reward Claimed!');
      };
    }
  });
})();
