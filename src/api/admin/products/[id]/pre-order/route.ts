import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRE_ORDER_MODULE } from "../../../../../modules/preOrder"
import PreOrderModuleService from "../../../../../modules/preOrder/service"
import togglePreOrderWorkflow from "../../../../../workflows/toggle-pre-order"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const preOrderModule = req.scope.resolve<PreOrderModuleService>(PRE_ORDER_MODULE)
  const [setting] = await preOrderModule.listPreOrderSettings({ product_id: req.params.id })
  res.json({ enabled: setting?.enabled ?? false })
}

export async function POST(req: MedusaRequest<{ enabled: boolean }>, res: MedusaResponse) {
  const { enabled } = req.validatedBody
  await togglePreOrderWorkflow(req.scope).run({
    input: { product_id: req.params.id, enabled },
  })
  res.json({ enabled })
}
