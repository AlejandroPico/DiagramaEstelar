'use strict';

(() => {
  const finalStyle = document.createElement('link');
  finalStyle.rel = 'stylesheet';
  finalStyle.href = 'square-edges-final.css';
  document.head.appendChild(finalStyle);

  const button = document.getElementById('aboutPanelButton');
  if (!button) return;

  const host = document.createElement('div');
  host.id = 'aboutProjectLayer';
  host.className = 'about-project-layer';
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = `
    <div class="about-project-backdrop" data-about-close></div>
    <section class="about-project-modal" role="dialog" aria-modal="true" aria-labelledby="aboutProjectTitle">
      <header class="about-project-header">
        <div class="about-project-mark"><img src="favicon.svg" alt="" /></div>
        <div class="about-project-title">
          <span class="eyebrow">ACERCA DEL PROYECTO</span>
          <h2 id="aboutProjectTitle">Diagrama Estelar · Hertzsprung-Russell</h2>
          <p>Explorador visual de poblaciones estelares, catálogos astronómicos y relaciones físicas dentro del diagrama HR.</p>
        </div>
        <button class="about-project-close" type="button" data-about-close aria-label="Cerrar acerca del proyecto">×</button>
      </header>

      <div class="about-project-body">
        <section class="about-project-statement">
          <span>PROPÓSITO</span>
          <h3>Leer la evolución estelar como un mapa físico</h3>
          <p>Diagrama Estelar convierte el diagrama de Hertzsprung-Russell en un espacio interactivo donde temperatura, luminosidad, magnitud, color y clasificación espectral pueden explorarse junto a catálogos reales de estrellas. La herramienta combina lectura divulgativa, inspección visual y experimentación con grandes conjuntos de datos.</p>
          <p>La versión 1.0 consolida el visor responsive, los cuatro ejes dinámicos, la navegación táctil, los filtros científicos, las capas evolutivas y el renderizado optimizado para catálogos masivos. Las zonas, isocronas y trayectorias pedagógicas se presentan como referencias visuales y no como fronteras observacionales exactas.</p>
        </section>

        <div class="about-project-principles">
          <article><span class="about-symbol">HR</span><span><b>Lectura científica</b><small>Cuatro ejes dinámicos, regiones evolutivas, filtros y capas para interpretar la posición de cada estrella.</small></span></article>
          <article><span class="about-symbol">Σ</span><span><b>Catálogos masivos</b><small>Importación CSV, catálogos troceados, Web Worker y renderizado WebGL experimental para grandes volúmenes.</small></span></article>
          <article><span class="about-symbol">i</span><span><b>Trazabilidad</b><small>Ficha detallada, campos CSV originales, enlaces científicos externos y enciclopedia integrada.</small></span></article>
        </div>
      </div>

      <section class="about-project-links" aria-label="Proyecto y autoría">
        <span>PROYECTO Y AUTORÍA</span>
        <h3>Creado por Alejandro Pico</h3>
        <div>
          <a href="https://alejandropico.github.io/Portfolio/" target="_blank" rel="noopener noreferrer">
            <span class="about-link-icon">↗</span>
            <span><b>Portfolio de Alejandro Pico</b><small>Proyectos, experimentos visuales y trabajo de desarrollo.</small></span>
            <span aria-hidden="true">→</span>
          </a>
          <a href="https://github.com/AlejandroPico/DiagramaEstelar" target="_blank" rel="noopener noreferrer">
            <span class="about-link-icon">⌘</span>
            <span><b>Repositorio del proyecto</b><small>Código fuente, historial y documentación del proyecto en GitHub.</small></span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <footer><span>Versión 1.0</span><span>Diagrama Estelar · 2026</span></footer>
    </section>`;

  document.body.appendChild(host);

  button.addEventListener('click', event => {
    event.stopPropagation();
    open();
  });

  host.querySelectorAll('[data-about-close]').forEach(element => {
    element.addEventListener('click', close);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && host.classList.contains('open')) close();
  });

  function open() {
    window.dispatchEvent(new CustomEvent('hr-close-toolbar'));
    host.classList.add('open');
    host.setAttribute('aria-hidden', 'false');
    button.classList.add('active');
    button.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => host.querySelector('.about-project-close')?.focus());
  }

  function close() {
    host.classList.remove('open');
    host.setAttribute('aria-hidden', 'true');
    button.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
  }
})();
