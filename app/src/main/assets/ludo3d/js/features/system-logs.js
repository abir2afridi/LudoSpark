/**
 * System Logs page: renders JS errors and native crash log.
 */
(function () {
  'use strict';

  window.LudoApp.register('system-logs', function (App) {
    const page = App.byId('system-logs-page');
    const list = App.byId('system-logs-list');
    if (!page || !list) return;

    const escapeHtml = function (value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const render = function () {
      const entries = (window.SysLogs && window.SysLogs.get()) || [];
      const nativeLog = (window.SysLogs && window.SysLogs.native()) || '';
      let html = '';

      if (nativeLog) {
        html += '<div class="log-entry error"><div class="log-meta">ANDROID / APK</div>' +
          '<div class="log-msg">' + escapeHtml(nativeLog) + '</div></div>';
      }

      entries.forEach(function (entry) {
        const cls = (entry.type.indexOf('error') >= 0 || entry.type === 'promise') ? 'error'
          : (entry.type === 'console.warn' ? 'warn' : 'info');
        html += '<div class="log-entry ' + cls + '">' +
          '<div class="log-meta">' + escapeHtml(entry.t) + ' · ' + escapeHtml(entry.type) + '</div>' +
          '<div class="log-msg">' + escapeHtml(entry.message) + '</div>' +
          (entry.stack ? '<pre>' + escapeHtml(entry.stack) + '</pre>' : '') +
          '</div>';
      });

      list.innerHTML = html || '<p class="log-empty">No errors logged yet 🎉</p>';
    };

    const openBtn = App.byId('btn-open-system-logs');
    if (openBtn) {
      openBtn.onclick = function () {
        App.ui.playClick();
        render();
        App.setDisplay(page, 'flex');
      };
    }

    ['btn-close-system-logs', 'btn-logs-close-bottom'].forEach(function (id) {
      const btn = App.byId(id);
      if (btn) {
        btn.onclick = function () {
          App.ui.playClick();
          App.setDisplay(page, 'none');
        };
      }
    });

    const clearBtn = App.byId('btn-clear-logs');
    if (clearBtn) {
      clearBtn.onclick = function () {
        App.ui.playClick();
        if (window.SysLogs) window.SysLogs.clear();
        try {
          if (window.AndroidBridge && window.AndroidBridge.clearCrashLogs) {
            window.AndroidBridge.clearCrashLogs();
          }
        } catch (err) { /* ignore */ }
        render();
      };
    }

    const copyBtn = App.byId('btn-copy-logs');
    if (copyBtn) {
      copyBtn.onclick = function () {
        App.ui.playClick();
        const text = window.SysLogs ? window.SysLogs.formatAll() : '';
        const done = function () { alert('📄 Logs copied to clipboard!'); };
        const fallbackCopy = function () {
          const area = document.createElement('textarea');
          area.value = text;
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); done(); } catch (err) { /* ignore */ }
          document.body.removeChild(area);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      };
    }

    if (window.SysLogs) window.SysLogs.push('info', 'App UI initialized');
    App.systemLogs = { render: render };
  });
})();
