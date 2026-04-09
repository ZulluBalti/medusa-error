import { Module } from "@medusajs/framework/utils"
import PreOrderModuleService from "./service"

export const PRE_ORDER_MODULE = "preOrder"

export default Module(PRE_ORDER_MODULE, {
  service: PreOrderModuleService,
})
