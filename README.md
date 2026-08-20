# Diagrama Estelar

**Versión 1.0 · Hertzsprung–Russell interactivo**

Diagrama Estelar es un visualizador web interactivo del **diagrama de Hertzsprung–Russell (HR)** orientado a la exploración de catálogos estelares, la lectura visual de propiedades físicas y la divulgación astronómica.

La aplicación funciona completamente en el navegador y está preparada para GitHub Pages. Puede arrancar sin datos, importar CSV locales y cargar catálogos estáticos troceados desde el propio repositorio.

> La rama `beta` contiene la versión 1.0 preparada para validación antes de su integración definitiva en `main`.

---

## Características principales

### Diagrama HR interactivo

- Canvas adaptado automáticamente al tamaño real del navegador.
- Soporte para escritorio, monitores 1080p/4K, pantallas ultrapanorámicas, tabletas y móviles verticales u horizontales.
- Zoom de hasta **7000 %**.
- Arrastre de la vista con ratón o un dedo.
- Pellizco con dos dedos para hacer zoom en pantallas táctiles.
- Reajuste automático tras cambios de orientación o tamaño del `visualViewport`.

### Cuatro ejes dinámicos

El visor representa simultáneamente:

- **Izquierda:** luminosidad relativa al Sol, `L☉`.
- **Derecha:** magnitud absoluta aproximada.
- **Arriba:** tipo espectral y referencias de temperatura efectiva.
- **Abajo:** índice de color `B−V`.

Las marcas de los ejes se recalculan según el rango visible. Al aumentar el zoom aparecen divisiones adicionales. El eje B−V incrementa progresivamente su precisión y puede mostrar hasta cuatro decimales cuando el nivel de ampliación lo justifica, manteniendo separación mínima entre etiquetas para evitar solapamientos.

### Temas visuales

La interfaz ofrece cuatro modos:

- **Automático** — modo inicial recomendado.
- **Día**.
- **Tarde**.
- **Noche**.

El modo automático intenta obtener la ubicación mediante la API de geolocalización del navegador y calcula la altura solar local para decidir entre día, tarde y noche. Si la ubicación no está disponible, utiliza la hora local del dispositivo como respaldo.

### Barra HUD unificada

La interfaz superior utiliza un bloque rectangular compacto, sin botones flotantes redondeados. Incluye:

1. Búsqueda.
2. Enciclopedia.
3. Tema.
4. Datos.
5. Filtros.
6. Capas.
7. Acerca del proyecto.
8. Zoom actual / restablecer vista.

En móvil y tablet, el HUD se centra y ocupa solamente el ancho necesario para sus controles. El buscador crea una segunda fila dentro del propio HUD y puede cerrarse pulsando nuevamente la lupa. El gráfico reserva automáticamente margen superior para que las referencias del eje espectral no queden ocultas tras la barra.

---

## Datos y catálogos

La aplicación no carga estrellas automáticamente al abrirse. El escenario inicial queda vacío hasta que el usuario importa o solicita datos.

### Importación CSV

La importación se procesa localmente en el navegador. Los archivos no se envían a ningún servidor.

Se reconocen, entre otros, formatos y campos habituales de:

- NASA Exoplanet Archive.
- HYG.
- ATHYG / HYG-like.
- Catálogos Gaia-like.
- CSV HR genéricos.
- Datasets de clasificación estelar con temperatura, luminosidad, radio, masa, color y clase espectral.

Campos principales reconocidos incluyen variantes de:

```text
teff
st_teff
temperature
luminosity
lum
st_lum
radius
st_rad
mass
st_mass
spect
ci
sy_dist
sy_pnum
```

Los campos originales no vacíos de una fila importada se conservan en `rawFields` y pueden consultarse desde la ficha de estrella.

### Catálogos estáticos troceados

Los catálogos grandes pueden dividirse en partes para mantenerlos dentro del repositorio y servirlos desde GitHub Pages.

Herramienta incluida:

