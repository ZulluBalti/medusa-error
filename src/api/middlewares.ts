import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { PostAdminCreateBrand } from "./admin/brands/validators";
import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostAdminCreateMetaPixel } from "./admin/meta-pixels/validators";
import { PostAdminUpdateMetaPixelStatus } from "./admin/meta-pixels/[id]/toggle/validators";
import { META_PIXEL_FIELDS } from "./admin/meta-pixels/fields";

export const GetSchema = createFindParams();

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetSchema, {
          defaults: ["id", "name", "products.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateBrand)],
    },
    {
      matcher: "/admin/meta-pixels",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetSchema, {
          defaults: [...META_PIXEL_FIELDS],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/meta-pixels",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateMetaPixel)],
    },
    {
      matcher: "/admin/meta-pixels/:id/toggle",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateMetaPixelStatus)],
    },
    {
      matcher: "/admin/meta-pixels/:id",
      method: "PUT",
      middlewares: [validateAndTransformBody(PostAdminCreateMetaPixel)],
    },
    {
      matcher: "/admin/meta-pixels/:id",
      method: "DELETE",
      middlewares: [],
    },
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
  ],
});
