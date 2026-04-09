import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export type UpdateOrderFakturoidMetadataInput = {
  order_id: string
  invoice_id: number
  invoice_url: string
}

export const updateOrderFakturoidMetadataStep = createStep(
  "update-order-fakturoid-metadata",
  async (input: UpdateOrderFakturoidMetadataInput, { container }) => {
    const orderModule = container.resolve(Modules.ORDER)

    const order = await orderModule.retrieveOrder(input.order_id)
    const existingMetadata = (order.metadata ?? {}) as Record<string, unknown>

    await orderModule.updateOrders(input.order_id, {
      metadata: {
        ...existingMetadata,
        fakturiod_invoice_created: true,
        fakturoid_invoice_id: input.invoice_id,
        fakturoid_invoice_url: input.invoice_url,
      },
    })

    return new StepResponse({ success: true }, { order_id: input.order_id, previous_metadata: existingMetadata })
  },
  // Compensation: restore previous metadata
  async (compensationInput, { container }) => {
    if (!compensationInput) return
    const { order_id, previous_metadata } = compensationInput
    const orderModule = container.resolve(Modules.ORDER)
    await orderModule.updateOrders(order_id, { metadata: previous_metadata })
  }
)
