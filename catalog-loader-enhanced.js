'use strict';

(() => {
  if (!window.Worker || !ui || !ui.csv) return;

  ui.csv.onchange = importCatalogFilesEnhanced;
  ui.status.textContent = 'Escenario vacío. Carga catálogos desde Datos cuando quieras.';

  async function importCatalogFilesEnhanced(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    ui.status.textContent = files.length === 1 ? `Analizando ${files[0].name}…` : `Analizando ${files.length} catálogos…`;

    try {
      const all = [];
      const summaries = [];

      for (let i = 0; i < files.length; i++) {
        const result = await parseCatalogInWorker(files[i], i + 1, files.length);
        all.push(...result.stars);
        summaries.push(result.meta);
      }

      const merged = mergeImportedStars(all);
      state.stars = merged;
      state.selected = null;
      state.hovered = null;
      state.layers.stars = true;
      if (ui.toggles.stars) ui.toggles.stars.checked = true;

      if (merged.length > 1500) {
        state.layers.synthetic = false;
        if (ui.toggles.synthetic) ui.toggles.synthetic.checked = false;
      }

      if (merged.length > 20000) {
        state.layers.animation = false;
        if (ui.toggles.animation) ui.toggles.animation.checked = false;
      }

      window.__hrDatasetMeta = { files: summaries, represented: merged.length };
      if (typeof window.__hrRefreshEmptyHint === 'function') window.__hrRefreshEmptyHint();
      fit();
      draw();

      const total = merged.length.toLocaleString('es-ES');
      const detail = summaries.map(s => `${s.catalogLabel}: ${s.represented.toLocaleString('es-ES')}`).join(' · ');
      ui.status.textContent = `Importación completada. Estrellas representadas: ${total}. ${detail}`;
      if (typeof closePanel === 'function') closePanel();
    } catch (error) {
      console.error(error);
      ui.status.textContent = `Error al importar datos: ${error.message}`;
    } finally {
      event.target.value = '';
    }
  }

  function parseCatalogInWorker(file, index, total) {
    return new Promise((resolve, reject) => {
      const workerUrl = URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' }));
      const worker = new Worker(workerUrl);

      worker.onmessage = event => {
        const msg = event.data || {};
        if (msg.type === 'progress') ui.status.textContent = total === 1 ? msg.message : `[${index}/${total}] ${msg.message}`;
        if (msg.type === 'done') {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(msg.payload);
        }
        if (msg.type === 'error') {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error(msg.message || 'Error leyendo catálogo.'));
        }
      };

      worker.onerror = error => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        reject(new Error(error.message || 'Error ejecutando worker de catálogo.'));
      };

      worker.postMessage({ file });
    });
  }

  function mergeImportedStars(stars) {
    const map = new Map();
    for (const star of stars) {
      if (!star || !Number.isFinite(star.teff) || !Number.isFinite(star.luminosity)) continue;
      const key = star.catalogKey || `${localNorm(star.name)}:${Math.round(star.teff)}:${star.luminosity.toExponential(3)}`;
      const previous = map.get(key);
      map.set(key, previous ? mergeStar(previous, star) : star);
    }
    return Array.from(map.values());
  }

  function mergeStar(a, b) {
    const rawFields = { ...(a.rawFields || {}) };
    Object.entries(b.rawFields || {}).forEach(([key, value]) => {
      if ((rawFields[key] === undefined || rawFields[key] === '') && value !== undefined && value !== '') rawFields[key] = value;
    });

    return {
      ...a,
      radius: a.radius || b.radius || null,
      mass: a.mass || b.mass || null,
      distance_ly: a.distance_ly || b.distance_ly || null,
      designation: a.designation || b.designation || '',
      source: Array.from(new Set([a.source, b.source].filter(Boolean))).join(' + '),
      notes: [a.notes, b.notes].filter(Boolean).join(' · '),
      planetCount: Math.max(Number(a.planetCount || 0), Number(b.planetCount || 0)) || undefined,
      rawFields,
      rawRowsCount: Number(a.rawRowsCount || 1) + Number(b.rawRowsCount || 1)
    };
  }

  function localNorm(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function workerSource() {
    return String.raw`
'use strict';

self.onmessage = async event => {
  try {
    const file = event.data.file;
    postMessage({ type: 'progress', message: 'Leyendo ' + file.name + '…' });
    const text = await file.text();
    postMessage({ type: 'progress', message: 'Detectando estructura de ' + file.name + '…' });
    postMessage({ type: 'done', payload: parseCatalog(text, file.name) });
  } catch (error) {
    postMessage({ type: 'error', message: error.message || String(error) });
  }
};

function parseCatalog(text, filename) {
  const prepared = prepareCsv(text);
  const header = prepared.header;
  const normalizedHeader = header.map(normalizeHeader);
  const type = detectCatalog(normalizedHeader, filename);
  const rows = prepared.lines;
  const stars = [];
  const hostMap = new Map();
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && i % 12000 === 0) postMessage({ type: 'progress', message: 'Procesando ' + filename + ': ' + i.toLocaleString('es-ES') + ' filas…' });
    const values = splitCsvLine(rows[i], prepared.delimiter);
    if (!values.length || values.every(v => !String(v).trim())) continue;

    const row = {};
    normalizedHeader.forEach((h, idx) => { row[h] = values[idx] === undefined ? '' : values[idx]; });

    const star = normalizeRow(row, type, i);
    if (!star) { skipped++; continue; }

    if (type.id === 'nasa_exoplanet_archive') {
      const key = 'nasa:' + normalizeText(star.name);
      const previous = hostMap.get(key);
      hostMap.set(key, previous ? mergeHost(previous, star) : star);
    } else stars.push(star);
  }

  if (type.id === 'nasa_exoplanet_archive') stars.push(...hostMap.values());

  return { stars, meta: { file: filename, catalogId: type.id, catalogLabel: type.label, rows: rows.length, represented: stars.length, skipped } };
}

function prepareCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim() !== '');
  const headerIndex = lines.findIndex(line => !line.trim().startsWith('#'));
  if (headerIndex < 0) throw new Error('No se ha encontrado una cabecera CSV válida.');
  const headerLine = lines[headerIndex];
  const delimiter = detectDelimiter(headerLine);
  return { delimiter, header: splitCsvLine(headerLine, delimiter), lines: lines.slice(headerIndex + 1).filter(line => !line.trim().startsWith('#')) };
}

function detectDelimiter(line) {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  for (const sep of candidates) {
    const count = splitCsvLine(line, sep).length;
    if (count > bestCount) { best = sep; bestCount = count; }
  }
  return best;
}

function splitCsvLine(line, sep) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && quoted && next === '"') { cur += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === sep && !quoted) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function detectCatalog(headers, filename) {
  const has = (...names) => names.every(n => headers.includes(n));
  const file = filename.toLowerCase();
  if (has('hostname', 'st_teff', 'st_lum') || file.startsWith('ps_')) return { id: 'nasa_exoplanet_archive', label: 'NASA Exoplanet Archive' };
  if (has('proper', 'spect', 'ci') && (headers.includes('lum') || headers.includes('absmag'))) return { id: 'hyg_like', label: headers.includes('spect_src') ? 'ATHYG/HYG-like' : 'HYG' };
  if (headers.includes('temperature_k') && headers.includes('luminosity_l_lo')) return { id: 'stellar_classification', label: 'Stellar Classification / Kaggle' };
  if (headers.includes('teff_gspphot') || headers.includes('lum_flame')) return { id: 'gaia_like', label: 'Gaia-like' };
  return { id: 'generic_hr_csv', label: 'CSV HR genérico' };
}

function normalizeRow(row, type, index) {
  if (type.id === 'nasa_exoplanet_archive') return normalizeNasa(row, index);
  if (type.id === 'hyg_like') return normalizeHyg(row, index, type.label);
  if (type.id === 'stellar_classification') return normalizeStellarClassification(row, index);
  return normalizeGeneric(row, index, type.label);
}

function normalizeNasa(row, index) {
  const teff = number(row.st_teff);
  const logLum = number(row.st_lum);
  if (!validTeff(teff) || !Number.isFinite(logLum)) return null;
  const luminosity = Math.pow(10, logLum);
  if (!validLum(luminosity)) return null;
  const name = row.hostname || row.pl_name || 'Estrella anfitriona ' + (index + 1);
  const planetCount = intNumber(row.sy_pnum) || (row.pl_name ? 1 : 0);
  return makeStar({ name, teff, luminosity, radius: number(row.st_rad), mass: number(row.st_mass), distance_ly: pcToLy(number(row.sy_dist)), designation: row.st_spectype || row.hd_name || row.hip_name || row.gaia_dr3_id || '', source: 'NASA Exoplanet Archive', catalogKey: 'nasa:' + normalizeText(name), className: classify(teff, luminosity), notes: planetCount ? 'Anfitriona de ' + planetCount + ' planeta(s) confirmado(s).' : 'Anfitriona de exoplanetas.', planetCount, color: colorTemp(teff), rawFields: row });
}

function mergeHost(a, b) {
  const rawFields = Object.assign({}, a.rawFields || {});
  Object.entries(b.rawFields || {}).forEach(([key, value]) => { if ((rawFields[key] === undefined || rawFields[key] === '') && value !== undefined && value !== '') rawFields[key] = value; });
  return { ...a, radius: a.radius || b.radius || null, mass: a.mass || b.mass || null, distance_ly: a.distance_ly || b.distance_ly || null, designation: a.designation || b.designation || '', planetCount: Math.max(Number(a.planetCount || 0), Number(b.planetCount || 0)) || undefined, notes: a.notes || b.notes || '', rawFields, rawRowsCount: Number(a.rawRowsCount || 1) + Number(b.rawRowsCount || 1) };
}

function normalizeHyg(row, index, label) {
  const directLum = number(row.lum);
  const absMag = number(row.absmag);
  const luminosity = validLum(directLum) ? directLum : lumFromAbsMag(absMag);
  const explicitTeff = number(row.teff);
  const teff = validTeff(explicitTeff) ? explicitTeff : estimateTeff(row.ci, row.spect);
  if (!validTeff(teff) || !validLum(luminosity)) return null;
  const name = row.proper || makeHygName(row) || 'HYG ' + (row.id || index + 1);
  return makeStar({ name, teff, luminosity, radius: NaN, mass: NaN, distance_ly: pcToLy(number(row.dist)), designation: row.spect || row.hd || row.hip || row.gl || '', source: label, catalogKey: 'hyg:' + (row.hip || row.hd || row.gl || row.id || normalizeText(name)), className: classify(teff, luminosity, row.spect), notes: 'Temperatura estimada desde índice B−V o clase espectral cuando no viene explícita.', color: colorTemp(teff), rawFields: row });
}

function makeHygName(row) {
  if (row.bf) return row.bf;
  if (row.bayer && row.con) return row.bayer + ' ' + row.con;
  if (row.flam && row.con) return row.flam + ' ' + row.con;
  if (row.hd) return 'HD ' + row.hd;
  if (row.hip) return 'HIP ' + row.hip;
  if (row.gl) return row.gl;
  return '';
}

function normalizeStellarClassification(row, index) {
  const teff = number(row.temperature_k);
  const luminosity = number(row.luminosity_l_lo);
  if (!validTeff(teff) || !validLum(luminosity)) return null;
  return makeStar({ name: 'Estrella clase ' + (row.star_type || row.spectral_class || index + 1), teff, luminosity, radius: number(row.radius_r_ro), mass: NaN, distance_ly: NaN, designation: row.spectral_class || '', source: 'Stellar Classification / Kaggle', catalogKey: 'stellar-class:' + index, className: classFromStellarType(row.star_type, teff, luminosity), notes: row.star_color ? 'Color declarado: ' + row.star_color + '.' : '', color: colorNameToHex(row.star_color) || colorTemp(teff), rawFields: row });
}

function normalizeGeneric(row, index, label) {
  const teff = firstNumber(row, ['teff','temperature','temperature_k','effective_temperature','st_teff','teff_gspphot']);
  const directLum = firstNumber(row, ['luminosity','lum','luminosity_l_lo','stellar_luminosity','lum_flame']);
  const nasaLogLum = row.st_lum !== undefined ? number(row.st_lum) : NaN;
  const luminosity = validLum(directLum) ? directLum : Number.isFinite(nasaLogLum) ? Math.pow(10, nasaLogLum) : NaN;
  if (!validTeff(teff) || !validLum(luminosity)) return null;
  const name = firstText(row, ['name','star_name','source_id','designation','hostname','proper']) || 'Estrella ' + (index + 1);
  return makeStar({ name, teff, luminosity, radius: firstNumber(row, ['radius','st_rad','radius_solar','radius_r_ro']), mass: firstNumber(row, ['mass','st_mass','mass_solar']), distance_ly: firstNumber(row, ['distance_ly','dist_ly']) || pcToLy(firstNumber(row, ['distance','dist','sy_dist'])), designation: firstText(row, ['spectral_type','spectral','sp_type','designation','spect']) || '', source: label || 'CSV importado', catalogKey: 'generic:' + normalizeText(name) + ':' + index, className: classify(teff, luminosity), notes: '', color: colorTemp(teff), rawFields: row });
}

function makeStar(data) {
  return { name: data.name, designation: data.designation || '', class: data.className || classify(data.teff, data.luminosity), teff: data.teff, luminosity: data.luminosity, radius: finiteOrNull(data.radius), mass: finiteOrNull(data.mass), distance_ly: finiteOrNull(data.distance_ly), color: data.color || colorTemp(data.teff), source: data.source || 'CSV importado', notes: data.notes || '', catalogKey: data.catalogKey || '', planetCount: data.planetCount || undefined, rawFields: cleanRawFields(data.rawFields || {}), rawRowsCount: 1, marker: clamp(4.2 + Math.log10(data.luminosity + .0002) * .75, 3.1, 8.5) };
}

function cleanRawFields(row) {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => { if (value !== undefined && value !== null && String(value).trim() !== '') out[key] = String(value).trim(); });
  return out;
}

function firstNumber(row, keys) { for (const key of keys) { if (row[key] !== undefined) { const value = number(row[key]); if (Number.isFinite(value)) return value; } } return NaN; }
function firstText(row, keys) { for (const key of keys) { if (row[key] !== undefined && String(row[key]).trim()) return String(row[key]).trim(); } return ''; }
function normalizeHeader(header) { return normalizeText(header).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function normalizeText(value) { return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function number(value) { const s = String(value === undefined || value === null ? '' : value).trim().replace(',', '.'); if (!s || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') return NaN; const parsed = Number(s); return Number.isFinite(parsed) ? parsed : NaN; }
function intNumber(value) { const parsed = number(value); return Number.isFinite(parsed) ? Math.round(parsed) : 0; }
function finiteOrNull(value) { return Number.isFinite(value) && value !== 0 ? value : null; }
function validTeff(value) { return Number.isFinite(value) && value >= 1200 && value <= 80000; }
function validLum(value) { return Number.isFinite(value) && value > 0 && value < 1e10; }
function pcToLy(pc) { return Number.isFinite(pc) && pc > 0 ? pc * 3.261563777 : null; }
function lumFromAbsMag(absMag) { return Number.isFinite(absMag) ? Math.pow(10, (4.83 - absMag) / 2.5) : NaN; }
function estimateTeff(ci, spect) { const bv = number(ci); if (Number.isFinite(bv) && bv > -0.5 && bv < 3.5) return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)); const letter = String(spect || '').trim().charAt(0).toUpperCase(); return ({ O: 32000, B: 18000, A: 8500, F: 6700, G: 5600, K: 4400, M: 3200, D: 12000 })[letter] || NaN; }
function classify(teff, lum, spect) { const s = String(spect || '').toUpperCase(); if (s.startsWith('D') || (lum < .3 && teff > 7000)) return 'white-dwarf'; if (lum > 1e4) return 'supergiant'; if (lum > 20 && teff < 6500) return 'giant'; return 'main-sequence'; }
function classFromStellarType(type, teff, lum) { const code = String(type || '').trim(); if (code === '2') return 'white-dwarf'; if (code === '4' || code === '5') return 'supergiant'; if (code === '3') return 'main-sequence'; return classify(teff, lum); }
function colorTemp(t) { const stops = [[2500,'#ff6b4a'],[3700,'#ff9b5f'],[5200,'#ffd08a'],[6000,'#fff1a8'],[7500,'#f5f8ff'],[10000,'#d8e9ff'],[40000,'#82adff']]; for (let i = 1; i < stops.length; i++) { if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0])); } return stops[stops.length - 1][1]; }
function colorNameToHex(name) { const key = normalizeText(name).replace(/[^a-z]/g, ''); const map = { red:'#ff6b4a', orange:'#ff9b5f', yellow:'#ffe89c', yellowwhite:'#fff4d4', white:'#f5f8ff', bluewhite:'#d8e9ff', blue:'#82adff', whitish:'#f5f8ff', pale:'#f5f8ff' }; return map[key] || null; }
function mix(a, b, u) { const h = x => [parseInt(x.slice(1,3),16), parseInt(x.slice(3,5),16), parseInt(x.slice(5,7),16)]; const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u, 0, 1))).toString(16).padStart(2, '0')).join(''); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, u) { return a + (b - a) * u; }
`;
  }
})();
