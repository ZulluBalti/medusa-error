import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBlogPostWorkflow } from "../../../workflows/create-blog-post"
import { PostAdminCreateBlogPost } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: blog_posts, metadata } = await query.graph({
    entity: "blog_post",
    ...req.queryConfig,
  })

  res.json({
    blog_posts,
    count: metadata?.count,
    limit: metadata?.take,
    offset: metadata?.skip,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminCreateBlogPost>,
  res: MedusaResponse
) => {
  const { result } = await createBlogPostWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ blog_post: result })
}
