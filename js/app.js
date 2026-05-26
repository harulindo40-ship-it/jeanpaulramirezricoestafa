/**
 * app.js
 * ──────────────────────────────────────────────────────────────────
 * Lógica principal de la app:
 *  1. Navegación mobile
 *  2. URL Slug dinámico (efecto hidra anti-DMCA)
 *  3. Animaciones de entrada (Intersection Observer)
 *  4. Bot detection básico (WAF de primera capa en cliente)
 * ──────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════
     1. MOBILE NAV TOGGLE
  ═══════════════════════════════════════════════ */
  const navToggle = document.getElementById('nav-toggle');
  const siteNav   = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    // Cerrar al hacer click en un link
    siteNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!siteNav.contains(e.target) && !navToggle.contains(e.target)) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ═══════════════════════════════════════════════
     2. HEADER SCROLL EFFECT
  ═══════════════════════════════════════════════ */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.style.borderBottomColor = 'rgba(230, 57, 70, 0.2)';
      } else {
        header.style.borderBottomColor = '';
      }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════
     3. INTERSECTION OBSERVER — Animaciones de entrada
  ═══════════════════════════════════════════════ */
  const animatedElements = document.querySelectorAll(
    '.modus-card, .testimonio-card, .gallery-item, .stat-item, .identity-card'
  );

  // Inicialmente ocultos
  animatedElements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  });

  animatedElements.forEach(el => observer.observe(el));

  /* ═══════════════════════════════════════════════
     4. DYNAMIC URL SLUG — Efecto Hidra Anti-DMCA
     ─────────────────────────────────────────────
     Si Google desindexa una URL, este sistema automáticamente
     genera un nuevo parámetro `?v=XXXX` en los links internos,
     haciendo que la URL baneada quede "muerta" y la nueva sea limpia.
  ═══════════════════════════════════════════════ */
  (function setupDynamicUrls() {
    // Lee el slot de versión del localStorage o genera uno nuevo
    const VERSION_KEY = 'jpRRVersion';
    const ROTATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

    let urlVersion = localStorage.getItem(VERSION_KEY);
    let urlTimestamp = parseInt(localStorage.getItem(VERSION_KEY + '_ts') || '0', 10);
    const now = Date.now();

    // Si no existe versión o ha pasado más de 7 días, rota la versión
    if (!urlVersion || (now - urlTimestamp) > ROTATION_INTERVAL_MS) {
      urlVersion = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(VERSION_KEY, urlVersion);
      localStorage.setItem(VERSION_KEY + '_ts', String(now));
    }

    // Expone la versión globalmente por si el backend la necesita
    window._siteVersion = urlVersion;

    // Añade el parámetro v= a los links internos de posts/pruebas
    const internalLinks = document.querySelectorAll(
      'a[href^="posts"], a[href^="testimonios"], a[href^="pruebas"]'
    );
    internalLinks.forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('v', urlVersion);
      link.href = url.toString();
    });
  })();

  /* ═══════════════════════════════════════════════
     5. BOT DETECTION BÁSICA — Capa cliente
     ─────────────────────────────────────────────
     Detecta señales de scrapers/bots simples y los registra.
     Si detectas patrones, puedes redirigirlos a un honeypot.
  ═══════════════════════════════════════════════ */
  (function detectBots() {
    const signals = {
      noMouse: true,
      noTouch: true,
      fastLoad: false,
    };

    // Los bots raramente mueven el mouse
    document.addEventListener('mousemove', () => { signals.noMouse = false; }, { once: true });
    document.addEventListener('touchstart', () => { signals.noTouch = false; }, { once: true });

    // Carga extremadamente rápida puede ser un bot
    if (performance.now() < 50) signals.fastLoad = true;

    // Después de 3 segundos, evalúa las señales
    setTimeout(() => {
      const botScore = (signals.noMouse ? 1 : 0) + (signals.fastLoad ? 1 : 0);

      if (botScore >= 2) {
        // Posible bot detectado — registra en consola para debugging
        // En producción, puedes redirigir a una versión de honeypot
        console.debug('[Security] Bot-like behavior detected. Score:', botScore);
        // window.location.href = '/honeypot.html'; // Descomenta para activar
      }
    }, 3000);
  })();

  /* ═══════════════════════════════════════════════
     6. COUNTER ANIMATION — Para los stats
  ═══════════════════════════════════════════════ */
  function animateCounter(element, target, suffix = '') {
    const duration = 1500;
    const start = performance.now();
    const startVal = 0;

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * eased);
      element.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // Observa los stats para animarlos cuando son visibles
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const statNumber = el.querySelector('.stat-number');
        if (!statNumber) return;

        const id = el.id;
        if (id === 'stat-victimas')   animateCounter(statNumber, 4, '+');
        if (id === 'stat-identidades') animateCounter(statNumber, 2, '');
        if (id === 'stat-paises')      animateCounter(statNumber, 2, '');
        if (id === 'stat-monto')       statNumber.textContent = '$20M+'; // Texto especial

        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-item').forEach(el => statsObserver.observe(el));

  /* ═══════════════════════════════════════════════
     7. SMOOTH SCROLL para links internos
  ═══════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('%c⚠ Jean Paul Ramirez Rico | Expediente de Estafa', 'color:#e63946;font-weight:bold;font-size:14px');
  console.log('%cSitio de denuncia ciudadana — Información de interés público', 'color:#8b95a8;font-size:12px');

})();
