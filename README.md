# Ludo Spark ⚡

Immersive 3D Ludo board game for Android — glossy main menu, Three.js graphics, realistic dice physics, procedural sound, smart AI bots, and local Pass & Play. Fully offline; no account needed.

## Features

### Main Menu
- Arcade-style home screen with profile & level badge, coins 💎/🪙 resources, shop, mail inbox, daily free chest, video-ad rewards, and a **Lucky Spin Wheel**
- Game modes: **Online**, **Team Up**, **Friends**, **Vs Computer**, **Pass N Play**, plus 7-Up-7-Down / Tournament / Snake & Ladder preview cards
- Bottom navigation: Home · Event · Adda · Inventory · Social (coming-soon teasers)

### Gameplay
- **Straight top-down board** (default) with a 2D/3D camera toggle
- **Realistic dice physics** (Cannon.js) — fair RNG, correct face display; the dice is tossed **from the active player's own board quadrant** and the HUD dice slot **moves to whichever player's turn it is**
- **3D players around the board** — male & female 3D characters stand at all four sides; the active player's pedestal glows and the dice rests **in their hand** until you tap to roll, then the character winds up and **throws it onto the board**
- **Pawn skins from the Store** — switch between refined Classic pawns and **3D Human pawns**; human pawns **walk cell-by-cell** with swinging arms & legs instead of hopping
- **Blinking path cells** — every cell a pawn will cross blinks in that player's color until the pawn stops
- **2/3/4 players** — Vs AI Bots or Pass & Play (hot-seat)
- **AI difficulty**: Easy / Normal / Hard (threat avoidance + capture/home strategy)
- Classic rules: capture, safe stars, 3-consecutive-sixes penalty, extra turns, victory ranking
- **Live win-progress %** on player avatars; inactive players' corners hidden in 2P/3P
- **Save & resume** — auto-saves every turn; resume prompt on next launch
- In-game **pause menu** (resume, main menu, new game, rules, quit) + Android back button opens it
- Winner screen rewards coins; settings persist (sound, camera, difficulty)

### Platform
- **Immersive fullscreen** — status & navigation bars hidden (swipe from edge to reveal)
- **Full-screen Settings page** with Sound / Music / Camera / AI difficulty and a **System Logs** page that captures JS errors, WebView console errors, and native APK crash stack traces for easy debugging
- Procedural Web Audio sound (zero audio files) + haptic feedback via Android bridge
- Fully offline; all assets bundled in the APK

## Tech

- **Shell**: Kotlin + Jetpack Compose hosting a fullscreen `WebView`
- **Game engine**: vanilla JS + Three.js + Cannon.js in `app/src/main/assets/ludo3d/`
- **State**: localStorage (game save + settings); no backend required

## Build

```bash
./gradlew.bat assembleDebug   # APK: app/build/outputs/apk/debug/
./gradlew.bat test
```

Open in Android Studio (Hedgehog or newer); requires device/emulator with API 24+.

## Project layout

UI is split one file per feature so bugs can be traced without reading a 900-line inline script.

```
app/src/main/assets/ludo3d/
  index.html                  # Markup only + script/style manifest
  css/
    base.css                  # Reset, star field, canvas host
    menu.css                  # Main menu, hero, mode cards, footer nav
    inventory.css             # Inventory / store cards and filters
    game.css                  # HUD, player cards, timer, dice slot
    modals.css                # Shared modal styles, spin wheel, victory
    settings.css              # Settings + System Logs pages
  js/
    core/
      app-core.js             # Namespace, shared state, wallet, boot order
      system-logs-boot.js     # Early error capture (loads first)
    engine/
      game.js                 # Rules, turns, AI, save/resume, camera
      board.js                # Board texture, board/table meshes, pawns
      characters.js           # 3D humanoid players & animations
      physics.js              # Dice rigid-body physics
      audio.js                # Procedural sound synth
    features/
      settings.js             # Sound, camera, volume, exit
      system-logs.js          # In-app log viewer
      menu.js                 # Player count, difficulty, mode setup
      dice.js                 # Dice fallback, dock placement, roll input
      dice-3d.js              # 3D WebGL dice renderer
      hud.js                  # Turn timer, progress, game-state HUD
      emoji.js                # Per-player chat / emoji bubbles
      seven-up.js             # 7 Up 7 Down mini game
      daily-streak.js         # 7-day check-in
      tournament.js           # Knockout bracket entry
      profile.js              # Avatar picker
      quests.js               # Daily quest claims
      rewards.js              # Header, mail, shop, free chest
      spin-wheel.js           # Lucky spin wheel
      navigation.js           # Bottom pages + info popup
      inventory.js            # Pawn / dice / board / background equip
      pause-menu.js           # Pause + rules + quit
      post-game.js            # Play-again flow
      save-resume.js          # Saved match prompt
    vendor/
      three.min.js
      cannon.min.js
  assets/avatars/             # Player avatar images
app/src/main/java/com/example/
  MainActivity.kt             # Compose WebView shell, immersive mode, JS bridge
  CrashLogger.kt              # Native crash log used by System Logs
```

## License

See [LICENSE](LICENSE).
