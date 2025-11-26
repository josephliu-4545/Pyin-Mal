/**
 * Outfit Generator Logic
 * Handles outfit selection, generation, and results display
 */

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
    // Check if enough items are selected
    const selectedCount = Object.values(this.selectedItems).filter(item => item !== null).length;
    
    if (selectedCount < 2) {
      this.showNotification('Please select at least 2 items to generate an outfit', 'warning');
      return;
    }

    // Generate outfit recommendations (simulated AI)
    const recommendations = this.generateRecommendations();

    // Display results
    this.displayResults(recommendations);

    // Save to history
    this.addToHistory(recommendations);

    // Navigate to results page or show modal
    this.showResults(recommendations);
  }

  generateRecommendations() {
    // Simulated AI recommendation logic
    const recommendations = [];

    // Generate 3-5 outfit variations
    for (let i = 0; i < 4; i++) {
      recommendations.push({
        id: `outfit-${Date.now()}-${i}`,
        items: { ...this.selectedItems },
        style: this.determineStyle(),
        occasion: this.determineOccasion(),
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        timestamp: new Date().toISOString()
      });
    }

    return recommendations;
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

    resultsContainer.innerHTML = '';

    recommendations.forEach((outfit, index) => {
      const outfitCard = this.createOutfitCard(outfit, index);
      resultsContainer.appendChild(outfitCard);
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
    card.innerHTML = `
      <div class="product-card-content">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-accent-500">${outfit.style}</span>
          <span class="text-sm text-neutral-500 dark:text-neutral-400">${outfit.occasion}</span>
        </div>
        <div class="flex items-center mb-3">
          ${this.generateStars(outfit.rating)}
        </div>
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

