import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BLOG_MODULE } from "../modules/blog"
import BlogModuleService from "../modules/blog/service"

export type CreateBlogPostInput = {
  title: string
  slug?: string
  excerpt?: string | null
  content?: string | null
  cover_image?: string | null
  status: "draft" | "published"
  author?: string | null
}

const createBlogPostStep = createStep(
  "create-blog-post-step",
  async (input: CreateBlogPostInput, { container }) => {
    const blogService: BlogModuleService = container.resolve(BLOG_MODULE)

    const slug =
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

    const published_at =
      input.status === "published" ? new Date() : null

    const post = await blogService.createBlogPosts({
      ...input,
      slug,
      published_at,
    })

    return new StepResponse(post, post.id)
  },
  async (id: string, { container }) => {
    const blogService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogService.deleteBlogPosts(id)
  }
)

export const createBlogPostWorkflow = createWorkflow(
  "create-blog-post",
  function (input: CreateBlogPostInput) {
    const post = createBlogPostStep(input)
    return new WorkflowResponse(post)
  }
)
