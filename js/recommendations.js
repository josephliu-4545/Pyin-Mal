/**
 * AI Recommendation System (Front-End Simulation)
 * Provides rule-based outfit and hairstyle recommendations
 */

class RecommendationEngine {
  constructor() {
    this.init();
  }

  init() {
    // Initialize recommendation triggers
    this.initFaceShapeRecommendations();
    this.initStylePreferences();
  }

  initFaceShapeRecommendations() {
    const faceShapeSelect = document.getElementById('face-shape-select');
    if (faceShapeSelect) {
      faceShapeSelect.addEventListener('change', (e) => {
        this.getHairstyleRecommendations(e.target.value);
      });
    }
  }

  initStylePreferences() {
    const stylePreferenceBtns = document.querySelectorAll('[data-style-preference]');
    stylePreferenceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const style = e.currentTarget.dataset.stylePreference;
        this.getOutfitRecommendations(style);
      });
    });
  }

  getHairstyleRecommendations(faceShape) {
    // Rule-based hairstyle recommendations
    const recommendations = {
      'oval': ['Long layers', 'Bob cut', 'Pixie cut', 'Side-swept bangs'],
      'round': ['Long layers', 'Asymmetrical bob', 'Side-parted styles', 'Volume on top'],
      'square': ['Soft waves', 'Long layers', 'Side-swept bangs', 'Curly styles'],
      'heart': ['Chin-length bob', 'Side-parted', 'Long layers', 'Bangs'],
      'diamond': ['Chin-length styles', 'Bangs', 'Volume at sides', 'Layered cuts'],
      'oblong': ['Medium length', 'Bangs', 'Volume on sides', 'Layered styles']
    };

    const recommendedStyles = recommendations[faceShape] || recommendations['oval'];
    this.displayHairstyleRecommendations(recommendedStyles, faceShape);
  }

  getOutfitRecommendations(stylePreference) {
    // Rule-based outfit recommendations
    const recommendations = {
      'casual': {
        tops: ['T-Shirt', 'Hoodie', 'Sweatshirt'],
        bottoms: ['Jeans', 'Joggers', 'Sweatpants'],
        shoes: ['Sneakers', 'Casual shoes'],
        description: 'Comfortable everyday wear'
      },
      'formal': {
        tops: ['Dress Shirt', 'Blazer', 'Suit'],
        bottoms: ['Dress Pants', 'Chinos'],
        shoes: ['Dress Shoes', 'Oxfords'],
        description: 'Professional and polished'
      },
      'streetwear': {
        tops: ['Graphic Tee', 'Oversized Hoodie', 'Crop Top'],
        bottoms: ['Cargo Pants', 'Wide Leg Jeans', 'Shorts'],
        shoes: ['High-top Sneakers', 'Platform Shoes'],
        description: 'Urban and trendy'
      },
      'minimalist': {
        tops: ['Basic Tee', 'Neutral Sweater'],
        bottoms: ['Straight Leg Jeans', 'Tailored Pants'],
        shoes: ['Simple Sneakers', 'Loafers'],
        description: 'Clean and simple'
      },
      'bold': {
        tops: ['Statement Piece', 'Colorful Top'],
        bottoms: ['Patterned Pants', 'Bright Colors'],
        shoes: ['Statement Shoes'],
        description: 'Eye-catching and vibrant'
      }
    };

    const recommendation = recommendations[stylePreference] || recommendations['casual'];
    this.displayOutfitRecommendations(recommendation, stylePreference);
  }

  displayHairstyleRecommendations(styles, faceShape) {
    const container = document.getElementById('hairstyle-recommendations');
    if (!container) return;

    container.innerHTML = `
      <div class="mb-4">
        <h3 class="font-rufina text-xl font-semibold mb-2">Recommended for ${faceShape} face shape:</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${styles.map(style => `
            <div class="p-4 bg-white dark:bg-dark-card rounded-lg shadow-soft dark:shadow-soft-dark text-center">
              <div class="font-medium text-neutral-900 dark:text-dark-text">${style}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  displayOutfitRecommendations(recommendation, style) {
    const container = document.getElementById('outfit-recommendations');
    if (!container) return;

    container.innerHTML = `
      <div class="p-6 bg-white dark:bg-dark-card rounded-xl shadow-soft dark:shadow-soft-dark">
        <h3 class="font-rufina text-xl font-semibold mb-4">${style.charAt(0).toUpperCase() + style.slice(1)} Style Recommendations</h3>
        <p class="text-neutral-600 dark:text-neutral-400 mb-4">${recommendation.description}</p>
        <div class="space-y-3">
          <div>
            <h4 class="font-semibold mb-2">Tops:</h4>
            <div class="flex flex-wrap gap-2">
              ${recommendation.tops.map(item => `<span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm">${item}</span>`).join('')}
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Bottoms:</h4>
            <div class="flex flex-wrap gap-2">
              ${recommendation.bottoms.map(item => `<span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm">${item}</span>`).join('')}
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Shoes:</h4>
            <div class="flex flex-wrap gap-2">
              ${recommendation.shoes.map(item => `<span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm">${item}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getPersonalizedRecommendations(userPreferences) {
    // Combine multiple factors for personalized recommendations
    const { faceShape, stylePreference, bodyType, colorPreference } = userPreferences;

    // Simple scoring system
    const recommendations = [];

    // This would be expanded with more sophisticated logic
    return recommendations;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.recommendationEngine = new RecommendationEngine();
});

