import * as zod from "zod";

export const PostAdminCreateMetaPixel = zod
  .object({
    name: zod
      .string()
      .min(1, "Name is required")
      .max(255, "Max 255 characters"),
    pixel_id: zod
      .string()
      .min(1, "Pixel ID is required")
      .max(17, "Max 17 characters"),
    tracking: zod.enum(["all", "selected", "excluded"]),
    pages: zod
      .preprocess((val) => {
        if (!val) return [];
        if (typeof val === "object") return val;
        if (typeof val === "string")
          return val
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
      }, zod.array(zod.string()))
      .optional(),
    // conversions_api: zod.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (
      (val.tracking === "selected" || val.tracking === "excluded") &&
      (!val.pages || val.pages.length === 0)
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: "Add at least one page path",
        path: ["pages"],
      });
    }
  });

export type CreateMetaPixelStepInput = zod.infer<
  typeof PostAdminCreateMetaPixel
>;

export type EditMetaPixelStepInput = CreateMetaPixelStepInput & {
  id: string;
};
