/**
 * Lucky spin wheel.
 */
(function () {
  'use strict';

  window.LudoApp.register('spin-wheel', function (App) {
    const modal = App.byId('modal-spin-wheel');
    const canvas = App.byId('spin-wheel-canvas');
    if (!modal || !canvas) return;

    const prizes = ['500 🪙', '1,000 🪙', '2,500 🪙', '5,000 🪙', '100 💎', '1,200 🪙'];
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#EF4444'];
    let angle = 0;
    let spinning = false;

    const draw = function () {
      const ctx = canvas.getContext('2d');
      const arc = (Math.PI * 2) / prizes.length;
      ctx.clearRect(0, 0, 220, 220);

      for (let i = 0; i < prizes.length; i++) {
        const start = angle + i * arc;
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
        ctx.fillText(prizes[i], 92, 4);
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
        const extraRotation = Math.PI * 2 * (4 + Math.floor(Math.random() * 4));
        const randomTarget = Math.random() * Math.PI * 2;
        angle += extraRotation + randomTarget;
        canvas.style.transform = 'rotate(' + angle + 'rad)';

        setTimeout(function () {
          spinning = false;
          App.wallet.addCoins(2500);
          alert('🎉 Congratulations!\nYou won 2,500 Coins from the Spin Wheel!');
          App.setDisplay(modal, 'none');
        }, 4100);
      };
    }
  });
})();
