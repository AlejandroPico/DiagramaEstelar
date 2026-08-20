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

      if (searchWrap.classList.contains('open')) {
        if (searchInput.value.trim()) {
          if (typeof originalSearch === 'function') originalSearch.call(searchButton, event);
          else if (typeof runSearch === 'function') runSearch();
        }
        closeSearch();
        return;
      }

      searchWrap.classList.add('open');
      toolbar.classList.add('search-open');
      searchButton.classList.add('active');
      searchButton.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => searchInput.focus({ preventScroll: true }), 170);
    };

    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeSearch();
        searchButton.focus();
      }
      if (event.key === 'Enter' && searchInput.value.trim()) {
        event.preventDefault();
        if (typeof originalSearch === 'function') originalSearch.call(searchButton, event);
        else if (typeof runSearch === 'function') runSearch();
      }
    });
  }

  if (themeButton) {
    renderThemeIcon();
    themeButton.onclick = event => {
      event.stopPropagation();
      closePopovers();
      closeSearch();
      if (window.__HR_THEME__) window.__HR_THEME__.cycle();
      else document.body.classList.toggle('dark');
      renderThemeIcon();
      if (typeof draw === 'function') draw();
    };
    window.addEventListener('hr-theme-change', renderThemeIcon);
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

  window.addEventListener('hr-close-toolbar', () => {
    closePopovers();
    closeSearch();
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
    toolbar.classList.remove('search-open');
    searchButton.classList.remove('active');
    searchButton.setAttribute('aria-expanded', 'false');
  }

  function renderThemeIcon() {
    if (!themeButton) return;
    const api = window.__HR_THEME__;
    const mode = api?.mode || (document.body.classList.contains('dark') ? 'night' : 'day');
    const resolved = api?.resolved || mode;
    const label = {
      auto: `Automático · ${themeName(resolved)}`,
      day: 'Día',
      afternoon: 'Tarde',
      night: 'Noche'
    }[mode] || 'Tema';

    themeButton.setAttribute('aria-label', `Cambiar tema. Actual: ${label}`);
    themeButton.title = `Tema: ${label}`;
    themeButton.classList.toggle('active', mode === 'auto');

    if (mode === 'auto') {
      themeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"></circle><path d="M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4"></path><path d="M21 15.2A6.5 6.5 0 0 1 12.8 7 6.7 6.7 0 1 0 21 15.2Z"></path></svg>';
    } else if (mode === 'day') {
      themeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
    } else if (mode === 'afternoon') {
      themeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18"></path><path d="M6 15a6 6 0 0 1 12 0"></path><path d="M12 4v3M4.9 8.1 7 10.2M19.1 8.1 17 10.2"></path></svg>';
    } else {
      themeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"></path></svg>';
    }
  }

  function themeName(value) {
    return value === 'afternoon' ? 'tarde' : value === 'night' ? 'noche' : 'día';
  }
})();
