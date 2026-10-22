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

  const skinMat = mat(skinTone, 0.8);
  const shirtMat = mat(color, 0.5, 0.15);
  const pantsMat = mat(0x1E293B, 0.85);
  const shoeMat = mat(0x0B1220, 0.9);
  const hairMat = mat(hairColor, 0.9);

  // ---- Legs (pivot at the hip) ----
  const makeLeg = (x) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.45, 0);

    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.43, 10), pantsMat);
    limb.position.y = -0.215;
    limb.castShadow = true;
    leg.add(limb);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.19), shoeMat);
    shoe.position.set(0, -0.44, 0.035);
    shoe.castShadow = true;
    leg.add(shoe);

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

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(female ? 0.1 : 0.125, female ? 0.14 : 0.105, 0.34, 14),
    shirtMat
  );
  torso.position.y = 0.66;
  torso.castShadow = true;
  group.add(torso);

  // ---- Arms (pivot at the shoulder) ----
  const makeArm = (x) => {
    const arm = new THREE.Group();
    arm.position.set(x, 0.79, 0);

    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.34, 10), shirtMat);
    limb.position.y = -0.17;
    limb.castShadow = true;
    arm.add(limb);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinMat);
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

  // ---- Neck + head ----
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.046, 0.07, 10), skinMat);
  neck.position.y = 0.86;
  group.add(neck);

  parts.head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 16), skinMat);
  parts.head.position.y = 0.99;
  parts.head.castShadow = true;
  group.add(parts.head);

  // ---- Hair ----
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
    hairMat
  );
  hair.position.set(0, 1.005, -0.012);
  hair.rotation.x = -0.12;
  hair.castShadow = true;
  group.add(hair);

  if (female) {
    const backHair = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.34, 10), hairMat);
    backHair.position.set(0, 0.845, -0.085);
    backHair.castShadow = true;
    group.add(backHair);
  }

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
        parts: body.userData.parts,
        holdingPose: false,
        throwAnim: null
      });
    }
  }

  setActive(activeId) {
    this.chars.forEach((ch, i) => {
      const active = i === activeId;
      ch.ringMat.emissiveIntensity = active ? 1.1 : 0.15;
      const target = active ? 1.07 : 1.0;
      ch.group.scale.x += (target - ch.group.scale.x) * 0.2;
      ch.group.scale.y = ch.group.scale.x;
      ch.group.scale.z = ch.group.scale.x;
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
  }

  update(delta) {
    this.time += delta;

    this.chars.forEach((ch, i) => {
      // Idle breathing
      ch.body.position.y = 0.07 + Math.sin(this.time * 2.1 + i * 1.7) * 0.012;

      const arm = ch.parts.armR;

      if (ch.throwAnim) {
        // Windup → throw forward → relax
        const a = ch.throwAnim;
        a.t += delta;
        const WINDUP = 0.22;
        const RELEASE = 0.16;

        if (a.t < WINDUP) {
          arm.rotation.x = 1.5 * (a.t / WINDUP);
        } else if (a.t < WINDUP + RELEASE) {
          arm.rotation.x = 1.5 - 3.1 * ((a.t - WINDUP) / RELEASE);
          if (!a.released && a.t > WINDUP + RELEASE * 0.4) {
            a.released = true;
            if (a.onRelease) a.onRelease();
          }
        } else {
          const k = Math.min(1, (a.t - WINDUP - RELEASE) / 0.4);
          arm.rotation.x = -1.6 * (1 - k);
          if (k >= 1) {
            arm.rotation.x = 0;
            ch.throwAnim = null;
          }
        }
      } else if (ch.holdingPose) {
        // Raise the arm forward so the dice sits in the hand
        arm.rotation.x += (-1.15 - arm.rotation.x) * Math.min(1, delta * 10);
      } else {
        arm.rotation.x += (0 - arm.rotation.x) * Math.min(1, delta * 8);
      }

      // Gentle idle sway on the free arm
      ch.parts.armL.rotation.x = Math.sin(this.time * 1.6 + i) * 0.06;
    });
  }
}

window.createHumanoidMesh = createHumanoidMesh;
window.LudoCharacters = LudoCharacters;
