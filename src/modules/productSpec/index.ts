import { Module } from "@medusajs/framework/utils"
import ProductSpecModuleService from "./service"

export const PRODUCT_SPEC_MODULE = "productSpec"

export default Module(PRODUCT_SPEC_MODULE, {
  service: ProductSpecModuleService,
})
