/**
 * Model Preview System
 * Handles outfit and hairstyle layering on base model
 */

class ModelPreview {
  constructor() {
    this.baseModel = null;
    this.currentOutfit = null;
    this.currentHairstyle = null;
    this.init();
  }

  init() {
    // Find preview container
    this.previewContainer = document.getElementById('model-preview-container');
    if (!this.previewContainer) return;

    // Load base model
    this.loadBaseModel();

    // Initialize outfit selection handlers
    this.initOutfitHandlers();

    // Initialize hairstyle selection handlers
    this.initHairstyleHandlers();
  }

  loadBaseModel() {
    // Base model should be in the HTML, but we can also load dynamically
    const baseModelImg = this.previewContainer?.querySelector('.model-base');
    if (baseModelImg) {
      this.baseModel = baseModelImg;
    }
  }

  initOutfitHandlers() {
    const outfitItems = document.querySelectorAll('[data-outfit-id]');
    outfitItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const outfitId = e.currentTarget.dataset.outfitId;
        const outfitImage = e.currentTarget.dataset.outfitImage;
        this.updateOutfit(outfitId, outfitImage);
      });
    });
  }

  initHairstyleHandlers() {
    const hairstyleItems = document.querySelectorAll('[data-hairstyle-id]');
    hairstyleItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const hairstyleId = e.currentTarget.dataset.hairstyleId;
        const hairstyleImage = e.currentTarget.dataset.hairstyleImage;
        this.updateHairstyle(hairstyleId, hairstyleImage);
      });
    });
  }

  updateOutfit(outfitData, outfitImage = null) {
    if (typeof outfitData === 'object' && outfitData !== null) {
      // Handle object with multiple items
      this.updateOutfitLayers(outfitData);
    } else {
      // Handle single outfit ID/image
      this.updateOutfitLayer(outfitData, outfitImage);
    }
  }

  updateOutfitLayers(items) {
    // Remove existing outfit layers
    this.removeOutfitLayers();

    // Add new outfit layers based on items
    if (items.top) {
      this.addOutfitLayer('top', items.top.image || items.top);
    }
    if (items.bottom) {
      this.addOutfitLayer('bottom', items.bottom.image || items.bottom);
    }
    if (items.shoes) {
      this.addOutfitLayer('shoes', items.shoes.image || items.shoes);
    }
    if (items.accessories) {
      this.addOutfitLayer('accessories', items.accessories.image || items.accessories);
    }
  }

  updateOutfitLayer(outfitId, outfitImage) {
    // Remove existing outfit layer
    this.removeOutfitLayers();

    // Add new outfit layer
    if (outfitImage) {
      this.addOutfitLayer('full', outfitImage);
    }
  }

  addOutfitLayer(type, imagePath) {
    if (!this.previewContainer) return;

    const layer = document.createElement('img');
    layer.className = `outfit-layer outfit-${type}`;
    layer.src = imagePath;
    layer.alt = `Outfit ${type}`;
    layer.style.zIndex = this.getZIndex(type);

    // Add fade-in animation
    layer.style.opacity = '0';
    layer.style.transition = 'opacity 0.3s ease';

    this.previewContainer.appendChild(layer);

    // Trigger fade-in
    setTimeout(() => {
      layer.style.opacity = '1';
    }, 10);

    this.currentOutfit = { type, imagePath };
  }

  removeOutfitLayers() {
    if (!this.previewContainer) return;

    const layers = this.previewContainer.querySelectorAll('.outfit-layer');
    layers.forEach(layer => {
      layer.style.opacity = '0';
      setTimeout(() => layer.remove(), 300);
    });
  }

  updateHairstyle(hairstyleId, hairstyleImage) {
    if (!this.previewContainer) return;

    // Remove existing hairstyle
    const existingHairstyle = this.previewContainer.querySelector('.hairstyle-layer');
    if (existingHairstyle) {
      existingHairstyle.style.opacity = '0';
      setTimeout(() => existingHairstyle.remove(), 300);
    }

    // Add new hairstyle
    if (hairstyleImage) {
      const hairstyleLayer = document.createElement('img');
      hairstyleLayer.className = 'hairstyle-layer';
      hairstyleLayer.src = hairstyleImage;
      hairstyleLayer.alt = `Hairstyle ${hairstyleId}`;
      hairstyleLayer.style.zIndex = '100';
      hairstyleLayer.style.opacity = '0';
      hairstyleLayer.style.transition = 'opacity 0.3s ease';

      this.previewContainer.appendChild(hairstyleLayer);

      setTimeout(() => {
        hairstyleLayer.style.opacity = '1';
      }, 10);

      this.currentHairstyle = { id: hairstyleId, image: hairstyleImage };
    }
  }

  getZIndex(type) {
    const zIndexMap = {
      'bottom': 10,
      'top': 20,
      'accessories': 30,
      'shoes': 5,
      'full': 15
    };
    return zIndexMap[type] || 15;
  }

  reset() {
    this.removeOutfitLayers();
    const hairstyleLayer = this.previewContainer?.querySelector('.hairstyle-layer');
    if (hairstyleLayer) {
      hairstyleLayer.remove();
    }
    this.currentOutfit = null;
    this.currentHairstyle = null;
  }

  saveScreenshot() {
    // This would require html2canvas or similar library
    // For now, just log the current state
    console.log('Screenshot functionality would be implemented here');
    console.log('Current outfit:', this.currentOutfit);
    console.log('Current hairstyle:', this.currentHairstyle);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('model-preview-container')) {
    window.modelPreview = new ModelPreview();
  }
});

