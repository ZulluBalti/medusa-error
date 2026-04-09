import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate, formatAmount } from "./utils/resolve-email-template"

export default async function orderDeliveredHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const fulfillmentId = data.id

  logger.info(`Sending delivery email for fulfillment: ${fulfillmentId}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    const query = container.resolve("query")

    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "order.id",
        "order.display_id",
        "order.email",
        "order.total",
        "order.currency_code",
        "order.summary.*",
        "order.customer.first_name",
        "order.customer.last_name",
      ],
      filters: { id: fulfillmentId },
    })

    const order = fulfillments[0]?.order
    if (!order || !order.email) return

    const templateData = {
      display_id: order.display_id,
      customer_name:
        `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim() ||
        "Customer",
      total: formatAmount(order.summary?.current_order_total ?? order.total),
      currency: order.currency_code?.toUpperCase(),
    }

    const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(
      container,
      "order-delivered",
      templateData
    )

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: emailTemplate,
      data: emailData,
    })

    logger.info(`Delivery email sent to ${order.email}`)
  } catch (error) {
    logger.error(
      `Failed to send delivery email for fulfillment ${fulfillmentId}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "delivery.created",
}
