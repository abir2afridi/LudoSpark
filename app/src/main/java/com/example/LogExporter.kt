package com.example

import android.app.Activity
import android.content.ClipData
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.util.Locale
import java.util.TimeZone

object LogExporter {
  private const val MIME_MARKDOWN = "text/markdown"

  private fun safeName(fileName: String): String {
    val cleaned = fileName.replace(Regex("[^A-Za-z0-9._-]"), "_").trim('_', '.')
    val base = if (cleaned.isBlank()) "LudoSpark-diagnostics" else cleaned
    return if (base.endsWith(".md", ignoreCase = true)) base else "$base.md"
  }

  fun saveMarkdown(context: Context, content: String, fileName: String): String {
    val name = safeName(fileName)
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val values = ContentValues().apply {
          put(MediaStore.MediaColumns.DISPLAY_NAME, name)
          put(MediaStore.MediaColumns.MIME_TYPE, MIME_MARKDOWN)
          put(
            MediaStore.MediaColumns.RELATIVE_PATH,
            Environment.DIRECTORY_DOWNLOADS + "/LudoSpark"
          )
          put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
          ?: return fallbackSave(context, content, name)
        try {
          val stream = resolver.openOutputStream(uri)
            ?: throw IllegalStateException("Could not open log output")
          stream.use { output ->
            output.write(content.toByteArray(Charsets.UTF_8))
          }
          values.clear()
          values.put(MediaStore.MediaColumns.IS_PENDING, 0)
          resolver.update(uri, values, null, null)
          "Downloads/LudoSpark/$name"
        } catch (err: Exception) {
          resolver.delete(uri, null, null)
          fallbackSave(context, content, name)
        }
      } else {
        fallbackSave(context, content, name)
      }
    } catch (_: Exception) {
      ""
    }
  }

  private fun fallbackSave(context: Context, content: String, name: String): String {
    return try {
      val root = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
        ?: File(context.filesDir, "documents")
      val dir = File(root, "LudoSpark").apply { mkdirs() }
      val file = File(dir, name)
      file.writeText(content, Charsets.UTF_8)
      file.absolutePath
    } catch (_: Exception) {
      ""
    }
  }

  fun shareMarkdown(context: Context, content: String, fileName: String): String {
    return try {
      val dir = File(context.cacheDir, "logs").apply { mkdirs() }
      val file = File(dir, safeName(fileName))
      file.writeText(content, Charsets.UTF_8)
      val uri = FileProvider.getUriForFile(
        context,
        context.packageName + ".fileprovider",
        file
      )
      val send = Intent(Intent.ACTION_SEND).apply {
        type = MIME_MARKDOWN
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_SUBJECT, "Ludo Spark Diagnostics")
        clipData = ClipData.newUri(context.contentResolver, "Ludo Spark diagnostics", uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      Handler(Looper.getMainLooper()).post {
        try {
          val chooser = Intent.createChooser(send, "Share Ludo Spark diagnostics")
          if (context !is Activity) {
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(chooser)
        } catch (_: Exception) {
        }
      }
      uri.toString()
    } catch (_: Exception) {
      ""
    }
  }

  fun deviceInfo(context: Context): String {
    return try {
      val info = JSONObject().apply {
        put("appId", context.packageName)
        put("appVersion", BuildConfig.VERSION_NAME)
        put("versionCode", BuildConfig.VERSION_CODE)
        put("manufacturer", Build.MANUFACTURER)
        put("brand", Build.BRAND)
        put("model", Build.MODEL)
        put("device", Build.DEVICE)
        put("androidRelease", Build.VERSION.RELEASE)
        put("sdkInt", Build.VERSION.SDK_INT)
        put("abis", Build.SUPPORTED_ABIS.joinToString(","))
        put("locale", Locale.getDefault().toLanguageTag())
        put("timezone", TimeZone.getDefault().id)
        put("filesDir", context.filesDir.absolutePath)
      }
      info.toString()
    } catch (_: Exception) {
      "{}"
    }
  }
}
