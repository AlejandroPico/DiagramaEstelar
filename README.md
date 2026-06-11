# DiagramaEstelar

Visualizador interactivo del diagrama de Hertzsprung-Russell preparado para GitHub Pages.

## Objetivo

Crear una página web estática en HTML, CSS y JavaScript para explorar temperatura efectiva, luminosidad, color, clase espectral y regiones evolutivas de las estrellas.

## Estado actual

- Renderizado principal en Canvas.
- Arranque por defecto en modo oscuro para mejorar la lectura de catálogos densos.
- Arranque vacío: la página muestra solo fondo, degradado espectral continuo, cuadrícula, ejes y controles; no carga estrellas ni catálogos.
- Esquema de cuatro ejes: luminosidad izquierda, magnitud absoluta derecha, tipo espectral arriba y color B−V abajo.
- Degradado espectral suavizado para evitar cortes verticales duros entre bandas de color.
- Zonas evolutivas redibujadas con contornos curvos, halo difuminado y relleno gradual.
- Nombres de zonas flotantes: intentan mantenerse dentro del área visible y evitar solapamientos.
- La antigua nube pedagógica queda oculta del panel de capas.
- Regiones evolutivas, etiquetas de zonas y animación arrancan desactivadas.
- Burbuja inicial apuntando al botón de datos cuando no hay catálogos cargados.
- Barra flotante superior derecha inspirada en Nuclytus/Blockleidos: búsqueda, información, modo claro/oscuro, datos, capas y zoom.
- Botón de información con guía científica ampliada del diagrama HR, organizada en 14 capítulos.
- Buscador desplegable hacia la izquierda.
- Indicador de zoom clicable: al pulsarlo restablece la vista al 100%.
- Panel de datos minimalista con dos acciones principales iguales y centradas: importar CSV y cargar repositorio propio.
- Popover de datos ampliado y sin scroll vertical interno, incluso al desplegar campos admitidos.
- Ficha de estrella compacta, desplazable, reposicionada para evitar tapar la selección y organizada por pestañas planas.
- Ficha de tamaño fijo: el contenido se pagina por pestaña para evitar crecimiento, encogimiento o scroll vertical interno.
- Pestaña **Fuentes** con accesos externos a Wikipedia y Google.
- Pestaña CSV paginada para acceder a todos los campos conservados sin scroll vertical interno.
- Pantalla de carga con detalle textual y barra de progreso para catálogos pesados.
- Modo claro y oscuro.
- Zoom, desplazamiento y encaje automático.
- Zoom mínimo fijado al 100%.
- Ejes flotantes siempre visibles.
- Ejes adaptativos con marcas intermedias según el zoom.
- Importación local avanzada de CSV.
- Detección de catálogos estáticos troceados desde `data/catalogs/manifest.json` cuando existe.
- Filtros visuales por catálogo cargado.

## Estructura

```text
.
├── index.html
├── styles.css
├── catalog-layers.css
├── floating-toolbar.css
├── loading-progress.css
├── data-panel-refine.css
├── star-card-refine.css
├── info-guide.css
├── app.js
├── hr-four-axis-overlay.js
├── evolutionary-regions-polish.js
├── startup-empty-mode.js
├── data-importer.js
├── catalog-loader.js
├── catalog-loader-enhanced.js
├── static-catalog-loader.js
├── label-rendering.js
├── catalog-layer-filter.js
├── floating-toolbar.js
├── empty-data-hint.js
├── star-card-refine.js
├── data-actions.js
├── info-guide.js
├── tools/
│   └── split-catalogs.py
├── data/
│   ├── catalogs/
│   │   ├── README.md
│   │   ├── manifest.json
│   │   └── ...
│   └── stars.sample.json
└── README.md
```

## Interfaz

La interfaz principal ya no usa menú hamburguesa visible. Las herramientas viven en una barra flotante situada en la esquina superior derecha:

- **Lupa**: despliega el campo de búsqueda hacia la izquierda.
- **Información**: abre una guía científica extensa sobre el diagrama de Hertzsprung-Russell.
- **Luna/Sol**: alterna entre modo oscuro y claro. La app arranca en modo oscuro.
- **Datos**: abre el panel de catálogos visibles, importación CSV, carga de catálogos del repositorio y ayuda de campos admitidos.
- **Capas**: abre los interruptores de estrellas cargadas, zonas evolutivas, nombres de zonas, cuadrícula/ejes y animación.
- **Zoom**: muestra el porcentaje actual. Al pulsarlo, restablece la vista al 100%.

