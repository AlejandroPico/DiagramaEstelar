'use strict';

(() => {
  const MANIFEST_URL = 'data/catalogs/manifest.json';
  const AUTO_LOAD_REPO_CATALOGS = true;
  const button = document.getElementById('repoCatalogButton');
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
      button.textContent = `Recargar catálogos del repositorio (${manifest.datasets.length} catálogos / ${chunkCount} partes)`;
      button.onclick = () => loadStaticCatalogs(manifest, { auto: false });

      if (AUTO_LOAD_REPO_CATALOGS && !window.__hrRepoCatalogAutoLoaded) {
        window.__hrRepoCatalogAutoLoaded = true;
        window.setTimeout(() => loadStaticCatalogs(manifest, { auto: true }), 120);
      }
    } catch (error) {
      // Si no existe manifest.json, el proyecto sigue funcionando con importación local.
    }
  }

  async function loadStaticCatalogs(manifest, options = {}) {
    const datasets = manifest.datasets.filter(dataset => Array.isArray(dataset.chunks) && dataset.chunks.length);
    if (!datasets.length) {
      ui.status.textContent = 'El manifest de catálogos no contiene partes CSV.';
      return;
    }

    button.disabled = true;
    const files = [];
    const totalChunks = datasets.reduce((sum, dataset) => sum + dataset.chunks.length, 0);
    let loadedChunks = 0;

    try {
      for (const dataset of datasets) {
        const blobs = [];
        const label = dataset.label || dataset.id || 'catálogo';

        for (const chunk of dataset.chunks) {
          loadedChunks++;
          const path = chunk.path || chunk.url;
          if (!path) continue;

          ui.status.textContent = `${options.auto ? 'Cargando' : 'Descargando'} catálogos ${loadedChunks}/${totalChunks}: ${label}…`;
          const res = await fetch(path, { cache: 'no-store' });
          if (!res.ok) throw new Error(`No se pudo descargar ${path}: HTTP ${res.status}`);
          blobs.push(await res.blob());
        }

        if (blobs.length) {
          const filename = dataset.source_file || `${dataset.id || label}.csv`;
          files.push(new File(blobs, filename, { type: 'text/csv' }));
        }
      }

      if (!files.length) throw new Error('No se descargó ningún catálogo CSV válido.');

      ui.status.textContent = `Catálogos descargados. Procesando ${files.length} catálogo(s)…`;
      await ui.csv.onchange({ target: { files, value: '' } });
    } catch (error) {
      console.error(error);
      ui.status.textContent = `Error cargando catálogos del repositorio: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }
})();
