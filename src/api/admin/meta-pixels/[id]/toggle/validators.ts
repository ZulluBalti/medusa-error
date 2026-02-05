import { z } from "zod";

export const PostAdminUpdateMetaPixelStatus = z.object({
  is_active: z.boolean(),
});

export type PostAdminUpdateMetaPixelStatusType = z.infer<
  typeof PostAdminUpdateMetaPixelStatus
>;
