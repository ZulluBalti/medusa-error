import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { resolveEmailTemplate, formatAmount } from "../subscribers/utils/resolve-email-template"
import { ICartModuleService } from "@medusajs/framework/types"

// Carts idle for more than this many hours are considered abandoned
const ABANDONED_AFTER_HOURS = 1

export default async function abandonedCartJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const cartService = container.resolve<ICartModuleService>(Modules.CART)

  logger.info("Running abandoned cart job...")

  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - ABANDONED_AFTER_HOURS)

  // Fetch carts updated before the cutoff that have an email and at least one item
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "currency_code",
      "total",
      "updated_at",
      "completed_at",
      "metadata",
      "customer.first_name",
      "customer.last_name",
      "items.*",
    ],
    filters: {
      completed_at: null,
    },
  })

  const abandonedCarts = carts.filter((cart: any) => {
    if (!cart.email) return false
    if (!cart.items?.length) return false
    if (cart.metadata?.abandoned_cart_email_sent) return false
    const updatedAt = new Date(cart.updated_at)
    return updatedAt < cutoff
  })

  logger.info(`Found ${abandonedCarts.length} abandoned cart(s)`)

  for (const cart of abandonedCarts) {
    try {
      const customerName =
        `${cart.customer?.first_name ?? ""} ${cart.customer?.last_name ?? ""}`.trim() || "Customer"

      const currency = (cart.currency_code ?? "usd").toUpperCase()
      const items: any[] = cart.items ?? []

      const templateData = {
        cart_id: cart.id,
        customer_name: customerName,
        total: formatAmount((cart as any).total ?? 0),
        currency,
        items_count: String(items.length),
        items,
      }

      const { template: emailTemplate, data: emailData } = await resolveEmailTemplate(
        container,
        "abandoned-cart",
        templateData
      )

      await notificationService.createNotifications({
        to: cart.email as string,
        channel: "email",
        template: emailTemplate,
        data: emailData,
      })

      await cartService.updateCarts(cart.id, {
        metadata: { ...((cart.metadata as object) ?? {}), abandoned_cart_email_sent: true },
      })

      logger.info(`Abandoned cart email sent to ${cart.email} for cart ${cart.id}`)
    } catch (error) {
      logger.error(`Failed to send abandoned cart email for cart ${cart.id}: ${error.message}`)
    }
  }
}

export const config = {
  name: "abandoned-cart-reminder",
  schedule: "0 * * * *", // Every hour
}
