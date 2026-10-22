/**
 * Profile and avatar selection.
 */
(function () {
  'use strict';

  window.LudoApp.register('profile', function (App) {
    const modal = App.byId('modal-profile');
    let currentAvatar = localStorage.getItem('ludoSpark.avatar') || 'assets/avatars/avatar1.jpg';
    if (currentAvatar.indexOf('/') === -1) currentAvatar = 'assets/avatars/' + currentAvatar;

    const setAvatar = function (src) {
      currentAvatar = src;
      try { localStorage.setItem('ludoSpark.avatar', src); } catch (err) { /* ignore */ }

      const profileImg = document.querySelector('.profile-avatar-img');
      if (profileImg) profileImg.src = src;
      const modalImg = App.byId('profile-modal-img');
      if (modalImg) modalImg.src = src;
      const p1Img = document.querySelector('#avatar-p1 img');
      if (p1Img) p1Img.src = src;

      ['1', '2', '3', '4'].forEach(function (id) {
        const el = App.byId('select-avatar-' + id);
        if (el) el.classList.toggle('active', el.getAttribute('src') === src);
      });
    };

    setAvatar(currentAvatar);

    const openBtn = App.byId('menu-btn-profile');
    if (openBtn) {
      openBtn.onclick = function () {
        App.ui.playClick();
        App.setDisplay(modal, 'flex');
      };
    }

    const closeBtn = App.byId('btn-close-profile');
    if (closeBtn) {
      closeBtn.onclick = function () {
        App.ui.playClick();
        App.setDisplay(modal, 'none');
      };
    }

    ['1', '2', '3', '4'].forEach(function (id) {
      const el = App.byId('select-avatar-' + id);
      if (el) {
        el.onclick = function () {
          App.ui.playClick();
          setAvatar(el.getAttribute('src'));
        };
      }
    });

    App.profile = { setAvatar: setAvatar, getAvatar: function () { return currentAvatar; } };
  });
})();
