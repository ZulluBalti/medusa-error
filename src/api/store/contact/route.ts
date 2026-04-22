import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

const ADMIN_EMAIL = process.env.CONTACT_ADMIN_EMAIL ?? "info@kupkompa.cz"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { name, email, phone, subject, message } = req.body as Record<string, string>

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." })
  }

  const notificationModule = req.scope.resolve(Modules.NOTIFICATION)

  const subjectLine = subject
    ? `Nový kontaktní formulář: ${subject}`
    : `Nový kontaktní formulář od ${name}`

  const html_body = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d2b35;">Nová zpráva z kontaktního formuláře</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Jméno:</td><td style="padding: 8px;">${name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 8px; font-weight: bold;">E-mail:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding: 8px; font-weight: bold;">Telefon:</td><td style="padding: 8px;">${phone}</td></tr>` : ""}
        ${subject ? `<tr style="background:#f9f9f9"><td style="padding: 8px; font-weight: bold;">Předmět:</td><td style="padding: 8px;">${subject}</td></tr>` : ""}
      </table>
      <div style="background: #f4f4f4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px;">
        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">Odesláno z kupkompa.cz</p>
    </div>
  `

  const text_body = `Nová zpráva z kontaktního formuláře\n\nJméno: ${name}\nE-mail: ${email}${phone ? `\nTelefon: ${phone}` : ""}${subject ? `\nPředmět: ${subject}` : ""}\n\nZpráva:\n${message}`

  await notificationModule.createNotifications({
    to: ADMIN_EMAIL,
    channel: "email",
    template: "custom",
    data: {
      subject: subjectLine,
      html_body,
      text_body,
    },
  })

  return res.status(200).json({ success: true })
}
