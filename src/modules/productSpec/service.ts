import { MedusaService } from "@medusajs/framework/utils"
import ProductSpecification from "./models/product-specification"

class ProductSpecModuleService extends MedusaService({ ProductSpecification }) {}

export default ProductSpecModuleService
