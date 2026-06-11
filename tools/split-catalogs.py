#!/usr/bin/env python3
"""
Trocea catálogos CSV grandes en partes subibles a GitHub desde navegador.

Uso recomendado desde la raíz del repositorio:

    python tools/split-catalogs.py "C:/ruta/a/mis_csv" --out data/catalogs --max-mib 22

El script:
- conserva la cabecera en cada parte;
- ignora líneas de comentario iniciales para crear partes CSV limpias;
- genera data/catalogs/manifest.json;
- no modifica los CSV originales.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Iterable


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", Path(value).stem.lower()).strip("-")
    return slug or "catalog"


def find_header(lines: list[bytes]) -> tuple[int, bytes]:
    for index, line in enumerate(lines):
        text = line.decode("utf-8", errors="replace").strip()
        if text and not text.startswith("#"):
            return index, line
    raise ValueError("No se ha encontrado una cabecera CSV válida.")


def split_csv(src: Path, out_root: Path, max_bytes: int) -> dict:
    raw_lines = src.read_bytes().splitlines(keepends=True)
    header_index, header = find_header(raw_lines)
    rows = [line for line in raw_lines[header_index + 1 :] if line.strip() and not line.lstrip().startswith(b"#")]

    dataset_id = slugify(src.name)
    dataset_dir = out_root / dataset_id
    dataset_dir.mkdir(parents=True, exist_ok=True)

    parts: list[dict] = []
    current: list[bytes] = []
    current_size = len(header)
    part_index = 1

    def flush() -> None:
        nonlocal current, current_size, part_index
        if not current and rows:
            return
        filename = f"part-{part_index:03d}.csv"
        path = dataset_dir / filename
        path.write_bytes(header + b"".join(current))
        parts.append({
            "path": str(path.as_posix()),
            "bytes": path.stat().st_size,
        })
        part_index += 1
        current = []
        current_size = len(header)

    for row in rows:
        if current and current_size + len(row) > max_bytes:
            flush()
        current.append(row)
        current_size += len(row)

    if current or not rows:
        flush()

    # Convertimos rutas absolutas/relativas de salida a rutas esperadas por GitHub Pages.
    for part in parts:
      part_path = Path(part["path"])
      try:
          part["path"] = part_path.relative_to(Path.cwd()).as_posix()
      except ValueError:
          # Si se ejecuta fuera de la raíz, asumimos que out_root equivale a data/catalogs.
          part["path"] = f"data/catalogs/{dataset_id}/{part_path.name}"

    return {
        "id": dataset_id,
        "label": src.stem,
        "source_file": src.name,
        "original_bytes": src.stat().st_size,
        "rows_approx": len(rows),
        "chunks": parts,
    }


def iter_csv_files(input_path: Path) -> Iterable[Path]:
    if input_path.is_file() and input_path.suffix.lower() == ".csv":
        yield input_path
        return
    for path in sorted(input_path.glob("*.csv")):
        if path.is_file():
            yield path


def main() -> None:
    parser = argparse.ArgumentParser(description="Trocea catálogos CSV para GitHub Pages.")
    parser.add_argument("input", type=Path, help="CSV concreto o carpeta con CSV.")
    parser.add_argument("--out", type=Path, default=Path("data/catalogs"), help="Carpeta de salida. Por defecto: data/catalogs")
    parser.add_argument("--max-mib", type=float, default=22.0, help="Tamaño máximo por parte en MiB. Por defecto: 22")
    parser.add_argument("--clean", action="store_true", help="Vacía la carpeta de salida antes de generar partes.")
    args = parser.parse_args()

    input_path = args.input.expanduser().resolve()
    out_root = args.out
    max_bytes = int(args.max_mib * 1024 * 1024)

    if args.clean and out_root.exists():
        shutil.rmtree(out_root)
    out_root.mkdir(parents=True, exist_ok=True)

    datasets = []
    for csv_file in iter_csv_files(input_path):
        print(f"Troceando {csv_file.name}…")
        datasets.append(split_csv(csv_file, out_root, max_bytes))

    if not datasets:
        raise SystemExit("No se han encontrado CSV en la ruta indicada.")

    manifest = {
        "version": 1,
        "chunk_size_limit_mib": args.max_mib,
        "datasets": datasets,
    }

    manifest_path = out_root / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    readme_path = out_root / "README.md"
    readme_path.write_text(
        "# Catálogos troceados\n\n"
        "Esta carpeta contiene CSV divididos en partes pequeñas y un `manifest.json`.\n\n"
        "Sube `manifest.json` y todas las carpetas de catálogo a `data/catalogs/`.\n"
        "La web detectará el manifest y mostrará un botón para cargar los catálogos desde el repositorio.\n",
        encoding="utf-8",
    )

    print(f"\nManifest generado: {manifest_path}")
    for dataset in datasets:
        max_part = max(part["bytes"] for part in dataset["chunks"])
        print(f"- {dataset['label']}: {len(dataset['chunks'])} parte(s), máximo {max_part / 1024 / 1024:.2f} MiB")


if __name__ == "__main__":
    main()
