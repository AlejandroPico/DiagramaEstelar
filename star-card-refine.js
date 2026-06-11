'use strict';

(() => {
  if (typeof cardStar !== 'function') return;

  const previousCardRegion = typeof cardRegion === 'function' ? cardRegion : null;
  const tabState = { active: 'resumen', pages: {} };
  let dragState = null;

  cardStar = function refinedCardStar(star) {
    tabState.active = 'resumen';
    tabState.pages = {};
    renderStarCard(star);
    placeCardAwayFromStar(star);
    enableDrag();
  };

  if (previousCardRegion) {
    cardRegion = function refinedCardRegion(region) {
      infoCard.classList.remove('star-card-modern', 'card-pos-left', 'card-pos-right', 'card-pos-top', 'card-pos-bottom');
      previousCardRegion(region);
    };
  }

  function renderStarCard(star) {
    const rowsInfo = Number(star.rawRowsCount || 0) > 1 ? ` · ${star.rawRowsCount} filas asociadas` : '';
    const subtitle = [star.designation || 'Tipo espectral no indicado', fmtTempSafe(star.teff), fmtLumSafe(star.luminosity), star.source || 'Catálogo local'].filter(Boolean).join(' · ');
    const categorized = categorizeFields(star);
    const tabs = buildTabs(categorized);

    infoCard.classList.add('star-card-modern');
    ui.cardKicker.textContent = `${labelClassSafe(star.class)}${rowsInfo}`;
    ui.cardTitle.textContent = star.name || 'Estrella sin nombre';
    ui.cardSubtitle.textContent = subtitle;
    ui.cardDescription.textContent = '';
    ui.cardMetrics.innerHTML = tabs.map(tab => `<button class="star-tab-button${tab.id === tabState.active ? ' active' : ''}" type="button" data-star-tab="${escLocal(tab.id)}">${escLocal(tab.label)}</button>`).join('');
    ui.cardNotes.innerHTML = renderActiveTab(star, categorized, tabs);
    infoCard.classList.add('open');

    ui.cardMetrics.querySelectorAll('[data-star-tab]').forEach(button => {
      button.addEventListener('click', () => {
        tabState.active = button.dataset.starTab;
        renderStarCard(star);
      });
    });

    infoCard.querySelectorAll('[data-tab-page]').forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tabKey || tabState.active;
        tabState.pages[tab] = Number(button.dataset.tabPage || 0);
        renderStarCard(star);
      });
    });
  }

  function buildTabs(categorized) {
    return [
      { id: 'resumen', label: 'Resumen', count: categorized.resumen.length },
      { id: 'identidad', label: 'Identidad', count: categorized.identidad.length },
      { id: 'fisica', label: 'Física', count: categorized.fisica.length },
      { id: 'posicion', label: 'Posición', count: categorized.posicion.length },
      { id: 'catalogo', label: 'Catálogo', count: categorized.catalogo.length },
      { id: 'csv', label: `CSV (${categorized.csv.length})`, count: categorized.csv.length },
      { id: 'fuentes', label: 'Fuentes', count: 2 }
    ].filter(tab => tab.id === 'resumen' || tab.id === 'fuentes' || tab.count > 0);
  }

  function renderActiveTab(star, categorized, tabs) {
    if (!tabs.some(tab => tab.id === tabState.active)) tabState.active = 'resumen';
    if (tabState.active === 'fuentes') return renderExternalSearch(star);
    return renderPagedTab(tabState.active, categorized[tabState.active] || [], star);
  }

  function renderPagedTab(tab, fields, star) {
    const perPage = tab === 'resumen' ? 8 : 10;
    const empty = tab === 'csv'
      ? 'No hay campos CSV conservados para esta estrella.'
      : `No hay datos disponibles en esta categoría para ${star.name || 'esta estrella'}.`;

    if (!fields.length) return `<div class="star-tab-panel"><div class="star-empty-tab">${escLocal(empty)}</div><div></div></div>`;

    const pages = Math.max(1, Math.ceil(fields.length / perPage));
    const current = Math.max(0, Math.min(pages - 1, Number(tabState.pages[tab] || 0)));
    tabState.pages[tab] = current;
    const start = current * perPage;
    const pageFields = fields.slice(start, start + perPage);
    const grid = `<dl class="star-tab-grid">${pageFields.map(([label, value, wide]) => `<div class="star-field${wide ? ' wide' : ''}"><dt>${escLocal(prettyKey(label))}</dt><dd>${escLocal(value)}</dd></div>`).join('')}</dl>`;

    const pagination = pages > 1
      ? `<div class="star-pagination">
          <button type="button" data-tab-key="${escLocal(tab)}" data-tab-page="${current - 1}" ${current === 0 ? 'disabled' : ''}>Anterior</button>
          <span>Página ${current + 1} de ${pages} · ${fields.length} datos</span>
          <button type="button" data-tab-key="${escLocal(tab)}" data-tab-page="${current + 1}" ${current >= pages - 1 ? 'disabled' : ''}>Siguiente</button>
        </div>`
      : `<div class="star-pagination"><span>${fields.length} datos</span></div>`;

    return `<div class="star-tab-panel">${grid}${pagination}</div>`;
  }

  function renderExternalSearch(star) {
    const q = encodeURIComponent(searchName(star));
    return `<div class="star-tab-panel">
      <div class="star-search-panel">
        <a class="star-search-link" href="https://es.wikipedia.org/wiki/Special:Search?search=${q}" target="_blank" rel="noopener noreferrer" title="Buscar en Wikipedia">
          <span class="star-search-icon" aria-hidden="true">W</span>
          <span><strong>Wikipedia</strong><small>Buscar artículo o coincidencias enciclopédicas.</small></span>
        </a>
        <a class="star-search-link" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer" title="Buscar en Google">
          <span class="star-search-icon" aria-hidden="true">G</span>
          <span><strong>Google</strong><small>Buscar referencias externas y páginas astronómicas.</small></span>
        </a>
      </div>
      <div></div>
    </div>`;
  }

  function categorizeFields(star) {
    const raw = getRawFields(star);
    const take = (keys, source = raw) => keys.map(key => {
      if (source[key] === undefined || source[key] === null || String(source[key]).trim() === '') return null;
      return [key, source[key], isWideValue(source[key])];
    }).filter(Boolean);

    const normalized = {
      name: star.name,
      source: star.source,
      designation: star.designation,
      class: labelClassSafe(star.class),
      teff: fmtTempSafe(star.teff),
      luminosity: fmtLumSafe(star.luminosity),
      radius: finite(star.radius) ? `${numSafe(star.radius)} R☉` : '',
      mass: finite(star.mass) ? `${numSafe(star.mass)} M☉` : '',
      distance_ly: finite(star.distance_ly) ? `${numSafe(star.distance_ly)} años luz` : '',
      planetCount: star.planetCount || '',
      catalogKey: star.catalogKey || ''
    };

    const identityKeys = ['hostname','pl_name','hd_name','hip_name','gaia_dr3_id','id','hip','hd','hr','gl','bf','proper','bayer','flam','con','designation','spect','spectral_class','spectral_type','source_id'];
    const physicalKeys = ['st_teff','teff','temperature_k','luminosity_l_lo','st_lum','lum','absmag','mag','ci','st_rad','radius_r_ro','st_mass','mass','spect','star_color','star_type'];
    const positionKeys = ['ra','dec','rarad','decrad','sy_dist','dist','distance','distance_ly','pmra','pmdec','pmrarad','pmdecrad','rv','x','y','z','vx','vy','vz'];
    const catalogKeys = ['default_flag','sy_pnum','pl_name','discoverymethod','disc_year','rowupdate','releasedate','source','catalogKey','pos_src','dist_src','mag_src'];

    const resumen = take(['name','source','designation','class','teff','luminosity','radius','mass','distance_ly','planetCount'], normalized);
    const identidad = [...take(['name','designation','catalogKey'], normalized), ...take(identityKeys)];
    const fisica = [...take(['teff','luminosity','radius','mass','class'], normalized), ...take(physicalKeys)];
    const posicion = [...take(['distance_ly'], normalized), ...take(positionKeys)];
    const catalogo = [...take(['source','planetCount'], normalized), ...take(catalogKeys)];
    const csv = Object.entries(raw).filter(([key, value]) => value !== undefined && value !== null && String(value).trim() !== '').map(([key, value]) => [key, value, isWideValue(value)]);

    return {
      resumen: dedupeFields(resumen),
      identidad: dedupeFields(identidad),
      fisica: dedupeFields(fisica),
      posicion: dedupeFields(posicion),
      catalogo: dedupeFields(catalogo),
      csv: dedupeFields(csv)
    };
  }

  function dedupeFields(fields) {
    const seen = new Set();
    return fields.filter(([key]) => {
      const normalized = String(key).toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  function getRawFields(star) {
    if (star.rawFields && typeof star.rawFields === 'object') return cleanFields(star.rawFields);
    return cleanFields({ name: star.name, designation: star.designation, class: star.class, teff: star.teff, luminosity: star.luminosity, radius: star.radius, mass: star.mass, distance_ly: star.distance_ly, source: star.source, notes: star.notes, catalogKey: star.catalogKey, planetCount: star.planetCount });
  }

  function placeCardAwayFromStar(star) {
    infoCard.classList.remove('card-pos-left', 'card-pos-right', 'card-pos-top', 'card-pos-bottom');
    infoCard.style.left = '';
    infoCard.style.right = '';
    infoCard.style.top = '';
    infoCard.style.bottom = '';

    try {
      const sx = typeof worldToScreenX === 'function' && typeof tempX === 'function' ? worldToScreenX(tempX(star.teff)) : innerWidth / 2;
      const sy = typeof worldToScreenY === 'function' && typeof lumY === 'function' ? worldToScreenY(lumY(star.luminosity)) : innerHeight / 2;
      const preferLeft = sx > innerWidth * 0.58;
      const preferTop = sy > innerHeight * 0.58;
      infoCard.classList.add(preferLeft ? 'card-pos-left' : 'card-pos-right');
      infoCard.classList.add(preferTop ? 'card-pos-top' : 'card-pos-bottom');
    } catch (_) {
      infoCard.classList.add('card-pos-right', 'card-pos-bottom');
    }
  }

  function enableDrag() {
    if (infoCard.dataset.dragReady === '1') return;
    infoCard.dataset.dragReady = '1';

    infoCard.addEventListener('pointerdown', event => {
      if (event.target.closest('button,a,input,summary,details')) return;
      const rect = infoCard.getBoundingClientRect();
      dragState = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
      infoCard.classList.add('dragging-card');
      infoCard.setPointerCapture(event.pointerId);
    });

    infoCard.addEventListener('pointermove', event => {
      if (!dragState) return;
      const w = infoCard.offsetWidth;
      const h = infoCard.offsetHeight;
      const x = clampNumber(event.clientX - dragState.dx, 8, Math.max(8, innerWidth - w - 8));
      const y = clampNumber(event.clientY - dragState.dy, 8, Math.max(8, innerHeight - h - 8));
      infoCard.style.left = `${x}px`;
      infoCard.style.top = `${y}px`;
      infoCard.style.right = 'auto';
      infoCard.style.bottom = 'auto';
      infoCard.classList.remove('card-pos-left', 'card-pos-right', 'card-pos-top', 'card-pos-bottom');
    });

    infoCard.addEventListener('pointerup', event => {
      dragState = null;
      infoCard.classList.remove('dragging-card');
      try { infoCard.releasePointerCapture(event.pointerId); } catch (_) {}
    });
  }

  function cleanFields(fields) {
    return Object.fromEntries(Object.entries(fields)
      .filter(([_, value]) => value !== undefined && value !== null && String(value).trim() !== '')
      .sort(([a], [b]) => a.localeCompare(b, 'es')));
  }

  function prettyKey(key) {
    const map = {
      teff: 'Temperatura efectiva', st_teff: 'Temperatura estelar', lum: 'Luminosidad', st_lum: 'Luminosidad log₁₀', luminosity_l_lo: 'Luminosidad', absmag: 'Magnitud absoluta', ci: 'Índice B−V', sy_dist: 'Distancia', sy_pnum: 'Planetas del sistema', pl_name: 'Planeta', hostname: 'Estrella anfitriona', ra: 'Ascensión recta', dec: 'Declinación', pmra: 'Movimiento propio RA', pmdec: 'Movimiento propio Dec', rv: 'Velocidad radial', spect: 'Tipo espectral'
    };
    return map[key] || String(key).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function searchName(star) {
    return star.name || star.designation || star.catalogKey || 'estrella';
  }

  function isWideValue(value) {
    return String(value).length > 42;
  }

  function finite(value) {
    return Number.isFinite(Number(value));
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
