'use strict';

(() => {
  const STORAGE_KEY = 'diagrama-estelar-theme';
  const MODES = ['auto', 'day', 'afternoon', 'night'];
  const body = document.body;
  let mode = readMode();
  let position = null;
  let resolved = 'day';
  let timer = 0;

  const originalDrawBackground = typeof drawBackground === 'function' ? drawBackground : null;
  if (originalDrawBackground) {
    drawBackground = function drawBackgroundBySolarTheme() {
      const theme = body.dataset.themeResolved || resolved || 'day';
      const base = ctx.createLinearGradient(0, 0, chart.width, chart.height);

      if (theme === 'night') {
        base.addColorStop(0, '#070a12');
        base.addColorStop(.55, '#101725');
        base.addColorStop(1, '#1a0f1f');
      } else if (theme === 'afternoon') {
        base.addColorStop(0, '#221719');
        base.addColorStop(.5, '#49302a');
        base.addColorStop(1, '#3b2232');
      } else {
        base.addColorStop(0, '#f8f4ec');
        base.addColorStop(.55, '#efe7d9');
        base.addColorStop(1, '#f4dcc8');
      }

      ctx.fillStyle = base;
      ctx.fillRect(0, 0, chart.width, chart.height);

      const p = chart.worldPlot;
      const g = ctx.createRadialGradient(
        p.x + p.w * .12,
        p.y + p.h * .1,
        0,
        p.x + p.w * .12,
        p.y + p.h * .1,
        Math.max(p.w, p.h)
      );

      if (theme === 'night') {
        g.addColorStop(0, 'rgba(116,154,255,.18)');
        g.addColorStop(.45, 'rgba(255,224,135,.11)');
        g.addColorStop(1, 'rgba(255,112,78,.10)');
      } else if (theme === 'afternoon') {
        g.addColorStop(0, 'rgba(116,154,255,.13)');
        g.addColorStop(.42, 'rgba(255,196,109,.18)');
        g.addColorStop(1, 'rgba(255,105,74,.18)');
      } else {
        g.addColorStop(0, 'rgba(116,154,255,.25)');
        g.addColorStop(.45, 'rgba(255,224,135,.11)');
        g.addColorStop(1, 'rgba(255,112,78,.10)');
      }

      ctx.fillStyle = g;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    };
  }

  applyTheme(false);
  requestLocation();
  timer = window.setInterval(() => {
    if (mode === 'auto') applyTheme(true);
  }, 60_000);

  window.__HR_THEME__ = {
    get mode() { return mode; },
    get resolved() { return resolved; },
    get position() { return position; },
    cycle,
    setMode,
    refresh: () => applyTheme(true)
  };

  function readMode() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return MODES.includes(saved) ? saved : 'auto';
    } catch (_) {
      return 'auto';
    }
  }

  function cycle() {
    const index = MODES.indexOf(mode);
    setMode(MODES[(index + 1) % MODES.length]);
  }

  function setMode(next) {
    mode = MODES.includes(next) ? next : 'auto';
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
    applyTheme(true);
  }

  function applyTheme(redraw) {
    resolved = mode === 'auto' ? resolveAutomaticTheme(new Date()) : mode;
    body.classList.remove('dark', 'theme-day', 'theme-afternoon', 'theme-night');
    body.classList.add(`theme-${resolved}`);
    body.classList.toggle('dark', resolved === 'night');
    body.dataset.themeMode = mode;
    body.dataset.themeResolved = resolved;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.themeResolved = resolved;

    window.dispatchEvent(new CustomEvent('hr-theme-change', {
      detail: { mode, resolved, position }
    }));

    if (redraw && typeof draw === 'function') draw();
  }

  function requestLocation() {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        position = { latitude: coords.latitude, longitude: coords.longitude };
        if (mode === 'auto') applyTheme(true);
      },
      () => {
        position = null;
        if (mode === 'auto') applyTheme(true);
      },
      { enableHighAccuracy: false, maximumAge: 3_600_000, timeout: 8_000 }
    );
  }

  function resolveAutomaticTheme(date) {
    if (!position) return resolveByLocalClock(date);

    const altitudeNow = solarAltitude(date, position.latitude, position.longitude);
    const altitudeLater = solarAltitude(new Date(date.getTime() + 20 * 60_000), position.latitude, position.longitude);
    const descending = altitudeLater < altitudeNow;

    if (altitudeNow <= -6) return 'night';
    if (descending && altitudeNow <= 16) return 'afternoon';
    return 'day';
  }

  function resolveByLocalClock(date) {
    const hour = date.getHours() + date.getMinutes() / 60;
    if (hour >= 7 && hour < 17.5) return 'day';
    if (hour >= 17.5 && hour < 20.5) return 'afternoon';
    return 'night';
  }

  function solarAltitude(date, latitude, longitude) {
    const rad = Math.PI / 180;
    const dayMs = 86_400_000;
    const J1970 = 2440588;
    const J2000 = 2451545;
    const e = rad * 23.4397;
    const lw = -longitude * rad;
    const phi = latitude * rad;
    const julian = date.valueOf() / dayMs - 0.5 + J1970;
    const d = julian - J2000;
    const M = rad * (357.5291 + 0.98560028 * d);
    const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M) + 102.9372) + Math.PI;
    const dec = Math.asin(Math.sin(L) * Math.sin(e));
    const ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
    const sidereal = rad * (280.16 + 360.9856235 * d) - lw;
    const H = sidereal - ra;
    const altitude = Math.asin(
      Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)
    );
    return altitude / rad;
  }
})();
