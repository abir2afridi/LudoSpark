/**
 * LudoSpark 3D Characters & Realistic Humanoid Pawns Studio
 * 
 * Features:
 * - High-detail stylized 3D Human models (distinct Male & Female meshes, expressive faces,
 *   eyes, hair styling, shirts with collar/badges, belts, sneakers, team colors).
 * - Full articulated skeleton (head, neck, torso, hips, upper/lower arms, hands, legs, feet).
 * - 4 Corner 3D Players standing around the board with animated breathing, weight-shifting,
 *   turn-anticipation, holding 3D dice in hand, and dramatic full-body windup & throw onto the board!
 * - Realistic walking mechanics used when human pawns traverse board cells.
 */

function createHumanoidMesh(opts = {}) {
  const color = opts.color !== undefined ? opts.color : 0x3B82F6;
  const skinTone = opts.skinTone !== undefined ? opts.skinTone : 0xF1C27D;
  const hairColor = opts.hairColor !== undefined ? opts.hairColor : 0x2E1B0F;
  const female = !!opts.female;
  const scale = opts.scale || 1;
  const isPawn = !!opts.isPawn;

  const group = new THREE.Group();
  const parts = {};

  // Material helpers
  const mat = (c, rough = 0.55, metal = 0.08) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });

  const skinMat = mat(skinTone, 0.7, 0.02);
  const clothMat = mat(color, 0.45, 0.15);
  const clothDarkMat = mat(new THREE.Color(color).clone().multiplyScalar(0.7).getHex(), 0.5, 0.1);
  const pantsMat = mat(female ? 0x1E293B : 0x0F172A, 0.8, 0.05);
  const hairMat = mat(hairColor, 0.9, 0.02);
  const whiteMat = mat(0xFFFFFF, 0.3, 0.05);
  const darkMat = mat(0x111827, 0.9, 0.0);
  const goldMat = mat(0xF59E0B, 0.25, 0.7);

  // ---- Root Spine / Pelvis Container ----
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.52, 0);
  group.add(pelvisGroup);
  parts.pelvis = pelvisGroup;

  // Pelvis mesh / Hips
  const hipWidth = female ? 0.24 : 0.22;
  const hips = new THREE.Mesh(
    new THREE.CylinderGeometry(hipWidth * 0.48, hipWidth * 0.52, 0.13, 14),
    pantsMat
  );
  hips.castShadow = true;
  hips.receiveShadow = true;
  pelvisGroup.add(hips);

  // Belt with golden buckle
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(hipWidth * 0.505, hipWidth * 0.505, 0.035, 14),
    darkMat
  );
  belt.position.y = 0.06;
  pelvisGroup.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.02), goldMat);
  buckle.position.set(0, 0.06, hipWidth * 0.51);
  pelvisGroup.add(buckle);

  // ---- Torso (pivots from hips) ----
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.06, 0);
  pelvisGroup.add(torsoGroup);
  parts.torso = torsoGroup;

  const chestTop = female ? 0.20 : 0.26;
  const chestBottom = female ? 0.22 : 0.21;
  const chestGeom = new THREE.CylinderGeometry(chestTop * 0.5, chestBottom * 0.5, 0.32, 14);
  const chest = new THREE.Mesh(chestGeom, clothMat);
  chest.position.y = 0.16;
  chest.castShadow = true;
  chest.receiveShadow = true;
  torsoGroup.add(chest);

  // Jacket / V-Neck collar trim
  const collarGeom = new THREE.TorusGeometry(0.08, 0.018, 8, 16, Math.PI);
  const collar = new THREE.Mesh(collarGeom, whiteMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.31, 0.02);
  torsoGroup.add(collar);

  // Team Crest / Golden Badge on chest
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.01, 8), goldMat);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(-0.06, 0.22, 0.115);
  torsoGroup.add(badge);

  // ---- Neck + Head ----
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.046, 0.08, 10), skinMat);
  neck.position.y = 0.35;
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.46, 0);
  torsoGroup.add(headGroup);
  parts.head = headGroup;

  // Head sphere (slightly cute/stylized proportion)
  const headRadius = female ? 0.145 : 0.15;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 18, 16), skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Ears
  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), skinMat);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(side * (headRadius * 0.95), 0, 0);
    headGroup.add(ear);
  });

  // Eyes (white sclera + pupil + bright glint dot)
  [-1, 1].forEach(side => {
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 12, 10),
      whiteMat
    );
    eyeWhite.scale.set(1, 1.25, 0.5);
    eyeWhite.position.set(side * 0.052, 0.015, headRadius * 0.86);
    headGroup.add(eyeWhite);

    // Dark colored pupil
    const pupilColor = female ? 0x2563EB : 0x1E293B;
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 10, 8),
      mat(pupilColor, 0.3, 0.1)
    );
    pupil.position.set(side * 0.052, 0.015, headRadius * 0.94);
    headGroup.add(pupil);

    // Eye catchlight glint (makes eyes look alive!)
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), whiteMat);
    glint.position.set(side * 0.052 + 0.007, 0.023, headRadius * 0.96);
    headGroup.add(glint);

    // Eyebrows
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.008, 0.012),
      hairMat
    );
    brow.position.set(side * 0.052, 0.052, headRadius * 0.88);
    brow.rotation.z = side * -0.12;
    headGroup.add(brow);
  });

  // Cheerful Smile (subtle curved arc)
  const smileGeom = new THREE.TorusGeometry(0.032, 0.006, 6, 12, Math.PI * 0.7);
  const smileMat = mat(0x991B1B, 0.7, 0);
  const smile = new THREE.Mesh(smileGeom, smileMat);
  smile.rotation.x = Math.PI * 0.15;
  smile.rotation.z = Math.PI * 0.15;
  smile.position.set(0, -0.052, headRadius * 0.92);
  headGroup.add(smile);

  // Cute blush cheeks for female
  if (female) {
    [-1, 1].forEach(side => {
      const blushMat = new THREE.MeshBasicMaterial({
        color: 0xF43F5E,
        transparent: true,
        opacity: 0.35
      });
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.024, 10), blushMat);
      blush.position.set(side * 0.088, -0.022, headRadius * 0.82);
      blush.rotation.y = side * 0.45;
      headGroup.add(blush);
    });
  }

  // ---- Hair Styling ----
  if (female) {
    // Feminine stylized bob + side locks + ponytail
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.05, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hairCap.position.set(0, 0.01, -0.01);
    hairCap.castShadow = true;
    headGroup.add(hairCap);

    // Front bangs
    const bangs = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 10), hairMat);
    bangs.position.set(0, 0.085, 0.07);
    bangs.rotation.x = 0.5;
    headGroup.add(bangs);

    // Long ponytail in the back
    const pony = new THREE.Group();
    pony.position.set(0, 0.04, -headRadius * 0.9);
    pony.rotation.x = -0.35;

    const hairTie = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.012, 8, 14), clothMat);
    pony.add(hairTie);

    const ponyTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.28, 10),
      hairMat
    );
    ponyTail.position.set(0, -0.12, -0.03);
    ponyTail.rotation.x = 0.2;
    ponyTail.castShadow = true;
    pony.add(ponyTail);
    headGroup.add(pony);
    parts.pony = pony;
  } else {
    // Masculine stylish textured crop
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.05, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairCap.position.set(0, 0.02, -0.01);
    hairCap.castShadow = true;
    headGroup.add(hairCap);

    // Front styled quiff spikes
    for (let s = -2; s <= 2; s++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), hairMat);
      spike.position.set(s * 0.035, 0.12, 0.08 - Math.abs(s) * 0.02);
      spike.rotation.x = 0.45;
      spike.rotation.z = -s * 0.15;
      headGroup.add(spike);
    }
  }

  // ---- Arms (Shoulder pivots) ----
  const makeArm = (side) => {
    const shoulderGroup = new THREE.Group();
    const shoulderX = side * (chestTop * 0.5 + 0.05);
    shoulderGroup.position.set(shoulderX, 0.28, 0);
    torsoGroup.add(shoulderGroup);

    // Sleeve shoulder cap
    const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), clothMat);
    sleeve.castShadow = true;
    shoulderGroup.add(sleeve);

    // Upper arm
    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.032, 0.18, 10),
      clothMat
    );
    upperArm.position.y = -0.09;
    upperArm.castShadow = true;
    shoulderGroup.add(upperArm);

    // Forearm / Elbow pivot
    const forearmGroup = new THREE.Group();
    forearmGroup.position.set(0, -0.18, 0);
    shoulderGroup.add(forearmGroup);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.028, 0.16, 10),
      skinMat
    );
    forearm.position.y = -0.08;
    forearm.castShadow = true;
    forearmGroup.add(forearm);

    // Hand with thumb hint
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.17, 0);
    forearmGroup.add(handGroup);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), skinMat);
    palm.scale.set(0.9, 1.2, 0.6);
    palm.castShadow = true;
    handGroup.add(palm);

    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.04, 6), skinMat);
    thumb.position.set(side * -0.022, 0.01, 0.015);
    thumb.rotation.z = side * -0.6;
    handGroup.add(thumb);

    return { shoulder: shoulderGroup, forearm: forearmGroup, hand: handGroup };
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  parts.armL = leftArm.shoulder;
  parts.forearmL = leftArm.forearm;
  parts.handL = leftArm.hand;

  parts.armR = rightArm.shoulder;
  parts.forearmR = rightArm.forearm;
  parts.handR = rightArm.hand;

  // ---- Legs (Hip pivots) ----
  const makeLeg = (side) => {
    const hipGroup = new THREE.Group();
    hipGroup.position.set(side * (hipWidth * 0.32), -0.04, 0);
    pelvisGroup.add(hipGroup);

    // Thigh
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.046, 0.22, 10),
      pantsMat
    );
    thigh.position.y = -0.11;
    thigh.castShadow = true;
    hipGroup.add(thigh);

    // Knee / Calf pivot
    const calfGroup = new THREE.Group();
    calfGroup.position.set(0, -0.22, 0);
    hipGroup.add(calfGroup);

    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.038, 0.22, 10),
      pantsMat
    );
    calf.position.y = -0.11;
    calf.castShadow = true;
    calfGroup.add(calf);

    // Sneaker Foot (stylish game sneaker: white sole, colored top, laces)
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.22, 0);
    calfGroup.add(footGroup);

    // White rubber sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.035, 0.17), whiteMat);
    sole.position.set(0, -0.018, 0.025);
    sole.castShadow = true;
    footGroup.add(sole);

    // Colored sneaker upper
    const sneaker = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.055, 0.155),
      clothDarkMat
    );
    sneaker.position.set(0, 0.022, 0.02);
    sneaker.castShadow = true;
    footGroup.add(sneaker);

    // Toe cap
    const toeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.04, 0.05, 8), whiteMat);
    toeCap.rotation.x = Math.PI / 2;
    toeCap.position.set(0, 0.015, 0.08);
    footGroup.add(toeCap);

    return { hip: hipGroup, calf: calfGroup, foot: footGroup };
  };

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  parts.legL = leftLeg.hip;
  parts.calfL = leftLeg.calf;
  parts.footL = leftLeg.foot;

  parts.legR = rightLeg.hip;
  parts.calfR = rightLeg.calf;
  parts.footR = rightLeg.foot;

  // ---- Base Ring (for pawns, gives clean grounded presence) ----
  if (isPawn) {
    const baseMat = mat(color, 0.2, 0.6);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.05, 24),
      baseMat
    );
    ring.position.y = 0.025;
    ring.receiveShadow = true;
    group.add(ring);

    const rimGold = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.018, 8, 24),
      goldMat
    );
    rimGold.rotation.x = Math.PI / 2;
    rimGold.position.y = 0.05;
    group.add(rimGold);
  }

  group.scale.setScalar(scale);
  group.userData.parts = parts;
  group.userData.isFemale = female;
  return group;
}

