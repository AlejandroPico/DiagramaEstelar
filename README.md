# DiagramaEstelar

Visualizador interactivo del diagrama de Hertzsprung-Russell preparado para GitHub Pages.

## Objetivo

Crear una página web estática en HTML, CSS y JavaScript para explorar temperatura efectiva, luminosidad, color, clase espectral y regiones evolutivas de las estrellas.

## Estado actual

- Renderizado principal en Canvas.
- Arranque por defecto en modo oscuro para mejorar la lectura de catálogos densos.
- Arranque vacío: la página muestra solo fondo, bandas espectrales, cuadrícula, ejes y controles; no carga estrellas ni catálogos.
- Regiones evolutivas, etiquetas de zonas, nube pedagógica y animación arrancan desactivadas.
- Burbuja inicial apuntando al botón de datos cuando no hay catálogos cargados.
- Barra flotante superior derecha inspirada en Nuclytus/Blockleidos: búsqueda, modo claro/oscuro, datos, capas y zoom.
- Buscador desplegable hacia la izquierda.
- Indicador de zoom clicable: al pulsarlo restablece la vista al 100%.
- Panel de datos minimalista con dos acciones principales: importar CSV y cargar repositorio propio.
- Ficha de estrella compacta, desplazable, reposicionada para evitar tapar la selección y organizada por pestañas internas.
- Pestaña CSV paginada para acceder a todos los campos conservados sin scroll vertical interno.
- Enlaces externos de búsqueda en Wikipedia y Google desde la ficha.
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
├── app.js
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
- **Luna/Sol**: alterna entre modo oscuro y claro. La app arranca en modo oscuro.
- **Datos**: abre el panel de catálogos visibles, importación CSV, carga de catálogos del repositorio y ayuda de campos admitidos.
- **Capas**: abre los interruptores de estrellas cargadas, nube pedagógica, regiones, etiquetas, cuadrícula/ejes y animación.
- **Zoom**: muestra el porcentaje actual. Al pulsarlo, restablece la vista al 100%.

## Arranque vacío

La aplicación no carga estrellas de muestra ni catálogos al abrir la página. El script `startup-empty-mode.js` intercepta la muestra local, limpia cualquier nube sintética inicial, desactiva regiones/etiquetas y oculta la pantalla de carga cuando el escenario está listo.

El objetivo es evitar bloqueos de arranque y dejar que el usuario decida cuándo cargar datos reales desde el panel **Datos**.

## Ficha de estrella

La ficha se reorganiza en pestañas internas:

- **Resumen**: datos esenciales, fuente y enlaces externos.
- **Identidad**: nombres, claves y designaciones.
- **Física**: temperatura, luminosidad, radio, masa, color, clase espectral y magnitudes.
- **Posición**: distancia, coordenadas, movimiento propio y velocidad radial cuando existan.
- **Catálogo**: metadatos de origen, planetas, banderas y fuentes internas.
- **CSV**: campos originales conservados, paginados para evitar scroll vertical dentro de la ficha.

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

La pantalla inicial no representa un catálogo científico; es un escenario HR vacío preparado para cargar datos. Los catálogos importados localmente pueden tener columnas incompletas, magnitudes derivadas o valores estimados. Las estimaciones desde B−V o clase espectral son útiles para visualización, pero no sustituyen una reducción científica controlada.
