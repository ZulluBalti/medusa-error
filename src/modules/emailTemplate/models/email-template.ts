import { model } from "@medusajs/framework/utils"

const EmailTemplate = model.define("email_template", {
  id: model.id().primaryKey(),
  template_key: model.text(),
  name: model.text(),
  subject: model.text(),
  html_body: model.text(),
  text_body: model.text().nullable(),
})

export default EmailTemplate
