import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import createFakturoidInvoiceWorkflow from "../workflows/create-fakturoid-invoice"

export default async function fakturoidInvoiceHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  logger.info(`Checking Fakturoid invoice eligibility for order: ${data.id}`)

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "summary.*",
        "customer.first_name",
        "customer.last_name",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "payment_collections.payment_sessions.provider_id",
        "payment_collections.payment_sessions.status",
      ],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order) {
      logger.warn(`Order ${data.id} not found, skipping Fakturoid invoice`)
      return
    }

    // Detect COD payment — provider ID is configurable via COD_PROVIDER_ID env var
    const codProviderId = process.env.COD_PROVIDER_ID ?? "pp_system_default"
    const paymentSessions = (order.payment_collections ?? []).flatMap(
      (pc: any) => pc.payment_sessions ?? []
    )

    const isCod = paymentSessions.some(
      (session: any) => session.provider_id === codProviderId
    )

    if (!isCod) {
      logger.info(`Order ${data.id} is not COD (provider not matched), skipping Fakturoid invoice`)
      return
    }

    logger.info(`Order ${data.id} is COD — creating Fakturoid invoice`)

    await createFakturoidInvoiceWorkflow(container).run({
      input: {
        order_id: order.id,
        display_id: order.display_id ?? "",
        customer_name:
          `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim() || "Customer",
        customer_email: order.email ?? "",
        items: (order.items ?? []).map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        currency: order.currency_code?.toUpperCase() ?? "CZK",
      },
    })

    logger.info(`Fakturoid invoice successfully created for order ${data.id}`)
  } catch (error) {
    logger.error(
      `Failed to create Fakturoid invoice for order ${data.id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
