import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Sending password reset email for: ${data.entity_id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)

    const storeFrontUrl = process.env.STORE_URL ?? "http://localhost:8000"
    const resetUrl = `${storeFrontUrl}/reset-password?token=${data.token}&email=${encodeURIComponent(data.entity_id)}`

    await notificationService.createNotifications({
      to: data.entity_id,
      channel: "email",
      template: "password-reset",
      data: { url: resetUrl },
    })

    logger.info(`Password reset email sent to ${data.entity_id}`)
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
