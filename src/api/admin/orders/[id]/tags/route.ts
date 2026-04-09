import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ORDER_TAG_MODULE } from "../../../../../modules/orderTag"
import OrderTagModuleService from "../../../../../modules/orderTag/service"
import addOrderTagWorkflow from "../../../../../workflows/add-order-tag"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderTagModule = req.scope.resolve<OrderTagModuleService>(ORDER_TAG_MODULE)
  const tags = await orderTagModule.listOrderTags({ order_id: req.params.id })
  res.json({ tags })
}

export async function POST(req: MedusaRequest<{ value: string }>, res: MedusaResponse) {
  const { value } = req.validatedBody
  const { result } = await addOrderTagWorkflow(req.scope).run({
    input: { order_id: req.params.id, value },
  })
  res.status(201).json({ tag: result })
}
