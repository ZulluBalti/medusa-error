import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { COLLECTION_MEDIA_MODULE } from "../modules/collectionMedia"

type DeleteCategoryImageInput = {
  image_id: string
}

type SavedImage = {
  id: string
  url: string
  file_id: string
  category_id: string
}

const deleteCategoryImageStep = createStep(
  "delete-category-image-step",
  async (input: DeleteCategoryImageInput, { container }) => {
    const service = container.resolve(COLLECTION_MEDIA_MODULE) as any

    const [image] = await service.listCategoryImages({ id: input.image_id })

    if (!image) {
      return new StepResponse(null, null)
    }

    const fileService = container.resolve(Modules.FILE) as any
    await fileService.deleteFiles([image.file_id])

    await service.deleteCategoryImages(image.id)

    return new StepResponse({ id: image.id }, image as SavedImage)
  },
  async (image: SavedImage | null, { container }) => {
    if (!image) return
    const service = container.resolve(COLLECTION_MEDIA_MODULE) as any
    await service.createCategoryImages(image)
  }
)

const deleteCategoryImageWorkflow = createWorkflow(
  "delete-category-image",
  function (input: DeleteCategoryImageInput) {
    const result = deleteCategoryImageStep(input)
    return new WorkflowResponse(result)
  }
)

export default deleteCategoryImageWorkflow
