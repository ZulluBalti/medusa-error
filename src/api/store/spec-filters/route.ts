import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_SPEC_MODULE } from "../../../modules/productSpec"
import ProductSpecModuleService from "../../../modules/productSpec/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filters = Object.entries(req.query as Record<string, string>).filter(
    ([k, v]) => k && typeof v === "string" && v.trim()
  )

  if (filters.length === 0) {
    return res.json({ product_ids: null })
  }

  const specService = req.scope.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)

  // For each active filter, collect product IDs that have that key=value spec
  const idSets: Set<string>[] = []
  for (const [key, value] of filters) {
    const specs = await specService.listProductSpecifications({ key, value: value.trim() })
    idSets.push(new Set(specs.map((s) => s.product_id)))
  }

  // Intersect all sets (AND logic — product must match every filter)
  const result = idSets.reduce((a, b) => new Set([...a].filter((id) => b.has(id))))

  res.json({ product_ids: [...result] })
}
