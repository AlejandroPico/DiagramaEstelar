'use strict';

(() => {
  const LARGE_DATASET_LIMIT = 5000;
  const VERY_LARGE_DATASET_LIMIT = 50000;

  if (!window.Worker) {
    ui.status.textContent = 'El navegador no soporta Web Workers. Se mantiene el importador básico.';
    return;
  }

  const originalSampleStars = sampleStars;
  const originalNearestStar = nearestStar;

  ui.csv.onchange = handleCatalogFiles;
  ui.status.textContent = 'Muestra local cargada. Importador avanzado listo para NASA, HYG/ATHYG, Gaia/Kaggle y CSV genéricos.';

  sampleStars = function sampleStarsFast() {
    if (!state.stars || state.stars.length <= LARGE_DATASET_LIMIT) {
      originalSampleStars();
      return;
    }

    const total = state.stars.length;
    const visible = getVisibleScreenBounds(26);
    const pointRadius = total > VERY_LARGE_DATASET_LIMIT ? 1.05 / state.scale : 1.45 / state.scale;
    const useRects = total > VERY_LARGE_DATASET_LIMIT || state.scale < 1.8;
    let drawn = 0;

    ctx.save();
    ctx.globalAlpha = total > VERY_LARGE_DATASET_LIMIT ? 0.58 : 0.74;

    for (const s of state.stars) {
      if (!s || !Number.isFinite(s.teff) || !Number.isFinite(s.luminosity)) continue;
      const x = tempX(s.teff);
      const y = lumY(s.luminosity);
      const sx = worldToScreenX(x);
      const sy = worldToScreenY(y);
      if (sx < visible.left || sx > visible.right || sy < visible.top || sy > visible.bottom) continue;

      ctx.fillStyle = s.color || colorTemp(s.teff);
      if (useRects) {
        ctx.fillRect(x - pointRadius, y - pointRadius, pointRadius * 2, pointRadius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      drawn++;
    }

    ctx.restore();

    if (state.hovered && state.stars.includes(state.hovered)) drawStar(state.hovered);
    if (state.selected && state.stars.includes(state.selected) && state.selected !== state.hovered) drawStar(state.selected);

    window.__hrLastDrawCount = drawn;
  };

  nearestStar = function nearestStarFast(p, th) {
    if (!state.stars || state.stars.length <= LARGE_DATASET_LIMIT) return originalNearestStar(p, th);

    let best = null;
    let bd = Infinity;
    const screenThreshold = Math.max(8, th * state.scale);
    const px = worldToScreenX(p.x);
    const py = worldToScreenY(p.y);

    for (const s of state.stars) {
      if (!s || !Number.isFinite(s.teff) || !Number.isFinite(s.luminosity)) continue;
      const sx = worldToScreenX(tempX(s.teff));
      const sy = worldToScreenY(lumY(s.luminosity));
      const d = Math.hypot(px - sx, py - sy);
      if (d < screenThreshold && d < bd) {
        best = s;
        bd = d;
      }
    }

    return best;
  };

  async function handleCatalogFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    ui.status.textContent = files.length === 1
      ? `Analizando ${files[0].name}…`
      : `Analizando ${files.length} catálogos…`;

    try {
      const imported = [];
      const summaries = [];

      for (let i = 0; i < files.length; i++) {
        const result = await parseWithWorker(files[i], i + 1, files.length);
        imported.push(...result.stars);
        summaries.push(result.meta);
      }

      const merged = mergeStars(imported);
      state.stars = merged;
      state.selected = null;
      state.hovered = null;
      state.layers.stars = true;
      ui.toggles.stars.checked = true;

      if (merged.length > 1500) {
        state.layers.synthetic = false;
        ui.toggles.synthetic.checked = false;
      }

      window.__hrDatasetMeta = { files: summaries, represented: merged.length };
      fit();
      draw();

      const represented = merged.length.toLocaleString('es-ES');
      const sourceNames = summaries.map(s => `${s.catalogLabel}: ${s.represented.toLocaleString('es-ES')}`).join(' · ');
      ui.status.textContent = `Importación completada. Estrellas representadas: ${represented}. ${sourceNames}`;
      closePanel();
    } catch (error) {
      console.error(error);
      ui.status.textContent = `Error al importar datos: ${error.message}`;
    } finally {
      event.target.value = '';
    }
  }

  function parseWithWorker(file, index, total) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' })));

      worker.onmessage = event => {
        const msg = event.data || {};
        if (msg.type === 'progress') {
          ui.status.textContent = total === 1
            ? msg.message
            : `[${index}/${total}] ${msg.message}`;
        } else if (msg.type === 'done') {
          worker.terminate();
          resolve(msg.payload);
        } else if (msg.type === 'error') {
          worker.terminate();
          reject(new Error(msg.message || 'Error desconocido en el worker.'));
        }
      };

      worker.onerror = error => {
        worker.terminate();
        reject(new Error(error.message || 'Error ejecutando el worker de importación.'));
      };

      worker.postMessage({ file });
    });
  }

  function getVisibleScreenBounds(pad = 0) {
    const a = chart.axis;
    return {
      left: a.left - pad,
      right: chart.width - a.right + pad,
      top: a.top - pad,
      bottom: chart.height - a.bottom + pad
    };
  }

  function mergeStars(stars) {
    const byKey = new Map();

    for (const star of stars) {
      if (!star || !Number.isFinite(star.teff) || !Number.isFinite(star.luminosity)) continue;
      const key = star.catalogKey || `${norm(star.name)}:${Math.round(star.teff)}:${star.luminosity.toExponential(3)}`;
      const previous = byKey.get(key);
      if (!previous) {
        byKey.set(key, star);
      } else {
        byKey.set(key, enrichStar(previous, star));
      }
    }

    return Array.from(byKey.values());
  }

  function enrichStar(a, b) {
    return {
      ...a,
      radius: a.radius || b.radius || null,
      mass: a.mass || b.mass || null,
      distance_ly: a.distance_ly || b.distance_ly || null,
      designation: a.designation || b.designation || '',
      notes: [a.notes, b.notes].filter(Boolean).join(' · '),
      source: Array.from(new Set([a.source, b.source].filter(Boolean))).join(' + '),
      planetCount: Math.max(Number(a.planetCount || 0), Number(b.planetCount || 0)) || undefined
    };
  }

  function workerSource() {
    return `
'use strict';
self.onmessage = async event => {
  try {
    const file = event.data.file;
    postMessage({ type: 'progress', message: 'Leyendo ' + file.name + '…' });
    const text = await file.text();
    postMessage({ type: 'progress', message: 'Detectando estructura de ' + file.name + '…' });
    const parsed = parseCatalog(text, file.name);
    postMessage({ type: 'done', payload: parsed });
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

    const star = normalizeRow(row, type, i, filename);
    if (!star) { skipped++; continue; }

    if (type.id === 'nasa_exoplanet_archive') {
      const hostKey = 'nasa:' + normalizeText(star.name);
      const existing = hostMap.get(hostKey);
      if (!existing) {
        hostMap.set(hostKey, star);
      } else {
        hostMap.set(hostKey, mergeHost(existing, star));
      }
    } else {
      stars.push(star);
    }
  }

  if (type.id === 'nasa_exoplanet_archive') stars.push(...hostMap.values());

  return {
    stars,
    meta: {
      file: filename,
      catalogId: type.id,
      catalogLabel: type.label,
      rows: rows.length,
      represented: stars.length,
      skipped
    }
  };
}

function prepareCsv(text) {
  const rawLines = text.replace(/^\\uFEFF/, '').split(/\\r?\\n/);
  const lines = rawLines.filter(line => line.trim() !== '');
  const headerIndex = lines.findIndex(line => !line.trim().startsWith('#'));
  if (headerIndex < 0) throw new Error('No se ha encontrado cabecera CSV.');
  const headerLine = lines[headerIndex];
  const delimiter = detectDelimiter(headerLine);
  const header = splitCsvLine(headerLine, delimiter);
  return { delimiter, header, lines: lines.slice(headerIndex + 1).filter(line => !line.trim().startsWith('#')) };
}

function detectDelimiter(line) {
  const options = [',',';','\\t','|'];
  let best = ',';
  let bestCount = -1;
  for (const sep of options) {
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
  const lowerName = filename.toLowerCase();
  if (has('hostname','st_teff','st_lum') || lowerName.startsWith('ps_')) return { id:'nasa_exoplanet_archive', label:'NASA Exoplanet Archive' };
  if (has('proper','spect','ci') && (headers.includes('lum') || headers.includes('absmag'))) return { id:'hyg_like', label: headers.includes('spect_src') ? 'ATHYG/HYG-like' : 'HYG' };
  if (headers.includes('temperature_k') && headers.includes('luminosity_l_lo')) return { id:'stellar_classification', label:'Stellar Classification / Kaggle' };
  if (headers.includes('teff_gspphot') || headers.includes('lum_flame')) return { id:'gaia_like', label:'Gaia-like' };
  return { id:'generic_hr_csv', label:'CSV HR genérico' };
}

function normalizeRow(row, type, index, filename) {
  if (type.id === 'nasa_exoplanet_archive') return normalizeNasa(row, index);
  if (type.id === 'hyg_like') return normalizeHyg(row, index, type.label);
  if (type.id === 'stellar_classification') return normalizeStellarClass(row, index);
  return normalizeGeneric(row, index, type.label || filename);
}

function normalizeNasa(row, index) {
  const teff = number(row.st_teff);
  const logLum = number(row.st_lum);
  if (!validTeff(teff) || !Number.isFinite(logLum)) return null;
  const lum = Math.pow(10, logLum);
  if (!validLum(lum)) return null;
  const name = row.hostname || row.pl_name || 'Estrella anfitriona ' + (index + 1);
  const planetName = row.pl_name || '';
  const planetCount = intNumber(row.sy_pnum) || (planetName ? 1 : 0);
  return star({
    name,
    teff,
    luminosity: lum,
    radius: number(row.st_rad),
    mass: number(row.st_mass),
    distance_ly: pcToLy(number(row.sy_dist)),
    designation: row.st_spectype || row.hd_name || row.hip_name || row.gaia_dr3_id || '',
    source: 'NASA Exoplanet Archive',
    catalogKey: 'nasa:' + normalizeText(name),
    className: classify(teff, lum),
    notes: planetName ? 'Anfitriona de exoplanetas. Ejemplo asociado: ' + planetName + '.' : 'Anfitriona de exoplanetas.',
    planetCount,
    color: colorTemp(teff)
  });
}

function mergeHost(a, b) {
  const planetCount = Math.max(a.planetCount || 0, b.planetCount || 0);
  return {
    ...a,
    radius: a.radius || b.radius || null,
    mass: a.mass || b.mass || null,
    distance_ly: a.distance_ly || b.distance_ly || null,
    designation: a.designation || b.designation || '',
    planetCount,
    notes: planetCount ? 'Anfitriona de ' + planetCount + ' planeta(s) confirmado(s) en el archivo importado.' : a.notes
  };
}

function normalizeHyg(row, index, label) {
  const lumDirect = number(row.lum);
  const absMag = number(row.absmag);
  const lum = validLum(lumDirect) ? lumDirect : lumFromAbsMag(absMag);
  const teff = validTeff(number(row.teff)) ? number(row.teff) : estimateTeff(row.ci, row.spect);
  if (!validTeff(teff) || !validLum(lum)) return null;
  const name = row.proper || makeHygName(row) || 'HYG ' + (row.id || index + 1);
  return star({
    name,
    teff,
    luminosity: lum,
    radius: null,
    mass: null,
    distance_ly: pcToLy(number(row.dist)),
    designation: row.spect || row.hd || row.hip || row.gl || '',
    source: label,
    catalogKey: 'hyg:' + (row.hip || row.hd || row.gl || row.id || normalizeText(name)),
    className: classify(teff, lum, row.spect),
    notes: 'Temperatura estimada desde índice B−V o clase espectral cuando no viene explícita.',
    color: colorTemp(teff)
  });
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

function normalizeStellarClass(row, index) {
  const teff = number(row.temperature_k);
  const lum = number(row.luminosity_l_lo);
  if (!validTeff(teff) || !validLum(lum)) return null;
  const spectral = row.spectral_class || '';
  const type = row.star_type || '';
  return star({
    name: 'Estrella clase ' + (type || spectral || index + 1),
    teff,
    luminosity: lum,
    radius: number(row.radius_r_ro),
    mass: null,
    distance_ly: null,
    designation: spectral,
    source: 'Stellar Classification / Kaggle',
    catalogKey: 'stellar-class:' + index,
    className: classFromStellarType(type, teff, lum),
    notes: row.star_color ? 'Color declarado: ' + row.star_color + '.' : '',
    color: colorNameToHex(row.star_color) || colorTemp(teff)
  });
}

function normalizeGeneric(row, index, label) {
  const teff = firstNumber(row, ['teff','temperature','temperature_k','effective_temperature','st_teff','teff_gspphot']);
  const directLum = firstNumber(row, ['luminosity','lum','luminosity_l_lo','stellar_luminosity','lum_flame']);
  const nasaLogLum = row.st_lum !== undefined ? number(row.st_lum) : NaN;
  const lum = validLum(directLum) ? directLum : Number.isFinite(nasaLogLum) ? Math.pow(10, nasaLogLum) : NaN;
  if (!validTeff(teff) || !validLum(lum)) return null;
  const name = firstText(row, ['name','star_name','source_id','designation','hostname','proper']) || 'Estrella ' + (index + 1);
  return star({
    name,
    teff,
    luminosity: lum,
    radius: firstNumber(row, ['radius','st_rad','radius_solar','radius_r_ro']),
    mass: firstNumber(row, ['mass','st_mass','mass_solar']),
    distance_ly: firstNumber(row, ['distance_ly','dist_ly']) || pcToLy(firstNumber(row, ['distance','dist','sy_dist'])),
    designation: firstText(row, ['spectral_type','spectral','sp_type','designation','spect']) || '',
    source: label,
    catalogKey: 'generic:' + normalizeText(name) + ':' + index,
    className: classify(teff, lum),
    notes: '',
    color: colorTemp(teff)
  });
}

function star(data) {
  return {
    name: data.name,
    designation: data.designation || '',
    class: data.className || classify(data.teff, data.luminosity),
    teff: data.teff,
    luminosity: data.luminosity,
    radius: finiteOrNull(data.radius),
    mass: finiteOrNull(data.mass),
    distance_ly: finiteOrNull(data.distance_ly),
    color: data.color || colorTemp(data.teff),
    source: data.source || 'CSV importado',
    notes: data.notes || '',
    catalogKey: data.catalogKey || '',
    planetCount: data.planetCount || undefined,
    marker: clamp(4.2 + Math.log10(data.luminosity + .0002) * .75, 3.1, 8.5)
  };
}

function firstNumber(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined) {
      const n = number(row[key]);
      if (Number.isFinite(n)) return n;
    }
  }
  return NaN;
}

function firstText(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && String(row[key]).trim()) return String(row[key]).trim();
  }
  return '';
}

function normalizeHeader(h) {
  return normalizeText(h).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
}

function number(value) {
  const s = String(value === undefined || value === null ? '' : value).trim().replace(',', '.');
  if (!s || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function intNumber(value) {
  const n = number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function finiteOrNull(value) {
  return Number.isFinite(value) && value !== 0 ? value : null;
}

function validTeff(value) { return Number.isFinite(value) && value >= 1200 && value <= 80000; }
function validLum(value) { return Number.isFinite(value) && value > 0 && value < 1e10; }
function pcToLy(pc) { return Number.isFinite(pc) && pc > 0 ? pc * 3.261563777 : null; }
function lumFromAbsMag(absMag) { return Number.isFinite(absMag) ? Math.pow(10, (4.83 - absMag) / 2.5) : NaN; }

function estimateTeff(ci, spect) {
  const bv = number(ci);
  if (Number.isFinite(bv) && bv > -0.5 && bv < 3.5) {
    return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  }
  const letter = String(spect || '').trim().charAt(0).toUpperCase();
  return ({ O: 32000, B: 18000, A: 8500, F: 6700, G: 5600, K: 4400, M: 3200, D: 12000 })[letter] || NaN;
}

function classify(teff, lum, spect) {
  const s = String(spect || '').toUpperCase();
  if (s.startsWith('D') || (lum < .3 && teff > 7000)) return 'white-dwarf';
  if (lum > 1e4) return 'supergiant';
  if (lum > 20 && teff < 6500) return 'giant';
  return 'main-sequence';
}

function classFromStellarType(type, teff, lum) {
  const code = String(type || '').trim();
  if (code === '2') return 'white-dwarf';
  if (code === '4' || code === '5') return 'supergiant';
  if (code === '3') return 'main-sequence';
  return classify(teff, lum);
}

function colorTemp(t) {
  const stops = [[2500,'#ff6b4a'],[3700,'#ff9b5f'],[5200,'#ffd08a'],[6000,'#fff1a8'],[7500,'#f5f8ff'],[10000,'#d8e9ff'],[40000,'#82adff']];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  }
  return stops[stops.length - 1][1];
}

function colorNameToHex(name) {
  const key = normalizeText(name).replace(/[^a-z]/g, '');
  const map = {
    red:'#ff6b4a', orange:'#ff9b5f', yellow:'#ffe89c', yellowwhite:'#fff4d4', white:'#f5f8ff', bluewhite:'#d8e9ff', blue:'#82adff', whitish:'#f5f8ff', pale:'#f5f8ff'
  };
  return map[key] || null;
}

function mix(a, b, u) {
  const h = x => [parseInt(x.slice(1,3),16), parseInt(x.slice(3,5),16), parseInt(x.slice(5,7),16)];
  const A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u, 0, 1))).toString(16).padStart(2, '0')).join('');
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, u) { return a + (b - a) * u; }
`;
  }
})();
