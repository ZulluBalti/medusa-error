import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_SPEC_MODULE } from "../modules/productSpec"
import ProductSpecModuleService from "../modules/productSpec/service"

type SpecMap = Record<string, string>

// Specs are keyed by product handle (matches laptop-shop-seed.ts).
// Values reflect the base / starting configuration of each product.
const SPECS_BY_HANDLE: Record<string, SpecMap> = {
  // ── Refurbished ────────────────────────────────────────────────────────
  "dell-latitude-7420-refurbished": {
    brand: "Dell",
    ram: "8 GB",
    diagonal: "14 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i5",
    disk: "256 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "lenovo-thinkpad-t480-refurbished": {
    brand: "Lenovo",
    ram: "8 GB",
    diagonal: "14 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i5",
    disk: "256 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "hp-elitebook-840-g7-refurbished": {
    brand: "HP",
    ram: "16 GB",
    diagonal: "14 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i5",
    disk: "256 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },

  // ── Demonstration ──────────────────────────────────────────────────────
  "macbook-pro-14-m3-demo": {
    brand: "Apple",
    ram: "8 GB",
    diagonal: "14 inches",
    resolution: "3024 x 1964 px",
    processor: "Apple M3",
    disk: "512 GB",
    graphics: "Apple M3 GPU",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "dell-xps-15-demo": {
    brand: "Dell",
    ram: "16 GB",
    diagonal: "15 inches",
    resolution: "3456 x 2160 px",
    processor: "Intel Core i7",
    disk: "512 GB",
    graphics: "nVIDIA GeForce RTX",
    touch: "YES",
    numeric_keypad: "NO",
    mechanical: "NO",
  },

  // ── Office ─────────────────────────────────────────────────────────────
  "hp-probook-450-g10": {
    brand: "HP",
    ram: "8 GB",
    diagonal: "15 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i5",
    disk: "256 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },
  "lenovo-thinkpad-e14-gen-5": {
    brand: "Lenovo",
    ram: "8 GB",
    diagonal: "14 inches",
    resolution: "1920 x 1080 px",
    processor: "AMD Ryzen 5",
    disk: "256 GB",
    graphics: "AMD Radeon",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "dell-vostro-3520": {
    brand: "Dell",
    ram: "8 GB",
    diagonal: "15 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i3",
    disk: "256 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },

  // ── Gaming ─────────────────────────────────────────────────────────────
  "asus-rog-strix-g16": {
    brand: "Asus",
    ram: "16 GB",
    diagonal: "16 inches",
    resolution: "2560 x 1600 px",
    processor: "Intel Core i9",
    disk: "1000 GB",
    graphics: "nVIDIA GeForce RTX",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },
  "lenovo-legion-pro-5": {
    brand: "Lenovo",
    ram: "16 GB",
    diagonal: "16 inches",
    resolution: "2560 x 1600 px",
    processor: "AMD Ryzen 7",
    disk: "512 GB",
    graphics: "nVIDIA GeForce RTX",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },
  "msi-katana-15": {
    brand: "MSI",
    ram: "16 GB",
    diagonal: "15 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i7",
    disk: "512 GB",
    graphics: "nVIDIA GeForce RTX",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },

  // ── Student ────────────────────────────────────────────────────────────
  "acer-aspire-5": {
    brand: "Acer",
    ram: "8 GB",
    diagonal: "15 inches",
    resolution: "1920 x 1080 px",
    processor: "AMD Ryzen 5",
    disk: "256 GB",
    graphics: "AMD Radeon",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },
  "lenovo-ideapad-3": {
    brand: "Lenovo",
    ram: "8 GB",
    diagonal: "14 inches",
    resolution: "1920 x 1080 px",
    processor: "AMD Ryzen 3",
    disk: "256 GB",
    graphics: "AMD Radeon",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "hp-pavilion-15": {
    brand: "HP",
    ram: "8 GB",
    diagonal: "15 inches",
    resolution: "1920 x 1080 px",
    processor: "Intel Core i3",
    disk: "256 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "YES",
    mechanical: "NO",
  },

  // ── Travel ─────────────────────────────────────────────────────────────
  "macbook-air-m3-13": {
    brand: "Apple",
    ram: "8 GB",
    diagonal: "13 inches",
    resolution: "2560 x 1664 px",
    processor: "Apple M3",
    disk: "256 GB",
    graphics: "Apple M3 GPU",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "lg-gram-14": {
    brand: "LG",
    ram: "16 GB",
    diagonal: "14 inches",
    resolution: "1920 x 1200 px",
    processor: "Intel Core Ultra 5",
    disk: "512 GB",
    graphics: "Intel Arc Graphics",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "asus-zenbook-14-oled": {
    brand: "Asus",
    ram: "16 GB",
    diagonal: "14 inches",
    resolution: "2880 x 1800 px",
    processor: "Intel Core Ultra 5",
    disk: "512 GB",
    graphics: "Intel Arc Graphics",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },

  // ── Mini laptops ───────────────────────────────────────────────────────
  "gpd-pocket-3": {
    brand: "GPD",
    ram: "8 GB",
    diagonal: "8 inches",
    resolution: "1920 x 1200 px",
    processor: "Intel Pentium",
    disk: "512 GB",
    graphics: "Intel UHD Graphics",
    touch: "YES",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "one-netbook-onemix-4": {
    brand: "One Netbook",
    ram: "16 GB",
    diagonal: "10 inches",
    resolution: "2560 x 1600 px",
    processor: "Intel Core i5",
    disk: "512 GB",
    graphics: "Intel Iris Xe Graphics",
    touch: "YES",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "asus-chromebook-cx1-11": {
    brand: "Asus",
    ram: "4 GB",
    diagonal: "11 inches",
    resolution: "1366 x 768 px",
    processor: "Intel Celeron",
    disk: "64 GB",
    graphics: "Intel UHD Graphics",
    touch: "NO",
    numeric_keypad: "NO",
    mechanical: "NO",
  },

  // ── 2in1 ───────────────────────────────────────────────────────────────
  "microsoft-surface-pro-9": {
    brand: "Microsoft",
    ram: "8 GB",
    diagonal: "13 inches",
    resolution: "2880 x 1920 px",
    processor: "Intel Core i5",
    disk: "256 GB",
    graphics: "Intel Iris Xe Graphics",
    touch: "YES",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "lenovo-yoga-7i": {
    brand: "Lenovo",
    ram: "16 GB",
    diagonal: "14 inches",
    resolution: "2240 x 1400 px",
    processor: "Intel Core Ultra 5",
    disk: "512 GB",
    graphics: "Intel Arc Graphics",
    touch: "YES",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
  "hp-spectre-x360-14": {
    brand: "HP",
    ram: "16 GB",
    diagonal: "14 inches",
    resolution: "2880 x 1800 px",
    processor: "Intel Core Ultra 7",
    disk: "512 GB",
    graphics: "Intel Arc Graphics",
    touch: "YES",
    numeric_keypad: "NO",
    mechanical: "NO",
  },
}

// Order in which spec keys appear on the product page.
const KEY_ORDER = [
  "brand",
  "processor",
  "ram",
  "disk",
  "graphics",
  "diagonal",
  "resolution",
  "touch",
  "numeric_keypad",
  "mechanical",
]

export default async function seedProductSpecs({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const specService = container.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)

  logger.info("Fetching products by handle...")
  const handles = Object.keys(SPECS_BY_HANDLE)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: { handle: handles },
  })

  if (!products.length) {
    logger.warn("No matching products found. Run laptop-shop-seed first.")
    return
  }

  logger.info(`Matched ${products.length}/${handles.length} products. Seeding specs...`)

  let totalSpecs = 0
  let touched = 0

  for (const product of products) {
    const specs = SPECS_BY_HANDLE[product.handle as string]
    if (!specs) continue

    // Wipe any existing specs for this product so the script is re-runnable.
    const existing = await specService.listProductSpecifications({
      product_id: product.id,
    })
    if (existing.length) {
      await specService.deleteProductSpecifications(existing.map((s) => s.id))
    }

    const entries = KEY_ORDER
      .filter((key) => specs[key] != null && specs[key] !== "")
      .map((key, i) => ({
        product_id: product.id,
        variant_id: null,
        key,
        value: specs[key],
        sort_order: i,
      }))

    if (!entries.length) continue

    await specService.createProductSpecifications(entries)
    totalSpecs += entries.length
    touched++
    logger.info(`  ✓ ${product.title} — ${entries.length} specs`)
  }

  // Warn about any handles that didn't match a product.
  const matchedHandles = new Set(products.map((p) => p.handle))
  const missing = handles.filter((h) => !matchedHandles.has(h))
  if (missing.length) {
    logger.warn(`No product found for handles: ${missing.join(", ")}`)
  }

  logger.info(`Done — ${touched} products, ${totalSpecs} specs created.`)
}
