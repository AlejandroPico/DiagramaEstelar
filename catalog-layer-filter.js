'use strict';

(() => {
  const layerList = document.getElementById('catalogLayerList');
  if (!layerList || typeof sampleStars !== 'function' || typeof nearestStar !== 'function') return;

  const previousSampleStars = sampleStars;
  const previousNearestStar = nearestStar;
  const previousImport = ui.csv.onchange;

  state.catalogVisibility = state.catalogVisibility || {};
  let cacheSourceRef = null;
  let cacheVisibilityKey = '';
  let cacheFiltered = null;

  ui.csv.onchange = async function importAndBuildCatalogLayers(event) {
    const result = await previousImport(event);
    buildCatalogLayerControls();
    return result;
  };

  sampleStars = function sampleStarsWithCatalogFilter() {
    const original = state.stars;
    const visible = getVisibleStars();

    if (visible === original) {
      previousSampleStars();
      return;
    }

    state.stars = visible;
    try {
      previousSampleStars();
    } finally {
      state.stars = original;
    }
  };

  nearestStar = function nearestStarWithCatalogFilter(point, threshold) {
    const original = state.stars;
    const visible = getVisibleStars();

    if (visible === original) return previousNearestStar(point, threshold);

    state.stars = visible;
    try {
      return previousNearestStar(point, threshold);
    } finally {
      state.stars = original;
    }
  };

  window.__hrRefreshCatalogLayers = buildCatalogLayerControls;
  buildCatalogLayerControls();

  function buildCatalogLayerControls() {
    const groups = getCatalogGroups();

    if (!groups.length) {
      layerList.innerHTML = '<p class="hint compact">Carga catálogos reales para activar filtros por fuente.</p>';
      cacheSourceRef = null;
      cacheFiltered = null;
      return;
    }

    groups.forEach(group => {
      if (state.catalogVisibility[group.key] === undefined) state.catalogVisibility[group.key] = true;
    });

    layerList.innerHTML = groups.map(group => {
      const checked = state.catalogVisibility[group.key] !== false ? 'checked' : '';
      const count = group.count.toLocaleString('es-ES');
      return `<label class="switch-row catalog-switch" title="${escapeHtml(group.label)} · ${count} estrellas">
        <input type="checkbox" data-catalog-key="${escapeHtml(group.key)}" ${checked} />
        <span><strong>${escapeHtml(group.label)}</strong><small>${count} estrellas</small></span>
      </label>`;
    }).join('');

    layerList.querySelectorAll('input[data-catalog-key]').forEach(input => {
      input.onchange = () => {
        state.catalogVisibility[input.dataset.catalogKey] = input.checked;
        cacheSourceRef = null;
        cacheFiltered = null;
        const visibleCount = getVisibleStars().length;
        ui.status.textContent = `Capas activas: ${visibleCount.toLocaleString('es-ES')} estrellas visibles.`;
        draw();
      };
    });

    cacheSourceRef = null;
    cacheFiltered = null;
  }

  function getCatalogGroups() {
    const map = new Map();

    for (const star of state.stars || []) {
      if (!star || !Number.isFinite(star.teff) || !Number.isFinite(star.luminosity)) continue;
      const key = catalogKey(star);
      const label = catalogLabel(star);
      if (!key || isPedagogicalSource(key, label)) continue;
      const current = map.get(key) || { key, label, count: 0 };
      current.count++;
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
  }

  function getVisibleStars() {
    const stars = state.stars || [];
    const groups = getCatalogGroups();
    if (!groups.length) return stars;

    const allActive = groups.every(group => state.catalogVisibility[group.key] !== false);
    if (allActive) return stars;

    const visibilityKey = groups.map(group => `${group.key}:${state.catalogVisibility[group.key] !== false ? 1 : 0}`).join('|');
    if (cacheSourceRef === stars && cacheVisibilityKey === visibilityKey && cacheFiltered) return cacheFiltered;

    cacheSourceRef = stars;
    cacheVisibilityKey = visibilityKey;
    cacheFiltered = stars.filter(star => {
      const key = catalogKey(star);
      if (!key) return true;
      return state.catalogVisibility[key] !== false;
    });

    return cacheFiltered;
  }

  function catalogKey(star) {
    return normalizeCatalogName(star.source || star.catalog || star.dataset || '');
  }

  function catalogLabel(star) {
    const source = String(star.source || star.catalog || star.dataset || '').trim();
    if (!source) return 'Catálogo sin nombre';
    if (source === 'NASA Exoplanet Archive') return 'NASA Exoplanet Archive';
    if (source === 'HYG') return 'HYG v42';
    if (source === 'ATHYG/HYG-like') return 'ATHYG / HYG-like';
    if (source === 'Stellar Classification / Kaggle') return 'Clasificación estelar';
    if (source === 'Gaia-like') return 'Gaia-like';
    return source;
  }

  function normalizeCatalogName(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function isPedagogicalSource(key, label) {
    const value = `${key} ${label}`.toLowerCase();
    return value.includes('muestra') || value.includes('pedagogica') || value.includes('reserva-interna') || value.includes('dataset-local');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }
})();
