import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate } from "./utils/resolve-email-template"

export default async function orderShipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }

  const logger = container.resolve("logger")
  logger.info(`Sending shipment notification for fulfillment: ${data.id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    const query = container.resolve("query")

    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "labels.tracking_number",
        "labels.tracking_url",
        "order.id",
        "order.display_id",
        "order.email",
        "order.currency_code",
        "order.customer.first_name",
        "order.customer.last_name",
      ],
      filters: { id: data.id },
    })

    const fulfillment = fulfillments[0]
    if (!fulfillment) return

    const order = fulfillment.order
    if (!order || !order.email) return

    const trackingLinks = fulfillment.labels ?? []

    const templateData = {
      display_id: order.display_id,
      customer_name:
        `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim() || "Customer",
      tracking_links: trackingLinks,
      tracking_number: trackingLinks[0]?.tracking_number ?? "",
      tracking_url: trackingLinks[0]?.tracking_url ?? "",
    }
    const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(container, "order-shipment", templateData)

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: emailTemplate,
      data: emailData,
    })

    logger.info(`Shipment email sent to ${order.email}`)
  } catch (error) {
    logger.error(
      `Failed to send shipment email for fulfillment ${data.id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
