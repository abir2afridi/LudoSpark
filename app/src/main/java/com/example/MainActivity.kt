package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.example.ui.theme.MidnightNavy
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

  private var gameWebView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Install persistent crash logging so crashes can be inspected in-app later
    CrashLogger.install(this)

    // Immersive fullscreen: hide status + system navigation bars.
    // Swiping from a screen edge briefly reveals them (standard game behavior).
    WindowCompat.setDecorFitsSystemWindows(window, false)
    val insetsController = WindowCompat.getInsetsController(window, window.decorView)
    insetsController.hide(WindowInsetsCompat.Type.systemBars())
    insetsController.systemBarsBehavior =
      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

    setContent {
      MyApplicationTheme {
        LudoMainScreen(onWebViewReady = { gameWebView = it })
      }
    }
  }

  override fun onResume() {
    super.onResume()
    gameWebView?.evaluateJavascript(
      "if(window.onAppForeground){window.onAppForeground();}",
      null
    )
  }

  override fun onPause() {
    gameWebView?.evaluateJavascript(
      "if(window.onAppBackground){window.onAppBackground();}",
      null
    )
    super.onPause()
  }

  override fun onDestroy() {
    gameWebView?.destroy()
    gameWebView = null
    super.onDestroy()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      // Re-hide bars in case the system brought them back (e.g. after dialogs)
      val insetsController = WindowCompat.getInsetsController(window, window.decorView)
      insetsController.hide(WindowInsetsCompat.Type.systemBars())
      insetsController.systemBarsBehavior =
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
  }
}

class AndroidWebAppInterface(
  private val context: Context,
  private val onStateUpdate: (String) -> Unit
) {
  private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
    vibratorManager?.defaultVibrator
  } else {
    @Suppress("DEPRECATION")
    context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
  }

  @JavascriptInterface
  fun vibrate(durationMs: Long) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator?.vibrate(VibrationEffect.createOneShot(durationMs.coerceIn(10L, 250L), VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        vibrator?.vibrate(durationMs.coerceIn(10L, 250L))
      }
    } catch (_: Exception) {}
  }

  @JavascriptInterface
  fun onGameStateUpdate(jsonStr: String) {
    try {
      onStateUpdate(jsonStr)
    } catch (_: Exception) {}
  }

  @JavascriptInterface
  fun exitApp() {
    (context as? ComponentActivity)?.runOnUiThread {
      (context as? ComponentActivity)?.finish()
    }
  }

  @JavascriptInterface
  fun logJsError(message: String) {
    CrashLogger.log(context, "JS", message)
  }

  @JavascriptInterface
  fun getCrashLogs(): String = CrashLogger.read(context)

  @JavascriptInterface
  fun clearCrashLogs() {
    CrashLogger.clear(context)
  }

  @JavascriptInterface
  fun getDeviceInfo(): String = LogExporter.deviceInfo(context)

  @JavascriptInterface
  fun saveLogsMarkdown(content: String, fileName: String): String =
    LogExporter.saveMarkdown(context, content, fileName)

  @JavascriptInterface
  fun shareLogsMarkdown(content: String, fileName: String): String =
    LogExporter.shareMarkdown(context, content, fileName)
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LudoMainScreen(onWebViewReady: (WebView) -> Unit = {}) {
  val context = LocalContext.current
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }

  BackHandler {
    // Let the game show its in-game pause menu instead of killing the app
    webViewInstance?.evaluateJavascript(
      "if(window.openPauseMenu){window.openPauseMenu();}",
      null
    )
  }

  Scaffold(
    modifier = Modifier.fillMaxSize(),
    containerColor = MidnightNavy,
    contentWindowInsets = WindowInsets(0, 0, 0, 0)
  ) { innerPadding ->
    Box(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)
    ) {
      // Fullscreen Three.js WebGL WebView with exact screenshot UI layout
      AndroidView(
        factory = { ctx ->
          WebView(ctx).apply {
            layoutParams = ViewGroup.LayoutParams(
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT
            )
            settings.apply {
              javaScriptEnabled = true
              domStorageEnabled = true
              allowFileAccess = true
              useWideViewPort = true
              loadWithOverviewMode = true
              cacheMode = WebSettings.LOAD_DEFAULT
            }
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = WebView.OVER_SCROLL_NEVER
            setBackgroundColor(android.graphics.Color.parseColor("#061138"))
            webViewClient = WebViewClient()
            webChromeClient = object : WebChromeClient() {
              override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                val msg = consoleMessage ?: return false
                if (msg.messageLevel() == ConsoleMessage.MessageLevel.ERROR ||
                  msg.messageLevel() == ConsoleMessage.MessageLevel.WARNING
                ) {
                  CrashLogger.log(
                    ctx,
                    "WEBVIEW",
                    "${msg.message()} (${msg.sourceId()}:${msg.lineNumber()})"
                  )
                }
                return true
              }
            }

            addJavascriptInterface(
              AndroidWebAppInterface(
                context = ctx,
                onStateUpdate = { _ -> }
              ),
              "AndroidBridge"
            )

            loadUrl("file:///android_asset/ludo3d/index.html")
            webViewInstance = this
            onWebViewReady(this)
          }
        },
        modifier = Modifier
          .fillMaxSize()
          .testTag("threejs_webview")
      )
    }
  }
}
