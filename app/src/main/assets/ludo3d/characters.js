/**
 * Low-poly 3D humanoids:
 *  - createHumanoidMesh(): shared factory used by 3D player characters
 *    standing around the board AND by the "3D Human" pawn skin.
 *  - LudoCharacters: one character per player, positioned just outside the
 *    board corners, facing the board. Holds & throws the dice.
 */

function createHumanoidMesh(opts = {}) {
  const color = opts.color !== undefined ? opts.color : 0x3B82F6;
  const skinTone = opts.skinTone !== undefined ? opts.skinTone : 0xF1C27D;
  const hairColor = opts.hairColor !== undefined ? opts.hairColor : 0x3B2417;
  const female = !!opts.female;
  const scale = opts.scale || 1;

  const group = new THREE.Group();
  const parts = {};

  const mat = (c, rough = 0.7, metal = 0.05) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });

  // Slightly darker shade for cel-shade outline
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide });

  const skinMat = mat(skinTone, 0.8);
  const shirtMat = mat(color, 0.5, 0.15);
  const pantsMat = mat(0x1E293B, 0.85);
  const shoeMat = mat(0x0B1220, 0.9);
  const hairMat = mat(hairColor, 0.9);
  const whiteMat = mat(0xFFFFFF, 0.5, 0.0);
  const pupilMat = mat(0x111111, 0.6, 0.0);
  const beltMat = mat(0x3A2010, 0.9, 0.15);
  const collarMat = mat(
    new THREE.Color(color).offsetHSL(0, 0, 0.12).getHex(), 0.5, 0.15
  );

  // Helper: add a cel-shade outline shell around a mesh
  const addOutline = (mesh, expand) => {
    const outMesh = new THREE.Mesh(mesh.geometry.clone(), outlineMat);
    outMesh.scale.multiplyScalar(1 + expand);
    outMesh.position.copy(mesh.position);
    outMesh.rotation.copy(mesh.rotation);
    outMesh.renderOrder = -1;
    return outMesh;
  };

  // ---- Legs (pivot at the hip) — with upper + lower segments ----
  const makeLeg = (x) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.45, 0);

    // Upper leg (thigh)
    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.22, 10), pantsMat);
    upperLeg.position.y = -0.11;
    upperLeg.castShadow = true;
    leg.add(upperLeg);

    // Lower leg (shin) — part of the leg group for basic swing
    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.22, 10), pantsMat);
    lowerLeg.position.y = -0.33;
    lowerLeg.castShadow = true;
    leg.add(lowerLeg);

    // Shoe — rounded front for style
    const shoeShape = new THREE.Group();
    const soleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.055, 0.16), shoeMat);
    soleMesh.position.set(0, 0, 0.01);
    soleMesh.castShadow = true;
    shoeShape.add(soleMesh);
    // Rounded toe cap
    const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), shoeMat);
    toeCap.rotation.x = -Math.PI / 2;
    toeCap.position.set(0, 0.005, 0.08);
    toeCap.castShadow = true;
    shoeShape.add(toeCap);
    // Heel bump
    const heel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.04), shoeMat);
    heel.position.set(0, -0.015, -0.07);
    shoeShape.add(heel);
    shoeShape.position.set(0, -0.455, 0.025);
    leg.add(shoeShape);

    group.add(leg);
    return leg;
  };
  parts.legL = makeLeg(-0.095);
  parts.legR = makeLeg(0.095);

  // ---- Hips + torso ----
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.118, 0.12, 12), pantsMat);
  hips.position.y = 0.5;
  hips.castShadow = true;
  group.add(hips);

  // Belt between pants and shirt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.12, 0.045, 14), beltMat);
  belt.position.y = 0.555;
  belt.castShadow = true;
  group.add(belt);
  // Belt buckle
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.01), mat(0xD4A840, 0.3, 0.8));
  buckle.position.set(0, 0.555, 0.122);
  group.add(buckle);

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(female ? 0.1 : 0.125, female ? 0.14 : 0.105, 0.34, 14),
    shirtMat
  );
  torso.position.y = 0.66;
  torso.castShadow = true;
  group.add(torso);
  // Torso cel outline
  const torsoOutline = addOutline(torso, 0.06);
  group.add(torsoOutline);

  // ---- Collar / neckline ----
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, female ? 0.1 : 0.11, 0.04, 14),
    collarMat
  );
  collar.position.y = 0.84;
  collar.castShadow = true;
  group.add(collar);

  // ---- Team color badge on chest ----
  const badge = new THREE.Mesh(
    new THREE.CircleGeometry(0.04, 16),
    new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.6
    })
  );
  badge.position.set(0, 0.72, female ? 0.1 : 0.118);
  badge.rotation.x = -0.15;
  group.add(badge);
  // Badge ring border
  const badgeRing = new THREE.Mesh(
    new THREE.RingGeometry(0.038, 0.052, 16),
    mat(0xE2E8F0, 0.3, 0.85)
  );
  badgeRing.position.copy(badge.position);
  badgeRing.position.z += 0.001;
  badgeRing.rotation.x = badge.rotation.x;
  group.add(badgeRing);

  // ---- Arms (pivot at the shoulder) with upper arm + forearm ----
  const makeArm = (x) => {
    const arm = new THREE.Group();
    arm.position.set(x, 0.79, 0);

    // Upper arm
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.038, 0.18, 10), shirtMat);
    upperArm.position.y = -0.09;
    upperArm.castShadow = true;
    arm.add(upperArm);

    // Forearm (skin-colored or shirt sleeve)
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.16, 10), skinMat);
    forearm.position.y = -0.26;
    forearm.castShadow = true;
    arm.add(forearm);

    // Store forearm ref for animation
    arm.userData = arm.userData || {};
    arm.userData.forearm = forearm;

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), skinMat);
    hand.position.y = -0.36;
    hand.castShadow = true;
    arm.add(hand);

    group.add(arm);
    return { arm, hand };
  };
  const leftArm = makeArm(-0.168);
  const rightArm = makeArm(0.168);
  parts.armL = leftArm.arm;
  parts.armR = rightArm.arm;
  parts.handR = rightArm.hand;

  // ---- Neck + head (slightly bigger = cartoony cute) ----
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.046, 0.06, 10), skinMat);
  neck.position.y = 0.86;
  group.add(neck);

  // Bigger head for stylized proportions
  parts.head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 16), skinMat);
  parts.head.position.y = 1.01;
  parts.head.castShadow = true;
  group.add(parts.head);
  // Head cel outline
  const headOutline = addOutline(parts.head, 0.05);
  group.add(headOutline);

  // ---- Eyes ----
  const makeEye = (xOff) => {
    const eyeGroup = new THREE.Group();
    // White of eye
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), whiteMat);
    eyeWhite.position.set(xOff, 1.025, 0.11);
    eyeWhite.scale.set(1, 1, 0.55);
    group.add(eyeWhite);
    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), pupilMat);
    pupil.position.set(xOff, 1.025, 0.128);
    group.add(pupil);
    // Iris colored ring
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(0.023, 8, 8),
      mat(0x3B82F6, 0.5, 0.1)
    );
    iris.position.set(xOff, 1.025, 0.124);
    group.add(iris);
    return eyeGroup;
  };
  makeEye(-0.045);
  makeEye(0.045);

  // ---- Smile / mouth ----
  const smileCurve = new THREE.EllipseCurve(0, 0, 0.035, 0.015, Math.PI * 0.15, Math.PI * 0.85, false, 0);
  const smilePoints = smileCurve.getPoints(12);
  const smileGeom = new THREE.BufferGeometry().setFromPoints(smilePoints);
  const smileLine = new THREE.Line(
    smileGeom,
    new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 })
  );
  smileLine.position.set(0, 0.985, 0.128);
  group.add(smileLine);

  // ---- Hair (improved styles) ----
  // Main hair cap
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.142, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hair.position.set(0, 1.025, -0.012);
  hair.rotation.x = -0.12;
  hair.castShadow = true;
  group.add(hair);

  if (female) {
    // Female: longer hair flowing down the back
    const backHair = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.38, 10), hairMat);
    backHair.position.set(0, 0.84, -0.09);
    backHair.castShadow = true;
    group.add(backHair);
    // Side hair strands
    const makeStrand = (xOff) => {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.22, 8), hairMat);
      strand.position.set(xOff, 0.91, -0.04);
      strand.rotation.z = xOff > 0 ? -0.2 : 0.2;
      strand.castShadow = true;
      group.add(strand);
    };
    makeStrand(-0.1);
    makeStrand(0.1);
    // Hair band / accessory
    const hairBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.012, 8, 16),
      mat(color, 0.4, 0.3)
    );
    hairBand.position.set(0, 1.06, -0.01);
    hairBand.rotation.x = -0.35;
    group.add(hairBand);
  } else {
    // Male: short textured crop with volume on top
    const topHair = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.06, 0.18),
      hairMat
    );
    topHair.position.set(0, 1.1, 0.01);
    topHair.castShadow = true;
    group.add(topHair);
    // Side fade (thin)
    const sideFade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.138, 0.04, 14),
      hairMat
    );
    sideFade.position.set(0, 1.0, -0.005);
    group.add(sideFade);
  }

  // ---- Cheek blush (subtle) ----
  const blushMat = mat(
    new THREE.Color(skinTone).offsetHSL(0, 0.25, -0.05).getHex(), 0.9, 0.0
  );
  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), blushMat);
  blushL.position.set(-0.08, 1.0, 0.1);
  blushL.scale.set(1, 0.6, 0.4);
  group.add(blushL);
  const blushR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), blushMat);
  blushR.position.set(0.08, 1.0, 0.1);
  blushR.scale.set(1, 0.6, 0.4);
  group.add(blushR);

  // ---- Team-colored metallic base ring ----
  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.05, 20),
    mat(0xE2E8F0, 0.3, 0.85)
  );
  baseRing.position.y = 0.025;
  baseRing.castShadow = true;
  group.add(baseRing);

  group.scale.setScalar(scale);
  group.userData.parts = parts;
  return group;
}

