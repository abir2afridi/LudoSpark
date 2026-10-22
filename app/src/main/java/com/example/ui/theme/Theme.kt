package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LudoColorScheme = darkColorScheme(
    primary = PrimaryIndigo,
    onPrimary = Color.White,
    secondary = GoldAccent,
    onSecondary = Color.Black,
    tertiary = LudoGreen,
    background = MidnightNavy,
    onBackground = OnDarkText,
    surface = SurfaceDark,
    onSurface = OnDarkText,
    surfaceVariant = SurfaceCard,
    onSurfaceVariant = SecondaryText
)

@Composable
fun MyApplicationTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LudoColorScheme,
        typography = Typography,
        content = content
    )
}
