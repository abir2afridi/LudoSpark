/**
 * Lucky spin wheel.
 */
(function () {
  'use strict';

  window.LudoApp.register('spin-wheel', function (App) {
    const modal = App.byId('modal-spin-wheel');
    const canvas = App.byId('spin-wheel-canvas');
    if (!modal || !canvas) return;

    const prizes = [
      { label: '500', coins: 500 },
      { label: '1,000', coins: 1000 },
      { label: '2,500', coins: 2500 },
      { label: '5,000', coins: 5000 },
      { label: '100 Gems', gems: 100 },
      { label: '1,200', coins: 1200 }
    ];
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#EF4444'];
    const arc = (Math.PI * 2) / prizes.length;
    let angle = 0;
    let spinning = false;

    const draw = function () {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 220, 220);

      for (let i = 0; i < prizes.length; i++) {
        const start = i * arc;
        ctx.beginPath();
        ctx.fillStyle = colors[i];
        ctx.moveTo(110, 110);
        ctx.arc(110, 110, 105, start, start + arc);
        ctx.lineTo(110, 110);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FEF3C7';
        ctx.stroke();

        ctx.save();
        ctx.translate(110, 110);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(prizes[i].label, 92, 4);
        ctx.restore();
      }
    };

    const openBtn = App.byId('menu-btn-spin');
    if (openBtn) {
      openBtn.onclick = function () {
        App.ui.playClick();
        App.setDisplay(modal, 'flex');
        draw();
      };
    }

    const closeBtn = App.byId('btn-close-spin');
    if (closeBtn) {
      closeBtn.onclick = function () {
        if (spinning) return;
        App.ui.playClick();
        App.setDisplay(modal, 'none');
      };
    }

    const spinBtn = App.byId('btn-do-spin');
    if (spinBtn) {
      spinBtn.onclick = function () {
        if (spinning) return;
        App.ui.playClick();
        spinning = true;
        spinBtn.disabled = true;
        spinBtn.innerText = 'SPINNING...';

        const prizeIndex = Math.floor(Math.random() * prizes.length);
        const pointerAngle = -Math.PI / 2;
        const jitter = (Math.random() - 0.5) * arc * 0.55;
        let target = pointerAngle - (prizeIndex + 0.5) * arc + jitter;
        while (target < angle + Math.PI * 2 * 4) target += Math.PI * 2;
        angle = target;
        canvas.style.transform = 'rotate(' + angle + 'rad)';

        setTimeout(function () {
          spinning = false;
          const prize = prizes[prizeIndex];
          let rewardText;
          if (prize.gems) {
            App.wallet.addGems(prize.gems);
            rewardText = prize.gems + ' Gems';
          } else {
            App.wallet.addCoins(prize.coins);
            rewardText = prize.coins.toLocaleString() + ' Coins';
          }
          App.ui.toast('You won ' + rewardText + '!', 'success', 3400);
          spinBtn.disabled = false;
          spinBtn.innerText = 'SPIN NOW!';
          App.setDisplay(modal, 'none');
        }, 4100);
      };
    }
  });
})();
