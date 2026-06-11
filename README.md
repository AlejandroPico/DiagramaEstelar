# DiagramaEstelar

Visualizador interactivo del diagrama de Hertzsprung-Russell preparado para GitHub Pages.

## Objetivo

Crear una página web estática en HTML, CSS y JavaScript para explorar temperatura efectiva, luminosidad, color, clase espectral y regiones evolutivas de las estrellas.

## Primera versión

- Renderizado principal en Canvas.
- Panel lateral tipo hamburguesa.
- Modo claro y oscuro.
- Zoom, desplazamiento y encaje automático.
- Zonas clicables: secuencia principal, gigantes, supergigantes, enanas blancas y franja de inestabilidad.
- Estrellas de muestra clicables.
- Nube sintética de puntos para validar rendimiento visual.
- Importación local de CSV.

## Estructura

```text
.
├── index.html
├── styles.css
├── app.js
├── data/stars.sample.json
└── README.md
```

## CSV admitido

Campos recomendados:

```csv
name,teff,luminosity,spectral_type,class,distance_ly,mass,radius,source,notes
Sol,5772,1,G2V,main-sequence,0.0000158,1,1,Muestra,Referencia solar
```

También se admiten nombres equivalentes como `temperature`, `st_teff`, `teff_gspphot`, `lum`, `st_lum`, `radius`, `st_rad`, `mass`, `st_mass` y `sy_dist`.

## Fuentes previstas

- Gaia DR3 / ESA como fuente principal para una versión científica amplia.
- NASA Exoplanet Archive para una capa de estrellas anfitrionas de exoplanetas.
- Hipparcos / HEASARC para una muestra clásica de estrellas brillantes y cercanas.
- VizieR / CDS para catálogos especializados.

## Advertencia

La versión actual usa una muestra pedagógica y una nube sintética. No debe tratarse todavía como catálogo científico completo.
