/**
 * Outfit Generator Logic
 * Handles outfit selection, generation, and results display
 */

// Hard-coded mapping from simple picker IDs -> concrete shop items
// These use real images from the existing assets folders so suggestions
// always point to items that actually exist in the shop browsing experience.
const SHOP_SUGGESTIONS_BY_PICK = {
  'top-white-shirt': [
    {
      id: 'nami-classic-white-shirt',
      name: 'Classic White Shirt',
      shop: 'Nami',
      price: '45,000 MMK',
      image: '../assets/images/Female/dress. top/nami/nami0.jpg',
      fashionType: 'Dress Top',
      reason: 'Matches your White Shirt selection.'
    },
    {
      id: 'oro-crisp-shirt',
      name: 'Crisp Stripe Shirt',
      shop: 'Oro',
      price: '52,000 MMK',
      image: '../assets/images/Female/dress. top/Oro/oro 1.jpg',
      fashionType: 'Dress Top',
      reason: 'Another clean top in the same vibe as your White Shirt.'
    }
  ],
  'top-knit': [
    {
      id: 'tee-soft-knit',
      name: 'Soft Knit Tee',
      shop: 'T shirt collection',
      price: '35,000 MMK',
      image: '../assets/images/Female/dress. top/T shirt collection/crest tee.jpg',
      fashionType: 'Tee',
      reason: 'Cozy knit alternative inspired by your Knit Tank.'
    }
  ],
  'top-striped-tee': [
    {
      id: 'val3-spiral-tee',
      name: 'VAL3 Spiral Tee',
      shop: 'VAL3',
      price: '38,000 MMK',
      image: '../assets/images/Male/VAL3/T shirt/VAL3🌀Spiral tee0.jpg',
      fashionType: 'T Shirt',
      reason: 'Graphic stripe energy to pair with your striped top.'
    }
  ],
  'top-blouse': [
    {
      id: 'luna-soft-blouse',
      name: 'Soft Luna Blouse',
      shop: 'Luna',
      price: '49,000 MMK',
      image: '../assets/images/Female/dress.burmese/Luna/LUNA0.jpg',
      fashionType: 'Burmese Dress',
      reason: 'Soft drape blouse to echo your Flowy Blouse pick.'
    }
  ],
  'bottom-wide': [
    {
      id: 'malory-wide-pants',
      name: 'Malory Wide Pants',
      shop: 'Malory',
      price: '58,000 MMK',
      image: '../assets/images/Male/Malory/pants/long pant 3.jpg',
      fashionType: 'Pants',
      reason: 'Wide-leg trousers to pair with your chosen bottoms.'
    }
  ],
  'bottom-denim': [
    {
      id: 'malory-jeans',
      name: 'Everyday Jeans',
      shop: 'Malory',
      price: '55,000 MMK',
      image: '../assets/images/Male/Malory/pants/Jeans1.jpg',
      fashionType: 'Pants',
      reason: 'Denim that matches your Relaxed Denim selection.'
    }
  ],
  'bottom-midi-skirt': [
    {
      id: 'dress-skirt-oro',
      name: 'Oro Midi Skirt',
      shop: 'Online Shop',
      price: '48,000 MMK',
      image: '../assets/images/Female/dress.skirt/oro skirt1.jpg',
      fashionType: 'Dress Skirt',
      reason: 'A flowing skirt to mirror your Midi Skirt pick.'
    }
  ],
  'bottom-tailored': [
    {
      id: 'val3-sweat-pants',
      name: 'VAL3 Tailored Sweat Pants',
      shop: 'VAL3',
      price: '60,000 MMK',
      image: '../assets/images/Male/VAL3/Pants/VAL3 Sweat pants🍃0.jpg',
      fashionType: 'Pants',
      reason: 'Structured pants that echo your Tailored Pants selection.'
    }
  ]
};

class OutfitGenerator {
  constructor() {
    this.selectedItems = {
      top: null,
      bottom: null,
      shoes: null,
      accessories: null
    };
    this.outfitHistory = this.loadHistory();
    this.init();
  }

