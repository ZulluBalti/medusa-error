import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const BRANDS = ["HP", "Dell", "Lenovo", "Asus", "Acer", "MSI", "Fujitsu"]
const RAMS = ["4 GB", "8 GB", "16 GB", "32 GB"]
const DIAGONALS = ["12 inches", "13 inches", "14 inches", "15 inches", "16 inches"]
const RESOLUTIONS = ["1366 x 768 px", "1920 x 1080 px", "3840 x 2400 px"]
const PROCESSORS = ["Intel Core i3", "Intel Core i5", "Intel Core i7", "AMD A7", "AMD A10"]
const DISKS = ["64 GB", "128 GB", "256 GB", "512 GB", "1000 GB"]
const GRAPHICS = [
  "Intel HD Graphics",
  "Intel UHD Graphics",
  "nVIDIA GeForce RTX",
  "nVIDIA Quadro",
  "AMD Radeon",
]
const YES_NO = ["YES", "NO"]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default async function seedProductMetadata({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT) as any

  logger.info("Fetching existing products...")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
  })

  if (!products.length) {
    logger.warn("No products found. Run the main seed first.")
    return
  }

  logger.info(`Stamping metadata on ${products.length} products...`)

  for (const product of products) {
    const metadata = {
      brand: pick(BRANDS),
      ram: pick(RAMS),
      diagonal: pick(DIAGONALS),
      resolution: pick(RESOLUTIONS),
      processor: pick(PROCESSORS),
      disk: pick(DISKS),
      graphics: pick(GRAPHICS),
      touch: pick(YES_NO),
      numeric_keypad: pick(YES_NO),
      mechanical: pick(YES_NO),
    }

    await productService.updateProducts(product.id, { metadata })
    logger.info(`  ✓ ${product.title} → brand:${metadata.brand} ram:${metadata.ram}`)
  }

  logger.info("Done — all products have metadata.")
}
