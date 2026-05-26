# Script de importación — Solari.ind

Importa productos desde Google Sheets y fotos desde Google Drive a Supabase.

## Requisitos previos

- Python 3.11+
- Acceso al Google Sheet y Google Drive con la cuenta de servicio
- Archivo de credenciales `solari-ind-f94f6331635f.json` en esta carpeta

## Instalación de dependencias

```bash
pip install gspread google-auth google-api-python-client python-dotenv requests
```

O usando un entorno virtual (recomendado):

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install gspread google-auth google-api-python-client python-dotenv requests
```

## Estructura esperada del Google Sheet

Hoja llamada **"Productos"**, columnas en orden:

| nombre | precio | categoria | genero | talle | color | stock | descripcion | a_pedido |
|--------|--------|-----------|--------|-------|-------|-------|-------------|----------|
| Jean Baggy | 25000 | Jeans | hombre | S | Negro | 5 | Descripción... | no |
|  |  |  |  | M | Negro | 3 |  |  |
|  |  |  |  | L | Blanco | 0 |  |  |

- Las **filas 2 y 3** se ignoran (son ejemplos del sheet).
- El nombre del producto se repite solo en la primera fila del grupo; las siguientes lo heredan automáticamente.
- `a_pedido`: escribir `si` para marcar como producto por encargo.

## Estructura de Google Drive

```
Carpeta raíz (DRIVE_FOLDER_ID)
├── Jean Baggy/          ← nombre exacto del producto
│   ├── foto1.jpg
│   └── foto2.jpg
└── Remera Essential/
    └── foto1.jpg
```

El nombre de la subcarpeta debe coincidir **exactamente** con el valor en la columna `nombre` del Sheet.

## Ejecutar el script

Desde la raíz del proyecto (un nivel arriba de `scripts/`):

```bash
python scripts/importar.py
```

O desde dentro de `scripts/`:

```bash
cd scripts
python importar.py
```

## Comportamiento

- **Productos existentes** (mismo `name` + `store_id`): se saltean con mensaje `[SKIP]`.
- **Errores por producto**: se loguean y se continúa con el siguiente.
- **Categorías**: deben existir previamente en la tabla `categories` de Supabase. Si no se encuentra la categoría, el campo queda en `NULL` pero el producto se importa igual.
- **Imágenes**: se suben al bucket `products` en Supabase Storage con el path `{store_id}/{slug}/{nombre_archivo}`. La primera imagen se marca como principal (`is_primary = true`).

## Resumen al final

```
==================================================
RESUMEN
  Importados : 12
  Skipeados  : 3
  Fallidos   : 1
==================================================
```
