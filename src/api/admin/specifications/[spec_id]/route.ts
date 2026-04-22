import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_SPEC_MODULE } from "../../../../modules/productSpec"
import ProductSpecModuleService from "../../../../modules/productSpec/service"

export async function PUT(
  req: MedusaRequest<{ key?: string; value?: string; sort_order?: number }>,
  res: MedusaResponse
) {
  const service = req.scope.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)
  const { key, value, sort_order, variant_id } = req.body as {
    key?: string
    value?: string
    sort_order?: number
    variant_id?: string | null
  }
  const spec = await service.updateProductSpecifications({
    id: req.params.spec_id,
    ...(key !== undefined && { key }),
    ...(value !== undefined && { value }),
    ...(sort_order !== undefined && { sort_order }),
    ...(variant_id !== undefined && { variant_id }),
  })
  res.json({ specification: spec })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<ProductSpecModuleService>(PRODUCT_SPEC_MODULE)
  await service.deleteProductSpecifications([req.params.spec_id])
  res.json({ deleted: true, id: req.params.spec_id })
}
