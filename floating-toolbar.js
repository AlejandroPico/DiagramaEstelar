'use strict';

(() => {
  const toolbar = document.getElementById('floatingToolbar');
  if (!toolbar) return;

  const searchWrap = document.getElementById('toolbarSearch');
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const themeButton = document.getElementById('themeButton');
  const zoomChip = document.getElementById('zoomValue');
  const popoverButtons = Array.from(toolbar.querySelectorAll('[data-popover-target]'));
  const popovers = Array.from(document.querySelectorAll('.toolbar-popover'));

  const originalSearch = searchButton ? searchButton.onclick : null;

  popoverButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const target = document.getElementById(button.dataset.popoverTarget);
      if (!target) return;
      const willOpen = !target.classList.contains('open');
      closePopovers();
      if (willOpen) {
        target.classList.add('open');
        button.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  if (searchButton && searchWrap && searchInput) {
    searchButton.onclick = event => {
      event.stopPropagation();
      closePopovers();
      if (!searchWrap.classList.contains('open')) {
        searchWrap.classList.add('open');
        searchButton.classList.add('active');
        searchButton.setAttribute('aria-expanded', 'true');
        searchInput.focus();
        return;
      }
      if (searchInput.value.trim()) {
        if (typeof originalSearch === 'function') originalSearch.call(searchButton, event);
        else if (typeof runSearch === 'function') runSearch();
      }
    };

    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeSearch();
    });
  }

  if (themeButton) {
    renderThemeIcon();
    themeButton.onclick = () => {
      document.body.classList.toggle('dark');
      renderThemeIcon();
      draw();
    };
  }

  if (zoomChip) {
    zoomChip.title = 'Restablecer vista al 100%';
    zoomChip.setAttribute('aria-label', 'Restablecer zoom al 100%');
    zoomChip.addEventListener('click', () => {
      if (typeof fit === 'function') fit();
    });
  }

  document.addEventListener('click', event => {
    if (toolbar.contains(event.target) || popovers.some(popover => popover.contains(event.target))) return;
    closePopovers();
    closeSearch();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closePopovers();
      closeSearch();
    }
  });

  function closePopovers() {
    popovers.forEach(popover => popover.classList.remove('open'));
    popoverButtons.forEach(button => {
      button.classList.remove('active');
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function closeSearch() {
    if (!searchWrap || !searchButton) return;
    searchWrap.classList.remove('open');
    searchButton.classList.remove('active');
    searchButton.setAttribute('aria-expanded', 'false');
  }

  function renderThemeIcon() {
    if (!themeButton) return;
    const dark = document.body.classList.contains('dark');
    themeButton.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    themeButton.title = dark ? 'Modo claro' : 'Modo oscuro';
    themeButton.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
  }
})();
