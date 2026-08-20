'use strict';

(() => {
  if (typeof ctx === 'undefined' || typeof chart === 'undefined' || typeof state === 'undefined') return;
  if (typeof tempX !== 'function' || typeof lumY !== 'function') return;

  bands = function bandsV1() {
    const p = chart.worldPlot;
    const steps = Math.max(180, Math.min(720, Math.round(p.w / 2)));
    const theme = document.body.dataset.themeResolved || 'day';
    const darkLike = theme === 'night' || theme === 'afternoon';

    ctx.save();
    for (let i = 0; i < steps; i++) {
      const u1 = i / steps;
      const u2 = (i + 1) / steps;
      const x1 = p.x + p.w * u1;
      const x2 = p.x + p.w * u2 + 0.8 / state.scale;
      const t = temperatureAtRatio((u1 + u2) / 2);
      const col = temperatureColor(t);
      const g = ctx.createLinearGradient(x1, p.y, x2, p.y);
      const edgeAlpha = darkLike ? .10 : .16;
      const midAlpha = darkLike ? .065 : .12;
      g.addColorStop(0, alpha(col, edgeAlpha));
      g.addColorStop(.55, alpha(col, midAlpha));
      g.addColorStop(1, alpha(col, edgeAlpha));
      ctx.fillStyle = g;
      ctx.fillRect(x1, p.y, Math.max(1.4 / state.scale, x2 - x1), p.h);
    }

    const vertical = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    if (theme === 'afternoon') {
      vertical.addColorStop(0, 'rgba(255,218,184,.035)');
      vertical.addColorStop(.5, 'rgba(255,255,255,0)');
      vertical.addColorStop(1, 'rgba(35,14,18,.16)');
    } else if (theme === 'night') {
      vertical.addColorStop(0, 'rgba(255,255,255,.035)');
      vertical.addColorStop(.5, 'rgba(255,255,255,0)');
      vertical.addColorStop(1, 'rgba(0,0,0,.12)');
    } else {
      vertical.addColorStop(0, 'rgba(255,255,255,.18)');
      vertical.addColorStop(.5, 'rgba(255,255,255,0)');
      vertical.addColorStop(1, 'rgba(0,0,0,.035)');
    }
    ctx.fillStyle = vertical;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
  };

  drawAxesOverlay = function drawAxesOverlayV1() {
    const a = chart.axis;
    const pl = a.left;
    const pr = chart.width - a.right;
    const pt = a.top;
    const pb = chart.height - a.bottom;
    const theme = document.body.dataset.themeResolved || 'day';
    const palette = axisPalette(theme);
    const ticks = typeof getDynamicTicks === 'function' ? getDynamicTicks() : { xMinor: [], yMinor: [], yMajor: [] };

    ctx.save();
    ctx.fillStyle = palette.panel;
    ctx.fillRect(0, 0, chart.width, a.top);
    ctx.fillRect(0, 0, a.left, chart.height);
    ctx.fillRect(pr, 0, a.right, chart.height);
    ctx.fillRect(0, pb, chart.width, a.bottom);

    ctx.strokeStyle = alpha(palette.ink, .78);
    ctx.lineWidth = 1.35;
    line(pl, pt, pr, pt);
    line(pl, pb, pr, pb);
    line(pl, pt, pl, pb);
    line(pr, pt, pr, pb);

    drawTemperatureMinorTicks(ticks, pl, pr, pt, pb, palette);
    drawLuminosityMinorTicks(ticks, pl, pr, pt, pb, palette);
    drawLuminosityAxis(ticks, pl, pt, pb, palette);
    drawMagnitudeAxis(ticks, pr, pt, pb, palette);
    drawSpectralAxis(pl, pr, pt, palette);
    drawColorAxis(pl, pr, pb, palette);

    ctx.restore();
  };

  function axisPalette(theme) {
    if (theme === 'afternoon') {
      return {
        panel: 'rgba(43, 28, 31, .965)',
        ink: '#fff3e9',
        muted: '#ddc1b5'
      };
    }
    if (theme === 'night') {
      return {
        panel: 'rgba(8, 11, 18, .94)',
        ink: '#f3f5fa',
        muted: '#a7afbf'
      };
    }
    return {
      panel: 'rgba(248, 244, 236, .94)',
      ink: '#171616',
      muted: '#6f6b63'
    };
  }

  function drawTemperatureMinorTicks(ticks, pl, pr, pt, pb, palette) {
    (ticks.xMinor || []).forEach(t => {
      const sx = worldToScreenX(tempX(t));
      if (sx < pl - 1 || sx > pr + 1) return;
      ctx.strokeStyle = alpha(palette.ink, .42);
      line(sx, pb, sx, pb + 4);
      line(sx, pt - 4, sx, pt);
    });
  }

  function drawLuminosityMinorTicks(ticks, pl, pr, pt, pb, palette) {
    (ticks.yMinor || []).forEach(l => {
      const sy = worldToScreenY(lumY(l));
      if (sy < pt - 1 || sy > pb + 1) return;
      ctx.strokeStyle = alpha(palette.ink, .42);
      line(pl - 4, sy, pl, sy);
      line(pr, sy, pr + 4, sy);
    });
  }

  function drawLuminosityAxis(ticks, pl, pt, pb, palette) {
    ctx.font = `800 ${axisTickFont()}px system-ui`;
    (ticks.yMajor || []).forEach(l => {
      const sy = worldToScreenY(lumY(l));
      if (sy < pt - 1 || sy > pb + 1) return;
      ctx.strokeStyle = alpha(palette.ink, .62);
      line(pl - 8, sy, pl, sy);
      ctx.fillStyle = alpha(palette.ink, .90);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatLumTick(l), pl - 11, sy);
    });

    ctx.save();
    ctx.fillStyle = palette.ink;
    ctx.font = `900 ${axisTitleFont()}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(chart.width < 430 ? 13 : chart.width < 760 ? 17 : 24, pt + (pb - pt) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Luminosidad relativa al Sol, L☉', 0, 0);
    ctx.restore();
  }

  function drawMagnitudeAxis(ticks, pr, pt, pb, palette) {
    ctx.font = `800 ${axisTickFont()}px system-ui`;
    (ticks.yMajor || []).forEach(l => {
      const sy = worldToScreenY(lumY(l));
      if (sy < pt - 1 || sy > pb + 1) return;
      ctx.strokeStyle = alpha(palette.ink, .62);
      line(pr, sy, pr + 8, sy);
      ctx.fillStyle = alpha(palette.ink, .90);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatMagnitude(l), pr + 10, sy);
    });

    ctx.save();
    ctx.fillStyle = palette.ink;
    ctx.font = `900 ${axisTitleFont()}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(chart.width - (chart.width < 430 ? 13 : chart.width < 760 ? 17 : 24), pt + (pb - pt) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('Magnitud absoluta aproximada', 0, 0);
    ctx.restore();
  }

  function drawSpectralAxis(pl, pr, pt, palette) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = palette.ink;
    ctx.font = `900 ${chart.width < 430 ? 10 : chart.width < 760 ? 12 : 15}px system-ui`;
    ctx.fillText('Tipo espectral', pl + (pr - pl) / 2, Math.max(11, pt - (chart.width < 430 ? 34 : 43)));

    ctx.font = `900 ${chart.width < 430 ? 12 : chart.width < 760 ? 14 : 18}px system-ui`;
    spectralBands.forEach(([lab, min, max, col]) => {
      const x1 = worldToScreenX(tempX(max));
      const x2 = worldToScreenX(tempX(min));
      const mid = (x1 + x2) / 2;
      if (mid < pl || mid > pr) return;
      ctx.fillStyle = col;
      ctx.lineWidth = themeStrokeWidth();
      ctx.strokeStyle = 'rgba(0,0,0,.42)';
      ctx.strokeText(lab, mid, pt - (chart.width < 430 ? 19 : 22));
      ctx.fillText(lab, mid, pt - (chart.width < 430 ? 19 : 22));
    });

    ctx.font = `700 ${chart.width < 430 ? 7.5 : chart.width < 760 ? 8.5 : 10}px system-ui`;
    ctx.fillStyle = alpha(palette.ink, .82);
    buildTopTemperatureTicks().forEach(t => {
      const sx = worldToScreenX(tempX(t));
      const edge = chart.width < 430 ? 12 : 16;
      if (sx < pl + edge || sx > pr - edge) return;
      ctx.fillText(`${Math.round(t).toLocaleString('es-ES')} K`, sx, pt - 7);
    });
  }

  function drawColorAxis(pl, pr, pb, palette) {
    const ticks = buildColorTicks();
    ctx.font = `800 ${axisTickFont()}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = alpha(palette.ink, .92);
    ctx.strokeStyle = alpha(palette.ink, .62);

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
      const edge = chart.width < 430 ? 4 : 7;
      if (sx < pl + edge || sx > pr - edge) return;
      line(sx, pb, sx, pb + 8);
      ctx.fillText(formatBV(bv, ticks.step), sx, pb + (chart.width < 430 ? 20 : 24));
    });

    ctx.fillStyle = palette.ink;
    ctx.font = `900 ${axisTitleFont()}px system-ui`;
    ctx.fillText('Color B−V', pl + (pr - pl) / 2, chart.height - (chart.width < 430 ? 14 : 18));
  }

  function buildTopTemperatureTicks() {
    const visible = visibleDataRanges();
    const spacing = chart.width < 430 ? 58 : chart.width < 760 ? 66 : 74;
    return buildTemperatureTicks(visible.tempMin, visible.tempMax, spacing, true);
  }

  function buildColorTicks() {
    const visible = visibleDataRanges();
    const zoom = Math.max(1, Number(state.scale) || 1);
    const step = zoom >= 55 ? .01 : zoom >= 30 ? .02 : zoom >= 14 ? .05 : zoom >= 5 ? .1 : .2;
    const values = [];

    for (let bv = -.45; bv <= 2.6 + step * .25; bv += step) {
      const rounded = Math.round(bv * 10000) / 10000;
      const t = tempFromBV(rounded);
      if (!Number.isFinite(t)) continue;
      if (t < visible.tempMin * .999 || t > visible.tempMax * 1.001) continue;
      values.push(rounded);
    }

    const pixel = value => worldToScreenX(tempX(tempFromBV(value)));
    const baseMajor = chart.width < 430 ? 50 : chart.width < 760 ? 60 : 70;
    const majorSpacing = zoom >= 45 ? Math.max(30, baseMajor * .58) : zoom >= 20 ? Math.max(34, baseMajor * .72) : baseMajor;
    const minorSpacing = zoom >= 30 ? 15 : chart.width < 430 ? 20 : 27;

    return {
      step,
      major: enforceSpacing(values, pixel, majorSpacing),
      minor: enforceSpacing(values, pixel, minorSpacing)
    };
  }

  function visibleDataRanges() {
    if (typeof getVisibleDataRanges === 'function') return getVisibleDataRanges();
    const a = chart.axis;
    const t1 = tempFromWorldX(screenToWorldX(a.left));
    const t2 = tempFromWorldX(screenToWorldX(chart.width - a.right));
    return {
      tempMin: clamp(Math.min(t1, t2), chart.minTemp, chart.maxTemp),
      tempMax: clamp(Math.max(t1, t2), chart.minTemp, chart.maxTemp)
    };
  }

  function enforceSpacing(values, pixelFn, minPx) {
    const sorted = values.slice().sort((a, b) => pixelFn(a) - pixelFn(b));
    const out = [];
    let last = -Infinity;
    for (const value of sorted) {
      const px = pixelFn(value);
      if (!Number.isFinite(px)) continue;
      if (Math.abs(px - last) >= minPx) {
        out.push(value);
        last = px;
      }
    }
    return out.sort((a, b) => a - b);
  }

  function tempFromBV(bv) {
    const x = Number(bv);
    const denominatorA = 0.92 * x + 1.7;
    const denominatorB = 0.92 * x + 0.62;
    if (denominatorA <= 0 || denominatorB <= 0) return NaN;
    const t = 4600 * (1 / denominatorA + 1 / denominatorB);
    return Number.isFinite(t) ? clamp(t, chart.minTemp, chart.maxTemp) : NaN;
  }

  function formatBV(value, step) {
    const digits = step <= .01 ? 2 : step <= .05 ? 2 : 1;
    const rounded = Number(value.toFixed(digits));
    if (Object.is(rounded, -0) || Math.abs(rounded) < 10 ** -(digits + 1)) return digits === 1 ? '0.0' : '0.00';
    const text = rounded.toFixed(digits);
    return rounded > 0 ? `+${text}` : text;
  }

  function formatMagnitude(lum) {
    const mag = 4.83 - 2.5 * Math.log10(lum);
    if (!Number.isFinite(mag)) return '—';
    const rounded = Math.abs(mag) >= 10 ? Math.round(mag) : Math.round(mag * 10) / 10;
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  }

  function axisTickFont() {
    return chart.width < 430 ? 8.5 : chart.width < 760 ? 9.5 : 11.5;
  }

  function axisTitleFont() {
    return chart.width < 430 ? 9.5 : chart.width < 760 ? 11 : 13;
  }

  function themeStrokeWidth() {
    return document.body.dataset.themeResolved === 'day' ? 0 : 2.2;
  }

  function temperatureAtRatio(u) {
    const logMax = Math.log10(chart.maxTemp);
    const logMin = Math.log10(chart.minTemp);
    return 10 ** (logMax + (logMin - logMax) * clamp(u, 0, 1));
  }

  function temperatureColor(t) {
    const stops = [
      [2500, '#ff5d4f'], [3600, '#ff885c'], [4400, '#ffb063'], [5200, '#ffd071'],
      [6100, '#ffe58a'], [7200, '#fff2c7'], [9000, '#edf4ff'], [14000, '#c9e1ff'],
      [26000, '#9ec5ff'], [40000, '#7ea8ff']
    ];
    if (t <= stops[0][0]) return stops[0][1];
    if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
    for (let i = 1; i < stops.length; i++) {
      const [t1, c1] = stops[i - 1];
      const [t2, c2] = stops[i];
      if (t >= t1 && t <= t2) return mixHex(c1, c2, (t - t1) / (t2 - t1));
    }
    return '#ffffff';
  }

  function mixHex(a, b, ratio) {
    const ca = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const cb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const r = clamp(ratio, 0, 1);
    return '#' + [0, 1, 2].map(i => Math.round(ca[i] + (cb[i] - ca[i]) * r).toString(16).padStart(2, '0')).join('');
  }
})();
