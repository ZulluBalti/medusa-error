import { MedusaService } from "@medusajs/framework/utils"
import OrderTag from "./models/order-tag"

class OrderTagModuleService extends MedusaService({ OrderTag }) {}

export default OrderTagModuleService
