import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { COLLECTION_MEDIA_MODULE } from "../modules/collectionMedia"

type CreateCollectionImageInput = {
  collection_id: string
  url: string
  file_id: string
}

const createCollectionImageStep = createStep(
  "create-collection-image-step",
  async (input: CreateCollectionImageInput, { container }) => {
    const collectionMediaService = container.resolve(
      COLLECTION_MEDIA_MODULE
    ) as any

    const image = await collectionMediaService.createCollectionImages({
      collection_id: input.collection_id,
      url: input.url,
      file_id: input.file_id,
    })

    return new StepResponse(image, image.id)
  },
  async (imageId: string, { container }) => {
    const collectionMediaService = container.resolve(
      COLLECTION_MEDIA_MODULE
    ) as any
    await collectionMediaService.deleteCollectionImages(imageId)
  }
)

const createCollectionImageWorkflow = createWorkflow(
  "create-collection-image",
  function (input: CreateCollectionImageInput) {
    const image = createCollectionImageStep(input)
    return new WorkflowResponse(image)
  }
)

export default createCollectionImageWorkflow
