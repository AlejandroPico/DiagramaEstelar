'use strict';

(() => {
  if (typeof regions === 'undefined' || typeof ctx === 'undefined') return;

  const LABEL_STYLE = {
    'main-sequence': { text: 'Secuencia principal', color: '#ffe67a', anchor: [7200, 2.5], angle: -26, priority: 5 },
    'red-giants': { text: 'Gigantes', color: '#ff9f5a', anchor: [4400, 360], angle: 0, priority: 3 },
    'supergiants': { text: 'Supergigantes', color: '#ff6b6b', anchor: [7800, 140000], angle: 0, priority: 2 },
    'white-dwarfs': { text: 'Enanas blancas', color: '#8ad0ff', anchor: [15500, 0.004], angle: -8, priority: 4 },
    'instability-strip': { text: 'Inestabilidad', color: '#c7a1ff', anchor: [5900, 900], angle: -54, priority: 1 }
  };

  labels = function stableScreenRegionLabels() {
    const dpr = canvas.width / Math.max(1, canvas.clientWidth || chart.width || 1);
    const box = visibleBox();
    const occupied = [];
    const screenPolys = Object.fromEntries(regions.map(region => [region.id, smoothScreenPolygon(region)]));
    const ordered = regions.slice().sort((a, b) => (LABEL_STYLE[b.id]?.priority || 0) - (LABEL_STYLE[a.id]?.priority || 0));

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.rect(chart.axis.left, chart.axis.top, chart.width - chart.axis.left - chart.axis.right, chart.height - chart.axis.top - chart.axis.bottom);
    ctx.clip();

    ordered.forEach(region => {
      const style = LABEL_STYLE[region.id] || { text: region.name, color: region.color, anchor: regionCentroid(region), angle: 0 };
      const pos = findStableLabel(region, style, box, occupied, screenPolys);
      if (!pos) return;
      occupied.push(pos.rect);
      drawFixedLabel(style.text, pos.x, pos.y, pos.angle, style.color, region.id);
    });

    ctx.restore();
  };

  function findStableLabel(region, style, box, occupied, screenPolys) {
    const poly = screenPolys[region.id];
    if (!poly || !polyIsVisible(poly, box)) return null;

    const fontSize = labelFontSize();
    const w = Math.max(116, style.text.length * fontSize * 0.62 + 26);
    const h = fontSize + 13;
    const anchor = toScreen(tempX(style.anchor[0]), lumY(style.anchor[1]));
    const visibleCenter = polygonVisibleCenter(poly, box) || { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };

    const candidates = [];
    addCandidate(candidates, anchor);
    addCandidate(candidates, visibleCenter);
    addEdgeWeightedCandidates(candidates, box, poly);

    const ranked = candidates.map(candidate => {
      const x = clamp(candidate.x, box.left + w / 2, box.right - w / 2);
      const y = clamp(candidate.y, box.top + h / 2, box.bottom - h / 2);
      const point = [x, y];
      if (!inPoly(point, poly)) return null;

      const rect = { x, y, w, h };
      const labelCollision = occupied.some(other => intersects(rect, other));
      const otherZones = Object.entries(screenPolys)
        .filter(([id]) => id !== region.id)
        .reduce((sum, [, other]) => sum + (inPoly(point, other) ? 1 : 0), 0);
      const edge = distanceToPolygon(point, poly);
      const anchorDistance = Math.hypot(x - anchor.x, y - anchor.y);
      const visibleDistance = Math.hypot(x - visibleCenter.x, y - visibleCenter.y);
      const score = edge * 7 - anchorDistance * 0.018 - visibleDistance * 0.045 - otherZones * 1600 - (labelCollision ? 2600 : 0);
      return { x, y, rect, angle: style.angle || 0, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score);

    return ranked[0] || null;
  }

  function addCandidate(out, point) {
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) out.push(point);
  }

  function addEdgeWeightedCandidates(out, box, poly) {
    const cols = chart.width < 760 ? 10 : 18;
    const rows = chart.width < 760 ? 7 : 12;
    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        const x = box.left + (box.right - box.left) * (ix + 0.5) / cols;
        const y = box.top + (box.bottom - box.top) * (iy + 0.5) / rows;
        if (inPoly([x, y], poly)) out.push({ x, y });
      }
    }
  }

  function drawFixedLabel(text, x, y, angleDeg, color, id) {
    const size = labelFontSize();
    const compact = chart.width < 760;
    const angle = !compact && id !== 'supergiants' && id !== 'red-giants' ? angleDeg * Math.PI / 180 : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `900 ${size}px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = alpha(css('--panel-solid'), .88);
    ctx.fillStyle = alpha(color, .98);
    ctx.shadowColor = alpha(css('--panel-solid'), .55);
    ctx.shadowBlur = 8;
    ctx.strokeText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function labelFontSize() {
    return Math.max(11, Math.min(14, chart.width / 104));
  }

  function visibleBox() {
    const m = 22;
    return {
      left: chart.axis.left + m,
      right: chart.width - chart.axis.right - m,
      top: chart.axis.top + m,
      bottom: chart.height - chart.axis.bottom - m
    };
  }

  function smoothScreenPolygon(region) {
    const pts = region.points.map(([t, l]) => [tempX(t), lumY(l)]);
    if (pts.length < 3) return pts.map(p => [worldToScreenX(p[0]), worldToScreenY(p[1])]);

    const smooth = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const current = pts[i];
      const previous = pts[(i - 1 + n) % n];
      const next = pts[(i + 1) % n];
      const start = midpoint(previous, current);
      const end = midpoint(current, next);
      for (let s = 0; s <= 10; s++) {
        const p = quadratic(start, current, end, s / 10);
        smooth.push([worldToScreenX(p[0]), worldToScreenY(p[1])]);
      }
    }
    return smooth;
  }

  function polygonVisibleCenter(poly, box) {
    const pts = poly.filter(p => p[0] >= box.left && p[0] <= box.right && p[1] >= box.top && p[1] <= box.bottom);
    const corners = [[box.left, box.top], [box.right, box.top], [box.right, box.bottom], [box.left, box.bottom]].filter(p => inPoly(p, poly));
    const all = pts.concat(corners);
    if (!all.length) return null;
    const avg = all.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
    return { x: avg[0] / all.length, y: avg[1] / all.length };
  }

  function polyIsVisible(poly, box) {
    if (poly.some(p => p[0] >= box.left && p[0] <= box.right && p[1] >= box.top && p[1] <= box.bottom)) return true;
    const corners = [[box.left, box.top], [box.right, box.top], [box.right, box.bottom], [box.left, box.bottom]];
    if (corners.some(p => inPoly(p, poly))) return true;
    for (let i = 0; i < poly.length; i++) {
      for (let j = 0; j < corners.length; j++) {
        if (segmentsIntersect(poly[i], poly[(i + 1) % poly.length], corners[j], corners[(j + 1) % corners.length])) return true;
      }
    }
    return false;
  }

  function toScreen(x, y) { return { x: worldToScreenX(x), y: worldToScreenY(y) }; }

  function inPoly(point, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      if (((yi > point[1]) !== (yj > point[1])) && point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside;
    }
    return inside;
  }

  function distanceToPolygon(point, poly) {
    let best = Infinity;
    for (let i = 0; i < poly.length; i++) best = Math.min(best, distancePointSegment(point, poly[i], poly[(i + 1) % poly.length]));
    return best;
  }

  function distancePointSegment(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy || 1;
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len, 0, 1);
    return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
  }

  function segmentsIntersect(a, b, c, d) {
    const o1 = orient(a, b, c);
    const o2 = orient(a, b, d);
    const o3 = orient(c, d, a);
    const o4 = orient(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
  }

  function orient(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }

  function midpoint(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }

  function quadratic(a, b, c, u) {
    const v = 1 - u;
    return [v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]];
  }

  function regionCentroid(region) {
    const avg = region.points.reduce((acc, [t, l]) => [acc[0] + t, acc[1] + Math.log10(l)], [0, 0]);
    return [avg[0] / region.points.length, 10 ** (avg[1] / region.points.length)];
  }

  function intersects(a, b) {
    return Math.abs(a.x - b.x) * 2 < (a.w + b.w) && Math.abs(a.y - b.y) * 2 < (a.h + b.h);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
})();
