import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { COLLECTION_MEDIA_MODULE } from "../../../../../modules/collectionMedia"
import createCategoryImageWorkflow from "../../../../../workflows/create-category-image"
import { PostAdminCreateCategoryImageType } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const service = req.scope.resolve(COLLECTION_MEDIA_MODULE) as any

  const images = await service.listCategoryImages({ category_id: id })

  res.json({ images })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminCreateCategoryImageType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { url, file_id } = req.validatedBody

  const { result } = await createCategoryImageWorkflow(req.scope).run({
    input: { category_id: id, url, file_id },
  })

  res.status(201).json({ image: result })
}
