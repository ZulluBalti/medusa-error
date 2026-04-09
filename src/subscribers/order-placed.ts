import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate, formatAmount } from "./utils/resolve-email-template"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Sending order confirmation for order: ${data.id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    const query = container.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "currency_code",
        "customer.first_name",
        "customer.last_name",
        "items.title",
        "items.quantity",
        "items.unit_price",
      ],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order) {
      logger.error(`Order ${data.id} not found`)
      return
    }

    if (!order.email) {
      logger.warn(`Order ${data.id} has no email, skipping confirmation`)
      return
    }

    const templateData = {
      order_id: order.id,
      display_id: order.display_id,
      customer_name: `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim() || "Customer",
      items: order.items,
      total: formatAmount(order.total),
      currency: order.currency_code?.toUpperCase(),
    }
    const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(container, "order-confirmation", templateData)

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: emailTemplate,
      data: emailData,
    })

    logger.info(`Order confirmation email sent to ${order.email}`)
  } catch (error) {
    logger.error(`Failed to send order confirmation for order ${data.id}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
