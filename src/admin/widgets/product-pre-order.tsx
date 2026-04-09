import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Container, Switch, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

const ProductPreOrderWidget = ({ data: product }: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["pre-order", product.id],
    queryFn: () =>
      sdk.client.fetch<{ enabled: boolean }>(`/admin/products/${product.id}/pre-order`),
  })

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      sdk.client.fetch(`/admin/products/${product.id}/pre-order`, {
        method: "POST",
        body: { enabled },
      }),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["pre-order", product.id] })
      toast.success(enabled ? "Pre-order enabled" : "Pre-order disabled")
    },
    onError: () => toast.error("Failed to update pre-order setting"),
  })

  const enabled = data?.enabled ?? false

  return (
    <Container className="flex items-center justify-between px-6 py-4">
      <div className="flex flex-col gap-y-0.5">
        <Text size="small" weight="plus" leading="compact">
          Pre-order
        </Text>
        <Text size="small" className="text-ui-fg-subtle" leading="compact">
          {enabled
            ? "Customers can order this product even when out of stock"
            : "Orders are blocked when this product is out of stock"}
        </Text>
      </div>
      <Switch
        checked={enabled}
        disabled={isLoading || mutation.isPending}
        onCheckedChange={(checked) => mutation.mutate(checked)}
      />
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductPreOrderWidget
