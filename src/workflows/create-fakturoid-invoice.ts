import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createFakturoidInvoiceStep, CreateFakturoidInvoiceInput } from "./steps/create-fakturoid-invoice"
import { updateOrderFakturoidMetadataStep } from "./steps/update-order-fakturoid-metadata"

const createFakturoidInvoiceWorkflow = createWorkflow(
  "create-fakturoid-invoice",
  function (input: CreateFakturoidInvoiceInput) {
    const invoice = createFakturoidInvoiceStep(input)

    updateOrderFakturoidMetadataStep({
      order_id: input.order_id,
      invoice_id: invoice.invoice_id,
      invoice_url: invoice.invoice_url,
    })

    return new WorkflowResponse({ invoice })
  }
)

export default createFakturoidInvoiceWorkflow
