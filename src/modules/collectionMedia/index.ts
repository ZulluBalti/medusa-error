import { Module } from "@medusajs/framework/utils"
import CollectionMediaModuleService from "./service"

export const COLLECTION_MEDIA_MODULE = "collectionMedia"

export default Module(COLLECTION_MEDIA_MODULE, {
  service: CollectionMediaModuleService,
})
