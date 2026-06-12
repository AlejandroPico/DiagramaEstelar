# DiagramaEstelar

Visualizador interactivo del diagrama de Hertzsprung-Russell preparado para GitHub Pages.

## Rama beta

La rama `beta` se usa como laboratorio de mejoras experimentales antes de llevarlas a `main`.

En esta rama se han añadido un **motor WebGL experimental para estrellas**, un panel de **filtros científicos avanzados**, enlaces externos ampliados y capas visuales de incertidumbre, radios constantes, isocronas y trayectorias evolutivas.

## Objetivo

Crear una página web estática en HTML, CSS y JavaScript para explorar temperatura efectiva, luminosidad, color, clase espectral, color B−V, magnitud absoluta aproximada, catálogos estelares y zonas evolutivas.

## Estado actual

- Renderizado base en Canvas 2D para fondo, cuadrícula, ejes, regiones, etiquetas y textos.
- Renderizado experimental WebGL para puntos estelares en la rama `beta`.
- Botón de filtros con icono de embudo entre Datos y Capas.
- Filtros por temperatura, luminosidad, magnitud absoluta aproximada, radio, masa, distancia, planetas, B−V y tipo espectral.
- Capas científicas opcionales: incertidumbre, radios constantes, isocronas y trayectorias evolutivas.
- Ficha de estrella con pestaña Fuentes ampliada: Wikipedia, SIMBAD, VizieR, NASA Exoplanet Archive, Gaia Archive cuando hay identificador, NASA ADS, arXiv y Google.
- Arranque por defecto en modo oscuro.
- Arranque vacío: la página muestra fondo, degradado espectral continuo, cuadrícula, cuatro ejes y controles; no carga estrellas ni catálogos hasta que el usuario lo pide.
- Esquema de cuatro ejes: luminosidad izquierda, magnitud absoluta derecha, tipo espectral arriba y color B−V abajo.
- Degradado espectral suavizado para evitar cortes verticales duros entre bandas de color.
- Zonas evolutivas redibujadas con contornos curvos, halo difuminado y relleno gradual.
- Nombres de zonas estabilizados durante el zoom mediante una capa de pantalla fija.
- Hit-test geométrico propio para que la interacción con zonas coincida con la forma visible.
- Ficha moderna para estrellas y zonas evolutivas, con pestañas planas y contenido paginado.
- Barra flotante superior con búsqueda, información, modo claro/oscuro, datos, filtros, capas y zoom.
- Panel de información con título simplificado: **Diagrama de Hertzsprung-Russell**.
- Guía científica ampliada a 20 capítulos, con tablas y enlaces externos de apoyo.
- Diseño responsive para tablet y móvil mediante `mobile-responsive.css` y ajuste específico `beta-toolbar-fixes.css`.
- Favicon SVG propio del proyecto.
- Zoom máximo ampliado al 7000% mediante `zoom-boost.js`.
- Panel de datos con importación local CSV y carga manual de catálogos estáticos troceados.
- Catálogos visibles filtrables por fuente cargada.
- Pantalla de carga con detalle textual y barra de progreso para catálogos pesados.
- Importación avanzada con Web Worker para catálogos grandes.

## Estructura principal

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
├── visibility-fixes.css
├── mobile-responsive.css
├── beta-toolbar-fixes.css
├── webgl-renderer.css
├── advanced-filters.css
├── scientific-overlays.css
├── favicon.svg
├── app.js
├── zoom-boost.js
├── hr-four-axis-overlay.js
├── evolutionary-regions-polish.js
├── region-label-stabilizer.js
├── scientific-overlays.js
├── webgl-star-renderer.js
├── advanced-filters.js
├── external-sources-enhanced.js
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
├── region-card-refine.js
├── data-actions.js
├── info-guide.js
├── info-guide-expansion.js
├── mobile-info-index.js
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

## Motor WebGL experimental

`webgl-star-renderer.js` crea un segundo canvas transparente sobre el escenario principal y usa WebGL para dibujar los puntos estelares.

Características:

- Usa la GPU para dibujar todos los puntos con `gl.POINTS`.
- Mantiene Canvas 2D para ejes, regiones, textos, fichas y compatibilidad.
- Reconstruye el buffer de vértices cuando cambia `state.stars`.
- Usa `scissor` para recortar el render al área interna del diagrama.
- Mantiene una sobrecapa Canvas 2D para resaltar la estrella seleccionada o bajo el cursor.
- Si WebGL no está disponible o falla la compilación de shaders, el sistema vuelve al renderizado Canvas original.

