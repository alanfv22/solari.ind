"""
Importador + Sincronizador de imágenes — Solari.ind
────────────────────────────────────────────────────
1. Lee todas las hojas del Google Sheet (una por categoría)
2. Importa productos nuevos a Supabase (skip si ya existen)
3. Sincroniza imágenes desde Drive para TODOS los productos sin fotos
4. Al final muestra productos sin precio y sin imagen

Estructura Drive: Solari.ind/ → <Categoría>/ → <Nombre Producto>/ → imágenes
"""

import os
import re
import sys
import unicodedata
from pathlib import Path
from dotenv import load_dotenv

import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io
import requests

# ─── Configuración ────────────────────────────────────────────────────────────

SCRIPT_DIR      = Path(__file__).parent
ENV_FILE        = SCRIPT_DIR.parent / ".env.local"
CREDS_FILE      = SCRIPT_DIR / "solari-ind-f94f6331635f.json"

SHEET_ID        = "1BNX2QaflXSzrRraA0QGHpm6YX9VnV2-eNw4LHRuhElk"
DRIVE_FOLDER_ID = "1inn9Y0Zk-CaGHcsZQV8eLxDjtqqqN8SJ"
STORE_ID        = "f7568beb-76c8-416e-afba-b693bd49d699"
BUCKET          = "solari-ind"

SKIP_SHEETS = {"instrucciones", "ejemplos", "readme", "hoja1", "sheet1"}

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

# ─── Helpers de texto ─────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text

def slugify(text: str) -> str:
    text = normalize(text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    return text.strip("-")

# ─── Compresión de imágenes ───────────────────────────────────────────────────

def compress_image(content: bytes, max_size_kb: int = 300, max_width: int = 1200) -> tuple[bytes, str]:
    """
    Comprime una imagen manteniendo buena calidad visual.
    - Redimensiona si el ancho supera max_width
    - Comprime hasta max_size_kb KB
    - Devuelve (bytes_comprimidos, mime_type)
    """
    from PIL import Image
    import io as _io

    img = Image.open(_io.BytesIO(content))

    # Convertir a RGB si tiene canal alpha (PNG con transparencia)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Redimensionar si es muy ancha
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.LANCZOS)

    # Comprimir ajustando calidad
    quality = 85
    while quality >= 40:
        buf = _io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        size_kb = buf.tell() / 1024
        if size_kb <= max_size_kb:
            break
        quality -= 10

    buf.seek(0)
    return buf.read(), "image/jpeg"

# ─── Entorno ──────────────────────────────────────────────────────────────────

def load_env():
    if not ENV_FILE.exists():
        print(f"[ERROR] No se encontró {ENV_FILE}")
        sys.exit(1)
    load_dotenv(ENV_FILE)
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[ERROR] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
        sys.exit(1)
    return url.rstrip("/"), key

def google_creds():
    if not CREDS_FILE.exists():
        print(f"[ERROR] No se encontró {CREDS_FILE}")
        sys.exit(1)
    return Credentials.from_service_account_file(str(CREDS_FILE), scopes=GOOGLE_SCOPES)

# ─── Supabase REST ────────────────────────────────────────────────────────────

class Supabase:
    def __init__(self, url: str, key: str):
        self.base = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def select(self, table: str, params: dict = None) -> list:
        r = requests.get(f"{self.base}/rest/v1/{table}", headers=self.headers, params=params or {})
        r.raise_for_status()
        return r.json()

    def insert(self, table: str, data: dict) -> dict:
        r = requests.post(f"{self.base}/rest/v1/{table}", headers=self.headers, json=data)
        r.raise_for_status()
        result = r.json()
        return result[0] if isinstance(result, list) else result

    def upload_storage(self, path: str, content: bytes, content_type: str) -> str:
        url = f"{self.base}/storage/v1/object/{BUCKET}/{path}"
        headers = {
            "apikey": self.headers["apikey"],
            "Authorization": self.headers["Authorization"],
            "Content-Type": content_type,
            "x-upsert": "true",
        }
        r = requests.post(url, headers=headers, data=content)
        r.raise_for_status()
        return f"{self.base}/storage/v1/object/public/{BUCKET}/{path}"

