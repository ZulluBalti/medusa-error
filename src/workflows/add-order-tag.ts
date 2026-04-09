import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ORDER_TAG_MODULE } from "../modules/orderTag"
import OrderTagModuleService from "../modules/orderTag/service"

const addOrderTagStep = createStep(
  "add-order-tag",
  async ({ order_id, value }: { order_id: string; value: string }, { container }) => {
    const orderTagModule = container.resolve<OrderTagModuleService>(ORDER_TAG_MODULE)
    const tag = await orderTagModule.createOrderTags({ order_id, value })
    return new StepResponse(tag, tag.id as string)
  },
  async (tagId, { container }) => {
    if (!tagId) return
    const orderTagModule = container.resolve<OrderTagModuleService>(ORDER_TAG_MODULE)
    await orderTagModule.deleteOrderTags(tagId)
  }
)

const addOrderTagWorkflow = createWorkflow(
  "add-order-tag",
  function (input: { order_id: string; value: string }) {
    const tag = addOrderTagStep(input)
    return new WorkflowResponse(tag)
  }
)

export default addOrderTagWorkflow
