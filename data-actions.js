'use strict';

(() => {
  const importButton = document.getElementById('importCsvButton');
  const csvInput = document.getElementById('csvInput');

  if (!importButton || !csvInput) return;

  importButton.addEventListener('click', () => {
    csvInput.click();
  });
})();
