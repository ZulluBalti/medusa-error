import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ORDER_TAG_MODULE } from "../../../modules/orderTag"
import OrderTagModuleService from "../../../modules/orderTag/service"

// GET /admin/order-tags — returns all unique tag values
// GET /admin/order-tags?value=xxx — returns all order_ids with that tag
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderTagModule = req.scope.resolve<OrderTagModuleService>(ORDER_TAG_MODULE)
  const { value } = req.query as { value?: string }

  if (value) {
    const tags = await orderTagModule.listOrderTags({ value })
    return res.json({ order_ids: tags.map((t: any) => t.order_id) })
  }

  const tags = await orderTagModule.listOrderTags({})
  const uniqueValues = [...new Set(tags.map((t: any) => t.value as string))].sort()
  res.json({ values: uniqueValues })
}
