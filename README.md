# Ludo Spark

Immersive 3D Ludo board game for Android — Three.js graphics, realistic dice physics (Cannon.js), procedural sound, smart AI bots, and local Pass & Play.

## Features

- **Straight top-down board view** (default) with a 2D/3D camera toggle
- **Realistic dice physics** with fair RNG and correct face display
- **2/3/4 players** — Vs AI Bots or Pass & Play (hot-seat)
- **AI difficulty**: Easy / Normal / Hard (threat avoidance + capture/home strategy)
- **Save & resume** — game auto-saves; resume prompt on next launch
- **In-game pause menu** — resume, new game, rules, camera, sound, difficulty, quit
- **Live win-progress %** on player avatars
- **Capture, safe cells, 3-sixes rule, extra turns, victory ranking**
- Procedural Web Audio sound (no audio assets) + haptic feedback on Android

## Tech

- Kotlin + Jetpack Compose shell hosting a fullscreen `WebView`
- Game engine: vanilla JS + Three.js + Cannon.js in `app/src/main/assets/ludo3d/`
- No network dependency; all assets bundled

## Build

```bash
./gradlew.bat assembleDebug
./gradlew.bat test
```

Open in Android Studio (Hedgehog or newer), run on device/emulator with API 24+.

## Project layout

```
app/src/main/assets/ludo3d/
  index.html   # HUD, modals, UI glue
  game.js      # Game engine (rules, AI, save/resume, camera)
  board.js     # Procedural board texture + 3D meshes
  physics.js   # Dice rigid-body physics
  audio.js     # Procedural sound synth
  style.css    # HUD styling
```

## License

See [LICENSE](LICENSE).
