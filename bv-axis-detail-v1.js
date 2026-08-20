'use strict';

(() => {
  if (typeof drawAxesOverlay !== 'function' || typeof ctx === 'undefined') return;
  if (typeof tempX !== 'function' || typeof worldToScreenX !== 'function') return;

  const previousDrawAxesOverlay = drawAxesOverlay;

  drawAxesOverlay = function drawAxesOverlayWithDetailedBV() {
    previousDrawAxesOverlay();
    drawDetailedBVAxis();
  };

  function drawDetailedBVAxis() {
    const a = chart.axis;
    const pl = a.left;
    const pr = chart.width - a.right;
    const pb = chart.height - a.bottom;
    const theme = document.body.dataset.themeResolved || 'day';
    const palette = axisPalette(theme);
    const ticks = buildDetailedTicks();

    ctx.save();

    /* Limpia únicamente el margen inferior para sustituir las etiquetas B−V previas. */
    ctx.fillStyle = palette.panel;
    ctx.fillRect(0, pb + 1, chart.width, Math.max(0, chart.height - pb - 1));

    ctx.strokeStyle = alpha(palette.ink, .64);
    ctx.fillStyle = alpha(palette.ink, .94);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    ctx.font = `800 ${tickFont(ticks.digits)}px system-ui`;

    ticks.minor.forEach(bv => {
      const x = tickX(bv);
      if (!Number.isFinite(x) || x < pl - 1 || x > pr + 1) return;
      line(x, pb, x, pb + 4);
    });

    ticks.major.forEach(bv => {
      const x = tickX(bv);
      const edge = chart.width < 430 ? 5 : 8;
      if (!Number.isFinite(x) || x < pl + edge || x > pr - edge) return;
      line(x, pb, x, pb + 8);
      ctx.fillText(formatBV(bv, ticks.digits), x, pb + (chart.width < 430 ? 20 : 24));
    });

    ctx.fillStyle = palette.ink;
    ctx.font = `900 ${chart.width < 430 ? 9.5 : chart.width < 760 ? 11 : 13}px system-ui`;
    ctx.fillText('Color B−V', pl + (pr - pl) / 2, chart.height - (chart.width < 430 ? 14 : 18));

    ctx.restore();
  }

  function buildDetailedTicks() {
    const visible = visibleTemperatureRange();
    const zoom = Math.max(1, Number(state.scale) || 1);
    const step = zoom >= 65 ? 0.0025
      : zoom >= 50 ? 0.005
      : zoom >= 35 ? 0.01
      : zoom >= 20 ? 0.02
      : zoom >= 10 ? 0.05
      : zoom >= 4 ? 0.1
      : 0.2;

    const digits = step <= 0.0025 ? 4 : step <= 0.005 ? 3 : step <= 0.05 ? 2 : 1;
    const values = [];
    const minBV = -0.56;
    const maxBV = 2.6;
    const start = Math.ceil(minBV / step - 1e-9);
    const end = Math.floor(maxBV / step + 1e-9);

    for (let index = start; index <= end; index++) {
      const bv = roundTo(index * step, Math.max(4, digits + 1));
      const temperature = temperatureFromBV(bv);
      if (!Number.isFinite(temperature)) continue;
      if (temperature < visible.min * 0.9995 || temperature > visible.max * 1.0005) continue;
      values.push(bv);
    }

    const baseMajor = chart.width < 430 ? 52 : chart.width < 760 ? 62 : 74;
    const labelWidthFloor = chart.width < 430 ? (digits >= 3 ? 50 : 42) : (digits >= 3 ? 68 : 56);
    const majorSpacing = Math.max(labelWidthFloor, zoom >= 45 ? baseMajor * 0.72 : zoom >= 20 ? baseMajor * 0.84 : baseMajor);
    const minorSpacing = zoom >= 50 ? 13 : zoom >= 25 ? 16 : chart.width < 430 ? 20 : 26;

    return {
      step,
      digits,
      major: enforceSpacing(values, majorSpacing),
      minor: enforceSpacing(values, minorSpacing)
    };
  }

  function visibleTemperatureRange() {
    if (typeof getVisibleDataRanges === 'function') {
      const ranges = getVisibleDataRanges();
      if (ranges && Number.isFinite(ranges.tempMin) && Number.isFinite(ranges.tempMax)) {
        return { min: ranges.tempMin, max: ranges.tempMax };
      }
    }

    const a = chart.axis;
    const t1 = tempFromWorldX(screenToWorldX(a.left));
    const t2 = tempFromWorldX(screenToWorldX(chart.width - a.right));
    return {
      min: Math.max(chart.minTemp, Math.min(t1, t2)),
      max: Math.min(chart.maxTemp, Math.max(t1, t2))
    };
  }

  function enforceSpacing(values, minPx) {
    const sorted = values
      .map(value => ({ value, pixel: tickX(value) }))
      .filter(item => Number.isFinite(item.pixel))
      .sort((a, b) => a.pixel - b.pixel);

    const result = [];
    let lastPixel = -Infinity;
    for (const item of sorted) {
      if (item.pixel - lastPixel >= minPx) {
        result.push(item.value);
        lastPixel = item.pixel;
      }
    }
    return result.sort((a, b) => a - b);
  }

  function tickX(bv) {
    const temperature = temperatureFromBV(bv);
    if (!Number.isFinite(temperature)) return NaN;
    return worldToScreenX(tempX(temperature));
  }

  function temperatureFromBV(bv) {
    const x = Number(bv);
    const a = 0.92 * x + 1.7;
    const b = 0.92 * x + 0.62;
    if (a <= 0 || b <= 0) return NaN;
    const temperature = 4600 * (1 / a + 1 / b);
    return Number.isFinite(temperature) && temperature > 0 ? temperature : NaN;
  }

  function formatBV(value, digits) {
    const rounded = Number(value.toFixed(digits));
    if (Math.abs(rounded) < 10 ** -(digits + 1)) return (0).toFixed(digits);
    const text = rounded.toFixed(digits);
    return rounded > 0 ? `+${text}` : text;
  }

  function tickFont(digits) {
    if (chart.width < 430) return digits >= 3 ? 7.4 : 8.5;
    if (chart.width < 760) return digits >= 3 ? 8.4 : 9.5;
    return digits >= 3 ? 10.2 : 11.5;
  }

  function axisPalette(theme) {
    if (theme === 'afternoon') return { panel: 'rgba(43, 28, 31, .965)', ink: '#fff3e9' };
    if (theme === 'night') return { panel: 'rgba(8, 11, 18, .94)', ink: '#f3f5fa' };
    return { panel: 'rgba(248, 244, 236, .94)', ink: '#171616' };
  }

  function roundTo(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }
})();
