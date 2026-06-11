'use strict';

(() => {
  if (typeof cardStar !== 'function') return;

  const previousCardRegion = typeof cardRegion === 'function' ? cardRegion : null;

  cardStar = function refinedCardStar(star) {
    const rowsInfo = Number(star.rawRowsCount || 0) > 1 ? ` · ${star.rawRowsCount} filas asociadas` : '';
    const subtitle = [
      star.designation || 'Tipo espectral no indicado',
      fmtTempSafe(star.teff),
      fmtLumSafe(star.luminosity),
      star.source || 'Catálogo local'
    ].filter(Boolean).join(' · ');

    const metrics = compactMetrics(star);
    const raw = getRawFields(star);

    infoCard.classList.add('star-card-modern');
    ui.cardKicker.textContent = `${labelClassSafe(star.class)}${rowsInfo}`;
    ui.cardTitle.textContent = star.name || 'Estrella sin nombre';
    ui.cardSubtitle.textContent = subtitle;
    ui.cardMetrics.innerHTML = metrics.map(([label, value]) => `<div class="metric"><strong>${escLocal(label)}</strong><span>${escLocal(value)}</span></div>`).join('');
    ui.cardDescription.textContent = star.notes || 'Estrella cargada desde el catálogo actual.';
    ui.cardNotes.innerHTML = buildRawSection(raw, star);
    infoCard.classList.add('open');
  };

  if (previousCardRegion) {
    cardRegion = function refinedCardRegion(region) {
      infoCard.classList.remove('star-card-modern');
      previousCardRegion(region);
    };
  }

  function compactMetrics(star) {
    const out = [
      ['Temperatura efectiva', fmtTempSafe(star.teff)],
      ['Luminosidad', fmtLumSafe(star.luminosity)],
      ['Clase HR', labelClassSafe(star.class)],
      ['Fuente', star.source || '—']
    ];

    if (star.designation) out.push(['Designación / espectro', star.designation]);
    if (finite(star.radius)) out.push(['Radio', `${numSafe(star.radius)} R☉`]);
    if (finite(star.mass)) out.push(['Masa', `${numSafe(star.mass)} M☉`]);
    if (finite(star.distance_ly)) out.push(['Distancia', `${numSafe(star.distance_ly)} años luz`]);
    if (star.planetCount) out.push(['Planetas asociados', String(star.planetCount)]);
    if (star.catalogKey) out.push(['Clave interna', star.catalogKey]);
    return out;
  }

  function getRawFields(star) {
    if (star.rawFields && typeof star.rawFields === 'object') return cleanFields(star.rawFields);
    const normalized = {
      name: star.name,
      designation: star.designation,
      class: star.class,
      teff: star.teff,
      luminosity: star.luminosity,
      radius: star.radius,
      mass: star.mass,
      distance_ly: star.distance_ly,
      source: star.source,
      notes: star.notes,
      catalogKey: star.catalogKey,
      planetCount: star.planetCount
    };
    return cleanFields(normalized);
  }

  function cleanFields(fields) {
    return Object.fromEntries(Object.entries(fields)
      .filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '')
      .sort(([a], [b]) => a.localeCompare(b, 'es')));
  }

  function buildRawSection(raw, star) {
    const entries = Object.entries(raw);
    const sourceNote = `<div class="note-pill minimal-note">Fuente: ${escLocal(star.source || 'Catálogo local')}. ${star.rawRowsCount > 1 ? `Esta estrella agrupa ${escLocal(star.rawRowsCount)} filas del catálogo; se muestran campos representativos conservados durante la importación.` : 'Se muestran los campos conservados de la fila CSV importada.'}</div>`;

    if (!entries.length) return sourceNote;

    const rows = entries.map(([key, value]) => `<div class="raw-field-row"><dt>${escLocal(prettyKey(key))}</dt><dd>${escLocal(value)}</dd></div>`).join('');
    return `${sourceNote}<details class="star-raw-section" open><summary>Campos disponibles del CSV (${entries.length})</summary><dl class="raw-field-grid">${rows}</dl></details>`;
  }

  function prettyKey(key) {
    return String(key).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function finite(value) {
    return Number.isFinite(Number(value));
  }

  function fmtTempSafe(value) {
    return typeof fmtTemp === 'function' ? fmtTemp(value) : `${Math.round(Number(value)).toLocaleString('es-ES')} K`;
  }

  function fmtLumSafe(value) {
    return typeof fmtLum === 'function' ? fmtLum(value) : `${Number(value).toLocaleString('es-ES')} L☉`;
  }

  function numSafe(value) {
    return typeof num === 'function' ? num(value) : Number(value).toLocaleString('es-ES', { maximumFractionDigits: 3 });
  }

  function labelClassSafe(value) {
    return typeof labelClass === 'function' ? labelClass(value) : (value || 'Estrella');
  }

  function escLocal(value) {
    const text = String(value === undefined || value === null ? '—' : value);
    if (typeof esc === 'function') return esc(text);
    return text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
})();