```bash
python tools/split-catalogs.py "C:/ruta/a/mis_csv" --out data/catalogs --max-mib 22 --clean
```

El proceso genera:

```text
data/catalogs/manifest.json
```

y las distintas partes CSV. Si el manifest existe, la aplicación habilita la carga manual del repositorio propio.

---

## Filtros científicos

El botón de filtros permite acotar el conjunto visible sin modificar los datos originales.

Filtros disponibles:

- Tipo espectral.
- Temperatura efectiva.
- Luminosidad.
- Magnitud absoluta aproximada.
- Radio.
- Masa.
- Distancia.
- Número de planetas conocidos.
- Índice B−V.

Los filtros numéricos incluyen:

- barra de doble extremo;
- mínimo y máximo independientes;
- entrada manual de valores;
- caché de estadísticas para catálogos grandes;
- actualización diferida durante el arrastre para reducir bloqueos;
- restauración real del catálogo completo cuando el rango vuelve a sus límites originales.

---

## Capas científicas

Desde el panel **Capas** se pueden activar o desactivar:

- Estrellas cargadas.
- Zonas evolutivas.
- Nombres de zonas.
- Cuadrícula y ejes.
- Animación suave.
- Incertidumbre.
- Radios constantes.
- Isocronas.
- Trayectorias evolutivas.

### Incertidumbre

Cuando un catálogo aporta errores de temperatura o luminosidad, la aplicación puede representar una elipse de incertidumbre alrededor de la posición HR.

### Radios constantes

Se muestran curvas aproximadas de radio estelar derivadas de la relación entre luminosidad, temperatura efectiva y radio.

### Isocronas y trayectorias

Las isocronas y trayectorias incluidas son **referencias pedagógicas**, útiles para contextualizar la evolución estelar. No sustituyen tablas profesionales como MIST, PARSEC, BaSTI o Geneva.

---

## Zonas evolutivas

Las principales regiones del diagrama se muestran mediante polígonos suavizados y translúcidos:

- Secuencia principal.
- Gigantes.
- Supergigantes.
- Enanas blancas.
- Franja de inestabilidad.

La interacción utiliza hit-test geométrico sobre las formas suavizadas. Los nombres de las regiones se renderizan en una capa estabilizada para que mantengan un tamaño legible durante el zoom.

---

## Fichas de estrella

Al seleccionar una estrella se abre una ficha moderna con pestañas y datos disponibles del catálogo.

Puede mostrar, según la fuente:

- Identidad y designaciones.
- Temperatura.
- Luminosidad.
- Radio.
- Masa.
- Distancia.
- Tipo espectral.
- Datos CSV originales.
- Fuente del registro.

### Fuentes externas

La pestaña **Fuentes** puede construir accesos a:

- Wikipedia.
- SIMBAD.
- VizieR.
- NASA Exoplanet Archive.
- Gaia Archive cuando existe identificador Gaia.
- NASA ADS.
- arXiv.
- Google.

El sistema intenta utilizar el identificador más útil disponible: nombre, `hostname`, HD, HIP, Gaia DR3 o clave propia del catálogo.

---

## Enciclopedia integrada

El icono de libro abierto da acceso a una guía científica interna de **20 capítulos**:

1. Qué estás viendo.
2. Historia del diagrama HR.
3. Ejes y escalas.
4. Temperatura y color.
5. Tipos OBAFGKM.
6. Luminosidad.
7. Magnitud absoluta.
8. Color B−V.
9. Secuencia principal.
10. Vida estelar.
11. Regiones HR.
12. Variables e inestabilidad.
13. Cómo leer una estrella.
14. Catálogos y límites.
15. Radio y ley de Stefan–Boltzmann.
16. Metalicidad.
17. Binarias, mezclas y dispersión.
18. Cúmulos e isocronas.
19. Exoplanetas y estrellas anfitrionas.
20. Gaia, paralaje y buenas prácticas.

En móvil, el índice se repliega detrás del botón **Temas** para priorizar el espacio de lectura.

---

## Rendimiento

La versión 1.0 combina varias estrategias:

