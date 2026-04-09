import { MedusaService } from "@medusajs/framework/utils"
import CollectionImage from "./models/collection-image"
import CategoryImage from "./models/category-image"

class CollectionMediaModuleService extends MedusaService({
  CollectionImage,
  CategoryImage,
}) {}

export default CollectionMediaModuleService
