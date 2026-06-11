'use strict';

const canvas = document.getElementById('hrCanvas');
const ctx = canvas.getContext('2d');
const viewport = document.getElementById('viewport');
const sidePanel = document.getElementById('sidePanel');
const panelBackdrop = document.getElementById('panelBackdrop');
const cursorHud = document.getElementById('cursorHud');
const infoCard = document.getElementById('infoCard');
const loadingOverlay = document.getElementById('loadingOverlay');

const ui = {
  menu: document.getElementById('menuButton'),
  closePanel: document.getElementById('closePanelButton'),
  closeCard: document.getElementById('closeCardButton'),
  fit: document.getElementById('fitButton'),
  reset: document.getElementById('resetButton'),
  zoomIn: document.getElementById('zoomInButton'),
  zoomOut: document.getElementById('zoomOutButton'),
  zoomValue: document.getElementById('zoomValue'),
  theme: document.getElementById('themeButton'),
  density: document.getElementById('densityButton'),
  searchInput: document.getElementById('searchInput'),
  search: document.getElementById('searchButton'),
  csv: document.getElementById('csvInput'),
  status: document.getElementById('dataStatus'),
  toggles: {
    stars: document.getElementById('starsToggle'),
    synthetic: document.getElementById('syntheticToggle'),
    regions: document.getElementById('regionsToggle'),
    labels: document.getElementById('labelsToggle'),
    grid: document.getElementById('gridToggle'),
    animation: document.getElementById('animationToggle')
  },
  cardKicker: document.getElementById('cardKicker'),
  cardTitle: document.getElementById('cardTitle'),
  cardSubtitle: document.getElementById('cardSubtitle'),
  cardMetrics: document.getElementById('cardMetrics'),
  cardDescription: document.getElementById('cardDescription'),
  cardNotes: document.getElementById('cardNotes')
};

const chart = {
  width: 1280,
  height: 720,
  minTemp: 2500,
  maxTemp: 40000,
  minLum: 1e-4,
  maxLum: 1e6,
  minScale: 1,
  maxScale: 48,
  axis: { left: 92, right: 18, top: 14, bottom: 64 },
  worldPlot: { x: 92, y: 14, w: 1170, h: 642 }
};

const state = {
  stars: [],
  synthetic: [],
  scale: 1,
  fitScale: 1,
  tx: 0,
  ty: 0,
  dragging: false,
  dragStart: null,
  selected: null,
  hovered: null,
  density: false,
  frame: 0,
  layers: { stars: true, synthetic: true, regions: true, labels: true, grid: true, animation: true }
};

const spectralBands = [
  ['O', 30000, 40000, '#8fb8ff'],
  ['B', 10000, 30000, '#a9cfff'],
  ['A', 7500, 10000, '#d8eaff'],
  ['F', 6000, 7500, '#fff4d4'],
  ['G', 5200, 6000, '#ffe89c'],
  ['K', 3700, 5200, '#ffbd73'],
  ['M', 2500, 3700, '#ff7c58']
];