class LudoCharacters {
  constructor(scene, playerConfigs) {
    this.scene = scene;
    this.playerConfigs = playerConfigs;
    this.chars = [];
    this.time = 0;
    this.activeId = -1;

    // Just outside the 4 board corners (x, z), facing the center
    this.positions = [
      [-10.3, 10.3],   // Player 1: bottom-left
      [-10.3, -10.3],  // Player 2: top-left
      [10.3, -10.3],   // Player 3: top-right
      [10.3, 10.3]     // Player 4: bottom-right
    ];
    this.females = [true, false, false, true];
    this.skinTones = [0xF1C27D, 0xC68642, 0xE0AC69, 0x8D5524];
    this.hairColors = [0x3B2417, 0x1C1108, 0x2E1B0F, 0x120D08];

    this.buildAll();
  }

  /* ── Easing helpers ────────────────────────────────── */

  // Attempt to reuse a single smoothstep across idle & throw
  static _smoothstep(t) { return t * t * (3 - 2 * t); }
  // Spring overshoot: peaks ~1.12 at t≈0.65 then settles to 1
  static _spring(t) {
    if (t >= 1) return 1;
    return 1 - Math.exp(-6 * t) * Math.cos(7.5 * t);
  }
  // Cheap seeded-ish pseudo-random per-character from time (deterministic wobble)
  static _hash(n) { let s = Math.sin(n) * 43758.5453; return s - Math.floor(s); }

