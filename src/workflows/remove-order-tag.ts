import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ORDER_TAG_MODULE } from "../modules/orderTag"
import OrderTagModuleService from "../modules/orderTag/service"

const removeOrderTagStep = createStep(
  "remove-order-tag",
  async ({ tag_id }: { tag_id: string }, { container }) => {
    const orderTagModule = container.resolve<OrderTagModuleService>(ORDER_TAG_MODULE)
    const [existing] = await orderTagModule.listOrderTags({ id: tag_id })
    await orderTagModule.deleteOrderTags(tag_id)
    return new StepResponse({ success: true }, existing)
  },
  async (tag, { container }) => {
    if (!tag) return
    const orderTagModule = container.resolve<OrderTagModuleService>(ORDER_TAG_MODULE)
    await orderTagModule.createOrderTags({ id: tag.id, order_id: tag.order_id, value: tag.value })
  }
)

const removeOrderTagWorkflow = createWorkflow(
  "remove-order-tag",
  function (input: { tag_id: string }) {
    const result = removeOrderTagStep(input)
    return new WorkflowResponse(result)
  }
)

export default removeOrderTagWorkflow
