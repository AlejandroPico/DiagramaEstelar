'use strict';

(() => {
  const hint = document.getElementById('emptyDataHint');
  const dataButton = document.getElementById('dataPanelButton');
  const dataPopover = document.getElementById('dataPopover');
  if (!hint || !dataButton || !dataPopover) return;

  let dismissed = false;

  function shouldShow() {
    if (dismissed) return false;
    if (dataPopover.classList.contains('open')) return false;
    if (typeof state === 'undefined') return true;
    return !Array.isArray(state.stars) || state.stars.length === 0;
  }

  function refresh() {
    positionHint();
    hint.classList.toggle('visible', shouldShow());
  }

  function positionHint() {
    const rect = dataButton.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const margin = 8;
    const width = Math.min(270, viewportWidth - margin * 2);
    const buttonCenter = rect.left + rect.width / 2;
    const desiredRight = Math.max(margin, viewportWidth - rect.right);
    const desiredLeft = viewportWidth - desiredRight - width;

    hint.style.top = `${Math.round(rect.bottom + 10)}px`;
    hint.style.width = `${Math.round(width)}px`;

    if (desiredLeft >= margin) {
      hint.style.left = 'auto';
      hint.style.right = `${Math.round(desiredRight)}px`;
      hint.style.setProperty('--hint-arrow-left', 'auto');
      hint.style.setProperty('--hint-arrow-right', `${Math.max(8, Math.round(rect.width / 2 - 8))}px`);
    } else {
      const left = margin;
      const arrowLeft = Math.max(8, Math.min(width - 24, buttonCenter - left - 8));
      hint.style.left = `${left}px`;
      hint.style.right = 'auto';
      hint.style.setProperty('--hint-arrow-right', 'auto');
      hint.style.setProperty('--hint-arrow-left', `${Math.round(arrowLeft)}px`);
    }
  }

  function openDataPanel() {
    dismissed = true;
    hint.classList.remove('visible');
    dataButton.click();
  }

  hint.addEventListener('click', openDataPanel);
  dataButton.addEventListener('click', () => {
    dismissed = true;
    window.setTimeout(refresh, 120);
  });

  window.addEventListener('resize', positionHint, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(positionHint, 120), { passive: true });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') window.setTimeout(refresh, 120);
  });

  window.__hrRefreshEmptyHint = refresh;
  window.setTimeout(refresh, 900);
  window.setInterval(refresh, 2500);
})();
