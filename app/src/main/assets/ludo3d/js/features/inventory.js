/**
 * Inventory and wardrobe studio with real 3D item previews.
 */
(function () {
  'use strict';

  window.LudoApp.register('inventory', function (App) {
    const grid = App.byId('inventory-items-grid');
    if (!grid) return;

    const items = {
      pawns: [
        { id: 'classic', title: 'Classic Royal', desc: 'Standard 3D Pawns', rarity: 'common', type: 'pawn' },
        { id: 'human', title: '3D Human Walkers', desc: 'Walking Characters', rarity: 'rare', type: 'pawn' },
        { id: 'knight', title: 'Golden Knights', desc: 'Armor Shield Pawns', rarity: 'epic', type: 'pawn' },
        { id: 'cyber', title: 'Cyber Mecha', desc: 'Glowing Futuristic Pawns', rarity: 'legendary', type: 'pawn' }
      ],
      dice: [
        { id: 'white', title: 'White Ivory', desc: 'Clean Glossy Die', rarity: 'common', type: 'dice' },
        { id: 'gold', title: 'Royal Gold', desc: 'Metallic Gold Die', rarity: 'rare', type: 'dice' },
        { id: 'neon', title: 'Cyber Neon', desc: 'Cyan Glowing Die', rarity: 'epic', type: 'dice' },
        { id: 'ruby', title: 'Ruby Jewel', desc: 'Translucent Red Die', rarity: 'epic', type: 'dice' },
        { id: 'emerald', title: 'Emerald Jade', desc: 'Jade Green Die', rarity: 'legendary', type: 'dice' }
      ],
      boards: [
        { id: 'classic', title: 'Classic Royal', desc: 'Vibrant Blue Board', rarity: 'common', type: 'board' },
        { id: 'wood', title: 'Mahogany Wood', desc: 'Rich Polished Wood', rarity: 'rare', type: 'board' },
        { id: 'cyber', title: 'Cyberpunk Neon', desc: 'Futuristic Grid', rarity: 'epic', type: 'board' },
        { id: 'galaxy', title: 'Galaxy Deep', desc: 'Cosmic Starry Board', rarity: 'legendary', type: 'board' }
      ],
      bg: [
        { id: 'blue', title: 'Space Blue', desc: 'Deep Cosmic Blue', rarity: 'common', type: 'bg' },
        { id: 'sunset', title: 'Sunset Gold', desc: 'Warm Golden Glow', rarity: 'rare', type: 'bg' },
        { id: 'cyber', title: 'Cyberpunk City', desc: 'Purple Neon City', rarity: 'epic', type: 'bg' },
        { id: 'emerald', title: 'Emerald Forest', desc: 'Emerald Night', rarity: 'legendary', type: 'bg' }
      ],
      blink: [
        { id: 'circle', title: 'Circle Blink', desc: 'Round glow ring', rarity: 'common', type: 'blinkStyle' },
        { id: 'box', title: 'Box Frame', desc: 'Square frame glow', rarity: 'rare', type: 'blinkStyle' },
        { id: 'auto', title: 'Team Color', desc: 'Matches player color', rarity: 'common', type: 'blinkColor' },
        { id: 'cyan', title: 'Neon Cyan', desc: 'Electric cyan', rarity: 'rare', type: 'blinkColor' },
        { id: 'magenta', title: 'Hot Magenta', desc: 'Vivid magenta', rarity: 'epic', type: 'blinkColor' },
        { id: 'gold', title: 'Royal Gold', desc: 'Golden glow', rarity: 'epic', type: 'blinkColor' },
        { id: 'emerald', title: 'Emerald', desc: 'Emerald green', rarity: 'rare', type: 'blinkColor' },
        { id: 'blue', title: 'Sky Blue', desc: 'Bright sky blue', rarity: 'common', type: 'blinkColor' },
        { id: 'rainbow', title: 'Rainbow Flow', desc: 'Cycling hues', rarity: 'legendary', type: 'blinkColor' }
      ],
      pedestal: [
        { id: 'circle', title: 'Rounded Circle', desc: 'Round platform', rarity: 'common', type: 'pedestal' },
        { id: 'box', title: 'Box Frame', desc: 'Square platform', rarity: 'rare', type: 'pedestal' }
      ]
    };

    const blinkColorHex = {
      auto: '#2563EB', cyan: '#22D3EE', magenta: '#E879F9',
      gold: '#FBBF24', emerald: '#34D399', blue: '#60A5FA', rainbow: '#F472B6'
    };

    const themes = {
      blue: { inner: '#0D3280', outer: '#020B2A', accent: '#38BDF8' },
      sunset: { inner: '#7C2D12', outer: '#180902', accent: '#F59E0B' },
      cyber: { inner: '#4C1D95', outer: '#0F0E26', accent: '#EC4899' },
      emerald: { inner: '#064E3B', outer: '#01140E', accent: '#10B981' }
    };

    let currentCategory = 'pawns';
    let previewRenderer = null;
    let previewScene = null;
    let previewCamera = null;
    let previewCache = {};

    const escape = function (value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const applyMenuBackground = function (id) {
      const menu = App.dom.mainMenuEl;
      if (!menu) return;
      menu.classList.remove('menu-bg-sunset', 'menu-bg-cyber', 'menu-bg-emerald');
      if (id && id !== 'blue') menu.classList.add('menu-bg-' + id);
    };

    const initPreviewer = function () {
      if (previewRenderer) return true;
      if (!window.THREE || !App.game || !App.game.builder) return false;
      try {
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'low-power'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(256, 256, false);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

        scene.add(new THREE.AmbientLight(0xFFFFFF, 1.05));

        const key = new THREE.DirectionalLight(0xFFFBEB, 2.1);
        key.position.set(4, 7, 5);
        key.castShadow = true;
        key.shadow.mapSize.width = 512;
        key.shadow.mapSize.height = 512;
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 30;
        scene.add(key);

        const fill = new THREE.DirectionalLight(0x38BDF8, 1.0);
        fill.position.set(-5, 3, -4);
        scene.add(fill);

        const rim = new THREE.DirectionalLight(0xF59E0B, 0.75);
        rim.position.set(0, 4, -6);
        scene.add(rim);

        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(3.2, 48),
          new THREE.MeshStandardMaterial({
            color: 0x0F172A,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.5
          })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.015;
        ground.receiveShadow = true;
        scene.add(ground);

        previewRenderer = renderer;
        previewScene = scene;
        previewCamera = camera;
        return true;
      } catch (err) {
        previewRenderer = null;
        previewScene = null;
        previewCamera = null;
        return false;
      }
    };

    const disposeObject = function (object) {
      object.traverse(function (node) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(function (material) {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
    };

    const renderObjectPreview = function (object, isBoard) {
      if (!initPreviewer()) return null;
      try {
        previewScene.add(object);
        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        object.position.x -= center.x;
        object.position.z -= center.z;
        object.position.y -= bounds.min.y;

        const maxSize = Math.max(size.x, size.y, size.z, 0.8);
        const distance = isBoard ? maxSize * 1.62 : maxSize * 2.35 + 0.7;
        previewCamera.fov = isBoard ? 32 : 30;
        previewCamera.position.set(distance * (isBoard ? 0.4 : 0.32), maxSize * (isBoard ? 1.36 : 1.48), distance);
        previewCamera.lookAt(0, maxSize * (isBoard ? 0.16 : 0.4), 0);
        previewCamera.updateProjectionMatrix();

        previewRenderer.render(previewScene, previewCamera);
        const url = previewRenderer.domElement.toDataURL('image/png');
        previewScene.remove(object);
        disposeObject(object);
        return url;
      } catch (err) {
        try {
          previewScene.remove(object);
          disposeObject(object);
        } catch (disposeErr) { /* ignore */ }
        return null;
      }
    };

    const createBoardPreview = function (theme) {
      const builder = App.game.builder;
      const size = 2.35;
      const texture = builder.createBoardTexture(theme);
      if (THREE.SRGBColorSpace && 'colorSpace' in texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      const top = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.62, metalness: 0.12 })
      );
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.285;
      top.receiveShadow = true;

      const baseColors = { classic: 0x0B4F9E, wood: 0x5C3317, cyber: 0x0F172A, galaxy: 0x020617 };
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(size + 0.22, 0.28, size + 0.22),
        new THREE.MeshStandardMaterial({
          color: baseColors[theme] || baseColors.classic,
          roughness: 0.3,
          metalness: 0.65
        })
      );
      base.position.y = 0.14;
      base.castShadow = true;
      base.receiveShadow = true;

      const group = new THREE.Group();
      group.add(base);
      group.add(top);
      group.rotation.y = -0.12;
      return group;
    };

    const createThemePreview = function (item) {
      const theme = themes[item.id] || themes.blue;
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(128, 82, 10, 128, 128, 190);
      grad.addColorStop(0, theme.inner);
      grad.addColorStop(0.58, theme.outer);
      grad.addColorStop(1, '#01030B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      let seed = 17;
      const random = function () {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let i = 0; i < 46; i++) {
        const x = random() * 256;
        const y = random() * 256;
        const r = random() * 1.7 + 0.35;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + random() * 0.62).toFixed(2) + ')';
        ctx.fill();
      }

      const glow = ctx.createRadialGradient(128, 180, 12, 128, 180, 100);
      glow.addColorStop(0, theme.accent + '66');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 80, 256, 176);

      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.55;
      ctx.strokeRect(6, 6, 244, 244);
      ctx.globalAlpha = 1;

      return canvas.toDataURL('image/png');
    };

    // Current equipped/selected colors for live previews
    const currentBlinkStyle = function () { return (window.App && App.game && App.game.blinkStyle) || 'circle'; };
    const currentBlinkColor = function () { return (window.App && App.game && App.game.blinkColor) || 'auto'; };
    const currentPedestalStyle = function () { return (window.App && App.game && App.game.pedestalStyle) || 'circle'; };

    const drawShapeFrame = function (ctx, shape, color, cx, cy, size, glow) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 9;
      ctx.lineJoin = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = glow ? 22 : 12;
      const h = size / 2;
      if (shape === 'box') {
        ctx.strokeRect(cx - h, cy - h, size, size);
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.55;
        ctx.strokeRect(cx - h + 12, cy - h + 12, size - 24, size - 24);
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, h, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(cx, cy, h - 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const createBlinkPreview = function (item) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#0B1220';
      ctx.fillRect(0, 0, 256, 256);

      // A soft radial backdrop
      const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 150);
      g.addColorStop(0, 'rgba(56,189,248,0.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);

      if (item.type === 'blinkColor') {
        const color = blinkColorHex[item.id] || '#2563EB';
        if (item.id === 'rainbow') {
          const rg = ctx.createLinearGradient(48, 0, 208, 0);
          rg.addColorStop(0, '#F87171'); rg.addColorStop(0.25, '#FBBF24');
          rg.addColorStop(0.5, '#34D399'); rg.addColorStop(0.75, '#22D3EE');
          rg.addColorStop(1, '#E879F9');
          drawShapeFrame(ctx, currentBlinkStyle(), rg, 128, 128, 150, true);
        } else {
          drawShapeFrame(ctx, currentBlinkStyle(), color, 128, 128, 150, true);
        }
      } else {
        // blinkStyle — preview the shape in the currently selected color
        const color = blinkColorHex[currentBlinkColor()] || '#2563EB';
        drawShapeFrame(ctx, item.id, color, 128, 128, 150, true);
      }
      return canvas.toDataURL('image/png');
    };

    const createPedestalPreview = function (item) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#0B1220';
      ctx.fillRect(0, 0, 256, 256);
      const g = ctx.createRadialGradient(128, 150, 10, 128, 150, 150);
      g.addColorStop(0, 'rgba(251,191,36,0.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);

      const cx = 128, cy = 140;
      ctx.save();
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 20;
      if (item.id === 'box') {
        // outer slab
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(cx - 82, cy - 40, 164, 96);
        ctx.fill(); ctx.stroke();
        // inner surface
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.rect(cx - 56, cy - 16, 112, 60);
        ctx.fill();
        // star
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(cx, cy + 14, 16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 88, 44, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 60, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return canvas.toDataURL('image/png');
    };

    const getItemPreviewHTML = function (item) {
      const key = item.type + ':' + item.id;
      if (!previewCache[key]) {
        try {
          if (item.type === 'bg') {
            previewCache[key] = createThemePreview(item);
          } else if (item.type === 'blinkStyle' || item.type === 'blinkColor') {
            previewCache[key] = createBlinkPreview(item);
          } else if (item.type === 'pedestal') {
            previewCache[key] = createPedestalPreview(item);
          } else if (item.type === 'pawn') {
            const mesh = App.game.builder.createTokenMesh('#2563EB', 0, 0, item.id);
            previewCache[key] = renderObjectPreview(mesh, false);
          } else if (item.type === 'dice') {
            const mesh = App.game.builder.createDiceMesh(item.id);
            mesh.rotation.set(0.18, 0.72, 0.1);
            previewCache[key] = renderObjectPreview(mesh, false);
          } else if (item.type === 'board') {
            previewCache[key] = renderObjectPreview(createBoardPreview(item.id), true);
          }
        } catch (err) {
          previewCache[key] = null;
        }
      }

      if (previewCache[key]) {
        return '<img class="item-preview-img" src="' + previewCache[key] + '" alt="' +
          escape(item.title) + '" draggable="false">';
      }
      return '<span class="item-preview-fallback">' + (item.type === 'pawn' ? '♟' : item.type === 'dice' ? '🎲' : '✨') + '</span>';
    };

    const isEquipped = function (item) {
      if (item.type === 'pawn') return App.game.pawnSkin === item.id;
      if (item.type === 'dice') return App.game.diceSkin === item.id;
      if (item.type === 'board') return App.game.boardTheme === item.id;
      if (item.type === 'bg') return (localStorage.getItem('ludoSpark.menuBg') || 'blue') === item.id;
      if (item.type === 'blinkStyle') return App.game.blinkStyle === item.id;
      if (item.type === 'blinkColor') return App.game.blinkColor === item.id;
      if (item.type === 'pedestal') return App.game.pedestalStyle === item.id;
      return false;
    };

    const render = function (categoryName) {
      currentCategory = categoryName || currentCategory;

      ['pawns', 'dice', 'boards', 'bg', 'blink', 'pedestal'].forEach(function (category) {
        const btn = App.byId('filter-' + category);
        if (btn) btn.classList.toggle('active', category === currentCategory);
      });

      let html = '';
      (items[currentCategory] || []).forEach(function (item) {
        const equipped = isEquipped(item);
        const cardClass = equipped ? 'item-card-3d equipped' : 'item-card-3d';
        const btnText = equipped ? 'EQUIPPED ✓' : 'EQUIP';
        const btnClass = equipped ? 'equip-btn btn-active' : 'equip-btn btn-equip';
        const previewGraphic = getItemPreviewHTML(item);

        html += '<div class="' + cardClass + '">' +
          '<span class="rarity-tag rarity-' + item.rarity + '">' + item.rarity + '</span>' +
          '<div class="item-preview-box">' + previewGraphic + '</div>' +
          '<div class="item-title">' + item.title + '</div>' +
          '<div class="item-desc">' + item.desc + '</div>' +
          '<button class="' + btnClass + '" onclick="window.handleEquipItem(\'' + item.type + '\', \'' + item.id + '\')">' + btnText + '</button>' +
          '</div>';
      });

      grid.innerHTML = html;
    };

    window.handleEquipItem = function (type, id) {
      App.ui.playClick();
      if (type === 'pawn') App.game.setPawnSkin(id);
      else if (type === 'dice') {
        App.game.setDiceSkin(id);
        if (App.dice) App.dice.setSkin(id);
      }
      else if (type === 'board') App.game.setBoardTheme(id);
      else if (type === 'blinkStyle') App.game.setBlinkStyle(id);
      else if (type === 'blinkColor') App.game.setBlinkColor(id);
      else if (type === 'pedestal') App.game.setPedestalStyle(id);
      else if (type === 'bg') {
        localStorage.setItem('ludoSpark.menuBg', id);
        applyMenuBackground(id);
      }
      if (window.SysLogs) window.SysLogs.push('inventory', 'Equipped ' + type + ': ' + id);
      render(currentCategory);
    };

    const bindFilter = function (id, category) {
      const btn = App.byId(id);
      if (btn) {
        btn.onclick = function () {
          App.ui.playClick();
          render(category);
        };
      }
    };

    bindFilter('filter-pawns', 'pawns');
    bindFilter('filter-dice', 'dice');
    bindFilter('filter-boards', 'boards');
    bindFilter('filter-bg', 'bg');
    bindFilter('filter-blink', 'blink');
    bindFilter('filter-pedestal', 'pedestal');

    applyMenuBackground(localStorage.getItem('ludoSpark.menuBg') || 'blue');

    App.inventory = { render: render, getCategory: function () { return currentCategory; } };
  });
})();
