/**
 * 3D Ludo & Snake-and-Ladder Board Generator & Procedural Texture Studio
 * Supports multiple 3D Dice Skins, Board Themes, and 3D Snake & Ladder Mode:
 * - Skins: Classic White, Royal Gold, Cyber Neon, Ruby Jewel, Emerald Jade
 * - Themes: Classic Royal, Mahogany Wood, Cyberpunk Neon, Galaxy Nebula
 * - Modes: 3D Ludo Board & 3D Snake & Ladder Board (100 cells with snakes & ladders)
 */
class LudoBoardBuilder {
  constructor() {
    this.boardSize = 18.0;
    this.cellSize = this.boardSize / 15.0;
  }

  cellToWorld(row, col) {
    const half = this.boardSize / 2;
    const x = (col + 0.5) * this.cellSize - half;
    const z = (row + 0.5) * this.cellSize - half;
    return { x, y: 0.35, z };
  }

  /**
   * Calculates 3D world coordinate for a Snake & Ladder cell [1..100]
   */
  snakeCellToWorld(cellNum) {
    const idx = Math.max(1, Math.min(100, cellNum)) - 1;
    const r = Math.floor(idx / 10); // 0 at bottom, 9 at top
    const cRaw = idx % 10;
    const col = (r % 2 === 0) ? cRaw : (9 - cRaw);

    const cs = this.boardSize / 10.0;
    const half = this.boardSize / 2;
    const x = (col + 0.5) * cs - half;
    const z = (9 - r + 0.5) * cs - half;
    return { x, y: 0.36, z };
  }

  /**
   * Generates a high-res 2048x2048 Ludo board texture
   */
  createBoardTexture(theme = 'classic') {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const S = 2048;
    const cs = S / 15;

    let bgFill = '#FFFFFF';
    let lineStroke = '#334155';
    let yardBg = '#F8FAFC';

    if (theme === 'wood') {
      bgFill = '#5C3317';
      lineStroke = '#3D1E0B';
      yardBg = '#8B4513';
    } else if (theme === 'cyber') {
      bgFill = '#090D16';
      lineStroke = '#38BDF8';
      yardBg = '#1E293B';
    } else if (theme === 'galaxy') {
      bgFill = '#020617';
      lineStroke = '#6366F1';
      yardBg = '#0F172A';
    }

    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, S, S);

