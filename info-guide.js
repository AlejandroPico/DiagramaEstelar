'use strict';

(() => {
  const popover = document.getElementById('infoPopover');
  const infoButton = document.getElementById('infoPanelButton');
  if (!popover || !infoButton) return;

  popover.innerHTML = `
    <article class="info-guide" aria-label="Guía del diagrama de Hertzsprung-Russell">
      <header class="info-guide-head">
        <div>
          <p class="eyebrow">Guía científica</p>
          <h2>Leer el diagrama HR</h2>
          <p>Una guía para entender qué estás viendo antes de cargar catálogos estelares.</p>
        </div>
        <button id="infoGuideClose" class="info-guide-close" type="button" aria-label="Cerrar guía">×</button>
      </header>

      <nav class="info-guide-tabs" aria-label="Temas de la guía">
        ${tabButton('vision', 'Qué estás viendo', true)}
        ${tabButton('ejes', 'Ejes y escala')}
        ${tabButton('espectros', 'OBAFGKM')}
        ${tabButton('vida', 'Vida estelar')}
        ${tabButton('regiones', 'Regiones')}
        ${tabButton('leer', 'Cómo leer datos')}
        ${tabButton('catalogos', 'Catálogos')}
      </nav>

      <div class="info-guide-scroll" tabindex="0">
        <section class="info-guide-section active" data-info-section="vision">
          <h3>Qué es el diagrama de Hertzsprung-Russell</h3>
          <p>El diagrama de Hertzsprung-Russell, o <strong>diagrama HR</strong>, es uno de los mapas más importantes de la astronomía. No es un mapa del cielo: no indica dónde está una estrella en el espacio. Es un mapa de su naturaleza física. Coloca cada estrella según dos propiedades fundamentales: su <strong>temperatura</strong> y su <strong>luminosidad</strong>.</p>
          <p>Si piensas en una estrella como una hoguera cósmica, el diagrama HR no te dice en qué bosque está esa hoguera, sino qué tipo de fuego es: si es caliente o frío, intenso o tenue, joven o envejecido, compacto o gigantesco. Por eso el diagrama parece sencillo, pero encierra una historia profunda: la vida de las estrellas.</p>
          <div class="info-guide-callout">Una estrella no se coloca al azar. Su posición en el diagrama depende de su masa, su edad, su composición química y del combustible nuclear que está usando en ese momento.</div>
          <h4>La gran idea</h4>
          <p>La mayoría de estrellas caen en una banda diagonal llamada <strong>secuencia principal</strong>. Ahí están las estrellas que queman hidrógeno en su núcleo de forma estable. Nuestro Sol vive en esa banda. Las estrellas más calientes y luminosas quedan hacia la parte azul y brillante; las más frías y débiles quedan hacia la parte roja y tenue.</p>
          <p>Fuera de esa banda aparecen otras familias: gigantes rojas, supergigantes, subgigantes y enanas blancas. Cada familia representa una etapa física distinta, no simplemente un color bonito en el gráfico.</p>
        </section>

        <section class="info-guide-section" data-info-section="ejes">
          <h3>Ejes: temperatura y luminosidad</h3>
          <p>El eje horizontal representa la <strong>temperatura efectiva</strong> de la superficie estelar, medida en kelvin. En los diagramas HR tradicionales, las estrellas calientes se colocan a la izquierda y las frías a la derecha. Por eso puede parecer invertido respecto a un gráfico corriente.</p>
          <p>El eje vertical representa la <strong>luminosidad</strong>, normalmente comparada con el Sol. Una luminosidad de 1 L☉ significa “tan luminosa como el Sol”. Una luminosidad de 100 L☉ significa que emite cien veces más energía que el Sol; 0,01 L☉ significa cien veces menos.</p>
          <h4>Por qué la escala parece tan extrema</h4>
          <p>Las estrellas no varían un poco: varían de forma brutal. Una enana roja puede emitir una fracción diminuta de la luz solar, mientras una supergigante puede emitir decenas de miles o millones de veces más. Por eso el eje vertical suele ser logarítmico: cada salto representa multiplicaciones enormes.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>Arriba</b><span>Estrellas muy luminosas: gigantes, supergigantes o estrellas masivas muy energéticas.</span></div>
            <div class="info-guide-row"><b>Abajo</b><span>Objetos débiles: enanas rojas pequeñas o restos estelares como enanas blancas.</span></div>
            <div class="info-guide-row"><b>Izquierda</b><span>Estrellas calientes, azuladas o blancas.</span></div>
            <div class="info-guide-row"><b>Derecha</b><span>Estrellas frías, amarillas, naranjas o rojas.</span></div>
          </div>
          <p>La combinación de temperatura y luminosidad permite inferir el tamaño. Una estrella fría pero muy luminosa tiene que ser enorme: si su superficie no es muy caliente pero aun así emite muchísima luz, necesita una superficie gigantesca. Ese es el caso de muchas gigantes rojas.</p>
        </section>

        <section class="info-guide-section" data-info-section="espectros">
          <h3>Las letras O, B, A, F, G, K y M</h3>
          <p>Las letras que ves en el diagrama son <strong>clases espectrales</strong>. Ordenan las estrellas por temperatura y por las líneas que aparecen en su espectro. Un espectro es como una huella dactilar de luz: al separar la luz de una estrella, aparecen señales de hidrógeno, helio, metales y otras sustancias.</p>
          <p>El orden moderno de clases, de más caliente a más fría, es: <strong>O, B, A, F, G, K, M</strong>. Una regla mnemotécnica clásica en inglés es “Oh Be A Fine Girl/Guy, Kiss Me”, pero lo importante es entender la física: no son nombres arbitrarios, son rangos de temperatura.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>O</b><span>Extremadamente calientes, azules, muy masivas, muy luminosas y de vida corta.</span></div>
            <div class="info-guide-row"><b>B</b><span>Azules o blanco-azuladas, muy calientes y energéticas.</span></div>
            <div class="info-guide-row"><b>A</b><span>Blancas, con líneas de hidrógeno muy marcadas. Sirio A es un ejemplo famoso.</span></div>
            <div class="info-guide-row"><b>F</b><span>Blanco-amarillentas, más calientes que el Sol.</span></div>
            <div class="info-guide-row"><b>G</b><span>Amarillas. El Sol es de tipo G2V.</span></div>
            <div class="info-guide-row"><b>K</b><span>Anaranjadas, más frías y longevas que el Sol.</span></div>
            <div class="info-guide-row"><b>M</b><span>Rojas, frías, pequeñas y muy abundantes; muchas son enanas rojas.</span></div>
          </div>
          <p>La letra puede ir acompañada de un número, por ejemplo G2 o M5. El número afina la temperatura dentro de la clase. También puede aparecer una clase de luminosidad con números romanos: V para secuencia principal, III para gigantes, I para supergigantes.</p>
        </section>

        <section class="info-guide-section" data-info-section="vida">
          <h3>La vida de una estrella</h3>
          <p>Una estrella nace cuando una nube de gas y polvo colapsa por gravedad. Al comprimirse, el gas se calienta. Si el núcleo alcanza suficiente temperatura y presión, empieza la <strong>fusión nuclear</strong>: los núcleos de hidrógeno se combinan para formar helio, liberando energía. Esa energía sostiene la estrella contra la gravedad.</p>
          <p>Durante la mayor parte de su vida, una estrella vive en la secuencia principal. Allí hay una especie de equilibrio: la gravedad intenta aplastar la estrella hacia dentro; la presión del gas caliente y la energía de la fusión empujan hacia fuera.</p>
          <h4>La masa decide el destino</h4>
          <p>La masa inicial es la gran variable. Una estrella pequeña consume su combustible despacio y puede vivir cientos de miles de millones de años. Una estrella masiva brilla de forma espectacular, pero gasta combustible a un ritmo feroz y vive mucho menos.</p>
          <ul>
            <li><strong>Estrellas pequeñas:</strong> frías, rojas, muy longevas.</li>
            <li><strong>Estrellas como el Sol:</strong> pasan miles de millones de años en secuencia principal, luego se expanden como gigantes rojas y acaban como enanas blancas.</li>
            <li><strong>Estrellas masivas:</strong> pueden terminar en supernovas, dejando estrellas de neutrones o agujeros negros.</li>
          </ul>
          <p>Cuando una estrella agota el hidrógeno central, el equilibrio cambia. El núcleo se contrae, las capas externas pueden expandirse y la estrella se mueve por el diagrama HR. Por eso el diagrama no es solo una fotografía: es una biografía comprimida.</p>
          <div class="info-guide-callout">Carl Sagan decía que somos polvo de estrellas. En sentido literal, muchos elementos de nuestro cuerpo se formaron en generaciones anteriores de estrellas y fueron expulsados al espacio.</div>
        </section>

        <section class="info-guide-section" data-info-section="regiones">
          <h3>Regiones del diagrama</h3>
          <h4>Secuencia principal</h4>
          <p>Es la banda diagonal donde las estrellas queman hidrógeno en su núcleo. Es la etapa más larga y estable. La posición dentro de la secuencia depende sobre todo de la masa: las estrellas masivas son calientes, azules y luminosas; las pequeñas son frías, rojas y tenues.</p>
          <h4>Subgigantes</h4>
          <p>Son estrellas que han empezado a abandonar la secuencia principal. El núcleo cambia, el hidrógeno central se agota y la estrella empieza a reorganizar su estructura interna. Es una etapa de transición.</p>
          <h4>Gigantes rojas</h4>
          <p>Son estrellas con capas exteriores enormemente expandidas. Pueden ser frías en superficie, pero muy luminosas porque su radio es enorme. No son “frías” en sentido cotidiano: siguen siendo objetos violentos y energéticos, pero su superficie es más fría que la de una estrella azul.</p>
          <h4>Supergigantes</h4>
          <p>Son estrellas muy masivas y muy evolucionadas. Pueden ser inmensas y extremadamente luminosas. Muchas viven rápido y mueren de forma explosiva.</p>
          <h4>Enanas blancas</h4>
          <p>No son estrellas activas como el Sol. Son núcleos residuales: objetos muy densos, calientes al principio, pero poco luminosos por su pequeño tamaño. Una cucharadita de materia de enana blanca tendría una masa enorme comparada con la materia ordinaria.</p>
          <h4>Franja de inestabilidad</h4>
          <p>Es una región donde ciertas estrellas pulsan: se expanden y contraen de forma regular. Las Cefeidas, por ejemplo, son esenciales para medir distancias cósmicas porque su periodo de pulsación se relaciona con su luminosidad real.</p>
        </section>

        <section class="info-guide-section" data-info-section="leer">
          <h3>Cómo leer una estrella concreta</h3>
          <p>Cuando cargas un catálogo y haces clic sobre una estrella, la ficha intenta mostrar lo que el catálogo sabe de ella. Hay dos niveles de lectura: el nivel visual y el nivel de datos.</p>
          <h4>Nivel visual</h4>
          <ul>
            <li>Si está muy arriba, es muy luminosa.</li>
            <li>Si está muy a la izquierda, es muy caliente.</li>
            <li>Si está muy a la derecha, es más fría y rojiza.</li>
            <li>Si está arriba a la derecha, probablemente es una gigante o supergigante.</li>
            <li>Si está abajo a la izquierda, puede ser una enana blanca.</li>
          </ul>
          <h4>Nivel físico</h4>
          <p>La temperatura indica la energía de la superficie; la luminosidad indica cuánta energía total emite; la clase espectral resume la huella química y térmica de su luz; la distancia ayuda a contextualizarla; la magnitud absoluta permite comparar brillos reales sin el sesgo de la distancia.</p>
          <p>Si dos estrellas tienen la misma temperatura pero una es mucho más luminosa, la más luminosa suele tener mayor radio. Si dos tienen luminosidades parecidas pero temperaturas muy distintas, su tamaño y estructura interna probablemente son muy diferentes.</p>
        </section>

        <section class="info-guide-section" data-info-section="catalogos">
          <h3>Qué significan los catálogos</h3>
          <p>Un catálogo astronómico es una tabla de observaciones. Puede contener nombres, coordenadas, distancias, magnitudes, tipos espectrales, temperaturas estimadas, radios, masas o relaciones con planetas. No todos los catálogos contienen lo mismo ni todos los campos tienen la misma precisión.</p>
          <h4>NASA Exoplanet Archive</h4>
          <p>Está orientado a sistemas con exoplanetas. Es muy útil para identificar estrellas anfitrionas, planetas asociados y parámetros estelares usados en estudios planetarios.</p>
          <h4>HYG / ATHYG</h4>
          <p>Son catálogos pensados para estrellas cercanas o brillantes, combinando datos de varias fuentes. Pueden incluir coordenadas, distancia, magnitud, índice de color B−V y tipo espectral.</p>
          <h4>Datos derivados</h4>
          <p>A veces el catálogo no trae temperatura directa. En ese caso se puede estimar desde el color B−V o desde el tipo espectral. Eso es útil para visualizar, pero conviene recordar que una estimación no equivale a una medición homogénea de alta precisión.</p>
          <div class="info-guide-callout">El objetivo de esta página es exploratorio y educativo: ayudarte a ver patrones. Una investigación científica formal requiere controlar incertidumbres, sesgos de selección, calibraciones y procedencia exacta de cada dato.</div>
        </section>
      </div>
    </article>`;

  const close = document.getElementById('infoGuideClose');
  const tabs = Array.from(popover.querySelectorAll('[data-info-tab]'));
  const sections = Array.from(popover.querySelectorAll('[data-info-section]'));
  const scrollArea = popover.querySelector('.info-guide-scroll');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.infoTab;
      tabs.forEach(item => item.classList.toggle('active', item.dataset.infoTab === id));
      sections.forEach(section => section.classList.toggle('active', section.dataset.infoSection === id));
      if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  if (close) {
    close.addEventListener('click', event => {
      event.stopPropagation();
      popover.classList.remove('open');
      infoButton.classList.remove('active');
      infoButton.setAttribute('aria-expanded', 'false');
    });
  }

  function tabButton(id, label, active = false) {
    return `<button class="info-guide-tab${active ? ' active' : ''}" type="button" data-info-tab="${id}">${label}</button>`;
  }
})();
