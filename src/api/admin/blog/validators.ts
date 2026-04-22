import { z } from "zod"

export const PostAdminCreateBlogPost = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  author: z.string().nullable().optional(),
})

export type PostAdminCreateBlogPost = z.infer<typeof PostAdminCreateBlogPost>

export const PostAdminUpdateBlogPost = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  author: z.string().nullable().optional(),
})

export type PostAdminUpdateBlogPost = z.infer<typeof PostAdminUpdateBlogPost>
