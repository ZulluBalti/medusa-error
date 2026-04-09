import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { resolveEmailTemplate } from "./utils/resolve-email-template"

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Sending password reset email for: ${data.entity_id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)

    const storeFrontUrl = process.env.STORE_URL ?? "http://localhost:8000"
    const resetUrl = `${storeFrontUrl}/reset-password/confirm?token=${data.token}`

    const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(container, "password-reset", { url: resetUrl })

    await notificationService.createNotifications({
      to: data.entity_id,
      channel: "email",
      template: emailTemplate,
      data: emailData,
    })

    logger.info(`Password reset email sent to ${data.entity_id}`)
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
