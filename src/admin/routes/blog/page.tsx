import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import {
  Container,
  Heading,
  Button,
  Text,
  Badge,
  FocusModal,
  Input,
  Label,
  Select,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo, useEffect } from "react"
import {
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui"
import { sdk } from "../../lib/sdk"
import TiptapEditor from "../../components/TiptapEditor"
import { CoverImagePicker } from "../../components/CoverImagePicker"

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  status: "draft" | "published"
  author: string | null
  published_at: string | null
  created_at: string
}

type BlogPostsResponse = {
  blog_posts: BlogPost[]
  count: number
  limit: number
  offset: number
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  author: "",
  status: "draft" as "draft" | "published",
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

// ─── Create Modal ─────────────────────────────────────────────────────────────

const CreateBlogPostModal = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugManual, setSlugManual] = useState(false)

  const set = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "title" && !slugManual) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      sdk.client.fetch("/admin/blog", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      toast.success("Blog post created")
      setForm(EMPTY_FORM)
      setSlugManual(false)
      onClose()
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create post"),
  })

  return (
    <FocusModal open={open} onOpenChange={(v) => !v && onClose()}>
      <FocusModal.Content>
        <div className="flex h-full flex-col overflow-hidden">
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                onClick={() => mutation.mutate(form)}
                isLoading={mutation.isPending}
                disabled={!form.title}
              >
                {form.status === "published" ? "Publish" : "Save Draft"}
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex-1 overflow-auto">
            <div className="flex h-full gap-0">
              {/* Main editor area */}
              <div className="flex flex-1 flex-col gap-y-6 p-8">
                <div className="flex flex-col gap-y-1">
                  <input
                    placeholder="Post title..."
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--ui-fg-base)",
                      width: "100%",
                    }}
                  />
                </div>
                <TiptapEditor
                  content={form.content || ""}
                  onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                />
              </div>

              {/* Sidebar */}
              <div
                style={{ width: "280px", borderLeft: "1px solid var(--ui-border-base)" }}
                className="flex flex-col gap-y-5 p-6"
              >
                <div className="flex flex-col gap-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set("status", v)}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">Draft</Select.Item>
                      <Select.Item value="published">Published</Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManual(true)
                      set("slug", e.target.value)
                    }}
                    placeholder="auto-generated"
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Author</Label>
                  <Input
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                    placeholder="Author name"
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={form.excerpt}
                    onChange={(e) => set("excerpt", e.target.value)}
                    placeholder="Short description..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Cover Image</Label>
                  <CoverImagePicker
                    value={form.cover_image || ""}
                    onChange={(url) => set("cover_image", url)}
                  />
                </div>
              </div>
            </div>
          </FocusModal.Body>
        </div>
      </FocusModal.Content>
    </FocusModal>
  )
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

const EditBlogPostModal = ({
  post,
  onClose,
}: {
  post: BlogPost | null
  onClose: () => void
}) => {
  const queryClient = useQueryClient()

  const { data: fullPost, isLoading: loadingPost } = useQuery<{ blog_post: BlogPost }>({
    queryFn: () => sdk.client.fetch(`/admin/blog/${post!.id}`),
    queryKey: ["blog-post", post?.id],
    enabled: !!post?.id,
  })

  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)

  useEffect(() => {
    if (fullPost?.blog_post) {
      const p = fullPost.blog_post
      setForm({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || "",
        content: p.content || "",
        cover_image: p.cover_image || "",
        author: p.author || "",
        status: p.status,
      })
    }
  }, [fullPost])

  const set = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((p) => ({ ...p, [key]: value }))

  const mutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      sdk.client.fetch(`/admin/blog/${post!.id}`, { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      queryClient.invalidateQueries({ queryKey: ["blog-post", post?.id] })
      toast.success("Blog post updated")
      onClose()
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update post"),
  })

  if (!post) return null

  return (
    <FocusModal open={!!post} onOpenChange={(v) => !v && onClose()}>
      <FocusModal.Content>
        <div className="flex h-full flex-col overflow-hidden">
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                onClick={() => mutation.mutate(form)}
                isLoading={mutation.isPending}
              >
                {form.status === "published" ? "Save & Publish" : "Save Draft"}
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex-1 overflow-auto">
            {loadingPost ? (
              <div className="flex h-full items-center justify-center">
                <div style={{ width: 28, height: 28, border: "3px solid var(--ui-border-base)", borderTopColor: "var(--ui-fg-interactive)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : (
            <div className="flex h-full gap-0">
              <div className="flex flex-1 flex-col gap-y-6 p-8">
                <input
                  placeholder="Post title..."
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--ui-fg-base)",
                    width: "100%",
                  }}
                />
                <TiptapEditor
                  key={fullPost?.blog_post?.id}
                  content={form.content || ""}
                  onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                />
              </div>

              <div
                style={{ width: "280px", borderLeft: "1px solid var(--ui-border-base)" }}
                className="flex flex-col gap-y-5 p-6"
              >
                <div className="flex flex-col gap-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">Draft</Select.Item>
                      <Select.Item value="published">Published</Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Author</Label>
                  <Input
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={form.excerpt}
                    onChange={(e) => set("excerpt", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Cover Image</Label>
                  <CoverImagePicker
                    value={form.cover_image || ""}
                    onChange={(url) => set("cover_image", url)}
                  />
                </div>
              </div>
            </div>
            )}
          </FocusModal.Body>
        </div>
      </FocusModal.Content>
    </FocusModal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const columnHelper = createDataTableColumnHelper<BlogPost>()

const BlogPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const queryClient = useQueryClient()

  const limit = pagination.pageSize
  const offset = useMemo(() => pagination.pageIndex * limit, [pagination])

  const { data, isLoading } = useQuery<BlogPostsResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/blog", { query: { limit, offset } }),
    queryKey: ["blog-posts", limit, offset],
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/blog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
      toast.success("Post deleted")
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete"),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Title",
        cell: ({ getValue }) => (
          <Text size="small" weight="plus">
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <Badge color={status === "published" ? "green" : "grey"} size="2xsmall">
              {status}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("author", {
        header: "Author",
        cell: ({ getValue }) => (
          <Text size="small" className="text-ui-fg-subtle">
            {getValue() || "—"}
          </Text>
        ),
      }),
      columnHelper.accessor("published_at", {
        header: "Published",
        cell: ({ getValue }) => {
          const v = getValue()
          return (
            <Text size="small" className="text-ui-fg-subtle">
              {v ? new Date(v).toLocaleDateString() : "—"}
            </Text>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: ({ getValue }) => (
          <Text size="small" className="text-ui-fg-subtle">
            {new Date(getValue()).toLocaleDateString()}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-x-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setEditPost(row.original)}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="danger"
              onClick={() => {
                if (window.confirm("Delete this post?")) {
                  deleteMutation.mutate(row.original.id)
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ],
    [deleteMutation]
  )

  const table = useDataTable({
    columns,
    data: data?.blog_posts || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading>Blog Posts</Heading>
          <Button size="small" onClick={() => setCreateOpen(true)}>
            New Post
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <CreateBlogPostModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditBlogPostModal key={editPost?.id} post={editPost} onClose={() => setEditPost(null)} />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
  icon: DocumentText,
})

export default BlogPage
