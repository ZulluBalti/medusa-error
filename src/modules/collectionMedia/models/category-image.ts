import { model } from "@medusajs/framework/utils"

const CategoryImage = model.define("category_image", {
  id: model.id().primaryKey(),
  url: model.text(),
  file_id: model.text(),
  category_id: model.text(),
})

export default CategoryImage
