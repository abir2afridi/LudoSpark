/**
 * System Logs page: diagnostic log viewer and Markdown export.
 */
(function () {
  'use strict';

  window.LudoApp.register('system-logs', function (App) {
    const page = App.byId('system-logs-page');
    const list = App.byId('system-logs-list');
    if (!page || !list) return;

    let activeFilter = 'all';

    const escapeHtml = function (value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const isErrorEntry = function (entry) {
      return entry.type === 'error' || entry.type === 'promise' ||
        entry.type === 'console.error' || entry.type === 'crash' || entry.type === 'resource';
    };

    const matchesFilter = function (entry) {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'errors') return isErrorEntry(entry) || entry.type === 'console.warn';
      if (activeFilter === 'actions') {
        return entry.type === 'action' || entry.type === 'inventory' || entry.type === 'lifecycle';
      }
      if (activeFilter === 'game') return entry.type === 'game';
      return true;
    };

    const formatTime = function (iso) {
      try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch (err) {
        return iso;
      }
    };

    const getExportText = function () {
      return window.SysLogs ? window.SysLogs.formatMarkdown() : '';
    };

    const getFileName = function () {
      return window.SysLogs ? window.SysLogs.fileName() : 'LudoSpark-diagnostics.md';
    };

    const downloadFile = function (content, filename) {
      try {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        return true;
      } catch (err) {
        return false;
      }
    };

    const callBridge = function (method, content, filename) {
      try {
        if (window.AndroidBridge && typeof window.AndroidBridge[method] === 'function') {
          return window.AndroidBridge[method](content, filename) || '';
        }
      } catch (err) {
        if (window.SysLogs) window.SysLogs.push('error', 'Log export bridge failed: ' + err);
      }
      return '';
    };

    const render = function () {
      const entries = (window.SysLogs && window.SysLogs.get()) || [];
      const nativeLog = (window.SysLogs && window.SysLogs.native()) || '';
      const stats = (window.SysLogs && window.SysLogs.counts()) || { total: 0, errors: 0, warnings: 0 };
      const summary = App.byId('logs-summary');
      let html = '';

      if (summary) {
        summary.innerHTML =
          '<span class="logs-pill total">' + stats.total + (stats.total === 1 ? ' EVENT' : ' EVENTS') + '</span>' +
          '<span class="logs-pill error">' + stats.errors + (stats.errors === 1 ? ' ERROR' : ' ERRORS') + '</span>' +
          '<span class="logs-pill warn">' + stats.warnings + (stats.warnings === 1 ? ' WARNING' : ' WARNINGS') + '</span>';
      }

      ['all', 'errors', 'actions', 'game'].forEach(function (name) {
        const btn = App.byId('log-filter-' + name);
        if (btn) btn.classList.toggle('active', activeFilter === name);
      });

      if (nativeLog && (activeFilter === 'all' || activeFilter === 'errors')) {
        html += '<div class="log-entry error native"><div class="log-meta">ANDROID / APK · native</div>' +
          '<div class="log-msg">' + escapeHtml(nativeLog) + '</div></div>';
      }

      let visibleEntries = 0;
      entries.forEach(function (entry) {
        if (!matchesFilter(entry)) return;
        visibleEntries++;
        const cls = isErrorEntry(entry) ? 'error'
          : (entry.type === 'console.warn' ? 'warn'
          : (entry.type === 'action' || entry.type === 'inventory' ? 'action'
          : (entry.type === 'game' ? 'game'
          : (entry.type === 'context' ? 'context' : 'info'))));
        html += '<div class="log-entry ' + cls + '">' +
          '<div class="log-meta">' + escapeHtml(formatTime(entry.t)) + ' · ' + escapeHtml(entry.type) +
          (entry.page ? ' · ' + escapeHtml(entry.page) : '') + '</div>' +
          '<div class="log-msg">' + escapeHtml(entry.message) + '</div>' +
          (entry.extra ? '<pre class="log-extra">' + escapeHtml(entry.extra) + '</pre>' : '') +
          (entry.stack ? '<pre>' + escapeHtml(entry.stack) + '</pre>' : '') +
          '</div>';
      });

      list.innerHTML = html || '<p class="log-empty">' +
        (visibleEntries === 0 && entries.length > 0 ? 'No logs match this filter.' : 'No errors logged yet 🎉') +
        '</p>';
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

    ['all', 'errors', 'actions', 'game'].forEach(function (name) {
      const btn = App.byId('log-filter-' + name);
      if (btn) {
        btn.onclick = function () {
          activeFilter = name;
          render();
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
        App.ui.toast('All logs cleared.', 'success');
      };
    }

    const copyBtn = App.byId('btn-copy-logs');
    if (copyBtn) {
      copyBtn.onclick = function () {
        App.ui.playClick();
        const text = window.SysLogs ? window.SysLogs.formatAll() : '';
        const done = function () { App.ui.toast('Diagnostics copied to clipboard.', 'success'); };
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

    const saveBtn = App.byId('btn-save-logs');
    if (saveBtn) {
      saveBtn.onclick = function () {
        App.ui.playClick();
        const content = getExportText();
        const filename = getFileName();
        const saved = callBridge('saveLogsMarkdown', content, filename);
        if (saved) {
          App.ui.toast('Saved: ' + saved, 'success', 4200);
        } else if (downloadFile(content, filename)) {
          App.ui.toast('Markdown log downloaded.', 'success');
        } else {
          App.ui.toast('Could not save the log file.', 'error');
        }
      };
    }

    const shareBtn = App.byId('btn-share-logs');
    if (shareBtn) {
      shareBtn.onclick = function () {
        App.ui.playClick();
        const content = getExportText();
        const filename = getFileName();
        const shared = callBridge('shareLogsMarkdown', content, filename);
        if (shared) {
          App.ui.toast('Share sheet opened.', 'success');
          return;
        }
        try {
          const file = new File([content], filename, { type: 'text/markdown' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'Ludo Spark Diagnostics' })
              .catch(function () { /* cancelled */ });
            return;
          }
        } catch (err) { /* ignore */ }
        if (downloadFile(content, filename)) {
          App.ui.toast('Sharing is unavailable; Markdown downloaded instead.', 'info', 3500);
        } else {
          App.ui.toast('Could not share the log file.', 'error');
        }
      };
    }

    if (window.SysLogs) {
      const env = window.SysLogs.environment();
      try {
        if (localStorage.getItem('ludoSpark.logSession') !== env.session) {
          window.SysLogs.push('context', 'New app session', '', env);
          localStorage.setItem('ludoSpark.logSession', env.session);
        }
      } catch (err) { /* ignore */ }
      window.SysLogs.push('info', 'App UI initialized');
    }
    App.systemLogs = { render: render };
  });
})();
