'use strict';

(() => {
  if (typeof drawWorldClipped !== 'function' || typeof ctx === 'undefined') return;
  if (typeof tempX !== 'function' || typeof lumY !== 'function') return;

  const originalDrawWorldClipped = drawWorldClipped;
  const originalBind = typeof bind === 'function' ? bind : null;

  state.layers.uncertainty = false;
  state.layers.radiusCurves = false;
  state.layers.isochrones = false;
  state.layers.evolutionTracks = false;

  drawWorldClipped = function drawWorldWithScientificOverlays() {
    const a = chart.axis;
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.left, a.top, chart.width - a.left - a.right, chart.height - a.top - a.bottom);
    ctx.clip();
    ctx.translate(state.tx, state.ty);
    ctx.scale(state.scale, state.scale);

    bands();
    if (state.layers.grid) grid();
    drawScientificOverlays();
    if (state.layers.regions) drawRegions();
    if (state.layers.synthetic) state.density ? density() : synthetic();
    if (state.layers.stars) sampleStars();
    if (state.layers.labels) labels();

    ctx.restore();
  };

  window.__HR_DRAW_SCIENTIFIC_OVERLAYS__ = drawScientificOverlays;

  function drawScientificOverlays() {
    if (state.layers.radiusCurves) drawRadiusCurves();
    if (state.layers.isochrones) drawIsochrones();
    if (state.layers.evolutionTracks) drawEvolutionTracks();
    if (state.layers.uncertainty) drawUncertaintyLayer();
  }

  function drawRadiusCurves() {
    const radii = [0.01, 0.1, 1, 10, 100, 1000];
    radii.forEach(radius => {
      drawCurve(temp => radius * radius * Math.pow(temp / 5772, 4), {
        color: radius === 1 ? '#fff4a8' : '#f7e7a0',
        alpha: radius === 1 ? .50 : .28,
        dash: radius === 1 ? [] : [7 / state.scale, 7 / state.scale],
        label: `${formatRadius(radius)} R☉`,
        labelTemp: radius <= 0.1 ? 16000 : radius >= 100 ? 4200 : 6200
      });
    });
  }

  function drawIsochrones() {
    const lines = [
      { label: '10 Myr', color: '#7ea8ff', pts: [[36000,5e5],[22000,7e4],[12000,900],[7200,28],[5200,3.2],[3900,.35]] },
      { label: '100 Myr', color: '#9ddcff', pts: [[18000,1.8e4],[11000,420],[7600,34],[5900,2.1],[4400,.28],[3400,.04]] },
      { label: '1 Gyr', color: '#fff0a3', pts: [[9300,120],[7200,12],[6100,2.1],[5200,.74],[4100,.16],[3200,.025]] },
      { label: '10 Gyr', color: '#ffb06a', pts: [[6900,6.5],[6000,1.25],[5300,.62],[4500,.24],[3700,.07],[3000,.012]] }
    ];
    lines.forEach(line => drawPolyline(line.pts, line.color, .55, [], line.label));
  }

  function drawEvolutionTracks() {
    const tracks = [
      { label: '1 M☉', color: '#f7e68e', pts: [[5800,1],[5700,2.5],[5200,12],[4600,80],[3900,800],[5200,70],[9000,.5],[18000,.015]] },
      { label: '5 M☉', color: '#a9cfff', pts: [[15000,600],[12000,1100],[8300,2600],[5200,6000],[4100,1.8e4],[6500,9000]] },
      { label: '15 M☉', color: '#ff7c68', pts: [[30000,8e4],[24000,1.2e5],[14000,1.8e5],[7000,2.2e5],[3900,1.4e5]] }
    ];
    tracks.forEach(track => drawPolyline(track.pts, track.color, .72, [12 / state.scale, 8 / state.scale], track.label));
  }

  function drawUncertaintyLayer() {
    const stars = visibleStars().slice(0, 3500);
    ctx.save();
    ctx.lineWidth = 1 / state.scale;
    stars.forEach(star => {
      const u = uncertainty(star);
      if (!u) return;
      const x = tempX(star.teff);
      const y = lumY(star.luminosity);
      const dx = Math.abs(tempX(star.teff + u.teff) - tempX(star.teff));
      const yHigh = lumY(star.luminosity * Math.pow(10, u.lumLog));
      const yLow = lumY(star.luminosity / Math.pow(10, u.lumLog));
      const dy = Math.max(Math.abs(yHigh - y), Math.abs(yLow - y));
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      ctx.strokeStyle = alpha(star.color || '#ffffff', .24);
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(dx, 2 / state.scale), Math.max(dy, 2 / state.scale), 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawCurve(fn, options) {
    const pts = [];
    for (let i = 0; i <= 180; i++) {
      const t = chart.maxTemp * Math.pow(chart.minTemp / chart.maxTemp, i / 180);
      const l = fn(t);
      if (!Number.isFinite(l) || l <= chart.minLum || l >= chart.maxLum) continue;
      pts.push([t, l]);
    }
    drawPolyline(pts, options.color, options.alpha, options.dash, options.label, options.labelTemp);
  }

  function drawPolyline(pts, color, opacity, dash = [], label = '', labelTemp = null) {
    const mapped = pts.map(([t, l]) => [tempX(t), lumY(l), t, l]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    if (mapped.length < 2) return;
    ctx.save();
    ctx.strokeStyle = alpha(color, opacity);
    ctx.lineWidth = 1.15 / state.scale;
    ctx.setLineDash(dash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    mapped.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
    ctx.setLineDash([]);
    if (label) drawCurveLabel(mapped, color, label, labelTemp);
    ctx.restore();
  }

  function drawCurveLabel(mapped, color, label, labelTemp) {
    let point = mapped[Math.floor(mapped.length * .55)];
    if (labelTemp) point = mapped.reduce((best, item) => Math.abs(item[2] - labelTemp) < Math.abs(best[2] - labelTemp) ? item : best, point);
    const sx = worldToScreenX(point[0]);
    const sy = worldToScreenY(point[1]);
    if (sx < chart.axis.left || sx > chart.width - chart.axis.right || sy < chart.axis.top || sy > chart.height - chart.axis.bottom) return;
    ctx.save();
    ctx.font = `900 ${12 / state.scale}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4 / state.scale;
    ctx.strokeStyle = alpha(css('--panel-solid'), .9);
    ctx.fillStyle = alpha(color, .92);
    ctx.strokeText(label, point[0], point[1]);
    ctx.fillText(label, point[0], point[1]);
    ctx.restore();
  }

  function uncertainty(star) {
    const raw = star.rawFields || {};
    const teff = firstAbs(raw, ['st_tefferr1','st_tefferr2','teff_err','tefferr1','tefferr2','teff_error']);
    const lum = firstAbs(raw, ['st_lumerr1','st_lumerr2','lum_err','lumerr1','lumerr2','lum_error']);
    if (!Number.isFinite(teff) && !Number.isFinite(lum)) return null;
    return {
      teff: Number.isFinite(teff) ? teff : Math.max(80, star.teff * .015),
      lumLog: Number.isFinite(lum) ? Math.max(.015, lum) : .06
    };
  }

  function firstAbs(raw, keys) {
    for (const key of keys) {
      const value = Number(String(raw[key] ?? '').replace(',', '.'));
      if (Number.isFinite(value) && value !== 0) return Math.abs(value);
    }
    return NaN;
  }

  function visibleStars() {
    if (typeof window.__HR_GET_FILTERED_STARS__ === 'function') return window.__HR_GET_FILTERED_STARS__();
    return state.stars || [];
  }

  function formatRadius(value) {
    if (value >= 1000) return '1000';
    if (value >= 1) return String(value);
    return value.toLocaleString('es-ES');
  }
})();
