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
    this.currentRoll = 0;
    this.consecutiveSixes = 0;
    this.movableTokens = [];
    this.turnHistory = [];
    this.finishedPlayers = [];

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

    // Particles
    this.confettiParticles = [];

    // Cell blink highlights during token movement
    this.moveHighlights = [];
    this.diceHolder = -1;
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

    // Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
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

    const boardExtent = 22.8; // comfortably frames the entire board and the 4 corner 3D characters
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);

    // Ensure board fits horizontally within ~92% width, and vertically leaving margins for UI bars
    const distW = (boardExtent / 2) / Math.tan(hFovRad / 2) / 0.92;
    const distH = (boardExtent / 2) / Math.tan(vFovRad / 2) / 0.74;
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

  handleRoll() {
    if (this.state !== 'WAIT_ROLL') return;
    this.state = 'ROLLING';
    this.clearHighlights();

    // Fair dice roll 1..6
    const rollValue = Math.floor(Math.random() * 6) + 1;
    this.currentRoll = rollValue;

    if (window.soundEngine) window.soundEngine.init();
    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(40);
    }

    this.notifyUI();

    // The dice is held in the active player's 3D character hand.
    // On click, the character winds up and throws it onto the board.
    const tossAngles = [
      3 * Math.PI / 4,   // Player 1: bottom-left
      -3 * Math.PI / 4,  // Player 2: top-left
      -Math.PI / 4,      // Player 3: top-right
      Math.PI / 4        // Player 4: bottom-right
    ];
    const playerId = this.activePlayerIndex;

    const launch = () => {
      let handPos = null;
      if (this.characters) {
        const hand = this.characters.getHandWorldPosition(playerId, this._tmpVec);
        if (hand) handPos = hand.clone();
      }
      this.diceHolder = -1;
      this.physics.roll(rollValue, (finalValue) => {
        this.onDiceRollComplete(finalValue);
      }, tossAngles[playerId], handPos);
    };

    if (this.characters) {
      this.characters.startThrow(playerId, launch);
    } else {
      launch();
    }
  }

  onDiceRollComplete(roll) {
    this.currentRoll = roll;

    // Check consecutive sixes
    if (roll === 6) {
      if (window.soundEngine) window.soundEngine.playSixRoll();
      this.consecutiveSixes++;
      if (this.consecutiveSixes >= 3) {
        this.addHistory(`Rolled 3 consecutive 6s! Turn passed.`);
        this.consecutiveSixes = 0;
        this.state = 'WAIT_ROLL';
        setTimeout(() => this.passTurn(), 900);
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
      setTimeout(() => this.passTurn(), 900);
    } else if (this.movableTokens.length === 1 && this.playerConfigs[this.activePlayerIndex].isAI) {
      this.state = 'MOVING';
      this.handleTokenSelect(this.movableTokens[0]);
    } else {
      this.state = 'WAIT_SELECT';
      this.highlightMovableTokens();
      if (this.playerConfigs[this.activePlayerIndex].isAI) {
        setTimeout(() => {
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
    waypoints.forEach((wp, idx) => {
      const hl = this.builder.createCellHighlight(cfg.color);
      hl.position.set(wp.x, 0.356, wp.z);
      hl.visible = true;
      hl.userData.stepIndex = idx;
      hl.userData.totalSteps = waypoints.length;
      hl.userData.getCurrentStep = () => waypointIdx;
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
        if (window.soundEngine) window.soundEngine.playVictory();
        this.spawnConfetti({ x: 0, y: 5, z: 0 }, 150);
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
          opponents.forEach(opp => {
            opp.step = 0;
            this.updateTokenPosition(opp, false);
            this.addHistory(`${this.playerConfigs[token.player].name} captured ${this.playerConfigs[opp.player].name}'s token!`);
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
      if (this.playerConfigs[this.activePlayerIndex].isAI) {
        setTimeout(() => this.handleRoll(), 900);
      }
    } else {
      this.passTurn();
    }
  }

  passTurn() {
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

    if (this.playerConfigs[this.activePlayerIndex].isAI && this.state === 'WAIT_ROLL') {
      setTimeout(() => this.handleRoll(), 800);
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
      playerProgress: this.playerConfigs.map((_, i) => this.getPlayerProgress(i))
    };

    if (window.onGameStateChanged) {
      window.onGameStateChanged(data);
    }
    if (window.AndroidBridge && window.AndroidBridge.onGameStateUpdate) {
      window.AndroidBridge.onGameStateUpdate(JSON.stringify(data));
    }
  }

  newGame(numPlayers = 4, botCount = 3, difficulty = this.difficulty) {
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
    this.diceHolder = -1;
    this.clearMoveHighlights();
    this.initTokens();
    this.fitBoardToScreen();
    this.addHistory(`New Ludo game started with ${numPlayers} players!`);
    this.notifyUI();
    this.saveGame();
  }

  newSnakeLadderGame(numPlayers = 2, botCount = 1) {
    this.gameMode = 'SNAKE';
    this.numPlayers = numPlayers;
    this.pendingSkinApply = false;

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
    this.clearMoveHighlights();
    this.fitBoardToScreen();
    this.addHistory(`🐍 3D Snake & Ladder game started with ${numPlayers} players!`);
    this.notifyUI();
  }

  // ---- Save / Resume (localStorage) ----

  saveGame() {
    try {
      if (typeof localStorage === 'undefined') return;
      if (this.state === 'GAME_OVER') {
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
        tokenSteps: this.tokens.map(t => t.step)
      };
      localStorage.setItem('ludoSparkSave', JSON.stringify(data));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  loadSave() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem('ludoSparkSave');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.tokenSteps) || data.tokenSteps.length !== 16) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  clearSave() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('ludoSparkSave');
    } catch (e) { /* ignore */ }
  }

  restoreGame(data) {
    if (!data) return false;
    try {
      this.numPlayers = data.numPlayers || 4;
      this.playerConfigs.forEach((c, i) => { c.isAI = !!(data.isAI && data.isAI[i]); });
      this.difficulty = data.difficulty || 'normal';
      this.activePlayerIndex = data.activePlayerIndex || 0;
      this.currentRoll = data.currentRoll || 0;
      this.consecutiveSixes = data.consecutiveSixes || 0;
      this.finishedPlayers = Array.isArray(data.finishedPlayers) ? data.finishedPlayers : [];
      this.turnHistory = [];
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

      if (this.playerConfigs[this.activePlayerIndex].isAI && this.state === 'WAIT_ROLL') {
        setTimeout(() => this.handleRoll(), 800);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  onResize() {
    this.fitBoardToScreen();
  }

  spawnDiceTrailParticle(pos) {
    const geom = new THREE.SphereGeometry(0.08, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFBBF24, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.confettiParticles.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 1, Math.random() * 2, (Math.random() - 0.5) * 1),
      rotVel: new THREE.Vector3(0,0,0),
      lifetime: 0.4,
      age: 0
    });
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    // Physics step
    if (this.physics) {
      this.physics.update(delta);
      if (this.physics.isRolling && this.diceMesh && Math.random() < 0.6) {
        this.spawnDiceTrailParticle(this.diceMesh.position);
      }
    }
      this.physics.update(delta);
    }

    // ---- 3D player characters + dice holding/throw ----
    if (this.characters) {
      this.characters.update(delta);

      if (this.state === 'WAIT_ROLL' && !this.physics.isRolling) {
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
}

window.LudoGame = LudoGame;
