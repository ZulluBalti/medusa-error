import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { COLLECTION_MEDIA_MODULE } from "../modules/collectionMedia"

type CreateCategoryImageInput = {
  category_id: string
  url: string
  file_id: string
}

const createCategoryImageStep = createStep(
  "create-category-image-step",
  async (input: CreateCategoryImageInput, { container }) => {
    const service = container.resolve(COLLECTION_MEDIA_MODULE) as any

    const image = await service.createCategoryImages({
      category_id: input.category_id,
      url: input.url,
      file_id: input.file_id,
    })

    return new StepResponse(image, image.id)
  },
  async (imageId: string, { container }) => {
    const service = container.resolve(COLLECTION_MEDIA_MODULE) as any
    await service.deleteCategoryImages(imageId)
  }
)

const createCategoryImageWorkflow = createWorkflow(
  "create-category-image",
  function (input: CreateCategoryImageInput) {
    const image = createCategoryImageStep(input)
    return new WorkflowResponse(image)
  }
)

export default createCategoryImageWorkflow
