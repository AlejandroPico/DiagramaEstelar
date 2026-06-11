# DiagramaEstelar

Visualizador interactivo del diagrama de Hertzsprung-Russell preparado para GitHub Pages.

## Objetivo

Crear una página web estática en HTML, CSS y JavaScript para explorar temperatura efectiva, luminosidad, color, clase espectral y regiones evolutivas de las estrellas.

## Estado actual

- Renderizado principal en Canvas.
- Arranque por defecto en modo oscuro para mejorar la lectura de catálogos densos.
- Panel lateral tipo hamburguesa.
- Modo claro y oscuro.
- Zoom, desplazamiento y encaje automático.
- Zoom mínimo fijado al 100%.
- Ejes flotantes siempre visibles.
- Ejes adaptativos con marcas intermedias según el zoom.
- Zonas clicables: secuencia principal, gigantes, supergigantes, enanas blancas y franja de inestabilidad.
- Estrellas de muestra clicables.
- Nube sintética de puntos para validar rendimiento visual.
- Importación local avanzada de CSV.
- Carga automática de catálogos estáticos troceados desde `data/catalogs/manifest.json` cuando existe.
- Filtros visuales por catálogo cargado.

## Estructura

```text
.
├── index.html
├── styles.css
├── catalog-layers.css
├── app.js
├── data-importer.js
├── catalog-loader.js
├── static-catalog-loader.js
├── label-rendering.js
├── catalog-layer-filter.js
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

## Importación de catálogos

La aplicación acepta uno o varios CSV locales desde el panel lateral. El fichero no se sube a ningún servidor: se procesa en el navegador.

El cargador avanzado reconoce actualmente:

- **NASA Exoplanet Archive**: detecta `hostname`, `st_teff`, `st_lum`, `st_rad`, `st_mass`, `sy_dist`, `sy_pnum`, `pl_name`. La luminosidad `st_lum` se interpreta como log10(L☉) y se convierte a luminosidad lineal.
- **HYG / ATHYG / HYG-like**: detecta `proper`, `spect`, `ci`, `lum`, `absmag`, `dist`, `hip`, `hd`, `gl`. Si no hay temperatura explícita, estima temperatura desde B−V (`ci`) o clase espectral. Si no hay `lum`, calcula luminosidad desde magnitud absoluta (`absmag`).
- **CSV de clasificación estelar tipo Kaggle**: detecta `Temperature (K)`, `Luminosity(L/Lo)`, `Radius(R/Ro)`, `Star type`, `Star color`, `Spectral Class`.
- **CSV HR genéricos / Gaia-like**: reconoce campos como `teff`, `temperature`, `temperature_k`, `effective_temperature`, `teff_gspphot`, `luminosity`, `lum`, `lum_flame`, `radius`, `st_rad`, `mass`, `st_mass`, `sy_dist`.

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

Cada parte mantiene la cabecera CSV y queda por debajo de 22 MiB. Cuando `manifest.json` existe en GitHub Pages, la web descarga automáticamente las partes, recompone cada catálogo como unidad lógica y muestra los filtros de catálogo.

## Filtros por catálogo

Al cargar datos reales, aparece la sección **Catálogos visibles** en el panel lateral. Todos los catálogos aparecen activados por defecto. Cada interruptor permite ocultar o mostrar una fuente concreta sin recargar los CSV.

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

La muestra inicial sigue siendo pedagógica. Los catálogos importados localmente pueden tener columnas incompletas, magnitudes derivadas o valores estimados. Las estimaciones desde B−V o clase espectral son útiles para visualización, pero no sustituyen una reducción científica controlada.
