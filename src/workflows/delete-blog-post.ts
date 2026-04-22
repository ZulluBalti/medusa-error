import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BLOG_MODULE } from "../modules/blog"
import BlogModuleService from "../modules/blog/service"

export type DeleteBlogPostInput = { id: string }

const deleteBlogPostStep = createStep(
  "delete-blog-post-step",
  async (input: DeleteBlogPostInput, { container }) => {
    const blogService: BlogModuleService = container.resolve(BLOG_MODULE)
    await blogService.deleteBlogPosts(input.id)
    return new StepResponse({ id: input.id })
  }
)

export const deleteBlogPostWorkflow = createWorkflow(
  "delete-blog-post",
  function (input: DeleteBlogPostInput) {
    const result = deleteBlogPostStep(input)
    return new WorkflowResponse(result)
  }
)
