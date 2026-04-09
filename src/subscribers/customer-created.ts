import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Sending welcome email for customer: ${data.id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    const query = container.resolve("query")

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: data.id },
    })

    const customer = customers[0]
    if (!customer) {
      logger.error(`Customer ${data.id} not found`)
      return
    }

    if (!customer.email) {
      logger.warn(`Customer ${data.id} has no email, skipping welcome email`)
      return
    }

    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: "customer-welcome",
      data: {
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
    })

    logger.info(`Welcome email sent to ${customer.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email for customer ${data.id}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
