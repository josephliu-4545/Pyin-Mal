/**
 * Main JavaScript File
 * Handles theme toggle, core interactions, and initialization
 */

// Theme Management
class ThemeManager {
  constructor() {
    this.theme = this.getStoredTheme() || this.getSystemTheme();
    this.init();
  }

  getStoredTheme() {
    return localStorage.getItem('theme');
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    this.updateThemeIcon();
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    if (themeToggle && themeIcon) {
      if (this.theme === 'dark') {
        themeIcon.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        `;
      } else {
        themeIcon.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        `;
      }
    }
  }

  init() {
    // Set initial theme
    this.setTheme(this.theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Setup theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }
}

// Navigation Management
class NavigationManager {
  constructor() {
    this.dropdownSelectors = ['features', 'more'];
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupDropdowns();
    this.updateActiveNavLink();
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', String(isHidden));
        document.body.classList.toggle('overflow-hidden', isHidden);
      });
    }
  }

  setupDropdowns() {
    this.dropdownSelectors.forEach((key) => {
      const toggle = document.querySelector(`[data-dropdown-toggle="${key}-menu"]`);
      const menu = document.getElementById(`${key}-menu`);

      if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = menu.classList.contains('hidden');
          this.closeAllDropdowns();
          if (isOpen) {
            menu.classList.remove('hidden');
            menu.classList.add('animate-fade-in');
            toggle.setAttribute('aria-expanded', 'true');
          }
        });
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-dropdown]')) {
        this.closeAllDropdowns();
      }
    });
  }

  closeAllDropdowns() {
    this.dropdownSelectors.forEach((key) => {
      const menu = document.getElementById(`${key}-menu`);
      const toggle = document.querySelector(`[data-dropdown-toggle="${key}-menu"]`);
      if (menu && toggle) {
        menu.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  updateActiveNavLink() {
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const target = new URL(href, window.location.origin).pathname;
      const isHome = (target.endsWith('index.html') && (currentPath.endsWith('/') || currentPath.endsWith('index.html')));

      if (target === currentPath || isHome) {
        link.classList.add('nav-link-active');
      } else {
        link.classList.remove('nav-link-active');
      }
    });
  }
}

// Image Preview Handler
class ImagePreview {
  constructor() {
    this.init();
  }

  init() {
    // Product image hover preview
    const productImages = document.querySelectorAll('.product-card-image');
    productImages.forEach(img => {
      img.addEventListener('mouseenter', this.handleImageHover);
      img.addEventListener('mouseleave', this.handleImageLeave);
    });
  }

  handleImageHover(e) {
    // Add zoom effect or show additional images
    e.target.style.transform = 'scale(1.05)';
    e.target.style.transition = 'transform 0.3s ease';
  }

  handleImageLeave(e) {
    e.target.style.transform = 'scale(1)';
  }
}

// Smooth Scroll Handler
class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme manager
  window.themeManager = new ThemeManager();

  // Initialize navigation
  window.navigationManager = new NavigationManager();

  // Initialize image preview
  window.imagePreview = new ImagePreview();

  // Initialize smooth scroll
  window.smoothScroll = new SmoothScroll();

  // Add fade-in animation to page content
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.classList.add('animate-fade-in');
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, NavigationManager, ImagePreview, SmoothScroll };
}

