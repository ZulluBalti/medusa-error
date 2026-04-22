import { model } from "@medusajs/framework/utils"

const BlogPost = model.define("blog_post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text(),
  excerpt: model.text().nullable(),
  content: model.text().nullable(),
  cover_image: model.text().nullable(),
  status: model.text(), // "draft" | "published"
  author: model.text().nullable(),
  published_at: model.dateTime().nullable(),
})

export default BlogPost
