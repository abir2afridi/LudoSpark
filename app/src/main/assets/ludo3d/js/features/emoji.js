/**
 * In-game emoji picker, per-player chat triggers and quick voice messages.
 */
(function () {
  'use strict';

  window.LudoApp.register('emoji', function (App) {
    const panel = App.byId('emoji-picker-panel');
    let activeChatPlayer = 0;

    window.openPlayerChat = function (playerIndex) {
      App.ui.playClick();
      activeChatPlayer = playerIndex;
      if (panel) {
        App.setDisplay(panel, panel.style.display === 'flex' ? 'none' : 'flex');
      }
    };

    const toggleBtn = App.byId('btn-emoji-toggle');
    if (toggleBtn && panel) {
      toggleBtn.onclick = function () {
        window.openPlayerChat(0);
      };
    }

    const triggerBubble = function (text) {
      App.ui.playClick();
      if (panel) App.setDisplay(panel, 'none');

      const bubble = App.byId('bubble-p' + (activeChatPlayer + 1));
      if (!bubble) return;
      bubble.innerText = text;
      bubble.classList.add('active');
      setTimeout(function () {
        if (App.game && App.game.activePlayerIndex !== activeChatPlayer) {
          bubble.classList.remove('active');
        }
      }, 2400);
    };

    ['1', '2', '3', '4', '5', '6'].forEach(function (i) {
      const el = App.byId('emoji-' + i);
      if (el) el.onclick = function () { triggerBubble(el.innerText); };
    });

    ['1', '2', '3'].forEach(function (i) {
      const el = App.byId('voice-msg-' + i);
      if (el) el.onclick = function () { triggerBubble(el.innerText); };
    });

    App.emoji = {
      triggerBubble: triggerBubble,
      openPlayerChat: window.openPlayerChat
    };
  });
})();
