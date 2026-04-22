import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { updateBlogPostWorkflow } from "../../../../workflows/update-blog-post"
import { deleteBlogPostWorkflow } from "../../../../workflows/delete-blog-post"
import { PostAdminUpdateBlogPost } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data } = await query.graph({
    entity: "blog_post",
    fields: ["id", "title", "slug", "excerpt", "content", "cover_image", "status", "author", "published_at", "created_at", "updated_at"],
    filters: { id },
  })

  if (!data?.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Blog post not found")
  }

  res.json({ blog_post: data[0] })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminUpdateBlogPost>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await updateBlogPostWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  res.json({ blog_post: result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteBlogPostWorkflow(req.scope).run({ input: { id } })

  res.json({ id, deleted: true })
}
