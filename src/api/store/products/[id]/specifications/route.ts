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
