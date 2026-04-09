import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { EMAIL_TEMPLATE_MODULE } from "../../../../modules/emailTemplate"
import { deleteEmailTemplateWorkflow } from "../../../../workflows/delete-email-template"
import { PostAdminUpdateEmailTemplate } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const emailTemplateService = req.scope.resolve(EMAIL_TEMPLATE_MODULE) as any
  const [template] = await emailTemplateService.listEmailTemplates({ id: req.params.id })
  if (!template) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Email template not found")
  }
  res.json({ email_template: template })
}

export async function POST(
  req: MedusaRequest<PostAdminUpdateEmailTemplate>,
  res: MedusaResponse
) {
  const emailTemplateService = req.scope.resolve(EMAIL_TEMPLATE_MODULE) as any
  const [existing] = await emailTemplateService.listEmailTemplates({ id: req.params.id })
  if (!existing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Email template not found")
  }
  const updated = await emailTemplateService.updateEmailTemplates({
    selector: { id: req.params.id },
    data: req.validatedBody,
  })
  const result = Array.isArray(updated) ? updated[0] : updated
  res.json({ email_template: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteEmailTemplateWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  res.json({ id: req.params.id, deleted: true })
}
