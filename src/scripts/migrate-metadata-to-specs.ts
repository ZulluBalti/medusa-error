import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { PRODUCT_SPEC_MODULE } from "../modules/productSpec"
import ProductSpecModuleService from "../modules/productSpec/service"

const METADATA_KEYS = [
  "brand", "ram", "diagonal", "resolution",
  "processor", "disk", "graphics", "touch",
  "numeric_keypad", "mechanical",
]

export default async function migrateMetadataToSpecs({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const specService = container.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)
  const productModule = container.resolve(Modules.PRODUCT)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
  })

  console.log(`Found ${products.length} products`)

  let migratedProducts = 0
  let totalSpecs = 0

  for (const product of products) {
    const metadata = (product.metadata as Record<string, unknown>) ?? {}

    // Collect keys that have values
    const toMigrate: { key: string; value: string }[] = []
    for (const key of METADATA_KEYS) {
      const val = metadata[key]
      if (typeof val === "string" && val.trim()) {
        toMigrate.push({ key, value: val.trim() })
      }
    }

    if (toMigrate.length === 0) continue

    // Skip if specs already exist for this product
    const existing = await specService.listProductSpecifications({ product_id: product.id })
    if (existing.length > 0) {
      console.log(`  [skip] ${product.id} — already has ${existing.length} specs`)
      continue
    }

    // Create spec records
    for (let i = 0; i < toMigrate.length; i++) {
      await specService.createProductSpecifications({
        product_id: product.id,
        key: toMigrate[i].key,
        value: toMigrate[i].value,
        sort_order: i,
      })
    }

    // Remove migrated keys from metadata
    const newMetadata: Record<string, unknown> = { ...metadata }
    for (const key of METADATA_KEYS) {
      delete newMetadata[key]
    }
    await productModule.updateProducts(product.id, { metadata: newMetadata })

    migratedProducts++
    totalSpecs += toMigrate.length
    console.log(`  [done] ${product.id} — ${toMigrate.length} specs`)
  }

  console.log(`\nMigration complete: ${migratedProducts} products, ${totalSpecs} specs created`)
}
