import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { EMAIL_TEMPLATE_MODULE } from "../modules/emailTemplate"

type UpsertEmailTemplateInput = {
  template_key: string
  name: string
  subject: string
  html_body: string
  text_body?: string | null
}

const upsertEmailTemplateStep = createStep(
  "upsert-email-template-step",
  async (input: UpsertEmailTemplateInput, { container }) => {
    const emailTemplateService = container.resolve(EMAIL_TEMPLATE_MODULE) as any

    const existing = await emailTemplateService.listEmailTemplates({
      template_key: input.template_key,
    })

    if (existing.length > 0) {
      const previous = existing[0]
      const updated = await emailTemplateService.updateEmailTemplates({
        selector: { id: previous.id },
        data: {
          name: input.name,
          subject: input.subject,
          html_body: input.html_body,
          text_body: input.text_body ?? null,
        },
      })
      return new StepResponse(Array.isArray(updated) ? updated[0] : updated, {
        action: "updated",
        previous,
      })
    }

    const created = await emailTemplateService.createEmailTemplates(input)
    return new StepResponse(Array.isArray(created) ? created[0] : created, {
      action: "created",
      id: (Array.isArray(created) ? created[0] : created).id,
    })
  },
  async (compensationData: any, { container }) => {
    if (!compensationData) return
    const emailTemplateService = container.resolve(EMAIL_TEMPLATE_MODULE) as any

    if (compensationData.action === "created") {
      await emailTemplateService.deleteEmailTemplates(compensationData.id)
    } else if (compensationData.action === "updated") {
      await emailTemplateService.updateEmailTemplates({
        selector: { id: compensationData.previous.id },
        data: {
          subject: compensationData.previous.subject,
          html_body: compensationData.previous.html_body,
          text_body: compensationData.previous.text_body,
        },
      })
    }
  }
)

export const upsertEmailTemplateWorkflow = createWorkflow(
  "upsert-email-template",
  function (input: UpsertEmailTemplateInput) {
    const template = upsertEmailTemplateStep(input)
    return new WorkflowResponse(template)
  }
)
