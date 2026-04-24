import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { COLLECTION_MEDIA_MODULE } from "../../../modules/collectionMedia"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const categoryService = req.scope.resolve(Modules.PRODUCT) as any
  const mediaService = req.scope.resolve(COLLECTION_MEDIA_MODULE) as any

  const [categories] = await categoryService.listAndCountProductCategories(
    { parent_category_id: null, is_active: true },
    {
      select: ["id", "name", "handle", "description", "rank"],
      order: { rank: "ASC" },
    }
  )

  const categoryIds = categories.map((c) => c.id)

  const images = categoryIds.length
    ? await mediaService.listCategoryImages(
        { category_id: categoryIds },
        { select: ["id", "url", "category_id"] }
      )
    : []

  const imagesByCategoryId = images.reduce(
    (acc: Record<string, { id: string; url: string }[]>, img) => {
      if (!acc[img.category_id]) acc[img.category_id] = []
      acc[img.category_id].push({ id: img.id, url: img.url })
      return acc
    },
    {}
  )

  const result = categories.map((category) => ({
    ...category,
    images: imagesByCategoryId[category.id] ?? [],
  }))

  res.json({ product_categories: result })
}
