'use strict';

(() => {
  if (typeof cardStar !== 'function' || !infoCard) return;

  const previousCardStar = cardStar;
  let currentStar = null;

  cardStar = function cardStarWithScientificSources(star) {
    currentStar = star;
    previousCardStar(star);
    queueEnhance();
  };

  infoCard.addEventListener('click', event => {
    const tab = event.target.closest('[data-star-tab]');
    if (!tab || tab.dataset.starTab !== 'fuentes') return;
    queueEnhance();
  }, true);

  function queueEnhance() {
    requestAnimationFrame(() => enhanceSources(currentStar));
  }

  function enhanceSources(star) {
    if (!star) return;
    const panel = infoCard.querySelector('.star-search-panel');
    if (!panel) return;
    const target = bestTarget(star);
    const q = encodeURIComponent(target);
    const simbad = encodeURIComponent(simbadTarget(star));
    const adsQuery = encodeURIComponent(`"${target}"`);
    const nasaHost = encodeURIComponent(star.rawFields?.hostname || star.name || target);
    const gaia = gaiaId(star);

    const links = [
      ['Wikipedia', `https://es.wikipedia.org/wiki/Special:Search?search=${q}`, 'Buscar artículo o coincidencias enciclopédicas.'],
      ['SIMBAD', `https://simbad.u-strasbg.fr/simbad/sim-basic?Ident=${simbad}&submit=SIMBAD+search`, 'Resolver identificadores, bibliografía y datos astronómicos.'],
      ['VizieR', `https://vizier.cds.unistra.fr/viz-bin/VizieR?-c=${q}`, 'Buscar catálogos CDS alrededor del objeto.'],
      ['NASA Exoplanet Archive', `https://exoplanetarchive.ipac.caltech.edu/overview/${nasaHost}`, 'Consultar sistemas planetarios y parámetros publicados.'],
      ['NASA ADS', `https://ui.adsabs.harvard.edu/search/q=${adsQuery}&sort=date%20desc%2C%20bibcode%20desc`, 'Buscar artículos científicos y referencias bibliográficas.'],
      ['arXiv', `https://arxiv.org/search/?query=${q}&searchtype=all&source=header`, 'Buscar prepublicaciones relacionadas.'],
      ['Google', `https://www.google.com/search?q=${q}`, 'Buscar referencias externas generales.']
    ];

    if (gaia) {
      links.splice(4, 0, ['Gaia Archive', `https://gea.esac.esa.int/archive/`, `Identificador detectado: ${gaia}. Abrir archivo Gaia para consulta avanzada.`]);
    }

    panel.innerHTML = links.map(([label, href, description]) => `<a class="star-search-link" href="${href}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(label)}">
      <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span>
    </a>`).join('');
  }

  function bestTarget(star) {
    return clean(star.rawFields?.hostname) || clean(star.name) || clean(star.designation) || clean(star.catalogKey) || 'estrella';
  }

  function simbadTarget(star) {
    return clean(star.rawFields?.hd_name) || clean(star.rawFields?.hip_name) || clean(star.rawFields?.hostname) || clean(star.name) || clean(star.designation) || clean(star.catalogKey) || 'star';
  }

  function gaiaId(star) {
    const raw = clean(star.rawFields?.gaia_dr3_id || star.rawFields?.source_id || star.rawFields?.designation || '');
    const match = raw.match(/(?:Gaia\s*DR3\s*)?(\d{10,})/i);
    return match ? `Gaia DR3 ${match[1]}` : '';
  }

  function clean(value) {
    return String(value || '').trim();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }
})();
