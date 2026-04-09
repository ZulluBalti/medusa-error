import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { EMAIL_TEMPLATE_MODULE } from "../modules/emailTemplate"

type DeleteEmailTemplateInput = { id: string }

const deleteEmailTemplateStep = createStep(
  "delete-email-template-step",
  async ({ id }: DeleteEmailTemplateInput, { container }) => {
    const emailTemplateService = container.resolve(EMAIL_TEMPLATE_MODULE) as any
    const [template] = await emailTemplateService.listEmailTemplates({ id })
    await emailTemplateService.deleteEmailTemplates(id)
    return new StepResponse(void 0, template)
  },
  async (previous: any, { container }) => {
    if (!previous) return
    const emailTemplateService = container.resolve(EMAIL_TEMPLATE_MODULE) as any
    await emailTemplateService.createEmailTemplates(previous)
  }
)

export const deleteEmailTemplateWorkflow = createWorkflow(
  "delete-email-template",
  function (input: DeleteEmailTemplateInput) {
    deleteEmailTemplateStep(input)
    return new WorkflowResponse(void 0)
  }
)
