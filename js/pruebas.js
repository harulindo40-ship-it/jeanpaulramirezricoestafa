/**
 * pruebas.js — Canvas render específico para la página de pruebas
 * 4 imágenes en la galería con transformaciones únicas por canvas
 */
(function () {
  'use strict';

  const pruebasCanvases = [
    { id: 'prueba-canvas-01', src: 'assets/evidencia-01.webp', rotate: 0.12, brightness: 1 },
    { id: 'prueba-canvas-02', src: 'assets/evidencia-02.webp', rotate: 0.08, brightness: 2 },
    { id: 'prueba-canvas-03', src: 'assets/evidencia-03.webp', rotate: 0.15, brightness: 1 },
    { id: 'prueba-canvas-04', src: 'assets/evidencia-04.webp', rotate: 0.10, brightness: 2 },
  ];

  function renderPruebaCanvas(canvasId, src, rotate, brightness) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const wrapper = canvas.closest('.prueba-canvas-wrap');
    const w = wrapper ? wrapper.offsetWidth : 600;
    const h = Math.round(w * 0.75);

    canvas.width = w;
    canvas.height = h;

    const img = new Image();
    img.onload = function () {
      ctx.save();
      ctx.filter = `brightness(${100 + brightness}%)`;
      const cx = w / 2, cy = h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Ruido sub-píxel para cambiar hash
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 300 + (canvasId.charCodeAt(canvasId.length - 1) % 100)) {
        data[i] = (data[i] & 0xFE) | ((i + canvasId.length) % 2);
      }
      ctx.putImageData(imgData, 0, 0);

      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.6s ease';
      requestAnimationFrame(() => { canvas.style.opacity = '1'; });
    };
    img.onerror = function () {
      // Placeholder
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#1c2130');
      gradient.addColorStop(1, '#111318');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a3040';
      ctx.font = `bold ${Math.round(w * 0.07)}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠ EVIDENCIA', w / 2, h / 2 - 16);
      ctx.fillStyle = '#525d70';
      ctx.font = `${Math.round(w * 0.035)}px Inter`;
      ctx.fillText('Jean Paul Ramírez Rico', w / 2, h / 2 + 20);
    };
    img.src = src;
  }

  function initPruebasCanvases() {
    pruebasCanvases.forEach(({ id, src, rotate, brightness }) => {
      renderPruebaCanvas(id, src, rotate, brightness);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPruebasCanvases);
  } else {
    initPruebasCanvases();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initPruebasCanvases, 200);
  });
})();
