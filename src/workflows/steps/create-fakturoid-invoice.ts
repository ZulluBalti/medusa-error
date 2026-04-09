import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type OrderItem = {
  title: string
  quantity: number
  unit_price: number
}

export type CreateFakturoidInvoiceInput = {
  order_id: string
  display_id: string | number
  customer_name: string
  customer_email: string
  items: OrderItem[]
  currency: string
}

async function getFakturoidAccessToken(clientId: string, clientSecret: string, userAgent: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch("https://app.fakturoid.cz/api/v3/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "User-Agent": userAgent,
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Fakturoid OAuth error ${response.status}: ${error}`)
  }

  const data = await response.json() as { access_token: string }
  return data.access_token
}

async function findOrCreateSubject(
  slug: string,
  accessToken: string,
  userAgent: string,
  customerName: string,
  customerEmail: string
): Promise<number> {
  // Search for existing subject by email
  const searchRes = await fetch(
    `https://app.fakturoid.cz/api/v3/accounts/${slug}/subjects/search.json?query=${encodeURIComponent(customerEmail)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
    }
  )

  if (searchRes.ok) {
    const results = await searchRes.json() as Array<{ id: number; email?: string }>
    const match = results.find((s) => s.email === customerEmail)
    if (match) return match.id
  }

  // Subject not found — create it
  const createRes = await fetch(
    `https://app.fakturoid.cz/api/v3/accounts/${slug}/subjects.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        name: customerName,
        email: customerEmail,
        type: "customer",
      }),
    }
  )

  if (!createRes.ok) {
    const error = await createRes.text()
    throw new Error(`Fakturoid subject creation error ${createRes.status}: ${error}`)
  }

  const subject = await createRes.json() as { id: number }
  return subject.id
}

export const createFakturoidInvoiceStep = createStep(
  "create-fakturoid-invoice",
  async (input: CreateFakturoidInvoiceInput, { container }) => {
    const logger = container.resolve("logger")

    const slug = process.env.FAKTUROID_SLUG
    const clientId = process.env.FAKTUROID_CLIENT_ID
    const clientSecret = process.env.FAKTUROID_CLIENT_SECRET
    const userAgent = process.env.FAKTUROID_USER_AGENT ?? "MedusaStore"

    if (!slug || !clientId || !clientSecret) {
      throw new Error(
        "Fakturoid integration is not configured. Set FAKTUROID_SLUG, FAKTUROID_CLIENT_ID and FAKTUROID_CLIENT_SECRET."
      )
    }

    const accessToken = await getFakturoidAccessToken(clientId, clientSecret, userAgent)

    const subjectId = await findOrCreateSubject(
      slug,
      accessToken,
      userAgent,
      input.customer_name,
      input.customer_email
    )

    const payload = {
      subject_id: subjectId,
      payment_method: "cod",
      currency: input.currency,
      note: `Order #${input.display_id}`,
      lines: input.items.map((item) => ({
        name: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: 0,
      })),
    }

    logger.info(`Creating Fakturoid invoice for order #${input.display_id}`)

    const response = await fetch(
      `https://app.fakturoid.cz/api/v3/accounts/${slug}/invoices.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": userAgent,
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Fakturoid invoice error ${response.status}: ${errorBody}`)
    }

    const invoice = await response.json() as {
      id: number
      html_url: string
      public_html_url?: string
    }

    logger.info(`Fakturoid invoice ${invoice.id} created for order #${input.display_id}`)

    return new StepResponse(
      {
        invoice_id: invoice.id,
        invoice_url: invoice.html_url,
        public_invoice_url: invoice.public_html_url ?? invoice.html_url,
      },
      { slug, invoice_id: invoice.id, access_token: accessToken, user_agent: userAgent }
    )
  },
  // Compensation: cancel the invoice if a later step fails
  async (compensationInput, { container }) => {
    if (!compensationInput) return
    const { slug, invoice_id, access_token, user_agent } = compensationInput
    const logger = container.resolve("logger")

    try {
      await fetch(
        `https://app.fakturoid.cz/api/v3/accounts/${slug}/invoices/${invoice_id}/fire.json?event=cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "User-Agent": user_agent,
          },
        }
      )
      logger.info(`Fakturoid invoice ${invoice_id} cancelled (rollback)`)
    } catch (e) {
      logger.warn(`Failed to cancel Fakturoid invoice ${invoice_id} during rollback: ${e.message}`)
    }
  }
)
