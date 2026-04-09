import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_TEMPLATE_MODULE } from "../../../modules/emailTemplate"
import { upsertEmailTemplateWorkflow } from "../../../workflows/upsert-email-template"
import { PostAdminUpsertEmailTemplate } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const emailTemplateService = req.scope.resolve(EMAIL_TEMPLATE_MODULE) as any
  const templates = await emailTemplateService.listEmailTemplates(
    {},
    { order: { template_key: "ASC" } }
  )
  res.json({ email_templates: templates })
}

export async function POST(
  req: MedusaRequest<PostAdminUpsertEmailTemplate>,
  res: MedusaResponse
) {
  const { result } = await upsertEmailTemplateWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ email_template: result })
}