const regions = [
  zone('main-sequence', 'Secuencia principal', 'Fusión estable de hidrógeno en el núcleo', '#fff0a3', [[33000,220000],[22000,42000],[11000,420],[7500,24],[5800,1.1],[4400,.08],[3000,.00045],[2650,.00012],[3300,.004],[5000,.23],[7000,5.5],[12000,210],[26000,65000],[38000,560000]], 'La secuencia principal es la diagonal dominante del diagrama HR. En ella las estrellas generan energía mediante fusión de hidrógeno. Las estrellas calientes y masivas aparecen arriba a la izquierda; las enanas rojas, frías y poco luminosas, aparecen abajo a la derecha.', [['Temperatura','≈ 2.700–40.000 K'],['Luminosidad','≈ 10⁻⁴–10⁶ L☉'],['Ejemplos','Sol, Vega, Sirio A'],['Estado','Etapa más larga']]),
  zone('red-giants', 'Gigantes rojas y naranjas', 'Estrellas evolucionadas de gran radio', '#ff9f5a', [[5600,18],[5000,35],[4300,95],[3600,650],[3100,2400],[3300,7600],[4200,3200],[5200,520],[6000,120]], 'Las gigantes han abandonado la secuencia principal. Su superficie puede ser fría, pero su radio crece tanto que la luminosidad aumenta de manera notable.', [['Temperatura','≈ 3.000–5.500 K'],['Luminosidad','≈ 20–10.000 L☉'],['Ejemplos','Arcturus, Aldebarán'],['Clave física','Radio muy grande']]),
  zone('supergiants', 'Supergigantes', 'Extremo superior de luminosidad estelar', '#ff6b6b', [[36000,900000],[25000,460000],[13000,190000],[8000,160000],[4800,230000],[3200,90000],[3600,24000],[6200,38000],[16000,74000],[33000,280000]], 'Las supergigantes ocupan la parte alta del diagrama. Pueden ser azules, blancas, amarillas o rojas, pero comparten una luminosidad intrínseca enorme.', [['Temperatura','≈ 3.000–35.000 K'],['Luminosidad','≈ 10⁴–10⁶ L☉'],['Ejemplos','Rigel, Deneb, Betelgeuse'],['Evolución','Alta masa']]),
  zone('white-dwarfs', 'Enanas blancas', 'Remanentes estelares compactos', '#a8d8ff', [[38000,.25],[25000,.08],[15000,.012],[9000,.0015],[6200,.00025],[5200,.00012],[7600,.0005],[14000,.003],[30000,.06]], 'Las enanas blancas son muy calientes al nacer, pero tienen radios planetarios. Por eso aparecen abajo a la izquierda: temperatura alta, luminosidad baja.', [['Temperatura','≈ 5.000–40.000 K'],['Luminosidad','≈ 10⁻⁴–1 L☉'],['Ejemplos','Sirio B, Procyon B'],['Naturaleza','Remanente compacto']]),
  zone('instability-strip', 'Franja de inestabilidad', 'Zona asociada a variables pulsantes', '#c7a1ff', [[8200,.45],[7200,1.2],[6500,20],[5900,900],[5200,18000],[4600,52000],[5100,80000],[6100,3500],[7000,80],[9000,2.2]], 'La franja de inestabilidad agrupa regiones donde ciertas estrellas pueden pulsar. Es importante para variables como Cefeidas y RR Lyrae.', [['Temperatura','≈ 4.600–9.000 K'],['Interés','Variables pulsantes'],['Ejemplos','Cefeidas, RR Lyrae'],['Uso','Distancias cósmicas']])
];

init();

async function init() {
  resize();
  updateChartMetrics();
  makeSynthetic();
  bind();
  await loadStars();
  fit();
  loadingOverlay.classList.add('hidden');
  requestAnimationFrame(loop);
}

function zone(id, name, subtitle, color, points, description, metrics) {
  return { id, name, subtitle, color, points, description, metrics };
}

async function loadStars() {
  try {
    const res = await fetch('data/stars.sample.json', { cache: 'no-store' });
    const data = await res.json();
    state.stars = data.map(normalizeStar).filter(Boolean);
    ui.status.textContent = `Muestra cargada: ${state.stars.length} estrellas pedagógicas.`;
  } catch (error) {
    state.stars = [{
      name: 'Sol',
      designation: 'G2V',
      class: 'main-sequence',
      teff: 5772,
      luminosity: 1,
      radius: 1,
      color: '#fff3b0',
      source: 'Reserva interna',
      notes: 'Referencia solar.'
    }].map(normalizeStar);
    ui.status.textContent = 'No se pudo cargar el JSON; usando muestra interna mínima.';
  }
  draw();
}

function bind() {
  addEventListener('resize', () => {
    resize();
    clampView();
    draw();
  });

  ui.menu.onclick = openPanel;
  ui.closePanel.onclick = closePanel;
  panelBackdrop.onclick = closePanel;
  ui.closeCard.onclick = () => hideCard();
  ui.fit.onclick = () => fit();
  ui.reset.onclick = () => { hideCard(); state.selected = null; fit(); };
  ui.zoomIn.onclick = () => zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.22);
  ui.zoomOut.onclick = () => zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.22);

  ui.theme.onclick = () => {
    document.body.classList.toggle('dark');
    ui.theme.textContent = document.body.classList.contains('dark') ? 'Modo claro' : 'Modo oscuro';
    draw();
  };

  ui.density.onclick = () => {
    state.density = !state.density;
    ui.density.textContent = state.density ? 'Puntos' : 'Densidad';
    draw();
  };

  Object.entries(ui.toggles).forEach(([key, input]) => {
    input.onchange = () => { state.layers[key] = input.checked; draw(); };
  });

  ui.search.onclick = runSearch;
  ui.searchInput.onkeydown = e => { if (e.key === 'Enter') runSearch(); };
  ui.csv.onchange = importCsv;

  viewport.onpointerdown = e => {
    state.dragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty };
    viewport.classList.add('dragging');
  };

  addEventListener('pointermove', e => {
    if (!state.dragging) return;
    state.tx = state.dragStart.tx + e.clientX - state.dragStart.x;
    state.ty = state.dragStart.ty + e.clientY - state.dragStart.y;
    clampView();
    draw();
  });

  addEventListener('pointerup', () => {
    state.dragging = false;
    state.dragStart = null;
    viewport.classList.remove('dragging');
  });

  viewport.onwheel = e => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * .0014));
  };

  viewport.onclick = clickCanvas;
  viewport.onmousemove = hoverCanvas;
  viewport.onmouseleave = () => { state.hovered = null; cursorHud.classList.remove('visible'); draw(); };
}

