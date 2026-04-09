import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { XMarkMini, Tag } from "@medusajs/icons"
import { Badge, Button, Container, Input, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type OrderTag = { id: string; value: string; order_id: string }

const OrderTagsWidget = ({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const queryClient = useQueryClient()
  const [input, setInput] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["order-tags", order.id],
    queryFn: () =>
      sdk.client.fetch<{ tags: OrderTag[] }>(`/admin/orders/${order.id}/tags`),
  })

  const addMutation = useMutation({
    mutationFn: (value: string) =>
      sdk.client.fetch(`/admin/orders/${order.id}/tags`, {
        method: "POST",
        body: { value },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-tags", order.id] })
      setInput("")
      toast.success("Tag added")
    },
    onError: () => toast.error("Failed to add tag"),
  })

  const removeMutation = useMutation({
    mutationFn: (tagId: string) =>
      sdk.client.fetch(`/admin/orders/${order.id}/tags/${tagId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-tags", order.id] })
      toast.success("Tag removed")
    },
    onError: () => toast.error("Failed to remove tag"),
  })

  const handleAdd = () => {
    const value = input.trim()
    if (!value) return
    addMutation.mutate(value)
  }

  return (
    <Container className="flex flex-col gap-y-4 px-6 py-4">
      <div className="flex items-center gap-x-2">
        <Tag className="text-ui-fg-subtle" />
        <Text size="small" weight="plus" leading="compact">
          Tags
        </Text>
      </div>

      {isLoading ? (
        <Text size="small" className="text-ui-fg-subtle">Loading...</Text>
      ) : (
        <div className="flex flex-wrap gap-2">
          {data?.tags?.length === 0 && (
            <Text size="small" className="text-ui-fg-subtle">No tags yet</Text>
          )}
          {data?.tags?.map((tag) => (
            <Badge key={tag.id} size="2xsmall" className="flex items-center gap-x-1 pr-1">
              {tag.value}
              <button
                onClick={() => removeMutation.mutate(tag.id)}
                disabled={removeMutation.isPending}
                className="ml-1 text-ui-fg-subtle hover:text-ui-fg-base"
              >
                <XMarkMini />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-x-2">
        <Input
          placeholder="Add tag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm"
        />
        <Button
          size="small"
          variant="secondary"
          onClick={handleAdd}
          isLoading={addMutation.isPending}
          disabled={!input.trim() || addMutation.isPending}
        >
          Add
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderTagsWidget
