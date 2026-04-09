import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import deleteCategoryImageWorkflow from "../../../../../../workflows/delete-category-image"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { image_id } = req.params

  await deleteCategoryImageWorkflow(req.scope).run({
    input: { image_id },
  })

  res.json({ deleted: true })
}
