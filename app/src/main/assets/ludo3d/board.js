/**
 * 3D Ludo Board Generator & Procedural Texture Studio
 * Supports multiple 3D Dice Skins & Board Themes:
 * - Skins: Classic White, Royal Gold, Cyber Neon, Ruby Jewel, Emerald Jade
 * - Themes: Classic Royal, Mahogany Wood, Cyberpunk Neon, Galaxy Nebula
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
   * Generates a high-res 2048x2048 Ludo board texture
   */
  createBoardTexture(theme = 'classic') {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const S = 2048;
    const cs = S / 15;

    // Theme color palettes
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

    // 1. Board Background
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, S, S);

    // Helpers
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
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeW;
        ctx.stroke();
      }
    };

    const drawStar = (cx, cy, spikes, outerRadius, innerRadius, fillColor, strokeColor) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
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

    // 2. Corner Home Yards
    const drawBase = (row, col, colorHex, label, labelSide) => {
      const bx = col * cs;
      const by = row * cs;
      const bw = 6 * cs;
      const bh = 6 * cs;

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
        const sx = s.c * cs;
        const sy = s.r * cs;
        const outerR = cs * 0.65;
        const innerR = cs * 0.48;

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

      if (labelSide === 'left') {
        ctx.translate(bx + cs * 0.45, by + bh / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label, 0, 0);
      } else if (labelSide === 'right') {
        ctx.translate(bx + bw - cs * 0.45, by + bh / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(label, 0, 0);
      } else if (labelSide === 'top') {
        ctx.fillText(label, bx + bw / 2, by + cs * 0.45);
      } else {
        ctx.fillText(label, bx + bw / 2, by + bh - cs * 0.45);
      }
      ctx.restore();
    };

    drawBase(0, 0, '#E11D48', 'Player 2', 'left');
    drawBase(0, 9, '#16A34A', 'Player 3', 'top');
    drawBase(9, 0, '#2563EB', 'Player 1', 'bottom');
    drawBase(9, 9, '#EAB308', 'Player 4', 'right');

    // 3. Track Grid
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

    // 4. Corridors
    for (let c = 1; c <= 5; c++) { ctx.fillStyle = '#E11D48'; ctx.fillRect(c * cs, 7 * cs, cs, cs); }
    for (let r = 1; r <= 5; r++) { ctx.fillStyle = '#16A34A'; ctx.fillRect(7 * cs, r * cs, cs, cs); }
    for (let c = 9; c <= 13; c++) { ctx.fillStyle = '#EAB308'; ctx.fillRect(c * cs, 7 * cs, cs, cs); }
    for (let r = 9; r <= 13; r++) { ctx.fillStyle = '#2563EB'; ctx.fillRect(7 * cs, r * cs, cs, cs); }

    // 5. Start Cells & Arrows
    ctx.fillStyle = '#E11D48'; ctx.fillRect(1 * cs, 6 * cs, cs, cs); drawCurvedArrow(1.5 * cs, 6.5 * cs, 0, '#E11D48');
    ctx.fillStyle = '#16A34A'; ctx.fillRect(8 * cs, 1 * cs, cs, cs); drawCurvedArrow(8.5 * cs, 1.5 * cs, Math.PI / 2, '#16A34A');
    ctx.fillStyle = '#EAB308'; ctx.fillRect(13 * cs, 8 * cs, cs, cs); drawCurvedArrow(13.5 * cs, 8.5 * cs, Math.PI, '#EAB308');
    ctx.fillStyle = '#2563EB'; ctx.fillRect(6 * cs, 13 * cs, cs, cs); drawCurvedArrow(6.5 * cs, 13.5 * cs, -Math.PI / 2, '#2563EB');

    // 6. Star Safe Cells
    drawStar(2.5 * cs, 8.5 * cs, 5, cs * 0.38, cs * 0.18, '#E11D48', '#9F1239');
    drawStar(6.5 * cs, 2.5 * cs, 5, cs * 0.38, cs * 0.18, '#16A34A', '#15803D');
    drawStar(12.5 * cs, 6.5 * cs, 5, cs * 0.38, cs * 0.18, '#EAB308', '#A16207');
    drawStar(8.5 * cs, 12.5 * cs, 5, cs * 0.38, cs * 0.18, '#2563EB', '#1D4ED8');

    // 7. Center Triangles
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
   * Creates 3D Dice materials for customizable skins
   */
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

  buildBoard(scene, theme = 'classic') {
    const group = new THREE.Group();

    const baseW = this.boardSize + 0.9;
    const baseGeom = new THREE.BoxGeometry(baseW, 0.65, baseW);
    const baseMat = new THREE.MeshStandardMaterial({
      color: theme === 'wood' ? 0x5C3317 : (theme === 'cyber' ? 0x0F172A : 0x0088EE),
      metalness: 0.85,
      roughness: 0.25
    });
    const boardBase = new THREE.Mesh(baseGeom, baseMat);
    boardBase.position.y = 0;
    boardBase.receiveShadow = true;
    boardBase.castShadow = true;
    group.add(boardBase);

    const neonGeom = new THREE.BoxGeometry(baseW + 0.08, 0.12, baseW + 0.08);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 });
    const neonMesh = new THREE.Mesh(neonGeom, neonMat);
    neonMesh.position.y = 0.26;
    group.add(neonMesh);

    const boardTex = this.createBoardTexture(theme);
    this.boardTexture = boardTex;
    const surfaceGeom = new THREE.PlaneGeometry(this.boardSize, this.boardSize);
    const surfaceMat = new THREE.MeshStandardMaterial({
      map: boardTex,
      roughness: 0.3,
      metalness: 0.05
    });
    this.surfaceMesh = new THREE.Mesh(surfaceGeom, surfaceMat);
    this.surfaceMesh.rotation.x = -Math.PI / 2;
    this.surfaceMesh.position.y = 0.34;
    this.surfaceMesh.receiveShadow = true;
    group.add(this.surfaceMesh);

    scene.add(group);
    return group;
  }

  createTokenMesh(colorHex, playerId, tokenIndex) {
    const pawnGroup = new THREE.Group();

    const baseGeom = new THREE.CylinderGeometry(0.38, 0.44, 0.24, 24);
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      metalness: 0.9,
      roughness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeom, silverMat);
    baseMesh.position.y = 0.12;
    baseMesh.castShadow = true;

    const bodyGeom = new THREE.CylinderGeometry(0.24, 0.36, 0.5, 24);
    const headGeom = new THREE.SphereGeometry(0.34, 24, 24);

    const tokenMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.18,
      metalness: 0.2
    });

    const bodyMesh = new THREE.Mesh(bodyGeom, tokenMat);
    bodyMesh.position.y = 0.45;
    bodyMesh.castShadow = true;

    const headMesh = new THREE.Mesh(headGeom, tokenMat);
    headMesh.position.y = 0.85;
    headMesh.castShadow = true;

    pawnGroup.add(baseMesh);
    pawnGroup.add(bodyMesh);
    pawnGroup.add(headMesh);

    pawnGroup.userData = {
      playerId,
      tokenIndex,
      isToken: true,
      origColor: colorHex
    };

    return pawnGroup;
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
