import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import addOrderTagWorkflow from "../workflows/add-order-tag"

export default async function codTagHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "payment_collections.payment_sessions.provider_id"],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order) return

    const codProviderId = process.env.COD_PROVIDER_ID ?? "pp_system_default"
    const paymentSessions = (order.payment_collections ?? []).flatMap(
      (pc: any) => pc.payment_sessions ?? []
    )

    const isCod = paymentSessions.some(
      (session: any) => session.provider_id === codProviderId
    )

    if (!isCod) return

    await addOrderTagWorkflow(container).run({
      input: { order_id: order.id as string, value: "cod" },
    })

    logger.info(`Tagged order ${data.id} as cod`)
  } catch (error) {
    logger.error(`Failed to tag order ${data.id} as cod: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
