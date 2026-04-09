import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { getVariantAvailability } from "@medusajs/framework/utils"
import { PRE_ORDER_MODULE } from "../modules/preOrder"
import PreOrderModuleService from "../modules/preOrder/service"
import addOrderTagWorkflow from "../workflows/add-order-tag"

export default async function preOrderTagHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "sales_channel_id",
        "items.variant_id",
        "items.product_id",
      ],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order?.items?.length) return

    const productIds = [...new Set((order.items as any[]).map((i) => i.product_id).filter(Boolean))]
    const variantIds = [...new Set((order.items as any[]).map((i) => i.variant_id).filter(Boolean))]

    // Check which products have pre-order enabled
    const preOrderModule = container.resolve<PreOrderModuleService>(PRE_ORDER_MODULE)
    const preOrderSettings = await preOrderModule.listPreOrderSettings({ product_id: productIds })
    const preOrderProductIds = new Set(
      preOrderSettings.filter((s: any) => s.enabled).map((s: any) => s.product_id)
    )

    if (preOrderProductIds.size === 0) return

    // Check if any pre-order item has 0 availability (was actually ordered with no stock)
    const salesChannelId = (order as any).sales_channel_id
    const availability = salesChannelId
      ? await getVariantAvailability(query, {
          variant_ids: variantIds as string[],
          sales_channel_id: salesChannelId,
        })
      : null

    const isPreOrder = (order.items as any[]).some((item) => {
      if (!preOrderProductIds.has(item.product_id)) return false
      if (!availability) return true // no sales channel info, trust the pre-order setting
      const variantAvailability = availability[item.variant_id]
      // availability ≤ 0 means item was ordered when out of stock (reserved > stocked)
      return !variantAvailability || (variantAvailability.availability ?? 0) <= 0
    })

    if (!isPreOrder) return

    await addOrderTagWorkflow(container).run({
      input: { order_id: order.id as string, value: "pre-order" },
    })

    logger.info(`Tagged order ${data.id} as pre-order`)
  } catch (error) {
    logger.error(`Failed to check pre-order for order ${data.id}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