function openPanel() {
  sidePanel.classList.add('open');
  panelBackdrop.classList.add('open');
  sidePanel.setAttribute('aria-hidden', 'false');
}

function closePanel() {
  sidePanel.classList.remove('open');
  panelBackdrop.classList.remove('open');
  sidePanel.setAttribute('aria-hidden', 'true');
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2.5);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  updateChartMetrics();
}

function updateChartMetrics() {
  const w = Math.max(320, canvas.clientWidth || innerWidth || 1280);
  const h = Math.max(320, canvas.clientHeight || innerHeight || 720);
  const compact = w < 720;

  chart.width = w;
  chart.height = h;
  chart.axis = {
    left: compact ? 72 : 92,
    right: compact ? 10 : 18,
    top: compact ? 10 : 14,
    bottom: compact ? 58 : 64
  };
  chart.worldPlot = {
    x: chart.axis.left,
    y: chart.axis.top,
    w: Math.max(180, w - chart.axis.left - chart.axis.right),
    h: Math.max(180, h - chart.axis.top - chart.axis.bottom)
  };
}

function fit() {
  updateChartMetrics();
  state.fitScale = 1;
  state.scale = 1;
  state.tx = 0;
  state.ty = 0;
  updateZoom();
  draw();
}

function zoomAt(cx, cy, factor) {
  const rect = canvas.getBoundingClientRect();
  const x = cx - rect.left;
  const y = cy - rect.top;
  const wx = (x - state.tx) / state.scale;
  const wy = (y - state.ty) / state.scale;

  state.scale = clamp(state.scale * factor, chart.minScale, chart.maxScale);
  state.tx = x - wx * state.scale;
  state.ty = y - wy * state.scale;

  clampView();
  updateZoom();
  draw();
}

function clampView() {
  if (state.scale <= chart.minScale + 1e-6) {
    state.scale = chart.minScale;
    state.tx = 0;
    state.ty = 0;
    updateZoom();
    return;
  }

  const a = chart.axis;
  const p = chart.worldPlot;
  const vl = a.left;
  const vr = chart.width - a.right;
  const vt = a.top;
  const vb = chart.height - a.bottom;

  state.tx = clamp(state.tx, vr - (p.x + p.w) * state.scale, vl - p.x * state.scale);
  state.ty = clamp(state.ty, vb - (p.y + p.h) * state.scale, vt - p.y * state.scale);
}

function updateZoom() {
  ui.zoomValue.textContent = `${Math.round(state.scale / state.fitScale * 100)}%`;
}

function loop() {
  if (state.layers.animation) {
    state.frame++;
    draw();
  }
  requestAnimationFrame(loop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawBackground();
  drawWorldClipped();
  drawAxesOverlay();
}

function drawBackground() {
  const base = ctx.createLinearGradient(0, 0, chart.width, chart.height);
  if (document.body.classList.contains('dark')) {
    base.addColorStop(0, '#080b12');
    base.addColorStop(.55, '#11182a');
    base.addColorStop(1, '#1b1020');
  } else {
    base.addColorStop(0, '#f8f4ec');
    base.addColorStop(.55, '#efe7d9');
    base.addColorStop(1, '#f4dcc8');
  }

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, chart.width, chart.height);

  const p = chart.worldPlot;
  const g = ctx.createRadialGradient(p.x + p.w * .12, p.y + p.h * .1, 0, p.x + p.w * .12, p.y + p.h * .1, Math.max(p.w, p.h));
  g.addColorStop(0, document.body.classList.contains('dark') ? 'rgba(116,154,255,.18)' : 'rgba(116,154,255,.25)');
  g.addColorStop(.45, 'rgba(255,224,135,.11)');
  g.addColorStop(1, 'rgba(255,112,78,.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, chart.width, chart.height);
}

function drawWorldClipped() {
  const a = chart.axis;
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.left, a.top, chart.width - a.left - a.right, chart.height - a.top - a.bottom);
  ctx.clip();
  ctx.translate(state.tx, state.ty);
  ctx.scale(state.scale, state.scale);

  bands();
  if (state.layers.grid) grid();
  if (state.layers.regions) drawRegions();
  if (state.layers.synthetic) state.density ? density() : synthetic();
  if (state.layers.stars) sampleStars();
  if (state.layers.labels) labels();

  ctx.restore();
}

