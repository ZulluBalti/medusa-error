import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BLOG_MODULE } from "../modules/blog"
import BlogModuleService from "../modules/blog/service"

export type UpdateBlogPostInput = {
  id: string
  title?: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  cover_image?: string | null
  status?: "draft" | "published"
  author?: string | null
}

const updateBlogPostStep = createStep(
  "update-blog-post-step",
  async (input: UpdateBlogPostInput, { container }) => {
    const blogService: BlogModuleService = container.resolve(BLOG_MODULE)

    const existing = await blogService.retrieveBlogPost(input.id)

    const updates: Record<string, unknown> = { ...input }

    if (input.status === "published" && existing.status !== "published") {
      updates.published_at = new Date()
    }

    const post = await blogService.updateBlogPosts({ id: input.id, ...updates })

    return new StepResponse(post, { id: input.id, previous: existing })
  },
  async (rollback: { id: string; previous: Record<string, unknown> }, { container }) => {
    const blogService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogService.updateBlogPosts({ id: rollback.id, ...rollback.previous })
  }
)

export const updateBlogPostWorkflow = createWorkflow(
  "update-blog-post",
  function (input: UpdateBlogPostInput) {
    const post = updateBlogPostStep(input)
    return new WorkflowResponse(post)
  }
)
