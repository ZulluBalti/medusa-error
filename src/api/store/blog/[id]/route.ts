import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id: slug } = req.params

  const posts = await blogService.listBlogPosts(
    { slug, status: "published" },
    { select: ["id", "title", "slug", "excerpt", "content", "cover_image", "author", "published_at", "created_at"] }
  )

  if (!posts?.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Blog post not found")
  }

  res.json({ blog_post: posts[0] })
}