function bands() {
  const p = chart.worldPlot;
  for (const [lab, min, max, col] of spectralBands) {
    const x1 = tempX(max);
    const x2 = tempX(min);
    ctx.fillStyle = alpha(col, .10);
    ctx.fillRect(x1, p.y, x2 - x1, p.h);
  }
}

function grid() {
  const p = chart.worldPlot;
  const ticks = getDynamicTicks();

  ctx.lineWidth = 1 / state.scale;

  ticks.xMinor.forEach(t => {
    const x = tempX(t);
    ctx.strokeStyle = alpha(css('--ink'), .055);
    line(x, p.y, x, p.y + p.h);
  });

  ticks.yMinor.forEach(l => {
    const y = lumY(l);
    ctx.strokeStyle = alpha(css('--ink'), .055);
    line(p.x, y, p.x + p.w, y);
  });

  ticks.xMajor.forEach(t => {
    const x = tempX(t);
    ctx.strokeStyle = alpha(css('--ink'), .13);
    line(x, p.y, x, p.y + p.h);
  });

  ticks.yMajor.forEach(l => {
    const y = lumY(l);
    ctx.strokeStyle = alpha(css('--ink'), .13);
    line(p.x, y, p.x + p.w, y);
  });
}

function drawAxesOverlay() {
  const a = chart.axis;
  const pl = a.left;
  const pr = chart.width - a.right;
  const pt = a.top;
  const pb = chart.height - a.bottom;
  const panel = document.body.classList.contains('dark') ? 'rgba(8,11,18,.88)' : 'rgba(248,244,236,.88)';
  const ticks = getDynamicTicks();

  ctx.save();
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, a.left, chart.height);
  ctx.fillRect(0, pb, chart.width, a.bottom);

  ctx.strokeStyle = alpha(css('--ink'), .72);
  ctx.lineWidth = 1.35;
  line(pl, pt, pl, pb);
  line(pl, pb, pr, pb);

  ctx.font = `800 ${chart.width < 720 ? 10 : 12}px system-ui`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = alpha(css('--ink'), .78);
  ctx.strokeStyle = alpha(css('--ink'), .45);
  ctx.lineWidth = 1;

  ticks.xMinor.forEach(t => {
    const sx = worldToScreenX(tempX(t));
    if (sx < pl - 1 || sx > pr + 1) return;
    line(sx, pb, sx, pb + 4);
  });

  ticks.yMinor.forEach(l => {
    const sy = worldToScreenY(lumY(l));
    if (sy < pt - 1 || sy > pb + 1) return;
    line(pl - 4, sy, pl, sy);
  });

  ticks.xMajor.forEach(t => {
    const sx = worldToScreenX(tempX(t));
    if (sx < pl - 1 || sx > pr + 1) return;
    line(sx, pb, sx, pb + 8);
    ctx.textAlign = 'center';
    ctx.fillText(formatTempTick(t), sx, pb + 23);
  });

  ticks.yMajor.forEach(l => {
    const sy = worldToScreenY(lumY(l));
    if (sy < pt - 1 || sy > pb + 1) return;
    line(pl - 8, sy, pl, sy);
    ctx.textAlign = 'right';
    ctx.fillText(formatLumTick(l), pl - 11, sy);
  });

  ctx.fillStyle = css('--ink');
  ctx.font = `900 ${chart.width < 720 ? 12 : 14}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Temperatura efectiva superficial, K  ⟵ más fría', pl + (pr - pl) / 2, chart.height - 18);

  ctx.save();
  ctx.translate(chart.width < 720 ? 19 : 26, pt + (pb - pt) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Luminosidad relativa al Sol, L☉', 0, 0);
  ctx.restore();

  ctx.font = `900 ${chart.width < 720 ? 18 : 22}px system-ui`;
  ctx.textAlign = 'center';
  spectralBands.forEach(([lab, min, max, col]) => {
    const mid = (worldToScreenX(tempX(max)) + worldToScreenX(tempX(min))) / 2;
    if (mid < pl || mid > pr) return;
    ctx.fillStyle = alpha(col, .95);
    ctx.fillText(lab, mid, pb + 44);
  });

  ctx.restore();
}

function getDynamicTicks() {
  const viewportData = getVisibleDataRanges();
  return {
    xMajor: buildTemperatureTicks(viewportData.tempMin, viewportData.tempMax, 74, true),
    xMinor: buildTemperatureTicks(viewportData.tempMin, viewportData.tempMax, 30, false),
    yMajor: buildLuminosityTicks(viewportData.lumMin, viewportData.lumMax, 58),
    yMinor: buildLuminosityTicks(viewportData.lumMin, viewportData.lumMax, 24)
  };
}

function getVisibleDataRanges() {
  const a = chart.axis;
  const pl = a.left;
  const pr = chart.width - a.right;
  const pt = a.top;
  const pb = chart.height - a.bottom;

  const t1 = tempFromWorldX(screenToWorldX(pl));
  const t2 = tempFromWorldX(screenToWorldX(pr));
  const l1 = lumFromWorldY(screenToWorldY(pt));
  const l2 = lumFromWorldY(screenToWorldY(pb));

  return {
    tempMin: clamp(Math.min(t1, t2), chart.minTemp, chart.maxTemp),
    tempMax: clamp(Math.max(t1, t2), chart.minTemp, chart.maxTemp),
    lumMin: clamp(Math.min(l1, l2), chart.minLum, chart.maxLum),
    lumMax: clamp(Math.max(l1, l2), chart.minLum, chart.maxLum)
  };
}

function buildTemperatureTicks(min, max, minPx, labeled) {
  const range = Math.max(1, max - min);
  const targetCount = Math.max(2, Math.floor((chart.width - chart.axis.left - chart.axis.right) / minPx));
  const step = niceLinearStep(range / targetCount);
  const start = Math.ceil(min / step) * step;
  const out = [];

  for (let v = start; v <= max + step * .25; v += step) {
    const rounded = roundToStep(v, step);
    if (rounded < chart.minTemp || rounded > chart.maxTemp) continue;
    const sx = worldToScreenX(tempX(rounded));
    if (sx < chart.axis.left - 4 || sx > chart.width - chart.axis.right + 4) continue;
    out.push(rounded);
  }

  return enforcePixelSpacing(out, v => worldToScreenX(tempX(v)), labeled ? minPx : minPx * .65);
}

function buildLuminosityTicks(min, max, minPx) {
  const values = [];
  const logMin = Math.floor(Math.log10(min)) - 1;
  const logMax = Math.ceil(Math.log10(max)) + 1;
  const multipliers = state.scale > 14
    ? [1,1.1,1.2,1.3,1.4,1.5,1.6,1.8,2,2.2,2.5,3,3.5,4,4.5,5,6,7,8,9]
    : state.scale > 5
      ? [1,1.2,1.5,2,2.5,3,4,5,6,7,8,9]
      : [1,2,3,5,7];

  for (let e = logMin; e <= logMax; e++) {
    for (const m of multipliers) {
      const v = m * 10 ** e;
      if (v >= min * .999 && v <= max * 1.001 && v >= chart.minLum && v <= chart.maxLum) values.push(v);
    }
  }

  values.sort((a, b) => a - b);
  return enforcePixelSpacing(uniqueNumbers(values), v => worldToScreenY(lumY(v)), minPx);
}

function enforcePixelSpacing(values, pixelFn, minPx) {
  const sorted = values.slice().sort((a, b) => pixelFn(a) - pixelFn(b));
  const out = [];
  let last = -Infinity;

  for (const value of sorted) {
    const px = pixelFn(value);
    if (Math.abs(px - last) >= minPx) {
      out.push(value);
      last = px;
    }
  }

  return out.sort((a, b) => a - b);
}

function uniqueNumbers(values) {
  const seen = new Set();
  const out = [];
  values.forEach(v => {
    const key = v.toPrecision(12);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(v);
  });
  return out;
}

function niceLinearStep(raw) {
  const exp = Math.floor(Math.log10(raw));
  const f = raw / 10 ** exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * 10 ** exp;
}

function roundToStep(value, step) {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 2);
  return Number(value.toFixed(decimals));
}

function drawRegions() {
  regions.forEach(r => {
    const pts = r.points.map(([t, l]) => [tempX(t), lumY(l)]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    const hot = state.hovered === r || state.selected === r;
    ctx.fillStyle = alpha(r.color, hot ? .25 : .14);
    ctx.strokeStyle = alpha(r.color, hot ? .9 : .45);
    ctx.lineWidth = (hot ? 3 : 2) / state.scale;
    ctx.fill();
    ctx.stroke();
  });
}

function synthetic() {
  state.synthetic.forEach(s => {
    const pulse = .75 + .25 * Math.sin(state.frame * .025 + s.seed);
    dot(tempX(s.teff), lumY(s.luminosity), s.r / state.scale, alpha(s.color, s.a * pulse));
  });
}

function density() {
  ctx.globalCompositeOperation = document.body.classList.contains('dark') ? 'screen' : 'multiply';
  state.synthetic.forEach(s => {
    const x = tempX(s.teff);
    const y = lumY(s.luminosity);
    const r = 16 / state.scale;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, alpha(s.color, .05));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}

function sampleStars() {
  state.stars.forEach(s => drawStar(s));
}

function drawStar(s) {
  const x = tempX(s.teff);
  const y = lumY(s.luminosity);
  const hot = state.hovered === s || state.selected === s;
  const r = (hot ? 8 : s.marker) / state.scale;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 7);

  g.addColorStop(0, alpha(s.color, hot ? .48 : .25));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 7, 0, Math.PI * 2);
  ctx.fill();

  dot(x, y, r, s.color);
  ctx.strokeStyle = document.body.classList.contains('dark') ? 'rgba(255,255,255,.85)' : 'rgba(20,20,20,.65)';
  ctx.lineWidth = (hot ? 2.5 : 1.3) / state.scale;
  ctx.stroke();

  if (hot || state.scale > 1.9) {
    ctx.font = `900 ${Math.max(13, 16 / state.scale)}px system-ui`;
    ctx.fillStyle = css('--ink');
    ctx.strokeStyle = css('--panel-solid');
    ctx.lineWidth = 4 / state.scale;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.strokeText(s.name, x + r + 8 / state.scale, y);
    ctx.fillText(s.name, x + r + 8 / state.scale, y);
  }
}

function labels() {
  [
    ['Secuencia principal', 7600, 8, -22, '#b99600'],
    ['Gigantes', 4300, 900, -8, '#ff9f5a'],
    ['Supergigantes', 8600, 140000, 0, '#ff6b6b'],
    ['Enanas blancas', 18000, .006, -15, '#73bfff'],
    ['Franja de inestabilidad', 6200, 1200, -71, '#a985ff']
  ].forEach(([txt, t, l, a, c]) => {
    ctx.save();
    ctx.translate(tempX(t), lumY(l));
    ctx.rotate(a * Math.PI / 180);
    ctx.font = `900 ${Math.max(17, Math.min(27, chart.width / 58)) / state.scale}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = alpha(css('--panel-solid'), .8);
    ctx.lineWidth = 8 / state.scale;
    ctx.fillStyle = c;
    ctx.globalAlpha = .75;
    ctx.strokeText(txt, 0, 0);
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  });
}

