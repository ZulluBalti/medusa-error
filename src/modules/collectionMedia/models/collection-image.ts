import { model } from "@medusajs/framework/utils"

const CollectionImage = model.define("collection_image", {
  id: model.id().primaryKey(),
  url: model.text(),
  file_id: model.text(),
  collection_id: model.text(),
})

export default CollectionImage
