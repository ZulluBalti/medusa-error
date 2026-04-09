import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, Text, toast } from "@medusajs/ui"
import { Photo, Trash } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { sdk } from "../lib/sdk"

type CategoryImage = {
  id: string
  url: string
  file_id: string
  category_id: string
}

const CategoryImagesWidget = ({
  data,
}: DetailWidgetProps<HttpTypes.AdminProductCategory>) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const queryKey = ["category-images", data.id]

  const { data: imagesData, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      sdk.client.fetch<{ images: CategoryImage[] }>(
        `/admin/product-categories/${data.id}/images`
      ),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { files } = await sdk.admin.upload.create({ files: [file] })

      const uploaded = files[0]

      return sdk.client.fetch(`/admin/product-categories/${data.id}/images`, {
        method: "POST",
        body: { url: uploaded.url, file_id: uploaded.id },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Image uploaded")
    },
    onError: () => {
      toast.error("Failed to upload image")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      sdk.client.fetch(
        `/admin/product-categories/${data.id}/images/${imageId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Image deleted")
    },
    onError: () => {
      toast.error("Failed to delete image")
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
    e.target.value = ""
  }

  const images = imagesData?.images ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Images
        </Text>
        <Button
          size="small"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          isLoading={uploadMutation.isPending}
          disabled={uploadMutation.isPending}
        >
          <Photo />
          Upload Image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ui-border-base border-t-ui-fg-base" />
          </div>
        ) : images.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No images yet. Click "Upload Image" to add one.
          </Text>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-ui-border-base"
              >
                <img
                  src={image.url}
                  alt="Category image"
                  className="h-32 w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => deleteMutation.mutate(image.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryImagesWidget
