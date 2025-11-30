/**
 * Try-on utilities shared across pages.
 * Handles transparent mannequin items and wardrobe metadata.
 */

(() => {
  const TRANSPARENT_ROOT = '/public/items/transparent';
  const WARDROBE_KEY = 'wardrobe';
  const MANNEQUIN_ROOT = '/public/mannequins';
  const FIT_ADJUST_KEY = 'fitAdjustments';

  // Normalize a key so it matches our transparent PNG naming convention
  function normalizeKey(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Find a matching transparent PNG for a given logical item key (group id / prefix)
  // Strategy for each logical key:
  //   1) Try exact match:  key.png
  //   2) Try indexed variants: key0.png, key1.png, ... key9.png
  // Keys themselves should already be normalized-ish (id, filename, name), but we
  // still run them through normalizeKey to match the rename-transparent.js script.
  async function findTransparentForItem(rawKey) {
    if (!rawKey) return null;
    const key = normalizeKey(rawKey);
    if (!key) return null;

    const candidates = [];

    // Exact key.png
    candidates.push(`${TRANSPARENT_ROOT}/${encodeURIComponent(key)}.png`);

    // Indexed suffixes key0.png ... key9.png
    for (let i = 0; i < 10; i++) {
      candidates.push(`${TRANSPARENT_ROOT}/${encodeURIComponent(key + i)}.png`);
    }

    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) return url;
      } catch (err) {
        // ignore network errors and try next candidate
      }
    }

    return null;
  }

  // Backwards-compatible boolean helper
  async function hasTransparentVersion(itemId) {
    const path = await findTransparentForItem(itemId);
    return !!path;
  }

  function getWardrobeItems() {
    try {
      return JSON.parse(localStorage.getItem(WARDROBE_KEY) || '[]');
    } catch (err) {
      return [];
    }
  }

  function saveWardrobeItems(list) {
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(list || []));
  }

  /**
   * Normalize a raw shop item into a wardrobe entry.
   * Adds:
   * - bgImg: background/full image path
   * - transparentImg: mannequin-ready PNG path (if exists)
   * - canTryOn: boolean flag
   */
  async function addToWardrobe(item) {
    if (!item || !item.id) return getWardrobeItems();

    const current = getWardrobeItems();
    if (current.some(w => w.id === item.id)) {
      if (window.showNotification) {
        window.showNotification('Item already in wardrobe', 'info');
      }
      return current;
    }

    const itemId = item.id;
    const bgImg = item.image;

    // Try multiple logical keys to locate the correct transparent PNG.
    const candidateKeys = [];
    if (itemId) candidateKeys.push(itemId);
    if (bgImg) {
      const file = bgImg.split('/').pop() || '';
      const withoutExt = file.replace(/\.(png|jpe?g|webp)$/i, '');
      if (withoutExt) candidateKeys.push(withoutExt);
    }
    if (item.name) {
      candidateKeys.push(item.name);
    }

    let transparentPath = null;
    for (const key of candidateKeys) {
      transparentPath = await findTransparentForItem(key);
      if (transparentPath) break;
    }

    const canTryOn = !!transparentPath;

    if (!canTryOn && typeof console !== 'undefined' && console.warn) {
      console.warn(
        `No transparent PNG found for item id="${itemId}"; tried keys: ${candidateKeys
          .map(k => `${k} -> ${normalizeKey(k)}`)
          .join(', ')} under ${TRANSPARENT_ROOT}`
      );
    }

    const entry = {
      ...item,
      bgImg,
      transparentImg: canTryOn ? transparentPath : null,
      canTryOn
    };

    const updated = [...current, entry];
    saveWardrobeItems(updated);

    if (window.showNotification) {
      window.showNotification(
        canTryOn
          ? 'Added to wardrobe (mannequin-ready).'
          : 'Added to wardrobe (no mannequin try-on for this item).',
        'success'
      );
    }

    return updated;
  }

  // Filter only items that can be used on the mannequin
  function filterTryOnItems(items) {
    return (items || []).filter(i => i && i.canTryOn && i.transparentImg);
  }

  // Mannequin gender helpers
  function getMannequinGender() {
    try {
      const stored = localStorage.getItem('mannequinGender');
      if (stored === 'male' || stored === 'female') return stored;
      return 'female';
    } catch (err) {
      return 'female';
    }
  }

  function setMannequinGender(gender) {
    const normalized = gender === 'male' ? 'male' : 'female';
    try {
      localStorage.setItem('mannequinGender', normalized);
    } catch (err) {
      // ignore storage errors
    }

    const mannequinImg = document.getElementById('mannequin-base');
    if (mannequinImg) {
      mannequinImg.src = `${MANNEQUIN_ROOT}/${normalized}-front.png`;
    }
  }

  function applyAutoGender(item) {
    if (!item || !item.gender) return;
    const g = item.gender === 'male' ? 'male' : item.gender === 'female' ? 'female' : null;
    if (!g) return;
    setMannequinGender(g);
  }

  function loadFitAdjustments() {
    try {
      const raw = localStorage.getItem(FIT_ADJUST_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  let fitAdjustments = loadFitAdjustments();

  function saveFitAdjustments(map) {
    fitAdjustments = map || {};
    try {
      localStorage.setItem(FIT_ADJUST_KEY, JSON.stringify(fitAdjustments));
    } catch (err) {
      // ignore storage errors
    }
  }

  function applySavedTransform(layer, itemId) {
    if (!layer || !itemId) return;
    const adj = fitAdjustments[itemId] || { x: 0, y: 0, scale: 1 };
    const x = typeof adj.x === 'number' ? adj.x : 0;
    const y = typeof adj.y === 'number' ? adj.y : 0;
    const scale = typeof adj.scale === 'number' ? adj.scale : 1;

    layer.dataset.itemId = itemId;
    layer.dataset.translateX = String(x);
    layer.dataset.translateY = String(y);
    layer.dataset.scale = String(scale);
    layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  function enableLayerDragging(layer, item) {
    if (!layer || !item || !item.id) return;
    layer.dataset.fitAdjustBound = '1';   // always bind events

    const itemId = item.id;

    function getState() {
      return {
        x: parseFloat(layer.dataset.translateX || '0') || 0,
        y: parseFloat(layer.dataset.translateY || '0') || 0,
        scale: parseFloat(layer.dataset.scale || '1') || 1
      };
    }

    function applyState(state) {
      const x = state.x;
      const y = state.y;
      const scale = state.scale;
      layer.dataset.translateX = String(x);
      layer.dataset.translateY = String(y);
      layer.dataset.scale = String(scale);
      layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }

    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startX = 0;
    let startY = 0;

    function onPointerDown(ev) {
      if (!window.fitAdjustMode) return;
      const e = ev.touches ? ev.touches[0] : ev;
      isDragging = true;
      const state = getState();
      startX = state.x;
      startY = state.y;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      ev.preventDefault();
    }

    function onPointerMove(ev) {
      if (!isDragging) return;
      const e = ev.touches ? ev.touches[0] : ev;
      const dx = e.clientX - startPointerX;
      const dy = e.clientY - startPointerY;
      const state = getState();
      state.x = startX + dx;
      state.y = startY + dy;
      applyState(state);
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      const state = getState();
      fitAdjustments[itemId] = {
        x: state.x,
        y: state.y,
        scale: state.scale
      };
      saveFitAdjustments(fitAdjustments);
    }

    function onWheel(ev) {
      if (!window.fitAdjustMode) return;
      ev.preventDefault();
      const state = getState();
      const delta = -ev.deltaY * 0.001;
      let scale = state.scale + delta;
      if (!Number.isFinite(scale)) scale = 1;
      scale = Math.max(0.5, Math.min(2, scale));
      state.scale = scale;
      applyState(state);
      fitAdjustments[itemId] = {
        x: state.x,
        y: state.y,
        scale: state.scale
      };
      saveFitAdjustments(fitAdjustments);
    }

    layer.addEventListener('mousedown', onPointerDown, { passive: false });
    layer.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp, { passive: false });
    window.addEventListener('touchend', onPointerUp, { passive: false });
    layer.addEventListener('wheel', onWheel, { passive: false });
  }

  // Expose helpers on window for inline scripts
  window.hasTransparentVersion = hasTransparentVersion;
  window.findTransparentForItem = findTransparentForItem;
  window.getWardrobeItems = getWardrobeItems;
  window.addToWardrobeAsync = addToWardrobe;
  window.filterTryOnItems = filterTryOnItems;
  window.setMannequinGender = setMannequinGender;
  window.getMannequinGender = getMannequinGender;
  window.applyAutoGender = applyAutoGender;
  window.fitAdjustMode = window.fitAdjustMode || false;
  window.loadFitAdjustments = loadFitAdjustments;
  window.saveFitAdjustments = saveFitAdjustments;
  window.applySavedTransform = applySavedTransform;
  window.enableLayerDragging = enableLayerDragging;
  window.fitAdjustments = fitAdjustments;
})();
