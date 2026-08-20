'use strict';

(() => {
  if (typeof chart === 'undefined' || typeof ctx === 'undefined') return;

  updateChartMetrics = function updateChartMetricsFourAxes() {
    const w = Math.max(1, canvas.clientWidth || innerWidth || 1);
    const h = Math.max(1, canvas.clientHeight || innerHeight || 1);
    const ultraCompact = w < 430;
    const compact = w < 760;

    chart.width = w;
    chart.height = h;
    chart.axis = {
      left: ultraCompact ? 56 : compact ? 74 : 94,
      right: ultraCompact ? 46 : compact ? 54 : 76,
      top: ultraCompact ? 44 : compact ? 48 : 64,
      bottom: ultraCompact ? 56 : compact ? 62 : 78
    };
    chart.worldPlot = {
      x: chart.axis.left,
      y: chart.axis.top,
      w: Math.max(40, w - chart.axis.left - chart.axis.right),
      h: Math.max(40, h - chart.axis.top - chart.axis.bottom)
    };
  };

  bands = function smoothSpectralBands() {
    const p = chart.worldPlot;
    const steps = Math.max(180, Math.min(720, Math.round(p.w / 2)));
    const dark = document.body.classList.contains('dark');
    ctx.save();
    for (let i = 0; i < steps; i++) {
      const u1 = i / steps;
      const u2 = (i + 1) / steps;
      const x1 = p.x + p.w * u1;
      const x2 = p.x + p.w * u2 + 0.8 / state.scale;
      const t = tempFromAxisRatio((u1 + u2) / 2);
      const col = smoothTemperatureColor(t);
      const g = ctx.createLinearGradient(x1, p.y, x2, p.y);
      g.addColorStop(0, alpha(col, dark ? .105 : .16));
      g.addColorStop(.55, alpha(col, dark ? .075 : .12));
      g.addColorStop(1, alpha(col, dark ? .105 : .16));
      ctx.fillStyle = g;
      ctx.fillRect(x1, p.y, Math.max(1.4 / state.scale, x2 - x1), p.h);
    }

    const vertical = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    vertical.addColorStop(0, dark ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.18)');
    vertical.addColorStop(.5, 'rgba(255,255,255,0)');
    vertical.addColorStop(1, dark ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.035)');
    ctx.fillStyle = vertical;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
  };

  drawAxesOverlay = function drawAxesOverlayFourAxes() {
    const a = chart.axis;
    const pl = a.left;
    const pr = chart.width - a.right;
    const pt = a.top;
    const pb = chart.height - a.bottom;
    const panel = document.body.classList.contains('dark') ? 'rgba(8,11,18,.90)' : 'rgba(248,244,236,.90)';
    const ticks = getDynamicTicks();
    const ink = css('--ink');

    ctx.save();
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, chart.width, a.top);
    ctx.fillRect(0, 0, a.left, chart.height);
    ctx.fillRect(pr, 0, a.right, chart.height);
    ctx.fillRect(0, pb, chart.width, a.bottom);

    ctx.strokeStyle = alpha(ink, .78);
    ctx.lineWidth = 1.35;
    line(pl, pt, pr, pt);
    line(pl, pb, pr, pb);
    line(pl, pt, pl, pb);
    line(pr, pt, pr, pb);

    ctx.font = `800 ${chart.width < 430 ? 8.5 : chart.width < 760 ? 9.5 : 11.5}px system-ui`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = alpha(ink, .80);
    ctx.strokeStyle = alpha(ink, .45);
    ctx.lineWidth = 1;

    drawTemperatureMinorTicks(ticks, pl, pr, pt, pb);
    drawLuminosityMinorTicks(ticks, pl, pr, pt, pb);
    drawLuminosityAxis(ticks, pl, pr, pt, pb);
    drawMagnitudeAxis(ticks, pr, pt, pb);
    drawSpectralAxis(pl, pr, pt);
    drawColorAxis(pl, pr, pb);

    ctx.restore();
  };

  function drawTemperatureMinorTicks(ticks, pl, pr, pt, pb) {
    ticks.xMinor.forEach(t => {
      const sx = worldToScreenX(tempX(t));
      if (sx < pl - 1 || sx > pr + 1) return;
      ctx.strokeStyle = alpha(css('--ink'), .45);
      line(sx, pb, sx, pb + 4);
      line(sx, pt - 4, sx, pt);
    });
  }

  function drawLuminosityMinorTicks(ticks, pl, pr, pt, pb) {
    ticks.yMinor.forEach(l => {
      const sy = worldToScreenY(lumY(l));
      if (sy < pt - 1 || sy > pb + 1) return;
      ctx.strokeStyle = alpha(css('--ink'), .45);
      line(pl - 4, sy, pl, sy);
      line(pr, sy, pr + 4, sy);
    });
  }

  function drawLuminosityAxis(ticks, pl, pr, pt, pb) {
    ctx.font = `800 ${chart.width < 430 ? 8.5 : chart.width < 760 ? 9.5 : 11.5}px system-ui`;
    ticks.yMajor.forEach(l => {
      const sy = worldToScreenY(lumY(l));
      if (sy < pt - 1 || sy > pb + 1) return;
      ctx.strokeStyle = alpha(css('--ink'), .62);
      line(pl - 8, sy, pl, sy);
      ctx.fillStyle = alpha(css('--ink'), .82);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatLumTick(l), pl - 11, sy);
    });

    ctx.save();
    ctx.fillStyle = css('--ink');
    ctx.font = `900 ${chart.width < 430 ? 9.5 : chart.width < 760 ? 11 : 13}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(chart.width < 430 ? 13 : chart.width < 760 ? 17 : 24, pt + (pb - pt) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Luminosidad relativa al Sol, L☉', 0, 0);
    ctx.restore();
  }

  function drawMagnitudeAxis(ticks, pr, pt, pb) {
    ctx.font = `800 ${chart.width < 430 ? 8.5 : chart.width < 760 ? 9.5 : 11.5}px system-ui`;
    ticks.yMajor.forEach(l => {
      const sy = worldToScreenY(lumY(l));
      if (sy < pt - 1 || sy > pb + 1) return;
      ctx.strokeStyle = alpha(css('--ink'), .62);
      line(pr, sy, pr + 8, sy);
      ctx.fillStyle = alpha(css('--ink'), .82);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatMagnitudeTick(l), pr + 10, sy);
    });

    ctx.save();
    ctx.fillStyle = css('--ink');
    ctx.font = `900 ${chart.width < 430 ? 9.5 : chart.width < 760 ? 11 : 13}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(chart.width - (chart.width < 430 ? 13 : chart.width < 760 ? 17 : 24), pt + (pb - pt) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('Magnitud absoluta aproximada', 0, 0);
    ctx.restore();
  }

  function drawSpectralAxis(pl, pr, pt) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${chart.width < 430 ? 10 : chart.width < 760 ? 12 : 15}px system-ui`;
    ctx.fillStyle = css('--ink');
    ctx.fillText('Tipo espectral', pl + (pr - pl) / 2, Math.max(11, pt - (chart.width < 430 ? 34 : 43)));

    ctx.font = `900 ${chart.width < 430 ? 12 : chart.width < 760 ? 14 : 18}px system-ui`;
    spectralBands.forEach(([lab, min, max, col]) => {
      const x1 = worldToScreenX(tempX(max));
      const x2 = worldToScreenX(tempX(min));
      const mid = (x1 + x2) / 2;
      if (mid < pl || mid > pr) return;
      ctx.fillStyle = alpha(col, .98);
      ctx.fillText(lab, mid, pt - (chart.width < 430 ? 19 : 22));
    });

    ctx.font = `700 ${chart.width < 430 ? 7.5 : chart.width < 760 ? 8.5 : 10}px system-ui`;
    ctx.fillStyle = alpha(css('--ink'), .72);
    getTopTemperatureReferenceTicks().forEach(t => {
      const sx = worldToScreenX(tempX(t));
      const edge = chart.width < 430 ? 12 : 16;
      if (sx < pl + edge || sx > pr - edge) return;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(t).toLocaleString('es-ES')} K`, sx, pt - 7);
    });
  }

  function drawColorAxis(pl, pr, pb) {
    ctx.font = `800 ${chart.width < 430 ? 8.5 : chart.width < 760 ? 9.5 : 11.5}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = alpha(css('--ink'), .82);
    ctx.strokeStyle = alpha(css('--ink'), .62);

    const ticks = getColorTicks();
    ticks.minor.forEach(bv => {
      const t = tempFromBV(bv);
      if (!Number.isFinite(t)) return;
      const sx = worldToScreenX(tempX(t));
      if (sx < pl - 1 || sx > pr + 1) return;
      line(sx, pb, sx, pb + 4);
    });

    ticks.major.forEach(bv => {
      const t = tempFromBV(bv);
      if (!Number.isFinite(t)) return;
      const sx = worldToScreenX(tempX(t));
      const edge = chart.width < 430 ? 5 : 8;
      if (sx < pl + edge || sx > pr - edge) return;
      line(sx, pb, sx, pb + 8);
      ctx.fillText(formatBV(bv), sx, pb + (chart.width < 430 ? 20 : 24));
    });

    ctx.fillStyle = css('--ink');
    ctx.font = `900 ${chart.width < 430 ? 9.5 : chart.width < 760 ? 11 : 13}px system-ui`;
    ctx.fillText('Color B−V', pl + (pr - pl) / 2, chart.height - (chart.width < 430 ? 14 : 18));
  }

  function tempFromAxisRatio(u) {
    const logMax = Math.log10(chart.maxTemp);
    const logMin = Math.log10(chart.minTemp);
    return 10 ** (logMax + (logMin - logMax) * clamp(u, 0, 1));
  }

  function smoothTemperatureColor(t) {
    const stops = [
      [40000, '#7ea8ff'],
      [26000, '#9ec5ff'],
      [14000, '#c9e1ff'],
      [9000, '#edf4ff'],
      [7200, '#fff2c7'],
      [6100, '#ffe58a'],
      [5200, '#ffd071'],
      [4400, '#ffb063'],
      [3600, '#ff885c'],
      [2500, '#ff5d4f']
    ].sort((a, b) => a[0] - b[0]);

    if (t <= stops[0][0]) return stops[0][1];
    if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
    for (let i = 1; i < stops.length; i++) {
      const [t1, c1] = stops[i - 1];
      const [t2, c2] = stops[i];
      if (t >= t1 && t <= t2) return mixHex(c1, c2, (t - t1) / (t2 - t1));
    }
    return '#ffffff';
  }

  function mixHex(a, b, u) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    const v = clamp(u, 0, 1);
    return '#' + [0, 1, 2].map(i => Math.round(ca[i] + (cb[i] - ca[i]) * v).toString(16).padStart(2, '0')).join('');
  }

  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  function getTopTemperatureReferenceTicks() {
    const visible = getVisibleDataRanges();
    const spacing = chart.width < 430 ? 58 : chart.width < 760 ? 66 : 74;
    return buildTemperatureTicks(visible.tempMin, visible.tempMax, spacing, true);
  }

  function getColorTicks() {
    const visible = getVisibleDataRanges();
    const zoom = Math.max(1, Number(state.scale) || 1);
    const step = zoom >= 45 ? .02 : zoom >= 20 ? .05 : zoom >= 6 ? .1 : .2;
    const values = [];

    for (let bv = -.4; bv <= 2.6 + step * .2; bv += step) {
      const rounded = Math.round(bv * 1000) / 1000;
      const t = tempFromBV(rounded);
      if (!Number.isFinite(t)) continue;
      if (t < visible.tempMin * .999 || t > visible.tempMax * 1.001) continue;
      values.push(rounded);
    }

    const pixel = value => worldToScreenX(tempX(tempFromBV(value)));
    const majorSpacing = chart.width < 430 ? 52 : chart.width < 760 ? 62 : 72;
    const minorSpacing = chart.width < 430 ? 22 : 28;
    const major = enforcePixelSpacing(values, pixel, majorSpacing);
    const minor = enforcePixelSpacing(values, pixel, minorSpacing);
    return { major, minor };
  }

  function tempFromBV(bv) {
    const x = Number(bv);
    const t = 4600 * (1 / (0.92 * x + 1.7) + 1 / (0.92 * x + 0.62));
    return Number.isFinite(t) ? clamp(t, chart.minTemp, chart.maxTemp) : NaN;
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  function formatBV(v) {
    const digits = Math.abs(v) < .1 && state.scale >= 20 ? 2 : 1;
    const fixed = Math.abs(v) < 1 ? v.toFixed(digits) : Number(v.toFixed(digits)).toString();
    return v > 0 ? `+${fixed}` : fixed;
  }

  function formatMagnitudeTick(lum) {
    const mag = 4.83 - 2.5 * Math.log10(lum);
    if (!Number.isFinite(mag)) return '—';
    const rounded = Math.abs(mag) >= 10 ? Math.round(mag) : Math.round(mag * 10) / 10;
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  }

  window.addEventListener('load', () => {
    updateChartMetrics();
    if (typeof clampView === 'function') clampView();
    if (typeof draw === 'function') draw();
  });
})();
