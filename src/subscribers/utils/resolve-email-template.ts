import { EMAIL_TEMPLATE_MODULE } from "../../modules/emailTemplate"

type ResolvedTemplate = {
  template: string
  data: Record<string, unknown>
}

/**
 * Formats a Medusa order total (high-precision decimal) as a readable amount.
 */
export function formatAmount(amount: unknown): string {
  return Number(amount).toFixed(2)
}

/**
 * Looks up a custom email template from the DB. If found, interpolates
 * variables and returns template="custom" with pre-rendered content.
 * Falls back to the hardcoded template key if no DB record exists.
 */
export async function resolveEmailTemplate(
  container: any,
  templateKey: string,
  data: Record<string, unknown>
): Promise<ResolvedTemplate> {
  try {
    const emailTemplateService = container.resolve(EMAIL_TEMPLATE_MODULE)
    const templates = await emailTemplateService.listEmailTemplates({
      template_key: templateKey,
    })

    if (templates.length > 0) {
      const t = templates[0]
      return {
        template: "custom",
        data: {
          ...data,
          subject: interpolate(t.subject, data),
          html_body: interpolate(t.html_body, data),
          text_body: t.text_body ? interpolate(t.text_body, data) : undefined,
        },
      }
    }
  } catch {
    // module not available or query failed — fall through to default
  }

  return { template: templateKey, data }
}

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key]
    return value !== undefined ? String(value) : `{{${key}}}`
  })
}
