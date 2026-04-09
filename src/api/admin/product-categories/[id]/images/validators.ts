import { z } from "zod"

export const PostAdminCreateCategoryImage = z.object({
  url: z.string().min(1),
  file_id: z.string().min(1),
})

export type PostAdminCreateCategoryImageType = z.infer<
  typeof PostAdminCreateCategoryImage
>