## Ejes del diagrama

La capa `hr-four-axis-overlay.js` sustituye el renderizado base de ejes y reserva margen específico para mostrar cuatro escalas simultáneas:

- **Izquierda**: luminosidad relativa al Sol, L☉.
- **Derecha**: magnitud absoluta aproximada, calculada desde luminosidad mediante una conversión bolométrica de referencia solar.
- **Arriba**: tipo espectral O, B, A, F, G, K, M, con marcas de temperatura de referencia.
- **Abajo**: color B−V estimado a partir de temperatura efectiva.

La navegación, el zoom, la cuadrícula y la selección de estrellas siguen usando las mismas coordenadas internas de temperatura y luminosidad. La misma capa reemplaza las bandas espectrales verticales por un degradado continuo interpolado por temperatura.

## Zonas evolutivas

La capa `evolutionary-regions-polish.js` reemplaza el dibujo angular original de regiones por zonas pedagógicas más suaves:

- Contornos cerrados construidos con curvas cuadráticas.
- Relleno translúcido y halo difuminado para evitar sensación de frontera exacta.
- Línea exterior redondeada; la franja de inestabilidad se dibuja con trazo discontinuo.
- Etiquetas flotantes que se mantienen dentro del área visible y desplazan su posición si detectan solapamiento.
- Selección y hover siguen funcionando mediante la misma geometría suavizada.

Estas zonas siguen siendo una ayuda visual, no una frontera astrofísica exacta.

## Guía informativa

El botón de información abre una ventana enciclopédica organizada en 14 capítulos:

- **Qué estás viendo**: explicación general del diagrama HR.
- **Historia del diagrama**: origen histórico y valor científico.
- **Ejes y escala**: temperatura, luminosidad, magnitud y lectura espacial del gráfico.
- **Temperatura y color**: relación entre energía superficial, color y radiación térmica.
- **Tipos OBAFGKM**: clases espectrales, subtipos y significado físico.
- **Luminosidad**: energía real emitida frente a brillo aparente.
- **Magnitud absoluta**: escala astronómica comparada a distancia común.
- **Color B−V**: índice fotométrico y lectura del eje inferior.
- **Secuencia principal**: fusión estable de hidrógeno y masa inicial.
- **Vida estelar**: nacimiento, equilibrio, evolución y finales posibles.
- **Regiones HR**: subgigantes, gigantes, supergigantes, enanas blancas y clases intermedias.
- **Variables e inestabilidad**: pulsaciones, Cefeidas, RR Lyrae y distancia cósmica.
- **Leer una estrella**: interpretación visual y de ficha técnica.
- **Catálogos y límites**: procedencia, datos derivados, sesgos y cautelas científicas.

La guía usa navegación por secciones, contenido desplazable con rueda o gesto táctil, scrollbar oculto y enlaces externos de apoyo.

## Arranque vacío

La aplicación no carga estrellas de muestra ni catálogos al abrir la página. El script `startup-empty-mode.js` intercepta la muestra local, limpia cualquier nube sintética inicial, desactiva regiones/etiquetas y oculta la pantalla de carga cuando el escenario está listo.

El objetivo es evitar bloqueos de arranque y dejar que el usuario decida cuándo cargar datos reales desde el panel **Datos**.

## Ficha de estrella

La ficha se reorganiza en pestañas internas planas, sin tarjetas ni burbujas por dato:

- **Resumen**: datos esenciales.
- **Identidad**: nombres, claves y designaciones.
- **Física**: temperatura, luminosidad, radio, masa, color, clase espectral y magnitudes.
- **Posición**: distancia, coordenadas, movimiento propio y velocidad radial cuando existan.
- **Catálogo**: metadatos de origen, planetas, banderas y fuentes internas.
- **CSV**: campos originales conservados, paginados para evitar scroll vertical dentro de la ficha.
- **Fuentes**: enlaces externos de búsqueda en Wikipedia y Google.

La ficha intenta abrirse en una zona que no tape la estrella seleccionada y también puede arrastrarse manualmente.

## Importación de catálogos

La aplicación acepta uno o varios CSV locales desde el panel de datos. El fichero no se sube a ningún servidor: se procesa en el navegador.

