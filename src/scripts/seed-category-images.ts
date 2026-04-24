import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const CATEGORY_IMAGES: Record<string, string[]> = {
  "refurbished": [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
  ],
  "demonstration": [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
  ],
  "office": [
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80",
  ],
  "gaming": [
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=80",
  ],
  "student": [
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80",
  ],
  "travel": [
    "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?auto=format&fit=crop&w=1200&q=80",
  ],
  "mini-laptops": [
    "https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=1200&q=80",
  ],
  "2in1": [
    "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=1200&q=80",
  ],
}

export default async function seedCategoryImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const mediaService = container.resolve("collectionMedia") as any

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name"],
  })

  let added = 0
  let skipped = 0

  for (const [handle, urls] of Object.entries(CATEGORY_IMAGES)) {
    const cat = categories.find((c: any) => c.handle === handle)
    if (!cat) {
      logger.warn(`Category with handle "${handle}" not found, skipping.`)
      continue
    }

    const existing = await mediaService.listCategoryImages({
      category_id: cat.id,
    })
    if (existing.length > 0) {
      logger.info(
        `"${cat.name}" already has ${existing.length} image(s), skipping.`
      )
      skipped += 1
      continue
    }

    for (const url of urls) {
      await mediaService.createCategoryImages({
        category_id: cat.id,
        url,
        file_id: `seed-${handle}-${Date.now()}`,
      })
    }
    logger.info(`Added ${urls.length} image(s) to "${cat.name}".`)
    added += urls.length
  }

  logger.info(`Done. Added ${added} image(s), skipped ${skipped} categories.`)
}
