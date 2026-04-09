import { z } from "zod"

export const PostAdminUpsertEmailTemplate = z.object({
  template_key: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  html_body: z.string().min(1),
  text_body: z.string().optional().nullable(),
})

export type PostAdminUpsertEmailTemplate = z.infer<typeof PostAdminUpsertEmailTemplate>

export const PostAdminUpdateEmailTemplate = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  html_body: z.string().min(1).optional(),
  text_body: z.string().optional().nullable(),
})

export type PostAdminUpdateEmailTemplate = z.infer<typeof PostAdminUpdateEmailTemplate>
