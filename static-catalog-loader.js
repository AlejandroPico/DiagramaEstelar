'use strict';

(() => {
  const MANIFEST_URL = 'data/catalogs/manifest.json';
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
      button.textContent = `Cargar catálogos del repositorio (${chunkCount} partes)`;
      button.onclick = () => loadStaticCatalogs(manifest);
    } catch (error) {
      // Si no existe manifest.json, el proyecto sigue funcionando con importación local.
    }
  }

  async function loadStaticCatalogs(manifest) {
    const chunks = manifest.datasets.flatMap(dataset => (dataset.chunks || []).map(chunk => ({ ...chunk, dataset })));
    if (!chunks.length) {
      ui.status.textContent = 'El manifest de catálogos no contiene partes CSV.';
      return;
    }

    button.disabled = true;
    const files = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const item = chunks[i];
        const path = item.path || item.url;
        if (!path) continue;

        ui.status.textContent = `Descargando catálogo ${i + 1}/${chunks.length}: ${item.dataset.label || item.dataset.id || 'catálogo'}…`;
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) throw new Error(`No se pudo descargar ${path}: HTTP ${res.status}`);
        const blob = await res.blob();
        const filename = path.split('/').pop() || `catalog-part-${i + 1}.csv`;
        files.push(new File([blob], filename, { type: 'text/csv' }));
      }

      if (!files.length) throw new Error('No se descargó ninguna parte CSV válida.');

      ui.status.textContent = `Catálogos descargados. Procesando ${files.length} parte(s)…`;
      await ui.csv.onchange({ target: { files, value: '' } });
    } catch (error) {
      console.error(error);
      ui.status.textContent = `Error cargando catálogos del repositorio: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }
})();
