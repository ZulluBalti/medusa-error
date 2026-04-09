import { Modules } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function inviteCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Sending admin invite email for invite: ${data.id}`)

  try {
    const notificationService = container.resolve(Modules.NOTIFICATION)
    const query = container.resolve("query")

    const { data: invites } = await query.graph({
      entity: "invite",
      fields: ["id", "email", "token"],
      filters: { id: data.id },
    })

    const invite = invites[0]
    if (!invite) {
      logger.error(`Invite ${data.id} not found`)
      return
    }

    const adminUrl = process.env.ADMIN_URL ?? "http://localhost:9000/app"
    const inviteUrl = `${adminUrl}/invite?token=${invite.token}`

    await notificationService.createNotifications({
      to: invite.email,
      channel: "email",
      template: "admin-invite",
      data: { url: inviteUrl },
    })

    logger.info(`Admin invite email sent to ${invite.email}`)
  } catch (error) {
    logger.error(`Failed to send invite email for invite ${data.id}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "invite.created",
}
