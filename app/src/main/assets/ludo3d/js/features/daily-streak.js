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
    let lastClaimDate = localStorage.getItem('ludoSpark.lastClaimDate') || '';
    const today = new Date().toDateString();

    const updateEntry = function () {
      const claimed = lastClaimDate === today;
      const status = App.byId('daily-status-text');
      if (status) status.innerText = claimed ? 'Claimed' : 'Daily';
      const claim = App.byId('btn-claim-streak');
      if (claim) {
        claim.disabled = claimed;
        claim.innerText = claimed ? 'CLAIMED TODAY' : "CLAIM TODAY'S REWARD!";
        claim.classList.toggle('btn-claimed', claimed);
      }
    };

    const openCalendar = function () {
      App.ui.playClick();
      App.setDisplay(modal, 'flex');
    };

    const menuBtn = App.byId('menu-btn-daily');
    if (menuBtn) menuBtn.onclick = openCalendar;

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
        if (lastClaimDate === today) {
          App.setDisplay(modal, 'none');
          App.ui.toast('Today\'s streak reward is already claimed.');
          return;
        }

        const claimedDay = streakDay;
        const reward = rewards[(claimedDay - 1) % 7];
        if (claimedDay === 4) {
          App.wallet.addGems(reward);
        } else {
          App.wallet.addCoins(reward);
        }
        lastClaimDate = today;
        localStorage.setItem('ludoSpark.lastClaimDate', today);
        localStorage.setItem('ludoSpark.streakDay', (claimedDay % 7) + 1);
        streakDay = (claimedDay % 7) + 1;
        App.setDisplay(modal, 'none');
        updateEntry();
        App.ui.toast('Day ' + claimedDay + ' reward claimed: +' + reward.toLocaleString() + (claimedDay === 4 ? ' Gems' : ' Coins'), 'success', 3400);
      };
    }

    updateEntry();
    if (lastClaimDate !== today) {
      setTimeout(function () {
        if (App.dom.mainMenuEl && App.dom.mainMenuEl.style.display !== 'none') {
          App.ui.toast('Daily check-in is ready.', 'info', 3000);
        }
      }, 1400);
    }
  });
})();