    const roundRect = (x, y, w, h, r, fill, stroke, strokeW = 3) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.stroke(); }
    };

    const drawStar = (cx, cy, spikes, outerRadius, innerRadius, fillColor, strokeColor) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx, y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step;
        x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 3; ctx.stroke(); }
    };

    const drawCurvedArrow = (cx, cy, rotAngle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotAngle);
      ctx.beginPath();
      ctx.arc(0, cs * 0.1, cs * 0.22, Math.PI, 0, false);
      ctx.lineTo(cs * 0.22, -cs * 0.15);
      ctx.lineWidth = 8;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cs * 0.05, -cs * 0.12);
      ctx.lineTo(cs * 0.22, -cs * 0.28);
      ctx.lineTo(cs * 0.38, -cs * 0.12);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    const drawBase = (row, col, colorHex, label, labelSide) => {
      const bx = col * cs, by = row * cs, bw = 6 * cs, bh = 6 * cs;
      ctx.fillStyle = colorHex;
      ctx.fillRect(bx, by, bw, bh);

      const pad = cs * 0.85;
      roundRect(bx + pad, by + pad, bw - pad * 2, bh - pad * 2, 22, yardBg, '#94A3B8', 4);

      const sockets = [
        { r: row + 1.8, c: col + 1.8 },
        { r: row + 1.8, c: col + 4.2 },
        { r: row + 4.2, c: col + 1.8 },
        { r: row + 4.2, c: col + 4.2 }
      ];

      sockets.forEach((s) => {
        const sx = s.c * cs, sy = s.r * cs;
        const outerR = cs * 0.65, innerR = cs * 0.48;

        ctx.beginPath();
        ctx.arc(sx, sy + 3, outerR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fill();

        const ringGrad = ctx.createLinearGradient(sx - outerR, sy - outerR, sx + outerR, sy + outerR);
        ringGrad.addColorStop(0, '#E2E8F0');
        ringGrad.addColorStop(0.5, '#CBD5E1');
        ringGrad.addColorStop(1, '#94A3B8');
        ctx.beginPath();
        ctx.arc(sx, sy, outerR, 0, Math.PI * 2);
        ctx.fillStyle = ringGrad;
        ctx.fill();
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = colorHex;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      ctx.save();
      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (labelSide === 'left') { ctx.translate(bx + cs * 0.45, by + bh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(label, 0, 0); }
      else if (labelSide === 'right') { ctx.translate(bx + bw - cs * 0.45, by + bh / 2); ctx.rotate(Math.PI / 2); ctx.fillText(label, 0, 0); }
      else if (labelSide === 'top') { ctx.fillText(label, bx + bw / 2, by + cs * 0.45); }
      else { ctx.fillText(label, bx + bw / 2, by + bh - cs * 0.45); }
      ctx.restore();
    };

    drawBase(0, 0, '#E11D48', 'Player 2', 'left');
    drawBase(0, 9, '#16A34A', 'Player 3', 'top');
    drawBase(9, 0, '#2563EB', 'Player 1', 'bottom');
    drawBase(9, 9, '#EAB308', 'Player 4', 'right');

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const inRedBase = r < 6 && c < 6;
        const inGreenBase = r < 6 && c >= 9;
        const inBlueBase = r >= 9 && c < 6;
        const inYellowBase = r >= 9 && c >= 9;
        const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

        if (inRedBase || inGreenBase || inBlueBase || inYellowBase || inCenter) continue;

        ctx.strokeStyle = lineStroke;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(c * cs, r * cs, cs, cs);
      }
    }

    for (let c = 1; c <= 5; c++) { ctx.fillStyle = '#E11D48'; ctx.fillRect(c * cs, 7 * cs, cs, cs); }
    for (let r = 1; r <= 5; r++) { ctx.fillStyle = '#16A34A'; ctx.fillRect(7 * cs, r * cs, cs, cs); }
    for (let c = 9; c <= 13; c++) { ctx.fillStyle = '#EAB308'; ctx.fillRect(c * cs, 7 * cs, cs, cs); }
    for (let r = 9; r <= 13; r++) { ctx.fillStyle = '#2563EB'; ctx.fillRect(7 * cs, r * cs, cs, cs); }

    ctx.fillStyle = '#E11D48'; ctx.fillRect(1 * cs, 6 * cs, cs, cs); drawCurvedArrow(1.5 * cs, 6.5 * cs, 0, '#E11D48');
    ctx.fillStyle = '#16A34A'; ctx.fillRect(8 * cs, 1 * cs, cs, cs); drawCurvedArrow(8.5 * cs, 1.5 * cs, Math.PI / 2, '#16A34A');
    ctx.fillStyle = '#EAB308'; ctx.fillRect(13 * cs, 8 * cs, cs, cs); drawCurvedArrow(13.5 * cs, 8.5 * cs, Math.PI, '#EAB308');
    ctx.fillStyle = '#2563EB'; ctx.fillRect(6 * cs, 13 * cs, cs, cs); drawCurvedArrow(6.5 * cs, 13.5 * cs, -Math.PI / 2, '#2563EB');

    drawStar(2.5 * cs, 8.5 * cs, 5, cs * 0.38, cs * 0.18, '#E11D48', '#9F1239');
    drawStar(6.5 * cs, 2.5 * cs, 5, cs * 0.38, cs * 0.18, '#16A34A', '#15803D');
    drawStar(12.5 * cs, 6.5 * cs, 5, cs * 0.38, cs * 0.18, '#EAB308', '#A16207');
    drawStar(8.5 * cs, 12.5 * cs, 5, cs * 0.38, cs * 0.18, '#2563EB', '#1D4ED8');

    const cx = 7.5 * cs, cy = 7.5 * cs;
    const minX = 6 * cs, maxX = 9 * cs, minY = 6 * cs, maxY = 9 * cs;

    ctx.beginPath(); ctx.moveTo(minX, minY); ctx.lineTo(cx, cy); ctx.lineTo(minX, maxY); ctx.closePath(); ctx.fillStyle = '#E11D48'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(minX, minY); ctx.lineTo(cx, cy); ctx.lineTo(maxX, minY); ctx.closePath(); ctx.fillStyle = '#16A34A'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(maxX, minY); ctx.lineTo(cx, cy); ctx.lineTo(maxX, maxY); ctx.closePath(); ctx.fillStyle = '#EAB308'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(minX, maxY); ctx.lineTo(cx, cy); ctx.lineTo(maxX, maxY); ctx.closePath(); ctx.fillStyle = '#2563EB'; ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Generates a 2048x2048 high-res 10x10 Snake & Ladder board texture
   */
  createSnakeLadderBoardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const S = 2048;
    const cs = S / 10;

    const palette = ['#1E3A8A', '#F59E0B', '#16A34A', '#E11D48', '#8B5CF6'];

    const getCellCenter = (num) => {
      const idx = num - 1;
      const r = Math.floor(idx / 10);
      const cRaw = idx % 10;
      const col = (r % 2 === 0) ? cRaw : (9 - cRaw);
      const row = 9 - r;
      return { x: (col + 0.5) * cs, y: (row + 0.5) * cs };
    };

    // 1. Grid Cells 1..100
    for (let num = 1; num <= 100; num++) {
      const p = getCellCenter(num);
      const x = p.x - cs / 2;
      const y = p.y - cs / 2;

      ctx.fillStyle = palette[(num - 1) % palette.length];
      ctx.fillRect(x, y, cs, cs);

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, cs, cs);

      ctx.font = 'bold 38px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(num, x + 8, y + 8);
    }

    // 2. Ladders
    const ladders = [
      [4, 14], [9, 31], [20, 38], [28, 84], [40, 59], [63, 81], [71, 91]
    ];

    ladders.forEach(([start, end]) => {
      const p1 = getCellCenter(start);
      const p2 = getCellCenter(end);

      ctx.save();
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len * 16;
      const ny = dx / len * 16;

      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';

      ctx.beginPath(); ctx.moveTo(p1.x + nx, p1.y + ny); ctx.lineTo(p2.x + nx, p2.y + ny); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p1.x - nx, p1.y - ny); ctx.lineTo(p2.x - nx, p2.y - ny); ctx.stroke();

      const steps = 8;
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 6;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const rx = p1.x + dx * t;
        const ry = p1.y + dy * t;
        ctx.beginPath();
        ctx.moveTo(rx + nx, ry + ny);
        ctx.lineTo(rx - nx, ry - ny);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Snakes
    const snakes = [
      [17, 7], [54, 34], [62, 19], [64, 60], [87, 24], [93, 73], [99, 78]
    ];

    snakes.forEach(([head, tail]) => {
      const pHead = getCellCenter(head);
      const pTail = getCellCenter(tail);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pHead.x, pHead.y);

      const midX = (pHead.x + pTail.x) / 2 + (head % 2 === 0 ? 50 : -50);
      const midY = (pHead.y + pTail.y) / 2;

      ctx.quadraticCurveTo(midX, midY, pTail.x, pTail.y);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pHead.x, pHead.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pHead.x, pHead.y);
      ctx.lineTo(pHead.x + 10, pHead.y - 10);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.restore();
    });

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, S, S);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  createDiceMaterials(skin = 'white') {
    const materials = [];
    const configs = [
      { val: 1, pips: [[0.5, 0.5]], color: '#DC2626', size: 0.22 },
      { val: 2, pips: [[0.28, 0.28], [0.72, 0.72]], color: '#0F172A', size: 0.13 },
      { val: 3, pips: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], color: '#0F172A', size: 0.12 },
      { val: 4, pips: [[0.28, 0.28], [0.28, 0.72], [0.72, 0.28], [0.72, 0.72]], color: '#0F172A', size: 0.13 },
      { val: 5, pips: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75], [0.5, 0.5]], color: '#0F172A', size: 0.12 },
      { val: 6, pips: [[0.3, 0.22], [0.3, 0.5], [0.3, 0.78], [0.7, 0.22], [0.7, 0.5], [0.7, 0.78]], color: '#0F172A', size: 0.11 }
    ];

    const faceValues = [1, 6, 2, 5, 3, 4];

    faceValues.forEach((val) => {
      const cfg = configs.find(c => c.val === val);
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const S = 512;

      let bgGrad1 = '#FFFFFF', bgGrad2 = '#F1F5F9', pipCol = cfg.color;
      let roughnessVal = 0.2, metalnessVal = 0.1;

      if (skin === 'gold') {
        bgGrad1 = '#F59E0B'; bgGrad2 = '#B45309'; pipCol = '#FEF3C7';
        roughnessVal = 0.1; metalnessVal = 0.85;
      } else if (skin === 'neon') {
        bgGrad1 = '#0F172A'; bgGrad2 = '#020617'; pipCol = '#38BDF8';
        roughnessVal = 0.3; metalnessVal = 0.4;
      } else if (skin === 'ruby') {
        bgGrad1 = '#EF4444'; bgGrad2 = '#991B1B'; pipCol = '#FFFFFF';
        roughnessVal = 0.15; metalnessVal = 0.3;
      } else if (skin === 'emerald') {
        bgGrad1 = '#10B981'; bgGrad2 = '#065F46'; pipCol = '#FBBF24';
        roughnessVal = 0.15; metalnessVal = 0.3;
      }

      const bgGrad = ctx.createRadialGradient(S / 2, S / 2, 60, S / 2, S / 2, S * 0.7);
      bgGrad.addColorStop(0, bgGrad1);
      bgGrad.addColorStop(1, bgGrad2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, S, S);

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, S - 14, S - 14);

      cfg.pips.forEach(([px, py]) => {
        const cx = px * S;
        const cy = py * S;
        const r = cfg.size * S;

        const pipGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
        pipGrad.addColorStop(0, pipCol);
        pipGrad.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = pipGrad;
        ctx.fill();
      });

      const tex = new THREE.CanvasTexture(canvas);
      materials.push(
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: roughnessVal,
          metalness: metalnessVal
        })
      );
    });

    return materials;
  }

  buildBoard(scene, theme = 'classic', mode = 'LUDO') {
    const group = new THREE.Group();

    // Sleek border frame matching board size
    const baseW = this.boardSize + 0.3;
    const baseGeom = new THREE.BoxGeometry(baseW, 0.35, baseW);
    const baseMat = new THREE.MeshStandardMaterial({
      color: mode === 'SNAKE' ? 0x16A34A : (theme === 'wood' ? 0x5C3317 : (theme === 'cyber' ? 0x0F172A : 0x0284C7)),
      metalness: 0.85,
      roughness: 0.25
    });
    const boardBase = new THREE.Mesh(baseGeom, baseMat);
    boardBase.position.y = 0;
    boardBase.receiveShadow = true;
    boardBase.castShadow = true;
    group.add(boardBase);

    const neonGeom = new THREE.BoxGeometry(baseW + 0.06, 0.08, baseW + 0.06);
    const neonMat = new THREE.MeshBasicMaterial({ color: mode === 'SNAKE' ? 0xFBBF24 : 0x38BDF8 });
    const neonMesh = new THREE.Mesh(neonGeom, neonMat);
    neonMesh.position.y = 0.16;
    group.add(neonMesh);

    const boardTex = mode === 'SNAKE' ? this.createSnakeLadderBoardTexture() : this.createBoardTexture(theme);
    this.boardTexture = boardTex;
    const surfaceGeom = new THREE.PlaneGeometry(this.boardSize, this.boardSize);
    const surfaceMat = new THREE.MeshStandardMaterial({
      map: boardTex,
      roughness: 0.3,
      metalness: 0.05
    });
    this.surfaceMesh = new THREE.Mesh(surfaceGeom, surfaceMat);
    this.surfaceMesh.rotation.x = -Math.PI / 2;
    this.surfaceMesh.position.y = 0.22;
    this.surfaceMesh.receiveShadow = true;
    group.add(this.surfaceMesh);

    // 2. Add 3D Floating Stars, Glowing Chevrons & Center Gemstones (Ludo mode)
    if (mode === 'LUDO') {
      this.create3DStars(group);
      this.create3DChevrons(group);
      this.createCenterGemstones(group);
    }

    scene.add(group);
    return group;
  }

  buildLuxuryTable(group, theme = 'classic', mode = 'LUDO') {
    // Soft contact drop shadow under board
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(256, 256, 120, 256, 256, 256);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 512, 512);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.boardSize + 3.2, this.boardSize + 3.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.82, depthWrite: false })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.31;
    group.add(shadowMesh);

    // Luxury Table Top Slab (Mahogany / Walnut Wood or Dark Marble)
    let tableColor = 0x2A1509;
    let tableRoughness = 0.28;
    let tableMetalness = 0.15;

    if (theme === 'cyber') {
      tableColor = 0x070B14;
      tableRoughness = 0.2;
      tableMetalness = 0.6;
    } else if (theme === 'wood') {
      tableColor = 0x3D1E0B;
    }

    const tableGeom = new THREE.BoxGeometry(28, 1.2, 28);
    const tableMat = new THREE.MeshStandardMaterial({
      color: tableColor,
      roughness: tableRoughness,
      metalness: tableMetalness
    });
    const tableMesh = new THREE.Mesh(tableGeom, tableMat);
    tableMesh.position.y = -0.92;
    tableMesh.receiveShadow = true;
    group.add(tableMesh);

    // Table Beveled Edge Lip
    const bevelLip = new THREE.Mesh(
      new THREE.BoxGeometry(28.8, 0.22, 28.8),
      new THREE.MeshStandardMaterial({
        color: 0x1A0D06,
        roughness: 0.2,
        metalness: 0.3
      })
    );
    bevelLip.position.y = -0.38;
    bevelLip.receiveShadow = true;
    group.add(bevelLip);

    // 4 Brass Ornamental Corner Brackets
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.85,
      roughness: 0.2
    });
    const cornerOffsets = [
      [-13.8, -13.8], [13.8, -13.8], [-13.8, 13.8], [13.8, 13.8]
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const cornerBracket = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.25, 2.2), brassMat);
      cornerBracket.position.set(cx, -0.92, cz);
      group.add(cornerBracket);
    });
  }

  create3DStars(group) {
    this.floatingStars = [];
    const starShape = new THREE.Shape();
    const points = 5;
    const outerR = 0.38;
    const innerR = 0.18;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starGeom = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.10,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    starGeom.center();

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xFBBF24,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x92400E,
      emissiveIntensity: 0.35
    });

    const safeCoords = [
      { r: 2, c: 6 },   // Index 8 (Green star)
      { r: 6, c: 12 },  // Index 21 (Yellow star)
      { r: 12, c: 8 },  // Index 34 (Blue star)
      { r: 8, c: 2 }    // Index 47 (Red star)
    ];

    safeCoords.forEach((coord, i) => {
      const pos = this.cellToWorld(coord.r, coord.c);
      const starMesh = new THREE.Mesh(starGeom, starMat);
      starMesh.rotation.x = -Math.PI / 2;
      starMesh.position.set(pos.x, 0.58, pos.z);
      starMesh.castShadow = true;
      group.add(starMesh);

      // Glowing halo disc under star
      const haloDisc = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.45, 16),
        new THREE.MeshBasicMaterial({ color: 0xFDE047, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      haloDisc.rotation.x = -Math.PI / 2;
      haloDisc.position.set(pos.x, 0.36, pos.z);
      group.add(haloDisc);

      this.floatingStars.push({ mesh: starMesh, basePosY: 0.58, phase: i * 1.5 });
    });
  }

  create3DChevrons(group) {
    this.entryChevrons = [];
    const chevronConfigs = [
      { r: 13, c: 6, rot: 0, color: 0x2563EB },           // Blue (North)
      { r: 6, c: 1, rot: -Math.PI / 2, color: 0xE11D48 }, // Red (East)
      { r: 1, c: 8, rot: Math.PI, color: 0x16A34A },      // Green (South)
      { r: 8, c: 13, rot: Math.PI / 2, color: 0xEAB308 }  // Yellow (West)
    ];

    const chevShape = new THREE.Shape();
    chevShape.moveTo(0, 0.28);
    chevShape.lineTo(0.24, -0.16);
    chevShape.lineTo(0.14, -0.22);
    chevShape.lineTo(0, 0.05);
    chevShape.lineTo(-0.14, -0.22);
    chevShape.lineTo(-0.24, -0.16);
    chevShape.closePath();

    const chevGeom = new THREE.ExtrudeGeometry(chevShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    });
    chevGeom.center();

    chevronConfigs.forEach((cfg, i) => {
      const pos = this.cellToWorld(cfg.r, cfg.c);
      const chevMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.6
      });
      const mesh = new THREE.Mesh(chevGeom, chevMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = cfg.rot;
      mesh.position.set(pos.x, 0.44, pos.z);
      group.add(mesh);
      this.entryChevrons.push({ mesh, basePosY: 0.44, phase: i * 1.5 });
    });
  }

  createCenterGemstones(group) {
    const gemConfigs = [
      { color: 0x2563EB, rot: 0 },
      { color: 0xE11D48, rot: Math.PI / 2 },
      { color: 0x16A34A, rot: Math.PI },
      { color: 0xEAB308, rot: -Math.PI / 2 }
    ];

    const gemShape = new THREE.Shape();
    gemShape.moveTo(-1.6, -1.6);
    gemShape.lineTo(1.6, -1.6);
    gemShape.lineTo(0, 0);
    gemShape.closePath();

    const gemGeom = new THREE.ExtrudeGeometry(gemShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    });

    gemConfigs.forEach(cfg => {
      const gemMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.08,
        metalness: 0.35,
        transparent: true,
        opacity: 0.82,
        emissive: cfg.color,
        emissiveIntensity: 0.15
      });
      const gemMesh = new THREE.Mesh(gemGeom, gemMat);
      gemMesh.rotation.x = -Math.PI / 2;
      gemMesh.rotation.z = cfg.rot;
      gemMesh.position.set(0, 0.38, 0);
      group.add(gemMesh);
    });

    // Central jewel pinnacle
    const pinnacleGeom = new THREE.OctahedronGeometry(0.35, 0);
    const pinnacleMat = new THREE.MeshStandardMaterial({
      color: 0xFEF08A,
      emissive: 0xF59E0B,
      emissiveIntensity: 0.45,
      roughness: 0.05,
      metalness: 0.8
    });
    const pinnacleMesh = new THREE.Mesh(pinnacleGeom, pinnacleMat);
    pinnacleMesh.position.set(0, 0.48, 0);
    group.add(pinnacleMesh);
    this.centerPinnacle = pinnacleMesh;
  }

  createTokenMesh(colorHex, playerId, tokenIndex, skin = 'classic') {
    // ---- 1. 3D Human pawn skin: walking humanoid avatar with team colors ----
    if (skin === 'human') {
      const skinTones = [0xF1C27D, 0xC68642, 0xE0AC69, 0x8D5524];
      const hairColors = [0x3B2417, 0x111827, 0x2E1B0F, 0x0F172A];
      const human = createHumanoidMesh({
        color: new THREE.Color(colorHex).getHex(),
        skinTone: skinTones[playerId % 4],
        hairColor: hairColors[playerId % 4],
        female: playerId === 0 || playerId === 3,
        scale: 0.88,
        isPawn: true
      });
      human.userData.playerId = playerId;
      human.userData.tokenIndex = tokenIndex;
      human.userData.isToken = true;
      human.userData.origColor = colorHex;
      human.userData.skin = 'human';
      human.scale.set(1.35, 1.35, 1.35);
      return human;
    }

    // ---- 2. Golden Knight / Royal Guard pawn skin ----
    if (skin === 'knight') {
      const knightGroup = new THREE.Group();
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.85,
        roughness: 0.2
      });
      const teamMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.2,
        metalness: 0.4
      });
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0xE2E8F0,
        metalness: 0.9,
        roughness: 0.15
      });

      // Octagonal pedestal base
      const base1 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.12, 8), goldMat);
      base1.position.y = 0.06;
      base1.castShadow = true;
      knightGroup.add(base1);

      // Team colored ring
      const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 0.08, 16), teamMat);
      baseRing.position.y = 0.16;
      baseRing.castShadow = true;
      knightGroup.add(baseRing);

      // Fluted armored column
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.42, 12), steelMat);
      stem.position.y = 0.41;
      stem.castShadow = true;
      knightGroup.add(stem);

      // Torso chestplate / Shield
      const armor = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.15, 0.25, 6), goldMat);
      armor.position.y = 0.70;
      armor.castShadow = true;
      knightGroup.add(armor);

      // Shield crest
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.04), teamMat);
      shield.position.set(0, 0.70, 0.16);
      knightGroup.add(shield);

      // Knight Helmet Head
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 14), steelMat);
      helmet.position.y = 0.96;
      helmet.castShadow = true;
      knightGroup.add(helmet);

      // Helmet visor slit
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0x0F172A }));
      visor.position.set(0, 0.96, 0.14);
      knightGroup.add(visor);

      // Plume / Royal Crown Crest
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 8), teamMat);
      plume.rotation.x = -0.3;
      plume.position.set(0, 1.20, -0.04);
      plume.castShadow = true;
      knightGroup.add(plume);

      knightGroup.userData = {
        playerId,
        tokenIndex,
        isToken: true,
        origColor: colorHex,
        skin: 'knight'
      };
      knightGroup.scale.set(1.45, 1.45, 1.45);
      return knightGroup;
    }

    // ---- 3. Cyber Mecha pawn skin ----
    if (skin === 'cyber') {
      const cyberGroup = new THREE.Group();
      const darkMat = new THREE.MeshStandardMaterial({
        color: 0x0F172A,
        metalness: 0.8,
        roughness: 0.3
      });
      const neonMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0x38BDF8,
        metalness: 0.9,
        roughness: 0.1
      });

      // Angular hover disc base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.10, 6), darkMat);
      base.position.y = 0.05;
      base.castShadow = true;
      cyberGroup.add(base);

      // Glowing neon ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 8, 16), neonMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.10;
      cyberGroup.add(ring);

      // Mech Core
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.28), darkMat);
      core.position.y = 0.38;
      core.castShadow = true;
      cyberGroup.add(core);

      // Glowing energy vent
      const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.30), neonMat);
      vent.position.set(0, 0.38, 0.145);
      cyberGroup.add(vent);

      // Sensor Head with glowing visor
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.24), chromeMat);
      head.position.y = 0.74;
      head.castShadow = true;
      cyberGroup.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), neonMat);
      visor.position.set(0, 0.74, 0.11);
      cyberGroup.add(visor);

      // Antenna beacon
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 6), chromeMat);
      antenna.position.set(0.08, 0.92, -0.06);
      cyberGroup.add(antenna);

      const tipLight = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), neonMat);
      tipLight.position.set(0.08, 1.04, -0.06);
      cyberGroup.add(tipLight);

      cyberGroup.userData = {
        playerId,
        tokenIndex,
        isToken: true,
        origColor: colorHex,
        skin: 'cyber'
      };
      cyberGroup.scale.set(1.45, 1.45, 1.45);
      return cyberGroup;
    }

    // ---- 4. Classic Royal pawn (Refined silhouette with gold & team trim) ----
    const pawnGroup = new THREE.Group();

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      metalness: 0.9,
      roughness: 0.18
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.85,
      roughness: 0.2
    });
    const tokenMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.2,
      metalness: 0.3,
      emissive: colorHex,
      emissiveIntensity: 0.18
    });

    // Tiered team-colored base with gold trim
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.11, 32), tokenMat);
    base1.position.y = 0.055;
    base1.castShadow = true;
    pawnGroup.add(base1);

    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.35, 0.09, 32), goldTrimMat);
    base2.position.y = 0.15;
    base2.castShadow = true;
    pawnGroup.add(base2);

    // Colored base ring
    const ringBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.08, 32), tokenMat);
    ringBase.position.y = 0.235;
    ringBase.castShadow = true;
    pawnGroup.add(ringBase);

    // Tapered graceful stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 0.42, 28), tokenMat);
    stem.position.y = 0.48;
    stem.castShadow = true;
    pawnGroup.add(stem);

    // Golden collar ring
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.08, 24), goldTrimMat);
    collar.position.y = 0.72;
    collar.castShadow = true;
    pawnGroup.add(collar);

    // Crown Spherical Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 28), tokenMat);
    headMesh.position.y = 0.94;
    headMesh.castShadow = true;
    pawnGroup.add(headMesh);

    // Golden Crown Tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), goldTrimMat);
    tip.position.y = 1.18;
    tip.castShadow = true;
    pawnGroup.add(tip);

    pawnGroup.userData = {
      playerId,
      tokenIndex,
      isToken: true,
      origColor: colorHex,
      skin: 'classic'
    };
    pawnGroup.scale.set(1.45, 1.45, 1.45);

    return pawnGroup;
  }

  /**
   * Flat square "frame" (box outline) geometry lying in the XY plane.
   * Used for the box-frame move-highlight halo and box pedestal rings.
   */
  static makeSquareFrameGeometry(outerSize, innerSize) {
    const shape = new THREE.Shape();
    const o = outerSize / 2;
    shape.moveTo(-o, -o);
    shape.lineTo(o, -o);
    shape.lineTo(o, o);
    shape.lineTo(-o, o);
    shape.lineTo(-o, -o);
    const hole = new THREE.Path();
    const h = innerSize / 2;
    hole.moveTo(-h, -h);
    hole.lineTo(-h, h);
    hole.lineTo(h, h);
    hole.lineTo(h, -h);
    hole.lineTo(-h, -h);
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * Transparent colored plane + glowing ring used to blink the cells a pawn walks across.
   */
  createCellHighlight(colorHex, style = 'circle') {
    const group = new THREE.Group();

    // Inner bright core
    const coreGeometry = new THREE.PlaneGeometry(1.08, 1.08);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.x = -Math.PI / 2;
    core.renderOrder = 3;
    group.add(core);

    // Outer soft halo — round ring (circle) or square frame (box)
    let haloGeometry;
    if (style === 'box') {
      haloGeometry = LudoBoardBuilder.makeSquareFrameGeometry(0.78, 0.5);
    } else {
      haloGeometry = new THREE.RingGeometry(0.48, 0.76, 24);
    }
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = -Math.PI / 2;
    halo.renderOrder = 4;
    group.add(halo);

    group.position.y = 0.356;
    group.visible = false;

    group.userData.coreMat = coreMaterial;
    group.userData.haloMat = haloMaterial;
    group.userData.phase = 0;
    group.userData.index = 0;

    // Direct material compatibility
    group.material = coreMaterial;

    return group;
  }

  createDiceMesh(skin = 'white') {
    const diceMaterials = this.createDiceMaterials(skin);
    const diceGeom = new THREE.BoxGeometry(1.15, 1.15, 1.15);
    const diceMesh = new THREE.Mesh(diceGeom, diceMaterials);
    diceMesh.castShadow = true;
    diceMesh.receiveShadow = true;
    diceMesh.userData = { isDice: true };
    return diceMesh;
  }
}

window.LudoBoardBuilder = LudoBoardBuilder;