  init() {
    // Initialize outfit selection buttons
    const outfitItems = document.querySelectorAll('.outfit-item');
    outfitItems.forEach(item => {
      item.addEventListener('click', (e) => this.handleItemSelection(e));
    });

    // Initialize generate button
    const generateBtn = document.getElementById('generate-outfit');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateOutfit());
    }

    // Initialize save button
    const saveBtn = document.getElementById('save-outfit');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveOutfit());
    }

    // Load activity history
    this.displayHistory();
  }

  handleItemSelection(e) {
    const item = e.currentTarget;
    const category = item.dataset.category;
    const itemId = item.dataset.itemId;
    const itemData = {
      id: itemId,
      name: item.dataset.itemName,
      image: item.dataset.itemImage,
      category: category
    };

    // Update selection
    this.selectedItems[category] = itemData;

    // Update UI
    this.updateSelectionUI(category, item);
    this.updatePreview();
  }

  updateSelectionUI(category, selectedItem) {
    // Remove active class from all items in category
    const categoryItems = document.querySelectorAll(`[data-category="${category}"]`);
    categoryItems.forEach(item => item.classList.remove('ring-2', 'ring-primary-500'));

    // Add active class to selected item
    selectedItem.classList.add('ring-2', 'ring-primary-500');
  }

  updatePreview() {
    // Update model preview with selected items
    if (window.modelPreview) {
      window.modelPreview.updateOutfit(this.selectedItems);
    }
  }

  generateOutfit() {
    // Check if enough items are selected (we want at least a top & bottom
    // for meaningful shop suggestions)
    const selectedCount = Object.values(this.selectedItems).filter(item => item !== null).length;
    
    if (selectedCount < 2 || !this.selectedItems.top || !this.selectedItems.bottom) {
      this.showNotification('Please select at least a top and a bottom so I can search matching shop items.', 'warning');
      return;
    }

    // Prefer concrete shop item suggestions when possible
    const shopRecommendations = this.generateShopRecommendations();
    const recommendations = shopRecommendations.length
      ? shopRecommendations
      : this.generateRecommendations();

    // Display results
    this.displayResults(recommendations);

    // Save to history
    this.addToHistory(recommendations);

    // Navigate to results page or show modal
    this.showResults(recommendations);
  }

  generateShopRecommendations() {
    const top = this.selectedItems.top;
    const bottom = this.selectedItems.bottom;
    const results = [];

    if (!top && !bottom) return results;

    function collectForPiece(piece, role) {
      if (!piece) return [];
      const mapped = SHOP_SUGGESTIONS_BY_PICK[piece.id] || [];
      return mapped.map(p => ({
        ...p,
        sourceCategory: role,
        sourcePieceName: piece.name
      }));
    }

    const fromTop = collectForPiece(top, 'top');
    const fromBottom = collectForPiece(bottom, 'bottom');

    const combined = [...fromTop, ...fromBottom];

    // Deduplicate by product id
    const seen = new Set();
    combined.forEach(p => {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        results.push(p);
      }
    });

    // Limit to a small number of cards
    return results.slice(0, 6);
  }

  generateRecommendations() {
    const top = this.selectedItems.top;
    const bottom = this.selectedItems.bottom;
    const recommendations = [];

    // If both pieces are selected, build variations around that combo
    if (top && bottom) {
      // Primary combo: exactly what the user picked
      recommendations.push({
        id: `outfit-${Date.now()}-0`,
        items: { top, bottom },
        style: 'Balanced smart-casual',
        occasion: 'Everyday',
        explanation: `Uses your exact picks: ${top.name} + ${bottom.name}.`,
        rating: Math.floor(Math.random() * 2) + 4,
        timestamp: new Date().toISOString()
      });

      // Variation 1: same top, alternate bottom if available
      const altBottom = this.getAlternateItem('bottom', bottom.id);
      if (altBottom) {
        recommendations.push({
          id: `outfit-${Date.now()}-1`,
          items: { top, bottom: altBottom },
          style: 'Relaxed variation',
          occasion: 'Weekend',
          explanation: `Keep ${top.name} and swap to ${altBottom.name} for a different vibe.`,
          rating: Math.floor(Math.random() * 2) + 4,
          timestamp: new Date().toISOString()
        });
      }

      // Variation 2: alternate top, same bottom if available
      const altTop = this.getAlternateItem('top', top.id);
      if (altTop) {
        recommendations.push({
          id: `outfit-${Date.now()}-2`,
          items: { top: altTop, bottom },
          style: 'Dressed-up option',
          occasion: 'Work',
          explanation: `Try ${altTop.name} with ${bottom.name} for a sharper look.`,
          rating: Math.floor(Math.random() * 2) + 4,
          timestamp: new Date().toISOString()
        });
      }
    } else if (top || bottom) {
      // Only one piece selected – still give some guidance
      const single = top || bottom;
      const category = top ? 'top' : 'bottom';
      const alt = this.getAlternateItem(category, single.id);

      recommendations.push({
        id: `outfit-${Date.now()}-single-0`,
        items: { ...this.selectedItems },
        style: 'Starter look',
        occasion: 'Ideas',
        explanation: `Based on your ${category} choice: ${single.name}.`,
        rating: Math.floor(Math.random() * 2) + 4,
        timestamp: new Date().toISOString()
      });

      if (alt) {
        recommendations.push({
          id: `outfit-${Date.now()}-single-1`,
          items: { ...this.selectedItems, [category]: alt },
          style: 'Alternate option',
          occasion: 'Try this next',
          explanation: `You could also try ${alt.name} as another ${category}.`,
          rating: Math.floor(Math.random() * 2) + 4,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Fallback: if nothing was built for some reason, keep old behaviour
    if (recommendations.length === 0) {
      for (let i = 0; i < 3; i++) {
        recommendations.push({
          id: `outfit-${Date.now()}-fallback-${i}`,
          items: { ...this.selectedItems },
          style: this.determineStyle(),
          occasion: this.determineOccasion(),
          explanation: 'Based on your current selections.',
          rating: Math.floor(Math.random() * 2) + 4,
          timestamp: new Date().toISOString()
        });
      }
    }

    return recommendations;
  }

  getAlternateItem(category, excludeId) {
    const all = Array.from(document.querySelectorAll(`[data-category="${category}"]`))
      .map(btn => ({
        id: btn.dataset.itemId,
        name: btn.dataset.itemName,
        image: btn.dataset.itemImage,
        category
      }));
    const filtered = all.filter(item => item.id !== excludeId);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  determineStyle() {
    const styles = ['Casual', 'Formal', 'Streetwear', 'Minimalist', 'Bold'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  determineOccasion() {
    const occasions = ['Everyday', 'Work', 'Party', 'Date', 'Travel'];
    return occasions[Math.floor(Math.random() * occasions.length)];
  }

  displayResults(recommendations) {
    const resultsContainer = document.getElementById('outfit-results');
    if (!resultsContainer) return;

    // Reset and apply a compact 2-column grid layout so cards appear smaller
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('space-y-4');
    resultsContainer.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4');

    recommendations.forEach((outfit, index) => {
      // If this looks like a concrete shop product, render as a product card.
      if (outfit && outfit.shop && outfit.image) {
        const productCard = this.createShopProductCard(outfit, index);
        resultsContainer.appendChild(productCard);
      } else {
        const outfitCard = this.createOutfitCard(outfit, index);
        resultsContainer.appendChild(outfitCard);
      }
    });

    // Add AOS animation
    if (window.AOS) {
      window.AOS.refresh();
    }
  }

  createOutfitCard(outfit, index) {
    const card = document.createElement('div');
    card.className = 'product-card animate-fade-in-up';
    card.style.animationDelay = `${index * 0.1}s`;

    const topName = outfit.items.top ? outfit.items.top.name : null;
    const bottomName = outfit.items.bottom ? outfit.items.bottom.name : null;

    let piecesLine = '';
    if (topName || bottomName) {
      const topPart = topName ? `👕 ${topName}` : '';
      const bottomPart = bottomName ? ` 👖 ${bottomName}` : '';
      piecesLine = `
        <div class="text-sm text-neutral-800 dark:text-neutral-100 mb-1">
          ${topPart}${topName && bottomName ? ' + ' : ''}${bottomPart}
        </div>
      `;
    }

    const explanation = outfit.explanation || 'Based on your current selections.';

    card.innerHTML = `
      <div class="product-card-content">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-accent-500">${outfit.style}</span>
          <span class="text-sm text-neutral-500 dark:text-neutral-400">${outfit.occasion}</span>
        </div>
        <div class="flex items-center mb-2">
          ${this.generateStars(outfit.rating)}
        </div>
        ${piecesLine}
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-3">${explanation}</p>
        <button class="btn btn-primary w-full mb-2" onclick="outfitGenerator.viewOutfit('${outfit.id}')">
          View Details
        </button>
        <button class="btn btn-secondary w-full" onclick="outfitGenerator.saveOutfitById('${outfit.id}')">
          Save to Favorites
        </button>
      </div>
    `;
    return card;
  }

  createShopProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card animate-fade-in-up';
    card.style.animationDelay = `${index * 0.1}s`;

    const reasonLine = product.reason ||
      (product.sourcePieceName
        ? `Suggested because you picked ${product.sourcePieceName}.`
        : 'Suggested based on your current selections.');

    card.innerHTML = `
      <div class="product-card-content">
        <div class="mb-3 rounded-xl overflow-hidden bg-neutral-100 dark:bg-dark-surface" style="height: 190px;">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
        </div>
        <div class="text-sm font-semibold mb-1">${product.name}</div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">${product.shop} · ${product.fashionType || ''}</div>
        <div class="text-sm font-bold text-primary-500 mb-2">${product.price}</div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-3">${reasonLine}</p>
        <button class="btn btn-secondary w-full text-xs">View in shop (demo)</button>
      </div>
    `;
    return card;
  }

  generateStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars += '<span class="text-yellow-400">★</span>';
      } else {
        stars += '<span class="text-neutral-300 dark:text-neutral-600">★</span>';
      }
    }
    return stars;
  }

  showResults(recommendations) {
    // Scroll to results section or show modal
    const resultsSection = document.getElementById('outfit-results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  viewOutfit(outfitId) {
    // Navigate to outfit details page
    window.location.href = `pages/outfit-generator.html?outfit=${outfitId}`;
  }

  saveOutfit() {
    const outfit = {
      id: `outfit-${Date.now()}`,
      items: this.selectedItems,
      timestamp: new Date().toISOString()
    };

    this.saveToFavorites(outfit);
    this.showNotification('Outfit saved to favorites!', 'success');
  }

  saveOutfitById(outfitId) {
    // Save specific generated outfit
    const outfit = this.outfitHistory.find(o => o.id === outfitId);
    if (outfit) {
      this.saveToFavorites(outfit);
      this.showNotification('Outfit saved to favorites!', 'success');
    }
  }

  saveToFavorites(outfit) {
    let favorites = JSON.parse(localStorage.getItem('favoriteOutfits') || '[]');
    favorites.push(outfit);
    localStorage.setItem('favoriteOutfits', JSON.stringify(favorites));
  }

  addToHistory(outfits) {
    this.outfitHistory = [...this.outfitHistory, ...outfits].slice(-20); // Keep last 20
    localStorage.setItem('outfitHistory', JSON.stringify(this.outfitHistory));
  }

  loadHistory() {
    return JSON.parse(localStorage.getItem('outfitHistory') || '[]');
  }

  displayHistory() {
    const historyContainer = document.getElementById('activity-history');
    if (!historyContainer || this.outfitHistory.length === 0) return;

    historyContainer.innerHTML = this.outfitHistory
      .slice(-5)
      .reverse()
      .map(outfit => `
        <div class="p-3 bg-neutral-50 dark:bg-dark-surface rounded-lg mb-2">
          <div class="text-sm font-medium">${outfit.style} - ${outfit.occasion}</div>
          <div class="text-xs text-neutral-500 dark:text-neutral-400">${new Date(outfit.timestamp).toLocaleDateString()}</div>
        </div>
      `).join('');
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'warning' ? 'bg-yellow-500' : 
      'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('outfit-generator-section')) {
    window.outfitGenerator = new OutfitGenerator();
  }
});

