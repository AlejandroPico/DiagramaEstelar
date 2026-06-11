# Catálogos estáticos

Esta carpeta está preparada para alojar catálogos CSV troceados.

## Flujo recomendado

1. Ejecuta desde la raíz del repositorio:

```bash
python tools/split-catalogs.py "C:/ruta/a/mis_csv" --out data/catalogs --max-mib 22 --clean
```

2. Sube a GitHub el `manifest.json` generado y las carpetas de partes CSV.

3. La web detectará `data/catalogs/manifest.json` en GitHub Pages y mostrará el botón **Cargar catálogos del repositorio** en el panel de datos.

Cada parte CSV incluye de nuevo la cabecera, por lo que también puede importarse manualmente si hace falta.
