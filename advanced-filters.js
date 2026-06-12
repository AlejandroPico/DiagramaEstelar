'use strict';

(() => {
  const popover = document.getElementById('filtersPopover');
  if (!popover || typeof sampleStars !== 'function' || typeof nearestStar !== 'function') return;

  const previousSampleStars = sampleStars;
  const previousNearestStar = nearestStar;
  const previousRunSearch = typeof runSearch === 'function' ? runSearch : null;

  const FILTERS = [
    { key: 'teff', label: 'Temperatura efectiva', unit: 'K', scale: 'linear', getter: star => number(star.teff), format: v => `${Math.round(v).toLocaleString('es-ES')} K` },
    { key: 'luminosity', label: 'Luminosidad', unit: 'L☉', scale: 'log', getter: star => positive(star.luminosity), format: v => `${formatSmall(v)} L☉` },
    { key: 'absMag', label: 'Magnitud absoluta aproximada', unit: 'mag', scale: 'linear', getter: star => absMag(star), format: v => `${num(v, 2)} mag` },
    { key: 'radius', label: 'Radio', unit: 'R☉', scale: 'log', getter: star => positive(star.radius ?? rawNumber(star, ['st_rad','radius_r_ro','radius'])), format: v => `${formatSmall(v)} R☉` },
    { key: 'mass', label: 'Masa', unit: 'M☉', scale: 'log', getter: star => positive(star.mass ?? rawNumber(star, ['st_mass','mass'])), format: v => `${formatSmall(v)} M☉` },
    { key: 'distance', label: 'Distancia', unit: 'años luz', scale: 'log', getter: star => positive(star.distance_ly ?? distanceLy(star)), format: v => `${formatSmall(v)} a.l.` },
    { key: 'planets', label: 'Planetas conocidos', unit: '', scale: 'linear', getter: star => number(star.planetCount ?? rawNumber(star, ['sy_pnum','planetCount'])), format: v => `${Math.round(v).toLocaleString('es-ES')}` },
    { key: 'bv', label: 'Color B−V', unit: '', scale: 'linear', getter: star => number(rawNumber(star, ['ci','bp_rp','b_v'])), format: v => num(v, 2) }
  ];

  const SPECTRAL = ['O','B','A','F','G','K','M','L','T','Y','W'];

  state.advancedFilters = state.advancedFilters || {
    ranges: {},
    spectral: Object.fromEntries(SPECTRAL.map(key => [key, true]))
  };

  let cacheSource = null;
  let cacheKey = '';
  let cacheResult = null;

  buildPanel();
  installFilterWrappers();
  window.__hrRefreshAdvancedFilters = () => { invalidate(); buildPanel(); draw(); };

  function installFilterWrappers() {
    sampleStars = function sampleStarsWithAdvancedFilters() {
      const original = state.stars;
      const visible = getFilteredStars();
      if (visible === original) {
        previousSampleStars();
        return;
      }
      state.stars = visible;
      try { previousSampleStars(); } finally { state.stars = original; }
    };

    nearestStar = function nearestStarWithAdvancedFilters(point, threshold) {
      const original = state.stars;
      const visible = getFilteredStars();
      if (visible === original) return previousNearestStar(point, threshold);
      state.stars = visible;
      try { return previousNearestStar(point, threshold); } finally { state.stars = original; }
    };

    window.__HR_GET_FILTERED_STARS__ = getFilteredStars;
  }

  function buildPanel() {
    const stats = collectFilterStats(state.stars || []);
    const visible = getFilteredStars();
    const total = (state.stars || []).length;

    popover.innerHTML = `<section class="panel-section filter-head">
      <div>
        <h3>Filtros científicos</h3>
        <p>Acota el catálogo visible por rangos físicos. Cada barra tiene dos extremos: mínimo y máximo.</p>
      </div>
      <button id="resetAdvancedFilters" class="filter-reset" type="button">Limpiar</button>
    </section>
    <div class="filter-summary">
      <span class="filter-pill">${visible.length.toLocaleString('es-ES')} visibles</span>
      <span class="filter-pill">${total.toLocaleString('es-ES')} cargadas</span>
      <span class="filter-pill">${activeFilterCount()} filtros activos</span>
    </div>
    <section class="filter-list">
      ${FILTERS.map(filter => renderRangeFilter(filter, stats[filter.key])).join('')}
      ${renderSpectralFilter()}
    </section>`;

    popover.querySelector('#resetAdvancedFilters').onclick = () => {
      state.advancedFilters.ranges = {};
      state.advancedFilters.spectral = Object.fromEntries(SPECTRAL.map(key => [key, true]));
      invalidate();
      buildPanel();
      updateStatus();
      draw();
    };

    popover.querySelectorAll('[data-filter-min],[data-filter-max]').forEach(input => {
      input.addEventListener('input', () => handleRangeInput(input));
    });

    popover.querySelectorAll('[data-spectral-filter]').forEach(input => {
      input.addEventListener('change', () => {
        state.advancedFilters.spectral[input.dataset.spectralFilter] = input.checked;
        invalidate();
        buildPanel();
        updateStatus();
        draw();
      });
    });
  }

  function renderRangeFilter(filter, stat) {
    if (!stat || !Number.isFinite(stat.min) || !Number.isFinite(stat.max) || stat.min === stat.max) {
      return `<article class="filter-card"><header><h4>${escapeHtml(filter.label)}</h4></header><p class="filter-empty-note">No hay suficientes datos en el catálogo cargado para filtrar por este campo.</p></article>`;
    }

    const encoded = encodeRange(filter, stat);
    const current = state.advancedFilters.ranges[filter.key] || { min: stat.min, max: stat.max };
    const minEncoded = encodeValue(filter, clamp(current.min, stat.min, stat.max));
    const maxEncoded = encodeValue(filter, clamp(current.max, stat.min, stat.max));
    const fillLeft = ((Math.min(minEncoded, maxEncoded) - encoded.min) / (encoded.max - encoded.min)) * 100;
    const fillRight = ((Math.max(minEncoded, maxEncoded) - encoded.min) / (encoded.max - encoded.min)) * 100;

    return `<article class="filter-card" data-filter-card="${filter.key}">
      <header>
        <h4>${escapeHtml(filter.label)}</h4>
        <span class="filter-range-readout">${filter.format(current.min)} — ${filter.format(current.max)}</span>
      </header>
      <div class="dual-range">
        <div class="dual-range-track"><div class="dual-range-fill" style="left:${fillLeft}%;right:${100 - fillRight}%"></div></div>
        <input type="range" min="${encoded.min}" max="${encoded.max}" step="${encoded.step}" value="${minEncoded}" data-filter-min="${filter.key}" aria-label="Mínimo ${escapeHtml(filter.label)}" />
        <input type="range" min="${encoded.min}" max="${encoded.max}" step="${encoded.step}" value="${maxEncoded}" data-filter-max="${filter.key}" aria-label="Máximo ${escapeHtml(filter.label)}" />
      </div>
      <div class="filter-scale-labels"><span>${filter.format(stat.min)}</span><span>${filter.format(stat.max)}</span></div>
    </article>`;
  }

  function renderSpectralFilter() {
    const selected = state.advancedFilters.spectral || {};
    return `<article class="filter-card">
      <header><h4>Tipo espectral</h4><span class="filter-range-readout">Clases visibles</span></header>
      <div class="filter-check-grid">
        ${SPECTRAL.map(type => `<label class="filter-check"><input type="checkbox" data-spectral-filter="${type}" ${selected[type] !== false ? 'checked' : ''}/> ${type}</label>`).join('')}
      </div>
    </article>`;
  }

  function handleRangeInput(input) {
    const key = input.dataset.filterMin || input.dataset.filterMax;
    const filter = FILTERS.find(item => item.key === key);
    const stat = collectFilterStats(state.stars || [])[key];
    if (!filter || !stat) return;
    const card = input.closest('[data-filter-card]');
    const minInput = card.querySelector('[data-filter-min]');
    const maxInput = card.querySelector('[data-filter-max]');
    let a = Number(minInput.value);
    let b = Number(maxInput.value);
    if (a > b) {
      if (input === minInput) b = a;
      else a = b;
    }
    minInput.value = a;
    maxInput.value = b;
    const min = decodeValue(filter, a);
    const max = decodeValue(filter, b);
    state.advancedFilters.ranges[key] = { min, max };
    invalidate();
    buildPanel();
    updateStatus();
    draw();
  }

  function getFilteredStars() {
    const stars = state.stars || [];
    const key = filterSignature(stars);
    if (cacheSource === stars && cacheKey === key && cacheResult) return cacheResult;
    if (!hasActiveFilters(stars)) return stars;

    const stats = collectFilterStats(stars);
    const spectral = state.advancedFilters.spectral || {};
    cacheSource = stars;
    cacheKey = key;
    cacheResult = stars.filter(star => {
      for (const filter of FILTERS) {
        const stat = stats[filter.key];
        const range = state.advancedFilters.ranges[filter.key];
        if (!stat || !range) continue;
        const value = filter.getter(star);
        if (!Number.isFinite(value)) return false;
        if (value < range.min || value > range.max) return false;
      }
      const letter = spectralLetter(star);
      if (letter && spectral[letter] === false) return false;
      return true;
    });
    return cacheResult;
  }

  function hasActiveFilters(stars) {
    const stats = collectFilterStats(stars);
    const rangeActive = Object.entries(state.advancedFilters.ranges || {}).some(([key, range]) => {
      const stat = stats[key];
      if (!stat || !range) return false;
      return range.min > stat.min || range.max < stat.max;
    });
    const spectral = state.advancedFilters.spectral || {};
    const spectralActive = SPECTRAL.some(type => spectral[type] === false);
    return rangeActive || spectralActive;
  }

  function collectFilterStats(stars) {
    const result = {};
    for (const filter of FILTERS) {
      let min = Infinity;
      let max = -Infinity;
      let count = 0;
      for (const star of stars) {
        const value = filter.getter(star);
        if (!Number.isFinite(value)) continue;
        min = Math.min(min, value);
        max = Math.max(max, value);
        count++;
      }
      result[filter.key] = count ? { min, max, count } : null;
    }
    return result;
  }

  function activeFilterCount() {
    const stats = collectFilterStats(state.stars || []);
    let count = 0;
    Object.entries(state.advancedFilters.ranges || {}).forEach(([key, range]) => {
      const stat = stats[key];
      if (stat && (range.min > stat.min || range.max < stat.max)) count++;
    });
    const spectral = state.advancedFilters.spectral || {};
    if (SPECTRAL.some(type => spectral[type] === false)) count++;
    return count;
  }

  function updateStatus() {
    const visible = getFilteredStars().length;
    const total = (state.stars || []).length;
    ui.status.textContent = `Filtros activos: ${visible.toLocaleString('es-ES')} de ${total.toLocaleString('es-ES')} estrellas visibles.`;
  }

  function encodeRange(filter, stat) {
    const min = encodeValue(filter, stat.min);
    const max = encodeValue(filter, stat.max);
    const raw = Math.abs(max - min) / 700;
    const step = filter.scale === 'log' ? Math.max(0.001, raw) : Math.max(0.01, raw);
    return { min, max, step };
  }

  function encodeValue(filter, value) {
    return filter.scale === 'log' ? Math.log10(Math.max(value, 1e-12)) : value;
  }

  function decodeValue(filter, value) {
    return filter.scale === 'log' ? 10 ** value : value;
  }

  function filterSignature(stars) {
    const ranges = Object.entries(state.advancedFilters.ranges || {}).map(([k, v]) => `${k}:${v.min}:${v.max}`).join('|');
    const spectral = SPECTRAL.map(k => `${k}:${state.advancedFilters.spectral?.[k] !== false ? 1 : 0}`).join('|');
    return `${stars.length}|${ranges}|${spectral}`;
  }

  function invalidate() {
    cacheSource = null;
    cacheKey = '';
    cacheResult = null;
  }

  function rawNumber(star, keys) {
    const raw = star.rawFields || {};
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') return number(raw[key]);
    }
    return NaN;
  }

  function distanceLy(star) {
    const parsec = rawNumber(star, ['sy_dist','dist','distance']);
    if (Number.isFinite(parsec)) return parsec * 3.26156;
    return NaN;
  }

  function absMag(star) {
    const lum = positive(star.luminosity);
    if (!Number.isFinite(lum)) return NaN;
    return 4.74 - 2.5 * Math.log10(lum);
  }

  function spectralLetter(star) {
    const value = String(star.designation || star.class || star.rawFields?.spect || star.rawFields?.spectral_class || star.rawFields?.spectral_type || '').trim().toUpperCase();
    const match = value.match(/[OBAFGKMLTYW]/);
    return match ? match[0] : '';
  }

  function number(value) {
    if (value === undefined || value === null || value === '') return NaN;
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  function positive(value) {
    const n = number(value);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }

  function num(value, digits = 2) {
    return Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits });
  }

  function formatSmall(value) {
    if (!Number.isFinite(value)) return '—';
    if (Math.abs(value) >= 10000 || Math.abs(value) < 0.01) return value.toExponential(2).replace('e+', '×10^').replace('e-', '×10^-');
    return Number(value).toLocaleString('es-ES', { maximumFractionDigits: value < 1 ? 4 : 2 });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }
})();
