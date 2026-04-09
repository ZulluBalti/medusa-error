import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import removeOrderTagWorkflow from "../../../../../../workflows/remove-order-tag"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await removeOrderTagWorkflow(req.scope).run({
    input: { tag_id: req.params.tag_id },
  })
  res.json({ success: true })
}
