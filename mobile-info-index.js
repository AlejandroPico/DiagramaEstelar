'use strict';

(() => {
  const popover = document.getElementById('infoPopover');
  if (!popover) return;

  function installMobileIndex() {
    const guide = popover.querySelector('.info-guide');
    const head = popover.querySelector('.info-guide-head');
    const tabs = popover.querySelector('.info-guide-tabs');
    if (!guide || !head || !tabs || head.querySelector('.info-guide-index-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'info-guide-index-button';
    button.textContent = 'Temas';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'infoGuideTabs');
    tabs.id = 'infoGuideTabs';

    button.addEventListener('click', event => {
      event.stopPropagation();
      const open = guide.classList.toggle('mobile-index-open');
      button.setAttribute('aria-expanded', String(open));
    });

    tabs.addEventListener('click', event => {
      if (!event.target.closest('[data-info-tab]')) return;
      guide.classList.remove('mobile-index-open');
      button.setAttribute('aria-expanded', 'false');
    });

    head.insertBefore(button, head.querySelector('.info-guide-close'));
  }

  const observer = new MutationObserver(installMobileIndex);
  observer.observe(popover, { childList: true, subtree: true });
  installMobileIndex();
})();