Limitación actual: el renderizado de puntos se acelera, pero la búsqueda de estrella cercana con el ratón sigue usando el método CPU original. Una mejora posterior será añadir índice espacial o quadtree.

## Filtros científicos

`advanced-filters.js` añade un panel de filtros accesible desde el botón de embudo.

Filtros disponibles:

- Temperatura efectiva.
- Luminosidad.
- Magnitud absoluta aproximada.
- Radio.
- Masa.
- Distancia.
- Número de planetas conocidos.
- Color B−V.
- Tipo espectral.

Los filtros numéricos usan barras de doble extremo para acotar mínimo y máximo. El filtrado se integra con los filtros por catálogo: primero se respeta la fuente visible y después se acota el conjunto por criterios físicos.

## Capas científicas

`scientific-overlays.js` añade cuatro capas opcionales al panel Capas:

- **Incertidumbre**: dibuja elipses cuando el catálogo aporta errores de temperatura o luminosidad; si falta uno de los ejes, usa una estimación visual suave.
- **Radios constantes**: curvas de radio estelar aproximado basadas en la relación entre luminosidad, temperatura y radio.
- **Isocronas**: curvas pedagógicas de edad aproximada, útiles para explicar cúmulos y población estelar.
- **Trayectorias evolutivas**: recorridos esquemáticos para estrellas de distinta masa inicial.

Estas capas son ayudas visuales; no sustituyen modelos astrofísicos formales ni tablas de evolución profesional.

## Fuentes externas ampliadas

`external-sources-enhanced.js` amplía la pestaña **Fuentes** de la ficha de estrella.

Incluye accesos a:

- Wikipedia.
- SIMBAD.
- VizieR.
- NASA Exoplanet Archive.
- Gaia Archive cuando se detecta identificador Gaia.
- NASA ADS.
- arXiv.
- Google.

Los enlaces usan el mejor identificador disponible: `hostname`, nombre de estrella, designación, HD, HIP, Gaia DR3 o clave del catálogo.

## Interfaz

La interfaz principal usa una barra flotante situada en la esquina superior derecha en escritorio y adaptada a la parte superior en pantallas pequeñas.

- **Lupa**: despliega el campo de búsqueda.
- **Información**: abre la guía del diagrama de Hertzsprung-Russell.
- **Luna/Sol**: alterna entre modo oscuro y claro.
- **Datos**: abre el panel de importación CSV, carga de catálogos y filtros por fuente.
- **Filtros**: abre el panel de filtros científicos avanzados.
- **Capas**: permite activar estrellas cargadas, zonas evolutivas, nombres de zonas, cuadrícula/ejes, animación y capas científicas.
- **Zoom**: muestra el porcentaje actual y permite restablecer la vista.

## Diseño móvil y tablet

`mobile-responsive.css` añade una capa específica para pantallas pequeñas:

- Toolbar compacta con botones táctiles.
- Popovers adaptados al ancho disponible y a `safe-area-inset`.
- Panel de datos con botones apilados en móvil estrecho.
- Panel de capas con filas táctiles más altas.
- Fichas de estrella y zona ajustadas a la altura disponible.
- Panel de información en formato de lectura móvil.
- Índice de la guía oculto tras botón **Temas**, gestionado por `mobile-info-index.js`.
- Desplazamiento táctil con barras ocultas donde corresponde.

## Ejes del diagrama

La capa `hr-four-axis-overlay.js` sustituye el renderizado base de ejes y reserva margen específico para mostrar cuatro escalas simultáneas:

- **Izquierda**: luminosidad relativa al Sol, L☉.
- **Derecha**: magnitud absoluta aproximada, calculada desde luminosidad mediante una conversión bolométrica de referencia solar.
- **Arriba**: tipo espectral O, B, A, F, G, K, M, con marcas de temperatura de referencia.
- **Abajo**: color B−V estimado a partir de temperatura efectiva.

La navegación, el zoom, la cuadrícula y la selección de estrellas siguen usando las mismas coordenadas internas de temperatura y luminosidad.

## Zonas evolutivas

