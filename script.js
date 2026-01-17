(function () {
  'use strict';

  if (window.__app) return;
  window.__app = {};

  const STATE = {
    menuOpen: false,
    formsInitialized: false,
    burgerInitialized: false,
    scrollSpyInitialized: false,
    countUpInitialized: false,
    privacyModalInitialized: false,
    currentSection: null
  };

  const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[\(]?[0-9]{1,4}[\)]?[\-\s\.]?[\(]?[0-9]{1,4}[\)]?[\-\s\.]?[0-9]{1,9}$/,
    name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/
  };

  function debounce(fn, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(context, args), wait);
    };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return function () {
      const context = this;
      const args = arguments;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  function notify(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:320px;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 5000);
  }

  function initBurgerMenu() {
    if (STATE.burgerInitialized) return;
    STATE.burgerInitialized = true;

    const toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    const nav = document.querySelector('.c-nav#main-nav, .navbar-collapse');
    const body = document.body;

    if (!toggle || !nav) return;

    const closeMenu = () => {
      if (!STATE.menuOpen) return;
      STATE.menuOpen = false;
      nav.classList.remove('show', 'is-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    };

    const openMenu = () => {
      if (STATE.menuOpen) return;
      STATE.menuOpen = true;
      nav.classList.add('show', 'is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
    };

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      STATE.menuOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('click', (e) => {
      if (STATE.menuOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && STATE.menuOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    const links = nav.querySelectorAll('.nav-link, .c-nav__link');
    links.forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    const handleResize = debounce(() => {
      if (window.innerWidth >= 1024 && STATE.menuOpen) {
        closeMenu();
      }
    }, 200);

    window.addEventListener('resize', handleResize);
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;
        const targetId = href.replace(/^#/?/, '');
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          const header = document.querySelector('.l-header');
          const offset = header ? header.offsetHeight : 80;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      });
    });
  }

  function initScrollSpy() {
    if (STATE.scrollSpyInitialized) return;
    STATE.scrollSpyInitialized = true;

    const sections = document.querySelectorAll('section[id], div[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"], .c-nav__link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            STATE.currentSection = entry.target.id;
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              if (href === '#' + STATE.currentSection) {
                link.classList.add('active', 'is-active');
                link.setAttribute('aria-current', 'page');
              } else {
                link.classList.remove('active', 'is-active');
                link.removeAttribute('aria-current');
              }
            });
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initActiveMenuState() {
    const currentPath = window.location.pathname;
    const isHomepage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/');
    const links = document.querySelectorAll('.c-nav__link, .nav-link');

    links.forEach((link) => {
      link.removeAttribute('aria-current');
      link.classList.remove('active');
      let linkPath = link.getAttribute('href');
      if (!linkPath) return;
      linkPath = linkPath.split('#')[0];
      if (linkPath === '/' || linkPath === '/index.html') {
        if (isHomepage) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('active');
        }
      } else if (currentPath === linkPath || currentPath.endsWith(linkPath)) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    });
  }

  function initForms() {
    if (STATE.formsInitialized) return;
    STATE.formsInitialized = true;

    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach((form) => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let isValid = true;
        const errors = [];

        const nameField = form.querySelector('#callback-name, #ticket-name');
        const emailField = form.querySelector('#callback-email, #ticket-email');
        const phoneField = form.querySelector('#callback-phone');
        const messageField = form.querySelector('#ticket-message');
        const subjectField = form.querySelector('#ticket-subject');
        const privacyField = form.querySelector('#callback-privacy, #ticket-privacy');

        const clearError = (field) => {
          if (!field) return;
          field.classList.remove('has-error');
          const errorEl = field.parentElement.querySelector('.c-form__error');
          if (errorEl) errorEl.textContent = '';
        };

        const setError = (field, message) => {
          if (!field) return;
          field.classList.add('has-error');
          let errorEl = field.parentElement.querySelector('.c-form__error');
          if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'c-form__error';
            field.parentElement.appendChild(errorEl);
          }
          errorEl.textContent = message;
          isValid = false;
          errors.push(message);
        };

        clearError(nameField);
        clearError(emailField);
        clearError(phoneField);
        clearError(messageField);
        clearError(subjectField);

        if (nameField && !nameField.value.trim()) {
          setError(nameField, 'Name is required');
        } else if (nameField && !PATTERNS.name.test(nameField.value.trim())) {
          setError(nameField, 'Please enter a valid name');
        }

        if (emailField && !emailField.value.trim()) {
          setError(emailField, 'Email is required');
        } else if (emailField && !PATTERNS.email.test(emailField.value.trim())) {
          setError(emailField, 'Please enter a valid email address');
        }

        if (phoneField && phoneField.value.trim() && !PATTERNS.phone.test(phoneField.value.trim())) {
          setError(phoneField, 'Please enter a valid phone number');
        }

        if (messageField && messageField.value.trim().length < 10) {
          setError(messageField, 'Message must be at least 10 characters');
        }

        if (subjectField && !subjectField.value.trim()) {
          setError(subjectField, 'Subject is required');
        }

        if (privacyField && !privacyField.checked) {
          notify('You must accept the privacy policy', 'warning');
          isValid = false;
        }

        if (!isValid) {
          form.classList.add('was-validated');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
        }

        setTimeout(() => {
          const formData = new FormData(form);
          const data = {};
          formData.forEach((value, key) => {
            data[key] = value;
          });

          fetch('process.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.success) {
                notify('Your message has been sent successfully!', 'success');
                setTimeout(() => {
                  window.location.href = 'thank_you.html';
                }, 1500);
              } else {
                notify('There was an error sending your message. Please try again.', 'danger');
              }
            })
            .catch(() => {
              notify('Connection error. Please try again later.', 'danger');
            })
            .finally(() => {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
              }
            });
        }, 800);
      });
    });
  }

  function initCountUp() {
    if (STATE.countUpInitialized) return;
    STATE.countUpInitialized = true;

    const counters = document.querySelectorAll('.c-stat-card__number');
    if (counters.length === 0) return;

    counters.forEach((counter) => {
      const target = parseInt(counter.textContent.replace(/D/g, ''), 10);
      if (isNaN(target)) return;

      counter.textContent = '0';
      let current = 0;
      const increment = target / 60;
      const duration = 1500;
      const interval = duration / 60;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target;
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current);
        }
      }, interval);
    });
  }

  function initScrollToTop() {
    const scrollBtn = document.getElementById('scroll-to-top');
    if (!scrollBtn) return;

    const toggleVisibility = throttle(() => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('is-visible');
      } else {
        scrollBtn.classList.remove('is-visible');
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility);

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initPrivacyModal() {
    if (STATE.privacyModalInitialized) return;
    STATE.privacyModalInitialized = true;

    const privacyLinks = document.querySelectorAll('a[href*="privacy"], a[href*="Privacy"]');
    privacyLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && (href.includes('privacy.html') || href.includes('Privacy'))) {
          return;
        }
      });
    });
  }

  function initImages() {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }
      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }
      img.addEventListener(
        'error',
        function () {
          const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="18" font-family="sans-serif">Image not available</text></svg>';
          this.src = 'data:image/svg+xml;base64,' + btoa(svg);
        },
        { once: true }
      );
    });
  }

  function initAccordion() {
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const targetId = this.getAttribute('data-bs-target') || this.getAttribute('aria-controls');
        if (!targetId) return;
        const target = document.querySelector(targetId.startsWith('#') ? targetId : '#' + targetId);
        if (!target) return;
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        if (isExpanded) {
          target.classList.remove('show');
        } else {
          target.classList.add('show');
        }
      });
    });
  }

  __app.init = function () {
    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenuState();
    initForms();
    initCountUp();
    initScrollToTop();
    initPrivacyModal();
    initImages();
    initAccordion();
  };

  __app.notify = notify;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __app.init);
  } else {
    __app.init();
  }
})();