# ─── Google Sheets ─────────────────────────────────────────────────────────────

def read_all_sheets(creds) -> dict[str, list[dict]]:
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(SHEET_ID)
    result = {}
    for ws in sh.worksheets():
        sheet_name = ws.title.strip()
        if normalize(sheet_name) in SKIP_SHEETS:
            print(f"  [SKIP hoja] '{sheet_name}'")
            continue
        rows = ws.get_all_records(head=1)
        rows = rows[2:]  # saltear filas de ejemplo

        last_name = None
        for row in rows:
            name = str(row.get("nombre", "")).strip()
            if name:
                last_name = name
            else:
                row["nombre"] = last_name or ""

        rows = [r for r in rows if r.get("nombre")]
        if rows:
            result[sheet_name] = rows
            print(f"  Hoja '{sheet_name}': {len(rows)} filas")
        else:
            print(f"  Hoja '{sheet_name}': vacía, se omite")
    return result

# ─── Google Drive ──────────────────────────────────────────────────────────────

def build_drive_service(creds):
    return build("drive", "v3", credentials=creds, cache_discovery=False)

def list_subfolders(drive_service, parent_id: str) -> dict[str, str]:
    result = drive_service.files().list(
        q=f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields="files(id, name)",
        pageSize=200,
    ).execute()
    return {normalize(f["name"]): f["id"] for f in result.get("files", [])}

def list_images_in_folder(drive_service, folder_id: str) -> list[dict]:
    result = drive_service.files().list(
        q=f"'{folder_id}' in parents and trashed=false and (mimeType contains 'image/')",
        fields="files(id, name, mimeType)",
        orderBy="name",
        pageSize=20,
    ).execute()
    return result.get("files", [])

def download_file(drive_service, file_id: str) -> bytes:
    request = drive_service.files().get_media(fileId=file_id)
    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buf.getvalue()