El cargador avanzado reconoce actualmente:

- **NASA Exoplanet Archive**: detecta `hostname`, `st_teff`, `st_lum`, `st_rad`, `st_mass`, `sy_dist`, `sy_pnum`, `pl_name`. La luminosidad `st_lum` se interpreta como log10(L☉) y se convierte a luminosidad lineal.
- **HYG / ATHYG / HYG-like**: detecta `proper`, `spect`, `ci`, `lum`, `absmag`, `dist`, `hip`, `hd`, `gl`. Si no hay temperatura explícita, estima temperatura desde B−V (`ci`) o clase espectral. Si no hay `lum`, calcula luminosidad desde magnitud absoluta (`absmag`).
- **CSV de clasificación estelar tipo Kaggle**: detecta `Temperature (K)`, `Luminosity(L/Lo)`, `Radius(R/Ro)`, `Star type`, `Star color`, `Spectral Class`.
- **CSV HR genéricos / Gaia-like**: reconoce campos como `teff`, `temperature`, `temperature_k`, `effective_temperature`, `teff_gspphot`, `luminosity`, `lum`, `lum_flame`, `radius`, `st_rad`, `mass`, `st_mass`, `sy_dist`.

`catalog-loader-enhanced.js` conserva los campos no vacíos de la fila CSV representada en `rawFields`. La ficha de estrella los muestra dentro de la pestaña **CSV**.

## Catálogos estáticos troceados

GitHub permite subir archivos de hasta 25 MiB desde la interfaz web, así que los CSV grandes deben dividirse si se quieren mantener dentro del repositorio y servirlos con GitHub Pages.

Flujo recomendado:

```bash
python tools/split-catalogs.py "C:/ruta/a/mis_csv" --out data/catalogs --max-mib 22 --clean
```

El script genera:

```text
data/catalogs/
├── manifest.json
├── ps-2026-06-10-19-21-45/
│   ├── part-001.csv
│   └── ...
├── hyg-v42/
│   ├── part-001.csv
│   └── ...
└── ...
```

Cada parte mantiene la cabecera CSV y queda por debajo de 22 MiB. Cuando `manifest.json` existe en GitHub Pages, la web muestra el botón **Cargar repositorio propio** dentro del panel de datos. La descarga ya no es automática para evitar bloqueos de arranque.

Durante la carga manual, la pantalla de carga muestra qué parte se está descargando y una barra de progreso. Al terminar la descarga, el navegador procesa los catálogos en memoria mediante Web Worker.

## Filtros por catálogo

Al cargar datos reales, aparece la sección **Catálogos visibles** dentro del panel de datos. Todos los catálogos aparecen activados por defecto. Cada interruptor permite ocultar o mostrar una fuente concreta sin recargar los CSV.

Esta capa visual trabaja sobre las estrellas ya importadas, así que no elimina datos del navegador; solo cambia qué fuentes se dibujan y qué fuentes son seleccionables con el ratón.

## Campos recomendados para CSV genérico

```csv
name,teff,luminosity,spectral_type,class,distance_ly,mass,radius,source,notes
Sol,5772,1,G2V,main-sequence,0.0000158,1,1,Muestra,Referencia solar
```

## Rendimiento

Para catálogos grandes, la importación se ejecuta en un **Web Worker** para evitar bloquear la interfaz principal. Cuando se importan miles de estrellas, la app desactiva automáticamente la nube sintética. Si el catálogo supera decenas de miles de estrellas, también desactiva la animación para evitar redibujos continuos.

El dibujo de grandes volúmenes usa un modo rápido de puntos en Canvas, reservado para catálogos reales densos.

## Fuentes previstas

- Gaia DR3 / ESA como fuente principal para una versión científica amplia.
- NASA Exoplanet Archive para una capa de estrellas anfitrionas de exoplanetas.
- Hipparcos / HEASARC para una muestra clásica de estrellas brillantes y cercanas.
- VizieR / CDS para catálogos especializados.

## Advertencia

La pantalla inicial no representa un catálogo científico; es un escenario HR vacío preparado para cargar datos. Las zonas evolutivas son orientativas y no constituyen fronteras observacionales exactas. Los catálogos importados localmente pueden tener columnas incompletas, magnitudes derivadas o valores estimados. Las estimaciones desde B−V o clase espectral son útiles para visualización, pero no sustituyen una reducción científica controlada.
