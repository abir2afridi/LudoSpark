/**
 * Dice UI: 3D WebGL die, SVG fallback, corner placement and roll input.
 */
(function () {
  'use strict';

  window.LudoApp.register('dice', function (App) {
    const slot = App.dom.diceSlot;
    const display = App.dom.diceDisplay;
    if (!slot) return;

    const PIPS = {
      1: [[20, 19]],
      2: [[13, 12], [27, 26]],
      3: [[13, 12], [20, 19], [27, 26]],
      4: [[13, 12], [27, 12], [13, 26], [27, 26]],
      5: [[13, 12], [27, 12], [20, 19], [13, 26], [27, 26]],
      6: [[13, 11], [27, 11], [13, 19], [27, 19], [13, 27], [27, 27]]
    };

    const renderIcon = function (value) {
      if (!display) return;
      const v = PIPS[value] ? Number(value) : 6;
      const dots = PIPS[v].map(function (point) {
        return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="2.7" fill="#0F172A"/>';
      }).join('');

      display.innerHTML =
        '<svg width="42" height="42" viewBox="0 0 40 40" aria-hidden="true">' +
          '<defs>' +
            '<linearGradient id="diceFaceGrad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="#FFFFFF"/>' +
              '<stop offset="100%" stop-color="#CBD5E1"/>' +
            '</linearGradient>' +
          '</defs>' +
          '<rect x="6" y="7" width="30" height="30" rx="7" fill="#64748B"/>' +
          '<rect x="4" y="4" width="30" height="30" rx="7" fill="url(#diceFaceGrad)" stroke="#94A3B8" stroke-width="1.2"/>' +
          dots +
        '</svg>';
    };

    renderIcon(6);

    if (window.UIDice3D) {
      window.uiDice3D = new UIDice3D('dice-slot');
      if (App.game.diceSkin) window.uiDice3D.setSkin(App.game.diceSkin);
    }

    const rollTo = function (value) {
      if (window.uiDice3D && window.uiDice3D.rollTo) {
        window.uiDice3D.rollTo(value);
      } else {
        renderIcon(value);
      }
    };

    const setSkin = function (skin) {
      if (window.uiDice3D && window.uiDice3D.setSkin) window.uiDice3D.setSkin(skin);
    };

    const setRolling = function (rolling) {
      slot.classList.toggle('rolling', !!rolling);
    };

    const attachToCorner = function (playerIndex) {
      const corner = App.byId('corner-p' + (playerIndex + 1));
      if (corner && slot.parentElement !== corner) corner.appendChild(slot);
    };

    const setPointing = function (visible) {
      const hand = App.byId('pointing-hand');
      if (hand) hand.style.display = visible ? 'block' : 'none';
    };

    const tryRoll = function () {
      if (App.ui.isDiceLocked()) return;
      const config = App.game.playerConfigs[App.game.activePlayerIndex];
      if (App.game.state === 'WAIT_ROLL' && config && !config.isAI) {
        App.game.handleRoll();
      }
    };

    slot.addEventListener('pointerdown', function (event) {
      if (event.cancelable) event.preventDefault();
      tryRoll();
    }, { passive: false });
    slot.addEventListener('click', tryRoll);

    App.dice = {
      renderIcon: renderIcon,
      rollTo: rollTo,
      setSkin: setSkin,
      setRolling: setRolling,
      attachToCorner: attachToCorner,
      setPointing: setPointing,
      tryRoll: tryRoll
    };
  });
})();
