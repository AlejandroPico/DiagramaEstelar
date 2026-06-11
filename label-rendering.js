'use strict';

(() => {
  if (typeof drawStar !== 'function') return;

  drawStar = function drawStarWithFixedLabel(s) {
    const x = tempX(s.teff);
    const y = lumY(s.luminosity);
    const hot = state.hovered === s || state.selected === s;
    const marker = Number.isFinite(s.marker) ? s.marker : 4.2;
    const r = (hot ? 8 : marker) / state.scale;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 7);

    glow.addColorStop(0, alpha(s.color, hot ? .48 : .25));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 7, 0, Math.PI * 2);
    ctx.fill();

    dot(x, y, r, s.color);
    ctx.strokeStyle = document.body.classList.contains('dark') ? 'rgba(255,255,255,.85)' : 'rgba(20,20,20,.65)';
    ctx.lineWidth = (hot ? 2.5 : 1.3) / state.scale;
    ctx.stroke();

    if (hot || state.scale > 1.9) {
      const labelPx = hot ? 13 : 12;
      const outlinePx = 4;
      const offsetPx = hot ? 12 : 10;

      ctx.font = `900 ${labelPx / state.scale}px system-ui`;
      ctx.fillStyle = css('--ink');
      ctx.strokeStyle = css('--panel-solid');
      ctx.lineWidth = outlinePx / state.scale;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.strokeText(s.name, x + r + offsetPx / state.scale, y);
      ctx.fillText(s.name, x + r + offsetPx / state.scale, y);
    }
  };
})();