def upload_images_for_product(db, drive_service, product_id, product_name, slug, cat_drive_folder_id, product_folders_cache, cat_key):
    """Busca, comprime y sube imágenes para un producto. Devuelve cantidad subida."""
    if cat_key not in product_folders_cache:
        product_folders_cache[cat_key] = list_subfolders(drive_service, cat_drive_folder_id)
    product_folders = product_folders_cache[cat_key]

    prod_folder_id = product_folders.get(normalize(product_name))
    if not prod_folder_id:
        print(f"    [INFO] Sin carpeta Drive para '{product_name}'")
        return 0

    images = list_images_in_folder(drive_service, prod_folder_id)
    if not images:
        print(f"    [INFO] Carpeta Drive vacía para '{product_name}'")
        return 0

    uploaded = 0
    for sort_order, img_file in enumerate(images):
        file_name = img_file["name"]
        try:
            content = download_file(drive_service, img_file["id"])

            # Comprimir imagen antes de subir
            content, mime_type = compress_image(content)
            storage_path = f"{STORE_ID}/{slug}/{file_name.rsplit('.', 1)[0]}.jpg"

            public_url = db.upload_storage(storage_path, content, mime_type)
            db.insert("product_images", {
                "product_id": product_id,
                "url":        public_url,
                "is_primary": sort_order == 0,
                "sort_order": sort_order,
            })
            size_kb = len(content) / 1024
            print(f"    [OK] Imagen: {file_name} → {size_kb:.0f}KB" + (" (principal)" if sort_order == 0 else ""))
            uploaded += 1
        except Exception as e:
            print(f"    [WARN] Error subiendo '{file_name}': {e}")
    return uploaded

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Importador + Sync Solari.ind ===\n")

    supabase_url, supabase_key = load_env()
    db = Supabase(supabase_url, supabase_key)
    creds = google_creds()
    drive_service = build_drive_service(creds)

    # ── Categorías de Supabase ────────────────────────────────────────────────
    print("Cargando categorías desde Supabase...")
    categories_raw = db.select("categories", {"store_id": f"eq.{STORE_ID}"})
    categories_by_norm  = {normalize(c["name"]): c["id"]   for c in categories_raw}
    categories_by_id    = {c["id"]: c["name"]               for c in categories_raw}
    print(f"  {len(categories_by_norm)} categorías encontradas\n")

    # ── Carpetas Drive (nivel categoría) ──────────────────────────────────────
    print("Indexando carpetas Drive...")
    drive_category_folders = list_subfolders(drive_service, DRIVE_FOLDER_ID)
    print(f"  {len(drive_category_folders)} carpetas encontradas\n")

    # Cache de subcarpetas por categoría
    product_folders_cache: dict[str, dict[str, str]] = {}

    # ── PASO 1: Importar productos nuevos desde el Excel ──────────────────────
    print("=" * 55)
    print("PASO 1 — Importando productos desde Google Sheets")
    print("=" * 55 + "\n")

    print("Leyendo hojas...")
    all_sheets = read_all_sheets(creds)
    print(f"\n  Total hojas con datos: {len(all_sheets)}\n")

    imported = 0
    skipped  = 0
    failed   = 0

    for sheet_name, rows in all_sheets.items():
        print(f"\n── Categoría: {sheet_name} ──")

        cat_id = categories_by_norm.get(normalize(sheet_name))
        if not cat_id:
            print(f"  [WARN] Categoría '{sheet_name}' no encontrada en Supabase.")

        cat_key = normalize(sheet_name)
        cat_drive_folder_id = drive_category_folders.get(cat_key)
        if not cat_drive_folder_id:
            print(f"  [WARN] Sin carpeta Drive para '{sheet_name}'.")

        products_dict: dict[str, list[dict]] = {}
        for row in rows:
            name = str(row["nombre"]).strip()
            products_dict.setdefault(name, []).append(row)

        print(f"  {len(products_dict)} producto(s) en la hoja")

        for product_name, product_rows in products_dict.items():
            print(f"\n  → {product_name}")
            try:
                slug = slugify(product_name)

                existing = db.select("products", {"store_id": f"eq.{STORE_ID}", "slug": f"eq.{slug}"})
                if existing:
                    print(f"    [SKIP] Ya existe.")
                    skipped += 1
                    continue

                first = product_rows[0]

                try:
                    base_price = float(str(first.get("precio", "0")).replace(",", ".") or "0")
                except ValueError:
                    base_price = 0.0

                gender_raw = str(first.get("genero", "unisex")).strip().lower()
                gender_map = {
                    "mujer": "mujer", "hombre": "hombre", "unisex": "unisex",
                    "niño": "unisex", "nino": "unisex",
                    "m": "mujer", "h": "hombre", "u": "unisex",
                }
                gender           = gender_map.get(normalize(gender_raw), "unisex")
                description      = str(first.get("descripcion", "")).strip() or product_name
                is_made_to_order = str(first.get("a_pedido", "")).strip().lower() in (
                    "si", "sí", "yes", "1", "true"
                )

                if base_price == 0.0:
                    print(f"    [WARN] Sin precio — se importa igual pero revisar.")

                product = db.insert("products", {
                    "store_id":                  STORE_ID,
                    "name":                      product_name,
                    "slug":                      slug,
                    "base_price":                base_price,
                    "category_id":               cat_id,
                    "gender":                    gender,
                    "description":               description,
                    "is_made_to_order":          is_made_to_order,
                    "is_on_sale":                False,
                    "sale_percent":              10,
                    "transfer_discount_percent": 20,
                    "active":                    True,
                    "sort_order":                0,
                })
                product_id = product["id"]
                print(f"    [OK] Producto insertado → id: {product_id}")

                # Variantes
                variants_inserted = 0
                for row in product_rows:
                    talle = str(row.get("talle", "")).strip()
                    color = str(row.get("color", "")).strip()
                    if not talle and not color:
                        continue
                    label = f"{talle} - {color}" if talle and color else (talle or color)
                    try:
                        stock = int(float(str(row.get("stock", "0")).replace(",", ".") or "0"))
                    except ValueError:
                        stock = 0
                    db.insert("product_variants", {
                        "product_id":     product_id,
                        "label":          label,
                        "stock":          stock,
                        "active":         True,
                        "price_override": None,
                    })
                    variants_inserted += 1
                print(f"    [OK] {variants_inserted} variante(s)")

                # Imágenes (intento inmediato)
                if cat_drive_folder_id:
                    upload_images_for_product(
                        db, drive_service, product_id, product_name, slug,
                        cat_drive_folder_id, product_folders_cache, cat_key
                    )

                imported += 1

            except Exception as err:
                print(f"    [ERROR] '{product_name}': {err}")
                failed += 1

    # ── PASO 2: Sync de imágenes para productos sin fotos ─────────────────────
    print("\n" + "=" * 55)
    print("PASO 2 — Sincronizando imágenes faltantes")
    print("=" * 55 + "\n")

    all_products = db.select("products", {"store_id": f"eq.{STORE_ID}", "active": "eq.true"})
    all_images   = db.select("product_images", {"select": "product_id"})
    products_with_images = {img["product_id"] for img in all_images}
    without_images = [p for p in all_products if p["id"] not in products_with_images]

    print(f"  Productos sin imágenes: {len(without_images)}\n")

    synced  = 0
    missing = 0

    for product in without_images:
        product_id   = product["id"]
        product_name = product["name"]
        slug         = product["slug"]
        cat_id       = product.get("category_id")
        cat_name     = categories_by_id.get(cat_id, "") if cat_id else ""
        cat_key      = normalize(cat_name)

        print(f"→ {product_name}  [{cat_name}]")

        cat_drive_folder_id = drive_category_folders.get(cat_key)
        if not cat_drive_folder_id:
            print(f"  [WARN] Sin carpeta Drive para categoría '{cat_name}'")
            missing += 1
            continue

        uploaded = upload_images_for_product(
            db, drive_service, product_id, product_name, slug,
            cat_drive_folder_id, product_folders_cache, cat_key
        )
        if uploaded > 0:
            synced += 1
        else:
            missing += 1

    # ── PASO 3: Reporte de productos sin precio y sin imagen ──────────────────
    print("\n" + "=" * 55)
    print("PASO 3 — Revisión de productos incompletos")
    print("=" * 55 + "\n")

    all_products_check = db.select("products", {"store_id": f"eq.{STORE_ID}", "active": "eq.true"})
    all_images_check   = db.select("product_images", {"select": "product_id"})
    products_with_images_check = {img["product_id"] for img in all_images_check}

    sin_precio  = [p for p in all_products_check if not p.get("base_price") or float(p["base_price"]) == 0]
    sin_imagen  = [p for p in all_products_check if p["id"] not in products_with_images_check]

    if sin_precio:
        print(f"⚠️  PRODUCTOS SIN PRECIO ({len(sin_precio)}):")
        for p in sin_precio:
            cat_name = categories_by_id.get(p.get("category_id"), "sin categoría")
            print(f"   - {p['name']}  [{cat_name}]")
    else:
        print("✓ Todos los productos tienen precio.")

    print()

    if sin_imagen:
        print(f"⚠️  PRODUCTOS SIN IMAGEN ({len(sin_imagen)}):")
        for p in sin_imagen:
            cat_name = categories_by_id.get(p.get("category_id"), "sin categoría")
            print(f"   - {p['name']}  [{cat_name}]")
    else:
        print("✓ Todos los productos tienen imagen.")

    # ── Resumen final ─────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    print("RESUMEN FINAL")
    print(f"  [Paso 1] Importados             : {imported}")
    print(f"  [Paso 1] Skipeados              : {skipped}")
    print(f"  [Paso 1] Fallidos               : {failed}")
    print(f"  [Paso 2] Imágenes sincronizadas : {synced}")
    print(f"  [Paso 2] Sin foto en Drive      : {missing}")
    print(f"  [Paso 3] Sin precio             : {len(sin_precio)}")
    print(f"  [Paso 3] Sin imagen             : {len(sin_imagen)}")
    print("=" * 55)


if __name__ == "__main__":
    main()