  /* ── Build ─────────────────────────────────────────── */

  buildAll() {
    for (let i = 0; i < 4; i++) {
      const cfg = this.playerConfigs[i];
      const color = new THREE.Color(cfg.color).getHex();
      const [x, z] = this.positions[i];

      const group = new THREE.Group();
      group.position.set(x, 0, z);
      // Face the board center
      group.rotation.y = Math.atan2(-x, -z);

      // Glowing pedestal ring showing whose character it is
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.15,
        roughness: 0.4,
        metalness: 0.3
      });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.07, 28), ringMat);
      ring.position.y = 0.035;
      ring.receiveShadow = true;
      group.add(ring);

      // Spotlight above the active character (starts dim)
      const spot = new THREE.PointLight(color, 0, 8, 2);
      spot.position.set(0, 5, 0);
      group.add(spot);

      const body = createHumanoidMesh({
        color,
        skinTone: this.skinTones[i],
        hairColor: this.hairColors[i],
        female: this.females[i],
        scale: 2.15
      });
      body.position.y = 0.07;
      group.add(body);

      this.scene.add(group);
      this.chars.push({
        group,
        body,
        ringMat,
        ring,
        spot,
        parts: body.userData.parts,
        holdingPose: false,
        throwAnim: null,

        /* ── per-character animation state ── */
        // Idle gesture state-machine
        idleGesture: 0,         // 0=none, 1=scratch head, 2=cross arms, 3=arm pump (ready)
        idleGestureT: 0,
        idleGestureDur: 0,
        nextGestureAt: 3 + i * 1.5, // stagger first gestures

        // Weight shift phase offset (unique per character)
        weightPhase: i * 1.57,

        // Head look targets (smooth)
        headYaw: 0,
        headPitch: 0,

        // Active spring animation
        scaleSpringT: -1,       // <0 means inactive
        prevActive: false,

        // Torso lean for throw (smoothed)
        torsoLeanX: 0,
        torsoLeanZ: 0,

        // Step-forward offset (z in local space)
        stepOffset: 0,

        // Track dice after throw
        headTrackDice: false,
        headTrackT: 0
      });
    }
  }

  /* ── Public API ─────────────────────────────────────── */

  setActive(activeId) {
    this.activeId = activeId;
    this.chars.forEach((ch, i) => {
      const active = i === activeId;

      // Trigger spring animation on transition to active
      if (active && !ch.prevActive) {
        ch.scaleSpringT = 0;
        // Also trigger "ready" arm-pump gesture
        ch.idleGesture = 3;
        ch.idleGestureT = 0;
        ch.idleGestureDur = 0.55;
      }
      ch.prevActive = active;

      // Spring-based scale for active, smooth for inactive
      if (active && ch.scaleSpringT >= 0 && ch.scaleSpringT < 1) {
        // Spring is handled in update()
      } else {
        const target = active ? 1.07 : 1.0;
        ch.group.scale.x += (target - ch.group.scale.x) * 0.2;
        ch.group.scale.y = ch.group.scale.x;
        ch.group.scale.z = ch.group.scale.x;
      }

      // Spotlight intensity (smooth in update)
      // Ring pulsing base handled in update()
    });
  }

  setHolding(playerId) {
    this.chars.forEach((ch, i) => { ch.holdingPose = (i === playerId); });
  }

  getHandWorldPosition(playerId, target) {
    const ch = this.chars[playerId];
    if (!ch) return null;
    ch.group.updateMatrixWorld(true);
    return ch.parts.handR.getWorldPosition(target);
  }

  startThrow(playerId, onRelease) {
    const ch = this.chars[playerId];
    if (!ch) {
      if (onRelease) onRelease();
      return;
    }
    ch.throwAnim = { t: 0, released: false, onRelease };
    ch.headTrackDice = false;
    ch.headTrackT = 0;
  }

  /* ── Per-frame update ───────────────────────────────── */

  update(delta) {
    this.time += delta;
    // Clamp delta for stability on tab-back / hitches
    const dt = Math.min(delta, 0.05);

    this.chars.forEach((ch, i) => {
      const isActive = (i === this.activeId);
      const t = this.time;
      const parts = ch.parts;

      /* ─── 1. Idle body animation (breathing + weight shift + sway) ─── */

      // Breathing bob
      const breathe = Math.sin(t * 2.1 + i * 1.7) * 0.012;

      // Weight shift: slow lateral hip sway (period ~3.5s per character)
      const weightT = t * 1.8 + ch.weightPhase;
      const weightShift = Math.sin(weightT) * 0.015;  // subtle lateral
      const legShift = Math.sin(weightT);

      // Legs reflect weight shift: the "weighted" leg straightens,
      // the other bends slightly
      parts.legL.rotation.x = legShift * 0.04;
      parts.legR.rotation.x = -legShift * 0.04;
      // Slight lateral body sway
      ch.body.rotation.z = weightShift * 0.6;

      // Very subtle random body sway (fore-aft)
      const sway = Math.sin(t * 0.9 + i * 2.3) * 0.008
                 + Math.sin(t * 1.7 + i * 3.1) * 0.005;

      // Apply body Y position (breathing + step offset for throw)
      ch.body.position.y = 0.07 + breathe;
      ch.body.position.z = ch.stepOffset;

      // Body sway (lean) in X = forward tilt
      // Combined: idle sway + throw torso lean
      ch.body.rotation.x = sway + ch.torsoLeanX;

      /* ─── 2. Head look ─── */
      let targetYaw = 0;
      let targetPitch = 0;

      if (ch.headTrackDice) {
        // After throwing, look down toward the board center
        targetPitch = 0.2;
        targetYaw = 0;
        ch.headTrackT += dt;
        if (ch.headTrackT > 2.0) ch.headTrackDice = false;
      } else if (isActive) {
        // Active character looks toward board center (slightly down)
        targetPitch = 0.12;
        targetYaw = 0;
      } else {
        // Inactive: slow random look-around
        targetYaw = Math.sin(t * 0.4 + i * 2.5) * 0.18
                  + Math.sin(t * 0.7 + i * 4.1) * 0.1;
        targetPitch = Math.sin(t * 0.35 + i * 1.8) * 0.08;
      }

      ch.headYaw += (targetYaw - ch.headYaw) * Math.min(1, dt * 3);
      ch.headPitch += (targetPitch - ch.headPitch) * Math.min(1, dt * 3);
      parts.head.rotation.y = ch.headYaw;
      parts.head.rotation.x = ch.headPitch;

      /* ─── 3. Active player emphasis ─── */

      // Ring pulsing glow
      if (isActive) {
        const pulse = 0.85 + Math.sin(t * 3.5) * 0.25;
        ch.ringMat.emissiveIntensity = pulse;
      } else {
        ch.ringMat.emissiveIntensity += (0.15 - ch.ringMat.emissiveIntensity) * Math.min(1, dt * 4);
      }

      // Spotlight
      const spotTarget = isActive ? 1.8 : 0;
      ch.spot.intensity += (spotTarget - ch.spot.intensity) * Math.min(1, dt * 5);

      // Spring scale animation
      if (ch.scaleSpringT >= 0 && ch.scaleSpringT < 1) {
        ch.scaleSpringT = Math.min(1, ch.scaleSpringT + dt * 2.2);
        const s = 1.0 + 0.07 * LudoCharacters._spring(ch.scaleSpringT);
        ch.group.scale.setScalar(s);
        if (ch.scaleSpringT >= 1) ch.scaleSpringT = -1; // done
      }

      /* ─── 4. Idle gestures (occasional) ─── */

      if (!ch.throwAnim && !ch.holdingPose) {
        // Decrement next-gesture timer
        ch.nextGestureAt -= dt;
        if (ch.idleGesture === 0 && ch.nextGestureAt <= 0) {
          // Pick a random gesture (1 = scratch head, 2 = cross arms)
          ch.idleGesture = Math.random() < 0.5 ? 1 : 2;
          ch.idleGestureT = 0;
          ch.idleGestureDur = 1.2 + Math.random() * 0.8;
          ch.nextGestureAt = 4 + Math.random() * 5; // next gesture in 4-9s
        }

        if (ch.idleGesture > 0) {
          ch.idleGestureT += dt;
          const gp = Math.min(1, ch.idleGestureT / ch.idleGestureDur);
          // Envelope: ramp up to 0.2, hold, ramp down from 0.8
          const env = gp < 0.2 ? gp / 0.2
                    : gp > 0.8 ? (1 - gp) / 0.2
                    : 1;

          if (ch.idleGesture === 1) {
            // Scratch head: raise right arm overhead
            parts.armR.rotation.x = -2.5 * env;
            parts.armR.rotation.z = 0.3 * env;
            // Tilt head slightly
            parts.head.rotation.z = -0.1 * env;
          } else if (ch.idleGesture === 2) {
            // Cross arms: both arms fold inward
            parts.armR.rotation.x = -0.8 * env;
            parts.armR.rotation.z = -0.6 * env;
            parts.armL.rotation.x = -0.8 * env;
            parts.armL.rotation.z = 0.6 * env;
          } else if (ch.idleGesture === 3) {
            // Ready arm pump (short, excited gesture for becoming active)
            const pump = Math.sin(gp * Math.PI * 3) * env;
            parts.armR.rotation.x = -1.3 * pump;
            parts.armL.rotation.x = -0.5 * pump;
          }

          if (gp >= 1) {
            ch.idleGesture = 0;
            ch.idleGestureT = 0;
          }
        }
      }

      /* ─── 5. Throw animation (full-body) ─── */

      if (ch.throwAnim) {
        const a = ch.throwAnim;
        a.t += dt;
        const WINDUP = 0.35;
        const RELEASE = 0.2;
        const FOLLOW = 0.5;

        if (a.t < WINDUP) {
          // ── Windup phase ──
          const p = a.t / WINDUP;
          const ep = LudoCharacters._smoothstep(p);

          // Arm winds back
          parts.armR.rotation.x = 1.6 * ep;
          parts.armR.rotation.z = 0;

          // Left arm out for balance
          parts.armL.rotation.x = -0.3 * ep;
          parts.armL.rotation.z = 0.15 * ep;

          // Body leans back
          ch.torsoLeanX = -0.12 * ep;

          // Slight step back
          ch.stepOffset = 0.06 * ep;

          // Head tilts back to look at arm
          parts.head.rotation.x = -0.15 * ep;

        } else if (a.t < WINDUP + RELEASE) {
          // ── Release phase ──
          const p = (a.t - WINDUP) / RELEASE;
          const ep = LudoCharacters._smoothstep(p);

          // Arm swings forward aggressively
          parts.armR.rotation.x = 1.6 - 3.3 * ep;
          parts.armR.rotation.z = 0;

          // Body lunges forward
          ch.torsoLeanX = -0.12 + 0.25 * ep;

          // Step forward
          ch.stepOffset = 0.06 - 0.24 * ep;

          // Left arm swings back for momentum
          parts.armL.rotation.x = -0.3 + 0.5 * ep;
          parts.armL.rotation.z = 0.15 - 0.3 * ep;

          // Release dice at 40% through release
          if (!a.released && p > 0.4) {
            a.released = true;
            if (a.onRelease) a.onRelease();
          }

        } else {
          // ── Follow-through + relax phase ──
          const elapsed = a.t - WINDUP - RELEASE;
          const p = Math.min(1, elapsed / FOLLOW);
          const ep = LudoCharacters._smoothstep(p);

          // Arm follows through then returns to rest
          const followArm = -1.7 * (1 - ep);
          parts.armR.rotation.x = followArm;
          parts.armR.rotation.z = 0;

          // Body straightens
          ch.torsoLeanX = 0.13 * (1 - ep);

          // Step back to neutral
          ch.stepOffset = -0.18 * (1 - ep);

          // Left arm relaxes
          parts.armL.rotation.x = 0.2 * (1 - ep);
          parts.armL.rotation.z = -0.15 * (1 - ep);

          // Head tracks dice (look down toward board)
          parts.head.rotation.x = 0.2 * (1 - ep * 0.5);

          if (p >= 1) {
            parts.armR.rotation.x = 0;
            parts.armR.rotation.z = 0;
            parts.armL.rotation.x = 0;
            parts.armL.rotation.z = 0;
            ch.torsoLeanX = 0;
            ch.stepOffset = 0;
            ch.throwAnim = null;
            // Start tracking dice with head
            ch.headTrackDice = true;
            ch.headTrackT = 0;
          }
        }

      } else if (ch.holdingPose) {
        /* ─── 6. Improved holding pose ─── */
        // Right arm raised with hand near face level (dice grip)
        const armTarget = -1.15;
        parts.armR.rotation.x += (armTarget - parts.armR.rotation.x) * Math.min(1, dt * 10);
        parts.armR.rotation.z = 0;

        // Left arm relaxed at side, slightly back
        const leftTarget = 0.1;
        parts.armL.rotation.x += (leftTarget - parts.armL.rotation.x) * Math.min(1, dt * 8);
        parts.armL.rotation.z = 0;

        // Subtle anticipation lean (slight back lean as if about to throw)
        ch.torsoLeanX += (-0.04 - ch.torsoLeanX) * Math.min(1, dt * 4);

        // Look at the dice (slight upward gaze)
        parts.head.rotation.x = -0.1;

      } else if (ch.idleGesture === 0) {
        /* ─── 7. Default idle arm return ─── */
        parts.armR.rotation.x += (0 - parts.armR.rotation.x) * Math.min(1, dt * 8);
        parts.armR.rotation.z += (0 - parts.armR.rotation.z) * Math.min(1, dt * 8);

        // Gentle idle sway on the free arm
        parts.armL.rotation.x += (Math.sin(t * 1.6 + i) * 0.06 - parts.armL.rotation.x) * Math.min(1, dt * 8);
        parts.armL.rotation.z += (0 - parts.armL.rotation.z) * Math.min(1, dt * 8);

        // Smoothly return torso lean and step offset
        ch.torsoLeanX += (0 - ch.torsoLeanX) * Math.min(1, dt * 6);
        ch.stepOffset += (0 - ch.stepOffset) * Math.min(1, dt * 6);
      }
    });
  }
}

window.createHumanoidMesh = createHumanoidMesh;
window.LudoCharacters = LudoCharacters;
