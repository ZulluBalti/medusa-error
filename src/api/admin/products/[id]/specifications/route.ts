import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_SPEC_MODULE } from "../../../../../modules/productSpec"
import ProductSpecModuleService from "../../../../../modules/productSpec/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)
  const specs = await service.listProductSpecifications(
    { product_id: req.params.id },
    { order: { sort_order: "ASC" } }
  )
  res.json({ specifications: specs })
}

export async function POST(
  req: MedusaRequest<{ key: string; value: string; sort_order?: number }>,
  res: MedusaResponse
) {
  const service = req.scope.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)
  const { key, value, sort_order = 0, variant_id } = req.body as {
    key: string
    value: string
    sort_order?: number
    variant_id?: string | null
  }
  const spec = await service.createProductSpecifications({
    product_id: req.params.id,
    variant_id: variant_id ?? null,
    key,
    value,
    sort_order,
  })
  res.status(201).json({ specification: spec })
}
