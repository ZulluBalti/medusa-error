import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate } from "./utils/resolve-email-template"

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
      fields: ["id", "email", "first_name", "last_name", "phone"],
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

    const templateData = {
      first_name: customer.first_name,
      last_name: customer.last_name,
      full_name: [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "there",
      email: customer.email,
      phone: customer.phone,
      customer_id: customer.id,
    }
    const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(container, "customer-welcome", templateData)

    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: emailTemplate,
      data: emailData,
    })

    logger.info(`Welcome email sent to ${customer.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email for customer ${data.id}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
