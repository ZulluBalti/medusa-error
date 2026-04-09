import { model } from "@medusajs/framework/utils"

const PreOrderSetting = model.define("pre_order_setting", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  enabled: model.boolean().default(false),
})

export default PreOrderSetting
