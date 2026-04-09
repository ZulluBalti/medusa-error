import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { COLLECTION_MEDIA_MODULE } from "../modules/collectionMedia"

type DeleteCollectionImageInput = {
  image_id: string
}

type SavedImage = {
  id: string
  url: string
  file_id: string
  collection_id: string
}

const deleteCollectionImageStep = createStep(
  "delete-collection-image-step",
  async (input: DeleteCollectionImageInput, { container }) => {
    const collectionMediaService = container.resolve(
      COLLECTION_MEDIA_MODULE
    ) as any

    const [image] = await collectionMediaService.listCollectionImages({
      id: input.image_id,
    })

    if (!image) {
      return new StepResponse(null, null)
    }

    const fileService = container.resolve(Modules.FILE) as any
    await fileService.deleteFiles([image.file_id])

    await collectionMediaService.deleteCollectionImages(image.id)

    return new StepResponse({ id: image.id }, image as SavedImage)
  },
  async (image: SavedImage | null, { container }) => {
    if (!image) return

    const collectionMediaService = container.resolve(
      COLLECTION_MEDIA_MODULE
    ) as any
    await collectionMediaService.createCollectionImages(image)
  }
)

const deleteCollectionImageWorkflow = createWorkflow(
  "delete-collection-image",
  function (input: DeleteCollectionImageInput) {
    const result = deleteCollectionImageStep(input)
    return new WorkflowResponse(result)
  }
)

export default deleteCollectionImageWorkflow
