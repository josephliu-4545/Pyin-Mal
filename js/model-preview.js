class ModelPreview {
  constructor() {
    this.stage = document.getElementById('silhouette-stage');
    this.summary = document.getElementById('look-summary');
    this.layerGroups = {
      top: document.querySelector('[data-layer="top"]'),
      bottom: document.querySelector('[data-layer="bottom"]')
    };
    this.imageLayers = {
      top: document.querySelector('[data-layer-img="top"]'),
      bottom: document.querySelector('[data-layer-img="bottom"]')
    };

    if (!this.stage) {
      return;
    }

    this.resetBtn = document.getElementById('reset-tryon');
    this.saveBtn = document.getElementById('save-look');
    this.selected = { top: null, bottom: null };
    this.controlDefaults = { height: 185, shoulder: 120, hips: 110, torso: 180 };
    this.controlBindings = {
      height: '--silhouette-scale',
      shoulder: '--top-width-scale',
      hips: '--bottom-width-scale',
      torso: '--torso-scale'
    };

    this.initWardrobe();
    this.initControls();
    this.initActions();
    this.updateSummary();
  }

  initWardrobe() {
    this.wardrobeButtons = Array.from(document.querySelectorAll('[data-garment]'));
    this.wardrobeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const data = {
          id: btn.dataset.garment,
          type: btn.dataset.type,
          label: btn.dataset.label,
          primary: btn.dataset.primary || '#94a3b8',
          secondary: btn.dataset.secondary || btn.dataset.primary || '#64748b',
          texture: btn.dataset.texture || 'solid',
          image: btn.dataset.outfitImage || ''
        };
        this.applyGarment(data);
      });
    });
  }

  applyGarment(garment) {
    if (!garment?.type || !this.layerGroups[garment.type]) return;

    const group = this.layerGroups[garment.type];
    group.dataset.active = 'true';
    group.dataset.texture = garment.texture || 'solid';
    group.style.setProperty('--garment-main', garment.primary || '#94a3b8');
    group.style.setProperty('--garment-secondary', garment.secondary || garment.primary || '#64748b');
    group.setAttribute('aria-label', `${garment.label} layer`);

    const imgLayer = this.imageLayers[garment.type];
    if (imgLayer) {
      if (garment.image && garment.image.trim() !== '') {
        imgLayer.src = garment.image;
        imgLayer.alt = garment.label;
        imgLayer.dataset.visible = 'true';
      } else {
        imgLayer.removeAttribute('src');
        imgLayer.alt = '';
        imgLayer.dataset.visible = 'false';
      }
    }

    this.selected[garment.type] = { ...garment };
    this.highlightSelection(garment.type, garment.id);
    this.updateSummary();
  }

  highlightSelection(type, id) {
    this.wardrobeButtons
      .filter((btn) => btn.dataset.type === type)
      .forEach((btn) => {
        btn.dataset.selected = btn.dataset.garment === id ? 'true' : 'false';
      });
  }

  clearGarment(type, options = {}) {
    if (!this.layerGroups[type]) return;
    const group = this.layerGroups[type];
    const imgLayer = this.imageLayers[type];
    group.dataset.active = 'false';
    group.dataset.texture = 'solid';
    group.style.removeProperty('--garment-main');
    group.style.removeProperty('--garment-secondary');
    if (imgLayer) {
      imgLayer.removeAttribute('src');
      imgLayer.alt = '';
      imgLayer.dataset.visible = 'false';
    }
    this.selected[type] = null;
    this.highlightSelection(type, '');
    if (!options.silent) {
      this.updateSummary();
    }
  }

  initControls() {
    this.controls = Array.from(document.querySelectorAll('[data-control]'));
    this.controls.forEach((input) => {
      const control = input.dataset.control;
      const defaultValue = Number(input.dataset.default || input.value);
      input.value = defaultValue;
      this.setMeasurement(control, defaultValue);
      this.updateControlOutput(control, defaultValue);

      input.addEventListener('input', (event) => {
        const value = Number(event.target.value);
        this.setMeasurement(control, value);
        this.updateControlOutput(control, value);
      });
    });
  }

  updateControlOutput(control, value) {
    const output = document.querySelector(`[data-output="${control}"]`);
    if (output) {
      output.textContent = control === 'torso' ? `${value} px` : `${value} cm`;
    }
  }

  setMeasurement(control, value) {
    const base = this.controlDefaults[control];
    const cssVar = this.controlBindings[control];
    if (!cssVar || !this.stage || !base) return;
    const ratio = value / base;
    this.stage.style.setProperty(cssVar, ratio.toFixed(3));
  }

  initActions() {
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.reset());
    }

    document.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.remove;
        if (!type) return;
        this.clearGarment(type, { silent: false });
        this.showToast(`Cleared ${type} layer`, 'info');
      });
    });

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.handleSaveLook());
    }
  }

  updateSummary() {
    if (!this.summary) return;
    ['top', 'bottom'].forEach((type) => {
      const row = this.summary.querySelector(`[data-summary="${type}"]`);
      if (!row) return;
      const valueEl = row.querySelector('.summary-value');
      const metaEl = row.querySelector('.summary-meta');
      const colorDot = row.querySelector('[data-color]');
      const removeBtn = row.querySelector(`[data-remove="${type}"]`);
      const data = this.selected[type];

      if (data) {
        valueEl.textContent = data.label;
        metaEl.textContent = 'Anchored & scaled';
        if (colorDot) colorDot.style.background = data.primary;
        if (removeBtn) removeBtn.disabled = false;
      } else {
        valueEl.textContent = 'Not selected';
        metaEl.textContent = type === 'top' ? 'Choose a silhouette' : 'Ground the look';
        if (colorDot) colorDot.style.background = '#e5e7eb';
        if (removeBtn) removeBtn.disabled = true;
      }
    });
  }

  handleSaveLook() {
    const snapshot = {
      id: `look-${Date.now()}`,
      savedAt: new Date().toISOString(),
      selections: this.selected,
      measurements: this.getMeasurementSnapshot()
    };
    const savedLooks = JSON.parse(localStorage.getItem('virtualLooks') || '[]');
    savedLooks.unshift(snapshot);
    localStorage.setItem('virtualLooks', JSON.stringify(savedLooks.slice(0, 12)));
    this.showToast('Look saved locally', 'success');
  }

  getMeasurementSnapshot() {
    const result = {};
    Object.keys(this.controlDefaults).forEach((key) => {
      const control = this.controls.find((input) => input.dataset.control === key);
      result[key] = Number(control?.value || this.controlDefaults[key]);
    });
    return result;
  }

  showToast(message, variant = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed top-24 right-5 z-50 px-4 py-2 rounded-2xl text-sm text-white shadow-lg transition duration-300 translate-x-6 opacity-0 ${
      variant === 'success' ? 'bg-emerald-500' : 'bg-slate-700'
    }`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-6', 'opacity-0');
    });
    setTimeout(() => {
      toast.classList.add('translate-x-6', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  reset() {
    Object.entries(this.controlDefaults).forEach(([control, value]) => {
      const input = this.controls.find((c) => c.dataset.control === control);
      if (input) {
        input.value = value;
      }
      this.setMeasurement(control, value);
      this.updateControlOutput(control, value);
    });
    ['top', 'bottom'].forEach((type) => this.clearGarment(type, { silent: true }));
    this.updateSummary();
    this.showToast('Silhouette reset', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.modelPreview = new ModelPreview();
});
