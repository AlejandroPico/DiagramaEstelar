'use strict';

(() => {
  const popover = document.getElementById('infoPopover');
  if (!popover) return;

  function expandGuide() {
    const tabs = popover.querySelector('.info-guide-tabs');
    const scroll = popover.querySelector('.info-guide-scroll');
    if (!tabs || !scroll || tabs.querySelector('[data-info-tab="stefan"]')) return;

    const additions = [
      ['stefan', '15 · Radio estelar'],
      ['metal', '16 · Metalicidad'],
      ['binarias', '17 · Binarias y dispersión'],
      ['cumulos', '18 · Cúmulos e isocronas'],
      ['habitabilidad', '19 · Exoplanetas y habitabilidad'],
      ['gaia', '20 · Gaia y buenas prácticas']
    ];

    additions.forEach(([id, label]) => {
      tabs.insertAdjacentHTML('beforeend', `<button class="info-guide-tab" type="button" data-info-tab="${id}">${label}</button>`);
    });

    scroll.insertAdjacentHTML('beforeend', `
      <section class="info-guide-section" data-info-section="stefan">
        <h3>15 · Radio estelar y ley de Stefan-Boltzmann</h3>
        <p>En el diagrama HR no hay un eje explícito de radio, pero el radio está escondido en la relación entre temperatura y luminosidad. Si dos estrellas tienen la misma temperatura, la que sea más luminosa suele tener mayor superficie emisora; por tanto, mayor radio.</p>
        <p>La idea física se resume con la ley de Stefan-Boltzmann: la luminosidad depende del área de la estrella y de la cuarta potencia de su temperatura. Dicho de forma intuitiva: calentar una superficie aumenta muchísimo la energía emitida, pero agrandar la superficie también puede producir una luminosidad enorme.</p>
        <div class="info-guide-table">
          <div class="info-guide-row"><b>Fría y luminosa</b><span>Debe ser enorme. Es el caso típico de muchas gigantes rojas.</span></div>
          <div class="info-guide-row"><b>Caliente y débil</b><span>Debe ser pequeña. Es el caso típico de una enana blanca.</span></div>
          <div class="info-guide-row"><b>Caliente y luminosa</b><span>Puede ser masiva, grande y energéticamente extrema.</span></div>
        </div>
        <p>Por eso las curvas de radio constante suelen dibujarse sobre el diagrama HR en representaciones avanzadas. No son fronteras, sino guías para leer tamaño físico a partir de temperatura y luminosidad.</p>
        <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Ley_de_Stefan-Boltzmann" target="_blank" rel="noopener noreferrer">ley de Stefan-Boltzmann</a> · <a href="https://es.wikipedia.org/wiki/Radio_solar" target="_blank" rel="noopener noreferrer">radio solar</a></div>
      </section>

      <section class="info-guide-section" data-info-section="metal">
        <h3>16 · Metalicidad: de qué está hecha una estrella</h3>
        <p>En astronomía, “metal” significa casi todo elemento más pesado que el helio. La metalicidad mide cuánta proporción de esos elementos contiene una estrella. No es un detalle menor: afecta al color, a la opacidad, a la evolución y a la posición exacta en el diagrama HR.</p>
        <p>Una estrella pobre en metales puede tener una estructura y una temperatura superficial distintas a una estrella rica en metales con masa parecida. Por eso los cúmulos antiguos y las poblaciones del halo galáctico no siempre se colocan igual que estrellas jóvenes del disco.</p>
        <p>La metalicidad también habla de historia cósmica. Las primeras generaciones de estrellas nacieron en un universo con pocos elementos pesados; generaciones posteriores se formaron a partir de gas enriquecido por supernovas y vientos estelares.</p>
        <div class="info-guide-callout">El diagrama HR no solo muestra física individual: también puede revelar genealogía química de poblaciones estelares.</div>
        <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Metalicidad" target="_blank" rel="noopener noreferrer">metalicidad</a> · <a href="https://es.wikipedia.org/wiki/Poblaci%C3%B3n_estelar" target="_blank" rel="noopener noreferrer">población estelar</a></div>
      </section>

      <section class="info-guide-section" data-info-section="binarias">
        <h3>17 · Estrellas binarias, mezclas y dispersión</h3>
        <p>Muchas estrellas no están solas. Forman sistemas binarios o múltiples. Si un catálogo no resuelve bien las componentes, la luz registrada puede ser una mezcla. Eso desplaza el punto en el diagrama HR y puede hacer que parezca más luminoso de lo esperado.</p>
        <p>Las binarias eclipsantes, espectroscópicas o visuales aportan información valiosísima, pero también complican la lectura automática. En algunos casos permiten medir masas y radios con precisión; en otros, introducen ambigüedad si la fuente aparece como un solo punto.</p>
        <div class="info-guide-table">
          <div class="info-guide-row"><b>Binaria no resuelta</b><span>Dos estrellas pueden aparecer como una fuente más luminosa.</span></div>
          <div class="info-guide-row"><b>Binaria eclipsante</b><span>Su brillo cambia porque una componente tapa a la otra.</span></div>
          <div class="info-guide-row"><b>Binaria espectroscópica</b><span>Se detecta por desplazamientos en líneas espectrales.</span></div>
        </div>
        <p>Cuando veas puntos fuera de lo esperado, no asumas inmediatamente que son “errores”. Pueden ser binariedad, evolución inusual, mala distancia, extinción, saturación, mezcla de fuentes o simplemente un objeto científicamente interesante.</p>
        <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Estrella_binaria" target="_blank" rel="noopener noreferrer">estrella binaria</a> · <a href="https://es.wikipedia.org/wiki/Binaria_eclipsante" target="_blank" rel="noopener noreferrer">binaria eclipsante</a></div>
      </section>

      <section class="info-guide-section" data-info-section="cumulos">
        <h3>18 · Cúmulos estelares e isocronas</h3>
        <p>Un cúmulo estelar es un grupo de estrellas nacidas aproximadamente de la misma nube y, por tanto, con edades y composiciones parecidas. Eso convierte a los cúmulos en laboratorios naturales para probar evolución estelar.</p>
        <p>En un cúmulo joven, muchas estrellas masivas aún pueden estar en la secuencia principal. En un cúmulo viejo, las estrellas masivas ya la habrán abandonado, dejando un punto de giro característico. Ese punto permite estimar la edad del cúmulo.</p>
        <p>Las isocronas son curvas teóricas que indican dónde deberían estar estrellas de la misma edad pero distintas masas. Comparar una isocrona con los datos de un cúmulo es una de las técnicas clásicas para leer edades estelares.</p>
        <div class="info-guide-callout">Si algún día añadimos filtros por cúmulo, el diagrama podrá pasar de mapa general a herramienta de cronología estelar.</div>
        <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/C%C3%BAmulo_estelar" target="_blank" rel="noopener noreferrer">cúmulo estelar</a> · <a href="https://es.wikipedia.org/wiki/C%C3%BAmulo_abierto" target="_blank" rel="noopener noreferrer">cúmulo abierto</a> · <a href="https://es.wikipedia.org/wiki/C%C3%BAmulo_globular" target="_blank" rel="noopener noreferrer">cúmulo globular</a></div>
      </section>

      <section class="info-guide-section" data-info-section="habitabilidad">
        <h3>19 · Exoplanetas, estrellas anfitrionas y habitabilidad</h3>
        <p>Una parte de los catálogos cargados puede proceder de estrellas con exoplanetas. En ese caso, el diagrama HR ayuda a entender qué tipo de estrella ilumina esos planetas: una enana roja fría, una estrella solar, una subgigante evolucionada o una estrella más caliente.</p>
        <p>La habitabilidad no depende solo de la distancia al planeta. Depende también de la estabilidad de la estrella, su actividad magnética, su luminosidad, su edad, su radiación ultravioleta y la evolución temporal de su zona habitable.</p>
        <p>Las enanas rojas son abundantes y longevas, pero pueden tener fulguraciones intensas. Las estrellas tipo G y K suelen considerarse interesantes por estabilidad y duración. Las estrellas muy masivas viven demasiado poco para escenarios biológicos largos.</p>
        <div class="info-guide-table">
          <div class="info-guide-row"><b>Tipo M</b><span>Muy longevas, pero potencialmente activas; planetas cercanos y bloqueo de marea frecuente.</span></div>
          <div class="info-guide-row"><b>Tipo G</b><span>Referencia solar; equilibrio conocido por nuestro propio sistema.</span></div>
          <div class="info-guide-row"><b>Tipo K</b><span>Longevas y relativamente estables; candidatas muy interesantes.</span></div>
        </div>
        <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Exoplaneta" target="_blank" rel="noopener noreferrer">exoplaneta</a> · <a href="https://es.wikipedia.org/wiki/Zona_de_habitabilidad" target="_blank" rel="noopener noreferrer">zona de habitabilidad</a> · <a href="https://es.wikipedia.org/wiki/Enana_roja" target="_blank" rel="noopener noreferrer">enana roja</a></div>
      </section>

      <section class="info-guide-section" data-info-section="gaia">
        <h3>20 · Gaia, paralaje y buenas prácticas de exploración</h3>
        <p>Gaia mide posiciones, paralajes y movimientos propios de una cantidad inmensa de estrellas. La paralaje permite estimar distancia: una estrella cercana parece desplazarse ligeramente frente al fondo al observarla desde distintos puntos de la órbita terrestre.</p>
        <p>Buenas distancias son esenciales para convertir brillo aparente en luminosidad. Si la distancia falla, el punto en el diagrama HR puede caer donde no toca. Por eso la calidad del dato astrométrico es clave.</p>
        <p>Al explorar grandes catálogos, conviene trabajar por capas: primero cargar una fuente, luego filtrar, después comparar. Si aparecen estructuras raras, hay que preguntar si son físicas o si vienen de sesgos, duplicados, límites de magnitud, errores de paralaje o transformaciones de columnas.</p>
        <div class="info-guide-table">
          <div class="info-guide-row"><b>Primero</b><span>Observa la forma global de la nube de puntos.</span></div>
          <div class="info-guide-row"><b>Después</b><span>Activa o desactiva catálogos para ver qué fuente aporta cada estructura.</span></div>
          <div class="info-guide-row"><b>Finalmente</b><span>Consulta la ficha y el CSV original antes de sacar conclusiones.</span></div>
        </div>
        <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Gaia_(misi%C3%B3n_espacial)" target="_blank" rel="noopener noreferrer">Gaia</a> · <a href="https://es.wikipedia.org/wiki/Paralaje" target="_blank" rel="noopener noreferrer">paralaje</a> · <a href="https://es.wikipedia.org/wiki/Movimiento_propio" target="_blank" rel="noopener noreferrer">movimiento propio</a></div>
      </section>
    `);

    bindGuideTabs();
  }

  function bindGuideTabs() {
    const tabs = Array.from(popover.querySelectorAll('[data-info-tab]'));
    const sections = Array.from(popover.querySelectorAll('[data-info-section]'));
    const scrollArea = popover.querySelector('.info-guide-scroll');
    tabs.forEach(tab => {
      if (tab.dataset.expandedBound === '1') return;
      tab.dataset.expandedBound = '1';
      tab.addEventListener('click', () => {
        const id = tab.dataset.infoTab;
        tabs.forEach(item => item.classList.toggle('active', item.dataset.infoTab === id));
        sections.forEach(section => section.classList.toggle('active', section.dataset.infoSection === id));
        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', expandGuide);
  } else {
    expandGuide();
  }
})();
