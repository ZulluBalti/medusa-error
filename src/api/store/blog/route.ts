import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const { data: blog_posts, metadata } = await query.graph({
    entity: "blog_post",
    fields: ["id", "title", "slug", "excerpt", "cover_image", "author", "published_at", "created_at"],
    filters: { status: "published" },
    pagination: {
      take: Number(req.query.limit) || 10,
      skip: Number(req.query.offset) || 0,
      order: { published_at: "DESC" },
    },
  })

  res.json({ blog_posts, count: metadata?.count })
}
