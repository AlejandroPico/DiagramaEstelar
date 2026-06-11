'use strict';

(() => {
  if (typeof regions === 'undefined' || typeof ctx === 'undefined') return;

  const REGION_STYLE = {
    'main-sequence': {
      label: 'Secuencia principal',
      short: 'Secuencia principal',
      color: '#ffe67a',
      anchor: [7200, 2.5],
      angle: -29,
      priority: 5
    },
    'red-giants': {
      label: 'Gigantes rojas y naranjas',
      short: 'Gigantes',
      color: '#ff9f5a',
      anchor: [4400, 360],
      angle: 2,
      priority: 3
    },
    'supergiants': {
      label: 'Supergigantes',
      short: 'Supergigantes',
      color: '#ff6b6b',
      anchor: [7800, 140000],
      angle: 0,
      priority: 2
    },
    'white-dwarfs': {
      label: 'Enanas blancas',
      short: 'Enanas blancas',
      color: '#8ad0ff',
      anchor: [15500, 0.004],
      angle: -13,
      priority: 4
    },
    'instability-strip': {
      label: 'Franja de inestabilidad',
      short: 'Inestabilidad',
      color: '#c7a1ff',
      anchor: [5900, 900],
      angle: -63,
      priority: 1
    }
  };

  const regionById = Object.fromEntries(regions.map(region => [region.id, region]));

  drawRegions = function drawPolishedEvolutionaryRegions() {
    const ordered = regions.slice().sort((a, b) => (REGION_STYLE[a.id]?.priority || 0) - (REGION_STYLE[b.id]?.priority || 0));
    ordered.forEach(region => drawSoftRegion(region));
  };

  labels = function drawFloatingEvolutionaryLabels() {
    const visible = getVisibleLabelBox();
    const occupied = [];
    const ordered = regions.slice().sort((a, b) => (REGION_STYLE[b.id]?.priority || 0) - (REGION_STYLE[a.id]?.priority || 0));

    ordered.forEach(region => {
      const style = REGION_STYLE[region.id] || {};
      const [t, l] = style.anchor || regionCentroid(region);
      const base = {
        x: worldToScreenX(tempX(t)),
        y: worldToScreenY(lumY(l))
      };
      const pos = keepLabelVisible(base, visible, occupied, region.id);
      occupied.push({ x: pos.x, y: pos.y, w: pos.w, h: pos.h });
      drawRegionLabel(style.short || region.name, pos.x, pos.y, style.angle || 0, style.color || region.color, region.id);
    });
  };

  regionAt = function polishedRegionAt(point) {
    const a = chart.axis;
    const sx = worldToScreenX(point.x);
    const sy = worldToScreenY(point.y);
    if (sx < a.left || sx > chart.width - a.right || sy < a.top || sy > chart.height - a.bottom) return null;

    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      const path = smoothRegionPath(region);
      ctx.save();
      ctx.beginPath();
      replayPath(path);
      const inside = ctx.isPointInPath(point.x, point.y);
      ctx.restore();
      if (inside) return region;
    }
    return null;
  };

  function drawSoftRegion(region) {
    const style = REGION_STYLE[region.id] || {};
    const color = style.color || region.color;
    const hot = state.hovered === region || state.selected === region;
    const path = smoothRegionPath(region);

    ctx.save();
    ctx.globalCompositeOperation = document.body.classList.contains('dark') ? 'screen' : 'multiply';

    ctx.beginPath();
    replayPath(path);
    ctx.shadowColor = alpha(color, hot ? .72 : .42);
    ctx.shadowBlur = (hot ? 28 : 20) / state.scale;
    ctx.fillStyle = alpha(color, hot ? .16 : .075);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    replayPath(path);
    ctx.fillStyle = alpha(color, hot ? .145 : .065);
    ctx.fill();

    ctx.beginPath();
    replayPath(path);
    ctx.strokeStyle = alpha(color, hot ? .88 : .46);
    ctx.lineWidth = (hot ? 2.4 : 1.35) / state.scale;
    ctx.setLineDash(region.id === 'instability-strip' ? [9 / state.scale, 7 / state.scale] : []);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function smoothRegionPath(region) {
    const pts = region.points.map(([t, l]) => [tempX(t), lumY(l)]);
    return buildSmoothClosedPath(pts);
  }

  function buildSmoothClosedPath(points) {
    if (points.length < 3) return points.map((p, index) => ({ type: index ? 'line' : 'move', p }));
    const out = [];
    const len = points.length;
    const firstMid = midpoint(points[len - 1], points[0]);
    out.push({ type: 'move', p: firstMid });
    for (let i = 0; i < len; i++) {
      const current = points[i];
      const next = points[(i + 1) % len];
      const mid = midpoint(current, next);
      out.push({ type: 'quad', cp: current, p: mid });
    }
    out.push({ type: 'close' });
    return out;
  }

  function replayPath(path) {
    path.forEach(cmd => {
      if (cmd.type === 'move') ctx.moveTo(cmd.p[0], cmd.p[1]);
      if (cmd.type === 'line') ctx.lineTo(cmd.p[0], cmd.p[1]);
      if (cmd.type === 'quad') ctx.quadraticCurveTo(cmd.cp[0], cmd.cp[1], cmd.p[0], cmd.p[1]);
      if (cmd.type === 'close') ctx.closePath();
    });
  }

  function midpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  function regionCentroid(region) {
    const avg = region.points.reduce((acc, [t, l]) => [acc[0] + t, acc[1] + Math.log10(l)], [0, 0]);
    return [avg[0] / region.points.length, 10 ** (avg[1] / region.points.length)];
  }

  function getVisibleLabelBox() {
    const margin = Math.max(16, Math.min(36, 22 / Math.max(.7, state.scale)));
    return {
      left: chart.axis.left + margin,
      right: chart.width - chart.axis.right - margin,
      top: chart.axis.top + margin,
      bottom: chart.height - chart.axis.bottom - margin
    };
  }

  function keepLabelVisible(base, box, occupied, id) {
    const compact = chart.width < 760;
    const width = compact ? 122 : id === 'main-sequence' ? 176 : id === 'instability-strip' ? 150 : 140;
    const height = compact ? 22 : 26;
    let x = clampNumber(base.x, box.left + width / 2, box.right - width / 2);
    let y = clampNumber(base.y, box.top + height / 2, box.bottom - height / 2);

    const offsets = [[0,0], [0,-34], [0,34], [-46,0], [46,0], [-42,-30], [42,30], [42,-30], [-42,30]];
    for (const [dx, dy] of offsets) {
      const candidate = {
        x: clampNumber(x + dx, box.left + width / 2, box.right - width / 2),
        y: clampNumber(y + dy, box.top + height / 2, box.bottom - height / 2),
        w: width,
        h: height
      };
      if (!occupied.some(rect => intersects(candidate, rect))) return candidate;
    }

    return { x, y, w: width, h: height };
  }

  function drawRegionLabel(text, x, y, angleDeg, color, id) {
    const size = Math.max(10.5, Math.min(15, chart.width / 92));
    const angle = Math.abs(angleDeg) > 1 ? angleDeg * Math.PI / 180 : 0;
    const compact = chart.width < 760;

    ctx.save();
    ctx.translate(x, y);
    if (!compact && id !== 'supergiants' && id !== 'red-giants') ctx.rotate(angle);
    ctx.font = `900 ${size}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = alpha(css('--panel-solid'), .82);
    ctx.fillStyle = alpha(color, .96);
    ctx.shadowColor = alpha(css('--panel-solid'), .55);
    ctx.shadowBlur = 10;
    ctx.strokeText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function intersects(a, b) {
    return Math.abs(a.x - b.x) * 2 < (a.w + b.w) && Math.abs(a.y - b.y) * 2 < (a.h + b.h);
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.addEventListener('load', () => {
    if (typeof draw === 'function') draw();
  });
})();
