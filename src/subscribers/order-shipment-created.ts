import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate } from "./utils/resolve-email-template"

export default async function orderShipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }

  const logger = container.resolve("logger")
  logger.info(`Sending shipment notification for order: ${data.order_id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    const query = container.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "customer.first_name",
        "customer.last_name",
        "fulfillments.id",
        "fulfillments.labels.tracking_number",
        "fulfillments.labels.tracking_url",
        "shipping_address.address_1",
        "shipping_address.city",
        "shipping_address.country_code",
      ],
      filters: { id: data.order_id },
    })

    const order = orders[0]
    if (!order || !order.email) return

    const fulfillment = (order.fulfillments ?? []).find(
      (f: any) => f?.id === data.fulfillment_id
    )
    const trackingLinks = (fulfillment as any)?.labels ?? []

    const templateData = {
      display_id: order.display_id,
      customer_name:
        `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim() ||
        "Customer",
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
      `Failed to send shipment email for order ${data.order_id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
