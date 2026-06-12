'use strict';

(() => {
  const popover = document.getElementById('filtersPopover');
  if (!popover || typeof sampleStars !== 'function' || typeof nearestStar !== 'function') return;

  const previousSampleStars = sampleStars;
  const previousNearestStar = nearestStar;
  const previousImport = ui?.csv?.onchange;

  const FILTERS = [
    { key: 'teff', label: 'Temperatura efectiva', unit: 'K', scale: 'linear', getter: star => number(star.teff), format: v => `${Math.round(v).toLocaleString('es-ES')} K`, parse: parsePlainNumber },
    { key: 'luminosity', label: 'Luminosidad', unit: 'L☉', scale: 'log', getter: star => positive(star.luminosity), format: v => `${formatSmall(v)} L☉`, parse: parsePlainNumber },
    { key: 'absMag', label: 'Magnitud absoluta aproximada', unit: 'mag', scale: 'linear', getter: star => absMag(star), format: v => `${num(v, 2)} mag`, parse: parsePlainNumber },
    { key: 'radius', label: 'Radio', unit: 'R☉', scale: 'log', getter: star => positive(star.radius ?? rawNumber(star, ['st_rad','radius_r_ro','radius'])), format: v => `${formatSmall(v)} R☉`, parse: parsePlainNumber },
    { key: 'mass', label: 'Masa', unit: 'M☉', scale: 'log', getter: star => positive(star.mass ?? rawNumber(star, ['st_mass','mass'])), format: v => `${formatSmall(v)} M☉`, parse: parsePlainNumber },
    { key: 'distance', label: 'Distancia', unit: 'años luz', scale: 'log', getter: star => positive(star.distance_ly ?? distanceLy(star)), format: v => `${formatSmall(v)} a.l.`, parse: parsePlainNumber },
    { key: 'planets', label: 'Planetas conocidos', unit: '', scale: 'linear', getter: star => number(star.planetCount ?? rawNumber(star, ['sy_pnum','planetCount'])), format: v => `${Math.round(v).toLocaleString('es-ES')}`, parse: parsePlainNumber },
    { key: 'bv', label: 'Color B−V', unit: '', scale: 'linear', getter: star => number(rawNumber(star, ['ci','bp_rp','b_v'])), format: v => num(v, 2), parse: parsePlainNumber }
  ];

  const SPECTRAL = ['O','B','A','F','G','K','M','L','T','Y','W'];
  const APPLY_DELAY_MS = 180;

  state.advancedFilters = state.advancedFilters || {
    ranges: {},
    spectral: Object.fromEntries(SPECTRAL.map(key => [key, true]))
  };

  let cacheSource = null;
  let cacheKey = '';
  let cacheResult = null;
  let statsSource = null;
  let statsResult = null;
  let applyTimer = null;

  installFilterWrappers();
  installImportRefresh();
  buildPanel();

  window.__hrRefreshAdvancedFilters = () => {
    invalidateAll();
    buildPanel();
    scheduleApply(0, false);
  };

  function installImportRefresh() {
    if (typeof previousImport !== 'function') return;
    ui.csv.onchange = async function importAndRefreshAdvancedFilters(event) {
      const result = await previousImport(event);
      resetRangesOutsideStats();
      invalidateAll();
      buildPanel();
      updateStatus();
      return result;
    };
  }

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
    const stars = state.stars || [];
    const stats = collectFilterStats(stars);
    const visible = getFilteredStars();
    const total = stars.length;

    popover.innerHTML = `<section class="panel-section filter-head">
      <div>
        <h3>Filtros científicos</h3>
        <p>Acota el catálogo visible por rangos físicos. Puedes arrastrar la barra o escribir los límites manualmente.</p>
      </div>
      <button id="resetAdvancedFilters" class="filter-reset" type="button">Limpiar</button>
    </section>
    <div class="filter-summary">
      <span class="filter-pill" data-filter-visible>${visible.length.toLocaleString('es-ES')} visibles</span>
      <span class="filter-pill">${total.toLocaleString('es-ES')} cargadas</span>
      <span class="filter-pill" data-filter-active>${activeFilterCount()} filtros activos</span>
    </div>
    <section class="filter-list">
      ${renderSpectralFilter()}
      ${FILTERS.map(filter => renderRangeFilter(filter, stats[filter.key])).join('')}
    </section>`;

    popover.querySelector('#resetAdvancedFilters').onclick = () => {
      state.advancedFilters.ranges = {};
      state.advancedFilters.spectral = Object.fromEntries(SPECTRAL.map(key => [key, true]));
      invalidateFiltered();
      buildPanel();
      updateStatus();
      draw();
    };

    popover.querySelectorAll('[data-filter-min],[data-filter-max]').forEach(input => {
      input.addEventListener('input', () => handleRangeInput(input));
      input.addEventListener('change', () => commitRangeInput(input));
    });

    popover.querySelectorAll('[data-filter-text-min],[data-filter-text-max]').forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commitManualInput(input);
          input.blur();
        }
      });
      input.addEventListener('blur', () => commitManualInput(input));
    });

    popover.querySelectorAll('[data-spectral-filter]').forEach(input => {
      input.addEventListener('change', () => {
        state.advancedFilters.spectral[input.dataset.spectralFilter] = input.checked;
        invalidateFiltered();
        refreshSummary();
        updateStatus();
        draw();
      });
    });
  }

  function renderRangeFilter(filter, stat) {
    if (!stat || !Number.isFinite(stat.min) || !Number.isFinite(stat.max) || stat.min === stat.max) {
      return `<article class="filter-card compact-unavailable"><header><h4>${escapeHtml(filter.label)}</h4></header><p class="filter-empty-note">No hay suficientes datos en el catálogo cargado para este campo.</p></article>`;
    }

    const encoded = encodeRange(filter, stat);
    const current = normalizedCurrentRange(filter, stat);
    const minEncoded = encodeValue(filter, current.min);
    const maxEncoded = encodeValue(filter, current.max);
    const fillLeft = ((Math.min(minEncoded, maxEncoded) - encoded.min) / (encoded.max - encoded.min)) * 100;
    const fillRight = ((Math.max(minEncoded, maxEncoded) - encoded.min) / (encoded.max - encoded.min)) * 100;

    return `<article class="filter-card" data-filter-card="${filter.key}">
      <header>
        <h4>${escapeHtml(filter.label)}</h4>
        <div class="filter-range-inputs" aria-label="Rango ${escapeHtml(filter.label)}">
          <input type="text" inputmode="decimal" value="${escapeHtml(inputValue(current.min))}" data-filter-text-min="${filter.key}" aria-label="Valor mínimo ${escapeHtml(filter.label)}" />
          <span>—</span>
          <input type="text" inputmode="decimal" value="${escapeHtml(inputValue(current.max))}" data-filter-text-max="${filter.key}" aria-label="Valor máximo ${escapeHtml(filter.label)}" />
        </div>
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
    return `<article class="filter-card spectral-filter-card">
      <header><h4>Tipo espectral</h4></header>
      <div class="filter-check-grid spectral-compact">
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
    const min = decodeValue(filter, a);
    const max = decodeValue(filter, b);
    const normalized = normalizeRange(filter, stat, min, max);
    syncRangeInputs(card, filter, stat, normalized.min, normalized.max);
    updateCardVisual(card, filter, stat, normalized.min, normalized.max);
    setOrClearRange(filter.key, filter, stat, normalized.min, normalized.max);
    invalidateFiltered();
    scheduleApply(APPLY_DELAY_MS, true);
  }

  function commitRangeInput(input) {
    handleRangeInput(input);
    scheduleApply(0, true);
  }

  function commitManualInput(input) {
    const key = input.dataset.filterTextMin || input.dataset.filterTextMax;
    const filter = FILTERS.find(item => item.key === key);
    const stat = collectFilterStats(state.stars || [])[key];
    if (!filter || !stat) return;

    const card = input.closest('[data-filter-card]');
    const minText = card.querySelector('[data-filter-text-min]');
    const maxText = card.querySelector('[data-filter-text-max]');
    let min = filter.parse(minText.value);
    let max = filter.parse(maxText.value);

    if (!Number.isFinite(min)) min = stat.min;
    if (!Number.isFinite(max)) max = stat.max;
    const normalized = normalizeRange(filter, stat, min, max, input === minText ? 'min' : 'max');
    syncRangeInputs(card, filter, stat, normalized.min, normalized.max);
    updateCardVisual(card, filter, stat, normalized.min, normalized.max);
    setOrClearRange(key, filter, stat, normalized.min, normalized.max);
    invalidateFiltered();
    scheduleApply(0, true);
  }

  function normalizeRange(filter, stat, min, max, source = '') {
    min = clamp(min, stat.min, stat.max);
    max = clamp(max, stat.min, stat.max);
    if (min > max) {
      if (source === 'min') max = min;
      else min = max;
    }
    if (isNearLower(filter, stat, min)) min = stat.min;
    if (isNearUpper(filter, stat, max)) max = stat.max;
    return { min, max };
  }

  function setOrClearRange(key, filter, stat, min, max) {
    if (isFullRange(filter, stat, min, max)) delete state.advancedFilters.ranges[key];
    else state.advancedFilters.ranges[key] = { min, max };
  }

  function updateCardVisual(card, filter, stat, min, max) {
    const encoded = encodeRange(filter, stat);
    const minEncoded = encodeValue(filter, clamp(min, stat.min, stat.max));
    const maxEncoded = encodeValue(filter, clamp(max, stat.min, stat.max));
    const left = ((Math.min(minEncoded, maxEncoded) - encoded.min) / (encoded.max - encoded.min)) * 100;
    const right = ((Math.max(minEncoded, maxEncoded) - encoded.min) / (encoded.max - encoded.min)) * 100;
    const fill = card.querySelector('.dual-range-fill');
    const minText = card.querySelector('[data-filter-text-min]');
    const maxText = card.querySelector('[data-filter-text-max]');
    if (fill) {
      fill.style.left = `${left}%`;
      fill.style.right = `${100 - right}%`;
    }
    if (minText && document.activeElement !== minText) minText.value = inputValue(min);
    if (maxText && document.activeElement !== maxText) maxText.value = inputValue(max);
  }

  function syncRangeInputs(card, filter, stat, min, max) {
    const minInput = card.querySelector('[data-filter-min]');
    const maxInput = card.querySelector('[data-filter-max]');
    if (!minInput || !maxInput) return;
    minInput.value = encodeValue(filter, clamp(min, stat.min, stat.max));
    maxInput.value = encodeValue(filter, clamp(max, stat.min, stat.max));
  }

  function scheduleApply(delay = APPLY_DELAY_MS, redraw = true) {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      refreshSummary();
      updateStatus();
      if (redraw) draw();
    }, delay);
  }

  function refreshSummary() {
    const visible = getFilteredStars().length;
    const total = (state.stars || []).length;
    const visibleEl = popover.querySelector('[data-filter-visible]');
    const activeEl = popover.querySelector('[data-filter-active]');
    if (visibleEl) visibleEl.textContent = `${visible.toLocaleString('es-ES')} visibles`;
    if (activeEl) activeEl.textContent = `${activeFilterCount()} filtros activos`;
    const totalPill = Array.from(popover.querySelectorAll('.filter-pill')).find(el => el.textContent.includes('cargadas'));
    if (totalPill) totalPill.textContent = `${total.toLocaleString('es-ES')} cargadas`;
  }

  function getFilteredStars() {
    const stars = state.stars || [];
    const key = filterSignature(stars);
    if (cacheSource === stars && cacheKey === key && cacheResult) return cacheResult;
    if (!hasActiveFilters(stars)) return stars;

    const spectral = state.advancedFilters.spectral || {};
    cacheSource = stars;
    cacheKey = key;
    cacheResult = stars.filter(star => {
      for (const filter of FILTERS) {
        const range = state.advancedFilters.ranges[filter.key];
        if (!range) continue;
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
      const filter = FILTERS.find(item => item.key === key);
      const stat = stats[key];
      if (!filter || !stat || !range) return false;
      return !isFullRange(filter, stat, range.min, range.max);
    });
    const spectral = state.advancedFilters.spectral || {};
    const spectralActive = SPECTRAL.some(type => spectral[type] === false);
    return rangeActive || spectralActive;
  }

  function collectFilterStats(stars) {
    if (statsSource === stars && statsResult) return statsResult;
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
    statsSource = stars;
    statsResult = result;
    return result;
  }

  function normalizedCurrentRange(filter, stat) {
    const current = state.advancedFilters.ranges[filter.key] || { min: stat.min, max: stat.max };
    return normalizeRange(filter, stat, Number(current.min), Number(current.max));
  }

  function resetRangesOutsideStats() {
    const stats = collectFilterStats(state.stars || []);
    Object.keys(state.advancedFilters.ranges || {}).forEach(key => {
      const filter = FILTERS.find(item => item.key === key);
      const stat = stats[key];
      const range = state.advancedFilters.ranges[key];
      if (!filter || !stat || !range) delete state.advancedFilters.ranges[key];
      else if (isFullRange(filter, stat, range.min, range.max)) delete state.advancedFilters.ranges[key];
    });
  }

  function activeFilterCount() {
    const stats = collectFilterStats(state.stars || []);
    let count = 0;
    Object.entries(state.advancedFilters.ranges || {}).forEach(([key, range]) => {
      const filter = FILTERS.find(item => item.key === key);
      const stat = stats[key];
      if (filter && stat && range && !isFullRange(filter, stat, range.min, range.max)) count++;
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

  function isFullRange(filter, stat, min, max) {
    return isNearLower(filter, stat, min) && isNearUpper(filter, stat, max);
  }

  function isNearLower(filter, stat, value) {
    return Math.abs(encodeValue(filter, value) - encodeValue(filter, stat.min)) <= filterTolerance(filter, stat);
  }

  function isNearUpper(filter, stat, value) {
    return Math.abs(encodeValue(filter, value) - encodeValue(filter, stat.max)) <= filterTolerance(filter, stat);
  }

  function filterTolerance(filter, stat) {
    const encoded = encodeRange(filter, stat);
    return Math.max(Math.abs(encoded.step) * 1.5, Math.abs(encoded.max - encoded.min) * 0.0008, 1e-9);
  }

  function filterSignature(stars) {
    const stats = collectFilterStats(stars);
    const ranges = Object.entries(state.advancedFilters.ranges || {}).map(([k, v]) => {
      const filter = FILTERS.find(item => item.key === k);
      const stat = stats[k];
      if (!filter || !stat || isFullRange(filter, stat, v.min, v.max)) return '';
      return `${k}:${v.min}:${v.max}`;
    }).filter(Boolean).join('|');
    const spectral = SPECTRAL.map(k => `${k}:${state.advancedFilters.spectral?.[k] !== false ? 1 : 0}`).join('|');
    return `${stars.length}|${ranges}|${spectral}`;
  }

  function invalidateFiltered() {
    cacheSource = null;
    cacheKey = '';
    cacheResult = null;
  }

  function invalidateAll() {
    invalidateFiltered();
    statsSource = null;
    statsResult = null;
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

  function parsePlainNumber(value) {
    const cleaned = String(value || '').trim().replace(/\s/g, '').replace(/×10\^/i, 'e').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
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

  function inputValue(value) {
    if (!Number.isFinite(value)) return '';
    if (Math.abs(value) >= 100000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(3);
    return String(Number(value.toPrecision(7)));
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
