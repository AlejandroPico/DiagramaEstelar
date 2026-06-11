'use strict';

(() => {
  const originalFetch = window.fetch.bind(window);

  window.__HR_START_EMPTY__ = true;

  window.fetch = function emptyStartupFetch(input, init) {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : '';
    if (url.includes('data/stars.sample.json')) {
      return Promise.resolve(new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return originalFetch(input, init);
  };

  function applyEmptyScene(attempt = 0) {
    try {
      if (typeof state === 'undefined' || typeof draw !== 'function' || typeof fit !== 'function') {
        if (attempt < 80) window.setTimeout(() => applyEmptyScene(attempt + 1), 50);
        return;
      }

      state.stars = [];
      state.synthetic = [];
      state.selected = null;
      state.hovered = null;
      state.density = false;
      state.layers.stars = true;
      state.layers.synthetic = false;
      state.layers.regions = true;
      state.layers.labels = true;
      state.layers.grid = true;
      state.layers.animation = false;

      if (typeof ui !== 'undefined') {
        if (ui.toggles) {
          if (ui.toggles.stars) ui.toggles.stars.checked = true;
          if (ui.toggles.synthetic) ui.toggles.synthetic.checked = false;
          if (ui.toggles.regions) ui.toggles.regions.checked = true;
          if (ui.toggles.labels) ui.toggles.labels.checked = true;
          if (ui.toggles.grid) ui.toggles.grid.checked = true;
          if (ui.toggles.animation) ui.toggles.animation.checked = false;
        }
        if (ui.status) ui.status.textContent = 'Escenario vacío. Usa Datos para cargar catálogos del repositorio o importar CSV local.';
      }

      if (typeof hideCard === 'function') hideCard();
      fit();
      draw();

      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.add('hidden');
    } catch (error) {
      console.error('No se pudo aplicar el arranque vacío:', error);
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.add('hidden');
    }
  }

  window.addEventListener('DOMContentLoaded', () => applyEmptyScene());
  window.addEventListener('load', () => applyEmptyScene());
  window.setTimeout(() => applyEmptyScene(), 250);
  window.setTimeout(() => applyEmptyScene(), 1000);
})();
