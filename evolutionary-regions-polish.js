'use strict';

(() => {
  if (typeof regions === 'undefined' || typeof ctx === 'undefined') return;

  const REGION_STYLE = {
    'main-sequence': {
      label: 'Secuencia principal',
      short: 'Secuencia principal',
      color: '#ffe67a',
      anchor: [7200, 2.5],
      angle: -27,
      priority: 5
    },
    'red-giants': {
      label: 'Gigantes rojas y naranjas',
      short: 'Gigantes',
      color: '#ff9f5a',
      anchor: [4400, 360],
      angle: 0,
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
      angle: -10,
      priority: 4
    },
    'instability-strip': {
      label: 'Franja de inestabilidad',
      short: 'Inestabilidad',
      color: '#c7a1ff',
      anchor: [5900, 900],
      angle: -58,
      priority: 1
    }
  };

  drawRegions = function drawPolishedEvolutionaryRegions() {
    const ordered = regions.slice().sort((a, b) => (REGION_STYLE[a.id]?.priority || 0) - (REGION_STYLE[b.id]?.priority || 0));
    ordered.forEach(region => drawSoftRegion(region));
  };

  labels = function drawFloatingEvolutionaryLabels() {
    const box = getVisibleLabelBox();
    const occupied = [];
    const ordered = regions.slice().sort((a, b) => (REGION_STYLE[b.id]?.priority || 0) - (REGION_STYLE[a.id]?.priority || 0));
    const screenPolys = Object.fromEntries(regions.map(region => [region.id, smoothRegionPolygon(region).map(worldToScreenPoint)]));

    ordered.forEach(region => {
      const style = REGION_STYLE[region.id] || {};
      const text = style.short || region.name;
      const pos = findVisibleLabelPosition(region, text, box, occupied, screenPolys);
      if (!pos) return;
      occupied.push(pos.rect);
      drawRegionLabel(text, pos.x, pos.y, pos.angle, style.color || region.color, region.id);
    });
  };

  regionAt = function polishedRegionAt(point) {
    const a = chart.axis;
    const sx = worldToScreenX(point.x);
    const sy = worldToScreenY(point.y);
    if (sx < a.left || sx > chart.width - a.right || sy < a.top || sy > chart.height - a.bottom) return null;

    const candidates = regions.map(region => {
      const poly = smoothRegionPolygon(region);
      const screenPoly = poly.map(worldToScreenPoint);
      const inside = inPolyPoint([point.x, point.y], poly);
      const edgeDistance = distanceToPolygonScreen([sx, sy], screenPoly);
      if (!inside && edgeDistance > 10) return null;
      const style = REGION_STYLE[region.id] || {};
      const [at, al] = style.anchor || regionCentroid(region);
      const ax = worldToScreenX(tempX(at));
      const ay = worldToScreenY(lumY(al));
      return {
        region,
        inside,
        edgeDistance,
        anchorDistance: Math.hypot(sx - ax, sy - ay),
        area: Math.abs(polyArea(screenPoly))
      };
    }).filter(Boolean);

    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      if (a.inside !== b.inside) return a.inside ? -1 : 1;
      if (Math.abs(a.area - b.area) > 1) return a.area - b.area;
      return a.anchorDistance - b.anchorDistance;
    });
    return candidates[0].region;
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
    ctx.shadowBlur = (hot ? 30 : 22) / state.scale;
    ctx.fillStyle = alpha(color, hot ? .16 : .072);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    replayPath(path);
    ctx.fillStyle = alpha(color, hot ? .135 : .057);
    ctx.fill();

    ctx.beginPath();
    replayPath(path);
    ctx.strokeStyle = alpha(color, hot ? .88 : .44);
    ctx.lineWidth = (hot ? 2.35 : 1.25) / state.scale;
    ctx.setLineDash(region.id === 'instability-strip' ? [9 / state.scale, 7 / state.scale] : []);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function smoothRegionPath(region) {
    return buildSmoothClosedPath(region.points.map(([t, l]) => [tempX(t), lumY(l)]));
  }

  function smoothRegionPolygon(region) {
    const pts = region.points.map(([t, l]) => [tempX(t), lumY(l)]);
    if (pts.length < 3) return pts;
    const out = [];
    const len = pts.length;
    for (let i = 0; i < len; i++) {
      const current = pts[i];
      const next = pts[(i + 1) % len];
      const start = midpoint(pts[(i - 1 + len) % len], current);
      const end = midpoint(current, next);
      for (let s = 0; s <= 8; s++) {
        const u = s / 8;
        out.push(quadraticPoint(start, current, end, u));
      }
    }
    return out;
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
      out.push({ type: 'quad', cp: current, p: midpoint(current, next) });
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

  function findVisibleLabelPosition(region, text, box, occupied, screenPolys) {
    const style = REGION_STYLE[region.id] || {};
    const poly = screenPolys[region.id];
    if (!poly || !poly.some(p => pointInBox(p, box)) && !polyIntersectsBox(poly, box)) return null;

    const compact = chart.width < 760;
    const size = Math.max(10.5, Math.min(15, chart.width / 92));
    const width = Math.max(compact ? 112 : 128, text.length * size * .62 + 24);
    const height = compact ? 22 : 26;
    const center = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
    const [anchorT, anchorL] = style.anchor || regionCentroid(region);
    const anchor = { x: worldToScreenX(tempX(anchorT)), y: worldToScreenY(lumY(anchorL)) };

    const candidates = [];
    candidates.push(anchor);
    candidates.push(center);

    const columns = compact ? 6 : 9;
    const rows = compact ? 5 : 7;
    for (let ix = 0; ix < columns; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        candidates.push({
          x: box.left + (box.right - box.left) * (ix + .5) / columns,
          y: box.top + (box.bottom - box.top) * (iy + .5) / rows
        });
      }
    }

    const ranked = candidates.map(candidate => {
      const x = clampNumber(candidate.x, box.left + width / 2, box.right - width / 2);
      const y = clampNumber(candidate.y, box.top + height / 2, box.bottom - height / 2);
      const point = [x, y];
      const insideOwn = inPolyPoint(point, poly);
      if (!insideOwn) return null;
      const rect = { x, y, w: width, h: height };
      const labelOverlap = occupied.some(item => intersects(rect, item));
      const otherZones = Object.entries(screenPolys).filter(([id]) => id !== region.id).reduce((sum, [, other]) => sum + (inPolyPoint(point, other) ? 1 : 0), 0);
      const edge = distanceToPolygonScreen(point, poly);
      const centerDistance = Math.hypot(x - center.x, y - center.y);
      const anchorDistance = Math.hypot(x - anchor.x, y - anchor.y);
      const score = edge * 6 - centerDistance * .06 - anchorDistance * .02 - otherZones * 900 - (labelOverlap ? 1200 : 0);
      return { x, y, rect, angle: style.angle || 0, score, labelOverlap, otherZones };
    }).filter(Boolean).sort((a, b) => b.score - a.score);

    return ranked[0] || null;
  }

  function drawRegionLabel(text, x, y, angleDeg, color, id) {
    const size = Math.max(10.5, Math.min(15, chart.width / 92));
    const compact = chart.width < 760;
    const angle = !compact && id !== 'supergiants' && id !== 'red-giants' ? angleDeg * Math.PI / 180 : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `900 ${size}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = alpha(css('--panel-solid'), .84);
    ctx.fillStyle = alpha(color, .97);
    ctx.shadowColor = alpha(css('--panel-solid'), .58);
    ctx.shadowBlur = 9;
    ctx.strokeText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function getVisibleLabelBox() {
    const margin = 20;
    return {
      left: chart.axis.left + margin,
      right: chart.width - chart.axis.right - margin,
      top: chart.axis.top + margin,
      bottom: chart.height - chart.axis.bottom - margin
    };
  }

  function worldToScreenPoint(p) {
    return [worldToScreenX(p[0]), worldToScreenY(p[1])];
  }

  function pointInBox(p, box) {
    return p[0] >= box.left && p[0] <= box.right && p[1] >= box.top && p[1] <= box.bottom;
  }

  function polyIntersectsBox(poly, box) {
    if (poly.some(p => pointInBox(p, box))) return true;
    const corners = [[box.left, box.top], [box.right, box.top], [box.right, box.bottom], [box.left, box.bottom]];
    if (corners.some(p => inPolyPoint(p, poly))) return true;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      for (let j = 0; j < corners.length; j++) {
        if (segmentsIntersect(a, b, corners[j], corners[(j + 1) % corners.length])) return true;
      }
    }
    return false;
  }

  function inPolyPoint(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside;
    }
    return inside;
  }

  function distanceToPolygonScreen(point, poly) {
    let best = Infinity;
    for (let i = 0; i < poly.length; i++) {
      best = Math.min(best, distancePointSegment(point, poly[i], poly[(i + 1) % poly.length]));
    }
    return best;
  }

  function distancePointSegment(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy || 1;
    const t = clampNumber(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len, 0, 1);
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

  function polyArea(poly) {
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    return area / 2;
  }

  function quadraticPoint(a, b, c, u) {
    const v = 1 - u;
    return [v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]];
  }

  function midpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  function regionCentroid(region) {
    const avg = region.points.reduce((acc, [t, l]) => [acc[0] + t, acc[1] + Math.log10(l)], [0, 0]);
    return [avg[0] / region.points.length, 10 ** (avg[1] / region.points.length)];
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
