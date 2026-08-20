'use strict';

(() => {
  if (typeof viewport === 'undefined' || typeof canvas === 'undefined' || typeof state === 'undefined') return;

  const activeTouches = new Map();
  const originalPointerDown = viewport.onpointerdown;
  let panStart = null;
  let pinchStart = null;
  let gestureMoved = false;
  let suppressClickUntil = 0;
  let drawFrame = 0;
  let resizeFrame = 0;

  syncVisualViewport();
  installViewportResizeTracking();
  installTouchNavigation();

  function installViewportResizeTracking() {
    window.addEventListener('orientationchange', scheduleViewportSync, { passive: true });
    window.addEventListener('resize', scheduleViewportSync, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleViewportSync, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleViewportSync, { passive: true });
    }

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => scheduleCanvasResize());
      observer.observe(viewport);
    }
  }

  function scheduleViewportSync() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      syncVisualViewport();
      scheduleCanvasResize();
    });
  }

  function syncVisualViewport() {
    const vv = window.visualViewport;
    const width = Math.max(1, Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 1));
    const height = Math.max(1, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 1));
    document.documentElement.style.setProperty('--hr-viewport-width', `${width}px`);
    document.documentElement.style.setProperty('--hr-viewport-height', `${height}px`);
  }

  function scheduleCanvasResize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (typeof resize === 'function') resize();
      if (typeof clampView === 'function') clampView();
      window.__HR_WEBGL_RENDERER__?.resize?.();
      requestDraw();
    });
  }

  function installTouchNavigation() {
    viewport.onpointerdown = event => {
      if (event.pointerType !== 'touch') {
        if (typeof originalPointerDown === 'function') originalPointerDown.call(viewport, event);
        return;
      }

      event.preventDefault();
      try { viewport.setPointerCapture(event.pointerId); } catch (_) {}
      activeTouches.set(event.pointerId, pointFromEvent(event));
      state.dragging = false;
      state.dragStart = null;
      viewport.classList.add('dragging');

      if (activeTouches.size === 1) beginPan();
      else if (activeTouches.size >= 2) beginPinch();
    };

    viewport.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch' || !activeTouches.has(event.pointerId)) return;
      event.preventDefault();
      event.stopPropagation();
      activeTouches.set(event.pointerId, pointFromEvent(event));

      if (activeTouches.size >= 2) updatePinch();
      else updatePan();
    }, { capture: true, passive: false });

    const finishTouch = event => {
      if (event.pointerType !== 'touch' || !activeTouches.has(event.pointerId)) return;

      const wasLastTouch = activeTouches.size === 1;
      const wasTap = wasLastTouch && !gestureMoved;
      if (!wasTap) event.preventDefault();
      event.stopPropagation();
      activeTouches.delete(event.pointerId);
      try { viewport.releasePointerCapture(event.pointerId); } catch (_) {}

      if (activeTouches.size >= 2) beginPinch();
      else if (activeTouches.size === 1) beginPan();
      else {
        panStart = null;
        pinchStart = null;
        state.dragging = false;
        state.dragStart = null;
        viewport.classList.remove('dragging');

        suppressClickUntil = performance.now() + 350;
        if (wasTap && typeof clickCanvas === 'function') clickCanvas(event);
        window.setTimeout(() => { gestureMoved = false; }, 0);
      }
    };

    window.addEventListener('pointerup', finishTouch, { capture: true, passive: false });
    window.addEventListener('pointercancel', finishTouch, { capture: true, passive: false });

    viewport.addEventListener('click', event => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function beginPan() {
    const touch = firstTouch();
    if (!touch) return;
    pinchStart = null;
    panStart = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      tx: state.tx,
      ty: state.ty
    };
  }

  function updatePan() {
    const touch = firstTouch();
    if (!touch || !panStart) return;
    const dx = touch.clientX - panStart.clientX;
    const dy = touch.clientY - panStart.clientY;
    if (Math.hypot(dx, dy) > 4) gestureMoved = true;
    state.tx = panStart.tx + dx;
    state.ty = panStart.ty + dy;
    if (typeof clampView === 'function') clampView();
    requestDraw();
  }

  function beginPinch() {
    const touches = firstTwoTouches();
    if (touches.length < 2) return;
    const [a, b] = touches;
    const rect = canvas.getBoundingClientRect();
    const midX = (a.clientX + b.clientX) / 2 - rect.left;
    const midY = (a.clientY + b.clientY) / 2 - rect.top;
    const distance = Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY));

    panStart = null;
    pinchStart = {
      distance,
      scale: state.scale,
      worldX: (midX - state.tx) / state.scale,
      worldY: (midY - state.ty) / state.scale
    };
    gestureMoved = true;
  }

  function updatePinch() {
    const touches = firstTwoTouches();
    if (touches.length < 2) return;
    if (!pinchStart) beginPinch();
    if (!pinchStart) return;

    const [a, b] = touches;
    const rect = canvas.getBoundingClientRect();
    const midX = (a.clientX + b.clientX) / 2 - rect.left;
    const midY = (a.clientY + b.clientY) / 2 - rect.top;
    const distance = Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY));
    const factor = distance / pinchStart.distance;
    const minScale = Number.isFinite(chart?.minScale) ? chart.minScale : 1;
    const maxScale = Number.isFinite(chart?.maxScale) ? chart.maxScale : 70;
    const nextScale = clampValue(pinchStart.scale * factor, minScale, maxScale);

    state.scale = nextScale;
    state.tx = midX - pinchStart.worldX * nextScale;
    state.ty = midY - pinchStart.worldY * nextScale;
    if (typeof clampView === 'function') clampView();
    if (typeof updateZoom === 'function') updateZoom();
    requestDraw();
  }

  function requestDraw() {
    if (drawFrame) return;
    drawFrame = requestAnimationFrame(() => {
      drawFrame = 0;
      if (typeof draw === 'function') draw();
    });
  }

  function pointFromEvent(event) {
    return { clientX: event.clientX, clientY: event.clientY };
  }

  function firstTouch() {
    return activeTouches.values().next().value || null;
  }

  function firstTwoTouches() {
    return Array.from(activeTouches.values()).slice(0, 2);
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
})();
