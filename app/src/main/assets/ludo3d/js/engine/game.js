/**
 * Complete 3D Ludo Game Engine with Three.js, Cannon.js physics, authentic rules,
 * fluid token hop animations, particle celebrations, smart AI bots, and Android bridge.
 * 
 * Camera is fixed and automatically fitted to the mobile screen so the table never
 * shifts, drifts, or moves when the user touches the screen.
 */
class LudoGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.builder = null;
    this.physics = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Persisted settings (localStorage safe)
    const ls = (typeof localStorage !== 'undefined') ? localStorage : null;
    this.currentPreset = (ls && ls.getItem('ludoSpark.camera')) || 'top';
    this.difficulty = (ls && ls.getItem('ludoSpark.difficulty')) || 'normal';
    this.diceSkin = (ls && ls.getItem('ludoSpark.diceSkin')) || 'white';
    this.boardTheme = (ls && ls.getItem('ludoSpark.boardTheme')) || 'classic';
    this.pawnSkin = (ls && ls.getItem('ludoSpark.pawnSkin')) || 'classic';

    // Move-highlight (cell blink) style + color, and player pedestal style
    this.blinkStyle = (ls && ls.getItem('ludoSpark.blinkStyle')) || 'circle';
    this.blinkColor = (ls && ls.getItem('ludoSpark.blinkColor')) || 'auto';
    this.pedestalStyle = (ls && ls.getItem('ludoSpark.pedestalStyle')) || 'circle';

    // Game Configuration
    // Game Configuration (matches screenshot: P1 Blue BL, P2 Red TL, P3 Green TR, P4 Yellow BR)
    this.playerConfigs = [
      { id: 0, name: 'Player 1', color: '#2563EB', isAI: false, startTrack: 39 },
      { id: 1, name: 'Player 2', color: '#E11D48', isAI: true, startTrack: 0 },
      { id: 2, name: 'Player 3', color: '#16A34A', isAI: true, startTrack: 13 },
      { id: 3, name: 'Player 4', color: '#EAB308', isAI: true, startTrack: 26 }
    ];
    this.numPlayers = 4;

    // Game State
    // Token: { id, player, step (0 = yard, 1 = start, 52..56 = home path, 57 = home), mesh, halo }
    this.tokens = [];
    this.activePlayerIndex = 0; // Player 1 (Human) starts
    this.state = 'WAIT_ROLL';
    this.gameActive = false;
    this.backgroundPaused = false;
    this._loopRunning = false;
    this._animationFrame = 0;
    this._aiTimer = null;
    this._matchId = 0;
    this.currentRoll = 0;
    this.consecutiveSixes = 0;
    this.movableTokens = [];
    this.turnHistory = [];
    this.finishedPlayers = [];
    this.stats = { turns: 0, sixes: 0, captures: 0 };

    // Track Coordinates (52 cells)
    this.trackCells = this.generateTrackCells();
    this.safeTrackIndices = [0, 8, 13, 21, 26, 34, 39, 47];

    // Yard Nest coordinates matching 4 quadrants
    this.yardPositions = [
      // Player 1: Blue (bottom-left)
      [{ r: 10.8, c: 1.8 }, { r: 10.8, c: 4.2 }, { r: 13.2, c: 1.8 }, { r: 13.2, c: 4.2 }],
      // Player 2: Red (top-left)
      [{ r: 1.8, c: 1.8 }, { r: 1.8, c: 4.2 }, { r: 4.2, c: 1.8 }, { r: 4.2, c: 4.2 }],
      // Player 3: Green (top-right)
      [{ r: 1.8, c: 10.8 }, { r: 1.8, c: 13.2 }, { r: 4.2, c: 10.8 }, { r: 4.2, c: 13.2 }],
      // Player 4: Yellow (bottom-right)
      [{ r: 10.8, c: 10.8 }, { r: 10.8, c: 13.2 }, { r: 13.2, c: 10.8 }, { r: 13.2, c: 13.2 }]
    ];

    // Home Corridor paths (5 cells each)
    this.homePaths = [
      // Player 1: Blue (col 7, rows 13..9)
      [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
      // Player 2: Red (row 7, cols 1..5)
      [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
      // Player 3: Green (col 7, rows 1..5)
      [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
      // Player 4: Yellow (row 7, cols 13..9)
      [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }]
    ];

    // Center Home targets
    this.homeGoals = [
      { r: 7.8, c: 7 },   // Player 1 (Blue)
      { r: 7, c: 6.2 },   // Player 2 (Red)
      { r: 6.2, c: 7 },   // Player 3 (Green)
      { r: 7, c: 7.8 }    // Player 4 (Yellow)
    ];

    // Particles & FX
    this.confettiParticles = [];
    this.diceTrailParticles = [];
    this.cameraShake = 0;

    // Turn timer
    this.turnTimeLimit = 15;
    this.turnTimeRemaining = 15;
    this.timerActive = false;
    this.lastTickSec = -1;
    this._timerPlayer = -1;

    // Cell blink highlights during token movement
    this.moveHighlights = [];
    this.diceHolder = -1;
    // Dice handoff state (dice-handoff.js) — মাঝপথে passTurn ডেকে থাকলে
    // animate() যেন dice হাতে টেনে না আনে (instant snap এড়াতে)
    this._turnEndPending = false;
    this.diceHandoff = null;
    // Board throw system (dice-board-throw.js) — handoff থেকে আলাদা
    // mechanism: character দিয়ে board-এ real physics throw
    this.boardThrow = null;
    // Walk retrieve system (walk-retrieve.js) — bonus-এ character নিজে
    // হেঁটে dice তুলে আনে
    this.walkRetrieve = null;
    this.pendingSkinApply = false;
    this._tmpVec = new THREE.Vector3();

    // Animation clocks
    this.clock = new THREE.Clock();

    this.initThree();
    this.initBoard();
    this.initTokens();
    this.initTouch();
    this.fitBoardToScreen();
    this.notifyUI();
    this.renderer.render(this.scene, this.camera);
  }

  startRunning() {
    if (this.gameActive) return;
    this.gameActive = true;
    this.backgroundPaused = false;
    this._timerPlayer = -1;
    this.startLoop();
    if (window.soundEngine && window.soundEngine.startBGM) {
      window.soundEngine.init();
      window.soundEngine.startBGM();
    }
    this.notifyUI();
    this.scheduleAITurn();
  }

  stopRunning() {
    this.gameActive = false;
    this.backgroundPaused = false;
    this.timerActive = false;
    this._timerPlayer = -1;
    this._turnEndPending = false;
    // মাঝপথে game বন্ধ হলে dice handoff flight থামাও — নাহলে
    // পরের game-এ আটকে থাকা phase দেখতে পাওয়া যেত
    if (this.diceHandoff) this.diceHandoff.cancel();
    if (this.walkRetrieve) this.walkRetrieve.cancel();
    this.stopLoop();
    if (this._aiTimer) {
      clearTimeout(this._aiTimer);
      this._aiTimer = null;
    }
    if (window.soundEngine && window.soundEngine.stopBGM) {
      window.soundEngine.stopBGM();
    }
    this.clearVictoryCelebration();
  }

  startLoop() {
    if (this._loopRunning) return;
    this._loopRunning = true;
    this.clock.getDelta();
    this.animate();
  }

  stopLoop() {
    this._loopRunning = false;
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = 0;
    }
  }

  pauseForBackground() {
    if (!this.gameActive || this.backgroundPaused) return;
    this.backgroundPaused = true;
    this.timerActive = false;
    this.stopLoop();
    if (window.soundEngine && window.soundEngine.stopBGM) {
      window.soundEngine.stopBGM();
    }
  }

  resumeFromBackground() {
    if (!this.gameActive || !this.backgroundPaused) return;
    this.backgroundPaused = false;
    this.startLoop();
    this.notifyUI();
    if (window.soundEngine && window.soundEngine.startBGM) {
      window.soundEngine.init();
      window.soundEngine.startBGM();
    }
    this.scheduleAITurn();
  }

  scheduleAction(fn, delay) {
    if (!this.gameActive) return;
    const matchId = this._matchId;
    if (this._aiTimer) clearTimeout(this._aiTimer);
    this._aiTimer = setTimeout(() => {
      this._aiTimer = null;
      if (!this.gameActive || matchId !== this._matchId) return;
      fn();
    }, delay);
  }

  scheduleAITurn() {
    if (!this.gameActive) return;
    const cfg = this.playerConfigs[this.activePlayerIndex];
    if (!cfg || !cfg.isAI) return;
    if (this.state === 'WAIT_ROLL') {
      this.scheduleAction(() => this.handleRoll(true), 800);
    } else if (this.state === 'WAIT_SELECT' && this.movableTokens.length > 0) {
      this.scheduleAction(() => {
        if (this.state !== 'WAIT_SELECT') return;
        const best = this.chooseAIBestToken(this.movableTokens, this.currentRoll);
        this.handleTokenSelect(best);
      }, 700);
    }
  }

  generateTrackCells() {
    const cells = [];
    // 0..4 (Red arm right)
    for (let c = 1; c <= 5; c++) cells.push({ r: 6, c });
    // 5..10 (Green arm up)
    for (let r = 5; r >= 0; r--) cells.push({ r, c: 6 });
    // 11 (Green top cross)
    cells.push({ r: 0, c: 7 });
    // 12..17 (Green arm down)
    for (let r = 0; r <= 5; r++) cells.push({ r, c: 8 });
    // 18..23 (Yellow arm right)
    for (let c = 9; c <= 14; c++) cells.push({ r: 6, c });
    // 24 (Yellow right cross)
    cells.push({ r: 7, c: 14 });
    // 25..30 (Yellow arm left)
    for (let c = 14; c >= 9; c--) cells.push({ r: 8, c });
    // 31..36 (Blue arm down)
    for (let r = 9; r <= 14; r++) cells.push({ r, c: 8 });
    // 37 (Blue bottom cross)
    cells.push({ r: 14, c: 7 });
    // 38..43 (Blue arm up)
    for (let r = 14; r >= 9; r--) cells.push({ r, c: 6 });
    // 44..49 (Red arm left)
    for (let c = 5; c >= 0; c--) cells.push({ r: 8, c });
    // 50 (Red left cross)
    cells.push({ r: 7, c: 0 });
    // 51 (Red arm entry)
    cells.push({ r: 6, c: 0 });

    return cells;
  }

  initThree() {
    // Scene — transparent so the CSS starry gradient background shows through
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Camera
    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.7);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xFFFBEB, 1.15);
    sun.position.set(10, 26, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // Soft rim blue light for 3D depth
    const rimLight = new THREE.DirectionalLight(0x38BDF8, 0.45);
    rimLight.position.set(-14, 12, -14);
    this.scene.add(rimLight);

    // Center focal point light for dice & board
    this.spotLight = new THREE.PointLight(0xFDE047, 0.5, 18);
    this.spotLight.position.set(0, 6, 0);
    this.scene.add(this.spotLight);

    // Resize listener
    window.addEventListener('resize', () => this.onResize());

    // The render loop starts only while a match is active.
    this.animate = this.animate.bind(this);
  }

  /**
   * Purely fits the 3D Ludo board inside the mobile screen bounds.
   * Locked in place: the screen never moves or drifts when touched.
   */
  fitBoardToScreen() {
    if (!this.container || !this.camera || !this.renderer) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;

    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = 42;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    // Wider extent for the board, taller extent for the character podiums on top/bottom
    const widthExtent = 18.9;
    const heightExtent = 21.6;
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);

    // Fill ~92% of portrait width; keep the full board + characters in landscape
    const distW = (widthExtent / 2) / Math.tan(hFovRad / 2) / 0.965;
    const distH = (heightExtent / 2) / Math.tan(vFovRad / 2) / 0.82;
    const requiredDist = Math.max(distW, distH);

    if (this.currentPreset === 'top') {
      // Pure 2D Top-Down overhead view — perfectly straight, never skewed
      this.camera.position.set(0, requiredDist, 0.0001);
      this.camera.lookAt(0, 0, 0);
    } else if (this.currentPreset === 'player') {
      // Focus on active player quadrant
      const angles = [Math.PI, -Math.PI / 2, 0, Math.PI / 2];
      const angle = angles[this.activePlayerIndex] || 0;
      const x = Math.sin(angle) * (requiredDist * 0.45);
      const z = Math.cos(angle) * (requiredDist * 0.45);
      this.camera.position.set(x, requiredDist * 0.88, z);
      this.camera.lookAt(0, 0, 0.2);
    } else {
      // Default: Pure Screen Fit 3D
      // Elevation angle 70 degrees provides gorgeous 3D perspective of board, characters, and tokens
      const angleRad = (70 * Math.PI) / 180;
      const camY = requiredDist * Math.sin(angleRad);
      const camZ = requiredDist * Math.cos(angleRad);
      this.camera.position.set(0, camY, camZ);
      this.camera.lookAt(0, 0, 0.25);
    }
  }

  initBoard() {
    this.builder = new LudoBoardBuilder();
    if (this.boardGroup) this.scene.remove(this.boardGroup);
    this.boardGroup = this.builder.buildBoard(this.scene, this.boardTheme);

    // 3D humanoid players standing around the 4 sides of the board
    this.characters = new LudoCharacters(this.scene, this.playerConfigs);

    // Dice Physics & Mesh
    this.physics = new DicePhysics(this.scene);
    this.physics.onFirstImpact = (pos) => {
      this.spawnBoardShockwave(pos);
      this.triggerCameraShake(0.12);
    };
    // Dice handoff system — board↔hand retrieval + player→player pass
    // (board-এর দিকে throw physics.js-এই থাকে, শুধু হাতে ফেরানো ও দেওয়া এখানে)
    this.diceHandoff = new DiceHandoffSystem(this);
    // Board throw system — handoff থেকে আলাদা mechanism (dice-board-throw.js)
    this.boardThrow = new DiceBoardThrowSystem(this);
    // Walk retrieve system — bonus-এ চরিত্র হেঁটে dice তোলে (walk-retrieve.js)
    if (this.walkRetrieve) this.walkRetrieve.cancel();
    this.walkRetrieve = new WalkRetrieveSystem(this);
    if (this.diceMesh) this.scene.remove(this.diceMesh);
    this.diceMesh = this.builder.createDiceMesh(this.diceSkin);
    this.scene.add(this.diceMesh);
    this.physics.setDiceMesh(this.diceMesh);
  }

  setDiceSkin(skin) {
    this.diceSkin = skin;
    try { localStorage.setItem('ludoSpark.diceSkin', skin); } catch(e){}
    if (this.diceMesh && this.builder) {
      this.scene.remove(this.diceMesh);
      this.diceMesh = this.builder.createDiceMesh(skin);
      this.scene.add(this.diceMesh);
      this.physics.setDiceMesh(this.diceMesh);
    }
  }

  setBoardTheme(theme) {
    this.boardTheme = theme;
    try { localStorage.setItem('ludoSpark.boardTheme', theme); } catch(e){}
    if (this.builder) {
      if (this.boardGroup) this.scene.remove(this.boardGroup);
      this.boardGroup = this.builder.buildBoard(this.scene, theme);
    }
  }

  setBlinkStyle(style) {
    this.blinkStyle = style;
    try { localStorage.setItem('ludoSpark.blinkStyle', style); } catch (e) { }
    if (window.SysLogs) window.SysLogs.push('inventory', 'Move blink style: ' + style);
  }

  setBlinkColor(color) {
    this.blinkColor = color;
    try { localStorage.setItem('ludoSpark.blinkColor', color); } catch (e) { }
    if (window.SysLogs) window.SysLogs.push('inventory', 'Move blink color: ' + color);
  }

  setPedestalStyle(style) {
    this.pedestalStyle = style;
    try { localStorage.setItem('ludoSpark.pedestalStyle', style); } catch (e) { }
    if (this.characters) this.characters.setPedestalStyle(style);
  }

  /**
   * Resolve the move-highlight color for the current blinkColor preset.
   * Returns { hex, rainbow } — rainbow=true means animate hue over time.
   */
  resolveBlinkColor(playerColorHex) {
    const preset = this.blinkColor;
    if (preset === 'rainbow') return { hex: 0xffffff, rainbow: true };
    const map = {
      cyan: 0x22D3EE,
      magenta: 0xE879F9,
      gold: 0xFBBF24,
      emerald: 0x34D399,
      blue: 0x60A5FA
    };
    if (map[preset] !== undefined) return { hex: map[preset], rainbow: false };
    return { hex: playerColorHex, rainbow: false }; // 'auto' → team color
  }

  initTokens() {
    // Clear old tokens
    this.tokens.forEach(t => {
      this.scene.remove(t.mesh);
      this.scene.remove(t.halo);
    });
    this.tokens = [];

    // Create 4 tokens for each active player
    for (let p = 0; p < this.numPlayers; p++) {
      const cfg = this.playerConfigs[p];
      for (let i = 0; i < 4; i++) {
        const mesh = this.builder.createTokenMesh(cfg.color, p, i, this.pawnSkin);
        this.scene.add(mesh);

        // Highlight ring / beacon
        const haloGeom = new THREE.RingGeometry(0.5, 0.75, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xFDE047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.0
        });
        const halo = new THREE.Mesh(haloGeom, haloMat);
        halo.rotation.x = -Math.PI / 2;
        halo.position.y = 0.38;
        this.scene.add(halo);

        const token = {
          id: `${p}_${i}`,
          player: p,
          tokenIndex: i,
          step: 0, // In yard
          mesh: mesh,
          halo: halo,
          isMoving: false
        };

        this.tokens.push(token);
        this.updateTokenPosition(token, false);
      }
    }
  }

  /**
   * Calculates 3D world coordinate for a token based on its step
   */
  getTokenWorldPos(token) {
    if (this.gameMode === 'SNAKE') {
      const pos = this.builder.snakeCellToWorld(token.step || 1);
      return new THREE.Vector3(pos.x, 0.36, pos.z);
    }
    const p = token.player;
    if (token.step === 0) {
      // In yard nest
      const nest = this.yardPositions[p][token.tokenIndex];
      const pos = this.builder.cellToWorld(nest.r, nest.c);
      return new THREE.Vector3(pos.x, 0.36, pos.z);
    } else if (token.step >= 1 && token.step <= 51) {
      // Outer track
      const startTrack = this.playerConfigs[p].startTrack;
      const trackIdx = (startTrack + token.step - 1) % 52;
      const cell = this.trackCells[trackIdx];
      const pos = this.builder.cellToWorld(cell.r, cell.c);
      return new THREE.Vector3(pos.x, 0.36, pos.z);
    } else if (token.step >= 52 && token.step <= 56) {
      // Private home corridor
      const idx = token.step - 52;
      const cell = this.homePaths[p][idx];
      const pos = this.builder.cellToWorld(cell.r, cell.c);
      return new THREE.Vector3(pos.x, 0.36, pos.z);
    } else if (token.step >= 57) {
      // Home goal quadrant
      const goal = this.homeGoals[p];
      const pos = this.builder.cellToWorld(goal.r, goal.c);
      const angle = (token.tokenIndex / 4) * Math.PI * 2;
      return new THREE.Vector3(pos.x + Math.cos(angle) * 0.3, 0.36, pos.z + Math.sin(angle) * 0.3);
    }
    return new THREE.Vector3(0, 0.36, 0);
  }

  updateTokenPosition(token, animate = false) {
    const targetPos = this.getTokenWorldPos(token);
    if (!animate) {
      token.mesh.position.copy(targetPos);
      token.halo.position.set(targetPos.x, 0.38, targetPos.z);
    }
    this.adjustOverlappingTokens();
  }

  adjustOverlappingTokens() {
    const cellGroups = {};
    this.tokens.forEach(t => {
      if (t.step > 0 && t.step < 57 && !t.isMoving) {
        let key = '';
        if (t.step <= 51) {
          const trackIdx = (this.playerConfigs[t.player].startTrack + t.step - 1) % 52;
          key = `track_${trackIdx}`;
        } else {
          key = `home_${t.player}_${t.step}`;
        }
        if (!cellGroups[key]) cellGroups[key] = [];
        cellGroups[key].push(t);
      }
    });

    Object.values(cellGroups).forEach(group => {
      if (group.length > 1) {
        group.forEach((t, i) => {
          const basePos = this.getTokenWorldPos(t);
          const angle = (i / group.length) * Math.PI * 2;
          const offsetRadius = 0.32;
          t.mesh.position.x = basePos.x + Math.cos(angle) * offsetRadius;
          t.mesh.position.z = basePos.z + Math.sin(angle) * offsetRadius;
          t.halo.position.set(t.mesh.position.x, 0.38, t.mesh.position.z);
        });
      }
    });
  }

  /**
   * Touch interactions: Only interacts with 3D game elements (dice and tokens).
   * The board and screen stay completely stationary and fixed.
   */
  initTouch() {
    const handleTap = (clientX, clientY) => {
      if (!this.renderer || !this.camera) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 1. Tapping dice to roll (or tapping active 3D character holding the dice)
      if (this.state === 'WAIT_ROLL') {
        const activeCfg = this.playerConfigs[this.activePlayerIndex];
        if (!activeCfg.isAI) {
          const targets = [this.diceMesh];
          if (this.characters && this.characters.chars[this.activePlayerIndex]) {
            targets.push(this.characters.chars[this.activePlayerIndex].group);
          }
          const intersects = this.raycaster.intersectObjects(targets, true);
          if (intersects.length > 0) {
            this.handleRoll();
            return;
          }
        }
      }
      // 2. Tapping highlighted token to move
      else if (this.state === 'WAIT_SELECT') {
        const activeCfg = this.playerConfigs[this.activePlayerIndex];
        if (!activeCfg.isAI) {
          const candidateMeshes = this.movableTokens.map(t => t.mesh);
          const intersects = this.raycaster.intersectObjects(candidateMeshes, true);
          if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && !obj.userData.isToken) {
              obj = obj.parent;
            }
            if (obj && obj.userData.isToken) {
              const token = this.movableTokens.find(
                t => t.player === obj.userData.playerId && t.tokenIndex === obj.userData.tokenIndex
              );
              if (token) {
                this.handleTokenSelect(token);
                return;
              }
            }
          }
        }
      }
    };

    const canvas = this.renderer.domElement;

    // Use pointerdown to ensure fast, zero-delay touch response
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleTap(e.clientX, e.clientY);
    }, { passive: false });

    // Block any touch dragging or scrolling on the 3D canvas
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  /**
   * Dice board-এ ছোড়ার main entry।
   * fromRetry=true মানে এটা AI/timer থেকে আসা automatic retry —
   * handoff animation চলাকালীন এটা পরে আবার চেষ্টা করবে। মানুষের tap
   * হলে (fromRetry=false) handoff চলাকালীন ignore করা হয়, কারণ dice
   * তখন মাঝ আকাশে উড়ছে বা কারো হাতে ধরা পড়ে আছে।
   */
  handleRoll(fromRetry = false) {
    if (!this.gameActive || this.state !== 'WAIT_ROLL') return;
    // Dice handoff (retrieve/pass) চলাকালীন roll নেওয়া যাবে না — পরে আবার
    if (this.diceHandoff && this.diceHandoff.isBusy()) {
      if (fromRetry) this.scheduleAction(() => this.handleRoll(true), 250);
      return;
    }
    // "No moves"/3-sixes এর পর passTurn ডাকা আছে (৯০০ms পর) — ওই উইন্ডোতে
    // আবার roll করলে দ্বিতীয় roll চালু হয়ে passTurn তাকে মাঝপথে হত্যা করবে
    // → dice callback হারিয়ে গিয়ে game জমে থাকত। তাই এই উইন্ডোতে tap = ignore।
    if (this._turnEndPending) {
      if (fromRetry) this.scheduleAction(() => this.handleRoll(true), 250);
      return;
    }
    // Bonus walk চলাকালীন (player নিজে হেঁটে dice তুলতে গেছে — walk-retrieve.js)
    // roll নেওয়া যাবে না — dice এখনো board-এ/মাঝপথে। শেষ হলেই চেষ্টা হবে।
    if (this.walkRetrieve && this.walkRetrieve.isBusy()) {
      if (fromRetry) this.scheduleAction(() => this.handleRoll(true), 250);
      return;
    }
    this.state = 'ROLLING';
    this.clearHighlights();

    // Fair dice roll 1..6
    const rollValue = Math.floor(Math.random() * 6) + 1;
    this.currentRoll = rollValue;
    if (window.SysLogs) {
      window.SysLogs.push('game', this.playerConfigs[this.activePlayerIndex].name +
        ' rolled ' + rollValue + ' (state=' + this.state + ')');
    }

    if (window.soundEngine) window.soundEngine.init();
    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(40);
    }

    this.notifyUI();

    // ---- BOARD THROW MECHANISM (dice-board-throw.js) ----
    // কোন character ছুড়বে, spawn কোথায় (wall-এর ভিতরে নিশ্চিত), physics
    // কোন trajectory-তে — সব ওই file-এ। এখান থেকে শুধু delegate করা হয়।
    // (handoff/retrieve mechanism আছে dice-handoff.js-এ — মিশাবে না)
    const playerId = this.activePlayerIndex;
    if (!this.boardThrow) this.boardThrow = new DiceBoardThrowSystem(this);
    this.boardThrow.throwToBoard(playerId, rollValue, (finalValue) => {
      this.onDiceRollComplete(finalValue);
    });
  }

  onDiceRollComplete(roll) {
    if (!this.gameActive) return;
    this.currentRoll = roll;
    this.stats.turns++;
    if (roll === 6) this.stats.sixes++;

    // Check consecutive sixes
    if (roll === 6) {
      if (window.soundEngine) window.soundEngine.playSixRoll();
      if (this.characters) this.characters.triggerEmote(this.activePlayerIndex, 'cheer');
      this.consecutiveSixes++;
      if (this.consecutiveSixes >= 3) {
        this.addHistory(`Rolled 3 consecutive 6s! Turn passed.`);
        this.consecutiveSixes = 0;
        this.state = 'WAIT_ROLL';
        // passTurn ডাকা হচ্ছে (৯০০ms পর) — ততক্ষণ animate() যেন dice হাতে
        // টেনে না আনে (থেমে থাকা dice দেখতে ভুল লাগবে)
        this._turnEndPending = true;
        this.scheduleAction(() => this.passTurn(), 900);
        this.notifyUI();
        this.saveGame();
        return;
      }
    } else {
      this.consecutiveSixes = 0;
    }

    // Determine legal moves
    this.movableTokens = this.getMovableTokens(this.activePlayerIndex, roll);

    if (this.movableTokens.length === 0) {
      this.addHistory(`Rolled a ${roll}. No moves available.`);
      this.state = 'WAIT_ROLL';
      // passTurn ডাকা হচ্ছে (৯০০ms পর) — ততক্ষণ animate() যেন dice হাতে
      // টেনে না আনে (থেমে থাকা dice দেখতে ভুল লাগবে)
      this._turnEndPending = true;
      this.scheduleAction(() => this.passTurn(), 900);
    } else if (this.movableTokens.length === 1 && this.playerConfigs[this.activePlayerIndex].isAI) {
      this.state = 'MOVING';
      this.handleTokenSelect(this.movableTokens[0]);
    } else {
      this.state = 'WAIT_SELECT';
      this.highlightMovableTokens();
      if (this.playerConfigs[this.activePlayerIndex].isAI) {
        this.scheduleAction(() => {
          if (this.state !== 'WAIT_SELECT') return;
          const best = this.chooseAIBestToken(this.movableTokens, roll);
          this.handleTokenSelect(best);
        }, 700);
      }
    }

    this.notifyUI();
    this.saveGame();
  }

  getMovableTokens(playerId, roll) {
    if (this.gameMode === 'SNAKE') {
      const playerToken = this.tokens.find(t => t.player === playerId);
      if (playerToken && playerToken.step + roll <= 100) {
        return [playerToken];
      }
      return [];
    }
    const playerTokens = this.tokens.filter(t => t.player === playerId);
    const movable = [];

    playerTokens.forEach(t => {
      if (t.step === 0) {
        if (roll === 6) movable.push(t);
      } else if (t.step + roll <= 57) {
        movable.push(t);
      }
    });

    return movable;
  }

  highlightMovableTokens() {
    this.clearHighlights();
    this.movableTokens.forEach(t => {
      t.halo.material.opacity = 0.85;
    });
  }

  clearHighlights() {
    this.tokens.forEach(t => {
      t.halo.material.opacity = 0.0;
    });
  }

  /**
   * Returns true if any opponent token can capture the given track cell with a single roll (1..6).
   */
  isCellThreatened(trackIdx, playerId) {
    if (this.safeTrackIndices.includes(trackIdx)) return false;
    return this.tokens.some(other => {
      if (other.player === playerId || other.step === 0 || other.step > 51) return false;
      const otherTrackIdx = (this.playerConfigs[other.player].startTrack + other.step - 1) % 52;
      const dist = ((trackIdx - otherTrackIdx) + 52) % 52;
      return dist >= 1 && dist <= 6;
    });
  }

  chooseAIBestToken(movableTokens, roll) {
    // Easy: mostly random picks for a chill experience
    if (this.difficulty === 'easy' && movableTokens.length > 1 && Math.random() < 0.35) {
      return movableTokens[Math.floor(Math.random() * movableTokens.length)];
    }

    let bestToken = movableTokens[0];
    let maxScore = -9999;

    movableTokens.forEach(token => {
      let score = 0;
      const targetStep = token.step === 0 ? 1 : token.step + roll;

      if (targetStep === 57) {
        score += 1000;
      } else if (token.step === 0) {
        score += 400;
      } else if (targetStep <= 51) {
        const startTrack = this.playerConfigs[token.player].startTrack;
        const targetTrackIdx = (startTrack + targetStep - 1) % 52;
        if (!this.safeTrackIndices.includes(targetTrackIdx)) {
          const opponentsOnTarget = this.tokens.filter(
            other => other.player !== token.player &&
            other.step > 0 && other.step <= 51 &&
            (this.playerConfigs[other.player].startTrack + other.step - 1) % 52 === targetTrackIdx
          );
          if (opponentsOnTarget.length > 0) {
            score += 800;
          }
        }
      }

      if (targetStep <= 51) {
        const startTrack = this.playerConfigs[token.player].startTrack;
        const targetTrackIdx = (startTrack + targetStep - 1) % 52;
        if (this.safeTrackIndices.includes(targetTrackIdx)) {
          score += 250;
        } else if (this.difficulty !== 'easy' && this.isCellThreatened(targetTrackIdx, token.player)) {
          // Threat avoidance — don't step into capture range if possible
          score -= this.difficulty === 'hard' ? 500 : 200;
        }
      }

      if (token.step <= 51 && targetStep > 51) {
        score += 350;
      }

      // Hard: prefer advancing tokens that are already deep (get them home faster)
      if (this.difficulty === 'hard' && token.step > 20) {
        score += 60;
      }

      score += targetStep * 2;

      if (score > maxScore) {
        maxScore = score;
        bestToken = token;
      }
    });

    return bestToken;
  }

  handleTokenSelect(token) {
    if (!this.gameActive) return;
    if (this.state !== 'WAIT_SELECT' && this.state !== 'MOVING') return;
    this.state = 'MOVING';
    this.clearHighlights();
    this.clearMoveHighlights();

    const startStep = token.step;
    const targetStep = startStep === 0 ? 1 : startStep + this.currentRoll;
    const cfg = this.playerConfigs[token.player];
    const isWalker = token.mesh.userData.skin === 'human';
    token.isMoving = true;

    if (window.soundEngine) window.soundEngine.init();

    const waypoints = [];
    if (startStep === 0) {
      waypoints.push(this.getTokenWorldPos({ ...token, step: 1 }));
    } else {
      for (let s = startStep + 1; s <= targetStep; s++) {
        waypoints.push(this.getTokenWorldPos({ ...token, step: s }));
      }
    }

    let waypointIdx = 0;

    // Create vibrant cell highlights for each step along the path
    const blinkResolved = this.resolveBlinkColor(new THREE.Color(cfg.color).getHex());
    waypoints.forEach((wp, idx) => {
      const hl = this.builder.createCellHighlight(blinkResolved.hex, this.blinkStyle);
      hl.position.set(wp.x, 0.356, wp.z);
      hl.visible = true;
      hl.userData.stepIndex = idx;
      hl.userData.totalSteps = waypoints.length;
      hl.userData.getCurrentStep = () => waypointIdx;
      hl.userData.rainbow = blinkResolved.rainbow;
      this.scene.add(hl);
      this.moveHighlights.push(hl);
    });

    const stepDuration = isWalker ? 270 : 160;
    let hopStartTime = performance.now();
    let fromPos = token.mesh.position.clone();
    const parts = token.mesh.userData.parts || null;

    const finishMove = () => {
      token.step = targetStep;
      token.isMoving = false;
      token.mesh.position.copy(waypoints[waypoints.length - 1]);
      token.halo.position.set(token.mesh.position.x, 0.38, token.mesh.position.z);

      if (parts) {
        parts.legL.rotation.set(0, 0, 0);
        parts.legR.rotation.set(0, 0, 0);
        if (parts.calfL) parts.calfL.rotation.set(0, 0, 0);
        if (parts.calfR) parts.calfR.rotation.set(0, 0, 0);
        if (parts.footL) parts.footL.rotation.set(0, 0, 0);
        if (parts.footR) parts.footR.rotation.set(0, 0, 0);
        parts.armL.rotation.set(0, 0, 0);
        parts.armR.rotation.set(0, 0, 0);
        if (parts.forearmL) parts.forearmL.rotation.set(0, 0, 0);
        if (parts.forearmR) parts.forearmR.rotation.set(0, 0, 0);
        if (parts.torso) parts.torso.rotation.set(0, 0, 0);
        if (parts.head) parts.head.rotation.set(0, 0, 0);
        if (parts.pony) parts.pony.rotation.set(0, 0, 0);
      }

      // Stop highlight blinking immediately on arrival!
      this.clearMoveHighlights();
      this.onTokenMoveComplete(token);
    };

    const stepHop = () => {
      if (!this.gameActive) {
        token.isMoving = false;
        return;
      }
      if (waypointIdx >= waypoints.length) {
        finishMove();
        return;
      }

      const toPos = waypoints[waypointIdx];
      const elapsed = performance.now() - hopStartTime;
      const t = Math.min(1.0, elapsed / stepDuration);

      if (isWalker && parts) {
        // ---- REALISTIC HUMAN GAIT WALK CYCLE ----
        const currentX = THREE.MathUtils.lerp(fromPos.x, toPos.x, t);
        const currentZ = THREE.MathUtils.lerp(fromPos.z, toPos.z, t);

        // Natural double-bounce per step (pelvis rise and drop)
        const stepPhase = t * Math.PI * 2;
        const bob = Math.abs(Math.sin(stepPhase)) * 0.045;
        token.mesh.position.set(currentX, 0.36 + bob, currentZ);

        // Smooth rotation to face travel direction
        const dx = toPos.x - fromPos.x;
        const dz = toPos.z - fromPos.z;
        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
          const targetYaw = Math.atan2(dx, dz);
          let deltaYaw = targetYaw - token.mesh.rotation.y;
          deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));
          token.mesh.rotation.y += deltaYaw * 0.45;
        }

        // Leg swing with knee flexion
        const legSwing = Math.sin(stepPhase);
        parts.legL.rotation.x = legSwing * 0.72;
        parts.legR.rotation.x = -legSwing * 0.72;

        if (parts.calfL) parts.calfL.rotation.x = Math.max(0, -legSwing * 0.65);
        if (parts.calfR) parts.calfR.rotation.x = Math.max(0, legSwing * 0.65);
        if (parts.footL) parts.footL.rotation.x = -legSwing * 0.22;
        if (parts.footR) parts.footR.rotation.x = legSwing * 0.22;

        // Counter-balancing arm swing with bent elbows
        parts.armL.rotation.x = -legSwing * 0.52;
        parts.armR.rotation.x = legSwing * 0.52;
        if (parts.forearmL) parts.forearmL.rotation.x = -0.32 + Math.abs(legSwing) * 0.35;
        if (parts.forearmR) parts.forearmR.rotation.x = -0.32 + Math.abs(legSwing) * 0.35;

        // Subtle torso athletic lean and pelvic counter-twist
        if (parts.torso) {
          parts.torso.rotation.x = 0.10;
          parts.torso.rotation.y = -legSwing * 0.12;
        }
        if (parts.head) {
          parts.head.rotation.y = legSwing * 0.06;
        }
        if (parts.pony) {
          parts.pony.rotation.z = Math.sin(stepPhase) * 0.25;
        }
      } else {
        // Classic / Knight / Cyber fluid hop arc
        const hopHeight = 0.85;
        const currentX = THREE.MathUtils.lerp(fromPos.x, toPos.x, t);
        const currentZ = THREE.MathUtils.lerp(fromPos.z, toPos.z, t);
        const currentY = fromPos.y + 4 * hopHeight * t * (1 - t);
        token.mesh.position.set(currentX, currentY, currentZ);

        const dx = toPos.x - fromPos.x;
        const tilt = Math.sin(t * Math.PI) * 0.15;
        token.mesh.rotation.z = dx > 0 ? -tilt : tilt;
      }

      token.halo.position.set(token.mesh.position.x, 0.38, token.mesh.position.z);

      if (t >= 1.0) {
        if (window.soundEngine) {
          window.soundEngine.playTokenHop(startStep + waypointIdx);
        }
        waypointIdx++;
        fromPos = toPos.clone();
        hopStartTime = performance.now();
      }

      requestAnimationFrame(stepHop);
    };

    requestAnimationFrame(stepHop);
  }

  clearMoveHighlights() {
    this.moveHighlights.forEach(hl => {
      this.scene.remove(hl);
      hl.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
    });
    this.moveHighlights = [];
  }

  setPawnSkin(skin) {
    if (this.pawnSkin === skin) return;
    this.pawnSkin = skin;
    try { localStorage.setItem('ludoSpark.pawnSkin', skin); } catch (e) { /* ignore */ }

    // Never rebuild meshes mid-animation — defer until the board is stable
    if (this.state === 'MOVING' || this.state === 'ROLLING') {
      this.pendingSkinApply = true;
      return;
    }
    this.applyPawnSkin();
  }

  applyPawnSkin() {
    this.pendingSkinApply = false;
    const steps = this.tokens.map(t => t.step);
    this.initTokens();
    this.tokens.forEach((t, i) => {
      t.step = steps[i] || 0;
      this.updateTokenPosition(t, false);
    });
    this.adjustOverlappingTokens();
    if (this.state === 'WAIT_SELECT') {
      this.movableTokens = this.getMovableTokens(this.activePlayerIndex, this.currentRoll);
      this.highlightMovableTokens();
    }
    const skinNames = {
      classic: 'Classic Royal Pawns',
      human: '3D Human Walking Pawns',
      knight: 'Golden Knight Pawns',
      cyber: 'Cyber Mecha Pawns'
    };
    this.addHistory(`Equipped ${skinNames[this.pawnSkin] || 'Pawns'}!`);
    this.notifyUI();
  }

  onTokenMoveComplete(token) {
    if (this.gameMode === 'SNAKE') {
      const ladders = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 63: 81, 71: 91 };
      const snakes = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 99: 78 };

      if (ladders[token.step]) {
        const topCell = ladders[token.step];
        this.addHistory(`🪜 Climbed Ladder to ${topCell}!`);
        token.step = topCell;
        this.updateTokenPosition(token, false);
        if (window.soundEngine) window.soundEngine.playSafeSpot();
      } else if (snakes[token.step]) {
        const tailCell = snakes[token.step];
        this.addHistory(`🐍 Bitten by Snake! Slid down to ${tailCell}`);
        token.step = tailCell;
        this.updateTokenPosition(token, false);
        if (window.soundEngine) window.soundEngine.playCapture();
      }

      if (token.step >= 100) {
        token.step = 100;
        this.updateTokenPosition(token, false);
        this.finishedPlayers.push(token.player);
        this.state = 'GAME_OVER';
        if (window.SysLogs) {
          window.SysLogs.push('game', 'Game over. Winner: ' + this.playerConfigs[token.player].name);
        }
        if (window.soundEngine) window.soundEngine.playVictory();
        this.spawnConfetti({ x: 0, y: 5, z: 0 }, 150);
        this.spawnVictoryCelebration(token.player);
        this.notifyUI();
        return;
      }

      this.state = 'WAIT_ROLL';
      this.passTurn();
      this.notifyUI();
      return;
    }

    let awardedExtraTurn = false;
    this.adjustOverlappingTokens();

    if (token.step === 57) {
      this.addHistory(`${this.playerConfigs[token.player].name} token reached HOME!`);
      if (window.soundEngine) window.soundEngine.playTokenHome();
      if (this.characters) this.characters.triggerEmote(token.player, 'win', 3.0);
      this.spawnConfetti(token.mesh.position);
      awardedExtraTurn = true;

      const allTokensHome = this.tokens
        .filter(t => t.player === token.player)
        .every(t => t.step === 57);

      if (allTokensHome && !this.finishedPlayers.includes(token.player)) {
        this.finishedPlayers.push(token.player);
        const rank = this.finishedPlayers.length;
        const rankSuffix = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : '4th';
        this.addHistory(`🎉 ${this.playerConfigs[token.player].name} finished in ${rankSuffix} place!`);
        if (window.soundEngine) window.soundEngine.playVictory();
        this.spawnConfetti({ x: 0, y: 5, z: 0 }, 150);

        if (this.finishedPlayers.length >= this.numPlayers - 1) {
          this.state = 'GAME_OVER';
          if (window.SysLogs) {
            window.SysLogs.push('game', 'Game over. Winner: ' + this.playerConfigs[this.finishedPlayers[0]].name);
          }
          this.spawnVictoryCelebration(this.finishedPlayers[0]);
          this.notifyUI();
          this.saveGame(); // clears save on GAME_OVER
          return;
        }
      }
    } else if (token.step <= 51) {
      const startTrack = this.playerConfigs[token.player].startTrack;
      const trackIdx = (startTrack + token.step - 1) % 52;

      if (!this.safeTrackIndices.includes(trackIdx)) {
        const opponents = this.tokens.filter(
          other => other.player !== token.player &&
          other.step > 0 && other.step <= 51 &&
          (this.playerConfigs[other.player].startTrack + other.step - 1) % 52 === trackIdx
        );

        if (opponents.length > 0) {
          this.triggerCameraShake(0.42);
          this.spawnKnockoutBlast(token.mesh.position, this.playerConfigs[token.player].color);

          if (this.characters) {
            this.characters.triggerEmote(token.player, 'cheer', 2.8);
          }

          opponents.forEach(opp => {
            if (this.characters) {
              this.characters.triggerEmote(opp.player, 'sad', 2.8);
            }
            this.stats.captures++;
            this.addHistory(`${this.playerConfigs[token.player].name} captured ${this.playerConfigs[opp.player].name}'s token!`);
            this.animateTokenKnockoutReturn(opp);
          });
          if (window.soundEngine) window.soundEngine.playCapture();
          if (window.AndroidBridge && window.AndroidBridge.vibrate) {
            window.AndroidBridge.vibrate(80);
          }
          awardedExtraTurn = true;
        }
      } else {
        if (window.soundEngine) window.soundEngine.playSafeSpot();
      }
    }

    if (this.currentRoll === 6 || awardedExtraTurn) {
      this.state = 'WAIT_ROLL';
      this.addHistory(`${this.playerConfigs[token.player].name} earned a bonus roll!`);
      this.notifyUI();
      this.saveGame();
      // ---- BONUS ROLL (double move) — walk-retrieve.js ----
      // Move শেষ, dice এখন board-এ পড়ে আছে। একই খেলোয়াড় আবার পাবে,
      // তাই এবার realistic: player নিজে podium (lobby) থেকে নেমে হেঁটে
      // board-এ যায়, dice তুলে নেয়, আবার podium-এ ফিরে দাঁড়ায়
      // (walk-retrieve.js), তারপর সে আবার board-এ throw করবে
      // (dice-board-throw.js)। walk শেষ না হওয়া পর্যন্ত handleRoll
      // busy guard দিয়ে অপেক্ষা করবে।
      // ⚠️ Safety: walk কোনো কারণে শুরু না হলে আগের flight retrieve
      // (dice-handoff.js FLOW A) fallback চলবে; তাও না হলে holder বসবে —
      // নাহলে dice কোথাও না থেকে চিরতরে অদৃশ্য হয়ে যেত।
      this.diceHolder = -1;
      let walkStarted = false;
      if (this.walkRetrieve && this.characters) {
        try {
          this.walkRetrieve.start(this.activePlayerIndex, () => {
            // walk শেষ — dice হাতে, character পুরোপুরি podium-এ ফিরেছে
            this.diceHolder = this.activePlayerIndex;
            this.notifyUI();
            if (this.playerConfigs[this.activePlayerIndex].isAI) {
              this.scheduleAction(() => this.handleRoll(true), 700);
            }
          });
          walkStarted = this.walkRetrieve.isBusy();
        } catch (e) {
          walkStarted = false;
          if (window.SysLogs) window.SysLogs.push('game', 'Walk-retrieve error: ' + (e && e.message));
        }
      }
      if (!walkStarted) {
        // Fallback: আগের flight retrieve (dice-handoff.js FLOW A)
        if (this.diceHandoff) {
          try {
            this.diceHandoff.retrieveToPlayer(this.activePlayerIndex, () => {
              this.diceHolder = this.activePlayerIndex;
            });
            if (!this.diceHandoff.isBusy()) this.diceHolder = this.activePlayerIndex;
          } catch (e) {
            this.diceHolder = this.activePlayerIndex;
            if (window.SysLogs) window.SysLogs.push('game', 'Retrieve error: ' + (e && e.message));
          }
        } else {
          this.diceHolder = this.activePlayerIndex;
        }
        if (this.playerConfigs[this.activePlayerIndex].isAI) {
          this.scheduleAction(() => this.handleRoll(true), 900);
        }
      }
    } else {
      this.passTurn();
    }
  }

  passTurn() {
    if (!this.gameActive) return;
    this._turnEndPending = false;
    this.timerActive = false;
    this._timerPlayer = -1;
    // কে turn ছাড়ছে — ওই player-ই dice টাকে next player-এর হাতে (dice-handoff.js FLOW B)
    const prevPlayer = this.activePlayerIndex;
    let nextPlayer = (this.activePlayerIndex + 1) % this.numPlayers;
    let loops = 0;
    while (this.finishedPlayers.includes(nextPlayer) && loops < this.numPlayers) {
      nextPlayer = (nextPlayer + 1) % this.numPlayers;
      loops++;
    }

    this.activePlayerIndex = nextPlayer;
    this.consecutiveSixes = 0;
    this.state = 'WAIT_ROLL';
    this.movableTokens = [];
    this.clearHighlights();
    this.notifyUI();
    this.saveGame();

    // ---- TURN-CHANGE DICE HANDOFF (dice-handoff.js FLOW B) ----
    // board-এ পড়ে থাকা dice আগে আগের player-এর হাতে ফেরে (retrieve),
    // তারপর ও আস্তে করে next player-এর হাতে ছুড়ে দেয় (pass), next player
    // catch করে হাতে ধরে — এরপর তার নিজের turn-এ board-এ throw করবে।
    // পুরো animation শেষ হলেই AI turn schedule হবে, যাতে আগে ছুড়ে না দিয়ে
    // AI dice না নিয়ে roll করে ফেলে।
    // ⚠️ Safety: handoff যদি যেকোনো কারণে শুরু না হয়/ব্যর্থ হয়, তবুও
    // holder ও AI schedule চালু থাকবে — নাহলে game সম্পূর্ণ stuck হয়ে যেত।
    this.diceHolder = -1;
    let handoffStarted = false;
    if (this.diceHandoff && this.characters) {
      try {
        this.diceHandoff.passToNextPlayer(prevPlayer, nextPlayer, () => {
          this.diceHolder = nextPlayer;
          this.scheduleAITurn();
        });
        handoffStarted = this.diceHandoff.isBusy();
      } catch (e) {
        handoffStarted = false;
        if (window.SysLogs) window.SysLogs.push('game', 'Handoff error: ' + (e && e.message));
      }
    }
    if (!handoffStarted) {
      this.diceHolder = nextPlayer;
      this.scheduleAITurn();
    }
  }

  spawnConfetti(center, count = 60) {
    const colors = [0xEF4444, 0x10B981, 0xF59E0B, 0x3B82F6, 0xEC4899, 0x8B5CF6];
    for (let i = 0; i < count; i++) {
      const geom = new THREE.PlaneGeometry(0.2, 0.2);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geom, mat);

      mesh.position.set(
        center.x + (Math.random() - 0.5) * 1.5,
        center.y + 0.5 + Math.random() * 2,
        center.z + (Math.random() - 0.5) * 1.5
      );

      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      this.scene.add(mesh);
      this.confettiParticles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 5, 4 + Math.random() * 6, (Math.random() - 0.5) * 5),
        rotVel: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        lifetime: 1.8,
        age: 0
      });
    }
  }

  spawnBoardShockwave(pos) {
    const geom = new THREE.RingGeometry(0.35, 0.65, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xFEF08A,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, 0.355, pos.z);
    this.scene.add(mesh);

    const startTime = performance.now();
    const duration = 420;
    const animateWave = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1.0, elapsed / duration);
      const scale = 1.0 + t * 2.8;
      mesh.scale.set(scale, scale, 1);
      mat.opacity = 0.85 * (1 - t);
      if (t < 1.0) {
        requestAnimationFrame(animateWave);
      } else {
        this.scene.remove(mesh);
        geom.dispose();
        mat.dispose();
      }
    };
    requestAnimationFrame(animateWave);
  }

  triggerCameraShake(intensity = 0.35) {
    this.cameraShake = Math.max(this.cameraShake || 0, intensity);
  }

  spawnKnockoutBlast(pos, colorHex) {
    if (window.soundEngine) window.soundEngine.playBlast();
    const blastColors = [0xF59E0B, 0xEF4444, 0xFFFFFF, new THREE.Color(colorHex).getHex()];
    const count = 36;
    for (let i = 0; i < count; i++) {
      const geom = new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 6);
      const col = blastColors[Math.floor(Math.random() * blastColors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos.x, pos.y + 0.1, pos.z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 5.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        3.5 + Math.random() * 5.5,
        Math.sin(angle) * speed
      );

      this.confettiParticles.push({
        mesh,
        vel,
        rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        lifetime: 0.65,
        age: 0
      });
    }

    this.spawnBoardShockwave(pos);
  }

  animateTokenKnockoutReturn(opp) {
    opp.isMoving = true;
    opp.step = 0;
    const fromPos = opp.mesh.position.clone();
    const toPos = this.getTokenWorldPos(opp);
    const duration = 650;
    const startTime = performance.now();
    const apexY = 4.2;

    const flyStep = () => {
      if (!this.gameActive) {
        opp.isMoving = false;
        return;
      }
      const elapsed = performance.now() - startTime;
      const t = Math.min(1.0, elapsed / duration);

      // Parabolic ballistic arc
      const curX = THREE.MathUtils.lerp(fromPos.x, toPos.x, t);
      const curZ = THREE.MathUtils.lerp(fromPos.z, toPos.z, t);
      const curY = THREE.MathUtils.lerp(fromPos.y, toPos.y, t) + 4 * (apexY - fromPos.y) * t * (1 - t);

      opp.mesh.position.set(curX, curY, curZ);
      opp.mesh.rotation.x += 0.35;
      opp.mesh.rotation.y += 0.45;
      opp.mesh.rotation.z += 0.30;
      opp.halo.position.set(curX, 0.38, curZ);

      if (t < 1.0) {
        requestAnimationFrame(flyStep);
      } else {
        opp.isMoving = false;
        opp.mesh.position.copy(toPos);
        opp.mesh.rotation.set(0, 0, 0);
        opp.halo.position.set(toPos.x, 0.38, toPos.z);
        this.adjustOverlappingTokens();
        this.spawnBoardShockwave(toPos);
      }
    };
    requestAnimationFrame(flyStep);
  }

  triggerPlayerEmote(playerId, emoteType) {
    if (this.characters) {
      this.characters.triggerEmote(playerId, emoteType);
    }
  }

  /**
   * Set Camera Mode - smoothly transitions between locked viewpoints,
   * always perfectly fitted to the mobile screen with 0% accidental screen dragging.
   */
  setCameraPreset(mode) {
    this.currentPreset = mode;
    this.fitBoardToScreen();
  }

  addHistory(msg) {
    this.turnHistory.unshift(msg);
    if (this.turnHistory.length > 20) this.turnHistory.pop();
    this.notifyUI();
  }

  /**
   * Per-player win progress: average steps taken toward 57, as 0..100
   */
  getPlayerProgress(playerId) {
    const playerTokens = this.tokens.filter(t => t.player === playerId);
    if (playerTokens.length === 0) return 0;
    const total = playerTokens.reduce((sum, t) => sum + Math.min(t.step, 57), 0);
    return Math.round((total / (playerTokens.length * 57)) * 100);
  }

  notifyUI() {
    // Apply a queued pawn skin once the board is stable again
    if (this.pendingSkinApply && (this.state === 'WAIT_ROLL' || this.state === 'WAIT_SELECT')) {
      this.applyPawnSkin();
    }

    // Turn Timer state management
    if (this.gameActive && (this.state === 'WAIT_ROLL' || this.state === 'WAIT_SELECT')) {
      if (!this.timerActive || this._timerPlayer !== this.activePlayerIndex) {
        this.timerActive = true;
        this.turnTimeRemaining = this.turnTimeLimit;
        this._timerPlayer = this.activePlayerIndex;
        this.lastTickSec = -1;
      }
    } else {
      this.timerActive = false;
      this._timerPlayer = -1;
    }

    // Highlight the active player's 3D character
    if (this.characters) this.characters.setActive(this.activePlayerIndex);

    const activeCfg = this.playerConfigs[this.activePlayerIndex];
    const data = {
      activePlayer: {
        id: activeCfg.id,
        name: activeCfg.name,
        color: activeCfg.color,
        isAI: activeCfg.isAI
      },
      state: this.state,
      currentRoll: this.currentRoll,
      movableCount: this.movableTokens.length,
      history: this.turnHistory.slice(0, 5),
      finishedPlayers: this.finishedPlayers.map(p => this.playerConfigs[p].name),
      isGameOver: this.state === 'GAME_OVER',
      numPlayers: this.numPlayers,
      playerProgress: this.playerConfigs.map((_, i) => this.getPlayerProgress(i)),
      stats: {
        turns: this.stats.turns,
        sixes: this.stats.sixes,
        captures: this.stats.captures
      }
    };

    if (window.onGameStateChanged) {
      window.onGameStateChanged(data);
    }
    if (window.AndroidBridge && window.AndroidBridge.onGameStateUpdate) {
      window.AndroidBridge.onGameStateUpdate(JSON.stringify(data));
    }
  }

  newGame(numPlayers = 4, botCount = 3, difficulty = this.difficulty) {
    this._matchId++;
    this.timerActive = false;
    this._timerPlayer = -1;
    if (this.diceHandoff) this.diceHandoff.cancel();
    if (this.walkRetrieve) this.walkRetrieve.cancel();
    this._turnEndPending = false;
    this.gameMode = 'LUDO';
    this.numPlayers = numPlayers;
    this.difficulty = difficulty;
    this.pendingSkinApply = false;

    if (this.boardGroup) this.scene.remove(this.boardGroup);
    this.boardGroup = this.builder.buildBoard(this.scene, this.boardTheme, 'LUDO');

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ludoSpark.difficulty', difficulty);
    }
    for (let i = 0; i < 4; i++) {
      this.playerConfigs[i].isAI = i > 0 && (i <= botCount);
    }
    this.activePlayerIndex = 0;
    this.state = 'WAIT_ROLL';
    this.currentRoll = 0;
    this.consecutiveSixes = 0;
    this.finishedPlayers = [];
    this.turnHistory = [];
    this.stats = { turns: 0, sixes: 0, captures: 0 };
    this.diceHolder = -1;
    this.clearVictoryCelebration();
    this.clearMoveHighlights();
    this.initTokens();
    this.fitBoardToScreen();
    this.addHistory(`New Ludo game started with ${numPlayers} players!`);
    this.notifyUI();
    this.saveGame();
  }

  newSnakeLadderGame(numPlayers = 2, botCount = 1) {
    this._matchId++;
    this.timerActive = false;
    this._timerPlayer = -1;
    if (this.diceHandoff) this.diceHandoff.cancel();
    if (this.walkRetrieve) this.walkRetrieve.cancel();
    this._turnEndPending = false;
    this.gameMode = 'SNAKE';
    this.numPlayers = numPlayers;
    this.pendingSkinApply = false;
    this.clearVictoryCelebration();

    if (this.boardGroup) this.scene.remove(this.boardGroup);
    this.boardGroup = this.builder.buildBoard(this.scene, 'classic', 'SNAKE');

    for (let i = 0; i < 4; i++) {
      this.playerConfigs[i].isAI = i >= (numPlayers - botCount);
    }

    this.tokens.forEach(t => {
      this.scene.remove(t.mesh);
      this.scene.remove(t.halo);
    });
    this.tokens = [];

    for (let p = 0; p < this.numPlayers; p++) {
      const cfg = this.playerConfigs[p];
      const mesh = this.builder.createTokenMesh(cfg.color, p, 0);
      this.scene.add(mesh);

      const haloGeom = new THREE.RingGeometry(0.5, 0.75, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xFDE047, side: THREE.DoubleSide, transparent: true, opacity: 0.0 });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.38;
      this.scene.add(halo);

      const token = { id: `${p}_0`, player: p, tokenIndex: 0, step: 1, mesh, halo, isMoving: false };
      this.tokens.push(token);
      this.updateTokenPosition(token, false);
    }

    this.activePlayerIndex = 0;
    this.state = 'WAIT_ROLL';
    this.currentRoll = 0;
    this.finishedPlayers = [];
    this.turnHistory = [];
    this.stats = { turns: 0, sixes: 0, captures: 0 };
    this.clearMoveHighlights();
    this.fitBoardToScreen();
    this.addHistory(`🐍 3D Snake & Ladder game started with ${numPlayers} players!`);
    this.notifyUI();
  }

  // ---- Save / Resume (localStorage) ----

  saveGame() {
    try {
      if (typeof localStorage === 'undefined') return;
      if (this.state === 'GAME_OVER' || !this.tokens || this.tokens.length === 0) {
        this.clearSave();
        return;
      }

      // Do NOT save if no turns or moves have actually been made yet (all tokens at step 0)
      const hasMoves = this.tokens.some(t => t.step > 0);
      if (!hasMoves) {
        this.clearSave();
        return;
      }

      const data = {
        v: 1,
        numPlayers: this.numPlayers,
        isAI: this.playerConfigs.map(c => c.isAI),
        difficulty: this.difficulty,
        activePlayerIndex: this.activePlayerIndex,
        state: this.state,
        currentRoll: this.currentRoll,
        consecutiveSixes: this.consecutiveSixes,
        finishedPlayers: this.finishedPlayers,
        tokenSteps: this.tokens.map(t => t.step),
        stats: this.stats
      };
      localStorage.setItem('ludoSparkSave', JSON.stringify(data));
    } catch (e) {
      if (window.SysLogs) window.SysLogs.push('storage', 'Could not save game: ' + (e && e.message || e), e && e.stack);
    }
  }

  loadSave() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem('ludoSparkSave');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.tokenSteps) || data.tokenSteps.length !== 16) return null;

      // Ensure that at least ONE token has actually moved (step > 0)
      const hasMoves = data.tokenSteps.some(s => s > 0);
      if (!hasMoves) {
        this.clearSave();
        return null;
      }

      return data;
    } catch (e) {
      if (window.SysLogs) window.SysLogs.push('storage', 'Could not load saved game: ' + (e && e.message || e), e && e.stack);
      return null;
    }
  }

  clearSave() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('ludoSparkSave');
    } catch (e) {
      if (window.SysLogs) window.SysLogs.push('storage', 'Could not clear saved game: ' + (e && e.message || e), e && e.stack);
    }
  }

  restoreGame(data) {
    if (!data) return false;
    try {
      this._matchId++;
      this.timerActive = false;
      this._timerPlayer = -1;
      this.numPlayers = data.numPlayers || 4;
      this.playerConfigs.forEach((c, i) => { c.isAI = !!(data.isAI && data.isAI[i]); });
      this.difficulty = data.difficulty || 'normal';
      this.activePlayerIndex = data.activePlayerIndex || 0;
      this.currentRoll = data.currentRoll || 0;
      this.consecutiveSixes = data.consecutiveSixes || 0;
      this.finishedPlayers = Array.isArray(data.finishedPlayers) ? data.finishedPlayers : [];
      this.turnHistory = [];
      this.stats = data.stats || { turns: 0, sixes: 0, captures: 0 };
      this.diceHolder = -1;
      this.clearMoveHighlights();

      this.initTokens();
      this.tokens.forEach((t, i) => {
        t.step = data.tokenSteps[i] || 0;
        this.updateTokenPosition(t, false);
      });
      this.adjustOverlappingTokens();

      // Restore stable state only (ROLLING/MOVING are never saved, but guard anyway)
      if (data.state === 'WAIT_SELECT' && this.currentRoll >= 1 && this.currentRoll <= 6) {
        this.movableTokens = this.getMovableTokens(this.activePlayerIndex, this.currentRoll);
        if (this.movableTokens.length > 0) {
          this.state = 'WAIT_SELECT';
          this.highlightMovableTokens();
        } else {
          this.state = 'WAIT_ROLL';
          this.movableTokens = [];
        }
      } else {
        this.state = 'WAIT_ROLL';
        this.movableTokens = [];
      }

      this.addHistory('Game resumed!');
      this.notifyUI();

      return true;
    } catch (e) {
      if (window.SysLogs) window.SysLogs.push('storage', 'Could not restore saved game: ' + (e && e.message || e), e && e.stack);
      return false;
    }
  }

  onResize() {
    this.fitBoardToScreen();
  }

  spawnDiceTrailParticle(pos) {
    const geom = new THREE.SphereGeometry(0.12, 6, 6);
    const colors = [0xFDE047, 0xF59E0B, 0xFEF08A, 0x60A5FA];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.25,
      pos.y + (Math.random() - 0.5) * 0.25,
      pos.z + (Math.random() - 0.5) * 0.25
    );
    this.scene.add(mesh);
    this.confettiParticles.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8),
      rotVel: new THREE.Vector3(0, 0, 0),
      lifetime: 0.35,
      age: 0
    });
  }

  animate() {
    if (!this._loopRunning) return;
    this._animationFrame = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    // Physics step & dice trail emission
    // ⚠️ try/catch: physics কোনো এক ফ্রেমেও throw করলে camera/timer/
    // characters/handoff সব বাদ যাবে ও পুরো game মারা যাবে — তাই এক ফ্রেমের
    // ভুল থেকে পুরো loop রক্ষা। সমস্যা হলে log-এ যাবে (প্রথমবার)।
    if (this.physics) {
      try {
        this.physics.update(delta);
      } catch (e) {
        if (!this._physicsErrLogged) {
          this._physicsErrLogged = true;
          if (window.SysLogs) window.SysLogs.push('game', 'Physics update error: ' + (e && e.message));
        }
      }
      if (this.physics.isRolling && this.diceMesh && Math.random() < 0.75) {
        this.spawnDiceTrailParticle(this.diceMesh.position);
      }
    }
    // Dice handoff arc flights (board↔hand retrieve + player→player pass)
    if (this.diceHandoff) this.diceHandoff.update(delta);
    // Bonus walk-retrieve (walk-retrieve.js) — character হেঁটে dice তুলে
    // আনে; এটাও প্রতি frame চলতে হবে, নাহলে walk জমে থাকবে
    if (this.walkRetrieve) this.walkRetrieve.update(delta);

    // ---- ROLL WATCHDOG: state=ROLLING থাকলেও physics থেমে থাকলে
    // (callback কোথাও হারিয়ে গেলে) জবরদখ্তে roll শেষ দেখাও, নাহলে game
    // চিরতরে ROLLING-এ জমে থাকত। windup/flight চলাকালীন watchdog থামা।
    if (this.state === 'ROLLING' && this.physics) {
      if (!this.physics.isRolling && !this.physics.isHeld) {
        this._rollWatchdog = (this._rollWatchdog || 0) + delta;
        if (this._rollWatchdog > 3.0) {
          this._rollWatchdog = 0;
          if (window.SysLogs) window.SysLogs.push('game', 'Roll watchdog fired');
          this.onDiceRollComplete(this.currentRoll || 1);
        }
      } else {
        this._rollWatchdog = 0;
      }
    } else {
      this._rollWatchdog = 0;
    }

    // Camera trauma / impact shake
    if (this.cameraShake > 0.005) {
      const sx = (Math.random() - 0.5) * this.cameraShake * 1.4;
      const sy = (Math.random() - 0.5) * this.cameraShake * 0.8;
      const sz = (Math.random() - 0.5) * this.cameraShake * 1.4;
      this.camera.position.x += sx;
      this.camera.position.y += sy;
      this.camera.position.z += sz;
      this.cameraShake *= 0.86;
    }

    // Turn countdown timer
    if (this.timerActive) {
      this.turnTimeRemaining -= delta;
      const secInt = Math.ceil(Math.max(0, this.turnTimeRemaining));
      if (secInt <= 5 && secInt > 0 && secInt !== this.lastTickSec) {
        this.lastTickSec = secInt;
        if (window.soundEngine) window.soundEngine.playTick(true);
      }

      if (window.onTimerUpdate) {
        window.onTimerUpdate(
          this.activePlayerIndex,
          Math.max(0, this.turnTimeRemaining),
          this.turnTimeLimit
        );
      }

      if (this.turnTimeRemaining <= 0) {
        this.timerActive = false;
        if (this.state === 'WAIT_ROLL') {
          // fromRetry=true — handoff চলাকালীন auto-roll অপেক্ষা করবে
          this.handleRoll(true);
        } else if (this.state === 'WAIT_SELECT') {
          if (this.movableTokens.length > 0) {
            const best = this.chooseAIBestToken(this.movableTokens, this.currentRoll);
            this.handleTokenSelect(best);
          } else {
            this.passTurn();
          }
        }
      }
    }

    // ---- 3D player characters + dice holding/throw ----
    if (this.characters) {
      this.characters.update(delta);

      // Dice হাতে "ধরা" পড়ে থাকবে যখন:
      //  - turn শুরুর জন্য অপেক্ষা (WAIT_ROLL), dice কোথাও উড়ছে না
      //  - handoff retrieve বা pass চলছে না (else dice মাঝপথে হাতে টেনে আসত)
      //  - passTurn ডাকা হয়েছে কিন্তু এখনো handoff শুরু হয়নি (else ছোট্ট
      //    ঝলকে dice হাতে চলে যেত আর তারপর আবার উড়ত)
      if (this.state === 'WAIT_ROLL' && !this.physics.isRolling &&
          !(this.diceHandoff && this.diceHandoff.isBusy()) &&
          !(this.walkRetrieve && this.walkRetrieve.isBusy()) &&
          !this._turnEndPending) {
        this.diceHolder = this.activePlayerIndex;
      }

      if (this.diceHolder >= 0) {
        const hand = this.characters.getHandWorldPosition(this.diceHolder, this._tmpVec);
        if (hand) {
          this.physics.holdAt(hand.x, hand.y + 0.17, hand.z);
        }
        this.characters.setHolding(this.diceHolder);
      } else {
        this.characters.setHolding(-1);
      }
    }

    // Blink the cells the pawn is walking across with dynamic traveling ripple
    if (this.moveHighlights.length > 0) {
      const blinkTime = performance.now() * 0.008;
      this.moveHighlights.forEach(hl => {
        const curIdx = hl.userData.getCurrentStep ? hl.userData.getCurrentStep() : 0;
        const stepIdx = hl.userData.stepIndex !== undefined ? hl.userData.stepIndex : 0;
        const coreMat = hl.userData.coreMat || hl.material;
        const haloMat = hl.userData.haloMat;

        // Rainbow preset: cycle hue over time per highlight
        if (hl.userData.rainbow) {
          const hue = (blinkTime * 0.18 + stepIdx * 0.13) % 1;
          const col = new THREE.Color().setHSL(hue, 0.9, 0.6);
          if (coreMat) coreMat.color.copy(col);
          if (haloMat) haloMat.color.copy(col);
        }

        if (stepIdx < curIdx) {
          // Already traversed cells: smooth quick fade down
          if (coreMat) coreMat.opacity = Math.max(0, coreMat.opacity - delta * 4.0);
          if (haloMat) haloMat.opacity = Math.max(0, haloMat.opacity - delta * 4.0);
        } else if (stepIdx === curIdx) {
          // Cell currently being stepped onto: brightest pulsating flash
          const flash = 0.5 + 0.5 * Math.sin(blinkTime * 14);
          if (coreMat) coreMat.opacity = 0.6 + 0.38 * flash;
          if (haloMat) haloMat.opacity = 0.5 + 0.45 * flash;
        } else {
          // Upcoming cells: traveling ripple wave in player color
          const wave = 0.5 + 0.5 * Math.sin(blinkTime * 8 - (stepIdx - curIdx) * 1.2);
          if (coreMat) coreMat.opacity = 0.20 + 0.60 * wave;
          if (haloMat) haloMat.opacity = 0.28 * wave;
        }
      });
    }

    // Pulse highlight halos
    const time = performance.now() * 0.005;
    this.tokens.forEach(t => {
      if (t.halo.material.opacity > 0.05) {
        const scale = 1.0 + Math.sin(time * 3) * 0.18;
        t.halo.scale.set(scale, scale, 1);
      }
    });

    // Animate 3D Floating Safe Stars
    if (this.builder && this.builder.floatingStars) {
      const starTime = performance.now() * 0.002;
      this.builder.floatingStars.forEach(s => {
        s.mesh.rotation.z += delta * 1.6;
        s.mesh.position.y = s.basePosY + Math.sin(starTime * 2.5 + s.phase) * 0.05;
      });
    }

    // Animate 3D Entry Chevrons
    if (this.builder && this.builder.entryChevrons) {
      const chevTime = performance.now() * 0.003;
      this.builder.entryChevrons.forEach(c => {
        c.mesh.position.y = c.basePosY + Math.sin(chevTime * 2 + c.phase) * 0.03;
      });
    }

    // Rotate Center Jewel Pinnacle
    if (this.builder && this.builder.centerPinnacle) {
      this.builder.centerPinnacle.rotation.y += delta * 1.4;
    }

    // Animate 3D Victory Trophy
    if (this.victoryTrophy && this.victoryTrophy.active) {
      if (this.victoryTrophy.scale < this.victoryTrophy.targetScale) {
        this.victoryTrophy.scale += delta * 2.5;
        if (this.victoryTrophy.scale > this.victoryTrophy.targetScale) {
          this.victoryTrophy.scale = this.victoryTrophy.targetScale;
        }
        const s = this.victoryTrophy.scale;
        this.victoryTrophy.group.scale.set(s, s, s);
      }
      this.victoryTrophy.group.rotation.y += delta * 0.9;
      if (this.victoryTrophy.crown) {
        this.victoryTrophy.crown.rotation.y += delta * 2.0;
      }
    }

    // Animate Confetti Particles
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.age += delta;
      p.vel.y -= 9.8 * delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.rotation.x += p.rotVel.x * delta;
      p.mesh.rotation.y += p.rotVel.y * delta;
      p.mesh.rotation.z += p.rotVel.z * delta;

      if (p.mesh.position.y < 0.35) {
        p.vel.y = -p.vel.y * 0.3;
        p.vel.x *= 0.6;
        p.vel.z *= 0.6;
      }

      if (p.age >= p.lifetime) {
        this.scene.remove(p.mesh);
        this.confettiParticles.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  spawnVictoryCelebration(winnerPlayerIndex = 0) {
    this.clearVictoryCelebration();

    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.92,
      roughness: 0.12,
      emissive: 0x78350F,
      emissiveIntensity: 0.25
    });
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      metalness: 0.2,
      roughness: 0.1
    });

    // 1. Pedestal Base
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.35, 8), marbleMat);
    step1.position.y = 0.18;
    group.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.35, 8), goldMat);
    step2.position.y = 0.52;
    group.add(step2);

    // 2. Stem Column
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.2, 16), goldMat);
    stem.position.y = 1.3;
    group.add(stem);

    const stemRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 12, 24), goldMat);
    stemRing.rotation.x = Math.PI / 2;
    stemRing.position.y = 1.6;
    group.add(stemRing);

    // 3. Chalice Cup Bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.45, 1.6, 24, 1, true), goldMat);
    bowl.position.y = 2.5;
    group.add(bowl);

    const bowlBase = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), goldMat);
    bowlBase.position.y = 1.8;
    group.add(bowlBase);

    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 12, 32), goldMat);
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.y = 3.3;
    group.add(bowlRim);

    // 4. Two Ornate Handles
    [-1, 1].forEach(side => {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.1, 12, 24, Math.PI * 1.3), goldMat);
      handle.position.set(side * 1.35, 2.5, 0);
      handle.rotation.z = side * Math.PI * 0.25;
      group.add(handle);
    });

    // 5. Crown Crest Floating Inside Cup
    const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), goldMat);
    crown.position.y = 3.6;
    group.add(crown);

    // Shimmering Light
    const trophyLight = new THREE.PointLight(0xFDE047, 1.5, 12);
    trophyLight.position.y = 3.8;
    group.add(trophyLight);

    group.position.set(0, 1.2, 0);
    group.scale.set(0.01, 0.01, 0.01);
    this.scene.add(group);

    this.victoryTrophy = {
      group,
      crown,
      light: trophyLight,
      scale: 0.01,
      targetScale: 1.0,
      active: true
    };

    // Continuous Victory Coin Fountain
    this.victoryFountainInterval = setInterval(() => {
      if (!this.victoryTrophy || !this.victoryTrophy.active) return;
      this.spawnVictoryCoins(8);
    }, 280);
  }

  spawnVictoryCoins(count = 8) {
    const coinGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xFBBF24,
      metalness: 0.95,
      roughness: 0.12,
      emissive: 0x92400E,
      emissiveIntensity: 0.3
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(coinGeom, coinMat);
      mesh.position.set(
        (Math.random() - 0.5) * 0.8,
        3.5 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.8
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.0;
      this.confettiParticles.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 5.0 + Math.random() * 4.0, Math.sin(angle) * speed),
        rotVel: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12),
        lifetime: 2.2,
        age: 0
      });
    }
  }

  clearVictoryCelebration() {
    if (this.victoryFountainInterval) {
      clearInterval(this.victoryFountainInterval);
      this.victoryFountainInterval = null;
    }
    if (this.victoryTrophy) {
      this.scene.remove(this.victoryTrophy.group);
      this.victoryTrophy = null;
    }
  }
}

window.LudoGame = LudoGame;
