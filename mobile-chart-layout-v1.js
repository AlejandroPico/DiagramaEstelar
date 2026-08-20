'use strict';

(() => {
  if (typeof chart === 'undefined' || typeof canvas === 'undefined') return;

  const toolbar = document.getElementById('floatingToolbar');

  updateChartMetrics = function updateChartMetricsResponsiveHud() {
    const w = Math.max(1, canvas.clientWidth || innerWidth || 1);
    const h = Math.max(1, canvas.clientHeight || innerHeight || 1);
    const ultraCompact = w < 430;
    const compact = w < 760;
    const mobileLayout = w <= 980;

    const left = ultraCompact ? 56 : compact ? 74 : 94;
    const right = ultraCompact ? 46 : compact ? 54 : 76;
    const bottom = ultraCompact ? 56 : compact ? 62 : 78;
    const desktopTop = ultraCompact ? 44 : compact ? 48 : 64;

    let top = desktopTop;
    if (mobileLayout) {
      const toolbarBottom = toolbar?.getBoundingClientRect?.().bottom || 52;
      const labelReserve = ultraCompact ? 44 : compact ? 48 : 52;
      top = Math.max(desktopTop, Math.ceil(toolbarBottom + labelReserve));
    }

    const maxTop = Math.max(70, h - bottom - 120);
    top = Math.min(top, maxTop);

    chart.width = w;
    chart.height = h;
    chart.axis = { left, right, top, bottom };
    chart.worldPlot = {
      x: left,
      y: top,
      w: Math.max(40, w - left - right),
      h: Math.max(40, h - top - bottom)
    };
  };

  if (toolbar && 'MutationObserver' in window) {
    const observer = new MutationObserver(mutations => {
      if (!mutations.some(mutation => mutation.attributeName === 'class')) return;
      window.requestAnimationFrame(refreshLayout);
    });
    observer.observe(toolbar, { attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('orientationchange', () => window.setTimeout(refreshLayout, 80), { passive: true });

  function refreshLayout() {
    if (typeof updateChartMetrics === 'function') updateChartMetrics();
    if (typeof clampView === 'function') clampView();
    if (typeof draw === 'function') draw();
  }
})();
