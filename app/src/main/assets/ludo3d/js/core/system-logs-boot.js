// Early error capture - feeds the in-app System Logs page.
    window.SysLogs = (function () {
      var KEY = 'ludoSpark.systemLogs';
      var MAX = 400;
      var cache = [];
      try { cache = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { cache = []; }

      var persist = function () {
        try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* ignore */ }
      };

      var push = function (type, message, stack) {
        var entry = {
          t: new Date().toISOString(),
          type: String(type || 'info'),
          message: String(message || ''),
          stack: stack ? String(stack).slice(0, 2000) : ''
        };
        cache.push(entry);
        if (cache.length > MAX) cache = cache.slice(-MAX);
        persist();
        try {
          if (window.AndroidBridge && window.AndroidBridge.logJsError) {
            window.AndroidBridge.logJsError(entry.type + ': ' + entry.message);
          }
        } catch (e) { /* ignore */ }
      };

      window.addEventListener('error', function (e) {
        push('error', e.message + ' @ ' + (e.filename || '?') + ':' + e.lineno + ':' + e.colno,
          e.error && e.error.stack);
      });
      window.addEventListener('unhandledrejection', function (e) {
        var r = e.reason;
        push('promise', (r && r.message) || r, r && r.stack);
      });

      var origError = console.error.bind(console);
      console.error = function () {
        push('console.error', Array.prototype.map.call(arguments, String).join(' '));
        origError.apply(null, arguments);
      };
      var origWarn = console.warn.bind(console);
      console.warn = function () {
        push('console.warn', Array.prototype.map.call(arguments, String).join(' '));
        origWarn.apply(null, arguments);
      };

      return {
        push: push,
        get: function () { return cache.slice().reverse(); },
        clear: function () { cache = []; persist(); },
        native: function () {
          try {
            if (window.AndroidBridge && window.AndroidBridge.getCrashLogs) {
              return window.AndroidBridge.getCrashLogs();
            }
          } catch (e) { /* ignore */ }
          return '';
        },
        formatAll: function () {
          var lines = this.get().map(function (l) {
            return '[' + l.t + '] ' + l.type.toUpperCase() + ': ' + l.message +
              (l.stack ? '\n' + l.stack : '');
          });
          var nativeLog = this.native();
          if (nativeLog) lines.unshift('=== ANDROID LOG ===\n' + nativeLog);
          return lines.join('\n\n') || 'No logs.';
        }
      };
    })();
