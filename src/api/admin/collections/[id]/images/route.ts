import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { COLLECTION_MEDIA_MODULE } from "../../../../../modules/collectionMedia"
import createCollectionImageWorkflow from "../../../../../workflows/create-collection-image"
import { PostAdminCreateCollectionImageType } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const collectionMediaService = req.scope.resolve(COLLECTION_MEDIA_MODULE) as any

  const images = await collectionMediaService.listCollectionImages({
    collection_id: id,
  })

  res.json({ images })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminCreateCollectionImageType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { url, file_id } = req.validatedBody

  const { result } = await createCollectionImageWorkflow(req.scope).run({
    input: { collection_id: id, url, file_id },
  })

  res.status(201).json({ image: result })
}
