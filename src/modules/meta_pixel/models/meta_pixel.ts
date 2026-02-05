import { model } from "@medusajs/framework/utils";

export const MetaPixel = model.define("meta_pixel", {
  id: model.id().primaryKey(),

  // name: required (non-nullable by default) and unique
  name: model.text().unique(),

  // pixel_id: required (non-nullable by default)
  pixel_id: model.text(),

  is_active: model.boolean().default(true),

  // tracking: enum("all" | "selected" | "excluded")
  tracking: model.enum(["all", "selected", "excluded"]),

  // pages: array of strings, optional (nullable)
  pages: model.array().nullable(),
});

export default MetaPixel;
