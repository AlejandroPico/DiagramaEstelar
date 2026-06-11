'use strict';

(() => {
  if (typeof cardRegion !== 'function' || !infoCard || !ui) return;

  const regionTabState = { active: 'resumen', pages: {} };
  let dragState = null;

  cardRegion = function refinedRegionCard(region) {
    regionTabState.active = 'resumen';
    regionTabState.pages = {};
    renderRegionCard(region);
    placeRegionCard(region);
    enableRegionDrag();
  };

  function renderRegionCard(region) {
    const tabs = buildRegionTabs(region);
    infoCard.classList.add('star-card-modern', 'region-card-modern');
    ui.cardKicker.textContent = 'Zona evolutiva orientativa';
    ui.cardTitle.textContent = region.name;
    ui.cardSubtitle.textContent = region.subtitle || 'Área pedagógica del diagrama HR';
    ui.cardDescription.textContent = '';
    ui.cardMetrics.innerHTML = tabs.map(tab => `<button class="star-tab-button${tab.id === regionTabState.active ? ' active' : ''}" type="button" data-region-tab="${escRegion(tab.id)}">${escRegion(tab.label)}</button>`).join('');
    ui.cardNotes.innerHTML = renderRegionTab(region);
    infoCard.classList.add('open');

    ui.cardMetrics.querySelectorAll('[data-region-tab]').forEach(button => {
      button.addEventListener('click', () => {
        regionTabState.active = button.dataset.regionTab;
        renderRegionCard(region);
      });
    });

    infoCard.querySelectorAll('[data-region-page]').forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tabKey || regionTabState.active;
        regionTabState.pages[tab] = Number(button.dataset.regionPage || 0);
        renderRegionCard(region);
      });
    });
  }

  function buildRegionTabs(region) {
    return [
      { id: 'resumen', label: 'Resumen' },
      { id: 'rango', label: 'Rango' },
      { id: 'lectura', label: 'Lectura' },
      { id: 'cautelas', label: 'Cautelas' }
    ];
  }

  function renderRegionTab(region) {
    const fields = getRegionFields(region, regionTabState.active);
    return renderPagedRegionTab(regionTabState.active, fields, region);
  }

  function getRegionFields(region, tab) {
    const ranges = Array.isArray(region.metrics) ? region.metrics : [];
    const bounds = computeRegionBounds(region);
    const base = {
      resumen: [
        ['Nombre', region.name, true],
        ['Tipo', 'Zona evolutiva orientativa', false],
        ['Función', region.subtitle || 'Área interpretativa del diagrama HR', true],
        ['Descripción', region.description || 'Sin descripción disponible.', true]
      ],
      rango: [
        ...ranges.map(([key, value]) => [key, value, false]),
        ['Temperatura visual', `${formatNumber(bounds.tMin)}–${formatNumber(bounds.tMax)} K`, false],
        ['Luminosidad visual', `${formatLum(bounds.lMin)}–${formatLum(bounds.lMax)} L☉`, false]
      ],
      lectura: getRegionReading(region),
      cautelas: [
        ['Frontera', 'No es una frontera física exacta; es una guía visual.', true],
        ['Transición', 'Las estrellas evolucionan de forma gradual y pueden ocupar zonas intermedias.', true],
        ['Datos', 'La posición depende de temperatura, luminosidad, calibración y catálogo.', true],
        ['Solapamientos', 'Algunas etapas y trayectorias pueden superponerse visualmente.', true],
        ['Uso correcto', 'Úsala para orientarte, no como clasificación automática definitiva.', true]
      ]
    };
    return base[tab] || base.resumen;
  }

  function getRegionReading(region) {
    const common = {
      'main-sequence': [
        ['Lectura principal', 'Estrellas que fusionan hidrógeno en el núcleo de forma estable.', true],
        ['Dirección física', 'Hacia arriba-izquierda aumenta la masa, temperatura y luminosidad.', true],
        ['Ejemplo', 'El Sol vive dentro de esta banda como estrella G2V.', false],
        ['Duración', 'Es la etapa más larga para la mayoría de estrellas.', true]
      ],
      'red-giants': [
        ['Lectura principal', 'Estrellas evolucionadas con capas exteriores expandidas.', true],
        ['Clave visual', 'Superficie relativamente fría, pero luminosidad alta por radio enorme.', true],
        ['Interpretación', 'Indica salida de la secuencia principal y cambios internos de combustión.', true]
      ],
      'supergiants': [
        ['Lectura principal', 'Estrellas extremadamente luminosas y normalmente muy masivas.', true],
        ['Clave visual', 'Aparecen en la zona superior porque emiten enormes cantidades de energía.', true],
        ['Destino', 'Muchas evolucionan hacia fases violentas y pueden acabar en supernova.', true]
      ],
      'white-dwarfs': [
        ['Lectura principal', 'Remanentes compactos: calientes, pequeños y poco luminosos.', true],
        ['Clave visual', 'Abajo-izquierda: temperatura alta, luminosidad baja por radio diminuto.', true],
        ['Naturaleza', 'No fusionan hidrógeno como una estrella normal de secuencia principal.', true]
      ],
      'instability-strip': [
        ['Lectura principal', 'Región asociada a estrellas pulsantes.', true],
        ['Clave visual', 'Cruza varias luminosidades y temperaturas intermedias.', true],
        ['Importancia', 'Variables como Cefeidas y RR Lyrae ayudan a medir distancias.', true]
      ]
    };
    return common[region.id] || [['Lectura', region.description || 'Zona pedagógica del diagrama HR.', true]];
  }

  function renderPagedRegionTab(tab, fields, region) {
    const perPage = 8;
    const pages = Math.max(1, Math.ceil(fields.length / perPage));
    const current = Math.max(0, Math.min(pages - 1, Number(regionTabState.pages[tab] || 0)));
    regionTabState.pages[tab] = current;
    const pageFields = fields.slice(current * perPage, current * perPage + perPage);

    const grid = `<dl class="star-tab-grid">${pageFields.map(([label, value, wide]) => `<div class="star-field${wide ? ' wide' : ''}"><dt>${escRegion(label)}</dt><dd>${escRegion(value)}</dd></div>`).join('')}</dl>`;
    const pagination = pages > 1
      ? `<div class="star-pagination">
          <button type="button" data-tab-key="${escRegion(tab)}" data-region-page="${current - 1}" ${current === 0 ? 'disabled' : ''}>Anterior</button>
          <span>Página ${current + 1} de ${pages} · ${fields.length} datos</span>
          <button type="button" data-tab-key="${escRegion(tab)}" data-region-page="${current + 1}" ${current >= pages - 1 ? 'disabled' : ''}>Siguiente</button>
        </div>`
      : `<div class="star-pagination"><span>${fields.length} datos</span></div>`;

    return `<div class="star-tab-panel">${grid}${pagination}</div>`;
  }

  function placeRegionCard(region) {
    infoCard.classList.remove('card-pos-left', 'card-pos-right', 'card-pos-top', 'card-pos-bottom');
    infoCard.style.left = '';
    infoCard.style.right = '';
    infoCard.style.top = '';
    infoCard.style.bottom = '';

    const bounds = computeRegionBounds(region);
    const sx = worldToScreenX(tempX((bounds.tMin + bounds.tMax) / 2));
    const sy = worldToScreenY(lumY(Math.sqrt(bounds.lMin * bounds.lMax)));
    infoCard.classList.add(sx > innerWidth * 0.58 ? 'card-pos-left' : 'card-pos-right');
    infoCard.classList.add(sy > innerHeight * 0.58 ? 'card-pos-top' : 'card-pos-bottom');
  }

  function enableRegionDrag() {
    if (infoCard.dataset.regionDragReady === '1') return;
    infoCard.dataset.regionDragReady = '1';

    infoCard.addEventListener('pointerdown', event => {
      if (event.target.closest('button,a,input,summary,details')) return;
      const rect = infoCard.getBoundingClientRect();
      dragState = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
      infoCard.classList.add('dragging-card');
      try { infoCard.setPointerCapture(event.pointerId); } catch (_) {}
    });

    infoCard.addEventListener('pointermove', event => {
      if (!dragState) return;
      const x = clampNumber(event.clientX - dragState.dx, 8, Math.max(8, innerWidth - infoCard.offsetWidth - 8));
      const y = clampNumber(event.clientY - dragState.dy, 8, Math.max(8, innerHeight - infoCard.offsetHeight - 8));
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

  function computeRegionBounds(region) {
    const temps = region.points.map(([t]) => Number(t)).filter(Number.isFinite);
    const lums = region.points.map(([, l]) => Number(l)).filter(v => Number.isFinite(v) && v > 0);
    return {
      tMin: Math.min(...temps),
      tMax: Math.max(...temps),
      lMin: Math.min(...lums),
      lMax: Math.max(...lums)
    };
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('es-ES');
  }

  function formatLum(value) {
    if (value >= 1000 || value < 0.01) return value.toExponential(1).replace('e+', '×10^').replace('e-', '×10^-');
    return Number(value.toPrecision(3)).toLocaleString('es-ES');
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escRegion(value) {
    return String(value === undefined || value === null ? '—' : value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
})();
