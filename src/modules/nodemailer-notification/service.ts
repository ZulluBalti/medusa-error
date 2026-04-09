import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import nodemailer from "nodemailer"

type Options = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

type InjectedDependencies = Record<string, unknown>

class NodemailerNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "nodemailer"

  private transporter: nodemailer.Transporter
  private from: string

  static validateOptions(options: Record<string, unknown>) {
    const required = ["host", "port", "user", "pass", "from"]
    for (const key of required) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Nodemailer notification provider requires "${key}" option.`
        )
      }
    }
  }

  constructor(_: InjectedDependencies, options: Options) {
    super()
    this.from = options.from
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure ?? false,
      auth: {
        user: options.user,
        pass: options.pass,
      },
    })
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification
    const templateData = data ?? {}

    let subject: string
    let html: string
    let text: string | undefined

    if (template === "custom") {
      // Pre-rendered content passed in by the subscriber
      subject = templateData.subject as string
      html = templateData.html_body as string
      text = (templateData.text_body as string | undefined) ?? undefined
    } else {
      const rendered = this.renderTemplate(template, templateData)
      subject = rendered.subject
      html = rendered.html
      text = rendered.text
    }

    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text,
    })

    return { id: info.messageId }
  }

  private interpolate(
    template: string,
    data: Record<string, unknown>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = data[key]
      return value !== undefined ? String(value) : `{{${key}}}`
    })
  }

  private renderTemplate(
    template: string,
    data: Record<string, unknown>
  ): { subject: string; html: string; text: string } {
    switch (template) {
      case "customer-welcome":
        return this.customerWelcomeTemplate(data)
      case "order-confirmation":
        return this.orderConfirmationTemplate(data)
      case "order-shipment":
        return this.orderShipmentTemplate(data)
      case "order-canceled":
        return this.orderCanceledTemplate(data)
      case "order-completed":
        return this.orderCompletedTemplate(data)
      case "order-delivered":
        return this.orderDeliveredTemplate(data)
      case "password-reset":
        return this.passwordResetTemplate(data)
      case "admin-invite":
        return this.adminInviteTemplate(data)
      default:
        return {
          subject: `Notification: ${template}`,
          html: `<p>You have a new notification.</p><pre>${JSON.stringify(data, null, 2)}</pre>`,
          text: `You have a new notification.\n\n${JSON.stringify(data, null, 2)}`,
        }
    }
  }

  private customerWelcomeTemplate(data: Record<string, unknown>) {
    const name = data.first_name ? `${data.first_name}` : "there"
    return {
      subject: "Welcome to our store!",
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for creating an account. We're excited to have you.</p>
        <p>Start shopping now and enjoy great products and deals.</p>
      `,
      text: `Welcome, ${name}!\n\nThank you for creating an account. We're excited to have you.`,
    }
  }

  private orderConfirmationTemplate(data: Record<string, unknown>) {
    const orderId = data.display_id ?? data.order_id ?? "N/A"
    const customerName = data.customer_name ?? "Customer"
    const total = Number(data.total ?? 0).toFixed(2)
    const currency = ((data.currency as string) ?? "usd").toUpperCase()

    const itemsHtml =
      Array.isArray(data.items)
        ? data.items
            .map(
              (item: Record<string, unknown>) =>
                `<tr>
                  <td>${item.title ?? item.product_title ?? "Item"}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit_price} ${currency}</td>
                </tr>`
            )
            .join("")
        : ""

    return {
      subject: `Order Confirmation #${orderId}`,
      html: `
        <h1>Order Confirmed!</h1>
        <p>Hi ${customerName}, your order <strong>#${orderId}</strong> has been placed successfully.</p>
        ${
          itemsHtml
            ? `<table border="1" cellpadding="8" cellspacing="0">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
               </table>`
            : ""
        }
        <p><strong>Total: ${total} ${currency}</strong></p>
        <p>We'll notify you when your order ships.</p>
      `,
      text: `Order Confirmed! Hi ${customerName}, your order #${orderId} has been placed. Total: ${total} ${currency}.`,
    }
  }

  private orderShipmentTemplate(data: Record<string, unknown>) {
    const orderId = data.display_id ?? "N/A"
    const customerName = data.customer_name ?? "Customer"
    const trackingLinks = Array.isArray(data.tracking_links) ? data.tracking_links : []

    const trackingHtml = trackingLinks.length
      ? trackingLinks
          .map((t: Record<string, unknown>) =>
            t.tracking_url
              ? `<p>Tracking number: <a href="${t.tracking_url}">${t.tracking_number}</a></p>`
              : `<p>Tracking number: ${t.tracking_number}</p>`
          )
          .join("")
      : "<p>Tracking information will be available soon.</p>"

    return {
      subject: `Your order #${orderId} has been shipped!`,
      html: `
        <h1>Your order is on its way!</h1>
        <p>Hi ${customerName}, your order <strong>#${orderId}</strong> has been shipped.</p>
        ${trackingHtml}
        <p>Thank you for shopping with us!</p>
      `,
      text: `Your order #${orderId} has been shipped! Hi ${customerName}, your order is on the way.`,
    }
  }

  private orderCanceledTemplate(data: Record<string, unknown>) {
    const orderId = data.display_id ?? "N/A"
    const customerName = data.customer_name ?? "Customer"
    const total = Number(data.total ?? 0).toFixed(2)
    const currency = ((data.currency as string) ?? "usd").toUpperCase()

    return {
      subject: `Your order #${orderId} has been canceled`,
      html: `
        <h1>Order Canceled</h1>
        <p>Hi ${customerName}, your order <strong>#${orderId}</strong> has been canceled.</p>
        <p>Total: <strong>${total} ${currency}</strong></p>
        <p>If you have any questions, please contact our support team.</p>
      `,
      text: `Order Canceled. Hi ${customerName}, your order #${orderId} (${total} ${currency}) has been canceled.`,
    }
  }

  private orderCompletedTemplate(data: Record<string, unknown>) {
    const orderId = data.display_id ?? "N/A"
    const customerName = data.customer_name ?? "Customer"
    const total = Number(data.total ?? 0).toFixed(2)
    const currency = ((data.currency as string) ?? "usd").toUpperCase()

    return {
      subject: `Your order #${orderId} is complete!`,
      html: `
        <h1>Order Complete</h1>
        <p>Hi ${customerName}, your order <strong>#${orderId}</strong> has been marked as complete.</p>
        <p>Total: <strong>${total} ${currency}</strong></p>
        <p>We hope you enjoy your purchase. Thank you for shopping with us!</p>
      `,
      text: `Order Complete. Hi ${customerName}, your order #${orderId} (${total} ${currency}) has been completed. Thank you!`,
    }
  }

  private orderDeliveredTemplate(data: Record<string, unknown>) {
    const orderId = data.display_id ?? "N/A"
    const customerName = data.customer_name ?? "Customer"
    const total = Number(data.total ?? 0).toFixed(2)
    const currency = ((data.currency as string) ?? "usd").toUpperCase()

    return {
      subject: `Your order #${orderId} has been delivered!`,
      html: `
        <h1>Order Delivered!</h1>
        <p>Hi ${customerName}, your order <strong>#${orderId}</strong> has been delivered.</p>
        <p>Total: <strong>${total} ${currency}</strong></p>
        <p>We hope you enjoy your purchase. Thank you for shopping with us!</p>
      `,
      text: `Order Delivered! Hi ${customerName}, your order #${orderId} has been delivered. Thank you!`,
    }
  }

  private passwordResetTemplate(data: Record<string, unknown>) {
    const resetUrl = data.url as string
    return {
      subject: "Reset your password",
      html: `
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link expires in 10 minutes.</p>
      `,
      text: `Password Reset Request\n\nReset your password here: ${resetUrl}\n\nIf you didn't request this, ignore this email.`,
    }
  }

  private adminInviteTemplate(data: Record<string, unknown>) {
    const inviteUrl = data.url as string
    return {
      subject: "You've been invited to the admin dashboard",
      html: `
        <h1>Admin Invitation</h1>
        <p>You've been invited to join the admin dashboard.</p>
        <p><a href="${inviteUrl}">Accept Invitation</a></p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Admin Invitation\n\nAccept your invitation here: ${inviteUrl}\n\nThis link expires in 24 hours.`,
    }
  }
}

export default NodemailerNotificationProviderService
