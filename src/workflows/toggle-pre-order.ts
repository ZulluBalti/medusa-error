import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateProductVariantsStep } from "@medusajs/medusa/core-flows"
import { PRE_ORDER_MODULE } from "../modules/preOrder"
import PreOrderModuleService from "../modules/preOrder/service"

const upsertPreOrderSettingStep = createStep(
  "upsert-pre-order-setting",
  async ({ product_id, enabled }: { product_id: string; enabled: boolean }, { container }) => {
    const preOrderModule = container.resolve<PreOrderModuleService>(PRE_ORDER_MODULE)

    const [existing] = await preOrderModule.listPreOrderSettings({ product_id })

    if (existing) {
      const previous = existing.enabled
      await preOrderModule.updatePreOrderSettings({ id: existing.id, enabled })
      return new StepResponse({ product_id, enabled }, { id: existing.id, enabled: previous })
    }

    const setting = await preOrderModule.createPreOrderSettings({ product_id, enabled })
    return new StepResponse({ product_id, enabled }, { id: setting.id as string, enabled: false, created: true })
  },
  async (prev, { container }) => {
    if (!prev) return
    const preOrderModule = container.resolve<PreOrderModuleService>(PRE_ORDER_MODULE)
    if ((prev as any).created) {
      await preOrderModule.deletePreOrderSettings(prev.id)
    } else {
      await preOrderModule.updatePreOrderSettings({ id: prev.id, enabled: prev.enabled })
    }
  }
)

const togglePreOrderWorkflow = createWorkflow(
  "toggle-pre-order",
  function (input: { product_id: string; enabled: boolean }) {
    const setting = upsertPreOrderSettingStep(input)

    updateProductVariantsStep({
      selector: { product_id: input.product_id },
      update: { allow_backorder: input.enabled },
    })

    return new WorkflowResponse(setting)
  }
)

export default togglePreOrderWorkflow