/**
 * Manages the 4 3D Player Characters stationed around the board corners.
 * They hold the dice in hand, wind up and throw it on roll click,
 * and perform rich idle breathing, weight shifting, and turn cheering.
 */
class LudoCharacters {
  constructor(scene, playerConfigs) {
    this.scene = scene;
    this.playerConfigs = playerConfigs;
    this.chars = [];
    this.time = 0;
    this.activePlayerId = 0;

    // Characters stand on podiums along the top/bottom edges of the board,
    // keeping all four visible in portrait without fighting the corner HUD.
    this.positions = [
      [-4.8, 11.5],   // Player 1 (Blue): bottom-left
      [-4.8, -11.5],  // Player 2 (Red): top-left
      [4.8, -11.5],   // Player 3 (Green): top-right
      [4.8, 11.5]     // Player 4 (Yellow): bottom-right
    ];

    // Gender configuration: Alternating Female & Male for diversity
    this.females = [true, false, false, true];
    this.skinTones = [0xF1C27D, 0xC68642, 0xE0AC69, 0x8D5524];
    this.hairColors = [0x3B2417, 0x111827, 0x2E1B0F, 0x0F172A];

    this.buildAll();
  }

  buildAll() {
    for (let i = 0; i < 4; i++) {
      const cfg = this.playerConfigs[i];
      const color = new THREE.Color(cfg.color).getHex();
      const [x, z] = this.positions[i];

      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Face toward board center (0, 0)
      const lookYaw = Math.atan2(-x, -z);
      group.rotation.y = lookYaw;

      // ---- Multi-Tier Glowing Pedestal Platform ----
      const pedestalGroup = new THREE.Group();

      // Outer tier
      const pedBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.15, 0.12, 32),
        new THREE.MeshStandardMaterial({
          color: 0x0F172A,
          roughness: 0.3,
          metalness: 0.8
        })
      );
      pedBase.position.y = 0.06;
      pedBase.receiveShadow = true;
      pedBase.castShadow = true;
      pedestalGroup.add(pedBase);

