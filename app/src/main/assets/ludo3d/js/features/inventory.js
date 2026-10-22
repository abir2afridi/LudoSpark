/**
 * Inventory and wardrobe studio with custom visual item previews.
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
      ]
    };

    let currentCategory = 'pawns';

    const getItemPreviewHTML = function (item) {
      if (item.type === 'pawn') {
        if (item.id === 'classic') {
          return '<svg viewBox="0 0 36 48" width="36" height="48"><path d="M18 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-5 18h10l2 16H11l2-16zm-3 18h16v4H10v-4z" fill="#38BDF8" stroke="#FEF3C7" stroke-width="1.5"/></svg>';
        }
        if (item.id === 'human') {
          return '<svg viewBox="0 0 36 48" width="36" height="48"><circle cx="18" cy="10" r="8" fill="#F1C27D"/><path d="M10 24c0-4 4-6 8-6s8 2 8 6v14H10V24z" fill="#2563EB" stroke="#FEF3C7" stroke-width="1.5"/><rect x="8" y="40" width="20" height="4" rx="2" fill="#F59E0B"/></svg>';
        }
        if (item.id === 'knight') {
          return '<svg viewBox="0 0 36 48" width="36" height="48"><path d="M18 4l12 6v12c0 10-7 16-12 18S6 32 6 22V10l12-6z" fill="#F59E0B" stroke="#FEF3C7" stroke-width="1.5"/><path d="M12 18h12v4H12z" fill="#0F172A"/></svg>';
        }
        if (item.id === 'cyber') {
          return '<svg viewBox="0 0 36 48" width="36" height="48"><rect x="10" y="6" width="16" height="14" rx="3" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/><rect x="12" y="10" width="12" height="4" fill="#38BDF8"/><path d="M8 22h20v16H8z" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/><circle cx="18" cy="30" r="4" fill="#38BDF8"/></svg>';
        }
      }

      if (item.type === 'dice') {
        if (item.id === 'white') {
          return '<svg viewBox="0 0 44 44" width="44" height="44"><rect x="2" y="2" width="40" height="40" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/><circle cx="14" cy="14" r="3.5" fill="#0F172A"/><circle cx="30" cy="14" r="3.5" fill="#0F172A"/><circle cx="22" cy="22" r="3.5" fill="#EF4444"/><circle cx="14" cy="30" r="3.5" fill="#0F172A"/><circle cx="30" cy="30" r="3.5" fill="#0F172A"/></svg>';
        }
        if (item.id === 'gold') {
          return '<svg viewBox="0 0 44 44" width="44" height="44"><rect x="2" y="2" width="40" height="40" rx="8" fill="url(#goldDieGrad)" stroke="#FEF3C7" stroke-width="2"/><defs><linearGradient id="goldDieGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#B45309"/></linearGradient></defs><circle cx="14" cy="14" r="3.5" fill="#78350F"/><circle cx="30" cy="14" r="3.5" fill="#78350F"/><circle cx="22" cy="22" r="3.5" fill="#78350F"/><circle cx="14" cy="30" r="3.5" fill="#78350F"/><circle cx="30" cy="30" r="3.5" fill="#78350F"/></svg>';
        }
        if (item.id === 'neon') {
          return '<svg viewBox="0 0 44 44" width="44" height="44"><rect x="2" y="2" width="40" height="40" rx="8" fill="#0284C7" stroke="#38BDF8" stroke-width="2"/><circle cx="14" cy="14" r="3.5" fill="#FEF3C7"/><circle cx="30" cy="14" r="3.5" fill="#FEF3C7"/><circle cx="22" cy="22" r="3.5" fill="#38BDF8"/><circle cx="14" cy="30" r="3.5" fill="#FEF3C7"/><circle cx="30" cy="30" r="3.5" fill="#FEF3C7"/></svg>';
        }
        if (item.id === 'ruby') {
          return '<svg viewBox="0 0 44 44" width="44" height="44"><rect x="2" y="2" width="40" height="40" rx="8" fill="#BE123C" stroke="#FFE4E6" stroke-width="2"/><circle cx="14" cy="14" r="3.5" fill="#FFFFFF"/><circle cx="30" cy="14" r="3.5" fill="#FFFFFF"/><circle cx="22" cy="22" r="3.5" fill="#FFFFFF"/><circle cx="14" cy="30" r="3.5" fill="#FFFFFF"/><circle cx="30" cy="30" r="3.5" fill="#FFFFFF"/></svg>';
        }
        if (item.id === 'emerald') {
          return '<svg viewBox="0 0 44 44" width="44" height="44"><rect x="2" y="2" width="40" height="40" rx="8" fill="#047857" stroke="#A7F3D0" stroke-width="2"/><circle cx="14" cy="14" r="3.5" fill="#FEF3C7"/><circle cx="30" cy="14" r="3.5" fill="#FEF3C7"/><circle cx="22" cy="22" r="3.5" fill="#38BDF8"/><circle cx="14" cy="30" r="3.5" fill="#FEF3C7"/><circle cx="30" cy="30" r="3.5" fill="#FEF3C7"/></svg>';
        }
      }

      if (item.type === 'board') {
        if (item.id === 'classic') {
          return '<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="6" fill="#0F172A"/><rect x="2" y="2" width="18" height="18" fill="#2563EB"/><rect x="28" y="2" width="18" height="18" fill="#E11D48"/><rect x="2" y="28" width="18" height="18" fill="#16A34A"/><rect x="28" y="28" width="18" height="18" fill="#EAB308"/><polygon points="20,20 28,20 24,24" fill="#E11D48"/><polygon points="20,28 28,28 24,24" fill="#2563EB"/><polygon points="20,20 20,28 24,24" fill="#16A34A"/><polygon points="28,20 28,28 24,24" fill="#EAB308"/></svg>';
        }
        if (item.id === 'wood') {
          return '<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="6" fill="#451A03" stroke="#B45309" stroke-width="2"/><rect x="4" y="4" width="16" height="16" fill="#78350F"/><rect x="28" y="4" width="16" height="16" fill="#991B1B"/><rect x="4" y="28" width="16" height="16" fill="#065F46"/><rect x="28" y="28" width="16" height="16" fill="#854D0E"/></svg>';
        }
        if (item.id === 'cyber') {
          return '<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="6" fill="#0F0E26" stroke="#38BDF8" stroke-width="2"/><rect x="4" y="4" width="16" height="16" fill="#1E1B4B" stroke="#38BDF8"/><rect x="28" y="4" width="16" height="16" fill="#1E1B4B" stroke="#EC4899"/><rect x="4" y="28" width="16" height="16" fill="#1E1B4B" stroke="#10B981"/><rect x="28" y="28" width="16" height="16" fill="#1E1B4B" stroke="#F59E0B"/></svg>';
        }
        if (item.id === 'galaxy') {
          return '<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="6" fill="#020617" stroke="#8B5CF6" stroke-width="2"/><circle cx="24" cy="24" r="18" fill="url(#galaxyGrad)" opacity="0.6"/><defs><radialGradient id="galaxyGrad"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#020617"/></radialGradient></defs></svg>';
        }
      }

      if (item.type === 'bg') {
        if (item.id === 'blue') {
          return '<div style="width:48px; height:48px; border-radius:10px; background:radial-gradient(circle, #0D3280 0%, #020B2A 100%); border:2px solid #38BDF8; box-shadow:0 0 8px rgba(56,189,248,0.5);"></div>';
        }
        if (item.id === 'sunset') {
          return '<div style="width:48px; height:48px; border-radius:10px; background:radial-gradient(circle, #7C2D12 0%, #180902 100%); border:2px solid #F59E0B; box-shadow:0 0 8px rgba(245,158,11,0.5);"></div>';
        }
        if (item.id === 'cyber') {
          return '<div style="width:48px; height:48px; border-radius:10px; background:radial-gradient(circle, #4C1D95 0%, #0F0E26 100%); border:2px solid #EC4899; box-shadow:0 0 8px rgba(236,72,153,0.5);"></div>';
        }
        if (item.id === 'emerald') {
          return '<div style="width:48px; height:48px; border-radius:10px; background:radial-gradient(circle, #064E3B 0%, #01140E 100%); border:2px solid #10B981; box-shadow:0 0 8px rgba(16,185,129,0.5);"></div>';
        }
      }

      return '✨';
    };

    const isEquipped = function (item) {
      if (item.type === 'pawn') return App.game.pawnSkin === item.id;
      if (item.type === 'dice') return App.game.diceSkin === item.id;
      if (item.type === 'board') return App.game.boardTheme === item.id;
      if (item.type === 'bg') return (localStorage.getItem('ludoSpark.menuBg') || 'blue') === item.id;
      return false;
    };

    const render = function (categoryName) {
      currentCategory = categoryName || currentCategory;

      ['pawns', 'dice', 'boards', 'bg'].forEach(function (category) {
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
      else if (type === 'bg') {
        localStorage.setItem('ludoSpark.menuBg', id);
        const menu = App.dom.mainMenuEl;
        if (menu) {
          menu.classList.remove('menu-bg-sunset', 'menu-bg-cyber', 'menu-bg-emerald');
          if (id !== 'blue') menu.classList.add('menu-bg-' + id);
        }
      }
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

    App.inventory = { render: render, getCategory: function () { return currentCategory; } };
  });
})();
