/**
 * post-canvas.js
 * ──────────────────────────────────────────────────────────────────
 * Canvas renderer universal para páginas de post individuales.
 * Lee data-src de cada canvas y renderiza la imagen con transformaciones
 * imperceptibles para cambiar el hash criptográfico (anti-DMCA).
 * ──────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /**
   * Genera un valor de rotación único por canvas basado en su ID
   * para que cada instancia de la misma imagen tenga un hash diferente.
   */
  function getUniqueRotation(canvasId) {
    let hash = 0;
    for (let i = 0; i < canvasId.length; i++) {
      hash = (hash << 5) - hash + canvasId.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 30) / 100; // Entre 0.00° y 0.29°
  }

  /**
   * Genera un offset de brillo único por canvas
   */
  function getUniqueBrightness(canvasId) {
    let hash = 0;
    for (let i = 0; i < canvasId.length; i++) {
      hash = (hash << 3) + canvasId.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 3) + 1; // Entre 1% y 3%
  }

  /**
   * Renderiza una imagen en un canvas con transformaciones anti-hash.
   */
  function renderCanvas(canvas) {
    const src = canvas.dataset.src;
    if (!src) return;

    const ctx = canvas.getContext('2d');
    const wrapper = canvas.closest('.post-canvas-wrap, .post-hero-image');
    const w = wrapper ? wrapper.offsetWidth : 800;
    
    // Para hero images, mantener aspect ratio máximo de 480px
    const isHero = canvas.classList.contains('post-hero-canvas');
    let h;
    if (isHero) {
      h = Math.min(Math.round(w * 0.56), 480); // 16:9 capped at 480px
    } else {
      h = Math.round(w * 0.72); // ~4:3 para imágenes de contenido
    }

    canvas.width  = w;
    canvas.height = h;

    const img = new Image();
    img.onload = function () {
      const id     = canvas.id;
      const rotate = getUniqueRotation(id);
      const bright = getUniqueBrightness(id);

      ctx.save();

      // Aplicar brillo imperceptible
      ctx.filter = `brightness(${100 + bright}%) contrast(${100 + (bright * 0.3)}%)`;

      // Aplicar rotación sub-grado imperceptible
      const cx = w / 2, cy = h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      // Escalar ligeramente para evitar bordes en blanco por la rotación
      const scale = 1 + Math.abs(Math.sin((rotate * Math.PI) / 180)) * 0.02;
      ctx.scale(scale, scale);
      ctx.translate(-(cx * (scale - 1)) / scale, -(cy * (scale - 1)) / scale);

      // Dibujar imagen
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Ruido sub-píxel — cambia el hash criptográfico sin afectar visualmente
      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const seed = id.length + id.charCodeAt(0);
        for (let i = 0; i < data.length; i += (200 + seed % 150)) {
          // Alterna el bit menos significativo — invisible al ojo humano
          data[i]     = (data[i]     & 0xFE) | ((i + seed) % 2);
          data[i + 1] = (data[i + 1] & 0xFE) | ((i + seed + 1) % 2);
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        // CORS puede bloquear getImageData — el canvas sigue siendo válido
      }

      // Fade in suave
      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.5s ease';
      requestAnimationFrame(() => { canvas.style.opacity = '1'; });
    };

    img.onerror = function () {
      renderPlaceholder(canvas, ctx, w, h, src);
    };

    img.src = src;
  }

  /**
   * Placeholder visual cuando la imagen no está disponible.
   */
  function renderPlaceholder(canvas, ctx, w, h, src) {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1c2130');
    gradient.addColorStop(1, '#111318');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Grid pattern
    ctx.strokeStyle = 'rgba(42, 48, 64, 0.6)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(230, 57, 70, 0.4)';
    ctx.font = `bold ${Math.round(w * 0.06)}px Inter, sans-serif`;
    ctx.fillText('⚠', w / 2, h / 2 - 28);

    ctx.fillStyle = '#525d70';
    ctx.font = `${Math.round(w * 0.035)}px Inter, sans-serif`;
    ctx.fillText('EVIDENCIA FOTOGRÁFICA', w / 2, h / 2 + 8);

    ctx.fillStyle = '#3a4455';
    ctx.font = `${Math.round(w * 0.028)}px Inter, sans-serif`;
    ctx.fillText('Jean Paul Ramírez Rico', w / 2, h / 2 + 36);
  }

  /**
   * Inicializa todos los canvas en la página.
   */
  function initAllCanvases() {
    // Hero canvas
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
      renderCanvas(heroCanvas);
    }

    // Canvases de contenido con data-src
    const contentCanvases = document.querySelectorAll('canvas[data-src]');
    contentCanvases.forEach(canvas => {
      if (canvas.id !== 'hero-canvas') {
        renderCanvas(canvas);
      }
    });
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllCanvases);
  } else {
    initAllCanvases();
  }

  // Re-renderizar en resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initAllCanvases, 250);
  }, { passive: true });

})();
