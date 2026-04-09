import { z } from "zod"

export const PostAdminCreateCollectionImage = z.object({
  url: z.string().min(1),
  file_id: z.string().min(1),
})

export type PostAdminCreateCollectionImageType = z.infer<
  typeof PostAdminCreateCollectionImage
>