      // Pulsing neon emissive ring
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.5
      });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.08, 32), ringMat);
      ring.position.y = 0.14;
      pedestalGroup.add(ring);

      // Inner platform surface
      const surfaceMat = new THREE.MeshStandardMaterial({
        color: 0x1E293B,
        roughness: 0.4,
        metalness: 0.3
      });
      const surface = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.04, 32), surfaceMat);
      surface.position.y = 0.18;
      pedestalGroup.add(surface);

      // Team colored star emblem in pedestal center
      const starGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.015, 5);
      const starMat = new THREE.MeshBasicMaterial({ color });
      const star = new THREE.Mesh(starGeom, starMat);
      star.position.y = 0.205;
      pedestalGroup.add(star);

      group.add(pedestalGroup);

      // ---- Character Model (scale: 2.4 for grand presence) ----
      const body = createHumanoidMesh({
        color,
        skinTone: this.skinTones[i],
        hairColor: this.hairColors[i],
        female: this.females[i],
        scale: 2.4,
        isPawn: false
      });
      body.position.y = 0.2;
      group.add(body);

      // Spotlight right above the character
      const spot = new THREE.PointLight(color, 0.6, 6);
      spot.position.set(0, 3.8, 0);
      group.add(spot);

      this.scene.add(group);

      this.chars.push({
        id: i,
        group,
        body,
        pedestal: pedestalGroup,
        ringMat,
        spot,
        parts: body.userData.parts,
        baseYaw: lookYaw,
        holdingPose: false,
        throwAnim: null,
        emoteAnim: null,
        idleSeed: i * 2.37,
        activePulse: 0.0
      });
    }
  }

  triggerEmote(playerId, emoteType, duration = 2.4) {
    const ch = this.chars[playerId];
    if (!ch) return;
    ch.emoteAnim = {
      type: emoteType, // 'cheer', 'sad', 'angry', 'cool', 'laugh'
      t: 0,
      duration: duration
    };
  }

  setActive(activeId) {
    this.activePlayerId = activeId;
    this.chars.forEach((ch, i) => {
      const active = (i === activeId);
      ch.spot.intensity = active ? 1.6 : 0.3;
      ch.activePulse = active ? 1.0 : 0.0;
    });
  }

  setHolding(playerId) {
    this.chars.forEach((ch, i) => {
      ch.holdingPose = (i === playerId);
    });
  }

  getHandWorldPosition(playerId, target) {
    const ch = this.chars[playerId];
    if (!ch) return null;
    ch.group.updateMatrixWorld(true);
    return ch.parts.handR.getWorldPosition(target);
  }

  /**
   * Starts a dynamic, realistic full-body dice throw:
   * - Windup: Leans back, steps back, raises arm with dice
   * - Power Release: Lunges forward, sweeps arm forward, releases dice
   * - Follow-Through: Arm swings down, leans into throw, watches dice travel
   */
  startThrow(playerId, onRelease) {
    const ch = this.chars[playerId];
    if (!ch) {
      if (onRelease) onRelease();
      return;
    }
    ch.throwAnim = {
      t: 0,
      released: false,
      onRelease,
      windupDuration: 0.32,
      releaseDuration: 0.18,
      followDuration: 0.45
    };
  }

  update(delta) {
    this.time += delta;

    this.chars.forEach((ch, i) => {
      const parts = ch.parts;
      const isActive = (i === this.activePlayerId);
      const isThrowing = !!ch.throwAnim;

      // Active pedestal breathing pulse
      if (isActive) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 4.5);
        ch.ringMat.emissiveIntensity = 0.6 + 0.7 * pulse;
        ch.spot.intensity = 1.3 + 0.5 * pulse;
        // Subtle energetic hovering/scale spring
        const targetScale = 1.05 + 0.02 * pulse;
        ch.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      } else {
        ch.ringMat.emissiveIntensity = 0.25;
        ch.spot.intensity = 0.25;
        ch.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }

      // ---- Throw Sequence Animation ----
      if (isThrowing) {
        const anim = ch.throwAnim;
        anim.t += delta;
        const wD = anim.windupDuration;
        const rD = anim.releaseDuration;
        const fD = anim.followDuration;

        if (anim.t < wD) {
          // PHASE 1: WIND-UP
          // Lean back, twist torso, pull throwing arm high and back
          const p = anim.t / wD;
          const easeBack = p * p;

          parts.torso.rotation.x = -0.32 * easeBack;
          parts.torso.rotation.y = 0.35 * easeBack;
          parts.head.rotation.x = 0.15 * easeBack;

          // Right arm raised high back with dice
          parts.armR.rotation.x = 1.8 * easeBack;
          parts.armR.rotation.z = -0.4 * easeBack;
          if (parts.forearmR) parts.forearmR.rotation.x = -1.1 * easeBack;

          // Left arm balances out in front
          parts.armL.rotation.x = -0.6 * easeBack;
          parts.armL.rotation.z = -0.3 * easeBack;

          // Slight step back into back foot
          ch.body.position.z = -0.12 * easeBack;
          ch.body.position.y = 0.2 - 0.04 * easeBack;
          parts.legR.rotation.x = -0.2 * easeBack;
          parts.legL.rotation.x = 0.15 * easeBack;

        } else if (anim.t < wD + rD) {
          // PHASE 2: POWER THROW & LAUNCH
          const p = (anim.t - wD) / rD;
          const easeThrow = Math.sin(p * Math.PI * 0.5);

          // Torso lunges forward and twists toward the board center
          parts.torso.rotation.x = -0.32 + 0.65 * easeThrow;
          parts.torso.rotation.y = 0.35 - 0.55 * easeThrow;
          parts.head.rotation.x = -0.2 * easeThrow;

          // Right arm sweeps forward like a baseball/bowling pitch
          parts.armR.rotation.x = 1.8 - 3.4 * easeThrow;
          parts.armR.rotation.z = -0.4 + 0.6 * easeThrow;
          if (parts.forearmR) parts.forearmR.rotation.x = -1.1 + 1.3 * easeThrow;

          // Lunge forward
          ch.body.position.z = -0.12 + 0.28 * easeThrow;
          ch.body.position.y = 0.16 + 0.03 * easeThrow;

          // Release the dice midway through the forward sweep
          if (!anim.released && p >= 0.45) {
            anim.released = true;
            if (anim.onRelease) anim.onRelease();
          }

        } else if (anim.t < wD + rD + fD) {
          // PHASE 3: FOLLOW-THROUGH & SETTLE
          const p = (anim.t - wD - rD) / fD;
          const settle = 1.0 - Math.min(1.0, p);

          parts.torso.rotation.x = 0.33 * settle;
          parts.torso.rotation.y = -0.2 * settle;
          parts.armR.rotation.x = -1.6 * settle;
          parts.armR.rotation.z = 0.2 * settle;
          if (parts.forearmR) parts.forearmR.rotation.x = 0.2 * settle;

          // Head looks eagerly at the board
          parts.head.rotation.x = -0.2 * settle;

          ch.body.position.z = 0.16 * settle;
          ch.body.position.y = 0.2;
          parts.legR.rotation.x = 0;
          parts.legL.rotation.x = 0;

        } else {
          // Finished throw — return control to normal idle
          parts.torso.rotation.set(0, 0, 0);
          parts.armR.rotation.set(0, 0, 0);
          parts.armL.rotation.set(0, 0, 0);
          if (parts.forearmR) parts.forearmR.rotation.set(0, 0, 0);
          if (parts.forearmL) parts.forearmL.rotation.set(0, 0, 0);
          parts.head.rotation.set(0, 0, 0);
          ch.body.position.set(0, 0.2, 0);
          ch.throwAnim = null;
        }

      } else if (ch.emoteAnim) {
        // ---- EMOTE REACTION ANIMATIONS ----
        const anim = ch.emoteAnim;
        anim.t += delta;

        if (anim.type === 'cheer' || anim.type === 'win' || anim.type === 'laugh') {
          // Joyful celebratory jump & waving arms high!
          const wave = Math.sin(anim.t * 14);
          parts.armL.rotation.x = 2.4 + wave * 0.25;
          parts.armL.rotation.z = 0.35 + Math.cos(anim.t * 10) * 0.15;
          parts.armR.rotation.x = 2.4 - wave * 0.25;
          parts.armR.rotation.z = -0.35 - Math.cos(anim.t * 10) * 0.15;
          if (parts.forearmL) parts.forearmL.rotation.x = -0.2;
          if (parts.forearmR) parts.forearmR.rotation.x = -0.2;

          ch.body.position.y = 0.2 + Math.abs(Math.sin(anim.t * 8)) * 0.18;
          parts.torso.rotation.x = -0.08;
          parts.head.rotation.x = -0.15;
          parts.head.rotation.y = Math.sin(anim.t * 12) * 0.15;

        } else if (anim.type === 'sad' || anim.type === 'cry' || anim.type === 'captured') {
          // Head in hands / crying pose
          parts.armL.rotation.x = 1.6;
          parts.armL.rotation.z = 0.85;
          parts.armR.rotation.x = 1.6;
          parts.armR.rotation.z = -0.85;
          if (parts.forearmL) parts.forearmL.rotation.x = -1.35;
          if (parts.forearmR) parts.forearmR.rotation.x = -1.35;

          parts.head.rotation.x = 0.42;
          parts.torso.rotation.x = 0.22;
          ch.body.position.y = 0.18 + Math.sin(anim.t * 16) * 0.015;

        } else if (anim.type === 'angry') {
          // Clenched fists, stomping and shaking head
          parts.armL.rotation.x = -0.65;
          parts.armL.rotation.z = -0.35;
          parts.armR.rotation.x = -0.65;
          parts.armR.rotation.z = 0.35;
          if (parts.forearmL) parts.forearmL.rotation.x = -0.85;
          if (parts.forearmR) parts.forearmR.rotation.x = -0.85;

          parts.head.rotation.y = Math.sin(anim.t * 20) * 0.30;
          parts.torso.rotation.x = 0.18;
          ch.body.position.y = 0.2 + Math.abs(Math.sin(anim.t * 10)) * 0.06;

        } else {
          // 'cool' / 'thumbsup' pose
          parts.armR.rotation.x = -1.45;
          parts.armR.rotation.z = 0.25;
          if (parts.forearmR) parts.forearmR.rotation.x = -0.35;
          parts.armL.rotation.x = -0.3;
          parts.armL.rotation.z = -0.45;
          parts.head.rotation.x = -0.12;
          parts.head.rotation.y = 0.18;
          parts.torso.rotation.x = -0.05;
        }

        if (anim.t >= anim.duration) {
          parts.armL.rotation.set(0, 0, 0);
          parts.armR.rotation.set(0, 0, 0);
          if (parts.forearmL) parts.forearmL.rotation.set(0, 0, 0);
          if (parts.forearmR) parts.forearmR.rotation.set(0, 0, 0);
          parts.torso.rotation.set(0, 0, 0);
          parts.head.rotation.set(0, 0, 0);
          ch.body.position.set(0, 0.2, 0);
          ch.emoteAnim = null;
        }

      } else if (ch.holdingPose) {
        // ---- DICE HOLDING POSE (Ready to Roll) ----
        // Smoothly raise right arm in front with palm up, presenting the dice
        const targetArmRX = -1.25;
        const targetArmRZ = -0.28;
        const targetForearmRX = -0.75;
        const lerpSpeed = Math.min(1, delta * 8.5);

        parts.armR.rotation.x += (targetArmRX - parts.armR.rotation.x) * lerpSpeed;
        parts.armR.rotation.z += (targetArmRZ - parts.armR.rotation.z) * lerpSpeed;
        if (parts.forearmR) {
          parts.forearmR.rotation.x += (targetForearmRX - parts.forearmR.rotation.x) * lerpSpeed;
        }

        // Left arm rests gently on hip
        parts.armL.rotation.x += (-0.3 - parts.armL.rotation.x) * lerpSpeed;
        parts.armL.rotation.z += (-0.45 - parts.armL.rotation.z) * lerpSpeed;

        // Head looks proudly down towards the dice in hand
        parts.head.rotation.x += (0.18 - parts.head.rotation.x) * lerpSpeed;
        parts.head.rotation.y += (0.12 - parts.head.rotation.y) * lerpSpeed;

        // Subtle anticipatory breathing
        const breath = Math.sin(this.time * 3.2 + ch.idleSeed) * 0.018;
        ch.body.position.y = 0.2 + breath;

      } else {
        // ---- NATURAL IDLE STANCE (Weight shift & breathing) ----
        const t = this.time + ch.idleSeed;
        const lerpSpeed = Math.min(1, delta * 6);

        // Breathing cycle (torso expands/lifts)
        const breath = Math.sin(t * 2.2) * 0.014;
        ch.body.position.y = 0.2 + breath;

        // Subtle realistic weight shifting from foot to foot (period ~5.5s)
        const weightShift = Math.sin(t * 1.15);
        parts.pelvis.position.x = weightShift * 0.02;
        parts.pelvis.rotation.z = -weightShift * 0.03;
        parts.torso.rotation.z = weightShift * 0.025;

        // Gentle arm sway
        parts.armL.rotation.x += (Math.sin(t * 1.6) * 0.08 - parts.armL.rotation.x) * lerpSpeed;
        parts.armL.rotation.z += (-0.12 - parts.armL.rotation.z) * lerpSpeed;
        parts.armR.rotation.x += (Math.sin(t * 1.6 + 1.2) * 0.08 - parts.armR.rotation.x) * lerpSpeed;
        parts.armR.rotation.z += (0.12 - parts.armR.rotation.z) * lerpSpeed;

        if (parts.forearmL) parts.forearmL.rotation.x += (0 - parts.forearmL.rotation.x) * lerpSpeed;
        if (parts.forearmR) parts.forearmR.rotation.x += (0 - parts.forearmR.rotation.x) * lerpSpeed;

        // Head subtle idle look around
        const headSway = Math.sin(t * 0.8) * 0.12;
        parts.head.rotation.y += (headSway - parts.head.rotation.y) * lerpSpeed;
        parts.head.rotation.x += (Math.sin(t * 1.4) * 0.04 - parts.head.rotation.x) * lerpSpeed;

        // Ponytail physics sway if female
        if (parts.pony) {
          parts.pony.rotation.z = Math.sin(t * 2.5) * 0.15;
          parts.pony.rotation.x = -0.35 + Math.cos(t * 2.2) * 0.08;
        }

        // Return body to origin
        ch.body.position.z += (0 - ch.body.position.z) * lerpSpeed;
      }
    });
  }
}

window.createHumanoidMesh = createHumanoidMesh;
window.LudoCharacters = LudoCharacters;
