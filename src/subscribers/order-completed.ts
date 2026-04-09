import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate, formatAmount } from "./utils/resolve-email-template"

export default async function orderCompletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  logger.info(`Sending order completed email for order: ${data.id}`)

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
      ],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order || !order.email) return

    const templateData = {
      display_id: order.display_id,
      customer_name:
        `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim() ||
        "Customer",
      total: formatAmount(order.total),
      currency: order.currency_code?.toUpperCase(),
    }
    const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(container, "order-completed", templateData)

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: emailTemplate,
      data: emailData,
    })

    logger.info(`Order completed email sent to ${order.email}`)
  } catch (error) {
    logger.error(
      `Failed to send order completed email for order ${data.id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.completed",
}
