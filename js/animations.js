/**
 * Animations Handler
 * Integrates AOS (Animate On Scroll) and custom animations
 */

class AnimationManager {
  constructor() {
    this.init();
  }

  init() {
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 600,
        easing: 'ease-out-cubic',
        once: true,
        offset: 100,
        delay: 0
      });
    }

    // Initialize custom animations
    this.initScrollAnimations();
    this.initHoverAnimations();
    this.initLoadingAnimations();
  }

  initScrollAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }

  initHoverAnimations() {
    // Add hover effects to product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  }

  initLoadingAnimations() {
    // Show loading spinner for async operations
    window.showLoading = (element) => {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.id = 'loading-spinner';
      if (element) {
        element.appendChild(spinner);
      } else {
        document.body.appendChild(spinner);
      }
    };

    window.hideLoading = () => {
      const spinner = document.getElementById('loading-spinner');
      if (spinner) {
        spinner.remove();
      }
    };
  }

  animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(start);
      }
    }, 16);
  }

  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      element.style.opacity = opacity;
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  fadeOut(element, duration = 300) {
    let start = null;
    const startOpacity = parseFloat(window.getComputedStyle(element).opacity);
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(startOpacity - (progress / duration), 0);
      element.style.opacity = opacity;
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    requestAnimationFrame(animate);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationManager = new AnimationManager();
});

