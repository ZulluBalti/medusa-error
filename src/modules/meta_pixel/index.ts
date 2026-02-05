import { Module } from "@medusajs/framework/utils"
import MetaPixelModuleService from "./service"

export const META_PIXEL_MODULE = "meta_pixel"

export default Module(META_PIXEL_MODULE, {
  service: MetaPixelModuleService,
})
