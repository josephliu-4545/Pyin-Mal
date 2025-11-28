/**
 * Try-on utilities shared across pages.
 * Handles transparent mannequin items and wardrobe metadata.
 */

(() => {
  const TRANSPARENT_ROOT = '/public/items/transparent';
  const WARDROBE_KEY = 'wardrobe';
  const MANNEQUIN_ROOT = '/public/mannequins';

  // Check if a transparent PNG exists for this item id
  async function hasTransparentVersion(itemId) {
    if (!itemId) return false;
    const url = `${TRANSPARENT_ROOT}/${encodeURIComponent(itemId)}.png`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch (err) {
      // Network or local file error – treat as not available
      return false;
    }
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
    const transparentPath = `${TRANSPARENT_ROOT}/${encodeURIComponent(itemId)}.png`;
    const canTryOn = await hasTransparentVersion(itemId);

    if (!canTryOn && typeof console !== 'undefined' && console.warn) {
      console.warn(`No transparent PNG found for: ${itemId}  → expected at /public/items/transparent/${itemId}.png`);
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

  // Expose helpers on window for inline scripts
  window.hasTransparentVersion = hasTransparentVersion;
  window.getWardrobeItems = getWardrobeItems;
  window.addToWardrobeAsync = addToWardrobe;
  window.filterTryOnItems = filterTryOnItems;
  window.setMannequinGender = setMannequinGender;
  window.getMannequinGender = getMannequinGender;
  window.applyAutoGender = applyAutoGender;
})();
