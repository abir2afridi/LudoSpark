/**
 * Settings feature: sound toggle, camera preset, volume sliders, exit.
 */
(function () {
  'use strict';

  window.LudoApp.register('settings', function (App) {
    const game = App.game;
    const dom = App.dom;

    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('ludoSpark.sound') === '0') {
        window.soundEngine.enabled = false;
      }
    } catch (err) { /* ignore */ }

    const syncLabels = function () {
      const setLabel = function (id, text) {
        const el = App.byId(id);
        if (el) el.innerText = text;
      };
      setLabel('setting-sound-label', window.soundEngine.enabled ? 'On' : 'Off');
      setLabel('setting-camera-label', game.currentPreset === 'top' ? 'Top-Down' : '3D View');
      const diff = game.difficulty || 'normal';
      setLabel('setting-diff-label', diff.charAt(0).toUpperCase() + diff.slice(1));
      if (dom.soundBtn) dom.soundBtn.innerText = window.soundEngine.enabled ? '🔊' : '🔇';
      if (dom.cameraBtn) dom.cameraBtn.innerText = game.currentPreset === 'top' ? '📷' : '🗺';
    };

    const setSoundEnabled = function (on) {
      window.soundEngine.enabled = on;
      try { localStorage.setItem('ludoSpark.sound', on ? '1' : '0'); } catch (err) { /* ignore */ }
      syncLabels();
    };

    const applyCameraPreset = function (next) {
      game.setCameraPreset(next);
      try { localStorage.setItem('ludoSpark.camera', next); } catch (err) { /* ignore */ }
      syncLabels();
    };

    const settingsClose = App.byId('btn-setting-close');
    if (settingsClose) {
      settingsClose.onclick = function () {
        App.ui.playClick();
        App.setDisplay(dom.settingsModal, 'none');
      };
    }

    const settingsCamera = App.byId('btn-setting-camera');
    if (settingsCamera) {
      settingsCamera.onclick = function () {
        App.ui.playClick();
        applyCameraPreset(game.currentPreset === 'top' ? 'fit3d' : 'top');
      };
    }

    const difficulties = ['easy', 'normal', 'hard'];
    const cycleDifficulty = function () {
      const current = difficulties.indexOf(game.difficulty);
      const next = difficulties[(current + 1) % difficulties.length];
      game.difficulty = next;
      App.setup.difficulty = next;
      try { localStorage.setItem('ludoSpark.difficulty', next); } catch (err) { /* ignore */ }
      if (App.menu && App.menu.setDifficulty) App.menu.setDifficulty(next);
      syncLabels();
      App.ui.toast('AI Difficulty: ' + next.charAt(0).toUpperCase() + next.slice(1));
    };

    const settingsDifficulty = App.byId('btn-setting-difficulty');
    if (settingsDifficulty) {
      settingsDifficulty.onclick = function () {
        App.ui.playClick();
        cycleDifficulty();
      };
    }

    const sfxSlider = App.byId('slider-sfx-vol');
    if (sfxSlider && window.soundEngine) {
      sfxSlider.value = window.soundEngine.sfxVolume;
      const sfxLabel = App.byId('label-sfx-vol');
      if (sfxLabel) sfxLabel.innerText = Math.round(window.soundEngine.sfxVolume * 100) + '%';
      sfxSlider.oninput = function (e) {
        const val = parseFloat(e.target.value);
        window.soundEngine.setSFXVolume(val);
        if (sfxLabel) sfxLabel.innerText = Math.round(val * 100) + '%';
      };
    }

    const bgmSlider = App.byId('slider-bgm-vol');
    if (bgmSlider && window.soundEngine) {
      bgmSlider.value = window.soundEngine.bgmVolume;
      const bgmLabel = App.byId('label-bgm-vol');
      if (bgmLabel) bgmLabel.innerText = Math.round(window.soundEngine.bgmVolume * 100) + '%';
      bgmSlider.oninput = function (e) {
        const val = parseFloat(e.target.value);
        window.soundEngine.setBGMVolume(val);
        if (bgmLabel) bgmLabel.innerText = Math.round(val * 100) + '%';
      };
    }

    const exitBtn = App.byId('btn-setting-exit');
    if (exitBtn) {
      exitBtn.onclick = function () {
        App.ui.playClick();
        if (window.AndroidBridge && window.AndroidBridge.exitApp) {
          window.AndroidBridge.exitApp();
        }
      };
    }

    if (dom.soundBtn) {
      dom.soundBtn.onclick = function () {
        App.ui.playClick();
        setSoundEnabled(!window.soundEngine.enabled);
      };
    }

    if (dom.cameraBtn) {
      dom.cameraBtn.onclick = function () {
        App.ui.playClick();
        applyCameraPreset(game.currentPreset === 'top' ? 'fit3d' : 'top');
      };
    }

    syncLabels();
    App.settings = {
      syncLabels: syncLabels,
      setSoundEnabled: setSoundEnabled,
      applyCameraPreset: applyCameraPreset,
      cycleDifficulty: cycleDifficulty
    };
  });
})();
