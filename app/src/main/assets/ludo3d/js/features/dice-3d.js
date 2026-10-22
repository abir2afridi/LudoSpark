/**
 * Dedicated 3D UI Dice Module for Ludo Spark.
 * Renders a full 3D WebGL rotating/tumbling dice cube inside the player corner HUD.
 */
class UIDice3D {
  constructor(containerId = 'dice-slot') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 4.2);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(64, 64);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear old contents & append WebGL canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    backLight.position.set(-3, -2, -3);
    this.scene.add(backLight);

    this.diceGroup = new THREE.Group();
    this.scene.add(this.diceGroup);

    this.currentSkin = 'white';
    this.isRolling = false;
    this.targetFace = 1;
    this.rollStartTime = 0;

    this.initMesh();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // Face rotations mapping for 1..6
  getFaceRotation(value) {
    switch (value) {
      case 1: return { x: 0, y: 0, z: 0 };
      case 2: return { x: 0, y: Math.PI, z: 0 };
      case 3: return { x: 0, y: -Math.PI / 2, z: 0 };
      case 4: return { x: 0, y: Math.PI / 2, z: 0 };
      case 5: return { x: -Math.PI / 2, y: 0, z: 0 };
      case 6: return { x: Math.PI / 2, y: 0, z: 0 };
      default: return { x: 0, y: 0, z: 0 };
    }
  }

  initMesh() {
    // 3D Rounded Chamfered Cube Dice
    const boxGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);

    // Materials for 6 faces with 3D dots
    this.materials = this.createDiceMaterials(this.currentSkin);
    this.diceMesh = new THREE.Mesh(boxGeom, this.materials);
    this.diceGroup.add(this.diceMesh);
  }

  setSkin(skinName) {
    this.currentSkin = skinName;
    if (this.diceMesh) {
      this.materials = this.createDiceMaterials(skinName);
      this.diceMesh.material = this.materials;
    }
  }

  createDiceMaterials(skin) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const getFaceTexture = (val, bgHex, dotHex) => {
      const cvs = document.createElement('canvas');
      cvs.width = 128;
      cvs.height = 128;
      const c = cvs.getContext('2d');

      // Rounded background
      c.fillStyle = bgHex;
      c.beginPath();
      c.roundRect(4, 4, 120, 120, 24);
      c.fill();
      c.lineWidth = 6;
      c.strokeStyle = '#FEF3C7';
      c.stroke();

      // Dot positions
      const dots = {
        1: [[64, 64]],
        2: [[36, 36], [92, 92]],
        3: [[36, 36], [64, 64], [92, 92]],
        4: [[36, 36], [92, 36], [36, 92], [92, 92]],
        5: [[36, 36], [92, 36], [64, 64], [36, 92], [92, 92]],
        6: [[36, 36], [92, 36], [36, 64], [92, 64], [36, 92], [92, 92]]
      };

      c.fillStyle = dotHex;
      (dots[val] || []).forEach(([x, y]) => {
        c.beginPath();
        c.arc(x, y, 11, 0, Math.PI * 2);
        c.fill();
      });

      const tex = new THREE.CanvasTexture(cvs);
      tex.needsUpdate = true;
      return tex;
    };

    let bg = '#FFFFFF';
    let dot = '#0F172A';
    if (skin === 'gold') { bg = '#F59E0B'; dot = '#78350F'; }
    else if (skin === 'neon') { bg = '#0284C7'; dot = '#38BDF8'; }
    else if (skin === 'ruby') { bg = '#BE123C'; dot = '#FFE4E6'; }
    else if (skin === 'emerald') { bg = '#047857'; dot = '#A7F3D0'; }

    // Box faces: Right(3), Left(4), Top(5), Bottom(6), Front(1), Back(2)
    const faceValues = [3, 4, 5, 6, 1, 2];
    return faceValues.map(val => new THREE.MeshStandardMaterial({
      map: getFaceTexture(val, bg, dot),
      roughness: 0.2,
      metalness: skin === 'gold' ? 0.7 : 0.2
    }));
  }

  rollTo(value) {
    this.targetFace = value;
    this.isRolling = true;
    this.rollStartTime = performance.now();
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isRolling) {
      const elapsed = performance.now() - this.rollStartTime;
      const duration = 600;
      const t = Math.min(1.0, elapsed / duration);

      if (t < 1.0) {
        this.diceMesh.rotation.x += 0.35;
        this.diceMesh.rotation.y += 0.45;
        this.diceMesh.rotation.z += 0.25;
      } else {
        this.isRolling = false;
        const targetRot = this.getFaceRotation(this.targetFace);
        this.diceMesh.rotation.set(targetRot.x, targetRot.y, targetRot.z);
      }
    } else {
      // Idle gentle float rotation
      this.diceMesh.rotation.y += 0.015;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.UIDice3D = UIDice3D;
