'use strict';

(() => {
  const MANIFEST_URL = 'data/catalogs/manifest.json';
  const AUTO_LOAD_REPO_CATALOGS = false;
  const button = document.getElementById('repoCatalogButton');
  const overlay = document.getElementById('loadingOverlay');
  const overlayTitle = document.getElementById('loadingTitle');
  const overlayDetail = document.getElementById('loadingDetail');
  const overlayBar = document.getElementById('loadingProgressBar');
  const overlayPercent = document.getElementById('loadingProgressPercent');

  if (!button || !ui.csv || typeof ui.csv.onchange !== 'function') return;

  checkManifest();

  async function checkManifest() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) return;
      const manifest = await res.json();
      if (!manifest || !Array.isArray(manifest.datasets) || !manifest.datasets.length) return;

      const chunkCount = manifest.datasets.reduce((sum, dataset) => sum + (Array.isArray(dataset.chunks) ? dataset.chunks.length : 0), 0);
      button.hidden = false;
      button.disabled = false;
      button.textContent = `Cargar catálogos del repositorio (${manifest.datasets.length} catálogos / ${chunkCount} partes)`;
      button.onclick = () => loadStaticCatalogs(manifest);

      ui.status.textContent = `Catálogos del repositorio detectados: ${manifest.datasets.length} catálogos / ${chunkCount} partes. Pulsa el botón para cargarlos.`;

      if (AUTO_LOAD_REPO_CATALOGS && !window.__hrRepoCatalogAutoLoaded) {
        window.__hrRepoCatalogAutoLoaded = true;
        window.setTimeout(() => loadStaticCatalogs(manifest), 120);
      }
    } catch (error) {
      // Si no existe manifest.json, el proyecto sigue funcionando con importación local.
    }
  }

  async function loadStaticCatalogs(manifest) {
    const datasets = manifest.datasets.filter(dataset => Array.isArray(dataset.chunks) && dataset.chunks.length);
    if (!datasets.length) {
      ui.status.textContent = 'El manifest de catálogos no contiene partes CSV.';
      return;
    }

    button.disabled = true;
    const files = [];
    const totalChunks = datasets.reduce((sum, dataset) => sum + dataset.chunks.length, 0);
    let loadedChunks = 0;

    showProgress('Cargando catálogos del repositorio', 'Preparando descarga de catálogos…', 0);

    try {
      for (const dataset of datasets) {
        const blobs = [];
        const label = dataset.label || dataset.id || 'catálogo';

        for (const chunk of dataset.chunks) {
          loadedChunks++;
          const path = chunk.path || chunk.url;
          if (!path) continue;

          const pct = Math.round((loadedChunks - 1) / totalChunks * 70);
          setProgress(`Descargando ${label} · parte ${loadedChunks}/${totalChunks}`, pct);
          ui.status.textContent = `Descargando catálogos ${loadedChunks}/${totalChunks}: ${label}…`;

          const res = await fetch(path, { cache: 'no-store' });
          if (!res.ok) throw new Error(`No se pudo descargar ${path}: HTTP ${res.status}`);
          blobs.push(await res.blob());

          setProgress(`Descargada ${label} · parte ${loadedChunks}/${totalChunks}`, Math.round(loadedChunks / totalChunks * 70));
        }

        if (blobs.length) {
          const filename = dataset.source_file || `${dataset.id || label}.csv`;
          files.push(new File(blobs, filename, { type: 'text/csv' }));
        }
      }

      if (!files.length) throw new Error('No se descargó ningún catálogo CSV válido.');

      setProgress(`Procesando ${files.length} catálogo(s) en el navegador…`, 78);
      ui.status.textContent = `Catálogos descargados. Procesando ${files.length} catálogo(s)…`;

      await ui.csv.onchange({ target: { files, value: '' } });

      setProgress('Catálogos cargados correctamente.', 100);
      window.setTimeout(hideProgress, 700);
    } catch (error) {
      console.error(error);
      setProgress(`Error: ${error.message}`, 100, true);
      ui.status.textContent = `Error cargando catálogos del repositorio: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }

  function showProgress(title, detail, percent) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.add('progress-mode');
    if (overlayTitle) overlayTitle.textContent = title;
    setProgress(detail, percent);
  }

  function setProgress(detail, percent, error = false) {
    const safe = Math.max(0, Math.min(100, Math.round(percent || 0)));
    if (overlayDetail) overlayDetail.textContent = detail;
    if (overlayBar) overlayBar.style.width = `${safe}%`;
    if (overlayPercent) overlayPercent.textContent = `${safe}%`;
    if (overlay) overlay.classList.toggle('error-mode', Boolean(error));
  }

  function hideProgress() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('progress-mode', 'error-mode');
    if (overlayTitle) overlayTitle.textContent = 'Preparando diagrama estelar…';
    if (overlayDetail) overlayDetail.textContent = 'Inicializando motor visual…';
    if (overlayBar) overlayBar.style.width = '0%';
    if (overlayPercent) overlayPercent.textContent = '0%';
  }
})();
