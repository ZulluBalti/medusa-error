import { model } from "@medusajs/framework/utils"

const OrderTag = model.define("order_tag", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  value: model.text(),
})

export default OrderTag
