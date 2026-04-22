import { model } from "@medusajs/framework/utils"

const ProductSpecification = model.define("product_specification", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  key: model.text(),
  value: model.text(),
  sort_order: model.number().default(0),
})

export default ProductSpecification
