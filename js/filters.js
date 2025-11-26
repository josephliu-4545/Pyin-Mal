/**
 * Filter and Sort System
 * Handles product filtering, sorting, and search functionality
 */

class FilterSystem {
  constructor() {
    this.activeFilters = {
      category: [],
      size: [],
      price: { min: 0, max: 10000 },
      color: [],
      brand: [],
      style: []
    };
    this.sortBy = 'default';
    this.products = [];
    this.init();
  }

  init() {
    // Load products (would come from API in real app)
    this.loadProducts();

    // Initialize filter handlers
    this.initFilterHandlers();

    // Initialize sort handler
    this.initSortHandler();

    // Initialize search handler
    this.initSearchHandler();

    // Apply initial filters
    this.applyFilters();
  }

  loadProducts() {
    // In a real app, this would fetch from an API
    // For now, we'll use data attributes from HTML
    const productElements = document.querySelectorAll('[data-product]');
    this.products = Array.from(productElements).map(el => ({
      id: el.dataset.productId,
      name: el.dataset.productName,
      category: el.dataset.productCategory,
      price: parseFloat(el.dataset.productPrice),
      size: el.dataset.productSize?.split(',') || [],
      color: el.dataset.productColor,
      brand: el.dataset.productBrand,
      style: el.dataset.productStyle,
      image: el.dataset.productImage,
      element: el
    }));
  }

  initFilterHandlers() {
    // Category filters
    const categoryFilters = document.querySelectorAll('[data-filter="category"]');
    categoryFilters.forEach(filter => {
      filter.addEventListener('change', (e) => {
        this.toggleFilter('category', e.target.value, e.target.checked);
      });
    });

    // Size filters
    const sizeFilters = document.querySelectorAll('[data-filter="size"]');
    sizeFilters.forEach(filter => {
      filter.addEventListener('change', (e) => {
        this.toggleFilter('size', e.target.value, e.target.checked);
      });
    });

    // Color filters
    const colorFilters = document.querySelectorAll('[data-filter="color"]');
    colorFilters.forEach(filter => {
      filter.addEventListener('change', (e) => {
        this.toggleFilter('color', e.target.value, e.target.checked);
      });
    });

    // Brand filters
    const brandFilters = document.querySelectorAll('[data-filter="brand"]');
    brandFilters.forEach(filter => {
      filter.addEventListener('change', (e) => {
        this.toggleFilter('brand', e.target.value, e.target.checked);
      });
    });

    // Price range filter
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin && priceMax) {
      priceMin.addEventListener('input', () => this.updatePriceRange());
      priceMax.addEventListener('input', () => this.updatePriceRange());
    }

    // Clear filters button
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => this.clearAllFilters());
    }
  }

  toggleFilter(type, value, checked) {
    if (checked) {
      if (!this.activeFilters[type].includes(value)) {
        this.activeFilters[type].push(value);
      }
    } else {
      this.activeFilters[type] = this.activeFilters[type].filter(v => v !== value);
    }
    this.applyFilters();
  }

  updatePriceRange() {
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin && priceMax) {
      this.activeFilters.price = {
        min: parseFloat(priceMin.value) || 0,
        max: parseFloat(priceMax.value) || 10000
      };
      this.applyFilters();
    }
  }

  clearAllFilters() {
    this.activeFilters = {
      category: [],
      size: [],
      price: { min: 0, max: 10000 },
      color: [],
      brand: [],
      style: []
    };

    // Reset all filter checkboxes
    document.querySelectorAll('[data-filter]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Reset price inputs
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';

    this.applyFilters();
  }

  initSortHandler() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.applyFilters();
      });
    }
  }

  initSearchHandler() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchProducts(e.target.value);
        }, 300);
      });
    }
  }

  searchProducts(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      this.applyFilters();
      return;
    }

    const filtered = this.products.filter(product => {
      return product.name.toLowerCase().includes(searchTerm) ||
             product.brand?.toLowerCase().includes(searchTerm) ||
             product.category?.toLowerCase().includes(searchTerm);
    });

    this.displayProducts(filtered);
  }

  applyFilters() {
    let filtered = [...this.products];

    // Apply category filter
    if (this.activeFilters.category.length > 0) {
      filtered = filtered.filter(p => 
        this.activeFilters.category.includes(p.category)
      );
    }

    // Apply size filter
    if (this.activeFilters.size.length > 0) {
      filtered = filtered.filter(p => 
        p.size.some(s => this.activeFilters.size.includes(s))
      );
    }

    // Apply color filter
    if (this.activeFilters.color.length > 0) {
      filtered = filtered.filter(p => 
        this.activeFilters.color.includes(p.color)
      );
    }

    // Apply brand filter
    if (this.activeFilters.brand.length > 0) {
      filtered = filtered.filter(p => 
        this.activeFilters.brand.includes(p.brand)
      );
    }

    // Apply price filter
    filtered = filtered.filter(p => 
      p.price >= this.activeFilters.price.min && 
      p.price <= this.activeFilters.price.max
    );

    // Apply sorting
    filtered = this.sortProducts(filtered);

    // Display results
    this.displayProducts(filtered);
    this.updateResultsCount(filtered.length);
  }

  sortProducts(products) {
    switch (this.sortBy) {
      case 'price-low':
        return products.sort((a, b) => a.price - b.price);
      case 'price-high':
        return products.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return products.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
        return products.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      case 'popular':
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return products;
    }
  }

  displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    // Hide all products first
    this.products.forEach(p => {
      if (p.element) {
        p.element.style.display = 'none';
      }
    });

    // Show filtered products
    products.forEach(product => {
      if (product.element) {
        product.element.style.display = 'block';
        // Add fade-in animation
        product.element.classList.add('animate-fade-in');
      }
    });

    // If no products found
    this.showNoResults(products.length === 0);
  }

  showNoResults(show) {
    let noResults = document.getElementById('no-results');
    if (show && !noResults) {
      noResults = document.createElement('div');
      noResults.id = 'no-results';
      noResults.className = 'col-span-full text-center py-12';
      noResults.innerHTML = `
        <div class="text-neutral-400 dark:text-neutral-600 text-lg mb-2">No products found</div>
        <div class="text-neutral-500 dark:text-neutral-500 text-sm">Try adjusting your filters</div>
      `;
      const container = document.getElementById('products-container');
      if (container) {
        container.appendChild(noResults);
      }
    } else if (!show && noResults) {
      noResults.remove();
    }
  }

  updateResultsCount(count) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
      countElement.textContent = `${count} product${count !== 1 ? 's' : ''} found`;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-container') || document.querySelector('[data-product]')) {
    window.filterSystem = new FilterSystem();
  }
});

