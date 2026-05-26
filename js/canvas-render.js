/**
 * canvas-render.js
 * ──────────────────────────────────────────────────────────────────
 * Renderiza imágenes vía HTML5 Canvas API en lugar de <img> tags.
 * ESTRATEGIA ANTI-DMCA: los bots básicos no ejecutan JS, por lo que
 * para ellos no existe ninguna <img src> en el DOM.
 * Google Googlebot SÍ ejecuta JS → indexa la imagen correctamente.
 * ──────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  function renderImageToCanvas(canvas, src, options) {
    options = options || {};
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
      const targetW = options.width  || (canvas.parentElement ? canvas.parentElement.offsetWidth : 400) || 400;
      const targetH = options.height || Math.round(targetW * 0.75);

      canvas.width  = targetW;
      canvas.height = targetH;

      ctx.save();
      if (options.brightnessShift) {
        ctx.filter = 'brightness(' + (100 + options.brightnessShift) + '%)';
      }
      if (options.rotate) {
        var cx = targetW / 2, cy = targetH / 2;
        ctx.translate(cx, cy);
        ctx.rotate((options.rotate * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      ctx.restore();

      // Ruido sub-píxel invisible — cambia el hash criptográfico
      if (options.addNoise) {
        try {
          var imageData = ctx.getImageData(0, 0, targetW, targetH);
          var data = imageData.data;
          for (var i = 0; i < data.length; i += 400) {
            data[i] = (data[i] & 0xFE) | (i % 2);
          }
          ctx.putImageData(imageData, 0, 0);
        } catch(e) { /* CORS — canvas sigue válido */ }
      }

      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.5s ease';
      requestAnimationFrame(function() { canvas.style.opacity = '1'; });
    };

    img.onerror = function () {
      renderPlaceholder(canvas, options);
    };

    img.src = src;
  }

  function renderPlaceholder(canvas, options) {
    options = options || {};
    var w = options.width  || (canvas.parentElement ? canvas.parentElement.offsetWidth : 400) || 400;
    var h = options.height || Math.round(w * 0.75);
    canvas.width  = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1c2130');
    gradient.addColorStop(1, '#111318');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a3040';
    ctx.font = 'bold ' + Math.round(w * 0.08) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠', w / 2, h / 2 - 20);
    ctx.fillStyle = '#525d70';
    ctx.font = Math.round(w * 0.04) + 'px sans-serif';
    ctx.fillText('EVIDENCIA FOTOGRÁFICA', w / 2, h / 2 + 20);
    ctx.fillText('Jean Paul Ramírez Rico', w / 2, h / 2 + 45);
  }

  function initCanvases() {
    // ── Canvas principal del hero (foto principal del estafador) ──
    var heroCanvas = document.getElementById('evidence-canvas-main');
    if (heroCanvas) {
      var wrapper = heroCanvas.closest('.photo-frame');
      var w = wrapper ? wrapper.offsetWidth : 380;
      var src = heroCanvas.dataset.src || 'jean-paul-ramirez-rico.jpg';
      renderImageToCanvas(heroCanvas, src, {
        rotate: 0.1, brightnessShift: 1, addNoise: true,
        width: w, height: Math.round(w * 0.75),
      });
    }

    // ── Escudo de la Policía Nacional de Colombia ──
    var shieldCanvas = document.getElementById('canvas-escudo');
    if (shieldCanvas) {
      var shieldCtx = shieldCanvas.getContext('2d');
      shieldCanvas.width  = 90;
      shieldCanvas.height = 90;
      var shieldImg = new Image();
      shieldImg.onload = function() {
        shieldCtx.drawImage(shieldImg, 0, 0, 90, 90);
        shieldCanvas.style.opacity = '1';
      };
      shieldImg.onerror = function() {
        // Si falla por el acento, intentar encode
        var shieldImg2 = new Image();
        shieldImg2.onload = function() {
          shieldCtx.drawImage(shieldImg2, 0, 0, 90, 90);
        };
        shieldImg2.src = 'Escudo_Polic%C3%ADa_Nacional_de_Colombia.png';
      };
      // Usar el nombre real del archivo (el servidor lo sirve correctamente)
      shieldImg.src = 'Escudo_Polic\u00eda_Nacional_de_Colombia.png';
    }

    // ── Galería completa — todas las fotos reales de la raíz ──
    var galleryDefs = [
      { id: 'canvas-01', src: 'jean-paul-ramirez-rico.jpg',        rotate: 0.10 },
      { id: 'canvas-02', src: 'jeanpaulramirezrico.jpg',           rotate: 0.18 },
      { id: 'canvas-03', src: 'jean-paul-ramirez-rico-medellin.jpg', rotate: 0.13 },
      { id: 'canvas-04', src: 'robert-jesus-ramirez-rico.jpg',     rotate: 0.20 },
      { id: 'canvas-05', src: 'robert-jesus-ramirez-rico-cedula.jpg', rotate: 0.07 },
      { id: 'canvas-06', src: 'robert-jesus-ramirez-rico-cedula1.jpg', rotate: 0.22 },
      { id: 'canvas-07', src: "erika-silva-\u00b4pasaporte.jpg",   rotate: 0.15 },
      { id: 'canvas-08', src: 'jade-ramirez-pasaporte.jpg',        rotate: 0.11 },
    ];

    galleryDefs.forEach(function(def) {
      var canvas = document.getElementById(def.id);
      if (!canvas) return;
      var wrap = canvas.closest('.canvas-wrapper');
      var w = wrap ? wrap.offsetWidth : 300;
      renderImageToCanvas(canvas, def.src, {
        rotate: def.rotate, brightnessShift: 1, addNoise: true,
        width: w, height: Math.round(w * 0.75),
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvases);
  } else {
    initCanvases();
  }

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initCanvases, 200);
  });

})();
