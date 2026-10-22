/**
 * Realistic 3D rigid body dice physics using Cannon.js
 */
class DicePhysics {
  constructor(scene) {
    this.scene = scene;
    this.world = null;
    this.diceBody = null;
    this.diceMesh = null;
    this.isRolling = false;
    this.targetFace = 1;
    this.onRollComplete = null;
    this.rollStartTime = 0;
    this.rollDuration = 1200; // ms
    this.trayCenter = { x: 0, y: 0.6, z: 0 };
    this.lastImpactTime = 0;
    this.isHeld = false;

    this.initPhysics();
  }

  initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -38, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 12;

    // Contact material
    const diceMaterial = new CANNON.Material('diceMat');
    const boardMaterial = new CANNON.Material('boardMat');

    const contactMat = new CANNON.ContactMaterial(diceMaterial, boardMaterial, {
      friction: 0.35,
      restitution: 0.42
    });
    this.world.addContactMaterial(contactMat);

    // Floor
    const floorBody = new CANNON.Body({
      mass: 0,
      material: boardMaterial
    });
    floorBody.addShape(new CANNON.Plane());
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    floorBody.position.set(0, 0.4, 0);
    this.world.addBody(floorBody);

    // Wide invisible containment walls so dice thrown from the board corners
    // by the 3D players can travel across the whole board.
    const wallSize = 11.4;
    const wallHeight = 5.0;
    const addWall = (x, z, rotY) => {
      const wall = new CANNON.Body({ mass: 0, material: boardMaterial });
      wall.addShape(new CANNON.Box(new CANNON.Vec3(wallSize, wallHeight, 0.2)));
      wall.position.set(x, wallHeight / 2, z);
      if (rotY) wall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotY);
      this.world.addBody(wall);
    };
    addWall(0, 11.4, 0);
    addWall(0, -11.4, 0);
    addWall(11.4, 0, Math.PI / 2);
    addWall(-11.4, 0, Math.PI / 2);

    // Dice rigid body (1.1x1.1x1.1)
    const halfExtents = new CANNON.Vec3(0.55, 0.55, 0.55);
    this.diceBody = new CANNON.Body({
      mass: 1.2,
      material: diceMaterial,
      linearDamping: 0.2,
      angularDamping: 0.25
    });
    this.diceBody.addShape(new CANNON.Box(halfExtents));
    this.diceBody.position.set(0, 0.95, 0);
    this.world.addBody(this.diceBody);

    // Sound collision listener
    this.diceBody.addEventListener('collide', (e) => {
      const now = performance.now();
      if (now - this.lastImpactTime > 75) {
        this.lastImpactTime = now;
        const speed = e.contact.getImpactVelocityAlongNormal();
        if (speed > 1.2 && window.soundEngine) {
          window.soundEngine.playDiceTumble();
          if (window.AndroidBridge && window.AndroidBridge.vibrate) {
            window.AndroidBridge.vibrate(20);
          }
        }
      }
    });
  }

  setDiceMesh(mesh) {
    this.diceMesh = mesh;
    this.syncMeshWithPhysics();
  }

  syncMeshWithPhysics() {
    if (this.diceMesh && this.diceBody) {
      this.diceMesh.position.copy(this.diceBody.position);
      this.diceMesh.quaternion.copy(this.diceBody.quaternion);
    }
  }

  /**
   * Park the dice in a player's hand. Called every frame while waiting to roll,
   * so the dice follows the character's hand pose.
   */
  holdAt(x, y, z) {
    this.isHeld = true;
    this.isRolling = false;
    this.diceBody.position.set(x, y, z);
    this.diceBody.velocity.set(0, 0, 0);
    this.diceBody.angularVelocity.set(0, 0, 0);
    this.syncMeshWithPhysics();
  }

  /**
   * Get quaternion orientation where faceNumber (1-6) points +Y
   * Face map in Three.js BoxGeometry (px, nx, py, ny, pz, nz):
   * 0 (+X): 1
   * 1 (-X): 6
   * 2 (+Y): 2
   * 3 (-Y): 5
   * 4 (+Z): 3
   * 5 (-Z): 4
   */
  getTargetQuaternion(faceNumber, randomYaw = 0) {
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Rotation math (right-hand rule):
    // Rz(+90°): +X → +Y  |  Rz(−90°): −X → +Y
    // Rx(−90°): +Z → +Y  |  Rx(+90°): −Z → +Y
    switch (faceNumber) {
      case 2: // +Y already up
        euler.set(0, randomYaw, 0);
        break;
      case 5: // flip −Y up
        euler.set(Math.PI, randomYaw, 0);
        break;
      case 1: // +X up → Rz(+90°)
        euler.set(0, randomYaw, Math.PI / 2);
        break;
      case 6: // −X up → Rz(−90°)
        euler.set(0, randomYaw, -Math.PI / 2);
        break;
      case 3: // +Z up → Rx(−90°)
        euler.set(-Math.PI / 2, randomYaw, 0);
        break;
      case 4: // −Z up → Rx(+90°)
        euler.set(Math.PI / 2, randomYaw, 0);
        break;
      default:
        euler.set(0, randomYaw, 0);
    }
    q.setFromEuler(euler);
    return q;
  }

  /**
   * Roll the dice.
   * - fromPos: throw origin (the 3D player's hand). The dice flies from there
   *   toward the board center with a high spin.
   * - fromAngle: fallback toss direction from a board corner.
   */
  roll(targetValue, onComplete, fromAngle = null, fromPos = null) {
    if (this.isRolling) return;
    this.isRolling = true;
    this.isHeld = false;
    this.targetFace = targetValue;
    this.onRollComplete = onComplete;
    this.rollStartTime = performance.now();
    this.rollDuration = 1200;

    if (window.soundEngine) window.soundEngine.init();

    // Start toss
    let startX = (Math.random() - 0.5) * 1.5;
    let startY = 4.2 + Math.random() * 1.5;
    let startZ = (Math.random() - 0.5) * 1.5;
    let vx = (Math.random() - 0.5) * 6;
    let vz = (Math.random() - 0.5) * 6;
    let vy = 3 + Math.random() * 4;

    if (fromPos) {
      // Thrown straight from the active player's 3D character hand
      startX = fromPos.x;
      startY = fromPos.y;
      startZ = fromPos.z;

      const targetX = (Math.random() - 0.5) * 2.5;
      const targetZ = (Math.random() - 0.5) * 2.5;
      const dx = targetX - startX;
      const dz = targetZ - startZ;
      const dist = Math.hypot(dx, dz) || 1;
      const speed = Math.min(14, Math.max(8, dist * 1.6));

      vx = (dx / dist) * speed;
      vz = (dz / dist) * speed;
      vy = 2.2 + Math.random() * 1.6;

      // Longer flight time for the longer distance from hand to board
      this.rollDuration = Math.max(1400, Math.min(2100, dist * 130));
    } else if (fromAngle !== null && fromAngle !== undefined) {
      // Toss from the active player's side toward board center
      const r = 2.8 + Math.random() * 0.6;
      startX = Math.cos(fromAngle) * r;
      startZ = Math.sin(fromAngle) * r;
      const speed = 5.5 + Math.random() * 2.5;
      vx = -Math.cos(fromAngle) * speed;
      vz = -Math.sin(fromAngle) * speed;
    }

    this.diceBody.position.set(startX, startY, startZ);
    this.diceBody.velocity.set(vx, vy, vz);

    // Initial spin (high angular velocity)
    const spinMagnitude = 24 + Math.random() * 14;
    this.diceBody.angularVelocity.set(
      (Math.random() - 0.5) * spinMagnitude,
      (Math.random() - 0.5) * spinMagnitude,
      (Math.random() - 0.5) * spinMagnitude
    );

    this.finalYaw = Math.floor(Math.random() * 4) * (Math.PI / 2) + (Math.random() - 0.5) * 0.2;
    this.targetQuat = this.getTargetQuaternion(this.targetFace, this.finalYaw);
    this.settleStarted = false;
  }

  update(delta) {
    if (!this.world) return;

    // While held in a player's hand the dice is kinematic — no simulation
    if (this.isHeld) {
      this.syncMeshWithPhysics();
      return;
    }

    // Step physics
    const clampedDelta = Math.min(delta, 0.05);
    this.world.step(1 / 60, clampedDelta, 3);

    if (this.isRolling) {
      const elapsed = performance.now() - this.rollStartTime;
      const progress = elapsed / this.rollDuration;

      // When approaching the settle window, guide dice smoothly to the target pip
      if (progress >= 0.72) {
        if (!this.settleStarted) {
          this.settleStarted = true;
          this.startQuat = new THREE.Quaternion(
            this.diceBody.quaternion.x,
            this.diceBody.quaternion.y,
            this.diceBody.quaternion.z,
            this.diceBody.quaternion.w
          );
        }

        const settleT = Math.min(1.0, (progress - 0.72) / 0.28);
        const smoothT = settleT * settleT * (3 - 2 * settleT);

        // Interpolate orientation smoothly
        const currentQ = new THREE.Quaternion().copy(this.startQuat).slerp(this.targetQuat, smoothT);
        this.diceBody.quaternion.set(currentQ.x, currentQ.y, currentQ.z, currentQ.w);

        // Dampen velocities to rest
        this.diceBody.velocity.scale(0.85, this.diceBody.velocity);
        this.diceBody.angularVelocity.scale(0.7, this.diceBody.angularVelocity);

        if (progress >= 1.0) {
          this.isRolling = false;
          this.diceBody.velocity.set(0, 0, 0);
          this.diceBody.angularVelocity.set(0, 0, 0);

          // Keep the dice resting on the board (never drift off the play area)
          const restX = Math.max(-8.4, Math.min(8.4, this.diceBody.position.x));
          const restZ = Math.max(-8.4, Math.min(8.4, this.diceBody.position.z));
          this.diceBody.position.set(restX, 0.95, restZ);
          this.diceBody.quaternion.set(
            this.targetQuat.x,
            this.targetQuat.y,
            this.targetQuat.z,
            this.targetQuat.w
          );

          if (window.soundEngine) {
            window.soundEngine.playDiceTumble();
          }

          if (this.onRollComplete) {
            const cb = this.onRollComplete;
            this.onRollComplete = null;
            cb(this.targetFace);
          }
        }
      }
    }

    this.syncMeshWithPhysics();
  }
}

window.DicePhysics = DicePhysics;
