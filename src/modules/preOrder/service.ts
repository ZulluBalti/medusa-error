import { MedusaService } from "@medusajs/framework/utils"
import PreOrderSetting from "./models/pre-order-setting"

class PreOrderModuleService extends MedusaService({ PreOrderSetting }) {}

export default PreOrderModuleService
