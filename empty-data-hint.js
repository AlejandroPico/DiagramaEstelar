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
    hint.classList.toggle('visible', shouldShow());
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

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') window.setTimeout(refresh, 120);
  });

  window.__hrRefreshEmptyHint = refresh;
  window.setTimeout(refresh, 900);
  window.setInterval(refresh, 2500);
})();