`evolutionary-regions-polish.js` reemplaza el dibujo angular original por zonas pedagógicas suaves:

- Contornos cerrados con curvas cuadráticas.
- Relleno translúcido y halo difuminado.
- Línea exterior redondeada.
- Franja de inestabilidad con trazo discontinuo.
- Selección y hover basados en geometría suavizada.

`region-label-stabilizer.js` dibuja los nombres de zonas en una capa de pantalla fija para evitar que crezcan o salten durante el zoom.

## Guía informativa

El botón de información abre una ventana enciclopédica con 20 capítulos:

1. Qué estás viendo.
2. Historia del diagrama.
3. Ejes y escala.
4. Temperatura y color.
5. Tipos OBAFGKM.
6. Luminosidad.
7. Magnitud absoluta.
8. Color B−V.
9. Secuencia principal.
10. Vida estelar.
11. Regiones HR.
12. Variables e inestabilidad.
13. Leer una estrella.
14. Catálogos y límites.
15. Radio estelar y ley de Stefan-Boltzmann.
16. Metalicidad.
17. Estrellas binarias, mezclas y dispersión.
18. Cúmulos estelares e isocronas.
19. Exoplanetas, estrellas anfitrionas y habitabilidad.
20. Gaia, paralaje y buenas prácticas de exploración.

La guía usa navegación por secciones, contenido desplazable con rueda o gesto táctil, scrollbar oculto y enlaces externos de apoyo.

## Importación de catálogos

La aplicación acepta uno o varios CSV locales desde el panel de datos. El fichero no se sube a ningún servidor: se procesa en el navegador.

El cargador avanzado reconoce actualmente:

- **NASA Exoplanet Archive**: `hostname`, `st_teff`, `st_lum`, `st_rad`, `st_mass`, `sy_dist`, `sy_pnum`, `pl_name`.
- **HYG / ATHYG / HYG-like**: `proper`, `spect`, `ci`, `lum`, `absmag`, `dist`, `hip`, `hd`, `gl`.
- **CSV de clasificación estelar tipo Kaggle**: `Temperature (K)`, `Luminosity(L/Lo)`, `Radius(R/Ro)`, `Star type`, `Star color`, `Spectral Class`.
- **CSV HR genéricos / Gaia-like**: `teff`, `temperature`, `temperature_k`, `effective_temperature`, `teff_gspphot`, `luminosity`, `lum`, `lum_flame`, `radius`, `st_rad`, `mass`, `st_mass`, `sy_dist`.

`catalog-loader-enhanced.js` conserva los campos no vacíos de la fila CSV representada en `rawFields`. La ficha de estrella los muestra dentro de la pestaña **CSV**.

## Catálogos estáticos troceados

GitHub permite subir archivos de hasta 25 MiB desde la interfaz web, así que los CSV grandes deben dividirse si se quieren mantener dentro del repositorio y servirlos con GitHub Pages.

Flujo recomendado:

```bash
python tools/split-catalogs.py "C:/ruta/a/mis_csv" --out data/catalogs --max-mib 22 --clean
```

El script genera `data/catalogs/manifest.json` y partes CSV por catálogo. Cuando el manifest existe en GitHub Pages, la web muestra el botón **Cargar repositorio propio** dentro del panel de datos. La descarga es manual para evitar bloqueos de arranque.

## Rendimiento

Para catálogos grandes, la importación se ejecuta en un **Web Worker**. Cuando se importan miles de estrellas, la app desactiva automáticamente la nube sintética. Si el catálogo supera decenas de miles de estrellas, también desactiva la animación para evitar redibujos continuos.

En la rama `beta`, los puntos estelares se dibujan mediante WebGL. Esta mejora reduce el coste de dibujo de catálogos grandes, pero todavía no sustituye la lógica de búsqueda/hover CPU. El siguiente paso técnico para grandes catálogos es añadir selección inteligente o índice espacial.

## Advertencia

La pantalla inicial no representa un catálogo científico; es un escenario HR vacío preparado para cargar datos. Las zonas evolutivas, isocronas y trayectorias son orientativas y no constituyen fronteras observacionales exactas. Los catálogos importados localmente pueden tener columnas incompletas, magnitudes derivadas o valores estimados. Las estimaciones desde B−V o clase espectral son útiles para visualización, pero no sustituyen una reducción científica controlada.
