'use strict';

(() => {
  const popover = document.getElementById('infoPopover');
  const infoButton = document.getElementById('infoPanelButton');
  if (!popover || !infoButton) return;

  popover.innerHTML = `
    <article class="info-guide" aria-label="Guía del diagrama de Hertzsprung-Russell">
      <header class="info-guide-head">
        <div>
          <h2>Diagrama de Hertzsprung-Russell</h2>
        </div>
        <button id="infoGuideClose" class="info-guide-close" type="button" aria-label="Cerrar guía">×</button>
      </header>

      <nav class="info-guide-tabs" aria-label="Temas de la guía">
        ${tabButton('vision', '1 · Qué estás viendo', true)}
        ${tabButton('historia', '2 · Historia del diagrama')}
        ${tabButton('ejes', '3 · Ejes y escala')}
        ${tabButton('temperatura', '4 · Temperatura y color')}
        ${tabButton('espectros', '5 · Tipos OBAFGKM')}
        ${tabButton('luminosidad', '6 · Luminosidad')}
        ${tabButton('magnitud', '7 · Magnitud absoluta')}
        ${tabButton('bv', '8 · Color B−V')}
        ${tabButton('secuencia', '9 · Secuencia principal')}
        ${tabButton('evolucion', '10 · Vida estelar')}
        ${tabButton('regiones', '11 · Regiones HR')}
        ${tabButton('variables', '12 · Variables e inestabilidad')}
        ${tabButton('leer', '13 · Leer una estrella')}
        ${tabButton('catalogos', '14 · Catálogos y límites')}
      </nav>

      <div class="info-guide-scroll" tabindex="0">
        <section class="info-guide-section active" data-info-section="vision">
          <h3>1 · Qué estás viendo</h3>
          <p>El diagrama de Hertzsprung-Russell, abreviado como <strong>diagrama HR</strong>, no es un mapa de posiciones celestes. No te dice en qué constelación está una estrella ni hacia dónde debes apuntar un telescopio. Es un mapa de naturaleza física: coloca cada estrella según su <strong>temperatura efectiva</strong> y su <strong>luminosidad</strong>.</p>
          <p>La idea es poderosa porque dos números, bien escogidos, revelan mucho: si una estrella es joven o vieja, si está quemando hidrógeno tranquilamente, si se ha hinchado como gigante, si es un remanente compacto o si pertenece a una población estelar determinada.</p>
          <div class="info-guide-callout">Piensa en el diagrama como una sala llena de personas ordenadas no por nombre ni por ciudad, sino por edad y energía vital. De golpe aparecen familias, generaciones y trayectorias.</div>
          <p>Cuando cargues catálogos reales, cada punto será una estrella o una representación agregada de una estrella. Su posición no es decorativa: condensa temperatura, energía emitida, posible tamaño, fase evolutiva y a veces información sobre planetas o clasificación espectral.</p>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Diagrama_de_Hertzsprung-Russell" target="_blank" rel="noopener noreferrer">diagrama de Hertzsprung-Russell</a> · <a href="https://es.wikipedia.org/wiki/Estrella" target="_blank" rel="noopener noreferrer">estrella</a></div>
        </section>

        <section class="info-guide-section" data-info-section="historia">
          <h3>2 · Por qué se llama Hertzsprung-Russell</h3>
          <p>A comienzos del siglo XX, Ejnar Hertzsprung y Henry Norris Russell compararon estrellas usando brillo y tipo espectral. Observaron que las estrellas no se distribuían al azar: se agrupaban en patrones. Ese descubrimiento convirtió una colección de puntos en una teoría visual de la evolución estelar.</p>
          <p>Antes de esta forma de ordenar las estrellas, muchas propiedades parecían listas inconexas: color, espectro, brillo, distancia, magnitud. El diagrama HR mostró que esas propiedades estaban relacionadas. Una estrella azul y muy luminosa no era simplemente azul y luminosa: probablemente era caliente, masiva y de vida corta.</p>
          <p>El diagrama también ayudó a conectar observación y teoría. Cuando se desarrollaron modelos de estructura estelar y fusión nuclear, los patrones del diagrama empezaron a tener explicación física: equilibrio hidrostático, masa inicial, opacidad, composición química y etapas de combustión nuclear.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>Hertzsprung</b><span>Relacionó color, magnitud y luminosidad en cúmulos y poblaciones estelares.</span></div>
            <div class="info-guide-row"><b>Russell</b><span>Representó estrellas por tipo espectral y magnitud absoluta, mostrando la secuencia principal y las gigantes.</span></div>
            <div class="info-guide-row"><b>Valor científico</b><span>Transformó el catálogo estelar en una herramienta diagnóstica.</span></div>
          </div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Ejnar_Hertzsprung" target="_blank" rel="noopener noreferrer">Ejnar Hertzsprung</a> · <a href="https://es.wikipedia.org/wiki/Henry_Norris_Russell" target="_blank" rel="noopener noreferrer">Henry Norris Russell</a></div>
        </section>

        <section class="info-guide-section" data-info-section="ejes">
          <h3>3 · Ejes y escala: por qué el gráfico parece invertido</h3>
          <p>El eje horizontal principal representa la temperatura efectiva. En astronomía se dibuja a menudo con las estrellas más calientes a la izquierda y las más frías a la derecha. Por eso el eje parece contrario al de una gráfica escolar habitual: aquí avanzar hacia la derecha significa enfriarse.</p>
          <p>El eje vertical izquierdo representa luminosidad relativa al Sol. Una estrella con 1 L☉ emite aproximadamente tanta energía como el Sol. Una con 100 L☉ emite cien veces más. Una con 0,01 L☉ emite cien veces menos.</p>
          <p>El eje vertical derecho traduce esa luminosidad a magnitud absoluta aproximada. La escala de magnitudes es inversa: los números más pequeños o negativos indican objetos más luminosos.</p>
          <p>El eje superior muestra tipos espectrales. El inferior muestra color B−V. Así, el mismo punto queda explicado por cuatro lecturas complementarias: temperatura, color, tipo espectral, luminosidad y magnitud.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>Arriba</b><span>Más luminosidad. Gigantes, supergigantes y estrellas masivas pueden aparecer aquí.</span></div>
            <div class="info-guide-row"><b>Abajo</b><span>Menos luminosidad. Enanas rojas o remanentes pequeños como enanas blancas.</span></div>
            <div class="info-guide-row"><b>Izquierda</b><span>Más temperatura. Blanco-azuladas, azules, tipos O, B y A.</span></div>
            <div class="info-guide-row"><b>Derecha</b><span>Menos temperatura. Amarillas, naranjas, rojas, tipos G, K y M.</span></div>
          </div>
        </section>

        <section class="info-guide-section" data-info-section="temperatura">
          <h3>4 · Temperatura, color y apariencia</h3>
          <p>Una estrella no tiene color porque esté pintada, sino porque su superficie emite radiación térmica. Cuanto más caliente es, más se desplaza su luz hacia el azul y el ultravioleta; cuanto más fría es, más domina el rojo y el infrarrojo.</p>
          <p>El Sol, con unos 5.772 K de temperatura efectiva, no es una estrella roja ni azul: se encuentra en una zona intermedia, de tipo G. Su color observado desde la Tierra se ve afectado por la atmósfera, pero físicamente está cerca de una estrella blanco-amarillenta.</p>
          <p>Una estrella azul no es necesariamente “fría” porque asociemos azul al hielo. En física térmica ocurre lo contrario: una llama azul suele estar más caliente que una llama roja. Las estrellas azules son extraordinariamente calientes.</p>
          <div class="info-guide-callout">El color visible es solo una parte de la historia. Muchas estrellas emiten una fracción enorme de su energía fuera del rango que nuestros ojos detectan.</div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Temperatura_efectiva" target="_blank" rel="noopener noreferrer">temperatura efectiva</a> · <a href="https://es.wikipedia.org/wiki/Cuerpo_negro" target="_blank" rel="noopener noreferrer">radiación de cuerpo negro</a></div>
        </section>

        <section class="info-guide-section" data-info-section="espectros">
          <h3>5 · Tipos espectrales O, B, A, F, G, K, M</h3>
          <p>Las letras O, B, A, F, G, K y M ordenan estrellas por temperatura y por las líneas que aparecen en su espectro. Un espectro es luz descompuesta. En él aparecen huellas de hidrógeno, helio, calcio, sodio, moléculas y otros componentes.</p>
          <p>El orden va de caliente a frío: <strong>O, B, A, F, G, K, M</strong>. Las O son azules, muy calientes y raras; las M son rojas, frías y muy abundantes. Cada letra puede tener subtipos numéricos, como G2 o M5, que afinan la temperatura.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>O</b><span>Muy calientes, azules, masivas, luminosas y de vida corta.</span></div>
            <div class="info-guide-row"><b>B</b><span>Blanco-azuladas, todavía muy calientes y energéticas.</span></div>
            <div class="info-guide-row"><b>A</b><span>Blancas, con líneas de hidrógeno muy intensas.</span></div>
            <div class="info-guide-row"><b>F</b><span>Blanco-amarillentas, algo más calientes que el Sol.</span></div>
            <div class="info-guide-row"><b>G</b><span>Amarillas o blanco-amarillentas. El Sol es G2V.</span></div>
            <div class="info-guide-row"><b>K</b><span>Anaranjadas, longevas, candidatas interesantes para habitabilidad.</span></div>
            <div class="info-guide-row"><b>M</b><span>Rojas, frías, pequeñas y las más numerosas de la galaxia.</span></div>
          </div>
          <p>También existen clases especiales, como L, T e Y para enanas marrones frías, o W para estrellas Wolf-Rayet. Esta app se centra en el esquema clásico HR OBAFGKM porque es el más útil para leer el diagrama principal.</p>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Tipo_espectral_(estrellas)" target="_blank" rel="noopener noreferrer">tipo espectral</a> · <a href="https://es.wikipedia.org/wiki/Clasificaci%C3%B3n_estelar" target="_blank" rel="noopener noreferrer">clasificación estelar</a></div>
        </section>

        <section class="info-guide-section" data-info-section="luminosidad">
          <h3>6 · Luminosidad: energía real emitida</h3>
          <p>La luminosidad mide cuánta energía emite una estrella por unidad de tiempo. No es lo mismo que brillo aparente. Una bombilla cercana puede parecer más brillante que un faro lejano, aunque el faro sea más potente. Con las estrellas ocurre igual.</p>
          <p>En el diagrama HR se usa luminosidad intrínseca, no el brillo que nos llega al ojo. Para estimarla hace falta conocer distancia, magnitud aparente, extinción por polvo y correcciones según el rango de luz observado.</p>
          <p>Una estrella puede ser muy luminosa porque es muy caliente, porque es enorme o por ambas cosas. Una supergigante roja no es especialmente caliente en superficie, pero tiene un radio tan grande que emite una cantidad inmensa de energía.</p>
          <div class="info-guide-callout">La luminosidad te dice “cuánta energía produce”. La temperatura te dice “cómo es su superficie”. Juntas te permiten sospechar su tamaño.</div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Luminosidad" target="_blank" rel="noopener noreferrer">luminosidad</a> · <a href="https://es.wikipedia.org/wiki/Luminosidad_solar" target="_blank" rel="noopener noreferrer">luminosidad solar</a></div>
        </section>

        <section class="info-guide-section" data-info-section="magnitud">
          <h3>7 · Magnitud absoluta: el brillo puesto a distancia común</h3>
          <p>La magnitud astronómica es una escala heredada de la observación antigua: las estrellas más brillantes tenían magnitud menor. Por eso una magnitud negativa significa un objeto extremadamente luminoso.</p>
          <p>La <strong>magnitud aparente</strong> es cómo de brillante se ve desde la Tierra. La <strong>magnitud absoluta</strong> es cómo de brillante sería si estuviera a una distancia estándar de 10 parsecs. Eso permite comparar estrellas de forma más justa.</p>
          <p>En esta visualización, la escala derecha ofrece una magnitud absoluta aproximada derivada de la luminosidad. Es una lectura útil para orientarse, aunque una medición fotométrica rigurosa distinguiría bandas de filtro, correcciones bolométricas y extinción interestelar.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>Magnitud baja</b><span>Objeto más luminoso. Puede incluso ser negativa.</span></div>
            <div class="info-guide-row"><b>Magnitud alta</b><span>Objeto más débil.</span></div>
            <div class="info-guide-row"><b>Absoluta</b><span>Comparación a distancia estándar.</span></div>
          </div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Magnitud_absoluta" target="_blank" rel="noopener noreferrer">magnitud absoluta</a> · <a href="https://es.wikipedia.org/wiki/Magnitud_aparente" target="_blank" rel="noopener noreferrer">magnitud aparente</a></div>
        </section>

        <section class="info-guide-section" data-info-section="bv">
          <h3>8 · Color B−V: medir el color como dato</h3>
          <p>El índice B−V compara el brillo de una estrella medido con un filtro azul B y otro visual V. Si B−V es pequeño o negativo, la estrella es azulada y caliente. Si B−V es grande, la estrella es rojiza y fría.</p>
          <p>Este índice no es una simple impresión visual. Es fotometría: una forma cuantitativa de convertir color en dato. Por eso puede relacionarse con temperatura, aunque la relación depende de calibraciones, metalicidad y extinción por polvo.</p>
          <p>En el eje inferior se muestran marcas aproximadas de B−V derivadas de temperatura. Sirven para leer el diagrama como en muchas representaciones clásicas: tipo espectral arriba, color abajo.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>B−V negativo</b><span>Estrella azul y caliente.</span></div>
            <div class="info-guide-row"><b>B−V cercano a 0,65</b><span>Aproximadamente solar.</span></div>
            <div class="info-guide-row"><b>B−V mayor que 1</b><span>Estrella anaranjada o roja, más fría.</span></div>
          </div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/%C3%8Dndice_de_color" target="_blank" rel="noopener noreferrer">índice de color</a> · <a href="https://es.wikipedia.org/wiki/Fotometr%C3%ADa_(astronom%C3%ADa)" target="_blank" rel="noopener noreferrer">fotometría astronómica</a></div>
        </section>

        <section class="info-guide-section" data-info-section="secuencia">
          <h3>9 · Secuencia principal: la gran autopista estelar</h3>
          <p>La secuencia principal es la diagonal dominante del diagrama HR. Allí están las estrellas que fusionan hidrógeno en helio en su núcleo. Es una fase estable, larga y fundamental.</p>
          <p>La masa inicial determina dónde cae una estrella en la secuencia. Las estrellas masivas quedan arriba a la izquierda: calientes, azules y luminosas. Las de baja masa quedan abajo a la derecha: frías, rojas y débiles.</p>
          <p>El Sol está en la secuencia principal. No es una estrella excepcional por luminosidad o temperatura, pero es crucial para nosotros porque define la escala de comparación.</p>
          <p>La secuencia principal no es una línea fina porque las estrellas tienen distintas edades, composiciones químicas, rotaciones y masas. Además, los catálogos incluyen errores, sesgos de observación y estrellas binarias mezcladas.</p>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Secuencia_principal" target="_blank" rel="noopener noreferrer">secuencia principal</a> · <a href="https://es.wikipedia.org/wiki/Sol" target="_blank" rel="noopener noreferrer">Sol</a></div>
        </section>

        <section class="info-guide-section" data-info-section="evolucion">
          <h3>10 · Vida estelar: nacimiento, madurez y final</h3>
          <p>Una estrella nace en una nube molecular. La gravedad junta gas y polvo; la materia cae, se calienta y forma una protoestrella. Cuando el núcleo alcanza condiciones suficientes, comienza la fusión de hidrógeno.</p>
          <p>Durante la secuencia principal, la estrella vive en equilibrio: la gravedad comprime hacia dentro y la presión generada por el calor y la radiación empuja hacia fuera. Este equilibrio puede durar millones, miles de millones o billones de años según la masa.</p>
          <p>Cuando el hidrógeno del núcleo se agota, la estructura cambia. El núcleo se contrae; las capas externas pueden expandirse; la estrella se mueve por el diagrama hacia regiones de subgigantes o gigantes.</p>
          <p>Las estrellas como el Sol acabarán expulsando capas externas y dejando una enana blanca. Las estrellas masivas pueden terminar en supernovas, estrellas de neutrones o agujeros negros.</p>
          <div class="info-guide-callout">La frase “somos polvo de estrellas” no es poesía vaga: elementos como carbono, oxígeno, calcio o hierro fueron fabricados o dispersados por generaciones previas de estrellas.</div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Evoluci%C3%B3n_estelar" target="_blank" rel="noopener noreferrer">evolución estelar</a> · <a href="https://es.wikipedia.org/wiki/Fusi%C3%B3n_nuclear" target="_blank" rel="noopener noreferrer">fusión nuclear</a></div>
        </section>

        <section class="info-guide-section" data-info-section="regiones">
          <h3>11 · Regiones del diagrama HR</h3>
          <h4>Subgigantes</h4>
          <p>Son estrellas que empiezan a abandonar la secuencia principal. El núcleo ya no se comporta como antes, y la estrella inicia una transición hacia radios mayores y luminosidades distintas.</p>
          <h4>Gigantes rojas</h4>
          <p>Son estrellas evolucionadas con capas externas expandidas. Pueden tener superficie relativamente fría, pero son luminosas porque su radio es enorme.</p>
          <h4>Supergigantes</h4>
          <p>Son estrellas extremadamente luminosas, normalmente relacionadas con masas altas y evolución rápida. Pueden ser azules, amarillas o rojas.</p>
          <h4>Enanas blancas</h4>
          <p>Son remanentes compactos. Tienen radios comparables a planetas, pueden estar calientes, pero emiten poca luz total por su pequeño tamaño.</p>
          <h4>Gigantes brillantes y clases intermedias</h4>
          <p>Entre gigantes normales y supergigantes aparecen clases de luminosidad intermedias. La realidad estelar no siempre cae en categorías perfectamente limpias.</p>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Gigante_roja" target="_blank" rel="noopener noreferrer">gigante roja</a> · <a href="https://es.wikipedia.org/wiki/Supergigante" target="_blank" rel="noopener noreferrer">supergigante</a> · <a href="https://es.wikipedia.org/wiki/Enana_blanca" target="_blank" rel="noopener noreferrer">enana blanca</a></div>
        </section>

        <section class="info-guide-section" data-info-section="variables">
          <h3>12 · Variables, pulsaciones y franja de inestabilidad</h3>
          <p>No todas las estrellas brillan de forma constante. Algunas pulsan, otras se eclipsan por compañeras, otras tienen manchas, erupciones o cambios complejos en sus capas exteriores.</p>
          <p>La franja de inestabilidad del diagrama HR agrupa regiones donde ciertas estrellas pueden expandirse y contraerse de forma periódica. Las Cefeidas son especialmente importantes porque su periodo se relaciona con su luminosidad: sirven para medir distancias cósmicas.</p>
          <p>Las RR Lyrae cumplen un papel parecido en poblaciones estelares antiguas. Las variables Mira aparecen en fases evolucionadas de estrellas frías y gigantes.</p>
          <div class="info-guide-callout">Cuando una estrella variable tiene una relación fiable entre periodo y luminosidad, se convierte en una regla astronómica.</div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Estrella_variable" target="_blank" rel="noopener noreferrer">estrella variable</a> · <a href="https://es.wikipedia.org/wiki/Cefeida" target="_blank" rel="noopener noreferrer">Cefeida</a> · <a href="https://es.wikipedia.org/wiki/RR_Lyrae" target="_blank" rel="noopener noreferrer">RR Lyrae</a></div>
        </section>

        <section class="info-guide-section" data-info-section="leer">
          <h3>13 · Cómo leer una estrella concreta</h3>
          <p>Cuando haces clic en una estrella, conviene leerla en capas. Primero mira su posición visual. Después interpreta los valores. Finalmente revisa de qué catálogo procede y qué campos se conservan.</p>
          <ul>
            <li><strong>Arriba a la izquierda:</strong> estrella caliente y muy luminosa, probablemente masiva.</li>
            <li><strong>Abajo a la derecha:</strong> estrella fría y débil, típicamente enana roja.</li>
            <li><strong>Arriba a la derecha:</strong> estrella fría en superficie pero enorme, gigante o supergigante roja.</li>
            <li><strong>Abajo a la izquierda:</strong> objeto caliente pero poco luminoso, candidato a enana blanca.</li>
          </ul>
          <p>Después mira si los datos son directos o estimados. Una temperatura derivada de B−V no tiene el mismo significado que una temperatura espectroscópica homogénea. Una luminosidad calculada desde magnitud absoluta depende de distancia, extinción y calibración.</p>
          <p>La pestaña CSV de la ficha permite comprobar campos originales. Eso es importante: en ciencia, saber de dónde viene un número es casi tan importante como el número.</p>
        </section>

        <section class="info-guide-section" data-info-section="catalogos">
          <h3>14 · Catálogos, sesgos y límites</h3>
          <p>Un catálogo astronómico no es “la verdad completa del cielo”; es una recopilación construida con instrumentos, filtros, criterios de selección y modelos. Cada catálogo tiene una intención.</p>
          <p>NASA Exoplanet Archive está orientado a sistemas con planetas. HYG y ATHYG son útiles para estrellas cercanas o brillantes. Gaia es extraordinario para posiciones, paralajes y movimientos propios, pero incluso Gaia tiene límites, errores y procesos de reducción.</p>
          <p>Los sesgos importan. Un catálogo puede sobrerrepresentar estrellas brillantes porque son más fáciles de medir, estrellas cercanas porque tienen mejor paralaje, o estrellas anfitrionas de planetas porque se observaron con campañas concretas.</p>
          <p>Por eso esta herramienta debe leerse como exploración visual: te ayuda a detectar patrones, comparar fuentes y hacer preguntas. Para publicar ciencia formal haría falta controlar incertidumbres, selección muestral, filtros fotométricos, duplicados, binariedad y metalicidad.</p>
          <div class="info-guide-table">
            <div class="info-guide-row"><b>Dato directo</b><span>Campo medido o publicado explícitamente por el catálogo.</span></div>
            <div class="info-guide-row"><b>Dato derivado</b><span>Valor calculado desde otro campo, como temperatura desde B−V o luminosidad desde magnitud.</span></div>
            <div class="info-guide-row"><b>Dato faltante</b><span>No significa que la estrella no tenga esa propiedad; significa que esa fuente no la aporta.</span></div>
          </div>
          <div class="info-guide-linkbar">Enlaces: <a href="https://es.wikipedia.org/wiki/Gaia_(misi%C3%B3n_espacial)" target="_blank" rel="noopener noreferrer">Gaia</a> · <a href="https://es.wikipedia.org/wiki/Exoplaneta" target="_blank" rel="noopener noreferrer">exoplaneta</a> · <a href="https://es.wikipedia.org/wiki/Cat%C3%A1logo_estelar" target="_blank" rel="noopener noreferrer">catálogo estelar</a></div>
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
