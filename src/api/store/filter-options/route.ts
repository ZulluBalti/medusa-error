import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_SPEC_MODULE } from "../../../modules/productSpec"
import ProductSpecModuleService from "../../../modules/productSpec/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const specService = req.scope.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)

  const specs = await specService.listProductSpecifications({})

  // Collect unique values per key
  const optionsMap = new Map<string, Set<string>>()
  for (const spec of specs) {
    if (!spec.key || !spec.value) continue
    if (!optionsMap.has(spec.key)) optionsMap.set(spec.key, new Set())
    optionsMap.get(spec.key)!.add(spec.value)
  }

  const options: Record<string, string[]> = {}
  for (const [key, values] of optionsMap) {
    options[key] = Array.from(values).sort()
  }

  res.json({ options })
}
