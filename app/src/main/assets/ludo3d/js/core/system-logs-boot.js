// Early error capture - feeds the in-app System Logs page.
    window.SysLogs = (function () {
      var KEY = 'ludoSpark.systemLogs';
      var MAX = 500;
      var cache = [];
      var environmentCache = null;
      var sessionId = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      try { cache = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { cache = []; }

      var persist = function () {
        try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* ignore */ }
      };

      var bridge = function () {
        try {
          return window.AndroidBridge || null;
        } catch (e) {
          return null;
        }
      };

      var stringifyArg = function (value) {
        if (value instanceof Error) return value.stack || value.message;
        if (typeof value === 'object' && value !== null) {
          try { return JSON.stringify(value); } catch (e) { return String(value); }
        }
        return String(value);
      };

      var isErrorType = function (type) {
        return type === 'error' || type === 'promise' || type === 'console.error' ||
          type === 'crash' || type === 'resource';
      };

      var push = function (type, message, stack, extra) {
        try {
          var entry = {
            t: new Date().toISOString(),
            type: String(type || 'info'),
            message: String(message || ''),
            stack: stack ? String(stack).slice(0, 4000) : '',
            session: sessionId,
            page: (window.location && window.location.hash) || 'menu'
          };
          if (extra) {
            try { entry.extra = JSON.stringify(extra).slice(0, 2000); } catch (e) { /* ignore */ }
          }
          cache.push(entry);
          if (cache.length > MAX) cache = cache.slice(-MAX);
          persist();
          if (isErrorType(entry.type)) {
            var api = bridge();
            if (api && api.logJsError) {
              api.logJsError(entry.type + ': ' + entry.message + (entry.stack ? '\n' + entry.stack : ''));
            }
          }
        } catch (e) { /* ignore */ }
      };

      var environment = function () {
        if (environmentCache) return environmentCache;
        var env = {
          session: sessionId,
          capturedAt: new Date().toISOString(),
          href: window.location ? window.location.href : '',
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          languages: navigator.languages || [],
          online: navigator.onLine,
          timezone: (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
          screen: window.screen ? window.screen.width + 'x' + window.screen.height : '',
          viewport: window.innerWidth + 'x' + window.innerHeight,
          pixelRatio: window.devicePixelRatio || 1,
          hardwareConcurrency: navigator.hardwareConcurrency || 0,
          deviceMemory: navigator.deviceMemory || 0,
          visibility: document.visibilityState || 'unknown'
        };

        try {
          if (window.ludoGame && window.ludoGame.renderer) {
            var gl = window.ludoGame.renderer.getContext();
            var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              env.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
              env.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
            env.webglVersion = gl.getParameter(gl.VERSION);
          }
        } catch (e) { /* ignore */ }

        try {
          var api = bridge();
          if (api && api.getDeviceInfo) {
            var nativeInfo = JSON.parse(api.getDeviceInfo());
            Object.keys(nativeInfo).forEach(function (key) {
              env['android_' + key] = nativeInfo[key];
            });
          }
        } catch (e) { /* ignore */ }

        environmentCache = env;
        return env;
      };

      var counts = function () {
        var result = { total: cache.length, errors: 0, warnings: 0, actions: 0, game: 0, context: 0 };
        cache.forEach(function (entry) {
          if (isErrorType(entry.type)) result.errors++;
          else if (entry.type === 'console.warn') result.warnings++;
          else if (entry.type === 'context') result.context++;
          else if (entry.type === 'action' || entry.type === 'inventory' || entry.type === 'lifecycle') result.actions++;
          else if (entry.type === 'game') result.game++;
        });
        return result;
      };

      var formatNative = function () {
        var api = bridge();
        try {
          if (api && api.getCrashLogs) return api.getCrashLogs() || '';
        } catch (e) { /* ignore */ }
        return '';
      };

      var formatEnvironment = function () {
        var env = environment();
        return Object.keys(env).map(function (key) {
          return key + ': ' + String(env[key]);
        }).join('\n');
      };

      var formatAll = function () {
        var lines = [
          '=== LUDO SPARK DIAGNOSTICS ===',
          'Session: ' + sessionId,
          'Generated: ' + new Date().toISOString(),
          '',
          '=== ENVIRONMENT ===',
          formatEnvironment()
        ];
        var nativeLog = formatNative();
        if (nativeLog) lines.push('', '=== ANDROID / APK LOG ===', nativeLog);
        lines.push('', '=== APP EVENTS ===');
        lines = lines.concat(cache.slice().reverse().map(function (entry) {
          return '[' + entry.t + '] ' + entry.type.toUpperCase() + ': ' + entry.message +
            (entry.extra ? '\n' + entry.extra : '') +
            (entry.stack ? '\n' + entry.stack : '');
        }));
        return lines.join('\n') || 'No logs.';
      };

      var formatMarkdown = function () {
        var stats = counts();
        var nativeLog = formatNative();
        var lines = [
          '# Ludo Spark Diagnostic Report',
          '',
          'Generated: `' + new Date().toISOString() + '`  ',
          'Session: `' + sessionId + '`  ',
          'Errors: **' + stats.errors + '** · Warnings: **' + stats.warnings + '** · Events: **' + stats.total + '**',
          '',
          '## Environment',
          '',
          '```text',
          formatEnvironment(),
          '```',
          '',
          '## Native Android Log',
          '',
          '```text',
          nativeLog || 'No native crash log recorded.',
          '```',
          '',
          '## App Event Timeline',
          ''
        ];

        if (cache.length === 0) {
          lines.push('No app events recorded.');
        } else {
          cache.slice().reverse().forEach(function (entry) {
            lines.push('### `' + entry.t + '` · ' + entry.type.toUpperCase());
            lines.push('');
            lines.push(entry.message);
            if (entry.extra) {
              lines.push('');
              lines.push('```json');
              lines.push(entry.extra);
              lines.push('```');
            }
            if (entry.stack) {
              lines.push('');
              lines.push('```text');
              lines.push(entry.stack);
              lines.push('```');
            }
            lines.push('');
          });
        }

        return lines.join('\n');
      };

      window.addEventListener('error', function (e) {
        if (e.target && e.target !== window && e.target.tagName) {
          push('resource', 'Failed to load ' + e.target.tagName + ': ' + (e.target.src || e.target.href || ''));
          return;
        }
        push('error', e.message + ' @ ' + (e.filename || '?') + ':' + e.lineno + ':' + e.colno,
          e.error && e.error.stack);
      }, true);
      window.addEventListener('unhandledrejection', function (e) {
        var reason = e.reason;
        push('promise', (reason && reason.message) || stringifyArg(reason), reason && reason.stack);
      });

      window.addEventListener('online', function () { push('network', 'Network online'); });
      window.addEventListener('offline', function () { push('network', 'Network offline'); });
      document.addEventListener('visibilitychange', function () {
        push('lifecycle', 'Visibility: ' + document.visibilityState);
      });

      var origError = console.error.bind(console);
      console.error = function () {
        push('console.error', Array.prototype.map.call(arguments, stringifyArg).join(' '));
        origError.apply(console, arguments);
      };
      var origWarn = console.warn.bind(console);
      console.warn = function () {
        push('console.warn', Array.prototype.map.call(arguments, stringifyArg).join(' '));
        origWarn.apply(console, arguments);
      };

      document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;
        var el = target.closest('button[id], [role="button"][id]');
        if (!el || !el.id || el.closest('#system-logs-page')) return;
        var label = (el.getAttribute('aria-label') || el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        push('action', 'Tap #' + el.id + (label ? ' (' + label + ')' : ''));
      }, true);

      return {
        push: push,
        get: function () { return cache.slice().reverse(); },
        clear: function () { cache = []; persist(); },
        native: formatNative,
        environment: environment,
        formatEnvironment: formatEnvironment,
        counts: counts,
        formatAll: formatAll,
        formatMarkdown: formatMarkdown,
        fileName: function () {
          var d = new Date();
          var pad = function (n) { return String(n).padStart(2, '0'); };
          return 'LudoSpark-diagnostics-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
            '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.md';
        }
      };
    })();