function clickCanvas(e) {
  if (state.dragStart && Math.abs(e.clientX - state.dragStart.x) + Math.abs(e.clientY - state.dragStart.y) > 5) return;
  const p = screen(e);
  const s = nearestStar(p, 15 / state.scale);
  if (s) {
    state.selected = s;
    cardStar(s);
    draw();
    return;
  }
  const r = regionAt(p);
  if (r) {
    state.selected = r;
    cardRegion(r);
    draw();
  }
}

function hoverCanvas(e) {
  const p = screen(e);
  const s = nearestStar(p, 13 / state.scale);
  const r = s ? null : regionAt(p);
  state.hovered = s || r;

  if (state.hovered) {
    cursorHud.textContent = s ? `${s.name} · ${fmtTemp(s.teff)} · ${fmtLum(s.luminosity)}` : r.name;
    cursorHud.classList.add('visible');
  } else {
    cursorHud.classList.remove('visible');
  }

  draw();
}

function screen(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left - state.tx) / state.scale,
    y: (e.clientY - r.top - state.ty) / state.scale
  };
}

function screenToWorldX(x) { return (x - state.tx) / state.scale; }
function screenToWorldY(y) { return (y - state.ty) / state.scale; }
function worldToScreenX(x) { return state.tx + x * state.scale; }
function worldToScreenY(y) { return state.ty + y * state.scale; }

