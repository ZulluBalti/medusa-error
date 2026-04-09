import { Module } from "@medusajs/framework/utils"
import OrderTagModuleService from "./service"

export const ORDER_TAG_MODULE = "orderTag"

export default Module(ORDER_TAG_MODULE, {
  service: OrderTagModuleService,
})
