package com.example

import android.content.Context
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Persistent on-device error log for debugging.
 * - Uncaught Kotlin/Java exceptions are written to a private file.
 * - WebView console errors and JS errors forwarded from the bridge are also appended.
 * - The System Logs page in the web UI reads this log through the JS bridge.
 */
object CrashLogger {
  private const val FILE_NAME = "ludo_spark_errors.log"
  private const val MAX_CHARS = 200_000

  private fun file(context: Context): File = File(context.filesDir, FILE_NAME)

  @Synchronized
  fun log(context: Context, tag: String, message: String) {
    try {
      val stamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
      val f = file(context)
      f.appendText("[$stamp] [$tag] ${message.take(8000)}\n")

      if (f.length() > MAX_CHARS) {
        val trimmed = f.readText().takeLast(MAX_CHARS / 2)
        f.writeText(trimmed)
      }
    } catch (_: Exception) {
      // Logging must never crash the app
    }
  }

  @Synchronized
  fun read(context: Context): String {
    return try {
      val f = file(context)
      if (f.exists()) f.readText() else ""
    } catch (_: Exception) {
      ""
    }
  }

  @Synchronized
  fun clear(context: Context) {
    try {
      file(context).delete()
    } catch (_: Exception) {
    }
  }

  fun install(context: Context) {
    val appContext = context.applicationContext
    val previous = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
      try {
        val stack = StringWriter()
        throwable.printStackTrace(PrintWriter(stack))
        log(appContext, "CRASH", "Thread=${thread.name}\n$stack")
      } catch (_: Exception) {
      }
      previous?.uncaughtException(thread, throwable)
    }
    log(appContext, "APP", "App started")
  }
}