function nearestStar(p, th) {
  let best = null;
  let bd = Infinity;
  state.stars.forEach(s => {
    const d = Math.hypot(p.x - tempX(s.teff), p.y - lumY(s.luminosity));
    if (d < th && d < bd) {
      best = s;
      bd = d;
    }
  });
  return best;
}

function regionAt(p) {
  const a = chart.axis;
  const sx = worldToScreenX(p.x);
  const sy = worldToScreenY(p.y);
  if (sx < a.left || sx > chart.width - a.right || sy < a.top || sy > chart.height - a.bottom) return null;

  for (let i = regions.length - 1; i >= 0; i--) {
    const poly = regions[i].points.map(([t, l]) => [tempX(t), lumY(l)]);
    if (inPoly(p, poly)) return regions[i];
  }
  return null;
}

function inPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (((yi > p.y) !== (yj > p.y)) && p.x < (xj - xi) * (p.y - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

function cardRegion(r) {
  card('Zona seleccionada', r.name, r.subtitle, r.metrics, r.description, [
    'La región está dibujada de forma pedagógica; no es una frontera observacional exacta.',
    'En próximas versiones se podrá sustituir por densidades de Gaia DR3.'
  ]);
}

function cardStar(s) {
  card(labelClass(s.class), s.name, `${s.designation || 'Tipo espectral no indicado'} · ${fmtTemp(s.teff)} · ${fmtLum(s.luminosity)}`, [
    ['Temperatura', fmtTemp(s.teff)],
    ['Luminosidad', fmtLum(s.luminosity)],
    ['Radio', s.radius ? `${num(s.radius)} R☉` : '—'],
    ['Clase', labelClass(s.class)]
  ], s.notes || 'Estrella de la muestra actual.', [
    `Fuente: ${s.source || 'Dataset local'}.`,
    'Coordenadas HR: temperatura logarítmica invertida y luminosidad logarítmica.'
  ]);
}

function card(kicker, title, subtitle, metrics, description, notes) {
  ui.cardKicker.textContent = kicker;
  ui.cardTitle.textContent = title;
  ui.cardSubtitle.textContent = subtitle;
  ui.cardMetrics.innerHTML = metrics.map(([a, b]) => `<div class="metric"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join('');
  ui.cardDescription.textContent = description;
  ui.cardNotes.innerHTML = notes.map(n => `<div class="note-pill">${esc(n)}</div>`).join('');
  infoCard.classList.add('open');
}

function hideCard() {
  infoCard.classList.remove('open');
}

function runSearch() {
  const q = norm(ui.searchInput.value);
  if (!q) return;

  const s = state.stars.find(x => norm(`${x.name} ${x.designation} ${x.class} ${labelClass(x.class)}`).includes(q));
  if (s) {
    focus(s.teff, s.luminosity);
    state.selected = s;
    cardStar(s);
    closePanel();
    return;
  }

  const r = regions.find(x => norm(`${x.name} ${x.subtitle}`).includes(q));
  if (r) {
    const c = center(r);
    focus(c.t, c.l, 1.8);
    state.selected = r;
    cardRegion(r);
    closePanel();
  } else {
    ui.status.textContent = `No se encontró “${ui.searchInput.value}”. Prueba con Sol, Vega, gigante o enana blanca.`;
  }
}

function focus(t, l, z = 2.8) {
  state.scale = clamp(z, chart.minScale, chart.maxScale);
  state.tx = canvas.clientWidth / 2 - tempX(t) * state.scale;
  state.ty = (canvas.clientHeight - chart.axis.bottom) / 2 - lumY(l) * state.scale;
  clampView();
  updateZoom();
  draw();
}

function center(r) {
  const n = r.points.length;
  const a = r.points.reduce((p, [t, l]) => [p[0] + Math.log10(t), p[1] + Math.log10(l)], [0, 0]);
  return { t: 10 ** (a[0] / n), l: 10 ** (a[1] / n) };
}

async function importCsv(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;

  try {
    const rows = parseCsv(await f.text());
    const stars = rows.map(x => normalizeStar(x, true)).filter(Boolean);
    if (!stars.length) throw Error('faltan temperatura y luminosidad.');
    state.stars = stars;
    ui.status.textContent = `CSV importado: ${stars.length} estrellas.`;
    draw();
  } catch (err) {
    ui.status.textContent = `Error al importar CSV: ${err.message}`;
  }
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  const head = split(lines[0], sep).map(h => norm(h).replace(/[^a-z0-9]+/g, '_'));
  return lines.slice(1).map(l => Object.fromEntries(split(l, sep).map((v, i) => [head[i], v])));
}

function split(line, sep) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') q = !q;
    else if (ch === sep && !q) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeStar(raw, imported = false) {
  const g = (...ks) => ks.map(k => raw[k]).find(v => v !== undefined && String(v).trim() !== '') || '';
  const teff = +String(g('teff','temperature','temperature_k','effective_temperature','st_teff','teff_gspphot')).replace(',', '.');
  const lum = +String(g('luminosity','lum','lum_val','stellar_luminosity','st_lum')).replace(',', '.');
  if (!teff || !lum) return null;

  const name = String(g('name','star_name','source_id','designation') || 'Estrella sin nombre');
  const cl = imported ? classify(teff, lum) : String(g('class','type') || classify(teff, lum));

  return {
    name,
    designation: String(g('designation','spectral_type','spectral','sp_type') || ''),
    class: cl,
    teff,
    luminosity: lum,
    radius: opt(g('radius','st_rad','radius_solar')),
    color: String(g('color') || colorTemp(teff)),
    source: String(g('source') || (imported ? 'CSV importado' : 'Muestra pedagógica inicial')),
    notes: String(g('notes','description') || ''),
    marker: clamp(4.2 + Math.log10(lum + .0002) * .75, 3.4, 8.5)
  };
}

function classify(t, l) {
  if (l < .3 && t > 7000) return 'white-dwarf';
  if (l > 1e4) return 'supergiant';
  if (l > 20 && t < 6000) return 'giant';
  return 'main-sequence';
}

function labelClass(c) {
  return ({ 'main-sequence':'Secuencia principal', giant:'Gigante', supergiant:'Supergigante', 'white-dwarf':'Enana blanca' }[c] || c || 'Estrella');
}

function makeSynthetic() {
  const rng = mulberry(73731);
  const add = (t, l) => state.synthetic.push({ teff: t, luminosity: l, r: 1.2 + rng() * 1.9, a: .12 + rng() * .12, color: colorTemp(t), seed: rng() * 9 });

  for (let i = 0; i < 1450; i++) {
    const u = rng();
    const lt = lerp(Math.log10(2850), Math.log10(36000), u);
    const ll = 7.2 * (lt - Math.log10(5772)) + randn(rng) * .22;
    add(10 ** lt, 10 ** ll);
  }
  for (let i = 0; i < 310; i++) add(10 ** lerp(Math.log10(3100), Math.log10(5400), rng()), 10 ** (lerp(Math.log10(25), Math.log10(6000), rng()) + randn(rng) * .18));
  for (let i = 0; i < 210; i++) add(10 ** lerp(Math.log10(6200), Math.log10(38000), rng()), 10 ** (lerp(Math.log10(.00018), Math.log10(.16), rng()) + randn(rng) * .12));
}

function tempX(t) {
  const p = chart.worldPlot;
  const a = Math.log10(chart.minTemp);
  const b = Math.log10(chart.maxTemp);
  const v = (Math.log10(clamp(t, chart.minTemp, chart.maxTemp)) - a) / (b - a);
  return p.x + (1 - v) * p.w;
}

function lumY(l) {
  const p = chart.worldPlot;
  const a = Math.log10(chart.minLum);
  const b = Math.log10(chart.maxLum);
  const v = (Math.log10(clamp(l, chart.minLum, chart.maxLum)) - a) / (b - a);
  return p.y + (1 - v) * p.h;
}

function tempFromWorldX(x) {
  const p = chart.worldPlot;
  const a = Math.log10(chart.minTemp);
  const b = Math.log10(chart.maxTemp);
  const v = 1 - (x - p.x) / p.w;
  return 10 ** (a + v * (b - a));
}

function lumFromWorldY(y) {
  const p = chart.worldPlot;
  const a = Math.log10(chart.minLum);
  const b = Math.log10(chart.maxLum);
  const v = 1 - (y - p.y) / p.h;
  return 10 ** (a + v * (b - a));
}

function dot(x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function css(n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); }

function alpha(hex, a) {
  const str = String(hex).trim();
  if (str.startsWith('rgba')) return str;
  if (str.startsWith('rgb')) {
    const m = str.match(/\d+/g) || [255, 255, 255];
    return `rgba(${m[0]},${m[1]},${m[2]},${a})`;
  }
  const safe = str.startsWith('#') ? str : '#ffffff';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function colorTemp(t) {
  const stops = [[2500,'#ff6b4a'],[3700,'#ff9b5f'],[5200,'#ffd08a'],[6000,'#fff1a8'],[7500,'#f5f8ff'],[10000,'#d8e9ff'],[40000,'#82adff']];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  }
  return stops[stops.length - 1][1];
}

function mix(a, b, u) {
  const h = x => [parseInt(x.slice(1,3),16), parseInt(x.slice(3,5),16), parseInt(x.slice(5,7),16)];
  const A = h(a);
  const B = h(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u, 0, 1))).toString(16).padStart(2, '0')).join('');
}

function formatTempTick(t) {
  if (t >= 10000) return `${num(t / 1000)}K`;
  if (t >= 1000) {
    const value = t / 1000;
    return Number.isInteger(value) ? `${value}K` : `${num(value)}K`;
  }
  return `${num(t)} K`;
}

function formatLumTick(l) {
  const exp = Math.log10(l);
  if (Math.abs(exp - Math.round(exp)) < 1e-8) return `10^${Math.round(exp)}`;
  if (l >= 1000 || l < .01) {
    const mantissa = l / 10 ** Math.floor(exp);
    return `${num(mantissa)}×10^${Math.floor(exp)}`;
  }
  return num(l).replace('0,', ',');
}

function fmtTemp(t) { return `${Math.round(t).toLocaleString('es-ES')} K`; }
function fmtLum(l) { return l >= 1 ? `${num(l)} L☉` : `${l.toExponential(l < .01 ? 2 : 3).replace('.', ',')} L☉`; }
function num(n) { return Number(n).toLocaleString('es-ES', { maximumFractionDigits: n < 1 ? 4 : n < 10 ? 2 : n < 100 ? 1 : 0 }); }
function opt(v) { const n = +String(v).replace(',', '.'); return Number.isFinite(n) && v !== '' ? n : null; }
function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function esc(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch])); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, u) { return a + (b - a) * u; }
function mulberry(s) { return () => { let t = s += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function randn(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
