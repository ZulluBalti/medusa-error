import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import deleteCollectionImageWorkflow from "../../../../../../workflows/delete-collection-image"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { image_id } = req.params

  await deleteCollectionImageWorkflow(req.scope).run({
    input: { image_id },
  })

  res.json({ deleted: true })
}