- `Web Worker` para procesar importaciones grandes.
- Renderizado Canvas 2D para ejes, regiones, textos y elementos científicos.
- Capa WebGL experimental para dibujar grandes cantidades de puntos mediante `gl.POINTS`.
- Redibujado táctil agrupado mediante `requestAnimationFrame`.
- Desactivación automática de animación cuando el volumen de datos es elevado.
- Caché de filtros y estadísticas.

WebGL acelera principalmente el dibujo de puntos. La búsqueda de la estrella más cercana continúa siendo una operación CPU; un índice espacial o quadtree es una posible evolución posterior a la 1.0.

---

## Diseño responsive y táctil

La aplicación utiliza el viewport visual real en lugar de depender de una resolución fija.

Incluye:

- `visualViewport` para navegadores móviles.
- `ResizeObserver`.
- soporte para cambios de orientación;
- `safe-area-inset`;
- canvas 2D y WebGL sincronizados;
- desplazamiento con un dedo;
- pinch-to-zoom con dos dedos;
- toque simple para seleccionar objetos;
- supresión de clic accidental tras arrastre o pellizco;
- HUD móvil centrado y de anchura intrínseca;
- margen superior del gráfico calculado respecto a la altura real del HUD.

---

## Estructura del proyecto

```text
.
├── index.html
├── favicon.svg
├── README.md
│
├── app.js
├── startup-empty-mode.js
├── theme-system.js
├── floating-toolbar.js
├── responsive-canvas-gestures.js
├── mobile-chart-layout-v1.js
├── zoom-boost.js
│
├── hr-four-axis-overlay.js
├── hr-axis-v1-polish.js
├── bv-axis-detail-v1.js
├── evolutionary-regions-polish.js
├── region-label-stabilizer.js
├── scientific-overlays.js
├── label-rendering.js
│
├── webgl-star-renderer.js
├── data-importer.js
├── catalog-loader.js
├── catalog-loader-enhanced.js
├── static-catalog-loader.js
├── catalog-layer-filter.js
├── advanced-filters.js
│
├── star-card-refine.js
├── region-card-refine.js
├── external-sources-enhanced.js
├── about-panel.js
├── info-guide.js
├── info-guide-expansion.js
├── mobile-info-index.js
├── data-actions.js
├── empty-data-hint.js
│
├── styles.css
├── atlas-square-ui.css
├── responsive-viewport.css
├── mobile-responsive.css
├── floating-toolbar.css
├── webgl-renderer.css
├── advanced-filters.css
├── scientific-overlays.css
├── star-card-refine.css
├── data-panel-refine.css
├── info-guide.css
├── loading-progress.css
├── catalog-layers.css
├── visibility-fixes.css
├── beta-toolbar-fixes.css
├── square-edges-final.css
│
├── data/
│   └── catalogs/
│       ├── manifest.json
│       └── ...
│
└── tools/
    └── split-catalogs.py
```

---

## Límites científicos

Diagrama Estelar es un visualizador científico-divulgativo, no una herramienta de reducción astrofísica profesional.

Debe tenerse en cuenta que:

- las regiones evolutivas son aproximadas;
- las isocronas y trayectorias actuales son pedagógicas;
- la magnitud absoluta mostrada puede derivarse de luminosidad mediante una aproximación;
- B−V puede estimarse cuando el catálogo no lo proporciona directamente;
- los catálogos pueden contener campos ausentes, estimados o duplicados;
- los errores de los datos originales dependen de cada fuente.

Para trabajo científico formal se deben consultar los catálogos y modelos originales.

---

## Autor

**Alejandro Pico**

- Portfolio: <https://alejandropico.github.io/Portfolio/>
- Repositorio: <https://github.com/AlejandroPico/DiagramaEstelar>

---

## Versión

**Diagrama Estelar 1.0 — 2026**

La versión 1.0 establece la base funcional y visual del proyecto. Las futuras incorporaciones se considerarán evoluciones posteriores a esta primera versión estable.
